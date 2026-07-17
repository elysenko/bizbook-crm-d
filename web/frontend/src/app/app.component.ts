import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // data-testid="app-ready" is the universal readiness landmark: it enters the DOM only
  // after Angular bootstraps this root component, so the render gate can wait on it to
  // confirm the SPA hydrated (not a blank shell / 404 / failed bundle). Keep it here.
  template: '<div data-testid="app-ready"><router-outlet /></div>'
})
export class AppComponent {}
