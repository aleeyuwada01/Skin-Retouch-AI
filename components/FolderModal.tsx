import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Save, Folder } from 'lucide-react';
import { Button } from './Button';
import { Folder as FolderType, HistoryItem } from '../types';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: HistoryItem | null;
}

export const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, currentItem }) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedFolders = localStorage.getItem('sr_folders');
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      }
    }
  }, [isOpen]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FolderType = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      items: [],
      createdAt: Date.now()
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('sr_folders', JSON.stringify(updatedFolders));
    setNewFolderName('');
    setSelectedFolderId(newFolder.id);
  };

  const handleSaveToFolder = () => {
    if (!selectedFolderId || !currentItem) return;

    const updatedFolders = folders.map(folder => {
      if (folder.id === selectedFolderId) {
        // Check if item already exists in folder to avoid duplicates (optional)
        const exists = folder.items.some(item => item.id === currentItem.id);
        if (exists) return folder;
        
        return {
          ...folder,
          items: [currentItem, ...folder.items]
        };
      }
      return folder;
    });

    localStorage.setItem('sr_folders', JSON.stringify(updatedFolders));
    onClose();
    alert(`Saved to folder!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl relative">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="text-[#dfff00]" size={20} />
            Save to Folder
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Create New Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Create New Folder</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name (e.g. Portraits)"
                className="flex-1 bg-[#1a1a1a] border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-[#dfff00] focus:outline-none"
              />
              <button 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-colors font-medium"
              >
                Create
              </button>
            </div>
          </div>

          {/* Select Existing Section */}
          <div className="space-y-3">
             <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Select Folder</label>
             <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
               {folders.length === 0 ? (
                 <div className="text-center py-6 text-neutral-600 italic text-sm border border-dashed border-neutral-800 rounded-xl">
                   No folders created yet
                 </div>
               ) : (
                 folders.map(folder => (
                   <button
                     key={folder.id}
                     onClick={() => setSelectedFolderId(folder.id)}
                     className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                       selectedFolderId === folder.id 
                         ? 'bg-[#dfff00]/10 border-[#dfff00] text-white' 
                         : 'bg-[#1a1a1a] border-transparent hover:border-neutral-700 text-neutral-300'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <Folder size={18} className={selectedFolderId === folder.id ? 'text-[#dfff00]' : 'text-neutral-500'} />
                       <span className="font-medium">{folder.name}</span>
                     </div>
                     <span className="text-xs text-neutral-500">{folder.items.length} items</span>
                   </button>
                 ))
               )}
             </div>
          </div>

          <Button 
            className="w-full" 
            disabled={!selectedFolderId || !currentItem}
            onClick={handleSaveToFolder}
          >
            <Save size={16} /> Save Image
          </Button>

        </div>
      </div>
    </div>
  );
};