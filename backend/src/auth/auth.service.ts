import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { SignupUserDto } from './dto/signup-user.dto';
import { toApiUser } from 'src/common/serializers';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<any> {
    this.logger.log(`POST: user/register: Register user started`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();

    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const { passwordconf, ...newUserData } = dto;
      newUserData.password = hashedPassword;

      const newuser = await this.prisma.user.create({
        data: newUserData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        user: newuser,
        token: this.getJwtToken({
          id: newuser.id,
        }),
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`POST: auth/register: User already exists: ${dto.email}`);
        throw new BadRequestException('User already exists');
      }
      this.logger.error(`POST: auth/register: error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async loginUser(email: string, password: string): Promise<any> {
    this.logger.log(`POST: auth/login: Login iniciado: ${email}`);
    let user;
    try {
      user = await this.prisma.user.findUniqueOrThrow({
        where: {
          email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new BadRequestException('Wrong credentials');
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Wrong credentials');
    }

    delete user.password;

    this.logger.log(`POST: auth/login: Usuario aceptado: ${user.email}`);
    return {
      user: toApiUser(user),
      token: this.getJwtToken({
        id: user.id,
      }),
    };
  }

  /**
   * Public signup for BizBook Pro. The very first account created in an empty system becomes
   * ADMIN; every subsequent signup is a regular USER. Returns the API-shaped user (uppercase
   * role) plus an access token so the frontend can persist the session immediately.
   */
  async signupUser(dto: SignupUserDto): Promise<{ user: ReturnType<typeof toApiUser>; token: string }> {
    this.logger.log(`POST: auth/signup: Signup started: ${dto.email}`);

    const email = dto.email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const userCount = await this.prisma.user.count();
      const role = userCount === 0 ? 'admin' : 'user';

      const newUser = await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        user: toApiUser(newUser),
        token: this.getJwtToken({ id: newUser.id }),
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`POST: auth/signup: User already exists: ${email}`);
        throw new BadRequestException('User already exists');
      }
      this.logger.error(`POST: auth/signup: error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  /**
   * Return the currently authenticated user (as resolved by JwtStrategy) in API shape.
   */
  async getMe(user: User) {
    return toApiUser(user as any);
  }

  async refreshToken(user: User) {
    return {
      user: user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
