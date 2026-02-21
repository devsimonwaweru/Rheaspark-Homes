import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCoverflow } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

import TimelineStep from '../components/TimelineStep';
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

  // Timeline Steps Data
  const steps = [
    { number: "1", title: "Search & Browse", description: "Explore verified rental listings.", icon: "fa-search" },
    { number: "2", title: "Access Details", description: "Unlock full property details.", icon: "fa-lock-open" },
    { number: "3", title: "Connect", description: "Contact landlords directly.", icon: "fa-handshake" },
    { number: "4", title: "Move In", description: "Seamless relocation services.", icon: "fa-truck-moving" }
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

  // Benefits Data
  const benefits = [
    { title: "Trust & Verification", description: "Every property undergoes rigorous verification.", icon: "fa-shield-alt", color: "blue" },
    { title: "Complete Transparency", description: "No hidden details or surprises.", icon: "fa-eye", color: "green" },
    { title: "Time-Saving Efficiency", description: "Streamlined process from start to finish.", icon: "fa-clock", color: "blue" }
  ];

  // Moving Services Slides
  const movingSlides = [
    { id: 1, title: "Integrated Relocation", description: "Once you find your perfect home, our integrated moving service is just one click away.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", icon: "fa-home" },
    { id: 2, title: "Simple Process", description: "Request a move, get an instant quote, and schedule your moving day seamlessly.", image: "https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", icon: "fa-cogs" },
    { id: 3, title: "Transparent Pricing", description: "Simple 10% commission model. No hidden fees for you.", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", icon: "fa-percentage" },
    { id: 4, title: "Exclusive Benefits", description: "Verified movers, direct trust, and a single point of contact.", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", icon: "fa-award" }
  ];

  // Landlord CTA State
  const [activeTab, setActiveTab] = useState('benefits');

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
                <div className="flex gap-4">
                  <a href="#how-it-works" className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-xl shadow-md hover:shadow-lg border border-gray-200 transition-all duration-300 flex items-center justify-center hover:border-primary-blue hover:text-primary-blue">
                    <i className="fas fa-play-circle mr-2"></i> How It Works
                  </a>
                  <a href="#why-choose-us" className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-xl shadow-md hover:shadow-lg border border-gray-200 transition-all duration-300 flex items-center justify-center hover:border-primary-green hover:text-primary-green">
                    <i className="fas fa-star mr-2"></i> Why Us
                  </a>
                </div>
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

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand"><span className="brand-gradient">How Rheaspark</span> Works</h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">Our 4-step process makes house hunting simple and stress-free.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform -translate-x-1/2 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {steps.map((step) => <TimelineStep key={step.number} {...step} />)}
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

      {/* WHY CHOOSE US (BENEFITS) */}
      <section id="why-choose-us" className="py-24 px-6 bg-blue-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand">Why Choose <span className="text-primary-blue">Rheaspark</span></h2>
            <p className="text-blue-200 text-xl max-w-3xl mx-auto">Transforming house hunting through three core principles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-blue-800/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-700 hover:border-primary-blue transition-all duration-300">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${benefit.color === 'blue' ? 'bg-primary-blue/20' : 'bg-primary-green/20'}`}>
                  <i className={`fas ${benefit.icon} text-3xl ${benefit.color === 'blue' ? 'text-primary-blue' : 'text-primary-green'}`}></i>
                </div>
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-blue-100 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* MOVING SERVICES SECTION */}
      {/* ========================================== */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-blue-50/20 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
              <span className="brand-gradient">Rheaspark</span> Moving Services
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Your trusted relocation partner - Seamlessly integrated with our house hunting platform
            </p>
          </div>

          <div className="px-8 lg:px-12">
            <Swiper
              modules={[Autoplay, Pagination, EffectCoverflow]}
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              breakpoints={{
                768: { slidesPerView: 1.2 },
                1024: { slidesPerView: 1.5 }
              }}
              className="h-[600px]"
            >
              {movingSlides.map((slide) => (
                <SwiperSlide key={slide.id} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-2/5 relative overflow-hidden h-64 md:h-full">
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                        <div className="text-center">
                          <i className={`fas ${slide.icon} text-2xl text-primary-blue mb-1`}></i>
                          <p className="text-xs font-bold text-gray-800">Service</p>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-3/5 p-8 flex flex-col">
                      <h3 className="text-3xl font-bold text-gray-800 mb-4">{slide.title}</h3>
                      <p className="text-gray-600 leading-relaxed mb-6 flex-grow">{slide.description}</p>
                      <div className="flex gap-4">
                        <GradientButton>Learn More</GradientButton>
                        <button className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                          Get Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* LANDLORD CALL-TO-ACTION */}
      {/* ========================================== */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
              <span className="text-gray-800">List Your Property</span> <br />
              <span className="brand-gradient">Free for Year One</span>
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Join Kenya's fastest-growing rental platform.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="flex flex-col lg:flex-row">
              
              {/* Left Visual */}
              <div className="lg:w-2/5 bg-gradient-to-br from-blue-50 to-green-50 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-40 h-40 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-blue/20 animate-spin-slow"></div>
                    <div className="absolute inset-8 rounded-full border-4 border-primary-green/20 animate-spin-reverse-slow"></div>
                    <div className="absolute inset-16 rounded-2xl bg-gradient-to-br from-primary-blue to-primary-green flex items-center justify-center shadow-xl">
                      <i className="fas fa-home text-4xl text-white"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">365 Days Free</h3>
                  <p className="text-gray-600">No listing fees for the first year</p>
                </div>
              </div>

              {/* Right Content */}
              <div className="lg:w-3/5 p-8 md:p-10">
                
                {/* Toggle Switch */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex rounded-full bg-gray-100 p-1">
                    <button 
                      onClick={() => setActiveTab('benefits')}
                      className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${activeTab === 'benefits' ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white' : 'text-gray-700'}`}
                    >
                      Benefits
                    </button>
                    <button 
                      onClick={() => setActiveTab('form')}
                      className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${activeTab === 'form' ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white' : 'text-gray-700'}`}
                    >
                      Get Started
                    </button>
                  </div>
                </div>

                {/* Content Condition */}
                {activeTab === 'benefits' ? (
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className="fas fa-money-bill-wave text-primary-blue"></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Free Year One Listing</h4>
                        <p className="text-gray-600 text-sm">List unlimited properties absolutely free.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className="fas fa-user-shield text-primary-green"></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Verified Tenant Pool</h4>
                        <p className="text-gray-600 text-sm">Access to pre-verified tenants.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className="fas fa-chart-line text-primary-blue"></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Dashboard Access</h4>
                        <p className="text-gray-600 text-sm">Full control over your listings.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="you@example.com" />
                    </div>
                    <button className="w-full mt-2 py-3 bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300">
                      Start Free Trial
                    </button>
                  </form>
                )}

              </div>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}