import React from 'react';

export default function FeatureCard({ icon, title, description, color = 'blue' }) {
  // Color configurations for the icon background
  const colorClasses = {
    blue: 'from-primary-blue to-blue-100 text-primary-blue',
    green: 'from-primary-green to-green-100 text-primary-green'
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group">
      
      {/* Icon Container */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${colorClasses[color]}`}>
        <span className="text-2xl font-bold">{icon}</span>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      
    </div>
  );
}