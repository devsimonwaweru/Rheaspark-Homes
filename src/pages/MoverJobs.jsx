import React from 'react';
import { Link } from 'react-router-dom';

export default function MoverJobs() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Job Requests</h1>
      
      <div className="bg-white p-10 rounded-xl shadow-sm border text-center text-gray-500">
        <i className="fas fa-clipboard-list text-5xl mb-4 text-gray-300"></i>
        <p className="font-medium">You have no active job requests.</p>
        <p className="text-sm mt-1">When clients request your services, they will appear here.</p>
      </div>
    </div>
  );
}