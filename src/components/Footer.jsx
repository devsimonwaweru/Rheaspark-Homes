import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="Rheaspark Logo" className="w-10 h-10 rounded-lg object-cover bg-white p-0.5" />
              <span className="text-xl font-bold font-brand brand-gradient">Rheaspark</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Simplifying house hunting and relocation with verified listings and trusted moving services.
            </p>
            {/* Social Icons: Facebook, Instagram, TikTok */}
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white hover:bg-primary-blue transition-colors">
                <i className="fab fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white hover:bg-primary-blue transition-colors">
                <i className="fab fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white hover:bg-primary-blue transition-colors">
                <i className="fab fa-tiktok text-sm"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm">Home</Link></li>
              <li><Link to="/find-houses" className="text-gray-300 hover:text-white transition-colors text-sm">Find a House</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm">Moving Services</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm">List Your Property</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">FAQs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-300">
                <i className="fas fa-phone-alt text-primary-green mr-3"></i>
                +254 769 525 570
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <i className="fas fa-envelope text-primary-green mr-3"></i>
                wenbusale383@gmail.com
              </li>
              <li className="flex items-start text-sm text-gray-300">
                <i className="fas fa-map-marker-alt text-primary-green mr-3 mt-1"></i>
                Nairobi, Kenya
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-blue-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Rheaspark. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}