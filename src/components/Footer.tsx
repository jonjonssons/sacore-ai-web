import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 pt-16 pb-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="block my-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity">SACORE AI</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-md">
              SACORE AI helps recruiters and hiring teams streamline their recruitment process by automating sourcing and improving candidate matching – faster, more accurate, and with less manual work.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-saas-violet-500 transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-saas-violet-500 transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-saas-violet-500 transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Features</a></li>
              <li><Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Legal & Privacy</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Terms of Service</Link></li>
              <li><Link to="/opt-out" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Data Rights & Opt-out</Link></li>
              <li><Link to="/cookie-policy" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/sending-policy" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Sending Policy</Link></li>
              <li><Link to="/anti-abuse-protection" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Anti-abuse Protection</Link></li>
              <li><Link to="/data-processing-agreement" className="text-gray-600 dark:text-gray-400 hover:text-saas-blue-500 transition-colors">Data Processing Agreement</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                &copy; {currentYear} SACORE AI. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  GDPR Compliant
                </span>
              </div>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-gray-500 dark:text-gray-400 hover:text-saas-blue-500 text-sm transition-colors">Privacy</Link>
              <Link to="/terms-of-service" className="text-gray-500 dark:text-gray-400 hover:text-saas-blue-500 text-sm transition-colors">Terms</Link>
              <Link to="/opt-out" className="text-gray-500 dark:text-gray-400 hover:text-saas-blue-500 text-sm transition-colors">Opt-out</Link>
              <Link to="/cookie-policy" className="text-gray-500 dark:text-gray-400 hover:text-saas-blue-500 text-sm transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
