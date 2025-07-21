import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Type, X, Download, ArrowLeft, ExternalLink, Mail, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import api, { API_BASE_URL } from '@/services/api';
import authService from '@/services/authService';
import { DeepAnalysisModal } from '@/components/dashboard/DeepAnalysisModal';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  file?: File; // Store the actual File object for API calls
}

interface CsvRow {
  [key: string]: string;
}

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email?: string;
  linkedinUrl?: string;
  relevanceScore?: number;
  deepAnalysisScore?: number;
  source: 'CSV' | 'WEB';
}

type SortField = 'name' | 'title' | 'company' | 'location';
type SortOrder = 'asc' | 'desc';

const EnrichPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [manualData, setManualData] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSheetView, setShowSheetView] = useState(false);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [enrichedLeads, setEnrichedLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loadingEmails, setLoadingEmails] = useState<string[]>([]);
  const [loadingLinkedInUrls, setLoadingLinkedInUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for deep analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProfiles, setAnalyzingProfiles] = useState<Set<string>>(new Set());
  const [isAnalysisCriteriaModalOpen, setIsAnalysisCriteriaModalOpen] = useState(false);
  const [analysisCriteria, setAnalysisCriteria] = useState([
    { id: 1, value: '', placeholder: 'Years of experience in...' },
    { id: 2, value: '', placeholder: 'Graduation year after...' },
    { id: 3, value: '', placeholder: 'Years in industry...' }
  ]);
  const [deepAnalysisSelectedLeadId, setDeepAnalysisSelectedLeadId] = useState<string | null>(null);
  const [deepAnalysisSelectedLead, setDeepAnalysisSelectedLead] = useState<Lead | null>(null);
  const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);
  const [deepAnalysisResultsMap, setDeepAnalysisResultsMap] = useState<Record<string, any>>({});
  const [streamingProgress, setStreamingProgress] = useState<{
    total: number;
    completed: number;
    message: string;
  } | null>(null);
  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'text/csv' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format. Please upload CSV or XLSX files.`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    const newFiles: UploadedFile[] = [];

    for (const file of validFiles) {
      newFiles.push({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file // Store the actual File object for API calls
      });
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    if (newFiles.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) uploaded successfully.`,
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert API response to Lead format
  const convertApiResponseToLeads = (apiResults: any[]): Lead[] => {
    return apiResults.map((result, index) => {
      const lead: Lead = {
        id: result.profileIndex?.toString() || Math.random().toString(36).substring(7),
        name: result.fullName || result.csvData?.name || `Unknown ${index + 1}`,
        title: result.extractedTitle || result.csvData?.title || '',
        company: result.extractedCompany || result.csvData?.company || '',
        location: result.extractedLocation || result.csvData?.location || '',
        email: result.email || result.csvData?.email || '',
        linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || '',
        relevanceScore: result.originalRelevanceScore || 0,
        deepAnalysisScore: undefined,
        source: 'CSV' as const
      };

      return lead;
    });
  };

  // Process data using backend API (handles both file and raw text)
  const processDataWithApi = async (data: File | string): Promise<Lead[]> => {
    try {
      const formData = new FormData();
      if (typeof data === 'string') {
        formData.append('rawData', data);
      } else {
        formData.append('file', data);
      }

      const token = await authService.getToken();

      console.log('🔄 Processing data with backend API...');

      const response = await fetch(`${API_BASE_URL}/search/process-csv-profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ Data processing completed:', responseData.meta);

      if (!responseData.results || !Array.isArray(responseData.results)) {
        throw new Error('Invalid response format from API');
      }

      return convertApiResponseToLeads(responseData.results);

    } catch (error: any) {
      console.error('❌ Data processing failed:', error);
      throw error;
    }
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const AnalysisCriteriaModal = React.memo(() => {
    const [localCriteria, setLocalCriteria] = useState(analysisCriteria);

    useEffect(() => {
      setLocalCriteria(analysisCriteria);
    }, [analysisCriteria]);

    const handleLocalChange = useCallback((id: number, value: string) => {
      setLocalCriteria(prev =>
        prev.map(criteria =>
          criteria.id === id ? { ...criteria, value } : criteria
        )
      );
    }, []);

    const handleBlur = useCallback((id: number) => {
      const updatedCriteria = localCriteria.find(c => c.id === id);
      if (updatedCriteria) {
        setAnalysisCriteria(prev => prev.map(c => c.id === id ? updatedCriteria : c));
      }
    }, [localCriteria]);

    const handleAddCriteria = () => {
      const newId = Math.max(0, ...analysisCriteria.map(c => c.id)) + 1;
      setAnalysisCriteria([
        ...analysisCriteria,
        { id: newId, value: '', placeholder: 'Enter additional criteria' }
      ]);
    };

    const handleRemoveCriteria = (id: number) => {
      setAnalysisCriteria(prev => prev.filter(criteria => criteria.id !== id));
    };

    if (!isAnalysisCriteriaModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
            Analysis Criteria
          </h2>
          <div className="space-y-3 mb-6">
            {localCriteria.map((criteria) => (
              <div key={criteria.id} className="flex items-center gap-2">
                <Input
                  value={criteria.value}
                  onChange={(e) => handleLocalChange(criteria.id, e.target.value)}
                  onBlur={() => handleBlur(criteria.id)}
                  placeholder={criteria.placeholder}
                  className={`w-full ${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""}`}
                />
                {localCriteria.length > 1 && (
                  <button
                    onClick={() => handleRemoveCriteria(criteria.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove criteria"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={handleAddCriteria}
                className={`text-sm hover:underline ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                + Add Another Criteria
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsAnalysisCriteriaModalOpen(false)}
              disabled={isAnalyzing}
              className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalysisSubmit}
              disabled={isAnalyzing}
              className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </div>
    );
  });


  useEffect(() => {
    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
    };
  }, [streamCleanup]);

  const normalizeLinkedInUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/\/+$/, '');
    } catch {
      return url;
    }
  };

  const handleAnalyzeClick = (lead: Lead) => {
    setDeepAnalysisSelectedLeadId(lead.id);
    setDeepAnalysisSelectedLead(lead);
    setIsAnalysisCriteriaModalOpen(true);
  };

  const handleBatchAnalyzeClick = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No profiles selected",
        description: "Please select at least one profile to analyze.",
        variant: "destructive",
      });
      return;
    }
    setDeepAnalysisSelectedLeadId(null); // Clear single selection
    setDeepAnalysisSelectedLead(null); // Clear single selection
    setIsAnalysisCriteriaModalOpen(true);
  };

  const handleGetEmailsForSelected = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to get emails for.",
        variant: "destructive"
      });
      return;
    }

    setLoadingEmails(prev => [...prev, ...selectedLeads]);

    try {
      const leadsToProcess = enrichedLeads.filter(l => selectedLeads.includes(l.id) && l.linkedinUrl);
      if (leadsToProcess.length === 0) {
        toast({
          title: "No LinkedIn URLs found",
          description: "Cannot get emails for selected leads without LinkedIn URLs.",
          variant: "destructive"
        });
        setLoadingEmails([]);
        return;
      }

      const payload = {
        linkedinUrls: leadsToProcess.map(l => l.linkedinUrl!),
        profileData: leadsToProcess.map(l => {
          const nameParts = l.name.trim().split(' ');
          const firstname = nameParts[0] || '';
          const lastname = nameParts.slice(1).join(' ') || '';
          return {
            linkedinUrl: l.linkedinUrl,
            firstname,
            lastname,
            domainOrCompany: l.company || '',
          };
        }),
        profileIds: [], // Add empty array to satisfy type
      };

      await authService.getEmailsStream(
        payload,
        (data) => {
          switch (data.type) {
            case 'result': {
              const identifier = data.identifier;
              if (!identifier) break;

              const matchedLead = leadsToProcess.find(lead => lead.linkedinUrl && normalizeLinkedInUrl(lead.linkedinUrl) === normalizeLinkedInUrl(identifier));

              if (matchedLead) {
                setLoadingEmails(prev => prev.filter(id => id !== matchedLead.id));
                if (data.status === 'success' && data.emails && data.emails.length > 0) {
                  const emails = data.emails.map((email: any) => email.value || email.email).filter(Boolean).join(', ');
                  setEnrichedLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === matchedLead.id ? { ...l, email: emails } : l
                    )
                  );
                }
              }
              break;
            }
            case 'complete':
              toast({
                title: "Email extraction complete",
                description: `Processed ${data.totalProcessed} profiles.`,
              });
              break;
            case 'error':
              toast({
                title: "Error finding emails",
                description: data.message,
                variant: "destructive"
              });
              break;
          }
        },
        (error) => {
          toast({
            title: "Error finding emails",
            description: error.message,
            variant: "destructive",
          });
          setLoadingEmails([]);
        },
        () => {
          setLoadingEmails([]); // Clear all on completion
        }
      );
    } catch (error: any) {
      setLoadingEmails([]);
      toast({
        title: "Error",
        description: error.message || "Failed to start batch email search.",
        variant: "destructive",
      });
    }
  };

  const handleAnalysisSubmit = async () => {
    setIsAnalyzing(true);
    setIsAnalysisCriteriaModalOpen(false);
    let streamCleanupLocal: (() => void) | null = null;

    try {
      const filledCriteria = analysisCriteria.filter(c => c.value.trim() !== '');

      let linkedinUrls: string[] = [];
      const selectedProfileIds: string[] = deepAnalysisSelectedLeadId ? [deepAnalysisSelectedLeadId] : selectedLeads;

      setAnalyzingProfiles(new Set(selectedProfileIds));

      selectedProfileIds.forEach(profileId => {
        const profile = enrichedLeads.find(p => p.id === profileId);
        if (profile && profile.linkedinUrl) {
          linkedinUrls.push(profile.linkedinUrl);
        }
      });

      const payload: {
        criteria: string[];
        linkedinUrls?: string[];
      } = {
        criteria: filledCriteria.map(c => c.value),
      };

      if (linkedinUrls.length > 0) {
        payload.linkedinUrls = linkedinUrls;
      }

      const streamCleanup = await authService.deepAnalyseProfileStream(
        payload,
        (data) => {
          console.log('Stream data received:', data);

          switch (data.type) {
            case 'status':
              // No progress updates needed
              break;

            case 'result': {
              const identifier = data.identifier;
              if (!identifier) {
                break;
              }

              const profileToUpdate = enrichedLeads.find(profile => {
                if (profile.linkedinUrl) {
                  try {
                    return normalizeLinkedInUrl(profile.linkedinUrl) === normalizeLinkedInUrl(identifier);
                  } catch {
                    return false;
                  }
                }
                return false;
              });

              if (profileToUpdate) {
                const profileId = profileToUpdate.id;
                setAnalyzingProfiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(profileId);
                  return newSet;
                });

                if (data.status === 'success' && data.analysis) {
                  setDeepAnalysisResultsMap(prev => ({
                    ...prev,
                    [profileId]: {
                      analysis: data.analysis,
                      enrichedData: data.enrichedData,
                    }
                  }));

                  setEnrichedLeads(prevLeads =>
                    prevLeads.map(p =>
                      p.id === profileId
                        ? {
                          ...p,
                          deepAnalysisScore: data.analysis?.score,
                        }
                        : p
                    )
                  );
                }
              }
              break;
            }

            case 'complete':
              toast({
                title: "Deep analysis completed!",
                description: `Processed ${data.totalProcessed} profiles.`,
              });
              setAnalyzingProfiles(new Set());
              setIsAnalyzing(false);
              break;

            case 'error':
              toast({
                title: `Analysis error for ${data.identifier}`,
                description: data.message || data.error,
                variant: "destructive",
              });
              setAnalyzingProfiles(prev => {
                const newSet = new Set(prev);
                const profile = enrichedLeads.find(p => p.linkedinUrl && normalizeLinkedInUrl(p.linkedinUrl) === normalizeLinkedInUrl(data.identifier));
                if (profile) {
                  newSet.delete(profile.id);
                }
                return newSet;
              });
              break;
          }
        },
        (error) => {
          console.error('Stream error:', error);
          toast({
            title: "Analysis failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          setAnalyzingProfiles(new Set());
        },
        () => {
          console.log('Stream completed');
          setStreamCleanup(null);
        }
      );

      setStreamCleanup(() => streamCleanup);

    } catch (error) {
      console.error('Error during deep analysis:', error);
      toast({
        title: "Failed to start deep analysis",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      setAnalyzingProfiles(new Set());
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ?
      <ChevronUp className="h-3 w-3 inline ml-1" /> :
      <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(enrichedLeads.map(lead => lead.id));
    }
    setSelectAll(!selectAll);
  };

  const handleGetEmail = async (leadId: string) => {
    const lead = enrichedLeads.find(l => l.id === leadId);
    if (!lead) return;

    setLoadingEmails(prev => [...prev, leadId]);

    try {
      const payload: any = {};
      if (lead.linkedinUrl) {
        const nameParts = lead.name.trim().split(' ');
        const firstname = nameParts[0] || '';
        const lastname = nameParts.slice(1).join(' ') || '';

        payload.linkedinUrls = [lead.linkedinUrl];
        payload.profileData = [{
          linkedinUrl: lead.linkedinUrl,
          firstname,
          lastname,
          domainOrCompany: lead.company || '',
        }];
        payload.profileIds = []; // Add empty array to satisfy type
      } else {
        toast({
          title: "Cannot get email",
          description: "A LinkedIn URL is required to find an email address.",
          variant: "destructive"
        });
        setLoadingEmails(prev => prev.filter(id => id !== leadId));
        return;
      }

      await authService.getEmailsStream(
        payload,
        (data) => {
          switch (data.type) {
            case 'result':
              setLoadingEmails(prev => prev.filter(id => id !== leadId));
              if (data.status === 'success' && data.emails && data.emails.length > 0) {
                const emails = data.emails.map((email: any) => email.value || email.email).filter(Boolean).join(', ');
                setEnrichedLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === leadId ? { ...l, email: emails } : l
                  )
                );
              } else {
                toast({
                  title: "No email found",
                  description: `Could not find an email for ${lead.name}.`,
                  variant: "default"
                })
              }
              break;
            case 'complete':
              setLoadingEmails(prev => prev.filter(id => id !== leadId));
              break;
            case 'error':
              setLoadingEmails(prev => prev.filter(id => id !== leadId));
              toast({
                title: "Error finding email",
                description: data.message,
                variant: "destructive"
              });
              break;
          }
        },
        (error) => {
          setLoadingEmails(prev => prev.filter(id => id !== leadId));
          toast({
            title: "Error finding email",
            description: error.message,
            variant: "destructive",
          });
        },
        () => {
          setLoadingEmails(prev => prev.filter(id => id !== leadId));
        }
      );
    } catch (error: any) {
      setLoadingEmails(prev => prev.filter(id => id !== leadId));
      toast({
        title: "Error",
        description: error.message || "Failed to start email search.",
        variant: "destructive",
      });
    }
  };

  const handleGetLinkedInUrl = (leadId: string) => {
    toast({
      title: "LinkedIn enrichment",
      description: "LinkedIn URL enrichment feature coming soon",
    });
  };

  const handleDeepAnalysis = (leadId: string) => {
    toast({
      title: "Deep analysis",
      description: "Deep analysis feature coming soon",
    });
  };

  const sortedLeads = [...enrichedLeads].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const handleNext = async () => {
    if (activeTab === 'upload' && uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one CSV or XLSX file to continue.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === 'manual' && !manualData.trim()) {
      toast({
        title: "No data entered",
        description: "Please enter some data in the text area to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    if (activeTab === 'upload' && uploadedFiles.length > 0) {
      // Process the first file (CSV or XLSX)
      const uploadedFile = uploadedFiles[0];

      try {
        // Use backend API for both CSV and XLSX processing
        if (uploadedFile.file && (uploadedFile.name.endsWith('.csv') || uploadedFile.name.endsWith('.xlsx'))) {
          const leads = await processDataWithApi(uploadedFile.file);

          if (leads.length > 0) {
            setEnrichedLeads(leads);
            setShowSheetView(true);

            toast({
              title: "File processed successfully",
              description: `Processed ${leads.length} profiles using AI-powered analysis`,
            });
          } else {
            toast({
              title: "No valid data found",
              description: "The file doesn't contain any valid lead data/LinkedinUrls.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "No file content found",
            description: "Please upload a valid CSV or XLSX file to continue.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "Processing failed",
          description: error.message || "Failed to process the uploaded file.",
          variant: "destructive"
        });
      }
    } else if (activeTab === 'manual') {
      try {
        const leads = await processDataWithApi(manualData);

        // Only show sheet view if we have valid leads
        if (leads.length > 0) {
          setEnrichedLeads(leads);
          setShowSheetView(true);

          toast({
            title: "Data parsed successfully",
            description: `Parsed ${leads.length} profiles from manual entry`,
          });
        } else {
          toast({
            title: "No valid data found",
            description: "The entered data doesn't contain any valid lead information.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "Processing failed",
          description: error.message || "Failed to process the manual data.",
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
  };

  const handleEnrich = () => {
    // Here you would implement the actual enrichment logic
    toast({
      title: "Enrichment started",
      description: "Your data enrichment process has begun.",
    });
  };

  const handleBackToUpload = () => {
    setShowSheetView(false);
    setCsvData([]);
    setCsvHeaders([]);
    setEnrichedLeads([]);
    setSelectedLeads([]);
    setSelectAll(false);
    setLoadingEmails([]);
    setLoadingLinkedInUrls([]);
    setIsProcessing(false);

  };


  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-primary' : 'bg-white'} py-4 px-4`}>
      <AnalysisCriteriaModal />
      <DeepAnalysisModal
        isOpen={isDeepAnalysisModalOpen}
        onClose={() => {
          setIsDeepAnalysisModalOpen(false);
          setDeepAnalysisSelectedLeadId(null);
          setDeepAnalysisSelectedLead(null);
        }}
        lead={deepAnalysisSelectedLead}
        analysisResult={deepAnalysisSelectedLeadId ? deepAnalysisResultsMap[deepAnalysisSelectedLeadId] : null}
      />
      <div className={`${showSheetView ? 'max-w-7xl' : 'max-w-2xl'} mx-auto`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {showSheetView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToUpload}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Enrich
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-lg mx-auto`}>
            {showSheetView
              ? `Showing ${enrichedLeads.length} rows from your data`
              : "Enhance your existing data with additional information and insights"
            }
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className={`flex rounded-md p-0.5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-200 ${activeTab === 'upload'
                ? 'bg-black text-white shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Upload className="h-3 w-3" />
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-200 ${activeTab === 'manual'
                ? 'bg-black text-white shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Type className="h-3 w-3" />
              Manual Entry
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {showSheetView ? (
          // Sheet View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="space-y-4">


              {/* Export and Actions Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedLeads.length > 0 ? `${selectedLeads.length} selected` : `${enrichedLeads.length} total leads`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ExportDropdown
                    profiles={sortedLeads.map(lead => ({
                      _id: lead.id,
                      name: lead.name,
                      title: lead.title,
                      company: lead.company,
                      location: lead.location,
                      email: lead.email,
                      linkedinUrl: lead.linkedinUrl || '',
                      relevanceScore: lead.relevanceScore,
                      analysis: lead.deepAnalysisScore ? { score: lead.deepAnalysisScore } : undefined
                    }))}
                    selectedProfiles={selectedLeads}
                    fileName="enriched-data"
                  />
                  {selectedLeads.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchAnalyzeClick}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Analyze Selected ({selectedLeads.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGetEmailsForSelected}
                        disabled={loadingEmails.some(id => selectedLeads.includes(id))}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Get Emails ({selectedLeads.length})
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div
                className={`rounded-md border shadow-sm relative ${isDarkMode
                  ? "border-gray-700 bg-gray-900"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <style>{`
                  .enrich-table-container {
                    scrollbar-width: auto !important;
                    -ms-overflow-style: scrollbar !important;
                  }
                  .enrich-table-container::-webkit-scrollbar {
                    height: 12px !important;
                    width: 12px !important;
                    display: block !important;
                  }
                  .enrich-table-container::-webkit-scrollbar-track {
                    background: #f1f1f1 !important;
                  }
                  .enrich-table-container::-webkit-scrollbar-thumb {
                    background: #888 !important;
                    border-radius: 6px !important;
                  }
                  .enrich-table-container::-webkit-scrollbar-thumb:hover {
                    background: #555 !important;
                  }
                  .enrich-table-container .relative {
                    overflow: visible !important;
                  }
                `}</style>
                <div
                  className="rounded-t-md enrich-table-container"
                  style={{
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    overflowX: 'scroll',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'auto',
                    msOverflowStyle: 'scrollbar'
                  }}
                >
                  <div style={{ overflow: 'visible' }}>
                    <Table className={`border-collapse w-full min-w-[1600px] ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <TableHeader className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                        <TableRow className={`${isDarkMode ? "border-b border-gray-700" : "border-b border-gray-300"}`}>
                          <TableHead className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-16 rounded-tl-md`}>
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all leads"
                                className="mr-3"
                              />
                            </div>
                          </TableHead>
                          <TableHead className={`py-2 font-medium border-r whitespace-nowrap ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} w-5`}>
                            Sr. No.
                          </TableHead>
                          <TableHead
                            className={`py-2 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[150px]`}
                            onClick={() => handleSort('name')}
                          >
                            Name {renderSortIcon('name')}
                          </TableHead>
                          <TableHead
                            className={`py-2 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[180px]`}
                            onClick={() => handleSort('title')}
                          >
                            Title {renderSortIcon('title')}
                          </TableHead>
                          <TableHead
                            className={`py-2 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[150px]`}
                            onClick={() => handleSort('company')}
                          >
                            Company {renderSortIcon('company')}
                          </TableHead>
                          <TableHead
                            className={`py-2 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[120px]`}
                            onClick={() => handleSort('location')}
                          >
                            Location {renderSortIcon('location')}
                          </TableHead>
                          <TableHead className={`py-2 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[120px]`}>Deep Analysis</TableHead>
                          <TableHead className={`py-2 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[200px]`}>Email Address</TableHead>
                          <TableHead className={`py-2 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[250px]`}>LinkedIn URL</TableHead>
                          <TableHead className={`py-2 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[100px]`}>Source</TableHead>
                          <TableHead className={`py-2 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} w-24 rounded-tr-md`}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLeads.map((lead, index) => (
                          <TableRow
                            key={lead.id}
                            className={`transition-colors border-b ${isDarkMode
                              ? "bg-primary hover:bg-gray-950 border-gray-700"
                              : "bg-white hover:bg-gray-50 border-gray-300"
                              }`}
                          >
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-16`}>
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={selectedLeads.includes(lead.id)}
                                  onCheckedChange={() => handleSelectLead(lead.id)}
                                  aria-label={`Select ${lead.name}`}
                                  className={`mr-3  
                                  ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
                                  focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className={`font-medium py-2 border-r ${isDarkMode ? "text-gray-200 border-gray-700" : "border-gray-300"} w-16`}>{index + 1}</TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[150px]`}>
                              <span className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{lead.name}</span>
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[180px]`}>
                              <span className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {lead.title || 'No title provided'}
                              </span>
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[150px]`}>
                              <span className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{lead.company}</span>
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                              <span className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{lead.location}</span>
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                              {analyzingProfiles.has(lead.id) ? (
                                <Button variant="outline" className="text-xs h-8" disabled>Analyzing...</Button>
                              ) : lead.deepAnalysisScore !== undefined ? (
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto cursor-pointer"
                                  onClick={() => {
                                    setDeepAnalysisSelectedLeadId(lead.id);
                                    setDeepAnalysisSelectedLead(lead);
                                    setIsDeepAnalysisModalOpen(true);
                                  }}
                                >
                                  <span className="font-medium text-sm">{lead.deepAnalysisScore}</span>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAnalyzeClick(lead)}
                                  className="w-full text-xs h-8"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Analyze
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[200px]`}>
                              {lead.email && lead.email.trim() !== '' ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-green-500" />
                                  <span className={`text-sm truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    {lead.email}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGetEmail(lead.id)}
                                  disabled={loadingEmails.includes(lead.id)}
                                  className="w-full text-xs h-8"
                                >
                                  {loadingEmails.includes(lead.id) ? 'Getting...' : 'Get Email'}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[250px]`}>
                              {lead.linkedinUrl && lead.linkedinUrl.trim() !== '' ? (
                                <a
                                  href={lead.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                                >
                                  {lead.linkedinUrl}
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGetLinkedInUrl(lead.id)}
                                  disabled={loadingLinkedInUrls.includes(lead.id)}
                                  className="w-full text-xs h-8"
                                >
                                  Get LinkedIn URL
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[100px] text-center`}>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {lead.source}
                              </Badge>
                            </TableCell>
                            <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-24`}>
                              <div className="flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Lead saved",
                                      description: `${lead.name} has been saved to your project`,
                                    });
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <span className="text-xs">💾</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button for Sheet View */}
            <div className="flex justify-center">
              <Button
                onClick={handleEnrich}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm"
              >
                Start Enrichment
              </Button>
            </div>
          </motion.div>
        ) : (
          // Upload/Manual Entry View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activeTab === 'upload' ? (
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Upload Data Files
                  </CardTitle>
                  <CardDescription className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Upload CSV or XLSX files to enrich your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-md p-4 text-center transition-all duration-200 ${isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <Upload className={`h-6 w-6 mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Drag and drop files here
                    </h3>
                    <p className={`mb-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Support for CSV and XLSX files. For best results, include a column with LinkedIn profile URLs.
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor="file-upload" className="cursor-pointer text-xs">
                        Choose Files
                      </label>
                    </Button>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Uploaded Files
                      </h4>
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center justify-between p-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-blue-500" />
                            <div>
                              <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {file.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manual Data Entry
                  </CardTitle>
                  <CardDescription className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter your data manually in the text area below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                    placeholder="Paste profiles here, one per line. For best results, include a LinkedIn URL for each profile. You can also paste raw CSV data."
                    className={`min-h-[200px] text-sm ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                      }`}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {manualData.length} characters
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManualData('')}
                      disabled={!manualData.trim()}
                      className="text-xs h-6"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleNext}
                size="sm"
                disabled={isProcessing}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm"
              >
                {isProcessing ? 'Processing...' : 'Next'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnrichPage; 