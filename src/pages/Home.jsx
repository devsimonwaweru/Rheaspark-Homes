import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import GradientButton from '../components/GradientButton';
import PropertyCard from '../components/PropertyCard';
import PropertyDetailsModal from '../components/PropertyDetailsModal'; 
import { supabase } from '../lib/supabaseClient'; 

export default function Home() {
  const [heroSlides, setHeroSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  useEffect(() => {
    fetchHeroSlides();
    fetchFeaturedProperties();
  }, []);

  const fetchHeroSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, location, price, image_url')
        .eq('featured', 'true')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        const formattedSlides = data.map(item => ({
            id: item.id,
            image: item.image_url,
            title: item.title,
            location: `${item.location} • KES ${item.price?.toLocaleString()}/month`
        }));
        setHeroSlides(formattedSlides);
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error.message);
    } finally {
      setLoadingSlides(false);
    }
  };

  const fetchFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*') 
        .eq('featured', 'true')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6); 

      if (error) throw error;
      if (data) setFeaturedProperties(data);
    } catch (error) {
      console.error('Error fetching featured properties:', error.message);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

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
                <Link to="/find-houses">
                  <GradientButton size="lg">
                    <i className="fas fa-search mr-2"></i> Start Your Search
                  </GradientButton>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]">
                {loadingSlides ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
                    <span>Loading Featured Homes...</span>
                  </div>
                ) : (
                  <Swiper 
                    modules={[Autoplay, Pagination, Navigation]} 
                    spaceBetween={0} 
                    slidesPerView={1} 
                    autoplay={{ delay: 5000 }} 
                    pagination={{ clickable: true }} 
                    navigation={true} 
                    loop={heroSlides.length > 1} 
                    className="h-full"
                  >
                    {heroSlides.map((slide) => (
                      <SwiperSlide key={slide.id} className="relative">
                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <span className="inline-block px-3 py-1 bg-primary-green text-sm font-semibold rounded mb-2">Featured</span>
                          <h3 className="text-2xl font-bold mb-1">{slide.title}</h3>
                          <p className="text-gray-200">{slide.location}</p>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES SECTION */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
              <span className="brand-gradient">Featured</span> Properties
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Handpicked properties by our team for you
            </p>
          </div>

          {loadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <p className="text-center text-gray-500">No featured properties available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onViewDetails={handleViewDetails} 
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/find-houses">
              <GradientButton size="lg">
                <i className="fas fa-th-large mr-2"></i> View All Listings
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* --- RENTAL MANAGEMENT SYSTEM ADVERT --- */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full filter blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="inline-block bg-white/10 backdrop-blur-sm text-purple-200 text-sm font-bold px-4 py-2 rounded-full border border-white/20 mb-6 uppercase tracking-wider">
                For Landlords & Agents
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Automate Your Rental Business
              </h2>
              <p className="text-lg text-indigo-100 mb-8 leading-relaxed max-w-xl">
                Manage properties, track tenant payment history, and automate invoices seamlessly with our Rental Management System.
              </p>

              {/* Pricing Box */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 inline-block mx-auto lg:mx-0">
                <div className="flex items-end justify-center lg:justify-start gap-2 mb-2">
                  <span className="text-sm text-indigo-200 line-through">Standard Rates</span>
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">1 Month Free</span>
                </div>
                <div className="flex items-baseline justify-center lg:justify-start">
                  <span className="text-4xl font-extrabold text-white">KES 1,199</span>
                  <span className="text-indigo-200 ml-2 font-medium">/ property / month</span>
                </div>
                <p className="text-xs text-indigo-300 mt-2">First month free on your first subscription.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="https://keja-zetu-rentals.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-white text-indigo-700 font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105"
                >
                  Subscribe Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </a>
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                   <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2 border-b border-gray-700">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500"></div>
                     <span className="ml-4 text-xs text-gray-400 font-mono">dashboard.rentals.app</span>
                   </div>
                   <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                         <div className="h-20 bg-indigo-500/30 rounded-lg border border-indigo-400/30"></div>
                         <div className="h-20 bg-purple-500/30 rounded-lg border border-purple-400/30"></div>
                         <div className="h-20 bg-pink-500/30 rounded-lg border border-pink-400/30"></div>
                      </div>
                      <div className="h-32 bg-gray-800 rounded-lg mt-4"></div>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* --- END ADVERT SECTION --- */}

      {/* PROPERTY DETAILS MODAL */}
      {selectedProperty && (
        <PropertyDetailsModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          property={selectedProperty}
        />
      )}

    </main>
  );
}