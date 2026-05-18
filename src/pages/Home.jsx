import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import GradientButton from '../components/GradientButton';
import PropertyCard from '../components/PropertyCard';
import PropertyDetailsModal from '../components/PropertyDetailsModal'; 
import { supabase } from '../lib/supabaseClient'; 

export default function Home() {
  // ------------------------------------------
  // STATE & DATA
  // ------------------------------------------
  
  // Hero Slides State
  const [heroSlides, setHeroSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  // Featured Properties State
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // ------------------------------------------
  // SIDE EFFECTS
  // ------------------------------------------
  
  useEffect(() => {
    fetchHeroSlides();
    fetchFeaturedProperties();
  }, []);

  // ------------------------------------------
  // FUNCTIONS
  // ------------------------------------------

  const fetchHeroSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, location, price, image_url')
        .eq('featured', 'true') // Check for string 'true'
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
        .eq('featured', 'true') // Check for string 'true'
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6); 

      if (error) throw error;

      if (data) {
        setFeaturedProperties(data);
      }
    } catch (error) {
      console.error('Error fetching featured properties:', error.message);
    } finally {
      setLoadingProperties(false);
    }
  };

  // HANDLER: Open Modal
  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  // HANDLER: Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

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
                {/* UPDATED: Link to /find-houses */}
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
            {/* UPDATED: Link to /find-houses */}
            <Link to="/find-houses">
              <GradientButton size="lg">
                <i className="fas fa-th-large mr-2"></i> View All Listings
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

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