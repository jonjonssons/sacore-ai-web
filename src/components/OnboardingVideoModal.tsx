import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react';

interface OnboardingVideoModalProps {
    onClose: () => void;
}

export const OnboardingVideoModal: React.FC<OnboardingVideoModalProps> = ({ onClose }) => {
    const { isDarkMode } = useTheme();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 px-6 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute -top-10 -right-2 text-white hover:text-gray-300"
                    aria-label="Close"
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Welcome Text */}
                <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to Sacore AI! 👋
                    </h2>
                    <p className="text-gray-600">
                        This short onboarding video will help you get started and make the most of the platform. We highly recommend watching it!
                    </p>
                </div>

                {/* Video Container */}
                <div className="mb-4">
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                            src="https://www.loom.com/embed/10268c1c4b2d4bcc82993c1b84a1eae5?sid=a7f2a6a2-6e8b-46b0-9bd1-d9ba15b6b961"
                            frameBorder="0"
                            allowFullScreen
                            className="rounded-lg"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        ></iframe>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        variant="default"
                        onClick={onClose}
                        className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                    >
                        Skip
                    </Button>

                </div>
            </div>
        </div>
    );
};