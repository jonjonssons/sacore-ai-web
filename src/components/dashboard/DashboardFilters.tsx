import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FilterPanel from './FilterPanel';

interface DashboardFiltersProps {
  placeholder?: string;
  defaultView?: string;
  views?: Array<{ value: string; label: string }>;
  onSearch?: (query: string) => void;
  onViewChange?: (view: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ 
  placeholder = "Search for profiles...",
  defaultView = "",
  views = [
    { value: "", label: "All profiles" },
    { value: "new", label: "New profiles" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" }
  ],
  onSearch,
  onViewChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState(defaultView);
  const [showFilters, setShowFilters] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };
  
  const handleViewChange = (view: string, label: string) => {
    setSelectedView(view);
    setDropdownOpen(false);
    if (onViewChange) {
      onViewChange(view);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            className="pl-9 h-9 w-full"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9 px-3 py-2 rounded-md border border-input bg-background text-sm flex items-center justify-between min-w-[150px]"
            >
              {views.find(v => v.value === selectedView)?.label || views[0].label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {views.map(view => (
                  <div
                    key={view.value}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 hover:text-black transition-colors duration-150 ${
                      selectedView === view.value ? 'bg-black text-white' : ''
                    }`}
                    onClick={() => handleViewChange(view.value, view.label)}
                  >
                    {view.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      
      {showFilters && <FilterPanel />}
    </div>
  );
};

export default DashboardFilters;
