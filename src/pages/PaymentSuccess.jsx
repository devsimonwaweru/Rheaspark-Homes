// src/pages/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const type = searchParams.get('type');
    const property_id = searchParams.get('property_id');

    // If landlord posting property
    if (type === 'post_property') {
      const savedData = localStorage.getItem('pending_property_data');
      if (savedData) {
        const { formData, amenities } = JSON.parse(savedData);

        const uploadProperty = async () => {
          try {
            // Upload image
            const imageFile = formData.imageFile;
            const fileName = `prop-${Date.now()}-${imageFile.name.replace(/\s/g, '-')}`;
            const { error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, imageFile);

            if (uploadError) throw new Error(uploadError.message);

            const { data: urlData } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);

            // Insert property
            const { error: insertError } = await supabase
              .from('properties')
              .insert({
                ...formData,
                price: Number(formData.price),
                image_url: urlData.publicUrl,
                images: [urlData.publicUrl],
                amenities: amenities || [],
                status: 'active'
              });

            if (insertError) throw insertError;

            localStorage.removeItem('pending_property_data');
            alert('Property successfully posted!');
            navigate('/find-houses');
          } catch (err) {
            console.error(err);
            alert('Failed to post property: ' + err.message);
          }
        };

        uploadProperty();
      }
    }

    // If tenant viewing landlord info
    if (type === 'view_property') {
      alert('Payment successful! You can now view landlord contact info.');
      navigate(`/property-details/${property_id}`);
    }
  }, [navigate, searchParams]);

  return (
    <div className="max-w-md mx-auto p-6 bg-green-100 shadow-xl rounded-xl mt-12 text-center">
      <h1 className="text-2xl font-bold mb-4">✅ Payment Successful!</h1>
      <p className="text-gray-700">
        {searchParams.get('type') === 'post_property'
          ? 'Your property will now be posted.'
          : 'You can now view landlord details.'}
      </p>
    </div>
  );
}