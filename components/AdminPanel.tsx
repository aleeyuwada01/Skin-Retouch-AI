import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Users, 
  CreditCard, 
  History, 
  Search,
  Plus,
  Loader2,
  RefreshCw,
  Ticket,
  Copy,
  Check,
  Trash2,
  Image,
  AlertTriangle
} from 'lucide-react';
import { supabaseService, Profile, RetouchHistory, CreditCode, RetouchHistoryWithImages } from '../services/supabaseService';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'images' | 'history'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [history, setHistory] = useState<(RetouchHistory & { profiles: { email: string } })[]>([]);
  const [retouchImages, setRetouchImages] = useState<(RetouchHistoryWithImages & { profiles: { email: string } })[]>([]);
  const [creditCodes, setCreditCodes] = useState<CreditCode[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalRetouches: 0, totalCreditsInSystem: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Grant credits modal
  const [grantModal, setGrantModal] = useState<{ isOpen: boolean; user: Profile | null }>({ isOpen: false, user: null });
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantDescription, setGrantDescription] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  
  // Generate code modal
  const [generateModal, setGenerateModal] = useState(false);
  const [codeCredits, setCodeCredits] = useState(10);
  const [codeDescription, setCodeDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: (RetouchHistoryWithImages & { profiles: { email: string } }) | null }>({ isOpen: false, item: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, historyData, statsData, codesData, imagesData] = await Promise.all([
        supabaseService.getAllUsers(),
        supabaseService.getAllRetouchHistory(),
        supabaseService.getStats(),
        supabaseService.getCreditCodes(),
        supabaseService.getAllRetouchHistoryWithImages()
      ]);
      setUsers(usersData);
      setRetouchImages(imagesData);
      setHistory(historyData);
      setStats(statsData);
      setCreditCodes(codesData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantCredits = async () => {
    if (!grantModal.user || grantAmount <= 0) return;
    
    setIsGranting(true);
    try {
      await supabaseService.grantCredits(grantModal.user.id, grantAmount, grantDescription || 'Admin credit grant');
      await loadData(); // Refresh data
      setGrantModal({ isOpen: false, user: null });
      setGrantAmount(10);
      setGrantDescription('');
    } catch (error) {
      console.error('Failed to grant credits:', error);
    } finally {
      setIsGranting(false);
    }
  };

  const handleGenerateCode = async () => {
    if (codeCredits <= 0) return;
    
    setIsGenerating(true);
    try {
      const code = await supabaseService.generateCreditCode(codeCredits, codeDescription || undefined);
      setGeneratedCode(code);
      await loadData(); // Refresh codes list
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const closeGenerateModal = () => {
    setGenerateModal(false);
    setGeneratedCode(null);
    setCodeCredits(10);
    setCodeDescription('');
  };

  const handleDeleteImage = async () => {
    if (!deleteModal.item) return;
    
    setIsDeleting(true);
    try {
      await supabaseService.deleteRetouchHistoryItem(
        deleteModal.item.id,
        deleteModal.item.original_image_url || undefined,
        deleteModal.item.processed_image_url || undefined
      );
      await loadData();
      setDeleteModal({ isOpen: false, item: null });
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate days until deletion (7 days from creation)
  const getDaysUntilDeletion = (createdAt: string) => {
    const created = new Date(createdAt);
    const deleteDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((deleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <button 
            onClick={loadData}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-blue-400" />
              <span className="text-neutral-400 text-sm">Total Users</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <History size={20} className="text-green-400" />
              <span className="text-neutral-400 text-sm">Total Retouches</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalRetouches}</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={20} className="text-[#dfff00]" />
              <span className="text-neutral-400 text-sm">Credits in System</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalCreditsInSystem}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-[#dfff00] text-black' : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'codes' ? 'bg-[#dfff00] text-black' : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            Credit Codes
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'images' ? 'bg-[#dfff00] text-black' : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            Retouch Images
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-[#dfff00] text-black' : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            History Log
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#dfff00]" size={32} />
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#dfff00]"
                    />
                  </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0a0a0a] text-xs text-neutral-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Credits</th>
                        <th className="px-4 py-3 text-left">Admin</th>
                        <th className="px-4 py-3 text-left">Joined</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-white">{user.full_name || 'No name'}</div>
                              <div className="text-xs text-neutral-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${user.credits > 0 ? 'text-[#dfff00]' : 'text-red-400'}`}>
                              {user.credits}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_admin ? (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Admin</span>
                            ) : (
                              <span className="text-xs text-neutral-500">User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setGrantModal({ isOpen: true, user })}
                              className="text-xs bg-[#dfff00] text-black px-3 py-1.5 rounded-lg font-medium hover:bg-[#ccff00] transition-colors inline-flex items-center gap-1"
                            >
                              <Plus size={12} />
                              Grant Credits
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'codes' && (
              <div className="space-y-4">
                {/* Generate Code Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setGenerateModal(true)}
                    className="bg-[#dfff00] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ccff00] transition-colors inline-flex items-center gap-2"
                  >
                    <Ticket size={16} />
                    Generate New Code
                  </button>
                </div>

                {/* Codes Table */}
                <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0a0a0a] text-xs text-neutral-400 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Code</th>
                          <th className="px-4 py-3 text-left">Credits</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-left">Created</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {creditCodes.map((code) => (
                          <tr key={code.id} className="hover:bg-white/5">
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm bg-white/10 px-2 py-1 rounded">{code.code}</span>
                            </td>
                            <td className="px-4 py-3 text-[#dfff00] font-bold">{code.credits}</td>
                            <td className="px-4 py-3">
                              {code.is_used ? (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Used</span>
                              ) : (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Available</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-400">{code.description || '-'}</td>
                            <td className="px-4 py-3 text-sm text-neutral-400">
                              {new Date(code.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!code.is_used && (
                                <button
                                  onClick={() => copyCode(code.code)}
                                  className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-1"
                                >
                                  <Copy size={12} />
                                  Copy
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {creditCodes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                              No codes generated yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 font-medium text-sm">Auto-deletion Policy</p>
                    <p className="text-yellow-200/70 text-xs mt-1">
                      Images are automatically deleted 7 days after creation to save storage space.
                    </p>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {retouchImages.map((item) => {
                    const daysLeft = getDaysUntilDeletion(item.created_at);
                    return (
                      <div key={item.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                        {/* Image Preview */}
                        <div className="aspect-video bg-black relative group">
                          {item.processed_image_url ? (
                            <img 
                              src={item.processed_image_url} 
                              alt="Processed" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <Image size={32} />
                            </div>
                          )}
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {item.processed_image_url && (
                              <a 
                                href={item.processed_image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                              >
                                <Image size={16} className="text-white" />
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, item })}
                              className="bg-red-500/80 hover:bg-red-500 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-white" />
                            </button>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">{item.style}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              daysLeft <= 1 ? 'bg-red-500/20 text-red-400' : 
                              daysLeft <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {daysLeft} days left
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 truncate">{item.profiles?.email || 'Unknown'}</p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {retouchImages.length === 0 && (
                    <div className="col-span-full text-center py-12 text-neutral-500">
                      No retouch images yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0a0a0a] text-xs text-neutral-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Style</th>
                        <th className="px-4 py-3 text-left">Resolution</th>
                        <th className="px-4 py-3 text-left">Credits Used</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-sm">{item.profiles?.email || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">{item.style}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-400">{item.resolution}</td>
                          <td className="px-4 py-3 text-sm text-[#dfff00]">{item.credits_used}</td>
                          <td className="px-4 py-3 text-sm text-neutral-400">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Grant Credits Modal */}
      {grantModal.isOpen && grantModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Grant Credits</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Granting credits to: <span className="text-white">{grantModal.user.email}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase mb-1 block">Amount</label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#dfff00]"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase mb-1 block">Description (optional)</label>
                <input
                  type="text"
                  value={grantDescription}
                  onChange={(e) => setGrantDescription(e.target.value)}
                  placeholder="e.g., Promotional bonus"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 px-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#dfff00]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setGrantModal({ isOpen: false, user: null })}
                className="flex-1 py-2.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantCredits}
                disabled={isGranting || grantAmount <= 0}
                className="flex-1 py-2.5 rounded-lg bg-[#dfff00] text-black font-bold hover:bg-[#ccff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGranting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Grant {grantAmount} Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Code Modal */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            {generatedCode ? (
              // Success view
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Code Generated!</h3>
                  <p className="text-sm text-neutral-400">Share this code with the user</p>
                </div>
                
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-center mb-4">
                  <span className="font-mono text-2xl tracking-widest text-[#dfff00]">{generatedCode}</span>
                </div>
                
                <div className="text-center text-sm text-neutral-400 mb-6">
                  Worth <span className="text-[#dfff00] font-bold">{codeCredits}</span> credits
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyCode(generatedCode)}
                    className="flex-1 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                  <button
                    onClick={closeGenerateModal}
                    className="flex-1 py-2.5 rounded-lg bg-[#dfff00] text-black font-bold hover:bg-[#ccff00] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              // Form view
              <>
                <h3 className="text-lg font-bold mb-4">Generate Credit Code</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Create a redeemable code that users can use to add credits.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase mb-1 block">Credits Amount</label>
                    <input
                      type="number"
                      value={codeCredits}
                      onChange={(e) => setCodeCredits(parseInt(e.target.value) || 0)}
                      min={1}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#dfff00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase mb-1 block">Description (optional)</label>
                    <input
                      type="text"
                      value={codeDescription}
                      onChange={(e) => setCodeDescription(e.target.value)}
                      placeholder="e.g., Promo code for influencer"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 px-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#dfff00]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeGenerateModal}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating || codeCredits <= 0}
                    className="flex-1 py-2.5 rounded-lg bg-[#dfff00] text-black font-bold hover:bg-[#ccff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                    Generate Code
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Image?</h3>
              <p className="text-sm text-neutral-400">
                This will permanently delete the original and processed images for this retouch.
              </p>
            </div>
            
            {deleteModal.item.processed_image_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={deleteModal.item.processed_image_url} 
                  alt="Preview" 
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            <div className="text-xs text-neutral-500 mb-4 text-center">
              User: {deleteModal.item.profiles?.email || 'Unknown'}<br />
              Style: {deleteModal.item.style} • {new Date(deleteModal.item.created_at).toLocaleDateString()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="flex-1 py-2.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

