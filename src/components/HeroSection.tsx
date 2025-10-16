import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, Search, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import '@/components/dashboard/RequirementsProfileComponent.css'
import { useTheme } from '@/contexts/ThemeContext';

const HeroSection: React.FC = () => {
  const [placeholderText, setPlaceholderText] = useState('What profiles are you looking for?');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null); // Speech recognition stub
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";         // Reset height
      el.style.height = `${el.scrollHeight}px`; // Set new height based on content
    }
  };

  useEffect(() => {
    handleResize(); // Resize on mount or when content changes
  }, [searchQuery]);


  useEffect(() => {
    const texts = [
      " an Account Executive in Stockholm...",
      " a Software Engineer with React experience...",
      " a Marketing Manager in fintech...",
      " a Data Scientist in Berlin...",
      " a Product Manager with SaaS background...",
      " a Sales Director in healthcare...",
      " a UX Designer in Copenhagen...",
      " a DevOps Engineer with AWS skills...",
      " a CFO in crypto industry...",
      " a Frontend Developer in Amsterdam..."
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // implement search logic
    console.log('Search query:', searchQuery);
    // session storage
    sessionStorage.setItem('initialSearchQuery', searchQuery);

    // redirect to requirements profile
    navigate('/signup');
  };

  // const toggleListening = () => {
  //   if (!recognition) {
  //     alert('Speech recognition not supported.');
  //     return;
  //   }

  //   isListening ? recognition.stop() : recognition.start();
  //   setIsListening(!isListening);
  // };

  return (
    <section
      className={`relative overflow-hidden ${isDarkMode
        ? "bg-primary text-gray-100"
        : "bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900"
        }`}
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className={`absolute inset-0 -z-10 ${isDarkMode
          ? "bg-gradient-to-br from-primary to-black"
          : "bg-gradient-to-br from-gray-50 to-white"
          }`}
      />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">

          {/* Heading */}
          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
              fontWeight: 700,
              letterSpacing: "-0.02em"
            }}
          >
            AI talent search engine
          </h1>

          {/* Subheading */}
          <p
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto tracking-tight"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
            }}
          >
            Find people in minutes, your personal sourcing assistant
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative w-full">
              <div
                className={`relative rounded-full px-6 pt-5 pb-5 transition-all border ${isDarkMode ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" }}
              >
                {/* Search Icon */}
                <Search className={`absolute top-1/2 left-6 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleResize();
                  }}
                  rows={1}
                  placeholder={placeholderText}
                  className={`w-full resize-none bg-transparent border-none outline-none text-sm pl-10 pr-20 placeholder-gray-400 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
                    letterSpacing: "-0.02em",
                    fontWeight: 400,
                    lineHeight: "1.5",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    overflow: "hidden",
                  }}
                />

                {/* Button + Mic */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {/* <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full transition ${isListening ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                    onClick={toggleListening}
                  >
                    <Mic className={`h-5 w-5 ${isListening ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                  </Button> */}

                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full transition ${searchQuery.trim()
                      ? 'bg-gray-800 hover:bg-gray-900 cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    disabled={!searchQuery.trim()}
                  >
                    <SendHorizontal
                      className={`h-5 w-5 transition ${searchQuery.trim() ? 'text-white' : 'text-gray-100'}`}
                    />
                  </Button>
                </div>
              </div>
            </form>

            {/* Preset Suggestions */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
              {[
                'CTO in Stockholm',
                'Full Stack Developer',
                'Account Executive in Berlin',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(preset)}
                  className={`px-3 py-1 text-sm font-semibold rounded-full border hover:bg-gray-50 transition ${isDarkMode ? 'bg-gray-850 text-gray-300 border-gray-600' : 'bg-white text-gray-500 border-gray-200'}`}
                  style={{
                    fontSize: "0.8rem",
                    letterSpacing: "-0.005em",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

  );
};

export default HeroSection;
