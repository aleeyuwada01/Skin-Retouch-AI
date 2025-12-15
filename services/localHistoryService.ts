import { LocalHistoryItem, EnhanceStyle } from '../types';

/**
 * Service for managing local history storage.
 * Provides offline access to retouching history with compressed thumbnails.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export class LocalHistoryService {
  private readonly STORAGE_KEY = 'skinRetoucher_history';
  private readonly MAX_ITEMS = 50;
  private readonly THUMBNAIL_SIZE = 200; // px

  /**
   * Generates a compressed thumbnail from a base64 image.
   * @param imageBase64 - The source image as base64 string
   * @returns Promise resolving to compressed thumbnail as base64
   */
  generateThumbnail(imageBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(
            this.THUMBNAIL_SIZE / img.width,
            this.THUMBNAIL_SIZE / img.height
          );
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageBase64;
    });
  }

  /**
   * Saves a history item with generated thumbnail to local storage.
   * @param item - History item data (without thumbnail)
   * @param processedImage - The processed image to generate thumbnail from
   * @returns Promise resolving to the saved LocalHistoryItem with thumbnail
   * 
   * Requirements: 3.1, 3.2
   */
  async saveItem(
    item: Omit<LocalHistoryItem, 'thumbnail'>,
    processedImage: string
  ): Promise<LocalHistoryItem> {
    const thumbnail = await this.generateThumbnail(processedImage);
    const historyItem: LocalHistoryItem = { ...item, thumbnail };
    
    const items = this.getItems();
    items.unshift(historyItem);
    
    // Limit storage size to MAX_ITEMS
    const trimmed = items.slice(0, this.MAX_ITEMS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    
    return historyItem;
  }


  /**
   * Retrieves all history items from local storage.
   * @returns Array of LocalHistoryItem objects
   * 
   * Requirements: 3.3
   */
  getItems(): LocalHistoryItem[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Deletes a specific history item by ID.
   * @param id - The ID of the item to delete
   * 
   * Requirements: 3.4
   */
  deleteItem(id: string): void {
    const items = this.getItems().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  /**
   * Updates a specific history item with partial data.
   * @param id - The ID of the item to update
   * @param updates - Partial LocalHistoryItem with fields to update
   */
  updateItem(id: string, updates: Partial<LocalHistoryItem>): void {
    const items = this.getItems().map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  /**
   * Clears all history items from local storage.
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Export singleton instance
export const localHistoryService = new LocalHistoryService();
