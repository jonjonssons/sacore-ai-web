import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PerformanceSection: React.FC = () => {
    return (
        <section className="py-32 bg-gray-50 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <div className="max-w-4xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Hours of sourcing reduced to seconds
                    </h2>

                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        Eliminate candidate sourcing and matching, so you can focus on outreach and final selection.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Link
                            to="/login"
                            className="bg-gray-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                        >
                            Log in
                        </Link>

                        <Link
                            to="/signup"
                            className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium border border-gray-200 hover:border-gray-300 transition-all hover:scale-105 active:scale-95"
                        >
                            Sign up
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default PerformanceSection; 