// Mock API service for development and testing
import { UserProfile } from '@/contexts/UserProfileContext';

// Sample user data based on the provided JSON
const mockUserData: UserProfile = {
    _id: "6822f4dff6a48c7908990306",
    email: "vanita56n@gmail.com",
    firstName: "Vanita",
    lastName: "56n",
    role: "user",
    isVerified: true,
    trialEnded: false,
    subscription: "free",
    credits: 50,
    stripeCustomerId: null,
    trialStartDate: "2025-05-13T07:29:54.787Z",
    createdAt: "2025-05-13T07:29:35.823Z"
};

// Simulates network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API methods
export const mockApi = {
    /**
     * Get user profile
     */
    getUserProfile: async (): Promise<{ user: UserProfile, message: string }> => {
        await delay(800); // Simulate network delay

        // Simulate successful response
        return {
            user: mockUserData,
            message: "User profile fetched successfully"
        };
    },

    /**
     * Update user profile
     */
    updateUserProfile: async (data: Partial<UserProfile>): Promise<{ user: UserProfile, message: string }> => {
        await delay(1000); // Simulate network delay

        // Merge the updated fields with the mock user data
        const updatedUser = {
            ...mockUserData,
            ...data,
        };

        // Simulate successful response
        return {
            user: updatedUser,
            message: "User profile updated successfully"
        };
    }
};

export default mockApi; 