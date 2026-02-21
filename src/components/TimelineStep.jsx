import React from 'react';

export default function TimelineStep({ number, title, description, icon }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      
      {/* Circle with Number */}
      <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary-blue to-primary-green flex items-center justify-center shadow-xl border-4 border-white mb-6">
        <span className="text-white font-bold text-2xl">{number}</span>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full max-w-xs">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <i className={`fas ${icon} text-xl text-primary-blue`}></i>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

    </div>
  );
}