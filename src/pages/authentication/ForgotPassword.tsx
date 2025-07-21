import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { MailIcon } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import authService, { ForgotPasswordData } from '@/services/authService';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const initialValues: ForgotPasswordData = {
    email: '',
  };

  const handleSubmit = async (
    values: ForgotPasswordData,
    { setSubmitting, setFieldError }: FormikHelpers<ForgotPasswordData>
  ) => {
    setIsLoading(true);

    try {
      // Call the API
      await authService.forgotPassword(values);

      setIsSuccess(true);
      setEmailSent(values.email);

      toast({
        title: "Reset code sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      // Handle errors
      console.error('Forgot password error:', error);

      // Check if it's a field-specific error
      if (error.errors && error.errors.email) {
        setFieldError('email', error.errors.email[0]);
      } else {
        // General error message
        toast({
          title: "Failed to send reset code",
          description: error.message || "Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleGoToResetPassword = () => {
    navigate('/reset-password', { state: { email: emailSent, isPasswordReset: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-2xl font-bold text-black">SACORE AI</span>
        </Link>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a reset code
            </CardDescription>
          </CardHeader>
          {!isSuccess ? (
            <Formik
              initialValues={initialValues}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Field
                          as={Input}
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          className={`pl-9 focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.email && touched.email ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <Button
                      className="w-full bg-black text-white"
                      type="submit"
                      disabled={isSubmitting || isLoading}
                    >
                      {isLoading ? "Sending..." : "Send reset code"}
                    </Button>
                  </CardContent>
                </Form>
              )}
            </Formik>
          ) : (
            <CardContent className="space-y-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-4 my-4">
                <p className="text-green-700 dark:text-green-300">
                  Reset code sent! A 6-digit verification code has been sent to your email address.
                </p>
              </div>
              <Button
                className="w-full bg-black text-white"
                onClick={handleGoToResetPassword}
              >
                Continue to verification
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setIsSuccess(false)}
              >
                Send another code
              </Button>
            </CardContent>
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
      </div>
    </div>
  );
};

export default ForgotPassword;
