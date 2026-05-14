import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import GradientButton from '../components/GradientButton';

export default function Home() {
  // ------------------------------------------
  // STATE & DATA
  // ------------------------------------------
  
  // Hero Slides Data
  const heroSlides = [
    { id: 1, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80", title: "Spacious 3-Bedroom Apartment", location: "Westlands • KES 85,000/month" },
    { id: 2, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Contemporary Family Home", location: "Kileleshwa • KES 120,000/month" },
    { id: 3, image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Luxury 2-Bedroom Suite", location: "Kilimani • KES 65,000/month" }
  ];

  // Featured Areas Data
  const [activeFilter, setActiveFilter] = useState('all');
  const areas = [
    { id: 1, name: "Westlands", type: "premium", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 85,000+", count: "42 Listings" },
    { id: 2, name: "Kilimani", type: "premium", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 65,000+", count: "38 Listings" },
    { id: 3, name: "Kileleshwa", type: "family", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 120,000+", count: "28 Listings" },
    { id: 4, name: "Roysambu", type: "affordable", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 35,000+", count: "56 Listings" },
    { id: 5, name: "South B", type: "student", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 25,000+", count: "65 Listings" },
    { id: 6, name: "Lavington", type: "premium", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rent: "KES 150,000+", count: "22 Listings" },
  ];

  const filteredAreas = activeFilter === 'all' 
    ? areas 
    : areas.filter(area => area.type === activeFilter);

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <main>
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(47, 164, 231, 0.1) 2%, transparent 0%)', backgroundSize: '100px 100px' }}></div>
        
        <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-green mr-2 animate-pulse"></span>
                <span className="text-sm font-semibold text-gray-700">Trusted House Hunting Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-brand leading-tight">
                <span className="text-gray-800">Find Your</span><br />
                <span className="brand-gradient">Perfect Home</span><br />
                <span className="text-gray-800">With Confidence</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Rheaspark eliminates the stress of house hunting with <span className="font-semibold text-primary-blue">verified listings</span> and <span className="font-semibold text-primary-green">trusted moving services</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <GradientButton size="lg"><i className="fas fa-search mr-2"></i> Start Your Search</GradientButton>
                
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]">
                <Swiper modules={[Autoplay, Pagination, Navigation]} spaceBetween={0} slidesPerView={1} autoplay={{ delay: 5000 }} pagination={{ clickable: true }} navigation={true} loop={true} className="h-full">
                  {heroSlides.map((slide) => (
                    <SwiperSlide key={slide.id} className="relative">
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                        <span className="inline-block px-3 py-1 bg-primary-green text-sm font-semibold rounded mb-2">Verified</span>
                        <h3 className="text-2xl font-bold mb-1">{slide.title}</h3>
                        <p className="text-gray-200">{slide.location}</p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED RENTAL AREAS */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand"><span className="brand-gradient">Featured</span> Rental Areas</h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">Explore popular neighborhoods with verified listings</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['all', 'premium', 'affordable', 'family', 'student'].map(filter => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 capitalize ${activeFilter === filter ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-blue hover:text-primary-blue'}`}>
                {filter === 'all' ? 'All Areas' : filter}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAreas.map((area) => (
              <div key={area.id} className="group relative overflow-hidden rounded-2xl h-80 shadow-lg cursor-pointer">
                <img src={area.image} alt={area.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center mb-2"><i className="fas fa-map-marker-alt text-primary-green mr-2"></i><span className="text-sm opacity-90">Nairobi</span></div>
                  <h3 className="text-2xl font-bold mb-1">{area.name}</h3>
                  <div className="flex justify-between items-end">
                    <div><p className="text-sm opacity-80">Average Rent</p><p className="text-lg font-bold">{area.rent}</p></div>
                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{area.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}