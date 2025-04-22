export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER = 'USER'
}

// Staff permission types
export type StaffPermission = 
  | 'VIEW_ORDERS'
  | 'UPDATE_ORDER_STATUS'
  | 'VIEW_PRODUCTS'
  | 'UPDATE_PRODUCTS'
  | 'ADD_PRODUCTS'
  | 'VIEW_CUSTOMERS'
  | 'MANAGE_STOCK'
  | 'VIEW_STOCK_REPORTS';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  name?: string; // For combined first/last name display
  permissions?: StaffPermission[]; // For staff role permissions
} 