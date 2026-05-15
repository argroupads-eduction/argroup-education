'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const HeroSection = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500 opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div variants={item} className="space-y-8">
            <Badge variant="gold">🎓 Your Path to Medical Excellence</Badge>

            <h1 className="font-serif text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
              Study MBBS
              <br />
              <span className="text-gold-500">Anywhere</span>
              <br />
              Get Admission
              <br />
              <span className="text-sky-400">Everywhere</span>
            </h1>

            <p className="font-body text-lg md:text-xl text-gray-200 leading-relaxed font-light">
              Join 4000+ successful students who achieved their medical dreams abroad.
              Expert guidance, proven results, 98% visa success rate.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-4 border border-white border-opacity-20"
                whileHover={{ y: -4 }}
              >
                <div className="font-serif text-2xl md:text-3xl font-bold text-gold-500">
                  4000+
                </div>
                <div className="font-body text-sm text-gray-300 font-medium">Students</div>
              </motion.div>
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-4 border border-white border-opacity-20"
                whileHover={{ y: -4 }}
              >
                <div className="font-serif text-2xl md:text-3xl font-bold text-sky-400">
                  19+
                </div>
                <div className="font-body text-sm text-gray-300 font-medium">Years</div>
              </motion.div>
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-4 border border-white border-opacity-20"
                whileHover={{ y: -4 }}
              >
                <div className="font-serif text-2xl md:text-3xl font-bold text-green-400">
                  500+
                </div>
                <div className="font-body text-sm text-gray-300 font-medium">Universities</div>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button variant="primary" size="lg" className="group">
                Free Counselling
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="secondary" size="lg">
                Apply Now
              </Button>
            </div>
          </motion.div>

          {/* Right Content - Illustration */}
          <motion.div
            variants={item}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gold-500 to-sky-500 rounded-2xl p-1 shadow-2xl">
                <div className="bg-navy-900 rounded-2xl p-8 flex items-center justify-center h-96">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center gap-4 text-4xl">
                      <Globe className="w-16 h-16 text-gold-500" />
                      <BookOpen className="w-16 h-16 text-sky-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-serif text-3xl font-bold text-white leading-tight">
                        Your Success is
                        <br />
                        Our Mission
                      </p>
                      <p className="font-body text-gray-400 text-sm">
                        Complete guidance from counselling to admission to visa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gold-500 rounded-full flex justify-center">
          <motion.div className="w-1 h-2 bg-gold-500 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
};
