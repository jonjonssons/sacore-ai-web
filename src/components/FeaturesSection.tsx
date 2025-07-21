import React from 'react';
import { motion } from 'framer-motion';
import { Search, Zap } from 'lucide-react';

const features = [
  {
    icon: '🔍',
    title: 'AI talent search',
    description: 'Automatically find relevant candidates online, based on clear search criteria. Our AI understands context and your exact hiring needs.',
    list: [
      'Global candidate search',
      'Contextual job understanding',
      'Relevance-based scoring'
    ]
  },
  {
    icon: '⚡',
    title: 'Candidate enrichment',
    description: 'Get detailed candidate profiles instantly. Our AI analyzes, scores, and ranks candidates based on skills and experience.',
    list: [
      'Automated profile analysis',
      'Skills & experience mapping',
      'Candidate scoring & ranking'
    ]
  }
];

const FeaturesSection: React.FC = () => {
  const fontStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={fontStyle}
          >
            Two components working seamlessly
          </h2>
          <p
            className="text-xl text-gray-600 dark:text-gray-400"
            style={fontStyle}
          >
            To streamline your sourcing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <h3
              className="text-2xl font-bold mb-4"
              style={fontStyle}
            >
              AI talent search
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400 mb-6"
              style={fontStyle}
            >
              Automatically find relevant candidates online, based on clear search criteria. Our AI understands context and your exact hiring needs.
            </p>
            <ul className="space-y-3">
              {['Global candidate search', 'Contextual job understanding', 'Relevance-based scoring'].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center text-gray-600 dark:text-gray-400"
                  style={fontStyle}
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <h3
              className="text-2xl font-bold mb-4"
              style={fontStyle}
            >
              Candidate enrichment
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400 mb-6"
              style={fontStyle}
            >
              Get detailed candidate profiles instantly. Our AI analyzes, scores, and ranks candidates based on skills and experience.
            </p>
            <ul className="space-y-3">
              {['Automated profile analysis', 'Skills & experience mapping', 'Candidate scoring & ranking'].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center text-gray-600 dark:text-gray-400"
                  style={fontStyle}
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
