import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  PackageOpen, 
  PackagePlus, 
  ShoppingCart, 
  Printer, 
  BarChart2, 
  ClipboardList,
  Upload,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { role } = useAuthStore();
  
  // Navigation links based on user role
  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['store', 'manager', 'admin'] },
    { name: 'Input Product', icon: PackagePlus, href: '/input-product', roles: ['store', 'admin'] },
    { name: 'Refill Stock', icon: ShoppingCart, href: '/refill', roles: ['store', 'admin'] },
    { name: 'Print Sheets', icon: Printer, href: '/print-sheets', roles: ['store', 'admin'] },
    { name: 'Box Management', icon: PackageOpen, href: '/box-management', roles: ['store', 'manager', 'admin'] },
    { name: 'Analytics', icon: BarChart2, href: '/analytics', roles: ['store', 'manager', 'admin'] },
    { name: 'Activity Logs', icon: ClipboardList, href: '/activity-logs', roles: ['store', 'manager', 'admin'] },
    { name: 'Upload CSV', icon: Upload, href: '/upload-csv', roles: ['admin'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
  ];
  
  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition ease-in-out duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:inset-auto md:h-screen`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <PackageOpen className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">KeepStock</span>
          </div>
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => 
                `${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150`
              }
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;