import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Receipt,
    User,
    Settings,
    Bell,
    Download,
    ChevronRight,
    AlertTriangle,
    Check,
    Clock,
    MessageCircle,
    UserPlus,
    Plus,
    Minus,
    Info,
    Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import authService from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import PricingDialog from '@/components/PricingDialog';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// LinkedIn rate limits validation constants
const LINKEDIN_LIMITS = {
    invitations: {
        hourly: { min: 5, max: 15, default: 10 },
        daily: { min: 10, max: 20, default: 20 },
        weekly: { min: 50, max: 80, default: 80 }
    },
    messages: {
        hourly: { min: 10, max: 30, default: 20 },
        daily: { min: 30, max: 80, default: 50 },
        weekly: { min: 100, max: 300, default: 200 }
    },
    visits: {
        hourly: { min: 20, max: 50, default: 30 },
        daily: { min: 50, max: 150, default: 100 },
        weekly: { min: 200, max: 500, default: 400 }
    },
    checks: {
        hourly: { min: 30, max: 100, default: 50 },
        daily: { min: 100, max: 300, default: 200 },
        weekly: { min: 500, max: 1000, default: 800 }
    }
};

const SettingsPage: React.FC = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Subscriptions tab state
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

    // Invoices tab state
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
    const [invoicesError, setInvoicesError] = useState<string | null>(null);



    // Rate limits state
    const [rateLimits, setRateLimits] = useState<any>(null);
    const [isRateLimitsLoading, setIsRateLimitsLoading] = useState(false);
    const [rateLimitsError, setRateLimitsError] = useState<string | null>(null);

    // Editable rate limits state
    const [editableLimits, setEditableLimits] = useState<any>(null);
    const [isSavingLimits, setIsSavingLimits] = useState(false);

    // Fetch subscription data
    const fetchSubscriptionData = async (forceRefresh = false) => {
        if (subscriptionData && !forceRefresh) return; // Don't fetch if already loaded unless forcing refresh

        setIsSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const subscriptionResponse = await authService.getSubscriptionDetails();
            if (subscriptionResponse) {
                setSubscriptionData(subscriptionResponse);
            }
        } catch (err) {
            console.error('Error fetching subscription data:', err);
            setSubscriptionError('Failed to load subscription data. Please try again later.');
        } finally {
            setIsSubscriptionLoading(false);
        }
    };

    // Fetch invoices data
    const fetchInvoicesData = async () => {
        if (invoices.length > 0) return; // Don't fetch if already loaded

        setIsInvoicesLoading(true);
        setInvoicesError(null);
        try {
            const invoicesResponse = await authService.getInvoices();
            if (invoicesResponse && invoicesResponse.invoices) {
                setInvoices(invoicesResponse.invoices || []);
            }
        } catch (err) {
            console.error('Error fetching invoices data:', err);
            setInvoicesError('Failed to load invoices data. Please try again later.');
        } finally {
            setIsInvoicesLoading(false);
        }
    };



    // Fetch LinkedIn rate limits data
    const fetchRateLimits = async () => {
        if (rateLimits) return; // Don't fetch if already loaded

        setIsRateLimitsLoading(true);
        setRateLimitsError(null);
        try {
            console.log('Fetching LinkedIn rate limits...');
            const rateLimitsResponse = await authService.getLinkedInRateLimits();
            console.log('Rate limits response:', rateLimitsResponse);
            if (rateLimitsResponse && rateLimitsResponse.rateLimits) {
                console.log('Setting rate limits:', rateLimitsResponse.rateLimits);
                setRateLimits(rateLimitsResponse.rateLimits);
                // Initialize editable limits with current values
                setEditableLimits({
                    invitations: { daily: rateLimitsResponse.rateLimits.invitations?.daily || LINKEDIN_LIMITS.invitations.daily.default },
                    messages: { daily: rateLimitsResponse.rateLimits.messages?.daily || LINKEDIN_LIMITS.messages.daily.default },
                    visits: { daily: rateLimitsResponse.rateLimits.visits?.daily || LINKEDIN_LIMITS.visits.daily.default }
                });
            } else {
                console.log('No rate limits data received');
                setRateLimitsError('No rate limits data available');
            }
        } catch (err) {
            console.error('Error fetching rate limits:', err);
            setRateLimitsError('Failed to load rate limits. Please try again later.');
        } finally {
            setIsRateLimitsLoading(false);
        }
    };

    // Handle rate limit changes with validation
    const updateRateLimit = (category: string, type: string, value: number) => {
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];

        // Enforce min/max boundaries
        const clampedValue = Math.max(typeLimit.min, Math.min(typeLimit.max, value));

        setEditableLimits((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [type]: clampedValue
            }
        }));
    };

    const increaseLimit = (category: string, type: string) => {
        const currentValue = editableLimits?.[category]?.[type] || 0;
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];

        // Only increase if not at max
        if (currentValue < typeLimit.max) {
            updateRateLimit(category, type, currentValue + 1);
        }
    };

    const decreaseLimit = (category: string, type: string) => {
        const currentValue = editableLimits?.[category]?.[type] || 0;
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];

        // Only decrease if not at min
        if (currentValue > typeLimit.min) {
            updateRateLimit(category, type, currentValue - 1);
        }
    };

    // Helper functions for button states
    const isAtMinLimit = (category: string, type: string) => {
        const currentValue = editableLimits?.[category]?.[type] || 0;
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];
        return currentValue <= typeLimit.min;
    };

    const isAtMaxLimit = (category: string, type: string) => {
        const currentValue = editableLimits?.[category]?.[type] || 0;
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];
        return currentValue >= typeLimit.max;
    };

    const getMaxLimit = (category: string, type: string) => {
        const limits = LINKEDIN_LIMITS[category as keyof typeof LINKEDIN_LIMITS];
        const typeLimit = limits[type as keyof typeof limits];
        return typeLimit.max;
    };

    const saveLimits = async () => {
        if (!editableLimits) return;

        setIsSavingLimits(true);
        try {
            console.log('Saving limits:', editableLimits);

            // Prepare the payload in the format expected by the API
            // We'll only update the daily values, keeping existing hourly and weekly values
            const currentRateLimits = rateLimits || {};
            const rateLimitsPayload = {
                invitations: {
                    hourly: currentRateLimits.invitations?.hourly || LINKEDIN_LIMITS.invitations.hourly.default,
                    daily: editableLimits.invitations?.daily || LINKEDIN_LIMITS.invitations.daily.default,
                    weekly: currentRateLimits.invitations?.weekly || LINKEDIN_LIMITS.invitations.weekly.default
                },
                messages: {
                    hourly: currentRateLimits.messages?.hourly || LINKEDIN_LIMITS.messages.hourly.default,
                    daily: editableLimits.messages?.daily || LINKEDIN_LIMITS.messages.daily.default,
                    weekly: currentRateLimits.messages?.weekly || LINKEDIN_LIMITS.messages.weekly.default
                },
                visits: {
                    hourly: currentRateLimits.visits?.hourly || LINKEDIN_LIMITS.visits.hourly.default,
                    daily: editableLimits.visits?.daily || LINKEDIN_LIMITS.visits.daily.default,
                    weekly: currentRateLimits.visits?.weekly || LINKEDIN_LIMITS.visits.weekly.default
                },
                checks: {
                    hourly: currentRateLimits.checks?.hourly || LINKEDIN_LIMITS.checks.hourly.default,
                    daily: currentRateLimits.checks?.daily || LINKEDIN_LIMITS.checks.daily.default,
                    weekly: currentRateLimits.checks?.weekly || LINKEDIN_LIMITS.checks.weekly.default
                }
            };

            const response = await authService.updateLinkedInRateLimits(rateLimitsPayload);

            if (response && response.success) {
                console.log('Rate limits updated successfully:', response);

                // Update local state with the response data
                if (response.rateLimits && response.rateLimits) {
                    setRateLimits(response.rateLimits);
                    // Also update editable limits to reflect any server-side changes
                    setEditableLimits({
                        invitations: { daily: response.rateLimits.invitations?.daily || LINKEDIN_LIMITS.invitations.daily.default },
                        messages: { daily: response.rateLimits.messages?.daily || LINKEDIN_LIMITS.messages.daily.default },
                        visits: { daily: response.rateLimits.visits?.daily || LINKEDIN_LIMITS.visits.daily.default }
                    });
                }

                toast.success(response.message || 'Rate limits updated successfully');
            } else {
                throw new Error(response?.message || 'Failed to update rate limits');
            }
        } catch (err: any) {
            console.error('Error saving limits:', err);
            const errorMessage = err.message || 'Failed to save rate limits. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsSavingLimits(false);
        }
    };

    // Handle tab change and fetch data accordingly
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);

        switch (newTab) {
            case 'subscriptions':
                fetchSubscriptionData();
                break;
            case 'invoices':
                fetchInvoicesData();
                break;
            case 'campaigns':
                fetchRateLimits(); // Fetch rate limits for display
                break;
            // account and notifications tabs don't need API calls
        }
    };

    // Load initial tab data
    useEffect(() => {
        handleTabChange(activeTab);
    }, []);

    const handleCancelSubscription = async (immediately: boolean) => {
        setIsCancelling(true);
        try {
            const apiCall = immediately
                ? authService.cancelSubscriptionImmediately
                : authService.cancelSubscription;

            const response = await apiCall();

            if (response && response.message) {
                toast.success(response.message);
                // Force refresh subscription data
                fetchSubscriptionData(true);
            } else {
                const errorMessage = response?.message || 'Failed to process cancellation.';
                throw new Error(errorMessage);
            }
        } catch (err: any) {
            toast.error('Cancellation Failed', {
                description: err.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsCancelling(false);
            setIsCancelDialogOpen(false);
        }
    };




    // Format date function
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount); // Amount is already in dollars, not cents
    };

    return (
        <div className={`w-full min-h-screen ${isDarkMode ? 'bg-primary text-white' : 'bg-white text-gray-900'} py-8 px-4 md:px-8`}>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                    <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Manage your account settings, subscriptions, and billing information
                    </p>
                </motion.div>

                <Tabs
                    defaultValue={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                >
                    <TabsList className={`grid grid-cols-4 mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <TabsTrigger value="account" className="text-sm">
                            <User className="h-4 w-4 mr-2" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="subscriptions" className="text-sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Subscriptions
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="text-sm">
                            <Receipt className="h-4 w-4 mr-2" />
                            Invoices
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="text-sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        {/* <TabsTrigger value="campaigns" className="text-sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Campaign Settings
                        </TabsTrigger> */}
                    </TabsList>

                    {/* Account Tab Content */}
                    <TabsContent value="account" className="space-y-6">
                        <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                            <CardHeader>
                                <CardTitle className={isDarkMode ? 'text-white' : ''}>Account Information</CardTitle>
                                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                    Manage your account details and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    Account settings are managed in the Profile page. Please visit your profile to update your information.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={() => window.location.href = '/profile'}>
                                    Go to Profile
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Subscriptions Tab Content */}
                    <TabsContent value="subscriptions" className="space-y-6">
                        {isSubscriptionLoading ? (
                            <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                <span className="ml-3">Loading subscription data...</span>
                            </div>
                        ) : subscriptionError ? (
                            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                                    <p className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{subscriptionError}</p>
                                    <Button onClick={() => fetchSubscriptionData()} className="mt-4">
                                        Try Again
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                    <CardHeader>
                                        <CardTitle className={isDarkMode ? 'text-white' : ''}>Current Subscription</CardTitle>
                                        <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                            Details about your current subscription plan
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {subscriptionData?.subscription?.stripeDetails?.product?.name || 'Basic Plan'}
                                                    </h3>
                                                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                        {subscriptionData?.subscription?.billingInterval === 'yearly' ? 'Annual billing' : 'Monthly billing'}
                                                    </p>
                                                </div>
                                                <Badge className={`${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'} px-3 py-1`}>
                                                    {subscriptionData?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>

                                            {subscriptionData?.subscription?.stripeDetails?.cancelAtPeriodEnd && (
                                                <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900 text-yellow-200 border border-yellow-700' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'} flex items-center`}>
                                                    <AlertTriangle className="h-5 w-5 mr-3" />
                                                    <div>
                                                        <p className="font-semibold">Cancellation Pending</p>
                                                        <p className="text-sm">Your subscription is set to be cancelled at the end of the current billing period on {formatDate(subscriptionData.subscription.stripeDetails.currentPeriodEnd)}.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <Separator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} />

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Next billing date</p>
                                                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {subscriptionData?.subscription?.stripeDetails?.currentPeriodEnd
                                                            ? formatDate(subscriptionData.subscription.stripeDetails.currentPeriodEnd)
                                                            : 'Not available'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</p>
                                                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {subscriptionData?.subscription?.stripeDetails?.price?.amount
                                                            ? formatCurrency(subscriptionData.subscription.stripeDetails.price.amount)
                                                            : '$0.00'} / {subscriptionData?.subscription?.billingInterval === 'yearly' ? 'year' : 'month'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                                                    <div className="flex items-center">
                                                        <div className={`h-2 w-2 rounded-full mr-2 ${subscriptionData?.subscription?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {subscriptionData?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add credit usage information */}
                                            <Separator className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} my-4`} />

                                            <div>
                                                <h4 className={`text-md font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Credits & Usage</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Available Credits</p>
                                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {subscriptionData?.subscription?.credits?.available || 0}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monthly Searches</p>
                                                        <div className="flex items-center">
                                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {subscriptionData?.subscription?.usage?.monthly?.used || 0} / {subscriptionData?.subscription?.usage?.monthly?.limit || 0}
                                                            </p>
                                                            {(subscriptionData?.subscription?.usage?.monthly?.remaining || 0) < 0 && (
                                                                <Badge className="ml-2 bg-red-500 text-white">Exceeded</Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Searches</p>
                                                        <div className="flex items-center">
                                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {subscriptionData?.subscription?.usage?.daily?.used || 0} / {subscriptionData?.subscription?.usage?.daily?.limit || 0}
                                                            </p>
                                                            {(subscriptionData?.subscription?.usage?.daily?.remaining || 0) <= 0 && (
                                                                <Badge className="ml-2 bg-red-500 text-white">Limit Reached</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={isDarkMode ? 'border-gray-600 text-white' : ''}
                                                    disabled={subscriptionData?.subscription?.stripeDetails?.cancelAtPeriodEnd}
                                                >
                                                    {subscriptionData?.subscription?.stripeDetails?.cancelAtPeriodEnd ? 'Cancellation Pending' : 'Cancel Subscription'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure you want to cancel your subscription?</AlertDialogTitle>
                                                    <AlertDialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                                        You can choose to cancel immediately, which will revoke access right away, or cancel at the end of your current billing period, allowing you to use the service until then.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isCancelling}>Go Back</AlertDialogCancel>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCancelSubscription(false)}
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? 'Processing...' : 'Cancel at Period End'}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => handleCancelSubscription(true)}
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? 'Processing...' : 'Cancel Immediately'}
                                                    </Button>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button onClick={() => setShowPricingDialog(true)}>
                                            Change Plan
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                    <CardHeader>
                                        <CardTitle className={isDarkMode ? 'text-white' : ''}>Payment Method</CardTitle>
                                        <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                            Manage your payment methods
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {subscriptionData?.paymentMethod ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`p-2 rounded-md mr-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                        <CreditCard className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            •••• •••• •••• {subscriptionData.paymentMethod.last4}
                                                        </p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Expires {subscriptionData.paymentMethod.expMonth}/{subscriptionData.paymentMethod.expYear}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={`${isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                                                    Default
                                                </Badge>
                                            </div>
                                        ) : (
                                            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                                No payment method on file.
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className={isDarkMode ? 'border-gray-600 text-white' : ''}>
                                            Update Payment Method
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* Invoices Tab Content */}
                    <TabsContent value="invoices" className="space-y-6">
                        {isInvoicesLoading ? (
                            <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                <span className="ml-3">Loading invoice data...</span>
                            </div>
                        ) : invoicesError ? (
                            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                                    <p className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{invoicesError}</p>
                                    <Button onClick={() => fetchInvoicesData()} className="mt-4">
                                        Try Again
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                <CardHeader>
                                    <CardTitle className={isDarkMode ? 'text-white' : ''}>Billing History</CardTitle>
                                    <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                        View and download your past invoices
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {invoices.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Receipt className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No invoices found</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                                                        <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Invoice</TableHead>
                                                        <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Date</TableHead>
                                                        <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Amount</TableHead>
                                                        <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Status</TableHead>
                                                        <TableHead className={isDarkMode ? 'text-gray-300' : ''}></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {invoices.map((invoice) => (
                                                        <TableRow key={invoice.id} className={isDarkMode ? 'border-gray-700' : ''}>
                                                            <TableCell className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>
                                                                {invoice.id}
                                                            </TableCell>
                                                            <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                                                                {invoice.date}
                                                            </TableCell>
                                                            <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                                                                {formatCurrency(parseFloat(invoice.amount))}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={
                                                                        invoice.status === 'paid'
                                                                            ? isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                                                                            : isDarkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
                                                                    }
                                                                >
                                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`flex items-center ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                                                                    onClick={() => window.open(invoice.pdf, '_blank')}
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    PDF
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Notifications Tab Content */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                            <CardHeader>
                                <CardTitle className={isDarkMode ? 'text-white' : ''}>Notification Preferences</CardTitle>
                                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                    Manage how you receive notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    Notification settings coming soon.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Campaign Settings Tab Content */}
                    <TabsContent value="campaigns" className="space-y-6">
                        {/* LinkedIn Rate Limits */}
                        <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                            <CardHeader>
                                <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : ''}`}>
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Limits for LinkedIn Steps
                                </CardTitle>
                                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                    Set maximum daily limits for LinkedIn actions to stay within safe boundaries
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isRateLimitsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Loading rate limits...
                                        </span>
                                    </div>
                                ) : rateLimitsError ? (
                                    <div className={`text-center py-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                        <p>{rateLimitsError}</p>
                                    </div>
                                ) : editableLimits ? (
                                    <div className="space-y-6">
                                        {/* Safety Recommendation Banner */}
                                        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                                            <div className="flex items-start gap-3">
                                                <Shield className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <div className="flex-1">
                                                    <h4 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                                        Safety First: Start Conservative
                                                    </h4>
                                                    <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                                                        We <span className="font-medium">strongly recommend starting with lower limits</span> (minimum values) to protect your LinkedIn account.
                                                        Aggressive automation can trigger LinkedIn's security systems and lead to account restrictions.
                                                    </p>
                                                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                        <p className="font-medium">💡 Best Practice:</p>
                                                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                                                            <li>Start with minimum limits for the first 2-4 weeks</li>
                                                            <li>Gradually increase by 1-2 actions per day if no issues occur</li>
                                                            <li>Monitor your LinkedIn account health regularly</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* LinkedIn Invites */}
                                        <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        Maximum number of LinkedIn invites sent by Sacore in 24h
                                                    </h4>
                                                    {editableLimits.invitations?.daily <= 15 && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                    {editableLimits.invitations?.daily > 17 && (
                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Higher Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Range: {LINKEDIN_LIMITS.invitations.daily.min} - {LINKEDIN_LIMITS.invitations.daily.max}
                                                    <span className={`ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>• Recommended: 15</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => decreaseLimit('invitations', 'daily')}
                                                    disabled={isSavingLimits || isAtMinLimit('invitations', 'daily')}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <div className="flex flex-col items-center">
                                                    <span className={`min-w-[3rem] text-center font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {editableLimits.invitations?.daily || 0}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => increaseLimit('invitations', 'daily')}
                                                    disabled={isSavingLimits || isAtMaxLimit('invitations', 'daily')}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* LinkedIn Messages */}
                                        <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        Maximum number of LinkedIn messages sent by Sacore in 24h
                                                    </h4>
                                                    {editableLimits.messages?.daily <= 50 && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                    {editableLimits.messages?.daily > 60 && (
                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Higher Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Range: {LINKEDIN_LIMITS.messages.daily.min} - {LINKEDIN_LIMITS.messages.daily.max}
                                                    <span className={`ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>• Recommended: 50</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => decreaseLimit('messages', 'daily')}
                                                    disabled={isSavingLimits || isAtMinLimit('messages', 'daily')}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <div className="flex flex-col items-center">
                                                    <span className={`min-w-[3rem] text-center font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {editableLimits.messages?.daily || 0}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => increaseLimit('messages', 'daily')}
                                                    disabled={isSavingLimits || isAtMaxLimit('messages', 'daily')}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* LinkedIn Visits */}
                                        <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        Maximum number of LinkedIn visits made by Sacore in 24h
                                                    </h4>
                                                    {editableLimits.visits?.daily <= 70 && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                    {editableLimits.visits?.daily > 90 && (
                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Higher Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Range: {LINKEDIN_LIMITS.visits.daily.min} - {LINKEDIN_LIMITS.visits.daily.max}
                                                    <span className={`ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>• Recommended: 70</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => decreaseLimit('visits', 'daily')}
                                                    disabled={isSavingLimits || isAtMinLimit('visits', 'daily')}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <div className="flex flex-col items-center">
                                                    <span className={`min-w-[3rem] text-center font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {editableLimits.visits?.daily || 0}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => increaseLimit('visits', 'daily')}
                                                    disabled={isSavingLimits || isAtMaxLimit('visits', 'daily')}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex justify-end pt-4">
                                            <Button
                                                onClick={saveLimits}
                                                disabled={isSavingLimits}
                                                className="min-w-[120px]"
                                            >
                                                {isSavingLimits ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <p>No rate limits data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            {user && <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} userData={user} />}
        </div>
    );
};

export default SettingsPage; 