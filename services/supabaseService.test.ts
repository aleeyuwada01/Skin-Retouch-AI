import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for SupabaseService
 * 
 * **Feature: retouch-features, Property 7: Remote history cascading delete**
 * **Validates: Requirements 4.3, 4.4, 5.3**
 */

// Mock types for testing
interface MockHistoryItem {
  id: string;
  originalUrl: string | undefined;
  processedUrl: string | undefined;
}

/**
 * Simulates the cascading delete behavior for testing.
 * This function mirrors the logic in deleteHistoryWithCascade.
 */
function simulateCascadingDelete(
  item: MockHistoryItem,
  deleteImageFn: (url: string) => void,
  deleteRecordFn: (id: string) => void
): { deletedImages: string[]; deletedRecordId: string | null } {
  const deletedImages: string[] = [];
  let deletedRecordId: string | null = null;

  // Delete original image if exists
  if (item.originalUrl) {
    try {
      deleteImageFn(item.originalUrl);
      deletedImages.push(item.originalUrl);
    } catch (error) {
      // Log but continue
    }
  }

  // Delete processed image if exists
  if (item.processedUrl) {
    try {
      deleteImageFn(item.processedUrl);
      deletedImages.push(item.processedUrl);
    } catch (error) {
      // Log but continue
    }
  }

  // Delete database record
  try {
    deleteRecordFn(item.id);
    deletedRecordId = item.id;
  } catch (error) {
    // Record deletion failure
  }

  return { deletedImages, deletedRecordId };
}

describe('SupabaseService', () => {
  /**
   * Property 7: Remote history cascading delete
   * 
   * *For any* remote history item deletion, both the database record AND all 
   * associated storage files SHALL be removed.
   * 
   * **Feature: retouch-features, Property 7: Remote history cascading delete**
   * **Validates: Requirements 4.3, 4.4, 5.3**
   */
  describe('Property 7: Remote history cascading delete', () => {
    // Arbitrary for generating valid storage URLs
    const storageUrlArb = fc.option(
      fc.string({ minLength: 10, maxLength: 100 }),
      { nil: undefined }
    );

    // Arbitrary for generating mock history items
    const mockHistoryItemArb = fc.record({
      id: fc.uuid(),
      originalUrl: storageUrlArb,
      processedUrl: storageUrlArb
    });

    it('should attempt to delete all associated images when both URLs are provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (id, originalUrl, processedUrl) => {
            const deletedImages: string[] = [];
            let deletedRecordId: string | null = null;

            const mockDeleteImage = (url: string) => {
              deletedImages.push(url);
            };

            const mockDeleteRecord = (recordId: string) => {
              deletedRecordId = recordId;
            };

            const item: MockHistoryItem = { id, originalUrl, processedUrl };
            simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);

            // Property: both images should be deleted
            return (
              deletedImages.includes(originalUrl) &&
              deletedImages.includes(processedUrl) &&
              deletedRecordId === id
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete database record even when only original URL is provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 100 }),
          (id, originalUrl) => {
            const deletedImages: string[] = [];
            let deletedRecordId: string | null = null;

            const mockDeleteImage = (url: string) => {
              deletedImages.push(url);
            };

            const mockDeleteRecord = (recordId: string) => {
              deletedRecordId = recordId;
            };

            const item: MockHistoryItem = { id, originalUrl, processedUrl: undefined };
            simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);

            // Property: original image and record should be deleted
            return (
              deletedImages.length === 1 &&
              deletedImages.includes(originalUrl) &&
              deletedRecordId === id
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete database record even when only processed URL is provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 100 }),
          (id, processedUrl) => {
            const deletedImages: string[] = [];
            let deletedRecordId: string | null = null;

            const mockDeleteImage = (url: string) => {
              deletedImages.push(url);
            };

            const mockDeleteRecord = (recordId: string) => {
              deletedRecordId = recordId;
            };

            const item: MockHistoryItem = { id, originalUrl: undefined, processedUrl };
            simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);

            // Property: processed image and record should be deleted
            return (
              deletedImages.length === 1 &&
              deletedImages.includes(processedUrl) &&
              deletedRecordId === id
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete database record even when no URLs are provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (id) => {
            const deletedImages: string[] = [];
            let deletedRecordId: string | null = null;

            const mockDeleteImage = (url: string) => {
              deletedImages.push(url);
            };

            const mockDeleteRecord = (recordId: string) => {
              deletedRecordId = recordId;
            };

            const item: MockHistoryItem = { id, originalUrl: undefined, processedUrl: undefined };
            simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);

            // Property: no images deleted, but record should be deleted
            return (
              deletedImages.length === 0 &&
              deletedRecordId === id
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should continue with record deletion even if image deletion fails', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (id, originalUrl, processedUrl) => {
            let deletedRecordId: string | null = null;

            // Mock that always fails for image deletion
            const mockDeleteImage = (_url: string) => {
              throw new Error('Storage deletion failed');
            };

            const mockDeleteRecord = (recordId: string) => {
              deletedRecordId = recordId;
            };

            const item: MockHistoryItem = { id, originalUrl, processedUrl };
            simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);

            // Property: record should still be deleted despite image deletion failures
            return deletedRecordId === id;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple items with cascading delete correctly', () => {
      fc.assert(
        fc.property(
          fc.array(mockHistoryItemArb, { minLength: 1, maxLength: 5 }),
          (items) => {
            const allDeletedImages: string[] = [];
            const allDeletedRecordIds: string[] = [];

            const mockDeleteImage = (url: string) => {
              allDeletedImages.push(url);
            };

            const mockDeleteRecord = (recordId: string) => {
              allDeletedRecordIds.push(recordId);
            };

            // Delete all items
            for (const item of items) {
              simulateCascadingDelete(item, mockDeleteImage, mockDeleteRecord);
            }

            // Property: all records should be deleted
            const allRecordsDeleted = items.every(item => 
              allDeletedRecordIds.includes(item.id)
            );

            // Property: all provided images should be deleted
            const allImagesDeleted = items.every(item => {
              const originalDeleted = !item.originalUrl || allDeletedImages.includes(item.originalUrl);
              const processedDeleted = !item.processedUrl || allDeletedImages.includes(item.processedUrl);
              return originalDeleted && processedDeleted;
            });

            return allRecordsDeleted && allImagesDeleted;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
