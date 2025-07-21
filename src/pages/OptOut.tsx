import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OptOut: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'initial' | 'form' | 'submitted'>('initial');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRemoveDataClick = () => {
        setStep('form');
    };

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim() || !name.trim()) {
            toast.error('Please fill in both name and email address');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Here you would normally send the opt-out request to your backend
            // The request should include name and email for company notification
            const requestData = {
                name: name.trim(),
                email: email.trim(),
                timestamp: new Date().toISOString(),
                type: 'data_removal_request'
            };
            
            // Simulate API call to notify company
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In real implementation, this would send email to company:
            // - To: privacy@sacore.ai or admin email
            // - Subject: "GDPR Data Removal Request"
            // - Body: Include user details and timestamp
            
            setStep('submitted');
            toast.success('Your data removal request has been submitted successfully');
        } catch (error) {
            toast.error('Failed to submit request. Please try again or contact us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'submitted') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="py-16">
                    <div className="max-w-2xl mx-auto px-4">
                        <Card>
                            <CardContent className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                    Request Submitted Successfully
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    Your data removal request has been received and will be processed within 30 days as required by GDPR.
                                    You will receive a confirmation email shortly.
                                </p>
                                <Button onClick={() => navigate('/')} variant="outline">
                                    Back to Home
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (step === 'form') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                
                <div className="py-16">
                    <div className="max-w-2xl mx-auto px-4">
                        <Card>
                            <CardContent className="py-12">
                                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                                    Remove my data
                                </h1>
                                
                                <p className="text-gray-700 leading-relaxed mb-8 text-center max-w-lg mx-auto">
                                    Please provide your details so we can process your data removal request.
                                </p>
                                
                                <form onSubmit={handleSubmitForm} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            required
                                            className="w-full"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            This should be the email address associated with your data in our systems.
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex-1 bg-black hover:bg-gray-800 text-white"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                                    Submitting Request...
                                                </>
                                            ) : (
                                                'Submit Data Removal Request'
                                            )}
                                        </Button>
                                        
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setStep('initial')}
                                            className="flex-1"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="py-16">
                <div className="max-w-2xl mx-auto px-4">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-8">
                                Remove my data
                            </h1>
                            
                            <p className="text-gray-700 leading-relaxed mb-8 max-w-lg mx-auto">
                                In accordance with the EU's General Data Protection Regulation (GDPR), you can at any time opt out of being contacted by SACORE AI or any of our users. For questions regarding GDPR or our data policy, please read more <a href="/privacy-policy" className="text-blue-600 hover:underline">here</a> or contact us.
                            </p>
                            
                            <Button 
                                onClick={handleRemoveDataClick}
                                disabled={isSubmitting}
                                size="lg"
                                className="bg-black hover:bg-gray-800 text-white px-8 py-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    'Remove my data'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default OptOut; 