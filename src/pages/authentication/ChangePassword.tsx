import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { LockIcon, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { authService } from '@/services/authService';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordProps {
  isDialog?: boolean;
  onClose?: () => void;
}

// Validation schema
const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long'),
  confirmPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const ChangePassword: React.FC<ChangePasswordProps> = ({ isDialog = false, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues: ChangePasswordFormValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const handleSubmit = async (
    values: ChangePasswordFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ChangePasswordFormValues>
  ) => {
    setIsLoading(true);

    try {
      const response = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmPassword
      });

      setIsLoading(false);
      setSubmitting(false);

      if (response.success) {
        toast({
          title: "Password updated",
          description: response.message || "Your password has been changed successfully.",
        });

        resetForm();

        // Handle dialog closing first if in dialog mode
        if (isDialog && onClose) {
          onClose();
          return; // Return early to prevent navigation
        }

        // Only navigate if not in dialog mode
        if (!isDialog) {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to change password.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setIsLoading(false);
      setSubmitting(false);

      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  // If in dialog mode, render a simpler version without the wrapper
  if (isDialog) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Change Password</h2>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={ChangePasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values }) => {
              return (
                <Form>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Field
                          as={Input}
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          className={`pl-9 pr-10 ${errors.currentPassword && touched.currentPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <ErrorMessage
                        name="currentPassword"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Field
                          as={Input}
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          className={`pl-9 pr-10 ${errors.newPassword && touched.newPassword ? 'border-red-500' : ''}`}
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
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Field
                          as={Input}
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className={`pl-9 pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}`}
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
                          Updating...
                        </motion.div>
                      ) : "Update Password"}
                    </Button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    );
  }

};

export default ChangePassword;
