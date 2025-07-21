import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const About: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-primary text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`py-16 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              About SACORE AI
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* CEO Quote Section */}
            <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border shadow-sm`}>
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Jon Jönsson, CEO at Sacore:
                </h2>
              </div>
              
              <div className="space-y-6">
                <blockquote className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  "I started SACORE AI because I noticed that even though there are good tools and processes out there, it still feels like something's missing. Most companies seem to focus on reducing work, but not enough on actually improving results. That's what matters most in the end, delivering better, not just doing less.
                </blockquote>
                
                <blockquote className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  I had a pretty clear idea of what I wanted to build. Something simple enough for anyone to use, because it is the only way that makes sense. But also something that helps you work faster and more accurately, so the end result is better. Better matches, less time wasted.
                </blockquote>
                
                <blockquote className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  In the first version, we've focused on what takes up the most admin time for recruiter, sourcing. What normally takes 2–4 hours a day can now be done in 10–15 minutes, without losing quality. That's the starting point. The rest is coming."
                </blockquote>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="mt-16 text-center">
              <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Our Mission
              </h3>
              <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-3xl mx-auto`}>
                SACORE AI helps recruiters and hiring teams streamline their recruitment process by automating sourcing and improving candidate matching – faster, more accurate, and with less manual work.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="mt-16">
              <h3 className={`text-2xl font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                What We Deliver
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}>
                  <h4 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Faster Results
                  </h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reduce sourcing time from 2-4 hours to 10-15 minutes per day without compromising quality.
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}>
                  <h4 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Better Matches
                  </h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Intelligent candidate matching that improves accuracy and reduces time wasted on poor fits.
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}>
                  <h4 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Simple to Use
                  </h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Designed for anyone to use - because that's the only way that makes sense.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 