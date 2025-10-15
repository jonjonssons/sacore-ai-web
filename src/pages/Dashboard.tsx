import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, MessageSquare, Settings, FileText, Bell,
  Search, HelpCircle, Inbox, CheckCircle, Phone, BarChart, FileBox,
  X, LogOut, User, ChevronDown, AlertTriangle, Plus, Minus, CheckCircle2,
  CreditCard, Menu, Star, KeyRound, InfoIcon, Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeftToLine,
  ArrowRightFromLine,
  Bookmark,
  LifeBuoy,
  CircleHelp,
  Sun,
  Moon,
  Send,
  CheckSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import ChangePassword from '@/pages/authentication/ChangePassword';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import LeadsPage from './LeadsPage';
import TasksPage from './TasksPage';
import SearchComponent from '@/components/dashboard/SearchComponent';
import RequirementsProfileComponent from '@/components/dashboard/RequirementsProfileComponent';
import { LeadTable } from '@/components/dashboard/LeadTable';
import UserProfile from '@/components/UserProfile';
import { api } from '@/services/api';
import authService, { CreditHistoryFilters } from '@/services/authService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SavedProfiles from './SavedProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import ProjectPage from './ProjectPage';
import CandidatesPage from './CandidatesPage';
import EnrichPage from './EnrichPage';
import SettingsPage from './SettingsPage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CampaignsPage from './CampaignsPage';
import UserProfilePage from './UserProfilePage';
import SearchResultsPage from './SearchResultsPage';
import { ThemeContext } from '@/contexts/ThemeContext';

// TaskCard Component
interface TaskCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  optional?: boolean;
  completed?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ icon, title, description, buttonText, optional = false, completed = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="bg-white bg-opacity-95 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-full text-white">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center text-gray-800">
                {title}
                {optional && (
                  <Badge className="ml-3 bg-gray-100 text-gray-600 text-xs px-2 py-0.5">Optional</Badge>
                )}
              </CardTitle>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {isExpanded && (
          <>
            <CardContent className="px-6 py-3 text-sm text-gray-600">
              {description}
            </CardContent>
            <CardFooter className="px-6 py-4 flex justify-between items-center border-t border-gray-100">
              <Button className="bg-black text-white rounded-xl px-4 py-2">
                {buttonText}
              </Button>
              {completed && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Completed
                </Badge>
              )}
            </CardFooter>
          </>
        )}
      </Card>
    </motion.div>
  );
};

const AppHeader: React.FC<{ userData: any; isCollapsed: boolean; toggleSidebar: () => void; onLogoClick: () => void }> = ({ userData, isCollapsed, toggleSidebar, onLogoClick }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const { user } = useAuth();
  const { state } = useSidebar();


  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div
      className={`h-16 border-b ${isDarkMode ? 'bg-primary border-gray-700 text-white' : 'bg-white border-gray-200 text-black'} flex items-center justify-between px-4`}
      style={{ marginLeft: isCollapsed ? 80 : 240 }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          className={`font-bold text-2xl cursor-pointer hover:opacity-80 transition-opacity ${isDarkMode ? 'text-white' : 'bg-black text-transparent bg-clip-text'}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onLogoClick}
        >
          SACORE AI
        </motion.span>      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className={`h-6 w-12 rounded-full relative transition-colors duration-300 flex items-center px-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-300"}`}
          >
            <div
              className={`absolute transition-all duration-300 transform ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}
            >
              {isDarkMode ? (
                <Moon size={16} className="text-white" />
              ) : (
                <Sun size={16} className="text-yellow-500" />
              )}
            </div>
          </button>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-xl shadow-sm transition-colors duration-200 cursor-pointer 
      ${isDarkMode ? 'bg-gray-900 hover:bg-gray-700' : 'bg-white/80 hover:bg-gray-100 backdrop-blur-md'}`}
            >
              <Avatar className={`h-9 w-9 ring-2 ${isDarkMode ? 'ring-gray-500' : 'ring-black/20'}`}>
                <AvatarFallback>
                  {userData ? `${userData.firstName?.[0]}${userData.lastName?.[0]}` : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col justify-center">
                <p className={`text-sm font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {userData ? `${userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)} Plan` : ''}
                </p>
              </div>

              <ChevronDown className={`ml-auto h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={`w-64 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-200 
    ${isDarkMode
                ? 'bg-gray-900/90 border-gray-700 text-white'
                : 'bg-white/95 border-gray-200 text-black'}`}
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

            {[
              { icon: User, label: 'Profile', onClick: () => navigate('/profile') },
              { icon: KeyRound, label: 'Change Password', onClick: () => setShowChangePasswordDialog(true) },
              { icon: Settings, label: 'Settings', onClick: () => navigate('/settings') },
              {
                icon: CircleHelp,
                label: 'Support',
                onClick: () => {
                  const email = 'support@sacore.ai';
                  const subject = encodeURIComponent('Support Request');
                  const body = encodeURIComponent('Hello, I need assistance with...');
                  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`, '_blank');
                }
              },
              // { icon: Bell, label: 'Notifications' },
              { icon: CreditCard, label: 'Upgrade Plan', onClick: () => setShowPricingDialog(true) },
              // Add Admin Panel button only for admin users
              ...(userData && (userData.role === 'admin' || userData._id === '687f290cdbaa807b7a3940b9') ? [
                {
                  icon: Shield,
                  label: 'Admin Panel',
                  onClick: () => navigate('/admin/dashboard'),
                  className: 'text-blue-600 hover:bg-blue-100 focus:bg-blue-200'
                }
              ] : []),
              {
                icon: LogOut,
                label: 'Log out',
                onClick: handleLogout,
                className: 'text-red-600 hover:bg-red-100 focus:bg-red-200',
              },
            ].map((item) => (
              <DropdownMenuItem
                key={item.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium 
        ${isDarkMode
                    ? 'hover:bg-gray-800 hover:text-white focus:bg-gray-700 focus:text-white'
                    : 'hover:bg-gray-100 focus:bg-gray-200'} ${item.className || ''}`}
                onClick={item.onClick}
              >
                <item.icon className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>


        <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} userData={userData} />
        <ChangePasswordDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog} />
        <CreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} userData={userData} />
      </div>
    </div>
  );
};

// SidebarMenuItemComponent
interface SidebarMenuItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  active?: boolean;
  isNew?: boolean;
}

const SidebarMenuItemComponent: React.FC<SidebarMenuItemProps> = ({
  icon: Icon, label, badge, active = false, isNew = false
}) => {
  // Use the sidebar context
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { isDarkMode } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={active}
          tooltip={label}
          className={`flex items-center gap-2 py-2 px-2 rounded-lg ${active
            ? isDarkMode
              ? 'text-white/90 bg-gray-800'
              : 'text-white/90 bg-black'
            : isDarkMode
              ? 'text-white hover:bg-gray-700'
              : 'text-black hover:bg-white/15'
            } my-1 transition-all duration-200 font-medium`}
        >
          <motion.div
            animate={isCollapsed ? { scale: 1.2 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={`${isDarkMode ? 'text-white' : ''} h-4 w-4`} />
          </motion.div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className={`${isDarkMode ? 'text-white' : 'text-black'} font-medium`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </SidebarMenuButton>

        {badge && (
          <motion.div
            animate={isCollapsed ? { scale: 0.8, top: '50%', right: '50%', x: '50%', y: '-50%' } : {}}
            transition={{ duration: 0.3 }}
          >
            <Badge className={`${isDarkMode ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-black-700 border-white'
              } font-bold ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
              {badge}
            </Badge>
          </motion.div>
        )}

        {isNew && (
          <motion.div
            animate={isCollapsed ? { scale: 0.8, top: '0%', right: '0%' } : {}}
            transition={{ duration: 0.3 }}
          >
            <Badge className={`${isDarkMode ? 'bg-red-700 text-red-300 border-red-700' : 'bg-red-100 text-red-600 border-red-200'
              } font-bold ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
              New
            </Badge>
          </motion.div>
        )}
      </SidebarMenuItem>
    </motion.div>
  );
};

// PricingDialog Component
const PricingDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; userData: any; }> = ({ open, onOpenChange, userData }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<{ name: string; billingInterval: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null); // Track which plan is processing
  const [annual, setAnnual] = useState(true); // Add annual/monthly toggle
  const { isDarkMode } = useTheme();
  console.log("rr", open)
  useEffect(() => {
    const fetchPlans = async () => {
      if (!open) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.getStripePlans();
        console.log('Plans response:', response);

        // Handle both wrapped and unwrapped response structures
        const plansData = response.data?.plans || response.plans;
        const currentPlanData = response.data?.currentPlan || response.currentPlan;

        if (plansData) {
          setPlans(plansData);
        }
        if (currentPlanData) {
          setCurrentPlan(currentPlanData);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [open]);

  // Add this function to handle the checkout process
  const handleChoosePlan = async (planName: string) => {
    try {
      setProcessingPlan(planName); // Set which plan is being processed
      const billingInterval = annual ? 'yearly' : 'monthly';

      // Find the matching plan to get the plan id
      const matchingPlan = plans.find(p => p.id.toLowerCase() === planName.toLowerCase());
      const planId = matchingPlan?.id || planName;

      if (!planId) {
        setError('Plan information not available. Please try again.');
        return;
      }

      const response = await authService.stripeCheckout(planId, billingInterval);

      if (response && response.url) {
        // Redirect to Stripe checkout page
        window.location.href = response.url;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session. Please try again.');
    } finally {
      setProcessingPlan(null); // Reset processing state
    }
  };

  // Helper function to get plan details with annual/monthly pricing
  const getPlanDetails = (planName: string) => {
    const matchingPlan = plans.find(p => p.id.toLowerCase() === planName.toLowerCase());

    // Use the flags from the API response, but also check billing interval for current plan
    const isCurrent = matchingPlan?.isCurrentPlan &&
      currentPlan &&
      ((annual && currentPlan.billingInterval === 'yearly') ||
        (!annual && currentPlan.billingInterval === 'monthly'));
    const isUpgrade = matchingPlan?.isUpgrade || false;
    const isBillingChange = matchingPlan?.isBillingChange || false;

    console.log(`Plan: ${planName}, isCurrentPlan: ${isCurrent}, isUpgrade: ${isUpgrade}, isBillingChange: ${isBillingChange}`);

    // Define fallback credits and pricing if plan isn't returned by backend
    const defaultPlanData = {
      basic: {
        credits: 500,
        monthlyPrice: 99,
        annualPrice: 75,
        searchesPerMonth: 10,
        searchesPerDay: 5,
        projects: '5 Projects at the same time',
        campaigns: '5 Active Campaigns'
      },
      explorer: {
        credits: 1500,
        monthlyPrice: 200,
        annualPrice: 150,
        searchesPerMonth: 25,
        searchesPerDay: 7,
        projects: 'Unlimited Projects',
        campaigns: 'Unlimited Active Campaigns'
      },
      pro: {
        credits: 6500,
        monthlyPrice: 800,
        annualPrice: 600,
        searchesPerMonth: 50,
        searchesPerDay: 10,
        projects: 'Unlimited Projects',
        campaigns: 'Unlimited Active Campaigns'
      }
    };

    const planData = defaultPlanData[planName.toLowerCase()] || defaultPlanData.basic;
    const credits = matchingPlan?.credits || planData.credits;

    // Get priceId from the matching plan based on billing interval
    const priceId = matchingPlan
      ? (annual ? matchingPlan.yearly.priceId : matchingPlan.monthly.priceId)
      : '';

    // Use fallback pricing if no matching plan from API
    const currentPrice = annual ? planData.annualPrice : planData.monthlyPrice;

    let features = [
      `${credits} Credits Per Month`,
      `${planData.searchesPerMonth} searches per month`,
      `${planData.searchesPerDay} searches per day`,
      planData.projects,
      planData.campaigns,
      annual ? 'Credits rollover' : 'Credits rollover (max 1 month extra)',
    ];

    // Add Dedicated Account Manager for Pro plan with annual billing
    if (planName.toLowerCase() === 'pro' && annual) {
      features.push('Dedicated Account Manager');
    }

    return {
      key: planName.toUpperCase(),
      title: planName.charAt(0).toUpperCase() + planName.slice(1),
      price: `$${currentPrice}`,
      description: annual ? 'Perfect for growing teams' : 'Ideal for monthly usage',
      features,
      priceId,
      isCurrent,
      isUpgrade,
      isBillingChange,
      isAvailable: !!matchingPlan, // from backend
      monthlyPrice: planData.monthlyPrice,
      annualPrice: planData.annualPrice,
    };
  };


  // Define plan types to display
  const planTypes = ['basic', 'explorer', 'pro'];
  // Calculate days remaining in trial
  const calculateTrialDaysRemaining = () => {
    if (!userData || !userData.trialStartDate) return 0;

    const trialStartDate = new Date(userData.trialStartDate);
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // Assuming 7-days trial

    const currentDate = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, daysRemaining);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-5xl max-h-[90vh] overflow-y-auto p-8 backdrop-blur-md rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-[#1a1a1a]/90 border-gray-700' : 'bg-white/100 border-gray-300'
          }`}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Pricing Plans</DialogTitle>
          {userData && !userData.trialEnded && (
            <div className="flex items-center mb-6">
              <AlertTriangle className="text-yellow-500 h-4 w-6" />
              <span className={`text-base font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                Your free trial ends in {calculateTrialDaysRemaining()} days
              </span>
            </div>
          )}

          {/* Pricing Toggle */}
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose the perfect plan for your needs
            </h2>
            <div className="flex items-center justify-center space-x-3">
              <span className={annual ? (isDarkMode ? 'text-gray-400' : 'text-gray-500') : (isDarkMode ? 'text-white font-medium' : 'text-black font-medium')}>Monthly</span>
              <Switch
                checked={annual}
                onCheckedChange={setAnnual}
                className={`${isDarkMode ? 'data-[state=checked]:bg-white' : 'data-[state=checked]:bg-black'}`}
              />
              <span className={!annual ? (isDarkMode ? 'text-gray-400' : 'text-gray-500') : (isDarkMode ? 'text-white font-medium' : 'text-black font-medium')}>
                Annual <span className="ml-1 text-sm text-gray-500">~25% saved</span>
              </span>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <div
              className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'
                }`}
            ></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading pricing plans...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto text-red-500 h-8 w-8" />
            <p className={`mt-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4 bg-black text-white"
            >
              Close
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto text-yellow-500 h-8 w-8" />
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No pricing plans available.</p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4 bg-black text-white"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {planTypes.map((planType, index) => {
              const plan = getPlanDetails(planType);
              if (!plan) return null;

              const isPro = planType.toLowerCase() === 'pro';
              const isProcessing = processingPlan === planType; // Check if this specific plan is processing

              return (
                <motion.div
                  key={plan.key}
                  className={`relative rounded-2xl p-6 shadow-md transition-transform duration-300 hover:shadow-xl border ${isDarkMode
                    ? 'bg-[#2a2a2a] border-gray-700'
                    : 'bg-white border-gray-200'
                    } ${isPro ? 'scale-105 border-2 border-black z-10' : ''} ${plan.isCurrent ? 'border-green-500 border-2' : ''
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {isPro && (
                    <Badge className="absolute -top-3 right-4 bg-black text-white text-xs px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </Badge>
                  )}
                  {plan.isCurrent && (
                    <Badge className="absolute -top-3 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-md">
                      Current Plan
                    </Badge>
                  )}
                  <h3
                    className={`text-2xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                  >{plan.title}</h3>
                  <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{plan.description}</p>
                  <div className="mb-6 flex items-end space-x-1">
                    <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {plan.price}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      / user / month</span>
                  </div>
                  <Button
                    className={`w-full mb-6 rounded-xl py-2 ${plan.isCurrent
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : plan.isAvailable
                        ? 'bg-black text-white hover:scale-105'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    data-price-id={plan.priceId}
                    disabled={plan.isCurrent || !plan.isAvailable || processingPlan !== null} // Disable all buttons when any plan is processing
                    onClick={() => handleChoosePlan(planType)}
                  >
                    {isProcessing ? (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {plan.isCurrent
                      ? 'Current Plan'
                      : plan.isUpgrade
                        ? 'Upgrade Plan'
                        : plan.isBillingChange
                          ? 'Change Billing'
                          : plan.isAvailable
                            ? 'Choose Plan'
                            : 'Unavailable'}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ChangePasswordDialog Component
const ChangePasswordDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white border border-gray-300 shadow-2xl rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="h-full w-full">
          {open && <ChangePassword isDialog={true} onClose={() => onOpenChange(false)} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// CreditsDialog Component
const CreditsDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; userData: any; }> = ({
  open,
  onOpenChange,
  userData
}) => {
  const [step, setStep] = useState<"summary" | "purchase" | "transactions" | "pricelist">("summary");
  const [selectedCredits, setSelectedCredits] = useState(500);
  const [packages, setPackages] = useState<any[]>([]);
  const [customPackage, setCustomPackage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [usageData, setUsageData] = useState<any>(null);
  const [filters, setFilters] = useState<CreditHistoryFilters>({
    startDate: '',
    endDate: '',
    type: undefined,
    limit: 50
  });
  const { isDarkMode } = useTheme();
  const maxCredits = 30000;

  useEffect(() => {
    const fetchCreditBalance = async () => {
      const response = await authService.getCreditBalance();
      if (response) {
        setCreditBalance(response.credits);
        setUsageData(response.usage);
      }
    }

    fetchCreditBalance();
  }, [open])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!open || step !== "transactions") return;

      setIsLoading(true);
      setError(null);

      try {
        const filterParams: CreditHistoryFilters = {};
        if (filters.startDate) filterParams.startDate = filters.startDate;
        if (filters.endDate) filterParams.endDate = filters.endDate;
        if (filters.type) filterParams.type = filters.type;
        if (filters.limit) filterParams.limit = filters.limit;

        const response = await authService.getCreditTransactions(filterParams);
        if (response) {
          setTransactions(response.transactions || []);
        } else {
          setError('Failed to load transaction history. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [open, step, filters]);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch credit packages when dialog opens
  useEffect(() => {
    if (open) {
      fetchCreditPackages();
    }
  }, [open]);

  const fetchCreditPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/credits/packages');
      if (response && response.packages) {
        // Filter out custom package and set it separately
        const customPkg = response.packages.find(pkg => pkg.id === 'custom');
        const standardPackages = response.packages.filter(pkg => pkg.id !== 'custom');

        setPackages(standardPackages);
        setCustomPackage(customPkg);

        // Set initial selected credits to the first package amount
        if (standardPackages.length > 0) {
          setSelectedCredits(standardPackages[0].amount);
        }
      }
    } catch (err) {
      console.error('Error fetching credit packages:', err);
      setError('Failed to load credit packages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (credits: number) => {
    // If we have a custom package with pricePerCredit, use that for custom amounts
    if (customPackage && customPackage.pricePerCredit) {
      return (credits * customPackage.pricePerCredit).toFixed(2);
    }

    // Try to find a matching package
    const matchingPackage = packages.find(pkg => pkg.amount === credits);
    if (matchingPackage) {
      return matchingPackage.price.toFixed(2);
    }

    // Fallback to a default price per credit
    return (credits * 0.12).toFixed(2); // Using the custom price from API example
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setStep("summary"); // Reset to summary view before closing
    }
    onOpenChange(value);
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {step === "summary" ? (
        <DialogContent
          className={`max-w-sm p-0 h-[90vh] shadow-xl rounded-2xl 
          ${isDarkMode ? 'bg-[#1a1a1a] border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className={`p-6 h-full overflow-y-auto scrollbar-hide ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-black-100'} p-2 rounded-xl`}>
                <CreditCard className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-black-600'}`} />
              </div>
              <h2 className="text-xl font-bold">Your Credits</h2>
            </div>

            <div
              className={`rounded-2xl p-6 border mb-6 ${isDarkMode
                ? 'bg-[#1a1a1a] border-gray-700'
                : 'bg-black-50 border-black-100'
                }`}
            >
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {creditBalance}
                </div>
                <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  REMAINING CREDITS
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full ${isDarkMode ? 'bg-white' : 'bg-black-500'}`}
                    style={{ width: `${Math.min(100, (creditBalance / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>


            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly searches</span>
                <span className={`${isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}`}>
                  {usageData?.monthly ? `${usageData.monthly.used}/${usageData.monthly.limit}` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reset date</span>
                <span className={`${isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}`}>Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Extra searches</span>
                <span className={`${isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}`}>
                  {usageData?.monthly ? `${usageData.monthly.remaining} searches` : '0 searches'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className={`w-full ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900'}`}
                onClick={() => setStep("purchase")}
              >
                Buy More Credits
              </Button>
              <Button variant="outline" className={`w-full ${isDarkMode ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]' : 'bg-white text-black'}`}
                onClick={() => setStep("transactions")}>
                View Usage History
              </Button>
              <Button variant="outline" className={`w-full ${isDarkMode ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]' : 'bg-white text-black'}`}
                onClick={() => setStep("pricelist")}>
                Credit Usage Pricelist
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : step === "purchase" ? (
        <DialogContent
          className={`max-w-md h-[90vh] rounded-2xl p-0 shadow-xl ${isDarkMode ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white'
            }`}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className={`p-2 border-b ${isDarkMode ? 'border-gray-700' : ''}`}>
            <DialogTitle className="text-lg font-semibold">
              <div className="flex items-center gap-3 mb-2">
                <div className={isDarkMode ? "bg-gray-800 rounded-xl" : "bg-black-100 rounded-xl"}>
                  <CreditCard className={isDarkMode ? "h-5 w-5 text-white" : "h-5 w-5 text-black-600"} />
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Buy Credits</h2>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading credit packages...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto text-red-500 h-8 w-8" />
              <p className="mt-4 text-red-600">{error}</p>
              <Button
                onClick={() => setStep("summary")}
                className="mt-4 bg-black text-white"
              >
                Back
              </Button>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto scrollbar-hide">
              <div className="w-40 h-40 mx-auto mb-6">
                <CircularProgressbar
                  value={selectedCredits > 0 ? Math.min(100, (selectedCredits / maxCredits) * 100) : 0}
                  text={`${creditBalance}`}
                  styles={buildStyles({
                    textColor: isDarkMode ? "#fff" : "#111",
                    pathColor: isDarkMode ? "#fff" : "#111",
                    trailColor: isDarkMode ? "#2f2f2f" : "#e5e7eb",
                    textSize: "24px",
                    rotation: 1
                  })}
                />
                <p className={`text-center text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  REMAINING CREDITS
                </p>              </div>

              <div className="mb-4">
                <label htmlFor="credits-range" className="sr-only">Select Credit Amount</label>
                <input
                  id="credits-range"
                  type="range"
                  min={packages.length > 0 ? packages[0].amount : 100}
                  max={maxCredits}
                  value={selectedCredits}
                  onChange={(e) => setSelectedCredits(Number(e.target.value))}
                  className={`w-full ${isDarkMode ? 'accent-white' : 'accent-black'}`}
                />
                <div className={`flex justify-between mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span>{packages.length > 0 ? packages[0].amount : 100}</span>
                  <span>{maxCredits.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between gap-2 mb-4">
                {packages.map((pkg) => (
                  <Button
                    key={pkg.id}
                    variant="outline"
                    className={`flex-1 ${selectedCredits === pkg.amount
                      ? isDarkMode
                        ? 'border-white bg-gray-800 text-white'
                        : 'border-black bg-gray-100'
                      : ''
                      }`}
                    onClick={() => setSelectedCredits(pkg.amount)}
                  >
                    {pkg.amount.toLocaleString()}
                  </Button>
                ))}
                <label htmlFor="credits-input" className="sr-only">Enter Credit Amount</label>
                <input
                  id="credits-input"
                  type="number"
                  min={packages.length > 0 ? packages[0].amount : 100}
                  max={maxCredits}
                  value={selectedCredits}
                  onChange={(e) => setSelectedCredits(Number(e.target.value))}
                  className={`w-24 px-2 py-1 border rounded-lg text-sm ${isDarkMode
                    ? 'bg-[#1a1a1a] border-gray-700 text-white'
                    : 'border-gray-300'
                    }`}
                  aria-label="Credit amount"
                />
              </div>

              <div className="text-center mb-6">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>You will pay</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${calculatePrice(selectedCredits)}
                </p>
                {packages.find(pkg => pkg.amount === selectedCredits) ? (
                  <p className="text-xs text-green-600 mt-1">
                    {packages.find(pkg => pkg.amount === selectedCredits)?.description}
                  </p>
                ) : customPackage ? (
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {customPackage.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="bg-black text-white w-full"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      setError(null);

                      // Determine if we're using a predefined package or custom amount
                      const isStandardPackage = packages.some(pkg => pkg.amount === selectedCredits);
                      const payload = {
                        packageId: isStandardPackage ? packages.find(pkg => pkg.amount === selectedCredits)?.id : "custom",
                        customAmount: isStandardPackage ? null : selectedCredits
                      };

                      const response = await api.post('/credits/checkout', payload);

                      if (response && response.url) {
                        // Redirect to Stripe checkout page
                        window.location.href = response.url;
                      } else {
                        setError('Failed to create checkout session. Please try again.');
                      }
                    } catch (err) {
                      console.error('Error creating checkout session:', err);
                      setError('Failed to create checkout session. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Buy {selectedCredits.toLocaleString()} credits
                </Button>
                <Button
                  variant="outline"
                  className={`w-full ${isDarkMode ? 'border-gray-600 text-white' : ''}`}
                  onClick={() => setStep("summary")}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      ) : step === "pricelist" ? (
        <DialogContent
          className={`max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'
            }`}
        >
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>
              Credit Usage Pricelist</DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              See how many credits each action consumes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-[#2a2a2a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Search</span>
                  <Badge className={`${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                    50 Credits
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Deep Analysis (per profile)</span>
                  <Badge className={`${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                    1 Credit
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Get Email Address</span>
                  <Badge className={`${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                    3 Credits
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              onClick={() => setStep("summary")}
              className={`${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900'}`}
            >
              Back to Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent
          className={`max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'
            }`}
        >
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>
              Credit Transaction History</DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              View your recent credit usage and transactions
            </DialogDescription>
          </DialogHeader>

          {/* Filters Section */}
          <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-[#2a2a2a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate" className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className={`mt-1 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className={`mt-1 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <Label htmlFor="type" className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Type
                </Label>
                <Select value={filters.type || 'all'} onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value as any })}>
                  <SelectTrigger className={`mt-1 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? 'bg-[#1a1a1a] border-gray-600' : 'bg-white border-gray-300'}>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="USAGE">Usage</SelectItem>
                    <SelectItem value="TOPUP">Topup</SelectItem>
                    <SelectItem value="INITIAL">Initial</SelectItem>
                    <SelectItem value="MONTHLY_RESET">Monthly Reset</SelectItem>
                    <SelectItem value="PLAN_CHANGE">Plan Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="limit" className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Limit
                </Label>
                <Select value={filters.limit?.toString() || '50'} onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}>
                  <SelectTrigger className={`mt-1 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <SelectValue placeholder="50" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? 'bg-[#1a1a1a] border-gray-600' : 'bg-white border-gray-300'}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
            </div>
          ) : error ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button
                onClick={() => setStep("summary")}
                className="mt-4"
                variant="outline"
              >
                Back
              </Button>
            </div>
          ) : (
            <>
              {transactions.length === 0 ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : ''}`}>No transactions found</p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : ''}`}>
                    You haven't used any credits yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className={isDarkMode ? 'bg-gray-900 text-white' : ''}>
                      <TableRow>
                        <TableHead className="w-[180px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className={isDarkMode ? 'bg-[#1a1a1a] text-white' : ''}>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                transaction.type === 'USAGE'
                                  ? isDarkMode
                                    ? 'bg-red-900 text-red-300 border-red-700'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                  : ['INITIAL', 'TOPUP', 'MONTHLY_RESET'].includes(transaction.type)
                                    ? isDarkMode
                                      ? 'bg-green-900 text-green-300 border-green-700'
                                      : 'bg-green-100 text-green-800 border-green-200'
                                    : isDarkMode
                                      ? 'bg-blue-900 text-blue-300 border-blue-700'
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                              }
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                transaction.type === 'USAGE'
                                  ? isDarkMode ? 'text-red-400' : 'text-red-600'
                                  : ['INITIAL', 'TOPUP', 'MONTHLY_RESET'].includes(transaction.type)
                                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                    : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }
                            >
                              {transaction.type === 'USAGE' ? '' : '+'}{transaction.amount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.balance}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <DialogFooter className="mt-6">
                <Button onClick={() => setStep("summary")}>Back</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};


// Updated AppSidebar Component
const AppSidebar: React.FC<{ onHandleLogout: () => void; activePage: string; setActivePage: (page: string) => void; userData: any; isCollapsed: boolean; toggleSidebar: () => void; }> = ({
  onHandleLogout,
  activePage,
  setActivePage,
  userData, isCollapsed, toggleSidebar
}) => {
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { isDarkMode, toggleDarkMode } = useTheme();


  // const toggleSidebar = () => {
  //   setIsCollapsed((prev) => !prev);
  // };

  // write a useeffect hook here to get userProjects

  const [userProjects, setUserProjects] = useState([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [recentSearchesLoading, setRecentSearchesLoading] = useState(false);

  // write a useEffect hook here to get userProjects

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await authService.getUserProjects();
        console.log("projectsss", response);
        setUserProjects(response);
      }
      catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    fetchProjects();

    const fetchRecentSearches = async () => {
      try {
        setRecentSearchesLoading(true);
        const response = await authService.getRecentSearches();
        if (response.success && response.data?.searches) {
          setRecentSearches(response.data.searches);
        } else {
          setRecentSearches([]);
        }
      } catch (error) {
        console.error("Error fetching recent searches:", error);
        setRecentSearches([]);
      } finally {
        setRecentSearchesLoading(false);
      }
    };

    fetchRecentSearches();

    // Handler for project created event
    const handleProjectCreated = () => {
      console.log("Project created event received, refreshing projects list");
      fetchProjects();
    };

    // Handler for project deleted event
    const handleProjectDeleted = () => {
      console.log("Project deleted event received, refreshing projects list");
      fetchProjects();
    };

    // Register the event listeners
    window.addEventListener('projectCreated', handleProjectCreated);
    window.addEventListener('projectDeleted', handleProjectDeleted);

    // Clean up the event listeners when component unmounts
    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
      window.removeEventListener('projectDeleted', handleProjectDeleted);
    };
  }, [])

  const handleMenuClick = (page: string, path: string) => {
    // Continue with normal navigation
    setActivePage(page);

    // Always navigate using react-router's navigate to ensure proper routing
    navigate(path);
  };
  const handleLogout = async () => {
    try {
      // Show a loading state or indicator if needed

      // Call the logout API
      await authService.logout();

      // No need to handle redirect as authService.logout already does that

    } catch (error) {
      // Show an error toast if needed
      console.error('Logout error:', error);
    }
  };


  return (
    <motion.div
      className={`transition-all duration-100 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[240px]'} h-full shadow-lg`}
      animate={{
        width: isCollapsed ? 80 : 240,
        transition: { type: "spring", stiffness: 100 }
      }}
    >
      <Sidebar
        className={`${isCollapsed ? 'w-[80px]' : 'w-[240px]'} ${isDarkMode ? 'bg-primary text-white border-gray-700' : 'bg-black text-white border-black-800/40'} h-full border-r`}
        side="left"
        variant="sidebar"
        collapsible="icon"
      >
        <SidebarHeader className={`flex items-center h-14 px-3 justify-between ${isDarkMode ? 'bg-gray-950' : ''}`}>
          <div className="w-full flex justify-around items-center">
            {/* MENU text */}
            {!isCollapsed && (
              <motion.span
                className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'bg-black text-transparent bg-clip-text'}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                MENU
              </motion.span>
            )}

            {/* Toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className={`${isDarkMode ? 'text-white hover:bg-white/20' : 'text-black hover:bg-white/20'} active:scale-95 transition-all duration-200`}
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
            >
              {!isCollapsed ? (
                <ArrowLeftToLine className="h-5 w-5" />
              ) : (
                <ArrowRightFromLine className="h-5 w-5" />
              )}
            </Button>
          </div>

        </SidebarHeader>
        <SidebarContent className={`px-3 ${isDarkMode ? 'bg-primary' : ''}`}>

          <SidebarGroup>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* <SidebarGroupLabel className={`${isDarkMode ? 'text-white' : 'text-black'} font-bold`}>MENU</SidebarGroupLabel> */}
                </motion.div>
              )}
            </AnimatePresence>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* <div onClick={() => handleMenuClick('dashboard', '/dashboard')}>
                  <SidebarMenuItemComponent
                    icon={LayoutDashboard}
                    label="Dashboard"
                    active={activePage === 'dashboard'}
                  />
                </div> */}
                <div onClick={() => handleMenuClick('leads', '/')}>
                  <SidebarMenuItemComponent
                    icon={Search}
                    label="Search"
                    active={activePage === 'leads'}
                  />
                </div>
                <div onClick={() => handleMenuClick('enrich', '/enrich')}>
                  <SidebarMenuItemComponent
                    icon={({ className }: { className?: string }) => (
                      <span
                        className="text-base font-normal"
                        style={{
                          color: isDarkMode ? 'white !important' : 'black !important',
                          filter: isDarkMode ? 'grayscale(1) brightness(1)' : 'grayscale(1) brightness(0)'
                        }}
                      >
                        ✨
                      </span>
                    )}
                    label="Enrich"
                    active={activePage === 'enrich'}
                  />
                </div>
                {/* <div onClick={() => handleMenuClick('campaigns', '/campaigns')}>
                  <SidebarMenuItemComponent
                    icon={Send}
                    label="Campaigns"
                    active={activePage === 'campaigns'}
                  />
                </div> */}
                {/* <div onClick={() => handleMenuClick('tasks', '/tasks')}>
                  <SidebarMenuItemComponent
                    icon={CheckSquare}
                    label="Tasks"
                    active={activePage === 'tasks'}
                  />
                </div> */}
                <div onClick={() => handleMenuClick('candidates', '/candidates')}>
                  <SidebarMenuItemComponent
                    icon={User}
                    label="Candidates"
                    active={activePage === 'candidates'}
                  />
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {Array.isArray(userProjects) && userProjects.length > 0 && !isCollapsed && (
            <>
              <Separator className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'} `} />

              <SidebarGroup>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SidebarGroupLabel className={`${isDarkMode ? 'text-white' : 'text-black/90'} font-bold uppercase`}>{userData ? userData.firstName : "Your"}'s Projects</SidebarGroupLabel>
                    </motion.div>
                  )}
                </AnimatePresence>
                <SidebarGroupContent>
                  {/* <SidebarMenu>
                    <div onClick={() => handleMenuClick('savedProfiles', '/savedProfiles')}>
                      <SidebarMenuItemComponent
                        icon={User}
                        label="Saved Profiles"
                        active={activePage === 'savedProfiles'}
                      />
                    </div>
                  </SidebarMenu> */}

                  {/* New Projects Sidebar Menu */}
                  <SidebarMenu>
                    {!isCollapsed && userProjects.map(project => (
                      <div
                        key={project._id}
                        onClick={() => handleMenuClick(`project-${project._id}`, `/projects/${project._id}`)}
                      >
                        <SidebarMenuItemComponent
                          icon={User}
                          label={project.name}
                          active={activePage === `project-${project._id}`}
                        />
                      </div>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {/* Searches past 24 hours */}
          {!isCollapsed && (
            <>
              <Separator className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'} `} />
              <SidebarGroup>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SidebarGroupLabel className={`${isDarkMode ? 'text-white' : 'text-black/90'} font-bold uppercase`}>Searches past 24 hours</SidebarGroupLabel>
                    </motion.div>
                  )}
                </AnimatePresence>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentSearchesLoading && !isCollapsed && (
                      <div className={`text-xs px-2 py-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</div>
                    )}
                    {!recentSearchesLoading && recentSearches.length === 0 && !isCollapsed && (
                      <div className={`text-xs px-2 py-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No recent searches</div>
                    )}
                    {!isCollapsed && recentSearches.map((search: any) => (
                      <div
                        key={search._id}
                        onClick={() => {
                          try {
                            // Navigate to search results page
                            handleMenuClick('search-results', `/search-results/${search._id}`);
                          } catch (error) {
                            console.error('Error navigating to search results:', error);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <SidebarMenuItemComponent
                          icon={Search}
                          label={(search.searchQuery || 'Untitled search').slice(0, 24)}
                          active={false}
                        />
                      </div>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {/* <SidebarGroup>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SidebarGroupLabel className={`${isDarkMode ? 'text-white' : 'text-black/90'} font-medium`}>Engage</SidebarGroupLabel>
                </motion.div>
              )}
            </AnimatePresence>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { icon: MessageSquare, label: 'Campaigns', page: 'campaigns', path: '/campaigns' },
                  { icon: Inbox, label: 'Inbox', page: 'inbox', path: '/inbox' },
                  { icon: CheckCircle, label: 'Tasks', page: 'tasks', path: '/tasks' },
                  { icon: Phone, label: 'Calls', page: 'calls', path: '/calls' },
                  { icon: BarChart, label: 'Reports', page: 'reports', path: '/reports' },
                  { icon: FileBox, label: 'Templates', page: 'templates', path: '/templates', active: activePage === 'templates' },
                ].map((item) => (
                  <div
                    key={item.label}
                    onClick={() => handleMenuClick(item.page, item.path)}
                    className="cursor-pointer"
                  >
                    <SidebarMenuItemComponent
                      icon={item.icon}
                      label={item.label}
                      active={item.active}
                    />
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup> */}

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowCreditsDialog(true)}
                    tooltip="Credits"
                    className={`flex items-center gap-3 py-3 px-3 rounded-lg ${isDarkMode ? 'text-white hover:bg-white/15' : 'text-black/90 hover:bg-white/15'} my-1 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Main coin ellipse */}
                      <ellipse
                        cx="12"
                        cy="8"
                        rx="9"
                        ry="6"
                        fill="white"
                        stroke="black"
                        strokeWidth="2"
                      />

                      {/* Inner ellipse */}
                      <ellipse
                        cx="12"
                        cy="8"
                        rx="7"
                        ry="4.5"
                        fill="white"
                        stroke="black"
                        strokeWidth="1.5"
                      />

                      {/* Visible coin edge/thickness */}
                      <path
                        d="M 3 8 Q 3 11 12 14 Q 21 11 21 8"
                        fill="white"
                        stroke="black"
                        strokeWidth="2"
                      />

                      {/* Ridged edges on the visible side */}
                      {Array.from({ length: 8 }, (_, i) => {
                        const progress = i / 7;
                        const x = 3 + (18 * progress);
                        const y1 = 8 + Math.sin(progress * Math.PI) * 3;
                        const y2 = y1 + 1.5;
                        return (
                          <line
                            key={i}
                            x1={x}
                            y1={y1}
                            x2={x}
                            y2={y2}
                            stroke="black"
                            strokeWidth="1.5"
                          />
                        );
                      })}
                    </svg>
                    {!isCollapsed && (
                      <motion.span
                        className={`${isDarkMode ? 'font-medium text-white' : 'font-medium'}`}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* {userData.credits} Credits */}
                        Credits
                      </motion.span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>


        <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} userData={userData} />
        <ChangePasswordDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog} />
        <CreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} userData={userData} />
      </Sidebar>

    </motion.div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  // Check if we have a saved sidebar state in localStorage
  const savedSidebarState = typeof window !== 'undefined' ? localStorage.getItem('sidebar-state') : null;
  const defaultOpen = savedSidebarState !== 'collapsed';
  const [isCollapsed, setIsCollapsed] = useState(false); // false means expanded
  const [activePage, setActivePage] = useState('leads');
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPhase, setSearchPhase] = useState<'search' | 'requirements' | 'leads'>('search');
  // Use the useLocation hook to track route changes
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  // Add function to handle logo click with proper navigation logic
  const handleLogoClick = () => {
    if (activePage === 'leads' && searchPhase === 'leads') {
      // If we're viewing leads, go back to search
      setSearchPhase('search');
    } else {
      // Otherwise navigate to home
      navigate('/');
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        if (response.user) {
          setUserData(response.user);
        }
        console.log('User data:', userData);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/' || pathname.includes('leads')) {
      setActivePage('leads');
    } else if (pathname.includes('enrich')) {
      setActivePage('enrich');
    } else if (pathname.includes('savedProfiles')) {
      setActivePage('savedProfiles');
    } else if (pathname.includes('templates')) {
      setActivePage('templates');
    } else if (pathname.includes('campaigns')) {
      setActivePage('campaigns');
    } else if (pathname.includes('inbox')) {
      setActivePage('inbox');
    } else if (pathname.includes('tasks')) {
      setActivePage('tasks');
    } else if (pathname.includes('calls')) {
      setActivePage('calls');
    } else if (pathname.includes('reports')) {
      setActivePage('reports');
    } else if (pathname.includes('profile')) {
      setActivePage('profile');
    } else if (pathname.startsWith('/projects/')) {
      const projectId = pathname.split('/projects/')[1];
      setActivePage(`project-${projectId}`);
    } else if (pathname.startsWith('/search-results/')) {
      const searchId = pathname.split('/search-results/')[1];
      setActivePage(`search-results-${searchId}`);
    } else if (pathname.includes('candidates')) {
      setActivePage('candidates');
    } else if (pathname.includes('settings')) {
      setActivePage('settings');
    } else {
      setActivePage('dashboard');
    }
  }, [location]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code && window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'gmail_oauth_code', code }, window.location.origin);
        window.close();
      }
    } catch { }
  }, []);

  return (
    <SidebarProvider
      defaultOpen={!isCollapsed}
      onOpenChange={(isOpen) => {
        setIsCollapsed(!isOpen);
      }}
    >
      <motion.div className="flex flex-col h-screen w-full overflow-hidden" data-sidebar="root">
        {/* Add the header at the top */}
        <AppHeader userData={userData} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} onLogoClick={handleLogoClick} />

        {/* Main content area with sidebar and content */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            onHandleLogout={onLogout}
            activePage={activePage}
            setActivePage={setActivePage}
            userData={userData}
            isCollapsed={isCollapsed}
            toggleSidebar={toggleSidebar}
          />
          <DashboardContent
            onLogout={onLogout}
            activePage={activePage}
            userData={userData}
            searchPhase={searchPhase}
            setSearchPhase={setSearchPhase}
          />
        </div>
      </motion.div>
    </SidebarProvider>
  );
};

// Dashboard Content Component that uses useSidebar
const DashboardContent: React.FC<{
  onLogout: () => void,
  activePage: string,
  userData: any,
  searchPhase: 'search' | 'requirements' | 'leads',
  setSearchPhase: React.Dispatch<React.SetStateAction<'search' | 'requirements' | 'leads'>>
}> = ({ onLogout, activePage, userData, searchPhase, setSearchPhase }) => {
  const [showBetaMessage, setShowBetaMessage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedTasks, setCompletedTasks] = useState(0);
  const totalTasks = 6;
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [profileKey, setProfileKey] = useState(0);
  const [linkedInProfiles, setLinkedInProfiles] = useState([]);
  // Add these near the other state declarations in Dashboard component
  const [enrichedLeads, setEnrichedLeads] = useState<string[]>([]);
  const [enrichmentRequestIds, setEnrichmentRequestIds] = useState<{ [key: string]: string }>({});
  const [enrichmentData, setEnrichmentData] = useState<any>(null);

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [pastSearches, setPastSearches] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profileCountMap, setProfileCountMap] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sourceInclusions, setSourceInclusions] = useState({
    includeSignalHire: true,
    includeBrave: true,
    includeGoogle: true,
    includeContactOut: true,
    includeIcypeas: true,
    includeCsvImport: false
  });

  const navigate = useNavigate();

  // Restore a recent search when requested by sidebar
  useEffect(() => {
    const restore = () => {
      try {
        const raw = localStorage.getItem('restoreRecentSearch');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && data.searchCriteria) {
          // Restore search criteria from API data
          if (data.searchCriteria.title) setSearchQuery(data.searchCriteria.title);
          if (data.sourceInclusions) setSourceInclusions(data.sourceInclusions);
          setSearchPhase('leads');
          if (data._id) localStorage.setItem('currentRecentSearchId', data._id);
        }
      } catch (error) {
        console.error('Error restoring recent search:', error);
      } finally {
        localStorage.removeItem('restoreRecentSearch');
      }
    };

    restore();
    window.addEventListener('restoreRecentSearch', restore);
    return () => {
      window.removeEventListener('restoreRecentSearch', restore);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  useEffect(() => {
    if (activePage === 'profile') {
      setProfileKey(prev => prev + 1);
    }
  }, [activePage]);

  // Fetch dashboard data when activePage is dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await authService.getUserDashboard();
        if (response && response.pastSearches && response.projects && response.profileCountMap) {
          setPastSearches(response.pastSearches);
          setProjects(response.projects);
          setProfileCountMap(response.profileCountMap);
        } else {
          setDashboardError('Failed to load dashboard data.');
        }
      } catch (error) {
        setDashboardError('Error fetching dashboard data.');
        console.error('Dashboard fetch error:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (activePage === 'dashboard') {
      fetchDashboardData();
    }
  }, [activePage]);

  const { state } = useSidebar();
  const sidebarCollapsed = state === "collapsed";

  const handleDismissBetaMessage = () => {
    setShowBetaMessage(false);
  };

  const handleSearch = (query: string, files?: File[], searchModes?: { webEnabled: boolean; csvEnabled: boolean }) => {
    setSearchQuery(query);
    setUploadedFiles(files || []);

    // Store search modes, default to both enabled if not provided
    const modes = searchModes || { webEnabled: true, csvEnabled: true };

    // Calculate source inclusion flags
    const sourceInclusions = {
      includeSignalHire: modes.webEnabled,
      includeBrave: modes.webEnabled,
      includeGoogle: modes.webEnabled,
      includeContactOut: modes.webEnabled,
      includeIcypeas: modes.webEnabled,
      includeCsvImport: modes.csvEnabled && !!(files && files.length > 0)
    };

    // Store the source inclusions for use in RequirementsProfileComponent
    setSourceInclusions(sourceInclusions);

    setSearchPhase('requirements');
  };

  const handleBackToSearch = () => {
    setSearchPhase('search');
  };

  const handleProcessLeads = (profileData) => {
    setLinkedInProfiles(profileData);
    setSearchPhase('leads');
  };

  const calculateTrialDaysRemaining = () => {
    if (!userData || !userData.trialStartDate) return 0;

    const trialStartDate = new Date(userData.trialStartDate);
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // Assuming 7-days trial

    const currentDate = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, daysRemaining);
  };

  const { isDarkMode } = useTheme();

  if (activePage === "profile") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <div className="px-6 py-0">
          <motion.div
            key={profileKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-3 px-1 mb-4">
              <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
              <p className="text-gray-500">Manage your account information and subscription</p>
            </div>

            <div className="mb-10">
              <UserProfile editable={true} userData={userData} />
            </div>
          </motion.div>
        </div>
      </div>
    );
  } else if (activePage === "leads") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <div className="px-6 py-0">
          {searchPhase === 'search' && (
            <div className="flex items-center justify-center min-h-screen">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl px-4"
              >
                {/* Search Component */}
                <SearchComponent onSearch={handleSearch} />
              </motion.div>
            </div>
          )}


          {searchPhase === 'requirements' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Requirements Profile Component */}
              <RequirementsProfileComponent
                searchQuery={searchQuery}
                uploadedFiles={uploadedFiles} // Pass the files
                sourceInclusions={sourceInclusions} // Pass source inclusion flags
                onBack={handleBackToSearch}
                onProcessing={handleProcessLeads}
              />
            </motion.div>
          )}

          {searchPhase === 'leads' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >

              {/* <DashboardFilters /> */}
              <div className="mt-6">
                <LeadTable
                  linkedInProfiles={linkedInProfiles}
                  enrichedLeads={enrichedLeads}
                  setEnrichedLeads={setEnrichedLeads}
                  enrichmentRequestIds={enrichmentRequestIds}
                  setEnrichmentRequestIds={setEnrichmentRequestIds}
                  enrichmentData={enrichmentData}
                  setEnrichmentData={setEnrichmentData}
                  onBack={handleBackToSearch} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  } else if (activePage === "savedProfiles") {
    return (
      <div className="w-full h-full max-h-full overflow-y-auto">
        <div className="px-6 py-0">
          <motion.div
            key={profileKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-10">
              <SavedProfiles />
            </div>
          </motion.div>
        </div>
      </div>
    );
  } else if (activePage.startsWith("project-")) {
    const projectId = activePage.replace("project-", "");
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <div className="px-6 py-0">
          <motion.div
            key={projectId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectPage />
          </motion.div>
        </div>
      </div>
    );

    // ... existing code ...
  } else if (activePage === "candidates") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <div className="px-6 py-0">
          <motion.div
            key={profileKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CandidatesPage />
          </motion.div>
        </div>
      </div>
    );
  } else if (activePage === "enrich") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <EnrichPage />
      </div>
    );
  } else if (activePage === "campaigns") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <CampaignsPage />
      </div>
    );
  } else if (activePage === "tasks") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <TasksPage />
      </div>
    );
  } else if (activePage === "settings") {
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <SettingsPage />
      </div>
    );
  } else if (activePage.startsWith("search-results-")) {
    const searchId = activePage.replace("search-results-", "");
    return (
      <div className={`w-full h-full max-h-full overflow-y-auto ${isDarkMode ? 'bg-primary' : ''}`}>
        <SearchResultsPage />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex w-full ">
      <SidebarInset className="bg-transparent flex flex-col h-screen overflow-hidden">
        <motion.div
          className="h-16 border-b px-6 flex items-center justify-between bg-white/80 backdrop-black-lg flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            {userData && !userData.trialEnded && (
              <motion.div
                className="bg-gray-100 h-[40px] text-black py-2 px-4 flex border-gray-200 items-center justify-between rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="font-medium border-gray-200">{sidebarCollapsed ? '7 days trial left' : calculateTrialDaysRemaining() + ' days of free trial left'}</div>
                <Button
                  className="bg-black h-[30px] hover:bg-black-50 ml-3"
                  onClick={() => {
                    setShowPricingDialog(true);
                    // setShowTrialBanner(false);
                  }}
                >
                  {sidebarCollapsed ? 'Upgrade' : 'Upgrade Plan'}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className={`p-8 bg-white transition-all duration-300 ${sidebarCollapsed ? 'md:pl-4' : ''} overflow-y-auto flex-grow scrollbar-hide`}>
          <motion.div
            className="flex justify-between items-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800">
                {activePage === 'dashboard' ? 'Dashboard' : ''}
              </h1>
            </div>

            {activePage === 'dashboard' && <Button
              className="bg-black text-white rounded-xl px-4 py-2"
              onClick={() => {

                // Navigate to create campaign page or open create campaign modal
                alert('Create New Campaign functionality would go here');

              }}
            >
              Create New Campaign
            </Button>
            }
          </motion.div>

          {activePage === 'dashboard' ? (
            <>
              <div className="mb-10">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Get Started & Succeed with SACORE AI</h2>
                  <p className="text-gray-600">5 steps to configure and launch successful outreach.</p>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks completed</span>
                </div>
                <Progress
                  value={(completedTasks / totalTasks) * 100}
                  className="h-2 bg-gray-100 bg-black"
                />
                <div className="space-y-6 mt-6">
                  {[
                    {
                      icon: <MessageSquare className="h-6 w-6" />,
                      title: 'Create your first campaign',
                      description: 'Set up campaigns with personalized, multichannel messages that send on auto-pilot.',
                      buttonText: 'Create campaign'
                    },
                    {
                      icon: <Users className="h-6 w-6" />,
                      title: 'Import relevant leads',
                      description: 'Add campaign\'s recipients straight from SACORE AI database, CSV files, LinkedIn, Sales Navigator, your CRM or SACORE AI API.',
                      buttonText: 'Import leads'
                    },
                    {
                      icon: <MessageSquare className="h-6 w-6" />,
                      title: 'Connect your sending email',
                      description: 'Link your email account to send campaigns.',
                      buttonText: 'Connect email'
                    },
                    {
                      icon: <Users className="h-6 w-6" />,
                      title: 'Find profiles on LinkedIn with SACORE AI Chrome extension',
                      description: 'Find and connect with potential profiles on LinkedIn.',
                      buttonText: 'Install extension',
                      optional: true
                    },
                    {
                      icon: <MessageSquare className="h-6 w-6" />,
                      title: 'Launch your campaign',
                      description: 'Start your outreach campaign.',
                      buttonText: 'Launch campaign'
                    },
                    {
                      icon: <Users className="h-6 w-6" />,
                      title: 'Connect your CRM to SACORE AI',
                      description: 'Integrate with your existing CRM.',
                      buttonText: 'Connect CRM',
                      optional: true
                    }
                  ].map((task, index) => (
                    <TaskCard
                      key={task.title}
                      icon={task.icon}
                      title={task.title}
                      description={task.description}
                      buttonText={task.buttonText}
                      optional={task.optional}
                      completed={false}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              {/* This div will be empty - the leads page content is now handled in the activePage === "leads" section */}
            </div>
          )}
        </div>
      </SidebarInset>
      <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} userData={userData} />
      {/* <TransactionHistoryDialog
        open={isTransactionHistoryOpen}
        onOpenChange={setIsTransactionHistoryOpen}
      /> */}
    </div>
  );
};

export default Dashboard;