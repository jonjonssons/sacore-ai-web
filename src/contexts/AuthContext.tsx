import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import authService from "@/services/authService";

interface User {
    // Add your user properties here
    id: string;
    email: string;
    name: string;
    hasSeenOnboardingVideo?: boolean;
    // ... other user properties
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    showOnboardingVideo: boolean;
    login: (token: string, userData?: any) => void;
    logout: () => void;
    closeOnboardingVideo: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboardingVideo, setShowOnboardingVideo] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userData = localStorage.getItem("user");

                if (userData) {
                    const parsedUserData = JSON.parse(userData);
                    setUser({ ...decoded, ...parsedUserData });
                } else {
                    setUser(decoded as User);
                }
            } catch (error) {
                console.error("Invalid token");
                localStorage.removeItem("auth_token");
                localStorage.removeItem("user");
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = (token: string, userData?: any) => {
        localStorage.setItem("auth_token", token);
        const decoded = jwtDecode(token) as User;

        // Merge decoded token data with additional user data from API response
        const fullUserData = { ...decoded, ...userData };
        setUser(fullUserData);

        // Check if user should see onboarding video
        if (fullUserData.hasSeenOnboardingVideo === false) {
            setShowOnboardingVideo(true);
        }
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
        setShowOnboardingVideo(false);
    };

    const closeOnboardingVideo = () => {
        setShowOnboardingVideo(false);

        // Update user data to mark onboarding as seen
        if (user) {
            const updatedUser = { ...user, hasSeenOnboardingVideo: true };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Optional: Call API to update the flag on server
            // updateOnboardingVideoSeen();
            authService.updateOnboardingStatus(true);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            showOnboardingVideo,
            closeOnboardingVideo
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};