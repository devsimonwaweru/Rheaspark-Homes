/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import PaymentModal from "./PaymentModal";

export default function PropertyDetailsModal({ isOpen, onClose, property, isFavorited, onToggleFavorite }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAgentAccess, setHasAgentAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState("view_property");
  
  // Image gallery state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  
  // Touch handling refs
  const lastTouchDist = useRef(null);
  const lastTouchCenter = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const lastTapRef = useRef(0);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const overlayTimeoutRef = useRef(null);

  // Fees from settings
  const [fees, setFees] = useState(null);

  const imageList = useMemo(() => {
    if (!property) return [];
    let sources = [];
    const rawData = property.images;

    if (rawData) {
      try {
        if (typeof rawData === 'string' && (rawData.startsWith('[') || rawData.startsWith('{'))) {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed)) sources = parsed;
        } else if (typeof rawData === 'string' && rawData.startsWith('{') && rawData.endsWith('}')) {
          const matches = rawData.match(/https?:\/\/[^,}]+/g);
          if (matches) sources = matches;
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (typeof rawData === 'string') sources = rawData.split(',').map(s => s.trim());
      }
    }

    if (sources.length === 0 && property.image_url) sources.push(property.image_url);
    if (sources.length === 0 && property.image) sources.push(property.image);

    return sources.filter(Boolean);
  }, [property]);

  // Fetch fees from settings
  useEffect(() => {
    const fetchFees = async () => {
      const { data } = await supabase
        .from('viewing_fees')
        .select('*');
      
      if (data && data.length > 0) {
        setFees(data);
      } else {
        setFees([
          { property_type: 'Bedsitter/Studio', view_fee: 30, agent_fee: 200 },
          { property_type: 'Single Room', view_fee: 20, agent_fee: 150 },
          { property_type: '1 Bedroom', view_fee: 50, agent_fee: 300 },
          { property_type: '2 Bedroom', view_fee: 80, agent_fee: 400 },
          { property_type: '3 Bedroom', view_fee: 100, agent_fee: 500 },
          { property_type: 'Apartment/Flat', view_fee: 100, agent_fee: 600 },
          { property_type: 'Commercial', view_fee: 150, agent_fee: 800 },
        ]);
      }
    };
    
    if (isOpen) fetchFees();
  }, [isOpen]);

  const getFeesForProperty = useCallback(() => {
    if (!fees || !property?.type) return { viewFee: 100, agentFee: 500 };
    
    const type = property.type.toLowerCase();
    let matched = fees.find(f => {
      const ft = f.property_type.toLowerCase();
      if (ft.includes('bedsitter') || ft.includes('studio')) return type.includes('bedsitter') || type.includes('studio');
      if (ft.includes('single')) return type.includes('single');
      if (ft.includes('1 bedroom') || ft.includes('one bedroom')) return (type.includes('1 bedroom') || type.includes('one bedroom'));
      if (ft.includes('2 bedroom') || ft.includes('two bedroom')) return (type.includes('2 bedroom') || type.includes('two bedroom'));
      if (ft.includes('3 bedroom') || ft.includes('three bedroom')) return (type.includes('3 bedroom') || type.includes('three bedroom'));
      if (ft.includes('apartment') || ft.includes('flat')) return type.includes('apartment') || type.includes('flat');
      if (ft.includes('commercial')) return type.includes('commercial');
      return false;
    });

    if (matched) return { viewFee: matched.view_fee, agentFee: matched.agent_fee };
    return { viewFee: 100, agentFee: 500 };
  }, [fees, property]);

  const { viewFee, agentFee } = getFeesForProperty();

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setShowOverlay(true);
      setImageLoaded(false);
      resetZoom();
    }
  }, [isOpen, imageList]);

  // Reset zoom when image changes
  useEffect(() => {
    resetZoom();
    setImageLoaded(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') {
        if (isZoomed) resetZoom();
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZoomed, currentIndex, imageList.length]);

  // Auto-hide overlay
  const startOverlayTimeout = () => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      if (!isZoomed) setShowOverlay(false);
    }, 5000);
  };

  useEffect(() => {
    if (showOverlay && isOpen) startOverlayTimeout();
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [showOverlay, isOpen]);

  const resetZoom = () => {
    setIsZoomed(false);
    setZoomLevel(1);
    setPanPos({ x: 0, y: 0 });
  };

  const goToNext = useCallback(() => {
    if (isZoomed) { resetZoom(); return; }
    if (imageList.length <= 1) return;
    setSlideDirection('right');
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % imageList.length);
      setSlideDirection(null);
    }, 150);
  }, [isZoomed, imageList.length]);

  const goToPrev = useCallback(() => {
    if (isZoomed) { resetZoom(); return; }
    if (imageList.length <= 1) return;
    setSlideDirection('left');
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + imageList.length) % imageList.length);
      setSlideDirection(null);
    }, 150);
  }, [isZoomed, imageList.length]);

  const handleImageTap = (e) => {
    if (isDragging) return;
    
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (isZoomed) {
        resetZoom();
      } else {
        setIsZoomed(true);
        setZoomLevel(2.5);
        setShowOverlay(false);
      }
      e.preventDefault();
    } else {
      // Single tap - toggle overlay
      setShowOverlay(!showOverlay);
      if (!showOverlay) startOverlayTimeout();
    }
    lastTapRef.current = now;
  };

  // Touch handlers
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastTouchDist.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartTime.current = Date.now();
      
      if (isZoomed) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - panPos.x, y: e.touches[0].clientY - panPos.y });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDist.current) {
      e.preventDefault();
      const newDist = getTouchDistance(e.touches);
      const scale = newDist / lastTouchDist.current;
      const newZoom = Math.min(Math.max(zoomLevel * scale, 1), 4);
      
      if (newZoom > 1.1) {
        setIsZoomed(true);
        setShowOverlay(false);
      } else if (newZoom < 1.05) {
        setIsZoomed(false);
      }
      
      setZoomLevel(newZoom);
      lastTouchDist.current = newDist;
    } else if (e.touches.length === 1 && isDragging && isZoomed) {
      e.preventDefault();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPanPos({ x: newX, y: newY });
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0 && !isZoomed && lastTouchDist.current === null) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaTime = Date.now() - touchStartTime.current;
      
      if (Math.abs(deltaX) > 50 && deltaTime < 400) {
        if (deltaX > 0) goToPrev();
        else goToNext();
      }
    }
    
    lastTouchDist.current = null;
    lastTouchCenter.current = null;
    
    // Small delay to prevent tap firing after drag
    setTimeout(() => setIsDragging(false), 50);
  };

  // Mouse wheel zoom (desktop)
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 4);
    
    if (newZoom > 1.1) {
      setIsZoomed(true);
      setShowOverlay(false);
    } else if (newZoom <= 1) {
      resetZoom();
      return;
    }
    
    setZoomLevel(newZoom);
  };

  // Check access
  useEffect(() => {
    const checkAccess = async () => {
      if (!property) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("unlocks")
          .select("id, unlock_type")
          .eq("user_id", user.id)
          .eq("property_id", property.id);
        
        if (data) {
          if (data.some(d => d.unlock_type === 'view_property' || !d.unlock_type)) setHasAccess(true);
          if (data.some(d => d.unlock_type === 'agent_escort' || d.unlock_type === 'both')) setHasAgentAccess(true);
        }
      }
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === property.landlord_id) {
        setHasAccess(true);
        setHasAgentAccess(true);
      }
      setLoading(false);
    };

    if (isOpen) {
      checkAccess();
      setHasAccess(false);
      setHasAgentAccess(false);
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const hasCoordinates = property.latitude && property.longitude;
  const mapsUrl = hasCoordinates 
    ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}` 
    : '#';

  const handleUnlock = (type) => {
    setPaymentType(type);
    setShowPayment(true);
  };

  const getPaymentAmount = () => {
    if (paymentType === 'agent_escort') return agentFee;
    if (paymentType === 'both') return viewFee + agentFee;
    return viewFee;
  };

  const handlePaymentSuccess = (success) => {
    setShowPayment(false);
    if (success) {
      if (paymentType === 'agent_escort') {
        setHasAgentAccess(true);
      } else if (paymentType === 'both') {
        setHasAccess(true);
        setHasAgentAccess(true);
      } else {
        setHasAccess(true);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-fadeIn">
        {/* Image Container */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-black min-h-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
          {/* Current Image */}
          <div 
            className="w-full h-full cursor-pointer select-none"
            onClick={handleImageTap}
          >
            {imageList.length > 0 ? (
              <>
                <img
                  ref={imageRef}
                  src={imageList[currentIndex]}
                  alt={`${property.title} - ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPos.x / zoomLevel}px, ${panPos.y / zoomLevel}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    opacity: imageLoaded ? 1 : 0
                  }}
                  draggable={false}
                  onLoad={() => setImageLoaded(true)}
                />
                {/* Loading spinner */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>No Image Available</span>
              </div>
            )}
          </div>

          {/* TOP OVERLAY - Property Info */}
          <div 
            className={`absolute top-0 left-0 right-0 z-10 transition-all duration-300 ease-in-out ${
              showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
            }`}
          >
            {/* Gradient background for readability */}
            <div className="bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-3 pb-12 px-3">
              {/* Top bar with close and badges */}
              <div className="flex justify-between items-start mb-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }} 
                  className="bg-white/15 backdrop-blur-md p-2.5 rounded-full hover:bg-white/25 active:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex gap-1.5">
                  {property.type && (
                    <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white">
                      {property.type}
                    </span>
                  )}
                  {imageList.length > 1 && (
                    <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white">
                      {currentIndex + 1} / {imageList.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Property Info Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-xl">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{property.title}</h2>
                    <div className="flex items-center mt-1.5 text-white/70 text-sm">
                      <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{property.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg sm:text-xl font-bold text-white">KES {property.price?.toLocaleString()}</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">per month</p>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>{property.bedrooms || 0} Bed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span>{property.bathrooms || 0} Bath</span>
                  </div>
                  {property.size && (
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span>{property.size}</span>
                    </div>
                  )}
                  {(property.available_units > 0 || property.total_units > 0) && (
                    <div className="flex items-center gap-1.5 text-blue-300 text-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      <span>{property.available_units || 0} units left</span>
                    </div>
                  )}
                  {property.last_verified_at && (
                    <div className="flex items-center gap-1.5 text-emerald-300 text-xs ml-auto">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Hidden when zoomed */}
          {imageList.length > 1 && !isZoomed && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md p-2.5 sm:p-3 rounded-full hover:bg-black/50 active:bg-black/60 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md p-2.5 sm:p-3 rounded-full hover:bg-black/50 active:bg-black/60 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {imageList.length > 1 && showOverlay && !isZoomed && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
              <div className="flex gap-1.5 bg-black/30 backdrop-blur-md p-1.5 rounded-full">
                {imageList.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                    className={`rounded-full transition-all duration-300 ${
                      currentIndex === index ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tap to show info hint */}
          {!showOverlay && !isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-pulse">
              <span className="text-white/40 text-xs bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Tap to show info
              </span>
            </div>
          )}

          {/* Zoom indicator */}
          {isZoomed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium flex items-center gap-2 hover:bg-black/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                Tap to zoom out • {Math.round(zoomLevel * 100)}%
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION - Unlock Options & Actions */}
        <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] max-h-[42vh] overflow-y-auto flex-shrink-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-6 bg-gray-100 animate-pulse rounded w-3/4"></div>
              <div className="h-20 bg-gray-100 animate-pulse rounded-xl"></div>
              <div className="h-12 bg-gray-100 animate-pulse rounded-xl"></div>
            </div>
          ) : hasAccess ? (
            <div className="p-4 space-y-3">
              {/* Contact Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Landlord Contact</p>
                    <a href={`tel:${property.landlord_phone}`} className="text-xl font-bold text-emerald-800 hover:underline">
                      {property.landlord_phone}
                    </a>
                  </div>
                  <a 
                    href={`tel:${property.landlord_phone}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl transition-colors shadow-sm shadow-emerald-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                </div>

                {hasCoordinates && (
                  <a 
                    href={mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Get Directions
                  </a>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2.5">
                <button
                  onClick={onToggleFavorite}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isFavorited 
                      ? 'bg-pink-50 text-pink-600 border-2 border-pink-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorited ? 'Saved' : 'Save'}
                </button>

                <a 
                  href={`https://wa.me/${property.landlord_phone}?text=Hi, I'm interested in your property: ${property.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm shadow-green-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* Agent Escort Option */}
              {!hasAgentAccess && (
                <button
                  onClick={() => handleUnlock('agent_escort')}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-purple-50 to-fuchsia-50 hover:from-purple-100 hover:to-fuchsia-100 border-2 border-purple-200 p-3.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-purple-800 text-sm">Request Agent Escort</p>
                      <p className="text-xs text-purple-500">Have an agent take you to view this property</p>
                    </div>
                  </div>
                  <span className="font-bold text-purple-700 bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm">KES {agentFee}</span>
                </button>
              )}

              {hasAgentAccess && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-purple-700 font-medium">Agent escort request active</span>
                </div>
              )}
            </div>
          ) : (
            /* NOT UNLOCKED - Show unlock options */
            <div className="p-4 space-y-3">
              {/* Brief description */}
              {property.description && (
                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{property.description}</p>
              )}
              
              {/* Hidden contact preview */}
              <div className="relative bg-gray-50 rounded-xl overflow-hidden">
                <div className="p-4 blur-[4px] select-none">
                  <p className="font-mono text-gray-400 text-lg">+254 7XX XXX XXX</p>
                  <p className="text-sm text-gray-300 mt-1">📍 Exact location hidden</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500">Unlock to view</span>
                  </div>
                </div>
              </div>

              {/* Unlock Options */}
              <div className="space-y-2">
                {/* View Details Only */}
                <button
                  onClick={() => handleUnlock('view_property')}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">View Details</p>
                      <p className="text-[11px] text-blue-200">Phone number & exact location</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">KES {viewFee}</span>
                  </div>
                </button>

                {/* Agent Escort Only */}
                <button
                  onClick={() => handleUnlock('agent_escort')}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl transition-all shadow-sm shadow-purple-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Agent Escort</p>
                      <p className="text-[11px] text-purple-200">Agent takes you to the property</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">KES {agentFee}</span>
                  </div>
                </button>

                {/* Both Options - Best Value */}
                <button
                  onClick={() => handleUnlock('both')}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-700 hover:via-violet-700 hover:to-purple-700 text-white p-4 rounded-xl transition-all shadow-sm shadow-violet-200 active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Full Access</p>
                      <p className="text-[11px] text-violet-200">View details + Agent escort</p>
                    </div>
                  </div>
                  <div className="text-right pr-16">
                    <span className="font-bold text-lg">KES {(viewFee + agentFee).toLocaleString()}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment}
        onClose={handlePaymentSuccess}
        amount={getPaymentAmount()} 
        type={paymentType} 
        propertyId={property.id} 
      />
    </>
  );
}