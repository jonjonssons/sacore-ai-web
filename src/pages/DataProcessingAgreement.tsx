import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DataProcessingAgreement: React.FC = () => {
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Processing Agreement</h1>
                    </div>

                    <div className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-lg text-center text-gray-900 dark:text-white">Data Processing Agreement (DPA)</CardTitle>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    GDPR-Compliant Data Processing Terms
                                </p>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                    Last updated: {new Date().toISOString().split('T')[0]}
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6 text-sm">
                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">1. Introduction</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This Data Processing Agreement ("DPA") forms part of the SACORE AI Terms of Service and governs the processing of personal data on behalf of the Customer ("Controller") by SACORE AI ("Processor") in accordance with the General Data Protection Regulation (GDPR) EU 2016/679 and other applicable data protection laws.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">2. Definitions</h2>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person processed through SACORE AI services</li>
                                            <li><strong>"Data Subject"</strong> means an individual whose personal data is processed</li>
                                            <li><strong>"Controller"</strong> means the Customer who determines the purposes and means of processing</li>
                                            <li><strong>"Processor"</strong> means SACORE AI, who processes personal data on behalf of the Controller</li>
                                            <li><strong>"Sub-processor"</strong> means any third party engaged by SACORE AI to process personal data</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">3. Scope and Purpose of Processing</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI processes personal data solely to provide the following services:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Candidate and prospect search and enrichment</li>
                                            <li>Email and LinkedIn outreach campaign management</li>
                                            <li>Contact data storage and management</li>
                                            <li>Communication tracking and analytics</li>
                                            <li>CRM integrations and data synchronization</li>
                                        </ul>
                                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                                            <strong>Duration:</strong> For the term of the subscription and up to 30 days after termination (unless extended retention is required by law).
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">4. Types of Personal Data</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Categories of personal data processed:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Contact Information:</strong> Names, email addresses, phone numbers, LinkedIn profiles</li>
                                            <li><strong>Professional Information:</strong> Job titles, companies, work experience, education</li>
                                            <li><strong>Communication Data:</strong> Message content, open/click tracking, response data</li>
                                            <li><strong>Account Information:</strong> User credentials, preferences, billing information</li>
                                            <li><strong>Technical Data:</strong> IP addresses, device information, usage analytics</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">5. Data Subjects</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Categories of data subjects:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Job candidates and prospects</li>
                                            <li>Business contacts and leads</li>
                                            <li>Customer employees and users</li>
                                            <li>Newsletter and content subscribers</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">6. Controller Obligations</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            The Customer (Controller) represents and warrants that it:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Has obtained all necessary consents and legal bases for processing</li>
                                            <li>Complies with all applicable data protection laws</li>
                                            <li>Has provided appropriate privacy notices to data subjects</li>
                                            <li>Shall only provide lawfully obtained personal data to SACORE AI</li>
                                            <li>Is responsible for the accuracy and legality of data uploaded</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">7. Processor Obligations</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI (Processor) shall:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Process personal data only on documented instructions from the Controller</li>
                                            <li>Ensure persons authorized to process data are bound by confidentiality</li>
                                            <li>Implement appropriate technical and organizational security measures</li>
                                            <li>Engage sub-processors only with prior written authorization</li>
                                            <li>Assist with data subject rights requests</li>
                                            <li>Assist with security incidents and data breach notifications</li>
                                            <li>Delete or return personal data upon termination</li>
                                            <li>Make available information necessary to demonstrate compliance</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">8. Security Measures</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI implements the following security measures:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Encryption:</strong> Data encrypted in transit (TLS) and at rest (AES-256)</li>
                                            <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication</li>
                                            <li><strong>Infrastructure:</strong> Secure cloud hosting with tier-certified data centers</li>
                                            <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
                                            <li><strong>Backups:</strong> Regular encrypted backups with secure recovery procedures</li>
                                            <li><strong>Testing:</strong> Regular security audits and penetration testing</li>
                                            <li><strong>Training:</strong> Ongoing security awareness training for staff</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">9. Sub-processors</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI may engage the following categories of sub-processors:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Cloud infrastructure providers (e.g., AWS, Google Cloud)</li>
                                            <li>Email delivery services</li>
                                            <li>Data enrichment and verification services</li>
                                            <li>Analytics and monitoring tools</li>
                                            <li>Customer support software</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">10. Data Subject Rights</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            SACORE AI will assist the Controller in responding to data subject requests:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li><strong>Access:</strong> Provide copies of personal data upon request</li>
                                            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                                            <li><strong>Erasure:</strong> Delete data (right to be forgotten)</li>
                                            <li><strong>Restriction:</strong> Limit processing in certain circumstances</li>
                                            <li><strong>Portability:</strong> Export data in machine-readable format</li>
                                            <li><strong>Objection:</strong> Object to processing for direct marketing</li>
                                        </ul>
                                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                                            Data subjects should submit requests to the Controller (Customer). If received directly, SACORE AI will forward to the Controller within 2 business days.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">11. Data Breach Notification</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            In the event of a personal data breach, SACORE AI will notify the Controller without undue delay and no later than 72 hours after becoming aware of the breach. The notification will include:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3 mt-2">
                                            <li>Nature of the breach and affected data categories</li>
                                            <li>Likely consequences of the breach</li>
                                            <li>Measures taken or proposed to address the breach</li>
                                            <li>Contact point for further information</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">12. International Data Transfers</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Personal data may be transferred to and processed in countries outside the European Economic Area (EEA). SACORE AI ensures such transfers comply with GDPR through:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3 mt-2">
                                            <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                                            <li>Adequacy decisions where applicable</li>
                                            <li>Additional safeguards where required</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">13. Audits and Inspections</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            SACORE AI shall allow audits, including inspections, by the Controller or an auditor mandated by the Controller, subject to reasonable notice (at least 30 days) and confidentiality obligations. SACORE AI may charge reasonable fees for extensive audit requests.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">14. Data Retention and Deletion</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            Upon termination or expiration of services:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-3">
                                            <li>Controller may export data for 30 days after termination</li>
                                            <li>After 30 days, all personal data will be securely deleted</li>
                                            <li>Deletion includes all backups unless legally required to retain</li>
                                            <li>Confirmation of deletion provided upon request</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">15. Liability and Indemnification</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Each party's liability under this DPA is subject to the limitation of liability provisions in the Terms of Service. The Controller agrees to indemnify SACORE AI for any claims arising from the Controller's violation of data protection laws or unauthorized instructions.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">16. Governing Law</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This DPA is governed by the laws of the jurisdiction specified in the Terms of Service, with additional application of GDPR and applicable EU member state data protection laws.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">17. Contact Information</h2>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                            <p className="text-gray-600 dark:text-gray-400"><strong>Data Protection Officer:</strong></p>
                                            <p className="text-gray-600 dark:text-gray-400">For data subject requests: <a href="mailto:jon@sacore.io" className="text-blue-600 dark:text-blue-400 hover:underline">jon@sacore.io</a></p>
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

export default DataProcessingAgreement;

