import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "SACORE AI has revolutionized our outreach process. We've seen a 3x increase in response rates and our sales team saves hours each day. The automation features are simply incredible.",
    author: "Sarah Johnson",
    role: "Sales Director",
    company: "TechGrowth Inc",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    rating: 5
  },
  {
    quote: "After trying multiple outreach tools, SACORE AI stands out for its ease of use and powerful analytics. It's helped us identify what messaging works best and optimize our campaigns accordingly.",
    author: "Michael Chen",
    role: "Marketing Manager",
    company: "Innovate Solutions",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    rating: 5
  },
  {
    quote: "The lead generation capabilities in SACORE AI have transformed how we find prospects. We're connecting with more qualified leads and the personalization options ensure our messages stand out.",
    author: "Emily Rodriguez",
    role: "Business Development Lead",
    company: "Nexus Partners",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    rating: 5
  },
  {
    quote: "As an agency, we need to manage outreach for multiple clients efficiently. SACORE AI's multi-account feature and detailed reporting make it perfect for our needs. Our clients love the results!",
    author: "David Wilson",
    role: "Agency Founder",
    company: "Growth Accelerators",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    rating: 5
  },
  {
    quote: "The team at SACORE AI has been exceptional. Not only is the product outstanding, but their customer support and onboarding helped us get maximum value from day one.",
    author: "Olivia Thompson",
    role: "Operations Manager",
    company: "Zenith Global",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    rating: 5
  }
];

const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goToPrevious = () => {
    setDirection('left');
    setActiveIndex((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const goToNext = () => {
    setDirection('right');
    setActiveIndex((current) => (current === testimonials.length - 1 ? 0 : current + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    touchStartX.current = null;
  };

  useEffect(() => {
    const interval = setInterval(goToNext, 8000);
    return () => clearInterval(interval);
  }, []);

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <svg 
        key={i} 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${i < rating ? 'text-black' : 'text-gray-200'}`}
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section id="testimonials" className="section py-20 md:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="mb-6 text-4xl md:text-5xl font-bold text-black">
            Loved By Teams<br />Just Like Yours
          </h2>
          <p className="text-xl text-gray-600">
            See what our customers have to say about their experience with SACORE AI
          </p>
        </div>

        <div 
          className="max-w-4xl mx-auto relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: `translateX(-${activeIndex * 100}%)`,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="min-w-full px-4">
                  <div className="bg-white rounded-none shadow-sm p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                      <Quote className="h-10 w-10 text-black opacity-20" />
                    </div>
                    
                    <p className="text-xl text-center mb-8 text-gray-600 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="flex justify-center mb-4">
                      {renderStars(testimonial.rating)}
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <Avatar className="h-16 w-16 mb-4 border border-gray-200">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                        <AvatarFallback>{testimonial.author.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <h4 className="font-bold text-black">{testimonial.author}</h4>
                        <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-white hover:text-black absolute left-0 top-1/2 -translate-y-1/2 bg-black text-white rounded-full shadow-sm hidden md:flex"
            onClick={goToPrevious}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-white hover:text-black absolute right-0 top-1/2 -translate-y-1/2 bg-black text-white rounded-full shadow-sm hidden md:flex"
            onClick={goToNext}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-none transition-all ${
                  index === activeIndex 
                    ? 'bg-black w-6' 
                    : 'bg-gray-200'
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
