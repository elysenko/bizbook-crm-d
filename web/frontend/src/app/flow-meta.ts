import { Route } from '@angular/router';

// Shape of the `data.flow` node consumed by the colossus flow-graph extractor and the
// runtime navbar. See docs/flow-graph-convention.md. Kept intentionally permissive.
export interface FlowNode {
  flowId: string;
  node: string;
  label?: string;
  entry?: boolean;
  showInNavbar?: boolean;
  scope?: 'all' | 'admin' | 'user';
  edgesTo?: string[];
}

export type FlowRoute = Route & {
  data?: Route['data'] & { flow?: FlowNode };
  children?: FlowRoute[];
};
