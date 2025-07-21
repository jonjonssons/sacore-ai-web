import { showApiResponseToast } from "@/services/api";

/**
 * This file demonstrates how to use the automatic API response toast notifications
 * 
 * API responses with messages containing "successfully" or "success" will automatically 
 * show green success toasts.
 * 
 * API responses with messages containing "error", "failed", or "invalid" will automatically
 * show red error toasts.
 */

// Examples:

// Success toast examples:
export const demoSuccessToast = () => {
    // This will show a green success toast
    showApiResponseToast("User created successfully!");

    // This will also show a green success toast with custom title
    showApiResponseToast("The operation was a success!", "Account Updated");
};

// Error toast examples:
export const demoErrorToast = () => {
    // This will show a red error toast
    showApiResponseToast("An error occurred while processing your request.");

    // This will also show a red error toast
    showApiResponseToast("Invalid credentials provided.", "Authentication Failed");
};

// Regular toast example:
export const demoRegularToast = () => {
    // This will show a regular toast without special styling
    showApiResponseToast("Your data has been processed.");
};

// Usage with API responses:
// The toast is automatically displayed from API responses through the interceptor.
// For manual toast display, use the showApiResponseToast function:
//
// try {
//   const response = await apiClient.post('/some-endpoint', data);
//   // Success toast will be shown automatically if response.data.message exists
// } catch (error) {
//   // Error toast will be shown automatically through the error handler
// } 