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
  XCircle,
  RefreshCw,
  ImageIcon
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ComparisonSlider } from './ComparisonSlider';
import { TipsModal } from './TipsModal';
import { FolderModal } from './FolderModal';
import { TutorialOverlay } from './TutorialOverlay';
import { BackgroundModal } from './BackgroundModal';
import { EnhanceStyle, HistoryItem, ProcessingState, BatchItem } from '../types';
import { geminiService } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { STYLES } from '../constants';
import { AuthState } from '../App';

interface EditorProps {
  onBack: () => void;
  authState: AuthState;
  onRefreshProfile: () => void;
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

export const Editor: React.FC<EditorProps> = ({ onBack, authState, onRefreshProfile }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<EnhanceStyle>(EnhanceStyle.Sculpted);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  
  // Credits from Supabase profile
  const remainingCredits = authState.profile?.credits ?? 0;
  
  // Batch State
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Resolution State
  const [selectedResolution, setSelectedResolution] = useState<'1K' | '2K' | '4K'>('4K');
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);

  // Loading state management
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle', error: null });
  
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Redeem Code Modal State
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // Background Changer State
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isChangingBackground, setIsChangingBackground] = useState(false);
  
  // Credit costs state
  const [creditCosts, setCreditCosts] = useState({
    retouch_cost_4k: 2,
    retouch_cost_2k: 1,
    retouch_cost_1k: 1,
    background_cost: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);



  // Load credit costs on mount
  useEffect(() => {
    const loadCreditCosts = async () => {
      try {
        const settings = await supabaseService.getAppSettings();
        setCreditCosts({
          retouch_cost_4k: settings.retouch_cost_4k,
          retouch_cost_2k: settings.retouch_cost_2k,
          retouch_cost_1k: settings.retouch_cost_1k,
          background_cost: settings.background_cost
        });
      } catch (error) {
        console.error('Failed to load credit costs:', error);
      }
    };
    loadCreditCosts();
  }, []);

  // Get current retouch cost based on resolution
  const currentRetouchCost = selectedResolution === '4K' 
    ? creditCosts.retouch_cost_4k 
    : selectedResolution === '2K' 
      ? creditCosts.retouch_cost_2k 
      : creditCosts.retouch_cost_1k;

  // Tutorial logic - show only for new users, max 3 times
  useEffect(() => {
    const tutorialDisabled = localStorage.getItem('skinRetoucher_tutorialDisabled');
    const tutorialShownCount = parseInt(localStorage.getItem('skinRetoucher_tutorialShownCount') || '0', 10);
    
    if (tutorialDisabled !== 'true' && tutorialShownCount < 3) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
        localStorage.setItem('skinRetoucher_tutorialShownCount', (tutorialShownCount + 1).toString());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTutorialNeverShowAgain = () => {
    localStorage.setItem('skinRetoucher_tutorialDisabled', 'true');
  };

  const useCredits = async (style: string, resolution: string, amount: number) => {
    if (!authState.user) return false;
    try {
      const success = await supabaseService.useCredits(authState.user.id, amount, style, resolution);
      if (success) {
        onRefreshProfile(); // Refresh profile to get updated credits
      }
      return success;
    } catch (error) {
      console.error('Failed to use credits:', error);
      return false;
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    
    setIsRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    
    try {
      const result = await supabaseService.redeemCreditCode(redeemCode.trim());
      if (result.success) {
        setRedeemSuccess(`Successfully added ${result.credits} credits!`);
        setRedeemCode('');
        onRefreshProfile(); // Refresh to show new credits
        // Auto close after 2 seconds
        setTimeout(() => {
          setIsRedeemModalOpen(false);
          setRedeemSuccess(null);
        }, 2000);
      } else {
        setRedeemError(result.error || 'Failed to redeem code');
      }
    } catch (error: any) {
      setRedeemError(error.message || 'Failed to redeem code');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Validation Logic
  const isCustomStyle = selectedStyle === EnhanceStyle.Custom;
  const isPromptValid = !isCustomStyle || customPrompt.trim().length > 0;
  const isBatchMode = batchQueue.length > 1;

  // --- Zoom & Pan Logic ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       if (e.deltaY < 0) handleZoomIn();
       else handleZoomOut();
    }
  }, []);

  // Pan handlers - disabled in compare mode to allow slider interaction
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't pan in compare mode - let the slider work
    if (zoom > 1 && !isCompareMode) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoom, panPosition, isCompareMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && zoom > 1 && !isCompareMode) {
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      
      // Limit pan to reasonable bounds based on zoom level
      const maxPan = (zoom - 1) * 300;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      });
    }
  }, [isPanning, zoom, panStart, isCompareMode]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  });

  // Touch handlers for mobile pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1 && !isCompareMode && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
    }
  }, [zoom, panPosition, isCompareMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && zoom > 1 && !isCompareMode && e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - panStart.x;
      const newY = touch.clientY - panStart.y;
      
      const maxPan = (zoom - 1) * 300;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      });
    }
  }, [isPanning, zoom, panStart, isCompareMode]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset pan when zoom resets to 1
  useEffect(() => {
    if (zoom <= 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Save current work to history before loading new image
    if (originalImage && processedImage) {
      const currentItem: HistoryItem = {
        id: Date.now().toString(),
        original: originalImage,
        processed: processedImage,
        style: selectedStyle,
        timestamp: Date.now()
      };
      // Add to history if not already there
      setHistory(prev => {
        const exists = prev.some(item => item.processed === processedImage);
        if (!exists) {
          return [currentItem, ...prev].slice(0, 10); // Keep up to 10 items
        }
        return prev;
      });
    }

    // Reset states for new image
    setProcessingState({ status: 'idle', error: null });
    setQualityWarning(null);
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
    setIsCompareMode(false);
    
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
    
    // Reset file input so same file can be selected again
    event.target.value = '';
  };

  const processSingleImage = async (imgBase64: string): Promise<string> => {
     return await geminiService.enhanceImage(imgBase64, selectedStyle, customPrompt, selectedResolution);
  };

  const handleReEnhance = async () => {
    if (!processedImage || remainingCredits <= 0 || !authState.user) return;
    
    setProcessingState({ status: 'queue', error: null });
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
    
    setProcessingState({ status: 'processing', error: null });
    
    try {
      const result = await geminiService.reEnhanceImage(processedImage, selectedResolution);
      
      // Keep the original for comparison, update processed
      setProcessedImage(result);
      setProcessingState({ status: 'complete', error: null });
      
      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        original: originalImage!,
        processed: result,
        style: selectedStyle,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 5));
      
      // Use credits via Supabase
      await useCredits('smooth_more', selectedResolution, currentRetouchCost);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message?.includes("No candidates") 
        ? "Unable to process. Please try again or use a different image."
        : err.message || "Failed to re-enhance image.";
      setProcessingState({ 
        status: 'error', 
        error: errorMsg
      });
    }
  };

  const handleChangeBackground = async (backgroundPath: string) => {
    if (!processedImage || remainingCredits <= 0 || !authState.user) return;
    
    setIsChangingBackground(true);
    
    try {
      // Fetch the background image and convert to base64
      const response = await fetch(backgroundPath);
      const blob = await response.blob();
      const backgroundBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(blob);
      });
      
      // Call Gemini to replace background
      const result = await geminiService.replaceBackground(
        processedImage,
        backgroundBase64,
        selectedResolution
      );
      
      // Update the processed image with new background
      setProcessedImage(result);
      setIsBackgroundModalOpen(false);
      
      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        original: originalImage!,
        processed: result,
        style: selectedStyle,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 5));
      
      // Use credits via Supabase
      await useCredits('background_change', selectedResolution, creditCosts.background_cost);
      
    } catch (err: any) {
      console.error('Background change failed:', err);
      alert(err.message || 'Failed to change background. Please try again.');
    } finally {
      setIsChangingBackground(false);
    }
  };

  const handleEnhance = async () => {
    if ((!originalImage && batchQueue.length === 0) || !isPromptValid || remainingCredits <= 0 || !authState.user) return;

    setIsSidebarOpen(false);

    // --- Batch Processing Logic ---
    if (isBatchMode) {
       setProcessingState({ status: 'processing', error: null });
       
       for (let i = 0; i < batchQueue.length; i++) {
          // Check credits before each batch item
          const currentCredits = authState.profile?.credits ?? 0;
          if (currentCredits <= 0) break;

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
             
             // Use credits via Supabase
             await useCredits(selectedStyle, selectedResolution, currentRetouchCost);

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
        
        // Use credits and save images to Supabase
        await useCredits(selectedStyle, selectedResolution, currentRetouchCost);
        
        // Save images to Supabase storage (async, don't block UI)
        if (authState.user) {
          supabaseService.saveRetouchWithImages(
            authState.user.id,
            selectedStyle,
            selectedResolution,
            originalImage!,
            result
          ).catch(err => console.error('Failed to save images:', err));
        }

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
    const imageToDownload = processedImage || originalImage;
    if (!imageToDownload) return;
    
    try {
      // Convert base64 to blob for reliable download
      const base64Data = imageToDownload.split(',')[1];
      const mimeType = imageToDownload.split(';')[0].split(':')[1] || 'image/jpeg';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `skin-retoucher-4k-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = imageToDownload;
      link.download = `skin-retoucher-4k-${Date.now()}.jpg`;
      link.click();
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
                className={`relative w-full h-full flex items-center justify-center transition-transform ease-out select-none ${
                  zoom > 1 && !isCompareMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                } ${isPanning ? '' : 'duration-200'}`}
                style={{ 
                   transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
             >
               <div className="relative rounded-lg overflow-hidden shadow-2xl max-h-[65vh] md:max-h-[85vh] w-full h-full flex items-center justify-center">
                  {processedImage && isCompareMode ? (
                    <div className="relative w-full h-full" style={{ aspectRatio: 'auto' }}>
                      {/* Hidden image to establish dimensions */}
                      <img 
                        src={originalImage} 
                        alt="" 
                        className="invisible max-h-[65vh] md:max-h-[85vh] object-contain"
                      />
                      <div className="absolute inset-0">
                        <ComparisonSlider original={originalImage} processed={processedImage} className="w-full h-full" />
                      </div>
                    </div>
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
        <div className="absolute inset-0 pointer-events-none z-30">
          
          {/* New Image */}
          <div className="absolute left-4 top-20 md:top-1/2 md:-translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
             <div className="bg-[#1a1a1a] p-2 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-xl">
               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#222] hover:bg-[#333] flex items-center justify-center transition-colors text-neutral-400 hover:text-white" 
                 title="New Image"
                 data-tutorial="upload-button"
               >
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
                      history.map((item) => {
                        const styleConfig = STYLES.find(s => s.id === item.style);
                        const styleLabel = styleConfig?.label || 'Custom';
                        return (
                          <div key={item.id} className="relative group shrink-0">
                            <button
                              onClick={() => loadFromHistory(item)}
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                 processedImage === item.processed ? 'border-[#dfff00]' : 'border-transparent hover:border-white/20'
                              }`}
                              title={styleLabel}
                            >
                               <img src={item.processed} className="w-full h-full object-cover" alt={styleLabel} />
                            </button>
                            {/* Style label tooltip on hover */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {styleLabel}
                            </div>
                          </div>
                        );
                      })
                   )}
                </div>
             </div>
          )}

          {/* Controls Group */}
          {originalImage && (
            <>
              {/* Compare Toggle */}
              <div className="absolute bottom-24 md:bottom-6 left-4 md:left-6 pointer-events-auto z-40">
                <div className="bg-[#1a1a1a] px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-2 md:gap-3" data-tutorial="compare-toggle">
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
              <div className="absolute bottom-24 md:bottom-6 right-4 md:right-6 pointer-events-auto z-40 flex items-center gap-2">
                 <div className="bg-[#1a1a1a] p-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-1" data-tutorial="tools-group">
                   <ToolButton icon={<Download size={16} />} onClick={handleDownload} title="Download" />
                   <ToolButton icon={<Heart size={16} />} title="Save to Favorites" />
                   <ToolButton icon={<FolderPlus size={16} />} onClick={() => setIsFolderModalOpen(true)} title="Add to Folder" />
                   <ToolButton icon={<Trash2 size={16} />} onClick={clearCanvas} title="Clear" />
                 </div>
                 
                 {/* Re-enhance / Smooth More Button */}
                 {processedImage && processingState.status === 'complete' && remainingCredits > 0 && (
                   <button
                     onClick={handleReEnhance}
                     className="bg-[#1a1a1a] px-3 py-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-2 hover:bg-[#252525] transition-colors group"
                     title="Smooth skin further"
                     data-tutorial="smooth-more"
                   >
                     <RefreshCw size={14} className="text-[#dfff00] group-hover:rotate-180 transition-transform duration-300" />
                     <span className="text-xs font-medium text-neutral-300">Smooth More</span>
                   </button>
                 )}
                 
                 {/* Change Background Button */}
                 {processedImage && processingState.status === 'complete' && remainingCredits >= creditCosts.background_cost && (
                   <button
                     onClick={() => setIsBackgroundModalOpen(true)}
                     className="bg-[#1a1a1a] px-3 py-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-2 hover:bg-[#252525] transition-colors group"
                     title="Change background"
                   >
                     <ImageIcon size={14} className="text-[#3b82f6]" />
                     <span className="text-xs font-medium text-neutral-300">Change BG ({creditCosts.background_cost})</span>
                   </button>
                 )}
                 
                 {/* Resolution Selector */}
                 <div className="bg-[#1a1a1a] p-1.5 rounded-xl border border-white/5 shadow-xl flex items-center gap-1 relative" data-tutorial="resolution-selector">
                   <button 
                     onClick={() => setShowResolutionMenu(!showResolutionMenu)}
                     className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-lg text-xs font-bold text-[#dfff00]"
                   >
                     <span>{selectedResolution}</span>
                   </button>

                   {/* Resolution Popup Menu */}
                   {showResolutionMenu && (
                     <div className="absolute bottom-full right-0 mb-2 p-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 min-w-[60px]">
                        {(['1K', '2K', '4K'] as const).map((res) => (
                          <button
                            key={res}
                            onClick={() => { setSelectedResolution(res); setShowResolutionMenu(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              selectedResolution === res 
                                ? 'bg-[#dfff00] text-black' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                     </div>
                   )}
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
        onTopUp={() => setIsRedeemModalOpen(true)}
        creditCost={currentRetouchCost}
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

      <TutorialOverlay 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)}
        onNeverShowAgain={handleTutorialNeverShowAgain}
      />

      {/* Redeem Code Modal */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-2 text-white">Redeem Credit Code</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Enter your access code to add credits to your account.
            </p>
            
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., ABC12345)"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white text-center text-lg tracking-widest font-mono uppercase placeholder-neutral-600 focus:outline-none focus:border-[#dfff00]"
              maxLength={8}
              autoFocus
            />

            {redeemError && (
              <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-200 text-sm text-center">
                {redeemError}
              </div>
            )}

            {redeemSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-900/50 text-green-200 text-sm text-center">
                {redeemSuccess}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsRedeemModalOpen(false);
                  setRedeemCode('');
                  setRedeemError(null);
                  setRedeemSuccess(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-400 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemCode}
                disabled={isRedeeming || !redeemCode.trim()}
                className="flex-1 py-3 rounded-xl bg-[#dfff00] text-black font-bold hover:bg-[#ccff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRedeeming ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Redeem'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Changer Modal */}
      <BackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        onSelectBackground={handleChangeBackground}
        isProcessing={isChangingBackground}
        remainingCredits={remainingCredits}
        creditCost={creditCosts.background_cost}
      />
    </div>
  );
};