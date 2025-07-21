import React, { useEffect, ReactNode } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';
import StatSection from '@/components/StatSection';
import PerformanceSection from '@/components/PerformanceSection';

// Animation variants for sections
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

interface AnimatedSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

// Component for animated section
const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, id, className = "" }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={sectionVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>

      <motion.div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-gray-200/20 blur-3xl -z-10"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gray-200/20 blur-3xl -z-10"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="fixed top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-gray-200/20 blur-3xl -z-10"
        animate={{
          x: [0, 50, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 5,
        }}
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col flex-grow"
        >
          <Header />
          <main className="flex-grow">
            <AnimatedSection id="hero">
              <HeroSection />
            </AnimatedSection>

            <AnimatedSection id="stat">
              <StatSection />
            </AnimatedSection>

            <AnimatedSection id="features">
              <FeaturesSection />
            </AnimatedSection>

            <AnimatedSection id="performance">
              <PerformanceSection />
            </AnimatedSection>

            {/* <AnimatedSection id="pricing">
              <PricingSection />
            </AnimatedSection>
            
            <AnimatedSection id="testimonials">
              <TestimonialsSection />
            </AnimatedSection>
            
            <AnimatedSection id="cta">
              <CtaSection />
            </AnimatedSection> */}
          </main>
          <Footer />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
