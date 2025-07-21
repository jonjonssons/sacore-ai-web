import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, LockIcon } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import authService, { LoginCredentials } from '@/services/authService';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
});

interface LoginProps {
  onLogin?: (email?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const initialValues: LoginCredentials = {
    email: '',
    password: '',
  };

  const handleSubmit = async (
    values: LoginCredentials,
    { setSubmitting, setFieldError }: FormikHelpers<LoginCredentials>
  ) => {
    setIsLoading(true);

    try {
      // Actual API call
      const response = await authService.login(values);

      // Call the onLogin callback if provided
      if (onLogin) {
        onLogin(values.email);
      }

      // Check if user is admin (based on your user roles)
      const isAdmin = response?.user?.role === 'admin';

      toast({
        title: "Successfully signed in",
        description: `Welcome back!`,
      });

      // Redirect based on user role
      navigate(isAdmin ? '/admin/dashboard' : '/leads');
    } catch (error: any) {
      // Handle login errors
      console.error('Login error:', error);

      // Check if it's a field-specific error
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          setFieldError(key, error.errors[key][0]);
        });
      } else {
        // General error message
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
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
            <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your email to sign in to your account
            </CardDescription>
          </CardHeader>
          <Formik
            initialValues={initialValues}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <CardContent className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
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
                    <Link to="/forgot-password" className="text-xs flex text-primary justify-end hover:text-primary/80">
                      Forgot password?
                    </Link>
                  </div>
                  <Button
                    className="w-full bg-black text-white"
                    type="submit"
                    disabled={isLoading || isSubmitting}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </CardContent>
              </Form>
            )}
          </Formik>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-primary/80">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
