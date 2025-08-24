import React from "react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/70 to-gray-900/90 backdrop-blur-xl border-t border-gray-700/40 text-gray-300 px-6 py-12 shadow-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Branding */}
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">⚡ ZANE ΩMEGA</h2>
          <p className="text-sm text-indigo-300 mt-2 font-light tracking-wide">
            The Future of Learning & Simulation
          </p>
          <p className="mt-4 text-sm leading-relaxed">
            Turning students into industry-ready pros with AI-driven courses, immersive simulations, and real-world project training.{" "}
            <span className="text-white font-medium">No fluff. Just results.</span>
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">🚀 Quick Links</h3>
          <ul className="space-y-2">
            {["Home", "Courses", "Simulations", "Careers", "About Us", "Contact"].map((link) => (
              <li key={link}>
                <a href="#" className="hover:text-indigo-400 transition-colors duration-200">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">📬 Contact Us</h3>
          <p className="text-sm mb-2">support@zaneproed.com</p>
          <p className="text-sm mb-4">+91-XXXX-XXX-XXX</p>
          <p className="text-sm text-gray-400">📍 HQ (Online, Everywhere)</p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by <span className="text-indigo-400">ZaneProEd.com</span> | Built for the next generation of learners.
          </p>
        </div>

        {/* Why Omega */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">💡 Why ΩMEGA?</h3>
          <p className="text-sm leading-relaxed mb-4">
            We’re not here to just “teach” — we’re here to redefine learning.  
            AI-powered guidance, next-level simulations, and career mapping that doesn’t waste your time.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-4 mb-4 text-lg">
            <a href="#" aria-label="LinkedIn" className="hover:text-indigo-400 transition-colors">🔗</a>
            <a href="#" aria-label="Instagram" className="hover:text-pink-400 transition-colors">📷</a>
            <a href="#" aria-label="Twitter" className="hover:text-sky-400 transition-colors">🐦</a>
            <a href="#" aria-label="YouTube" className="hover:text-red-500 transition-colors">▶</a>
          </div>

          {/* Subscribe */}
          <div>
            <input
              type="email"
              placeholder="Your email"
              className="w-full p-2 text-sm rounded bg-white/10 text-white placeholder-gray-400 border border-gray-500/30 focus:outline-none focus:border-indigo-400"
            />
            <button className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-opacity text-white py-2 text-sm rounded shadow-md">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-10 border-t border-gray-600/30 pt-4 text-center text-sm text-gray-400">
        © 2025 ZANE ΩMEGA — All Rights Reserved.  
        <span className="block mt-1 italic text-gray-500">"Knowledge is power. Applied knowledge is Omega."</span>
      </div>
    </footer>
  );
}
