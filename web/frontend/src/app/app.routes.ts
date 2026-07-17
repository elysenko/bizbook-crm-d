import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// The colossus flow-graph extractor projects it directly (zero heuristics). Authoring rules
// + lint: docs/flow-graph-convention.md + platform/flowgraph-static/verify/flow-lint.mjs.
//
// DEEP-LINKABLE STATE — every navigable UI state a user could leave feedback on must be
// reachable by URL. Modals/filters here are bound to `?modal=`, `?status=`, `?date=` query
// params and restored on init, so each is directly loadable.
export const routes: Routes = ([
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['today'], label: 'Login' } },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/signup/signup.component').then((m) => m.SignupComponent),
    data: { flow: { flowId: 'signup', node: 'signup', entry: true, edgesTo: ['today'], label: 'Sign up' } },
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'today',
        loadComponent: () =>
          import('./features/today/today.component').then((m) => m.TodayComponent),
        data: { flow: { flowId: 'today', node: 'today', showInNavbar: true, label: 'Today', scope: 'all' } },
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/appointments.component').then((m) => m.AppointmentsComponent),
        data: { flow: { flowId: 'appointments', node: 'appointments', showInNavbar: true, label: 'Appointments', scope: 'all' } },
      },
      {
        path: 'clients',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/clients/clients.component').then((m) => m.ClientsComponent),
        data: { flow: { flowId: 'clients', node: 'clients', showInNavbar: true, label: 'Clients', scope: 'admin' } },
      },
      {
        path: 'services',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/services/services.component').then((m) => m.ServicesComponent),
        data: { flow: { flowId: 'services', node: 'services', showInNavbar: true, label: 'Services', scope: 'admin' } },
      },
      {
        path: 'revenue',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/revenue/revenue.component').then((m) => m.RevenueComponent),
        data: { flow: { flowId: 'revenue', node: 'revenue', showInNavbar: true, label: 'Revenue', scope: 'admin' } },
      },
      {
        path: 'admin/settings',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
        data: { flow: { flowId: 'admin-settings', node: 'admin-settings', showInNavbar: true, label: 'Settings', scope: 'admin' } },
      },
    ],
  },
  { path: '**', redirectTo: 'today' },
] satisfies FlowRoute[]) as Routes;
