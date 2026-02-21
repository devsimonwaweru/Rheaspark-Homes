import React from 'react';

export default function PaymentStepper({ currentStep = 1 }) {
  // Define the steps
  const steps = [
    { id: 1, label: "Access Info" },
    { id: 2, label: "Payment" },
    { id: 3, label: "Confirmation" },
    { id: 4, label: "Access Granted" }
  ];

  // Calculate progress percentage for the bar
  // It goes from 0% to 100% based on the steps
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-12 px-4">
      
      {/* Progress Bar (Top) */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-blue to-primary-green transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Steps Container */}
      <div className="flex justify-between">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative w-1/4">
              
              {/* Step Circle */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg z-10 transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white shadow-lg scale-110' 
                  : isCompleted 
                    ? 'bg-primary-green text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {isCompleted ? (
                  <i className="fas fa-check text-white"></i>
                ) : (
                  step.id
                )}
              </div>

              {/* Step Label */}
              <span className={`
                text-sm font-semibold mt-2 transition-colors duration-300 text-center
                ${isActive ? 'text-primary-blue' : 'text-gray-500'}
              `}>
                {step.label}
              </span>

            </div>
          );
        })}
      </div>
    </div>
  );
}