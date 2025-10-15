import React, { useState, useEffect, useRef, memo } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, Settings, ExternalLink, Copy, Check, Download, CheckCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Search, BrainCog, Filter, Mail, Linkedin, ChevronDown, Upload, Play, Trash2 } from "lucide-react";
import { useParams, useNavigate } from 'react-router-dom';
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
import { LeadFilters } from "@/components/dashboard/LeadFilters";
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
import { useTheme } from "@/contexts/ThemeContext";
import { API_BASE_URL } from "@/services/api";
import { ProfileAnalysisModal } from "@/components/dashboard/ProfileAnalysisModal";
import { DeepAnalysisModal } from "@/components/dashboard/DeepAnalysisModal";

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
  relevanceScore?: number | string;
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
  source?: string;
  contactOutData?: any;
  linkedinUrlStatus?: 'no_url_found' | 'failed';
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
  enrichedData?: any; // Added enrichedData field
  rawProfileData?: {
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
    [key: string]: any; // Allow other raw profile data fields
  };
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

// Convert search result to Lead format
const convertSearchResultToLead = (result: any): Lead => {
  // Debug logging for SignalHire profiles
  if (result.rawProfileData?.signalHireData?.uid) {
    console.log('Converting SignalHire profile:', {
      mongoId: result._id,
      signalHireUid: result.rawProfileData.signalHireData.uid,
      name: result.fullName
    });
  }

  return {
    id: result._id,
    name: result.fullName,
    title: result.rawProfileData?.extractedTitle || result.extractedTitle || result.title,
    company: result.rawProfileData?.extractedCompany || result.extractedCompany || result.company,
    location: result.rawProfileData?.extractedLocation || result.extractedLocation || result.location,
    industry: result.industry,
    relevanceScore: result.rawProfileData?.relevanceScore || result.relevanceScore, // Use the string format like "3/3"
    profileEvaluation: result.profileEvaluation,
    emailAddress: result.emailAddress || '',
    linkedinUrl: result.rawProfileData?.linkedinUrl || result.linkedinUrl || '',
    matchedCriteria: result.matchedCategories,
    matchedCategoriesValue: result.matchedCategoriesValue,
    source: result.source,
    linkedinUrlStatus: result.linkedinUrlStatus,
    signalHireData: result.signalHireData,
    analysisScore: result.analysisScore,
    analysisDescription: result.analysisDescription,
    analysisBreakdown: result.analysisBreakdown,
    enrichedData: result.enrichedData, // Include enrichedData from backend
    rawProfileData: result.rawProfileData, // Include rawProfileData from backend
  };
};

export default function SearchResultsPage() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add new state for analysis loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Deep analysis modal state
  const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);
  const [deepAnalysisResultsMap, setDeepAnalysisResultsMap] = useState<{ [leadId: string]: any }>({});
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
  const [deepAnalysisError, setDeepAnalysisError] = useState<string | null>(null);
  const [deepAnalysisSelectedLeadId, setDeepAnalysisSelectedLeadId] = useState<string | null>(null);
  const [deepAnalysisSelectedLead, setDeepAnalysisSelectedLead] = useState<Lead | null>(null);
  const [isAnalysisCriteriaModalOpen, setIsAnalysisCriteriaModalOpen] = useState(false);
  const [analysisCriteria, setAnalysisCriteria] = useState([
    { id: 1, value: '', placeholder: 'Years of experience in...' },
    { id: 2, value: '', placeholder: 'Graduation year after...' },
    { id: 3, value: '', placeholder: 'Years in industry...' }
  ]);

  // Add these new state variables for SignalHire integration
  const [enrichingLeads, setEnrichingLeads] = useState<string[]>([]);
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);
  const [isBatchEnrichConfirmOpen, setIsBatchEnrichConfirmOpen] = useState(false);

  // New state for batch email loading
  const [loadingBatchEmails, setLoadingBatchEmails] = useState(false);

  // New state for batch LinkedIn URL loading
  const [loadingBatchLinkedInUrls, setLoadingBatchLinkedInUrls] = useState(false);
  const [loadingLinkedInUrls, setLoadingLinkedInUrls] = useState<string[]>([]);

  // Add state to track profiles currently being analyzed
  const [analyzingProfiles, setAnalyzingProfiles] = useState<Set<string>>(new Set());

  // Add state to track which lead's emails are expanded
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  // Add file import state and ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add state for email loading
  const [loadingEmails, setLoadingEmails] = useState<string[]>([]);

  // Add state for editing cells
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingCell, setSavingCell] = useState<{ leadId: string; field: string } | null>(null);

  // Add state for save to project modal
  const [isSaveToProjectModalOpen, setIsSaveToProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [leadToSave, setLeadToSave] = useState<Lead | null>(null);
  const [availableProjects, setAvailableProjects] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Add state for enrichment details modal
  const [isEnrichmentDetailsModalOpen, setIsEnrichmentDetailsModalOpen] = useState(false);
  const [selectedEnrichmentLead, setSelectedEnrichmentLead] = useState<Lead | null>(null);
  const [enrichmentDetailsData, setEnrichmentDetailsData] = useState<any>(null);


  // Fetch projects when save modal opens
  useEffect(() => {
    if (isSaveToProjectModalOpen) {
      authService.getUserProjects()
        .then(response => {
          if (response && Array.isArray(response)) {
            setAvailableProjects(response);
          } else {
            toast.error("Failed to load projects");
          }
        })
        .catch(() => {
          toast.error("Failed to load projects");
        });
    }
  }, [isSaveToProjectModalOpen]);

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchId) return;

      try {
        setIsLoading(true);
        const response = await authService.getSearchResults(searchId);

        if (response.success && response.data) {
          const leads = response.data.profiles.map(convertSearchResultToLead);
          setAllLeads(leads);
          setFilteredLeads(leads);

          // Store the search query from the response
          if (response.data.search?.searchQuery) {
            setSearchQuery(response.data.search.searchQuery);
          }

          // Seed deepAnalysisResultsMap for leads that already have analysis in backend
          const seededMap: { [leadId: string]: any } = {};
          response.data.profiles.forEach((profile: any, index: number) => {
            const lead = leads[index];
            if (lead.analysisScore || lead.analysisDescription || (lead.analysisBreakdown && lead.analysisBreakdown.length > 0)) {
              seededMap[lead.id] = {
                linkedinUrl: lead.linkedinUrl || '',
                profileId: lead.id,
                name: lead.name,
                enrichedData: profile.enrichedData, // Use enrichedData from original profile data
                analysis: {
                  score: typeof lead.analysisScore === 'string' ? lead.analysisScore : (lead.analysisScore ?? ''),
                  description: lead.analysisDescription || '',
                  breakdown: lead.analysisBreakdown || []
                }
              };
            }
          });
          setDeepAnalysisResultsMap(seededMap);
        } else {
          toast.error('Failed to load search results');
        }
      } catch (error: any) {
        console.error('Error fetching search results:', error);
        toast.error(error.message || 'Failed to load search results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchId]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
      setSelectAll(false);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
      setSelectAll(true);
    }
  };

  // Handle individual lead selection
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSelection = prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId];

      setSelectAll(newSelection.length === filteredLeads.length);
      return newSelection;
    });
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'company':
          aValue = a.company;
          bValue = b.company;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        case 'relevanceScore':
          aValue = parseRelevanceScore(a.relevanceScore);
          bValue = parseRelevanceScore(b.relevanceScore);
          break;
        case 'analysisScore':
          aValue = a.analysisScore || 0;
          bValue = b.analysisScore || 0;
          break;
        default:
          aValue = a.relevanceScore || 0;
          bValue = b.relevanceScore || 0;
      }

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    setFilteredLeads(sortedLeads);
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Handle cell edit
  const handleCellEdit = (leadId: string, field: string, currentValue: string) => {
    setEditingCell({ leadId, field });
    setEditValue(currentValue);
  };

  // Handle cell save
  const handleCellSave = async (leadId: string, field: string) => {
    setSavingCell({ leadId, field });

    // Update UI immediately (optimistic update)
    setAllLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, [field]: editValue } : lead
    ));
    setFilteredLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, [field]: editValue } : lead
    ));

    try {
      // Map UI field names to database field names
      const fieldMapping: { [key: string]: string } = {
        'name': 'fullName',
        'title': 'extractedTitle',
        'company': 'extractedCompany',
        'location': 'extractedLocation'
      };

      const dbFieldName = fieldMapping[field] || field;

      // Batch update to backend with correct field name
      const updateData = { profileId: leadId, [dbFieldName]: editValue };
      const success = await batchUpdateProfiles([updateData]);

      if (success) {
        console.log(`Successfully updated ${field} (${dbFieldName}) for profile ${leadId} to: ${editValue}`);
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      } else {
        // Rollback on failure
        const originalLead = allLeads.find(lead => lead.id === leadId);
        if (originalLead) {
          const originalValue = originalLead[field as keyof Lead];
          setAllLeads(prev => prev.map(lead =>
            lead.id === leadId ? { ...lead, [field]: originalValue } : lead
          ));
          setFilteredLeads(prev => prev.map(lead =>
            lead.id === leadId ? { ...lead, [field]: originalValue } : lead
          ));
          toast.error(`Failed to update ${field}. Changes reverted.`);
        }
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      // Rollback on error
      const originalLead = allLeads.find(lead => lead.id === leadId);
      if (originalLead) {
        const originalValue = originalLead[field as keyof Lead];
        setAllLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, [field]: originalValue } : lead
        ));
        setFilteredLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, [field]: originalValue } : lead
        ));
        toast.error(`Error updating ${field}. Changes reverted.`);
      }
    } finally {
      setSavingCell(null);
      setEditingCell(null);
      setEditValue("");
    }
  };

  // Handle cell cancel
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Handle key press
  const handleKeyPress = async (e: React.KeyboardEvent, leadId: string, field: string) => {
    if (e.key === 'Enter') {
      await handleCellSave(leadId, field);
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  // Render editable cell
  const renderEditableCell = (lead: Lead, field: string, value: string, className: string) => {
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field;
    const isSaving = savingCell?.leadId === lead.id && savingCell?.field === field;

    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
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
          disabled={isSaving}
        />
      );
    }

    return (
      <div className={`${className} w-full h-full min-h-[32px] flex items-center px-2`}>
        {isSaving && (
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
        )}
        <span className={isSaving ? 'opacity-50' : ''}>
          {value || <span className="text-gray-400 italic">Click to edit</span>}
        </span>
      </div>
    );
  };

  // Handle copy URL
  const handleCopyUrl = (url: string) => {
    if (url && url.trim() !== '') {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('URL copied to clipboard');

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedUrl(null);
      }, 2000);
    } else {
      toast.error('No URL available to copy');
    }
  };

  // Handle open URL
  const handleOpenUrl = (url: string) => {
    if (url && url.trim() !== '') {
      window.open(url, '_blank');
    } else {
      toast.error('No URL available to open');
    }
  };

  // Handle search change
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

  // Handle filters applied
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
  };

  // Function to check if there are deep analyzed leads
  const hasDeepAnalyzedLeads = () => {
    return Object.keys(deepAnalysisResultsMap).length > 0;
  };

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

  // Analysis criteria functions
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

  // Toggle email expansion
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

  // Render email display
  const renderEmailDisplay = (lead: Lead) => {
    if (!lead.emailAddress) return null;

    // Handle "No emails found" case with special styling
    if (lead.emailAddress === 'No emails found') {
      return <span className={`truncate max-w-[200px] italic ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No emails found</span>;
    }

    const emails = lead.emailAddress.split(',').map(email => email.trim()).filter(email => email);
    const isExpanded = expandedEmails.has(lead.id);

    if (emails.length <= 1) {
      return <span className="truncate max-w-[200px]">{lead.emailAddress}</span>;
    }

    if (isExpanded) {
      return (
        <div className="flex flex-col gap-1">
          {emails.map((email, index) => (
            <span key={index} className="text-sm truncate max-w-[200px]">
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
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm truncate max-w-[200px]">{emails[0]}</span>
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

  // Get source type (WEB or CSV)
  const getSourceType = (source: string) => {
    const webSources = ['brave', 'google', 'signalhire', 'icypeas', 'contactout'];
    return webSources.includes(source) ? 'WEB' : 'CSV';
  };

  // Handle analysis click
  const handleAnalyzeClick = (lead: Lead) => {
    setDeepAnalysisSelectedLeadId(lead.id);
    setDeepAnalysisSelectedLead(lead);
    setIsAnalysisCriteriaModalOpen(true);
  };

  // Batch analyze click
  const handleBatchAnalyzeClick = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to analyze.");
      return;
    }
    // Clear single analysis selection for batch mode
    setDeepAnalysisSelectedLeadId(null);
    setDeepAnalysisSelectedLead(null);
    setIsAnalysisCriteriaModalOpen(true);
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
        // The UID can be in either signalHireData.uid or rawProfileData.signalHireData.uid
        const signalHireUid = lead.signalHireData?.uid || lead.rawProfileData?.signalHireData?.uid;
        if (signalHireUid) {
          // This is a SignalHire profile, use the uid
          profileIds.push(signalHireUid);
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
              // Just log status, no modal progress
              console.log('Email extraction status:', data.message);
              break;

            case 'enrichment_status':
              // Just log enrichment status
              console.log('Enrichment status:', data.message);
              break;

            case 'enrichment_complete':
              // Just log enrichment complete
              console.log('Enrichment complete:', data.message);
              break;

            case 'fallback_status':
              // Handle fallback status - just update progress message, keep analyzing state
              console.log('fallback status:', data.message);
              break;

            case 'fallback_success':
              // Handle fallback success - update progress message, keep analyzing state  
              console.log('fallback success:', data.message);
              break;

            case 'result':
              // Handle individual result - need to find profile by the identifier
              const identifier = data.identifier;
              console.log('Batch email: Processing result with identifier:', identifier, 'data:', data);
              if (!identifier) {
                console.warn("Received result without identifier, skipping:", data);
                break;
              }

              // Find the lead in the table that matches the identifier
              // The identifier can be a LinkedIn URL or a SignalHire profile ID
              let matchedLead = null;

              // First, try to match by lead.id (for MongoDB _id)
              matchedLead = allLeads.find(lead => lead.id === identifier);

              // If not found, try to match by SignalHire UID (check both locations)
              if (!matchedLead) {
                matchedLead = allLeads.find(lead =>
                  lead.signalHireData?.uid === identifier ||
                  lead.rawProfileData?.signalHireData?.uid === identifier
                );
              }

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
                console.log('Batch email: Found matching lead for identifier:', identifier, 'profileId:', profileId, 'leadName:', matchedLead.name);

                // Remove from loading emails set since this profile is now complete
                setLoadingEmails(prev => prev.filter(id => id !== profileId));

                if (data.status === 'success' && data.emails && data.emails.length > 0) {
                  // Extract email addresses from the emails array
                  const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');
                  console.log('Batch email: Updating emails for profileId:', profileId, 'emails:', emails);

                  // Update UI immediately (optimistic update)
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: emails } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: emails } : l
                    )
                  );

                  // Batch update to backend
                  batchUpdateProfiles([{ profileId: profileId, emailAddress: emails }]);
                } else if (data.status === 'failed') {
                  console.log('Batch email: Failed status for profileId:', profileId, 'error:', data.error);

                  // Update UI with "No emails found" for failed cases
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: 'No emails found' } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: 'No emails found' } : l
                    )
                  );

                  // Batch update to backend
                  batchUpdateProfiles([{ profileId: profileId, emailAddress: 'No emails found' }]);
                } else {
                  console.log('Batch email: No emails found for profileId:', profileId, 'data.emails:', data.emails, 'data.status:', data.status);

                  // Update UI with "No emails found" for cases with no emails
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: 'No emails found' } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, emailAddress: 'No emails found' } : l
                    )
                  );

                  // Batch update to backend
                  batchUpdateProfiles([{ profileId: profileId, emailAddress: 'No emails found' }]);
                }
              } else {
                console.log('Batch email: No matching lead found for identifier:', identifier);
                console.log('Batch email: Available leads for matching:', allLeads.map(l => ({
                  id: l.id,
                  linkedinUrl: l.linkedinUrl,
                  name: l.name,
                  signalHireUid: l.signalHireData?.uid,
                  rawSignalHireUid: l.rawProfileData?.signalHireData?.uid
                })));
              }
              break;

            case 'complete':
              toast.success(`Email extraction completed! Processed ${data.totalProcessed} profiles.`);
              setLoadingBatchEmails(false);
              break;

            case 'error':
              toast.error(`Email extraction error: ${data.message}`);
              setLoadingBatchEmails(false);
              setLoadingEmails([]); // Clear all loading states on error
              break;

            default:
              console.log('Unknown stream data type:', data.type);
          }
        },
        // onError callback
        (error) => {
          console.error('Batch email streaming error:', error);
          toast.error(`Email extraction failed: ${error.message || 'Unknown error'}`);
          setLoadingBatchEmails(false);
          setLoadingEmails([]); // Clear all loading states on error
        },
        // onComplete callback
        () => {
          console.log('Batch email streaming completed');
          setLoadingEmails([]);
        }
      );

    } catch (error: any) {
      console.error('Failed to start batch email extraction:', error);
      toast.error(`Failed to start email extraction: ${error.message || error}`);
      setLoadingBatchEmails(false);
      setLoadingEmails([]);
    }
  };

  // Handle get email click
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

      // Get SignalHire UID from either location
      const signalHireUid = lead.signalHireData?.uid || lead.rawProfileData?.signalHireData?.uid;

      const payload = {
        linkedinUrls: lead.linkedinUrl ? [lead.linkedinUrl] : [],
        profileIds: !lead.linkedinUrl && signalHireUid ? [signalHireUid] : [],
        profileData: profileData
      };

      console.log('Starting single email extraction for:', lead.name, payload);

      // Use the streaming method for consistency
      const cleanup = await authService.getEmailsStream(
        payload,
        // onStreamData callback
        async (data) => {
          console.log('Single email stream data received:', data);

          switch (data.type) {
            case 'result':
              // Remove loading state when we get a result
              setLoadingEmails(prev => prev.filter(id => id !== lead.id));

              // Handle the result for this specific profile
              if (data.status === 'success' && data.emails && data.emails.length > 0) {
                const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');
                console.log('Single email: Updating emails for lead:', lead.name, 'emails:', emails);

                // Update UI immediately (optimistic update)
                setAllLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: emails } : l
                  )
                );
                setFilteredLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: emails } : l
                  )
                );

                // Batch update to backend
                batchUpdateProfiles([{ profileId: lead.id, emailAddress: emails }]);

                toast.success(`Found ${data.emails.length} email${data.emails.length > 1 ? 's' : ''} for ${lead.name}`);
              } else if (data.status === 'failed') {
                console.log('Single email: Failed status for lead:', lead.name, 'error:', data.error);

                // Update UI with "No emails found" for failed cases
                setAllLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: 'No emails found' } : l
                  )
                );
                setFilteredLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: 'No emails found' } : l
                  )
                );

                // Batch update to backend
                batchUpdateProfiles([{ profileId: lead.id, emailAddress: 'No emails found' }]);

                toast.warning(`No emails found for ${lead.name}`);
              } else {
                console.log('Single email: No emails found for lead:', lead.name, 'data.emails:', data.emails, 'data.status:', data.status);

                // Update UI with "No emails found" for cases with no emails
                setAllLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: 'No emails found' } : l
                  )
                );
                setFilteredLeads(prevLeads =>
                  prevLeads.map(l =>
                    l.id === lead.id ? { ...l, emailAddress: 'No emails found' } : l
                  )
                );

                // Batch update to backend
                batchUpdateProfiles([{ profileId: lead.id, emailAddress: 'No emails found' }]);

                toast.info(`No emails available for ${lead.name}`);
              }
              break;

            case 'complete':
              console.log('Single email extraction completed');
              break;

            case 'error':
              toast.error(`Email extraction error: ${data.message}`);
              setLoadingEmails(prev => prev.filter(id => id !== lead.id));
              break;

            default:
              console.log('Unknown single email stream data type:', data.type);
          }
        },
        // onError callback
        (error) => {
          console.error('Single email streaming error:', error);
          setLoadingEmails(prev => prev.filter(id => id !== lead.id));
          toast.error(`Email extraction failed: ${error.message || 'Unknown error'}`);
        },
        // onComplete callback
        () => {
          console.log('Single email streaming completed');
          setLoadingEmails(prev => prev.filter(id => id !== lead.id));
        }
      );
    } catch (error: any) {
      console.error('Error starting single email extraction:', error);
      setLoadingEmails(prev => prev.filter(id => id !== lead.id));
      toast.error(`Error fetching emails: ${error.message || error}`);
    }
  };

  // Handle get LinkedIn URL click
  const handleGetLinkedInUrlClick = async (lead: Lead) => {
    setLoadingLinkedInUrls(prev => [...prev, lead.id]);

    try {
      // For SignalHire profiles, always use the UID from signalHireData
      // The UID can be in either signalHireData.uid or rawProfileData.signalHireData.uid
      // For other profiles, use the MongoDB _id
      const signalHireUid = lead.signalHireData?.uid || lead.rawProfileData?.signalHireData?.uid;

      // Debug logging
      console.log('LinkedIn URL Debug - Lead data:', {
        leadId: lead.id,
        leadName: lead.name,
        signalHireDataUid: lead.signalHireData?.uid,
        rawProfileDataSignalHireUid: lead.rawProfileData?.signalHireData?.uid,
        finalSignalHireUid: signalHireUid,
        hasRawProfileData: !!lead.rawProfileData,
        rawProfileDataKeys: lead.rawProfileData ? Object.keys(lead.rawProfileData) : [],
        signalHireDataKeys: lead.signalHireData ? Object.keys(lead.signalHireData) : []
      });

      const profileIds = signalHireUid ? [signalHireUid] : [lead.id];
      console.log('LinkedIn URL Debug - Final profileIds:', profileIds);

      const cleanup = await authService.getLinkedInUrlsStream(
        { profileIds },
        // onStreamData callback
        (data) => {
          console.log('Single LinkedIn URL stream data received:', data);

          switch (data.type) {
            case 'result':
              // The identifier can be in data.identifier or data.data.profileId
              const identifier = data.identifier || data.data?.profileId;
              console.log('Single LinkedIn URL - Extracted identifier:', identifier, 'from data:', data);
              if (!identifier) {
                console.warn("Received result without identifier, skipping:", data);
                break;
              }

              // Find the lead in the table that matches the identifier
              // For SignalHire profiles, the identifier will be the UID
              // For other profiles, the identifier will be the MongoDB _id
              let matchedLead = allLeads.find(l =>
                l.signalHireData?.uid === identifier ||
                l.rawProfileData?.signalHireData?.uid === identifier ||
                l.id === identifier
              );

              if (matchedLead && matchedLead.id === lead.id) {
                setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));

                // Extract status and linkedinUrl from the correct location in the response
                const status = data.status || data.data?.status;
                const linkedinUrl = data.linkedinUrl || data.data?.linkedinUrl;

                console.log('Single LinkedIn URL - Processing result:', { status, linkedinUrl, leadName: lead.name });

                if (status === 'success' && linkedinUrl) {
                  // Update UI immediately (optimistic update)
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrl: linkedinUrl } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrl: linkedinUrl } : l
                    )
                  );

                  // Batch update to backend
                  batchUpdateProfiles([{ profileId: lead.id, linkedinUrl: linkedinUrl }]);

                  toast.success(`LinkedIn URL found for ${lead.name}`);
                } else if (status === 'no_linkedin_url_found') {
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrlStatus: 'no_url_found' as const } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrlStatus: 'no_url_found' as const } : l
                    )
                  );
                  toast.warning(`No LinkedIn URL found for ${lead.name}`);
                } else {
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrlStatus: 'failed' as const } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === lead.id ? { ...l, linkedinUrlStatus: 'failed' as const } : l
                    )
                  );
                  toast.error(`Failed to get LinkedIn URL for ${lead.name}`);
                }
              }
              break;

            case 'complete':
              console.log('Single LinkedIn URL extraction completed');
              break;

            case 'error':
              toast.error(`LinkedIn URL extraction error: ${data.message}`);
              setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('Single LinkedIn URL streaming error:', error);
          toast.error(`LinkedIn URL extraction failed: ${error.message || 'Unknown error'}`);
          setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));
        },
        // onComplete callback
        () => {
          console.log('Single LinkedIn URL streaming completed');
          setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));
        }
      );
    } catch (error: any) {
      console.error('Error starting LinkedIn URL extraction:', error);
      toast.error(`Error finding LinkedIn URL: ${error.message || error}`);
      setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead.id));
    }
  };

  // Normalize LinkedIn URL function
  const normalizeLinkedInUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/\/+$/, '');
      return `https://www.linkedin.com${pathname}`;
    } catch (err) {
      return url;
    }
  };

  // Helper function to parse relevance score strings like "3/3" for color coding
  const parseRelevanceScore = (scoreString: string | number | undefined): number => {
    if (!scoreString) return 0;

    if (typeof scoreString === 'number') return scoreString;

    if (typeof scoreString === 'string') {
      // Handle "X/Y" format
      const match = scoreString.match(/^(\d+)\/(\d+)$/);
      if (match) {
        const numerator = parseInt(match[1]);
        const denominator = parseInt(match[2]);
        return denominator > 0 ? (numerator / denominator) * 100 : 0;
      }

      // Handle plain number strings
      const parsed = parseFloat(scoreString);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
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

  // Handle analysis submit with streaming
  const handleAnalysisSubmit = async () => {
    setIsAnalyzing(true);
    setIsAnalysisCriteriaModalOpen(false);

    try {
      const filledCriteria = analysisCriteria.filter(c => c.value.trim() !== '');

      let linkedinUrls: string[] = [];
      let profileIds: string[] = [];
      let selectedLeadIds: string[] = [];

      // Handle both single and batch analysis
      if (deepAnalysisSelectedLeadId) {
        // Single profile analysis
        selectedLeadIds = [deepAnalysisSelectedLeadId];
      } else if (selectedLeads.length > 0) {
        // Batch analysis
        selectedLeadIds = selectedLeads;
      } else {
        toast.error("No profiles selected for analysis");
        setIsAnalyzing(false);
        return;
      }

      // Set analyzing state for all selected profiles
      setAnalyzingProfiles(new Set(selectedLeadIds));

      // Separate LinkedIn URLs and SignalHire profile IDs
      selectedLeadIds.forEach(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
          if (lead.linkedinUrl) {
            linkedinUrls.push(lead.linkedinUrl);
          } else {
            // For SignalHire profiles, use the UID from either location
            const signalHireUid = lead.signalHireData?.uid || lead.rawProfileData?.signalHireData?.uid;
            if (signalHireUid) {
              profileIds.push(signalHireUid);
            } else {
              profileIds.push(lead.id);
            }
          }
        }
      });

      const payload: {
        criteria: string[];
        linkedinUrls?: string[];
        profileIds?: string[];
      } = {
        criteria: filledCriteria.map(c => c.value),
      };

      if (linkedinUrls.length > 0) {
        payload.linkedinUrls = linkedinUrls;
      }
      if (profileIds.length > 0) {
        payload.profileIds = profileIds;
      }

      const response = await authService.deepAnalyseProfileStream(
        payload,
        // onStreamData callback
        (data) => {
          console.log('Stream data received:', data);

          switch (data.type) {
            case 'result': {
              const identifier = data.identifier;
              if (!identifier) {
                console.warn('Received result without identifier, skipping:', data);
                break;
              }

              console.log('Looking for lead with identifier:', identifier);

              // Find lead by ID or by normalizing the identifier URL
              const leadToUpdate = allLeads.find(lead => {
                // Match by ID (for MongoDB _id)
                if (lead.id === identifier) {
                  return true;
                }
                // Match by SignalHire UID (check both locations)
                if (lead.signalHireData?.uid === identifier || lead.rawProfileData?.signalHireData?.uid === identifier) {
                  return true;
                }
                // Match by normalized LinkedIn URL
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
                console.log('Found matching lead:', leadToUpdate.name, 'with ID:', leadToUpdate.id);
                const profileId = leadToUpdate.id;
                // Remove from analyzing set since this profile is now complete
                setAnalyzingProfiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(profileId);
                  return newSet;
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

                  // Update UI immediately (optimistic update)
                  setAllLeads(prev => prev.map(lead =>
                    lead.id === profileId
                      ? {
                        ...lead,
                        analysisScore: data.analysis?.score,
                        analysisDescription: data.analysis?.description,
                        analysisBreakdown: data.analysis?.breakdown,
                        enrichedData: data.enrichedData
                      }
                      : lead
                  ));
                  setFilteredLeads(prev => prev.map(lead =>
                    lead.id === profileId
                      ? {
                        ...lead,
                        analysisScore: data.analysis?.score,
                        analysisDescription: data.analysis?.description,
                        analysisBreakdown: data.analysis?.breakdown,
                        enrichedData: data.enrichedData
                      }
                      : lead
                  ));

                  // Batch update to backend
                  batchUpdateProfiles([{
                    profileId: profileId,
                    analysisScore: data.analysis?.score,
                    analysisDescription: data.analysis?.description,
                    analysisBreakdown: data.analysis?.breakdown,
                    enrichedData: data.enrichedData
                  }]);

                  console.log(`Updated analysis score for ${leadToUpdate.name}: ${data.analysis?.score}`);
                  toast.success(`Analysis completed for ${leadToUpdate.name}`);
                } else if (data.status === 'failed') {
                  console.log(`Failed to analyze ${data.name || data.linkedinUrl || data.profileId}: ${data.error}`);
                  toast.error(`Failed to analyze ${leadToUpdate.name}`);
                }
              } else {
                console.warn('No matching lead found for identifier:', identifier);
              }
              break;
            }

            case 'complete':
              toast.success(`Deep analysis completed!`);
              setAnalyzingProfiles(new Set());
              setIsAnalyzing(false);
              break;

            case 'error': {
              console.log(`Analysis error: ${data.message || data.error}`);

              // Check if this is a "Not enough credits" error
              if (data.message && data.message.includes('Not enough credits')) {
                toast.error("Not enough credits to perform analysis");
              } else {
                toast.error(`Analysis failed: ${data.message || 'Unknown error'}`);
              }
              setIsAnalyzing(false);
              setAnalyzingProfiles(new Set());
              break;
            }

            default:
              console.log('Unknown stream data type:', data.type);
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('Stream error:', error);

          // Check if this is a "Not enough credits" error
          if (error.details && error.details.includes('Not enough credits')) {
            toast.error("Not enough credits to perform deep analysis");
          } else {
            toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
          }
          setIsAnalyzing(false);
          setAnalyzingProfiles(new Set());
        },
        // onComplete callback
        () => {
          console.log('Stream completed');
          setAnalyzingProfiles(new Set());
        }
      );

    } catch (error: any) {
      console.error('Failed to start streaming analysis:', error);
      toast.error('Failed to start analysis');
      setIsAnalyzing(false);
      setAnalyzingProfiles(new Set());
    }
  };

  // Handle batch LinkedIn URL fetching
  const handleBatchGetLinkedInUrlsClick = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to get LinkedIn URLs.");
      return;
    }

    setLoadingBatchLinkedInUrls(true);
    setLoadingLinkedInUrls(prev => [...prev, ...selectedLeads]);

    try {
      // Extract profile IDs from selected leads - use signalHire UID if available
      const profileIds: string[] = [];

      selectedLeads.forEach(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        if (!lead) return;

        // For SignalHire profiles, always use the UID from signalHireData
        // The UID can be in either signalHireData.uid or rawProfileData.signalHireData.uid
        // For other profiles, use the MongoDB _id
        const signalHireUid = lead.signalHireData?.uid || lead.rawProfileData?.signalHireData?.uid;
        if (signalHireUid) {
          profileIds.push(signalHireUid);
        } else {
          profileIds.push(lead.id);
        }
      });

      const response = await authService.getLinkedInUrlsStream(
        { profileIds },
        // onStreamData callback
        (data) => {
          console.log('Batch LinkedIn URL stream data received:', data);

          switch (data.type) {
            case 'result':
              // The identifier can be in data.identifier or data.data.profileId
              const identifier = data.identifier || data.data?.profileId;
              console.log('Batch LinkedIn URL - Extracted identifier:', identifier, 'from data:', data);
              if (!identifier) {
                console.warn("Received result without identifier, skipping:", data);
                break;
              }

              // Find the lead in the table that matches the identifier
              // For SignalHire profiles, the identifier will be the UID
              // For other profiles, the identifier will be the MongoDB _id
              let matchedLead = allLeads.find(lead =>
                lead.signalHireData?.uid === identifier ||
                lead.rawProfileData?.signalHireData?.uid === identifier ||
                lead.id === identifier
              );

              if (matchedLead) {
                const profileId = matchedLead.id;
                setLoadingLinkedInUrls(prev => prev.filter(id => id !== profileId));

                // Extract status and linkedinUrl from the correct location in the response
                const status = data.status || data.data?.status;
                const linkedinUrl = data.linkedinUrl || data.data?.linkedinUrl;

                console.log('Batch LinkedIn URL - Processing result:', { status, linkedinUrl, profileName: matchedLead.name });

                if (status === 'success' && linkedinUrl) {
                  // Update UI immediately (optimistic update)
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrl: linkedinUrl } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrl: linkedinUrl } : l
                    )
                  );

                  // Batch update to backend
                  batchUpdateProfiles([{ profileId: profileId, linkedinUrl: linkedinUrl }]);
                } else if (status === 'no_linkedin_url_found') {
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrlStatus: 'no_url_found' as const } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrlStatus: 'no_url_found' as const } : l
                    )
                  );
                } else {
                  setAllLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrlStatus: 'failed' as const } : l
                    )
                  );
                  setFilteredLeads(prevLeads =>
                    prevLeads.map(l =>
                      l.id === profileId ? { ...l, linkedinUrlStatus: 'failed' as const } : l
                    )
                  );
                }
              }
              break;

            case 'complete':
              toast.success(`LinkedIn URL extraction completed! Processed ${data.totalProcessed} profiles.`);
              setLoadingBatchLinkedInUrls(false);
              break;

            case 'error':
              toast.error(`LinkedIn URL extraction error: ${data.message}`);
              setLoadingBatchLinkedInUrls(false);
              setLoadingLinkedInUrls([]);
              break;
          }
        },
        // onError callback
        (error) => {
          console.error('Batch LinkedIn URL streaming error:', error);
          toast.error(`LinkedIn URL extraction failed: ${error.message || 'Unknown error'}`);
          setLoadingBatchLinkedInUrls(false);
          setLoadingLinkedInUrls([]);
        },
        // onComplete callback
        () => {
          console.log('Batch LinkedIn URL streaming completed');
          setLoadingLinkedInUrls([]);
        }
      );
    } catch (error: any) {
      console.error('Error fetching LinkedIn URLs:', error);
      toast.error(`Error fetching LinkedIn URLs: ${error.message || error}`);
      setLoadingBatchLinkedInUrls(false);
      setLoadingLinkedInUrls([]);
    }
  };

  // Handle delete selected profiles
  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to delete.");
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedLeads.length} profile${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    try {
      // Get the profile IDs to delete
      const profilesToDelete = selectedLeads.map(leadId => {
        const lead = allLeads.find(l => l.id === leadId);
        return lead?.id || leadId;
      });

      // Optimistically remove from UI
      const deletedProfiles = allLeads.filter(lead => selectedLeads.includes(lead.id));
      setAllLeads(prevLeads => prevLeads.filter(lead => !selectedLeads.includes(lead.id)));
      setFilteredLeads(prevLeads => prevLeads.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      setSelectAll(false);

      // Call API to delete profiles
      const response = await authService.deleteSearchProfiles(profilesToDelete);

      if (response && response.success) {
        toast.success(`Successfully deleted ${selectedLeads.length} profile${selectedLeads.length > 1 ? 's' : ''}`);
      } else {
        // Rollback on failure
        setAllLeads(prevLeads => [...prevLeads, ...deletedProfiles]);
        setFilteredLeads(prevLeads => [...prevLeads, ...deletedProfiles]);
        toast.error(`Failed to delete profiles: ${response?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error deleting profiles:', error);
      // Rollback on error
      const deletedProfiles = allLeads.filter(lead => selectedLeads.includes(lead.id));
      setAllLeads(prevLeads => [...prevLeads, ...deletedProfiles]);
      setFilteredLeads(prevLeads => [...prevLeads, ...deletedProfiles]);
      toast.error(`Failed to delete profiles: ${error.message || 'Network error'}`);
    }
  };

  // Handle save to project
  const handleSaveToProject = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to save.");
      return;
    }

    // For batch save, we'll save all selected leads
    const leadsToSave = allLeads.filter(lead => selectedLeads.includes(lead.id));
    setLeadToSave(leadsToSave[0]); // Set first lead as representative
    setIsSaveToProjectModalOpen(true);
  };

  // Handle save profile to project
  const handleSaveProfile = async (leads: Lead | Lead[], projectId?: string) => {
    const leadsArray = Array.isArray(leads) ? leads : [leads];

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }

    try {
      const payload = leadsArray.map(lead => ({
        projectId: projectId,
        name: lead.name,
        title: lead.title,
        company: lead.company,
        location: lead.location,
        linkedinUrl: lead.linkedinUrl,
        email: lead.emailAddress,
        relevanceScore: lead.relevanceScore ? lead.relevanceScore.toString() : '',
        uid: lead.signalHireData?.uid || null,
        signalHireData: lead.signalHireData || null,
        matchedCategories: lead.matchedCriteria ? {
          location: lead.matchedCriteria.location ? [lead.location] : [],
          title: lead.matchedCriteria.title ? [lead.title] : [],
          industry: lead.matchedCriteria.industry ? [lead.industry || ''] : []
        } : {},
        matchedCategoriesValue: lead.matchedCategoriesValue || {}
      }));

      const response = await authService.saveProfileToProject(payload);

      if (response && response.message) {
        toast.success(`Successfully saved ${leadsArray.length} profile${leadsArray.length > 1 ? 's' : ''} to project`);
      } else {
        toast.error(`Failed to save profiles: ${response?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error saving profiles:', error);
      toast.error(`Failed to save profiles: ${error.message || 'Network error'}`);
    }
  };

  // Handle export selected profiles
  const handleExportSelected = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one profile to export.");
      return;
    }

    const selectedProfiles = allLeads.filter(lead => selectedLeads.includes(lead.id));

    // Helper function to escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV content
    const headers = ['Name', 'Title', 'Company', 'Location', 'Email', 'LinkedIn URL', 'Relevance Score', 'Analysis Score', 'Analysis Description'];
    const csvContent = [
      headers.join(','),
      ...selectedProfiles.map(profile => [
        escapeCSV(profile.name),
        escapeCSV(profile.title),
        escapeCSV(profile.company),
        escapeCSV(profile.location),
        escapeCSV(profile.emailAddress),
        escapeCSV(profile.linkedinUrl),
        escapeCSV(profile.relevanceScore),
        escapeCSV(profile.analysisScore),
        escapeCSV(profile.analysisDescription)
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `search-results-${searchId}-selected.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${selectedProfiles.length} profile${selectedProfiles.length > 1 ? 's' : ''} to CSV`);
  };

  // Handle project creation success
  const handleProjectCreationSuccess = () => {
    setProjectName('');
  };

  // Batch update profiles using the batch update API
  const batchUpdateProfiles = async (updates: Array<{ profileId: string;[key: string]: any }>) => {
    try {
      console.log('Batch updating profiles:', updates);
      const response = await authService.batchUpdateSearchProfiles(updates);

      if (response && response.success) {
        console.log('Batch update successful');
        return true;
      } else {
        console.error('Batch update failed:', response?.message);
        return false;
      }
    } catch (error: any) {
      console.error('Error in batch update:', error);
      return false;
    }
  };

  // Analysis Criteria Modal Component
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
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
              {isAnalyzing ? "Analyzing..." : "Analyze Profile"}
            </Button>
          </div>
        </div>
      </div>
    );
  });

  // Advanced Filters Modal Component
  const AdvancedFiltersModal = () => {
    if (!isAdvancedFiltersModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">

              <div>
                <h1 className="text-2xl font-bold">Search Results</h1>
                <p className="text-sm text-gray-500">
                  {searchQuery || `Search ID: ${searchId}`}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls Bar */}
        <div className="mb-6 flex items-center justify-between">
          {/* Left side - Navigation, Filters and Search */}
          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
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
            {/* Actions Dropdown - only show when profiles are selected */}
            {selectedLeads.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                  >
                    Actions ({selectedLeads.length})
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={isDarkMode ? 'bg-zinc-900 border-zinc-700' : ''}>
                  <DropdownMenuItem
                    onClick={handleBatchAnalyzeClick}
                    className={`flex items-center gap-2 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : ''}`}
                  >
                    <BrainCog className="h-4 w-4" />
                    Deep Analyze ({selectedLeads.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleBatchGetEmailsClick}
                    disabled={loadingBatchEmails}
                    className={`flex items-center gap-2 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : ''} ${loadingBatchEmails ? 'opacity-50' : ''}`}
                  >
                    {loadingBatchEmails ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                        Finding Emails...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Get Emails ({selectedLeads.length})
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleBatchGetLinkedInUrlsClick}
                    disabled={loadingBatchLinkedInUrls}
                    className={`flex items-center gap-2 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : ''} ${loadingBatchLinkedInUrls ? 'opacity-50' : ''}`}
                  >
                    {loadingBatchLinkedInUrls ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                        Finding URLs...
                      </>
                    ) : (
                      <>
                        <Linkedin className="h-4 w-4" />
                        Get LinkedIn URLs ({selectedLeads.length})
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSaveToProject}
                    className={`flex items-center gap-2 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : ''}`}
                  >
                    <Download className="h-4 w-4" />
                    Save to Project ({selectedLeads.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportSelected}
                    className={`flex items-center gap-2 ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : ''}`}
                  >
                    <Download className="h-4 w-4" />
                    Export Selected ({selectedLeads.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteSelected}
                    className={`flex items-center gap-2 text-red-600 ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-red-50'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedLeads.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ExportDropdown
              profiles={filteredLeads.map(lead => ({
                _id: lead.id,
                name: lead.name,
                title: lead.title,
                company: lead.company,
                location: lead.location,
                email: lead.emailAddress,
                linkedinUrl: lead.linkedinUrl,
                relevanceScore: parseRelevanceScore(lead.relevanceScore),
                analysis: { score: typeof lead.analysisScore === 'number' ? lead.analysisScore : 0 }
              }))}
              selectedProfiles={selectedLeads}
              fileName={`search-results-${searchId}`}
              size="sm"
            />
          </div>
        </div>

        {/* Table */}
        <div>
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
              <div className="overflow-auto max-h-[70vh] rounded-t-md lead-table-container">
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
                          {renderEditableCell(lead, 'name', lead.name, 'font-medium')}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[180px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'title' ? handleCellEdit(lead.id, 'title', lead.title) : undefined}
                        >
                          {renderEditableCell(lead, 'title', lead.title, 'truncate max-w-[160px]')}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[150px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'company' ? handleCellEdit(lead.id, 'company', lead.company) : undefined}
                        >
                          {renderEditableCell(lead, 'company', lead.company, 'truncate max-w-[130px]')}
                        </TableCell>
                        <TableCell
                          className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px] cursor-pointer hover:bg-gray-50 ${isDarkMode ? 'hover:bg-gray-800' : ''}`}
                          onClick={() => editingCell?.leadId !== lead.id || editingCell?.field !== 'location' ? handleCellEdit(lead.id, 'location', lead.location) : undefined}
                        >
                          {renderEditableCell(lead, 'location', lead.location, 'truncate max-w-[100px]')}
                        </TableCell>
                        <TableCell className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-20`}>
                          <div
                            className={`flex items-center justify-center text-center px-2 py-1  w-10 h-10 rounded-full text-sm font-medium cursor-pointer transition-colors ${parseRelevanceScore(lead.relevanceScore) >= 80 ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                              parseRelevanceScore(lead.relevanceScore) >= 60 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsAnalysisModalOpen(true);
                            }}
                            title="Click to view profile analysis"
                          >
                            {lead.relevanceScore || '0/0'}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            {analyzingProfiles.has(lead.id) ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                              </div>
                            ) : (lead.analysisScore !== undefined && lead.analysisScore !== null && lead.analysisScore !== '') ? (
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
                                  onClick={() => handleGetEmailClick(lead)}
                                >
                                  <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                    <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                  </svg>
                                </div>
                                <span
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                  onClick={() => handleGetEmailClick(lead)}
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
                                  onClick={() => handleGetLinkedInUrlClick(lead)}
                                >
                                  <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                    <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                  </svg>
                                </div>
                                <span
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                  onClick={() => handleGetLinkedInUrlClick(lead)}
                                >
                                  press to run
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-1 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[100px] text-center`}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSourceType(lead.source || '') === 'CSV'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {getSourceType(lead.source || '')}
                          </span>
                        </TableCell>
                        <TableCell className={`py-2 text-right border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} w-24`}>
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
            </div>
          ) : (
            <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProfileAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        lead={selectedLead ? {
          ...selectedLead,
          relevanceScore: parseRelevanceScore(selectedLead.relevanceScore)
        } : null}
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

      <AnalysisCriteriaModal />

      {/* Save to Project Modal */}
      {isSaveToProjectModalOpen && leadToSave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
              Save Profile{selectedLeads.length > 1 ? 's' : ''} to Project
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
              Select an existing project or create a new one to save {selectedLeads.length} profile{selectedLeads.length > 1 ? 's' : ''}.
            </p>
            <div className="mb-4">
              <label className={`block mb-1 font-medium ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                Select Project
              </label>
              {!isCreatingNewProject ? (
                <div>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className={`${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""}`}>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? "bg-zinc-800 border-zinc-700" : ""}>
                      {availableProjects.map(project => (
                        <SelectItem key={project._id} value={project._id} className={isDarkMode ? "text-white hover:bg-zinc-700" : ""}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setIsCreatingNewProject(true)}
                    className={`text-sm mt-2 hover:underline ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    + Create New Project
                  </button>
                </div>
              ) : (
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="New Project Name"
                  className={`${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""} mb-4`}
                  autoFocus
                />
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSaveToProjectModalOpen(false);
                  setLeadToSave(null);
                  setNewProjectName('');
                  setSelectedProjectId('');
                  setIsCreatingNewProject(false);
                }}
                className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
              >
                Cancel
              </Button>

              {isCreatingNewProject ? (
                <Button
                  onClick={async () => {
                    if (!projectName.trim()) {
                      toast.error("Please enter a project name.");
                      return;
                    }

                    try {
                      const response = await authService.createProject({ name: projectName });
                      if (response.name) {
                        toast.success(`Project "${response.name}" created successfully.`);
                        handleProjectCreationSuccess();
                        setAvailableProjects(prev => [...prev, response]);
                        setSelectedProjectId(response._id);
                        setIsCreatingNewProject(false);
                      } else {
                        toast.error(`Failed to create project: ${response?.message || 'Unknown error'}`);
                      }
                    } catch (error: any) {
                      console.error('Error creating project:', error);
                      toast.error(`Failed to create project: ${error.message || 'Network error'}`);
                    }
                  }}
                  className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                  disabled={!projectName.trim()}
                >
                  Create Project
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    const leadsToSave = allLeads.filter(lead => selectedLeads.includes(lead.id));
                    await handleSaveProfile(leadsToSave, selectedProjectId);
                    setIsSaveToProjectModalOpen(false);
                    setLeadToSave(null);
                    setNewProjectName('');
                    setSelectedProjectId('');
                    setIsCreatingNewProject(false);
                  }}
                  className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                  disabled={!selectedProjectId.trim()}
                >
                  Save to Project
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProfileAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        lead={selectedLead ? {
          ...selectedLead,
          relevanceScore: typeof selectedLead.relevanceScore === 'string'
            ? parseFloat(selectedLead.relevanceScore) || 0
            : selectedLead.relevanceScore
        } : null}
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

      <AnalysisCriteriaModal />
      <AdvancedFiltersModal />

    </div>
  );
} 