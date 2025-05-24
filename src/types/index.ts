export type UserRole = 'store' | 'manager' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  branch?: string;
}

export interface Product {
  sku: string;
  name: string;
  price: number;
  rackNumber: string;
  branch: string;
  stockNew: number;
}

export interface Box {
  id: string;
  category: 'A' | 'B' | 'C';
  number: string;
  branch: string;
  items: BoxItem[];
}

export interface BoxItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  branch: string;
  action: 'input' | 'refill' | 'update' | 'login' | 'logout' | 'csv_upload';
  details: string;
  sku?: string;
  boxId?: string;
  category?: 'A' | 'B' | 'C';
}

export interface DashboardStats {
  totalSKUs: number;
  boxesA: number;
  boxesB: number;
  boxesC: number;
  skuPerCategory: {
    A: number;
    B: number;
    C: number;
  };
  recentActivities: ActivityLog[];
}