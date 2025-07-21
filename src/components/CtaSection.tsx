import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CtaSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-black">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-95 -z-10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Outreach?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using SACORE AI to connect with prospects, 
            close more deals, and grow their revenue.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button className="bg-white text-black hover:bg-gray-100 py-6 px-8 rounded-none text-lg shadow-sm hover:shadow-md transition-all">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <p className="text-gray-400 mt-6 text-sm">
            No credit card required · 7-day free trial · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
