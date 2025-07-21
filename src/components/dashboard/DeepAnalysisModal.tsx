import React from "react";
import { X, CheckCircle2, ExternalLink, Copy, Mail } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface AnalysisBreakdownItem {
    criterion: string;
    met: boolean;
}

interface EnrichedData {
    uid: string;
    fullName: string;
    gender: string | null;
    photo?: {
        url: string;
    };
    locations?: { name: string }[];
    skills?: string[];
    education?: {
        faculty: string;
        university: string;
        url: string | null;
        startedYear: number;
        endedYear: number;
        degree: string[];
    }[];
    experience?: {
        position: string;
        location: string;
        current: boolean;
        started: string;
        ended: string | null;
        company: string;
        summary: string;
        companyUrl: string;
        companyId: string | null;
        companySize: string;
        staffCount: string | number;
        industry: string;
        website: string;
    }[];
    headLine?: string;
    summary?: string;
    language?: any[];
    course?: any[];
    project?: any[];
    certification?: any[];
    patent?: any[];
    publication?: any[];
    honorAward?: any[];
    organization?: any[];
    contacts?: any[];
    social?: {
        id: string;
        link: string;
        type: string;
        rating: number;
    }[];
}

interface ContactOutData {
    li_vanity: string;
    full_name: string;
    title: string;
    headline: string;
    company: {
        name: string;
        url: string;
        linkedin_company_id: number;
        domain: string;
        email_domain: string;
        overview: string;
        type: string;
        size: number;
        country: string;
        revenue: number;
        founded_at: number;
        industry: string;
        headquarter: string;
        website: string;
        logo_url: string;
        specialties: string[];
        locations: string[];
    };
    location: string;
    country: string;
    industry: string;
    experience: string[];
    education: string[];
    skills: string[];
    followers: number;
    updated_at: string;
    profile_picture_url: string;
    contact_availability: {
        work_email: boolean;
        personal_email: boolean;
        phone: boolean;
    };
    contact_info: {
        emails: any[];
        work_emails: any[];
        work_email_status: any[];
        personal_emails: any[];
        phones: any[];
    };
}

interface DeepAnalysisResult {
    linkedinUrl: string;
    name: string;
    enrichedData?: EnrichedData | { contactOutData: ContactOutData };
    analysis: {
        score: string;
        description: string;
        breakdown: AnalysisBreakdownItem[];
    };
}

interface Lead {
    id: string;
    name: string;
    linkedinUrl?: string;
}

interface DeepAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    analysisResult: DeepAnalysisResult | null;
}

export function DeepAnalysisModal({
    isOpen,
    onClose,
    lead,
    analysisResult,
}: DeepAnalysisModalProps) {
    const { isDarkMode } = useTheme();
    if (!lead || !analysisResult) return null;

    const containerClasses = `max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-xl ${isDarkMode ? "bg-zinc-900 text-zinc-100" : "bg-white text-black"
        }`;

    const borderColor = isDarkMode ? "border-zinc-700" : "border-gray-200";
    const grayText = isDarkMode ? "text-zinc-400" : "text-gray-600";
    const lightGrayText = isDarkMode ? "text-zinc-500" : "text-gray-500";
    const badgeBg = isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-800";


    if (!analysisResult.enrichedData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className={containerClasses}>
                    <DialogHeader className={`p-6 pb-2 ${borderColor} border-b flex items-center justify-between`}>
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            Deep Analysis - {lead.name}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                            <X />
                        </Button>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto space-y-6">
                        <p className="text-red-500 font-semibold">No enriched data available for this profile.</p>
                    </div>

                    <div className={`mt-6 flex justify-end gap-3 p-6 border-t ${borderColor}`}>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const { enrichedData, analysis } = analysisResult;

    // Normalize data structure for both SignalHire and ContactOut profiles
    const normalizedData = (() => {
        if (!enrichedData) return null;

        // Check if this is ContactOut fallback data (nested under contactOutData)
        if ('contactOutData' in enrichedData && enrichedData.contactOutData) {
            const contactOut = enrichedData.contactOutData.profile || enrichedData.contactOutData;
            return {
                fullName: contactOut.full_name,
                headLine: contactOut.headline,
                photo: { url: contactOut.profile_picture_url },
                locations: [{ name: contactOut.location }],
                skills: contactOut.skills || [],
                education: contactOut.education || [],
                experience: contactOut.experience || [],
                summary: contactOut.summary || contactOut.company?.overview || '',
                company: contactOut.company,
                emails: contactOut.email || contactOut.work_email || [],
                languages: contactOut.languages || [],
                certifications: contactOut.certifications || [],
                isContactOut: true
            };
        }

        // Check if this is direct ContactOut data structure
        if ('fullName' in enrichedData && 'company' in enrichedData && !('uid' in enrichedData)) {
            const contactOut = enrichedData as any;
            return {
                fullName: contactOut.fullName,
                headLine: contactOut.headline || contactOut.title,
                photo: { url: contactOut.profilePictureUrl },
                locations: [{ name: contactOut.location }],
                skills: contactOut.skills || [],
                education: contactOut.education || [],
                experience: contactOut.experience || [],
                summary: contactOut.summary || contactOut.company?.overview || '',
                company: contactOut.company,
                emails: contactOut.contactInfo?.emails || contactOut.contactInfo?.workEmails || [],
                languages: contactOut.languages || [],
                certifications: contactOut.certifications || [],
                isContactOut: true
            };
        }

        // SignalHire data structure
        const signalHire = enrichedData as EnrichedData;
        return {
            fullName: signalHire.fullName,
            headLine: signalHire.headLine,
            photo: signalHire.photo,
            locations: signalHire.locations || [],
            skills: signalHire.skills || [],
            education: signalHire.education || [],
            experience: signalHire.experience || [],
            summary: signalHire.summary || '',
            emails: signalHire.contacts?.filter(c => c.type === 'email').map(c => c.value) || [],
            languages: signalHire.language || [],
            certifications: signalHire.certification || [],
            isContactOut: false
        };
    })();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={containerClasses}>
                <DialogHeader className={`p-6 pb-2 ${borderColor} border-b flex items-center justify-between`}>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        Deep Analysis - {lead.name}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                        <X />
                    </Button>
                </DialogHeader>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                        {normalizedData?.photo?.url ? (
                            <img
                                src={normalizedData.photo.url}
                                alt={normalizedData.fullName || lead.name}
                                className="w-20 h-20 rounded-full object-cover border border-gray-300"
                            />
                        ) : (
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold ${isDarkMode ? "bg-zinc-700 text-zinc-200" : "bg-gray-200 text-gray-700"}`}>
                                {(() => {
                                    const name = normalizedData?.fullName || lead.name || '';
                                    const nameParts = name.trim().split(' ');
                                    if (nameParts.length >= 2) {
                                        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                                    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
                                        return nameParts[0][0].toUpperCase();
                                    }
                                    return '?';
                                })()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{normalizedData?.fullName || lead.name}</h2>
                            {normalizedData?.headLine && <p className={grayText}>{normalizedData.headLine}</p>}
                            {normalizedData?.locations?.length > 0 && (
                                <p className={`text-sm ${lightGrayText}`}>
                                    {normalizedData.locations.map(loc => loc.name).join(", ")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    {normalizedData?.summary && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Summary</h3>
                            <p className={`whitespace-pre-line ${grayText}`}>{normalizedData.summary}</p>
                        </section>
                    )}

                    {/* Company Information (ContactOut specific) */}
                    {normalizedData?.isContactOut && normalizedData?.company && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                            <div className={`rounded-xl p-4 ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border border-gray-200"}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    {normalizedData.company.logo_url && (
                                        <img
                                            src={normalizedData.company.logo_url}
                                            alt={normalizedData.company.name}
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-lg">{normalizedData.company.name}</h4>
                                        <p className={`text-sm ${grayText}`}>{normalizedData.company.industry}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className={lightGrayText}>Size:</span> {normalizedData.company.size} employees
                                    </div>
                                    <div>
                                        <span className={lightGrayText}>Founded:</span> {normalizedData.company.founded_at}
                                    </div>
                                    <div>
                                        <span className={lightGrayText}>Type:</span> {normalizedData.company.type}
                                    </div>
                                    <div>
                                        <span className={lightGrayText}>Country:</span> {normalizedData.company.country}
                                    </div>
                                </div>

                                {normalizedData.company.website && (
                                    <div className="mt-3">
                                        <a
                                            href={normalizedData.company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                        >
                                            {normalizedData.company.website}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}

                                {normalizedData.company.specialties?.length > 0 && (
                                    <div className="mt-3">
                                        <p className={`text-sm ${lightGrayText} mb-2`}>Specialties:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {normalizedData.company.specialties.map((specialty, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`px-2 py-1 rounded text-xs ${badgeBg}`}
                                                >
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {normalizedData?.skills?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {normalizedData.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className={`px-3 py-1 rounded-full text-sm ${badgeBg}`}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Contact Information (for ContactOut profiles) */}
                    {normalizedData?.isContactOut && normalizedData?.emails?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                            <div className={`rounded-xl p-4 ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border border-gray-200"}`}>
                                <div className="space-y-2">
                                    {normalizedData.emails.map((email, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm">{email}</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(email)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Languages (for ContactOut profiles) */}
                    {normalizedData?.isContactOut && normalizedData?.languages?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Languages</h3>
                            <div className="space-y-2">
                                {normalizedData.languages.map((lang, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="font-medium">{typeof lang === 'object' ? lang.name : lang}</span>
                                        {typeof lang === 'object' && lang.proficiency && (
                                            <span className={`text-sm ${lightGrayText}`}>{lang.proficiency}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications (for ContactOut profiles) */}
                    {normalizedData?.isContactOut && normalizedData?.certifications?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Certifications</h3>
                            <div className="space-y-3">
                                {normalizedData.certifications.map((cert, idx) => (
                                    <div key={idx} className="border-l-4 border-purple-500 pl-4">
                                        <h4 className="font-semibold">{typeof cert === 'object' ? cert.name : cert}</h4>
                                        {typeof cert === 'object' && cert.authority && (
                                            <p className={`text-sm ${grayText}`}>Issued by {cert.authority}</p>
                                        )}
                                        {typeof cert === 'object' && (cert.start_date_year || cert.start_date_month) && (
                                            <p className={`text-sm ${lightGrayText}`}>
                                                {cert.start_date_month && cert.start_date_year
                                                    ? `${cert.start_date_month}/${cert.start_date_year}`
                                                    : cert.start_date_year
                                                }
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {normalizedData?.education?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Education</h3>
                            <div className="space-y-4">
                                {normalizedData.education.map((edu, idx) => {
                                    // Check if this is a contactOut format (string) or standard format (object)
                                    if (typeof edu === 'string') {
                                        // Parse contactOut string format: "Degree at University in StartYear - EndYear"
                                        const parts = edu.split(' at ');
                                        const degree = parts[0] || edu;
                                        const universityAndDate = parts[1] || '';
                                        const inIndex = universityAndDate.lastIndexOf(' in ');
                                        const university = inIndex > -1 ? universityAndDate.substring(0, inIndex) : universityAndDate;
                                        const dateRange = inIndex > -1 ? universityAndDate.substring(inIndex + 4) : '';

                                        return (
                                            <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                                <h4 className="font-semibold">{university || degree}</h4>
                                                <p className={`text-sm ${grayText}`}>{degree}</p>
                                                <p className={`text-sm ${lightGrayText}`}>{dateRange}</p>
                                            </div>
                                        );
                                    } else {
                                        // Standard format with structured data
                                        return (
                                            <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                                <h4 className="font-semibold">{edu.university}</h4>
                                                <p className={`text-sm ${grayText}`}>
                                                    {edu.degree && Array.isArray(edu.degree) ? edu.degree.join(", ") : edu.degree || 'Unknown degree'}
                                                </p>
                                                <p className={`text-sm ${lightGrayText}`}>
                                                    {edu.startedYear} - {edu.endedYear}
                                                </p>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </section>
                    )}

                    {/* Experience */}
                    {normalizedData?.experience?.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Experience</h3>
                            <div className="space-y-6">
                                {normalizedData.experience.map((job, idx) => {
                                    // Check if this is a contactOut format (string) or standard format (object)
                                    if (typeof job === 'string') {
                                        // Parse contactOut string format: "Position at Company in StartYear - EndYear"
                                        const parts = job.split(' at ');
                                        const position = parts[0] || job;
                                        const companyAndDate = parts[1] || '';
                                        const inIndex = companyAndDate.lastIndexOf(' in ');
                                        const company = inIndex > -1 ? companyAndDate.substring(0, inIndex) : companyAndDate;
                                        const dateRange = inIndex > -1 ? companyAndDate.substring(inIndex + 4) : '';

                                        return (
                                            <div key={idx} className="border-l-4 border-green-500 pl-4">
                                                <h4 className="font-semibold text-lg">{position}</h4>
                                                <p className={grayText}>{company}</p>
                                                <p className={`text-sm ${lightGrayText}`}>{dateRange}</p>
                                            </div>
                                        );
                                    } else {
                                        // Standard format with structured data
                                        return (
                                            <div key={idx} className="border-l-4 border-green-500 pl-4">
                                                <h4 className="font-semibold text-lg">{job.position}</h4>
                                                <p className={grayText}>{job.company}</p>
                                                <p className={`text-sm ${lightGrayText}`}>
                                                    {job.started ? new Date(job.started).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short'
                                                    }) : 'Unknown start'} -{" "}
                                                    {job.current
                                                        ? "Present"
                                                        : job.ended ? new Date(job.ended).toLocaleDateString(undefined, {
                                                            year: 'numeric', month: 'short'
                                                        }) : 'Unknown end'}
                                                </p>
                                                {job.location && (
                                                    <p className={`text-sm ${lightGrayText}`}>{job.location}</p>
                                                )}
                                                {job.summary && (
                                                    <p className={`whitespace-pre-line ${grayText}`}>{job.summary}</p>
                                                )}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </section>
                    )}

                    {/* Analysis */}
                    {analysis && (
                        <section>
                            <h3 className="text-lg font-semibold mb-2">Analysis Score</h3>
                            <div className={`rounded-xl p-5 shadow-sm ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border border-gray-200"}`}>
                                {/* {analysis.score && (
                                    <div className="mb-4">
                                        <span className="text-2xl font-bold text-blue-600">{analysis.score}</span>
                                    </div>
                                )} */}
                                <p className="mb-4">{analysis.description || "No description available"}</p>
                                {analysis.breakdown?.length > 0 && (
                                    <ul className="list-disc list-inside text-sm">
                                        {analysis.breakdown.map((item, index) => (
                                            <li
                                                key={index}
                                                className={item.met ? "text-green-500" : "text-red-500"}
                                            >
                                                {item.criterion} - {item.met ? "Met" : "Not Met"}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                <div className={`mt-6 flex justify-end gap-3 p-6 border-t ${borderColor}`}>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
