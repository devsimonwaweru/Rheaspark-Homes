// src/lib/paymentUtils.js
import { supabase } from './supabaseClient';

/**
 * Checks if a tenant has unlocked a specific property
 */
export const checkIfUnlocked = async (userId, propertyId) => {
  const { data, error } = await supabase
    .from('unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('Unlock check error:', error);
    return false;
  }
  
  return !!data;
};

/**
 * Calculates unlock price based on property type
 */
export const getUnlockPrice = (propertyType) => {
  const type = propertyType?.toLowerCase() || '';
  if (type.includes('single')) return 20;
  if (type.includes('bedsitter')) return 30;
  return 100;
};