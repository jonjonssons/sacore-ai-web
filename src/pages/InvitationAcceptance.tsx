import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building,
    Users,
    Check,
    X,
    Mail,
    Clock,
    Shield,
    ArrowRight,
    Home,
    Calendar,
    User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import authService from '@/services/authService';
import { toast } from 'sonner';

interface InvitationDetails {
    invitation: {
        id: string;
        organization: {
            _id: string;
            name: string;
        };
        invitedBy: {
            _id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        email: string;
        role: string;
        message: string;
        status: string;
        createdAt: string;
        expiresAt: string;
        isValid: boolean;
    };
}

export default function InvitationAcceptance() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [invitationProcessed, setInvitationProcessed] = useState(false);
    const [processedAction, setProcessedAction] = useState<'accepted' | 'declined' | null>(null);
    const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid invitation link');
            navigate('/');
            return;
        }

        const fetchInvitationDetails = async () => {
            try {
                setLoading(true);
                const response = await authService.getInvitationDetails(token);
                const data = response.data || response;
                setInvitationDetails(data);

                // Check if invitation is still valid
                if (!data.invitation.isValid || data.invitation.status !== 'pending') {
                    setError('This invitation is no longer valid or has already been processed.');
                }
            } catch (error: any) {
                console.error('Error fetching invitation details:', error);
                setError(error?.response?.data?.message || 'Failed to load invitation details');
                toast.error('Failed to load invitation details');
            } finally {
                setLoading(false);
            }
        };

        fetchInvitationDetails();
    }, [token, navigate]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAcceptInvitation = async () => {
        if (!token) return;

        try {
            setAccepting(true);
            await authService.acceptOrganizationInvitation(token);
            toast.success('Invitation accepted successfully!');
            setInvitationProcessed(true);
            setProcessedAction('accepted');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            toast.error(error?.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setAccepting(false);
        }
    };

    const handleDeclineInvitation = async () => {
        if (!token) return;

        try {
            setDeclining(true);
            await authService.declineOrganizationInvitation(token);
            toast.success('Invitation declined');
            setInvitationProcessed(true);
            setProcessedAction('declined');

            // Redirect to home after a short delay
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error: any) {
            console.error('Error declining invitation:', error);
            toast.error(error?.response?.data?.message || 'Failed to decline invitation');
        } finally {
            setDeclining(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-primary' : 'bg-gray-50'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <CardContent className="p-8 text-center">
                            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                            <p className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Loading invitation details...</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    if (error || !invitationDetails) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-primary' : 'bg-gray-50'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <CardContent className="p-8 text-center">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'}`}>
                                <X className="h-8 w-8" />
                            </div>
                            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Invalid Invitation
                            </h1>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                                {error || 'This invitation link is invalid or has expired.'}
                            </p>
                            <Button
                                onClick={() => navigate('/')}
                                className={`${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Go to Home
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    if (invitationProcessed) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-primary' : 'bg-gray-50'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <CardContent className="p-8 text-center">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${processedAction === 'accepted'
                                ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600')
                                : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')
                                }`}>
                                {processedAction === 'accepted' ? (
                                    <Check className="h-8 w-8" />
                                ) : (
                                    <X className="h-8 w-8" />
                                )}
                            </div>
                            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {processedAction === 'accepted' ? 'Invitation Accepted!' : 'Invitation Declined'}
                            </h1>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                                {processedAction === 'accepted'
                                    ? 'Welcome to the organization! Redirecting to dashboard...'
                                    : 'You have declined the invitation. Redirecting to home...'
                                }
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Redirecting...
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    const { invitation } = invitationDetails;

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-primary' : 'bg-gray-50'}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <CardHeader className="text-center pb-6">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            <Building className="h-8 w-8" />
                        </div>
                        <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Join {invitation.organization.name}
                        </CardTitle>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                            You've been invited to join this organization
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Organization Details */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Building className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Organization Details
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                        Name:
                                    </span>
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {invitation.organization.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Role:
                                    </span>
                                    <Badge className={`${isDarkMode ? 'bg-blue-900 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200'} capitalize`}>
                                        {invitation.role}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Access: Organization resources and projects
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Invited By */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                            <div className="flex items-center gap-3 mb-3">
                                <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Invited By
                                </span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className={`${isDarkMode ? 'text-white' : 'text-black'} font-medium`}>
                                    {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                                </div>
                                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {invitation.invitedBy.email}
                                </div>
                            </div>
                        </div>

                        {/* Welcome Message */}
                        {invitation.message && (
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Message
                                    </span>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                                    "{invitation.message}"
                                </p>
                            </div>
                        )}

                        {/* Invitation Info */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Invitation Info
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Sent:
                                    </span>
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {formatDate(invitation.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Expires:
                                    </span>
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {formatDate(invitation.expiresAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleAcceptInvitation}
                                disabled={accepting || declining || !invitation.isValid || invitation.status !== 'pending'}
                                className={`w-full ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                {accepting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Accepting...
                                    </div>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Accept Invitation
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleDeclineInvitation}
                                disabled={accepting || declining || !invitation.isValid || invitation.status !== 'pending'}
                                variant="outline"
                                className={`w-full ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {declining ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                        Declining...
                                    </div>
                                ) : (
                                    <>
                                        <X className="h-4 w-4 mr-2" />
                                        Decline Invitation
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Invalid Invitation Warning */}
                        {(!invitation.isValid || invitation.status !== 'pending') && (
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-100 border-yellow-200'} border`}>
                                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                                    ⚠️ This invitation is no longer valid or has already been processed.
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/')}
                                className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
} 