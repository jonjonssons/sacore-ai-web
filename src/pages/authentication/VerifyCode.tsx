import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { authService } from '@/services/authService';

interface VerifyCodeProps {
  onVerificationSuccess?: () => void;
}

const VerifyCode: React.FC<VerifyCodeProps> = ({ onVerificationSuccess }) => {
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from location state (passed from SignUp)
  const email = location.state?.email || '';

  // Countdown timer for resend code
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;

    // Create a new array with the updated value
    const newVerificationCode = [...verificationCode];
    newVerificationCode[index] = value;
    setVerificationCode(newVerificationCode);

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move focus to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    // Only process if it's a 6-digit number
    if (pastedData && /^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setVerificationCode(digits);

      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');

    if (code.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the API to verify the code
      await authService.verifyEmail({
        email: email,
        verificationCode: parseInt(code)
      });

      toast({
        title: "Success",
        description: "Your email has been verified successfully!",
      });

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      // In a real application, this would be an API call to resend the code
      // await apiService.post('/auth/resend-verification', { email });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCanResend(false);
      setTimeLeft(60);

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "An error occurred while resending the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
            <CardDescription className="text-center">
              {email ? (
                <>
                  We've sent a verification code to <strong>{email}</strong>.
                  Please enter the code below to verify your account.
                </>
              ) : (
                <>Please enter the verification code sent to your email.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-2xl font-bold"
                    value={verificationCode[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button
                className="w-full bg-black text-white mt-4"
                onClick={handleVerify}
                disabled={isLoading || verificationCode.join('').length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive a code?{' '}
              {canResend ? (
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend code in {timeLeft} seconds</span>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VerifyCode; 