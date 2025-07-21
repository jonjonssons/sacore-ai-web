import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { showApiResponseToast } from '@/services/api';
import { motion } from 'framer-motion';
import { ChevronsUpDown, Edit, User, Mail, Save, X, LogOut } from 'lucide-react';
import authService from '@/services/authService';

export interface UserProfileProps {
    editable?: boolean;
    compact?: boolean;
    userData?: any;
}

const UserProfile: React.FC<UserProfileProps> = ({ editable = true, compact = false, userData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<any> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // Initialize form data when profile is loaded or when editing starts
    useEffect(() => {
        if (userData && isEditing) {
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
            });
        }
    }, [userData, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log(`Updating ${name} to ${value}`);
        setFormData(prev => {
            if (!prev) return { [name]: value };
            return { ...prev, [name]: value };
        });
    };

    const handleEditClick = () => {
        setIsEditing(true);
        // Initialize form data when entering edit mode
        if (userData) {
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        // try {
        //     setIsSaving(true);

        //     // Use updateUserProfileLocally instead of API call
        //     updateUserProfileLocally(formData);

        //     // Show success message
        //     showApiResponseToast('Profile updated successfully');

        //     // Exit edit mode
        //     setIsEditing(false);

        // } catch (error: any) {
        //     console.error('Failed to update profile:', error);
        //     showApiResponseToast(error.message || 'Update failed', 'error');
        // } finally {
        //     setIsSaving(false);
        // }
    };

    const handleLogout = async () => {
        try {
            // Show a loading state or indicator if needed

            // Call the logout API
            await authService.logout();

            // No need to handle redirect as authService.logout already does that

        } catch (error) {
            // Show an error toast if needed
            showApiResponseToast('Failed to logout. Please try again.', 'error');
            console.error('Logout error:', error);
        }
    };

    // if (loading) {
    //     return (
    //         <Card className="w-full">
    //             <CardHeader>
    //                 <Skeleton className="h-8 w-1/3" />
    //                 <Skeleton className="h-4 w-1/2" />
    //             </CardHeader>
    //             <CardContent className="space-y-4">
    //                 <Skeleton className="h-12 w-full" />
    //                 <Skeleton className="h-12 w-full" />
    //                 <Skeleton className="h-12 w-full" />
    //             </CardContent>
    //         </Card>
    //     );
    // }

    // if (error) {
    //     return (
    //         <Card className="w-full border-red-200">
    //             <CardHeader>
    //                 <CardTitle>Error</CardTitle>
    //                 <CardDescription>There was an error loading your profile</CardDescription>
    //             </CardHeader>
    //             <CardContent>
    //                 <p className="text-red-500">{error}</p>
    //                 <Button
    //                     variant="outline"
    //                     className="mt-4"
    //                     onClick={() => fetchUserProfile()}
    //                 >
    //                     Retry
    //                 </Button>
    //             </CardContent>
    //         </Card>
    //     );
    // }

    if (!userData) {
        return (
            <Card className="w-full shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-0 overflow-hidden backdrop-blur-sm">
                <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">Profile Unavailable</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">Please log in to view your profile</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // For compact view (used in headers, navbars, etc.)
    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
            >
                <Avatar className="ring-2 ring-offset-2 ring-black dark:ring-white shadow-md transition-all duration-300 group-hover:shadow-lg">
                    <AvatarImage src={userData.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-black to-gray-700 text-white font-medium transition-all duration-300">
                        {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-semibold tracking-tight">{userData.firstName} {userData.lastName}</p>
                    <div className="flex items-center gap-1.5">
                        <svg 
                            width="14" 
                            height="14" 
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
                            {Array.from({ length: 6 }, (_, i) => {
                                const progress = i / 5;
                                const x = 3 + (18 * progress);
                                const y1 = 8 + Math.sin(progress * Math.PI) * 3;
                                const y2 = y1 + 1.2;
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">{userData.credits} credits</p>
                    </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
        );
    }

    // For view-only display or when not in edit mode
    if (!isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white dark:bg-gray-950 rounded-xl">
                    <div className="h-32 bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-700 relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,120,120,0.2),rgba(0,0,0,0.1))]"
                            animate={{
                                backgroundPosition: ['0% 0%', '100% 100%'],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 mb-8">
                            <div className="flex items-end">
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                    <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-950 shadow-2xl border-2 border-gray-100 dark:border-gray-800">
                                        <AvatarImage src={userData.avatarUrl} />
                                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-black to-gray-700 text-white">
                                            {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </motion.div>
                                <div className="ml-5 mt-6 mb-1">
                                    <h2 className="text-3xl font-bold tracking-tight">{userData.firstName} {userData.lastName}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Member since {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
                                {editable && (
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Button
                                            onClick={handleEditClick}
                                            className="mt-9 md:mt-7 bg-gradient-to-r from-black to-gray-700 hover:from-gray-900 hover:to-black border-0 shadow-md transition-all duration-300 hover:shadow-lg px-6 py-5 h-[20px]"
                                        >
                                            <Edit className="h-2 w-2 mr-2" /> Edit Profile
                                        </Button>
                                    </motion.div>
                                )}

                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="mt-9 md:mt-7 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md transition-all duration-300 hover:shadow-lg px-6 py-5 h-[20px]"
                                    >
                                        <LogOut className="h-2 w-2 mr-2" /> Logout
                                    </Button>
                                </motion.div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Personal Information</Label>
                                    <div className="mt-3 space-y-5 rounded-xl bg-gray-50 dark:bg-gray-900 p-5 border border-gray-100 dark:border-gray-800 shadow-inner">
                                        <div className="flex items-start">
                                            <User className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</p>
                                                <p className="text-sm font-medium mt-1">{userData.firstName} {userData.lastName}</p>
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-2" />
                                        <div className="flex items-start">
                                            <Mail className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</p>
                                                <p className="text-sm font-medium mt-1 break-all">{userData.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Account Status</Label>
                                    <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-900 p-5 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-5 shadow-inner">
                                        <motion.div
                                            className="flex flex-col"
                                            whileHover={{ y: -2 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscription</p>
                                            <Badge className="w-fit mt-2 font-medium shadow-sm" variant={userData.subscription === 'free' ? 'secondary' : 'default'}>
                                                {userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)}
                                            </Badge>
                                        </motion.div>

                                        <motion.div
                                            className="flex flex-col"
                                            whileHover={{ y: -2 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="flex items-center gap-1">
                                                <svg 
                                                    width="14" 
                                                    height="14" 
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
                                                    {Array.from({ length: 6 }, (_, i) => {
                                                        const progress = i / 5;
                                                        const x = 3 + (18 * progress);
                                                        const y1 = 8 + Math.sin(progress * Math.PI) * 3;
                                                        const y2 = y1 + 1.2;
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
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credits</p>
                                            </div>
                                            <Badge className="w-fit mt-2 font-medium bg-gradient-to-r from-gray-700 to-black hover:from-black hover:to-gray-900 text-white shadow-sm" variant="outline">
                                                {userData.credits}
                                            </Badge>
                                        </motion.div>

                                        <motion.div
                                            className="flex flex-col"
                                            whileHover={{ y: -2 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</p>
                                            <Badge className="w-fit mt-2 font-medium shadow-sm" variant={userData.isVerified ? 'default' : 'destructive'}>
                                                {userData.isVerified ? 'Verified' : 'Unverified'}
                                            </Badge>
                                        </motion.div>

                                        <motion.div
                                            className="flex flex-col"
                                            whileHover={{ y: -2 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial</p>
                                            <Badge className="w-fit mt-2 font-medium shadow-sm" variant={userData.trialEnded ? 'destructive' : 'secondary'}>
                                                {userData.trialEnded ? 'Ended' : 'Active'}
                                            </Badge>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    }

    // Edit mode
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-full shadow-2xl rounded-xl overflow-hidden border-0">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="bg-gradient-to-r from-black to-gray-800 pb-8 pt-8">
                        <CardTitle className="text-white text-2xl flex items-center">
                            <Edit className="h-5 w-5 mr-2" /> Edit Profile
                        </CardTitle>
                        <CardDescription className="text-gray-300 opacity-90 mt-2">Update your personal information</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-8 px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="firstName" className="text-sm font-medium flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-500" /> First Name
                                </Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData?.firstName || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="rounded-md border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all duration-300 py-6"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="lastName" className="text-sm font-medium flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-500" /> Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData?.lastName || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="rounded-md border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all duration-300 py-6"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-500" /> Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData?.email || ''}
                                onChange={handleInputChange}
                                required
                                className="rounded-md border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all duration-300 py-6"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="border-t py-6 px-8 flex justify-end gap-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="font-medium border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 px-6"
                            >
                                <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="font-medium bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-black shadow-md hover:shadow-lg transition-all duration-300 px-6"
                            >
                                {isSaving ? (
                                    <>Saving...</>
                                ) : (
                                    <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                                )}
                            </Button>
                        </motion.div>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
};

export default UserProfile; 