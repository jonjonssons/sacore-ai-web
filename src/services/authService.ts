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
  },
  SAVED_PROFILES: {
    SAVE: '/saved-profiles',
    SAVING_PROFILE: '/profiles',
    UPDATE_PROFILE: (profileId: string) => `/profiles/${profileId}`,
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
    IMPORT_CSV: '/search/import-csv'
  }
};

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>(ENDPOINTS.AUTH.LOGIN, credentials);

      // Store auth accessToken in localStorage
      if (response.accessToken) {
        localStorage.setItem('auth_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response.data;
    } catch (error) {
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

  async updateProfile(profileId: string, payload: any[]): Promise<ApiResponse<any>> {
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
}

export const authService = new AuthService();
export default authService; 
