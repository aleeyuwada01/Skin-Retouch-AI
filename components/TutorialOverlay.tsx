import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  fallbackPosition?: { top: number; left: number };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'upload',
    title: 'Upload Your Image',
    description: 'Click here to add your portrait photo. You can upload single images or multiple for batch processing.',
    targetSelector: '[data-tutorial="upload-button"]',
    position: 'right',
    fallbackPosition: { top: 50, left: 80 }
  },
  {
    id: 'styles',
    title: 'Choose Your Style',
    description: 'Select from 5 professional retouching styles: Natural Pro, Soft Beauty, Sculpted Glow, and more.',
    targetSelector: '[data-tutorial="style-list"]',
    position: 'left',
    fallbackPosition: { top: 40, left: 70 }
  },
  {
    id: 'enhance',
    title: 'Start Retouching',
    description: "Once you've uploaded an image and selected a style, click here to process your photo.",
    targetSelector: '[data-tutorial="enhance-button"]',
    position: 'left',
    fallbackPosition: { top: 80, left: 70 }
  },
  {
    id: 'resolution',
    title: 'Select Output Quality',
    description: 'Choose your output resolution: 1K, 2K, or 4K. Higher resolution means more detail.',
    targetSelector: '[data-tutorial="resolution-selector"]',
    position: 'left',
    fallbackPosition: { top: 85, left: 70 }
  },
  {
    id: 'compare',
    title: 'Compare Results',
    description: 'Toggle Compare mode to see before/after differences with an interactive slider.',
    targetSelector: '[data-tutorial="compare-toggle"]',
    position: 'right',
    fallbackPosition: { top: 85, left: 20 }
  },
  {
    id: 'download',
    title: 'Download Your Result',
    description: 'Save your retouched image. You can also add to favorites or organize into folders.',
    targetSelector: '[data-tutorial="tools-group"]',
    position: 'left',
    fallbackPosition: { top: 85, left: 60 }
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNeverShowAgain: () => void;
}

export function TutorialOverlay({ isOpen, onClose, onNeverShowAgain }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return;

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      const padding = 16;
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      
      let top = 0;
      let left = 0;
      
      switch (step.position) {
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          break;
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
      }
      
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      
      setTooltipStyle({ top, left, width: tooltipWidth });
    } else {
      setTargetRect(null);
      if (step.fallbackPosition) {
        setTooltipStyle({
          top: `${step.fallbackPosition.top}%`,
          left: `${step.fallbackPosition.left}%`,
          transform: 'translate(-50%, -50%)',
          width: 320
        });
      }
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    return () => window.removeEventListener('resize', updateTargetPosition);
  }, [updateTargetPosition, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(updateTargetPosition, 100);
    return () => clearInterval(interval);
  }, [isOpen, updateTargetPosition]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep((prev: number) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleNeverShow = () => {
    onNeverShowAgain();
    onClose();
  };

  const getClipPath = () => {
    if (!targetRect) return 'none';
    
    const padding = 8;
    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;
    const r = 12;
    
    return `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${x}px ${y + r}px, ${x}px ${y + h - r}px, ${x + r}px ${y + h}px, ${x + w - r}px ${y + h}px, ${x + w}px ${y + h - r}px, ${x + w}px ${y + r}px, ${x + w - r}px ${y}px, ${x + r}px ${y}px, ${x}px ${y + r}px)`;
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto">
      <div 
        className="absolute inset-0 bg-black/50 transition-all duration-300"
        style={{ clipPath: targetRect ? getClipPath() : 'none' }}
        onClick={handleSkip}
      />
      
      {targetRect && (
        <div 
          className="absolute border-2 border-[#dfff00] rounded-xl pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 4px rgba(223, 255, 0, 0.2), 0 0 30px rgba(223, 255, 0, 0.3)'
          }}
        />
      )}

      <div 
        className="absolute bg-[#111] border border-neutral-700 rounded-2xl shadow-2xl p-5"
        style={tooltipStyle}
      >
        <button 
          onClick={handleSkip}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex gap-1.5 mb-4">
          {TUTORIAL_STEPS.map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-[#dfff00] w-6' 
                  : index < currentStep 
                    ? 'bg-[#dfff00]/50 w-1.5' 
                    : 'bg-neutral-700 w-1.5'
              }`}
            />
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-[#dfff00]" size={16} />
            <h3 className="text-white font-semibold text-base">{step.title}</h3>
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">{step.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">
              {currentStep + 1}/{TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#dfff00] hover:bg-[#c8e600] text-black transition-colors flex items-center gap-1"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight size={14} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleNeverShow}
          className="mt-3 text-xs text-neutral-600 hover:text-neutral-400 transition-colors w-full text-center"
        >
          Don't show this again
        </button>
      </div>
    </div>
  );
}
