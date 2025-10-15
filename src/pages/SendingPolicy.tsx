import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SendingPolicy: React.FC = () => {
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
                        <Send className="h-6 w-6 mr-2 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sending Policy</h1>
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center text-gray-900 dark:text-white">SACORE AI Sending Policy</CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: {new Date().toISOString().split('T')[0]}
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">1. Purpose</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This Sending Policy outlines the rules and best practices for using SACORE AI's email and LinkedIn messaging capabilities. Our goal is to ensure responsible, compliant, and effective outreach that respects recipients and maintains the integrity of our platform.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">2. Acceptable Use</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            You may use SACORE AI for:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Professional recruitment outreach</li>
                                            <li>Business-to-business sales prospecting</li>
                                            <li>Networking and partnership development</li>
                                            <li>Event invitations to relevant professionals</li>
                                            <li>Job opportunity notifications</li>
                                            <li>Content distribution to opted-in audiences</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">3. Prohibited Activities</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            The following activities are strictly prohibited:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Spam:</strong> Sending unsolicited bulk messages or irrelevant content</li>
                                            <li><strong>Deceptive content:</strong> Misleading subject lines, fake sender information, or phishing attempts</li>
                                            <li><strong>Harassment:</strong> Repeated unwanted contact after opt-out requests</li>
                                            <li><strong>Illegal content:</strong> Promoting illegal activities, scams, or fraudulent schemes</li>
                                            <li><strong>Malware distribution:</strong> Sending malicious attachments or links</li>
                                            <li><strong>Copyright infringement:</strong> Distributing copyrighted material without permission</li>
                                            <li><strong>Personal data harvesting:</strong> Collecting personal information for unauthorized purposes</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">4. Rate Limits & Sending Best Practices</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            To ensure deliverability and platform integrity:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Start slowly:</strong> Use our recommended delay settings (20 minutes for LinkedIn invitations, 5-10 minutes for messages)</li>
                                            <li><strong>Warm up accounts:</strong> Gradually increase sending volume over several weeks</li>
                                            <li><strong>Monitor engagement:</strong> Track open rates, reply rates, and adjust your approach accordingly</li>
                                            <li><strong>Respect limits:</strong> Adhere to LinkedIn and email provider sending limits</li>
                                            <li><strong>Quality over quantity:</strong> Focus on targeted, personalized outreach rather than mass blasting</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">5. Content Guidelines</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            All messages sent through SACORE AI must:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Be truthful and not misleading</li>
                                            <li>Clearly identify you as the sender</li>
                                            <li>Include a clear way to opt-out or unsubscribe</li>
                                            <li>Be relevant to the recipient's professional interests</li>
                                            <li>Comply with CAN-SPAM, GDPR, and other applicable laws</li>
                                            <li>Maintain professional tone and language</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">6. Email-Specific Requirements</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            For email campaigns:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Include a valid physical postal address</li>
                                            <li>Provide a one-click unsubscribe mechanism</li>
                                            <li>Honor opt-out requests within 10 business days</li>
                                            <li>Use accurate "From," "To," and "Reply-To" headers</li>
                                            <li>Avoid trigger words that may flag spam filters</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">7. LinkedIn-Specific Requirements</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            For LinkedIn outreach:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Comply with LinkedIn's User Agreement and Professional Community Policies</li>
                                            <li>Only connect with people you have a genuine reason to contact</li>
                                            <li>Personalize connection requests and messages</li>
                                            <li>Respect LinkedIn's automation policies and rate limits</li>
                                            <li>Do not scrape or export LinkedIn data beyond what's allowed</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">8. List Management</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            You are responsible for:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Maintaining clean, up-to-date contact lists</li>
                                            <li>Removing bounced or invalid email addresses</li>
                                            <li>Honoring suppression lists and do-not-contact requests</li>
                                            <li>Segmenting audiences appropriately</li>
                                            <li>Properly managing consent and permissions</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">9. Monitoring & Enforcement</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI reserves the right to:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Monitor account activity for policy compliance</li>
                                            <li>Investigate complaints of abuse or spam</li>
                                            <li>Suspend or terminate accounts violating this policy</li>
                                            <li>Report illegal activities to authorities</li>
                                            <li>Cooperate with ISPs and platform providers on abuse reports</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">10. Consequences of Violations</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Violations may result in:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Warning and mandatory policy review</li>
                                            <li>Temporary account suspension</li>
                                            <li>Permanent account termination without refund</li>
                                            <li>Legal action for damages or regulatory violations</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">11. Reporting Abuse</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            If you receive spam or abusive messages from a SACORE AI user, please report it to <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a> with full message headers and details. We take all reports seriously and investigate promptly.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">12. Updates to This Policy</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            We may update this Sending Policy periodically. Continued use of SACORE AI after changes constitutes acceptance of the updated policy. Check this page regularly for the latest version.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">13. Contact Us</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Questions about this Sending Policy? Contact us at <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a>
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

export default SendingPolicy;

