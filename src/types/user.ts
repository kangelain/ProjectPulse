
export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  VIEWER = 'Viewer',
}

export interface User {
  id: string;
  username: string;
  email?: string; // Optional for demo purposes
  role: Role;
}
