import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Play,
    Pause,
    MoreHorizontal,
    Users,
    Mail,
    Calendar,
    Target,
    Send,
    Eye,
    Edit,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Upload,
    FolderOpen,
    Download,
    X,
    Save,
    ArrowRight,
    GitBranch,
    Move,
    Settings,
    Paperclip,
    FileText,
    Hash,
    Image,
    Check,
    ExternalLink,
    Copy,
    CheckCircle,
    BrainCog,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Linkedin,
    Filter,
    RefreshCw,
    ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import { API_BASE_URL, linkedinApi, showApiResponseToast } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

// Type definitions for missing types
interface CreateCampaignData {
    name: string;
    description?: string;
    sequence?: any[];
    prospects?: any[];
}

interface APICampaign {
    _id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'draft' | 'completed';
    sequence?: any[];
    prospects?: any[];
    userId?: string;
    emailAccountId?: string;
    linkedinSettings?: {
        delaySettings?: {
            invitations?: {
                minDelay: number;
                maxDelay: number;
                unit: string;
            };
            messages?: {
                minDelay: number;
                maxDelay: number;
                unit: string;
            };
        };
        workingHours?: {
            enabled: boolean;
            start: number;
            end: number;
            timezone: string;
            weekendsEnabled: boolean;
        };
        safetyPreset?: string;
    };
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

// Extend API campaign with local stats for table rendering
type APICampaignWithStats = APICampaign & {
    stats: {
        totalProspects: number;
        emailsSent: number;
        openRate: number;
        replyRate: number;
        clickRate: number;
        linkedinInvitationsQueued?: number;
        linkedinInvitationsSent?: number;
        linkedinInvitationsSkipped?: number;
        linkedinMessagesSent?: number;
        linkedinProfilesVisited?: number;
    };
    createdAt: string;
    updatedAt: string;
};

// Mock API services - replace with actual implementation
const campaignAPI = {
    getAllCampaigns: async () => [],
    createCampaign: async (data: CreateCampaignData) => ({ _id: Date.now().toString(), ...data }),
    startCampaign: async (id: string) => ({ success: true }),
    pauseCampaign: async (id: string) => ({ success: true }),
    updateCampaign: async (id: string, data: any) => ({ success: true }),
    deleteCampaign: async (id: string) => ({ success: true }),
    bulkAction: async (action: string, ids: string[]) => ({ success: true })
};

const accountAPI = {
    getConnectedAccounts: async () => [],
    initiateGmailConnection: async () => ({ success: true }),
    initiateLinkedInConnection: async () => ({ success: true })
};
import { ProfileAnalysisModal } from '@/components/dashboard/ProfileAnalysisModal';
import { DeepAnalysisModal } from '@/components/dashboard/DeepAnalysisModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CampaignSettings from '@/components/CampaignSettings';

// SACORE AI font style
const sacoreFont = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    letterSpacing: "-0.02em"
};

interface Campaign {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'draft' | 'completed';
    prospects: number;
    sent: number;
    opened: number;
    replied: number;
    createdAt: string;
    lastActivity: string;
    openRate: number;
    replyRate: number;
    emailSequences?: any[];
    schedulingOption?: string;
    importedProspects?: any[];
}

interface EmailSequence {
    id: string;
    subject: string;
    content: string;
    delay: number;
    type: 'initial' | 'followup';
}

interface FlowNode {
    id: string;
    type: 'step' | 'condition';
    stepType?: 'email' | 'linkedin-message' | 'linkedin-invitation' | 'linkedin-visit' | 'manual-task' | 'linkedin-connection-check' | 'email-opened' | 'email-reply' | 'opened-linkedin-message' | 'linkedin-reply-check' | 'clicked-link' | 'has-linkedin' | 'has-email' | 'has-phone';
    conditionType?: string;
    title: string;
    description?: string;
    position: { x: number; y: number };
    connections: string[];
    branchConnections?: { yes: string[]; no: string[] };
    parentId?: string; // Which node this connects from
    parentBranch?: 'main' | 'yes' | 'no'; // Which branch of parent this connects to
    content?: {
        subject?: string;
        message?: string;
        taskDescription?: string;
        taskTitle?: string;
        priority?: 'low' | 'medium' | 'high';
        dueDays?: number;
        dueDate?: string;
        emailAddresses?: string[];
        linkedinAccount?: string;
        delay?: number;
        delayUnit?: 'minutes' | 'hours' | 'days';
        attachments?: Array<{
            id: string;
            name: string;
            size: number;
            type: string;
            url?: string;
            category?: 'image' | 'document';
        }>;
        variables?: string[];
    };
}

interface LinkedInAccount {
    id: string;
    name: string;
    profileUrl: string;
}

interface EmailAccount {
    id: string;
    email: string;
    name: string;
}

const CampaignsPage: React.FC = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    // Static campaign data for now
    const [campaigns, setCampaigns] = useState<APICampaignWithStats[]>([]);
    const [loading, setLoading] = useState(true); // Set to false for static data
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

    // Campaign detail view states
    const [selectedCampaign, setSelectedCampaign] = useState<APICampaignWithStats | null>(null);
    const [campaignDetailTab, setCampaignDetailTab] = useState<'overview' | 'sequence' | 'leads' | 'launch'>('overview');

    // Campaign settings modal states
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedCampaignForSettings, setSelectedCampaignForSettings] = useState<APICampaign | null>(null);
    const [campaignSettings, setCampaignSettings] = useState<any>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [timezones, setTimezones] = useState<any>(null);
    const [isTimezonesLoading, setIsTimezonesLoading] = useState(false);
    const [safetyPresets, setSafetyPresets] = useState<any>(null);
    const [isPresetsLoading, setIsPresetsLoading] = useState(false);
    const [isApplyingPreset, setIsApplyingPreset] = useState(false);

    // Campaign edit status states
    const [campaignEditStatus, setCampaignEditStatus] = useState<any>(null);
    const [isLoadingEditStatus, setIsLoadingEditStatus] = useState(false);

    // Create campaign settings states
    const [showCreateCampaignSettings, setShowCreateCampaignSettings] = useState(false);
    const [createCampaignSettings, setCreateCampaignSettings] = useState<any>(null);

    // Prospect detail modal states
    const [isProspectDetailModalOpen, setIsProspectDetailModalOpen] = useState(false);
    const [selectedProspectDetail, setSelectedProspectDetail] = useState<any>(null);
    const [isLoadingProspectDetail, setIsLoadingProspectDetail] = useState(false);

    // Create campaign states
    const [currentStep, setCurrentStep] = useState(1);

    // Auto-open campaign settings when reaching the "Schedule & Launch" step
    useEffect(() => {
        if (currentStep === 4) {
            const timer = setTimeout(() => {
                setShowCreateCampaignSettings(true);
            }, 1000); // 1 second delay

            return () => clearTimeout(timer);
        }
    }, [currentStep]);
    const [campaignName, setCampaignName] = useState('');
    const [campaignDescription, setCampaignDescription] = useState('');
    const [emailSequences, setEmailSequences] = useState<EmailSequence[]>([
        { id: '1', subject: '', content: '', delay: 0, type: 'initial' }
    ]);
    const [schedulingOption, setSchedulingOption] = useState('immediate');
    const [prospectCount, setProspectCount] = useState(0);
    const [importedProspects, setImportedProspects] = useState<any[]>([]);
    const [selectedImportMethod, setSelectedImportMethod] = useState<'csv' | 'candidates' | 'project' | 'manual' | null>(null);
    const [manualData, setManualData] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedCandidatesSource, setSelectedCandidatesSource] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Candidates import states
    const [fetchedCandidates, setFetchedCandidates] = useState<any[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

    // Candidates analysis states
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [analyzingCandidates, setAnalyzingCandidates] = useState<Set<string>>(new Set());
    const [loadingCandidateEmails, setLoadingCandidateEmails] = useState<string[]>([]);
    const [loadingLinkedInUrls, setLoadingLinkedInUrls] = useState<string[]>([]);
    const [loadingBatchCandidateEmails, setLoadingBatchCandidateEmails] = useState(false);
    const [loadingBatchCandidateLinkedInUrls, setLoadingBatchCandidateLinkedInUrls] = useState(false);

    // Email accounts states
    const [selectedEmailAccount, setSelectedEmailAccount] = useState<string>('');
    const [expandedCandidateEmails, setExpandedCandidateEmails] = useState<Set<string>>(new Set());
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // LinkedIn session states
    const [linkedinSession, setLinkedinSession] = useState<any>(null);
    const [linkedinSessionLoading, setLinkedinSessionLoading] = useState(false);
    const [csvProcessing, setCsvProcessing] = useState(false);
    const [manualProcessing, setManualProcessing] = useState(false);

    // LinkedIn extension status states
    const [linkedinExtensionStatus, setLinkedinExtensionStatus] = useState<any>(null);
    const [linkedinExtensionLoading, setLinkedinExtensionLoading] = useState(false);
    const [linkedinAccount, setLinkedinAccount] = useState<any>(null);

    // Deep Analysis states (similar to CandidatesPage)
    const [isAnalysisCriteriaModalOpen, setIsAnalysisCriteriaModalOpen] = useState(false);
    const [analysisCriteria, setAnalysisCriteria] = useState([
        { id: 1, value: '', placeholder: 'Years of experience in...' },
        { id: 2, value: '', placeholder: 'Graduation year after...' },
        { id: 3, value: '', placeholder: 'Years in industry...' }
    ]);
    const [deepAnalysisSelectedCandidateId, setDeepAnalysisSelectedCandidateId] = useState<string | null>(null);
    const [deepAnalysisSelectedCandidate, setDeepAnalysisSelectedCandidate] = useState<any | null>(null);
    const [deepAnalysisSelectedCandidateIds, setDeepAnalysisSelectedCandidateIds] = useState<string[]>([]);
    const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState(false);
    const [isImportProspectsModalOpen, setIsImportProspectsModalOpen] = useState(false);
    const [deepAnalysisResultsMap, setDeepAnalysisResultsMap] = useState<Record<string, any>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);

    // Visual Campaign Builder states
    const [isVisualBuilderMode, setIsVisualBuilderMode] = useState(false);
    const [selectedFirstStep, setSelectedFirstStep] = useState<string | null>(null);
    const [campaignFlow, setCampaignFlow] = useState<any[]>([]);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [showStepSelector, setShowStepSelector] = useState(false);
    const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<string | null>(null);
    const [editingNodeContent, setEditingNodeContent] = useState<any>(null);
    const [isSavingNode, setIsSavingNode] = useState(false);

    // Available variables for messages
    const availableVariables = [
        { key: 'name', label: 'Name', example: 'Rahul Chiluka' },
        { key: 'first_name', label: 'First Name', example: 'Rahul' },
        { key: 'email', label: 'Email', example: 'rahul@example.com' },
        { key: 'company', label: 'Company', example: 'Modular Finance' },
        { key: 'position', label: 'Position', example: 'Account Executive' }
    ];

    // Allowed keys that can be sent to backend
    const allowedVariableKeys = new Set(['name', 'first_name', 'email', 'company', 'position']);

    // Map legacy/camelCase keys to allowed snake_case keys
    const variableAliasMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'name', // if users typed {{lastName}} we will not keep it (no allowed mapping) but leaving here if needed later
        jobTitle: 'position',
        title: 'position',
    };

    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const accountsLoadingRef = useRef(false); // Ref to prevent concurrent account loading
    const processedOAuthCodes = useRef(new Set<string>()); // Track processed OAuth codes
    const callbackProcessingRef = useRef(false); // Prevent concurrent callback processing
    const [refreshingGmailTokens, setRefreshingGmailTokens] = useState(false);

    // Lead selection state for delete functionality
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingLeads, setDeletingLeads] = useState(false);

    // Derived state for backwards compatibility
    const linkedinAccounts = connectedAccounts
        .filter(account => account.type === 'linkedin')
        .map(account => ({
            id: account._id,
            name: account.displayName,
            profileUrl: account.profileUrl || ''
        }));

    const emailAccounts = connectedAccounts
        .filter(account => account.type === 'email')
        .map(account => ({
            id: account._id,
            email: account.email || '',
            name: account.displayName
        }));
    const canvasRef = useRef<HTMLDivElement>(null);

    const [availableProjects, setAvailableProjects] = useState<{ _id: string; name: string }[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Save to Project modal states
    const [isSaveToProjectModalOpen, setIsSaveToProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [savingProfiles, setSavingProfiles] = useState<string[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        // Load campaigns from API - commented out for static data
        loadCampaigns();

        // Prefetch user projects for project import
        (async () => {
            try {
                setLoadingProjects(true);
                const resp = await authService.getUserProjects();
                if (resp && Array.isArray(resp)) {
                    setAvailableProjects(resp);
                }
            } catch (e) {
                // non-blocking
            } finally {
                setLoadingProjects(false);
            }
        })();
    }, []);

    // Handle pre-populated prospects from LeadTable
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'create') {
            // Read prospects from sessionStorage
            const storedProspects = sessionStorage.getItem('newCampaignProspects');
            if (storedProspects) {
                try {
                    const prospects = JSON.parse(storedProspects);

                    // Set up for creating a new campaign
                    setIsCreateMode(true);
                    setCurrentStep(1);

                    // Pre-populate prospects
                    setImportedProspects(prospects);
                    setProspectCount(prospects.length);

                    // Clear from sessionStorage
                    sessionStorage.removeItem('newCampaignProspects');

                    // Clear URL parameter
                    window.history.replaceState({}, '', '/campaigns');

                    // Show success message
                    toast({
                        title: "Prospects Loaded",
                        description: `${prospects.length} prospects loaded. Create your campaign now!`,
                        duration: 5000,
                    });
                } catch (error) {
                    console.error('Error loading prospects from sessionStorage:', error);
                    sessionStorage.removeItem('newCampaignProspects');
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load accounts only when email step is selected, LinkedIn extension status when LinkedIn steps are selected
    useEffect(() => {
        if (selectedNodeForEdit) {
            const selectedNode = campaignFlow.find(node => node.id === selectedNodeForEdit);
            if (selectedNode && selectedNode.stepType === 'email') {
                // Only load accounts if not already loaded
                if (connectedAccounts.length === 0 && !accountsLoadingRef.current) {
                    loadConnectedAccounts();
                }
            } else if (selectedNode && (selectedNode.stepType === 'linkedin-invitation' || selectedNode.stepType === 'linkedin-visit' || selectedNode.stepType === 'linkedin-message')) {
                // Load LinkedIn extension status for LinkedIn steps
                loadLinkedInExtensionStatus();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeForEdit]); // Only depend on selectedNodeForEdit, not campaignFlow to prevent unnecessary re-runs

    // Cleanup stream when component unmounts
    useEffect(() => {
        return () => {
            if (streamCleanup) {
                streamCleanup();
            }
        };
    }, [streamCleanup]);

    // Fetch user projects when Save to Project modal opens
    useEffect(() => {
        if (isSaveToProjectModalOpen) {
            authService.getUserProjects()
                .then(response => {
                    if (response && Array.isArray(response)) {
                        setAvailableProjects(response);
                    } else {
                        toast({
                            title: "Error",
                            description: "Failed to load projects",
                            variant: "destructive"
                        });
                    }
                })
                .catch(() => {
                    toast({
                        title: "Error",
                        description: "Failed to load projects",
                        variant: "destructive"
                    });
                });
        }
    }, [isSaveToProjectModalOpen]);

    // Campaign edit status API function
    const getCampaignEditStatus = async (campaignId: string) => {
        try {
            const token = await (authService as any).getToken?.();
            const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/edit-status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching campaign edit status:', error);
            throw error;
        }
    };

    // Campaign navigation functions
    const handleCampaignClick = async (campaign: APICampaignWithStats) => {
        try {
            setIsLoadingEditStatus(true);

            // Fetch campaign edit status first
            const editStatusData = await getCampaignEditStatus(campaign._id);
            setCampaignEditStatus(editStatusData.editStatus);

            console.log('Campaign Edit Status:', editStatusData.editStatus);

            // Fetch full campaign data by ID to get complete information including linkedinSettings
            const fullCampaignData = await authService.getCampaignById(campaign._id);

            // Merge the full data with stats from the list view
            const enrichedCampaign: APICampaignWithStats = {
                ...fullCampaignData,
                stats: campaign.stats, // Keep stats from list view
                createdAt: fullCampaignData.createdAt || campaign.createdAt,
                updatedAt: fullCampaignData.updatedAt || campaign.updatedAt,
            };

            setSelectedCampaign(enrichedCampaign);
            setCampaignDetailTab('overview');

            // Convert campaign sequence to flow format for sequence tab
            if (enrichedCampaign.sequence) {
                // First, create a map of nodes for easier lookup
                const nodeMap = new Map();
                enrichedCampaign.sequence.forEach((step, index) => {
                    const stepId = step.id || `step-${index}`;
                    nodeMap.set(stepId, { ...step, id: stepId, originalIndex: index });
                });

                // Build tree structure and calculate positions
                const positionMap = new Map();
                let yCounter = 0;

                const calculatePositions = (nodeId: string, level: number = 0, branch: string = 'main'): void => {
                    if (positionMap.has(nodeId)) return;

                    const baseX = 200;
                    const levelSpacing = 300;
                    const branchSpacing = 250;
                    const verticalSpacing = 180;

                    let xPosition = baseX + (level * levelSpacing);

                    // Adjust for branches
                    if (branch === 'yes') {
                        xPosition += branchSpacing;
                    } else if (branch === 'no') {
                        xPosition -= branchSpacing;
                    }

                    const yPosition = 100 + (yCounter * verticalSpacing);
                    yCounter++;

                    positionMap.set(nodeId, { x: xPosition, y: yPosition });

                    // Process children
                    const node = nodeMap.get(nodeId);
                    if (node) {
                        const children = enrichedCampaign.sequence!.filter(childStep =>
                            childStep.parentId === node.id
                        );

                        // Sort children: main first, then yes, then no
                        children.sort((a, b) => {
                            const order = { main: 0, yes: 1, no: 2 };
                            return (order[a.parentBranch] || 0) - (order[b.parentBranch] || 0);
                        });

                        children.forEach(child => {
                            const childId = child.id || `step-${enrichedCampaign.sequence!.indexOf(child)}`;
                            calculatePositions(childId, level + 1, child.parentBranch || 'main');
                        });
                    }
                };

                // Find root nodes (nodes without parents)
                const rootNodes = enrichedCampaign.sequence.filter(step => !step.parentId);
                rootNodes.forEach((root, index) => {
                    const rootId = root.id || `step-${enrichedCampaign.sequence!.indexOf(root)}`;
                    calculatePositions(rootId);
                });

                const flowNodes = enrichedCampaign.sequence.map((step, index) => {
                    // Determine node type based on stepType using the same logic as campaign settings
                    const conditionTypes = ['email-opened', 'email-reply', 'linkedin-connection-check', 'opened-linkedin-message', 'linkedin-reply-check', 'clicked-link', 'has-linkedin', 'has-email', 'has-phone'];
                    const nodeType = conditionTypes.includes(step.stepType) ? 'condition' : 'step';

                    // Get position from calculated positions
                    const stepId = step.id || `step-${index}`;
                    const position = { x: step.x || 200, y: step.y || (100 + (index * 180)) };

                    // Find children of this node - use the original step.id for matching
                    const children = enrichedCampaign.sequence!.filter(childStep =>
                        childStep.parentId === step.id
                    );

                    let connections: string[] = [];
                    let branchConnections: { yes: string[]; no: string[] } | undefined;

                    if (nodeType === 'condition') {
                        // For condition nodes, separate children by branch
                        const yesChildren = children.filter(child => child.parentBranch === 'yes');
                        const noChildren = children.filter(child => child.parentBranch === 'no');

                        branchConnections = {
                            yes: yesChildren.map(child => child.id || `step-${enrichedCampaign.sequence!.indexOf(child)}`),
                            no: noChildren.map(child => child.id || `step-${enrichedCampaign.sequence!.indexOf(child)}`)
                        };

                        // Initialize empty connections array for condition nodes
                        connections = [];
                    } else {
                        // For regular steps, just connect to main branch children
                        const mainChildren = children.filter(child =>
                            child.parentBranch === 'main' || !child.parentBranch
                        );
                        connections = mainChildren.map(child => child.id || `step-${enrichedCampaign.sequence!.indexOf(child)}`);

                        // No branch connections for regular steps
                        branchConnections = undefined;
                    }

                    return {
                        id: stepId,
                        type: nodeType,
                        stepType: step.stepType,
                        conditionType: nodeType === 'condition' ? step.stepType : undefined,
                        title: step.stepType === 'email' ? (step.content?.subject || 'Email') :
                            step.stepType === 'manual-task' ? (step.content?.taskTitle || 'Manual Task') :
                                step.stepType === 'linkedin-connection-check' ? 'Connection Check' :
                                    step.stepType === 'linkedin-invitation' ? 'LinkedIn Invitation' :
                                        step.stepType === 'linkedin-message' ? 'LinkedIn Message' :
                                            step.stepType,
                        description: step.stepType === 'email' ? step.content?.message?.substring(0, 50) + '...' :
                            step.stepType === 'manual-task' ? step.content?.taskDescription?.substring(0, 50) + '...' :
                                step.stepType === 'linkedin-message' ? step.content?.message?.substring(0, 50) + '...' :
                                    undefined,
                        position,
                        connections,
                        branchConnections,
                        parentId: step.parentId,
                        parentBranch: step.parentBranch as 'main' | 'yes' | 'no' | undefined,
                        content: step.content
                    };
                });

                // Rebuild branch connections for conditions (same as handleEditCampaign)
                flowNodes.forEach(node => {
                    if (node.type === 'condition') {
                        // Initialize branch connections to prevent duplicates
                        node.branchConnections = { yes: [], no: [] };

                        // Find all nodes that have this condition as parent
                        enrichedCampaign.sequence!.forEach(step => {
                            if (step.parentId === node.id) {
                                if (step.parentBranch === 'yes' && !node.branchConnections.yes.includes(step.id)) {
                                    node.branchConnections.yes.push(step.id);
                                } else if (step.parentBranch === 'no' && !node.branchConnections.no.includes(step.id)) {
                                    node.branchConnections.no.push(step.id);
                                }
                            }
                        });
                    }
                });

                // Clear connections for all nodes that are on condition branches (Yes/No)
                enrichedCampaign.sequence!.forEach(step => {
                    if (step.parentId && step.parentBranch === 'main') {
                        // Find the parent node and add connection to this child
                        const parentNode = flowNodes.find(n => n.id === step.parentId);
                        if (parentNode && parentNode.type !== 'condition') {
                            // Only add main flow connections for non-condition parents
                            parentNode.connections.push(step.id);
                        }
                    }
                });

                // Debug logging to see final flowNodes
                console.log('=== FINAL FLOW NODES ===');
                flowNodes.forEach(node => {
                    console.log(`Node ${node.id}:`, {
                        type: node.type,
                        connections: node.connections,
                        branchConnections: node.branchConnections,
                        position: node.position
                    });
                });
                console.log('=== END FLOW NODES ===');

                setCampaignFlow(flowNodes);
            } else {
                setCampaignFlow([]);
            }

        } catch (error) {
            console.error('Error fetching campaign details:', error);
            toast({
                title: "Error",
                description: "Failed to load campaign details. Please try again.",
                variant: "destructive"
            });
            // Fallback to using the campaign data from the list
            setSelectedCampaign(campaign);
            setCampaignDetailTab('overview');
        } finally {
            setIsLoadingEditStatus(false);
        }
    };

    const handleBackToCampaigns = () => {
        setSelectedCampaign(null);
        setCampaignDetailTab('overview');
        setSelectedNodeForEdit(null);
        setCampaignFlow([]);
        // Reset lead selection when navigating back
        setSelectedLeads([]);
        setSelectAll(false);
    };

    // Lead selection handlers
    const handleSelectLead = (leadId: string) => {
        setSelectedLeads(prev => {
            const isSelected = prev.includes(leadId);
            const newSelection = isSelected
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId];

            // Update select all state
            if (selectedCampaign?.prospects) {
                setSelectAll(newSelection.length === selectedCampaign.prospects.length);
            }

            return newSelection;
        });
    };

    const handleSelectAllLeads = (checked: boolean) => {
        if (selectedCampaign?.prospects) {
            if (checked) {
                const allLeadIds = selectedCampaign.prospects.map(prospect => prospect._id).filter(Boolean);
                setSelectedLeads(allLeadIds);
            } else {
                setSelectedLeads([]);
            }
            setSelectAll(checked);
        }
    };

    const handleDeleteSelectedLeads = () => {
        if (selectedLeads.length === 0) {
            toast({
                title: "No leads selected",
                description: "Please select at least one lead to delete.",
                variant: "destructive"
            });
            return;
        }
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDeleteLeads = async () => {
        if (!selectedCampaign || selectedLeads.length === 0) return;

        setDeletingLeads(true);
        try {
            const response = await authService.deleteProspectsFromCampaign(
                selectedCampaign._id,
                selectedLeads
            );

            if (response.success) {
                // Update the campaign with remaining prospects
                const updatedCampaign = {
                    ...selectedCampaign,
                    prospects: selectedCampaign.prospects.filter(
                        prospect => !selectedLeads.includes(prospect._id)
                    )
                };
                setSelectedCampaign(updatedCampaign);

                // Clear selection
                setSelectedLeads([]);
                setSelectAll(false);
                setIsDeleteModalOpen(false);

                // Refresh campaigns list
                await loadCampaigns();

                toast({
                    title: "Success",
                    description: `Successfully deleted ${response.data.prospectsDeleted} lead${response.data.prospectsDeleted > 1 ? 's' : ''} from the campaign.`,
                });
            } else {
                throw new Error(response.message || 'Failed to delete leads');
            }
        } catch (error: any) {
            console.error('Error deleting leads:', error);
            toast({
                title: "Error",
                description: `Failed to delete leads: ${error.message || 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setDeletingLeads(false);
        }
    };

    // Save to Project handlers
    const handleAddToProjects = () => {
        console.log('handleAddToProjects called', { selectedLeads: selectedLeads.length });
        if (selectedLeads.length === 0) {
            toast({
                title: "No leads selected",
                description: "Please select at least one lead to save to project.",
                variant: "destructive"
            });
            return;
        }
        console.log('Setting modal to open...');
        setSelectedProjectId('');
        setIsSaveToProjectModalOpen(true);
        console.log('Modal state should be true now');
    };

    const handleSaveProspectsToProject = async (projectId: string) => {
        if (!selectedCampaign || selectedLeads.length === 0) return;

        setSavingProfiles(prev => [...prev, ...selectedLeads]);
        setSaveError(null);

        try {
            // Get the selected prospect objects
            const selectedProspects = selectedCampaign.prospects.filter(
                prospect => selectedLeads.includes(prospect._id)
            );

            // Transform prospects to match the API expected format
            const payload = selectedProspects.map(prospect => ({
                projectId,
                name: prospect.name || '',
                title: prospect.position || '',
                company: prospect.company || '',
                location: '', // Not available in campaign prospects
                linkedinUrl: prospect.linkedin || '',
                email: prospect.email || '',
                relevanceScore: '',
                matchedCategories: {},
                matchedCategoriesValue: {}
            }));

            const response = await authService.saveProfileToProject(payload);

            if (response.message) {
                toast({
                    title: "Success",
                    description: response.message || `Successfully saved ${selectedLeads.length} prospect${selectedLeads.length > 1 ? 's' : ''} to project!`,
                });

                // Clear selection and close modal
                setSelectedLeads([]);
                setSelectAll(false);
                setIsSaveToProjectModalOpen(false);
                setSelectedProjectId('');
                setIsCreatingNewProject(false);
                setProjectName('');
            } else {
                throw new Error(response.message || 'Failed to save prospects to project');
            }
        } catch (error: any) {
            console.error('Error saving prospects to project:', error);
            setSaveError(`Failed to save prospects: ${error.message || 'Unknown error'}`);
            toast({
                title: "Error",
                description: `Failed to save prospects to project: ${error.message || 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setSavingProfiles(prev => prev.filter(id => !selectedLeads.includes(id)));
        }
    };

    const handleProjectCreationSuccess = () => {
        // Dispatch a custom event that Dashboard.tsx can listen for
        const projectCreatedEvent = new CustomEvent('projectCreated');
        window.dispatchEvent(projectCreatedEvent);

        // Show success message
        toast({
            title: "Success",
            description: "Project created successfully!",
        });
    };

    // Get step name from sequence
    const getStepName = (stepIndex: number) => {
        if (!selectedCampaign?.sequence || stepIndex >= selectedCampaign.sequence.length) {
            return 'Not started';
        }
        const step = selectedCampaign.sequence[stepIndex];
        if (step.stepType === 'email') {
            return step.content?.subject || `Email ${stepIndex + 1}`;
        } else if (step.stepType === 'manual-task') {
            return step.content?.taskTitle || `Task ${stepIndex + 1}`;
        }
        return `Step ${stepIndex + 1}`;
    };

    // Get prospect current step
    const getProspectStep = (prospect: any) => {
        if (!prospect.status || prospect.status === 'pending') {
            return { index: -1, name: 'Not started', type: 'pending' };
        }
        if (prospect.status === 'contacted') {
            return { index: 0, name: getStepName(0), type: 'completed' };
        }
        // Add more status mappings as needed
        return { index: 0, name: 'In progress', type: 'active' };
    };

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const campaignsData = await authService.getCampaigns();
            // Normalize to APICampaignWithStats
            const normalized: APICampaignWithStats[] = (campaignsData || []).map((c: any) => ({
                _id: c._id,
                name: c.name,
                description: c.description,
                status: (c.status as any) || 'draft',
                prospects: c.prospects || [],
                sequence: c.sequence || [],
                stats: c.stats || { totalProspects: c.prospects?.length || 0, emailsSent: 0, openRate: 0, replyRate: 0, clickRate: 0 },
                createdAt: c.createdAt || new Date().toISOString(),
                updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
            }));
            setCampaigns(normalized);
        } catch (error) {
            console.error('Error loading campaigns:', error);
            toast({
                title: "Error",
                description: "Failed to load campaigns. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const loadConnectedAccounts = async () => {
        // Guard against concurrent calls
        if (accountsLoadingRef.current) {
            console.log('⏭️ Accounts already loading, skipping...');
            return;
        }

        try {
            accountsLoadingRef.current = true;
            setAccountsLoading(true);
            const accounts = await authService.getAccounts();
            setConnectedAccounts(accounts);
        } catch (error) {
            console.error('Error loading connected accounts:', error);
            // Don't show error toast for accounts as it's not critical for viewing campaigns
        } finally {
            setAccountsLoading(false);
            accountsLoadingRef.current = false;
        }
    };

    const refreshGmailTokens = async () => {
        try {
            setRefreshingGmailTokens(true);

            const token = await (authService as any).getToken?.();
            const response = await fetch(`${API_BASE_URL}/accounts/gmail/refresh-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: ''
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const err = await response.json();
                    errorMessage = err.message || err.error || errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            // Reload connected accounts after successful refresh
            await loadConnectedAccounts();

            toast({
                title: "Gmail Tokens Refreshed",
                description: "All Gmail account tokens have been refreshed successfully.",
            });
        } catch (error: any) {
            console.error('Error refreshing Gmail tokens:', error);
            toast({
                title: "Refresh Failed",
                description: error?.message || "Failed to refresh Gmail tokens. Please try reconnecting your accounts.",
                variant: "destructive"
            });
        } finally {
            setRefreshingGmailTokens(false);
        }
    };

    // Load timezones and presets when create campaign settings modal opens
    useEffect(() => {
        if (showCreateCampaignSettings) {
            // Always load timezones when settings modal opens
            setIsTimezonesLoading(true);
            (async () => {
                try {
                    const timezonesResponse = await authService.getTimezones();
                    if (timezonesResponse && timezonesResponse.data) {
                        setTimezones(timezonesResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching timezones:', err);
                } finally {
                    setIsTimezonesLoading(false);
                }
            })();

            // Always load safety presets when settings modal opens
            setIsPresetsLoading(true);
            (async () => {
                try {
                    const presetsResponse = await authService.getCampaignPresets();
                    if (presetsResponse && presetsResponse.data) {
                        setSafetyPresets(presetsResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching presets:', err);
                } finally {
                    setIsPresetsLoading(false);
                }
            })();
        }
    }, [showCreateCampaignSettings]);

    useEffect(() => {
        const onMessage = async (event: MessageEvent) => {
            try {
                const payload: any = (event as any).data;
                if (!payload || payload.type !== 'gmail_oauth_code') return;
                // If redirect happens on the same origin, origins will match
                if (event.origin !== window.location.origin) return;
                const code = payload.code as string;
                if (!code) return;

                // Guard: Check if this code has already been processed
                if (processedOAuthCodes.current.has(code)) {
                    console.log('⏭️ OAuth code already processed, skipping...');
                    return;
                }

                // Guard: Prevent concurrent callback processing
                if (callbackProcessingRef.current) {
                    console.log('⏭️ Callback already processing, skipping...');
                    return;
                }

                try {
                    callbackProcessingRef.current = true;
                    processedOAuthCodes.current.add(code); // Mark as processed
                    setAccountsLoading(true);

                    const resp = await authService.completeGmailCallback(code);
                    await loadConnectedAccounts();
                    const acc = (resp as any)?.account;
                    if (acc?.email && selectedNodeForEdit) {
                        updateNodeContent(selectedNodeForEdit, { emailAddresses: [acc.email] });
                    }
                    toast({ title: 'Gmail Connected', description: (resp as any)?.message || acc?.email || 'Account linked successfully.' });
                } catch (e: any) {
                    // Remove from processed set on error so it can be retried
                    processedOAuthCodes.current.delete(code);
                    toast({ title: 'Connection failed', description: e?.message || 'Unable to connect Gmail', variant: 'destructive' });
                } finally {
                    setAccountsLoading(false);
                    callbackProcessingRef.current = false;
                }
            } catch { }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - listener doesn't need to change

    const steps = [
        { id: 1, title: 'Campaign Details', icon: Target },
        { id: 2, title: 'Target Audience', icon: Users },
        { id: 3, title: 'Sequence', icon: Mail },
        { id: 4, title: 'Schedule & Launch', icon: Calendar },
    ];

    const addEmailSequence = () => {
        const newSequence: EmailSequence = {
            id: Date.now().toString(),
            subject: '',
            content: '',
            delay: emailSequences.length > 0 ? 3 : 0,
            type: 'followup'
        };
        setEmailSequences([...emailSequences, newSequence]);
    };

    const removeEmailSequence = (id: string) => {
        if (emailSequences.length > 1) {
            setEmailSequences(emailSequences.filter(seq => seq.id !== id));
        }
    };

    const updateEmailSequence = (id: string, field: keyof EmailSequence, value: string | number) => {
        setEmailSequences(emailSequences.map(seq =>
            seq.id === id ? { ...seq, [field]: value } : seq
        ));
    };

    // Load LinkedIn session data
    // const loadLinkedInSession = async () => {
    //     try {
    //         setLinkedinSessionLoading(true);
    //         const response = await linkedinApi.getSession();
    //         setLinkedinSession(response.data);
    //     } catch (error: any) {
    //         console.error('Error loading LinkedIn session:', error);
    //         setLinkedinSession(null);
    //     } finally {
    //         setLinkedinSessionLoading(false);
    //     }
    // };

    // Load LinkedIn extension status
    const loadLinkedInExtensionStatus = async () => {
        try {
            setLinkedinExtensionLoading(true);
            const response: any = await linkedinApi.getExtensionStatus();
            setLinkedinExtensionStatus(response.extension);
            setLinkedinAccount(response.linkedinAccount || null);
        } catch (error: any) {
            console.error('Error loading LinkedIn extension status:', error);
            setLinkedinExtensionStatus(null);
            setLinkedinAccount(null);
        } finally {
            setLinkedinExtensionLoading(false);
        }
    };

    // Handle LinkedIn profile submission
    const handleLinkedInSubmit = async (linkedinUrl: string) => {
        if (!linkedinUrl) {
            toast({
                title: 'Error',
                description: 'Please enter a LinkedIn URL',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await linkedinApi.saveUserProfile(linkedinUrl);
            showApiResponseToast(response.message || 'LinkedIn profile saved successfully!');
            // Reload session after successful submission
            // await loadLinkedInSession(); // Commented out - not required
        } catch (error: any) {
            console.error('Error saving LinkedIn profile:', error);
        }
    };

    const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setCsvProcessing(true);
            const formData = new FormData();
            formData.append('file', file);

            const token = await (authService as any).getToken?.();
            const response = await fetch(`${API_BASE_URL}/search/process-csv-profiles`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const err = await response.json();
                    errorMessage = err.message || err.error || errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const results: any[] = Array.isArray(data?.results) ? data.results : [];

            const prospects = results.map((result: any, index: number) => ({
                name: result.fullName || result.csvData?.name || `Unknown ${index + 1}`,
                email: result.email || result.csvData?.email || '',
                company: result.extractedCompany || result.csvData?.company || '',
                title: result.extractedTitle || result.csvData?.title || '',
                location: result.extractedLocation || result.csvData?.location || '',
                linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || ''
            }));

            setImportedProspects(prospects);
            setProspectCount(prospects.length);
            setSelectedImportMethod('csv');

            // Also populate the candidates table with transformed rows so the unified table renders
            const transformedCandidates = results.map((result: any, index: number) => {
                const syntheticId = `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
                const initialEmail = (result.email || result.csvData?.email || '').trim();
                return {
                    _id: syntheticId,
                    id: syntheticId,
                    name: result.fullName || result.csvData?.name || `Unknown ${index + 1}`,
                    title: result.extractedTitle || result.csvData?.title || '',
                    company: result.extractedCompany || result.csvData?.company || '',
                    location: result.extractedLocation || result.csvData?.location || '',
                    linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || '',
                    emailAddress: initialEmail,
                    emails: initialEmail ? [initialEmail] : [],
                    hasEmails: initialEmail ? true : false,
                    profileEvaluation: { status: 'Evaluated' },
                    relevanceScore: result.originalRelevanceScore || 0,
                } as any;
            });
            setFetchedCandidates(transformedCandidates);

            toast({
                title: 'CSV Uploaded',
                description: `Processed ${prospects.length} prospects via AI`,
            });
        } catch (error: any) {
            toast({
                title: 'CSV processing failed',
                description: error?.message || 'Failed to process CSV file.',
                variant: 'destructive'
            });
        } finally {
            setCsvProcessing(false);
            // Reset the input so the same file can be re-selected if needed
            if (event.target) {
                try { (event.target as any).value = ''; } catch { }
            }
        }
    };

    const fetchCandidates = async () => {
        if (!selectedCandidatesSource) {
            toast({
                title: "Select Candidates Source",
                description: "Please select a candidates source first.",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoadingCandidates(true);
            const response = await authService.getAllUserProfiles();

            // Handle both possible shapes as in CandidatesPage
            if (response && (response as any).profiles && Array.isArray((response as any).profiles)) {
                const transformedProfiles = (response as any).profiles.map((profile: any) => ({
                    ...profile,
                    id: profile._id,
                    emailAddress: profile.email || '',
                    profileEvaluation: { status: 'Evaluated' },
                    relevanceScore: profile.relevanceScore || 0
                }));
                setFetchedCandidates(transformedProfiles);
            } else if (response && Array.isArray(response as any)) {
                const transformedProfiles = (response as any).map((profile: any) => ({
                    ...profile,
                    id: profile._id,
                    emailAddress: profile.email || '',
                    profileEvaluation: { status: 'Evaluated' },
                    relevanceScore: profile.relevanceScore || 0
                }));
                setFetchedCandidates(transformedProfiles);
            } else {
                toast({
                    title: "Error",
                    description: (response as any)?.message || 'Failed to fetch candidates',
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || 'An error occurred while fetching candidates',
                variant: "destructive"
            });
            console.error('Error fetching candidates:', err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const handleImportFromCandidates = () => {
        fetchCandidates();
    };

    const handleSelectCandidate = (candidateId: string) => {
        const newSelected = new Set(selectedCandidates);
        if (newSelected.has(candidateId)) {
            newSelected.delete(candidateId);
        } else {
            newSelected.add(candidateId);
        }
        setSelectedCandidates(newSelected);
    };

    const handleSelectAllCandidates = () => {
        if (selectedCandidates.size === fetchedCandidates.length) {
            setSelectedCandidates(new Set());
        } else {
            setSelectedCandidates(new Set(fetchedCandidates.map(candidate => candidate._id)));
        }
    };

    const handleConfirmCandidateImport = () => {
        const selectedCandidatesList = fetchedCandidates.filter(candidate =>
            selectedCandidates.has(candidate._id)
        );

        if (selectedCandidatesList.length === 0) {
            toast({
                title: "No Candidates Selected",
                description: "Please select at least one candidate to import.",
                variant: "destructive"
            });
            return;
        }

        // Transform candidates to prospect format
        const transformedProspects = selectedCandidatesList.map(candidate => {
            // Get email from various possible sources
            let email = '';
            if (candidate.emails && Array.isArray(candidate.emails) && candidate.emails.length > 0) {
                // Use first email from emails array (from email enrichment)
                email = candidate.emails[0];
            } else if (candidate.emailAddress) {
                // Use emailAddress property
                email = candidate.emailAddress;
            } else if (candidate.email) {
                // Use email property
                email = candidate.email;
            }

            return {
                name: candidate.name,
                email: email,
                company: candidate.company,
                title: candidate.title,
                location: candidate.location,
                linkedinUrl: candidate.linkedinUrl || candidate.linkedin || '',
                source: 'candidates'
            };
        });

        setImportedProspects(transformedProspects);
        setProspectCount(transformedProspects.length);
        setSelectedImportMethod('candidates');

        toast({
            title: "Candidates Imported",
            description: `Successfully imported ${transformedProspects.length} candidates.`,
        });

        // Reset selection
        setSelectedCandidates(new Set());
    };

    // Candidates table helper functions
    const handleCandidateAnalyzeClick = (candidate: any) => {
        setDeepAnalysisSelectedCandidateId(candidate._id);
        setDeepAnalysisSelectedCandidate(candidate);
        setDeepAnalysisSelectedCandidateIds([]); // Clear batch selection
        setIsAnalysisCriteriaModalOpen(true);
    };

    const handleBatchCandidateAnalyzeClick = () => {
        if (selectedCandidates.size === 0) {
            toast({
                title: "No Candidates Selected",
                description: "Please select at least one candidate to analyze.",
                variant: "destructive"
            });
            return;
        }
        setDeepAnalysisSelectedCandidateIds(Array.from(selectedCandidates));
        setDeepAnalysisSelectedCandidateId(null);
        setDeepAnalysisSelectedCandidate(null);
        setIsAnalysisCriteriaModalOpen(true);
    };

    // Criteria management functions
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

    // Helper function to normalize LinkedIn URLs (same as CandidatesPage)
    const normalizeLinkedInUrl = (url: string): string => {
        if (!url) return '';
        try {
            const parsed = new URL(url);
            let path = parsed.pathname;
            try {
                path = decodeURIComponent(path);
            } catch { }
            return path
                .toLowerCase()
                .replace(/\/$/, '') // remove trailing slash
                .trim();
        } catch {
            let lower = url.toLowerCase();
            let path = '';
            const match = lower.match(/linkedin\.com(\/in\/[^?#]+)/);
            if (match && match[1]) {
                path = match[1];
            } else {
                path = lower.replace(/^https?:\/\/[^/]+/, '');
            }
            try {
                path = decodeURIComponent(path);
            } catch { }
            return path.replace(/\/$/, '').trim();
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
            let selectedCandidateIds: string[] = [];

            if (deepAnalysisSelectedCandidateIds.length > 0) {
                selectedCandidateIds = deepAnalysisSelectedCandidateIds;
            } else if (deepAnalysisSelectedCandidateId) {
                selectedCandidateIds = [deepAnalysisSelectedCandidateId];
            }

            // Set analyzing state for all selected candidates
            setAnalyzingCandidates(new Set(selectedCandidateIds));

            // Separate LinkedIn URLs and SignalHire profile IDs
            selectedCandidateIds.forEach(candidateId => {
                const candidate = fetchedCandidates.find(c => c._id === candidateId);
                if (candidate) {
                    console.log('candidate', candidate);

                    // Check if this is a SignalHire profile (has uid or signalHireData.uid) or LinkedIn profile
                    if (candidate.uid) {
                        // SignalHire profile - use uid
                        profileIds.push(candidate.uid);
                    } else if ((candidate as any).signalHireData?.uid) {
                        // SignalHire profile with uid in signalHireData - use that uid
                        profileIds.push((candidate as any).signalHireData.uid);
                    } else if (candidate.linkedinUrl) {
                        // LinkedIn profile - use LinkedIn URL
                        linkedinUrls.push(candidate.linkedinUrl);
                    } else if (!candidate.linkedinUrl && candidate._id.length === 32) {
                        // Fallback: likely a SignalHire profile with UID as _id
                        profileIds.push(candidate._id);
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
                            // Status updates - no progress tracking needed
                            break;

                        case 'enrichment_status':
                            // Enrichment status - no progress tracking needed
                            break;

                        case 'enrichment_complete':
                            // Enrichment complete - no progress tracking needed
                            break;

                        case 'result': {
                            const identifier = data.identifier || data.linkedinUrl || data.profileId;
                            if (!identifier) {
                                console.warn('Received result without identifier, skipping:', data);
                                break;
                            }

                            // Find candidate by ID or by normalizing the identifier URL
                            console.log('🔍 Looking for candidate with identifier/link:', identifier);
                            console.log('📋 Available candidates:', fetchedCandidates.map(c => ({ id: c._id, name: c.name, uid: c.uid, linkedinUrl: c.linkedinUrl })));

                            // Check if identifier is a UID (32-char string) or a LinkedIn URL
                            let candidateToUpdate;
                            if (identifier && identifier.length === 32 && !identifier.includes('linkedin.com')) {
                                // This is a UID - find by SignalHire UID
                                candidateToUpdate = fetchedCandidates.find(candidate =>
                                    candidate.uid === identifier ||
                                    candidate._id === identifier ||
                                    (candidate as any).signalHireData?.uid === identifier
                                );
                                console.log('✅ Found candidate by UID identifier:', candidateToUpdate ? 'YES' : 'NO', candidateToUpdate?.name);
                                if (candidateToUpdate) {
                                    console.log('📝 Matched UID candidate:', {
                                        name: candidateToUpdate.name,
                                        _id: candidateToUpdate._id,
                                        uid: candidateToUpdate.uid,
                                        identifier: identifier
                                    });
                                }
                            } else {
                                // Find by normalized LinkedIn URL or try ID match
                                candidateToUpdate = fetchedCandidates.find(candidate => {
                                    // Match by ID (for SignalHire)
                                    if (candidate._id === identifier) {
                                        console.log('✅ Found by ID match:', candidate.name);
                                        return true;
                                    }
                                    // Match by normalized LinkedIn URL (for web profiles)
                                    if (candidate.linkedinUrl) {
                                        try {
                                            const normalized1 = normalizeLinkedInUrl(candidate.linkedinUrl);
                                            const normalized2 = normalizeLinkedInUrl(identifier);
                                            console.log('🔗 URL comparison:', {
                                                candidate: candidate.name,
                                                candidateUrl: normalized1,
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
                            }

                            console.log('🎯 Candidate found:', candidateToUpdate ? candidateToUpdate.name : 'NOT FOUND');

                            if (candidateToUpdate) {
                                const candidateId = candidateToUpdate._id;
                                // Remove from analyzing set since this candidate is now complete
                                setAnalyzingCandidates(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(candidateId);
                                    return newSet;
                                });

                                // Update the candidate with analysis results
                                setDeepAnalysisResultsMap(prev => ({
                                    ...prev,
                                    [candidateId]: {
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

                                // Update the candidate with BOTH analysis AND enriched data
                                console.log('🔄 Updating candidate state:', {
                                    candidateId,
                                    candidateName: candidateToUpdate.name,
                                    newAnalysisScore: data.analysis?.score,
                                    beforeUpdate: candidateToUpdate.analysisScore
                                });

                                setFetchedCandidates(prevCandidates =>
                                    prevCandidates.map(c =>
                                        c._id === candidateId
                                            ? {
                                                ...c,
                                                // Update with enriched data if available, otherwise keep original
                                                name: fullName || c.name,
                                                title: title || c.title,
                                                company: company || c.company,
                                                location: location || c.location,
                                                // Only update LinkedIn URL for SignalHire profiles
                                                linkedinUrl: data.profileId ? (linkedinUrl || c.linkedinUrl) : c.linkedinUrl,
                                                // Update analysis data directly on candidate
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
                                            : c
                                    )
                                );
                            }
                            break;
                        }

                        case 'complete':
                            toast({
                                title: "Analysis Complete",
                                description: `Deep analysis completed! Processed ${data.totalProcessed} candidates.`,
                            });

                            // Clear all analyzing candidates
                            setAnalyzingCandidates(new Set());

                            // Auto-close progress after a delay
                            setTimeout(() => {
                                setIsAnalyzing(false);
                            }, 2000);
                            break;

                        case 'error': {
                            const identifier = data.identifier;

                            // Check if we already have a successful result for this candidate
                            if (identifier) {
                                const candidateToUpdate = fetchedCandidates.find(candidate => {
                                    if (!candidate.linkedinUrl) return false;
                                    try {
                                        return normalizeLinkedInUrl(candidate.linkedinUrl) === normalizeLinkedInUrl(identifier);
                                    } catch { return false; }
                                });

                                if (candidateToUpdate && deepAnalysisResultsMap[candidateToUpdate._id]) {
                                    console.log(`Ignoring subsequent error for already processed candidate: ${identifier}`);
                                    break; // Don't show an error toast
                                }
                            }

                            console.log(`Analysis error: ${data.message || data.error}`);
                            setIsAnalyzing(false);
                            setAnalyzingCandidates(new Set()); // Clear analyzing state on error
                            break;
                        }

                        default:
                            console.log('Unknown stream data type:', data.type);
                            setIsAnalyzing(false);
                            setAnalyzingCandidates(new Set());
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

                    toast({
                        title: "Analysis Error",
                        description: errorMessage,
                        variant: "destructive"
                    });
                    setIsAnalyzing(false);
                    setAnalyzingCandidates(new Set()); // Clear analyzing state on error
                },
                // onComplete callback
                () => {
                    console.log('Stream completed');
                    setStreamCleanup(null);
                    setAnalyzingCandidates(new Set()); // Clear analyzing state on completion
                }
            );

            setStreamCleanup(() => streamCleanup);

            console.log('Deep analysis stream started successfully');

        } catch (error) {
            console.error('Error during deep analysis:', error);
            toast({
                title: "Analysis Error",
                description: 'Failed to start deep analysis',
                variant: "destructive"
            });
            setIsAnalyzing(false);
            setAnalyzingCandidates(new Set());
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
                        Enter criteria to analyze candidates. Each criterion will be used to filter and evaluate the candidates.
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
                            {isAnalyzing ? "Analyzing Candidates .." : "Analyze Candidates"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    });

    const handleCandidateGetEmailClick = async (candidate: any) => {
        try {
            setLoadingCandidateEmails(prev => [...prev, candidate._id]);

            // Build profile identification similar to CandidatesPage
            const nameParts = (candidate.name || '').trim().split(' ');
            const firstname = nameParts[0] || '';
            const lastname = nameParts.slice(1).join(' ') || '';

            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];
            let profileData: any[] = [];

            if (candidate.uid) {
                profileIds.push(candidate.uid);
            } else if ((candidate as any).signalHireData?.uid) {
                profileIds.push((candidate as any).signalHireData.uid);
            } else if (candidate.linkedinUrl && candidate.linkedinUrl.trim() !== '') {
                linkedinUrls.push(candidate.linkedinUrl);
                profileData.push({
                    linkedinUrl: candidate.linkedinUrl,
                    firstname,
                    lastname,
                    domainOrCompany: candidate.company || ''
                });
            } else {
                // Fallback: use _id (likely SignalHire id)
                profileIds.push(candidate._id);
            }

            const payload = { linkedinUrls, profileIds, profileData } as any;

            const cleanup = await authService.getEmailsStream(
                payload,
                // onStreamData
                (data) => {
                    switch (data.type) {
                        case 'result': {
                            // Remove loading spinner slightly delayed
                            setTimeout(() => {
                                setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
                            }, 300);

                            if (data.status === 'success' && Array.isArray(data.emails) && data.emails.length > 0) {
                                const emailsArray: string[] = data.emails
                                    .map((e: any) => e?.value || e?.email)
                                    .filter((e: string) => !!e);

                                setFetchedCandidates(prev => prev.map(c => (
                                    c._id === candidate._id
                                        ? { ...c, emails: emailsArray, hasEmails: true, noEmailsFound: false }
                                        : c
                                )));

                            } else if (data.status === 'no_contacts' || data.noEmailsFound === true) {
                                setFetchedCandidates(prev => prev.map(c => (
                                    c._id === candidate._id
                                        ? { ...c, emails: [], hasEmails: false, noEmailsFound: true }
                                        : c
                                )));
                            }
                            break;
                        }
                        case 'complete': {
                            setTimeout(() => {
                                setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
                            }, 300);
                            break;
                        }
                        case 'error': {
                            setTimeout(() => {
                                setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
                            }, 300);
                            toast({
                                title: 'Email Extraction Error',
                                description: data.message || 'Failed to extract emails',
                                variant: 'destructive'
                            });
                            break;
                        }
                        default:
                            break;
                    }
                },
                // onError
                (error) => {
                    setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
                    toast({
                        title: 'Email Stream Error',
                        description: error?.message || 'Unknown error',
                        variant: 'destructive'
                    });
                },
                // onComplete
                () => {
                    setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
                }
            );

            // Optional: store cleanup if needed later
            // void cleanup;
        } catch (error: any) {
            setLoadingCandidateEmails(prev => prev.filter(id => id !== candidate._id));
            toast({
                title: 'Error',
                description: error?.message || 'Failed to fetch emails',
                variant: 'destructive'
            });
        }
    };

    // Single candidate: Get LinkedIn URL via stream
    const handleCandidateGetLinkedInUrlClick = async (candidate: any) => {
        setLoadingLinkedInUrls(prev => [...prev, candidate._id]);
        try {
            // Prefer SignalHire UID, else fallback to candidate._id
            const profileId = candidate.uid || candidate.signalHireData?.uid || candidate._id;

            const cleanup = await authService.getLinkedInUrlsStream(
                { profileIds: [profileId] },
                // onStreamData
                (data) => {
                    if (data.type === 'result') {
                        const { profileId: resProfileId, linkedinUrl, status, error } = data.data || {};
                        setFetchedCandidates(prev => prev.map(p => {
                            const matches = (p.uid && p.uid === resProfileId) || p._id === resProfileId || p.signalHireData?.uid === resProfileId;
                            if (!matches) return p;
                            if (status === 'success' && linkedinUrl) {
                                return { ...p, linkedinUrl };
                            }
                            if (status === 'no_linkedin_url_found') {
                                return { ...p, linkedinUrlStatus: 'no_url_found' };
                            }
                            if (status === 'failed') {
                                return { ...p, linkedinUrlStatus: 'failed' };
                            }
                            return p;
                        }));
                        setLoadingLinkedInUrls(prev => prev.filter(id => id !== candidate._id));
                    }
                    if (data.type === 'complete' || data.type === 'error') {
                        setLoadingLinkedInUrls(prev => prev.filter(id => id !== candidate._id));
                    }
                },
                // onError
                (err) => {
                    setLoadingLinkedInUrls(prev => prev.filter(id => id !== candidate._id));
                    toast({ title: 'LinkedIn URL Error', description: err?.message || 'Unknown error', variant: 'destructive' });
                },
                // onComplete
                () => {
                    setLoadingLinkedInUrls(prev => prev.filter(id => id !== candidate._id));
                }
            );
            // void cleanup;
        } catch (error: any) {
            setLoadingLinkedInUrls(prev => prev.filter(id => id !== candidate._id));
            toast({ title: 'Error', description: error?.message || 'Failed to get LinkedIn URL', variant: 'destructive' });
        }
    };

    // Batch: Get LinkedIn URLs for selected candidates
    const handleBatchCandidateGetLinkedInUrlsClick = async () => {
        if (selectedCandidates.size === 0) {
            toast({ title: 'No Candidates Selected', description: 'Please select at least one candidate to get LinkedIn URLs.', variant: 'destructive' });
            return;
        }

        const ids = Array.from(selectedCandidates);
        setLoadingLinkedInUrls(prev => [...prev, ...ids]);
        setLoadingBatchCandidateLinkedInUrls(true);
        try {
            const profileIds: string[] = [];
            ids.forEach(cid => {
                const p = fetchedCandidates.find(x => x._id === cid);
                if (!p) return;
                const pid = p.uid || p.signalHireData?.uid || p._id;
                profileIds.push(pid);
            });

            await authService.getLinkedInUrlsStream(
                { profileIds },
                (data) => {
                    if (data.type === 'result') {
                        const { profileId: resProfileId, linkedinUrl, status } = data.data || {};
                        setFetchedCandidates(prev => prev.map(p => {
                            const matches = (p.uid && p.uid === resProfileId) || p._id === resProfileId || p.signalHireData?.uid === resProfileId;
                            if (!matches) return p;
                            if (status === 'success' && linkedinUrl) {
                                return { ...p, linkedinUrl, linkedinUrlStatus: undefined };
                            }
                            if (status === 'no_linkedin_url_found') {
                                return { ...p, linkedinUrlStatus: 'no_url_found' };
                            }
                            if (status === 'failed') {
                                return { ...p, linkedinUrlStatus: 'failed' };
                            }
                            return p;
                        }));
                        // Clear loading for this id if we can map it back to candidate
                        const matching = fetchedCandidates.find(p => (p.uid && p.uid === resProfileId) || p._id === resProfileId || p.signalHireData?.uid === resProfileId);
                        if (matching) {
                            setLoadingLinkedInUrls(prev => prev.filter(id => id !== matching._id));
                        }
                    }
                    if (data.type === 'complete' || data.type === 'error') {
                        setLoadingLinkedInUrls(prev => prev.filter(id => !ids.includes(id)));
                        setLoadingBatchCandidateLinkedInUrls(false);
                    }
                },
                (err) => {
                    setLoadingLinkedInUrls(prev => prev.filter(id => !ids.includes(id)));
                    setLoadingBatchCandidateLinkedInUrls(false);
                    toast({ title: 'LinkedIn URL Error', description: err?.message || 'Unknown error', variant: 'destructive' });
                },
                () => {
                    setLoadingLinkedInUrls(prev => prev.filter(id => !ids.includes(id)));
                    setLoadingBatchCandidateLinkedInUrls(false);
                }
            );
        } catch (error: any) {
            setLoadingLinkedInUrls(prev => prev.filter(id => !ids.includes(id)));
            setLoadingBatchCandidateLinkedInUrls(false);
            toast({ title: 'Error', description: error?.message || 'Failed to get LinkedIn URLs', variant: 'destructive' });
        }
    };

    const handleBatchCandidateGetEmailsClick = async () => {
        if (selectedCandidates.size === 0) {
            toast({
                title: "No Candidates Selected",
                description: "Please select at least one candidate to get emails.",
                variant: "destructive"
            });
            return;
        }

        const ids = Array.from(selectedCandidates);
        setLoadingCandidateEmails(prev => [...prev, ...ids]);
        setLoadingBatchCandidateEmails(true);

        try {
            let linkedinUrls: string[] = [];
            let profileIds: string[] = [];
            let profileData: any[] = [];

            ids.forEach(cid => {
                const profile = fetchedCandidates.find(p => p._id === cid);
                if (!profile) return;

                if (profile.uid) {
                    profileIds.push(profile.uid);
                } else if (profile.signalHireData?.uid) {
                    profileIds.push(profile.signalHireData.uid);
                } else if (profile.linkedinUrl && profile.linkedinUrl.trim() !== '') {
                    linkedinUrls.push(profile.linkedinUrl);
                    const parts = (profile.name || '').trim().split(' ');
                    const firstname = parts[0] || '';
                    const lastname = parts.slice(1).join(' ') || '';
                    profileData.push({
                        linkedinUrl: profile.linkedinUrl,
                        firstname,
                        lastname,
                        domainOrCompany: profile.company || ''
                    });
                } else {
                    profileIds.push(profile._id);
                }
            });

            const payload = { linkedinUrls, profileIds, profileData } as any;

            await authService.getEmailsStream(
                payload,
                (data) => {
                    switch (data.type) {
                        case 'result': {
                            if (data.status === 'success' && data.emails && data.emails.length > 0) {
                                const emails = data.emails
                                    .map((e: any) => e?.value || e?.email)
                                    .filter((e: string) => !!e);

                                let profileToUpdate: any = null;
                                if (data.profileId) {
                                    profileToUpdate = fetchedCandidates.find(p =>
                                        p.uid === data.profileId ||
                                        p._id === data.profileId ||
                                        p.signalHireData?.uid === data.profileId
                                    );
                                } else if (data.identifier) {
                                    if (data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                        profileToUpdate = fetchedCandidates.find(p =>
                                            p.uid === data.identifier ||
                                            p._id === data.identifier ||
                                            p.signalHireData?.uid === data.identifier
                                        );
                                    }
                                    if (!profileToUpdate) {
                                        const normalizedIdentifier = normalizeLinkedInUrl(data.identifier);
                                        profileToUpdate = fetchedCandidates.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedIdentifier);
                                    }
                                } else if (data.linkedinUrl) {
                                    const normalizedLinkedInUrl = normalizeLinkedInUrl(data.linkedinUrl);
                                    profileToUpdate = fetchedCandidates.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedLinkedInUrl);
                                }

                                if (profileToUpdate) {
                                    const cid = profileToUpdate._id;
                                    setFetchedCandidates(prev => prev.map(p => (
                                        p._id === cid ? { ...p, emails, hasEmails: emails.length > 0 } : p
                                    )));
                                    setLoadingCandidateEmails(prev => prev.filter(id => id !== cid));
                                }
                            } else if (data.status === 'no_contacts' || data.noEmailsFound === true) {
                                let profileToUpdate: any = null;
                                if (data.profileId) {
                                    profileToUpdate = fetchedCandidates.find(p =>
                                        p.uid === data.profileId ||
                                        p._id === data.profileId ||
                                        p.signalHireData?.uid === data.profileId
                                    );
                                } else if (data.identifier) {
                                    if (data.identifier.length === 32 && !data.identifier.includes('linkedin.com')) {
                                        profileToUpdate = fetchedCandidates.find(p =>
                                            p.uid === data.identifier ||
                                            p._id === data.identifier ||
                                            p.signalHireData?.uid === data.identifier
                                        );
                                    }
                                    if (!profileToUpdate) {
                                        const normalizedIdentifier = normalizeLinkedInUrl(data.identifier);
                                        profileToUpdate = fetchedCandidates.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedIdentifier);
                                    }
                                } else if (data.linkedinUrl) {
                                    const normalizedLinkedInUrl = normalizeLinkedInUrl(data.linkedinUrl);
                                    profileToUpdate = fetchedCandidates.find(p => normalizeLinkedInUrl(p.linkedinUrl) === normalizedLinkedInUrl);
                                }

                                if (profileToUpdate) {
                                    const cid = profileToUpdate._id;
                                    setFetchedCandidates(prev => prev.map(p => (
                                        p._id === cid ? { ...p, emails: [], hasEmails: false, noEmailsFound: true } : p
                                    )));
                                    setLoadingCandidateEmails(prev => prev.filter(id => id !== cid));
                                }
                            }
                            break;
                        }
                        case 'complete': {
                            setLoadingCandidateEmails(prev => prev.filter(id => !ids.includes(id)));
                            setLoadingBatchCandidateEmails(false);
                            break;
                        }
                        case 'error': {
                            setLoadingCandidateEmails(prev => prev.filter(id => !ids.includes(id)));
                            setLoadingBatchCandidateEmails(false);
                            toast({
                                title: 'Email Extraction Error',
                                description: data.message || 'Failed to extract emails',
                                variant: 'destructive'
                            });
                            break;
                        }
                        default:
                            break;
                    }
                },
                (error) => {
                    setLoadingCandidateEmails(prev => prev.filter(id => !ids.includes(id)));
                    setLoadingBatchCandidateEmails(false);
                    toast({
                        title: 'Email Stream Error',
                        description: error?.message || 'Unknown error',
                        variant: 'destructive'
                    });
                },
                () => {
                    setLoadingCandidateEmails(prev => prev.filter(id => !ids.includes(id)));
                    setLoadingBatchCandidateEmails(false);
                }
            );
        } catch (error: any) {
            setLoadingCandidateEmails(prev => prev.filter(id => !ids.includes(id)));
            setLoadingBatchCandidateEmails(false);
            toast({
                title: 'Error',
                description: error?.message || 'Failed to fetch emails',
                variant: 'destructive'
            });
        }
    };

    const handleCopyCandidateUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
        toast({
            title: "URL Copied",
            description: "LinkedIn URL copied to clipboard",
        });
    };

    const handleOpenCandidateUrl = (url: string) => {
        window.open(url, '_blank');
    };

    const toggleCandidateEmailExpansion = (candidateId: string) => {
        const newExpanded = new Set(expandedCandidateEmails);
        if (newExpanded.has(candidateId)) {
            newExpanded.delete(candidateId);
        } else {
            newExpanded.add(candidateId);
        }
        setExpandedCandidateEmails(newExpanded);
    };

    const renderCandidateEmailDisplay = (candidate: any) => {
        const hasEmails = candidate.emails && candidate.emails.length > 0;
        const isExpanded = expandedCandidateEmails.has(candidate._id);
        const isLoading = loadingCandidateEmails.includes(candidate._id);

        if (isLoading) {
            return (
                <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                </div>
            );
        }

        if (!hasEmails && candidate.noEmailsFound) {
            return (
                <div className="text-xs text-gray-500 italic">No emails found</div>
            );
        }

        if (!hasEmails) {
            return (
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                        onClick={() => handleCandidateGetEmailClick(candidate)}
                    >
                        <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                            <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                        </svg>
                    </div>
                    <span
                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                        onClick={() => handleCandidateGetEmailClick(candidate)}
                    >
                        press to run
                    </span>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                <div className="text-xs text-green-600 font-medium">
                    {candidate.emails.length} email{candidate.emails.length > 1 ? 's' : ''} found
                </div>
                {isExpanded && (
                    <div className="space-y-1">
                        {candidate.emails.map((email: string, index: number) => (
                            <div key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {email}
                            </div>
                        ))}
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCandidateEmailExpansion(candidate._id)}
                    className="h-5 px-1 text-xs"
                >
                    {isExpanded ? 'Hide' : 'Show'} emails
                </Button>
            </div>
        );
    };

    const handleImportFromProject = () => {
        if (!selectedProject) {
            toast({
                title: "Select Project",
                description: "Please select a project first.",
                variant: "destructive"
            });
            return;
        }

        // Fetch profiles for the selected project via API
        (async () => {
            try {
                setLoadingCandidates(true);

                const selectedProjectMeta = availableProjects.find(p => p._id === selectedProject);
                const response = await authService.getSavedProfilesForProjects(selectedProject);

                const profiles: any[] = Array.isArray(response) ? response : [];

                const transformed = profiles.map((profile: any) => ({
                    ...profile,
                    id: profile._id,
                    emailAddress: profile.email || profile.emailAddress || '',
                    profileEvaluation: { status: 'Evaluated' },
                    relevanceScore: profile.relevanceScore || 0,
                    projectId: selectedProjectMeta ? { _id: selectedProjectMeta._id, name: selectedProjectMeta.name } : profile.projectId
                }));

                setFetchedCandidates(transformed);
                setSelectedImportMethod('project');
                toast({
                    title: "Project Prospects Loaded",
                    description: `Loaded ${transformed.length} prospects from ${selectedProjectMeta?.name || 'project'}.`,
                });
            } catch (e: any) {
                toast({ title: 'Error', description: e?.message || 'Failed to load project prospects', variant: 'destructive' });
            } finally {
                setLoadingCandidates(false);
            }
        })();
    };

    const handleManualUpload = async () => {
        if (!manualData.trim()) {
            toast({
                title: "No Data Entered",
                description: "Please enter some data in the text area.",
                variant: "destructive"
            });
            return;
        }

        try {
            setManualProcessing(true);
            const formData = new FormData();
            formData.append('rawData', manualData);

            const token = await (authService as any).getToken?.();
            const response = await fetch(`${API_BASE_URL}/search/process-csv-profiles`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const err = await response.json();
                    errorMessage = err.message || err.error || errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const results: any[] = Array.isArray(data?.results) ? data.results : [];

            const prospects = results.map((result: any, index: number) => ({
                name: result.fullName || result.csvData?.name || `Unknown ${index + 1}`,
                email: result.email || result.csvData?.email || '',
                company: result.extractedCompany || result.csvData?.company || '',
                title: result.extractedTitle || result.csvData?.title || '',
                location: result.extractedLocation || result.csvData?.location || '',
                linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || ''
            }));

            setImportedProspects(prospects);
            setProspectCount(prospects.length);
            setSelectedImportMethod('manual');

            const transformedCandidates = results.map((result: any, index: number) => {
                const syntheticId = `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
                const initialEmail = (result.email || result.csvData?.email || '').trim();
                return {
                    _id: syntheticId,
                    id: syntheticId,
                    name: result.fullName || result.csvData?.name || `Unknown ${index + 1}`,
                    title: result.extractedTitle || result.csvData?.title || '',
                    company: result.extractedCompany || result.csvData?.company || '',
                    location: result.extractedLocation || result.csvData?.location || '',
                    linkedinUrl: result.linkedinUrl || result.csvData?.linkedinUrl || '',
                    emailAddress: initialEmail,
                    emails: initialEmail ? [initialEmail] : [],
                    hasEmails: initialEmail ? true : false,
                    profileEvaluation: { status: 'Evaluated' },
                    relevanceScore: result.originalRelevanceScore || 0,
                } as any;
            });
            setFetchedCandidates(transformedCandidates);

            toast({
                title: "Manual Data Processed",
                description: `Processed ${prospects.length} prospects via AI`,
            });
        } catch (e: any) {
            toast({
                title: 'Manual processing failed',
                description: e?.message || 'Failed to process manual data.',
                variant: 'destructive'
            });
        } finally {
            setManualProcessing(false);
        }
    };

    const downloadSampleCSV = () => {
        const csvContent = "Name,Email,Company,Title,Location\nJohn Doe,john@example.com,Example Corp,Manager,New York\nJane Smith,jane@sample.com,Sample Inc,Director,California";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_prospects.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCreateCampaign = async () => {
        try {
            setIsLoading(true);

            // Find the selected email account ID from any email step
            let selectedEmailAccountId = null;
            for (const node of campaignFlow) {
                if (node.stepType === 'email' && node.content?.emailAddresses?.length > 0) {
                    const selectedEmail = node.content.emailAddresses[0];
                    const emailAccount = emailAccounts.find(account => account.email === selectedEmail);
                    if (emailAccount) {
                        selectedEmailAccountId = emailAccount.id;
                        break;
                    }
                }
            }

            console.log('importedProspects before mapping:', importedProspects);

            const payload = {
                name: campaignName,
                description: campaignDescription,
                emailAccountId: selectedEmailAccountId,
                // Prospects in backend expect: name, email, company, position, linkedin
                prospects: importedProspects.map(prospect => {
                    console.log('Processing prospect:', prospect);
                    return {
                        name: prospect.name || '',
                        email: prospect.email || '',
                        company: prospect.company || '',
                        position: prospect.title || '',
                        linkedin: prospect.linkedinUrl || prospect.linkedin || ''
                    };
                }),
                // Sequence nodes: pass through with content fields
                sequence: campaignFlow.map(node => ({
                    id: node.id,
                    stepType: node.type === 'condition' ? node.conditionType : node.stepType,
                    x: node.position.x,
                    y: node.position.y,
                    parentId: (node as any).parentId,
                    parentBranch: (node as any).parentBranch,
                    content: {
                        subject: node.content?.subject,
                        message: node.content?.message,
                        taskTitle: node.content?.taskTitle,
                        taskDescription: node.content?.taskDescription,
                        priority: node.content?.priority,
                        dueDays: node.content?.dueDays,
                        dueDate: node.content?.dueDate,
                        delay: node.content?.delay ?? 0,
                        delayUnit: node.content?.delayUnit || 'hours',
                        emailAddresses: node.content?.emailAddresses || [],
                        attachments: node.content?.attachments || [],
                        variables: node.content?.variables || [],
                        linkedinUrl: node.content?.linkedinUrl
                    }
                })),
                // Include LinkedIn settings if they exist
                ...(createCampaignSettings && Object.keys(createCampaignSettings).length > 0 && {
                    linkedinSettings: createCampaignSettings
                })
            };

            const created = await authService.createCampaign(payload);


            toast({
                title: "Campaign Created",
                description: `Campaign "${created?.name || campaignName}" has been created successfully.`,
            });

            // If user selected immediate, activate and start the campaign
            if (schedulingOption === 'immediate' && created?._id) {
                try {
                    await authService.updateCampaign(created._id, { status: 'active' });
                    await authService.startCampaign(created._id);
                } catch (e) {
                    // Non-blocking: show info toast
                    toast({ title: 'Launch Info', description: 'Campaign created; activation/start may have partially failed. You can activate from the list.', });
                }
            }

            resetCreateForm();
            setIsCreateMode(false);
            loadCampaigns(); // Reload campaigns to show the new one
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast({
                title: "Error",
                description: "Failed to create campaign. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCampaign = (campaign: APICampaign) => {
        // Load campaign data into the form
        setCampaignName(campaign.name);
        setCampaignDescription(campaign.description || '');

        // Load the campaign sequence into the visual builder
        if (campaign.sequence && campaign.sequence.length > 0) {
            // Define condition types
            const conditionTypes = ['email-opened', 'email-reply', 'linkedin-connection-check', 'opened-linkedin-message', 'linkedin-reply-check', 'clicked-link', 'has-linkedin', 'has-email', 'has-phone'];

            const convertedFlow = campaign.sequence.map((step, index) => {
                const isCondition = conditionTypes.includes(step.stepType);

                return {
                    id: step.id,
                    type: isCondition ? 'condition' as const : 'step' as const,
                    stepType: isCondition ? undefined : step.stepType,
                    conditionType: isCondition ? step.stepType : undefined,
                    title: step.stepType === 'email' ? 'Email' :
                        step.stepType === 'linkedin-message' ? 'LinkedIn Message' :
                            step.stepType === 'linkedin-invitation' ? 'LinkedIn Invitation' :
                                step.stepType === 'linkedin-visit' ? 'LinkedIn Visit' :
                                    step.stepType === 'manual-task' ? 'Manual Task' :
                                        step.stepType === 'email-opened' ? 'Email opened?' :
                                            step.stepType === 'email-reply' ? 'Email replied?' :
                                                step.stepType === 'linkedin-connection-check' ? 'LinkedIn connected?' :
                                                    step.stepType === 'opened-linkedin-message' ? 'LinkedIn message opened?' :
                                                        step.stepType === 'linkedin-reply-check' ? 'LinkedIn replied?' :
                                                            step.stepType === 'clicked-link' ? 'Clicked link?' :
                                                                step.stepType === 'has-linkedin' ? 'Has LinkedIn?' :
                                                                    step.stepType === 'has-email' ? 'Has Email?' :
                                                                        step.stepType === 'has-phone' ? 'Has Phone?' : 'Step',
                    position: { x: step.x || 132, y: step.y || (index * 180) },
                    connections: [], // Will be rebuilt based on actual flow relationships
                    branchConnections: isCondition ? { yes: [], no: [] } : undefined,
                    parentId: step.parentId,
                    parentBranch: step.parentBranch || 'main',
                    content: step.content
                };
            });

            // Rebuild branch connections for conditions
            convertedFlow.forEach(node => {
                if (node.type === 'condition') {
                    // Find all nodes that have this condition as parent
                    campaign.sequence.forEach(step => {
                        if (step.parentId === node.id) {
                            if (step.parentBranch === 'yes') {
                                node.branchConnections!.yes.push(step.id);
                            } else if (step.parentBranch === 'no') {
                                node.branchConnections!.no.push(step.id);
                            }
                        }
                    });
                }
            });

            // Clear connections for all nodes that are on condition branches (Yes/No)
            campaign.sequence.forEach(step => {
                if (step.parentId && step.parentBranch === 'main') {
                    // Find the parent node and add connection to this child
                    const parentNode = convertedFlow.find(n => n.id === step.parentId);
                    if (parentNode && parentNode.type !== 'condition') {
                        // Only add main flow connections for non-condition parents
                        parentNode.connections.push(step.id);
                    }
                }
            });

            setCampaignFlow(convertedFlow);
            setIsVisualBuilderMode(true);
            setSelectedFirstStep(campaign.sequence[0].stepType || 'email');
        }

        // Load prospects
        if (campaign.prospects && campaign.prospects.length > 0) {
            setImportedProspects(campaign.prospects.map(prospect => ({
                name: prospect.name || '',
                email: prospect.email || '',
                company: prospect.company || '',
                title: prospect.position || '',
                linkedinUrl: prospect.linkedin || '',
                phone: prospect.phone || ''
            })));
            setProspectCount(campaign.prospects.length);
            setSelectedImportMethod('project'); // Default method for existing campaign
        }

        // Set status
        setSchedulingOption(campaign.status === 'draft' ? 'draft' : 'immediate');

        // Enter edit mode
        setIsCreateMode(true);
        setCurrentStep(1);

        // Store the campaign ID for updating instead of creating
        setEditingCampaignId(campaign._id);
    };

    const handleDuplicateCampaign = async (campaign: APICampaign) => {
        try {
            setIsLoading(true);

            const response = await authService.duplicateCampaign(campaign._id);

            toast({
                title: "Campaign Duplicated",
                description: response.message || `Campaign "${campaign.name}" has been duplicated successfully.`,
            });

            loadCampaigns(); // Reload campaigns to show the duplicate
        } catch (error: any) {
            console.error('Error duplicating campaign:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to duplicate campaign. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCampaignSettings = async (campaign: APICampaign) => {
        setSelectedCampaignForSettings(campaign);
        setIsSettingsModalOpen(true);
        setIsLoadingSettings(true);

        try {
            // Fetch campaign settings
            const settingsResponse = await authService.getCampaignSettings(campaign._id);
            if (settingsResponse && settingsResponse.data) {
                setCampaignSettings(settingsResponse.data.settings);
            }

            // Fetch timezones and presets if not already loaded
            if (!timezones) {
                setIsTimezonesLoading(true);
                try {
                    const timezonesResponse = await authService.getTimezones();
                    if (timezonesResponse && timezonesResponse.data) {
                        setTimezones(timezonesResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching timezones:', err);
                } finally {
                    setIsTimezonesLoading(false);
                }
            }

            if (!safetyPresets) {
                setIsPresetsLoading(true);
                try {
                    const presetsResponse = await authService.getCampaignPresets();
                    if (presetsResponse && presetsResponse.data) {
                        setSafetyPresets(presetsResponse.data);
                    }
                } catch (err) {
                    console.error('Error fetching campaign presets:', err);
                } finally {
                    setIsPresetsLoading(false);
                }
            }
        } catch (error: any) {
            console.error('Error fetching campaign settings:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to load campaign settings.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingSettings(false);
        }
    };

    // Campaign settings helper functions
    const updateCampaignSetting = (path: string, value: any) => {
        setCampaignSettings((prev: any) => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    // Helper functions for create campaign settings
    const updateCreateCampaignSetting = (path: string, value: any) => {
        setCreateCampaignSettings((prev: any) => {
            const keys = path.split('.');
            const newSettings = prev ? { ...prev } : {};
            let current = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    const handleSaveCreateCampaignSettings = async () => {
        setShowCreateCampaignSettings(false);
        toast({
            title: "Settings Saved",
            description: "Campaign settings have been saved and will be applied when the campaign is created.",
        });
    };

    const handleCreateCampaignPresetApply = async (presetKey: string) => {
        try {
            // For create mode, apply preset values directly from safetyPresets data
            if (safetyPresets && safetyPresets[presetKey]) {
                const preset = safetyPresets[presetKey];

                // Create new settings with preset values
                const newSettings = {
                    ...createCampaignSettings, // Keep existing settings as base
                    safetyPreset: presetKey,
                };

                // Apply delaySettings if they exist in the preset
                if (preset.delaySettings) {
                    newSettings.delaySettings = {
                        ...createCampaignSettings?.delaySettings, // Keep existing as fallback
                        invitations: preset.delaySettings.invitations ?
                            { ...preset.delaySettings.invitations } :
                            createCampaignSettings?.delaySettings?.invitations || {},
                        messages: preset.delaySettings.messages ?
                            { ...preset.delaySettings.messages } :
                            createCampaignSettings?.delaySettings?.messages || {}
                    };
                }

                // Apply workingHours if they exist in the preset
                if (preset.workingHours) {
                    newSettings.workingHours = {
                        ...createCampaignSettings?.workingHours, // Keep existing as fallback
                        ...preset.workingHours
                    };
                }

                // Update the create campaign settings state
                setCreateCampaignSettings(newSettings);

                toast({
                    title: "Preset Applied",
                    description: `${preset.name || presetKey} preset has been applied to campaign settings.`,
                });
            } else {
                throw new Error(`Preset "${presetKey}" not found`);
            }
        } catch (error) {
            console.error('Error applying preset:', error);
            toast({
                title: "Error",
                description: "Failed to apply preset. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleSaveCampaignSettings = async () => {
        if (!campaignSettings || !selectedCampaignForSettings) return;

        setIsSavingSettings(true);
        try {
            console.log('Saving campaign settings:', campaignSettings);
            const response = await authService.updateCampaignSettings(selectedCampaignForSettings._id, campaignSettings);

            if (response && response.success) {
                toast({
                    title: "Settings Updated",
                    description: response.message || `Settings for "${selectedCampaignForSettings.name}" have been updated successfully.`,
                });

                // Update local state with the response data from data.settings
                if (response.data && response.data.settings) {
                    setCampaignSettings(response.data.settings);
                }
            } else {
                throw new Error(response?.message || 'Failed to update campaign settings');
            }
        } catch (err: any) {
            console.error('Error saving campaign settings:', err);
            toast({
                title: "Error",
                description: err.message || 'Failed to save campaign settings.',
                variant: "destructive"
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const applyPreset = async (presetKey: string) => {
        if (isApplyingPreset || !selectedCampaignForSettings) return;

        setIsApplyingPreset(true);
        try {
            const response = await authService.applyCampaignPreset(selectedCampaignForSettings._id, presetKey);
            console.log('Campaign preset response:', response); // Debug logging

            if (response && response.success && response.data && response.data.settings) {
                const responseData = response.data.settings;

                // Safely extract data with fallbacks
                const newSettings = {
                    ...campaignSettings, // Keep existing settings as base
                    safetyPreset: responseData.safetyPreset || presetKey,
                };

                // Safely update delaySettings if they exist
                if (responseData.delaySettings) {
                    newSettings.delaySettings = {
                        ...campaignSettings?.delaySettings, // Keep existing as fallback
                        invitations: responseData.delaySettings.invitations ?
                            { ...responseData.delaySettings.invitations } :
                            campaignSettings?.delaySettings?.invitations || {},
                        messages: responseData.delaySettings.messages ?
                            { ...responseData.delaySettings.messages } :
                            campaignSettings?.delaySettings?.messages || {}
                    };
                }

                // Safely update workingHours if they exist
                if (responseData.workingHours) {
                    newSettings.workingHours = {
                        ...campaignSettings?.workingHours, // Keep existing as fallback
                        ...responseData.workingHours
                    };
                }

                setCampaignSettings(newSettings);

                toast({
                    title: "Preset Applied",
                    description: response.message || `Applied ${presetKey} preset to "${selectedCampaignForSettings.name}" successfully`,
                });
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            console.error('Error applying campaign preset:', error);
            toast({
                title: "Error",
                description: error.message || 'Failed to apply campaign preset',
                variant: "destructive"
            });

            // Fallback to local preset application if API fails
            if (safetyPresets && safetyPresets[presetKey]) {
                const preset = safetyPresets[presetKey];
                console.log('Applying local preset fallback:', preset); // Debug logging

                const fallbackSettings = {
                    ...campaignSettings,
                    safetyPreset: presetKey,
                };

                // Safely apply local preset data
                if (preset.delaySettings) {
                    fallbackSettings.delaySettings = {
                        ...campaignSettings?.delaySettings,
                        invitations: preset.delaySettings.invitations ?
                            { ...preset.delaySettings.invitations } :
                            campaignSettings?.delaySettings?.invitations || {},
                        messages: preset.delaySettings.messages ?
                            { ...preset.delaySettings.messages } :
                            campaignSettings?.delaySettings?.messages || {}
                    };
                }

                if (preset.workingHours) {
                    fallbackSettings.workingHours = {
                        ...campaignSettings?.workingHours,
                        ...preset.workingHours
                    };
                }

                setCampaignSettings(fallbackSettings);
            }
        } finally {
            setIsApplyingPreset(false);
        }
    };

    const handleUpdateCampaign = async () => {
        if (!editingCampaignId) return;

        try {
            setIsLoading(true);

            const updateData = {
                name: campaignName,
                description: campaignDescription,
                sequence: campaignFlow.map(node => ({
                    id: node.id,
                    stepType: node.type === 'condition' ? node.conditionType : node.stepType,
                    parentId: (node as any).parentId,
                    parentBranch: (node as any).parentBranch,
                    content: {
                        subject: node.content?.subject,
                        message: node.content?.message,
                        taskTitle: node.content?.taskTitle,
                        taskDescription: node.content?.taskDescription,
                        priority: node.content?.priority,
                        dueDays: node.content?.dueDays,
                        dueDate: node.content?.dueDate,
                        delay: node.content?.delay ?? 0,
                        delayUnit: node.content?.delayUnit || 'hours',
                        emailAddresses: node.content?.emailAddresses || [],
                        linkedinAccount: node.content?.linkedinAccount,
                        attachments: node.content?.attachments || [],
                        variables: node.content?.variables || [],
                        x: node.position?.x,
                        y: node.position?.y
                    },
                    x: node.position?.x,
                    y: node.position?.y
                })),
                prospects: importedProspects.map(prospect => ({
                    name: prospect.name || '',
                    email: prospect.email || '',
                    company: prospect.company || '',
                    position: prospect.title || '',
                    linkedin: prospect.linkedinUrl || '',
                    phone: prospect.phone || ''
                }))
            };

            // Check if campaign is paused and can be edited using paused-update endpoint
            // The paused-update endpoint allows editing campaign sequences while the campaign is paused
            const editStatus = await getCampaignEditStatus(editingCampaignId);
            const isPausedAndEditable = editStatus?.editStatus?.campaignStatus === 'paused' && editStatus?.editStatus?.canEdit;

            if (isPausedAndEditable) {
                // Use paused-update endpoint for paused campaigns - only sequence can be updated
                const pausedUpdateData = {
                    sequence: updateData.sequence
                };
                await authService.updatePausedCampaign(editingCampaignId, pausedUpdateData);
            } else {
                // Use regular update endpoint for draft/other campaigns
                await authService.updateCampaign(editingCampaignId, updateData);
            }

            // Handle scheduling option change
            if (schedulingOption === 'immediate') {
                await authService.startCampaign(editingCampaignId);
            } else if (schedulingOption === 'scheduled') {
                // For scheduled campaigns, keep them paused until the scheduled time
                await authService.pauseCampaign(editingCampaignId);
            }

            toast({
                title: "Campaign Updated",
                description: `Campaign "${campaignName}" has been updated successfully.`,
            });

            resetCreateForm();
            setIsCreateMode(false);
            setEditingCampaignId(null);
            loadCampaigns(); // Reload campaigns to show the updates
        } catch (error) {
            console.error('Error updating campaign:', error);
            toast({
                title: "Error",
                description: "Failed to update campaign. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetCreateForm = () => {
        setCurrentStep(1);
        setCampaignName('');
        setCampaignDescription('');
        setEmailSequences([{ id: '1', subject: '', content: '', delay: 0, type: 'initial' }]);
        setSchedulingOption('immediate');
        setProspectCount(0);
        setImportedProspects([]);
        setSelectedImportMethod(null);
        setManualData('');
        setSelectedProject('');
        setSelectedCandidatesSource('');
        setCampaignFlow([]);
        setIsVisualBuilderMode(false);
        setSelectedFirstStep(null);
        setEditingCampaignId(null);

        // Clear create campaign settings
        setShowCreateCampaignSettings(false);
        setCreateCampaignSettings(null);

        // ADD THESE LINES TO CLEAR CANDIDATES-RELATED STATES:
        setFetchedCandidates([]);
        setSelectedCandidates(new Set());
        setLoadingCandidates(false);

        // Clear analysis states
        setAnalyzingCandidates(new Set());
        setIsAnalysisCriteriaModalOpen(false);
        setDeepAnalysisSelectedCandidateId(null);
        setDeepAnalysisSelectedCandidate(null);
        setDeepAnalysisSelectedCandidateIds([]);
        setIsDeepAnalysisModalOpen(false);
        setDeepAnalysisResultsMap({});
        setIsAnalyzing(false);

        // Clear email and LinkedIn states
        setLoadingCandidateEmails([]);
        setLoadingLinkedInUrls([]);
        setLoadingBatchCandidateEmails(false);
        setLoadingBatchCandidateLinkedInUrls(false);
        setExpandedCandidateEmails(new Set());
        setCopiedUrl(null);

        // Clear processing states
        setCsvProcessing(false);
        setManualProcessing(false);

        // Clear editor states
        setSelectedNodeForEdit(null);
    };

    const handleToggleCampaignStatus = async (id: string) => {
        try {
            setIsLoading(true);

            const campaign = campaigns.find(c => c._id === id);
            if (!campaign) return;

            const newStatus = campaign.status === 'active' ? 'paused' : 'active';

            if (newStatus === 'active') {
                await campaignAPI.startCampaign(id);
            } else {
                await campaignAPI.pauseCampaign(id);
            }

            toast({
                title: `Campaign ${newStatus === 'active' ? 'Started' : 'Paused'}`,
                description: `Campaign "${campaign.name}" has been ${newStatus === 'active' ? 'started' : 'paused'}.`,
            });

            loadCampaigns(); // Reload to get updated status
        } catch (error) {
            console.error('Error toggling campaign status:', error);
            toast({
                title: "Error",
                description: "Failed to update campaign status. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        try {
            await authService.deleteCampaign(id);

            toast({
                title: "Campaign Deleted",
                description: "The campaign has been deleted successfully.",
            });

            setDeleteConfirmId(null);
            loadCampaigns(); // Reload to reflect the deletion
        } catch (error: any) {
            console.error('Error deleting campaign:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to delete campaign. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handlePauseCampaign = async (id: string) => {
        try {
            const response = await authService.pauseCampaign(id);

            toast({
                title: "Campaign Paused",
                description: response?.message || "The campaign has been paused successfully.",
            });

            // Refresh the campaign edit status to update the UI
            if (selectedCampaign && selectedCampaign._id === id) {
                const editStatusData = await getCampaignEditStatus(id);
                setCampaignEditStatus(editStatusData.editStatus);
            }

            // Reload campaigns to reflect the status change
            loadCampaigns();
        } catch (error: any) {
            console.error('Error pausing campaign:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to pause campaign. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleResumeCampaign = async (id: string) => {
        try {
            const response = await authService.resumeCampaign(id);

            toast({
                title: "Campaign Resumed",
                description: response?.message || "The campaign has been resumed successfully.",
            });

            // Refresh the campaign edit status to update the UI
            if (selectedCampaign && selectedCampaign._id === id) {
                const editStatusData = await getCampaignEditStatus(id);
                setCampaignEditStatus(editStatusData.editStatus);
            }

            // Reload campaigns to reflect the status change
            loadCampaigns();
        } catch (error: any) {
            console.error('Error resuming campaign:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to resume campaign. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleSelectCampaign = (campaignId: string) => {
        setSelectedCampaignIds(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    };

    const handleNodeEdit = (nodeId: string) => {
        const node = campaignFlow.find(n => n.id === nodeId);
        if (node) {
            setSelectedNodeForEdit(nodeId);
            setEditingNodeContent(node.content || {});

            // Show informational toast for read-only mode
            if (!campaignEditStatus?.canEdit) {
                toast({
                    title: "Read-Only Mode",
                    description: "Campaign is active. Pause the campaign to make changes.",
                    variant: "default"
                });
            }
        }
    };

    const handleNodeContentChange = (field: string, value: any) => {
        setEditingNodeContent((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveNodeChanges = async () => {
        if (!selectedNodeForEdit || !selectedCampaign || !editingNodeContent) return;

        // Check if campaign can be edited before making any API calls
        if (!campaignEditStatus?.canEdit) {
            toast({
                title: "Cannot Save Changes",
                description: campaignEditStatus?.message || "This campaign cannot be edited in its current state. Please pause the campaign first to save changes.",
                variant: "destructive"
            });
            return;
        }
        try {
            setIsSavingNode(true);

            // Update the node in the campaign flow
            const updatedFlow = campaignFlow.map(node => {
                if (node.id === selectedNodeForEdit) {
                    return {
                        ...node,
                        content: editingNodeContent
                    };
                }
                return node;
            });

            // Prepare the sequence data for the API
            const sequenceData = updatedFlow.map(node => ({
                id: node.id,
                stepType: node.type === 'condition' ? node.conditionType : node.stepType,
                parentId: (node as any).parentId,
                parentBranch: (node as any).parentBranch,
                content: {
                    subject: node.content?.subject,
                    message: node.content?.message,
                    taskTitle: node.content?.taskTitle,
                    taskDescription: node.content?.taskDescription,
                    priority: node.content?.priority,
                    dueDays: node.content?.dueDays,
                    dueDate: node.content?.dueDate,
                    delay: node.content?.delay ?? 0,
                    delayUnit: node.content?.delayUnit || 'hours',
                    emailAddresses: node.content?.emailAddresses || [],
                    linkedinAccount: node.content?.linkedinAccount,
                    attachments: node.content?.attachments || [],
                    variables: node.content?.variables || []
                },
                x: node.position?.x,
                y: node.position?.y
            }));

            // Check if campaign is paused and can be edited
            const editStatus = await getCampaignEditStatus(selectedCampaign._id);
            const isPausedAndEditable = editStatus?.editStatus?.campaignStatus === 'paused' && editStatus?.editStatus?.canEdit;

            if (isPausedAndEditable) {
                // Use paused-update endpoint for paused campaigns
                await authService.updatePausedCampaign(selectedCampaign._id, {
                    sequence: sequenceData
                });
            } else {
                // For draft campaigns, use regular update
                await authService.updateCampaign(selectedCampaign._id, {
                    sequence: sequenceData
                });
            }

            // Update the local campaign flow state
            setCampaignFlow(updatedFlow);

            toast({
                title: "Node Updated",
                description: "The campaign step has been updated successfully.",
            });

        } catch (error: any) {
            console.error('Error saving node changes:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to save changes. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSavingNode(false);
        }
    };

    const handleCancelNodeEdit = () => {
        setEditingNodeContent(null);
        setSelectedNodeForEdit(null);
    };

    const handleSelectAllCampaigns = () => {
        if (selectedCampaignIds.length === campaigns.length) {
            setSelectedCampaignIds([]);
        } else {
            setSelectedCampaignIds(campaigns.map(campaign => campaign._id));
        }
    };

    const handleBulkStart = async () => {
        try {
            await campaignAPI.bulkAction('start', selectedCampaignIds);

            toast({
                title: "Campaigns Started",
                description: `${selectedCampaignIds.length} campaign(s) have been started.`,
            });

            setSelectedCampaignIds([]);
            loadCampaigns(); // Reload to reflect the changes
        } catch (error) {
            console.error('Error starting campaigns:', error);
            toast({
                title: "Error",
                description: "Failed to start campaigns. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleBulkPause = async () => {
        try {
            await campaignAPI.bulkAction('pause', selectedCampaignIds);

            toast({
                title: "Campaigns Paused",
                description: `${selectedCampaignIds.length} campaign(s) have been paused.`,
            });

            setSelectedCampaignIds([]);
            loadCampaigns(); // Reload to reflect the changes
        } catch (error) {
            console.error('Error pausing campaigns:', error);
            toast({
                title: "Error",
                description: "Failed to pause campaigns. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleBulkDeleteCampaigns = async () => {
        try {
            await campaignAPI.bulkAction('delete', selectedCampaignIds);

            toast({
                title: "Campaigns Deleted",
                description: `${selectedCampaignIds.length} campaign(s) have been deleted.`,
            });

            setSelectedCampaignIds([]);
            loadCampaigns(); // Reload to reflect the deletions
        } catch (error) {
            console.error('Error deleting campaigns:', error);
            toast({
                title: "Error",
                description: "Failed to delete campaigns. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle prospect click to show detailed information
    const handleProspectClick = async (prospect: any) => {
        if (!selectedCampaign) return;

        setIsLoadingProspectDetail(true);
        setIsProspectDetailModalOpen(true);

        try {
            const response = await authService.getProspectDetail(selectedCampaign._id, prospect._id);
            setSelectedProspectDetail(response.prospect);
        } catch (error) {
            console.error('Error fetching prospect details:', error);
            toast({
                title: "Error",
                description: "Failed to load prospect details. Please try again.",
                variant: "destructive"
            });
            setIsProspectDetailModalOpen(false);
        } finally {
            setIsLoadingProspectDetail(false);
        }
    };

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return campaignName.trim() !== '';
            case 2:
                return prospectCount > 0;
            case 3:
                return campaignFlow.length > 0;
            case 4:
                return true;
            default:
                return false;
        }
    };

    // Zoom and Pan handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const deltaY = e.deltaY;
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.1), 3));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && !isDragging) { // Left mouse button and not dragging a node
            setIsPanning(true);
            setLastPanPoint({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Handle node dragging first
        if (isDragging && draggingNodeId) {
            handleNodeMouseMove(e);
        }
        // Then handle canvas panning
        else if (isPanning) {
            const deltaX = e.clientX - lastPanPoint.x;
            const deltaY = e.clientY - lastPanPoint.y;
            setCanvasOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
            setLastPanPoint({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setIsDragging(false);
        setDraggingNodeId(null);
    };

    const resetView = () => {
        setZoom(1);
        setCanvasOffset({ x: 0, y: 0 });
    };

    // Node drag handlers
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation(); // Prevent canvas panning
        setDraggingNodeId(nodeId);
        setIsDragging(true);

        const node = campaignFlow.find(n => n.id === nodeId);
        if (node) {
            // Store initial mouse position and node position
            setDragOffset({
                x: e.clientX,
                y: e.clientY
            });
            setLastPanPoint({ x: node.position.x, y: node.position.y }); // Reuse for initial node position
        }
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        if (isDragging && draggingNodeId) {
            e.preventDefault();

            // Calculate mouse movement delta in screen coordinates
            const deltaX = e.clientX - dragOffset.x;
            const deltaY = e.clientY - dragOffset.y;

            // Convert delta to canvas coordinates by dividing by zoom
            const canvasDeltaX = deltaX / zoom;
            const canvasDeltaY = deltaY / zoom;

            // Apply delta to initial node position
            const newX = lastPanPoint.x + canvasDeltaX;
            const newY = lastPanPoint.y + canvasDeltaY;

            setCampaignFlow(prev => prev.map(node =>
                node.id === draggingNodeId
                    ? { ...node, position: { x: newX, y: newY } }
                    : node
            ));
        }
    };

    const handleNodeMouseUp = () => {
        setIsDragging(false);
        setDraggingNodeId(null);
        setDragOffset({ x: 0, y: 0 });
    };

    const addStepToFlow = (stepType: string, nodeType: 'step' | 'condition', parentId?: string, parentBranch?: 'main' | 'yes' | 'no') => {
        const newNodeId = String(Date.now()); // Use timestamp for unique IDs
        const stepConfig = {
            email: { title: 'Email', icon: Mail },
            'linkedin-message': { title: 'LinkedIn Message', icon: Send, description: 'Send message on LinkedIn' },
            'linkedin-invitation': { title: 'LinkedIn Invitation', icon: Users, description: 'Send invitation on LinkedIn' },
            'linkedin-visit': { title: 'LinkedIn Visit', icon: Eye, description: 'Visit profile on LinkedIn' },
            'manual-task': { title: 'Manual Task', icon: Edit, description: 'Create manual task' },
            'email-opened': { title: 'Email opened?', icon: GitBranch, description: 'Check if email was opened' },
            'email-reply': { title: 'Email replied?', icon: GitBranch, description: 'Check if email was replied to' },
            'linkedin-connection-check': { title: 'LinkedIn connected?', icon: GitBranch, description: 'Check if already connected on LinkedIn' },
            'opened-linkedin-message': { title: 'LinkedIn message opened?', icon: GitBranch, description: 'Check if LinkedIn message was opened' },
            'linkedin-reply-check': { title: 'LinkedIn replied?', icon: GitBranch, description: 'Check if LinkedIn message was replied to' },
            'clicked-link': { title: 'Clicked link?', icon: GitBranch, description: 'Check if link was clicked' },
            'has-linkedin': { title: 'Has LinkedIn?', icon: GitBranch, description: 'Check if prospect has LinkedIn profile' },
            'has-email': { title: 'Has Email?', icon: GitBranch, description: 'Check if prospect has email address' },
            'has-phone': { title: 'Has Phone?', icon: GitBranch, description: 'Check if prospect has phone number' }
        };

        const config = stepConfig[stepType] || stepConfig.email;

        // Calculate position based on flow structure
        let position = { x: 100, y: 100 };
        if (parentId) {
            const parentNode = campaignFlow.find(n => n.id === parentId);
            if (parentNode) {
                if (nodeType === 'condition' || parentNode.type === 'condition') {
                    // For conditions, position based on branch
                    const parentPos = parentNode?.position || { x: 0, y: 0 };
                    const baseY = (parentPos.y ?? 0) + 180;
                    if (parentBranch === 'yes') {
                        position = { x: (parentPos.x ?? 0) - 200, y: baseY };
                    } else if (parentBranch === 'no') {
                        position = { x: (parentPos.x ?? 0) + 200, y: baseY };
                    } else {
                        position = { x: (parentPos.x ?? 0), y: baseY };
                    }
                } else {
                    // Regular step, position below parent
                    const parentPos = parentNode?.position || { x: 0, y: 0 };
                    position = { x: (parentPos.x ?? 0), y: (parentPos.y ?? 0) + 180 };
                }
            }
        } else if (campaignFlow.length > 0) {
            // If no parent specified, add at the end of the main flow
            const lastNode = campaignFlow[campaignFlow.length - 1];
            const lastPos = lastNode?.position || { x: 0, y: 0 };
            position = { x: (lastPos.x ?? 0), y: (lastPos.y ?? 0) + 180 };
        }

        const newNode: FlowNode = {
            id: newNodeId,
            type: nodeType,
            stepType: nodeType === 'step' ? stepType as FlowNode['stepType'] : undefined,
            conditionType: nodeType === 'condition' ? stepType : undefined,
            title: config.title,
            description: config.description,
            position,
            connections: [],
            branchConnections: nodeType === 'condition' ? { yes: [], no: [] } : undefined,
            parentId,
            parentBranch: parentBranch || 'main',
            content: {
                subject: (nodeType === 'step' && (stepType === 'email' || stepType === 'manual-task')) ? '' : undefined,
                message: (nodeType === 'step' && stepType !== 'manual-task') ? '' : undefined,
                taskTitle: (nodeType === 'step' && stepType === 'manual-task') ? '' : undefined,
                taskDescription: (nodeType === 'step' && stepType === 'manual-task') ? '' : undefined,
                priority: (nodeType === 'step' && stepType === 'manual-task') ? 'medium' : undefined,
                dueDays: (nodeType === 'step' && stepType === 'manual-task') ? undefined : undefined,
                dueDate: (nodeType === 'step' && stepType === 'manual-task') ? undefined : undefined,
                emailAddresses: (nodeType === 'step' && stepType === 'email') ? [] : undefined,
                linkedinAccount: (nodeType === 'step' && stepType === 'linkedin-message') ? '' : undefined,
                delay: 0,
                delayUnit: 'hours',
                attachments: [],
                variables: []
            }
        };

        // Update parent node connections
        if (parentId) {
            setCampaignFlow(prev => prev.map(node => {
                if (node.id === parentId) {
                    if (node.type === 'condition') {
                        const updatedNode = { ...node };
                        if (parentBranch === 'yes') {
                            updatedNode.branchConnections!.yes = [...(updatedNode.branchConnections!.yes || []), newNodeId];
                        } else if (parentBranch === 'no') {
                            updatedNode.branchConnections!.no = [...(updatedNode.branchConnections!.no || []), newNodeId];
                        }
                        return updatedNode;
                    } else {
                        return { ...node, connections: [...node.connections, newNodeId] };
                    }
                }
                return node;
            }));
        }

        setCampaignFlow(prev => [...prev, newNode]);
        setShowStepSelector(false);
    };

    const updateNodeContent = (nodeId: string, content: Partial<FlowNode['content']>) => {
        setCampaignFlow(prev => prev.map(node =>
            node.id === nodeId
                ? { ...node, content: { ...node.content, ...content } }
                : node
        ));

        // Auto-update variables when subject or message changes
        if (content.subject !== undefined || content.message !== undefined) {
            setTimeout(() => updateNodeVariables(nodeId), 50);
        }
    };

    // Helpers to extract and update variables used in a node's subject/message
    const extractVariablesFromText = (text: string): string[] => {
        const variableRegex = /\{\{([\w]+)\}\}/g;
        const found = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = variableRegex.exec(text)) !== null) {
            const rawKey = match[1];
            const normalizedKey = (variableAliasMap as any)[rawKey] || rawKey;
            if (allowedVariableKeys.has(normalizedKey)) {
                found.add(normalizedKey);
            }
        }
        return Array.from(found);
    };

    const updateNodeVariables = (nodeId: string) => {
        const node = campaignFlow.find(n => n.id === nodeId);
        if (!node?.content) return;
        const subjectText = node.content.subject || '';
        const messageText = node.content.message || '';
        const merged = `${subjectText} ${messageText}`;
        const extracted = extractVariablesFromText(merged);
        // Write back only if changed
        const current = node.content.variables || [];
        const changed = JSON.stringify([...current].sort()) !== JSON.stringify([...extracted].sort());
        if (changed) {
            setCampaignFlow(prev => prev.map(n =>
                n.id === nodeId
                    ? { ...n, content: { ...n.content, variables: extracted } }
                    : n
            ));
        }
    };

    const insertVariable = (nodeId: string, variableKey: string, field: 'message' | 'subject') => {
        const variable = `{{${variableKey}}}`;
        const selectedNode = campaignFlow.find(n => n.id === nodeId);
        if (!selectedNode?.content) return;

        const currentValue = field === 'message' ? (selectedNode.content.message || '') : (selectedNode.content.subject || '');
        const newValue = currentValue + variable;

        updateNodeContent(nodeId, { [field]: newValue });
        // Recalculate variables after insertion
        setTimeout(() => updateNodeVariables(nodeId), 0);
    };

    const handleFileUpload = (nodeId: string, files: FileList | null, fileType?: 'all' | 'images' | 'documents') => {
        if (!files) return;

        const newAttachments = Array.from(files).map(file => ({
            id: String(Date.now() + Math.random()),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            category: file.type.startsWith('image/') ? 'image' : 'document'
        }));

        const selectedNode = campaignFlow.find(n => n.id === nodeId);
        const existingAttachments = selectedNode?.content?.attachments || [];

        updateNodeContent(nodeId, {
            attachments: [...existingAttachments, ...newAttachments]
        });
    };

    const removeAttachment = (nodeId: string, attachmentId: string) => {
        const selectedNode = campaignFlow.find(n => n.id === nodeId);
        const currentAttachments = selectedNode?.content?.attachments || [];
        const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);

        updateNodeContent(nodeId, { attachments: updatedAttachments });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusBadge = (status: Campaign['status']) => {
        const lightVariants = {
            active: 'bg-green-100 text-green-800 border-green-200',
            paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200'
        };

        const darkVariants = {
            active: 'bg-green-900/30 text-green-400 border-green-700',
            paused: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
            draft: 'bg-gray-800/50 text-gray-400 border-gray-600',
            completed: 'bg-blue-900/30 text-blue-400 border-blue-700'
        };

        const variants = isDarkMode ? darkVariants : lightVariants;

        return (
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${variants[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Aggregated stats from campaigns
    const totalCampaigns = campaigns.length;
    const totalProspects = campaigns.reduce((sum, c) => {
        const fromStats = (c.stats?.totalProspects ?? 0);
        const fromArray = Array.isArray(c.prospects) ? c.prospects.length : 0;
        return sum + (fromStats || fromArray);
    }, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.emailsSent ?? 0), 0);
    const totalOpenedFloat = campaigns.reduce((sum, c) => {
        const sent = c.stats?.emailsSent ?? 0;
        const rate = c.stats?.openRate ?? 0; // percentage
        return sum + (sent * rate) / 100;
    }, 0);
    const avgOpenRate = totalSent > 0 ? Math.round((totalOpenedFloat / totalSent) * 100) : 0;
    // Reply rate not computed from provided stats; can be added when backend supplies per-campaign replies

    if (isLoading || loading) {
        return (
            <div className={`${isDarkMode ? 'bg-primary' : 'bg-white'} min-h-screen flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading campaigns...</p>
                </div>
            </div>
        );
    }

    if (isCreateMode) {
        return (
            <div>
                <div className={`min-h-screen ${isDarkMode ? 'bg-primary' : 'bg-white'} py-4 px-4`}>
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateMode(false)}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back to Campaigns
                                </Button>
                                <div>
                                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                        Create New Campaign
                                    </h1>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
                                        Step {currentStep} of {steps.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Campaign Creation Tabs */}
                        <div className="flex border-b border-gray-200 mb-6">
                            {[
                                { id: 1, label: 'Details', icon: Target },
                                { id: 2, label: 'Leads', icon: Users },
                                { id: 3, label: 'Sequence', icon: Mail },
                                { id: 4, label: 'Launch', icon: Calendar }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        // Only allow navigation if current step is valid or going to a previous step
                                        if (tab.id <= currentStep || isStepValid(currentStep)) {
                                            setCurrentStep(tab.id);
                                        }
                                    }}
                                    disabled={tab.id > currentStep && !isStepValid(currentStep)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${currentStep === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : tab.id <= currentStep || isStepValid(currentStep)
                                            ? 'border-transparent text-gray-500 hover:text-gray-700 cursor-pointer'
                                            : 'border-transparent text-gray-400 cursor-not-allowed'
                                        }`}
                                    style={sacoreFont}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Step Content */}
                        <Card className={`${isDarkMode ? 'bg-primary border-gray-700' : 'bg-white border-gray-200'} mb-6`}>
                            <CardContent className="p-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Step content will be added here */}
                                        {currentStep === 1 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="campaignName" className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                        Campaign Name *
                                                    </Label>
                                                    <Input
                                                        id="campaignName"
                                                        value={campaignName}
                                                        onChange={(e) => setCampaignName(e.target.value)}
                                                        placeholder="e.g., Q1 Lead Generation Campaign"
                                                        className="mt-1"
                                                        style={sacoreFont}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="campaignDescription" className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                        Campaign Description
                                                    </Label>
                                                    <Textarea
                                                        id="campaignDescription"
                                                        value={campaignDescription}
                                                        onChange={(e) => setCampaignDescription(e.target.value)}
                                                        placeholder="Optional description of your campaign goals and objectives"
                                                        className="mt-1"
                                                        rows={3}
                                                        style={sacoreFont}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentStep === 2 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                        Import Prospects *
                                                    </Label>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`} style={sacoreFont}>
                                                        Choose how you'd like to import prospects for your campaign:
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'csv'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <CardContent className="p-4 text-center">
                                                            <Upload className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                                            <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                Upload CSV File
                                                            </h3>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                Upload a CSV file with prospect information
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2 text-xs border-gray-400 text-gray-600 hover:bg-gray-100"
                                                                style={sacoreFont}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    downloadSampleCSV();
                                                                }}
                                                            >
                                                                <Download className="w-3 h-3 mr-1" /> Sample
                                                            </Button>
                                                        </CardContent>
                                                    </Card>

                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'candidates'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                                        onClick={() => setSelectedImportMethod('candidates')}
                                                    >
                                                        <CardContent className="p-4 text-center">
                                                            <Users className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                                            <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                Import from Candidates
                                                            </h3>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                Use prospects from your candidates list
                                                            </p>
                                                        </CardContent>
                                                    </Card>

                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'project'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                                        onClick={() => setSelectedImportMethod('project')}
                                                    >
                                                        <CardContent className="p-4 text-center">
                                                            <FolderOpen className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                                            <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                Import from Project
                                                            </h3>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                Import prospects from existing projects
                                                            </p>
                                                        </CardContent>
                                                    </Card>

                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'manual'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                                        onClick={() => setSelectedImportMethod('manual')}
                                                    >
                                                        <CardContent className="p-4 text-center">
                                                            <Edit className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                                            <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                Manual Upload
                                                            </h3>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                Enter prospect data manually
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Import Method Specific Content */}
                                                {selectedImportMethod === 'candidates' && (
                                                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                        <CardContent className="p-4">
                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                Select Candidates Source
                                                            </Label>
                                                            <Select value={selectedCandidatesSource} onValueChange={setSelectedCandidatesSource}>
                                                                <SelectTrigger className="mt-2">
                                                                    <SelectValue placeholder="Choose candidates source" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="candidates">Candidates</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                onClick={handleImportFromCandidates}
                                                                className="mt-3 w-full"
                                                                size="sm"
                                                                style={sacoreFont}
                                                                disabled={!selectedCandidatesSource || loadingCandidates}
                                                            >
                                                                {loadingCandidates ? 'Loading...' : `Import from ${selectedCandidatesSource || 'Source'}`}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                )}


                                                {selectedImportMethod === 'project' && (
                                                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                        <CardContent className="p-4">
                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                Select Project
                                                            </Label>
                                                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                                                <SelectTrigger className="mt-2">
                                                                    <SelectValue placeholder="Choose project" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {availableProjects.length > 0 ? (
                                                                        availableProjects.filter(p => p._id && p._id.trim() !== '').map((p) => (
                                                                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <SelectItem value="no-projects" disabled>{loadingProjects ? 'Loading projects...' : 'No projects found'}</SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                onClick={handleImportFromProject}
                                                                className="mt-3 w-full"
                                                                size="sm"
                                                                style={sacoreFont}
                                                                disabled={!selectedProject}
                                                            >
                                                                Import from Project
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Candidates Table */}
                                                {(selectedImportMethod === 'candidates' || selectedImportMethod === 'project' || selectedImportMethod === 'csv' || selectedImportMethod === 'manual') && fetchedCandidates.length > 0 && (
                                                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'} mt-4`}>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                    Select Prospects ({fetchedCandidates.length} found)
                                                                </Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        onClick={handleBatchCandidateAnalyzeClick}
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={selectedCandidates.size === 0 || isAnalyzing}
                                                                        style={sacoreFont}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <BrainCog className="w-3 h-3" />
                                                                        {isAnalyzing ? 'Analyzing...' : `Deep Analyze (${selectedCandidates.size})`}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleBatchCandidateGetEmailsClick}
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={selectedCandidates.size === 0 || loadingBatchCandidateEmails}
                                                                        style={sacoreFont}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <Mail className="w-3 h-3" />
                                                                        {loadingBatchCandidateEmails ? 'Finding Emails...' : `Get Emails (${selectedCandidates.size})`}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleBatchCandidateGetLinkedInUrlsClick}
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={selectedCandidates.size === 0 || loadingBatchCandidateLinkedInUrls}
                                                                        style={sacoreFont}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <Linkedin className="w-3 h-3" />
                                                                        {loadingBatchCandidateLinkedInUrls ? 'Finding URLs...' : `Get LinkedIn URLs (${selectedCandidates.size})`}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleConfirmCandidateImport}
                                                                        size="sm"
                                                                        disabled={selectedCandidates.size === 0}
                                                                        style={sacoreFont}
                                                                    >
                                                                        Import Selected ({selectedCandidates.size})
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className={`overflow-x-auto border rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                                                <div className="max-h-96 overflow-y-auto">
                                                                    <Table className={`border-collapse w-full min-w-[1400px] ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                                        <TableHeader className={isDarkMode ? "bg-gray-950" : "bg-gray-50"}>
                                                                            <TableRow className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-300"}>
                                                                                <TableHead className={`w-[50px] py-3 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                                                                    <div className="flex items-center justify-center">
                                                                                        <Checkbox
                                                                                            checked={selectedCandidates.size === fetchedCandidates.length && fetchedCandidates.length > 0}
                                                                                            onCheckedChange={handleSelectAllCandidates}
                                                                                            aria-label="Select all candidates"
                                                                                            className={`mr-3  
        ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
        focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                                                                        />
                                                                                    </div>
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Name <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Title <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Company <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Location <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Project
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[160px]`} style={sacoreFont}>
                                                                                    Deep Analysis
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Email
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    LinkedIn URL
                                                                                </TableHead>
                                                                                <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                                    Actions
                                                                                </TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {fetchedCandidates.map((candidate) => (
                                                                                <TableRow key={candidate._id} className={`transition-colors border-b ${isDarkMode
                                                                                    ? "bg-primary hover:bg-gray-950 border-gray-700"
                                                                                    : "bg-white hover:bg-gray-50 border-gray-300"
                                                                                    }`}>
                                                                                    <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                                                                        <div className="flex items-center justify-center">
                                                                                            <Checkbox
                                                                                                checked={selectedCandidates.has(candidate._id)}
                                                                                                onCheckedChange={() => handleSelectCandidate(candidate._id)}
                                                                                                aria-label={`Select ${candidate.name}`}
                                                                                                className={`mr-3  
        ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
        focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                                                                            />
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className={`font-medium py-4 border-r ${isDarkMode ? "text-gray-200 border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                                        {candidate.name}
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                                        {candidate.title}
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                                        {candidate.company}
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                                        {candidate.location}
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                                        <div className="truncate" title={candidate.projectId?.name}>
                                                                                            {candidate.projectId?.name || 'N/A'}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                                                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                                                            {analyzingCandidates.has(candidate._id) ? (
                                                                                                <div className="flex items-center justify-center">
                                                                                                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                                                                </div>
                                                                                            ) : candidate.analysisScore || candidate.analysis || deepAnalysisResultsMap[candidate._id] ? (
                                                                                                <div
                                                                                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto cursor-pointer hover:bg-blue-200 transition-colors"
                                                                                                    onClick={() => {
                                                                                                        setDeepAnalysisSelectedCandidateId(candidate._id);
                                                                                                        setDeepAnalysisSelectedCandidate(candidate);

                                                                                                        // If candidate already has analysis data but it's not in the map, add it
                                                                                                        if (candidate.analysis && !deepAnalysisResultsMap[candidate._id]) {
                                                                                                            setDeepAnalysisResultsMap(prev => ({
                                                                                                                ...prev,
                                                                                                                [candidate._id]: {
                                                                                                                    analysis: candidate.analysis,
                                                                                                                    enrichedData: candidate.analysis.enrichedData
                                                                                                                }
                                                                                                            }));
                                                                                                        }

                                                                                                        setIsDeepAnalysisModalOpen(true);
                                                                                                    }}
                                                                                                >
                                                                                                    <span className="font-medium text-sm">
                                                                                                        {(() => {
                                                                                                            const score = candidate.analysisScore || candidate.analysis?.score || deepAnalysisResultsMap[candidate._id]?.analysis?.score;
                                                                                                            return score || 'N/A';
                                                                                                        })()}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div
                                                                                                        className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                                                                        onClick={() => handleCandidateAnalyzeClick(candidate)}
                                                                                                        title="Our AI is going to analyze this profile"
                                                                                                    >
                                                                                                        <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                                                            <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                                                                        </svg>
                                                                                                    </div>
                                                                                                    <span
                                                                                                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                                                                        onClick={() => handleCandidateAnalyzeClick(candidate)}
                                                                                                    >
                                                                                                        press to run
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-2 ${isDarkMode ? "text-gray-300" : ""} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[200px]`}>
                                                                                        <div className="flex items-center justify-center gap-2">
                                                                                            {renderCandidateEmailDisplay(candidate)}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[250px]`}>
                                                                                        <div className="flex items-center justify-center gap-2">
                                                                                            {candidate.linkedinUrl && candidate.linkedinUrl.trim() !== '' ? (
                                                                                                <a
                                                                                                    href={candidate.linkedinUrl}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                                                                                                >
                                                                                                    {candidate.linkedinUrl}
                                                                                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                                                                </a>
                                                                                            ) : (
                                                                                                loadingLinkedInUrls.includes(candidate._id) ? (
                                                                                                    <div className="flex items-center justify-center">
                                                                                                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div
                                                                                                            className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                                                                            onClick={() => handleCandidateGetLinkedInUrlClick(candidate)}
                                                                                                        >
                                                                                                            <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                                                                <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                                                                            </svg>
                                                                                                        </div>
                                                                                                        <span
                                                                                                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                                                                            onClick={() => handleCandidateGetLinkedInUrlClick(candidate)}
                                                                                                        >
                                                                                                            press to run
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[100px] text-center`}>
                                                                                        <div className="flex items-center justify-center gap-1">
                                                                                            {candidate.linkedinUrl && (
                                                                                                <TooltipProvider>
                                                                                                    <Tooltip>
                                                                                                        <TooltipTrigger asChild>
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="sm"
                                                                                                                onClick={() => handleCopyCandidateUrl(candidate.linkedinUrl)}
                                                                                                                className="h-6 w-6 p-0"
                                                                                                            >
                                                                                                                {copiedUrl === candidate.linkedinUrl ? (
                                                                                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                                                                                ) : (
                                                                                                                    <Copy className="h-3 w-3" />
                                                                                                                )}
                                                                                                            </Button>
                                                                                                        </TooltipTrigger>
                                                                                                        <TooltipContent>
                                                                                                            <p>Copy LinkedIn URL</p>
                                                                                                        </TooltipContent>
                                                                                                    </Tooltip>
                                                                                                </TooltipProvider>
                                                                                            )}
                                                                                            {candidate.linkedinUrl && (
                                                                                                <TooltipProvider>
                                                                                                    <Tooltip>
                                                                                                        <TooltipTrigger asChild>
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="sm"
                                                                                                                onClick={() => handleOpenCandidateUrl(candidate.linkedinUrl)}
                                                                                                                className="h-6 w-6 p-0"
                                                                                                            >
                                                                                                                <Linkedin className="w-3 h-3" />
                                                                                                            </Button>
                                                                                                        </TooltipTrigger>
                                                                                                        <TooltipContent>
                                                                                                            <p>Open LinkedIn</p>
                                                                                                        </TooltipContent>
                                                                                                    </Tooltip>
                                                                                                </TooltipProvider>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}



                                                {selectedImportMethod === 'manual' && (
                                                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                        <CardContent className="p-4">
                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                Manual Data Entry
                                                            </Label>
                                                            <Textarea
                                                                value={manualData}
                                                                onChange={(e) => setManualData(e.target.value)}
                                                                placeholder="Enter prospect data, one per line. Format: Name, Email, Company, Title, LinkedIn URL&#10;Example:&#10;John Doe, john@example.com, Example Corp, Manager, https://linkedin.com/in/johndoe&#10;Jane Smith, jane@sample.com, Sample Inc, Director, https://linkedin.com/in/janesmith"
                                                                className={`${isDarkMode ?
                                                                    'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                                                                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                                                                    }`}
                                                                style={sacoreFont}
                                                            />
                                                            <div className="mt-2 flex justify-between items-center">
                                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                    {manualData.split('\n').filter(line => line.trim()).length} lines
                                                                </p>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setManualData('')}
                                                                        disabled={!manualData.trim()}
                                                                        className="text-xs h-6"
                                                                        style={sacoreFont}
                                                                    >
                                                                        Clear
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleManualUpload}
                                                                        size="sm"
                                                                        className="text-xs h-6"
                                                                        style={sacoreFont}
                                                                        disabled={!manualData.trim() || manualProcessing}
                                                                    >
                                                                        {manualProcessing ? 'Processing...' : 'Process Data'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {selectedImportMethod && importedProspects.length > 0 && (
                                                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Badge variant="outline" className="text-xs border-gray-400 text-gray-600" style={sacoreFont}>
                                                                    {selectedImportMethod === 'csv' && 'CSV Import'}
                                                                    {selectedImportMethod === 'candidates' && 'Candidates Import'}
                                                                    {selectedImportMethod === 'project' && 'Project Import'}
                                                                    {selectedImportMethod === 'manual' && 'Manual Upload'}
                                                                </Badge>
                                                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
                                                                    {prospectCount} prospects
                                                                </span>
                                                            </div>
                                                            <div className="max-h-32 overflow-y-auto">
                                                                <div className="space-y-1">
                                                                    {importedProspects.slice(0, 3).map((prospect, index) => (
                                                                        <div key={index} className={`p-2 rounded text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                                                                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                                {prospect.name}
                                                                            </span> - {prospect.company} ({prospect.title})
                                                                        </div>
                                                                    ))}
                                                                    {importedProspects.length > 3 && (
                                                                        <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                                            and {importedProspects.length - 3} more...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={handleCSVUpload}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}

                                        {currentStep === 3 && (
                                            <div className="space-y-4">
                                                {!isVisualBuilderMode ? (
                                                    <>
                                                        <div>
                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                Campaign Sequence *
                                                            </Label>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`} style={sacoreFont}>
                                                                Choose the first step of your campaign
                                                            </p>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                    Steps
                                                                </Label>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                                    {[
                                                                        { type: 'email', title: 'Email', icon: Mail },
                                                                        { type: 'linkedin-message', title: 'LinkedIn Message', icon: Send },
                                                                        { type: 'linkedin-invitation', title: 'LinkedIn Invitation', icon: Users },
                                                                        { type: 'linkedin-visit', title: 'LinkedIn Visit', icon: Eye },
                                                                        { type: 'linkedin-connection-check', title: 'LinkedIn Connection Check', icon: GitBranch },
                                                                        { type: 'manual-task', title: 'Manual Task', icon: Edit }
                                                                    ].map(step => (
                                                                        <Card
                                                                            key={step.type}
                                                                            className={`cursor-pointer border-2 hover:border-black transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 hover:border-gray-400' : 'bg-white border-gray-300'}`}
                                                                            onClick={() => {
                                                                                setSelectedFirstStep(step.type);
                                                                                setIsVisualBuilderMode(true);

                                                                                const isCondition = step.type === 'linkedin-connection-check';

                                                                                setCampaignFlow([{
                                                                                    id: String(Date.now()),
                                                                                    type: isCondition ? 'condition' : 'step',
                                                                                    stepType: isCondition ? undefined : step.type as FlowNode['stepType'],
                                                                                    conditionType: isCondition ? step.type : undefined,
                                                                                    title: step.title,
                                                                                    position: { x: 100, y: 100 },
                                                                                    connections: [],
                                                                                    branchConnections: isCondition ? { yes: [], no: [] } : undefined,
                                                                                    parentBranch: 'main',
                                                                                    content: {
                                                                                        subject: (step.type === 'email' || step.type === 'manual-task') ? '' : undefined,
                                                                                        message: (step.type !== 'manual-task' && !isCondition) ? '' : undefined,
                                                                                        taskDescription: (step.type === 'manual-task') ? '' : undefined,
                                                                                        taskTitle: (step.type === 'manual-task') ? '' : undefined,
                                                                                        priority: (step.type === 'manual-task') ? 'medium' : undefined,
                                                                                        dueDays: (step.type === 'manual-task') ? undefined : undefined,
                                                                                        dueDate: (step.type === 'manual-task') ? undefined : undefined,
                                                                                        emailAddresses: (step.type === 'email') ? [] : undefined,
                                                                                        linkedinAccount: (step.type === 'linkedin-message') ? '' : undefined,
                                                                                        delay: 0,
                                                                                        delayUnit: 'hours',
                                                                                        attachments: [],
                                                                                        variables: []
                                                                                    }
                                                                                }]);
                                                                            }}
                                                                        >
                                                                            <CardContent className="p-3 text-center">
                                                                                {React.createElement(step.icon, { className: `w-5 h-5 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}` })}
                                                                                <h3 className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'} mb-1`} style={sacoreFont}>
                                                                                    {step.title}
                                                                                </h3>
                                                                                {step.type.includes('linkedin') && (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="#0077B5">
                                                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                                        </svg>
                                                                                        <span className="text-xs text-blue-600 font-medium">LinkedIn</span>
                                                                                    </div>
                                                                                )}
                                                                            </CardContent>
                                                                        </Card>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                    Campaign Flow Builder
                                                                </Label>
                                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                                    Build your campaign sequence with steps and conditions
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {selectedNodeForEdit && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setSelectedNodeForEdit(null)}
                                                                        style={sacoreFont}
                                                                    >
                                                                        <X className="w-4 h-4 mr-1" />
                                                                        Close Editor
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setIsVisualBuilderMode(false);
                                                                        setSelectedFirstStep(null);
                                                                        setCampaignFlow([]);
                                                                        setSelectedNodeForEdit(null);
                                                                    }}
                                                                    style={sacoreFont}
                                                                >
                                                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                                                    Back to Steps
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Main Canvas with Editor Panel */}
                                                        <div className="grid grid-cols-12 gap-4">
                                                            {/* Flow Canvas */}
                                                            <div className={`${selectedNodeForEdit ? 'col-span-8' : 'col-span-12'} transition-all duration-300`}>
                                                                <div
                                                                    ref={canvasRef}
                                                                    className={`relative w-full min-h-96 border-2 border-dashed rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}
                                                                    onWheel={handleWheel}
                                                                    onMouseDown={handleMouseDown}
                                                                    onMouseMove={handleMouseMove}
                                                                    onMouseUp={handleMouseUp}
                                                                    onMouseLeave={handleMouseUp}
                                                                    style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                                                                >
                                                                    {/* Canvas Controls */}
                                                                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
                                                                            className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                                            title="Zoom In"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.1))}
                                                                            className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                                            title="Zoom Out"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={resetView}
                                                                            className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                                            title="Reset View"
                                                                        >
                                                                            <Target className="w-4 h-4" />
                                                                        </Button>
                                                                        <div className={`px-2 py-1 backdrop-blur-sm rounded text-xs font-medium ${isDarkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90'}`}>
                                                                            {Math.round(zoom * 100)}%
                                                                        </div>
                                                                    </div>

                                                                    {/* Zoomable Container */}
                                                                    <div
                                                                        className="absolute inset-0"
                                                                        style={{
                                                                            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                                                                            transformOrigin: 'center',
                                                                        }}
                                                                    >
                                                                        <div className="p-8 min-h-full relative">
                                                                            {/* Connection Lines SVG */}
                                                                            <svg
                                                                                className="absolute inset-0 w-full h-full pointer-events-none z-5"
                                                                                style={{ overflow: 'visible' }}
                                                                            >
                                                                                {campaignFlow.map((node) => {
                                                                                    console.log(`VISUAL BUILDER - Node ${node.id}: type=${node.type}, connections=${JSON.stringify(node.connections)}, branchConnections=${JSON.stringify(node.branchConnections)}`);
                                                                                    const lines = [];
                                                                                    const pos = node?.position || { x: 0, y: 0 };
                                                                                    const nodeX = (pos.x ?? 0) + 132; // Center of 264px wide node
                                                                                    const nodeY = (pos.y ?? 0) + 64;  // Center of node height

                                                                                    if (node.type === 'condition' && node.branchConnections) {
                                                                                        // Yes branch connections
                                                                                        node.branchConnections.yes?.forEach(targetId => {
                                                                                            const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                                            if (targetNode) {
                                                                                                const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                                                const targetX = (targetPos.x ?? 0) + 132;
                                                                                                const targetY = (targetPos.y ?? 0) + 20;
                                                                                                lines.push(
                                                                                                    <g key={`yes-${node.id}-${targetId}`}>
                                                                                                        <path
                                                                                                            d={`M ${nodeX - 50} ${nodeY + 40} L ${nodeX - 100} ${nodeY + 40} L ${nodeX - 100} ${targetY - 20} L ${targetX} ${targetY - 20} L ${targetX} ${targetY}`}
                                                                                                            stroke={isDarkMode ? '#10b981' : '#059669'}
                                                                                                            strokeWidth="2"
                                                                                                            fill="none"
                                                                                                            strokeDasharray="5,5"
                                                                                                            markerEnd="url(#arrowhead-yes)"
                                                                                                        />
                                                                                                        <text
                                                                                                            x={nodeX - 120}
                                                                                                            y={nodeY + 35}
                                                                                                            className="text-xs fill-green-600"
                                                                                                            style={sacoreFont}
                                                                                                        >
                                                                                                            Yes
                                                                                                        </text>
                                                                                                    </g>
                                                                                                );
                                                                                            }
                                                                                        });

                                                                                        // No branch connections
                                                                                        node.branchConnections.no?.forEach(targetId => {
                                                                                            const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                                            if (targetNode) {
                                                                                                const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                                                const targetX = (targetPos.x ?? 0) + 132;
                                                                                                const targetY = (targetPos.y ?? 0) + 20;
                                                                                                lines.push(
                                                                                                    <g key={`no-${node.id}-${targetId}`}>
                                                                                                        <path
                                                                                                            d={`M ${nodeX + 50} ${nodeY + 40} L ${nodeX + 100} ${nodeY + 40} L ${nodeX + 100} ${targetY - 20} L ${targetX} ${targetY - 20} L ${targetX} ${targetY}`}
                                                                                                            stroke={isDarkMode ? '#ef4444' : '#dc2626'}
                                                                                                            strokeWidth="2"
                                                                                                            fill="none"
                                                                                                            strokeDasharray="5,5"
                                                                                                            markerEnd="url(#arrowhead-no)"
                                                                                                        />
                                                                                                        <text
                                                                                                            x={nodeX + 80}
                                                                                                            y={nodeY + 35}
                                                                                                            className="text-xs fill-red-600"
                                                                                                            style={sacoreFont}
                                                                                                        >
                                                                                                            No
                                                                                                        </text>
                                                                                                    </g>
                                                                                                );
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        // Regular step connections
                                                                                        console.log(`VISUAL BUILDER - Regular node ${node.id} connections:`, node.connections);
                                                                                        node.connections?.forEach(targetId => {
                                                                                            console.log(`VISUAL BUILDER - Looking for regular target ${targetId}`);
                                                                                            const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                                            console.log(`VISUAL BUILDER - Found regular target:`, targetNode ? 'YES' : 'NO');
                                                                                            if (targetNode) {
                                                                                                const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                                                const targetX = (targetPos.x ?? 0) + 132;
                                                                                                const targetY = (targetPos.y ?? 0) + 20;
                                                                                                console.log(`VISUAL BUILDER - Creating line from (${nodeX}, ${nodeY + 40}) to (${targetX}, ${targetY})`);
                                                                                                lines.push(
                                                                                                    <line
                                                                                                        key={`main-${node.id}-${targetId}`}
                                                                                                        x1={nodeX}
                                                                                                        y1={nodeY + 40}
                                                                                                        x2={targetX}
                                                                                                        y2={targetY}
                                                                                                        stroke="blue"
                                                                                                        strokeWidth="4"
                                                                                                        markerEnd="url(#arrowhead-main)"
                                                                                                    />
                                                                                                );
                                                                                            }
                                                                                        });
                                                                                    }

                                                                                    console.log(`VISUAL BUILDER - Node ${node.id} created ${lines.length} lines`);
                                                                                    return lines;
                                                                                })}

                                                                                {/* Arrow markers */}
                                                                                <defs>
                                                                                    <marker
                                                                                        id="arrowhead-main"
                                                                                        markerWidth="10"
                                                                                        markerHeight="7"
                                                                                        refX="9"
                                                                                        refY="3.5"
                                                                                        orient="auto"
                                                                                    >
                                                                                        <polygon
                                                                                            points="0 0, 10 3.5, 0 7"
                                                                                            fill={isDarkMode ? '#6b7280' : '#9ca3af'}
                                                                                        />
                                                                                    </marker>
                                                                                    <marker
                                                                                        id="arrowhead-yes"
                                                                                        markerWidth="10"
                                                                                        markerHeight="7"
                                                                                        refX="9"
                                                                                        refY="3.5"
                                                                                        orient="auto"
                                                                                    >
                                                                                        <polygon
                                                                                            points="0 0, 10 3.5, 0 7"
                                                                                            fill={isDarkMode ? '#10b981' : '#059669'}
                                                                                        />
                                                                                    </marker>
                                                                                    <marker
                                                                                        id="arrowhead-no"
                                                                                        markerWidth="10"
                                                                                        markerHeight="7"
                                                                                        refX="9"
                                                                                        refY="3.5"
                                                                                        orient="auto"
                                                                                    >
                                                                                        <polygon
                                                                                            points="0 0, 10 3.5, 0 7"
                                                                                            fill={isDarkMode ? '#ef4444' : '#dc2626'}
                                                                                        />
                                                                                    </marker>
                                                                                </defs>
                                                                            </svg>

                                                                            {/* Flow Nodes */}
                                                                            <div className="relative z-10">
                                                                                {campaignFlow.map((node, index) => (
                                                                                    <motion.div
                                                                                        key={node.id}
                                                                                        data-node-id={node.id}
                                                                                        className={`absolute cursor-grab ${draggingNodeId === node.id ? 'cursor-grabbing' : ''} ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border-2 rounded-lg shadow-lg w-64`}
                                                                                        style={{
                                                                                            left: `${(node?.position?.x ?? 0)}px`,
                                                                                            top: `${(node?.position?.y ?? 0)}px`,
                                                                                            ...sacoreFont
                                                                                        }}
                                                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                                                                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                                                                        onMouseUp={handleNodeMouseUp}
                                                                                        onClick={(e) => {
                                                                                            if (!isDragging) {
                                                                                                setSelectedNodeForEdit(node.id);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <CardContent className="p-4">
                                                                                            <div className="flex items-center justify-between mb-3">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    {node.type === 'step' ? (
                                                                                                        <>
                                                                                                            {node.stepType === 'email' && <Mail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                                            {node.stepType === 'linkedin-message' && <Send className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                                            {node.stepType === 'linkedin-invitation' && <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                                            {node.stepType === 'linkedin-visit' && <Eye className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                                            {node.stepType === 'manual-task' && <Edit className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <GitBranch className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                                                                                    )}
                                                                                                    <span className={`text-xs px-2 py-1 rounded-full ${node.type === 'step' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                                                        {node.type === 'step' ? 'Step' : 'Condition'}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <button
                                                                                                    className={`text-gray-400 hover:text-red-500 transition-colors`}
                                                                                                    title="Remove"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setCampaignFlow(campaignFlow.filter(n => n.id !== node.id));
                                                                                                        if (selectedNodeForEdit === node.id) {
                                                                                                            setSelectedNodeForEdit(null);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <X className="w-4 h-4" />
                                                                                                </button>
                                                                                            </div>

                                                                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                                                {node.title}
                                                                                            </h4>

                                                                                            {/* LinkedIn indicator */}
                                                                                            {(node.stepType?.includes('linkedin') || node.conditionType?.includes('linkedin') || node.conditionType === 'linkedin-connection-check') && (
                                                                                                <div className="flex items-center gap-1 mb-2">
                                                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#0077B5">
                                                                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                                                    </svg>
                                                                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                                                                        LinkedIn
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}

                                                                                            {node.content?.subject && node.stepType !== 'manual-task' && (
                                                                                                <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                                    Subject: {node.content.subject}
                                                                                                </p>
                                                                                            )}

                                                                                            {node.content?.message && (
                                                                                                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                                                                                    {node.content.message}
                                                                                                </p>
                                                                                            )}

                                                                                            {node.stepType === 'manual-task' && (node.content?.taskTitle || node.content?.subject) && (
                                                                                                <p className={`text-xs mb-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                                                                                                    {node.content.taskTitle || node.content.subject}
                                                                                                </p>
                                                                                            )}

                                                                                            {node.content?.taskDescription && (
                                                                                                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                                                                                    {node.content.taskDescription}
                                                                                                </p>
                                                                                            )}

                                                                                            {/* Delay information */}
                                                                                            {node.content?.delay !== undefined && node.content.delay > 0 && (
                                                                                                <p className={`text-xs mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                                                                                                    ⏱️ Wait {node.content.delay} {node.content.delayUnit === 'days' ? (node.content.delay === 1 ? 'day' : 'days') : node.content.delayUnit === 'hours' ? (node.content.delay === 1 ? 'hour' : 'hours') : (node.content.delay === 1 ? 'minute' : 'minutes')}
                                                                                                </p>
                                                                                            )}

                                                                                            {/* Condition branches */}
                                                                                            {node.type === 'condition' && (
                                                                                                <div className="flex justify-between mt-3 text-xs">
                                                                                                    <button
                                                                                                        className="flex items-center p-1 rounded hover:bg-green-50 transition-colors"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setShowStepSelector(true);
                                                                                                            // Store which parent and branch for the next step
                                                                                                            (window as any).pendingConnection = { parentId: node.id, parentBranch: 'yes' };
                                                                                                        }}
                                                                                                    >
                                                                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                                                                                        <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>Yes</span>
                                                                                                        <Plus className="w-3 h-3 ml-1 opacity-50" />
                                                                                                    </button>
                                                                                                    <button
                                                                                                        className="flex items-center p-1 rounded hover:bg-red-50 transition-colors"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setShowStepSelector(true);
                                                                                                            // Store which parent and branch for the next step
                                                                                                            (window as any).pendingConnection = { parentId: node.id, parentBranch: 'no' };
                                                                                                        }}
                                                                                                    >
                                                                                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                                                                                        <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>No</span>
                                                                                                        <Plus className="w-3 h-3 ml-1 opacity-50" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Add step button for regular steps */}
                                                                                            {node.type === 'step' && (
                                                                                                <div className="mt-3 flex justify-center">
                                                                                                    <button
                                                                                                        className={`flex items-center px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors`}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setShowStepSelector(true);
                                                                                                            // Store which parent for the next step
                                                                                                            (window as any).pendingConnection = { parentId: node.id, parentBranch: 'main' };
                                                                                                        }}
                                                                                                    >
                                                                                                        <Plus className="w-3 h-3 mr-1" />
                                                                                                        Add Step
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </CardContent>
                                                                                    </motion.div>
                                                                                ))}

                                                                                {/* Main Add Button for initial flow or when no parent selected */}
                                                                                {campaignFlow.length === 0 || !campaignFlow.some(node => (node.connections?.length ?? 0) === 0 && node.type !== 'condition') ? (
                                                                                    <motion.button
                                                                                        className={`absolute w-12 h-12 rounded-full border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'} flex items-center justify-center transition-colors z-10`}
                                                                                        style={{
                                                                                            left: '176px',
                                                                                            top: `${100 + (campaignFlow.length > 0 ? Math.max(...campaignFlow.map(n => (n?.position?.y ?? 0))) + 180 : 0)}px`
                                                                                        }}
                                                                                        whileHover={{ scale: 1.05 }}
                                                                                        whileTap={{ scale: 0.95 }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setShowStepSelector(true);
                                                                                            // No parent connection for main flow
                                                                                            (window as any).pendingConnection = null;
                                                                                        }}
                                                                                    >
                                                                                        <Plus className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                                                                    </motion.button>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Editor Panel */}
                                                            {selectedNodeForEdit && (
                                                                <motion.div
                                                                    className="col-span-4"
                                                                    initial={{ opacity: 0, x: 20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: 20 }}
                                                                >
                                                                    {(() => {
                                                                        const selectedNode = campaignFlow.find(n => n.id === selectedNodeForEdit);
                                                                        if (!selectedNode) return null;

                                                                        return (
                                                                            <Card className={`${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'} h-fit`}>
                                                                                <CardHeader className="pb-3">
                                                                                    <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                                        Edit {selectedNode.title}
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="space-y-4">
                                                                                    {selectedNode.stepType === 'email' && (
                                                                                        <>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Subject
                                                                                                </Label>
                                                                                                <div className="flex gap-2 mt-1">
                                                                                                    <Input
                                                                                                        value={selectedNode.content?.subject || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { subject: e.target.value })}
                                                                                                        placeholder="Email subject..."
                                                                                                        className="flex-1"
                                                                                                        style={sacoreFont}
                                                                                                    />
                                                                                                    <DropdownMenu>
                                                                                                        <DropdownMenuTrigger asChild>
                                                                                                            <Button variant="outline" size="sm">
                                                                                                                <Hash className="w-4 h-4" />
                                                                                                            </Button>
                                                                                                        </DropdownMenuTrigger>
                                                                                                        <DropdownMenuContent align="end" className="w-48">
                                                                                                            <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                            <DropdownMenuSeparator />
                                                                                                            {availableVariables.map(variable => (
                                                                                                                <DropdownMenuItem
                                                                                                                    key={variable.key}
                                                                                                                    onClick={() => insertVariable(selectedNode.id, variable.key, 'subject')}
                                                                                                                >
                                                                                                                    <div>
                                                                                                                        <div className="font-medium">{variable.label}</div>
                                                                                                                        <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                    </div>
                                                                                                                </DropdownMenuItem>
                                                                                                            ))}
                                                                                                        </DropdownMenuContent>
                                                                                                    </DropdownMenu>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Message
                                                                                                </Label>
                                                                                                <div className="mt-1">
                                                                                                    <Textarea
                                                                                                        value={selectedNode.content?.message || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { message: e.target.value })}
                                                                                                        placeholder="Email content..."
                                                                                                        rows={4}
                                                                                                        style={sacoreFont}
                                                                                                    />

                                                                                                    {/* Toolbar under textarea */}
                                                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button variant="outline" size="sm">
                                                                                                                    <Hash className="w-4 h-4 mr-1" />
                                                                                                                    Variables
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                                                <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                                <DropdownMenuSeparator />
                                                                                                                {availableVariables.map(variable => (
                                                                                                                    <DropdownMenuItem
                                                                                                                        key={variable.key}
                                                                                                                        onClick={() => insertVariable(selectedNode.id, variable.key, 'message')}
                                                                                                                    >
                                                                                                                        <div>
                                                                                                                            <div className="font-medium">{variable.label}</div>
                                                                                                                            <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                        </div>
                                                                                                                    </DropdownMenuItem>
                                                                                                                ))}
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>

                                                                                                        <Button
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() => document.getElementById(`image-input-${selectedNode.id}`)?.click()}
                                                                                                        >
                                                                                                            <Image className="w-4 h-4 mr-1" />
                                                                                                            Images
                                                                                                        </Button>
                                                                                                        <input
                                                                                                            id={`image-input-${selectedNode.id}`}
                                                                                                            type="file"
                                                                                                            multiple
                                                                                                            accept="image/*"
                                                                                                            className="hidden"
                                                                                                            onChange={(e) => handleFileUpload(selectedNode.id, e.target.files, 'images')}
                                                                                                        />

                                                                                                        <Button
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() => document.getElementById(`file-input-${selectedNode.id}`)?.click()}
                                                                                                        >
                                                                                                            <Paperclip className="w-4 h-4 mr-1" />
                                                                                                            Files
                                                                                                        </Button>
                                                                                                        <input
                                                                                                            id={`file-input-${selectedNode.id}`}
                                                                                                            type="file"
                                                                                                            multiple
                                                                                                            className="hidden"
                                                                                                            onChange={(e) => handleFileUpload(selectedNode.id, e.target.files)}
                                                                                                        />


                                                                                                    </div>

                                                                                                    {selectedNode.content?.attachments && selectedNode.content.attachments.length > 0 && (
                                                                                                        <div className="mt-3 space-y-2">
                                                                                                            <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                                                Attachments:
                                                                                                            </Label>
                                                                                                            {selectedNode.content.attachments.map(attachment => (
                                                                                                                <div key={attachment.id} className={`flex items-center justify-between p-3 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                                                    <div className="flex items-center gap-3">
                                                                                                                        {attachment.category === 'image' ? (
                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                <Image className="w-4 h-4" />
                                                                                                                                {attachment.url && (
                                                                                                                                    <img
                                                                                                                                        src={attachment.url}
                                                                                                                                        alt={attachment.name}
                                                                                                                                        className="w-10 h-10 object-cover rounded border"
                                                                                                                                    />
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        ) : (
                                                                                                                            <FileText className="w-4 h-4" />
                                                                                                                        )}
                                                                                                                        <div>
                                                                                                                            <div className="text-sm font-medium">{attachment.name}</div>
                                                                                                                            <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <Button
                                                                                                                        variant="ghost"
                                                                                                                        size="sm"
                                                                                                                        onClick={() => removeAttachment(selectedNode.id, attachment.id)}
                                                                                                                    >
                                                                                                                        <X className="w-4 h-4" />
                                                                                                                    </Button>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Email Account
                                                                                                </Label>
                                                                                                <div className="flex items-center justify-between">
                                                                                                    <Select
                                                                                                        value={selectedNode.content?.emailAddresses?.[0] || ''}
                                                                                                        onValueChange={(value) => {
                                                                                                            if (value === 'connect_gmail') {
                                                                                                                // Handle connect Gmail via popup
                                                                                                                (async () => {
                                                                                                                    try {
                                                                                                                        const authUrl = await authService.getGmailAuthUrl();
                                                                                                                        window.open(authUrl, 'gmail_oauth', 'width=520,height=680');
                                                                                                                    } catch (error: any) {
                                                                                                                        toast({ title: 'Error', description: error?.message || 'Failed to get Gmail auth URL', variant: 'destructive' });
                                                                                                                    }
                                                                                                                })();
                                                                                                            } else {
                                                                                                                // Select email account
                                                                                                                updateNodeContent(selectedNode.id, { emailAddresses: [value] });
                                                                                                            }
                                                                                                        }}
                                                                                                        disabled={accountsLoading}
                                                                                                    >
                                                                                                        <SelectTrigger className="mt-1">
                                                                                                            <SelectValue placeholder={accountsLoading ? "Loading accounts..." : "Select email account"} />
                                                                                                        </SelectTrigger>
                                                                                                        <SelectContent>
                                                                                                            {emailAccounts.filter(account => account.email && account.email.trim() !== '').map(account => (
                                                                                                                <SelectItem key={account.id} value={account.email}>
                                                                                                                    <div className="flex items-center gap-2">
                                                                                                                        <Mail className="w-4 h-4" />
                                                                                                                        <span>{account.name} ({account.email})</span>
                                                                                                                    </div>
                                                                                                                </SelectItem>
                                                                                                            ))}
                                                                                                            <SelectItem value="connect_gmail">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <Plus className="w-4 h-4" />
                                                                                                                    <span>Connect Gmail</span>
                                                                                                                </div>
                                                                                                            </SelectItem>
                                                                                                        </SelectContent>
                                                                                                    </Select>
                                                                                                    {emailAccounts.length > 0 && (
                                                                                                        <Button
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={refreshGmailTokens}
                                                                                                            disabled={accountsLoading || refreshingGmailTokens}
                                                                                                            className="h-8 px-2 ml-2"
                                                                                                            title="Refresh Gmail tokens"
                                                                                                        >
                                                                                                            <RefreshCw className={`w-3 h-3 ${refreshingGmailTokens ? 'animate-spin' : ''}`} />
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                                {emailAccounts.length === 0 && (
                                                                                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                                                                        No email accounts connected. Select "Connect Gmail" to add one.
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </>
                                                                                    )}

                                                                                    {selectedNode.stepType === 'linkedin-message' && (
                                                                                        <>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Message
                                                                                                </Label>
                                                                                                <div className="mt-1">
                                                                                                    <Textarea
                                                                                                        value={selectedNode.content?.message || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { message: e.target.value })}
                                                                                                        placeholder="LinkedIn message..."
                                                                                                        rows={4}
                                                                                                        style={sacoreFont}
                                                                                                    />

                                                                                                    {/* Toolbar under textarea */}
                                                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button variant="outline" size="sm">
                                                                                                                    <Hash className="w-4 h-4 mr-1" />
                                                                                                                    Variables
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                                                <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                                <DropdownMenuSeparator />
                                                                                                                {availableVariables.map(variable => (
                                                                                                                    <DropdownMenuItem
                                                                                                                        key={variable.key}
                                                                                                                        onClick={() => insertVariable(selectedNode.id, variable.key, 'message')}
                                                                                                                    >
                                                                                                                        <div>
                                                                                                                            <div className="font-medium">{variable.label}</div>
                                                                                                                            <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                        </div>
                                                                                                                    </DropdownMenuItem>
                                                                                                                ))}
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>

                                                                                                        <Button
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() => document.getElementById(`linkedin-image-input-${selectedNode.id}`)?.click()}
                                                                                                        >
                                                                                                            <Image className="w-4 h-4 mr-1" />
                                                                                                            Images
                                                                                                        </Button>
                                                                                                        <input
                                                                                                            id={`linkedin-image-input-${selectedNode.id}`}
                                                                                                            type="file"
                                                                                                            multiple
                                                                                                            accept="image/*"
                                                                                                            className="hidden"
                                                                                                            onChange={(e) => handleFileUpload(selectedNode.id, e.target.files, 'images')}
                                                                                                        />


                                                                                                    </div>

                                                                                                    {selectedNode.content?.attachments && selectedNode.content.attachments.length > 0 && (
                                                                                                        <div className="mt-3 space-y-2">
                                                                                                            <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                                                Attachments:
                                                                                                            </Label>
                                                                                                            {selectedNode.content.attachments.map(attachment => (
                                                                                                                <div key={attachment.id} className={`flex items-center justify-between p-3 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                                                    <div className="flex items-center gap-3">
                                                                                                                        {attachment.category === 'image' ? (
                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                <Image className="w-4 h-4" />
                                                                                                                                {attachment.url && (
                                                                                                                                    <img
                                                                                                                                        src={attachment.url}
                                                                                                                                        alt={attachment.name}
                                                                                                                                        className="w-10 h-10 object-cover rounded border"
                                                                                                                                    />
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        ) : (
                                                                                                                            <FileText className="w-4 h-4" />
                                                                                                                        )}
                                                                                                                        <div>
                                                                                                                            <div className="text-sm font-medium">{attachment.name}</div>
                                                                                                                            <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <Button
                                                                                                                        variant="ghost"
                                                                                                                        size="sm"
                                                                                                                        onClick={() => removeAttachment(selectedNode.id, attachment.id)}
                                                                                                                    >
                                                                                                                        <X className="w-4 h-4" />
                                                                                                                    </Button>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    LinkedIn Extension Status
                                                                                                </Label>
                                                                                                <div className={`mt-1 p-4 rounded-lg border ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                                    <div className="flex items-start justify-between mb-2">
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            onClick={loadLinkedInExtensionStatus}
                                                                                                            disabled={linkedinExtensionLoading}
                                                                                                            className="h-6 px-2 ml-auto"
                                                                                                        >
                                                                                                            <RefreshCw className={`w-3 h-3 ${linkedinExtensionLoading ? 'animate-spin' : ''}`} />
                                                                                                        </Button>
                                                                                                    </div>

                                                                                                    {linkedinExtensionLoading ? (
                                                                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                                                                            <span>Checking extension status...</span>
                                                                                                        </div>
                                                                                                    ) : linkedinExtensionStatus ? (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <div className={`w-2 h-2 rounded-full ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'bg-green-500' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'bg-yellow-500' :
                                                                                                                        'bg-red-500'
                                                                                                                    }`}></div>
                                                                                                                <span className={`text-sm font-medium ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'text-green-600 dark:text-green-400' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'text-yellow-600 dark:text-yellow-400' :
                                                                                                                        'text-red-600 dark:text-red-400'
                                                                                                                    }`}>
                                                                                                                    {linkedinExtensionStatus.status?.charAt(0).toUpperCase() + linkedinExtensionStatus.status?.slice(1)}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                {linkedinExtensionStatus.message}
                                                                                                            </p>

                                                                                                            {linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive && linkedinAccount && (
                                                                                                                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">LinkedIn Account Connected</span>
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                            <span className="font-medium">Profile:</span> {linkedinAccount.profileName}
                                                                                                                        </div>
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-all`}>
                                                                                                                            <span className="font-medium">URL:</span> {linkedinAccount.profileUrl}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {linkedinExtensionStatus.lastSeen && (
                                                                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div>Last seen: {linkedinExtensionStatus.timeSinceLastSeen}</div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="text-sm text-red-600 dark:text-red-400">
                                                                                                            Unable to connect to extension
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    )}

                                                                                    {selectedNode.stepType === 'linkedin-invitation' && (
                                                                                        <>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Invitation Message
                                                                                                </Label>
                                                                                                <div className="mt-1">
                                                                                                    <Textarea
                                                                                                        value={selectedNode.content?.message || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { message: e.target.value })}
                                                                                                        placeholder="Hi {{name}}, I came across your profile and was impressed by your work at {{company}}. I'd love to connect and discuss potential opportunities in the tech space."
                                                                                                        rows={3}
                                                                                                        style={sacoreFont}
                                                                                                    />

                                                                                                    {/* Toolbar under textarea */}
                                                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button variant="outline" size="sm">
                                                                                                                    <Hash className="w-4 h-4 mr-1" />
                                                                                                                    Variables
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                                                <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                                <DropdownMenuSeparator />
                                                                                                                {availableVariables.map(variable => (
                                                                                                                    <DropdownMenuItem
                                                                                                                        key={variable.key}
                                                                                                                        onClick={() => insertVariable(selectedNode.id, variable.key, 'message')}
                                                                                                                    >
                                                                                                                        <div>
                                                                                                                            <div className="font-medium">{variable.label}</div>
                                                                                                                            <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                        </div>
                                                                                                                    </DropdownMenuItem>
                                                                                                                ))}
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    LinkedIn Extension Status
                                                                                                </Label>
                                                                                                <div className={`mt-1 p-4 rounded-lg border ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                                    <div className="flex items-start justify-between mb-2">
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            onClick={loadLinkedInExtensionStatus}
                                                                                                            disabled={linkedinExtensionLoading}
                                                                                                            className="h-6 px-2 ml-auto"
                                                                                                        >
                                                                                                            <RefreshCw className={`w-3 h-3 ${linkedinExtensionLoading ? 'animate-spin' : ''}`} />
                                                                                                        </Button>
                                                                                                    </div>

                                                                                                    {linkedinExtensionLoading ? (
                                                                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                                                                            <span>Checking extension status...</span>
                                                                                                        </div>
                                                                                                    ) : linkedinExtensionStatus ? (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <div className={`w-2 h-2 rounded-full ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'bg-green-500' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'bg-yellow-500' :
                                                                                                                        'bg-red-500'
                                                                                                                    }`}></div>
                                                                                                                <span className={`text-sm font-medium ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'text-green-600 dark:text-green-400' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'text-yellow-600 dark:text-yellow-400' :
                                                                                                                        'text-red-600 dark:text-red-400'
                                                                                                                    }`}>
                                                                                                                    {linkedinExtensionStatus.status?.charAt(0).toUpperCase() + linkedinExtensionStatus.status?.slice(1)}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                {linkedinExtensionStatus.message}
                                                                                                            </p>

                                                                                                            {linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive && linkedinAccount && (
                                                                                                                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">LinkedIn Account Connected</span>
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                            <span className="font-medium">Profile:</span> {linkedinAccount.profileName}
                                                                                                                        </div>
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-all`}>
                                                                                                                            <span className="font-medium">URL:</span> {linkedinAccount.profileUrl}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {linkedinExtensionStatus.lastSeen && (
                                                                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div>Last seen: {linkedinExtensionStatus.timeSinceLastSeen}</div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="text-sm text-red-600 dark:text-red-400">
                                                                                                            Unable to connect to extension
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    )}

                                                                                    {selectedNode.stepType === 'linkedin-visit' && (
                                                                                        <>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Visit Message (Optional)
                                                                                                </Label>
                                                                                                <div className="mt-1">
                                                                                                    <Textarea
                                                                                                        value={selectedNode.content?.message || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { message: e.target.value })}
                                                                                                        placeholder="Optional message to track with the visit..."
                                                                                                        rows={3}
                                                                                                        style={sacoreFont}
                                                                                                    />

                                                                                                    {/* Toolbar under textarea */}
                                                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button variant="outline" size="sm">
                                                                                                                    <Hash className="w-4 h-4 mr-1" />
                                                                                                                    Variables
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                                                <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                                <DropdownMenuSeparator />
                                                                                                                {availableVariables.map(variable => (
                                                                                                                    <DropdownMenuItem
                                                                                                                        key={variable.key}
                                                                                                                        onClick={() => insertVariable(selectedNode.id, variable.key, 'message')}
                                                                                                                    >
                                                                                                                        <div>
                                                                                                                            <div className="font-medium">{variable.label}</div>
                                                                                                                            <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                        </div>
                                                                                                                    </DropdownMenuItem>
                                                                                                                ))}
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    LinkedIn Extension Status
                                                                                                </Label>
                                                                                                <div className={`mt-1 p-4 rounded-lg border ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                                    <div className="flex items-start justify-between mb-2">
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            onClick={loadLinkedInExtensionStatus}
                                                                                                            disabled={linkedinExtensionLoading}
                                                                                                            className="h-6 px-2 ml-auto"
                                                                                                        >
                                                                                                            <RefreshCw className={`w-3 h-3 ${linkedinExtensionLoading ? 'animate-spin' : ''}`} />
                                                                                                        </Button>
                                                                                                    </div>

                                                                                                    {linkedinExtensionLoading ? (
                                                                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                                                                            <span>Checking extension status...</span>
                                                                                                        </div>
                                                                                                    ) : linkedinExtensionStatus ? (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <div className={`w-2 h-2 rounded-full ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'bg-green-500' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'bg-yellow-500' :
                                                                                                                        'bg-red-500'
                                                                                                                    }`}></div>
                                                                                                                <span className={`text-sm font-medium ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'text-green-600 dark:text-green-400' :
                                                                                                                    linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'text-yellow-600 dark:text-yellow-400' :
                                                                                                                        'text-red-600 dark:text-red-400'
                                                                                                                    }`}>
                                                                                                                    {linkedinExtensionStatus.status?.charAt(0).toUpperCase() + linkedinExtensionStatus.status?.slice(1)}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                {linkedinExtensionStatus.message}
                                                                                                            </p>

                                                                                                            {linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive && linkedinAccount && (
                                                                                                                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">LinkedIn Account Connected</span>
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                                                            <span className="font-medium">Profile:</span> {linkedinAccount.profileName}
                                                                                                                        </div>
                                                                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} break-all`}>
                                                                                                                            <span className="font-medium">URL:</span> {linkedinAccount.profileUrl}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {linkedinExtensionStatus.lastSeen && (
                                                                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                                                    <div>Last seen: {linkedinExtensionStatus.timeSinceLastSeen}</div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="text-sm text-red-600 dark:text-red-400">
                                                                                                            Unable to connect to extension
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    )}

                                                                                    {selectedNode.stepType === 'manual-task' && (
                                                                                        <>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Task Title
                                                                                                </Label>
                                                                                                <Input
                                                                                                    value={selectedNode.content?.taskTitle || selectedNode.content?.subject || ''}
                                                                                                    onChange={(e) => updateNodeContent(selectedNode.id, { taskTitle: e.target.value, subject: e.target.value })}
                                                                                                    placeholder="Task title/header..."
                                                                                                    className="mt-1"
                                                                                                    style={sacoreFont}
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Task Description
                                                                                                </Label>
                                                                                                <div className="mt-1">
                                                                                                    <Textarea
                                                                                                        value={selectedNode.content?.taskDescription || ''}
                                                                                                        onChange={(e) => updateNodeContent(selectedNode.id, { taskDescription: e.target.value })}
                                                                                                        placeholder="Describe what should be done manually..."
                                                                                                        rows={4}
                                                                                                        style={sacoreFont}
                                                                                                    />

                                                                                                    {/* Toolbar under textarea */}
                                                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button variant="outline" size="sm">
                                                                                                                    <Hash className="w-4 h-4 mr-1" />
                                                                                                                    Variables
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                                                <DropdownMenuLabel>Insert Variable</DropdownMenuLabel>
                                                                                                                <DropdownMenuSeparator />
                                                                                                                {availableVariables.map(variable => (
                                                                                                                    <DropdownMenuItem
                                                                                                                        key={variable.key}
                                                                                                                        onClick={() => {
                                                                                                                            const variable_text = `{{${variable.key}}}`;
                                                                                                                            const currentValue = selectedNode.content?.taskDescription || '';
                                                                                                                            updateNodeContent(selectedNode.id, { taskDescription: currentValue + variable_text });
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <div>
                                                                                                                            <div className="font-medium">{variable.label}</div>
                                                                                                                            <div className="text-xs text-gray-500">Ex: {variable.example}</div>
                                                                                                                        </div>
                                                                                                                    </DropdownMenuItem>
                                                                                                                ))}
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Task Priority
                                                                                                </Label>
                                                                                                <Select
                                                                                                    value={selectedNode.content?.priority || 'medium'}
                                                                                                    onValueChange={(value) => updateNodeContent(selectedNode.id, { priority: value as 'low' | 'medium' | 'high' })}
                                                                                                >
                                                                                                    <SelectTrigger className="mt-1">
                                                                                                        <SelectValue placeholder="Select priority..." />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="low">Low</SelectItem>
                                                                                                        <SelectItem value="medium">Medium</SelectItem>
                                                                                                        <SelectItem value="high">High</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                    Due Date/Days
                                                                                                </Label>
                                                                                                <div className="flex gap-2 mt-1">
                                                                                                    <div className="flex-1">
                                                                                                        <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                                                            Days from start
                                                                                                        </Label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            value={selectedNode.content?.dueDays || ''}
                                                                                                            onChange={(e) => updateNodeContent(selectedNode.id, { dueDays: parseInt(e.target.value) || undefined })}
                                                                                                            placeholder="e.g., 1"
                                                                                                            min="1"
                                                                                                            style={sacoreFont}
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="flex-1">
                                                                                                        <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                                                            Specific date
                                                                                                        </Label>
                                                                                                        <Input
                                                                                                            type="datetime-local"
                                                                                                            value={selectedNode.content?.dueDate ? new Date(selectedNode.content.dueDate).toISOString().slice(0, 16) : ''}
                                                                                                            onChange={(e) => updateNodeContent(selectedNode.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                                                                                            style={sacoreFont}
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                                                                    Use either days from start OR specific date (specific date takes priority)
                                                                                                </p>
                                                                                            </div>
                                                                                        </>
                                                                                    )}

                                                                                    {/* Delay section - exclude for LinkedIn visits */}
                                                                                    {selectedNode.stepType !== 'linkedin-visit' && (
                                                                                        <div>
                                                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                                                                Delay
                                                                                            </Label>
                                                                                            <div className="flex gap-2 mt-1">
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={selectedNode.content?.delay || 0}
                                                                                                    onChange={(e) => updateNodeContent(selectedNode.id, { delay: parseInt(e.target.value) || 0 })}
                                                                                                    min="0"
                                                                                                    className="flex-1"
                                                                                                    style={sacoreFont}
                                                                                                />
                                                                                                <Select
                                                                                                    value={selectedNode.content?.delayUnit || 'hours'}
                                                                                                    onValueChange={(value) => updateNodeContent(selectedNode.id, { delayUnit: value as 'minutes' | 'hours' | 'days' })}
                                                                                                >
                                                                                                    <SelectTrigger className="w-24">
                                                                                                        <SelectValue />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="minutes">Minutes</SelectItem>
                                                                                                        <SelectItem value="hours">Hours</SelectItem>
                                                                                                        <SelectItem value="days">Days</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            </div>
                                                                                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                                                                How long to wait before this step/condition
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </CardContent>
                                                                            </Card>
                                                                        );
                                                                    })()}
                                                                </motion.div>
                                                            )}
                                                        </div>

                                                        {/* Toolbar */}
                                                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                                                                        Controls:
                                                                    </span>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                        🖱️ Drag to pan
                                                                    </span>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                        🎯 Scroll to zoom
                                                                    </span>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                        📝 Click step to edit
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setShowStepSelector(true)}
                                                                    style={sacoreFont}
                                                                >
                                                                    <Plus className="w-4 h-4 mr-1" />
                                                                    Add Step/Condition
                                                                </Button>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                    {campaignFlow.length} {campaignFlow.length === 1 ? 'step' : 'steps'}
                                                                </span>
                                                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`} style={sacoreFont}>
                                                                    Zoom: {Math.round(zoom * 100)}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Step Selector Modal */}
                                                        {showStepSelector && (
                                                            <motion.div
                                                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                onClick={() => {
                                                                    setShowStepSelector(false);
                                                                    (window as any).pendingConnection = null;
                                                                }}
                                                            >
                                                                <motion.div
                                                                    className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border-2 rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}
                                                                    initial={{ scale: 0.9, y: 20 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={sacoreFont}
                                                                >
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                            Add Step or Condition
                                                                        </h3>
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowStepSelector(false);
                                                                                (window as any).pendingConnection = null;
                                                                            }}
                                                                            className={`text-gray-400 hover:text-gray-600 transition-colors`}
                                                                        >
                                                                            <X className="w-5 h-5" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                                                        <div>
                                                                            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                                Steps
                                                                            </h4>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                {[
                                                                                    { type: 'email', title: 'Email', icon: Mail },
                                                                                    { type: 'linkedin-message', title: 'LinkedIn Message', icon: Send },
                                                                                    { type: 'linkedin-invitation', title: 'LinkedIn Invitation', icon: Users },
                                                                                    { type: 'linkedin-visit', title: 'LinkedIn Visit', icon: Eye },
                                                                                    { type: 'manual-task', title: 'Manual Task', icon: Edit }
                                                                                ].map(step => (
                                                                                    <button
                                                                                        key={step.type}
                                                                                        onClick={() => {
                                                                                            const connection = (window as any).pendingConnection;
                                                                                            if (connection) {
                                                                                                addStepToFlow(step.type, 'step', connection.parentId, connection.parentBranch);
                                                                                            } else {
                                                                                                addStepToFlow(step.type, 'step');
                                                                                            }
                                                                                            (window as any).pendingConnection = null;
                                                                                        }}
                                                                                        className={`p-3 text-left border rounded-lg hover:border-blue-500 transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            {React.createElement(step.icon as any, { className: "w-4 h-4 text-blue-500" })}
                                                                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                                                {step.title}
                                                                                            </span>
                                                                                            {step.type.includes('linkedin') && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="#0077B5">
                                                                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                                                    </svg>
                                                                                                    <span className="text-xs text-blue-600 font-medium">LinkedIn</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                                Conditions
                                                                            </h4>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                {[
                                                                                    { type: 'email-opened', title: 'Email Opened' },
                                                                                    { type: 'email-reply', title: 'Email Replied' },
                                                                                    { type: 'linkedin-connection-check', title: 'LinkedIn Connected' },
                                                                                    { type: 'opened-linkedin-message', title: 'LinkedIn Message Opened' },
                                                                                    { type: 'linkedin-reply-check', title: 'LinkedIn Replied' },
                                                                                    { type: 'clicked-link', title: 'Clicked Link' },
                                                                                    { type: 'has-linkedin', title: 'Has LinkedIn' },
                                                                                    { type: 'has-email', title: 'Has Email' },
                                                                                    { type: 'has-phone', title: 'Has Phone' }
                                                                                ].map(condition => (
                                                                                    <button
                                                                                        key={condition.type}
                                                                                        onClick={() => {
                                                                                            const connection = (window as any).pendingConnection;
                                                                                            if (connection) {
                                                                                                addStepToFlow(condition.type, 'condition', connection.parentId, connection.parentBranch);
                                                                                            } else {
                                                                                                addStepToFlow(condition.type, 'condition');
                                                                                            }
                                                                                            (window as any).pendingConnection = null;
                                                                                        }}
                                                                                        className={`p-3 text-left border rounded-lg hover:border-orange-500 transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <GitBranch className="w-4 h-4 text-orange-500" />
                                                                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                                                {condition.title}
                                                                                            </span>
                                                                                            {(condition.type.includes('linkedin') || condition.type === 'linkedin-connection-check') && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="#0077B5">
                                                                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                                                    </svg>
                                                                                                    <span className="text-xs text-blue-600 font-medium">LinkedIn</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {currentStep === 4 && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                            Launch Options
                                                        </Label>
                                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`} style={sacoreFont}>
                                                            Choose when to launch your campaign
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowCreateCampaignSettings(true)}
                                                        className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                                        style={sacoreFont}
                                                    >
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Settings
                                                    </Button>
                                                </div>

                                                <div className="space-y-3">
                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${schedulingOption === 'immediate'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white'}`}
                                                        onClick={() => setSchedulingOption('immediate')}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedulingOption === 'immediate' ? 'border-black bg-black' : 'border-gray-300'
                                                                    }`}>
                                                                    {schedulingOption === 'immediate' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                                </div>
                                                                <div>
                                                                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                        Launch Immediately
                                                                    </h3>
                                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                        Start sending emails right away
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    <Card
                                                        className={`cursor-pointer border-2 transition-all duration-200 ${schedulingOption === 'draft'
                                                            ? 'border-black bg-gray-100'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            } ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white'}`}
                                                        onClick={() => setSchedulingOption('draft')}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedulingOption === 'draft' ? 'border-black bg-black' : 'border-gray-300'
                                                                    }`}>
                                                                    {schedulingOption === 'draft' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                                </div>
                                                                <div>
                                                                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                        Save as Draft
                                                                    </h3>
                                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                                        Save campaign and launch manually later
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <Card className={`${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                            Campaign Summary
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Campaign Name:</span>
                                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{campaignName || 'Untitled'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Description:</span>
                                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{campaignDescription || 'None'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Prospects:</span>
                                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{prospectCount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Email Sequence:</span>
                                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{emailSequences.length} emails</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}

                                        {/* Add other steps here... this is just step 1 for now */}
                                    </motion.div>
                                </AnimatePresence>
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setIsCreateMode(false)}
                                style={sacoreFont}
                            >
                                {currentStep > 1 ? 'Previous' : 'Cancel'}
                            </Button>
                            <div className="flex space-x-2">
                                {currentStep < 4 ? (
                                    <Button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        disabled={!isStepValid(currentStep)}
                                        style={sacoreFont}
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={editingCampaignId ? handleUpdateCampaign : handleCreateCampaign}
                                        disabled={!isStepValid(currentStep)}
                                        className="bg-black hover:bg-gray-800 text-white"
                                        style={sacoreFont}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {editingCampaignId
                                            ? (schedulingOption === 'immediate' ? 'Update & Launch Campaign' : 'Update Campaign')
                                            : (schedulingOption === 'immediate' ? 'Launch Campaign' : 'Save as Draft')
                                        }
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Analysis Criteria Modal (create mode) */}
                        <AnalysisCriteriaModal />

                        {/* Deep Analysis Modal (create mode) */}
                        <DeepAnalysisModal
                            isOpen={isDeepAnalysisModalOpen}
                            onClose={() => {
                                setIsDeepAnalysisModalOpen(false);
                                setDeepAnalysisSelectedCandidateId(null);
                                setDeepAnalysisSelectedCandidate(null);
                            }}
                            lead={deepAnalysisSelectedCandidate}
                            analysisResult={deepAnalysisSelectedCandidateId ? deepAnalysisResultsMap[deepAnalysisSelectedCandidateId] : null}
                        />

                        {/* Create Campaign Settings Modal */}
                        <Dialog open={showCreateCampaignSettings} onOpenChange={setShowCreateCampaignSettings}>
                            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                                <DialogHeader>
                                    <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                        Campaign Settings - {campaignName || 'New Campaign'}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-6">
                                    <CampaignSettings
                                        campaignSettings={createCampaignSettings || {}}
                                        updateCampaignSetting={updateCreateCampaignSetting}
                                        handleSaveCampaignSettings={handleSaveCreateCampaignSettings}
                                        isSavingSettings={false}
                                        isDarkMode={isDarkMode}
                                        timezones={timezones}
                                        isTimezonesLoading={isTimezonesLoading}
                                        safetyPresets={safetyPresets}
                                        isPresetsLoading={isPresetsLoading}
                                        applyPreset={handleCreateCampaignPresetApply}
                                        isApplyingPreset={false}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        );
    }

    // Campaign detail view
    if (selectedCampaign) {
        return (
            <>
                <div className={`min-h-screen ${isDarkMode ? 'bg-primary' : 'bg-white'} py-3 px-3`}>
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBackToCampaigns}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back to Campaigns
                                </Button>
                                <div>
                                    <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                        {selectedCampaign.name}
                                    </h1>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
                                        Campaign Details
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {isLoadingEditStatus ? (
                                    <div className="flex items-center gap-2">
                                        <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
                                    </div>
                                ) : (
                                    <>
                                        {campaignEditStatus?.canPause && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePauseCampaign(selectedCampaign._id)}
                                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                                size="sm"
                                            >
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause Campaign
                                            </Button>
                                        )}

                                        {campaignEditStatus?.canResume && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleResumeCampaign(selectedCampaign._id)}
                                                className="border-green-500 text-green-600 hover:bg-green-50"
                                                size="sm"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume Campaign
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            {[
                                { id: 'overview', label: 'Overview', icon: Target },
                                { id: 'sequence', label: 'Sequence', icon: Mail },
                                { id: 'leads', label: 'Lead List', icon: Users },
                                { id: 'launch', label: 'Launch', icon: Send }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCampaignDetailTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${campaignDetailTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {campaignDetailTab === 'overview' && (
                            <div className="space-y-4">
                                {/* Detailed Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-3">
                                            <div className="text-center">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                    Total Prospects
                                                </p>
                                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {selectedCampaign.prospects?.length || 0}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-3">
                                            <div className="text-center">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                    Emails Sent
                                                </p>
                                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {selectedCampaign.stats?.emailsSent || 0}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-3">
                                            <div className="text-center">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                    Open Rate
                                                </p>
                                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {selectedCampaign.stats?.openRate || 0}%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-3">
                                            <div className="text-center">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                    Reply Rate
                                                </p>
                                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {selectedCampaign.stats?.replyRate || 0}%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-3">
                                            <div className="text-center">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                    Click Rate
                                                </p>
                                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {selectedCampaign.stats?.clickRate || 0}%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Campaign Info */}
                                <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                            Campaign Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</label>
                                                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCampaign.status}</p>
                                            </div>
                                            <div>
                                                <label className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created:</label>
                                                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedCampaign.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Description:</label>
                                                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCampaign.description || 'No description'}</p>
                                            </div>
                                            <div>
                                                <label className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sequence Steps:</label>
                                                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCampaign.sequence?.length || 0} steps</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {campaignDetailTab === 'sequence' && (
                            <div className="space-y-4">
                                <div>
                                    <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                        Campaign Flow Builder
                                    </Label>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                        Build your campaign sequence with steps and conditions
                                    </p>
                                </div>

                                {/* Main Canvas with Editor Panel */}
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Flow Canvas */}
                                    <div className={`${selectedNodeForEdit ? 'col-span-8' : 'col-span-12'} transition-all duration-300`}>
                                        <div
                                            ref={canvasRef}
                                            className={`relative w-full h-[600px] border-2 border-dashed rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}
                                            onWheel={handleWheel}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={handleMouseUp}
                                            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                                        >
                                            {/* Canvas Controls */}
                                            <div className="absolute top-4 right-4 flex gap-2 z-20">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
                                                    className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                    title="Zoom In"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.1))}
                                                    className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                    title="Zoom Out"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={resetView}
                                                    className={`backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-600 hover:bg-gray-700' : 'bg-white/90'}`}
                                                    title="Reset View"
                                                >
                                                    <Target className="w-4 h-4" />
                                                </Button>
                                                <div className={`px-2 py-1 backdrop-blur-sm rounded text-xs font-medium ${isDarkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90'}`}>
                                                    {Math.round(zoom * 100)}%
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (!selectedCampaign) return;
                                                        if (!campaignEditStatus?.canEdit) {
                                                            toast({
                                                                title: "Cannot Save Changes",
                                                                description: "Please pause the campaign first to save changes.",
                                                                variant: "destructive"
                                                            });
                                                            return;
                                                        }

                                                        try {
                                                            setIsSavingNode(true);

                                                            const sequenceData = campaignFlow.map(node => ({
                                                                id: node.id,
                                                                stepType: node.type === 'condition' ? node.conditionType : node.stepType,
                                                                parentId: (node as any).parentId,
                                                                parentBranch: (node as any).parentBranch,
                                                                content: {
                                                                    subject: node.content?.subject,
                                                                    message: node.content?.message,
                                                                    taskTitle: node.content?.taskTitle,
                                                                    taskDescription: node.content?.taskDescription,
                                                                    priority: node.content?.priority,
                                                                    dueDays: node.content?.dueDays,
                                                                    dueDate: node.content?.dueDate,
                                                                    delay: node.content?.delay ?? 0,
                                                                    delayUnit: node.content?.delayUnit || 'hours',
                                                                    emailAddresses: node.content?.emailAddresses || [],
                                                                    linkedinAccount: node.content?.linkedinAccount,
                                                                    attachments: node.content?.attachments || [],
                                                                    variables: node.content?.variables || []
                                                                },
                                                                x: node.position?.x,
                                                                y: node.position?.y
                                                            }));

                                                            const editStatus = await getCampaignEditStatus(selectedCampaign._id);
                                                            const isPausedAndEditable = editStatus?.editStatus?.campaignStatus === 'paused' && editStatus?.editStatus?.canEdit;

                                                            if (isPausedAndEditable) {
                                                                await authService.updatePausedCampaign(selectedCampaign._id, { sequence: sequenceData });
                                                            } else {
                                                                await authService.updateCampaign(selectedCampaign._id, { sequence: sequenceData });
                                                            }

                                                            toast({
                                                                title: "Flow Saved",
                                                                description: "Campaign sequence has been saved successfully.",
                                                            });
                                                        } catch (error: any) {
                                                            console.error('Error saving flow:', error);
                                                            toast({
                                                                title: "Error",
                                                                description: error?.message || "Failed to save flow. Please try again.",
                                                                variant: "destructive"
                                                            });
                                                        } finally {
                                                            setIsSavingNode(false);
                                                        }
                                                    }}
                                                    disabled={isSavingNode || !campaignEditStatus?.canEdit}
                                                    className={`backdrop-blur-sm ${!campaignEditStatus?.canEdit
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-600'
                                                        : 'bg-blue-600/90 hover:bg-blue-700/90 text-white'
                                                        }`}
                                                    title={!campaignEditStatus?.canEdit ? "Pause campaign to save changes" : "Save Flow"}
                                                >
                                                    {isSavingNode ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                    ) : (
                                                        <Save className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Zoomable Container */}
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                                                    transformOrigin: 'center',
                                                }}
                                            >
                                                <div className="p-8 min-h-full relative">
                                                    {/* Connection Lines SVG */}
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>

                                                        {campaignFlow.map((node) => {
                                                            console.log(`Node ${node.id}: type=${node.type}, connections=${JSON.stringify(node.connections)}, branchConnections=${JSON.stringify(node.branchConnections)}`);
                                                            const lines = [];
                                                            const pos = node?.position || { x: 0, y: 0 };
                                                            const nodeX = (pos.x ?? 0) + 132 + 32; // Center of 264px wide node + padding offset
                                                            const nodeY = (pos.y ?? 0) + 64 + 32;  // Center of node height + padding offset

                                                            if (node.type === 'condition' && node.branchConnections) {
                                                                // Yes branch connections
                                                                console.log(`Condition node ${node.id} yes branch:`, node.branchConnections.yes);
                                                                node.branchConnections.yes?.forEach(targetId => {
                                                                    console.log(`Looking for yes target ${targetId}`);
                                                                    const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                    console.log(`Found yes target:`, targetNode ? 'YES' : 'NO');
                                                                    if (targetNode) {
                                                                        const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                        const targetX = (targetPos.x ?? 0) + 132 + 32; // Add padding offset
                                                                        const targetY = (targetPos.y ?? 0) + 10 + 32;  // Add padding offset, position arrow before node
                                                                        console.log(`Creating YES branch from (${nodeX - 50}, ${nodeY + 40}) to (${targetX}, ${targetY})`);
                                                                        lines.push(
                                                                            <g key={`yes-${node.id}-${targetId}`}>
                                                                                <path
                                                                                    d={`M ${nodeX - 50} ${nodeY + 40} L ${nodeX - 100} ${nodeY + 40} L ${nodeX - 100} ${targetY - 20} L ${targetX} ${targetY - 20} L ${targetX} ${targetY}`}
                                                                                    stroke="green"
                                                                                    strokeWidth="2"
                                                                                    fill="none"
                                                                                    strokeDasharray="5,5"
                                                                                    markerEnd="url(#arrowhead-yes)"
                                                                                />
                                                                                <text
                                                                                    x={nodeX - 120}
                                                                                    y={nodeY + 35}
                                                                                    className="text-xs fill-green-600"
                                                                                    style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                                                                                >
                                                                                    Yes
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    }
                                                                });

                                                                // No branch connections
                                                                node.branchConnections.no?.forEach(targetId => {
                                                                    const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                    if (targetNode) {
                                                                        const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                        const targetX = (targetPos.x ?? 0) + 132 + 32; // Add padding offset
                                                                        const targetY = (targetPos.y ?? 0) + 10 + 32;  // Add padding offset, position arrow before node
                                                                        lines.push(
                                                                            <g key={`no-${node.id}-${targetId}`}>
                                                                                <path
                                                                                    d={`M ${nodeX + 50} ${nodeY + 40} L ${nodeX + 100} ${nodeY + 40} L ${nodeX + 100} ${targetY - 20} L ${targetX} ${targetY - 20} L ${targetX} ${targetY}`}
                                                                                    stroke={isDarkMode ? '#ef4444' : '#dc2626'}
                                                                                    strokeWidth="2"
                                                                                    fill="none"
                                                                                    strokeDasharray="5,5"
                                                                                    markerEnd="url(#arrowhead-no)"
                                                                                />
                                                                                <text
                                                                                    x={nodeX + 80}
                                                                                    y={nodeY + 35}
                                                                                    className="text-xs fill-red-600"
                                                                                    style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                                                                                >
                                                                                    No
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    }
                                                                });
                                                            } else {
                                                                // Regular step connections
                                                                console.log(`Regular node ${node.id} connections:`, node.connections);
                                                                node.connections?.forEach(targetId => {
                                                                    console.log(`Looking for regular target ${targetId}`);
                                                                    const targetNode = campaignFlow.find(n => n.id === targetId);
                                                                    console.log(`Found regular target:`, targetNode ? 'YES' : 'NO');
                                                                    if (targetNode) {
                                                                        const targetPos = targetNode?.position || { x: 0, y: 0 };
                                                                        const targetX = (targetPos.x ?? 0) + 132 + 32; // Add padding offset
                                                                        const targetY = (targetPos.y ?? 0) + 10 + 32;  // Add padding offset, position arrow before node
                                                                        console.log(`Creating line from (${nodeX}, ${nodeY + 40}) to (${targetX}, ${targetY})`);
                                                                        lines.push(
                                                                            <line
                                                                                key={`main-${node.id}-${targetId}`}
                                                                                x1={nodeX}
                                                                                y1={nodeY + 40}
                                                                                x2={targetX}
                                                                                y2={targetY}
                                                                                stroke={isDarkMode ? '#3b82f6' : '#1d4ed8'}
                                                                                strokeWidth="2"
                                                                                markerEnd="url(#arrowhead-main)"
                                                                            />
                                                                        );
                                                                    }
                                                                });
                                                            }

                                                            console.log(`Node ${node.id} created ${lines.length} lines`);
                                                            return lines;
                                                        })}

                                                        {/* Arrow markers */}
                                                        <defs>
                                                            <marker
                                                                id="arrowhead-main"
                                                                markerWidth="10"
                                                                markerHeight="7"
                                                                refX="9"
                                                                refY="3.5"
                                                                orient="auto"
                                                            >
                                                                <polygon
                                                                    points="0 0, 10 3.5, 0 7"
                                                                    fill={isDarkMode ? '#3b82f6' : '#1d4ed8'}
                                                                />
                                                            </marker>
                                                            <marker
                                                                id="arrowhead-yes"
                                                                markerWidth="10"
                                                                markerHeight="7"
                                                                refX="9"
                                                                refY="3.5"
                                                                orient="auto"
                                                            >
                                                                <polygon
                                                                    points="0 0, 10 3.5, 0 7"
                                                                    fill="green"
                                                                />
                                                            </marker>
                                                            <marker
                                                                id="arrowhead-no"
                                                                markerWidth="10"
                                                                markerHeight="7"
                                                                refX="9"
                                                                refY="3.5"
                                                                orient="auto"
                                                            >
                                                                <polygon
                                                                    points="0 0, 10 3.5, 0 7"
                                                                    fill={isDarkMode ? '#ef4444' : '#dc2626'}
                                                                />
                                                            </marker>
                                                        </defs>
                                                    </svg>

                                                    {/* Flow Nodes */}
                                                    <div className="relative z-10">
                                                        {campaignFlow.map((node, index) => (
                                                            <motion.div
                                                                key={node.id}
                                                                className={`absolute cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border-2 rounded-lg shadow-lg w-64`}
                                                                style={{
                                                                    left: `${(node?.position?.x ?? 0)}px`,
                                                                    top: `${(node?.position?.y ?? 0)}px`,
                                                                    ...sacoreFont
                                                                }}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                                onClick={() => {
                                                                    handleNodeEdit(node.id);
                                                                }}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            {node.type === 'step' ? (
                                                                                <>
                                                                                    {node.stepType === 'email' && <Mail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                    {node.stepType === 'linkedin-message' && <Send className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                    {node.stepType === 'linkedin-invitation' && <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                    {node.stepType === 'linkedin-visit' && <Eye className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                    {node.stepType === 'manual-task' && <Edit className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                                                                </>
                                                                            ) : (
                                                                                <GitBranch className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                                                            )}
                                                                            <span className={`text-xs px-2 py-1 rounded-full ${node.type === 'step' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                                {node.type === 'step' ? 'Step' : 'Condition'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                        {node.title}
                                                                    </h4>

                                                                    {node.content?.subject && node.stepType !== 'manual-task' && (
                                                                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            Subject: {node.content.subject}
                                                                        </p>
                                                                    )}

                                                                    {node.content?.message && (
                                                                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                                                            {node.content.message}
                                                                        </p>
                                                                    )}

                                                                    {node.stepType === 'manual-task' && node.content?.subject && (
                                                                        <p className={`text-xs mb-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                                                                            {node.content.subject}
                                                                        </p>
                                                                    )}

                                                                    {node.content?.taskDescription && (
                                                                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                                                            {node.content.taskDescription}
                                                                        </p>
                                                                    )}

                                                                    {/* Delay information */}
                                                                    {node.content?.delay !== undefined && node.content.delay > 0 && (
                                                                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                                                                            ⏱️ Wait {node.content.delay} {node.content.delayUnit === 'days' ? (node.content.delay === 1 ? 'day' : 'days') : node.content.delayUnit === 'hours' ? (node.content.delay === 1 ? 'hour' : 'hours') : (node.content.delay === 1 ? 'minute' : 'minutes')}
                                                                        </p>
                                                                    )}

                                                                    {/* Condition branches - only show buttons for branches without children */}
                                                                    {node.type === 'condition' && (() => {
                                                                        // Check which branches already have children
                                                                        const hasYesChild = campaignFlow.some(childNode =>
                                                                            childNode.parentId === node.id && childNode.parentBranch === 'yes'
                                                                        );
                                                                        const hasNoChild = campaignFlow.some(childNode =>
                                                                            childNode.parentId === node.id && childNode.parentBranch === 'no'
                                                                        );

                                                                        // Only show the div if at least one branch is available
                                                                        if (hasYesChild && hasNoChild) return null;

                                                                        return (
                                                                            <div className="flex justify-between mt-3 text-xs">
                                                                                {!hasYesChild && (
                                                                                    <button
                                                                                        className={`flex items-center p-1 rounded transition-colors ${!campaignEditStatus?.canEdit
                                                                                            ? 'opacity-50 cursor-not-allowed'
                                                                                            : 'hover:bg-green-50'
                                                                                            }`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (!campaignEditStatus?.canEdit) {
                                                                                                toast({
                                                                                                    title: "Cannot Add Steps",
                                                                                                    description: "Please pause the campaign first to add new steps.",
                                                                                                    variant: "destructive"
                                                                                                });
                                                                                                return;
                                                                                            }
                                                                                            setShowStepSelector(true);
                                                                                            (window as any).pendingConnection = { parentId: node.id, parentBranch: 'yes' };
                                                                                        }}
                                                                                        disabled={!campaignEditStatus?.canEdit}
                                                                                    >
                                                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                                                                        <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>Yes</span>
                                                                                        <Plus className="w-3 h-3 ml-1 opacity-50" />
                                                                                    </button>
                                                                                )}
                                                                                {hasYesChild && !hasNoChild && <div></div>} {/* Spacer for alignment */}
                                                                                {!hasNoChild && (
                                                                                    <button
                                                                                        className={`flex items-center p-1 rounded transition-colors ${!campaignEditStatus?.canEdit
                                                                                            ? 'opacity-50 cursor-not-allowed'
                                                                                            : 'hover:bg-red-50'
                                                                                            }`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (!campaignEditStatus?.canEdit) {
                                                                                                toast({
                                                                                                    title: "Cannot Add Steps",
                                                                                                    description: "Please pause the campaign first to add new steps.",
                                                                                                    variant: "destructive"
                                                                                                });
                                                                                                return;
                                                                                            }
                                                                                            setShowStepSelector(true);
                                                                                            (window as any).pendingConnection = { parentId: node.id, parentBranch: 'no' };
                                                                                        }}
                                                                                        disabled={!campaignEditStatus?.canEdit}
                                                                                    >
                                                                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                                                                        <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>No</span>
                                                                                        <Plus className="w-3 h-3 ml-1 opacity-50" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* Add step button for regular steps - only show on leaf nodes */}
                                                                    {node.type === 'step' && (() => {
                                                                        // Check if this node has any children (is not a leaf node)
                                                                        const hasChildren = campaignFlow.some(childNode =>
                                                                            childNode.parentId === node.id
                                                                        );
                                                                        return !hasChildren;
                                                                    })() && (
                                                                            <div className="mt-3 flex justify-center">
                                                                                <button
                                                                                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${!campaignEditStatus?.canEdit
                                                                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                                                                                        : isDarkMode
                                                                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                                                                        }`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (!campaignEditStatus?.canEdit) {
                                                                                            toast({
                                                                                                title: "Cannot Add Steps",
                                                                                                description: "Please pause the campaign first to add new steps.",
                                                                                                variant: "destructive"
                                                                                            });
                                                                                            return;
                                                                                        }
                                                                                        setShowStepSelector(true);
                                                                                        (window as any).pendingConnection = { parentId: node.id, parentBranch: 'main' };
                                                                                    }}
                                                                                    disabled={!campaignEditStatus?.canEdit}
                                                                                >
                                                                                    <Plus className="w-3 h-3 mr-1" />
                                                                                    Add Step
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                </CardContent>
                                                            </motion.div>
                                                        ))}

                                                    </div>

                                                    {/* Empty state */}
                                                    {campaignFlow.length === 0 && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <Mail className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                                                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No sequence steps configured</p>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setShowStepSelector(true);
                                                                        (window as any).pendingConnection = null; // No parent for first step
                                                                    }}
                                                                    className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700'}`}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Add First Step
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step Selector Modal for Campaign Detail View */}
                                        {showStepSelector && (
                                            <motion.div
                                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                onClick={() => {
                                                    setShowStepSelector(false);
                                                    (window as any).pendingConnection = null;
                                                }}
                                            >
                                                <motion.div
                                                    className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border-2 rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}
                                                    initial={{ scale: 0.9, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={sacoreFont}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                            Add Step or Condition
                                                        </h3>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setShowStepSelector(false);
                                                                (window as any).pendingConnection = null;
                                                            }}
                                                            className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                                        <div>
                                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                Steps
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {[
                                                                    { type: 'email', title: 'Email', icon: Mail },
                                                                    { type: 'linkedin-message', title: 'LinkedIn Message', icon: Send },
                                                                    { type: 'linkedin-invitation', title: 'LinkedIn Invitation', icon: Users },
                                                                    { type: 'linkedin-visit', title: 'LinkedIn Visit', icon: Eye },
                                                                    { type: 'manual-task', title: 'Manual Task', icon: Edit }
                                                                ].map(step => {
                                                                    const IconComponent = step.icon;
                                                                    return (
                                                                        <Button
                                                                            key={step.type}
                                                                            variant="outline"
                                                                            className={`h-auto p-3 flex flex-col items-center gap-2 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                                                            onClick={() => {
                                                                                const pendingConnection = (window as any).pendingConnection;

                                                                                // Calculate position relative to parent node
                                                                                let newPosition = { x: 100, y: 100 }; // Default position for first node

                                                                                if (pendingConnection?.parentId) {
                                                                                    const parentNode = campaignFlow.find(node => node.id === pendingConnection.parentId);
                                                                                    if (parentNode) {
                                                                                        const parentPos = parentNode.position || { x: 100, y: 100 };

                                                                                        if (pendingConnection.parentBranch === 'yes') {
                                                                                            // Position to the left for "yes" branch
                                                                                            newPosition = { x: parentPos.x - 200, y: parentPos.y + 200 };
                                                                                        } else if (pendingConnection.parentBranch === 'no') {
                                                                                            // Position to the right for "no" branch
                                                                                            newPosition = { x: parentPos.x + 200, y: parentPos.y + 200 };
                                                                                        } else {
                                                                                            // Position below for main branch
                                                                                            newPosition = { x: parentPos.x, y: parentPos.y + 200 };
                                                                                        }
                                                                                    }
                                                                                }

                                                                                const newNode = {
                                                                                    id: Date.now().toString(),
                                                                                    type: 'step' as const,
                                                                                    stepType: step.type as any,
                                                                                    title: step.title,
                                                                                    position: newPosition,
                                                                                    connections: [],
                                                                                    parentId: pendingConnection?.parentId,
                                                                                    parentBranch: pendingConnection?.parentBranch || 'main',
                                                                                    content: {
                                                                                        delay: 0,
                                                                                        delayUnit: 'hours'
                                                                                    }
                                                                                };

                                                                                // Update campaign flow and parent connections
                                                                                setCampaignFlow(prev => {
                                                                                    const updatedFlow = [...prev, newNode];

                                                                                    // Update parent node's connection arrays
                                                                                    if (pendingConnection?.parentId) {
                                                                                        const parentIndex = updatedFlow.findIndex(node => node.id === pendingConnection.parentId);
                                                                                        if (parentIndex !== -1) {
                                                                                            const parentNode = updatedFlow[parentIndex];

                                                                                            if (parentNode.type === 'condition') {
                                                                                                // Update branch connections for condition nodes
                                                                                                if (pendingConnection.parentBranch === 'yes') {
                                                                                                    if (!parentNode.branchConnections) parentNode.branchConnections = { yes: [], no: [] };
                                                                                                    if (!parentNode.branchConnections.yes.includes(newNode.id)) {
                                                                                                        parentNode.branchConnections.yes.push(newNode.id);
                                                                                                    }
                                                                                                } else if (pendingConnection.parentBranch === 'no') {
                                                                                                    if (!parentNode.branchConnections) parentNode.branchConnections = { yes: [], no: [] };
                                                                                                    if (!parentNode.branchConnections.no.includes(newNode.id)) {
                                                                                                        parentNode.branchConnections.no.push(newNode.id);
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                // Update main connections for step nodes
                                                                                                if (!parentNode.connections.includes(newNode.id)) {
                                                                                                    parentNode.connections.push(newNode.id);
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }

                                                                                    return updatedFlow;
                                                                                });

                                                                                setShowStepSelector(false);
                                                                                (window as any).pendingConnection = null;
                                                                            }}
                                                                        >
                                                                            <IconComponent className="w-4 h-4" />
                                                                            <span className="text-xs">{step.title}</span>
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                Conditions
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {[
                                                                    { type: 'email-opened', title: 'Opened Email' },
                                                                    { type: 'email-reply', title: 'Email Replied' },
                                                                    { type: 'linkedin-connection-check', title: 'LinkedIn Connected' },
                                                                    { type: 'opened-linkedin-message', title: 'Opened LinkedIn Message' },
                                                                    { type: 'linkedin-reply-check', title: 'LinkedIn Replied' },
                                                                    { type: 'clicked-link', title: 'Clicked Link' },
                                                                    { type: 'has-linkedin', title: 'Has LinkedIn Profile' },
                                                                    { type: 'has-email', title: 'Has Email Address' },
                                                                    { type: 'has-phone', title: 'Has Phone Number' }
                                                                ].map(condition => (
                                                                    <Button
                                                                        key={condition.type}
                                                                        variant="outline"
                                                                        className={`h-auto p-3 flex flex-col items-center gap-2 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                                                        onClick={() => {
                                                                            const pendingConnection = (window as any).pendingConnection;

                                                                            // Calculate position relative to parent node
                                                                            let newPosition = { x: 100, y: 100 }; // Default position for first node

                                                                            if (pendingConnection?.parentId) {
                                                                                const parentNode = campaignFlow.find(node => node.id === pendingConnection.parentId);
                                                                                if (parentNode) {
                                                                                    const parentPos = parentNode.position || { x: 100, y: 100 };

                                                                                    if (pendingConnection.parentBranch === 'yes') {
                                                                                        // Position to the left for "yes" branch
                                                                                        newPosition = { x: parentPos.x - 200, y: parentPos.y + 200 };
                                                                                    } else if (pendingConnection.parentBranch === 'no') {
                                                                                        // Position to the right for "no" branch
                                                                                        newPosition = { x: parentPos.x + 200, y: parentPos.y + 200 };
                                                                                    } else {
                                                                                        // Position below for main branch
                                                                                        newPosition = { x: parentPos.x, y: parentPos.y + 200 };
                                                                                    }
                                                                                }
                                                                            }

                                                                            const newNode = {
                                                                                id: Date.now().toString(),
                                                                                type: 'condition' as const,
                                                                                conditionType: condition.type,
                                                                                title: condition.title,
                                                                                position: newPosition,
                                                                                connections: [],
                                                                                branchConnections: { yes: [], no: [] },
                                                                                parentId: pendingConnection?.parentId,
                                                                                parentBranch: pendingConnection?.parentBranch || 'main',
                                                                                content: {
                                                                                    delay: 0,
                                                                                    delayUnit: 'hours'
                                                                                }
                                                                            };

                                                                            // Update campaign flow and parent connections
                                                                            setCampaignFlow(prev => {
                                                                                const updatedFlow = [...prev, newNode];

                                                                                // Update parent node's connection arrays
                                                                                if (pendingConnection?.parentId) {
                                                                                    const parentIndex = updatedFlow.findIndex(node => node.id === pendingConnection.parentId);
                                                                                    if (parentIndex !== -1) {
                                                                                        const parentNode = updatedFlow[parentIndex];

                                                                                        if (parentNode.type === 'condition') {
                                                                                            // Update branch connections for condition nodes
                                                                                            if (pendingConnection.parentBranch === 'yes') {
                                                                                                if (!parentNode.branchConnections) parentNode.branchConnections = { yes: [], no: [] };
                                                                                                if (!parentNode.branchConnections.yes.includes(newNode.id)) {
                                                                                                    parentNode.branchConnections.yes.push(newNode.id);
                                                                                                }
                                                                                            } else if (pendingConnection.parentBranch === 'no') {
                                                                                                if (!parentNode.branchConnections) parentNode.branchConnections = { yes: [], no: [] };
                                                                                                if (!parentNode.branchConnections.no.includes(newNode.id)) {
                                                                                                    parentNode.branchConnections.no.push(newNode.id);
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            // Update main connections for step nodes
                                                                                            if (!parentNode.connections.includes(newNode.id)) {
                                                                                                parentNode.connections.push(newNode.id);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }

                                                                                return updatedFlow;
                                                                            });

                                                                            setShowStepSelector(false);
                                                                            (window as any).pendingConnection = null;
                                                                        }}
                                                                    >
                                                                        <GitBranch className="w-4 h-4" />
                                                                        <span className="text-xs text-center">{condition.title}</span>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Editor Panel */}
                                    {selectedNodeForEdit && (
                                        <motion.div
                                            className="col-span-4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            {(() => {
                                                const selectedNode = campaignFlow.find(n => n.id === selectedNodeForEdit);
                                                if (!selectedNode) return null;

                                                return (
                                                    <Card className={`${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'} h-fit`}>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                                    Edit {selectedNode.title}
                                                                </CardTitle>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setSelectedNodeForEdit(null)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            {selectedNode.stepType === 'email' && (
                                                                <>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Subject
                                                                        </Label>
                                                                        <Input
                                                                            value={editingNodeContent?.subject || selectedNode.content?.subject || ''}
                                                                            onChange={(e) => handleNodeContentChange('subject', e.target.value)}
                                                                            placeholder="Email subject..."
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Message
                                                                        </Label>
                                                                        <Textarea
                                                                            value={editingNodeContent?.message || selectedNode.content?.message || ''}
                                                                            onChange={(e) => handleNodeContentChange('message', e.target.value)}
                                                                            placeholder="Email content..."
                                                                            rows={4}
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            {selectedNode.stepType === 'linkedin-message' && (
                                                                <>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Message
                                                                        </Label>
                                                                        <Textarea
                                                                            value={editingNodeContent?.message || selectedNode.content?.message || ''}
                                                                            onChange={(e) => handleNodeContentChange('message', e.target.value)}
                                                                            placeholder="LinkedIn message..."
                                                                            rows={4}
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>

                                                                    {/* Show attachments if any */}
                                                                    {selectedNode.content?.attachments && selectedNode.content.attachments.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                Attachments:
                                                                            </Label>
                                                                            {selectedNode.content.attachments.map(attachment => (
                                                                                <div key={attachment.id} className={`flex items-center gap-3 p-3 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                                    {attachment.category === 'image' ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Image className="w-4 h-4" />
                                                                                            {attachment.url && (
                                                                                                <img
                                                                                                    src={attachment.url}
                                                                                                    alt={attachment.name}
                                                                                                    className="w-10 h-10 object-cover rounded border"
                                                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <FileText className="w-4 h-4" />
                                                                                    )}
                                                                                    <div>
                                                                                        <div className="text-sm font-medium">{attachment.name}</div>
                                                                                        <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {selectedNode.stepType === 'linkedin-invitation' && (
                                                                <>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Invitation Message
                                                                        </Label>
                                                                        <Textarea
                                                                            value={editingNodeContent?.message || selectedNode.content?.message || ''}
                                                                            onChange={(e) => handleNodeContentChange('message', e.target.value)}
                                                                            placeholder="LinkedIn invitation message..."
                                                                            rows={3}
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            {selectedNode.stepType === 'linkedin-visit' && (
                                                                <>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Visit Action
                                                                        </Label>
                                                                        <Input
                                                                            value="Visit LinkedIn Profile"
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            {/* LinkedIn Extension Status - Show for all LinkedIn steps */}
                                                            {(selectedNode.stepType === 'linkedin-message' ||
                                                                selectedNode.stepType === 'linkedin-invitation' ||
                                                                selectedNode.stepType === 'linkedin-visit') && (
                                                                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                                LinkedIn Extension Status
                                                                            </Label>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={loadLinkedInExtensionStatus}
                                                                                disabled={linkedinExtensionLoading}
                                                                                className="h-6 px-2"
                                                                            >
                                                                                <RefreshCw className={`w-3 h-3 ${linkedinExtensionLoading ? 'animate-spin' : ''}`} />
                                                                            </Button>
                                                                        </div>

                                                                        {linkedinExtensionLoading ? (
                                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                                                <span>Checking extension status...</span>
                                                                            </div>
                                                                        ) : linkedinExtensionStatus ? (
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-2 h-2 rounded-full ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'bg-green-500' :
                                                                                        linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'bg-yellow-500' :
                                                                                            'bg-red-500'
                                                                                        }`}></div>
                                                                                    <span className={`text-sm font-medium ${linkedinExtensionStatus.isOnline && linkedinExtensionStatus.isActive ? 'text-green-600 dark:text-green-400' :
                                                                                        linkedinExtensionStatus.isActive && !linkedinExtensionStatus.isOnline ? 'text-yellow-600 dark:text-yellow-400' :
                                                                                            'text-red-600 dark:text-red-400'
                                                                                        }`}>
                                                                                        {linkedinExtensionStatus.status.charAt(0).toUpperCase() + linkedinExtensionStatus.status.slice(1)}
                                                                                    </span>
                                                                                </div>

                                                                                <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                                    {linkedinExtensionStatus.message}
                                                                                </p>

                                                                                {linkedinExtensionStatus.lastSeen && (
                                                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                                                        <div>Last seen: {linkedinExtensionStatus.timeSinceLastSeen}</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-sm text-red-600 dark:text-red-400">
                                                                                Unable to connect to extension
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                            {selectedNode.stepType === 'manual-task' && (
                                                                <>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Task Title
                                                                        </Label>
                                                                        <Input
                                                                            value={editingNodeContent?.taskTitle || selectedNode.content?.taskTitle || selectedNode.content?.subject || ''}
                                                                            onChange={(e) => handleNodeContentChange('taskTitle', e.target.value)}
                                                                            placeholder="Task title..."
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Description
                                                                        </Label>
                                                                        <Textarea
                                                                            value={editingNodeContent?.taskDescription || selectedNode.content?.taskDescription || ''}
                                                                            onChange={(e) => handleNodeContentChange('taskDescription', e.target.value)}
                                                                            placeholder="Task description..."
                                                                            rows={3}
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Priority
                                                                        </Label>
                                                                        <Select
                                                                            value={editingNodeContent?.priority || selectedNode.content?.priority || 'medium'}
                                                                            onValueChange={(value) => handleNodeContentChange('priority', value)}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        >
                                                                            <SelectTrigger className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="low">Low</SelectItem>
                                                                                <SelectItem value="medium">Medium</SelectItem>
                                                                                <SelectItem value="high">High</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div>
                                                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                            Due Date
                                                                        </Label>
                                                                        <Input
                                                                            type="datetime-local"
                                                                            value={editingNodeContent?.dueDate || selectedNode.content?.dueDate ? new Date(editingNodeContent?.dueDate || selectedNode.content?.dueDate).toISOString().slice(0, 16) : ''}
                                                                            onChange={(e) => handleNodeContentChange('dueDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                                                            placeholder="Set due date"
                                                                            className={`mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                            disabled={!campaignEditStatus?.canEdit}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            <div>
                                                                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                    Delay
                                                                </Label>
                                                                <div className="flex gap-2 mt-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={editingNodeContent?.delay ?? selectedNode.content?.delay ?? 0}
                                                                        onChange={(e) => handleNodeContentChange('delay', parseInt(e.target.value) || 0)}
                                                                        className={`flex-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                                        disabled={!campaignEditStatus?.canEdit}
                                                                    />
                                                                    <Select
                                                                        value={editingNodeContent?.delayUnit || selectedNode.content?.delayUnit || 'minutes'}
                                                                        onValueChange={(value) => handleNodeContentChange('delayUnit', value)}
                                                                        disabled={!campaignEditStatus?.canEdit}
                                                                    >
                                                                        <SelectTrigger className={`w-24 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="minutes">min</SelectItem>
                                                                            <SelectItem value="hours">hrs</SelectItem>
                                                                            <SelectItem value="days">days</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t flex gap-2">
                                                                <Button
                                                                    onClick={handleSaveNodeChanges}
                                                                    disabled={isSavingNode || !campaignEditStatus?.canEdit}
                                                                    className={`flex-1 ${!campaignEditStatus?.canEdit ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-600' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                                    size="sm"
                                                                >
                                                                    {isSavingNode ? (
                                                                        <>
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                            Saving...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="w-4 h-4 mr-2" />
                                                                            Save Changes
                                                                        </>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    onClick={handleCancelNodeEdit}
                                                                    variant="outline"
                                                                    disabled={isSavingNode || !campaignEditStatus?.canEdit}
                                                                    className={`flex-1 ${!campaignEditStatus?.canEdit ? 'opacity-50 cursor-not-allowed border-gray-400 text-gray-400' : isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                                                    size="sm"
                                                                >
                                                                    <X className="w-4 h-4 mr-2" />
                                                                    Cancel
                                                                </Button>
                                                            </div>

                                                            <div className="pt-2">
                                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {campaignEditStatus?.canEdit ? (
                                                                        "Click Save Changes to update this step in the campaign."
                                                                    ) : (
                                                                        `Campaign Status: ${campaignEditStatus?.campaignStatus || 'Unknown'}. ${campaignEditStatus?.message || ''}`
                                                                    )}
                                                                </p>

                                                                {/* Show edit status details */}
                                                                {campaignEditStatus && (
                                                                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                        <div>Status: <span className="font-medium">{campaignEditStatus.campaignStatus}</span></div>
                                                                        {campaignEditStatus.canPause && (
                                                                            <div>Actions: Can pause campaign</div>
                                                                        )}
                                                                        {campaignEditStatus.canResume && (
                                                                            <div>Actions: Can resume campaign</div>
                                                                        )}
                                                                        {campaignEditStatus.runningExecutions > 0 && (
                                                                            <div>Running: {campaignEditStatus.runningExecutions} executions</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}

                        {campaignDetailTab === 'leads' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Lead List ({selectedCampaign?.prospects?.length || 0} prospects)
                                    </h2>

                                    <div className="flex items-center gap-3">
                                        {/* Actions Dropdown - only show when leads are selected */}
                                        {selectedLeads.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Actions ({selectedLeads.length})
                                                        <ChevronDown className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={handleAddToProjects}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Add to Projects ({selectedLeads.length})
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={handleDeleteSelectedLeads}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Selected ({selectedLeads.length})
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}

                                        {/* Add Lead Button */}
                                        <Button
                                            onClick={() => {
                                                console.log('Add Lead button clicked, opening modal');
                                                setIsImportProspectsModalOpen(true);
                                            }}
                                            className="bg-black hover:bg-gray-800 text-white"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Lead
                                        </Button>
                                    </div>
                                </div>

                                {selectedCampaign?.prospects && selectedCampaign.prospects.length > 0 ? (
                                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-b">
                                                            <TableHead className="py-3 px-4 w-12">
                                                                <Checkbox
                                                                    checked={selectAll}
                                                                    onCheckedChange={handleSelectAllLeads}
                                                                    aria-label="Select all leads"
                                                                    className={isDarkMode ? 'bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500' : 'bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600'}
                                                                />
                                                            </TableHead>
                                                            <TableHead className="py-3 px-4">Name</TableHead>
                                                            <TableHead className="py-3 px-4">Email</TableHead>
                                                            <TableHead className="py-3 px-4">Company</TableHead>
                                                            <TableHead className="py-3 px-4">Position</TableHead>
                                                            <TableHead className="py-3 px-4">Status</TableHead>
                                                            <TableHead className="py-3 px-4">Current Step</TableHead>
                                                            <TableHead className="py-3 px-4">Last Contact</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedCampaign.prospects.map((prospect, index) => {
                                                            const currentStep = getProspectStep(prospect);
                                                            return (
                                                                <TableRow key={prospect._id || index} className={`border-b ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                                                    <TableCell className="py-3 px-4">
                                                                        <Checkbox
                                                                            checked={selectedLeads.includes(prospect._id)}
                                                                            onCheckedChange={() => handleSelectLead(prospect._id)}
                                                                            aria-label={`Select ${prospect.name}`}
                                                                            className={isDarkMode ? 'bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500' : 'bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600'}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div
                                                                            className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                                                            onClick={() => handleProspectClick(prospect)}
                                                                        >
                                                                            {prospect.name}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            {prospect.email || 'No email'}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            {prospect.company || 'No company'}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            {prospect.position || 'No position'}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <Badge variant={
                                                                            prospect.status === 'contacted' ? 'default' :
                                                                                prospect.status === 'replied' ? 'secondary' :
                                                                                    prospect.status === 'bounced' ? 'destructive' : 'outline'
                                                                        }>
                                                                            {prospect.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`w-2 h-2 rounded-full ${currentStep.type === 'completed' ? 'bg-green-500' :
                                                                                currentStep.type === 'active' ? 'bg-blue-500' :
                                                                                    'bg-gray-300'
                                                                                }`}></div>
                                                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                {currentStep.name}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-3 px-4">
                                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            {prospect.lastContacted ?
                                                                                new Date(prospect.lastContacted).toLocaleDateString() :
                                                                                'Never'
                                                                            }
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No prospects in this campaign</p>
                                        <Button
                                            onClick={() => {
                                                console.log('Add Your First Lead button clicked, opening modal');
                                                setIsImportProspectsModalOpen(true);
                                            }}
                                            className="bg-black hover:bg-gray-800 text-white"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Your First Lead
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {campaignDetailTab === 'launch' && (
                            <div className="space-y-4">
                                <div>
                                    <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                        Launch Options
                                    </Label>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`} style={sacoreFont}>
                                        Choose when to launch your campaign
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Card
                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedCampaign?.status === 'active' ? 'border-black bg-gray-100' :
                                            'border-gray-300 hover:border-gray-400'
                                            } ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white'}`}
                                        onClick={() => selectedCampaign?.status !== 'active' && handleCampaignAction('start')}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCampaign?.status === 'active' ? 'border-black bg-black' : 'border-gray-300'
                                                    }`}>
                                                    {selectedCampaign?.status === 'active' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div>
                                                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                        Launch Immediately
                                                    </h3>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                        {selectedCampaign?.status === 'active' ? 'Campaign is currently running' : 'Start sending emails right away'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className={`cursor-pointer border-2 transition-all duration-200 ${selectedCampaign?.status === 'draft' ? 'border-black bg-gray-100' :
                                            'border-gray-300 hover:border-gray-400'
                                            } ${isDarkMode ? 'bg-primary border-gray-600' : 'bg-white'}`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCampaign?.status === 'draft' ? 'border-black bg-black' : 'border-gray-300'
                                                    }`}>
                                                    {selectedCampaign?.status === 'draft' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div>
                                                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                                        Save as Draft
                                                    </h3>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                        {selectedCampaign?.status === 'draft' ? 'Campaign is currently in draft mode' : 'Save campaign and launch manually later'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Campaign Control Buttons */}
                                    <div className="flex gap-2 pt-4">
                                        {selectedCampaign?.status === 'active' ? (
                                            <>
                                                <Button
                                                    onClick={() => handleCampaignAction('pause')}
                                                    className="flex-1 bg-black hover:bg-gray-800 text-white"
                                                >
                                                    <Pause className="h-4 w-4 mr-2" />
                                                    Pause Campaign
                                                </Button>
                                                <Button
                                                    onClick={() => handleCampaignAction('stop')}
                                                    className="flex-1 bg-black hover:bg-gray-800 text-white"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Complete Campaign
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => handleCampaignAction('start')}
                                                className="w-full bg-black hover:bg-gray-800 text-white"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {selectedCampaign?.status === 'paused' ? 'Resume Campaign' : 'Launch Campaign'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <Card className={`${isDarkMode ? 'bg-primary border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                            Campaign Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Campaign Name:</span>
                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{selectedCampaign?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Description:</span>
                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{selectedCampaign?.description || 'None'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Prospects:</span>
                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{selectedCampaign?.prospects?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Email Sequence:</span>
                                            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} style={sacoreFont}>{selectedCampaign?.sequence?.length || 0} steps</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} style={sacoreFont}>Status:</span>
                                            <span className={`font-medium ${selectedCampaign?.status === 'active' ? 'text-green-600' :
                                                selectedCampaign?.status === 'paused' ? 'text-yellow-600' :
                                                    selectedCampaign?.status === 'completed' ? 'text-red-600' :
                                                        'text-gray-600'
                                                }`} style={sacoreFont}>
                                                {selectedCampaign?.status ? selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1) : 'Unknown'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
                {/* Import Prospects Modal */}
                {console.log('Rendering Import Prospects Modal, isOpen:', isImportProspectsModalOpen)}
                <Dialog open={isImportProspectsModalOpen} onOpenChange={setIsImportProspectsModalOpen}>
                    <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900'}`}>
                        <DialogHeader>
                            <DialogTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                Import Prospects
                            </DialogTitle>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                Choose how you'd like to import prospects for your campaign:
                            </p>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Import Method Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Card
                                    className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'csv'
                                        ? 'border-black bg-gray-100'
                                        : 'border-gray-300 hover:border-gray-400'
                                        } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CardContent className="p-4 text-center">
                                        <Upload className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                            Upload CSV File
                                        </h3>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                            Upload a CSV file with prospect information
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadSampleCSV();
                                            }}
                                        >
                                            <Download className="w-3 h-3 mr-1" />
                                            Sample
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card
                                    className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'candidates'
                                        ? 'border-black bg-gray-100'
                                        : 'border-gray-300 hover:border-gray-400'
                                        } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                    onClick={() => setSelectedImportMethod('candidates')}
                                >
                                    <CardContent className="p-4 text-center">
                                        <Users className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                            Import from Candidates
                                        </h3>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                            Use prospects from your candidates list
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card
                                    className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'project'
                                        ? 'border-black bg-gray-100'
                                        : 'border-gray-300 hover:border-gray-400'
                                        } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                    onClick={() => setSelectedImportMethod('project')}
                                >
                                    <CardContent className="p-4 text-center">
                                        <FolderOpen className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                            Import from Project
                                        </h3>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                            Import prospects from existing projects
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card
                                    className={`cursor-pointer border-2 transition-all duration-200 ${selectedImportMethod === 'manual'
                                        ? 'border-black bg-gray-100'
                                        : 'border-gray-300 hover:border-gray-400'
                                        } ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}
                                    onClick={() => setSelectedImportMethod('manual')}
                                >
                                    <CardContent className="p-4 text-center">
                                        <Edit className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={sacoreFont}>
                                            Manual Upload
                                        </h3>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                            Enter prospect data manually
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Import Method Content */}
                            {selectedImportMethod === 'candidates' && (
                                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                    <CardContent className="p-4">
                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                            Select Candidates Source
                                        </Label>
                                        <Select value={selectedCandidatesSource} onValueChange={setSelectedCandidatesSource}>
                                            <SelectTrigger className="mt-2">
                                                <SelectValue placeholder="Choose candidates source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="candidates">Candidates</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleImportFromCandidates}
                                            className="mt-3 w-full bg-black hover:bg-gray-800 text-white"
                                            size="sm"
                                            style={sacoreFont}
                                            disabled={!selectedCandidatesSource || loadingCandidates}
                                        >
                                            {loadingCandidates ? 'Loading...' : `Import from ${selectedCandidatesSource || 'Source'}`}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedImportMethod === 'project' && (
                                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                    <CardContent className="p-4">
                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                            Select Project
                                        </Label>
                                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                                            <SelectTrigger className="mt-2">
                                                <SelectValue placeholder="Choose project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableProjects.length > 0 ? (
                                                    availableProjects.filter(p => p._id && p._id.trim() !== '').map((p) => (
                                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-projects" disabled>{loadingProjects ? 'Loading projects...' : 'No projects found'}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleImportFromProject}
                                            className="mt-3 w-full bg-black hover:bg-gray-800 text-white"
                                            size="sm"
                                            style={sacoreFont}
                                            disabled={!selectedProject}
                                        >
                                            Import from Project
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedImportMethod === 'manual' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                            Manual Data Entry
                                        </Label>
                                        <Textarea
                                            value={manualData}
                                            onChange={(e) => setManualData(e.target.value)}
                                            placeholder="Enter prospect data, one per line. Format: Name, Email, Company, Title, LinkedIn URL&#10;Example:&#10;John Doe, john@example.com, Example Corp, Manager, https://linkedin.com/in/johndoe&#10;Jane Smith, jane@sample.com, Sample Inc, Director, https://linkedin.com/in/janesmith"
                                            className={`min-h-32 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            style={sacoreFont}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                                                {manualData.split('\n').filter(line => line.trim()).length} lines
                                            </p>
                                            <Button
                                                onClick={handleManualUpload}
                                                variant="outline"
                                                size="sm"
                                                disabled={!manualData.trim() || manualProcessing}
                                                style={sacoreFont}
                                            >
                                                {manualProcessing ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    'Process Data'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Candidates Table */}
                            {(selectedImportMethod === 'candidates' || selectedImportMethod === 'project' || selectedImportMethod === 'csv' || selectedImportMethod === 'manual') && fetchedCandidates.length > 0 && (
                                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'} w-[65vw] mt-4`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                                Select Prospects ({fetchedCandidates.length} found)
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={handleBatchCandidateAnalyzeClick}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={selectedCandidates.size === 0 || isAnalyzing}
                                                    style={sacoreFont}
                                                    className="flex items-center gap-1"
                                                >
                                                    <BrainCog className="w-3 h-3" />
                                                    {isAnalyzing ? 'Analyzing...' : `Deep Analyze (${selectedCandidates.size})`}
                                                </Button>
                                                <Button
                                                    onClick={handleBatchCandidateGetEmailsClick}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={selectedCandidates.size === 0 || loadingBatchCandidateEmails}
                                                    style={sacoreFont}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Mail className="w-3 h-3" />
                                                    {loadingBatchCandidateEmails ? 'Finding Emails...' : `Get Emails (${selectedCandidates.size})`}
                                                </Button>
                                                <Button
                                                    onClick={handleBatchCandidateGetLinkedInUrlsClick}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={selectedCandidates.size === 0 || loadingBatchCandidateLinkedInUrls}
                                                    style={sacoreFont}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Linkedin className="w-3 h-3" />
                                                    {loadingBatchCandidateLinkedInUrls ? 'Finding URLs...' : `Get LinkedIn URLs (${selectedCandidates.size})`}
                                                </Button>
                                                <Button
                                                    onClick={handleConfirmCandidateImport}
                                                    size="sm"
                                                    disabled={selectedCandidates.size === 0}
                                                    style={sacoreFont}
                                                >
                                                    Import Selected ({selectedCandidates.size})
                                                </Button>
                                            </div>
                                        </div>

                                        <div className={`overflow-x-auto border rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                            <div className="max-h-96 overflow-y-auto">
                                                <Table className={`border-collapse w-full min-w-[1400px] ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                    <TableHeader className={isDarkMode ? "bg-gray-950" : "bg-gray-50"}>
                                                        <TableRow className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-300"}>
                                                            <TableHead className={`w-[50px] py-3 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                                                <div className="flex items-center justify-center">
                                                                    <Checkbox
                                                                        checked={selectedCandidates.size === fetchedCandidates.length && fetchedCandidates.length > 0}
                                                                        onCheckedChange={handleSelectAllCandidates}
                                                                        aria-label="Select all candidates"
                                                                        className={`mr-3  
        ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
        focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                                                    />
                                                                </div>
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Name <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Title <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Company <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium cursor-pointer border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Location <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-50" />
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Project
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"} min-w-[160px]`} style={sacoreFont}>
                                                                Deep Analysis
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Email
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                LinkedIn URL
                                                            </TableHead>
                                                            <TableHead className={`py-3 font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300"}`} style={sacoreFont}>
                                                                Actions
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {fetchedCandidates.map((candidate) => (
                                                            <TableRow key={candidate._id} className={`transition-colors border-b ${isDarkMode
                                                                ? "bg-primary hover:bg-gray-950 border-gray-700"
                                                                : "bg-white hover:bg-gray-50 border-gray-300"
                                                                }`}>
                                                                <TableCell className={`py-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                                                    <div className="flex items-center justify-center">
                                                                        <Checkbox
                                                                            checked={selectedCandidates.has(candidate._id)}
                                                                            onCheckedChange={() => handleSelectCandidate(candidate._id)}
                                                                            aria-label={`Select ${candidate.name}`}
                                                                            className={`mr-3  
        ${isDarkMode ? "bg-gray-800 border-gray-500 text-white checked:bg-gray-500 checked:border-gray-500" : "bg-white border-gray-300 text-gray-700 checked:bg-gray-600 checked:border-gray-600"}
        focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition`}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`font-medium py-4 border-r ${isDarkMode ? "text-gray-200 border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                    {candidate.name}
                                                                </TableCell>
                                                                <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                    {candidate.title}
                                                                </TableCell>
                                                                <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                    {candidate.company}
                                                                </TableCell>
                                                                <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                    {candidate.location}
                                                                </TableCell>
                                                                <TableCell className={`py-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} style={sacoreFont}>
                                                                    <div className="truncate" title={candidate.projectId?.name}>
                                                                        {candidate.projectId?.name || 'N/A'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[120px]`}>
                                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                                        {analyzingCandidates.has(candidate._id) ? (
                                                                            <div className="flex items-center justify-center">
                                                                                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                                            </div>
                                                                        ) : candidate.analysisScore || candidate.analysis || deepAnalysisResultsMap[candidate._id] ? (
                                                                            <div
                                                                                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto cursor-pointer hover:bg-blue-200 transition-colors"
                                                                                onClick={() => {
                                                                                    setDeepAnalysisSelectedCandidateId(candidate._id);
                                                                                    setDeepAnalysisSelectedCandidate(candidate);

                                                                                    // If candidate already has analysis data but it's not in the map, add it
                                                                                    if (candidate.analysis && !deepAnalysisResultsMap[candidate._id]) {
                                                                                        setDeepAnalysisResultsMap(prev => ({
                                                                                            ...prev,
                                                                                            [candidate._id]: {
                                                                                                analysis: candidate.analysis,
                                                                                                enrichedData: candidate.analysis.enrichedData
                                                                                            }
                                                                                        }));
                                                                                    }

                                                                                    setIsDeepAnalysisModalOpen(true);
                                                                                }}
                                                                            >
                                                                                <span className="font-medium text-sm">
                                                                                    {(() => {
                                                                                        const score = candidate.analysisScore || candidate.analysis?.score || deepAnalysisResultsMap[candidate._id]?.analysis?.score;
                                                                                        return score || 'N/A';
                                                                                    })()}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                                                    onClick={() => handleCandidateAnalyzeClick(candidate)}
                                                                                    title="Our AI is going to analyze this profile"
                                                                                >
                                                                                    <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                                        <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                                                    </svg>
                                                                                </div>
                                                                                <span
                                                                                    className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                                                    onClick={() => handleCandidateAnalyzeClick(candidate)}
                                                                                >
                                                                                    press to run
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`py-2 ${isDarkMode ? "text-gray-300" : ""} border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[200px]`}>
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {renderCandidateEmailDisplay(candidate)}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[250px]`}>
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {candidate.linkedinUrl && candidate.linkedinUrl.trim() !== '' ? (
                                                                            <a
                                                                                href={candidate.linkedinUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`hover:underline flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-sm truncate max-w-[200px]`}
                                                                            >
                                                                                {candidate.linkedinUrl}
                                                                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                                            </a>
                                                                        ) : (
                                                                            loadingLinkedInUrls.includes(candidate._id) ? (
                                                                                <div className="flex items-center justify-center">
                                                                                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                    <div
                                                                                        className="w-6 h-6 border-2 border-gray-500 rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ease hover:bg-gray-500 hover:scale-110 group"
                                                                                        onClick={() => handleCandidateGetLinkedInUrlClick(candidate)}
                                                                                    >
                                                                                        <svg width="5" height="7" viewBox="0 0 5 7" className="group-hover:fill-white">
                                                                                            <polygon points="0,0 0,7 5,3.5" fill="rgb(107 114 128)" stroke="rgb(107 114 128)" strokeWidth="1" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <span
                                                                                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                                                                        onClick={() => handleCandidateGetLinkedInUrlClick(candidate)}
                                                                                    >
                                                                                        press to run
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`py-2 border-r ${isDarkMode ? "border-gray-700" : "border-gray-300"} min-w-[100px] text-center`}>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        {candidate.linkedinUrl && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => handleCopyCandidateUrl(candidate.linkedinUrl)}
                                                                                            className="h-6 w-6 p-0"
                                                                                        >
                                                                                            {copiedUrl === candidate.linkedinUrl ? (
                                                                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                                                            ) : (
                                                                                                <Copy className="h-3 w-3" />
                                                                                            )}
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Copy LinkedIn URL</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                        {candidate.linkedinUrl && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => handleOpenCandidateUrl(candidate.linkedinUrl)}
                                                                                            className="h-6 w-6 p-0"
                                                                                        >
                                                                                            <Linkedin className="w-3 h-3" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Open LinkedIn</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Imported Prospects Preview */}
                            {importedProspects.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                                            Imported Prospects ({importedProspects.length})
                                        </h3>
                                        <Badge variant="outline" className="text-xs border-gray-400 text-gray-600" style={sacoreFont}>
                                            {selectedImportMethod === 'csv' && 'CSV Import'}
                                            {selectedImportMethod === 'candidates' && 'Candidates Import'}
                                            {selectedImportMethod === 'project' && 'Project Import'}
                                            {selectedImportMethod === 'manual' && 'Manual Upload'}
                                        </Badge>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Company</TableHead>
                                                    <TableHead>Title</TableHead>
                                                    <TableHead>LinkedIn</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importedProspects.map((prospect, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{prospect.name}</TableCell>
                                                        <TableCell>{prospect.email}</TableCell>
                                                        <TableCell>{prospect.company}</TableCell>
                                                        <TableCell>{prospect.position}</TableCell>
                                                        <TableCell>
                                                            {prospect.linkedin && (
                                                                <a
                                                                    href={prospect.linkedin}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#0077B5">
                                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsImportProspectsModalOpen(false);
                                    setSelectedImportMethod(null);
                                    setImportedProspects([]);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (!selectedCampaign || importedProspects.length === 0) return;

                                    try {
                                        const response = await authService.addProspectsToCampaign(
                                            selectedCampaign._id,
                                            importedProspects
                                        );

                                        if (response.success) {
                                            // Refresh campaigns list
                                            await loadCampaigns();

                                            toast({
                                                title: "Success",
                                                description: `${response.message || `Successfully added ${response.data.prospectsAdded} prospects to the campaign.`}`,
                                            });

                                            setIsImportProspectsModalOpen(false);
                                            setSelectedImportMethod(null);
                                            setImportedProspects([]);
                                        } else {
                                            throw new Error(response.message || 'Failed to add prospects to campaign');
                                        }
                                    } catch (error) {
                                        console.error('Error adding prospects to campaign:', error);
                                        toast({
                                            title: "Error",
                                            description: error instanceof Error ? error.message : "Failed to add prospects to campaign. Please try again.",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                                disabled={importedProspects.length === 0}
                                className="bg-black hover:bg-gray-800 text-white"
                            >
                                Add {importedProspects.length} Prospects
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Delete Leads Confirmation Modal */}
                <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <AlertDialogContent className={isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                        <AlertDialogHeader>
                            <AlertDialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                Delete Selected Leads
                            </AlertDialogTitle>
                            <AlertDialogDescription className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                Are you sure you want to delete {selectedLeads.length} selected lead{selectedLeads.length > 1 ? 's' : ''} from this campaign?
                                This action will also remove all associated executions, email logs, and scheduled tasks.
                                <br /><br />
                                <strong>This action cannot be undone.</strong>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={deletingLeads}
                                className={isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : ''}
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDeleteLeads}
                                disabled={deletingLeads}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deletingLeads ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    `Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {/* Prospect Detail Modal */}
                <Dialog open={isProspectDetailModalOpen} onOpenChange={setIsProspectDetailModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {isLoadingProspectDetail ? 'Loading Prospect Details...' : selectedProspectDetail?.name || 'Prospect Details'}
                            </DialogTitle>
                        </DialogHeader>

                        {isLoadingProspectDetail ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : selectedProspectDetail ? (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                                        <div className="space-y-2">
                                            <div><span className="font-medium">Name:</span> {selectedProspectDetail.name}</div>
                                            <div><span className="font-medium">Email:</span> {selectedProspectDetail.email || 'Not available'}</div>
                                            <div><span className="font-medium">Company:</span> {selectedProspectDetail.company || 'Not available'}</div>
                                            <div><span className="font-medium">Position:</span> {selectedProspectDetail.position || 'Not available'}</div>
                                            {selectedProspectDetail.linkedin && (
                                                <div>
                                                    <span className="font-medium">LinkedIn:</span>
                                                    <a href={selectedProspectDetail.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                                        View Profile
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Campaign Status</h3>
                                        <div className="space-y-2">
                                            <div><span className="font-medium">Status:</span>
                                                <Badge className="ml-2" variant={
                                                    selectedProspectDetail.status === 'completed' ? 'default' :
                                                        selectedProspectDetail.status === 'active' ? 'secondary' :
                                                            selectedProspectDetail.status === 'manual_action_required' ? 'destructive' : 'outline'
                                                }>
                                                    {selectedProspectDetail.status?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div><span className="font-medium">Last Contacted:</span> {selectedProspectDetail.lastContacted ? new Date(selectedProspectDetail.lastContacted).toLocaleDateString() : 'Never'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Step */}
                                {selectedProspectDetail.currentStep && (
                                    <div>
                                        <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Current Step</h3>
                                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-3 h-3 rounded-full ${selectedProspectDetail.currentStep.status === 'completed' ? 'bg-green-500' :
                                                    selectedProspectDetail.currentStep.status === 'active' ? 'bg-blue-500' :
                                                        selectedProspectDetail.currentStep.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-300'
                                                    }`}></div>
                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.currentStep.name}</span>
                                                <Badge variant="outline" className={isDarkMode ? 'border-gray-600 text-gray-300' : ''}>{selectedProspectDetail.currentStep.stepType}</Badge>
                                            </div>
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status: {selectedProspectDetail.currentStep.status}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                {selectedProspectDetail.timeline && selectedProspectDetail.timeline.length > 0 && (
                                    <div>
                                        <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Activity Timeline</h3>
                                        <div className="space-y-3">
                                            {selectedProspectDetail.timeline.map((activity: any, index: number) => (
                                                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
                                                    <div className={`w-3 h-3 rounded-full mt-1 ${activity.status === 'completed' ? 'bg-green-500' :
                                                        activity.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                                                        }`}></div>
                                                    <div className="flex-1">
                                                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.stepName}</div>
                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {(() => {
                                                                const result = activity.result;
                                                                if (!result) return 'No details available';
                                                                if (typeof result === 'string') return result;

                                                                // Handle different result types based on the API response
                                                                if (result.message) return result.message;
                                                                if (result.title) return `Task: ${result.title}`;
                                                                if (result.connectionStatus) return `Connection status: ${result.connectionStatus}`;
                                                                if (result.reason) return result.reason;
                                                                if (result.jobCompleted) return 'LinkedIn invitation sent successfully';
                                                                if (result.waitingForJob) return 'LinkedIn invitation queued';
                                                                if (result.success) return 'Completed successfully';

                                                                return 'Action completed';
                                                            })()}
                                                        </div>
                                                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                            {activity.executedAt ? new Date(activity.executedAt).toLocaleString() : 'No date'}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={`text-xs ${isDarkMode ? 'border-gray-600 text-gray-300' : ''}`}>{activity.stepType}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Related Projects */}
                                {selectedProspectDetail.projectMatches && selectedProspectDetail.projectMatches.length > 0 && (
                                    <div>
                                        <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Related Projects</h3>
                                        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
                                                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    This profile is also found in {selectedProspectDetail.projectMatches.length} project{selectedProspectDetail.projectMatches.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {selectedProspectDetail.projectMatches.map((projectMatch: any, index: number) => (
                                                    <div key={index} className={`flex items-center justify-between p-3 rounded border ${isDarkMode
                                                        ? 'bg-gray-900 border-gray-600'
                                                        : 'bg-white border-gray-300'
                                                        }`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                                                            <div>
                                                                <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                                    {projectMatch.projectName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stats */}
                                {selectedProspectDetail.stats && (
                                    <div>
                                        <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Statistics</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.stats.emailsSent || 0}</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Emails Sent</div>
                                            </div>
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.stats.emailsOpened || 0}</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Emails Opened</div>
                                            </div>
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.stats.openRate || '0'}%</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open Rate</div>
                                            </div>
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.stats.replyRate || '0'}%</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reply Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No prospect details available
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Save to Project Modal */}
                {isSaveToProjectModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? "bg-zinc-900" : "bg-white"}`}>
                            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
                                Save Prospects to Project
                            </h2>
                            <p className={`mb-4 ${isDarkMode ? "text-zinc-300" : "text-gray-600"}`}>
                                Select an existing project or create a new one to save {selectedLeads.length} selected prospect{selectedLeads.length > 1 ? 's' : ''}.
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
                                                toast({
                                                    title: "Error",
                                                    description: "Please enter a project name.",
                                                    variant: "destructive"
                                                });
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
                                                    toast({
                                                        title: "Success",
                                                        description: `Project "${response.name}" created successfully.`,
                                                    });
                                                    // Update available projects and select the new one
                                                    handleProjectCreationSuccess();
                                                    setAvailableProjects(prev => [...prev, response]);
                                                    setSelectedProjectId(response._id);
                                                    setIsCreatingNewProject(false);
                                                } else {
                                                    toast({
                                                        title: "Error",
                                                        description: `Failed to create project: ${response.message || 'Unknown error'}`,
                                                        variant: "destructive"
                                                    });
                                                }
                                            } catch (error: any) {
                                                toast({
                                                    title: "Error",
                                                    description: `Error creating project: ${error.message || 'Unknown error'}`,
                                                    variant: "destructive"
                                                });
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
                                            toast({
                                                title: "Error",
                                                description: "Please select a project.",
                                                variant: "destructive"
                                            });
                                            return;
                                        }
                                        await handleSaveProspectsToProject(selectedProjectId);
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
            </>
        );
    }

    // Main campaigns list view
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-primary' : 'bg-white'} py-3 px-3`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                            Campaigns
                        </h1>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
                            Manage your email outreach campaigns
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            resetCreateForm(); // Clear all previous form data
                            setIsCreateMode(true);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                        size='sm'
                        style={sacoreFont}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                        <CardContent className="p-3">
                            <div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                    Total Campaigns
                                </p>
                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                    {campaigns.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                        <CardContent className="p-3">
                            <div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                    Total Prospects
                                </p>
                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                    {totalProspects.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                        <CardContent className="p-3">
                            <div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                    Emails Sent
                                </p>
                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                    {totalSent.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                        <CardContent className="p-3">
                            <div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                    Avg. Open Rate
                                </p>
                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                                    {avgOpenRate}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Campaigns Table */}
                <Card className={isDarkMode ? 'bg-primary border-gray-600' : 'bg-white border-gray-300'}>
                    <CardContent className="p-0">
                        <Table className="w-full border-collapse">
                            <TableHeader>
                                <TableRow className="border-b">
                                    <TableHead className="w-8">
                                        <Checkbox
                                            checked={selectedCampaignIds.length === campaigns.length && campaigns.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedCampaignIds(campaigns.map(c => c._id));
                                                } else {
                                                    setSelectedCampaignIds([]);
                                                }
                                            }}
                                            className={isDarkMode ? 'border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' : ''}
                                        />
                                    </TableHead>
                                    <TableHead style={sacoreFont}>Campaign</TableHead>
                                    <TableHead style={sacoreFont}>Status</TableHead>
                                    <TableHead style={sacoreFont}>Prospects</TableHead>
                                    <TableHead style={sacoreFont}>Sent</TableHead>
                                    <TableHead style={sacoreFont}>Open Rate</TableHead>
                                    <TableHead style={sacoreFont}>Reply Rate</TableHead>
                                    <TableHead style={sacoreFont}>Created</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign._id} className={`border-b h-12 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                        <TableCell className="py-2">
                                            <Checkbox
                                                checked={selectedCampaignIds.includes(campaign._id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedCampaignIds([...selectedCampaignIds, campaign._id]);
                                                    } else {
                                                        setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== campaign._id));
                                                    }
                                                }}
                                                className={isDarkMode ? 'border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' : ''}
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="cursor-pointer" onClick={() => handleCampaignClick(campaign)}>
                                                <div className={`font-medium hover:text-blue-600 transition-colors ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-gray-900'}`} style={sacoreFont}>
                                                    {campaign.name}
                                                </div>
                                                {campaign.description && (
                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                                        {campaign.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {getStatusBadge(campaign.status)}
                                        </TableCell>
                                        <TableCell style={sacoreFont}>
                                            {campaign.prospects?.length || 0}
                                        </TableCell>
                                        <TableCell className="py-2" style={sacoreFont}>
                                            {campaign.stats?.emailsSent || 0}
                                        </TableCell>
                                        <TableCell className="py-2" style={sacoreFont}>
                                            {campaign.stats?.openRate ? `${campaign.stats.openRate}%` : '0%'}
                                        </TableCell>
                                        <TableCell className="py-2" style={sacoreFont}>
                                            {campaign.stats?.replyRate ? `${campaign.stats.replyRate}%` : '0%'}
                                        </TableCell>
                                        <TableCell className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                                            {new Date(campaign.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleCampaignClick(campaign)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {/* Pause Button - Only show when campaign is active */}
                                                    {campaign.status === 'active' && (
                                                        <DropdownMenuItem onClick={async () => {
                                                            try {
                                                                await authService.pauseCampaign(campaign._id);
                                                                toast({ title: 'Success', description: 'Campaign paused successfully' });
                                                                loadCampaigns(); // Reload to show updated status
                                                            } catch (e: any) {
                                                                toast({ title: 'Error', description: e?.message || 'Failed to pause campaign', variant: 'destructive' });
                                                            }
                                                        }}>
                                                            <Pause className="w-4 h-4 mr-2" />
                                                            Pause
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Resume Button - Only show when campaign is paused */}
                                                    {campaign.status === 'paused' && (
                                                        <DropdownMenuItem onClick={async () => {
                                                            try {
                                                                await authService.resumeCampaign(campaign._id);
                                                                toast({ title: 'Success', description: 'Campaign resumed successfully' });
                                                                loadCampaigns(); // Reload to show updated status
                                                            } catch (e: any) {
                                                                toast({ title: 'Error', description: e?.message || 'Failed to resume campaign', variant: 'destructive' });
                                                            }
                                                        }}>
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Resume
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={async () => {
                                                        try {
                                                            await authService.startCampaign(campaign._id);
                                                            loadCampaigns();
                                                            toast({ title: 'Started', description: 'Campaign engine started' });
                                                        } catch (e: any) {
                                                            toast({ title: 'Start failed', description: e?.message || 'Unable to start', variant: 'destructive' });
                                                        }
                                                    }}>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Start Now
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCampaignSettings(campaign)}>
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteConfirmId(campaign._id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Modals */}
            {/* Moved into create mode branch */}

            {/* Campaign Settings Modal */}
            <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
                <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                    <DialogHeader>
                        <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            Campaign Settings - {selectedCampaignForSettings?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoadingSettings ? (
                        <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                            <span className="ml-3">Loading campaign settings...</span>
                        </div>
                    ) : campaignSettings ? (
                        <div className="space-y-6">
                            <CampaignSettings
                                campaignSettings={campaignSettings}
                                updateCampaignSetting={updateCampaignSetting}
                                handleSaveCampaignSettings={handleSaveCampaignSettings}
                                isSavingSettings={isSavingSettings}
                                isDarkMode={isDarkMode}
                                timezones={timezones}
                                isTimezonesLoading={isTimezonesLoading}
                                safetyPresets={safetyPresets}
                                isPresetsLoading={isPresetsLoading}
                                applyPreset={applyPreset}
                                isApplyingPreset={isApplyingPreset}
                            />
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>Failed to load campaign settings. Please try again.</p>
                            <Button
                                onClick={() => selectedCampaignForSettings && handleCampaignSettings(selectedCampaignForSettings)}
                                className="mt-4"
                            >
                                Retry
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this campaign? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteConfirmId && handleDeleteCampaign(deleteConfirmId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Campaign
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>



        </div>
    );
}

export default CampaignsPage;