import { create } from 'zustand';
import { User, UserRole } from '../types';
import pool from '../config/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    branch?: string;
  }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  
  login: async (username: string, password: string) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, name, role, branch FROM users WHERE username = ? AND password = SHA2(?, 256) AND active = 1',
        [username, password]
      );

      const users = rows as any[];
      if (users.length > 0) {
        const user = users[0];
        set({ 
          user: user,
          isAuthenticated: true,
          role: user.role as UserRole
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  
  register: async (data) => {
    try {
      // Check if username already exists
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ?',
        [data.username]
      );

      if ((existing as any[]).length > 0) {
        return false;
      }

      // Insert new user with hashed password
      await pool.execute(
        `INSERT INTO users (id, username, password, name, role, branch, active) 
         VALUES (UUID(), ?, SHA2(?, 256), ?, ?, ?, 1)`,
        [data.username, data.password, data.name, data.role, data.branch || null]
      );

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false, role: null });
  }
}));