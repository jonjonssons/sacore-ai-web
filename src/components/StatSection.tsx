import React from 'react';
import { motion } from 'framer-motion';

const stats = [
    { number: '95%', label: 'Time saved' },
    { number: '2min', label: 'From 2 hours' },
    { number: '100+', label: 'Candidates per Search' },
    { number: '24/7', label: 'Active' }
];

const StatSection: React.FC = () => {
    return (
        <section className="py-32 bg-gray-50 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 text-center">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <div className="text-6xl font-bold text-gray-900 mb-2 transition-transform group-hover:-translate-y-2">
                                {stat.number}
                            </div>
                            <div className="text-base text-gray-600">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatSection; 