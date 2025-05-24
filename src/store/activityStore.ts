import { create } from 'zustand';
import { ActivityLog } from '../types';

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getLogs: (filters?: Partial<ActivityLog>) => ActivityLog[];
  getLogsByDateRange: (startDate: string, endDate: string, branch?: string) => ActivityLog[];
}

// Mock initial logs
const initialLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    username: 'store1',
    branch: 'Branch 1',
    action: 'input',
    details: 'Added 25 units of SKU001 to box A001',
    sku: 'SKU001',
    boxId: 'A001-B1',
    category: 'A'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    username: 'store1',
    branch: 'Branch 1',
    action: 'refill',
    details: 'Removed 5 units of SKU003 from box B001',
    sku: 'SKU003',
    boxId: 'B001-B1',
    category: 'B'
  }
];

export const useActivityStore = create<ActivityState>((set, get) => ({
  logs: initialLogs,
  
  addLog: (logData) => {
    const newLog: ActivityLog = {
      ...logData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    set(state => ({
      logs: [newLog, ...state.logs]
    }));
  },
  
  getLogs: (filters = {}) => {
    const { logs } = get();
    
    if (Object.keys(filters).length === 0) {
      return logs;
    }
    
    return logs.filter(log => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        return log[key as keyof ActivityLog] === value;
      });
    });
  },
  
  getLogsByDateRange: (startDate, endDate, branch) => {
    const { logs } = get();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      const branchMatch = branch ? log.branch === branch : true;
      return logTime >= start && logTime <= end && branchMatch;
    });
  }
}));