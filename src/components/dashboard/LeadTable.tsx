import React, { useState, useEffect, useRef, memo } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, Settings, ExternalLink, Copy, Check, Download, CheckCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Search, BrainCog, Filter, Mail, Linkedin, ChevronDown, Upload, Play } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadFilters } from "./LeadFilters";
import { ProfileAnalysisModal } from "./ProfileAnalysisModal";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import authService from "@/services/authService";
import { toast } from "sonner";
import { DeepAnalysisModal } from "./DeepAnalysisModal";
import { useTheme } from "@/contexts/ThemeContext";
import { API_BASE_URL } from "@/services/api";

interface MatchedCriteria {
  title: boolean;
  location: boolean;
  industry: boolean;
}

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry?: string;
  experienceLevel?: string;
  companySize?: string;
  relevanceScore?: number;
  profileEvaluation: {
    status: string;
  };
  emailAddress: string;
  linkedinUrl: string;
  matchedCriteria?: MatchedCriteria;
  matchedCategoriesValue?: any;
  analysisScore?: number | string;
  analysisDescription?: string;
  analysisBreakdown?: { criterion: string; met: boolean }[];
  source?: string; // Added source field
  contactOutData?: any; // Added contactOutData field
  linkedinUrlStatus?: 'no_url_found' | 'failed'; // Added status for LinkedIn URL extraction
}

interface LinkedInProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl: string;
  email?: string; // Add email field for CSV imports
  relevanceScore: number | null;
  matchedCategories: any | null;
  matchedCategoriesValue: any | null;
  signalHireData?: {
    uid: string;
    fullName: string;
    location: string;
    experience: Array<{
      company: string;
      title: string;
    }>;
    skills: string[];
    contactsFetched: any;
  };
  source?: string;
  contactOutData?: any;
}

interface LeadTableProps {
  linkedInProfiles?: LinkedInProfile[];
  enrichedLeads?: string[];
  setEnrichedLeads?: React.Dispatch<React.SetStateAction<string[]>>;
  enrichmentRequestIds?: { [key: string]: string };
  setEnrichmentRequestIds?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  enrichmentData?: any;
  setEnrichmentData?: React.Dispatch<React.SetStateAction<any>>;
  onBack?: () => void;
}

interface LeadFilterState {
  title?: string;
  location?: string;
  industry?: string;
  experience?: string;
  companySize?: string;
  searchTerm: string;
  scoreCategories: {
    title: boolean;
    location: boolean;
    industry: boolean;
  };
  specificRequirements?: string[];
  source?: {
    csv: boolean;
    web: boolean;
  };
  fetchedFrom?: {
    signalhire: boolean;
    brave: boolean;
    google: boolean;
  };
  linkedinUrlStatus?: {
    hasUrl: boolean;
    noUrl: boolean;
    noUrlFound: boolean;
    failed: boolean;
  };
  deepAnalysisCriteria?: {
    minScore?: number;
    criteriaToMatch?: string[];
  };
}

type SortField = 'name' | 'title' | 'company' | 'industry' | 'location' | 'relevanceScore' | 'analysisScore';
type SortDirection = 'asc' | 'desc';

// Add this function to format LinkedIn results
const formatLinkedInResults = (results: any[]): LinkedInProfile[] => {
  return results.map(result => {
    // For SignalHire profiles, use the data directly from the result
    if (result.source === 'signalhire' || result.signalHireData) {
      return {
        firstName: result.pagemap?.metatags?.[0]?.['profile:first_name'] || result.signalHireData?.fullName?.split(' ')[0] || '',
        lastName: result.pagemap?.metatags?.[0]?.['profile:last_name'] || result.signalHireData?.fullName?.split(' ').slice(1).join(' ') || '',
        fullName: result.fullName || result.signalHireData?.fullName || '',
        title: result.extractedTitle || result.signalHireData?.experience?.[0]?.title || '',
        company: result.extractedCompany || result.signalHireData?.experience?.[0]?.company || '',
        location: (result.extractedLocation || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\u00A0/g, ' ')
          .replace(/\s*\.\.\.$/, '')
          .trim() || result.signalHireData?.location || '',
        linkedinUrl: result.linkedinUrl || result.link || '',
        email: result.email || result.csvData?.email || '', // Add email extraction
        relevanceScore: result.relevanceScore || null,
        matchedCategories: result.matchedCategories || null,
        matchedCategoriesValue: result.matchedCategoriesValue || null,
        signalHireData: result.signalHireData || null,
        source: result.source || null
      };
    }

    // For CSV import profiles, extract email from csvData
    if (result.source === 'csv_import') {
      const firstName = result.pagemap?.metatags?.[0]?.['profile:first_name'] || result.csvData?.name?.split(' ')[0] || '';
      const lastName = result.pagemap?.metatags?.[0]?.['profile:last_name'] || result.csvData?.name?.split(' ').slice(1).join(' ') || '';

      return {
        firstName,
        lastName,
        fullName: result.fullName || result.csvData?.name || `${firstName} ${lastName}`,
        title: result.extractedTitle || result.csvData?.title || '',
        company: result.extractedCompany || result.csvData?.company || '',
        location: (result.extractedLocation || result.csvData?.location || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\u00A0/g, ' ')
          .replace(/\s*\.\.\.$/, '')
          .trim(),
        linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || result.link || '',
        email: result.email || result.csvData?.email || '', // Extract email from CSV data
        relevanceScore: result.relevanceScore || null,
        matchedCategories: result.matchedCategories || null,
        matchedCategoriesValue: result.matchedCategoriesValue || null,
        signalHireData: null,
        source: result.source || 'csv_import',
        contactOutData: result.contactOutData || null,
      };
    }

    // For LinkedIn profiles, use the existing logic
    const metatags = result.pagemap?.metatags?.[0] || {};
    const removeEmojis = (str) => str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

    const firstNameRaw = metatags['profile:first_name'] || '';
    const lastNameRaw = metatags['profile:last_name'] || '';

    const firstName = removeEmojis(firstNameRaw).trim();
    const lastName = removeEmojis(lastNameRaw).trim();

    // Use extracted fields directly from the response
    const title = result.extractedTitle || '';
    const company = result.extractedCompany || '';
    const location = (result.extractedLocation || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s*\.\.\.$/, '')
      .trim();

    return {
      firstName,
      lastName,
      fullName: result.fullName || `${firstName} ${lastName}`,
      title,
      company,
      location,
      linkedinUrl: result.linkedinUrl || result.link || '',
      email: result.email || result.csvData?.email || '', // Extract email from CSV data or other sources
      relevanceScore: result.relevanceScore || null,
      matchedCategories: result.matchedCategories || null,
      matchedCategoriesValue: result.matchedCategoriesValue || null,
      signalHireData: null,
      source: result.source || 'web',
      contactOutData: result.contactOutData || null,
    };
  });
};

export function LeadTable({
  linkedInProfiles,
  enrichedLeads = [],
  setEnrichedLeads = () => { },
  enrichmentRequestIds = {},
  setEnrichmentRequestIds = () => { },
  enrichmentData = null,
  setEnrichmentData = () => { },
  onBack = () => { }
}: LeadTableProps) {
  const { isDarkMode } = useTheme();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [matchedCategoriesValues, setMatchedCategoriesValues] = useState<any[]>([]);
  const [filters, setFilters] = useState<LeadFilterState>({
    title: "all_titles",
    location: "all_locations",
    industry: "all_industries",
    experience: "all_experience",
    companySize: "all_company_sizes",
    searchTerm: "",
    scoreCategories: {
      title: false,
      location: false,
      industry: false
    },
    source: {
      csv: false,
      web: false
    },
    fetchedFrom: {
      signalhire: false,
      brave: false,
      google: false
    },
    linkedinUrlStatus: {
      hasUrl: false,
      noUrl: false,
      noUrlFound: false,
      failed: false
    }
  });
  const [isAdvancedFiltersModalOpen, setIsAdvancedFiltersModalOpen] = useState(false);
  const [availableDeepCriteria, setAvailableDeepCriteria] = useState<string[]>([]);
  const [selectedDeepCriteria, setSelectedDeepCriteria] = useState<string[]>([]);
  const [minScoreFilter, setMinScoreFilter] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add new state for analysis loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Deep analysis modal state
  const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);
  const [deepAnalysisResultsMap, setDeepAnalysisResultsMap] = useState<{ [leadId: string]: any }>({});
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
  const [deepAnalysisError, setDeepAnalysisError] = useState<string | null>(null);
  const [deepAnalysisSelectedLeadId, setDeepAnalysisSelectedLeadId] = useState<string | null>(null);
  const [deepAnalysisSelectedLead, setDeepAnalysisSelectedLead] = useState<Lead | null>(null);
  const [isDeepAnalysisCriteriaModalOpen, setIsDeepAnalysisCriteriaModalOpen] = useState(false);

  // Reuse analysisCriteria state for criteria input

  // Add these new state variables for SignalHire integration
  const [enrichingLeads, setEnrichingLeads] = useState<string[]>([]);
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);
  const [isBatchEnrichConfirmOpen, setIsBatchEnrichConfirmOpen] = useState(false);

  // New state for batch email loading
  const [loadingBatchEmails, setLoadingBatchEmails] = useState(false);

  // Add new streaming state
  const [streamingProgress, setStreamingProgress] = useState<{
    total: number;
    completed: number;
    message: string;
  } | null>(null);

  // New state for batch LinkedIn URL loading
  const [loadingBatchLinkedInUrls, setLoadingBatchLinkedInUrls] = useState(false);
  const [linkedInUrlProgress, setLinkedInUrlProgress] = useState<{
    total: number;
    completed: number;
    message: string;
  } | null>(null);
  const [loadingLinkedInUrls, setLoadingLinkedInUrls] = useState<string[]>([]);

  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);

  // Add new state to track profiles currently being analyzed
  const [analyzingProfiles, setAnalyzingProfiles] = useState<Set<string>>(new Set());

  // Add state to track which lead's emails are expanded
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  // Add file import state and ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add inline editing state
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [editedValues, setEditedValues] = useState<{ [key: string]: any }>({});

  const hasDeepAnalyzedLeads = () => {
    return Object.keys(deepAnalysisResultsMap).length > 0;
  };
  // Function to extract all unique criteria from deep analysis results
  useEffect(() => {
    if (Object.keys(deepAnalysisResultsMap).length > 0) {
      const allCriteria = new Set<string>();

      Object.values(deepAnalysisResultsMap).forEach(result => {
        if (result?.analysis?.breakdown) {
          result.analysis.breakdown.forEach((item: { criterion: string; met: boolean }) => {
            allCriteria.add(item.criterion);
          });
        }
      });

      setAvailableDeepCriteria(Array.from(allCriteria));
    }
  }, [deepAnalysisResultsMap]);

  // Function to apply advanced filters
  const handleApplyAdvancedFilters = () => {

    setSelectedLeads([]);
    setSelectAll(false);
    const newFilters = {
      ...filters,
      deepAnalysisCriteria: {
        minScore: minScoreFilter || undefined,
        criteriaToMatch: selectedDeepCriteria.length > 0 ? selectedDeepCriteria : undefined
      }
    };

    setFilters(newFilters);
    setIsAdvancedFiltersModalOpen(false);
  };
  // Function to clear advanced filters
  const handleClearAdvancedFilters = () => {
    const newFilters = { ...filters };
    delete newFilters.deepAnalysisCriteria;

    setFilters(newFilters);
    setSelectedDeepCriteria([]);
    setMinScoreFilter(null);
    setIsAdvancedFiltersModalOpen(false);
  };

  // Inline editing functions
  const handleCellEdit = (leadId: string, field: string, currentValue: string) => {
    setEditingCell({ leadId, field });
    setEditedValues({ [`${leadId}-${field}`]: currentValue });
  };

  const handleCellSave = (leadId: string, field: string) => {
    // Add a small delay to handle blur vs click conflicts
    setTimeout(() => {
      const editKey = `${leadId}-${field}`;
      const newValue = editedValues[editKey];

      if (newValue !== undefined) {
        // Update the lead in allLeads state
        setAllLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId
              ? { ...lead, [field]: newValue }
              : lead
          )
        );

        // Show success feedback
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      }

      // Clear editing state
      setEditingCell(null);
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[editKey];
        return newValues;
      });
    }, 100);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditedValues({});
  };

  const handleKeyPress = (e: React.KeyboardEvent, leadId: string, field: string) => {
    if (e.key === 'Enter') {
      handleCellSave(leadId, field);
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const renderEditableCell = (lead: Lead, field: string, value: string, className: string) => {
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field;
    const editKey = `${lead.id}-${field}`;

    if (isEditing) {
      return (
        <input
          type="text"
          value={editedValues[editKey] || ''}
          onChange={(e) => setEditedValues(prev => ({ ...prev, [editKey]: e.target.value }))}
          onKeyDown={(e) => handleKeyPress(e, lead.id, field)}
          onBlur={() => handleCellSave(lead.id, field)}
          className={`w-full h-full min-h-[32px] px-2 bg-transparent border-none outline-none text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'
            } focus:ring-0 focus:border-none`}
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit'
          }}
          autoFocus
        />
      );
    }

    return (
      <div className={`${className} w-full h-full min-h-[32px] flex items-center px-2`}>
        {value || <span className="text-gray-400 italic">Click to edit</span>}
      </div>
    );
  };

  // Handle file import
  const handleFileImport = () => {
    setIsImportModalOpen(true);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !fileName.toLowerCase().endsWith('.csv') && !fileName.toLowerCase().endsWith('.xlsx')) {
      toast.error('Please select a valid CSV or XLSX file');
      setIsImporting(false);
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      setIsImporting(false);
      return;
    }

    try {
      // Get filters from localStorage
      let filters: { field: string, value: string }[] = [];
      try {
        const savedFilters = localStorage.getItem('SpecificRequirementFilters');
        if (savedFilters) {
          filters = JSON.parse(savedFilters);
        }
      } catch (error) {
        console.error('Error parsing filters from localStorage:', error);
        // Continue with empty filters if parsing fails
      }

      console.log('Importing CSV with filters:', filters);
      toast.success(`Starting import of "${fileName}"...`);

      // Call the import API
      const response = await authService.importCSV(file, filters);

      if (response.success) {
        const importedCount = response.results?.length || 0;
        toast.success(`Successfully imported ${importedCount} profiles from "${fileName}"`);

        // If we get imported profiles  add them to the UI
        if (response.results && Array.isArray(response.results)) {
          console.log('Imported profiles:', response.results);

          // Convert imported profiles to Lead format
          const convertedImportedLeads: Lead[] = response.results.map((profile: any, index: number) => {
            // Create matchedCriteria based on matchedFilters
            const matchedCriteria: MatchedCriteria = {
              title: profile.matchedFilters?.title && profile.matchedFilters.title.length > 0,
              location: profile.matchedFilters?.location && profile.matchedFilters.location.length > 0,
              industry: profile.matchedFilters?.industry && profile.matchedFilters.industry.length > 0
            };

            // Generate unique ID for imported profiles
            const uniqueId = `imported_${Date.now()}_${index}`;

            return {
              id: uniqueId,
              name: profile.fullName || profile.name || '',
              title: profile.extractedTitle || profile.title || '',
              company: profile.extractedCompany || profile.company || '',
              location: profile.extractedLocation || profile.location || '',
              industry: profile.extractedIndustry || profile.industry || '',
              experienceLevel: '',
              companySize: '',
              relevanceScore: '3/3', // Set to 3 for 3/3 display
              profileEvaluation: {
                status: "Imported from CSV"
              },
              emailAddress: '',
              linkedinUrl: profile.linkedinUrl || '',
              matchedCriteria: matchedCriteria,
              matchedCategoriesValue: {
                details: {
                  title: profile.matchedFilters?.title || [],
                  location: profile.matchedFilters?.location || [],
                  industry: profile.matchedFilters?.industry || []
                }
              },
              source: "CSV", // Set source for imported profiles
            };
          });

          // Filter out duplicates before adding to allLeads
          setAllLeads(prevLeads => {
            const { unique: uniqueProfiles, duplicates: duplicatesCount } = filterDuplicateImports(convertedImportedLeads, prevLeads);

            // Show appropriate feedback to user
            if (duplicatesCount > 0) {
              if (uniqueProfiles.length > 0) {
                toast.success(`${uniqueProfiles.length} new profiles added to the table! ${duplicatesCount} duplicate profiles were skipped.`);
              } else {
                toast.warning(`All ${duplicatesCount} profiles were duplicates and skipped.`);
              }
            } else {
              toast.success(`${uniqueProfiles.length} profiles added to the table!`);
            }

            return [...prevLeads, ...uniqueProfiles];
          });
        }
      } else {
        // Display the specific error message from the API
        const errorMessage = response.message || response.error || 'Unknown error occurred';
        toast.error(`Import failed: ${errorMessage}`);
        console.error('Import failed:', response);
      }
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(`Import failed: ${error.message || 'Network error occurred'}`);
    } finally {
      // Reset file input
      event.target.value = '';
      setIsImporting(false);
    }
  };

  // Handler to fetch emails for selected leads in batch using streaming
  const handleBatchGetEmailsClick = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to get emails.");
      return;
    }

    // Set loading state for all selected leads
    setLoadingEmails(prev => [...prev, ...selectedLeads]);
    setLoadingBatchEmails(true);

    try {
      // Separate LinkedIn URLs and SignalHire profile IDs
      let linkedinUrls: string[] = [];
      let profileIds: string[] = [];
      let profileData: any[] = [];

      selectedLeads.forEach(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        if (!lead) return;

        // Check if this is a SignalHire profile (has signalHireData.uid)
        const originalProfile = linkedInProfiles?.find(p =>
          p.signalHireData?.uid === leadId || p.linkedinUrl === leadId
        );

        if (originalProfile?.signalHireData?.uid) {
          // This is a SignalHire profile, use the uid
          profileIds.push(originalProfile.signalHireData.uid);
        } else if (lead.linkedinUrl && lead.linkedinUrl.trim() !== '') {
          // This is a LinkedIn profile, use the raw URL (not normalized)
          linkedinUrls.push(lead.linkedinUrl);

          // Add profile data for LinkedIn profiles
          const nameParts = lead.name.trim().split(' ');
          const firstname = nameParts[0] || '';
          const lastname = nameParts.slice(1).join(' ') || '';

          profileData.push({
            linkedinUrl: lead.linkedinUrl,
            firstname: firstname,
            lastname: lastname,
            domainOrCompany: lead.company || ''
          });
        }
      });

      const totalProfiles = linkedinUrls.length + profileIds.length;

      // Initialize progress tracking
      setStreamingProgress({
        total: totalProfiles,
        completed: 0,
        message: 'Starting email extraction...'
      });

      const payload = {
        linkedinUrls: linkedinUrls,
        profileIds: profileIds,
        profileData: profileData
      };

      console.log('Starting streaming email extraction with payload:', payload);

      // Use the new streaming method
      const cleanup = await authService.getEmailsStream(
        payload,
        // onStreamData callback
        (data) => {
          console.log('Email stream data received:', data);

          switch (data.type) {
            case 'status':
              setStreamingProgress(prev => ({
                ...prev,
                total: data.total || prev?.total || totalProfiles,
                completed: data.completed || prev?.completed || 0,
                message: data.message || 'Processing...'
              }));
              break;

            case 'enrichment_status':
              setStreamingProgress(prev => ({
                ...prev,
                message: data.message || 'Enriching profiles...'
              }));
              // Removed enrichment status toast - only show final completion count
              break;

            case 'enrichment_complete':
              setStreamingProgress(prev => ({
                ...prev,
                message: data.message || 'Enrichment complete, extracting emails...'
              }));
              break;

            case 'result':
              // Handle individual result - need to find profile by the identifier
              const identifier = data.identifier;
              if (!identifier) {
                console.warn("Received result without identifier, skipping:", data);
                break;
              }

              // Find the lead in the table that matches the identifier
              // The identifier can be a LinkedIn URL or a SignalHire profile ID
              let matchedLead = null;

              // First, try to match by lead.id (for SignalHire profiles)
              matchedLead = allLeads.find(lead => lead.id === identifier);

              // If not found, try to match by LinkedIn URL (normalize both URLs for comparison)
              if (!matchedLead) {
                matchedLead = allLeads.find(lead => {
                  if (!lead.linkedinUrl) return false;
                  try {
                    return normalizeLinkedInUrl(lead.linkedinUrl) === normalizeLinkedInUrl(identifier);
                  } catch {
                    return lead.linkedinUrl === identifier;
                  }
                });
              }

              // If still not found, try exact LinkedIn URL match
              if (!matchedLead) {
                matchedLead = allLeads.find(lead => lead.linkedinUrl === identifier);
              }

              if (matchedLead) {
                const profileId = matchedLead.id;
                console.log('Batch email: Found matching lead for identifier:', identifier, 'profileId:', profileId);

                // Remove from analyzing set since this profile is now complete
                setAnalyzingProfiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(profileId);
                  return newSet;
                });

                // Update progress incrementally
                setStreamingProgress(prev => {
                  const newCompleted = data.progress?.completed || (prev ? prev.completed + 1 : 1);
                  const total = data.progress?.total || prev?.total || totalProfiles;

                  return {
                    total: total,
                    completed: newCompleted,
                    message: `Extracting emails... (${newCompleted}/${total})`
                  };
                });

                if (data.status === 'success' && data.emails && data.emails.length > 0) {
                  // Extract email addresses from the emails array
                  const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');
                  console.log('Batch email: Updating emails for profileId:', profileId, 'emails:', emails);

                  // Update the emailAddress field in allLeads state
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: emails } : l
                    )
                  );

                  // Removed individual success toast - only show final completion count
                } else if (data.status === 'failed') {
                  console.log('Batch email: Failed status for profileId:', profileId, 'error:', data.error);
                  // Removed individual error toast - only show final completion count
                } else {
                  console.log('Batch email: No emails found for profileId:', profileId, 'data.emails:', data.emails, 'data.status:', data.status);
                  // Removed individual warning toast - only show final completion count
                }
              } else {
                console.log('Batch email: No matching lead found for identifier:', identifier);
                console.log('Batch email: Available lead IDs:', allLeads.map(l => ({ id: l.id, linkedinUrl: l.linkedinUrl, name: l.name })));
              }
              break;

            case 'complete':
              setStreamingProgress(prev => ({
                ...prev,
                completed: prev?.total || totalProfiles,
                message: 'Email extraction complete!'
              }));
              toast.success(`Email extraction completed! Processed ${data.totalProcessed} profiles.`);

              // Auto-close progress after a delay
              setTimeout(() => {
                setStreamingProgress(null);
                setLoadingBatchEmails(false);
              }, 2000);
              break;

            case 'error':
              toast.error(`Email extraction error: ${data.message}`);
              setStreamingProgress(null);
              setLoadingBatchEmails(false);
              setLoadingEmails([]); // Clear all loading states on error
              break;

            default:
              console.log('Unknown stream data type:', data.type);
          }
        },
        // onError callback
        (error) => {
          console.error('Email stream error:', error);
          toast.error(`Email extraction failed: ${error.message || 'Unknown error'}`);
          setStreamingProgress(null);
          setLoadingBatchEmails(false);
          setLoadingEmails([]); // Clear all loading states on error
        },
        // onComplete callback
        () => {
          console.log('Email stream completed');
          setStreamCleanup(null);
          setLoadingEmails([]); // Clear all loading states on completion
        }
      );

      setStreamCleanup(() => cleanup);

    } catch (error: any) {
      console.error('Failed to start streaming email extraction:', error);
      toast.error('Failed to start email extraction');
      setLoadingBatchEmails(false);
      setStreamingProgress(null);
      setLoadingEmails([]); // Clear all loading states on error
    }
  };

  // State to store emails per lead
  // Removed emailsMap and popup state as no longer needed

  // Removed email popup state and handlers

  // Function to handle Get Email button click using streaming API
  const handleGetEmailClick = async (lead: Lead) => {
    setLoadingEmails(prev => [...prev, lead.id]);

    try {
      // Prepare payload for single profile
      let profileData: any[] = [];

      // Add profile data if it's a LinkedIn profile
      if (lead.linkedinUrl) {
        const nameParts = lead.name.trim().split(' ');
        const firstname = nameParts[0] || '';
        const lastname = nameParts.slice(1).join(' ') || '';

        profileData.push({
          linkedinUrl: lead.linkedinUrl,
          firstname: firstname,
          lastname: lastname,
          domainOrCompany: lead.company || ''
        });
      }

      const payload = {
        linkedinUrls: lead.linkedinUrl ? [lead.linkedinUrl] : [],
        profileIds: !lead.linkedinUrl && lead.id.length === 32 ? [lead.id] : [],
        profileData: profileData
      };

      console.log('Starting single email extraction for:', lead.name, payload);

      // Use the streaming method for consistency
      const cleanup = await authService.getEmailsStream(
        payload,
        // onStreamData callback
        (data) => {
          console.log('Single email stream data received:', data);

          switch (data.type) {
            case 'result':
              // Remove loading state when we get a result
              setLoadingEmails(prev => prev.filter(id => id !== lead.id));

              // Handle the result for this specific profile
              if (data.status === 'success' && data.emails && data.emails.length > 0) {
                // Extract email addresses from the emails array
                const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');

                // Update the emailAddress field in allLeads state
                setAllLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: emails } : l
                  )
                );

                // Removed individual success toast - emails will be visible in table
              } else if (data.status === 'failed') {
                console.log(`Failed to get emails for ${lead.name}: ${data.error}`);
                // Removed individual error toast
              } else {
                console.log(`No emails found for ${lead.name}`);
                // Removed individual warning toast
              }
              break;

            case 'complete':
              console.log('Single email extraction completed');
              // Remove loading state when stream completes (if not already removed)
              setLoadingEmails(prev => prev.filter(id => id !== lead.id));
              break;

            case 'error':
              // Remove loading state on error
              setLoadingEmails(prev => prev.filter(id => id !== lead.id));
              console.log(`Email extraction error: ${data.message}`);
              // Removed individual error toast
              break;

            default:
              // Handle other message types silently for single profile
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('Single email stream error:', error);
          // Remove loading state on error
          setLoadingEmails(prev => prev.filter(id => id !== lead.id));
          toast.error(`Error fetching emails: ${error.message || 'Unknown error'}`);
        },
        // onComplete callback
        () => {
          console.log('Single email stream completed');
          // Remove loading state when stream completes (if not already removed)
          setLoadingEmails(prev => prev.filter(id => id !== lead.id));
        }
      );

      // Note: We don't need to store cleanup for single profile requests
      // as they complete quickly

    } catch (error: any) {
      console.error('Failed to start single email extraction:', error);
      // Remove loading state on error
      setLoadingEmails(prev => prev.filter(id => id !== lead.id));
      toast.error(`Error fetching emails: ${error.message || error}`);
    }
  };

  // Function to handle Get LinkedIn URL button click
  const handleGetLinkedInUrlClick = async (lead: Lead) => {
    setLoadingLinkedInUrls(prev => [...prev, lead.id]);
    try {
      const token = await authService.getToken();

      // Find the original profile to get the SignalHire UID
      const originalProfile = linkedInProfiles?.find(p =>
        p.signalHireData?.uid === lead.id || p.linkedinUrl === lead.id
      );

      // Use SignalHire UID if available, otherwise fall back to lead.id
      const profileIdToSend = originalProfile?.signalHireData?.uid || lead.id;

      const response = await fetch(`${API_BASE_URL}/profile/get-linkedin-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profileIds: [profileIdToSend]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.results && data.results.length > 0) {
        // Find the result for this specific profile (using the sent profile ID)
        const profileResult = data.results.find((r: any) => r.profileId === profileIdToSend);

        if (profileResult) {
          if (profileResult.status === 'success' && profileResult.linkedinUrl) {
            // Update the linkedinUrl field in allLeads state
            setAllLeads(prevLeads =>
              prevLeads.map(l =>
                l.id === lead.id ? { ...l, linkedinUrl: profileResult.linkedinUrl } : l
              )
            );
            toast.success(`LinkedIn URL found for ${lead.name}: ${profileResult.linkedinUrl}`);
          } else if (profileResult.status === 'no_linkedin_url_found') {
            // Update the lead with no_url_found status
            setAllLeads(prevLeads =>
              prevLeads.map(l =>
                l.id === lead.id ? { ...l, linkedinUrlStatus: 'no_url_found' } : l
              )
            );
            toast.warning(`No LinkedIn URL found for ${lead.name}`);
          } else if (profileResult.status === 'failed') {
            // Handle failed status with specific error message and update status
            const errorMessage = profileResult.error || 'Failed to fetch profile data';
            setAllLeads(prevLeads =>
              prevLeads.map(l =>
                l.id === lead.id ? { ...l, linkedinUrlStatus: 'failed' } : l
              )
            );
            toast.error(`Failed to get LinkedIn URL for ${lead.name}: ${errorMessage}`);
          } else {
            // Update with failed status for unknown errors
            setAllLeads(prevLeads =>
              prevLeads.map(l =>
                l.id === lead.id ? { ...l, linkedinUrlStatus: 'failed' } : l
              )
            );
            toast.error(`Failed to get LinkedIn URL for ${lead.name}`);
          }
        } else {
          toast.error(`No result found for ${lead.name}`);
        }
      } else {
        toast.error(`No LinkedIn URL found for ${lead.name}`);
      }
    } catch (error: any) {
      toast.error(`Error finding LinkedIn URL: ${error.message || error}`);
    } finally {
      setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));
    }
  };

  // Add new state for loading emails
  const [loadingEmails, setLoadingEmails] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('relevanceScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Add these new state variables for profile saving
  const [savingProfiles, setSavingProfiles] = useState<string[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAnalysisCriteriaModalOpen, setIsAnalysisCriteriaModalOpen] = useState(false);
  const [analysisCriteria, setAnalysisCriteria] = useState([
    { id: 1, value: '', placeholder: 'Years of experience in...' },
    { id: 2, value: '', placeholder: 'Graduation year after...' },
    { id: 3, value: '', placeholder: 'Years in industry...' }
  ]);

  // New state for Save to Project modal
  const [isSaveToProjectModalOpen, setIsSaveToProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [leadToSave, setLeadToSave] = useState<Lead | null>(null);

  // New state for available projects and selection
  const [availableProjects, setAvailableProjects] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    // Only add the event listener if we have data to preserve
    if (allLeads.length > 0) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // Standard way to show a confirmation dialog
        const message = "You have unsaved LinkedIn profile data. If you leave or reload, this data will be lost. Are you sure you want to continue?";
        e.preventDefault();
        e.returnValue = message; // This is needed for Chrome
        return message; // This is needed for other browsers
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Clean up the event listener when component unmounts
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [allLeads.length]);

  // Add this useEffect to sync enrichment data with parent component
  useEffect(() => {
    // When enrichmentData changes in the parent component, update allLeads accordingly
    if (enrichmentData && allLeads.length > 0) {
      setAllLeads(prevLeads => {
        return prevLeads.map(lead => {
          // Check if this lead has enrichment data
          if (enrichedLeads.includes(lead.id)) {
            // Get the enriched fields for this lead
            const enrichedFields = enrichmentData.enrichedFields?.[lead.id];

            // Apply enrichment data to the lead
            return {
              ...lead,
              // Apply the enriched fields if available
              name: enrichedFields?.name || lead.name,
              title: enrichedFields?.title || lead.title,
              company: enrichedFields?.company || lead.company,
              location: enrichedFields?.location || lead.location,
              emailAddress: enrichedFields?.emailAddress || lead.emailAddress,
              analysisScore: enrichedFields?.analysisScore ?? lead.analysisScore,
              analysisDescription: enrichedFields?.analysisDescription ?? lead.analysisDescription,
              analysisBreakdown: enrichedFields?.analysisBreakdown ?? lead.analysisBreakdown,
              profileEvaluation: { status: "Enriched" }
            };
          }

          // Check if this lead has analysis data
          if (enrichmentData.analysisResults && enrichmentData.analysisResults[lead.linkedinUrl]) {
            const analysisData = enrichmentData.analysisResults[lead.linkedinUrl];
            return {
              ...lead,
              analysisScore: analysisData.score,
              analysisDescription: analysisData.description
            };
          }

          return lead;
        });
      });
    }
  }, [enrichmentData, enrichedLeads, allLeads.length]);

  // Fetch user projects when modal opens
  useEffect(() => {
    if (isSaveToProjectModalOpen) {
      authService.getUserProjects()
        .then(response => {
          console.log("projects", response)
          if (response && Array.isArray(response)) {
            setAvailableProjects(response);
          } else {
            toast.error("Failed to load projectsssss");
          }
        })
        .catch(() => {
          toast.error("Failed to load projects");
        });
    }
  }, [isSaveToProjectModalOpen]);

  // Convert LinkedIn profiles to Lead format
  useEffect(() => {
    if (linkedInProfiles === undefined) {
      // This is the initial state before any search. Keep the loader on.
      setIsLoading(true);
      setAllLeads([]);
      return;
    }
    setIsLoading(true);
    if (linkedInProfiles && linkedInProfiles.length > 0) {
      console.log("Original LinkedIn profiles:", linkedInProfiles);

      // Format the raw LinkedIn results
      const formattedProfiles = formatLinkedInResults(linkedInProfiles);
      console.log("Formatted LinkedIn profiles:", formattedProfiles);

      // Add deduplication logic
      const deduplicatedProfiles = deduplicateProfiles(formattedProfiles);
      console.log("Deduplicated profiles:", deduplicatedProfiles);

      // Extract matchedCategoriesValues from profiles
      const categoryValues = linkedInProfiles
        .map(profile => profile.matchedCategoriesValue)
        .filter(value => value !== undefined && value !== null);

      setMatchedCategoriesValues(categoryValues);

      const convertedLeads = deduplicatedProfiles.map((profile, index) => {
        console.log(`Profile ${index} relevanceScore:`, profile.relevanceScore);

        // Extract industry information if available in matchedCategories
        let industry = "";
        if (profile.matchedCategories && profile.matchedCategories.industry) {
          // matchedCategories.industry can be boolean or array, handle accordingly
          if (Array.isArray(profile.matchedCategories.industry) && profile.matchedCategories.industry.length > 0) {
            industry = profile.matchedCategories.industry[0];
          } else if (typeof profile.matchedCategories.industry === "string") {
            industry = profile.matchedCategories.industry;
          } else if (profile.matchedCategories.industry === true) {
            industry = linkedInProfiles.find(p => p.linkedinUrl === profile.linkedinUrl)?.matchedCategoriesValue?.details?.industry?.[0] || "";
          }
        }

        // Create matchedCriteria object from matchedCategories
        const matchedCriteria: MatchedCriteria = {
          title: Array.isArray(profile.matchedCategories?.title)
            ? profile.matchedCategories.title.length > 0
            : Boolean(profile.matchedCategories?.title),
          location: Array.isArray(profile.matchedCategories?.location)
            ? profile.matchedCategories.location.length > 0
            : Boolean(profile.matchedCategories?.location),
          industry: Array.isArray(profile.matchedCategories?.industry)
            ? profile.matchedCategories.industry.length > 0
            : Boolean(profile.matchedCategories?.industry)
        };
        function extractLinkedInId(url) {
          const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
          return match ? match[1] : "";
        }

        // Use SignalHire uid if available, otherwise use linkedinUrl as fallback
        const uniqueId = profile.signalHireData?.uid || profile.linkedinUrl || `profile_${index}`;

        return {
          id: uniqueId,
          name: profile.fullName,
          title: profile.title,
          company: profile.company,
          location: profile.location,
          industry: industry, // Set the industry value
          experienceLevel: "", // Not available from the profile data
          companySize: "", // Not available from the profile data
          relevanceScore: profile.relevanceScore || 0,
          profileEvaluation: {
            status: "Not evaluated",
          },
          emailAddress: profile.email || "",
          linkedinUrl: profile.linkedinUrl,
          matchedCriteria: matchedCriteria,
          matchedCategoriesValue: profile.matchedCategoriesValue,
          source: profile.source === "csv_import" ? "CSV" : "WEB", // Set source for LinkedIn profiles
          contactOutData: profile.contactOutData || null,
        };
      });

      console.log("Converted leads:", convertedLeads);
      setAllLeads(convertedLeads);
    } else if (linkedInProfiles) {
      setAllLeads([]);
    }
  }, [linkedInProfiles]);

  // Helper functions for normalization and deduplication
  const normalizeName = (name: string) => {
    if (!name || typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\b(jr|sr|iii|ii|iv)\b/g, '') // Remove suffixes
      .replace(/\b(mr|mrs|ms|dr|prof)\b/g, '') // Remove titles
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Helper function to normalize company names
  const normalizeCompany = (company: string) => {
    if (!company || typeof company !== 'string') return '';
    return company
      .toLowerCase()
      .replace(/\b(inc|ltd|llc|corp|corporation|company|co|ab|group|gmbh|sa)\b/g, '') // Remove corp suffixes
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const normalizeLinkedInUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/\/+$/, ''); // trim trailing slash
      return `https://www.linkedin.com${pathname}`;
    } catch (err) {
      return url; // fallback
    }
  };

  // Function to check if two profiles are duplicates
  const areProfilesDuplicates = (profile1: any, profile2: any): boolean => {
    // Check LinkedIn URL first (most reliable)
    const url1 = normalizeLinkedInUrl(profile1.linkedinUrl || '');
    const url2 = normalizeLinkedInUrl(profile2.linkedinUrl || '');
    if (url1 && url2 && url1 === url2) {
      return true;
    }

    // Check normalized name + normalized company
    const name1 = normalizeName(profile1.name || '');
    const name2 = normalizeName(profile2.name || '');
    const company1 = normalizeCompany(profile1.company || '');
    const company2 = normalizeCompany(profile2.company || '');

    if (name1 && name2 && company1 && company2) {
      if (name1 === name2 && company1 === company2) {
        return true;
      }
    }

    // Check normalized name + title + company (fallback)
    const title1 = (profile1.title || '').toLowerCase().trim();
    const title2 = (profile2.title || '').toLowerCase().trim();

    if (name1 && name2 && title1 && title2 && company1 && company2) {
      if (name1 === name2 && title1 === title2 && company1 === company2) {
        return true;
      }
    }

    return false;
  };

  // Function to filter out duplicates from imported profiles
  const filterDuplicateImports = (importedProfiles: Lead[], existingProfiles: Lead[]): { unique: Lead[], duplicates: number } => {
    const uniqueProfiles: Lead[] = [];
    let duplicatesCount = 0;

    importedProfiles.forEach(importedProfile => {
      // Check if this imported profile is a duplicate of any existing profile
      const isDuplicate = existingProfiles.some(existingProfile =>
        areProfilesDuplicates(importedProfile, existingProfile)
      );

      if (!isDuplicate) {
        // Also check against already processed unique profiles to avoid internal duplicates
        const isInternalDuplicate = uniqueProfiles.some(uniqueProfile =>
          areProfilesDuplicates(importedProfile, uniqueProfile)
        );

        if (!isInternalDuplicate) {
          uniqueProfiles.push(importedProfile);
        } else {
          duplicatesCount++;
        }
      } else {
        duplicatesCount++;
      }
    });

    return { unique: uniqueProfiles, duplicates: duplicatesCount };
  };

  // Function to deduplicate profiles - keep SignalHire over Google profiles
  const deduplicateProfiles = (profiles: LinkedInProfile[]): LinkedInProfile[] => {
    // Create a map to group profiles by name, title, and company
    const profileGroups = new Map<string, LinkedInProfile[]>();

    profiles.forEach(profile => {
      // Create a key based on normalized name, title, and company
      const key = `${profile.fullName?.toLowerCase().trim()}_${profile.title?.toLowerCase().trim()}_${profile.company?.toLowerCase().trim()}`;

      if (!profileGroups.has(key)) {
        profileGroups.set(key, []);
      }
      profileGroups.get(key)!.push(profile);
    });

    const deduplicatedProfiles: LinkedInProfile[] = [];

    // Process each group
    profileGroups.forEach((group, key) => {
      if (group.length === 1) {
        // No duplicates, add the profile as is
        deduplicatedProfiles.push(group[0]);
      } else {
        // Multiple profiles with same name, title, company
        console.log(`Found ${group.length} duplicate profiles for key: ${key}`, group);

        // Separate SignalHire and Google profiles
        const signalHireProfiles = group.filter(profile =>
          profile.signalHireData?.uid &&
          profile.signalHireData.uid.length === 32 &&
          (!profile.linkedinUrl || profile.linkedinUrl.trim() === '')
        );

        const googleProfiles = group.filter(profile =>
          !profile.signalHireData?.uid &&
          profile.linkedinUrl &&
          profile.linkedinUrl.trim() !== ''
        );

        // Prefer SignalHire profiles over Google profiles
        if (signalHireProfiles.length > 0) {
          console.log(`Keeping SignalHire profile over ${googleProfiles.length} Google profile(s) for: ${key}`);
          // If multiple SignalHire profiles, take the first one
          deduplicatedProfiles.push(signalHireProfiles[0]);
        } else if (googleProfiles.length > 0) {
          // No SignalHire profiles, keep the first Google profile
          console.log(`No SignalHire profile found, keeping Google profile for: ${key}`);
          deduplicatedProfiles.push(googleProfiles[0]);
        } else {
          // Fallback - neither clearly identified, keep the first one
          console.log(`Unable to clearly identify profile types, keeping first profile for: ${key}`);
          deduplicatedProfiles.push(group[0]);
        }
      }
    });

    console.log(`Deduplication complete: ${profiles.length} -> ${deduplicatedProfiles.length} profiles`);
    return deduplicatedProfiles;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((leadId) => leadId !== id));
      setSelectAll(false);
    } else {
      setSelectedLeads([...selectedLeads, id]);
      if (selectedLeads.length + 1 === filteredLeads.length) {
        setSelectAll(true);
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // Set the copied URL to show feedback
      setCopiedUrl(url);

      // Reset after 2 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedUrl(null);
      }, 2000);
    });
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Update filters with new search term
    const newFilters = {
      ...filters,
      searchTerm: value
    };
    setFilters(newFilters);

  };

  const handleFiltersApplied = (newFilters: LeadFilterState) => {
    console.log("Filters applied:", newFilters);

    // Clear selected leads when filters are applied
    setSelectedLeads([]);
    setSelectAll(false);

    // Check if it's a clear filters operation
    const isClearing = newFilters.title === "all_titles" &&
      newFilters.location === "all_locations" &&
      newFilters.industry === "all_industries" &&
      newFilters.experience === "all_experience" &&
      newFilters.companySize === "all_company_sizes" &&
      !newFilters.searchTerm;

    if (isClearing) {
      // Reset search input when clearing filters
      setSearchInput("");
    } else {
      // Preserve the direct search input if it exists
      if (searchInput && !newFilters.searchTerm) {
        newFilters.searchTerm = searchInput;
      } else if (newFilters.searchTerm) {
        // Update search input if filter has a search term
        setSearchInput(newFilters.searchTerm);
      }
    }

    setFilters(newFilters);
    // setCurrentPage is not defined, so remove or handle pagination reset differently
  };

  // Handle opening the profile analysis modal
  const handleOpenAnalysisModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsAnalysisModalOpen(true);
  };

  // Add these new handler functions for SignalHire integration
  const handleEnrichProfile = async (lead: Lead) => {
    // Set the lead as currently enriching (loading state)
    setEnrichingLeads(prev => [...prev, lead.id]);

    try {
      // Make the actual API call to your backend using authService
      const response = await authService.enrichProfile(lead.linkedinUrl);

      console.log('Enrichment request sent:', response);

      // Store the requestId for polling
      if (response.success && response.requestId) {
        setEnrichmentRequestIds(prev => ({
          ...prev,
          [lead.id]: response.requestId
        }));

        // Start polling for results
        pollEnrichmentStatus(lead.id, response.requestId);
      }
    } catch (error) {
      console.error("Error enriching profile:", error);
      // Handle error case here
      toast.error(`Error enriching profile: ${error.message}`);
    } finally {
      // We'll keep the lead in enriching state until polling completes
      // The polling function will remove it from enrichingLeads when done
    }
  };

  const handleBatchEnrich = async () => {
    // First, open the confirmation popup
    setIsBatchEnrichConfirmOpen(true);
  };

  const confirmBatchEnrich = async () => {
    // Close the confirmation modal
    setIsBatchEnrichConfirmOpen(false);

    // Get the LinkedIn URLs of selected leads
    const selectedLinkedInUrls = selectedLeads.map(leadId => {
      const lead = allLeads.find(l => l.id === leadId);
      return lead?.linkedinUrl || "";
    }).filter(url => url !== "");

    if (selectedLinkedInUrls.length === 0) {
      alert("No valid LinkedIn URLs found in the selected leads.");
      return;
    }

    try {
      // Set all selected leads as currently enriching (loading state)
      setEnrichingLeads(prev => [...prev, ...selectedLeads]);

      // Make the API call to your backend using authService
      const response = await authService.enrichBatchProfiles(selectedLinkedInUrls);

      console.log('Batch enrichment request sent:', response);

      // Handle the response - this will depend on your API's response structure
      if (response.success && response.results) {
        // Create a map of LinkedIn URLs to lead IDs
        const urlToLeadIdMap = {};
        selectedLeads.forEach(leadId => {
          const lead = allLeads.find(l => l.id === leadId);
          if (lead?.linkedinUrl) {
            urlToLeadIdMap[lead.linkedinUrl] = leadId;
          }
        });

        // Store the requestIds for polling
        const requestIdMap = {};

        // Process each result and start polling
        response.results.forEach(result => {
          const leadId = urlToLeadIdMap[result.linkedinUrl.trim()];
          if (leadId && result.requestId) {
            // Store the requestId for this lead
            requestIdMap[leadId] = result.requestId;

            // Start polling for this lead
            pollEnrichmentStatus(leadId, result.requestId);
          }
        });

        setEnrichmentRequestIds(prev => ({
          ...prev,
          ...requestIdMap
        }));
      }
    } catch (error) {
      console.error("Error in batch enrichment:", error);
      // Handle error case here
      alert(`Failed to enrich profiles: ${error.message || 'Unknown error'}`);

      // Remove the loading state from the leads
      setEnrichingLeads(prev => prev.filter(id => !selectedLeads.includes(id)));
    }
  };

  const pollEnrichmentStatus = async (leadId: string, requestId: string) => {
    try {
      // Poll for results with exponential backoff
      let attempts = 0;
      const maxAttempts = 5;
      const pollInterval = 3000; // Start with 3 seconds

      const poll = async () => {
        if (attempts >= maxAttempts) {
          console.log(`Polling stopped after ${maxAttempts} attempts`);
          setEnrichingLeads(prev => prev.filter(id => id !== leadId));
          toast.error("Enrichment timed out. Please try enriching the profile again.");
          return;
        }

        try {
          const response = await authService.pollingFunction(requestId);
          console.log('Polling response:', response);

          if (response && response.status === 'success' && response.data) {
            // We have the enriched data, update the lead
            updateLeadWithEnrichedData(leadId, response.data);
            setEnrichedLeads(prev => [...prev, leadId]);
            setEnrichingLeads(prev => prev.filter(id => id !== leadId));
            return;
          }

          // If still processing, continue polling with backoff
          attempts++;
          const nextInterval = pollInterval * Math.pow(1.5, attempts);
          setTimeout(poll, nextInterval);
        } catch (error) {
          console.error('Error polling for enrichment status:', error);
          setEnrichingLeads(prev => prev.filter(id => id !== leadId));
        }
      };

      // Start polling
      poll();
    } catch (error) {
      console.error('Error in polling function:', error);
      setEnrichingLeads(prev => prev.filter(id => id !== leadId));
    }
  };
  const updateLeadWithEnrichedData = (leadId: string, enrichedData: any) => {
    // Create an enriched lead object with all the updated fields
    const updatedLead = {
      id: leadId,
      name: enrichedData.fullName || "",
      title: enrichedData.experience?.[0]?.position || "",
      company: enrichedData.experience?.[0]?.company || "",
      location: enrichedData.locations?.[0]?.name || "",
      emailAddress: enrichedData.emails?.[0]?.email || ""
    };

    // Update local state
    setAllLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId
          ? {
            ...lead,
            name: updatedLead.name || lead.name,
            title: updatedLead.title || lead.title,
            company: updatedLead.company || lead.company,
            location: updatedLead.location || lead.location,
            emailAddress: updatedLead.emailAddress || lead.emailAddress,
            profileEvaluation: { status: "Enriched" }
          }
          : lead
      )
    );

    // Store the enriched data in a consistent structure that can be properly synchronized
    setEnrichmentData(prev => {
      // Create a new object to avoid mutation
      const newEnrichmentData = { ...prev } || {};

      // Ensure the required structures exist
      if (!newEnrichmentData.rawData) newEnrichmentData.rawData = {};
      if (!newEnrichmentData.enrichedFields) newEnrichmentData.enrichedFields = {};

      // Store the raw API response
      newEnrichmentData.rawData[leadId] = enrichedData;

      // Store the structured enriched fields
      newEnrichmentData.enrichedFields[leadId] = {
        name: updatedLead.name,
        title: updatedLead.title,
        company: updatedLead.company,
        location: updatedLead.location,
        emailAddress: updatedLead.emailAddress,
        analysisScore: updatedLead.analysisScore,
        analysisDescription: updatedLead.analysisDescription,
        analysisBreakdown: updatedLead.analysisBreakdown
      };

      return newEnrichmentData;
    });
  };

  const handleViewEnrichmentDetails = async (lead: Lead) => {
    // Check if we have a requestId for this lead
    const requestId = enrichmentRequestIds[lead.id];

    if (!requestId) {
      console.error('No requestId found for this lead');
      alert('Enrichment data not available for this lead');
      return;
    }

    try {
      // Fetch the latest enrichment data
      const response = await authService.pollingFunction(requestId);

      if (response && response.status === 'success' && response.data) {
        // Set the enrichment data directly from the response
        // This preserves all the original structure from the API
        setEnrichmentData(response.data);
        setSelectedLead(lead);
        setIsEnrichmentModalOpen(true);
      } else {
        alert('Enrichment data not available or still processing');
      }
    } catch (error) {
      console.error('Error fetching enrichment details:', error);
      alert(`Failed to fetch enrichment details: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveProfile = async (leads: Lead | Lead[], projectId?: string) => {
    const leadsArray = Array.isArray(leads) ? leads : [leads];

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }

    setSavingProfiles(prev => [...prev, ...leadsArray.map(l => l.id)]);
    setSaveError(null);



    try {
      const payload = leadsArray.map(lead => {
        const deepAnalysisResult = deepAnalysisResultsMap[lead.id];

        return {
          projectId,
          name: lead.name,
          title: lead.title,
          company: lead.company,
          location: lead.location,
          linkedinUrl: lead.linkedinUrl,
          email: lead.emailAddress,
          relevanceScore: lead.relevanceScore?.toString() || '',
          matchedCategories: lead.matchedCriteria ? {
            location: lead.matchedCriteria.location ? [lead.location] : [],
            title: lead.matchedCriteria.title ? [lead.title] : [],
            industry: lead.matchedCriteria.industry ? [lead.industry || ''] : []
          } : {},
          matchedCategoriesValue: lead.matchedCategoriesValue || {},
          analysis: deepAnalysisResult ? {
            enrichedData: deepAnalysisResult.enrichedData ?? null,
            score: deepAnalysisResult.analysis?.score ?? null,
            description: deepAnalysisResult.analysis?.description ?? '',
            breakdown: deepAnalysisResult.analysis?.breakdown ?? []
          } : undefined
        };
      });

      const response = await authService.saveProfileToProject(payload);

      if (response.success) {
        setSavedProfiles(prev => [...prev, ...leadsArray.map(l => l.id)]);
        toast.success(`Profiles saved successfully to project!`);
      } else if (response.message) {
        toast.success(response.message);
      } else {
        setSaveError(`Failed to save profiles: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error saving profiles:", error);
      setSaveError(`Failed to save profiles: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingProfiles(prev => prev.filter(id => !leadsArray.map(l => l.id).includes(id)));
    }
  };

  const [deepAnalysisSelectedLeadIds, setDeepAnalysisSelectedLeadIds] = React.useState<string[]>([]);

  // Single lead analyze click
  const handleAnalyzeClick = (lead: Lead) => {
    setDeepAnalysisSelectedLeadId(lead.id);
    setDeepAnalysisSelectedLead(lead);
    setDeepAnalysisSelectedLeadIds([]); // Clear batch selection
    setIsAnalysisCriteriaModalOpen(true);
  };

  // Batch analyze click
  const handleBatchAnalyzeClick = () => {
    if (selectedLeads.length === 0) {
      alert("Please select at least one profile to analyze.");
      return;
    }
    setDeepAnalysisSelectedLeadIds(selectedLeads);
    setDeepAnalysisSelectedLeadId(null);
    setDeepAnalysisSelectedLead(null);
    setIsAnalysisCriteriaModalOpen(true);
  };

  const handleCriteriaChange = (id: number, value: string) => {
    setAnalysisCriteria(prev =>
      prev.map(criteria =>
        criteria.id === id ? { ...criteria, value } : criteria
      )
    );
  };

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



  // Update the handleAnalysisSubmit function to use streaming
  const handleAnalysisSubmit = async () => {
    setIsAnalyzing(true);
    setIsAnalysisCriteriaModalOpen(false);
    let streamCleanup: (() => void) | null = null;

    try {
      const filledCriteria = analysisCriteria.filter(c => c.value.trim() !== '');

      let linkedinUrls: string[] = [];
      let profileIds: string[] = [];
      let enrichedProfiles: { id: string, contactOutData: any }[] = [];
      let selectedLeadIds: string[] = [];

      if (deepAnalysisSelectedLeadIds.length > 0) {
        selectedLeadIds = deepAnalysisSelectedLeadIds;
      } else if (deepAnalysisSelectedLeadId) {
        selectedLeadIds = [deepAnalysisSelectedLeadId];
      }

      // Set analyzing state for all selected profiles
      setAnalyzingProfiles(new Set(selectedLeadIds));

      // Separate LinkedIn URLs and SignalHire profile IDs
      selectedLeadIds.forEach(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
          console.log('lead', lead);
          if (lead.contactOutData) {
            enrichedProfiles.push({ id: lead.id, contactOutData: lead.contactOutData });
            return;
          }

          if (lead.linkedinUrl) {
            linkedinUrls.push(lead.linkedinUrl);
          } else {
            profileIds.push(lead.id);
          }
        }
      });

      const payload: {
        criteria: string[];
        linkedinUrls?: string[];
        profileIds?: string[];
        enrichedProfiles?: { id: string, contactOutData: any }[];
      } = {
        criteria: filledCriteria.map(c => c.value),
      };

      if (linkedinUrls.length > 0) {
        payload.linkedinUrls = linkedinUrls;
      }
      if (profileIds.length > 0) {
        payload.profileIds = profileIds;
      }
      if (enrichedProfiles.length > 0) {
        payload.enrichedProfiles = enrichedProfiles;
      }

      const response = await authService.deepAnalyseProfileStream(
        payload,
        // onStreamData callback
        (data) => {
          console.log('Stream data received:', data);

          switch (data.type) {
            case 'status':
              setStreamingProgress(prev => ({
                ...prev,
                total: data.total || prev?.total || totalProfiles,
                completed: data.completed || prev?.completed || 0,
                message: data.message || 'Processing...'
              }));
              break;

            case 'enrichment_status':
              setStreamingProgress(prev => ({
                ...prev,
                message: data.message || 'Enriching profiles...'
              }));
              // Removed enrichment status toast - only show final completion count
              break;

            case 'enrichment_complete':
              setStreamingProgress(prev => ({
                ...prev,
                message: data.message || 'Enrichment complete, analyzing...'
              }));
              break;

            case 'result': {
              const identifier = data.identifier;
              if (!identifier) {
                console.warn('Received result without identifier, skipping:', data);
                break;
              }

              // Find lead by ID or by normalizing the identifier URL
              const leadToUpdate = allLeads.find(lead => {
                // Match by ID (for SignalHire)
                if (lead.id === identifier) {
                  return true;
                }
                // Match by normalized LinkedIn URL (for web/ContactOut profiles)
                if (lead.linkedinUrl) {
                  try {
                    return normalizeLinkedInUrl(lead.linkedinUrl) === normalizeLinkedInUrl(identifier);
                  } catch {
                    return false;
                  }
                }
                return false;
              });

              if (leadToUpdate) {
                const profileId = leadToUpdate.id;
                // Remove from analyzing set since this profile is now complete
                setAnalyzingProfiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(profileId);
                  return newSet;
                });

                // Update progress incrementally
                setStreamingProgress(prev => {
                  const newCompleted = data.progress?.completed || (prev ? prev.completed + 1 : 1);
                  const total = data.progress?.total || prev?.total || totalProfiles;

                  return {
                    total: total,
                    completed: newCompleted,
                    message: `Analyzing profiles... (${newCompleted}/${total})`
                  };
                });

                if (data.status === 'success' && data.analysis) {
                  setDeepAnalysisResultsMap(prev => ({
                    ...prev,
                    [profileId]: {
                      linkedinUrl: data.linkedinUrl || '',
                      profileId: data.profileId || '',
                      name: data.name,
                      enrichedData: data.enrichedData,
                      analysis: data.analysis
                    }
                  }));

                  // Extract enriched fields from data.enrichedData
                  const enrichedData = data.enrichedData || {};
                  const fullName = enrichedData.fullName || "";
                  let title = "";
                  if (Array.isArray(enrichedData.experience)) {
                    const currentExp = enrichedData.experience.find((exp: any) => exp.current === true);
                    if (currentExp && currentExp.position) {
                      title = currentExp.position;
                    } else if (enrichedData.experience.length > 0) {
                      title = enrichedData.experience[0].position || "";
                    }
                  }
                  let location = "";
                  if (Array.isArray(enrichedData.locations) && enrichedData.locations.length > 0) {
                    location = enrichedData.locations[0].name || "";
                  }
                  let company = "";
                  if (Array.isArray(enrichedData.experience)) {
                    const currentCompanyExp = enrichedData.experience.find((exp: any) => exp.current === true && exp.company);
                    if (currentCompanyExp) {
                      company = currentCompanyExp.company;
                    } else if (enrichedData.experience.length > 0) {
                      company = enrichedData.experience[0].company || "";
                    }
                  }

                  // Extract LinkedIn URL from social array - only for SignalHire profiles
                  let linkedinUrl = "";
                  if (data.profileId && Array.isArray(enrichedData.social)) {
                    // Only update LinkedIn URL for SignalHire profiles
                    const linkedinSocial = enrichedData.social.find((social: any) => social.type === "li");
                    if (linkedinSocial && linkedinSocial.link) {
                      linkedinUrl = linkedinSocial.link;
                    }
                  }

                  // Update the lead in the main allLeads array with BOTH analysis AND enriched data
                  setAllLeads(prev => prev.map(lead =>
                    lead.id === profileId
                      ? {
                        ...lead,
                        // Update with enriched data if available, otherwise keep original
                        name: fullName || lead.name,
                        title: title || lead.title,
                        company: company || lead.company,
                        location: location || lead.location,
                        // Only update LinkedIn URL for SignalHire profiles
                        linkedinUrl: data.profileId ? (linkedinUrl || lead.linkedinUrl) : lead.linkedinUrl,
                        // Update analysis data
                        analysisScore: data.analysis?.score,
                        analysisDescription: data.analysis?.description,
                        analysisBreakdown: data.analysis?.breakdown
                      }
                      : lead
                  ));

                  // Update enrichmentData for persistence
                  setEnrichmentData(prev => {
                    const newEnrichmentData = { ...prev } || {};
                    if (!newEnrichmentData.enrichedFields) newEnrichmentData.enrichedFields = {};

                    newEnrichmentData.enrichedFields[profileId] = {
                      name: fullName,
                      title: title,
                      company: company,
                      location: location,
                      // Only include LinkedIn URL in enrichment data for SignalHire profiles
                      linkedinUrl: data.profileId ? linkedinUrl : undefined,
                      analysisScore: data.analysis?.score ?? null,
                      analysisDescription: data.analysis?.description ?? null,
                      analysisBreakdown: data.analysis?.breakdown ?? null
                    };

                    return newEnrichmentData;
                  });

                } else if (data.status === 'failed') {
                  console.log(`Failed to analyze ${data.name || data.linkedinUrl || data.profileId}: ${data.error}`);
                  // Removed individual error toast - only show final completion count
                }
              }
              break;
            }

            case 'complete':
              setStreamingProgress(prev => ({
                ...prev,
                completed: prev?.total || totalProfiles,
                message: 'Analysis complete!'
              }));
              toast.success(`Deep analysis completed! Processed ${data.totalProcessed} profiles.`);

              // Clear all analyzing profiles
              setAnalyzingProfiles(new Set());

              // Auto-close progress after a delay
              setTimeout(() => {
                setStreamingProgress(null);
                setIsAnalyzing(false);
              }, 2000);
              break;

            case 'error': {
              const identifier = data.identifier;

              // Check if we already have a successful result for this lead
              if (identifier) {
                const leadToUpdate = allLeads.find(lead => {
                  if (!lead.linkedinUrl) return false;
                  try {
                    return normalizeLinkedInUrl(lead.linkedinUrl) === normalizeLinkedInUrl(identifier);
                  } catch { return false; }
                });

                if (leadToUpdate && deepAnalysisResultsMap[leadToUpdate.id]) {
                  console.log(`Ignoring subsequent error for already processed profile: ${identifier}`);
                  break; // Don't show an error toast
                }
              }

              console.log(`Analysis error: ${data.message || data.error}`);
              // Removed individual error toast - only show final completion count
              setStreamingProgress(null);
              setIsAnalyzing(false);
              setAnalyzingProfiles(new Set()); // Clear analyzing state on error
              break;
            }

            default:
              console.log('Unknown stream data type:', data.type);
              setStreamingProgress(null);
              setIsAnalyzing(false);
              setAnalyzingProfiles(new Set()); // Clear analyzing state on error
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('Stream error:', error);

          // More specific error messages
          let errorMessage = 'Analysis failed';
          if (error.message?.includes('HTTP error')) {
            errorMessage = 'Server error during analysis. Please try again.';
          } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorMessage = 'Network error during analysis. Please check your connection and try again.';
          } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
            errorMessage = 'Data parsing error. The analysis will retry automatically.';
          } else if (error.message) {
            errorMessage = `Analysis failed: ${error.message}`;
          }

          toast.error(errorMessage);
          setStreamingProgress(null);
          setIsAnalyzing(false);
          setAnalyzingProfiles(new Set()); // Clear analyzing state on error
        },
        // onComplete callback
        () => {
          console.log('Stream completed');
          setStreamCleanup(null);
          setAnalyzingProfiles(new Set()); // Clear analyzing state on completion
        }
      );

      setStreamCleanup(() => streamCleanup);

    } catch (error) {
      console.error('Failed to start streaming analysis:', error);
      toast.error('Failed to start analysis');
      setIsAnalyzing(false);
      setStreamingProgress(null);
      setAnalyzingProfiles(new Set()); // Clear analyzing state on error
    }
  };

  const handleBatchSaveProfiles = async () => {
    if (selectedLeads.length === 0) {
      alert("No profiles selected for saving.");
      return;
    }

    // Get the selected lead objects
    const selectedLeadObjects = selectedLeads
      .map(leadId => allLeads.find(l => l.id === leadId))
      .filter((lead): lead is Lead => lead !== undefined);

    if (selectedLeadObjects.length === 0) {
      alert("No valid leads found in the selected leads.");
      return;
    }

    if (!selectedProjectId) {
      alert("Please select a project to save the profiles.");
      return;
    }

    // Prepare payload array with projectId for each lead
    const payload = selectedLeadObjects.map(lead => ({
      projectId: selectedProjectId,
      name: lead.name,
      title: lead.title,
      company: lead.company,
      location: lead.location,
      linkedinUrl: lead.linkedinUrl,
      email: lead.emailAddress,
      relevanceScore: lead.relevanceScore ? lead.relevanceScore.toString() : '',
      matchedCategories: lead.matchedCriteria ? {
        location: lead.matchedCriteria.location ? [lead.location] : [],
        title: lead.matchedCriteria.title ? [lead.title] : [],
        industry: lead.matchedCriteria.industry ? [lead.industry || ''] : []
      } : {},
      matchedCategoriesValue: lead.matchedCategoriesValue || {}
    }));

    // Set all selected leads as currently saving (loading state)
    setSavingProfiles(prev => [...prev, ...selectedLeads]);
    setSaveError(null);

    try {
      // Make the API call to save the profiles in batch with projectId
      const response = await authService.saveProfileToProject(payload);

      console.log('Batch save response:', response);

      if (response.success) {
        // Add all successfully saved profiles to the saved list
        setSavedProfiles(prev => {
          const newSaved = [...prev];
          selectedLeads.forEach(leadId => {
            if (!newSaved.includes(leadId)) {
              newSaved.push(leadId);
            }
          });
          return newSaved;
        });

        // Show success message
        toast(`${selectedLeads.length} profiles saved successfully to project!`);
      } else {
        // Handle error case
        setSaveError(`Failed to save profiles: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error batch saving profiles:", error);
      setSaveError(`Failed to save profiles: ${error.message || 'Unknown error'}`);
    } finally {
      // Remove all from saving state
      setSavingProfiles(prev => prev.filter(id => !selectedLeads.includes(id)));
    }
  };

  // Mapping from filter values to actual data fields
  const locationMapping: { [key: string]: string } = {
    unitedStates: "United States",
    unitedKingdom: "United Kingdom",
    canada: "Canada",
    germany: "Germany",
    france: "France",
    australia: "Australia",
    japan: "Japan",
    india: "India",
    singapore: "Singapore",
    sweden: "Sweden",
  };

  // Title mapping
  const titleMapping: { [key: string]: string } = {
    ceo: "CEO",
    cto: "CTO",
    cfo: "CFO",
    vp: "VP",
    director: "Director",
    manager: "Manager",
    associate: "Associate",
    consultant: "Consultant",
    specialist: "Specialist",
    owner: "Owner",
  };

  // Industry mapping
  const industryMapping: { [key: string]: string } = {
    technology: "Technology",
    finance: "Finance",
    healthcare: "Healthcare",
    manufacturing: "Manufacturing",
    retail: "Retail",
    education: "Education",
    consulting: "Consulting",
    realEstate: "Real Estate",
    hospitality: "Hospitality",
    media: "Media & Entertainment",
  };

  // Helper function to parse analysis score strings like "1/2" and convert to comparable number
  const parseAnalysisScore = (scoreString: string | number | undefined): number => {
    if (!scoreString) return -1; // No score = unanalyzed

    if (typeof scoreString === 'number') return scoreString;

    if (typeof scoreString === 'string') {
      // Handle "X/Y" format
      const match = scoreString.match(/^(\d+)\/(\d+)$/);
      if (match) {
        const numerator = parseInt(match[1]);
        const denominator = parseInt(match[2]);
        return denominator > 0 ? numerator / denominator : -1;
      }

      // Handle plain number strings
      const parsed = parseFloat(scoreString);
      return isNaN(parsed) ? -1 : parsed;
    }

    return -1;
  };

  // Sorting function
  const sortLeads = (leads: Lead[], field: SortField, direction: SortDirection): Lead[] => {
    return [...leads].sort((a, b) => {
      // Special handling for analysisScore to prioritize analyzed leads
      if (field === 'analysisScore') {
        const scoreA = parseAnalysisScore(a.analysisScore);
        const scoreB = parseAnalysisScore(b.analysisScore);

        // If both are analyzed or both are unanalyzed, sort by score
        if ((scoreA >= 0 && scoreB >= 0) || (scoreA < 0 && scoreB < 0)) {
          if (direction === 'asc') {
            return scoreA - scoreB;
          } else {
            return scoreB - scoreA;
          }
        }

        // Prioritize analyzed leads (scoreA >= 0) over unanalyzed (scoreA < 0)
        if (scoreA >= 0 && scoreB < 0) return -1;
        if (scoreA < 0 && scoreB >= 0) return 1;

        return 0;
      }

      let valueA = a[field];
      let valueB = b[field];

      // Handle null or undefined values
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      // For strings, perform case-insensitive comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (direction === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }

      // For numbers and other types
      if (direction === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
      }
    });
  };

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };


  // Apply filters to leads
  useEffect(() => {

    let filtered = [...allLeads];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.title.toLowerCase().includes(searchLower) ||
          lead.company.toLowerCase().includes(searchLower) ||
          lead.location.toLowerCase().includes(searchLower)
      );
    }

    // Check if any Score Category filters are applied
    const anyScoreCategorySelected = Object.values(filters.scoreCategories).some(value => value === true);

    // Apply Score Categories filters only if at least one is selected
    if (anyScoreCategorySelected) {
      // Apply positive filters (show leads that match selected criteria)
      if (filters.scoreCategories.title) {
        filtered = filtered.filter(
          (lead) => lead.matchedCriteria?.title === true
        );
      }

      if (filters.scoreCategories.location) {
        filtered = filtered.filter(
          (lead) => lead.matchedCriteria?.location === true
        );
      }

      if (filters.scoreCategories.industry) {
        filtered = filtered.filter(
          (lead) => lead.matchedCriteria?.industry === true
        );
      }
    }

    // Apply Specific Requirements filters
    if (filters.specificRequirements && filters.specificRequirements.length > 0) {
      filtered = filtered.filter(lead => {
        // Skip leads without matchedCategoriesValue
        if (!lead.matchedCategoriesValue || !lead.matchedCategoriesValue.details) {
          return false;
        }

        // Check if all of the specific requirements match
        const details = lead.matchedCategoriesValue.details;
        const allValues = [
          ...(details.location || []),
          ...(details.title || []),
          ...(details.industry || [])
        ].map(val => val.trim());

        // Lead passes only if it contains ALL of the selected requirements
        return filters.specificRequirements.every(requirement =>
          allValues.some(value =>
            value.toLowerCase().includes(requirement.toLowerCase())
          )
        );
      });
    }

    // Apply Deep Analysis Criteria filters
    if (filters.deepAnalysisCriteria) {
      filtered = filtered.filter(lead => {
        // Get analysis data from deepAnalysisResultsMap using lead ID
        const analysisData = deepAnalysisResultsMap[lead.id];

        // Skip leads without analysis data
        if (!analysisData || !analysisData.analysis) {
          return false;
        }

        const analysisScore = analysisData.analysis.score;
        const analysisBreakdown = analysisData.analysis.breakdown;

        // Check minimum score if specified
        if (filters.deepAnalysisCriteria.minScore !== undefined) {
          if (!analysisScore || analysisScore < filters.deepAnalysisCriteria.minScore) {
            return false;
          }
        }

        // Check specific criteria if specified
        if (filters.deepAnalysisCriteria.criteriaToMatch &&
          filters.deepAnalysisCriteria.criteriaToMatch.length > 0 &&
          analysisBreakdown) {

          // Get all criteria that were met
          const metCriteria = analysisBreakdown
            .filter((item: { criterion: string; met: boolean }) => item.met)
            .map((item: { criterion: string; met: boolean }) => item.criterion);

          // Check if all selected criteria are met
          return filters.deepAnalysisCriteria.criteriaToMatch.every(
            criterion => metCriteria.includes(criterion)
          );
        }

        return true;
      });
    }

    // Apply Source filters
    if (filters.source) {
      const anySourceFilterSelected = Object.values(filters.source).some(value => value === true);

      if (anySourceFilterSelected) {
        filtered = filtered.filter(lead => {
          // If CSV filter is selected and lead is from CSV
          if (filters.source?.csv && lead.source === 'CSV') {
            return true;
          }

          // If web filter is selected and lead is from web
          if (filters.source?.web && (lead.source === 'WEB' || !lead.source)) {
            return true;
          }

          return false;
        });
      }
    }

    // Apply Fetched From filters
    if (filters.fetchedFrom) {
      const anyFetchedFromFilterSelected = Object.values(filters.fetchedFrom).some(value => value === true);

      if (anyFetchedFromFilterSelected) {
        filtered = filtered.filter(lead => {
          // Find the original profile to get the source information
          const originalProfile = linkedInProfiles?.find(p =>
            p.signalHireData?.uid === lead.id || p.linkedinUrl === lead.linkedinUrl
          );

          if (!originalProfile) {
            return false;
          }

          // Check fetched from filters
          if (filters.fetchedFrom?.signalhire && originalProfile.source === 'signalhire') {
            return true;
          }

          if (filters.fetchedFrom?.brave && originalProfile.source === 'brave') {
            return true;
          }

          if (filters.fetchedFrom?.google && originalProfile.source === 'google') {
            return true;
          }

          return false;
        });
      }
    }

    // Apply LinkedIn URL Status filters
    if (filters.linkedinUrlStatus) {
      const anyLinkedInUrlStatusSelected = Object.values(filters.linkedinUrlStatus).some(value => value === true);

      if (anyLinkedInUrlStatusSelected) {
        filtered = filtered.filter(lead => {
          // Has LinkedIn URL
          if (filters.linkedinUrlStatus?.hasUrl && lead.linkedinUrl && lead.linkedinUrl.trim() !== '') {
            return true;
          }

          // No LinkedIn URL (never processed)
          if (filters.linkedinUrlStatus?.noUrl && (!lead.linkedinUrl || lead.linkedinUrl.trim() === '') && !lead.linkedinUrlStatus) {
            return true;
          }

          // No URL Found (searched but none found)
          if (filters.linkedinUrlStatus?.noUrlFound && lead.linkedinUrlStatus === 'no_url_found') {
            return true;
          }

          // Failed to fetch
          if (filters.linkedinUrlStatus?.failed && lead.linkedinUrlStatus === 'failed') {
            return true;
          }

          return false;
        });
      }
    }

    // Apply sorting
    filtered = sortLeads(filtered, sortField, sortDirection);

    setFilteredLeads(filtered);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [allLeads, filters, sortField, sortDirection, deepAnalysisResultsMap, linkedInProfiles]);

  const handleProjectCreationSuccess = () => {
    // Dispatch a custom event that Dashboard.tsx can listen for
    const projectCreatedEvent = new CustomEvent('projectCreated');
    window.dispatchEvent(projectCreatedEvent);

    // Show success message
    toast.success("Project created successfully!");
  };


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Render sort icon based on current sort state
  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    }

    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4 inline text-black" />
      : <ArrowDown className="ml-1 h-4 w-4 inline text-black" />;
  };

  const BatchEnrichConfirmationModal = () => {
    if (!isBatchEnrichConfirmOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Confirm Batch Enrichment
          </h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to enrich {selectedLeads.length} profile{selectedLeads.length !== 1 ? 's' : ''}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsBatchEnrichConfirmOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmBatchEnrich}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yes, Enrich Profiles
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Advanced Filters Modal Component
  const AdvancedFiltersModal = () => {
    if (!isAdvancedFiltersModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
            Advanced Filters
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className={`block mb-2 text-sm font-medium ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
                Minimum Analysis Score
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minScoreFilter !== null ? minScoreFilter : ''}
                  onChange={(e) => setMinScoreFilter(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Minimum score (0-100)"
                  className={`w-full ${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""}`}
                  disabled
                />
                <span className={isDarkMode ? "text-zinc-300" : "text-gray-700"}>%</span>
              </div>
            </div>

            <div>
              <label className={`block mb-2 text-sm font-medium ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
                Must Meet These Criteria
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                {availableDeepCriteria.length > 0 ? (
                  availableDeepCriteria.map((criterion, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`criterion-${index}`}
                        checked={selectedDeepCriteria.includes(criterion)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDeepCriteria([...selectedDeepCriteria, criterion]);
                          } else {
                            setSelectedDeepCriteria(selectedDeepCriteria.filter(c => c !== criterion));
                          }
                        }}
                      />
                      <label
                        htmlFor={`criterion-${index}`}
                        className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}
                      >
                        {criterion}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
                    No criteria available. Analyze profiles first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClearAdvancedFilters}
              className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAdvancedFiltersModalOpen(false)}
              className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyAdvancedFilters}
              className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    );
  };




  // Create a memoized AnalysisCriteriaModal component to prevent focus loss
  const AnalysisCriteriaModal = memo(() => {
    // Local state to track input values while typing
    const [localCriteria, setLocalCriteria] = useState(analysisCriteria);

    // Update local state when parent criteria changes
    useEffect(() => {
      setLocalCriteria(analysisCriteria);
    }, [analysisCriteria]);

    // Handle local changes without updating parent state
    const handleLocalChange = (id: number, value: string) => {
      setLocalCriteria(prev =>
        prev.map(criteria =>
          criteria.id === id ? { ...criteria, value } : criteria
        )
      );
    };

    // Update parent state only when input loses focus
    const handleBlur = (id: number) => {
      const updatedCriteria = localCriteria.find(c => c.id === id);
      if (updatedCriteria) {
        handleCriteriaChange(id, updatedCriteria.value);
      }
    };

    if (!isAnalysisCriteriaModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
            Analysis Criteria
          </h2>

          <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
            Enter criteria to analyze profiles. Each criterion will be used to filter and evaluate the profiles.
          </p>

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
              {isAnalyzing ? "Analyzing Profiles .." : "Analyze Profiles"}
            </Button>
          </div>
        </div>
      </div>
    );
  });

  const EnrichmentDetailsModal = ({
    isOpen,
    onClose,
    lead,
    enrichmentData
  }: {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    enrichmentData: any;
  }) => {
    if (!isOpen || !lead || !enrichmentData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                {enrichmentData.fullName || lead.name} - Enriched Profile
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-center mb-6">
              {enrichmentData.photo && enrichmentData.photo.url && (
                <img
                  src={enrichmentData.photo.url}
                  alt={enrichmentData.fullName || lead.name}
                  className="w-16 h-16 rounded-full mr-4 object-cover border border-gray-200"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold">{enrichmentData.fullName || lead.name}</h3>
                <p className="text-gray-600">{enrichmentData.headLine || lead.title}</p>
                {enrichmentData.locations && enrichmentData.locations.length > 0 && (
                  <p className="text-gray-500 text-sm">{enrichmentData.locations[0].name}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            {enrichmentData.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Summary</h3>
                <p className="text-gray-700">{enrichmentData.summary}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>

              {/* Emails */}
              {enrichmentData.emails && enrichmentData.emails.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Email Addresses</h4>
                  <div className="space-y-2">
                    {enrichmentData.emails.map((email: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium mr-2">
                          {email.type}
                        </div>
                        <div className="text-gray-800">{email.email}</div>
                        <button
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          onClick={() => navigator.clipboard.writeText(email.email)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Numbers */}
              {enrichmentData.phones && enrichmentData.phones.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Phone Numbers</h4>
                  <div className="space-y-2">
                    {enrichmentData.phones.map((phone: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium mr-2">
                          {phone.type}
                        </div>
                        <div className="text-gray-800">{phone.phone}</div>
                        <button
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          onClick={() => navigator.clipboard.writeText(phone.phone)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {enrichmentData.locations && enrichmentData.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Locations</h4>
                  <div className="space-y-2">
                    {enrichmentData.locations.map((location: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-medium mr-2">
                          Location
                        </div>
                        <div className="text-gray-800">{location.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Profiles */}
              {enrichmentData.socialProfiles && enrichmentData.socialProfiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Social Profiles</h4>
                  <div className="space-y-2">
                    {enrichmentData.socialProfiles.map((profile: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-medium mr-2">
                          {profile.platform}
                        </div>
                        <a
                          href={profile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          {profile.url}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {enrichmentData.skills && enrichmentData.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {enrichmentData.skills.map((skill: string, index: number) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {enrichmentData.language && enrichmentData.language.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Languages</h3>
                <div className="space-y-2">
                  {enrichmentData.language.map((lang: any, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium mr-2">
                        {lang.proficiency}
                      </div>
                      <div className="text-gray-800">{lang.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {enrichmentData.experience && enrichmentData.experience.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Work Experience</h3>
                <div className="space-y-6">
                  {enrichmentData.experience.map((job: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 pb-2">
                      <div className="text-gray-800 font-medium text-lg">{job.position}</div>
                      <div className="text-gray-700 font-medium">{job.company}</div>
                      <div className="text-gray-500 text-sm mb-2">
                        {new Date(job.started).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -
                        {job.current ? 'Present' : new Date(job.ended).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </div>
                      {job.location && <div className="text-gray-500 text-sm mb-2">{job.location}</div>}
                      {job.summary && <div className="text-gray-600 text-sm whitespace-pre-line">{job.summary}</div>}
                      {job.industry && <div className="text-gray-500 text-xs mt-2">Industry: {job.industry}</div>}
                      {job.companySize && <div className="text-gray-500 text-xs">Company Size: {job.companySize}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {enrichmentData.education && enrichmentData.education.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Education</h3>
                <div className="space-y-4">
                  {enrichmentData.education.map((edu: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 pb-2">
                      <div className="text-gray-800 font-medium">{edu.school}</div>
                      <div className="text-gray-600">{edu.degree}</div>
                      <div className="text-gray-500 text-sm">
                        {edu.startDate} - {edu.endDate}
                      </div>
                      {edu.description && <div className="text-gray-600 text-sm mt-1">{edu.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">
              Close
            </Button>
            <Button onClick={() => {
              // Here you would implement export functionality
              alert('Export functionality would be implemented here');
            }}>
              Export Data
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
    };
  }, [streamCleanup]);

  // Function to toggle email expansion
  const toggleEmailExpansion = (leadId: string) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Component to render emails with "See more..." functionality
  const renderEmailDisplay = (lead: Lead) => {
    if (!lead.emailAddress) return null;

    const emails = lead.emailAddress.split(',').map(email => email.trim()).filter(email => email);
    const isExpanded = expandedEmails.has(lead.id);

    if (emails.length <= 1) {
      // Single email or no email
      return <span className="text-sm">{lead.emailAddress}</span>;
    }

    if (isExpanded) {
      // Show all emails
      return (
        <div className="flex flex-col gap-1">
          {emails.map((email, index) => (
            <span key={index} className="text-sm">
              {email}
            </span>
          ))}
          <button
            onClick={() => toggleEmailExpansion(lead.id)}
            className={`text-xs underline ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:no-underline`}
          >
            See less
          </button>
        </div>
      );
    } else {
      // Show first email with "See more..."
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{emails[0]}</span>
          <button
            onClick={() => toggleEmailExpansion(lead.id)}
            className={`text-xs underline ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:no-underline`}
          >
            See more... (+{emails.length - 1})
          </button>
        </div>
      );
    }
  };

  // Function to handle batch LinkedIn URL extraction using streaming API
  const handleBatchGetLinkedInUrlsClick = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to get LinkedIn URLs.");
      return;
    }

    setLoadingBatchLinkedInUrls(true);
    // Set loading state for all selected leads
    setLoadingLinkedInUrls(prev => [...prev, ...selectedLeads]);

    try {
      // Extract profile IDs from selected leads - use contactOut ID if available
      const profileIds: string[] = [];

      selectedLeads.forEach(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        if (!lead) return;

        // Use contactOut ID if available, otherwise use the lead ID
        if (lead.contactOutData?.id) {
          profileIds.push(lead.contactOutData.id);
        } else {
          profileIds.push(leadId);
        }
      });

      // Initialize progress tracking
      setLinkedInUrlProgress({
        total: profileIds.length,
        completed: 0,
        message: 'Starting LinkedIn URL extraction...'
      });

      const payload = {
        profileIds: profileIds
      };

      console.log('Starting streaming LinkedIn URL extraction with payload:', payload);

      // Start the streaming request
      const cleanup = await authService.getLinkedInUrlsStream(
        payload,
        // onStreamData callback
        (data) => {
          console.log('LinkedIn URL stream data received:', data);

          switch (data.type) {
            case 'status':
              setLinkedInUrlProgress(prev => ({
                ...prev,
                total: data.total || prev?.total || profileIds.length,
                completed: data.completed || prev?.completed || 0,
                message: data.message || 'Processing...'
              }));
              break;

            case 'result':
              const { profileId, linkedinUrl, fullName, status, error } = data.data;

              console.log(`Processing result for profileId: ${profileId}, status: ${status}, linkedinUrl: ${linkedinUrl}`);

              // Update progress first
              setLinkedInUrlProgress(prev => ({
                ...prev,
                completed: data.completed || (prev ? prev.completed + 1 : 1),
                message: `Processing ${fullName || 'profile'}...`
              }));

              // Find and update the corresponding lead
              setAllLeads(prevLeads => {
                let leadFound = false;
                const updatedLeads = prevLeads.map(lead => {
                  // Match by contactOut ID or lead ID
                  const matchesProfile = lead.contactOutData?.id === profileId || lead.id === profileId;

                  if (matchesProfile && !leadFound) {
                    leadFound = true;
                    console.log(`Found matching lead: ${lead.name} (${lead.id})`);

                    // Remove from loading state
                    setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));

                    if (status === 'success' && linkedinUrl) {
                      console.log(`SUCCESS: Updated LinkedIn URL for ${lead.name}: ${linkedinUrl}`);
                      toast.success(`LinkedIn URL found for ${lead.name}`);
                      // Update the lead with the LinkedIn URL
                      return { ...lead, linkedinUrl: linkedinUrl };
                    } else if (status === 'no_linkedin_url_found') {
                      console.log(`NO URL: No LinkedIn URL found for ${lead.name}`);
                      toast.warning(`No LinkedIn URL found for ${lead.name}`);
                      // Mark as no URL found
                      return { ...lead, linkedinUrlStatus: 'no_url_found' };
                    } else if (status === 'failed') {
                      console.log(`FAILED: Failed to get LinkedIn URL for ${lead.name}: ${error}`);
                      toast.error(`Failed to get LinkedIn URL for ${lead.name}: ${error || 'Unknown error'}`);
                      // Mark as failed
                      return { ...lead, linkedinUrlStatus: 'failed' };
                    }
                  }
                  return lead;
                });

                // Only return new array if we found and updated a lead
                return leadFound ? [...updatedLeads] : prevLeads;
              });

              break;

            case 'complete':
              setLinkedInUrlProgress(prev => ({
                ...prev,
                completed: prev?.total || profileIds.length,
                message: 'LinkedIn URL extraction complete!'
              }));

              // Clear all loading states immediately on completion
              setLoadingBatchLinkedInUrls(false);
              setLoadingLinkedInUrls([]);

              toast.success(`LinkedIn URL extraction completed! Processed ${data.totalProcessed} profiles.`);
              break;

            case 'error':
              console.error('LinkedIn URL stream error:', data);
              toast.error(`Stream error: ${data.message || 'Unknown error'}`);
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('LinkedIn URL stream error:', error);
          toast.error('Failed to extract LinkedIn URLs');
          setLoadingBatchLinkedInUrls(false);
          setLinkedInUrlProgress(null);
          setLoadingLinkedInUrls([]); // Clear all loading states on error
        },
        // onComplete callback
        () => {
          console.log('LinkedIn URL stream completed');
          setLoadingBatchLinkedInUrls(false);
          setLinkedInUrlProgress(null);
          setLoadingLinkedInUrls([]); // Clear all loading states
        }
      );

      // Store cleanup function for potential cancellation
      // setStreamCleanup(() => cleanup); // Uncomment if you want to allow stream cancellation

    } catch (error: any) {
      console.error('Failed to start streaming LinkedIn URL extraction:', error);
      toast.error('Failed to start LinkedIn URL extraction');
      setLoadingBatchLinkedInUrls(false);
      setLinkedInUrlProgress(null);
      setLoadingLinkedInUrls([]); // Clear all loading states on error
    }
  };

  return (
    <div className="w-full" data-has-leads={allLeads.length > 0 ? "true" : "false"}>
      <ProfileAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        lead={selectedLead}
        searchCriteria={{
          title: filters.title,
          location: filters.location,
          industry: filters.industry
        }}
      />
      <DeepAnalysisModal
        isOpen={isDeepAnalysisModalOpen}
        onClose={() => setIsDeepAnalysisModalOpen(false)}
        lead={deepAnalysisSelectedLead}
        analysisResult={deepAnalysisSelectedLeadId ? deepAnalysisResultsMap[deepAnalysisSelectedLeadId] : null}
      />
      {/* <AnalysisCriteriaModal
        isOpen={isDeepAnalysisCriteriaModalOpen}
        onClose={() => setIsDeepAnalysisCriteriaModalOpen(false)}
        // Pass criteria state and handlers
        analysisCriteria={analysisCriteria}
        setAnalysisCriteria={setAnalysisCriteria}
        onSubmit={async () => {
          setDeepAnalysisLoading(true);
          setDeepAnalysisError(null);
          try {
            const criteria = analysisCriteria
              .filter(c => c.value.trim() !== '')
              .map(c => c.value.trim());
            if (criteria.length === 0) {
              setDeepAnalysisError('Please enter at least one criteria.');
              setDeepAnalysisLoading(false);
              return;
            }
            if (!deepAnalysisSelectedLeadId) {
              setDeepAnalysisError('No lead selected for analysis.');
              setDeepAnalysisLoading(false);
              return;
            }
            const lead = allLeads.find(l => l.id === deepAnalysisSelectedLeadId);
            if (!lead) {
              setDeepAnalysisError('Selected lead not found.');
              setDeepAnalysisLoading(false);
              return;
            }
            const linkedinUrls = [lead.linkedinUrl].filter(url => url !== '');
            const payload = {
              criteria,
              linkedinUrls
            };
            const token = await authService.getToken();
            const response = await fetch(`${API_BASE_URL}/profile/deep-analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
            if (!response.ok) {
              throw new Error(`API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.results && data.results.length > 0) {
              setDeepAnalysisResultsMap(prev => ({
                ...prev,
                [deepAnalysisSelectedLeadId]: data.results[0]
              }));
              setIsDeepAnalysisModalOpen(true);
              setIsDeepAnalysisCriteriaModalOpen(false);
            } else {
              setDeepAnalysisError('No analysis results found.');
            }
          } catch (error: any) {
            setDeepAnalysisError(error.message || 'Failed to fetch deep analysis.');
          } finally {
            setDeepAnalysisLoading(false);
          }
        }}
      /> */}
      {/* Add the Enrichment Details Modal */}
      <EnrichmentDetailsModal
        isOpen={isEnrichmentModalOpen}
        onClose={() => setIsEnrichmentModalOpen(false)}
        lead={selectedLead}
        enrichmentData={enrichmentData}
      />
      <BatchEnrichConfirmationModal />
      <AnalysisCriteriaModal />
      <AdvancedFiltersModal />

      <>
        <div className={`sticky top-4 mb-4 flex items-center justify-between py-1 px-2 rounded-lg z-10`}>
          {/* Left side - Filters and Search */}
          <div className="flex items-center gap-3 relative z-[10000]">
            {/* Back Button - New addition */}
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
              onClick={onBack}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Search
            </Button>
            {/* Lead Filters */}
            <LeadFilters onApplyFilters={handleFiltersApplied} matchedCategoriesValues={matchedCategoriesValues} />

            {/* Advanced Filters */}
            {hasDeepAnalyzedLeads() && (
              <Button
                variant="outline"
                size="sm"
                className={`flex gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                onClick={() => setIsAdvancedFiltersModalOpen(true)}
              >
                <Filter className="h-3 w-3" />
                Advanced
                {filters.deepAnalysisCriteria && (
                  <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </Button>
            )}

            {/* Search Bar */}
            <div className="relative w-64">
              {/* Upload icon in left side (small) */}
              {/* <Upload className="absolute left-2 top-2 h-2.5 w-2.5 text-gray-400 cursor-pointer" /> */}

              {/* Websearch text in center (small) */}
              {/* <span className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Search for Profiles...
              </span> */}

              {/* Search icon in lower left (small) */}
              <Search className="absolute left-2 bottom-2 h-3.5 w-3.5 text-gray-400" />

              <Input
                placeholder="Search for Profiles..."
                value={searchInput}
                onChange={handleSearchChange}
                className={`pl-7 pr-3 py-1 h-8 text-xs rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Batch Analysis Button - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                      onClick={handleBatchAnalyzeClick}
                    >
                      <BrainCog className="h-3 w-3" />
                      Deep Analyze ({selectedLeads.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{selectedLeads.length} profile{selectedLeads.length > 1 ? 's' : ''} × 1 credit = {selectedLeads.length} credit{selectedLeads.length > 1 ? 's' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Batch Get Emails Button - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''} ${loadingBatchEmails ? 'opacity-50' : ''}`}
                      onClick={handleBatchGetEmailsClick}
                      disabled={loadingBatchEmails}
                    >
                      {loadingBatchEmails ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          Finding Emails...
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3" />
                          Get Emails ({selectedLeads.length})
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{selectedLeads.length} profile{selectedLeads.length > 1 ? 's' : ''} × 3 credits = {selectedLeads.length * 3} credit{selectedLeads.length * 3 > 1 ? 's' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Batch Get LinkedIn URLs Button - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''} ${loadingBatchLinkedInUrls ? 'opacity-50' : ''}`}
                onClick={handleBatchGetLinkedInUrlsClick}
                disabled={loadingBatchLinkedInUrls}
              >
                {loadingBatchLinkedInUrls ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                    Finding URLs...
                  </>
                ) : (
                  <>
                    <Linkedin className="h-3 w-3" />
                    Get LinkedIn URLs ({selectedLeads.length})
                  </>
                )}
              </Button>
            )}

            {/* Save to Project Button - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                onClick={() => {
                  if (selectedLeads.length === 0) {
                    toast.error("Please select at least one profile to save.");
                    return;
                  }
                  const leads = allLeads.filter(l => selectedLeads.includes(l.id));
                  setLeadToSave(leads as any);
                  setProjectName('');
                  setIsSaveToProjectModalOpen(true);
                }}
              >
                <Download className="h-3 w-3" />
                Save to Project ({selectedLeads.length})
              </Button>
            )}

            {/* Export Selected Button - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                onClick={() => {
                  if (selectedLeads.length === 0) {
                    toast.error("Please select at least one profile to export");
                    return;
                  }

                  // Export selected profiles as CSV
                  const leadsToExport = allLeads.filter(lead => selectedLeads.includes(lead.id));

                  if (leadsToExport.length === 0) {
                    toast.error("No profiles to export");
                    return;
                  }

                  // Prepare CSV headers
                  const headers = [
                    "Name",
                    "Title",
                    "Company",
                    "Location",
                    "Email Address",
                    "LinkedIn URL"
                  ];

                  // Helper function to escape CSV values
                  const escapeCSV = (value: any) => {
                    if (value === null || value === undefined) return "";
                    const stringValue = String(value);
                    if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
                      return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                  };

                  // Build CSV rows
                  const rows = leadsToExport.map(lead => {
                    // Check if lead is enriched and has enriched fields
                    const isEnriched = enrichedLeads.includes(lead.id);
                    const enrichedFields = enrichmentData?.enrichedFields?.[lead.id];

                    const name = isEnriched ? (enrichedFields?.name || lead.name) : lead.name;
                    const title = isEnriched ? (enrichedFields?.title || lead.title) : lead.title;
                    const company = isEnriched ? (enrichedFields?.company || lead.company) : lead.company;
                    const location = isEnriched ? (enrichedFields?.location || lead.location) : lead.location;
                    const email = isEnriched ? (enrichedFields?.emailAddress || lead.emailAddress) : lead.emailAddress;
                    const linkedinUrl = lead.linkedinUrl;

                    return [
                      escapeCSV(name),
                      escapeCSV(title),
                      escapeCSV(company),
                      escapeCSV(location),
                      escapeCSV(email),
                      escapeCSV(linkedinUrl)
                    ].join(",");
                  });

                  // Combine headers and rows
                  const csvContent = [headers.join(","), ...rows].join("\n");

                  // Create a Blob and trigger download
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `exported_profiles_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success(`Exported ${leadsToExport.length} profiles to CSV`);
                }}
              >
                <Download className="h-3 w-3" />
                Export Selected ({selectedLeads.length})
              </Button>
            )}

            {/* Import CSV/XLSX Button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 text-xs font-medium h-8 px-3 transition-all duration-200 hover:scale-[1.02] ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                  }`}
                onClick={handleFileImport}
                disabled={isImporting}
              >
                <Upload className="h-3 w-3" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </Button>

              <span
                className="absolute -top-2.5 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-[1px]
    rounded-full font-semibold shadow-md animate-pulse"
              >
                BETA
              </span>
            </div>


            {/* Export All Button with Dropdown */}
            <ExportDropdown
              profiles={allLeads.map(lead => ({
                _id: lead.id,
                name: lead.name,
                title: lead.title,
                company: lead.company,
                location: lead.location,
                email: enrichedLeads.includes(lead.id)
                  ? (enrichmentData?.enrichedFields?.[lead.id]?.emailAddress || lead.emailAddress)
                  : lead.emailAddress,
                linkedinUrl: lead.linkedinUrl,
                relevanceScore: lead.relevanceScore,
                analysis: { score: parseAnalysisScore(lead.analysisScore) }
              }))}
              selectedProfiles={selectedLeads}
              fileName="search_results"
              className="text-xs h-8 px-3"
            />
          </div>
        </div>

        <div>
          {/* <LeadFilters onApplyFilters={handleFiltersApplied} matchedCategoriesValues={matchedCategoriesValues} /> */}

          {isLoading ? (
            <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
              <div className="mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className={`mt-4 ${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                Loading profiles...
              </p>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div
              className={`rounded-md border shadow-sm relative ${isDarkMode
                ? "border-gray-700 bg-gray-900"
                : "border-gray-300 bg-white"
                }`}
            >
              {/* Scrollable Table Container */}
              <div className="overflow-auto max-h-[70vh] rounded-t-md lead-table-container" >
                <Table className={`border-collapse w-full min-w-[1400px] ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  <TableHeader className={`sticky top-0 z-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                    <TableRow className={`${isDarkMode ? "border-b border-gray-700" : "border-b border-gray-300"}`}>
                      <TableHead className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-16 rounded-tl-md`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all leads"
                            className="mr-3"
                          />
                        </div>
                      </TableHead>
                      <TableHead className={`py-1 font-medium border-r whitespace-nowrap ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} w-5`}>
                        Sr. No.
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[150px]`}
                        onClick={() => handleSort('name')}
                      >
                        Name {renderSortIcon('name')}
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[180px]`}
                        onClick={() => handleSort('title')}
                      >
                        Title {renderSortIcon('title')}
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[150px]`}
                        onClick={() => handleSort('company')}
                      >
                        Company {renderSortIcon('company')}
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[120px]`}
                        onClick={() => handleSort('location')}
                      >
                        Location {renderSortIcon('location')}
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} w-20`}
                        onClick={() => handleSort('relevanceScore')}
                      >
                        Score {renderSortIcon('relevanceScore')}
                      </TableHead>
                      <TableHead
                        className={`py-1 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[160px]`}
                        onClick={() => handleSort('analysisScore')}
                      >
                        Deep Analysis {renderSortIcon('analysisScore')}
                      </TableHead>
                      <TableHead className={`py-1 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[200px]`}>Email Address</TableHead>
                      <TableHead className={`py-1 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[250px]`}>LinkedIn URL</TableHead>
                      <TableHead className={`py-1 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[100px]`}>Source</TableHead>
                      <TableHead className={`py-1 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} w-24 rounded-tr-md`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, index) => (
                      <TableRow key={lead.id} className={`transition-colors border-b ${isDarkMode
                        ? "bg-primary hover:bg-gray-950 border-gray-700"
                        : "bg-white hover:bg-gray-50 border-gray-300"
                        }`}>
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
                        <TableCell className={`font-medium py-4 border-r ${isDarkMode ? "text-gray-200 border-gray-700" : "border-gray-300"} w-16`}>{index + 1}</TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[150px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'name' ? handleCellEdit(lead.id, 'name', lead.name) : undefined}
                        >
                          {renderEditableCell(lead, 'name', lead.name, `${isDarkMode ? "text-gray-400" : "text-gray-600"}`)}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[180px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'title' ? handleCellEdit(lead.id, 'title', lead.title) : undefined}
                        >
                          {renderEditableCell(lead, 'title', lead.title, `${isDarkMode ? "text-gray-400" : "text-gray-600"}`)}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[150px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'company' ? handleCellEdit(lead.id, 'company', lead.company) : undefined}
                        >
                          {renderEditableCell(lead, 'company', lead.company, `${isDarkMode ? "text-gray-400" : "text-gray-600"}`)}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'location' ? handleCellEdit(lead.id, 'location', lead.location) : undefined}
                        >
                          {renderEditableCell(lead, 'location', lead.location, `${isDarkMode ? "text-gray-400" : "text-gray-600"}`)}
                        </TableCell>
                        <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-20`}>
                          <div
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => handleOpenAnalysisModal(lead)}
                          >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"} mx-auto`}>
                              <span className="font-medium text-sm">
                                {lead.relevanceScore !== undefined ? lead.relevanceScore : 0}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Check if this profile is currently being analyzed */}
                            {analyzingProfiles.has(lead.id) ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                              </div>
                            ) : lead.analysisScore ? (
                              /* Show completed analysis */
                              <div
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto cursor-pointer hover:bg-blue-200 transition-colors"
                                onClick={() => {
                                  setDeepAnalysisSelectedLeadId(lead.id);
                                  setDeepAnalysisSelectedLead(lead);
                                  setIsDeepAnalysisModalOpen(true);
                                }}
                              >
                                <span className="font-medium text-sm">
                                  {lead.analysisScore || 'N/A'}
                                </span>
                              </div>
                            ) : (
                              /* Show analyze button for profiles that haven't been analyzed */
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                  onClick={() => handleAnalyzeClick(lead)}
                                  title="Our AI is going to analyze this profile"
                                >
                                  <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                    <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                  </svg>
                                </div>
                                <span
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                  onClick={() => handleAnalyzeClick(lead)}
                                >
                                  press to run
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 ${isDarkMode ? "text-gray-300" : ""} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[200px]`}>
                          <div className="flex items-center justify-center gap-2">
                            {loadingEmails.includes(lead.id) ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                              </div>
                            ) : lead.emailAddress ? (
                              renderEmailDisplay(lead)
                            ) : (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                  onClick={() => {
                                    handleGetEmailClick(lead);
                                  }}
                                >
                                  <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                    <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                  </svg>
                                </div>
                                <span
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                  onClick={() => {
                                    handleGetEmailClick(lead);
                                  }}
                                >
                                  press to run
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[250px]`}>
                          <div className="flex items-center justify-center gap-2">
                            {loadingLinkedInUrls.includes(lead.id) ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                              </div>
                            ) : lead.linkedinUrl && lead.linkedinUrl.trim() !== '' ? (
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                              >
                                {lead.linkedinUrl}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            ) : lead.linkedinUrlStatus === 'no_url_found' ? (
                              <span className="text-xs text-orange-600 text-center">
                                No URL found
                              </span>
                            ) : lead.linkedinUrlStatus === 'failed' ? (
                              <span className="text-xs text-red-600 text-center">
                                Failed to fetch
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                  onClick={() => {
                                    handleGetLinkedInUrlClick(lead);
                                  }}
                                >
                                  <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                    <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                  </svg>
                                </div>
                                <span
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                  onClick={() => {
                                    handleGetLinkedInUrlClick(lead);
                                  }}
                                >
                                  press to run
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[100px] text-center`}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${lead.source === 'CSV'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {lead.source === 'CSV' ? 'CSV' : 'WEB'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right w-24">
                          <div className="flex justify-end gap-1 pr-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 rounded-md ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                    onClick={() => handleCopyUrl(lead.linkedinUrl)}
                                  >
                                    {copiedUrl === lead.linkedinUrl ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">Copy LinkedIn URL</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy LinkedIn URL</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 rounded-md ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                    onClick={() => handleOpenUrl(lead.linkedinUrl)}
                                  >
                                    <ExternalLink className="h-4 w-4 text-gray-500" />
                                    <span className="sr-only">Open LinkedIn profile</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open LinkedIn profile</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Fixed Footer */}
              <div
                className={`flex justify-between items-center p-2 border-t rounded-b-md
    ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-200" : "border-gray-300 bg-gray-50 text-gray-700"}`}
              >
                <div className="text-sm">
                  Total results: {filteredLeads.length}
                </div>
              </div>

            </div>
          ) : isLoading ? (
            <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
              <div className="mx-auto h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
              <p className={`${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                Loading profiles...
              </p>
            </div>
          ) : (
            <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
              <p className={`mt-4 ${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                No profiles found.
              </p>
            </div>
          )}
        </div>
      </>

      {/* Save to Project Modal */}
      {isSaveToProjectModalOpen && leadToSave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
              Save Profile to Project
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
              Select an existing project or create a new one to save the profile(s).
            </p>
            <div className="mb-4">
              <label className={`block mb-1 font-medium ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                Project
              </label>
              <select
                className={`w-full p-2 border rounded ${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-white border-gray-300"}`}
                value={isCreatingNewProject ? "__new__" : selectedProjectId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setIsCreatingNewProject(true);
                    setNewProjectName('');
                    setSelectedProjectId('');
                  } else {
                    setIsCreatingNewProject(false);
                    setSelectedProjectId(e.target.value);
                  }
                }}
              >
                <option value="" disabled>Select a project</option>
                {availableProjects.map((project) => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
                <option value="__new__">+ Create new project</option>
              </select>
            </div>
            {isCreatingNewProject && (
              <>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="New Project Name"
                  className={`${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""} mb-4`}
                  autoFocus
                />
                <Button
                  onClick={async () => {
                    if (!projectName.trim()) {
                      toast.error("Please enter a project name.");
                      return;
                    }

                    // Disable the button during API call
                    const button = document.activeElement as HTMLButtonElement;
                    if (button) button.disabled = true;

                    try {
                      // Show loading state
                      setIsLoading(true);

                      // Call API to create project
                      const response = await authService.createProject({ name: projectName });
                      if (response) {
                        toast.success(`Project "${response.name}" created successfully.`);
                        // Update available projects and select the new one
                        handleProjectCreationSuccess();
                        setAvailableProjects(prev => [...prev, response]);
                        setSelectedProjectId(response._id);
                        setIsCreatingNewProject(false);
                      } else {
                        toast.error(`Failed to create project: ${response.message || 'Unknown error'}`);
                      }
                    } catch (error: any) {
                      toast.error(`Error creating project: ${error.message || 'Unknown error'}`);
                    } finally {
                      // Re-enable the button and hide loading state
                      setIsLoading(false);
                      if (button) button.disabled = false;
                    }
                  }}
                  disabled={isLoading}
                  className={`${isDarkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-600 text-white hover:bg-green-700"} mb-4`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </>
            )}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSaveToProjectModalOpen(false);
                  setLeadToSave(null);
                  setProjectName('');
                  setIsCreatingNewProject(false);
                }}
                className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedProjectId.trim()) {
                    toast.error("Please select a project.");
                    return;
                  }
                  if (leadToSave) {
                    // Save profile to selected project
                    await handleSaveProfile(leadToSave, selectedProjectId);
                    setIsSaveToProjectModalOpen(false);
                    setLeadToSave(null);
                    setNewProjectName('');
                    setSelectedProjectId('');
                    setIsCreatingNewProject(false);
                  }
                }}
                className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                disabled={!selectedProjectId.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for CSV/XLSX import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />

      {/* Import CSV/XLSX Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
              Import CSV/XLSX File
            </h2>
            <div className={`mb-6 space-y-3 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
              <p>
                Upload a CSV or XLSX file containing lead data to import profiles into your current search results.
              </p>
              <div className="space-y-2">
                <h3 className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Requirements:
                </h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>File format: CSV or XLSX</li>
                  <li>Maximum file size: 5MB</li>
                  <li>Recommended columns: Name, Company, Title, Location, Industry, LinkedIn URL, Email Address</li>
                  <li>Must have columns: Title, Location, Industry</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
                className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsImportModalOpen(false);
                  fileInputRef.current?.click();
                }}
                className={`${isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""} flex items-center gap-2`}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing...' : 'Choose File'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Loading Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-lg shadow-lg ${isDarkMode ? "bg-zinc-900" : "bg-white"} flex flex-col items-center space-y-4`}>
            <div className="relative">
              {/* Animated spinner */}
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              {/* Upload icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Importing Profiles
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
                Please wait while we process your file...
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
