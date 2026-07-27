import React, { useState, useEffect, useRef } from 'react';

export default function OtpInput({ email, onSubmitOtp, loading, error }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const value = element.value;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const finalOtp = newOtp.join('');
      if (finalOtp.length === 6) {
        onSubmitOtp(finalOtp);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!newOtp[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    // Trigger resend logic passed from parent
    if (onSubmitOtp) {
      // We pass a special flag to tell parent to resend, not verify
      onSubmitOtp('RESEND');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm border border-red-100 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-2" style={{ direction: 'ltr' }}>
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            ref={(el) => (inputRefs.current[index] = el)}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            className="w-full h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            disabled={loading}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 h-5">
        {loading ? (
          <span className="text-blue-500 font-medium">Verifying...</span>
        ) : cooldown > 0 ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Resend code in {cooldown}s
          </span>
        ) : (
          <button onClick={handleResend} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
            Resend Code
          </button>
        )}
      </div>
    </div>
  );
}