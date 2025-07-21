import React, { useState, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface LeadFilterState {
  scoreCategories: {
    title: boolean;
    location: boolean;
    industry: boolean;
  };
  searchTerm: string; // Keep searchTerm for compatibility
  specificRequirements?: string[]; // Add this for specific requirements
  source?: {
    csv: boolean;
    web: boolean;
  };
  fetchedFrom?: {
    signalhire: boolean;
    brave: boolean;
    google: boolean;
  };
}

interface LeadFiltersProps {
  onApplyFilters: (filters: LeadFilterState) => void;
  matchedCategoriesValues?: any[]; // Add this to receive the values from LeadTable
}

export function LeadFilters({ onApplyFilters, matchedCategoriesValues = [] }: LeadFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<LeadFilterState>({
    scoreCategories: {
      title: false,
      location: false,
      industry: false
    },
    searchTerm: "",
    specificRequirements: [],
    source: {
      csv: false,
      web: false
    },
    fetchedFrom: {
      signalhire: false,
      brave: false,
      google: false
    }
  });
  const [appliedFilters, setAppliedFilters] = useState<LeadFilterState>(filters);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [specificRequirements, setSpecificRequirements] = useState<{ field: string, value: string }[]>([]);
  const { isDarkMode } = useTheme();

  // Extract unique requirements from matchedCategoriesValues
  useEffect(() => {
    if (matchedCategoriesValues && matchedCategoriesValues.length > 0) {
      const allRequirements: { field: string, value: string }[] = [];

      // Extract all values from each category in details
      matchedCategoriesValues.forEach(value => {
        if (value?.details) {
          // Extract location values
          if (value.details.location) {
            value.details.location.forEach((loc: string) => {
              if (loc && !allRequirements.some(req => req.field === 'location' && req.value === loc.trim())) {
                allRequirements.push({ field: 'location', value: loc.trim() });
              }
            });
          }

          // Extract title values
          if (value.details.title) {
            value.details.title.forEach((title: string) => {
              if (title && !allRequirements.some(req => req.field === 'title' && req.value === title.trim())) {
                allRequirements.push({ field: 'title', value: title.trim() });
              }
            });
          }

          // Extract industry values
          if (value.details.industry) {
            value.details.industry.forEach((industry: string) => {
              if (industry && !allRequirements.some(req => req.field === 'industry' && req.value === industry.trim())) {
                allRequirements.push({ field: 'industry', value: industry.trim() });
              }
            });
          }
        }
      });

      // Save to localStorage and update state
      if (allRequirements.length > 0) {
        localStorage.setItem('SpecificRequirementFilters', JSON.stringify(allRequirements));
        setSpecificRequirements(allRequirements);
        // Extract just the values for the filters state to maintain compatibility
        const requirementValues = allRequirements.map(req => req.value);
        setFilters(prev => ({
          ...prev,
          specificRequirements: requirementValues
        }));
      }
    }
  }, [matchedCategoriesValues]);

  // Load specific requirements from localStorage
  useEffect(() => {
    try {
      const savedRequirements = localStorage.getItem('SpecificRequirementFilters');
      if (savedRequirements) {
        const parsedRequirements = JSON.parse(savedRequirements);
        setSpecificRequirements(parsedRequirements);
        // Extract just the values for the filters state to maintain compatibility
        const requirementValues = parsedRequirements.map((req: { field: string, value: string }) => req.value);
        setFilters(prev => ({
          ...prev,
          specificRequirements: requirementValues
        }));
      }
    } catch (error) {
      console.error('Error loading specific requirements from localStorage:', error);
    }
  }, []);

  // Calculate active filter count
  const activeFilterCount = Object.values(appliedFilters.scoreCategories).filter(Boolean).length +
    (appliedFilters.specificRequirements?.length || 0) +
    Object.values(appliedFilters.source || {}).filter(Boolean).length +
    Object.values(appliedFilters.fetchedFrom || {}).filter(Boolean).length;

  // Handle checkbox changes
  const handleCheckboxChange = (category: keyof LeadFilterState, field: string) => {
    if (category === 'scoreCategories') {
      setFilters({
        ...filters,
        [category]: {
          ...filters[category],
          [field]: !filters[category][field as keyof typeof filters.scoreCategories]
        }
      });
    } else if (category === 'source') {
      setFilters({
        ...filters,
        [category]: {
          ...filters[category],
          [field]: !filters[category]?.[field as keyof typeof filters.source]
        }
      });
    } else if (category === 'fetchedFrom') {
      setFilters({
        ...filters,
        [category]: {
          ...filters[category],
          [field]: !filters[category]?.[field as keyof typeof filters.fetchedFrom]
        }
      });
    }
  };

  // Handle specific requirement selection
  const handleSpecificRequirementChange = (requirement: string) => {
    setFilters(prev => {
      const currentRequirements = prev.specificRequirements || [];
      const isSelected = currentRequirements.includes(requirement);

      return {
        ...prev,
        specificRequirements: isSelected
          ? currentRequirements.filter(r => r !== requirement)
          : [...currentRequirements, requirement]
      };
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    setValidationError(null);
    setAppliedFilters(filters);
    onApplyFilters(filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const resetFilters: LeadFilterState = {
      scoreCategories: {
        title: false,
        location: false,
        industry: false
      },
      searchTerm: "",
      specificRequirements: [],
      source: {
        csv: false,
        web: false
      },
      fetchedFrom: {
        signalhire: false,
        brave: false,
        google: false
      }
    };

    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className={`flex gap-1 text-xs font-medium h-8 px-3 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge className="ml-2 bg-black text-white">{activeFilterCount}</Badge>
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute left-0 z-[9999] mt-2 w-[320px] max-h-[400px] rounded-xl border shadow-xl overflow-hidden flex flex-col ${isDarkMode
              ? "border-gray-700 bg-gray-900 text-gray-200"
              : "border-gray-200 bg-white text-gray-800"
              }`}
          >
            <div className="flex-1 overflow-y-auto">
              <div className={`px-4 py-3 border-b font-semibold ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                Filters
              </div>

              <div className={`px-4 py-3 border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                Score Categories
              </div>
              <div className="px-4 py-3 space-y-4">
                {["title", "location", "industry"].map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`score-${key}`}
                      checked={filters.scoreCategories[key as keyof typeof filters.scoreCategories]}
                      onCheckedChange={() => handleCheckboxChange("scoreCategories", key)}
                    />
                    <label htmlFor={`score-${key}`} className="text-sm font-medium capitalize">
                      {key}
                    </label>
                  </div>
                ))}
              </div>

              <div className={`px-4 py-3 border-t border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                Specific Requirements
              </div>
              <div className="px-4 py-3 space-y-4">
                {specificRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`requirement-${index}`}
                      checked={filters.specificRequirements?.includes(requirement.value)}
                      onCheckedChange={() => handleSpecificRequirementChange(requirement.value)}
                    />
                    <label htmlFor={`requirement-${index}`} className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {requirement.value}
                    </label>
                  </div>
                ))}
              </div>

              <div className={`px-4 py-3 border-t border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                Source
              </div>
              <div className="px-4 py-3 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="source-csv"
                    checked={filters.source?.csv || false}
                    onCheckedChange={() => handleCheckboxChange("source", "csv")}
                  />
                  <label htmlFor="source-csv" className="text-sm font-medium">
                    CSV Import
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="source-sacore-ai"
                    checked={filters.source?.web || false}
                    onCheckedChange={() => handleCheckboxChange("source", "web")}
                  />
                  <label htmlFor="source-sacore-ai" className="text-sm font-medium">
                    WEB Search
                  </label>
                </div>
              </div>

              {/* <div className={`px-4 py-3 border-t border-b text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                Fetched From
              </div>
              <div className="px-4 py-3 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fetched-from-signalhire"
                    checked={filters.fetchedFrom?.signalhire || false}
                    onCheckedChange={() => handleCheckboxChange("fetchedFrom", "signalhire")}
                  />
                  <label htmlFor="fetched-from-signalhire" className="text-sm font-medium">
                    SignalHire
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fetched-from-brave"
                    checked={filters.fetchedFrom?.brave || false}
                    onCheckedChange={() => handleCheckboxChange("fetchedFrom", "brave")}
                  />
                  <label htmlFor="fetched-from-brave" className="text-sm font-medium">
                    Brave
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fetched-from-google"
                    checked={filters.fetchedFrom?.google || false}
                    onCheckedChange={() => handleCheckboxChange("fetchedFrom", "google")}
                  />
                  <label htmlFor="fetched-from-google" className="text-sm font-medium">
                    Google
                  </label>
                </div>
              </div> */}
            </div>

            {/* Sticky footer */}
            <div className={`flex justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className={`rounded-md ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""}`}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className={`rounded-md ${isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"}`}
                onClick={() => {
                  handleApplyFilters();
                  setIsExpanded(false);
                }}
              >
                ✓ Apply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}