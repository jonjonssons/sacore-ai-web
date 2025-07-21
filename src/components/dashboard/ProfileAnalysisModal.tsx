import React from "react";
import { X, Check, ExternalLink, Copy, User, Building, MapPin, Briefcase, Award, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/contexts/ThemeContext";

interface MatchedCriteria {
  title?: boolean;
  location?: boolean;
  industry?: boolean;
}

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry?: string;
  relevanceScore?: number;
  linkedinUrl: string;
  matchedCriteria?: MatchedCriteria;
  emailAddress?: string;
  experienceLevel?: string;
  companySize?: string;
}

interface ProfileAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  searchCriteria: {
    title: string;
    location: string;
    industry: string;
  };
}

export function ProfileAnalysisModal({
  isOpen,
  onClose,
  lead,
  searchCriteria,
}: ProfileAnalysisModalProps) {
  const { isDarkMode } = useTheme();

  if (!lead) return null;

  const totalCriteria = 3; // title, location, industry
  const matchedCount = lead.relevanceScore || 0;
  const percentMatch = Math.round((matchedCount / totalCriteria) * 100);

  // Function to open LinkedIn URL
  const openLinkedInProfile = () => {
    if (lead.linkedinUrl) {
      window.open(lead.linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to copy LinkedIn URL
  const copyLinkedInUrl = () => {
    if (lead.linkedinUrl) {
      navigator.clipboard.writeText(lead.linkedinUrl);
      // You could add a toast notification here
    }
  };

  // Function to get industry display name
  const getIndustryName = (industry?: string) => {
    if (!industry) return "Not specified";
    // Add mapping for industry codes to display names if needed
    return industry;
  };

  // Function to get experience level display name
  const getExperienceLevel = (level?: string) => {
    const experienceLevels = {
      entry: "0-2 years",
      junior: "3-5 years",
      mid: "6-10 years",
      senior: "11-15 years",
      executive: "15+ years"
    };

    return level ? experienceLevels[level as keyof typeof experienceLevels] || level : "Not specified";
  };

  // Function to get company size display name
  const getCompanySize = (size?: string) => {
    const companySizes = {
      startup: "Startup",
      smallBusiness: "Small Business",
      midMarket: "Mid-Market",
      enterprise: "Enterprise",
      fortune500: "Fortune 500"
    };

    return size ? companySizes[size as keyof typeof companySizes] || size : "Not specified";
  };

  const dark = isDarkMode;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-xl max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-xl ${dark ? "bg-zinc-900" : "bg-white"}`}>
        <DialogHeader className={`p-6 pb-2 border-b ${dark ? "border-zinc-700" : "border-b-gray-200"}`}>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <User className={`h-5 w-5 ${dark ? "text-white" : "text-black"}`} />
            <span className={dark ? "text-white" : "text-black"}>Profile Analysis</span>
          </DialogTitle>
          <p className={`text-sm mt-1 ${dark ? "text-zinc-400" : "text-gray-500"}`}>
            Detailed analysis and matching criteria for this profile
          </p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto">
          {/* Profile Header */}
          <div className={`${dark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-100"} rounded-xl p-5 mb-6 border shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 ${dark ? "bg-zinc-700" : "bg-gray-200"} rounded-full flex items-center justify-center`}>
                <span className={`text-2xl font-semibold ${dark ? "text-white" : "text-gray-600"}`}>
                  {lead.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{lead.name}</h3>
                <p className={`flex items-center gap-1.5 ${dark ? "text-zinc-300" : "text-gray-700"}`}>
                  <Briefcase className="h-4 w-4" />{lead.title}
                </p>
                <p className={`flex items-center gap-1.5 ${dark ? "text-zinc-300" : "text-gray-700"}`}>
                  <Building className="h-4 w-4" />{lead.company}
                </p>
                <p className={`flex items-center gap-1.5 ${dark ? "text-zinc-300" : "text-gray-700"}`}>
                  <MapPin className="h-4 w-4" />{lead.location}
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2">
                <div className="flex flex-col items-center rounded-md bg-yellow-50 p-3 border border-yellow-100">
                  <span className="text-2xl font-bold text-yellow-700">{matchedCount}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex items-center gap-2 text-sm" onClick={openLinkedInProfile}>
                <ExternalLink className="h-4 w-4" />
                LinkedIn Profile
              </Button>

              <Button variant="outline" className="flex items-center gap-2 text-sm" onClick={copyLinkedInUrl}>
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>

              {lead.emailAddress && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-sm ml-auto"
                  onClick={() => navigator.clipboard.writeText(lead.emailAddress || "")}
                >
                  <Copy className="h-4 w-4" />
                  {lead.emailAddress}
                </Button>
              )}
            </div>
          </div>

          {/* Matching Score */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${dark ? "text-white" : ""}`}>Matching Score</h3>
            <div className={`p-5 rounded-xl shadow-sm ${dark ? "bg-zinc-800 border-zinc-700" : "bg-white border border-gray-200"}`}>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${dark ? "text-zinc-300" : "text-gray-700"}`}>Match Score</span>
                  <span className={`text-sm font-medium ${dark ? "text-zinc-300" : "text-gray-700"}`}>
                    {lead.relevanceScore !== undefined ? lead.relevanceScore : 0}
                  </span>
                </div>
                <Progress value={percentMatch} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["title", "location", "industry"].map((key) => {
                  const value = lead.matchedCriteria?.[key as keyof MatchedCriteria];
                  const display = key === "industry" ? getIndustryName(lead.industry) : (lead as any)[key];
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg ${value
                        ? "bg-green-50 border border-green-100"
                        : dark
                          ? "bg-zinc-700 border border-zinc-600"
                          : "bg-gray-50 border border-gray-100"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium capitalize ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{key}</span>
                        {value ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className={`text-sm ${value ? "text-green-700" : dark ? "text-zinc-300" : "text-gray-500"}`}>
                        {display}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${dark ? "text-white" : ""}`}>Additional Information</h3>
            <div className={`p-5 rounded-xl shadow-sm ${dark ? "bg-zinc-800 border-zinc-700" : "bg-white border border-gray-200"}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Experience Level</span>
                    <p className={dark ? "text-white font-medium" : "font-medium"}>
                      {getExperienceLevel(lead.experienceLevel)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Company Size</span>
                    <p className={dark ? "text-white font-medium" : "font-medium"}>
                      {getCompanySize(lead.companySize)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Industry</span>
                    <p className={dark ? "text-white font-medium" : "font-medium"}>
                      {getIndustryName(lead.industry)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email Address</span>
                    <p className={dark ? "text-white font-medium" : "font-medium"}>
                      {lead.emailAddress || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-black text-white">
              Enrich Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 