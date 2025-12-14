import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hursnbwjbbkajelsrqqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cnNuYndqYmJrYWplbHNycXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTIxMjYsImV4cCI6MjA4MTAyODEyNn0.g5RyY7A7gupQy9G_RdT36Eo7ADHytPp3VulF5R7qM7s';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'usage' | 'admin_grant' | 'refund';
  description: string | null;
  created_at: string;
}

export interface RetouchHistory {
  id: string;
  user_id: string;
  style: string;
  resolution: string;
  credits_used: number;
  created_at: string;
}

class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // Auth methods
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Profile methods
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Credits methods
  async getCredits(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data?.credits || 0;
  }

  async useCredit(userId: string, style: string, resolution: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('use_credit', {
      p_user_id: userId,
      p_style: style,
      p_resolution: resolution
    });
    if (error) throw error;
    return data;
  }

  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Retouch history
  async getRetouchHistory(userId: string): Promise<RetouchHistory[]> {
    const { data, error } = await this.supabase
      .from('retouch_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Admin methods
  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    if (error) return false;
    return data?.is_admin || false;
  }

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAllRetouchHistory(): Promise<(RetouchHistory & { profiles: { email: string } })[]> {
    const { data, error } = await this.supabase
      .from('retouch_history')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  async grantCredits(userId: string, amount: number, description?: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('admin_grant_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description || 'Admin credit grant'
    });
    if (error) throw error;
    return data;
  }

  async getStats() {
    const { data: users } = await this.supabase
      .from('profiles')
      .select('id', { count: 'exact' });
    
    const { data: retouches } = await this.supabase
      .from('retouch_history')
      .select('id', { count: 'exact' });
    
    const { data: totalCredits } = await this.supabase
      .from('profiles')
      .select('credits');
    
    return {
      totalUsers: users?.length || 0,
      totalRetouches: retouches?.length || 0,
      totalCreditsInSystem: totalCredits?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0
    };
  }

  // Credit Codes methods
  async generateCreditCode(credits: number, description?: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_credit_code', {
      p_credits: credits,
      p_description: description || null
    });
    if (error) throw error;
    return data;
  }

  async redeemCreditCode(code: string): Promise<{ success: boolean; credits?: number; error?: string }> {
    const { data, error } = await this.supabase.rpc('redeem_credit_code', {
      p_code: code
    });
    if (error) throw error;
    return data;
  }

  async getCreditCodes(): Promise<CreditCode[]> {
    const { data, error } = await this.supabase
      .from('credit_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Image Storage methods
  async uploadRetouchImage(
    userId: string,
    imageBase64: string,
    type: 'original' | 'processed'
  ): Promise<string> {
    // Convert base64 to blob
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Generate unique filename
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `${userId}/${type}_${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from('retouch-images')
      .upload(filename, blob, { contentType: mimeType, upsert: false });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('retouch-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async saveRetouchWithImages(
    userId: string,
    style: string,
    resolution: string,
    originalBase64: string,
    processedBase64: string
  ): Promise<void> {
    // Upload images
    const [originalUrl, processedUrl] = await Promise.all([
      this.uploadRetouchImage(userId, originalBase64, 'original'),
      this.uploadRetouchImage(userId, processedBase64, 'processed')
    ]);

    // Save to retouch_history with URLs
    const { error } = await this.supabase
      .from('retouch_history')
      .insert({
        user_id: userId,
        style,
        resolution,
        credits_used: 1,
        original_image_url: originalUrl,
        processed_image_url: processedUrl
      });

    if (error) throw error;
  }

  async getRetouchHistoryWithImages(userId: string): Promise<RetouchHistoryWithImages[]> {
    const { data, error } = await this.supabase
      .from('retouch_history')
      .select('*')
      .eq('user_id', userId)
      .not('processed_image_url', 'is', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAllRetouchHistoryWithImages(): Promise<(RetouchHistoryWithImages & { profiles: { email: string } })[]> {
    const { data, error } = await this.supabase
      .from('retouch_history')
      .select('*, profiles(email)')
      .not('processed_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  async deleteRetouchImage(imageUrl: string): Promise<void> {
    // Extract path from URL
    const urlParts = imageUrl.split('/retouch-images/');
    if (urlParts.length < 2) return;
    
    const path = urlParts[1];
    const { error } = await this.supabase.storage
      .from('retouch-images')
      .remove([path]);
    
    if (error) throw error;
  }

  async deleteRetouchHistoryItem(id: string, originalUrl?: string, processedUrl?: string): Promise<void> {
    // Delete images from storage
    const deletePromises = [];
    if (originalUrl) deletePromises.push(this.deleteRetouchImage(originalUrl));
    if (processedUrl) deletePromises.push(this.deleteRetouchImage(processedUrl));
    
    await Promise.all(deletePromises);

    // Delete from database
    const { error } = await this.supabase
      .from('retouch_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // App Settings methods
  async getAppSettings(): Promise<AppSettings> {
    const { data, error } = await this.supabase
      .from('app_settings')
      .select('key, value');
    
    if (error) throw error;
    
    const settings: AppSettings = {
      free_credits_enabled: true,
      free_credits_amount: 2,
      free_credits_type: 'one_time',
      retouch_cost_4k: 2,
      retouch_cost_2k: 1,
      retouch_cost_1k: 1,
      background_cost: 1
    };
    
    data?.forEach(row => {
      if (row.key === 'free_credits_enabled') {
        settings.free_credits_enabled = row.value === true || row.value === 'true';
      } else if (row.key === 'free_credits_amount') {
        settings.free_credits_amount = typeof row.value === 'number' ? row.value : parseInt(row.value, 10);
      } else if (row.key === 'free_credits_type') {
        settings.free_credits_type = (row.value as string).replace(/"/g, '') as 'one_time' | 'daily';
      } else if (row.key === 'retouch_cost_4k') {
        settings.retouch_cost_4k = typeof row.value === 'number' ? row.value : parseInt(row.value, 10);
      } else if (row.key === 'retouch_cost_2k') {
        settings.retouch_cost_2k = typeof row.value === 'number' ? row.value : parseInt(row.value, 10);
      } else if (row.key === 'retouch_cost_1k') {
        settings.retouch_cost_1k = typeof row.value === 'number' ? row.value : parseInt(row.value, 10);
      } else if (row.key === 'background_cost') {
        settings.background_cost = typeof row.value === 'number' ? row.value : parseInt(row.value, 10);
      }
    });
    
    return settings;
  }

  async updateAppSetting(key: string, value: any): Promise<void> {
    const { error } = await this.supabase
      .from('app_settings')
      .upsert({ 
        key, 
        value: typeof value === 'string' ? value : JSON.stringify(value),
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  // Background management methods
  async getBackgrounds(activeOnly: boolean = true): Promise<Background[]> {
    let query = this.supabase
      .from('backgrounds')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async uploadBackgroundImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `bg_${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from('backgrounds')
      .upload(filename, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: urlData } = this.supabase.storage
      .from('backgrounds')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async addBackground(name: string, imageUrl: string): Promise<Background> {
    // Get max sort_order
    const { data: existing } = await this.supabase
      .from('backgrounds')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

    const { data, error } = await this.supabase
      .from('backgrounds')
      .insert({
        name,
        image_url: imageUrl,
        sort_order: nextOrder,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBackground(id: string, imageUrl: string): Promise<void> {
    // Delete from storage
    const urlParts = imageUrl.split('/backgrounds/');
    if (urlParts.length >= 2) {
      const path = urlParts[1];
      await this.supabase.storage.from('backgrounds').remove([path]);
    }

    // Delete from database
    const { error } = await this.supabase
      .from('backgrounds')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async toggleBackgroundActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('backgrounds')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get credit cost for a specific resolution
  async getCreditCost(resolution: '1K' | '2K' | '4K'): Promise<number> {
    const settings = await this.getAppSettings();
    switch (resolution) {
      case '4K': return settings.retouch_cost_4k;
      case '2K': return settings.retouch_cost_2k;
      case '1K': return settings.retouch_cost_1k;
      default: return 1;
    }
  }

  // Use multiple credits
  async useCredits(userId: string, amount: number, style: string, resolution: string): Promise<boolean> {
    // First check if user has enough credits
    const profile = await this.getProfile(userId);
    if (!profile || profile.credits < amount) return false;

    // Deduct credits
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ credits: profile.credits - amount })
      .eq('id', userId);
    
    if (updateError) throw updateError;

    // Log transaction
    const { error: txError } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description: `${style} at ${resolution}`
      });
    
    if (txError) console.error('Failed to log transaction:', txError);

    // Log to retouch history
    const { error: histError } = await this.supabase
      .from('retouch_history')
      .insert({
        user_id: userId,
        style,
        resolution,
        credits_used: amount
      });
    
    if (histError) console.error('Failed to log history:', histError);

    return true;
  }

  // Contact form methods
  async submitContactForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
  }): Promise<{ success: boolean; ticketNumber?: string; error?: string }> {
    try {
      // Generate ticket number
      const { data: countData } = await this.supabase
        .from('contact_submissions')
        .select('id', { count: 'exact', head: true });
      
      const count = (countData as any)?.length || 0;
      const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

      const { error } = await this.supabase
        .from('contact_submissions')
        .insert({
          ticket_number: ticketNumber,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          message: data.message,
          status: 'new'
        });

      if (error) throw error;
      return { success: true, ticketNumber };
    } catch (error: any) {
      console.error('Failed to submit contact form:', error);
      return { success: false, error: error.message };
    }
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    const { data, error } = await this.supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateContactStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const { error } = await this.supabase
      .from('contact_submissions')
      .update({ 
        status, 
        admin_notes: adminNotes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    if (error) throw error;
  }

  // Purchase Request methods
  async submitPurchaseRequest(data: {
    name: string;
    phone: string;
    plan: string;
    email?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('purchase_requests')
      .insert({
        name: data.name,
        phone: data.phone,
        plan: data.plan,
        email: data.email || null,
        status: 'pending'
      });

    if (error) throw error;
  }

  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    const { data, error } = await this.supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updatePurchaseRequestStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const { error } = await this.supabase
      .from('purchase_requests')
      .update({ 
        status, 
        admin_notes: adminNotes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    if (error) throw error;
  }
}

export interface CreditCode {
  id: string;
  code: string;
  credits: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_by: string;
  created_at: string;
  description: string | null;
}

export interface RetouchHistoryWithImages extends RetouchHistory {
  original_image_url: string | null;
  processed_image_url: string | null;
}

export interface AppSettings {
  free_credits_enabled: boolean;
  free_credits_amount: number;
  free_credits_type: 'one_time' | 'daily';
  retouch_cost_4k: number;
  retouch_cost_2k: number;
  retouch_cost_1k: number;
  background_cost: number;
}

export interface Background {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  ticket_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  plan: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const supabaseService = new SupabaseService();
