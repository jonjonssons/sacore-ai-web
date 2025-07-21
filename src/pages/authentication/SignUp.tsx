import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, LockIcon } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import authService, { SignupData } from '@/services/authService';

interface SignUpFormValues extends SignupData {
  agreeTerms: boolean;
}

// Validation schema
const SignUpSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name is too short')
    .max(50, 'First name is too long')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name is too short')
    .max(50, 'Last name is too long')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  agreeTerms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
});

interface SignUpProps {
  onSignup?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const initialValues: SignUpFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  };

  const handleSubmit = async (
    values: SignUpFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<SignUpFormValues>
  ) => {
    setIsLoading(true);

    try {
      const signupData: SignupData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      };

      const signupResponse = await authService.signup(signupData);

      toast({
        title: "Account created",
        description: "A verification code has been sent to your email address.",
      });

      // Call the onSignup callback if provided
      if (onSignup) {
        onSignup();
      }

      // Navigate to verification page
      navigate('/verify-email', { state: { email: values.email } });

    } catch (error: any) {
      console.error('Signup error:', error);

      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          setFieldError(key, error.errors[key][0]);
        });
      }

      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center my-4">
          <span className="text-2xl font-bold text-black">SACORE AI</span>
        </Link>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <Formik
            initialValues={initialValues}
            validationSchema={SignUpSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Field
                        as={Input}
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className={`focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.firstName && touched.firstName ? 'border-red-500' : ''}`}
                      />
                      <ErrorMessage
                        name="firstName"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Field
                        as={Input}
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        className={`focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.lastName && touched.lastName ? 'border-red-500' : ''}`}
                      />
                      <ErrorMessage
                        name="lastName"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      className={`focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.email && touched.email ? 'border-red-500' : ''}`}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Field
                        as={Input}
                        id="password"
                        name="password"
                        placeholder="********"
                        type={showPassword ? "text" : "password"}
                        className={`pl-9 pr-10 focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 focus:border-gray-300 ${errors.password && touched.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={values.agreeTerms}
                      onCheckedChange={(checked) => setFieldValue('agreeTerms', Boolean(checked))}
                      className={`${errors.agreeTerms && touched.agreeTerms ? 'border-red-500' : ''}`}
                    />
                    <label
                      htmlFor="agreeTerms"
                      className={`text-sm text-gray-600 dark:text-gray-400 ${errors.agreeTerms && touched.agreeTerms ? 'text-red-500' : ''}`}
                    >
                      I agree to the{' '}
                      <Link
                        to="/terms-of-service"
                        className="text-primary hover:text-primary/80"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy-policy"
                        className="text-primary hover:text-primary/80"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  <ErrorMessage
                    name="agreeTerms"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                  <Button
                    className="w-full bg-black  text-white"
                    type="submit"
                    disabled={isLoading || isSubmitting}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                  {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="ghost" type="button">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </Button>
                    <Button variant="ghost" type="button">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.9913 5.65686 21.1283 10.4375 21.8785V14.8906H7.89844V12H10.4375V9.79688C10.4375 7.29063 11.9304 5.90625 14.2146 5.90625C15.3084 5.90625 16.4531 6.10156 16.4531 6.10156V8.5625H15.1922C13.95 8.5625 13.5625 9.33334 13.5625 10.1242V12H16.3359L15.8926 14.8906H13.5625V21.8785C18.3431 21.1283 22 16.9913 22 12Z" fill="#1877F2" />
                      </svg>
                      Facebook
                    </Button>
                  </div> */}
                </CardContent>
              </Form>
            )}
          </Formik>
          <CardFooter className="border-t px-6 py-4">
            <div className="text-sm text-center w-full text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
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

export default SignUp;
