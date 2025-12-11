import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Upload, Sparkles, Download, Sliders, Eye } from 'lucide-react';
import { Button } from './Button';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector or area name
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Skin Retoucher AI',
    description: 'Let us show you around! This quick tour will help you get started with professional skin retouching in seconds.',
    icon: <Sparkles className="text-[#dfff00]" size={32} />,
  },
  {
    id: 'upload',
    title: 'Upload Your Image',
    description: 'Click the + button on the left side or tap the upload area to add your portrait. You can upload single images or multiple for batch processing.',
    icon: <Upload className="text-[#dfff00]" size={32} />,
  },
  {
    id: 'styles',
    title: 'Choose Your Style',
    description: 'Select from 5 professional retouching styles in the sidebar: Natural Pro, Soft Beauty, Sculpted Glow, Skin-First Portrait, or Minimalist Clean-Up.',
    icon: <Sliders className="text-[#dfff00]" size={32} />,
  },
  {
    id: 'resolution',
    title: 'Select Output Resolution',
    description: 'Choose your output quality: 1K, 2K, or 4K. Higher resolution means more detail but longer processing time.',
    icon: <Eye className="text-[#dfff00]" size={32} />,
  },
  {
    id: 'download',
    title: 'Download Your Result',
    description: 'Once processed, use the download button to save your retouched image. Toggle Compare mode to see before/after differences.',
    icon: <Download className="text-[#dfff00]" size={32} />,
  },
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNeverShowAgain: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, onNeverShowAgain }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleNeverShow = () => {
    onNeverShowAgain();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Progress Dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {TUTORIAL_STEPS.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-[#dfff00] w-6' 
                  : index < currentStep 
                    ? 'bg-[#dfff00]/50' 
                    : 'bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 pt-14">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#dfff00]/10 rounded-2xl flex items-center justify-center border border-[#dfff00]/20">
              {step.icon}
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-neutral-400 leading-relaxed">{step.description}</p>
          </div>

          {/* Step Counter */}
          <div className="text-center mb-6">
            <span className="text-xs text-neutral-500 font-medium">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 rounded-xl font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            
            <Button
              onClick={handleNext}
              className={`${isFirstStep ? 'w-full' : 'flex-1'}`}
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight size={18} />}
            </Button>
          </div>

          {/* Skip / Don't Show Again */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {isFirstStep && (
              <button
                onClick={handleSkip}
                className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={handleNeverShow}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Don't show this again
            </button>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="border-t border-white/5 bg-[#0a0a0a] py-3 px-6">
          <p className="text-center text-xs text-neutral-600">
            Proudly Developed By <span className="text-[#dfff00]/70 font-medium">Deepmind</span>
          </p>
        </div>
      </div>
    </div>
  );
};
