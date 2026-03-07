import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LandlordSidebar from '../components/LandlordSidebar';
import AddPropertyModal from '../components/AddPropertyModal';

export default function LandlordDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
      
      {/* 
         Pass openModal function to Sidebar so the button there can trigger the modal 
      */}
      <LandlordSidebar onAddProperty={openModal} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* 
             Pass openModal to children (LandlordHome) via context.
             LandlordHome will access this using useOutletContext.
          */}
          <Outlet context={{ openAddPropertyModal: openModal }} />
        </main>
      </div>

      {/* The Global Modal Component */}
      <AddPropertyModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}