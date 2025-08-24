import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./NotFoundPage.css"; // we'll create this file

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="relative w-full max-w-5xl mx-auto">
        {/* Background animated stripes */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-10 -top-10 w-[120%] h-[120%] transform rotate-6 opacity-5">
            <svg
              className="w-full h-full"
              viewBox="0 0 800 800"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#0f0f0f" />
                  <stop offset="50%" stopColor="#1b1b1b" />
                  <stop offset="100%" stopColor="#0f0f0f" />
                </linearGradient>
              </defs>
              <rect width="800" height="800" fill="url(#g1)" />
            </svg>
          </div>

          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.06, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* moving red bar */}
          <motion.div
            className="absolute top-1/3 left-[-30%] w-1/2 h-2 bg-red-600 blur-sm opacity-70"
            animate={{ x: [0, "160%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Big 404 */}
          <div className="space-y-6">
            <motion.h1
              className="text-9xl md:text-[12rem] leading-none font-extrabold tracking-tight text-white drop-shadow-2xl motion-safe:animate-glitch"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              404
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl font-semibold text-gray-200 max-w-lg"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              Oops... page not found. Looks like the page took a left turn into
              the Upside Down.
            </motion.p>

            <div className="flex flex-wrap gap-3 items-center">
              <motion.button
                className="px-5 py-3 rounded-md bg-red-600 hover:bg-red-700 active:scale-95 shadow-md text-white font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
              >
                Go Home
              </motion.button>

              <motion.button
                className="px-4 py-3 rounded-md border border-gray-700 text-gray-200 hover:bg-white/5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.history.back()}
              >
                Go Back
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <span>© {new Date().getFullYear()} ZaneProEd</span>
          <span className="mx-3">•</span>
          <a href="/privacy" className="underline">
            Privacy
          </a>
          <span className="mx-3">•</span>
          <a href="/terms" className="underline">
            Terms
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
