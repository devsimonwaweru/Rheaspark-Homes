import React, { useState } from 'react';

export default function FilterPanel({ onSearch, onFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter States
  const [price, setPrice] = useState(50000);
  const [activeTypes, setActiveTypes] = useState([]);
  const [activeBedrooms, setActiveBedrooms] = useState([]);
  const [location, setLocation] = useState('');

  // Toggle Property Type
  const toggleType = (type) => {
    if (activeTypes.includes(type)) {
      setActiveTypes(activeTypes.filter(t => t !== type));
    } else {
      setActiveTypes([...activeTypes, type]);
    }
  };

  // Toggle Bedrooms
  const toggleBedroom = (count) => {
    if (activeBedrooms.includes(count)) {
      setActiveBedrooms(activeBedrooms.filter(c => c !== count));
    } else {
      setActiveBedrooms([...activeBedrooms, count]);
    }
  };

  // Handle Search
  const handleSearch = () => {
    if (onSearch) onSearch(searchTerm);
  };

  // Handle Apply Filters
  const handleApply = () => {
    const filters = {
      price,
      types: activeTypes,
      bedrooms: activeBedrooms,
      location
    };
    if (onFilter) onFilter(filters);
    setIsOpen(false); // Close panel after applying
  };

  // Handle Clear Filters
  const handleClear = () => {
    setPrice(50000);
    setActiveTypes([]);
    setActiveBedrooms([]);
    setLocation('');
    setSearchTerm('');
    if (onFilter) onFilter({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by location, property type, or keyword..."
            className="w-full p-4 pl-12 pr-24 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-blue to-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Search
          </button>
        </div>
      </div>

      {/* Advanced Filter Toggle */}
      <div className="mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-primary-blue font-semibold hover:text-primary-green transition-colors duration-300"
        >
          <i className="fas fa-sliders-h mr-2"></i>
          Advanced Filters
          <i className={`fas fa-chevron-down ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
          
          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (KES)</label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>10,000</span>
                <span>{price.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="200000" 
                step="5000" 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
            <div className="flex flex-wrap gap-2">
              {['Apartment', 'House', 'Studio', 'Bedsitter'].map(type => (
                <button 
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-300 ${
                    activeTypes.includes(type) 
                      ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white border-transparent' 
                      : 'bg-blue-50 text-primary-blue border-blue-100 hover:bg-blue-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4+'].map(count => (
                <button 
                  key={count}
                  onClick={() => toggleBedroom(count)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-300 ${
                    activeBedrooms.includes(count) 
                      ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white border-transparent' 
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-300"
            >
              <option value="">All Locations</option>
              <option value="Westlands">Westlands</option>
              <option value="Kilimani">Kilimani</option>
              <option value="Kileleshwa">Kileleshwa</option>
              <option value="Lavington">Lavington</option>
              <option value="Karen">Karen</option>
              <option value="Runda">Runda</option>
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-100">
          <button 
            onClick={handleClear}
            className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-300"
          >
            Clear All
          </button>
          <button 
            onClick={handleApply}
            className="px-5 py-2 bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}