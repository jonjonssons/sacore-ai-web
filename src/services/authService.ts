import api, { API_BASE_URL } from './api';
import { ApiResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  confirmPassword?: string;
}

export interface ResetPasswordData {
  newPassword: string;
  resetCode: number;
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface VerifyCodeData {
  verificationCode: number;
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}


interface UserProfile {
  _id: string;
  email: string;
  role: 'user' | 'admin' | string; // update if more roles exist
  isVerified: boolean;
  subscription: 'free' | 'basic' | 'pro' | 'enterprise' | string; // make it stricter if needed
  credits: number;
  trialStartDate: string; // ISO date string
  createdAt: string;
  __v: number;
  resetPasswordCode: string | null;
  resetPasswordCodeExpires: string | null;
  trialEnded: boolean;
  stripeCustomerId: string;
  firstName: string;
  lastName: string;
}


interface Plan {
  id: string;
  name: string;
  credits: number;
  monthly: {
    priceId: string;
    interval: string;
  };
  yearly: {
    priceId: string;
    interval: string;
  };
  isUpgrade: boolean;
  isBillingChange: boolean;
  isCurrentPlan: boolean;
}

interface GetPlansResponse {
  plans: Plan[];
  currentPlan: {
    name: string;
    billingInterval: string;
  };
}

interface Transactions{
  _id: string;
  user: string;
  amount: number;
  type: string;
  description: string;
  balance: number;
  createdAt: string;
}

interface CreditTransaction {
  transactions: Transactions[];
}

export interface CreditHistoryFilters {
  startDate?: string;
  endDate?: string;
  type?: 'USAGE' | 'PURCHASE' | 'REFUND' | 'BONUS';
  limit?: number;
}

interface EnrichResponse{
  message: string;
  requestId: string;
  success: boolean;
}
// Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    UPDATE_ONBOARDING_STATUS: '/auth/onboarding-status',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE: '/auth/me',

  },
  USER: {
    UPDATE_PROFILE: '/user/profile',
    DASHBOARD: '/dashboard',
    SEARCH_HISTORY: '/search-history'
  },
  STRIPE: {
    PLANS: '/stripe/plans',
    STRIPE_PLAN_CHECKOUT: '/stripe/create-checkout-session',
  },
  CREDITS: {
    HISTORY: '/credits/history',
    BALANCE: '/credits/balance',
  },
  SIGNALHIRE: {
    ENRICH: '/profile/enrich',
    POLLING: (requestId : string) => `/profile/request/${requestId}`,
    BATCHENRICH: '/profile/enrich-batch',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAILS: (userId: string) => `/admin/users/${userId}`,
    UPDATE_USER: (userId: string) => `/admin/users/${userId}`,
  },
  SAVED_PROFILES: {
    SAVE: '/saved-profiles',
    SAVING_PROFILE: '/profiles',
    UPDATE_PROFILE: (profileId: string) => `/profiles/${profileId}`,
    DELETE_PROFILE: (profileId: string) => `/profiles/${profileId}`,
    DELETE_PROFILES: '/profiles',
    SAVE_BATCH: '/saved-profiles',
    GET_ALL_SAVED_PROFILES: '/saved-profiles',
    GET_PROFILES_FOR_THE_PROJECT: (projectId: string) => `/profiles/project/${projectId}`,
    GET_ALL_USER_PROFILES: '/profiles/user/all'
  },
  PROFILE_ANALYSIS: {
    GET_ANALYSIS: '/profile/analyze',
    DEEP_ANALYSIS: '/profile/deep-analyze',
    DEEP_ANALYSIS_STREAM: '/profile/deep-analyze-stream',
  },
  PROJECT: {
    CREATE_PROJECT: '/projects',
    GET_PROJECTS: '/projects/user',
    DELETE_PROJECT: (projectId: string) => `/projects/${projectId}`
  },
  SEARCH: {
    IMPORT_CSV: '/search/import-csv',
    RECENT_SEARCHES: '/search-results/recent',
    SEARCH_RESULTS: (searchId: string) => `/search-results/${searchId}/profiles`,
    BATCH_UPDATE: '/search-results/batch-update',
    DELETE_SEARCH_PROFILES: '/search-results/profiles'
  },
  CAMPAIGNS: {
    LIST: '/campaigns', // GET
    GET: (id: string) => `/campaigns/${id}`, // GET by ID
    UPDATE: (id: string) => `/campaigns/${id}`,
    PAUSED_UPDATE: (id: string) => `/campaigns/${id}/paused-update`,
    DELETE: (id: string) => `/campaigns/${id}`,
    START: (id: string) => `/campaigns/${id}/start`,
    PAUSE: (id: string) => `/campaigns/${id}/pause`,
    RESUME: (id: string) => `/campaigns/${id}/resume`,
    DUPLICATE: (id: string) => `/campaigns/${id}/duplicate`,
    SETTINGS: (id: string) => `/campaigns/${id}/settings`,
    PRESETS: '/campaigns/settings/presets',
    APPLY_PRESET: (id: string, preset: string) => `/campaigns/${id}/settings/preset/${preset}`,
    EXECUTIONS: (id: string) => `/campaigns/${id}/executions`,
    ACTIVITY: (id: string) => `/campaigns/${id}/activity`,
    SCHEDULED: (id: string) => `/campaigns/${id}/scheduled`,
    STATS: (id: string) => `/campaigns/${id}/stats`,
    EXECUTION_DETAIL: (id: string, prospectId: string) => `/campaigns/${id}/executions/${prospectId}`,
    PROSPECT_DETAIL: (campaignId: string, prospectId: string) => `/campaigns/${campaignId}/prospects/${prospectId}`,
  },
  ACCOUNTS: {
    LIST: '/accounts',
    GMAIL_AUTH_URL: '/accounts/gmail/auth-url',
    GMAIL_CALLBACK: '/accounts/gmail/callback',
    LINKEDIN_RATE_LIMITS: '/accounts/linkedin/rate-limits',
  },
  BILLING: {
    SUBSCRIPTION_DETAILS: '/stripe/subscription',
    CANCEL_SUBSCRIPTION: '/stripe/subscription/cancel',
    CANCEL_SUBSCRIPTION_IMMEDIATELY: '/stripe/subscription/cancel-immediately',
    INVOICES: '/stripe/invoices',
  },
  SETTINGS: {
    LINKEDIN_DELAYS: '/settings/linkedin-delays',
    LINKEDIN_PRESETS: '/settings/linkedin-delays/presets',
    LINKEDIN_PRESET_APPLY: (preset: string) => `/settings/linkedin-delays/preset/${preset}`,
    TIMEZONES: '/settings/timezones',
  },
  TASKS: {
    LIST: '/tasks', // GET all tasks, POST new task
    DETAIL: (id: string) => `/tasks/${id}`, // GET, PUT, DELETE specific task
    COMPLETE: (id: string) => `/tasks/${id}/complete`, // PATCH to complete task
    BULK_DELETE: '/tasks/bulk', // DELETE multiple tasks
    BULK_COMPLETE: '/tasks/bulk/complete', // PATCH to complete multiple tasks
    CAMPAIGN: '/tasks/campaign', // POST to create campaign task
  }
};

// Add new interfaces for subscription and invoice data
interface SubscriptionDetails {
  plan: {
    id: string;
    name: string;
  };
  status: string;
  amount: number;
  billingInterval: 'monthly' | 'yearly';
  nextBillingDate: string;
  paymentMethod?: {
    last4: string;
    expMonth: string;
    expYear: string;
    brand: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  created: string;
  amount_paid: number;
  status: string;
  invoice_pdf: string;
}

interface InvoicesResponse {
  invoices: Invoice[];
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  type?: 'manual' | 'campaign';
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  type: 'manual' | 'campaign';
  status: 'pending' | 'in-progress' | 'completed';
  userId: string;
  createdBy: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  completedAt?: string;
  campaign?: string;
  campaignId?: string;
  projectId?: string;
}

interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'manual' | 'campaign';
  priority?: 'low' | 'medium' | 'high';
  campaign?: string;
  dueDate?: string;
  overdue?: string;
  campaignId?: string;
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface BulkTaskAction {
  taskIds: string[];
  updates: {
    status: 'pending' | 'in-progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
  };
}

interface CreateCampaignTaskData {
  campaignId: string;
  taskType: 'EMAIL_EXTRACTION' | 'LINKEDIN_URL_EXTRACTION' | 'PROFILE_ENRICHMENT';
  payload: any; // Specific payload based on taskType
}

interface DelaySettings {
  invitations: {
    minDelay: number;
    maxDelay: number;
    unit: string;
  };
  messages: {
    minDelay: number;
    maxDelay: number;
    unit: string;
  };
}

interface WorkingHours {
  enabled: boolean;
  start: number;
  end: number;
  timezone: string;
  weekendsEnabled: boolean;
}

interface LinkedInDelaySettings {
  delaySettings: DelaySettings;
  workingHours: WorkingHours;
  safetyPreset: string;
}

interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

interface TimezoneRegions {
  [region: string]: string[];
}

interface TimezoneData {
  popular: TimezoneOption[];
  regions: TimezoneRegions;
}

interface PresetDelaySettings {
  invitations: {
    minDelay: number;
    maxDelay: number;
    unit: string;
  };
  messages: {
    minDelay: number;
    maxDelay: number;
    unit: string;
  };
}

interface PresetWorkingHours {
  enabled: boolean;
  start: number;
  end: number;
  timezone: string;
  weekendsEnabled: boolean;
}

interface SafetyPreset {
  name: string;
  description: string;
  icon: string;
  delaySettings: PresetDelaySettings;
  workingHours: PresetWorkingHours;
}

interface SafetyPresetsData {
  [key: string]: SafetyPreset;
}

interface LinkedInRateLimits {
  invitations: {
    hourly: number;
    daily: number;
    weekly: number;
  };
  messages: {
    hourly: number;
    daily: number;
    weekly: number;
  };
  visits: {
    hourly: number;
    daily: number;
    weekly: number;
  };
  checks: {
    hourly: number;
    daily: number;
    weekly: number;
  };
}

interface LinkedInRateLimitsResponse {
  success: boolean;
  rateLimits: LinkedInRateLimits;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>(ENDPOINTS.AUTH.LOGIN, credentials);
      
      console.log('Raw API response:', response); // Debug log
      
      // Handle different response structures and normalize
      const rd: any = (response as any).data || response;
      console.log('Response data:', rd); // Debug log
      
      // Store auth tokens in localStorage
      if (rd.accessToken) {
        localStorage.setItem('auth_token', rd.accessToken);
        localStorage.setItem('refresh_token', rd.refreshToken);
        
        // Store complete user data including hasSeenOnboardingVideo flag
        const userData = {
          ...(rd.user || {}),
          hasSeenOnboardingVideo: rd.user?.hasSeenOnboardingVideo ?? false
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Return the normalized data
        const ret: AuthResponseData = {
          user: userData as any,
          accessToken: rd.accessToken,
          refreshToken: rd.refreshToken,
        };
        return ret;
      } else {
        throw new Error('No access token received from server');
      }
      
    } catch (error) {
      console.error('Auth service error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async signup(userData: SignupData): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>(ENDPOINTS.AUTH.REGISTER, userData);

      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response; 
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Only try to call the API if we have a token
        const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.LOGOUT);

        // Always clear local storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login page
        window.location.href = '/login';

        return {
          success: true,
          message: response.message
        };
      } else {
        // No token, just clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login page
        window.location.href = '/login';

        return {
          success: true
        };
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      // Continue with logout process even if API fails

      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/login';

      return {
        success: false,
        message: error.message || ''
      };
    }
  }

  async updateOnboardingStatus(hasSeenOnboardingVideo: boolean): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.UPDATE_ONBOARDING_STATUS, { hasSeenOnboardingVideo });
    return response.data;
  }

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  }

  /**
   * Verify email with token
   */
  // async verifyEmail(data: VerifyEmailData): Promise<{ message: string }> {
  //   const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.VERIFY_EMAIL, data);
  //   return response.data;
  // }

  /**
   * Verify code sent to email
   */
  async verifyEmail(data: VerifyCodeData): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>(ENDPOINTS.AUTH.VERIFY_EMAIL, data);
    return response.data;
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    try {
      // First verify password match client-side
      if (data.newPassword !== data.confirmNewPassword) {
        return {
          message: 'New password and confirmation do not match',
          success: false
        };
      }

      const response = await api.post<ApiResponse<ChangePasswordResponse>>(
        ENDPOINTS.AUTH.CHANGE_PASSWORD,
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmNewPassword
        }
      );

      return {
        message: response.message || '',
        success: response.success || false
      };
    } catch (error: any) {
      // Get error message from API error response
      const errorMessage = error.message || '';
      return {
        message: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const response = await api.get<ApiResponse<UserProfile>>(ENDPOINTS.AUTH.PROFILE);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user profile'
      };
    }
  }

  /**
   * Update user profile data
   */
  async updateUserProfile(data: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const response = await api.put<ApiResponse<UserProfile>>(ENDPOINTS.AUTH.PROFILE, data);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update user profile'
      };
    }
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get current user data
   */
  async getCurrentUser() {
    try {
      const response = await api.get<ApiResponse<{ user: UserProfile }>>(ENDPOINTS.AUTH.PROFILE);

      return response;
    }
    catch (error) {
      throw error;
    }
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

/**
 * Refresh the access token using refresh token
 */
async refreshToken(): Promise<{ accessToken: string }> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    // Clear all authentication data when refresh token is not available
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    throw new Error('No refresh token available');
  }

  const response = await api.post<ApiResponse<{ accessToken: string }>>(
    ENDPOINTS.AUTH.REFRESH_TOKEN,
    { refreshToken }
  );

  if (response?.accessToken) {
    localStorage.setItem('auth_token', response.accessToken);
  }

  return { accessToken: response.accessToken };
}

// User Dashboard API
async getUserDashboard(): Promise<ApiResponse<any>> {
  try {
    const response = await api.get(ENDPOINTS.USER.DASHBOARD);
    return response;
  }
  catch (error) {
    throw error;
    }
}

  /**
   * Fetch available Stripe plans
   */
  async getStripePlans(): Promise<ApiResponse<GetPlansResponse>> {
    try {
      const response = await api.get<ApiResponse<GetPlansResponse>>(ENDPOINTS.STRIPE.PLANS);
      console.log('Plans responsesssss:', response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async stripeCheckout(plan: string, billingInterval: 'monthly' | 'yearly' = 'monthly'): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await api.post<ApiResponse<{ url: string }>>(ENDPOINTS.STRIPE.STRIPE_PLAN_CHECKOUT, {
        plan,
        billingInterval
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Credits transactions
   */
  async getCreditTransactions(filters?: CreditHistoryFilters): Promise<ApiResponse<CreditTransaction[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters?.type) {
        params.append('type', filters.type);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const queryString = params.toString();
      const url = queryString ? `${ENDPOINTS.CREDITS.HISTORY}?${queryString}` : ENDPOINTS.CREDITS.HISTORY;
      
      const response = await api.get<ApiResponse<CreditTransaction[]>>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCreditBalance(): Promise<ApiResponse<{ credits: number }>> {
    try {
      const response = await api.get<ApiResponse<{ credits: number }>>(ENDPOINTS.CREDITS.BALANCE);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async enrichProfile(linkedinUrl: string): Promise<ApiResponse<EnrichResponse>> {
    try {
      const response = await api.post<ApiResponse<EnrichResponse>>(ENDPOINTS.SIGNALHIRE.ENRICH, {linkedinUrl});
      return response;
    } catch (error) {
      throw error;
    }
  }
  async enrichBatchProfiles(linkedinUrls: string[]): Promise<ApiResponse<EnrichResponse>> {
    try {
      const response = await api.post<ApiResponse<EnrichResponse>>(ENDPOINTS.SIGNALHIRE.BATCHENRICH, {linkedinUrls});
      return response;
    } catch (error) {
      throw error;
    }
  }
  async pollingFunction(requestId: string){
    try {
      const response = await api.get(ENDPOINTS.SIGNALHIRE.POLLING(requestId))
      return response;
    }
    catch(error){
      throw error;
    }
  }

  async adminDashboard() {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.DASHBOARD);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUsers(page = 1, limit = 10) {
    try {
      const response = await api.get(`${ENDPOINTS.ADMIN.USERS}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUserDetails(userId: string) {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.USER_DETAILS(userId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch(ENDPOINTS.ADMIN.UPDATE_USER(userId), data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.BILLING.CANCEL_SUBSCRIPTION);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscriptionImmediately(): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.BILLING.CANCEL_SUBSCRIPTION_IMMEDIATELY);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save a single LinkedIn profile
   */
  async saveProfile(linkedinUrl: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.SAVE, 
        { linkedinUrl }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
  async saveProfileToProject(profiles: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.SAVING_PROFILE, 
        profiles
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profileId: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.UPDATE_PROFILE(profileId), 
        payload
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteProfile(profileId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.DELETE_PROFILE(profileId)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteProfiles(profileIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.DELETE_PROFILES,
        {
          data: { profileIds }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save multiple LinkedIn profiles in batch
   */
  async saveBatchProfiles(linkedinUrls: string[]): Promise<ApiResponse<any>> {
    try {
      // Format the profiles array as required by the API
      const profiles = linkedinUrls.map(url => ({ linkedinUrl: url }));
      
      const response = await api.post<ApiResponse<any>>(
        ENDPOINTS.SAVED_PROFILES.SAVE_BATCH, 
        { profiles }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSavedProfiles(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.SAVED_PROFILES.GET_ALL_SAVED_PROFILES);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSavedProfilesForProjects(projectId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.SAVED_PROFILES.GET_PROFILES_FOR_THE_PROJECT(projectId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllUserProfiles(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.SAVED_PROFILES.GET_ALL_USER_PROFILES);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async analyseProfile(payload: { criteria: string; linkedinUrls: string[] }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.PROFILE_ANALYSIS.GET_ANALYSIS, payload);
      return response;
    } catch (error) {
      throw error;
    }
  }
  async deepAnalyseProfile(payload: { criteria: string[]; linkedinUrls: string[] }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.PROFILE_ANALYSIS.DEEP_ANALYSIS, payload);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createProject(payload: {name: string}): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.PROJECT.CREATE_PROJECT, payload);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all projects for the current user
   */
  async getUserProjects(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.PROJECT.GET_PROJECTS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete<ApiResponse<any>>(ENDPOINTS.PROJECT.DELETE_PROJECT(projectId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get Search History for current user
  async getUserSearchHistory(): Promise<ApiResponse<any>> {
    try{
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.USER.SEARCH_HISTORY);
      return response;
    }
    catch(error){
      throw error;
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(payload: {
    name: string;
    description?: string;
    prospects: Array<{ name: string; email: string; company: string; position: string; linkedin?: string; phone?: string }>;
    sequence: any[];
  }): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.LIST}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  /**
   * Get all campaigns for current user
   */
  async getCampaigns(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.LIST}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    // Expecting array
    return Array.isArray(data) ? data : (Array.isArray(data?.campaigns) ? data.campaigns : []);
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.GET(id)}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async updateCampaign(id: string, body: any): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.UPDATE(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async updatePausedCampaign(id: string, body: any): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.PAUSED_UPDATE(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async startCampaign(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.START(id)}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async pauseCampaign(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.PAUSE(id)}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async resumeCampaign(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.RESUME(id)}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async deleteCampaign(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.status === 204 ? {} : await response.json();
  }

  /**
   * Get detailed prospect information
   */
  async getProspectDetail(campaignId: string, prospectId: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.PROSPECT_DETAIL(campaignId, prospectId)}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async duplicateCampaign(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.DUPLICATE(id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  async getCampaignExecutions(id: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.EXECUTIONS(id)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch executions');
    return data;
  }
  async getCampaignActivity(id: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.ACTIVITY(id)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch activity');
    return data;
  }
  async getCampaignScheduled(id: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.SCHEDULED(id)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch scheduled');
    return data;
  }
  async getCampaignStats(id: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.STATS(id)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch stats');
    return data;
  }
  async getCampaignExecutionDetail(id: string, prospectId: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.EXECUTION_DETAIL(id, prospectId)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch execution detail');
    return data;
  }

  async getCampaignSettings(id: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.SETTINGS(id)}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch campaign settings');
    return data;
  }

  async getCampaignPresets(): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.PRESETS}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch campaign presets');
    return data;
  }

  async applyCampaignPreset(campaignId: string, presetKey: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.APPLY_PRESET(campaignId, presetKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to apply campaign preset');
    return data;
  }

  async updateCampaignSettings(campaignId: string, settings: any): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CAMPAIGNS.SETTINGS(campaignId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to update campaign settings');
    return data;
  }

  async getAccounts(): Promise<any[]> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ACCOUNTS.LIST}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to fetch accounts');
    return data;
  }

  async getGmailAuthUrl(): Promise<string> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ACCOUNTS.GMAIL_AUTH_URL}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to get Gmail auth URL');
    return data?.authUrl || data?.url;
  }
  async completeGmailCallback(code: string): Promise<any> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ACCOUNTS.GMAIL_CALLBACK}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to complete Gmail OAuth');
    return data;
  }

  // Get Recent Searches for past 24 hours
  async getRecentSearches(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.SEARCH.RECENT_SEARCHES);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get Search Results with Profiles for a specific search
  async getSearchResults(searchId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(ENDPOINTS.SEARCH.SEARCH_RESULTS(searchId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Import CSV file with filters
   */
  async importCSV(file: File, filters: {field: string, value: string}[]): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('filters', JSON.stringify(filters));

      const token = this.getToken();
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SEARCH.IMPORT_CSV}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Return the error response from the server instead of throwing
        return {
          success: false,
          message: data.error || data.message || `HTTP error! status: ${response.status}`,
          data: null
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stream deep analysis with real-time updates using Server-Sent Events
   */
  async deepAnalyseProfileStream(
    payload: { criteria: string[]; linkedinUrls?: string[]; profileIds?: string[]; enrichedProfiles?: { id: string, contactOutData: any }[] },
    onStreamData: (data: any) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<() => void> {
    let abortController = new AbortController();
    let retryCount = 0;
    const maxRetries = 3;
    let buffer = '';

    const attemptStream = async (): Promise<void> => {
      try {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE_ANALYSIS.DEEP_ANALYSIS_STREAM}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          // Try to parse the error response body
          let errorData;
          try {
            const errorBody = await response.text();
            console.log('HTTP Error Response Body:', errorBody);
            
            try {
              errorData = JSON.parse(errorBody);
              console.log('Parsed Error Data:', errorData);
            } catch (jsonError) {
              console.log('Failed to parse JSON, using text as is:', jsonError);
              // If JSON parsing fails, use the text as is
              errorData = { message: errorBody };
            }
          } catch (readError) {
            console.error('Error reading response body:', readError);
            // If we can't read the response, use a default error
            errorData = { message: `HTTP ${response.status} error` };
          }
          
          // Create an error object with the parsed response data
          const httpError = new Error(`HTTP error! status: ${response.status}`);
          (httpError as any).response = errorData;
          (httpError as any).status = response.status;
          (httpError as any).details = errorData.details;
          (httpError as any).error = errorData.error;
          
          console.log('Throwing HTTP error with details:', {
            message: httpError.message,
            details: (httpError as any).details,
            response: (httpError as any).response
          });
          
          throw httpError;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Process any remaining buffer
                if (buffer.trim()) {
                  processBuffer();
                }
                onComplete();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Process complete lines from buffer
              processBuffer();
            }
          } catch (streamError) {
            if (streamError.name === 'AbortError') {
              console.log('Stream aborted by user');
              return;
            }
            
            console.error('Stream reading error:', streamError);
            
            // Attempt retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying stream connection (attempt ${retryCount}/${maxRetries})...`);
              setTimeout(() => attemptStream(), 1000 * retryCount); // Exponential backoff
              return;
            }
            
            onError(streamError);
          } finally {
            reader.releaseLock();
          }
        };

        const processBuffer = () => {
          const lines = buffer.split('\n');
          // Keep the last line in buffer as it might be incomplete
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6).trim();
                if (jsonData) {
                  const data = JSON.parse(jsonData);
                  onStreamData(data);
                  
                  // Reset retry count on successful data
                  retryCount = 0;
                  
                  // Check if stream is complete
                  if (data.type === 'complete' || data.type === 'error') {
                    onComplete();
                    return;
                  }
                }
              } catch (parseError) {
                console.warn('Error parsing SSE data, skipping line:', parseError.message);
                console.warn('Problematic line:', line);
                // Don't throw error, just skip this line and continue
              }
            }
          }
        };

        await readStream();

      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.log('Fetch aborted by user');
          return;
        }
        
        console.error('Fetch error:', fetchError);
        
        // Attempt retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying stream connection (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(() => attemptStream(), 1000 * retryCount); // Exponential backoff
          return;
        }
        
        onError(fetchError);
      }
    };

    // Start the stream
    attemptStream();

    // Return cleanup function
    return () => {
      abortController.abort();
    };
  }

  /**
   * Stream email extraction with real-time updates using Server-Sent Events
   */
  async getEmailsStream(
    payload: { linkedinUrls: string[]; profileIds: string[] },
    onStreamData: (data: any) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<() => void> {
    let abortController = new AbortController();
    let retryCount = 0;
    const maxRetries = 3;
    let buffer = '';

    const attemptStream = async (): Promise<void> => {
      try {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}/profile/get-emails-stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Process any remaining buffer
                if (buffer.trim()) {
                  processBuffer();
                }
                onComplete();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Process complete lines from buffer
              processBuffer();
            }
          } catch (streamError) {
            if (streamError.name === 'AbortError') {
              console.log('Email stream aborted by user');
              return;
            }
            
            console.error('Email stream reading error:', streamError);
            
            // Attempt retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying email stream connection (attempt ${retryCount}/${maxRetries})...`);
              setTimeout(() => attemptStream(), 1000 * retryCount); // Exponential backoff
              return;
            }
            
            onError(streamError);
          } finally {
            reader.releaseLock();
          }
        };

        const processBuffer = () => {
          const lines = buffer.split('\n');
          // Keep the last line in buffer as it might be incomplete
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6).trim();
                if (jsonData) {
                  const data = JSON.parse(jsonData);
                  onStreamData(data);
                  
                  // Reset retry count on successful data
                  retryCount = 0;
                  
                  // Check if stream is complete
                  if (data.type === 'complete' || data.type === 'error') {
                    onComplete();
                    return;
                  }
                }
              } catch (parseError) {
                console.warn('Error parsing email SSE data, skipping line:', parseError.message);
                console.warn('Problematic line:', line);
                // Don't throw error, just skip this line and continue
              }
            }
          }
        };

        await readStream();

      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.log('Email fetch aborted by user');
          return;
        }
        
        console.error('Email fetch error:', fetchError);
        
        // Attempt retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying email stream connection (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(() => attemptStream(), 1000 * retryCount); // Exponential backoff
          return;
        }
        
        onError(fetchError);
      }
    };

    // Start the stream
    attemptStream();

    // Return cleanup function
    return () => {
      abortController.abort();
    };
  }

  /**
   * Get current subscription details
   */
  async getSubscriptionDetails(): Promise<ApiResponse<SubscriptionDetails>> {
    try {
      const response = await api.get<ApiResponse<SubscriptionDetails>>(ENDPOINTS.BILLING.SUBSCRIPTION_DETAILS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoices history
   */
  async getInvoices(): Promise<ApiResponse<InvoicesResponse>> {
    try {
      const response = await api.get<ApiResponse<InvoicesResponse>>(ENDPOINTS.BILLING.INVOICES);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stream LinkedIn URL extraction for profiles
   */
  async getLinkedInUrlsStream(
    payload: { profileIds: string[] },
    onStreamData: (data: any) => void,
    onError: (error: any) => void,
    onComplete: () => void
  ): Promise<() => void> {
    let abortController = new AbortController();
    let retryCount = 0;
    const maxRetries = 3;
    let buffer = '';

    const attemptStream = async (): Promise<void> => {
      try {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}/profile/get-linkedin-urls-stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Process any remaining buffer
                if (buffer.trim()) {
                  processBuffer();
                }
                onComplete();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Process complete lines from buffer
              processBuffer();
            }
          } catch (streamError) {
            if (streamError.name === 'AbortError') {
              console.log('LinkedIn URL stream aborted by user');
              return;
            }
            throw streamError;
          }
        };

        const processBuffer = () => {
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onStreamData(data);
              } catch (parseError) {
                console.error('Error parsing LinkedIn URL stream data:', parseError, 'Line:', line);
              }
            }
          }
        };

        await readStream();

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('LinkedIn URL stream request aborted');
          return;
        }

        console.error(`LinkedIn URL stream attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries && !abortController.signal.aborted) {
          retryCount++;
          console.log(`Retrying LinkedIn URL stream (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptStream();
        } else {
          onError(error);
        }
      }
    };

    // Start the stream
    attemptStream();

    // Return cleanup function
    return () => {
      console.log('Aborting LinkedIn URL stream...');
      abortController.abort();
    };
  }

  /**
   * Batch update search result profiles
   */
  async batchUpdateSearchProfiles(updates: Array<{ profileId: string; [key: string]: any }>): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch<ApiResponse<any>>(ENDPOINTS.SEARCH.BATCH_UPDATE, { updates });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete search result profiles
   */
  async deleteSearchProfiles(profileIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete<ApiResponse<any>>(
        ENDPOINTS.SEARCH.DELETE_SEARCH_PROFILES,
        {
          data: { profileIds }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ======================== TASK METHODS ========================

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      const response = await api.post<{ message: string; task: Task }>(ENDPOINTS.TASKS.LIST, taskData);
      return response.task; // Extract the task from the response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all tasks with optional filters
   */
  async getTasks(filters?: TaskFilters): Promise<{ tasks: Task[]; pagination: any; filters: any }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.campaign) params.append('campaign', filters.campaign);
      if (filters?.dueDate) params.append('dueDate', filters.dueDate);
      if (filters?.overdue) params.append('overdue', filters.overdue);
      if (filters?.campaignId) params.append('campaignId', filters.campaignId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `${ENDPOINTS.TASKS.LIST}?${queryString}` : ENDPOINTS.TASKS.LIST;
      
      const response = await api.get<{ tasks: Task[]; pagination: any; filters: any }>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await api.get<{ task: Task }>(ENDPOINTS.TASKS.DETAIL(taskId));
      return response.task; // Extract the task from the response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, taskData: UpdateTaskData): Promise<Task> {
    try {
      const response = await api.patch<{ message: string; task: Task } | Task>(ENDPOINTS.TASKS.DETAIL(taskId), taskData);
      // Handle different response structures
      if ('task' in response) {
        return response.task;
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(ENDPOINTS.TASKS.DETAIL(taskId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, notes?: string): Promise<ApiResponse<{ completedTask: Task; nextTasks?: Task[] }>> {
    try {
      const response = await api.patch<ApiResponse<{ completedTask: Task; nextTasks?: Task[] }>>(
        ENDPOINTS.TASKS.COMPLETE(taskId), 
        { notes }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete multiple tasks
   */
  async bulkDeleteTasks(taskIds: string[]): Promise<ApiResponse<{ message: string; deletedCount: number }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string; deletedCount: number }>>(
        ENDPOINTS.TASKS.BULK_DELETE, 
        { 
          data: { taskIds } // Axios supports request body in DELETE requests via the data property
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete multiple tasks
   */
  async bulkCompleteTasks(bulkAction: BulkTaskAction): Promise<{ message: string; completedCount: number; modifiedCount?: number }> {
    try {
      const response = await api.patch<{ message: string; completedCount: number; modifiedCount?: number }>(
        ENDPOINTS.TASKS.BULK_DELETE, // This is actually /tasks/bulk endpoint for bulk operations
        bulkAction
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a campaign task
   */
  async createCampaignTask(campaignTaskData: CreateCampaignTaskData): Promise<ApiResponse<Task>> {
    try {
      const response = await api.post<ApiResponse<Task>>(ENDPOINTS.TASKS.CAMPAIGN, campaignTaskData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ======================== SETTINGS METHODS ========================

  /**
   * Get LinkedIn delay settings
   */
  async getLinkedInDelaySettings(): Promise<ApiResponse<LinkedInDelaySettings>> {
    try {
      const response = await api.get<ApiResponse<LinkedInDelaySettings>>(ENDPOINTS.SETTINGS.LINKEDIN_DELAYS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update LinkedIn delay settings
   */
  async updateLinkedInDelaySettings(settings: Partial<LinkedInDelaySettings>): Promise<ApiResponse<LinkedInDelaySettings>> {
    try {
      const response = await api.put<ApiResponse<LinkedInDelaySettings>>(ENDPOINTS.SETTINGS.LINKEDIN_DELAYS, settings);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available timezones
   */
  async getTimezones(): Promise<ApiResponse<TimezoneData>> {
    try {
      const response = await api.get<ApiResponse<TimezoneData>>(ENDPOINTS.SETTINGS.TIMEZONES);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get LinkedIn delay presets
   */
  async getLinkedInPresets(): Promise<ApiResponse<SafetyPresetsData>> {
    try {
      const response = await api.get<ApiResponse<SafetyPresetsData>>(ENDPOINTS.SETTINGS.LINKEDIN_PRESETS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Apply LinkedIn preset settings
   */
  async applyLinkedInPreset(presetKey: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(ENDPOINTS.SETTINGS.LINKEDIN_PRESET_APPLY(presetKey), {});
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get LinkedIn rate limits
   */
  async getLinkedInRateLimits(): Promise<ApiResponse<LinkedInRateLimitsResponse>> {
    try {
      const response = await api.get<ApiResponse<LinkedInRateLimitsResponse>>(ENDPOINTS.ACCOUNTS.LINKEDIN_RATE_LIMITS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update LinkedIn rate limits
   */
  async updateLinkedInRateLimits(rateLimits: Partial<LinkedInRateLimits>): Promise<ApiResponse<LinkedInRateLimitsResponse>> {
    try {
      const response = await api.put<ApiResponse<LinkedInRateLimitsResponse>>(
        ENDPOINTS.ACCOUNTS.LINKEDIN_RATE_LIMITS, 
        { rateLimits }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add prospects to an existing campaign
   */
  async addProspectsToCampaign(campaignId: string, prospects: Array<{
    name: string;
    email?: string;
    linkedin?: string;
    company?: string;
    position?: string;
    phone?: string;
  }>): Promise<ApiResponse<{
    prospectsAdded: number;
    totalProspects: number;
    originalProspectCount: number;
    executionsCreated: number;
    campaignStatus: string;
    autoStarted: boolean;
    newProspects: Array<{
      name: string;
      email?: string;
      linkedin?: string;
      status: string;
    }>;
  }>> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/prospects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ prospects }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Delete prospects from an existing campaign
   */
  async deleteProspectsFromCampaign(campaignId: string, prospectIds: string[]): Promise<ApiResponse<{
    prospectsDeleted: number;
    originalProspectCount: number;
    remainingProspects: number;
    cleanup: {
      executionsDeleted: number;
      emailLogsDeleted: number;
      tasksDeleted: number;
      invitationJobsCancelled: number;
      messageJobsCancelled: number;
      errors: any[];
    };
    statistics: {
      before: { totalProspects: number; emailsSent: number };
      after: { totalProspects: number; emailsSent: number };
      changes: { totalProspects: number; emailsSent: number };
    };
    performance: {
      operationDurationMs: number;
      transactionUsed: boolean;
      optimizationsApplied: string[];
    };
    deletedProspects: any[];
    timestamp: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/prospects`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ prospectIds }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

}

export const authService = new AuthService();
export default authService; 
