import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cookie, Settings, Shield, Eye, BarChart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useCookiePreferences, type CookiePreferences } from '@/hooks/useCookiePreferences';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CookiePolicy: React.FC = () => {
    const navigate = useNavigate();
    const { preferences, updatePreferences } = useCookiePreferences();
    const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>({
        necessary: true, // Always enabled
        functional: true,
        analytics: true,
        marketing: false
    });

    // Load existing preferences when component mounts
    useEffect(() => {
        if (preferences) {
            setCookiePreferences(preferences);
        }
    }, [preferences]);

    const handlePreferenceChange = (category: string, enabled: boolean) => {
        if (category === 'necessary') return; // Cannot disable necessary cookies

        setCookiePreferences(prev => ({
            ...prev,
            [category]: enabled
        }));
    };

    const saveCookiePreferences = () => {
        updatePreferences(cookiePreferences);
        localStorage.setItem('cookieConsent', 'true');
        toast.success('Cookie preferences saved successfully');
    };

    const acceptAllCookies = () => {
        const allAccepted: CookiePreferences = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true
        };
        setCookiePreferences(allAccepted);
        updatePreferences(allAccepted);
        localStorage.setItem('cookieConsent', 'true');
        toast.success('All cookies accepted');
    };

    const rejectOptionalCookies = () => {
        const onlyNecessary: CookiePreferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false
        };
        setCookiePreferences(onlyNecessary);
        updatePreferences(onlyNecessary);
        localStorage.setItem('cookieConsent', 'true');
        toast.success('Optional cookies rejected');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
            <Header />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    {/* Header */}


                    <div className="space-y-6 mt-12">
                        {/* Cookie Preferences Card */}
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Settings className="h-5 w-5" />
                                    Cookie Preferences
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Manage your cookie preferences. You can change these settings at any time.
                                </p>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {/* Necessary Cookies */}
                                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Necessary Cookies</h3>
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                                Always Active
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Essential for the website to function properly.
                                        </p>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>

                                {/* Functional Cookies */}
                                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Functional Cookies</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Enable enhanced functionality and personalization.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={cookiePreferences.functional}
                                        onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                                    />
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BarChart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Analytics Cookies</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Help us understand visitor interactions anonymously.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={cookiePreferences.analytics}
                                        onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                                    />
                                </div>

                                {/* Marketing Cookies */}
                                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Marketing Cookies</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Track visitors to display relevant advertisements.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={cookiePreferences.marketing}
                                        onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                                    />
                                </div>

                                <Separator className="border-gray-200 dark:border-gray-700" />

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={saveCookiePreferences} size="sm" className="flex-1">
                                        Save Preferences
                                    </Button>
                                    <Button onClick={acceptAllCookies} variant="outline" size="sm" className="flex-1">
                                        Accept All
                                    </Button>
                                    <Button onClick={rejectOptionalCookies} variant="outline" size="sm" className="flex-1">
                                        Reject Optional
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cookie Policy Content */}
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                                    <Cookie className="h-5 w-5" />
                                    Cookie Policy
                                </CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: {new Date().toLocaleDateString()}
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">What Are Cookies?</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Cookies are small text files placed on your device when you visit a website.
                                            They help websites work efficiently and provide information to website owners.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">How We Use Cookies</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">Sacore AI uses cookies for:</p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Essential operations like authentication and security</li>
                                            <li>Performance monitoring and improvement</li>
                                            <li>User experience and personalization</li>
                                            <li>Marketing and advertisement delivery</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Types of Cookies</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">Necessary</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                                                    Essential for website function
                                                </p>
                                            </div>

                                            <div className="p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">Functional</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                                                    Enhanced functionality & personalization
                                                </p>
                                            </div>

                                            <div className="p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">Analytics</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                                                    Anonymous usage insights
                                                </p>
                                            </div>

                                            <div className="p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">Marketing</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                                                    Relevant advertisements
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Third-Party Services</h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                                                <h4 className="font-medium text-xs text-gray-900 dark:text-white">Google Analytics</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Usage tracking</p>
                                            </div>
                                            <div className="border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                                                <h4 className="font-medium text-xs text-gray-900 dark:text-white">Intercom</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Customer support</p>
                                            </div>
                                            <div className="border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                                                <h4 className="font-medium text-xs text-gray-900 dark:text-white">Stripe</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Payment processing</p>
                                            </div>
                                            <div className="border border-gray-200 dark:border-gray-700 p-2 rounded-md">
                                                <h4 className="font-medium text-xs text-gray-900 dark:text-white">LinkedIn</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Integration features</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Managing Cookies</h2>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Use our Cookie Preferences above</li>
                                            <li>Control cookies through browser settings</li>
                                            <li>Use industry opt-out tools</li>
                                            <li>Clear existing cookies from browser</li>
                                        </ul>

                                        <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md mt-3 bg-gray-50 dark:bg-gray-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                <strong>Note:</strong> Blocking cookies may affect functionality and user experience.
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Cookie Retention</h2>
                                        <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md">
                                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                <li><strong>Session Cookies:</strong> Deleted when browser closes</li>
                                                <li><strong>Persistent Cookies:</strong> Remain until expiry or deletion</li>
                                                <li><strong>Authentication:</strong> Typically 30 days</li>
                                                <li><strong>Analytics:</strong> Usually 2 years</li>
                                            </ul>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Contact Us</h2>
                                        <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                                <p><strong>Email:</strong> jon@sacore.io</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CookiePolicy; 