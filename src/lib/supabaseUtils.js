import { supabase } from './supabaseClient';

/**
 * Get the public URL of an image in the "property-images" bucket.
 * Returns a placeholder if path is missing or invalid.
 * @param {string} path - The file path in the bucket
 * @returns {string} public URL
 */
export const getSupabaseImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
  
  const { data } = supabase.storage.from('property-images').getPublicUrl(path);
  return data?.publicUrl || 'https://via.placeholder.com/400x300?text=No+Image';
};