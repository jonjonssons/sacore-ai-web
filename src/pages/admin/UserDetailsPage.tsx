import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/components/ui/use-toast";
import authService from '@/services/authService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Search, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api, { API_BASE_URL } from '@/services/api';

const UserDetailsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
    const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false);
    const [isAddSearchesDialogOpen, setIsAddSearchesDialogOpen] = useState(false);
    const [creditsToAdd, setCreditsToAdd] = useState<number>(100);
    const [monthlySearchesToAdd, setMonthlySearchesToAdd] = useState<number>(20);
    const [dailySearchesToAdd, setDailySearchesToAdd] = useState<number>(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingSearches, setIsSubmittingSearches] = useState(false);
    const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [selectedBillingInterval, setSelectedBillingInterval] = useState<string>('');
    const [isSubmittingPlanChange, setIsSubmittingPlanChange] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const response = await authService.getUserDetails(userId);
                setUserData(response);
            } catch (error) {
                console.error('Error fetching user details:', error);
                toast({
                    title: "Error",
                    description: "Failed to load user details",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, toast]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const toggleQueryExpansion = (historyId: string) => {
        setExpandedQueries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(historyId)) {
                newSet.delete(historyId);
            } else {
                newSet.add(historyId);
            }
            return newSet;
        });
    };

    const renderQuery = (historyItem: any) => {
        const isExpanded = expandedQueries.has(historyItem._id);
        const isLongQuery = historyItem.query.length > 100;

        if (isLongQuery && !isExpanded) {
            return (
                <div>
                    {`${historyItem.query.substring(0, 100)}...`}
                    <button
                        onClick={() => toggleQueryExpansion(historyItem._id)}
                        className="text-blue-500 hover:underline text-xs ml-1"
                    >
                        Show More
                    </button>
                </div>
            );
        }

        if (isLongQuery && isExpanded) {
            return (
                <div>
                    {historyItem.query}
                    <button
                        onClick={() => toggleQueryExpansion(historyItem._id)}
                        className="text-blue-500 hover:underline text-xs ml-1"
                    >
                        Show Less
                    </button>
                </div>
            );
        }

        return historyItem.query;
    };

    const handleAddCredits = async () => {
        if (!userId) return;

        // Store current credits outside try block so it's accessible in catch
        const currentCredits = userData.user.credits;

        try {
            setIsSubmitting(true);

            // Get current user data to preserve existing values
            const currentSubscription = userData.user.subscription;
            const isVerified = userData.user.isVerified;

            // Calculate new total credits
            const newTotalCredits = currentCredits + creditsToAdd;

            // Call the API using authService instead of direct fetch
            const response = await authService.updateUser(userId, {
                subscription: currentSubscription,
                credits: newTotalCredits,
                isVerified: isVerified,
                role: "user"
            });

            // Check if the response contains a message about successful update
            if (response && (response.success ||
                (response.message && response.message.includes("successfully")))) {

                toast({
                    title: "Success",
                    description: `Added ${creditsToAdd} credits to user's account`,
                    variant: "default"
                });

                // Update local state
                setUserData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        credits: newTotalCredits
                    }
                }));

                // Close the dialog
                setIsAddCreditsDialogOpen(false);

                // Refresh user details to get updated data
                const updatedUserData = await authService.getUserDetails(userId);
                setUserData(updatedUserData);
            } else {
                throw new Error(response?.message || 'Unknown error occurred');
            }
        } catch (error: any) {
            // Special case: if the error message contains "successfully", it's actually a success
            if (error.message && error.message.includes("successfully")) {
                toast({
                    title: "Success",
                    description: `Added ${creditsToAdd} credits to user's account`,
                    variant: "default"
                });

                // Update local state
                setUserData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        credits: currentCredits + creditsToAdd
                    }
                }));

                // Close the dialog
                setIsAddCreditsDialogOpen(false);

                // Refresh user details to get updated data
                try {
                    const updatedUserData = await authService.getUserDetails(userId);
                    setUserData(updatedUserData);
                } catch (refreshError) {
                    console.error('Error refreshing user data:', refreshError);
                }
            } else {
                console.error('Error adding credits:', error);
                toast({
                    title: "Error",
                    description: `Failed to add credits: ${error.message || 'Unknown error'}`,
                    variant: "destructive"
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSearches = async () => {
        if (!userId) return;

        try {
            setIsSubmittingSearches(true);

            // Get token for authorization
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            // Call the new API endpoint for adding searches
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/add-searches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    extraMonthlySearches: monthlySearchesToAdd,
                    extraDailySearches: dailySearchesToAdd
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Reduced user's search count by ${monthlySearchesToAdd} monthly and ${dailySearchesToAdd} daily searches`,
                    variant: "default"
                });

                // Close the dialog
                setIsAddSearchesDialogOpen(false);

                // Refresh user details to get updated data
                const updatedUserData = await authService.getUserDetails(userId);
                setUserData(updatedUserData);
            } else {
                throw new Error(data.message || 'Failed to add searches');
            }
        } catch (error: any) {
            // Special case: if the error message contains "successfully", it's actually a success
            if (error.message && error.message.includes("successfully")) {
                toast({
                    title: "Success",
                    description: `Reduced user's search count by ${monthlySearchesToAdd} monthly and ${dailySearchesToAdd} daily searches`,
                    variant: "default"
                });

                // Close the dialog
                setIsAddSearchesDialogOpen(false);

                // Refresh user details to get updated data
                try {
                    const updatedUserData = await authService.getUserDetails(userId);
                    setUserData(updatedUserData);
                } catch (refreshError) {
                    console.error('Error refreshing user data:', refreshError);
                }
            } else {
                console.error('Error adding searches:', error);
                toast({
                    title: "Error",
                    description: `Failed to reduce search count: ${error.message || 'Unknown error'}`,
                    variant: "destructive"
                });
            }
        } finally {
            setIsSubmittingSearches(false);
        }
    };

    const handleChangePlan = async () => {
        if (!userId) return;

        try {
            setIsSubmittingPlanChange(true);

            // Get token for authorization
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            // Call the specific plan change API endpoint
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/plan`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    billingInterval: selectedBillingInterval
                })
            });

            const data = await response.json();

            if (response.ok) {
                const { changes, user: updatedUser } = data;
                
                // Create detailed success message
                let changeDetails = [];
                if (changes.plan.from !== changes.plan.to) {
                    changeDetails.push(`Plan: ${changes.plan.from} → ${changes.plan.to}`);
                }
                if (changes.billingInterval.from !== changes.billingInterval.to) {
                    changeDetails.push(`Billing: ${changes.billingInterval.from} → ${changes.billingInterval.to}`);
                }
                if (changes.credits.adjustment !== 0) {
                    changeDetails.push(`Credits: ${changes.credits.from} → ${changes.credits.to} (${changes.credits.adjustment > 0 ? '+' : ''}${changes.credits.adjustment})`);
                }

                toast({
                    title: "Plan Changed Successfully",
                    description: changeDetails.length > 0 ? changeDetails.join(', ') : 'Plan updated successfully',
                    variant: "default"
                });

                // Update local state with the returned user data
                setUserData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        subscription: updatedUser.subscription,
                        billingInterval: updatedUser.billingInterval,
                        credits: updatedUser.credits
                    }
                }));

                // Close the dialog
                setIsChangePlanDialogOpen(false);

                // Refresh user details to get updated data
                const refreshedUserData = await authService.getUserDetails(userId);
                setUserData(refreshedUserData);
            } else {
                throw new Error(data.message || 'Failed to change plan');
            }
        } catch (error: any) {
            console.error('Error changing plan:', error);
            toast({
                title: "Error",
                description: `Failed to change plan: ${error.message || 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setIsSubmittingPlanChange(false);
        }
    };

    if (loading) return <p>Loading user details...</p>;
    if (!userData) return <p>No user data found.</p>;

    const { user, stats, credits, searchHistory } = userData;

    // Calculate what the used search counts would be after adding extra searches
    const currentMonthlyUsed = stats.searchUsage.usage.monthly.used;
    const currentDailyUsed = stats.searchUsage.usage.daily.used;
    const monthlyLimit = stats.searchUsage.limits.monthlySearches;
    const dailyLimit = stats.searchUsage.limits.dailySearches;

    // Calculate new used counts (cannot go below 0)
    const newMonthlyUsed = Math.max(0, currentMonthlyUsed - monthlySearchesToAdd);
    const newDailyUsed = Math.max(0, currentDailyUsed - dailySearchesToAdd);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={() => navigate('/admin/users')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                </Button>

                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsAddSearchesDialogOpen(true)}
                        variant="default"
                    >
                        <Search className="mr-2 h-4 w-4" /> Add Searches
                    </Button>
                    <Button
                        onClick={() => setIsAddCreditsDialogOpen(true)}
                        variant="default"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Credits
                    </Button>
                    <Button
                        onClick={() => setIsChangePlanDialogOpen(true)}
                        variant="default"
                    >
                        <Settings className="mr-2 h-4 w-4" /> Change Plan
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Subscription:</strong> <Badge>{user.subscription}</Badge></div>
                    <div><strong>Credits:</strong> {user.credits}</div>
                    <div><strong>Verified:</strong> {user.isVerified ? 'Yes' : 'No'}</div>
                    <div><strong>Trial Ended:</strong> {user.trialEnded ? 'Yes' : 'No'}</div>
                    <div><strong>Joined:</strong> {formatDate(user.createdAt)}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Search Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p>Monthly Searches: {stats.searchUsage.usage.monthly.used} / {stats.searchUsage.limits.monthlySearches}</p>
                            <Progress value={(stats.searchUsage.usage.monthly.used / stats.searchUsage.limits.monthlySearches) * 100} />
                        </div>
                        <div>
                            <p>Daily Searches: {stats.searchUsage.usage.daily.used} / {stats.searchUsage.limits.dailySearches}</p>
                            <Progress value={(stats.searchUsage.usage.daily.used / stats.searchUsage.limits.dailySearches) * 100} />
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Stripe Subscription Details */}
            {userData.stripeSubscription && (
                <Card>
                    <CardHeader>
                        <CardTitle>Stripe Subscription Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><strong>Subscription ID:</strong> {userData.stripeSubscription.id}</div>
                            <div>
                                <strong>Status:</strong>{' '}
                                <Badge variant={userData.stripeSubscription.status === 'active' ? 'default' : 'secondary'}>
                                    {userData.stripeSubscription.status}
                                </Badge>
                            </div>
                            <div><strong>Customer ID:</strong> {userData.stripeSubscription.customer}</div>
                            <div><strong>Currency:</strong> {userData.stripeSubscription.currency.toUpperCase()}</div>
                            <div><strong>Collection Method:</strong> {userData.stripeSubscription.collection_method}</div>
                            <div><strong>Cancel at Period End:</strong> {userData.stripeSubscription.cancel_at_period_end ? 'Yes' : 'No'}</div>

                            {/* Plan Details */}
                            {userData.stripeSubscription.plan && (
                                <>
                                    <div><strong>Plan Name:</strong> {userData.stripeSubscription.plan.nickname || 'N/A'}</div>
                                    <div><strong>Plan Amount:</strong> ${(userData.stripeSubscription.plan.amount / 100).toFixed(2)}</div>
                                    <div><strong>Billing Interval:</strong> {userData.stripeSubscription.plan.interval}</div>
                                    <div><strong>Plan ID:</strong> {userData.stripeSubscription.plan.id}</div>
                                </>
                            )}

                            {/* Billing Cycle */}
                            <div><strong>Subscription Created:</strong> {formatDate(new Date(userData.stripeSubscription.created * 1000).toISOString())}</div>

                            {/* Current period from subscription items */}
                            {userData.stripeSubscription.items?.data?.[0] && (
                                <>
                                    <div><strong>Current Period Start:</strong> {formatDate(new Date(userData.stripeSubscription.items.data[0].current_period_start * 1000).toISOString())}</div>
                                    <div><strong>Current Period End:</strong> {formatDate(new Date(userData.stripeSubscription.items.data[0].current_period_end * 1000).toISOString())}</div>
                                </>
                            )}

                            {/* Payment Method */}
                            {userData.stripeSubscription.default_payment_method && (
                                <div><strong>Default Payment Method:</strong> {userData.stripeSubscription.default_payment_method}</div>
                            )}

                            {/* Latest Invoice */}
                            {userData.stripeSubscription.latest_invoice && (
                                <div><strong>Latest Invoice:</strong> {userData.stripeSubscription.latest_invoice}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Credit Usage by Operation</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Operation</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Credits Used</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credits.usageByOperation.map((op: any) => (
                                <TableRow key={op.operation}>
                                    <TableCell>{op.operation}</TableCell>
                                    <TableCell>{op.count}</TableCell>
                                    <TableCell>{op.creditsUsed}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credits.recentTransactions.map((tx: any) => (
                                <TableRow key={tx._id}>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell><Badge>{tx.type}</Badge></TableCell>
                                    <TableCell>{tx.amount}</TableCell>
                                    <TableCell>{tx.balance}</TableCell>
                                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {searchHistory && searchHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Search History</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Query</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searchHistory.map((history: any) => (
                                    <TableRow key={history._id}>
                                        <TableCell>{renderQuery(history)}</TableCell>
                                        <TableCell>{formatDate(history.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Add Credits Dialog */}
            <Dialog open={isAddCreditsDialogOpen} onOpenChange={setIsAddCreditsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Credits to User</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="credits">Credits to Add</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    value={creditsToAdd}
                                    onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
                                    min="1"
                                    placeholder="Enter amount of credits"
                                />
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">
                                    Current credits: <span className="font-semibold">{user.credits}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    New total: <span className="font-semibold">{user.credits + creditsToAdd}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCreditsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCredits}
                            disabled={isSubmitting || creditsToAdd <= 0}
                            variant="default"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                                    Processing...
                                </>
                            ) : (
                                'Add Credits'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Searches Dialog */}
            <Dialog open={isAddSearchesDialogOpen} onOpenChange={setIsAddSearchesDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reduce Used Searches Count</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthlySearches">Reduce Monthly Used Searches By</Label>
                                <Input
                                    id="monthlySearches"
                                    type="number"
                                    value={monthlySearchesToAdd}
                                    onChange={(e) => setMonthlySearchesToAdd(parseInt(e.target.value) || 0)}
                                    min="0"
                                    max={currentMonthlyUsed}
                                    placeholder="Enter number of monthly searches"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dailySearches">Reduce Daily Used Searches By</Label>
                                <Input
                                    id="dailySearches"
                                    type="number"
                                    value={dailySearchesToAdd}
                                    onChange={(e) => setDailySearchesToAdd(parseInt(e.target.value) || 0)}
                                    min="0"
                                    max={currentDailyUsed}
                                    placeholder="Enter number of daily searches"
                                />
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">
                                    Monthly limit: <span className="font-semibold">{monthlyLimit}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    Current monthly used: <span className="font-semibold">{currentMonthlyUsed}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    New monthly used: <span className="font-semibold">{newMonthlyUsed}</span>
                                </p>
                                <div className="my-2 border-t border-gray-200"></div>
                                <p className="text-sm text-gray-500">
                                    Daily limit: <span className="font-semibold">{dailyLimit}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    Current daily used: <span className="font-semibold">{currentDailyUsed}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    New daily used: <span className="font-semibold">{newDailyUsed}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddSearchesDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddSearches}
                            disabled={isSubmittingSearches || (monthlySearchesToAdd <= 0 && dailySearchesToAdd <= 0)}
                            variant="default"
                        >
                            {isSubmittingSearches ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                                    Processing...
                                </>
                            ) : (
                                'Reduce Used Searches'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Plan Dialog */}
            <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change User Plan</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan">Select Plan</Label>
                                <Select
                                    value={selectedPlan}
                                    onValueChange={setSelectedPlan}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="explorer">Explorer</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="billingInterval">Select Billing Interval</Label>
                                <Select
                                    value={selectedBillingInterval}
                                    onValueChange={setSelectedBillingInterval}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select billing interval" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">
                                    Current plan: <span className="font-semibold">{user.subscription}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    Current billing: <span className="font-semibold">{user.billingInterval || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangePlanDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangePlan}
                            disabled={isSubmittingPlanChange || !selectedPlan || !selectedBillingInterval}
                            variant="default"
                        >
                            {isSubmittingPlanChange ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                                    Processing...
                                </>
                            ) : (
                                'Change Plan'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserDetailsPage; 