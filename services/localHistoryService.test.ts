import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalHistoryService } from './localHistoryService';
import { LocalHistoryItem, EnhanceStyle } from '../types';

/**
 * Property-Based Tests for LocalHistoryService
 * 
 * **Feature: retouch-features, Property 5: Local storage persistence round-trip**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * **Feature: retouch-features, Property 6: Local history deletion**
 * **Validates: Requirements 3.4**
 */
describe('LocalHistoryService', () => {
  let service: LocalHistoryService;
  let mockStorage: Record<string, string> = {};

  // Arbitrary for generating valid EnhanceStyle values
  const enhanceStyleArb = fc.constantFrom(
    EnhanceStyle.Natural,
    EnhanceStyle.Soft,
    EnhanceStyle.Sculpted,
    EnhanceStyle.DarkSkin,
    EnhanceStyle.FullBody,
    EnhanceStyle.DodgeBurn,
    EnhanceStyle.Custom
  );

  // Arbitrary for generating valid lastEditState values
  const lastEditStateArb = fc.constantFrom(
    'original' as const,
    'processed' as const,
    'background_changed' as const
  );

  // Arbitrary for generating valid LocalHistoryItem (without thumbnail)
  const localHistoryItemArb = fc.record({
    id: fc.uuid(),
    style: enhanceStyleArb,
    timestamp: fc.integer({ min: 0, max: Date.now() + 1000000 }),
    lastEditState: lastEditStateArb,
    isRemote: fc.boolean(),
    remoteId: fc.option(fc.uuid(), { nil: undefined })
  });

  // Simple base64 thumbnail for testing (1x1 pixel JPEG)
  const testThumbnail = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';

  beforeEach(() => {
    mockStorage = {};
    
    // Mock localStorage
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; }
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    service = new LocalHistoryService();
  });


  /**
   * Property 5: Local storage persistence round-trip
   * 
   * *For any* history item saved to local storage, retrieving items from local storage 
   * SHALL return an item with matching id, style, timestamp, and a valid thumbnail.
   * 
   * **Feature: retouch-features, Property 5: Local storage persistence round-trip**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 5: Local storage persistence round-trip', () => {
    it('should persist and retrieve history items with matching id, style, and timestamp', () => {
      fc.assert(
        fc.property(
          localHistoryItemArb,
          (itemData) => {
            // Clear storage before each test
            mockStorage = {};
            
            // Create a complete LocalHistoryItem with thumbnail
            const fullItem: LocalHistoryItem = {
              ...itemData,
              thumbnail: testThumbnail
            };
            
            // Save directly to storage (simulating saveItem result)
            const items = [fullItem];
            mockStorage['skinRetoucher_history'] = JSON.stringify(items);
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: retrieved item should match saved item
            expect(retrievedItems.length).toBe(1);
            const retrieved = retrievedItems[0];
            
            return (
              retrieved.id === fullItem.id &&
              retrieved.style === fullItem.style &&
              retrieved.timestamp === fullItem.timestamp &&
              retrieved.lastEditState === fullItem.lastEditState &&
              retrieved.isRemote === fullItem.isRemote &&
              retrieved.remoteId === fullItem.remoteId &&
              retrieved.thumbnail.startsWith('data:image/')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain order when multiple items are saved', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 10 }),
          (itemsData) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: all items should be retrieved in same order
            if (retrievedItems.length !== fullItems.length) return false;
            
            return fullItems.every((item, index) => 
              retrievedItems[index].id === item.id &&
              retrievedItems[index].style === item.style &&
              retrievedItems[index].timestamp === item.timestamp
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when storage is empty', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Ensure storage is empty
            mockStorage = {};
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: should return empty array
            return retrievedItems.length === 0 && Array.isArray(retrievedItems);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 6: Local history deletion
   * 
   * *For any* local history item that is deleted, subsequent retrieval of history items 
   * SHALL not include the deleted item.
   * 
   * **Feature: retouch-features, Property 6: Local history deletion**
   * **Validates: Requirements 3.4**
   */
  describe('Property 6: Local history deletion', () => {
    it('should remove item from storage after deletion', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (itemsData, deleteIndex) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % fullItems.length;
            const itemToDelete = fullItems[safeDeleteIndex];
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            
            // Delete the item
            service.deleteItem(itemToDelete.id);
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: deleted item should not be in retrieved items
            const deletedItemFound = retrievedItems.some(item => item.id === itemToDelete.id);
            
            return !deletedItemFound;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other items after deletion', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (itemsData, deleteIndex) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % fullItems.length;
            const itemToDelete = fullItems[safeDeleteIndex];
            const expectedRemainingIds = fullItems
              .filter(item => item.id !== itemToDelete.id)
              .map(item => item.id);
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            
            // Delete the item
            service.deleteItem(itemToDelete.id);
            
            // Retrieve items
            const retrievedItems = service.getItems();
            const retrievedIds = retrievedItems.map(item => item.id);
            
            // Property: all non-deleted items should still be present
            return (
              retrievedItems.length === fullItems.length - 1 &&
              expectedRemainingIds.every(id => retrievedIds.includes(id))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of non-existent item gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 5 }),
          fc.uuid(),
          (itemsData, nonExistentId) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Ensure nonExistentId is not in the items
            const existingIds = fullItems.map(item => item.id);
            if (existingIds.includes(nonExistentId)) {
              return true; // Skip this case
            }
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            
            // Delete non-existent item
            service.deleteItem(nonExistentId);
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: all original items should still be present
            return retrievedItems.length === fullItems.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('updateItem', () => {
    it('should update specific fields of an item', () => {
      fc.assert(
        fc.property(
          localHistoryItemArb,
          fc.boolean(),
          (itemData, newIsRemote) => {
            // Clear storage
            mockStorage = {};
            
            const fullItem: LocalHistoryItem = {
              ...itemData,
              thumbnail: testThumbnail
            };
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify([fullItem]);
            
            // Update the item
            service.updateItem(fullItem.id, { isRemote: newIsRemote });
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: isRemote should be updated, other fields unchanged
            return (
              retrievedItems[0].isRemote === newIsRemote &&
              retrievedItems[0].id === fullItem.id &&
              retrievedItems[0].style === fullItem.style
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('clearAll', () => {
    it('should remove all items from storage', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 10 }),
          (itemsData) => {
            // Clear storage
            mockStorage = {};
            
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Save to storage
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            
            // Clear all
            service.clearAll();
            
            // Retrieve items
            const retrievedItems = service.getItems();
            
            // Property: should return empty array
            return retrievedItems.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 8: History display update after deletion
   * 
   * *For any* delete operation (local or remote), the displayed history list 
   * SHALL not contain the deleted item after the operation completes.
   * 
   * **Feature: retouch-features, Property 8: History display update after deletion**
   * **Validates: Requirements 5.4**
   */
  describe('Property 8: History display update after deletion', () => {
    /**
     * Simulates the UI state management for history display.
     * This mirrors the React state update pattern in Editor.tsx.
     */
    interface DisplayState {
      localHistory: LocalHistoryItem[];
    }

    /**
     * Simulates deleting a local history item and updating display state.
     * Mirrors handleDeleteLocalHistoryItem in Editor.tsx.
     */
    function simulateLocalDelete(
      state: DisplayState,
      itemId: string,
      service: LocalHistoryService
    ): DisplayState {
      // Delete from storage
      service.deleteItem(itemId);
      // Update display state (mirrors setLocalHistory(prev => prev.filter(...)))
      return {
        localHistory: state.localHistory.filter(item => item.id !== itemId)
      };
    }

    /**
     * Simulates deleting a remote history item and updating display state.
     * Mirrors handleDeleteRemoteHistoryItem in Editor.tsx.
     */
    function simulateRemoteDelete(
      state: DisplayState,
      itemId: string,
      service: LocalHistoryService
    ): DisplayState {
      // Delete from local storage (remote deletion also removes from local)
      service.deleteItem(itemId);
      // Update display state
      return {
        localHistory: state.localHistory.filter(item => item.id !== itemId)
      };
    }

    it('should not display deleted local item after deletion', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (itemsData, deleteIndex) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails (local items without remoteId)
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail,
              isRemote: false,
              remoteId: undefined
            }));
            
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % fullItems.length;
            const itemToDelete = fullItems[safeDeleteIndex];
            
            // Initialize storage and display state
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            let displayState: DisplayState = { localHistory: [...fullItems] };
            
            // Perform deletion
            displayState = simulateLocalDelete(displayState, itemToDelete.id, service);
            
            // Property: deleted item should not be in display state
            const deletedItemInDisplay = displayState.localHistory.some(
              item => item.id === itemToDelete.id
            );
            
            // Property: deleted item should not be in storage
            const storageItems = service.getItems();
            const deletedItemInStorage = storageItems.some(
              item => item.id === itemToDelete.id
            );
            
            return !deletedItemInDisplay && !deletedItemInStorage;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display deleted remote item after deletion', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.uuid(),
          (itemsData, deleteIndex, remoteId) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map((item, idx) => ({
              ...item,
              thumbnail: testThumbnail,
              // Make the item to delete a remote item
              isRemote: idx === (deleteIndex % itemsData.length),
              remoteId: idx === (deleteIndex % itemsData.length) ? remoteId : undefined
            }));
            
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % fullItems.length;
            const itemToDelete = fullItems[safeDeleteIndex];
            
            // Initialize storage and display state
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            let displayState: DisplayState = { localHistory: [...fullItems] };
            
            // Perform remote deletion (which also removes from local)
            displayState = simulateRemoteDelete(displayState, itemToDelete.id, service);
            
            // Property: deleted item should not be in display state
            const deletedItemInDisplay = displayState.localHistory.some(
              item => item.id === itemToDelete.id
            );
            
            // Property: deleted item should not be in storage
            const storageItems = service.getItems();
            const deletedItemInStorage = storageItems.some(
              item => item.id === itemToDelete.id
            );
            
            return !deletedItemInDisplay && !deletedItemInStorage;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve non-deleted items in display after deletion', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (itemsData, deleteIndex) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Ensure deleteIndex is within bounds
            const safeDeleteIndex = deleteIndex % fullItems.length;
            const itemToDelete = fullItems[safeDeleteIndex];
            const expectedRemainingIds = fullItems
              .filter(item => item.id !== itemToDelete.id)
              .map(item => item.id);
            
            // Initialize storage and display state
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            let displayState: DisplayState = { localHistory: [...fullItems] };
            
            // Perform deletion
            displayState = simulateLocalDelete(displayState, itemToDelete.id, service);
            
            // Property: all non-deleted items should still be in display
            const displayIds = displayState.localHistory.map(item => item.id);
            const allRemainingInDisplay = expectedRemainingIds.every(
              id => displayIds.includes(id)
            );
            
            // Property: display count should be original count minus 1
            const correctCount = displayState.localHistory.length === fullItems.length - 1;
            
            return allRemainingInDisplay && correctCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple sequential deletions correctly', () => {
      fc.assert(
        fc.property(
          fc.array(localHistoryItemArb, { minLength: 3, maxLength: 10 }),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 3 }),
          (itemsData, deleteIndices) => {
            // Clear storage
            mockStorage = {};
            
            // Create full items with thumbnails
            const fullItems: LocalHistoryItem[] = itemsData.map(item => ({
              ...item,
              thumbnail: testThumbnail
            }));
            
            // Initialize storage and display state
            mockStorage['skinRetoucher_history'] = JSON.stringify(fullItems);
            let displayState: DisplayState = { localHistory: [...fullItems] };
            
            // Track deleted IDs
            const deletedIds: string[] = [];
            
            // Perform sequential deletions
            for (const deleteIndex of deleteIndices) {
              if (displayState.localHistory.length === 0) break;
              
              const safeIndex = deleteIndex % displayState.localHistory.length;
              const itemToDelete = displayState.localHistory[safeIndex];
              deletedIds.push(itemToDelete.id);
              
              displayState = simulateLocalDelete(displayState, itemToDelete.id, service);
            }
            
            // Property: no deleted items should be in display
            const noDeletedInDisplay = deletedIds.every(
              id => !displayState.localHistory.some(item => item.id === id)
            );
            
            // Property: no deleted items should be in storage
            const storageItems = service.getItems();
            const noDeletedInStorage = deletedIds.every(
              id => !storageItems.some(item => item.id === id)
            );
            
            return noDeletedInDisplay && noDeletedInStorage;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
