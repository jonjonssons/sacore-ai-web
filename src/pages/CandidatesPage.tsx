import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { ExternalLink, Copy, CheckCircle, Download, Check, BrainCog, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Mail, Linkedin, Filter, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import authService from '@/services/authService';
import { ProfileAnalysisModal } from '@/components/dashboard/ProfileAnalysisModal';
import { DeepAnalysisModal } from '@/components/dashboard/DeepAnalysisModal';
import { API_BASE_URL } from '@/services/api';

interface Lead {
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
    projectId?: {
        _id: string;
        name: string;
    };
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

export default function CandidatesPage() {
    const { isDarkMode } = useTheme();
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
    const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = React.useState('');

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('relevanceScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Filter state
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

    // New state for Profile Analysis Modal
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Add new state for loading emails
    const [loadingEmails, setLoadingEmails] = useState<string[]>([]);
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
    const [deepAnalysisSelectedLead, setDeepAnalysisSelectedLead] = useState<Lead | null>(null);
    const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);

    // Cleanup stream when component unmounts
    useEffect(() => {
        return () => {
            if (streamCleanup) {
                streamCleanup();
            }
        };
    }, [streamCleanup]);

    // Fetch all profiles from all projects
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const response = await authService.getAllUserProfiles();

                if (response && response.profiles && Array.isArray(response.profiles)) {
                    // Transform profiles to match Lead interface
                    const transformedProfiles = response.profiles.map((profile: any) => ({
                        ...profile,
                        id: profile._id,
                        emailAddress: profile.email || '',
                        profileEvaluation: { status: 'Evaluated' },
                        relevanceScore: profile.relevanceScore || 0
                    }));
                    setProfiles(transformedProfiles);
                } else if (response && Array.isArray(response)) {
                    const transformedProfiles = response.map((profile: any) => ({
                        ...profile,
                        id: profile._id,
                        emailAddress: profile.email || '',
                        profileEvaluation: { status: 'Evaluated' },
                        relevanceScore: profile.relevanceScore || 0
                    }));
                    setProfiles(transformedProfiles);
                } else {
                    setError(response?.message || 'Failed to fetch profiles');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching profiles');
                console.error('Error fetching profiles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

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
    const sortLeads = (leads: Lead[], field: SortField, direction: SortDirection): Lead[] => {
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
                profile.location.toLowerCase().includes(lowerSearch) ||
                (profile.projectId?.name && profile.projectId.name.toLowerCase().includes(lowerSearch))
            );
        }

        // Apply filters
        if (selectedTitles.length > 0 || selectedLocations.length > 0 || selectedIndustries.length > 0) {
            filtered = filtered.filter(profile => {
                const matchesTitles = selectedTitles.length === 0 ||
                    (profile.matchedCategoriesValue?.details?.title &&
                        profile.matchedCategoriesValue.details.title.some(title => selectedTitles.includes(title)));

                const matchesLocations = selectedLocations.length === 0 ||
                    (profile.matchedCategoriesValue?.details?.location &&
                        profile.matchedCategoriesValue.details.location.some(location => selectedLocations.includes(location)));

                const matchesIndustries = selectedIndustries.length === 0 ||
                    (profile.matchedCategoriesValue?.details?.industry &&
                        profile.matchedCategoriesValue.details.industry.some(industry => selectedIndustries.includes(industry)));

                return matchesTitles && matchesLocations && matchesIndustries;
            });
        }

        return sortLeads(filtered, sortField, sortDirection);
    }, [profiles, sortField, sortDirection, searchTerm, selectedTitles, selectedLocations, selectedIndustries]);

    // Extract unique values for filters
    const uniqueValues = React.useMemo(() => {
        const titles = new Set<string>();
        const locations = new Set<string>();
        const industries = new Set<string>();

        profiles.forEach(profile => {
            if (profile.matchedCategoriesValue?.details?.title) {
                profile.matchedCategoriesValue.details.title.forEach(title => titles.add(title));
            }
            if (profile.matchedCategoriesValue?.details?.location) {
                profile.matchedCategoriesValue.details.location.forEach(location => locations.add(location));
            }
            if (profile.matchedCategoriesValue?.details?.industry) {
                profile.matchedCategoriesValue.details.industry.forEach(industry => industries.add(industry));
            }
        });

        return {
            titles: Array.from(titles).sort(),
            locations: Array.from(locations).sort(),
            industries: Array.from(industries).sort()
        };
    }, [profiles]);

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedTitles([]);
        setSelectedLocations([]);
        setSelectedIndustries([]);
    };

    // Check if any filters are active
    const hasActiveFilters = selectedTitles.length > 0 || selectedLocations.length > 0 || selectedIndustries.length > 0;

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

    const handleAnalyzeClick = (lead: Lead) => {
        setDeepAnalysisSelectedLeadId(lead._id);
        setDeepAnalysisSelectedLead(lead);
        setDeepAnalysisSelectedLeadIds([]); // Clear batch selection
        setIsAnalysisCriteriaModalOpen(true);
    };

    // Function to handle Get Email button click
    const handleGetEmailClick = async (lead: Lead) => {
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

    // Helper function to normalize LinkedIn URLs
    const normalizeLinkedInUrl = (url: string): string => {
        try {
            const parsed = new URL(url);
            return parsed.pathname.replace(/\/+$/, '');
        } catch {
            return url;
        }
    };

    const handleAnalysisSubmit = async () => {
        setIsAnalyzing(true);
        setIsAnalysisCriteriaModalOpen(false);
        let streamCleanupLocal: (() => void) | null = null;

        try {
            const filledCriteria = analysisCriteria.filter(c => c.value.trim() !== '');

            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];
            let enrichedProfiles: { id: string, contactOutData: any }[] = [];
            let selectedProfileIds: string[] = [];

            if (deepAnalysisSelectedLeadIds.length > 0) {
                selectedProfileIds = deepAnalysisSelectedLeadIds;
            } else if (deepAnalysisSelectedLeadId) {
                selectedProfileIds = [deepAnalysisSelectedLeadId];
            }

            // Set analyzing state for all selected profiles
            setAnalyzingProfiles(new Set(selectedProfileIds));

            // Separate LinkedIn URLs and SignalHire profile IDs
            selectedProfileIds.forEach(profileId => {
                const profile = profiles.find(p => p._id === profileId);
                if (profile) {
                    console.log('profile', profile);

                    if (profile.linkedinUrl) {
                        linkedinUrls.push(profile.linkedinUrl);
                    } else {
                        profileIds.push(profile._id);
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

            const streamCleanup = await authService.deepAnalyseProfileStream(
                payload,
                // onStreamData callback
                (data) => {
                    console.log('Stream data received:', data);

                    switch (data.type) {
                        case 'status':
                            setStreamingProgress(prev => ({
                                ...prev,
                                total: data.total || prev?.total || selectedProfileIds.length,
                                completed: data.completed || prev?.completed || 0,
                                message: data.message || 'Processing...'
                            }));
                            break;

                        case 'enrichment_status':
                            setStreamingProgress(prev => ({
                                ...prev,
                                message: data.message || 'Enriching profiles...'
                            }));
                            // Removed individual toast - only show final completion count
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

                            // Find profile by ID or by normalizing the identifier URL
                            console.log('🔍 Looking for profile with identifier:', identifier);
                            console.log('📋 Available profiles:', profiles.map(p => ({ id: p._id, name: p.name, linkedinUrl: p.linkedinUrl })));

                            const profileToUpdate = profiles.find(profile => {
                                // Match by ID (for SignalHire)
                                if (profile._id === identifier) {
                                    console.log('✅ Found by ID match:', profile.name);
                                    return true;
                                }
                                // Match by normalized LinkedIn URL (for web profiles)
                                if (profile.linkedinUrl) {
                                    try {
                                        const normalized1 = normalizeLinkedInUrl(profile.linkedinUrl);
                                        const normalized2 = normalizeLinkedInUrl(identifier);
                                        console.log('🔗 URL comparison:', {
                                            profile: profile.name,
                                            profileUrl: normalized1,
                                            identifier: normalized2,
                                            match: normalized1 === normalized2
                                        });
                                        return normalized1 === normalized2;
                                    } catch {
                                        return false;
                                    }
                                }
                                return false;
                            });

                            console.log('🎯 Profile found:', profileToUpdate ? profileToUpdate.name : 'NOT FOUND');

                            if (profileToUpdate) {
                                const profileId = profileToUpdate._id;
                                // Remove from analyzing set since this profile is now complete
                                setAnalyzingProfiles(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(profileId);
                                    return newSet;
                                });

                                // Update progress incrementally
                                setStreamingProgress(prev => {
                                    const newCompleted = data.progress?.completed || (prev ? prev.completed + 1 : 1);
                                    const total = data.progress?.total || prev?.total || selectedProfileIds.length;

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
                                    const company = enrichedData.experience?.[0]?.company || "";
                                    const location = enrichedData.location || "";

                                    let linkedinUrl = "";
                                    if (enrichedData.social && Array.isArray(enrichedData.social)) {
                                        const linkedinSocial = enrichedData.social.find((social: any) => social.type === "li");
                                        if (linkedinSocial && linkedinSocial.link) {
                                            linkedinUrl = linkedinSocial.link;
                                        }
                                    }

                                    // Update the profile with BOTH analysis AND enriched data (like LeadTable.tsx)
                                    console.log('🔄 Updating profile state:', {
                                        profileId,
                                        profileName: profileToUpdate.name,
                                        newAnalysisScore: data.analysis?.score,
                                        beforeUpdate: profileToUpdate.analysisScore
                                    });

                                    setProfiles(prevProfiles =>
                                        prevProfiles.map(p =>
                                            p._id === profileId
                                                ? {
                                                    ...p,
                                                    // Update with enriched data if available, otherwise keep original
                                                    name: fullName || p.name,
                                                    title: title || p.title,
                                                    company: company || p.company,
                                                    location: location || p.location,
                                                    // Only update LinkedIn URL for SignalHire profiles
                                                    linkedinUrl: data.profileId ? (linkedinUrl || p.linkedinUrl) : p.linkedinUrl,
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
                                                : p
                                        )
                                    );

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
                                completed: prev?.total || selectedProfileIds.length,
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

                            // Check if we already have a successful result for this profile
                            if (identifier) {
                                const profileToUpdate = profiles.find(profile => {
                                    if (!profile.linkedinUrl) return false;
                                    try {
                                        return normalizeLinkedInUrl(profile.linkedinUrl) === normalizeLinkedInUrl(identifier);
                                    } catch { return false; }
                                });

                                if (profileToUpdate && deepAnalysisResultsMap[profileToUpdate._id]) {
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
                            setAnalyzingProfiles(new Set());
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

            console.log('Deep analysis stream started successfully');

        } catch (error) {
            console.error('Error during deep analysis:', error);
            toast.error('Failed to start deep analysis');
            setIsAnalyzing(false);
            setAnalyzingProfiles(new Set());
            setStreamingProgress(null);
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
    const renderEmailDisplay = (profile: Lead) => {
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

    // Create a memoized AnalysisCriteriaModal component to prevent focus loss
    const AnalysisCriteriaModal = memo(() => {
        // Local state to track input values while typing
        const [localCriteria, setLocalCriteria] = useState(analysisCriteria);

        // Update local state when parent criteria changes
        useEffect(() => {
            setLocalCriteria(analysisCriteria);
        }, [analysisCriteria]);

        // Handle local changes without updating parent state
        const handleLocalChange = useCallback((id: number, value: string) => {
            setLocalCriteria(prev =>
                prev.map(criteria =>
                    criteria.id === id ? { ...criteria, value } : criteria
                )
            );
        }, []);

        // Update parent state only when input loses focus
        const handleBlur = useCallback((id: number) => {
            const updatedCriteria = localCriteria.find(c => c.id === id);
            if (updatedCriteria) {
                handleCriteriaChange(id, updatedCriteria.value);
            }
        }, [localCriteria]);

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

            {/* Analysis Criteria Modal */}
            <AnalysisCriteriaModal />

            {/* Deep Analysis Modal */}
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


            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">All Candidates</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {profiles.length} total profiles across all projects
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <ExportDropdown
                        profiles={profiles}
                        selectedProfiles={selectedLeads}
                        fileName="candidates"
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

                    {/* Filters Dropdown */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            className={`flex gap-2 text-sm font-medium h-8 px-3 ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200' : ''} ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                                <Badge className="ml-2 bg-black text-white">
                                    {selectedTitles.length + selectedLocations.length + selectedIndustries.length}
                                </Badge>
                            )}
                        </Button>

                        <AnimatePresence>
                            {isFiltersOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`absolute left-0 z-[9999] mt-2 w-[320px] rounded-xl border shadow-xl ${isDarkMode
                                        ? "border-gray-700 bg-gray-900 text-gray-200"
                                        : "border-gray-200 bg-white text-gray-800"
                                        }`}
                                >
                                    <div className={`px-4 py-3 border-b font-semibold ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-800"}`}>
                                        Filter Candidates
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {/* Title Filter */}
                                        <div className={`px-4 py-3 border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                                            Title
                                        </div>
                                        <div className="px-4 py-3 space-y-2">
                                            {uniqueValues.titles.map(title => (
                                                <div key={title} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`title-${title}`}
                                                        checked={selectedTitles.includes(title)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedTitles([...selectedTitles, title]);
                                                            } else {
                                                                setSelectedTitles(selectedTitles.filter(t => t !== title));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`title-${title}`} className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                        {title}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Location Filter */}
                                        <div className={`px-4 py-3 border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                                            Location
                                        </div>
                                        <div className="px-4 py-3 space-y-2">
                                            {uniqueValues.locations.map(location => (
                                                <div key={location} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`location-${location}`}
                                                        checked={selectedLocations.includes(location)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedLocations([...selectedLocations, location]);
                                                            } else {
                                                                setSelectedLocations(selectedLocations.filter(l => l !== location));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`location-${location}`} className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                        {location}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Industry Filter */}
                                        <div className={`px-4 py-3 border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                                            Industry
                                        </div>
                                        <div className="px-4 py-3 space-y-2">
                                            {uniqueValues.industries.map(industry => (
                                                <div key={industry} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`industry-${industry}`}
                                                        checked={selectedIndustries.includes(industry)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedIndustries([...selectedIndustries, industry]);
                                                            } else {
                                                                setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`industry-${industry}`} className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                        {industry}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`flex justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                clearAllFilters();
                                            }}
                                            className={`rounded-md ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""}`}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            size="sm"
                                            className={`rounded-md ${isDarkMode
                                                ? "bg-white text-black hover:bg-gray-200"
                                                : "bg-black text-white hover:bg-gray-900"
                                                }`}
                                            onClick={() => {
                                                setIsFiltersOpen(false);
                                            }}
                                        >
                                            ✓ Apply
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                                    <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}>
                                        Project
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
                                        <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div className="truncate" title={profile.projectId?.name}>
                                                {profile.projectId?.name || 'N/A'}
                                            </div>
                                        </TableCell>
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
                                                ) : profile.analysisScore || profile.analysis || deepAnalysisResultsMap[profile._id] ? (
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
                                                            {(() => {
                                                                const score = profile.analysisScore || profile.analysis?.score || deepAnalysisResultsMap[profile._id]?.analysis?.score;
                                                                console.log('🎯 Rendering score for', profile.name, ':', {
                                                                    analysisScore: profile.analysisScore,
                                                                    nestedScore: profile.analysis?.score,
                                                                    mapScore: deepAnalysisResultsMap[profile._id]?.analysis?.score,
                                                                    finalScore: score,
                                                                    hasAnalysis: !!profile.analysis,
                                                                    hasMap: !!deepAnalysisResultsMap[profile._id]
                                                                });
                                                                return score || 'N/A';
                                                            })()}
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
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className={`text-xs h-8 px-2 flex items-center gap-1 ${isDarkMode ? "text-gray-300 border-gray-600 hover:bg-gray-700" : ""}`}
                                                            disabled
                                                        >
                                                            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                            <span>Finding...</span>
                                                        </Button>
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
                                            <a
                                                href={profile.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                                            >
                                                {profile.linkedinUrl}
                                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                            </a>
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
                        No profiles found.
                    </p>
                </div>
            )}
        </div>

    );
}
