import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api, { API_BASE_URL } from '@/services/api';
import { toast } from 'sonner';
import './RequirementsProfileComponent.css';
import { useTheme } from '@/contexts/ThemeContext';
import authService from '@/services/authService';

interface RequirementItem {
  id: string;
  category: string;
  value: string | string[];
  completed: boolean;
}

interface RequirementsProfileProps {
  searchQuery: string;
  uploadedFile?: File | null; // Add file prop
  sourceInclusions?: {
    includeSignalHire: boolean;
    includeBrave: boolean;
    includeGoogle: boolean;
    includeContactOut: boolean;
    includeIcypeas: boolean;
    includeCsvImport: boolean;
  };
  onBack: () => void;
  onProcessing: (profileData: any[]) => void;
}

interface ParsedRequirements {
  location?: string;
  titles?: string[];
  industries?: string[];
}

interface LinkedInSearchFilter {
  field: string;
  value: string;
}

interface LinkedInSearchRequest {
  filters: LinkedInSearchFilter[];
}

const RequirementsProfileComponent: React.FC<RequirementsProfileProps> = ({
  searchQuery,
  uploadedFile,
  sourceInclusions,
  onBack,
  onProcessing,
}) => {
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTasks, setCurrentTasks] = useState<Array<{
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>>([]);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchParsedRequirements = async () => {
      if (!searchQuery) return;

      setIsLoading(true);
      try {
        const response = await api.post<{ success: boolean; data: ParsedRequirements }>(
          '/search/parse-requirements',
          { query: searchQuery }
        );

        if (response.success && response.data) {
          const parsedReqs: RequirementItem[] = [];

          if (response.data.location) {
            parsedReqs.push({
              id: '1',
              category: 'Location',
              value: response.data.location,
              completed: true,
            });
          }

          if (response.data.titles && response.data.titles.length > 0) {
            parsedReqs.push({
              id: '2',
              category: 'Title',
              value: response.data.titles,
              completed: true,
            });
          }

          if (response.data.industries && response.data.industries.length > 0) {
            parsedReqs.push({
              id: '3',
              category: 'Industry',
              value: response.data.industries,
              completed: true,
            });
          } else {
            parsedReqs.push({
              id: '3',
              category: 'Industry',
              value: ['Any Industry'],
              completed: true,
            });
          }

          setRequirements(parsedReqs);
        } else {
          // Fallback to local parsing if API fails
          setRequirements(parseRequirements(searchQuery));
        }
      } catch (error) {
        console.error('Error parsing requirements:', error);
        // Fallback to local parsing if API fails
        setRequirements(parseRequirements(searchQuery));
      } finally {
        setIsLoading(false);
      }
    };

    fetchParsedRequirements();
  }, [searchQuery]);

  const parseRequirements = (query: string): RequirementItem[] => {
    const words = query.split(' ');
    const requirements: RequirementItem[] = [];

    const locationKeywords = ['in', 'from', 'at'];
    let locationIndex = -1;

    locationKeywords.forEach((keyword) => {
      const idx = words.indexOf(keyword);
      if (idx >= 0 && idx < words.length - 1) {
        locationIndex = idx;
      }
    });

    if (locationIndex >= 0) {
      requirements.push({
        id: '1',
        category: 'Location',
        value: words[locationIndex + 1],
        completed: true,
      });
    }

    const experienceRegex = /(\d+)\+?\s*years?/i;
    const experienceMatch = query.match(experienceRegex);
    if (experienceMatch) {
      requirements.push({
        id: '2',
        category: 'Experience',
        value: `${experienceMatch[1]}+ years`,
        completed: true,
      });
    }

    const titleKeywords = ['looking for', 'need', 'seeking', 'hiring'];
    let titleIndex = -1;

    titleKeywords.forEach((keyword) => {
      const idx = query.toLowerCase().indexOf(keyword);
      if (idx >= 0) {
        titleIndex = idx + keyword.length;
      }
    });

    const potentialTitle =
      titleIndex >= 0
        ? query.substring(titleIndex).trim().split(' ').slice(0, 2)
        : words.slice(0, 2);

    requirements.push({
      id: '3',
      category: 'Title',
      value: potentialTitle,
      completed: true,
    });

    requirements.push({
      id: '4',
      category: 'Industry',
      value: ['Any Industry'],
      completed: true,
    });

    return requirements;
  };


  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((req) => req.id !== id));
  };

  const handleChange = (id: string, newValue: string | string[]) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: newValue } : r))
    );
  };

  const handleTagAdd = (id: string) => {
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id === id && Array.isArray(r.value)) {
          return {
            ...r,
            value: [...r.value, ''],
          };
        }
        return r;
      })
    );
  };

  const handleTagChange = (id: string, index: number, value: string) => {
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id === id && Array.isArray(r.value)) {
          const newValues = [...r.value];
          newValues[index] = value;
          return { ...r, value: newValues };
        }
        return r;
      })
    );
  };

  const handleTagDelete = (id: string, index: number) => {
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id === id && Array.isArray(r.value)) {
          const newValues = [...r.value];
          newValues.splice(index, 1);
          return { ...r, value: newValues };
        }
        return r;
      })
    );
  };

  const isChipBased = (category: string) => ['Title', 'Industry'].includes(category);

  // Add validation function to check if all required fields are present
  const areAllRequiredFieldsValid = () => {
    const locationReq = requirements.find(r => r.category === 'Location');
    const titleReq = requirements.find(r => r.category === 'Title');

    // Check location - must be present and have a non-empty string value
    const hasValidLocation = locationReq && typeof locationReq.value === 'string' && locationReq.value.trim().length > 0;

    // Check title - must be present and have at least one non-empty value in array
    const hasValidTitle = titleReq && Array.isArray(titleReq.value) && titleReq.value.some(title => title.trim().length > 0);

    // Industry is now optional - users can process profiles without specifying industry
    return hasValidLocation && hasValidTitle;
  };

  const handleProcessProfiles = async () => {
    setIsSearching(true);
    setProgress(0);

    // Build task list based on what we're searching for
    const tasks = [];

    // Add CSV analysis task if file is uploaded
    if (uploadedFile) {
      tasks.push({
        id: 'csv-analysis',
        title: `Analyzing CSV file (${uploadedFile.name})`,
        status: 'pending' as const
      });
    }

    // Build search description from requirements
    const locationReq = requirements.find(r => r.category === 'Location');
    const titleReq = requirements.find(r => r.category === 'Title');
    const industryReq = requirements.find(r => r.category === 'Industry');

    let searchDescription = 'Searching the web for ';
    if (titleReq && Array.isArray(titleReq.value) && titleReq.value.length > 0) {
      searchDescription += titleReq.value.filter(v => v.trim()).join(' / ');
    } else {
      searchDescription += 'profiles';
    }

    if (locationReq && typeof locationReq.value === 'string') {
      searchDescription += ` in ${locationReq.value}`;
    }

    if (industryReq && Array.isArray(industryReq.value) && industryReq.value.length > 0) {
      const industries = industryReq.value.filter(v => v.trim() && v !== 'Any Industry');
      if (industries.length > 0) {
        searchDescription += ` within the ${industries.join(' / ')} industry`;
      }
    }

    tasks.push({
      id: 'web-search',
      title: searchDescription,
      status: 'pending' as const
    });

    setCurrentTasks(tasks);

    try {
      // Start all tasks as the API call will handle both CSV and web search
      setCurrentTasks(prev => prev.map(task => ({ ...task, status: 'in-progress' })));

      // If a CSV file is being processed, set a timer to mark that specific task as complete after 20 seconds
      if (uploadedFile) {
        setTimeout(() => {
          setCurrentTasks(prev => prev.map(task =>
            task.id === 'csv-analysis'
              ? { ...task, status: 'completed' }
              : task
          ));
        }, 20000); // 20-second delay for CSV analysis simulation
      }

      const filters: LinkedInSearchFilter[] = [];
      requirements.forEach((req) => {
        if (req.category === 'Location' && typeof req.value === 'string') {
          filters.push({ field: 'location', value: req.value });
        }
        if (req.category === 'Title' && Array.isArray(req.value)) {
          req.value.forEach((title) => title.trim() && filters.push({ field: 'title', value: title }));
        }
        if (req.category === 'Industry' && Array.isArray(req.value)) {
          req.value.forEach((industry) =>
            industry.trim() && industry !== 'Any Industry'
              ? filters.push({ field: 'industry', value: industry })
              : null
          );
        }
      });

      // Create FormData instead of JSON payload
      const formData = new FormData();

      // Add filters as JSON string
      formData.append('filters', JSON.stringify(filters));

      // Add all source inclusion flags
      const inclusions = sourceInclusions || {
        includeSignalHire: true,
        includeBrave: true,
        includeGoogle: true,
        includeContactOut: true,
        includeIcypeas: true,
        includeCsvImport: uploadedFile ? true : false
      };

      formData.append('includeSignalHire', inclusions.includeSignalHire.toString());
      formData.append('includeBrave', inclusions.includeBrave.toString());
      formData.append('includeGoogle', inclusions.includeGoogle.toString());
      formData.append('includeContactOut', inclusions.includeContactOut.toString());
      formData.append('includeIcypeas', inclusions.includeIcypeas.toString());
      formData.append('includeCsvImport', inclusions.includeCsvImport.toString());

      // Add file if present
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      // Use direct fetch instead of api.post to send FormData
      const token = await authService.getToken();

      // Set up timeout controller for long-running searches
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Search timeout reached (5 minutes), aborting request...');
        controller.abort();
      }, 600000); // 10 minutes timeout

      try {
        console.log('🔍 Starting LinkedIn search API call:', {
          url: `${API_BASE_URL}/search/linkedin`,
          timestamp: new Date().toISOString(),
          fileSize: uploadedFile?.size || 'No file'
        });

        // Make the actual API call with timeout
        const response = await fetch(`${API_BASE_URL}/search/linkedin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📡 Response received:', response.status, response.statusText);

        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData.details || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          } catch (parseError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const searchResponse = await response.json();
        console.log('✅ LinkedIn search completed successfully');

        // Complete all tasks when API call finishes
        setCurrentTasks(prev => prev.map(task => ({ ...task, status: 'completed' })));

        const rawResults = searchResponse.results || [];
        onProcessing(rawResults);
        sessionStorage.removeItem('initialSearchQuery');

      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        console.error('❌ LinkedIn search API call failed:', {
          error: fetchError.message,
          name: fetchError.name,
          timestamp: new Date().toISOString()
        });

        let userFriendlyMessage = "An unexpected error occurred.";

        if (fetchError.name === 'AbortError') {
          userFriendlyMessage = 'Search timed out after 5 minutes. This can happen with large searches or slow network. Please try with fewer filters or a smaller file.';
        } else if (fetchError.message === 'Failed to fetch') {
          userFriendlyMessage = 'Network error occurred. Please check your internet connection and try again.';
        } else if (fetchError.message.includes('CORS')) {
          userFriendlyMessage = 'Cross-origin request blocked. Please contact support if this persists.';
        } else if (fetchError.message.includes('401')) {
          userFriendlyMessage = 'Authentication failed. Please log in again.';
        } else if (fetchError.message.includes('403')) {
          userFriendlyMessage = 'Access forbidden. Please check your account permissions.';
        } else if (fetchError.message.includes('429')) {
          userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (fetchError.message.includes('500')) {
          userFriendlyMessage = 'Server error occurred. Please try again in a few moments.';
        } else if (fetchError.message) {
          userFriendlyMessage = fetchError.message;
        }

        throw new Error(userFriendlyMessage);
      }
    } catch (error: any) {
      console.error('🚨 Search operation failed:', error);
      toast.error(error.message || "An unexpected error occurred.");
      // Mark current task as failed (you could add failed status if needed)
    } finally {
      setTimeout(() => {
        setIsSearching(false);
        setCurrentTasks([]);
      }, 1000);
    }
  };

  return (
    <>
      {isSearching ? (
        // New detailed loading state - clean and futuristic
        <div className="w-full h-screen flex items-start justify-center animate-fadeIn pt-20">
          <div className="w-full max-w-3xl mx-auto px-6">
            <div className="space-y-3">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center">
                    <span className={`text-sm font-medium tracking-wide transition-all duration-300 text-gray-700`}
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center">
                    {task.status === 'completed' ? (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 transform scale-110 ${'bg-gray-800 shadow-lg shadow-gray-800/40'
                        }`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : task.status === 'in-progress' ? (
                      <div className="relative w-6 h-6">
                        <div className={`absolute inset-0 rounded-full border-2 border-gray-300`} />
                        <div className={`absolute inset-0 rounded-full border-2 border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent animate-spin`} />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${'border-gray-300'
                        }`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Normal content
        <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              className={`mr-4 p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Requirements Profile</h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Based on your search for "<span className="font-medium">{searchQuery}</span>"
              </p>
            </div>
          </div>

          <Card className={`mb-8 rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-primary border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className={`${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'} pb-2`}>
              <CardTitle className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <span className={`p-1 rounded-md mr-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {/* icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                Profile Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className={`py-12 text-center flex flex-col items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <Loader2 className={`h-8 w-8 animate-spin mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
                  <p>Analyzing your search query...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {requirements.map((req) => (
                    <div key={req.id} className="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={`text-sm font-medium flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          <Badge variant="outline" className={`${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'} mr-2`}>
                            {req.category}
                          </Badge>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 rounded-full ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                          onClick={() => handleDeleteRequirement(req.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {Array.isArray(req.value) && ['Title', 'Industry'].includes(req.category) ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {req.value.map((tag, i) => (
                            <div key={i} className={`flex items-center px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' : 'bg-gray-100 border-gray-200 text-gray-800 hover:border-gray-300'}`}>
                              <Input
                                value={tag}
                                onChange={(e) => handleTagChange(req.id, i, e.target.value)}
                                className="h-6 text-xs w-auto border-0 bg-transparent focus-visible:ring-0 px-0 font-medium"
                              />
                              <X
                                className="h-3.5 w-3.5 ml-1 cursor-pointer text-gray-500 hover:text-gray-900"
                                onClick={() => handleTagDelete(req.id, i)}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={() => handleTagAdd(req.id)}
                            size="sm"
                            variant="ghost"
                            className={`${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} text-xs rounded-full px-3`}
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        </div>
                      ) : (
                        <Input
                          value={req.value}
                          onChange={(e) => handleChange(req.id, e.target.value)}
                          className={`mt-1 h-9 text-sm w-full rounded-md ${isDarkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-gray-600 focus:ring-gray-500' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-300'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end items-center">
            {/* <Button
              variant="outline"
              className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-800 text-white' : 'border-gray-300 hover:bg-gray-50 text-gray-800'}`}
              onClick={handleAddRequirement}
            >
              <PlusCircle className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} h-4 w-4`} />
              Add Requirement
            </Button> */}

            <Button
              className={`text-white text-sm px-6 py-2.5 rounded-md shadow-sm transition-colors flex items-center gap-2 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-900 hover:bg-black'}`}
              onClick={handleProcessProfiles}
              disabled={isLoading || isSearching || !areAllRequiredFieldsValid()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching Profiles...
                </>
              ) : (
                'Process Profiles'
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default RequirementsProfileComponent;
