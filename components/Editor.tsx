import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Trash2, 
  Heart, 
  FolderPlus, 
  Plus, 
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  Menu,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ComparisonSlider } from './ComparisonSlider';
import { TipsModal } from './TipsModal';
import { FolderModal } from './FolderModal';
import { EnhanceStyle, HistoryItem, ProcessingState, BatchItem } from '../types';
import { geminiService } from '../services/geminiService';

interface EditorProps {
  onBack: () => void;
}

const ComparisonSliderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M12 3v18" />
  </svg>
);

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, className = '', ...props }) => (
  <button 
    className={`w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors ${className}`}
    {...props}
  >
    {icon}
  </button>
);

const MAX_DAILY_CREDITS = 5;

export const Editor: React.FC<EditorProps> = ({ onBack }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<EnhanceStyle>(EnhanceStyle.Natural);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number>(MAX_DAILY_CREDITS);
  
  // Batch State
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);

  // Loading state management
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle', error: null });
  
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Load Credits from LocalStorage on mount
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const storedDate = localStorage.getItem('skinRetoucher_date');
    const storedCount = localStorage.getItem('skinRetoucher_count');

    if (storedDate === today && storedCount) {
       setRemainingCredits(Math.max(0, MAX_DAILY_CREDITS - parseInt(storedCount, 10)));
    } else {
       // Reset if new day
       localStorage.setItem('skinRetoucher_date', today);
       localStorage.setItem('skinRetoucher_count', '0');
       setRemainingCredits(MAX_DAILY_CREDITS);
    }
  }, []);

  const updateCredits = () => {
    const today = new Date().toLocaleDateString();
    const currentCount = parseInt(localStorage.getItem('skinRetoucher_count') || '0', 10);
    const newCount = currentCount + 1;
    
    localStorage.setItem('skinRetoucher_date', today);
    localStorage.setItem('skinRetoucher_count', newCount.toString());
    setRemainingCredits(Math.max(0, MAX_DAILY_CREDITS - newCount));
  };

  // Validation Logic
  const isCustomStyle = selectedStyle === EnhanceStyle.Custom;
  const isPromptValid = !isCustomStyle || customPrompt.trim().length > 0;
  const isBatchMode = batchQueue.length > 1;

  // --- Zoom Logic ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       if (e.deltaY < 0) handleZoomIn();
       else handleZoomOut();
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Reset states
    setProcessingState({ status: 'idle', error: null });
    setQualityWarning(null);
    setZoom(1);
    
    // Batch Handling
    if (files.length > 1) {
      const newQueue: BatchItem[] = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending'
      }));
      setBatchQueue(newQueue);
      setActiveBatchIndex(0);
      
      // Load first image
      const firstFile = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
         setOriginalImage(e.target?.result as string);
         setProcessedImage(null);
      };
      reader.readAsDataURL(firstFile);
      return;
    }

    // Single File Handling
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setProcessingState({ status: 'error', error: "Please upload a valid image file." });
      return;
    }

    setBatchQueue([]); // Clear batch if single file upload

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        setOriginalImage(result);
        setProcessedImage(null);
        
        if (img.width < 1000 || img.height < 1000) {
          setQualityWarning("Low resolution image detected. For professional retouching results, please use images at least 1000x1000 pixels.");
        } else {
          setQualityWarning(null);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const processSingleImage = async (imgBase64: string): Promise<string> => {
     return await geminiService.enhanceImage(imgBase64, selectedStyle, customPrompt);
  };

  const handleEnhance = async () => {
    if ((!originalImage && batchQueue.length === 0) || !isPromptValid || remainingCredits <= 0) return;

    setIsSidebarOpen(false);

    // --- Batch Processing Logic ---
    if (isBatchMode) {
       setProcessingState({ status: 'processing', error: null });
       
       for (let i = 0; i < batchQueue.length; i++) {
          if (remainingCredits <= 0) break; // Stop if out of credits

          // Update Status to Processing
          setBatchQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));
          setActiveBatchIndex(i);

          // Convert file to base64
          const file = batchQueue[i].file;
          const base64 = await new Promise<string>((resolve) => {
             const reader = new FileReader();
             reader.onload = (e) => resolve(e.target?.result as string);
             reader.readAsDataURL(file);
          });
          setOriginalImage(base64); // Show current processing image
          setProcessedImage(null);

          try {
             // Artificial Delay for UI
             await new Promise(r => setTimeout(r, 1000));
             
             const result = await processSingleImage(base64);
             setProcessedImage(result);
             
             // Update Success Status
             setBatchQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'completed', processedUrl: result } : item));
             
             // Save to History
             const newItem: HistoryItem = {
               id: Date.now().toString(),
               original: base64,
               processed: result,
               style: selectedStyle,
               timestamp: Date.now()
             };
             setHistory(prev => [newItem, ...prev].slice(0, 5));
             
             updateCredits();

          } catch (error) {
             console.error(error);
             setBatchQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
          }
       }
       setProcessingState({ status: 'complete', error: null });
       return;
    }

    // --- Single Image Processing Logic ---
    setProcessingState({ status: 'queue', error: null });
    setTimeout(async () => {
      setProcessingState({ status: 'processing', error: null });
      
      try {
        const result = await processSingleImage(originalImage!);
        setProcessedImage(result);
        setProcessingState({ status: 'complete', error: null });
        
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          original: originalImage!,
          processed: result,
          style: selectedStyle,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev].slice(0, 5));
        
        updateCredits();

      } catch (err: any) {
        console.error(err);
        setProcessingState({ 
          status: 'error', 
          error: err.message || "Failed to process image." 
        });
      }
    }, 1500);
  };

  const handleDownload = () => {
    if (processedImage || originalImage) {
      const link = document.createElement('a');
      link.href = processedImage || originalImage!;
      link.download = `skin-retoucher-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setOriginalImage(item.original);
    setProcessedImage(item.processed);
    setSelectedStyle(item.style);
    setProcessingState({ status: 'complete', error: null });
    setBatchQueue([]); // Clear batch mode if loading from history
  };

  const loadFromBatch = (item: BatchItem, index: number) => {
     // Create a file reader to load the original file blob
     const reader = new FileReader();
     reader.onload = (e) => {
       setOriginalImage(e.target?.result as string);
       setProcessedImage(item.processedUrl || null);
       setActiveBatchIndex(index);
     };
     reader.readAsDataURL(item.file);
  };

  const clearCanvas = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setQualityWarning(null);
    setProcessingState({ status: 'idle', error: null });
    setBatchQueue([]);
    setZoom(1);
  };

  const currentHistoryItem = originalImage && processedImage ? {
      id: Date.now().toString(),
      original: originalImage,
      processed: processedImage,
      style: selectedStyle,
      timestamp: Date.now()
  } : null;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-black text-white overflow-hidden font-sans">
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative flex flex-col bg-black w-full h-full">
        
        {/* Breadcrumb Header */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-10 pointer-events-none flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium pointer-events-auto bg-black/50 backdrop-blur-md p-2 rounded-lg md:bg-transparent md:p-0 md:backdrop-blur-none">
            <button 
              onClick={onBack}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Home
            </button>
            <span className="text-neutral-600">/</span>
            <span className="text-white">Skin Retoucher</span>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden pointer-events-auto p-2 bg-[#161616] rounded-lg border border-white/10 text-white"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center Canvas */}
        <div 
          className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#0a0a0a]"
          onWheel={handleWheel}
        >
           {!originalImage && (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-neutral-800 rounded-3xl cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/50 transition-all group max-w-sm text-center"
             >
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus size={24} className="text-neutral-400" />
                </div>
                <p className="text-neutral-400 font-medium">Tap to upload image(s)</p>
                <span className="text-xs text-neutral-500 mt-2">Supports JPG, PNG, WEBP</span>
             </div>
           )}

           {originalImage && (
             <div 
                ref={imageContainerRef}
                className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
                style={{ 
                   transform: `scale(${zoom})`,
                   overflow: zoom > 1 ? 'auto' : 'visible'
                }}
             >
               <div className="relative rounded-lg overflow-hidden shadow-2xl max-h-full max-w-full w-auto h-auto">
                  {processedImage && isCompareMode ? (
                    <ComparisonSlider original={originalImage} processed={processedImage} className="max-h-[65vh] md:max-h-[85vh]" />
                  ) : (
                    <img 
                      src={processedImage || originalImage} 
                      alt="Display" 
                      className={`max-h-[65vh] md:max-h-[85vh] object-contain ${processingState.status === 'processing' || processingState.status === 'queue' ? 'opacity-50 grayscale-[0.5]' : ''} transition-all duration-500`}
                    />
                  )}
               </div>
             </div>
           )}

           {/* Alerts & Loaders */}
           {qualityWarning && originalImage && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-yellow-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-700/50 shadow-xl z-20 w-max max-w-[90%]">
               <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
               <span className="text-xs font-medium text-yellow-100 truncate">{qualityWarning}</span>
               <button onClick={() => setQualityWarning(null)} className="ml-2 hover:bg-yellow-800/50 p-1 rounded-full"><div className="text-[10px] uppercase font-bold text-yellow-400">Dismiss</div></button>
             </div>
           )}

           {(processingState.status === 'queue' || processingState.status === 'processing') && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 bg-[#222]/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl z-20 border border-white/5 whitespace-nowrap">
               <Loader2 className="animate-spin text-[#dfff00]" size={18} />
               <span className="text-sm font-medium text-neutral-200">
                 {isBatchMode ? `Processing Batch...` : 'Processing...'}
               </span>
             </div>
           )}

           {processingState.error && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl z-20 border border-red-500/20 flex flex-col items-center">
               <span className="text-red-200 font-medium mb-2">Error</span>
               <span className="text-red-100 text-sm text-center max-w-xs">{processingState.error}</span>
               <button onClick={() => setProcessingState({status: 'idle', error: null})} className="mt-4 text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg text-white">Dismiss</button>
             </div>
           )}
        </div>

        {/* Floating Controls Layer */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* New Image */}
          <div className="absolute left-4 top-20 md:top-1/2 md:-translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
             <div className="bg-[#1a1a1a] p-2 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-xl">
               <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#222] hover:bg-[#333] flex items-center justify-center transition-colors text-neutral-400 hover:text-white" title="New Image">
                 <Plus size={20} />
               </button>
               {originalImage && (
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border-2 border-[#dfff00] relative">
                    <img src={originalImage} className="w-full h-full object-cover" alt="Thumbnail" />
                 </div>
               )}
             </div>
          </div>

          {/* Bottom Strip: History OR Batch Queue */}
          {(history.length > 0 || isBatchMode) && (
             <div className="absolute bottom-6 left-0 right-0 pointer-events-auto flex justify-center z-10 px-4">
                <div className="bg-[#1a1a1a]/90 backdrop-blur rounded-2xl border border-white/5 shadow-2xl p-2 flex gap-2 overflow-x-auto max-w-full no-scrollbar">
                   {isBatchMode ? (
                      // Batch Queue View
                      batchQueue.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => loadFromBatch(item, index)}
                          className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                             activeBatchIndex === index ? 'border-[#dfff00]' : 'border-transparent hover:border-white/20'
                          }`}
                        >
                           <img src={item.previewUrl} className="w-full h-full object-cover" alt="Batch Item" />
                           {/* Status Overlays */}
                           {item.status === 'processing' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-white" /></div>}
                           {item.status === 'completed' && <div className="absolute bottom-0 right-0 p-0.5"><CheckCircle className="w-3 h-3 text-[#dfff00] fill-black" /></div>}
                           {item.status === 'error' && <div className="absolute bottom-0 right-0 p-0.5"><XCircle className="w-3 h-3 text-red-500 fill-black" /></div>}
                        </button>
                      ))
                   ) : (
                      // Standard History View
                      history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => loadFromHistory(item)}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                             processedImage === item.processed ? 'border-[#dfff00]' : 'border-transparent hover:border-white/20'
                          }`}
                        >
                           <img src={item.processed} className="w-full h-full object-cover" alt="History" />
                        </button>
                      ))
                   )}
                </div>
             </div>
          )}

          {/* Controls Group */}
          {originalImage && (
            <>
              {/* Compare Toggle */}
              <div className="absolute bottom-24 md:bottom-6 left-4 md:left-6 pointer-events-auto">
                <div className="bg-[#1a1a1a] px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-2 md:gap-3">
                  <ComparisonSliderIcon />
                  <span className="text-xs md:text-sm font-medium text-neutral-300 hidden md:inline">Compare</span>
                  <button 
                    onClick={() => setIsCompareMode(!isCompareMode)}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isCompareMode ? 'bg-[#2ea043]' : 'bg-neutral-600'}`}
                  >
                    <div className={`absolute top-1 bottom-1 w-3 bg-white rounded-full transition-all duration-200 ${isCompareMode ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              {/* Tools Right */}
              <div className="absolute bottom-24 md:bottom-6 right-4 md:right-6 pointer-events-auto flex items-center gap-2">
                 <div className="bg-[#1a1a1a] p-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-1">
                   <ToolButton icon={<Download size={16} />} onClick={handleDownload} title="Download" />
                   <ToolButton icon={<Heart size={16} />} title="Save to Favorites" />
                   <ToolButton icon={<FolderPlus size={16} />} onClick={() => setIsFolderModalOpen(true)} title="Add to Folder" />
                   <ToolButton icon={<Trash2 size={16} />} onClick={clearCanvas} title="Clear" />
                 </div>
                 
                 {/* Enhanced Zoom Control */}
                 <div className="bg-[#1a1a1a] p-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-1 relative group">
                   <button 
                     onClick={() => setShowZoomControls(!showZoomControls)}
                     className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-lg text-xs font-bold text-[#3b82f6]"
                   >
                     <ZoomIn size={14} />
                     <span>{Math.round(zoom * 100)}%</span>
                   </button>

                   {/* Zoom Popup Control */}
                   {showZoomControls && (
                     <div className="absolute bottom-full right-0 mb-2 p-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <ToolButton icon={<Plus size={14} />} onClick={handleZoomIn} />
                        <ToolButton icon={<RotateCcw size={14} />} onClick={handleZoomReset} title="Reset" />
                        <ToolButton icon={<div className="h-0.5 w-3 bg-current"></div>} onClick={handleZoomOut} />
                     </div>
                   )}
                 </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedStyle={selectedStyle}
        onStyleSelect={setSelectedStyle}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        onEnhance={handleEnhance}
        isProcessing={processingState.status === 'processing' || processingState.status === 'queue'}
        onOpenTips={() => setIsTipsOpen(true)}
        hasImage={!!originalImage}
        canEnhance={isPromptValid}
        remainingCredits={remainingCredits}
        batchCount={batchQueue.length}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
        multiple
      />

      <TipsModal isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
      
      <FolderModal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
        currentItem={currentHistoryItem}
      />
    </div>
  );
};