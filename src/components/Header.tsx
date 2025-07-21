import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Moon, Sun } from 'lucide-react';
import authService from '@/services/authService';
import UserProfile from '@/components/UserProfile';
import { useTheme } from '@/contexts/ThemeContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on component mount and when auth state changes
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);


    };

    // Initial check
    checkAuth();

    // Listen for storage changes (in case of logout in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/');
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  // Check if link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${scrolled
        ? 'bg-white shadow-md'
        : 'bg-white/90 backdrop-blur-sm'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 tracking-tight hover:opacity-80 transition-opacity">SACORE AI</span>
            </Link>
          </div>


          {/* Authentication Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center">
                  <Button variant="ghost" className="text-gray-700 hover:text-black-600 hover:bg-black-50">
                    Dashboard
                  </Button>
                </Link>
                <div className="border-l pl-4">
                  <Link to="/profile">
                    <UserProfile compact />
                  </Link>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                {/* <div className="flex items-center gap-2">
                  <button
                    onClick={toggleDarkMode}
                    className={`h-6 w-12 rounded-full relative transition-colors duration-300 flex items-center px-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-300"}`}
                  >
                    <div
                      className={`absolute transition-all duration-300 transform ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}
                    >
                      {isDarkMode ? (
                        <Moon size={16} className="text-white" />
                      ) : (
                        <Sun size={16} className="text-yellow-500" />
                      )}
                    </div>
                  </button>
                </div> */}
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-black-600 hover:bg-black-50">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-md">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <a
              href="/"
              onClick={scrollToTop}
              className="flex items-center justify-between py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span>Home</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href="#features"
              className="flex items-center justify-between py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span>Features</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href="#pricing"
              className="flex items-center justify-between py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span>Pricing</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>

            <div className="pt-2 mt-2 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center justify-between py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <span>Dashboard</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <div className="py-2 px-3 border-t mt-2 pt-2">
                    <Link to="/profile" className="flex items-center justify-between py-2">
                      <UserProfile compact />
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center justify-between py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <span>Log out</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-between py-2 px-3  bg-black border-black rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <span>Log in</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link to="/signup" className="block mt-2">
                    <Button className="w-full bg-black text-white hover:bg-gray-800">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
