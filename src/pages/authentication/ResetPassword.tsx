import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { LockIcon, CheckCircle, AlertCircle, KeyIcon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import authService from '@/services/authService';

interface ResetPasswordFormValues {
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  verificationCode: Yup.string()
    .required('Verification code is required')
    .matches(/^\d{6}$/, 'Code must be exactly 6 digits'),
  newPassword: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const ResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get token and email from URL or location state
  const token = new URLSearchParams(location.search).get('token') || '';
  const email = location.state?.email || '';

  const initialValues: ResetPasswordFormValues = {
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  };

  const handleSubmit = async (
    values: ResetPasswordFormValues,
    { setSubmitting }: FormikHelpers<ResetPasswordFormValues>
  ) => {
    setIsLoading(true);

    try {
      // Call the reset password API
      await authService.resetPassword({
        email: email,
        resetCode: parseInt(values.verificationCode),
        newPassword: values.newPassword,
      });

      setIsSuccess(true);

      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully.",
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  px-4">
      {/* Animated background elements */}
      <motion.div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-200/20 dark:bg-blue-700/10 blur-3xl -z-10"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue blur-3xl -z-10"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <motion.span
            className="text-2xl font-bold text-black"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            SACORE AI
          </motion.span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="w-full glass border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
              <CardDescription className="text-center">
                {token ? 'Enter your new password below' : 'Enter the verification code sent to your email'}
              </CardDescription>
            </CardHeader>
            {!isSuccess ? (
              <Formik
                initialValues={initialValues}
                validationSchema={ResetPasswordSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values, handleChange, setFieldValue }) => {
                  // Custom effect to update password strength when newPassword changes


                  // Handler for verification code inputs
                  const handleCodeDigitChange = (index: number, value: string) => {
                    // Only allow digits
                    if (value && !/^\d*$/.test(value)) return;

                    // Create a new verification code by replacing the digit at the specified index
                    const codeArray = values.verificationCode.split('');
                    codeArray[index] = value;
                    const newCode = codeArray.join('');

                    // Update the form field
                    setFieldValue('verificationCode', newCode);

                    // Auto-focus next input if value is entered
                    if (value && index < 5) {
                      codeInputRefs.current[index + 1]?.focus();
                    }
                  };

                  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
                    // Move focus to previous input on backspace if current input is empty
                    if (e.key === 'Backspace' && !values.verificationCode[index] && index > 0) {
                      codeInputRefs.current[index - 1]?.focus();
                    }
                  };

                  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text');

                    // Only process if it's a 6-digit number
                    if (pastedData && /^\d{6}$/.test(pastedData)) {
                      setFieldValue('verificationCode', pastedData);
                      // Focus the last input
                      codeInputRefs.current[5]?.focus();
                    }
                  };

                  return (
                    <Form>
                      <CardContent className="space-y-4">
                        {!token && (
                          <div className="space-y-2">
                            <Label htmlFor="verificationCode">Verification Code</Label>
                            <div className="flex justify-center space-x-2 mt-2">
                              {[0, 1, 2, 3, 4, 5].map((index) => (
                                <Input
                                  key={index}
                                  ref={(el) => (codeInputRefs.current[index] = el)}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  className={`w-10 h-12 text-center text-lg font-bold focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.verificationCode && touched.verificationCode ? 'border-red-500' : ''
                                    }`}
                                  value={values.verificationCode[index] || ''}
                                  onChange={(e) => handleCodeDigitChange(index, e.target.value)}
                                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                  onPaste={index === 0 ? handleCodePaste : undefined}
                                  autoFocus={index === 0}
                                />
                              ))}
                            </div>
                            <ErrorMessage
                              name="verificationCode"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              Enter the 6-digit code sent to your email address
                            </p>

                            {values.verificationCode.length === 6 && <motion.div
                              className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Code verified</span>
                            </motion.div>
                            }

                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Field
                              as={Input}
                              id="newPassword"
                              name="newPassword"
                              placeholder="********"
                              type={showNewPassword ? "text" : "password"}
                              className={`pl-9 pr-10 focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.newPassword && touched.newPassword ? 'border-red-500' : ''}`}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              tabIndex={-1}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <ErrorMessage
                            name="newPassword"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />


                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Field
                              as={Input}
                              id="confirmPassword"
                              name="confirmPassword"
                              placeholder="********"
                              type={showConfirmPassword ? "text" : "password"}
                              className={`pl-9 pr-10 focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}`}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <ErrorMessage
                            name="confirmPassword"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                        <Button
                          className="w-full bg-black text-white"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <motion.div
                              className="flex items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <div className="h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin mr-2" />
                              Resetting Password...
                            </motion.div>
                          ) : "Reset Password"}
                        </Button>
                      </CardContent>
                    </Form>
                  );
                }}
              </Formik>
            ) : (
              <motion.div
                className="p-6 text-center space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Password Reset Successful!</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your password has been updated successfully. You'll be redirected to the login page shortly.
                </p>
                <motion.div
                  className="w-full bg-gray-200 h-1 mt-4 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="bg-green-500 h-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </motion.div>
              </motion.div>
            )}
            <CardFooter className="flex justify-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:text-primary/80">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword; 