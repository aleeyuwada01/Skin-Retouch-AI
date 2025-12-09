import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ComparisonSliderProps {
  original: string;
  processed: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, processed, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden rounded-lg group ${className}`}
    >
      {/* Background Image (Original - Right Side) */}
      <img 
        src={original} 
        alt="Original" 
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none select-none" 
      />
      
      {/* Label for Original */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-white/90 uppercase pointer-events-none z-10 shadow-lg">
        Original
      </div>

      {/* Foreground Image (Processed - Left Side) - Clipped */}
      <div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={processed} 
          alt="Processed" 
          className="absolute top-0 left-0 w-full h-full object-contain" 
        />
         <div className="absolute top-4 left-4 bg-[#dfff00] text-black border border-[#dfff00] px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase pointer-events-none z-10 shadow-lg">
          Retouched
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex items-center justify-center text-black hover:scale-110 transition-transform duration-200">
           <div className="flex gap-[1px]">
             <ChevronLeft size={12} strokeWidth={3} />
             <ChevronRight size={12} strokeWidth={3} />
           </div>
        </div>
      </div>
    </div>
  );
};