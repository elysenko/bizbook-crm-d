import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Public signup payload used by the BizBook Pro frontend (`POST /auth/signup`).
 * Unlike the template's RegisterUserDto, there is no password confirmation field and no
 * complexity regex — the frontend collects a single password. First signup becomes ADMIN.
 */
export class SignupUserDto {
  @ApiProperty({
    description: 'Full name',
    required: true,
    type: 'string',
    example: 'Alex Morgan',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Email',
    required: true,
    type: 'string',
    example: 'admin@bizbook.app',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (min 6 characters)',
    required: true,
    type: 'string',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
