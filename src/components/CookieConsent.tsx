import React, { useState, useEffect } from 'react';
import { X, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface CookieConsentProps {
    onConsentGiven: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onConsentGiven }) => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true, // Always enabled
        functional: true,
        analytics: false,
        marketing: false
    });

    useEffect(() => {
        // Check if user has already given consent
        const existingConsent = localStorage.getItem('cookieConsent');
        if (!existingConsent) {
            // Show banner after a short delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const allAccepted: CookiePreferences = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true
        };
        saveConsent(allAccepted);
    };

    const handleAcceptNecessary = () => {
        const necessaryOnly: CookiePreferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false
        };
        saveConsent(necessaryOnly);
    };

    const handleSavePreferences = () => {
        saveConsent(preferences);
    };

    const saveConsent = (cookiePrefs: CookiePreferences) => {
        localStorage.setItem('cookieConsent', 'true');
        localStorage.setItem('cookiePreferences', JSON.stringify(cookiePrefs));
        onConsentGiven(cookiePrefs);
        setIsVisible(false);
    };

    const handlePreferenceChange = (category: keyof CookiePreferences, enabled: boolean) => {
        if (category === 'necessary') return; // Cannot disable necessary cookies

        setPreferences(prev => ({
            ...prev,
            [category]: enabled
        }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed bottom-0 left-0 right-0 p-4">
                <Card className="max-w-4xl mx-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
                    <CardContent className="p-6">
                        {!showSettings ? (
                            // Simple consent banner
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Cookie className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            We use cookies to enhance your experience
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            We use cookies to personalize content, provide social media features, and analyze our traffic.
                                            You can choose which cookies to accept. Some cookies are necessary for the website to function properly.
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsVisible(false)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-between items-center">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={handleAcceptAll}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Accept All Cookies
                                        </Button>
                                        <Button
                                            onClick={handleAcceptNecessary}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Only Necessary
                                        </Button>
                                        <Button
                                            onClick={() => setShowSettings(true)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1"
                                        >
                                            <Settings className="h-3 w-3" />
                                            Customize
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/cookie-policy')}
                                        variant="link"
                                        size="sm"
                                        className="text-xs text-gray-500 dark:text-gray-400 p-0 h-auto"
                                    >
                                        Learn more about cookies
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Detailed settings
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Cookie Preferences
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsVisible(false)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Choose which cookies you want to accept. You can change these settings at any time.
                                </p>

                                <div className="space-y-3">
                                    {/* Necessary Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-sm text-gray-900 dark:text-white">Necessary Cookies</h4>
                                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                    Always Active
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Essential for website functionality and security.
                                            </p>
                                        </div>
                                        <Switch checked={true} disabled />
                                    </div>

                                    {/* Functional Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Functional Cookies</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Enable enhanced features like chat widgets and social media.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.functional}
                                            onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                                        />
                                    </div>

                                    {/* Analytics Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Analytics Cookies</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Help us understand how visitors use our website.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.analytics}
                                            onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                                        />
                                    </div>

                                    {/* Marketing Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Marketing Cookies</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Used to show you relevant advertisements.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.marketing}
                                            onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                                        />
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="flex flex-wrap gap-2 justify-between items-center">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSavePreferences}
                                            size="sm"
                                        >
                                            Save Preferences
                                        </Button>
                                        <Button
                                            onClick={() => setShowSettings(false)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/cookie-policy')}
                                        variant="link"
                                        size="sm"
                                        className="text-xs text-gray-500 dark:text-gray-400 p-0 h-auto"
                                    >
                                        View Cookie Policy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CookieConsent; 