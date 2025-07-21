import React, { useState, useEffect, memo } from 'react';
import { ArrowLeft, ExternalLink, Copy, CheckCircle, Download, Check, BrainCog, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Mail, Linkedin } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { ProfileAnalysisModal } from '@/components/dashboard/ProfileAnalysisModal';
import { DeepAnalysisModal } from '@/components/dashboard/DeepAnalysisModal';
import { API_BASE_URL } from '@/services/api';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectLead {
    _id: string;
    id?: string;
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
    email?: string;
    matchedCategories?: {
        location?: string[];
        title?: string[];
        industry?: string[];
    };
    matchedCategoriesValue?: {
        matched: number;
        total: number;
        details: {
            location?: string[];
            title?: string[];
            industry?: string[];
        };
    };
    analysis?: {
        enrichedData?: any;
        score?: string;
        description?: string;
        breakdown?: { criterion: string; met: boolean }[];
    };
    analysisScore?: string;
    analysisDescription?: string;
    analysisBreakdown?: { criterion: string; met: boolean }[];
}

type SortField = 'name' | 'title' | 'company' | 'industry' | 'location' | 'relevanceScore';
type SortDirection = 'asc' | 'desc';


const dummyLeads: ProjectLead[] = [
    {
        _id: '1',
        id: '1',
        name: 'John Doe',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        experienceLevel: 'Senior',
        companySize: '100-500',
        relevanceScore: 85,
        profileEvaluation: { status: 'Evaluated' },
        emailAddress: 'john.doe@example.com',
        linkedinUrl: 'https://linkedin.com/in/johndoe'
    },
    {
        _id: '2',
        id: '2',
        name: 'Jane Smith',
        title: 'Product Manager',
        company: 'Innovate Ltd',
        location: 'New York',
        industry: 'Finance',
        experienceLevel: 'Mid',
        companySize: '500-1000',
        relevanceScore: 90,
        profileEvaluation: { status: 'Evaluated' },
        emailAddress: 'jane.smith@example.com',
        linkedinUrl: 'https://linkedin.com/in/janesmith'
    }
];

export default function ProjectPage() {
    const { isDarkMode } = useTheme();
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
    const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Add state for delete project dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [searchTerm, setSearchTerm] = React.useState('');

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('relevanceScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // New state for Profile Analysis Modal
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Add new state for loading emails
    const [loadingEmails, setLoadingEmails] = useState<string[]>([]);
    const [loadingLinkedInUrls, setLoadingLinkedInUrls] = useState<string[]>([]);
    const [loadingBatchEmails, setLoadingBatchEmails] = useState(false);

    // Add new state for streaming
    const [streamingProgress, setStreamingProgress] = useState<{
        total: number;
        completed: number;
        message: string;
    } | null>(null);

    const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);

    // Add new state to track profiles currently being analyzed
    const [analyzingProfiles, setAnalyzingProfiles] = useState<Set<string>>(new Set());

    // Add state to track which lead's emails are expanded
    const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

    const handleBatchAnalyzeClick = () => {
        // Implement batch analyze logic here, e.g., open analysis modal for selected leads
        // For now, you can trigger analysis for selected leads or open modal
        console.log('Batch analyze clicked for leads:', selectedLeads);
        // Example: setDeepAnalysisSelectedLeadIds(selectedLeads);
        // setIsAnalysisCriteriaModalOpen(true);
        if (selectedLeads.length === 0) {
            alert("Please select at least one profile to analyze.");
            return;
        }
        setDeepAnalysisSelectedLeadIds(selectedLeads);
        setDeepAnalysisSelectedLeadId(null);
        setDeepAnalysisSelectedLead(null);
        setIsAnalysisCriteriaModalOpen(true);
    };

    const handleBatchGetEmailsClick = async () => {
        setLoadingBatchEmails(true);
        try {
            const token = await authService.getToken();

            // Separate LinkedIn URLs and SignalHire profile IDs
            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];

            profiles
                .filter(profile => selectedLeads.includes(profile._id))
                .forEach(profile => {
                    // Check if this is a SignalHire profile (has no LinkedIn URL but has a SignalHire UID as ID)
                    if (!profile.linkedinUrl && profile._id.length === 32) {
                        // This is likely a SignalHire profile with UID as ID
                        profileIds.push(profile._id);
                    } else if (profile.linkedinUrl) {
                        // This is a LinkedIn profile
                        linkedinUrls.push(profile.linkedinUrl);
                    }
                });

            const response = await fetch(`${API_BASE_URL}/profile/get-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    linkedinUrls: linkedinUrls,
                    profileIds: profileIds
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.results && data.results.length > 0) {
                const normalizeUrl = (url: string) => {
                    try {
                        const parsed = new URL(url);
                        return parsed.pathname.replace(/\/+$/, '');
                    } catch {
                        return url;
                    }
                };

                setProfiles(prevProfiles =>
                    prevProfiles.map(profile => {
                        // Find result by LinkedIn URL or profile ID
                        let leadResult;
                        if (profile.linkedinUrl) {
                            const leadNormalized = normalizeUrl(profile.linkedinUrl);
                            leadResult = data.results.find((r: any) =>
                                r.linkedinUrl && normalizeUrl(r.linkedinUrl) === leadNormalized
                            );
                        } else {
                            // Find by profile ID for SignalHire profiles
                            leadResult = data.results.find((r: any) => r.profileId === profile._id);
                        }

                        if (leadResult && leadResult.emails && leadResult.emails.length > 0) {
                            const emails = leadResult.emails.map((email: any) => email.value).join(', ');
                            // Update profile email
                            // Also update in backend
                            authService.updateProfile(profile._id, [{
                                name: profile.name,
                                location: profile.location,
                                title: profile.title,
                                company: profile.company,
                                email: emails
                            }]).catch(err => {
                                console.error('Failed to update profile in batch email fetch:', err);
                                toast.error('Failed to update some profiles in database');
                            });
                            return { ...profile, email: emails };
                        }
                        return profile;
                    })
                );
                toast.success(`Emails fetched for ${selectedLeads.length} profiles`);
            } else {
                toast.error('Failed to fetch emails for selected profiles');
            }
        } catch (error: any) {
            toast.error(`Error fetching emails: ${error.message || error}`);
        } finally {
            setLoadingBatchEmails(false);
        }
    };


    const [isAnalysisCriteriaModalOpen, setIsAnalysisCriteriaModalOpen] = useState(false);
    const [analysisCriteria, setAnalysisCriteria] = useState([
        { id: 1, value: '', placeholder: 'Years of experience in...' },
        { id: 2, value: '', placeholder: 'Graduation year after...' },
        { id: 3, value: '', placeholder: 'Years in industry...' }
    ]);

    const [deepAnalysisSelectedLeadId, setDeepAnalysisSelectedLeadId] = useState<string | null>(null);
    const [deepAnalysisSelectedLead, setDeepAnalysisSelectedLead] = useState<ProjectLead | null>(null);
    const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);


    // Get project ID from URL
    const urlParts = window.location.pathname.split("/");
    const projectId = urlParts[urlParts.length - 1];

    const location = useLocation();

    // Extract project ID from URL if not available in params
    const getProjectIdFromUrl = () => {
        if (projectId) return projectId;

        // Extract from pathname
        const pathParts = location.pathname.split('/');
        const idFromPath = pathParts[pathParts.length - 1];

        // Check if it's a valid ID format
        if (idFromPath && idFromPath.match(/^[0-9a-fA-F]{24}$/)) {
            return idFromPath;
        }

        // Extract from search params
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('projectId') || '';
    };

    const currentProjectId = getProjectIdFromUrl();

    // Fetch saved profiles for the project
    useEffect(() => {
        const fetchProfiles = async () => {
            // Skip fetching if currentProjectId doesn't look like a valid MongoDB ObjectId
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(currentProjectId);

            if (!isValidObjectId) {
                setError('Invalid project ID format');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await authService.getSavedProfilesForProjects(currentProjectId);

                if (response && Array.isArray(response)) {
                    setProfiles(response);
                } else {
                    setError(response.message || 'Failed to fetch profiles');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching profiles');
                console.error('Error fetching profiles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, [currentProjectId]);

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(profiles.map(profile => profile._id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
            setSelectAll(false);
        } else {
            setSelectedLeads([...selectedLeads, id]);
            if (selectedLeads.length + 1 === profiles.length) {
                setSelectAll(true);
            }
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            setCopiedUrl(url);
            copyTimeoutRef.current = setTimeout(() => {
                setCopiedUrl(null);
            }, 2000);
        });
    };

    const handleOpenUrl = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Sorting function
    const sortLeads = (leads: ProjectLead[], field: SortField, direction: SortDirection): ProjectLead[] => {
        return [...leads].sort((a, b) => {
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

    // Apply sorting to profiles before rendering
    const sortedProfiles = React.useMemo(() => {
        let filtered = profiles;

        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(profile =>
                profile.name.toLowerCase().includes(lowerSearch) ||
                profile.title.toLowerCase().includes(lowerSearch) ||
                profile.company.toLowerCase().includes(lowerSearch) ||
                profile.location.toLowerCase().includes(lowerSearch)
            );
        }

        return sortLeads(filtered, sortField, sortDirection);
    }, [profiles, sortField, sortDirection, searchTerm]);

    const renderSortIcon = (field: SortField) => {
        if (field !== sortField) {
            return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
        }

        return sortDirection === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 inline text-black" />
            : <ArrowDown className="ml-1 h-4 w-4 inline text-black" />;
    };

    const [deepAnalysisSelectedLeadIds, setDeepAnalysisSelectedLeadIds] = React.useState<string[]>([]);
    const [deepAnalysisResultsMap, setDeepAnalysisResultsMap] = React.useState<Record<string, any>>({});

    const handleAnalyzeClick = (lead: ProjectLead) => {
        setDeepAnalysisSelectedLeadId(lead._id);
        setDeepAnalysisSelectedLead(lead);
        setDeepAnalysisSelectedLeadIds([]); // Clear batch selection
        setIsAnalysisCriteriaModalOpen(true);
    };

    // Function to handle Get Email button click
    const handleGetEmailClick = async (lead: ProjectLead) => {
        setLoadingEmails(prev => [...prev, lead._id]);
        try {
            const token = await authService.getToken();
            const response = await fetch(`${API_BASE_URL}/profile/get-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    linkedinUrls: [lead.linkedinUrl]
                })
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.results && data.results.length > 0) {
                // Normalize URLs for comparison
                const normalizeUrl = (url: string) => {
                    try {
                        const parsed = new URL(url);
                        return parsed.pathname.replace(/\/+$/, ''); // remove trailing slash
                    } catch {
                        return url;
                    }
                };
                const leadNormalized = normalizeUrl(lead.linkedinUrl);
                const leadResult = data.results.find((r: any) => normalizeUrl(r.linkedinUrl) === leadNormalized);
                if (leadResult && leadResult.emails && leadResult.emails.length > 0) {
                    const emails = leadResult.emails.map((email: any) => email.value).join(', ');
                    // Update the emailAddress field in profiles state
                    setProfiles(prevProfiles =>
                        prevProfiles.map(p =>
                            p._id === lead._id ? { ...p, email: emails } : p
                        )
                    );
                    toast.success(`Emails fetched for ${lead.name}`);
                    try {
                        await authService.updateProfile(lead._id, [{
                            name: lead.name,
                            location: lead.location,
                            title: lead.title,
                            company: lead.company,
                            email: emails
                        }]);
                    } catch (updateError) {
                        console.error('Failed to update profile after getting emails:', updateError);
                        toast.error('Failed to update profile in database');
                    }
                } else {
                    toast.error(`No emails found for ${lead.name}`);
                }
            } else {
                toast.error(`Failed to fetch emails for ${lead.name}`);
            }
        } catch (error: any) {
            toast.error(`Error fetching emails: ${error.message || error}`);
        } finally {
            setLoadingEmails(prev => prev.filter(id => id !== lead._id));
        }
    };

    const handleGetLinkedInUrlClick = async (lead: ProjectLead) => {
        setLoadingLinkedInUrls(prev => [...prev, lead._id]);
        try {
            const token = await authService.getToken();
            const response = await fetch(`${API_BASE_URL}/profile/get-linkedin-urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    profileIds: [lead._id]
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();
            if (data.success && data.results && data.results.length > 0) {
                const profileResult = data.results.find((r: any) => r.profileId === lead._id);
                if (profileResult && profileResult.status === 'success' && profileResult.linkedinUrl) {
                    setProfiles(prev =>
                        prev.map(p =>
                            p._id === lead._id ? { ...p, linkedinUrl: profileResult.linkedinUrl } : p
                        )
                    );
                    toast.success(`LinkedIn URL found for ${lead.name}`);
                } else {
                    toast.error(`No LinkedIn URL found for ${lead.name}`);
                }
            } else {
                toast.error(`No LinkedIn URL found for ${lead.name}`);
            }
        } catch (error: any) {
            toast.error(`Error finding LinkedIn URL: ${error.message || error}`);
        } finally {
            setLoadingLinkedInUrls(prev => prev.filter(id => id !== lead._id));
        }
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
    const normalizeLinkedInUrl = (url: string): string => {
        try {
            const parsed = new URL(url);
            const pathname = parsed.pathname.replace(/\/+$/, ''); // trim trailing slash
            return `https://www.linkedin.com${pathname}`;
        } catch (err) {
            return url; // fallback
        }
    };

    const handleAnalysisSubmit = async () => {
        setIsAnalyzing(true);
        setIsAnalysisCriteriaModalOpen(false);
        setStreamingProgress({ total: 0, completed: 0, message: 'Starting analysis...' });

        try {
            const filledCriteria = analysisCriteria.filter(c => c.value.trim() !== '');

            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];

            if (deepAnalysisSelectedLeadIds.length > 0) {
                // Separate LinkedIn URLs and SignalHire profile IDs
                deepAnalysisSelectedLeadIds.forEach(id => {
                    const profile = profiles.find(p => p._id === id);
                    if (profile) {
                        // Check if this is a SignalHire profile (has no LinkedIn URL but has a 32-char UID as ID)
                        if (!profile.linkedinUrl && profile._id.length === 32) {
                            // This is likely a SignalHire profile with UID as ID
                            profileIds.push(profile._id);
                        } else if (profile.linkedinUrl) {
                            // This is a LinkedIn profile
                            linkedinUrls.push(normalizeLinkedInUrl(profile.linkedinUrl));
                        }
                    }
                });
            } else if (deepAnalysisSelectedLeadId) {
                const profile = profiles.find(p => p._id === deepAnalysisSelectedLeadId);
                if (profile) {
                    // Check if this is a SignalHire profile
                    if (!profile.linkedinUrl && profile._id.length === 32) {
                        profileIds.push(profile._id);
                    } else if (profile.linkedinUrl) {
                        linkedinUrls.push(normalizeLinkedInUrl(profile.linkedinUrl));
                    }
                }
            }

            // Mark all selected profiles as being analyzed
            setAnalyzingProfiles(new Set(deepAnalysisSelectedLeadIds.length > 0 ? deepAnalysisSelectedLeadIds : [deepAnalysisSelectedLeadId].filter(Boolean)));

            const payload = {
                criteria: filledCriteria.map(c => c.value.trim()),
                linkedinUrls: linkedinUrls,
                profileIds: profileIds
            };

            console.log('Starting streaming analysis with payload:', payload);

            // Use the new streaming method
            const cleanup = await authService.deepAnalyseProfileStream(
                payload,
                // onStreamData callback
                (data) => {
                    console.log('Stream data received:', data);

                    switch (data.type) {
                        case 'status':
                            setStreamingProgress({
                                total: data.total || 0,
                                completed: data.completed || 0,
                                message: data.message || 'Processing...'
                            });
                            break;

                        case 'enrichment_status':
                            setStreamingProgress(prev => ({
                                ...prev,
                                message: data.message || 'Analysing profiles...'
                            }));
                            // toast.success(data.message); // This toast is not needed
                            break;

                        case 'enrichment_complete':
                            setStreamingProgress(prev => ({
                                ...prev,
                                message: data.message || 'Enrichment complete, analyzing...'
                            }));
                            break;

                        case 'result':
                            // Update progress
                            if (data.progress) {
                                setStreamingProgress({
                                    total: data.progress.total,
                                    completed: data.progress.completed,
                                    message: `Analyzing profiles... (${data.progress.completed}/${data.progress.total})`
                                });
                            }

                            // Handle individual result - need to find profile by either linkedinUrl or profileId
                            let profileId;
                            const identifier = data.identifier || data.linkedinUrl || data.profileId;

                            console.log('🔍 Looking for profile with identifier:', identifier);
                            console.log('📋 Available profiles:', profiles.map(p => ({ _id: p._id, linkedinUrl: p.linkedinUrl })));

                            if (data.linkedinUrl || data.identifier) {
                                // Find by LinkedIn URL (try both identifier and linkedinUrl fields)
                                const urlToMatch = data.identifier || data.linkedinUrl;
                                const foundProfile = profiles.find(profile => {
                                    if (!profile.linkedinUrl) return false;
                                    try {
                                        const profileNormalized = normalizeLinkedInUrl(profile.linkedinUrl);
                                        const dataNormalized = normalizeLinkedInUrl(urlToMatch);
                                        console.log('🔗 Comparing:', profileNormalized, 'vs', dataNormalized);
                                        return profileNormalized === dataNormalized;
                                    } catch (error) {
                                        console.warn('URL normalization error:', error);
                                        return profile.linkedinUrl === urlToMatch;
                                    }
                                });
                                profileId = foundProfile?._id;
                                console.log('✅ Found profile by URL:', profileId ? 'YES' : 'NO', profileId);
                            } else if (data.profileId) {
                                // Find by SignalHire UID
                                profileId = profiles.find(profile => profile._id === data.profileId)?._id;
                                console.log('✅ Found profile by ID:', profileId ? 'YES' : 'NO', profileId);
                            }

                            if (profileId) {
                                console.log('🎯 Processing analysis for profile:', profileId, 'with score:', data.analysis?.score);

                                // Remove from analyzing set since this profile is now complete
                                setAnalyzingProfiles(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(profileId);
                                    return newSet;
                                });

                                if (data.status === 'success' && data.analysis) {
                                    console.log('✅ Updating deepAnalysisResultsMap for:', profileId);
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

                                    // Extract enriched fields from data.enrichedData - only for SignalHire profiles
                                    const enrichedData = data.enrichedData || {};
                                    let linkedinUrl = "";
                                    if (data.profileId && Array.isArray(enrichedData.social)) {
                                        // Only extract LinkedIn URL for SignalHire profiles
                                        const linkedinSocial = enrichedData.social.find((social: any) => social.type === "li");
                                        if (linkedinSocial && linkedinSocial.link) {
                                            linkedinUrl = linkedinSocial.link;
                                        }
                                    }

                                    // Update the profile in the main profiles array with BOTH analysis and enrichedData
                                    console.log('🔄 Updating profile state for:', profileId, 'with analysisScore:', data.analysis?.score);
                                    setProfiles(prev => prev.map(profile =>
                                        profile._id === profileId
                                            ? {
                                                ...profile,
                                                // Only update LinkedIn URL for SignalHire profiles
                                                linkedinUrl: data.profileId ? (linkedinUrl || profile.linkedinUrl) : profile.linkedinUrl,
                                                // Update analysis data directly on profile
                                                analysisScore: data.analysis?.score,
                                                analysisDescription: data.analysis?.description,
                                                analysisBreakdown: data.analysis?.breakdown,
                                                // Also keep the nested analysis object for compatibility
                                                analysis: {
                                                    enrichedData: data.enrichedData,
                                                    score: data.analysis?.score ?? null,
                                                    description: data.analysis?.description ?? null,
                                                    breakdown: data.analysis?.breakdown ?? null
                                                }
                                            }
                                            : profile
                                    ));

                                    // Update profile in database with BOTH analysis and enrichedData
                                    (async () => {
                                        try {
                                            const currentProfile = profiles.find(p => p._id === profileId);
                                            if (currentProfile) {
                                                await authService.updateProfile(profileId, [{
                                                    name: data.name || currentProfile.name,
                                                    location: currentProfile.location,
                                                    title: currentProfile.title,
                                                    company: currentProfile.company,
                                                    email: currentProfile.email,
                                                    // Only update LinkedIn URL for SignalHire profiles
                                                    linkedinUrl: data.profileId ? (linkedinUrl || currentProfile.linkedinUrl) : currentProfile.linkedinUrl,
                                                    analysisScore: data.analysis?.score,
                                                    analysisDescription: data.analysis?.description,
                                                    analysisBreakdown: data.analysis?.breakdown,
                                                    analysis: {
                                                        enrichedData: data.enrichedData,
                                                        score: data.analysis?.score ?? null,
                                                        description: data.analysis?.description ?? null,
                                                        breakdown: data.analysis?.breakdown ?? null
                                                    }
                                                }]);
                                                console.log(`✅ Profile updated in database: ${currentProfile.name}`);
                                            }
                                        } catch (updateError) {
                                            console.error(`❌ Failed to update profile in database:`, updateError);
                                            // Don't show toast for individual failures to avoid spam
                                        }
                                    })();

                                } else if (data.status === 'failed') {
                                    toast.error(`Failed to analyze ${data.name || data.linkedinUrl || data.profileId}: ${data.error}`);
                                } else {
                                    console.warn('❌ Profile not found for identifier:', identifier);
                                    console.warn('📋 Available profile URLs:', profiles.map(p => p.linkedinUrl));
                                }
                            }
                            break;

                        case 'complete':
                            setStreamingProgress(prev => ({
                                ...prev,
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

                        case 'error':
                            toast.error(`Analysis error: ${data.message}`);
                            setStreamingProgress(null);
                            setIsAnalyzing(false);
                            setAnalyzingProfiles(new Set()); // Clear analyzing state on error
                            break;

                        default:
                            console.log('Unknown stream data type:', data.type);
                    }
                },
                // onError callback
                (error) => {
                    console.error('Stream error:', error);
                    toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
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

            setStreamCleanup(() => cleanup);

        } catch (error) {
            console.error('Failed to start streaming analysis:', error);
            toast.error('Failed to start analysis');
            setIsAnalyzing(false);
            setStreamingProgress(null);
            setAnalyzingProfiles(new Set()); // Clear analyzing state on error
        }
    };

    // Cleanup stream on component unmount
    useEffect(() => {
        return () => {
            if (streamCleanup) {
                streamCleanup();
            }
        };
    }, [streamCleanup]);

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

    // Handle project deletion
    const handleDeleteProject = async () => {
        try {
            await authService.deleteProject(currentProjectId);

            // Dispatch a custom event to notify other components (like sidebar) to refresh their project lists
            const projectDeletedEvent = new CustomEvent('projectDeleted');
            window.dispatchEvent(projectDeletedEvent);

            toast.success("Project successfully deleted");
            navigate("/leads");
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast.error("Failed to delete project. Please try again.");
        }
    };

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
    const renderEmailDisplay = (profile: ProjectLead) => {
        if (!profile.email) return null;

        const emails = profile.email.split(',').map(email => email.trim()).filter(email => email);
        const isExpanded = expandedEmails.has(profile._id);

        if (emails.length <= 1) {
            // Single email or no email
            return <span className="truncate max-w-[200px]">{profile.email}</span>;
        }

        if (isExpanded) {
            // Show all emails
            return (
                <div className="flex flex-col gap-1">
                    {emails.map((email, index) => (
                        <span key={index} className="text-sm truncate max-w-[200px]">
                            {email}
                        </span>
                    ))}
                    <button
                        onClick={() => toggleEmailExpansion(profile._id)}
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
                    <span className="text-sm truncate max-w-[200px]">{emails[0]}</span>
                    <button
                        onClick={() => toggleEmailExpansion(profile._id)}
                        className={`text-xs underline ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:no-underline`}
                    >
                        See more... (+{emails.length - 1})
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="w-full" data-has-leads={profiles.length > 0 ? "true" : "false"}>
            <ProfileAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                lead={selectedLead}
                searchCriteria={{
                    title: selectedLead?.matchedCategories?.title?.join(', ') || '',
                    location: selectedLead?.matchedCategories?.location?.join(', ') || '',
                    industry: selectedLead?.matchedCategories?.industry?.join(', ') || ''
                }}
            />
            <DeepAnalysisModal
                isOpen={isDeepAnalysisModalOpen}
                onClose={() => setIsDeepAnalysisModalOpen(false)}
                lead={deepAnalysisSelectedLead ? {
                    id: deepAnalysisSelectedLead._id,
                    name: deepAnalysisSelectedLead.name,
                    linkedinUrl: deepAnalysisSelectedLead.linkedinUrl
                } : null}
                analysisResult={deepAnalysisSelectedLeadId ? deepAnalysisResultsMap[deepAnalysisSelectedLeadId] : null}
            />
            <AnalysisCriteriaModal />
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <ExportDropdown
                        profiles={profiles}
                        selectedProfiles={selectedLeads}
                        fileName="project_profiles"
                    />

                    {selectedLeads.length > 0 && (
                        <>
                            <Button variant="outline" className="text-sm font-medium" onClick={handleBatchAnalyzeClick}>
                                Deep Analyze ({selectedLeads.length})
                            </Button>
                            <Button
                                variant="outline"
                                className="text-sm font-medium ml-2"
                                onClick={handleBatchGetEmailsClick}
                                disabled={loadingBatchEmails}
                            >
                                {loadingBatchEmails ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                        <span>Finding Emails...</span>
                                    </div>
                                ) : (
                                    `Get Emails (${selectedLeads.length})`
                                )}
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className={`flex items-center gap-1.5 ${isDarkMode
                            ? "bg-gray-800 text-red-400 hover:bg-gray-700 border-gray-700"
                            : "bg-white text-red-600 hover:bg-gray-50 border-gray-200"
                            }`}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                    </Button>

                    <div className="relative w-64">
                        <Input
                            placeholder="Search profiles..."
                            className="pl-4 pr-4 py-2 border-gray-300 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className={isDarkMode ? "bg-gray-800 border border-gray-700 text-white" : ""}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={isDarkMode ? "text-white" : ""}>
                            Delete this project?
                        </AlertDialogTitle>
                        <AlertDialogDescription className={isDarkMode ? "text-gray-300" : "text-gray-500"}>
                            This action cannot be undone. This will permanently delete this project and all its associated profiles.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className={isDarkMode ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" : ""}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            className={`bg-red-600 text-white hover:bg-red-700 ${isDarkMode ? "focus:ring-red-800" : "focus:ring-red-500"}`}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {loading ? (
                <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-primary border-muted/40' : 'bg-white border-gray-300'}`}>
                    <div className="mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className={`mt-4 ${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        Loading profiles...
                    </p>
                </div>
            ) : error ? (
                <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
                    <p className={`mt-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {error}
                    </p>
                </div>
            ) : profiles.length > 0 ? (
                <div
                    className={`rounded-md border shadow-sm relative ${isDarkMode
                        ? "border-gray-700 bg-gray-900"
                        : "border-gray-300 bg-white"
                        }`}
                >
                    {/* Scrollable Table Container */}
                    <div className="overflow-auto max-h-[70vh] rounded-t-md lead-table-container">
                        <Table className={`border-collapse w-full min-w-[1400px] ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                            <TableHeader className={isDarkMode ? "bg-gray-950" : "bg-gray-50"}>
                                <TableRow className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-300"}>
                                    <TableHead className={`w-[50px] py-3 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                        <div className="flex items-center justify-center">
                                            <Checkbox
                                                checked={selectAll}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all leads"
                                                className="mr-3"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}
                                        onClick={() => handleSort('name')}
                                    >
                                        Name {renderSortIcon("name")}
                                    </TableHead>
                                    <TableHead
                                        className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}
                                        onClick={() => handleSort('title')}
                                    >
                                        Title {renderSortIcon('title')}
                                    </TableHead>
                                    <TableHead
                                        className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}
                                        onClick={() => handleSort('company')}
                                    >
                                        Company {renderSortIcon('company')}
                                    </TableHead>
                                    <TableHead
                                        className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}
                                        onClick={() => handleSort('location')}
                                    >
                                        Location {renderSortIcon('location')}
                                    </TableHead>
                                    <TableHead
                                        className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}
                                        onClick={() => handleSort('relevanceScore')}
                                    >
                                        Score {renderSortIcon('relevanceScore')}
                                    </TableHead>
                                    <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[160px]`}>Deep Analysis</TableHead>
                                    <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}>Email</TableHead>
                                    <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}>LinkedIn URL</TableHead>
                                    <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProfiles.map((profile) => (
                                    <TableRow key={profile._id} className={`transition-colors border-b ${isDarkMode
                                        ? "bg-primary hover:bg-gray-950 border-gray-700"
                                        : "bg-white hover:bg-gray-50 border-gray-300"
                                        }`}>
                                        <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={selectedLeads.includes(profile._id)}
                                                    onCheckedChange={() => handleSelectLead(profile._id)}
                                                    aria-label={`Select ${profile.name}`}
                                                    className={`mr-3  
        ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
        focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                                />
                                            </div>
                                        </TableCell>

                                        <TableCell className={`font-medium py-4 border-r ${isDarkMode ? "text-gray-200 border-gray-700" : "border-gray-300"}`}>{profile.name}</TableCell>
                                        <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>{profile.title}</TableCell>
                                        <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>{profile.company}</TableCell>
                                        <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>{profile.location}</TableCell>
                                        <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div
                                                className="flex flex-col items-center cursor-pointer"
                                                onClick={() => {
                                                    setSelectedLead(profile);
                                                    setIsAnalysisModalOpen(true);
                                                }}
                                            >
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700"} mx-auto`}>
                                                    <span className="font-medium text-sm">
                                                        {profile.relevanceScore || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {/* Check if this profile is currently being analyzed */}
                                                {analyzingProfiles.has(profile._id) ? (
                                                    <Button
                                                        variant="outline"
                                                        className={`text-xs h-8 px-2 flex items-center gap-1 ${isDarkMode ? "text-gray-300 border-gray-600 hover:bg-gray-700" : ""}`}
                                                        disabled
                                                    >
                                                        <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                                        Analyzing...
                                                    </Button>
                                                ) : (() => {
                                                    // Debug the analysis display condition
                                                    const hasAnalysisScore = !!profile.analysisScore;
                                                    const hasAnalysis = !!profile.analysis;
                                                    const hasMapEntry = !!deepAnalysisResultsMap[profile._id];
                                                    const scoreToShow = profile.analysisScore || profile.analysis?.score || deepAnalysisResultsMap[profile._id]?.analysis?.score;

                                                    console.log('🎯 Table cell for', profile.name, ':', {
                                                        profileId: profile._id,
                                                        hasAnalysisScore,
                                                        hasAnalysis,
                                                        hasMapEntry,
                                                        scoreToShow,
                                                        condition: hasAnalysisScore || hasAnalysis || hasMapEntry
                                                    });

                                                    return hasAnalysisScore || hasAnalysis || hasMapEntry;
                                                })() ? (
                                                    /* Show completed analysis */
                                                    <div
                                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto cursor-pointer hover:bg-blue-200 transition-colors"
                                                        onClick={() => {
                                                            setDeepAnalysisSelectedLeadId(profile._id);
                                                            setDeepAnalysisSelectedLead(profile);

                                                            // If profile already has analysis data but it's not in the map, add it
                                                            if (profile.analysis && !deepAnalysisResultsMap[profile._id]) {
                                                                setDeepAnalysisResultsMap(prev => ({
                                                                    ...prev,
                                                                    [profile._id]: {
                                                                        analysis: profile.analysis,
                                                                        enrichedData: profile.analysis.enrichedData
                                                                    }
                                                                }));
                                                            }

                                                            setIsDeepAnalysisModalOpen(true);
                                                        }}
                                                    >
                                                        <span className="font-medium text-sm">
                                                            {profile.analysisScore || profile.analysis?.score || deepAnalysisResultsMap[profile._id]?.analysis?.score || 'N/A'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    /* Show analyze button for profiles that haven't been analyzed */
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                            onClick={() => handleAnalyzeClick(profile)}
                                                            title="Our AI is going to analyze this profile"
                                                        >
                                                            <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                            </svg>
                                                        </div>
                                                        <span
                                                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                            onClick={() => handleAnalyzeClick(profile)}
                                                        >
                                                            press to run
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`py-4 ${isDarkMode ? "text-gray-300" : ""} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div className="flex items-center justify-center gap-2">
                                                {loadingEmails.includes(profile._id) ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                    </div>
                                                ) : profile.email ? (
                                                    renderEmailDisplay(profile)
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                            onClick={() => handleGetEmailClick(profile)}
                                                        >
                                                            <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                            </svg>
                                                        </div>
                                                        <span
                                                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                            onClick={() => handleGetEmailClick(profile)}
                                                        >
                                                            press to run
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            {loadingLinkedInUrls.includes(profile._id) ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                </div>
                                            ) : profile.linkedinUrl && profile.linkedinUrl.trim() !== '' ? (
                                                <a
                                                    href={profile.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                                                >
                                                    {profile.linkedinUrl}
                                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                        onClick={() => handleGetLinkedInUrlClick(profile)}
                                                    >
                                                        <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                            <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                        </svg>
                                                    </div>
                                                    <span
                                                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                        onClick={() => handleGetLinkedInUrlClick(profile)}
                                                    >
                                                        press to run
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="flex justify-end gap-1 pr-3">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-md ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                                                onClick={() => handleCopyUrl(profile.linkedinUrl)}
                                                            >
                                                                {copiedUrl === profile.linkedinUrl ? (
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
                                                                onClick={() => handleOpenUrl(profile.linkedinUrl)}
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

                    <div
                        className={`flex justify-between items-center p-4 border-t 
    ${isDarkMode ? "border-gray-700 bg-gray-950 text-gray-200" : "border-gray-300 bg-gray-50 text-gray-700"}`}
                    >
                        <div className="text-sm">
                            Total results: {profiles.length}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    alert("Export functionality would be implemented here");
                                }}
                                className={`flex items-center ${isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-600" : ""
                                    }`}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                </div>
            ) : (
                <div className={`text-center py-10 rounded-md border ${isDarkMode ? 'bg-muted border-muted/40' : 'bg-white border-gray-300'}`}>
                    <p className={`mt-4 ${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        No profiles found for this project.
                    </p>
                </div>
            )}
        </div>

    );
}
