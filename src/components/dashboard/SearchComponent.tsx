declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, SendHorizontal, Paperclip, X, FileText, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/services/authService';

interface SearchComponentProps {
  onSearch: (query: string, file?: File, searchModes?: { webEnabled: boolean; csvEnabled: boolean }) => void;
}

interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    const savedQuery = sessionStorage.getItem('initialSearchQuery');
    return savedQuery || '';
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [placeholderText, setPlaceholderText] = useState('What profiles are you looking for?');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for search mode toggles
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const handleResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleResize(); // Resize on mount or when content changes
  }, [searchQuery]);

  // Filtered search history based on searchQuery
  const filteredSearchHistory = searchHistory.filter((query) =>
    query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  // Simulate typing animation in placeholder
  useEffect(() => {
    const texts = [
      'Searching for Account Executive in Stockholm...',
      'Looking for Software Engineers in San Francisco...',
      'Finding Marketing Managers with e-commerce experience...',
      'Upload CSV/XLSX files to search within your data...',
      'Searching the web for profiles...'
    ];
    let index = 0;
    let charIndex = 0;
    let currentText = '';
    let isDeleting = false;

    const type = () => {
      if (!isDeleting) {
        currentText = texts[index].substring(0, charIndex + 1);
        setPlaceholderText(currentText);
        charIndex++;
        if (charIndex === texts[index].length) {
          isDeleting = true;
          setTimeout(type, 1500);
          return;
        }
      } else {
        currentText = texts[index].substring(0, charIndex - 1);
        setPlaceholderText(currentText);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          index = (index + 1) % texts.length;
        }
      }
      setTimeout(type, isDeleting ? 50 : 100);
    };

    type();

    return () => {
      // Cleanup timers if needed
    };
  }, []);

  // Fetch search history when input is focused
  const fetchSearchHistory = async () => {
    try {
      const response = await authService.getUserSearchHistory();
      console.log(response);
      if (response && Array.isArray(response)) {
        // Extract unique queries sorted by createdAt descending
        const uniqueQueries = Array.from(new Set(response.map((item: any) => item.query)));
        setSearchHistory(uniqueQueries);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Failed to fetch search history', error);
    }
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // File upload handlers
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    });

    if (validFiles.length > 0) {
      const newFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      // Fix: Set the first valid file as selectedFile
      setSelectedFile(validFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(file => file.id !== id);
      // If we removed the currently selected file, update selectedFile
      const removedFile = prev.find(file => file.id === id);
      if (removedFile && selectedFile && removedFile.file === selectedFile) {
        setSelectedFile(newFiles.length > 0 ? newFiles[0].file : null);
      }
      return newFiles;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Need either a search query for web search or uploaded files for CSV search
    const hasQuery = searchQuery.trim();
    const hasFile = uploadedFiles.length > 0;

    if (webSearchEnabled && hasQuery) {
      // Web search with or without files
      onSearch(searchQuery, selectedFile || undefined, { webEnabled: webSearchEnabled, csvEnabled: hasFile });
      setShowDropdown(false);
    } else if (!webSearchEnabled && hasFile) {
      // CSV-only search (when web search is disabled but files are uploaded)
      onSearch(searchQuery, selectedFile || undefined, { webEnabled: webSearchEnabled, csvEnabled: true });
      setShowDropdown(false);
    } else if (hasFile && !hasQuery) {
      // File upload without query - treat as CSV search
      onSearch('', selectedFile || undefined, { webEnabled: false, csvEnabled: true });
      setShowDropdown(false);
    }

    localStorage.removeItem('SpecificRequirementFilters');
  };

  const handleInputFocus = () => {
    fetchSearchHistory();
  };

  const handleSelectHistory = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(false);
    onSearch(query, selectedFile || undefined, { webEnabled: webSearchEnabled, csvEnabled: uploadedFiles.length > 0 });
  };

  const { isDarkMode } = useTheme();

  return (
    <div className={`w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn ${isDarkMode ? 'bg-primary' : ''}`}>
      <div className="text-center mb-10">
        <h1 className={`text-4xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>WHO ARE YOU LOOKING FOR?</h1>
        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-md mx-auto`}>
          Find people in seconds, your personal sourcing assistant
        </p>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Uploaded files display - outside search bar */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className={`p-1 rounded-full hover:bg-gray-200 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative w-full">
            <div
              className={`relative rounded-full px-6 py-4 transition-all border ${isDragOver
                ? 'border-blue-400 bg-blue-50'
                : isDarkMode
                  ? 'bg-gray-950 border-gray-700'
                  : 'bg-white border-gray-200'
                }`}
              style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", minHeight: "80px" }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {isDragOver && (
                <div className="absolute inset-0 rounded-full bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-400 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                    <p className="text-blue-600 font-medium">Drop CSV/XLSX files here</p>
                  </div>
                </div>
              )}

              {/* Main line: Search icon + Input + Send button */}
              <div className="flex items-center mt-4">
                {/* Search icon on main line */}
                <Search className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-3 flex-shrink-0`} />

                {/* Textarea */}
                <textarea
                  value={searchQuery}
                  ref={textareaRef}
                  onChange={(e) => { setSearchQuery(e.target.value); handleResize(); }}
                  rows={1}
                  placeholder={placeholderText}
                  className={`flex-1 resize-none bg-transparent border-none outline-none text-sm placeholder-gray-400 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
                    letterSpacing: "-0.02em",
                    fontWeight: 400,
                    lineHeight: "1.5",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    overflow: "hidden",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch(e as React.FormEvent);
                    }
                  }}
                  onFocus={handleInputFocus}
                />

                {/* Send button on main line */}
                <div className="ml-3 flex-shrink-0">
                  <div className="relative group">
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-full transition ${(searchQuery.trim() || uploadedFiles.length > 0)
                        ? 'bg-gray-800 hover:bg-gray-900 cursor-pointer'
                        : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      disabled={!searchQuery.trim() && uploadedFiles.length === 0}
                      onClick={handleSearch}
                    >
                      <SendHorizontal
                        className={`h-5 w-5 transition ${(searchQuery.trim() || uploadedFiles.length > 0) ? 'text-white' : 'text-gray-100'}`}
                      />
                    </Button>

                    {/* Credit cost tooltip */}
                    <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}`}>
                      20 Credits
                    </div>
                  </div>
                </div>
              </div>

              {/* Second line: Controls below main line */}
              <div className="flex items-center ml-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1 rounded transition ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} mr-2`}
                  title="Upload CSV/XLSX file"
                >
                  <Paperclip className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${webSearchEnabled
                    ? 'bg-black text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  title="Toggle web search"
                >
                  Web search
                </button>
              </div>

              {/* File input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {showDropdown && searchHistory.length > 0 && (
              <div
                ref={dropdownRef}
                className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${isDarkMode ? 'bg-primary border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {filteredSearchHistory.length > 0 ? (
                  filteredSearchHistory.map((query, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer select-none py-2 px-4  ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                      onClick={() => handleSelectHistory(query)}
                    >
                      {query}
                    </div>
                  ))
                ) : (
                  <div className={`py-2 px-4 text-gray-500 ${isDarkMode ? 'text-gray-400' : ''}`}>
                    No matching history
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Search by job title, skills, experience, industry, and more • Upload CSV/XLSX files
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" className={`rounded-full text-xs px-4 py-1 ${isDarkMode ? 'bg-gray-950 border-gray-600 text-white hover:bg-gray-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`} onClick={() => setSearchQuery("Account Executive in Stockholm with SaaS Experience")}>
                Account Executive with SaaS
              </Button>
              <Button variant="outline" size="sm" className={`rounded-full text-xs px-4 py-1 ${isDarkMode ? 'bg-gray-950 border-gray-600 text-white hover:bg-gray-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`} onClick={() => setSearchQuery("Software engineers in San Francisco with Software Experience")}>
                Engineers in SF
              </Button>
              <Button variant="outline" size="sm" className={`rounded-full text-xs px-4 py-1 ${isDarkMode ? 'bg-gray-950 border-gray-600 text-white hover:bg-gray-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`} onClick={() => setSearchQuery("Marketing managers with e-commerce experience in Ahmedabad")}>
                Marketing in e-commerce
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;