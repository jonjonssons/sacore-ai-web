import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
            <Header />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Shield className="h-6 w-6 mr-2 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center text-gray-900 dark:text-white">Privacy Policy</CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: 2025-07-18
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">1. Overview</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This Privacy Policy explains how SACORE AI processes data in accordance with GDPR. We prioritize privacy, transparency, and user control.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">2. What We Collect</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We collect:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Account information: name, email, password, organization</li>
                                            <li>Usage data: searches performed, number of profiles viewed</li>
                                            <li>Billing data: payment details (processed by secure third-party providers)</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">3. How Data is Used</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We use data to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Provide platform functionality</li>
                                            <li>Monitor fair use and manage credits</li>
                                            <li>Deliver customer support</li>
                                            <li>Comply with legal obligations</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">4. Profile Data Processing</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            When you perform searches, SACORE AI pulls real-time data from external APIs. This data:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Is shown temporarily during your session</li>
                                            <li>Can be saved to your personal projects</li>
                                            <li>Is not stored or reused by SACORE AI outside of your account</li>
                                            <li>Is deleted after the session ends if not saved by you</li>
                                        </ul>
                                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                                <strong>Important:</strong> SACORE AI does not own or permanently store any external profile data. The user is responsible for any saved data within their project space.
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                                                SACORE AI acts as a data processor when accessing external profile data. The user initiating the search is the data controller for any information they choose to view or store.
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">5. Legal Basis (GDPR)</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We process personal data based on:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Your consent</li>
                                            <li>Performance of a contract</li>
                                            <li>Legitimate interest in improving our services</li>
                                            <li>Compliance with legal obligations</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">6. Data Sharing</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We do not sell or share personal data. Limited sharing may occur with:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Payment processors</li>
                                            <li>Service providers who help us operate</li>
                                            <li>Authorities, when legally required</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">7. Data Security</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We use encryption, access controls, and internal policies to protect your data.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">8. Your Rights</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Under GDPR, you have the right to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Access your data</li>
                                            <li>Correct inaccurate information</li>
                                            <li>Request deletion ("right to be forgotten")</li>
                                            <li>Object to or limit processing</li>
                                            <li>Withdraw consent</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">9. Data Retention</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We retain:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Account data: until account deletion + 30 days</li>
                                            <li>Usage logs: up to 12 months</li>
                                            <li>Billing records: 7 years (legal requirement)</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">10. Cookies</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We use cookies to enable core functionality and improve the user experience. You can manage cookie settings in your browser.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">11. Contact</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                            For privacy-related questions or to exercise your rights:
                                        </p>
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

export default PrivacyPolicy; 