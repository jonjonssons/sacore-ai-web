import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Receipt,
    User,
    Shield,
    Bell,
    Download,
    ChevronRight,
    AlertTriangle,
    Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
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

const SettingsPage: React.FC = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchSubscriptionData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch subscription data
            const subscriptionResponse = await authService.getSubscriptionDetails();
            if (subscriptionResponse) {
                setSubscriptionData(subscriptionResponse);
            }

            // Fetch invoices
            const invoicesResponse = await authService.getInvoices();
            if (invoicesResponse && invoicesResponse.invoices) {
                setInvoices(invoicesResponse.invoices || []);
            }
        } catch (err) {
            console.error('Error fetching settings data:', err);
            setError('Failed to load settings data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
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
                fetchSubscriptionData(); // Refresh data
            } else {
                const errorMessage = response?.error || 'Failed to process cancellation.';
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
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className={`grid grid-cols-5 mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
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
                        <TabsTrigger value="security" className="text-sm">
                            <Shield className="h-4 w-4 mr-2" />
                            Security
                        </TabsTrigger>
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
                        {isLoading ? (
                            <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                <span className="ml-3">Loading subscription data...</span>
                            </div>
                        ) : error ? (
                            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                                    <p className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                                    <Button onClick={() => window.location.reload()} className="mt-4">
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
                        {isLoading ? (
                            <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                <span className="ml-3">Loading invoice data...</span>
                            </div>
                        ) : error ? (
                            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                                    <p className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                                    <Button onClick={() => window.location.reload()} className="mt-4">
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

                    {/* Security Tab Content */}
                    <TabsContent value="security" className="space-y-6">
                        <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                            <CardHeader>
                                <CardTitle className={isDarkMode ? 'text-white' : ''}>Security Settings</CardTitle>
                                <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                                    Manage your account security
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    Security settings are managed in the Profile page. Please visit your profile to update your password and security preferences.
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
                </Tabs>
            </div>
            {user && <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} userData={user} />}
        </div>
    );
};

export default SettingsPage; 