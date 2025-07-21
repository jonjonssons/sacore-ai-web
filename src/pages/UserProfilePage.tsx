import React from 'react';
import UserProfile from '@/components/UserProfile';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, CreditCard, Settings, User, Clock, Shield, BarChart3 } from 'lucide-react';

const UserProfilePage: React.FC = () => {
    const { userProfile } = useUserProfile();

    // Redirect to login if user is not authenticated
    if (!userProfile) {
        return <Navigate to="/login" replace />;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar and main content layout */}
            <div className="flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="md:w-64 lg:w-72 md:min-h-screen border-r bg-white dark:bg-gray-800 dark:border-gray-700 fixed md:pt-16">
                    <div className="px-6 py-6">
                        <div className="flex items-center mb-6">
                            <Avatar className="h-14 w-14 mr-4">
                                <AvatarFallback className="text-xl">
                                    {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-semibold">{userProfile.firstName} {userProfile.lastName}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start" size="sm">
                                <User className="mr-2 h-4 w-4" />
                                Personal Information
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" size="sm">
                                <Shield className="mr-2 h-4 w-4" />
                                Security Settings
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" size="sm">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Billing & Subscription
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" size="sm">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Usage Statistics
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" size="sm">
                                <Settings className="mr-2 h-4 w-4" />
                                Preferences
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="md:ml-64 lg:ml-72 flex-grow pt-16 pb-12">
                    <div className="container px-4 md:px-6 py-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Manage your account details and preferences
                            </p>
                        </div>

                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left column - Edit profile */}
                                    <div className="lg:col-span-2">
                                        <UserProfile editable={true} />
                                    </div>

                                    {/* Right column - Account info */}
                                    <div className="space-y-6">
                                        {/* Account Status Card */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Account Status</CardTitle>
                                                <CardDescription>Your account information</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <p className="text-sm text-gray-500">Member Since</p>
                                                        <p className="text-sm font-medium">
                                                            {formatDate(userProfile.createdAt)}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <p className="text-sm text-gray-500">Account Type</p>
                                                        <Badge variant={userProfile.subscription === 'free' ? 'secondary' : 'default'}>
                                                            {userProfile.subscription.charAt(0).toUpperCase() + userProfile.subscription.slice(1)}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <p className="text-sm text-gray-500">Verification</p>
                                                        <Badge variant={userProfile.isVerified ? 'success' : 'default'}>
                                                            {userProfile.isVerified ? 'Verified' : 'Unverified'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Credits Card */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <svg 
                                                        width="18" 
                                                        height="18" 
                                                        viewBox="0 0 24 24" 
                                                        className="inline-block"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        {/* Main coin ellipse */}
                                                        <ellipse
                                                            cx="12"
                                                            cy="8"
                                                            rx="9"
                                                            ry="6"
                                                            fill="white"
                                                            stroke="black"
                                                            strokeWidth="2"
                                                        />
                                                        
                                                        {/* Inner ellipse */}
                                                        <ellipse
                                                            cx="12"
                                                            cy="8"
                                                            rx="7"
                                                            ry="4.5"
                                                            fill="white"
                                                            stroke="black"
                                                            strokeWidth="1.5"
                                                        />
                                                        
                                                        {/* Visible coin edge/thickness */}
                                                        <path
                                                            d="M 3 8 Q 3 11 12 14 Q 21 11 21 8"
                                                            fill="white"
                                                            stroke="black"
                                                            strokeWidth="2"
                                                        />
                                                        
                                                        {/* Ridged edges on the visible side */}
                                                        {Array.from({ length: 8 }, (_, i) => {
                                                            const progress = i / 7;
                                                            const x = 3 + (18 * progress);
                                                            const y1 = 8 + Math.sin(progress * Math.PI) * 3;
                                                            const y2 = y1 + 1.5;
                                                            return (
                                                                <line
                                                                    key={i}
                                                                    x1={x}
                                                                    y1={y1}
                                                                    x2={x}
                                                                    y2={y2}
                                                                    stroke="black"
                                                                    strokeWidth="1.5"
                                                                />
                                                            );
                                                        })}
                                                    </svg>
                                                    Credits
                                                </CardTitle>
                                                <CardDescription>Your available credits</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-3xl font-bold">{userProfile.credits}</span>
                                                    <span className="text-sm text-gray-500">credits remaining</span>
                                                </div>
                                                <div className="mt-4">
                                                    <Button variant="outline" className="w-full">
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Buy More Credits
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Trial Info Card */}
                                        {!userProfile.trialEnded && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Trial Status</CardTitle>
                                                    <CardDescription>Your trial information</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <div className="text-sm">
                                                            Trial started on <span className="font-medium">{formatDate(userProfile.trialStartDate)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-gray-500" />
                                                        <div className="text-sm">
                                                            Trial is <Badge variant="success">Active</Badge>
                                                        </div>
                                                    </div>
                                                    <Button className="w-full">
                                                        Upgrade to Premium
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="subscription">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Subscription Management</CardTitle>
                                        <CardDescription>Manage your subscription plan and billing</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Subscription management will be available here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="activity">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Your recent account activity</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Account activity will be displayed here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage; 