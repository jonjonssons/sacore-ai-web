import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import authService from '@/services/authService';

// PricingDialog Component
const PricingDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; userData: any; }> = ({ open, onOpenChange, userData }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlan, setCurrentPlan] = useState<{ name: string; billingInterval: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null); // Track which plan is processing
    const [annual, setAnnual] = useState(true); // Add annual/monthly toggle
    const { isDarkMode } = useTheme();

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
            ? (annual ? matchingPlan.yearly?.priceId : matchingPlan.monthly?.priceId)
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

    // Define plan types to display
    const planTypes = ['basic', 'explorer', 'pro'];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-5xl max-h-[90vh] overflow-y-auto p-8 backdrop-blur-md rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-[#1a1a1a]/90 border-gray-700' : 'bg-white/100 border-gray-300'
                    }`}
            >
                <DialogHeader>
                    <DialogTitle className="sr-only">Pricing Plans</DialogTitle>

                    {/* Pricing Toggle */}
                    <div className="text-center mb-8">
                        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Choose the perfect plan for your needs
                        </h2>
                        <div className="flex items-center justify-center space-x-3">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${!annual ? 'font-semibold' : ''}`}>Monthly</span>
                            <button
                                onClick={() => setAnnual(!annual)}
                                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${annual ? 'bg-green-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${annual ? 'font-semibold' : ''}`}>
                                Annual <span className="text-green-500 font-semibold">Save 25%</span>
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                        <span className={`ml-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Loading plans...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-4`}>{error}</p>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {planTypes.map(planType => {
                            const plan = getPlanDetails(planType);
                            const isPro = planType === 'pro';

                            return (
                                <div
                                    key={plan.key}
                                    className={`relative overflow-hidden rounded-xl border ${isPro
                                        ? isDarkMode
                                            ? 'border-yellow-500 bg-gradient-to-b from-gray-900 to-gray-800'
                                            : 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white'
                                        : isDarkMode
                                            ? plan.isCurrent
                                                ? 'border-blue-500 bg-gray-900'
                                                : 'border-gray-700 bg-gray-900'
                                            : plan.isCurrent
                                                ? 'border-blue-200 bg-blue-50'
                                                : 'bg-white border-gray-200'
                                        } p-6`}
                                >
                                    {isPro && !plan.isCurrent && (
                                        <div className={`absolute top-0 right-0 mt-4 mr-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                            <span className="flex items-center text-xs font-bold">
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                MOST POPULAR
                                            </span>
                                        </div>
                                    )}

                                    {plan.isCurrent && (
                                        <div className={`absolute top-0 right-0 mt-4 mr-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            <span className="flex items-center text-xs font-bold">
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                CURRENT PLAN
                                            </span>
                                        </div>
                                    )}

                                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.title}</h3>
                                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{plan.description}</p>

                                    <div className="mb-4">
                                        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                                    </div>

                                    {annual && (
                                        <div className="mb-4 text-sm">
                                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Billed annually (${plan.annualPrice * 12}/year)
                                            </span>
                                            <span className="text-green-500 ml-2">Save ${Math.round((plan.monthlyPrice - plan.annualPrice) * 12)}</span>
                                        </div>
                                    )}

                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start">
                                                <Check className={`h-5 w-5 mr-2 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full ${isPro
                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                            : plan.isCurrent
                                                ? isDarkMode
                                                    ? 'bg-gray-700 text-gray-300'
                                                    : 'bg-gray-200 text-gray-500'
                                                : ''
                                            }`}
                                        disabled={plan.isCurrent || processingPlan === planType}
                                        onClick={() => handleChoosePlan(planType)}
                                    >
                                        {processingPlan === planType ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Processing...
                                            </>
                                        ) : plan.isCurrent ? (
                                            'Current Plan'
                                        ) : plan.isUpgrade ? (
                                            'Upgrade'
                                        ) : (
                                            'Choose Plan'
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PricingDialog; 