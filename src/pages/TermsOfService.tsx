import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfService: React.FC = () => {
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
                        <FileText className="h-6 w-6 mr-2 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center text-gray-900 dark:text-white">Terms of Service</CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: 2025-07-18
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            By accessing and using SACORE AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">2. Description of Service</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            SACORE AI is a recruitment automation platform that helps users identify, organize, and manage professional profiles from third-party data sources. Results are pulled in real time based on user search inputs. Users may choose to save selected results into projects within the platform. SACORE AI does not permanently store or index any profile data retrieved via external APIs.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">3. User Accounts</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            To access certain features, you must register for an account. You agree to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Provide accurate and current information</li>
                                            <li>Maintain confidentiality of your account and password</li>
                                            <li>Accept responsibility for all activities under your account</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">4. Acceptable Use</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            You agree not to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Violate any applicable laws</li>
                                            <li>Infringe on intellectual property rights</li>
                                            <li>Attempt to reverse-engineer or misuse data sources</li>
                                            <li>Use the service to send spam or unauthorized messages</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">5. Data Protection and Privacy</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We comply with the EU General Data Protection Regulation (GDPR). You can read our full <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> or contact us with any questions regarding data handling.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">6. Subscription and Billing</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Some features require a paid subscription. By subscribing, you agree to the applicable fees. Subscriptions renew automatically unless cancelled.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">7. Intellectual Property</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            All content, features, and platform infrastructure are the property of SACORE AI and are protected by international intellectual property laws.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">8. Limitation of Liability</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            SACORE AI shall not be liable for any indirect or consequential damages, including loss of profits, data, or goodwill.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">9. Termination</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We reserve the right to suspend or terminate access at any time, with or without notice, for violations of these terms.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">10. Modifications</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We may revise these terms at any time. Changes will be posted on this page with an updated effective date.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">11. Disclaimer on External Data</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            SACORE AI does not control or verify the accuracy of data provided by external sources. Users are responsible for evaluating and interpreting results retrieved through the platform.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">12. Contact</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                            For questions about these terms, contact:
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

export default TermsOfService; 