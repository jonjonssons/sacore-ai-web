import React, { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const pricingPlans = [
    {
        name: 'Basic',
        description: 'Perfect for individuals getting started with outreach',
        monthlyPrice: 69,
        annualPrice: 51,
        monthlyFeatures: [
            '500 Credits per month',
            '10 searches per month',
            '5 searches per day',
            '5 Projects at the same time',
            'Credits rollover (max 1 month extra)'
        ],
        annualFeatures: [
            '500 Credits per month',
            '10 searches per month',
            '5 searches per day',
            '5 Projects at the same time',
            'Credits rollover (max 1 month extra)'
        ],
        cta: 'Choose Plan',
        popular: false,
        ctaLink: '/signup'
    },
    {
        name: 'Explorer',
        description: 'Ideal for growing teams with advanced outreach needs',
        monthlyPrice: 200,
        annualPrice: 150,
        monthlyFeatures: [
            '1500 Credits per month',
            '25 searches per month',
            '7 searches per day',
            'Unlimited projects',
            'Credits rollover (max 1 month extra)'
        ],
        annualFeatures: [
            '1500 Credits per month',
            '25 searches per month',
            '7 searches per day',
            'Unlimited projects',
            'Credits rollover (max 1 month extra)'
        ],
        cta: 'Choose Plan',
        popular: true,
        ctaLink: '/signup'
    },
    {
        name: 'Pro',
        description: 'Custom solutions for large teams with complex requirements',
        monthlyPrice: 800,
        annualPrice: 600,
        monthlyFeatures: [
            '6500 Credits per month',
            '50 searches per month',
            '10 searches per day',
            'Unlimited projects',
            'Credits rollover (max 1 month extra)'
        ],
        annualFeatures: [
            '6500 Credits per month',
            '50 searches per month',
            '10 searches per day',
            'Unlimited projects',
            'Credits rollover (max 1 month extra)',
            'Dedicated Account Manager'
        ],
        cta: 'Choose Plan',
        popular: false,
        ctaLink: '/signup'
    }
];

const Pricing: React.FC = () => {
    const [annual, setAnnual] = useState(true);

    return (
        <>
            <Header />
            <section id="pricing" className="section py-20 md:py-32 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        {/* <h2 className="mb-6 text-4xl md:text-5xl font-bold text-black">
                            Simple Pricing,<br />Powerful Results
                        </h2> */}
                        <h2 className="text-3xl text-gray-600 mb-8">
                            Choose the perfect plan for your needs
                        </h2>

                        <div className="flex items-center justify-center space-x-3">
                            <span className={annual ? 'text-gray-500' : 'text-black font-medium'}>Monthly</span>
                            <Switch
                                checked={annual}
                                onCheckedChange={setAnnual}
                                className="data-[state=checked]:bg-black"
                            />
                            <span className={!annual ? 'text-gray-500' : 'text-black font-medium'}>
                                Annual <span className="ml-1 text-sm text-gray-500">~25% saved</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <Card
                                key={index}
                                className={`border rounded-none overflow-hidden transition-all duration-300 ${plan.popular
                                    ? 'shadow-xl relative border-black transform md:-translate-y-4'
                                    : 'shadow-sm hover:shadow-md'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold py-1 px-3">
                                        Popular
                                    </div>
                                )}

                                <div className="p-8">
                                    <h3 className="text-xl font-bold mb-2 text-black">{plan.name}</h3>
                                    <p className="text-gray-600 text-sm mb-6 h-12">{plan.description}</p>

                                    <div className="mb-6">
                                        <div className="text-4xl font-bold text-black">
                                            ${annual ? plan.annualPrice : plan.monthlyPrice}
                                        </div>
                                        <div className="text-gray-500 text-sm">per user / month</div>
                                    </div>

                                    <Link to={plan.ctaLink}>
                                        <Button
                                            className={`w-full mb-8 rounded-none ${plan.popular
                                                ? 'bg-black hover:bg-gray-900 text-white'
                                                : 'bg-white hover:bg-gray-50 text-black border border-black'
                                                }`}
                                        >
                                            {plan.cta}
                                        </Button>
                                    </Link>

                                    <div className="space-y-4">
                                        {(annual ? plan.annualFeatures : plan.monthlyFeatures).map((feature, idx) => (
                                            <div key={idx} className="flex items-start">
                                                <div className="mr-3 mt-1">
                                                    <Check className="h-4 w-4 text-black" />
                                                </div>
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="max-w-3xl mx-auto mt-16 text-center">
                        <TooltipProvider>
                            <div className="text-xl mb-2 flex items-center justify-center">
                                <span className="text-black">Have questions about pricing?</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" className="p-0 h-auto mx-2">
                                            <HelpCircle className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Our sales team is happy to answer any questions about our pricing plans or to provide a custom quote.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <p className="text-gray-600 mb-8">
                            All plans include a 7-day free trial. No credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link to="/contact">
                                <Button variant="ghost" className="border-black text-black hover:bg-gray-50 rounded-none">
                                    Contact Sales
                                </Button>
                            </Link>
                            <Link to="/compare-plans">
                                <Button variant="link" className="text-black hover:text-gray-600">
                                    Compare Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default Pricing;
