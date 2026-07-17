import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// ADMIN-only guard. Falls back to /today for authenticated non-admins and /login otherwise.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/today']);
};
