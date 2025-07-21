import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from '@/components/ui/accordion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLinkIcon, MapPinIcon, SearchIcon, BriefcaseIcon, GraduationCapIcon, TagIcon, UserIcon, ClipboardIcon, FilterIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';

const SavedProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [filteredProfiles, setFilteredProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const response = await authService.getSavedProfiles();
                console.log('Saved profiles:', response);

                if (response.savedProfiles) {
                    setProfiles(response.savedProfiles);
                    setFilteredProfiles(response.savedProfiles);
                }
            } catch (error) {
                console.error('Failed to fetch saved profiles:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load saved profiles. Please try again.',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    useEffect(() => {
        // Filter profiles based on search term and active filter
        let result = [...profiles];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(profile =>
                profile.profileData.fullName?.toLowerCase().includes(term) ||
                profile.profileData.headLine?.toLowerCase().includes(term) ||
                profile.profileData.skills?.some(skill => skill.toLowerCase().includes(term)) ||
                profile.profileData.experience?.some(exp =>
                    exp.company?.toLowerCase().includes(term) ||
                    exp.position?.toLowerCase().includes(term)
                )
            );
        }

        if (activeFilter !== 'all') {
            // Example filters - you can customize these based on your needs
            switch (activeFilter) {
                case 'tech':
                    result = result.filter(profile =>
                        profile.profileData.skills?.some(skill =>
                            ['developer', 'engineer', 'programming', 'software', 'tech', 'IT'].some(term =>
                                skill.toLowerCase().includes(term)
                            )
                        )
                    );
                    break;
                case 'marketing':
                    result = result.filter(profile =>
                        profile.profileData.skills?.some(skill =>
                            ['marketing', 'social media', 'content', 'seo', 'advertising'].some(term =>
                                skill.toLowerCase().includes(term)
                            )
                        )
                    );
                    break;
                case 'sales':
                    result = result.filter(profile =>
                        profile.profileData.skills?.some(skill =>
                            ['sales', 'business development', 'account', 'customer'].some(term =>
                                skill.toLowerCase().includes(term)
                            )
                        )
                    );
                    break;
            }
        }

        setFilteredProfiles(result);
    }, [searchTerm, activeFilter, profiles]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'LinkedIn URL copied to clipboard',
        });
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-72" />
                </div>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className={`p-6 max-w-6xl mx-auto ${isDarkMode ? 'bg-background text-foreground' : 'bg-white text-black'}`}>
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 rounded-2xl mb-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-2 text-primary">Saved Profiles</h1>
                <p className="text-muted-foreground">Your collection of saved LinkedIn profiles</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full md:w-1/2">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by name, title, skills or company..."
                        className={`pl-10 ${isDarkMode ? 'bg-muted/10' : 'bg-white'} text-foreground`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveFilter}>
                    <TabsList className={`grid grid-cols-4 w-full md:w-auto ${isDarkMode ? 'bg-muted' : ''}`}>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="tech">Tech</TabsTrigger>
                        <TabsTrigger value="marketing">Marketing</TabsTrigger>
                        <TabsTrigger value="sales">Sales</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {filteredProfiles.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <UserIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No profiles found</h3>
                    <p className="text-muted-foreground">
                        {profiles.length > 0
                            ? 'Try adjusting your search or filters'
                            : 'You haven\'t saved any profiles yet'}
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground mb-4">
                        Showing {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
                        {searchTerm && ` matching "${searchTerm}"`}
                        {activeFilter !== 'all' && ` in ${activeFilter}`}
                    </p>

                    <Accordion type="multiple" className="space-y-4">
                        {filteredProfiles.map((profile, index) => (
                            <AccordionItem
                                key={profile._id || index}
                                value={`profile-${index}`}
                                className={`border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isDarkMode ? 'bg-muted/10' : 'bg-white'
                                    }`}
                            >
                                <AccordionTrigger className="p-4 hover:bg-muted/50 transition-colors rounded-t-xl">
                                    <div className="flex items-center space-x-4 w-full text-left">
                                        <Avatar className="w-14 h-14 border-2 border-primary/10">
                                            <AvatarImage src={profile.profileData.photo?.url?.trim()} alt={profile.profileData.fullName} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {profile.profileData.fullName?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{profile.profileData.fullName}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{profile.profileData.headLine}</p>
                                                </div>
                                                {profile.profileData.locations?.[0]?.name && (
                                                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mt-1 md:mt-0">
                                                        <MapPinIcon size={12} />
                                                        {profile.profileData.locations[0].name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Card className={`rounded-b-xl shadow-inner border-t-0 ${isDarkMode ? 'bg-muted/10' : ''}`}>
                                        <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                                            <div className="space-y-4">
                                                {profile.profileData.summary && (
                                                    <div>
                                                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                            <UserIcon size={16} className="text-primary" />
                                                            Summary
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {profile.profileData.summary}
                                                        </p>
                                                    </div>
                                                )}

                                                {profile.profileData.locations?.length > 0 && (
                                                    <div className="md:hidden">
                                                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                            <MapPinIcon size={16} className="text-primary" />
                                                            Location
                                                        </h3>
                                                        <p className="text-sm">{profile.profileData.locations[0].name}</p>
                                                    </div>
                                                )}

                                                {profile.profileData.experience?.length > 0 && (
                                                    <div>
                                                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                            <BriefcaseIcon size={16} className="text-primary" />
                                                            Experience
                                                        </h3>
                                                        <div className="space-y-2">
                                                            {profile.profileData.experience.map((exp, idx) => (
                                                                <div key={idx} className="text-sm">
                                                                    <p className="font-medium">
                                                                        {exp.position} @ {exp.company}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {exp.started && formatDate(exp.started)}
                                                                        {exp.started && exp.ended && ' - '}
                                                                        {exp.ended ? formatDate(exp.ended) : exp.started ? 'Present' : ''}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {exp.summary}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {profile.profileData.education?.length > 0 && (
                                                    <div>
                                                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                            <GraduationCapIcon size={16} className="text-primary" />
                                                            Education
                                                        </h3>
                                                        <div className="space-y-1">
                                                            {profile.profileData.education.map((edu, idx) => (
                                                                <div key={idx} className="text-sm">
                                                                    <p className="font-medium">{edu.university}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {edu.degree?.join(', ') || 'Degree'}
                                                                        {edu.started && ` (${formatDate(edu.started)} - ${edu.ended ? formatDate(edu.ended) : 'Present'})`}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {profile.profileData.skills?.length > 0 && (
                                                    <div>
                                                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                            <TagIcon size={16} className="text-primary" />
                                                            Skills
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {profile.profileData.skills.map((skill, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs bg-primary/5 hover:bg-primary/10">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className={`flex justify-between p-4 border-t ${isDarkMode ? 'bg-muted/20' : 'bg-gray-50'}`}>
                                            <div className="text-xs text-muted-foreground">
                                                Saved on {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown date'}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-8"
                                                    onClick={() => copyToClipboard(profile.linkedinUrl.trim())}
                                                >
                                                    <ClipboardIcon size={14} className="mr-1" />
                                                    Copy URL
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="text-xs h-8"
                                                    asChild
                                                >
                                                    <a
                                                        href={profile.linkedinUrl.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLinkIcon size={14} className="mr-1" />
                                                        View on LinkedIn
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </>
            )}
        </div>
    );
};

export default SavedProfiles;