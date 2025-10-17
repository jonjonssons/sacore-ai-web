import React, { useState, useEffect, memo, useRef } from 'react';
import { ArrowLeft, ExternalLink, Copy, CheckCircle, Download, Check, BrainCog, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Mail, Linkedin, X, ChevronDown } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProjectLead {
    _id: string;
    id?: string;
    uid?: string;  // Add uid property for SignalHire profiles
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
    linkedinUrlStatus?: 'no_url_found' | 'failed';  // Add status for LinkedIn URL extraction
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
    signalhireData?: any;  // Backend uses lowercase 'h' - full SignalHire enriched data
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

    // Add state for LinkedIn URL extraction
    const [loadingBatchLinkedInUrls, setLoadingBatchLinkedInUrls] = useState(false);
    const [linkedInUrlProgress, setLinkedInUrlProgress] = useState<{
        total: number;
        completed: number;
        message: string;
    } | null>(null);

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
                const profile = profiles.find(p => p._id === leadId);
                if (!profile) return;

                console.log('🔍 Processing profile for email extraction:', {
                    name: profile.name,
                    _id: profile._id,
                    uid: profile.uid,
                    signalHireData: profile.signalHireData,
                    linkedinUrl: profile.linkedinUrl
                });

                // Check if this is a SignalHire profile (has uid) or LinkedIn profile
                if (profile.uid) {
                    // SignalHire profile - use uid
                    console.log('✅ Using profile.uid:', profile.uid);
                    profileIds.push(profile.uid);
                } else if (profile.signalHireData?.uid) {
                    // SignalHire profile with nested uid
                    console.log('✅ Using profile.signalHireData.uid:', profile.signalHireData.uid);
                    profileIds.push(profile.signalHireData.uid);
                } else if (profile.linkedinUrl && profile.linkedinUrl.trim() !== '') {
                    // LinkedIn profile - use LinkedIn URL
                    console.log('🔗 Using LinkedIn URL:', profile.linkedinUrl);
                    linkedinUrls.push(profile.linkedinUrl);

                    // Add profile data for LinkedIn profiles
                    const nameParts = profile.name.trim().split(' ');
                    const firstname = nameParts[0] || '';
                    const lastname = nameParts.slice(1).join(' ') || '';

                    profileData.push({
                        linkedinUrl: profile.linkedinUrl,
                        firstname: firstname,
                        lastname: lastname,
                        domainOrCompany: profile.company || ''
                    });
                } else {
                    // Fallback: if no uid and no LinkedIn URL, treat as potential SignalHire with _id
                    console.log('⚠️ Fallback: using profile._id:', profile._id);
                    profileIds.push(profile._id);
                }
            });

            console.log('📦 Final payload components:', {
                profileIds,
                linkedinUrls,
                profileData
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

            console.log('Starting batch email extraction with payload:', payload);

            // Use the streaming method
            const cleanup = await authService.getEmailsStream(
                payload,
                // onStreamData callback
                (data) => {
                    console.log('Batch email stream data received:', data);

                    switch (data.type) {
                        case 'status':
                            setStreamingProgress(prev => ({
                                ...prev,
                                total: data.total || prev?.total || totalProfiles,
                                completed: data.completed || prev?.completed || 0,
                                message: data.message || 'Processing...'
                            }));
                            break;

                        case 'result':
                            // Handle individual result
                            if (data.status === 'success' && data.emails && data.emails.length > 0) {
                                const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');

                                // Find profile by identifier, LinkedIn URL or profile ID
                                let profileToUpdate = null;

                                // For UID profiles, prioritize matching by UID first
                                if (data.profileId) {
                                    // SignalHire profile - match by uid first
                                    profileToUpdate = profiles.find(p =>
                                        p.uid === data.profileId ||
                                        p._id === data.profileId ||
                                        (p as any).signalHireData?.uid === data.profileId
                                    );
                                } else if (data.identifier) {
                                    // Check if identifier is a UID (32-char string without linkedin.com)
                                    if (data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                        // This is likely a UID - find by SignalHire UID first
                                        profileToUpdate = profiles.find(p =>
                                            p.uid === data.identifier ||
                                            p._id === data.identifier ||
                                            (p as any).signalHireData?.uid === data.identifier
                                        );
                                    }

                                    // If not found by UID, try LinkedIn URL matching
                                    if (!profileToUpdate) {
                                        const normalizedIdentifier = normalizeLinkedInUrl(data.identifier);
                                        profileToUpdate = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedIdentifier);
                                    }
                                } else if (data.linkedinUrl) {
                                    // Match by LinkedIn URL with normalization
                                    const normalizedLinkedInUrl = normalizeLinkedInUrl(data.linkedinUrl);
                                    profileToUpdate = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedLinkedInUrl);
                                }

                                if (profileToUpdate) {
                                    console.log('✅ Found profile to update:', profileToUpdate.name, 'with emails:', emails);
                                    setProfiles(prevProfiles =>
                                        prevProfiles.map(p =>
                                            p._id === profileToUpdate._id ? { ...p, email: emails, emailAddress: emails } : p
                                        )
                                    );

                                    // Update in database
                                    authService.updateProfile(profileToUpdate._id, {
                                        name: profileToUpdate.name,
                                        location: profileToUpdate.location,
                                        title: profileToUpdate.title,
                                        company: profileToUpdate.company,
                                        email: emails
                                    }).catch(err => {
                                        console.error('Failed to update profile in batch email fetch:', err);
                                    });
                                } else {
                                    console.warn('❌ No profile found for email result:', {
                                        identifier: data.identifier,
                                        linkedinUrl: data.linkedinUrl,
                                        profileId: data.profileId,
                                        emails: emails
                                    });
                                }
                            } else if (data.status === 'no_contacts' || data.noEmailsFound === true) {
                                // Handle case when no emails are found
                                let profileToUpdate = null;

                                // For UID profiles, prioritize matching by UID first
                                if (data.profileId) {
                                    // SignalHire profile - match by uid first
                                    profileToUpdate = profiles.find(p =>
                                        p.uid === data.profileId ||
                                        p._id === data.profileId ||
                                        (p as any).signalHireData?.uid === data.profileId
                                    );
                                } else if (data.identifier) {
                                    // Check if identifier is a UID (32-char string without linkedin.com)
                                    if (data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                        // This is likely a UID - find by SignalHire UID first
                                        profileToUpdate = profiles.find(p =>
                                            p.uid === data.identifier ||
                                            p._id === data.identifier ||
                                            (p as any).signalHireData?.uid === data.identifier
                                        );
                                    }

                                    // If not found by UID, try LinkedIn URL matching
                                    if (!profileToUpdate) {
                                        const normalizedIdentifier = normalizeLinkedInUrl(data.identifier);
                                        profileToUpdate = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedIdentifier);
                                    }
                                } else if (data.linkedinUrl) {
                                    // Match by LinkedIn URL with normalization
                                    const normalizedLinkedInUrl = normalizeLinkedInUrl(data.linkedinUrl);
                                    profileToUpdate = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedLinkedInUrl);
                                }

                                if (profileToUpdate) {
                                    console.log('✅ Found profile to update (no emails):', profileToUpdate.name);
                                    setProfiles(prevProfiles =>
                                        prevProfiles.map(p =>
                                            p._id === profileToUpdate._id ? { ...p, email: 'No emails found', emailAddress: 'No emails found' } : p
                                        )
                                    );

                                    // Update in database with no emails status
                                    authService.updateProfile(profileToUpdate._id, {
                                        name: profileToUpdate.name,
                                        location: profileToUpdate.location,
                                        title: profileToUpdate.title,
                                        company: profileToUpdate.company,
                                        email: 'No emails found'
                                    }).catch(err => {
                                        console.error('Failed to update profile in batch email fetch:', err);
                                    });
                                } else {
                                    console.warn('❌ No profile found for no-emails result:', {
                                        identifier: data.identifier,
                                        linkedinUrl: data.linkedinUrl,
                                        profileId: data.profileId
                                    });
                                }
                            }

                            // Remove from loading state using improved profile finding
                            let profileForLoadingRemoval = null;

                            // For UID profiles, prioritize matching by UID first
                            if (data.profileId) {
                                // SignalHire profile - match by uid first
                                profileForLoadingRemoval = profiles.find(p =>
                                    p.uid === data.profileId ||
                                    p._id === data.profileId ||
                                    (p as any).signalHireData?.uid === data.profileId
                                );
                            } else if (data.identifier) {
                                // Check if identifier is a UID (32-char string without linkedin.com)
                                if (data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                    // This is likely a UID - find by SignalHire UID first
                                    profileForLoadingRemoval = profiles.find(p =>
                                        p.uid === data.identifier ||
                                        p._id === data.identifier ||
                                        (p as any).signalHireData?.uid === data.identifier
                                    );
                                }

                                // If not found by UID, try LinkedIn URL matching
                                if (!profileForLoadingRemoval) {
                                    const normalizedIdentifier = normalizeLinkedInUrl(data.identifier);
                                    profileForLoadingRemoval = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedIdentifier);
                                }
                            } else if (data.linkedinUrl) {
                                // Match by LinkedIn URL with normalization
                                const normalizedLinkedInUrl = normalizeLinkedInUrl(data.linkedinUrl);
                                profileForLoadingRemoval = profiles.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedLinkedInUrl);
                            }

                            if (profileForLoadingRemoval) {
                                setTimeout(() => {
                                    setLoadingEmails(prev => prev.filter(id => id !== profileForLoadingRemoval._id));
                                }, 300);
                            }
                            break;

                        case 'complete':
                            setStreamingProgress(prev => ({
                                ...prev,
                                message: 'Email extraction complete!'
                            }));
                            toast.success(`Email extraction completed! Processed ${selectedLeads.length} profiles.`);

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
                    setLoadingEmails([]); // Clear all loading states on completion
                }
            );

        } catch (error: any) {
            console.error("Error in batch email extraction:", error);
            toast.error(`Error extracting emails: ${error.message || error}`);
            setLoadingBatchEmails(false);
            setLoadingEmails([]);
            setStreamingProgress(null);
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

    // Column reorder functionality
    type ProjectColumnKey = 'name' | 'title' | 'company' | 'location' | 'relevanceScore' | 'analysis' | 'email' | 'linkedin' | `custom_${string}`;
    const projectDefaultColumnOrder: ProjectColumnKey[] = ['name', 'title', 'company', 'location', 'relevanceScore', 'analysis', 'email', 'linkedin'];

    const [projectColumnOrder, setProjectColumnOrder] = useState<ProjectColumnKey[]>(() => {
        try {
            const saved = localStorage.getItem('ProjectColumnOrder');
            if (saved) {
                const parsed: ProjectColumnKey[] = JSON.parse(saved);
                // Ensure all default columns are present; keep any saved custom_* columns
                const withDefaults = [...parsed];
                for (const k of projectDefaultColumnOrder) {
                    if (!withDefaults.includes(k)) {
                        withDefaults.push(k);
                    }
                }
                return withDefaults;
            }
        } catch { }
        return projectDefaultColumnOrder;
    });

    const draggingProjectColRef = useRef<ProjectColumnKey | null>(null);

    const handleProjectHeaderDragStart = (e: React.DragEvent, key: ProjectColumnKey) => {
        draggingProjectColRef.current = key;
        // Create a drag image so it looks like the header follows the cursor
        const label = projectColumnLabels[key]?.label ?? (projectCustomColumns.find(c => c.key === key)?.label || String(key));
        const ghost = document.createElement('div');
        ghost.textContent = label;
        ghost.style.position = 'fixed';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.padding = '6px 10px';
        ghost.style.borderRadius = '6px';
        ghost.style.fontSize = '12px';
        ghost.style.fontWeight = '600';
        ghost.style.background = 'rgba(0,0,0,0.85)';
        ghost.style.color = '#fff';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 10, 10);
        // Clean up after a tick
        setTimeout(() => {
            try {
                document.body.removeChild(ghost);
            } catch { }
        }, 0);
    };

    const handleProjectHeaderDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleProjectHeaderDrop = (targetKey: ProjectColumnKey) => {
        const sourceKey = draggingProjectColRef.current;
        if (!sourceKey || sourceKey === targetKey) return;
        const current = [...projectColumnOrder];
        const from = current.indexOf(sourceKey);
        const to = current.indexOf(targetKey);
        if (from === -1 || to === -1) return;
        current.splice(to, 0, current.splice(from, 1)[0]);
        setProjectColumnOrder(current);
        try {
            localStorage.setItem('ProjectColumnOrder', JSON.stringify(current));
        } catch { }
    };

    const projectColumnLabels: Record<ProjectColumnKey, { label: string; sortable?: SortField }> = {
        name: { label: 'Name', sortable: 'name' },
        title: { label: 'Title', sortable: 'title' },
        company: { label: 'Company', sortable: 'company' },
        location: { label: 'Location', sortable: 'location' },
        relevanceScore: { label: 'Score', sortable: 'relevanceScore' },
        analysis: { label: 'Deep Analysis' },
        email: { label: 'Email' },
        linkedin: { label: 'LinkedIn URL' },
    };

    const getProjectHeaderMeta = (key: ProjectColumnKey) => {
        const meta = {
            name: { label: 'Name', minWidth: 'min-w-[150px]', sortable: 'name' as SortField },
            title: { label: 'Title', minWidth: 'min-w-[180px]', sortable: 'title' as SortField },
            company: { label: 'Company', minWidth: 'min-w-[150px]', sortable: 'company' as SortField },
            location: { label: 'Location', minWidth: 'min-w-[120px]', sortable: 'location' as SortField },
            relevanceScore: { label: 'Score', minWidth: 'w-20', sortable: 'relevanceScore' as SortField },
            analysis: { label: 'Deep Analysis', minWidth: 'min-w-[160px]', sortable: null },
            email: { label: 'Email', minWidth: 'min-w-[200px]', sortable: null },
            linkedin: { label: 'LinkedIn URL', minWidth: 'min-w-[250px]', sortable: null },
        };

        // Check if it's a custom column
        if (String(key).startsWith('custom_')) {
            const customCol = projectCustomColumns.find(c => c.key === key);
            return {
                label: customCol?.label || key,
                minWidth: 'min-w-[150px]',
                sortable: null
            };
        }

        const columnMeta = meta[key];
        if (columnMeta) {
            return columnMeta;
        }

        // Fallback for unknown columns
        return { label: String(key), minWidth: 'min-w-[100px]', sortable: null };
    };

    type CustomColumnType = 'text' | 'file';
    interface CustomColumnDef { key: ProjectColumnKey; label: string; type: CustomColumnType }

    const [projectCustomColumns, setProjectCustomColumns] = useState<CustomColumnDef[]>(() => {
        try {
            const raw = localStorage.getItem('ProjectCustomColumns');
            if (raw) return JSON.parse(raw);
        } catch { }
        return [];
    });

    const [customDataByProfile, setCustomDataByProfile] = useState<Record<string, Record<string, any>>>(() => {
        try {
            const raw = localStorage.getItem('ProjectCustomColumnData');
            if (raw) return JSON.parse(raw);
        } catch { }
        return {};
    });

    useEffect(() => {
        try { localStorage.setItem('ProjectCustomColumns', JSON.stringify(projectCustomColumns)); } catch { }
    }, [projectCustomColumns]);

    useEffect(() => {
        try { localStorage.setItem('ProjectCustomColumnData', JSON.stringify(customDataByProfile)); } catch { }
    }, [customDataByProfile]);

    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [newColumnType, setNewColumnType] = useState<CustomColumnType>('text');

    // New state for Save to Project modal
    const [isSaveToProjectModalOpen, setIsSaveToProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [leadToSave, setLeadToSave] = useState<ProjectLead | ProjectLead[] | null>(null);

    // New state for available projects and selection
    const [availableProjects, setAvailableProjects] = useState<{ _id: string; name: string }[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // Add to Campaign modal state
    const [isAddToCampaignModalOpen, setIsAddToCampaignModalOpen] = useState(false);
    const [availableCampaigns, setAvailableCampaigns] = useState<{ _id: string; name: string; status: string }[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [addingToCampaign, setAddingToCampaign] = useState(false);

    const handleAddCustomColumn = () => {
        const trimmed = newColumnName.trim();
        if (!trimmed) return;
        const key = (`custom_${Date.now()}`) as ProjectColumnKey;
        const def: CustomColumnDef = { key, label: trimmed, type: newColumnType };
        setProjectCustomColumns(prev => [...prev, def]);
        const nextOrder: ProjectColumnKey[] = [...projectColumnOrder, key];
        setProjectColumnOrder(nextOrder);
        try { localStorage.setItem('ProjectColumnOrder', JSON.stringify(nextOrder)); } catch { }
        setIsAddColumnOpen(false);
        setNewColumnName('');
        setNewColumnType('text');
    };

    const renderProjectDynamicCell = (key: ProjectColumnKey, profile: any) => {
        const cellKey = `${profile._id}-${key}`;
        if (String(key).startsWith('custom_')) {
            const def = projectCustomColumns.find(c => c.key === key);
            if (!def) return null;
            const value = customDataByProfile[profile._id]?.[key] ?? null;
            if (def.type === 'text') {
                return (
                    <TableCell key={cellKey} className={`py-2 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <Input
                            value={value || ''}
                            placeholder={def.label}
                            className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}`}
                            onChange={(e) => {
                                setCustomDataByProfile(prev => {
                                    const copy = { ...prev };
                                    const byKey = { ...(copy[profile._id] || {}) };
                                    byKey[key] = e.target.value;
                                    copy[profile._id] = byKey;
                                    return copy;
                                });
                            }}
                        />
                    </TableCell>
                );
            } else {
                // file: show a styled "Add File" button that opens file picker, plus a View link if set
                return (
                    <TableCell key={cellKey} className={`py-2 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className="flex items-center gap-2">
                            <input id={`${profile._id}-${key}-file`} type="file" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const dataUrl = String(reader.result || '');
                                    setCustomDataByProfile(prev => {
                                        const copy = { ...prev };
                                        const byKey = { ...(copy[profile._id] || {}) };
                                        byKey[key] = { name: file.name, dataUrl };
                                        copy[profile._id] = byKey;
                                        return copy;
                                    });
                                };
                                reader.readAsDataURL(file);
                            }} />
                            {value?.dataUrl ? (
                                <a
                                    href={value.dataUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={value.name || `${def.label}.file`}
                                    className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-xs underline truncate max-w-[160px]`}
                                    title={value.name}
                                >
                                    {value.name}
                                </a>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                                    onClick={() => document.getElementById(`${profile._id}-${key}-file`)?.click()}
                                >
                                    Add File
                                </Button>
                            )}
                        </div>
                    </TableCell>
                );
            }
        }
        switch (key) {
            case 'name':
                return (
                    <TableCell key={cellKey} className={`font-medium py-4 border-r ${isDarkMode ? 'text-gray-200 border-gray-700' : 'border-gray-300'}`}>
                        {profile.name}
                    </TableCell>
                );
            case 'title':
                return (
                    <TableCell key={cellKey} className={`py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {profile.title}
                    </TableCell>
                );
            case 'company':
                return (
                    <TableCell key={cellKey} className={`py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {profile.company}
                    </TableCell>
                );
            case 'location':
                return (
                    <TableCell key={cellKey} className={`py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {profile.location}
                    </TableCell>
                );
            case 'relevanceScore':
                return (
                    <TableCell key={cellKey} className={`py-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => {
                                setSelectedLead(profile);
                                setIsAnalysisModalOpen(true);
                            }}
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'} mx-auto`}>
                                <span className="font-medium text-sm">
                                    {profile.relevanceScore || "N/A"}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                );
            case 'analysis':
                return (
                    <TableCell key={cellKey} className={`py-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className="flex flex-col items-center justify-center gap-1">
                            {/* Check if this profile is currently being analyzed */}
                            {analyzingProfiles.has(profile._id) ? (
                                <Button
                                    variant="outline"
                                    className={`text-xs h-8 px-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : ''}`}
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
                                                    enrichedData: profile.analysis.enrichedData || profile.signalhireData || (profile as any).signalHireData
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
                );
            case 'email':
                return (
                    <TableCell key={cellKey} className={`py-4 ${isDarkMode ? 'text-gray-300' : ''} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
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
                );
            case 'linkedin':
                return (
                    <TableCell key={cellKey} className={`py-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {loadingLinkedInUrls.includes(profile._id) ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : profile.linkedinUrl && profile.linkedinUrl.trim() !== '' ? (
                            <a
                                href={profile.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`hover:underline flex items-center gap-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-sm truncate max-w-[200px]`}
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
                );
            default:
                return null;
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
            // Extract profile IDs from selected leads - use SignalHire uid if available
            const profileIds: string[] = [];

            selectedLeads.forEach(leadId => {
                const profile = profiles.find(p => p._id === leadId);
                if (!profile) return;

                console.log('🔍 Processing profile for LinkedIn URL extraction:', {
                    name: profile.name,
                    _id: profile._id,
                    uid: profile.uid,
                    signalHireData: profile.signalHireData
                });

                // Check if this is a SignalHire profile (has uid) 
                if (profile.uid) {
                    // SignalHire profile - use uid
                    console.log('✅ Using profile.uid:', profile.uid);
                    profileIds.push(profile.uid);
                } else if (profile.signalHireData?.uid) {
                    // SignalHire profile with nested uid
                    console.log('✅ Using profile.signalHireData.uid:', profile.signalHireData.uid);
                    profileIds.push(profile.signalHireData.uid);
                } else {
                    // Fallback: use profile _id
                    console.log('⚠️ Fallback: using profile._id:', profile._id);
                    profileIds.push(profile._id);
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
                async (data) => {
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

                            // Find and update the corresponding profile
                            setProfiles(prevProfiles => {
                                let profileFound = false;
                                const updatedProfiles = prevProfiles.map(profile => {
                                    // Match by uid or _id
                                    const matchesProfile = profile.uid === profileId ||
                                        profile._id === profileId ||
                                        profile.signalHireData?.uid === profileId;

                                    if (matchesProfile && !profileFound) {
                                        profileFound = true;
                                        console.log(`Found matching profile: ${profile.name} (${profile._id})`);

                                        // Remove from loading state
                                        setLoadingLinkedInUrls(prev => prev.filter(id => id !== profile._id));

                                        if (status === 'success' && linkedinUrl) {
                                            console.log(`SUCCESS: Updated LinkedIn URL for ${profile.name}: ${linkedinUrl}`);
                                            toast.success(`LinkedIn URL found for ${profile.name}`);

                                            // Update the profile with the LinkedIn URL
                                            return { ...profile, linkedinUrl: linkedinUrl };
                                        } else if (status === 'no_linkedin_url_found') {
                                            console.log(`NO URL: No LinkedIn URL found for ${profile.name}`);
                                            toast.warning(`No LinkedIn URL found for ${profile.name}`);
                                            // Mark as no URL found
                                            return { ...profile, linkedinUrlStatus: 'no_url_found' };
                                        } else if (status === 'failed') {
                                            console.log(`FAILED: Failed to get LinkedIn URL for ${profile.name}: ${error}`);
                                            toast.error(`Failed to get LinkedIn URL for ${profile.name}: ${error || 'Unknown error'}`);
                                            // Mark as failed
                                            return { ...profile, linkedinUrlStatus: 'failed' };
                                        }
                                    }
                                    return profile;
                                });

                                // Only return new array if we found and updated a profile
                                return profileFound ? [...updatedProfiles] : prevProfiles;
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

                            // Auto-close progress after a delay
                            setTimeout(() => {
                                setLinkedInUrlProgress(null);
                            }, 2000);
                            break;

                        case 'error':
                            console.error('LinkedIn URL stream error:', data);
                            toast.error(`Stream error: ${data.message || 'Unknown error'}`);
                            setLoadingBatchLinkedInUrls(false);
                            setLinkedInUrlProgress(null);
                            setLoadingLinkedInUrls([]);
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
            setStreamCleanup(() => cleanup);

        } catch (error: any) {
            console.error('Failed to start streaming LinkedIn URL extraction:', error);
            toast.error('Failed to start LinkedIn URL extraction');
            setLoadingBatchLinkedInUrls(false);
            setLinkedInUrlProgress(null);
            setLoadingLinkedInUrls([]); // Clear all loading states on error
        }
    };

    // Function to handle deleting selected profiles
    const handleDeleteSelected = async () => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one profile to delete.");
            return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete ${selectedLeads.length} selected profile${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            // Store the profiles to delete for rollback if needed
            const profilesToDelete = selectedLeads;
            const originalProfiles = [...profiles];

            // Remove selected profiles from the UI immediately for better UX
            setProfiles(prevProfiles =>
                prevProfiles.filter(profile => !profilesToDelete.includes(profile._id))
            );

            // Clear selection
            setSelectedLeads([]);
            setSelectAll(false);

            // Call the bulk delete API
            const response = await authService.deleteProfiles(profilesToDelete);

            if (response) {
                toast.success(`Successfully deleted ${profilesToDelete.length} profile${profilesToDelete.length > 1 ? 's' : ''}`);
            } else {
                // Rollback UI changes if deletion failed
                setProfiles(originalProfiles);
                setSelectedLeads(profilesToDelete);

                toast.error(`Failed to delete profiles: ${response?.message || 'Unknown error'}`);
            }

        } catch (error: any) {
            console.error('Error deleting profiles:', error);
            toast.error(`Failed to delete profiles: ${error.message || 'Unknown error'}`);

            // Reload profiles to restore the UI state if deletion failed
            try {
                const response = await authService.getSavedProfilesForProjects(currentProjectId);
                if (response && Array.isArray(response)) {
                    setProfiles(response);
                }
            } catch (reloadError) {
                console.error('Failed to reload profiles:', reloadError);
            }
        }
    };

    // Function to handle saving selected profiles to a project
    const handleSaveToProject = () => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one profile to save.");
            return;
        }

        // Get the selected profile objects
        const selectedProfiles = profiles.filter(profile => selectedLeads.includes(profile._id));
        setLeadToSave(selectedProfiles);
        setProjectName('');
        setSelectedProjectId('');
        setIsCreatingNewProject(false);
        setIsSaveToProjectModalOpen(true);
    };

    // Function to handle saving profiles to a project
    const handleSaveProfile = async (leads: ProjectLead | ProjectLead[], projectId?: string) => {
        const leadsArray = Array.isArray(leads) ? leads : [leads];

        if (!projectId) {
            toast.error("Please select a project.");
            return;
        }

        try {
            const payload = leadsArray.map(lead => {
                const deepAnalysisResult = deepAnalysisResultsMap[lead._id];
                const uid = lead.signalHireData?.uid || null;

                return {
                    projectId,
                    name: lead.name,
                    title: lead.title,
                    company: lead.company,
                    location: lead.location,
                    linkedinUrl: lead.linkedinUrl,
                    email: lead.emailAddress,
                    relevanceScore: lead.relevanceScore?.toString() || '',
                    uid: uid, // Add uid for SignalHire profiles
                    signalHireData: lead.signalHireData || null, // Include full signalHireData
                    matchedCategories: lead.matchedCategoriesValue?.details || {},
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
                toast.success(`Profiles saved successfully to project!`);
            } else if (response.message) {
                toast.success(response.message);
            } else {
                toast.error(`Failed to save profiles: ${response.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error("Error saving profiles:", error);
            toast.error(`Failed to save profiles: ${error.message || 'Unknown error'}`);
        }
    };

    // Function to handle exporting selected profiles
    const handleExportSelected = () => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one profile to export");
            return;
        }

        // Export selected profiles as CSV
        const profilesToExport = profiles.filter(profile => selectedLeads.includes(profile._id));

        if (profilesToExport.length === 0) {
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
            "LinkedIn URL",
            "Relevance Score",
            "Analysis Score",
            "Analysis Description"
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
        const rows = profilesToExport.map(profile => {
            return [
                escapeCSV(profile.name),
                escapeCSV(profile.title),
                escapeCSV(profile.company),
                escapeCSV(profile.location),
                escapeCSV(profile.emailAddress || profile.email),
                escapeCSV(profile.linkedinUrl),
                escapeCSV(profile.relevanceScore),
                escapeCSV(profile.analysisScore),
                escapeCSV(profile.analysisDescription)
            ].join(",");
        });

        // Combine headers and rows
        const csvContent = [headers.join(","), ...rows].join("\n");

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `selected_project_profiles_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${profilesToExport.length} profiles to CSV`);
    };

    // Function to handle adding selected profiles to campaign
    const handleAddToCampaign = () => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one profile to add to campaign.");
            return;
        }
        setSelectedCampaignId('');
        setIsAddToCampaignModalOpen(true);
    };

    // Function to execute adding profiles to selected campaign
    const handleAddToCampaignSubmit = async () => {
        if (!selectedCampaignId) {
            toast.error("Please select a campaign.");
            return;
        }

        setAddingToCampaign(true);

        try {
            // Get the selected profile objects
            const selectedProfiles = profiles.filter(profile => selectedLeads.includes(profile._id));

            // Transform profiles to match the API expected format
            const prospects = selectedProfiles.map(profile => ({
                name: profile.name,
                email: profile.email || profile.emailAddress || '',
                linkedin: profile.linkedinUrl || '',
                company: profile.company || '',
                position: profile.title || '',
                phone: profile.phone || ''
            }));

            const response = await authService.addProspectsToCampaign(selectedCampaignId, prospects);

            if (response.success) {
                toast.success(`Successfully added ${response.data.prospectsAdded} prospects to the campaign!`);

                // Clear selection and close modal
                setSelectedLeads([]);
                setSelectAll(false);
                setIsAddToCampaignModalOpen(false);
                setSelectedCampaignId('');
            } else {
                throw new Error(response.message || 'Failed to add prospects to campaign');
            }
        } catch (error: any) {
            console.error('Error adding prospects to campaign:', error);
            toast.error(`Failed to add prospects to campaign: ${error.message || 'Unknown error'}`);
        } finally {
            setAddingToCampaign(false);
        }
    };

    const handleAnalyzeClick = (lead: ProjectLead) => {
        setDeepAnalysisSelectedLeadId(lead._id);
        setDeepAnalysisSelectedLead(lead);
        setDeepAnalysisSelectedLeadIds([]); // Clear batch selection
        setIsAnalysisCriteriaModalOpen(true);
    };

    // Function to handle Get Email button click using streaming API
    const handleGetEmailClick = async (lead: ProjectLead) => {
        setLoadingEmails(prev => [...prev, lead._id]);

        try {
            // Build profile data for the lead
            const nameParts = lead.name.trim().split(' ');
            const firstname = nameParts[0] || '';
            const lastname = nameParts.slice(1).join(' ') || '';

            let profileData: any[] = [];
            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];

            // Check if this is a SignalHire profile (has uid) or LinkedIn profile
            if (lead.uid) {
                // SignalHire profile - use uid
                profileIds.push(lead.uid);
            } else if (lead.linkedinUrl && lead.linkedinUrl.trim() !== '') {
                // LinkedIn profile - use LinkedIn URL
                linkedinUrls.push(lead.linkedinUrl);
                profileData.push({
                    linkedinUrl: lead.linkedinUrl,
                    firstname: firstname,
                    lastname: lastname,
                    domainOrCompany: lead.company || ''
                });
            } else {
                // Fallback: if no uid and no LinkedIn URL, treat as potential SignalHire with _id
                profileIds.push(lead._id);
            }

            const payload = {
                linkedinUrls: linkedinUrls,
                profileIds: profileIds,
                profileData: profileData
            };

            console.log('Starting single email extraction for:', lead.name, payload);

            // Use the streaming method
            const cleanup = await authService.getEmailsStream(
                payload,
                // onStreamData callback
                (data) => {
                    console.log('Single email stream data received:', data);

                    switch (data.type) {
                        case 'result':
                            // Remove loading state when we get a result (with a small delay to make loader visible)
                            setTimeout(() => {
                                setLoadingEmails(prev => prev.filter(id => id !== lead._id));
                            }, 300);

                            // Handle the result for this specific profile
                            if (data.status === 'success' && data.emails && data.emails.length > 0) {
                                // Extract email addresses from the emails array
                                const emails = data.emails.map((email: any) => email.value || email.email).filter((email: string) => email).join(', ');

                                // Update both email and emailAddress fields in profiles state for compatibility
                                setProfiles(prevProfiles =>
                                    prevProfiles.map(p =>
                                        p._id === lead._id ? { ...p, email: emails, emailAddress: emails } : p
                                    )
                                );

                                // Update in database
                                authService.updateProfile(lead._id, {
                                    name: lead.name,
                                    location: lead.location,
                                    title: lead.title,
                                    company: lead.company,
                                    email: emails
                                }).catch(err => {
                                    console.error('Failed to update profile:', err);
                                });

                                // Removed individual success toast - emails will be visible in table
                            } else if (data.status === 'no_contacts' || data.noEmailsFound === true) {
                                // Handle case when no emails are found
                                setProfiles(prevProfiles =>
                                    prevProfiles.map(p =>
                                        p._id === lead._id ? { ...p, email: 'No emails found', emailAddress: 'No emails found' } : p
                                    )
                                );

                                // Update in database with no emails status
                                authService.updateProfile(lead._id, {
                                    name: lead.name,
                                    location: lead.location,
                                    title: lead.title,
                                    company: lead.company,
                                    email: 'No emails found'
                                }).catch(err => {
                                    console.error('Failed to update profile:', err);
                                });
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
                            // Remove loading state when stream completes (with a small delay)
                            setTimeout(() => {
                                setLoadingEmails(prev => prev.filter(id => id !== lead._id));
                            }, 300);
                            break;

                        case 'error':
                            // Remove loading state on error (with a small delay)
                            setTimeout(() => {
                                setLoadingEmails(prev => prev.filter(id => id !== lead._id));
                            }, 300);
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
                    setLoadingEmails(prev => prev.filter(id => id !== lead._id));
                    toast.error(`Error fetching emails: ${error.message || 'Unknown error'}`);
                },
                // onComplete callback
                () => {
                    console.log('Single email stream completed');
                    // Remove loading state when stream completes (if not already removed)
                    setLoadingEmails(prev => prev.filter(id => id !== lead._id));
                }
            );

        } catch (error: any) {
            console.error('Error in handleGetEmailClick:', error);
            toast.error(`Error getting email: ${error.message || error}`);
            // Clear loading state on error
            setLoadingEmails(prev => prev.filter(id => id !== lead._id));
        }
    };

    const handleGetLinkedInUrlClick = async (lead: ProjectLead) => {
        setLoadingLinkedInUrls(prev => [...prev, lead._id]);
        try {
            const token = await authService.getToken();
            // Use uid if available (for SignalHire profiles), otherwise use _id
            const profileIdToSend = lead.uid || lead._id;

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

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();
            console.log('LinkedIn URL API response:', data); // Add debugging

            if (data.success && data.results && data.results.length > 0) {
                // For single profile requests, use the first result
                // For batch requests, find by profileId match
                let profileResult;

                if (data.results.length === 1) {
                    // Single profile request - use the only result
                    profileResult = data.results[0];
                    console.log('Using single result:', profileResult);
                } else {
                    // Multiple results - find by profileId match
                    profileResult = data.results.find((r: any) =>
                        r.profileId === profileIdToSend || r.profileId === lead.id || r.profileId === lead._id
                    );
                    console.log('Found matching result:', profileResult);
                }

                if (profileResult) {
                    console.log('Profile result status:', profileResult.status, 'LinkedIn URL:', profileResult.linkedinUrl);

                    if (profileResult.status === 'success' && profileResult.linkedinUrl) {
                        // Update the linkedinUrl field in profiles state
                        setProfiles(prevProfiles =>
                            prevProfiles.map(profile =>
                                profile._id === lead._id ? { ...profile, linkedinUrl: profileResult.linkedinUrl } : profile
                            )
                        );
                        toast.success(`LinkedIn URL found for ${lead.name}: ${profileResult.linkedinUrl}`);
                    } else if (profileResult.status === 'no_linkedin_url_found') {
                        // Update the lead with no_url_found status
                        setProfiles(prevProfiles =>
                            prevProfiles.map(profile =>
                                profile._id === lead._id ? { ...profile, linkedinUrlStatus: 'no_url_found' } : profile
                            )
                        );
                        toast.warning(`No LinkedIn URL found for ${lead.name}`);
                    } else if (profileResult.status === 'failed') {
                        // Handle failed status with specific error message and update status
                        const errorMessage = profileResult.error || 'Failed to fetch profile data';
                        setProfiles(prevProfiles =>
                            prevProfiles.map(profile =>
                                profile._id === lead._id ? { ...profile, linkedinUrlStatus: 'failed' } : profile
                            )
                        );
                        toast.error(`Failed to get LinkedIn URL for ${lead.name}: ${errorMessage}`);
                    } else {
                        console.log('Unknown status:', profileResult.status);
                        // Update with failed status for unknown errors
                        setProfiles(prevProfiles =>
                            prevProfiles.map(profile =>
                                profile._id === lead._id ? { ...profile, linkedinUrlStatus: 'failed' } : profile
                            )
                        );
                        toast.error(`Failed to get LinkedIn URL for ${lead.name}: Unknown status ${profileResult.status}`);
                    }
                } else {
                    console.log('No matching profile result found. Sent ID:', profileIdToSend, 'Lead ID:', lead._id);
                    console.log('Available results:', data.results);
                    toast.error(`No result found for ${lead.name}`);
                }
            } else {
                console.log('API response issue:', data);
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
    // Function to normalize LinkedIn URLs for comparison
    const normalizeLinkedInUrl = (url: string): string => {
        if (!url) return '';
        return url.toLowerCase()
            .replace(/\/$/, '') // Remove trailing slash
            .replace(/\?.*$/, '') // Remove query parameters
            .replace(/#.*$/, '') // Remove fragments
            .replace(/\/en$/, '') // Remove /en suffix
            .trim();
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
                        // Prefer SignalHire UID when available
                        const uidCandidate = profile.uid
                            || (profile as any).signalHireData?.uid
                            || (profile as any).analysis?.profileId
                            || (profile as any).analysis?.enrichedData?.uid
                            || deepAnalysisResultsMap[profile._id]?.profileId;
                        if (uidCandidate) {
                            profileIds.push(uidCandidate);
                        } else if (profile.linkedinUrl) {
                            // Use raw LinkedIn URL (do not normalize for payload)
                            linkedinUrls.push(profile.linkedinUrl.trim());
                        } else if (!profile.linkedinUrl && profile._id && profile._id.length === 32) {
                            // Fallback: likely a SignalHire profile with UID as _id
                            profileIds.push(profile._id);
                        }
                    }
                });
            } else if (deepAnalysisSelectedLeadId) {
                const profile = profiles.find(p => p._id === deepAnalysisSelectedLeadId);
                if (profile) {
                    // Prefer SignalHire UID when available
                    const uidCandidate = profile.uid
                        || (profile as any).signalHireData?.uid
                        || (profile as any).analysis?.profileId
                        || (profile as any).analysis?.enrichedData?.uid
                        || deepAnalysisResultsMap[profile._id]?.profileId;
                    if (uidCandidate) {
                        profileIds.push(uidCandidate);
                    } else if (profile.linkedinUrl) {
                        // Use raw LinkedIn URL (do not normalize for payload)
                        linkedinUrls.push(profile.linkedinUrl.trim());
                    } else if (!profile.linkedinUrl && profile._id && profile._id.length === 32) {
                        // Fallback: likely a SignalHire profile with UID as _id
                        profileIds.push(profile._id);
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

                            // Handle individual result - need to find profile by either linkedinUrl or identifier/profileId
                            let profileId;
                            const identifier = data.identifier || data.linkedinUrl || data.profileId;

                            console.log('🔍 Looking for profile with identifier:', identifier);
                            console.log('📋 Available profiles:', profiles.map(p => ({ _id: p._id, uid: p.uid, linkedinUrl: p.linkedinUrl })));

                            // Check if identifier is a UID (32-char string) or a LinkedIn URL
                            if (data.identifier && data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                // This is a UID - find by SignalHire UID
                                const foundProfile = profiles.find(profile =>
                                    profile.uid === data.identifier ||
                                    profile._id === data.identifier ||
                                    (profile as any).signalHireData?.uid === data.identifier
                                );
                                profileId = foundProfile?._id;
                                console.log('✅ Found profile by UID identifier:', profileId ? 'YES' : 'NO', profileId);
                                if (foundProfile) {
                                    console.log('📝 Matched UID profile:', {
                                        name: foundProfile.name,
                                        _id: foundProfile._id,
                                        uid: foundProfile.uid,
                                        identifier: data.identifier
                                    });
                                }
                            } else if (data.linkedinUrl || (data.identifier && data.identifier.includes('linkedin.com'))) {
                                // Find by LinkedIn URL
                                const urlToMatch = data.linkedinUrl || data.identifier;
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
                                // Find by SignalHire UID - check both uid and _id properties
                                const foundProfile = profiles.find(profile =>
                                    profile.uid === data.profileId ||
                                    profile._id === data.profileId ||
                                    (profile as any).signalHireData?.uid === data.profileId
                                );
                                profileId = foundProfile?._id;
                                console.log('✅ Found profile by UID:', profileId ? 'YES' : 'NO', profileId);
                                if (foundProfile) {
                                    console.log('📝 Matched UID profile:', {
                                        name: foundProfile.name,
                                        _id: foundProfile._id,
                                        uid: foundProfile.uid,
                                        profileId: data.profileId
                                    });
                                }
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
                                                await authService.updateProfile(profileId, {
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
                                                });
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
                            // Handle specific error responses from the API
                            if (data.details === "Not enough credits") {
                                toast.error("Not enough credits for deep analysis");
                            } else if (data.message && data.message.includes("Not enough credits")) {
                                toast.error("Not enough credits for deep analysis");
                            } else {
                                toast.error(`Analysis error: ${data.message}`);
                            }

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
                    console.log('Error object structure:', {
                        message: error.message,
                        details: error.details,
                        response: error.response,
                        error: error.error,
                        status: error.status
                    });

                    // Handle specific error responses from the API
                    if (error.response && error.response.details === "Not enough credits") {
                        console.log('✅ Detected "Not enough credits" via error.response.details');
                        toast.error("Not enough credits for deep analysis");
                    } else if (error.details === "Not enough credits") {
                        console.log('✅ Detected "Not enough credits" via error.details');
                        toast.error("Not enough credits for deep analysis");
                    } else if (error.message && error.message.includes("Not enough credits")) {
                        console.log('✅ Detected "Not enough credits" via error.message');
                        toast.error("Not enough credits for deep analysis");
                    } else {
                        console.log('❌ No credits error detected, using generic message');
                        toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
                    }

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

        } catch (error: any) {
            console.error('Failed to start streaming analysis:', error);
            console.log('Catch block - Error object structure:', {
                message: error.message,
                details: error.details,
                response: error.response,
                error: error.error,
                status: error.status
            });

            // Handle specific error responses from the API
            if (error.response && error.response.details === "Not enough credits") {
                console.log('✅ CATCH: Detected "Not enough credits" via error.response.details');
                toast.error("Not enough credits for deep analysis");
            } else if (error.details === "Not enough credits") {
                console.log('✅ CATCH: Detected "Not enough credits" via error.details');
                toast.error("Not enough credits for deep analysis");
            } else if (error.message && error.message.includes("Not enough credits")) {
                console.log('✅ CATCH: Detected "Not enough credits" via error.message');
                toast.error("Not enough credits for deep analysis");
            } else {
                console.log('❌ CATCH: No credits error detected, using generic message');
                toast.error('Failed to start analysis');
            }

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

    // Fetch user projects when modal opens
    useEffect(() => {
        if (isSaveToProjectModalOpen) {
            authService.getUserProjects()
                .then(response => {
                    console.log("projects", response)
                    if (response && Array.isArray(response)) {
                        setAvailableProjects(response);
                    } else if (response && Array.isArray(response)) {
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

    // Fetch available campaigns when modal opens
    useEffect(() => {
        if (isAddToCampaignModalOpen) {
            const fetchCampaigns = async () => {
                setLoadingCampaigns(true);
                try {
                    const campaigns = await authService.getCampaigns();
                    if (Array.isArray(campaigns)) {
                        setAvailableCampaigns(campaigns);
                    } else {
                        toast.error("Failed to load campaigns");
                    }
                } catch (error: any) {
                    console.error('Error fetching campaigns:', error);
                    toast.error("Failed to load campaigns");
                } finally {
                    setLoadingCampaigns(false);
                }
            };

            fetchCampaigns();
        }
    }, [isAddToCampaignModalOpen]);

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
            navigate("/");
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

        // Handle "No emails found" case with special styling
        if (profile.email === 'No emails found') {
            return <span className={`truncate max-w-[200px] italic ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No emails found</span>;
        }

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

    // Test function to debug loading state
    const testLoadingState = (profileId: string) => {
        console.log('Testing loading state for:', profileId);
        setLoadingEmails(prev => [...prev, profileId]);
        setTimeout(() => {
            setLoadingEmails(prev => prev.filter(id => id !== profileId));
        }, 3000);
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

            {/* Add Column Modal */}
            {isAddColumnOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`relative p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                        <button
                            aria-label="Close"
                            onClick={() => setIsAddColumnOpen(false)}
                            className={`absolute right-3 top-3 p-1 rounded hover:opacity-80 ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Add Column</h2>
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className={`text-sm mb-1 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Column name</label>
                                <Input value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className={`${isDarkMode ? 'bg-zinc-800 text-white border-zinc-700' : ''}`} />
                            </div>
                            <div>
                                <label className={`text-sm mb-1 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="colType" checked={newColumnType === 'text'} onChange={() => setNewColumnType('text')} />
                                        <span>Text (Notes)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="colType" checked={newColumnType === 'file'} onChange={() => setNewColumnType('file')} />
                                        <span>File (e.g. CV)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsAddColumnOpen(false)} className={isDarkMode ? 'border-zinc-600 text-zinc-300' : ''}>Cancel</Button>
                            <Button onClick={handleAddCustomColumn} className={isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save to Project Modal */}
            {isSaveToProjectModalOpen && leadToSave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
                        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
                            Save Profiles to Project
                        </h2>
                        <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
                            Select an existing project or create a new one to save {Array.isArray(leadToSave) ? leadToSave.length : 1} profile{Array.isArray(leadToSave) && leadToSave.length > 1 ? 's' : ''}.
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
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="New Project Name"
                                    className={`${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : ""} mb-4`}
                                    autoFocus
                                />
                                <Button
                                    onClick={async () => {
                                        if (!newProjectName.trim()) {
                                            toast.error("Please enter a project name.");
                                            return;
                                        }

                                        try {
                                            // Call API to create project
                                            const response = await authService.createProject({ name: newProjectName });
                                            if (response && response.data) {
                                                toast.success(`Project "${response.data.name}" created successfully.`);
                                                // Update available projects and select the new one
                                                setAvailableProjects(prev => [...prev, response.data]);
                                                setSelectedProjectId(response.data._id);
                                                setIsCreatingNewProject(false);
                                            } else {
                                                toast.error(`Failed to create project: ${response?.message || 'Unknown error'}`);
                                            }
                                        } catch (error: any) {
                                            toast.error(`Error creating project: ${error.message || 'Unknown error'}`);
                                        }
                                    }}
                                    className={`${isDarkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-600 text-white hover:bg-green-700"} mb-4`}
                                >
                                    Create Project
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
                                    setSelectedProjectId('');
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

            {/* Add to Campaign Modal */}
            {isAddToCampaignModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
                        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
                            Add to Campaign
                        </h2>
                        <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
                            Select a campaign to add {selectedLeads.length} selected profile{selectedLeads.length > 1 ? 's' : ''}.
                        </p>

                        {loadingCampaigns ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className={`block mb-1 font-medium ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                                    Select Campaign
                                </label>
                                <select
                                    className={`w-full p-2 border rounded ${isDarkMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-white border-gray-300"}`}
                                    value={selectedCampaignId}
                                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                                >
                                    <option value="" disabled>Choose a campaign</option>
                                    {availableCampaigns.map((campaign) => (
                                        <option key={campaign._id} value={campaign._id}>
                                            {campaign.name} ({campaign.status})
                                        </option>
                                    ))}
                                </select>
                                {availableCampaigns.length === 0 && !loadingCampaigns && (
                                    <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        No campaigns available. Create a campaign first.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddToCampaignModalOpen(false);
                                    setSelectedCampaignId('');
                                }}
                                disabled={addingToCampaign}
                                className={isDarkMode ? "border-zinc-600 text-zinc-300" : ""}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddToCampaignSubmit}
                                disabled={!selectedCampaignId || addingToCampaign || availableCampaigns.length === 0}
                                className={isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                            >
                                {addingToCampaign ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Adding...
                                    </div>
                                ) : (
                                    `Add to Campaign`
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <ExportDropdown
                        profiles={profiles}
                        selectedProfiles={selectedLeads}
                        fileName="project_profiles"
                    />

                    {selectedLeads.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={`flex items-center gap-1 text-xs h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}>
                                    Actions
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
                                <DropdownMenuItem onSelect={() => { handleBatchAnalyzeClick(); }}>
                                    Deep Analyze ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleDeleteSelected(); }}>
                                    Delete ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleBatchGetEmailsClick(); }}>
                                    Get Emails ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleBatchGetLinkedInUrlsClick(); }}>
                                    Get LinkedIn URLs ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleSaveToProject(); }}>
                                    Save to Project ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleAddToCampaign(); }}>
                                    Add to Campaign ({selectedLeads.length})
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { handleExportSelected(); }}>
                                    Export Selected ({selectedLeads.length})
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                    {projectColumnOrder.map((key) => {
                                        const meta = getProjectHeaderMeta(key);
                                        return (
                                            <TableHead
                                                key={key}
                                                draggable
                                                onDragStart={(e) => handleProjectHeaderDragStart(e, key)}
                                                onDragOver={handleProjectHeaderDragOver}
                                                onDrop={() => handleProjectHeaderDrop(key)}
                                                className={`py-1 font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-300'} ${meta.minWidth} ${meta.sortable ? 'cursor-pointer' : ''}`}
                                                onClick={() => meta.sortable && handleSort(meta.sortable!)}
                                                title="Drag to reorder"
                                            >
                                                {meta.label} {meta.sortable ? renderSortIcon(meta.sortable!) : null}
                                            </TableHead>
                                        );
                                    })}
                                    <TableHead className={`py-1 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`text-xs h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                                            onClick={() => setIsAddColumnOpen(true)}
                                        >
                                            Add Column
                                        </Button>
                                    </TableHead>
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

                                        {projectColumnOrder.map((key) =>
                                            renderProjectDynamicCell(key, profile)
                                        )}
                                        <TableCell className="py-4 text-right" />
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
