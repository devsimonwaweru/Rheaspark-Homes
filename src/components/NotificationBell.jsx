import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch notifications on mount and when dropdown opens
  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    // Close dropdown if clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId, link) => {
    // Mark as read in DB
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    
    // Update local state instantly
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigate if there's a link
    if (link) {
      setIsOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }} 
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a2.032 2.032 0 00-2.032-2.032 2.032 2.032 0 00-2.032 2.032V4a2.032 2.032 0 012.032-2.032 2.032 2.032 0 012.032 2.032v2.158A2.032 2.032 0 0115 9.842L13.595 8.437A2.032 2.032 0 0011.163 8.437H9a2.032 2.032 0 00-2.032 2.032V4a2.032 2.032 0 012.032-2.032 2.032 2.032 0 012.032 2.032v2.158A2.032 2.032 0 0015 9.842L13.595 8.437A2.032 2.032 0 0011.163 8.437H9a2.032 2.032 0 00-2.032 2.032V4a2.032 2.032 0 012.032-2.032 2.032 2.032 0 012.032 2.032v2.158A2.032 2.032 0 0015 9.842z" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707-.293l-2.414-2.414A1 1 0 0012.586 13H4m0 0V11a1 1 0 011-1h9.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016.414 15H20" /></svg>
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.link)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  {/* Unread Dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!notif.is_read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                    {notif.message && <p className="text-xs text-gray-400 truncate mt-0.5">{notif.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{getTimeAgo(notif.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}