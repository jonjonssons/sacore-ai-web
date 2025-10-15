import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AntiAbuseProtection: React.FC = () => {
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
                        <ShieldAlert className="h-6 w-6 mr-2 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anti-Abuse Protection</h1>
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center text-gray-900 dark:text-white">Anti-Abuse Protection Policy</CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: {new Date().toISOString().split('T')[0]}
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">1. Our Commitment</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            SACORE AI is committed to maintaining a safe, trustworthy platform for professional outreach. We have implemented comprehensive anti-abuse measures to prevent spam, protect user accounts, and ensure compliance with industry standards and regulations.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">2. Built-in Safety Features</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Our platform includes automated protections:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Rate Limiting:</strong> Default delays between actions to mimic natural human behavior</li>
                                            <li><strong>Daily Caps:</strong> Maximum sends per day to prevent account flagging (15 LinkedIn invites, 50 messages, 70 visits recommended)</li>
                                            <li><strong>Working Hours:</strong> Optional scheduling to send only during business hours</li>
                                            <li><strong>Randomization:</strong> Variable delays to avoid detection patterns</li>
                                            <li><strong>Account Health Monitoring:</strong> Alerts when unusual activity is detected</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">3. Real-Time Abuse Detection</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We actively monitor for:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Unusually high sending volumes</li>
                                            <li>Repetitive message content patterns</li>
                                            <li>High bounce or complaint rates</li>
                                            <li>Multiple accounts from the same source</li>
                                            <li>Suspicious login activity</li>
                                            <li>Automated bot-like behavior</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">4. User Verification</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            To prevent fraud and abuse:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Email verification required for all accounts</li>
                                            <li>Payment verification for subscription plans</li>
                                            <li>Two-factor authentication available</li>
                                            <li>Identity verification for high-volume users</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">5. Content Filtering</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Our AI-powered filters detect and prevent:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Spam trigger words and phrases</li>
                                            <li>Malicious links or attachments</li>
                                            <li>Phishing attempts</li>
                                            <li>Misleading subject lines</li>
                                            <li>Inappropriate or offensive content</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">6. Complaint Handling</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We take all abuse reports seriously:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>24-hour response time:</strong> All abuse reports reviewed within one business day</li>
                                            <li><strong>Thorough investigation:</strong> Full account audit when abuse is reported</li>
                                            <li><strong>Swift action:</strong> Immediate suspension for severe violations</li>
                                            <li><strong>Transparency:</strong> Users informed of investigation outcomes</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">7. Suppression Lists</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We maintain:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Global unsubscribe list across all accounts</li>
                                            <li>Bounce list for invalid addresses</li>
                                            <li>Complaint list for users who reported spam</li>
                                            <li>Do-not-contact registry</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">8. Third-Party Integrations</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We work with industry partners:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Email reputation monitoring services</li>
                                            <li>Spam complaint feedback loops</li>
                                            <li>Anti-fraud and security providers</li>
                                            <li>LinkedIn and email platform APIs</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">9. User Education</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            We provide:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Best practice guides for safe sending</li>
                                            <li>Safety recommendations in campaign settings</li>
                                            <li>Warning indicators for risky configurations</li>
                                            <li>Regular compliance updates and reminders</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">10. Enforcement Actions</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Based on violation severity, we may:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Level 1:</strong> Warning email and mandatory policy review</li>
                                            <li><strong>Level 2:</strong> Temporary account suspension (24-72 hours)</li>
                                            <li><strong>Level 3:</strong> Extended suspension with compliance training required</li>
                                            <li><strong>Level 4:</strong> Permanent account termination without refund</li>
                                            <li><strong>Level 5:</strong> Legal action and reporting to authorities</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">11. Appeals Process</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            If your account is suspended:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>You will receive notification with specific violation details</li>
                                            <li>You may appeal within 7 days to <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a></li>
                                            <li>Include evidence and explanation with your appeal</li>
                                            <li>Appeals reviewed by senior compliance team</li>
                                            <li>Decision typically rendered within 3-5 business days</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">12. Reporting Abuse</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                            To report spam or abuse from a SACORE AI user:
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                            <p className="text-gray-600 dark:text-gray-400"><strong>Email:</strong> <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a></p>
                                            <p className="text-gray-600 dark:text-gray-400"><strong>Include:</strong> Full message headers, sender details, and description of violation</p>
                                            <p className="text-gray-600 dark:text-gray-400"><strong>Response Time:</strong> Within 24 hours</p>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">13. Continuous Improvement</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We regularly update our anti-abuse systems based on emerging threats, industry best practices, and user feedback. Our security team monitors the latest trends in email and social media abuse to stay ahead of bad actors.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">14. Contact Information</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Questions about our anti-abuse measures? Contact our Trust & Safety team at <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a>
                                        </p>
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

export default AntiAbuseProtection;

