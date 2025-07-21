
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type FilterGroup = {
  id: string;
  title: string;
  filters: FilterItem[];
  isOpen: boolean;
}

type FilterItem = {
  id: string;
  label: string;
  isSelected: boolean;
  icon?: React.ReactNode;
}

const FilterPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'basic',
      title: 'Signals & Intent',
      isOpen: true,
      filters: [
        { id: 'not-already', label: 'Not already in AI contacts', isSelected: false },
        { id: 'company-size', label: 'Company size growth (3m+)', isSelected: false },
        { id: 'hiring', label: 'Company is hiring', isSelected: false },
        { id: 'technologies', label: 'Company technologies', isSelected: false },
        { id: 'funding-date', label: 'Company last funding date', isSelected: false },
        { id: 'revenue', label: 'Company revenue', isSelected: false },
        { id: 'keyword', label: 'Keyword in company', isSelected: false },
      ]
    },
    {
      id: 'company',
      title: 'Company information',
      isOpen: false,
      filters: [
        { id: 'company-size', label: 'Company size', isSelected: false },
        { id: 'company-industry', label: 'Company industry', isSelected: false },
        { id: 'company-market', label: 'Company market', isSelected: false },
        { id: 'company-type', label: 'Company type', isSelected: true },
        { id: 'company-name', label: 'Company name', isSelected: false },
        { id: 'founded-year', label: 'Company founded year', isSelected: false },
        { id: 'company-country', label: 'Company country', isSelected: false },
        { id: 'company-region', label: 'Company region', isSelected: false },
        { id: 'company-city', label: 'Company city / state', isSelected: false },
        { id: 'linkedin-url', label: 'Company LinkedIn URL', isSelected: false },
        { id: 'website-url', label: 'Company Website URL', isSelected: false },
      ]
    },
    {
      id: 'contact',
      title: 'Contact information',
      isOpen: false,
      filters: [
        { id: 'full-name', label: 'Full Name', isSelected: false },
        { id: 'city-state', label: 'City / State', isSelected: false },
        { id: 'interests', label: 'Interests', isSelected: false },
        { id: 'skills', label: 'Skills', isSelected: false },
        { id: 'school-name', label: 'School name', isSelected: false },
        { id: 'school-degree', label: 'School degree', isSelected: false },
        { id: 'contact-linkedin', label: 'Contact LinkedIn URL', isSelected: false },
        { id: 'contact-linkedin-slug', label: 'Contact LinkedIn slug', isSelected: false },
      ]
    }
  ]);

  const toggleFilterGroup = (groupId: string) => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
      )
    );
  };

  const toggleFilter = (groupId: string, filterId: string) => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              filters: group.filters.map(filter => 
                filter.id === filterId 
                  ? { ...filter, isSelected: !filter.isSelected } 
                  : filter
              ) 
            } 
          : group
      )
    );
    
    // Update active filters
    const filterLabel = filterGroups
      .find(g => g.id === groupId)?.filters
      .find(f => f.id === filterId)?.label;
      
    if (filterLabel) {
      if (activeFilters.includes(filterId)) {
        setActiveFilters(activeFilters.filter(id => id !== filterId));
      } else {
        setActiveFilters([...activeFilters, filterId]);
      }
    }
  };

  const getSelectedFiltersCount = () => {
    return filterGroups.reduce((count, group) => {
      return count + group.filters.filter(filter => filter.isSelected).length;
    }, 0);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 p-1 h-8"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Toggle Filters</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <span className="font-medium text-sm">Filters</span>
          {getSelectedFiltersCount() > 0 && (
            <Badge className="bg-primary/10 text-primary ml-2 h-5 px-2">
              {getSelectedFiltersCount()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <span className="sr-only">Reset</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
          {filterGroups.map((group) => (
            <div key={group.id} className="border rounded-md overflow-hidden">
              <div 
                className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer"
                onClick={() => toggleFilterGroup(group.id)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{group.title}</span>
                  {group.filters.some(f => f.isSelected) && (
                    <Badge className="bg-red-100 text-red-600 border-red-200">
                      {group.filters.filter(f => f.isSelected).length}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {group.isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {group.isOpen && (
                <div className="divide-y">
                  {group.filters.map((filter) => (
                    <div 
                      key={filter.id} 
                      className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer ${filter.isSelected ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleFilter(group.id, filter.id)}
                    >
                      <span className="text-sm">{filter.label}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
