
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  Mail,
  CreditCard,
  Clock,
  Undo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import authService from '@/services/authService';

// Define interfaces for the API response data
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Transaction {
  _id: string;
  user: User;
  amount: number;
  type: string;
  description: string;
  balance: number;
  createdAt: string;
  __v: number;
}

interface DashboardData {
  userStats: {
    total: number;
    new: number;
  };
  creditStats: {
    issued: number;
    used: number;
  };
  recentTransactions: Transaction[];
}

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully."
    });
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await authService.adminDashboard();
        setDashboardData(response);
        console.log('Dashboard data:', response);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        bg-white dark:bg-gray-800 w-64 overflow-y-auto transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="text-xl font-bold bg-black text-transparent bg-clip-text">
            SACORE AI Admin
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
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-primary">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Users className="mr-3 h-5 w-5" />
              Users
            </a>
            {/* <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MessageCircle className="mr-3 h-5 w-5" />
              Messages
              <Badge className="ml-auto bg-primary">5</Badge>
            </a> */}
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <BarChart4 className="mr-3 h-5 w-5" />
              Analytics
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </a>
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
                <div className="hidden lg:flex lg:items-center">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
                </div>
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
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-gray-500">Loading dashboard data...</p>
            </div>
          ) : dashboardData ? (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.userStats.total}</h3>
                      <p className="text-sm text-green-500 mt-1">+{dashboardData.userStats.new} new users</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Signups</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.userStats.new}</h3>
                      <p className="text-sm text-green-500 mt-1">Recent additions</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits Issued</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.creditStats.issued}</h3>
                      <p className="text-sm text-gray-500 mt-1">{dashboardData.creditStats.used} used</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits Used</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.creditStats.used}</h3>
                      <p className="text-sm text-gray-500 mt-1">{((dashboardData.creditStats.used / dashboardData.creditStats.issued) * 100).toFixed(1)}% utilization</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              {/* <div className="mb-6">
                <DashboardFilters />
              </div> */}

              {/* Recent transactions table */}
              <Card className="mb-6">
                <CardHeader className="pb-0">
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {dashboardData.recentTransactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.user.firstName} {transaction.user.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {transaction.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge className={
                                transaction.type === 'USAGE'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : transaction.type === 'PURCHASE'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              }>
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {transaction.balance}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Activity logs - Using the first few transactions as activity */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {dashboardData.recentTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction._id} className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.type} Transaction</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.description}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-red-500">Failed to load dashboard data</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
