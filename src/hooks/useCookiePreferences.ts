import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const useCookiePreferences = () => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Load existing preferences from localStorage
    const consent = localStorage.getItem('cookieConsent');
    const savedPreferences = localStorage.getItem('cookiePreferences');
    
    if (consent && savedPreferences) {
      setHasConsent(true);
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setHasConsent(true);
  };

  const clearConsent = () => {
    localStorage.removeItem('cookieConsent');
    localStorage.removeItem('cookiePreferences');
    setPreferences(null);
    setHasConsent(false);
  };

  return {
    preferences,
    hasConsent,
    updatePreferences,
    clearConsent
  };
}; 