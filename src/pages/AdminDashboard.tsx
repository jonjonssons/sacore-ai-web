
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  HelpCircle,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  BarChart4,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import authService from '@/services/authService';
import { Badge } from '@/components/ui/badge';

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        bg-white dark:bg-gray-800 w-64 overflow-y-auto transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="text-xl font-bold bg-black text-transparent bg-clip-text flex items-center gap-2">
            <span>SACORE AI</span>
            <Badge className="text-xs">Admin</Badge>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <Link to="/admin/dashboard" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}>
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link to="/admin/users" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <Users className="mr-3 h-5 w-5" />
              Users
            </Link>
            <a href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Undo2 className="mr-3 h-5 w-5" />
              Back to Sacore AI
            </a>
          </div>
          <div className="pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
            <div className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Support
            </div>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <HelpCircle className="mr-3 h-5 w-5" />
              Help Center
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Log out
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
                  aria-label="Open Sidebar"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {/* <div className="hidden lg:flex lg:items-center">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
                </div> */}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-9 h-9 w-48 lg:w-64" />
                </div>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium">JS</span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
