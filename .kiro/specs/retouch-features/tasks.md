# Implementation Plan

- [x] 1. Set up tour configuration and management





  - [x] 1.1 Create tour configuration constants and utility functions


    - Add TOUR_CONFIG object with MAX_DISPLAY_COUNT, STORAGE_KEY, DISABLED_KEY
    - Implement getTourDisplayCount(), incrementTourCount(), shouldShowTour(), resetTourCount(), disableTourPermanently()
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 1.2 Write property test for tour display threshold


    - **Property 3: Tour display threshold**
    - **Validates: Requirements 2.2, 2.4**

  - [x] 1.3 Write property test for tour count increment

    - **Property 4: Tour count increment**
    - **Validates: Requirements 2.3**
  - [x] 1.4 Update Editor.tsx to use new tour management functions


    - Replace existing tutorial logic with shouldShowTour() and incrementTourCount()
    - Ensure tour only shows when count < 3
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement local history storage service





  - [x] 3.1 Create LocalHistoryService class with core methods


    - Implement generateThumbnail() for creating compressed thumbnails
    - Implement saveItem() to store history with thumbnail
    - Implement getItems() to retrieve all history items
    - Implement deleteItem() to remove specific items
    - Implement updateItem() and clearAll() utility methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Write property test for local storage round-trip


    - **Property 5: Local storage persistence round-trip**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 3.3 Write property test for local history deletion
    - **Property 6: Local history deletion**
    - **Validates: Requirements 3.4**
  - [x] 3.4 Add LocalHistoryItem type to types.ts


    - Define interface with id, thumbnail, style, timestamp, lastEditState, isRemote, remoteId
    - _Requirements: 3.1, 3.2_

- [x] 4. Integrate local history with Editor component



  - [x] 4.1 Update Editor.tsx to save history items locally after retouch


    - Call localHistoryService.saveItem() after successful retouch
    - Generate thumbnail from processed image
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Update Editor.tsx to load history from local storage on mount
    - Retrieve items using localHistoryService.getItems()
    - Display in history panel

    - _Requirements: 3.3_
  - [x] 4.3 Add delete functionality for local history items

    - Add delete button to each history item
    - Call localHistoryService.deleteItem() on confirmation
    - Update display after deletion
    - _Requirements: 3.4, 5.1, 5.4_

- [x] 5. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Supabase history sync and cascading delete





  - [x] 6.1 Add syncHistoryOnLogin method to supabaseService


    - Fetch remote history with images
    - Merge with local history items
    - Mark synced items with remoteId
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Add deleteHistoryWithCascade method to supabaseService
    - Delete associated image files from storage
    - Delete database record
    - Handle partial failures gracefully
    - _Requirements: 4.3, 4.4, 5.3_
  - [x] 6.3 Write property test for cascading delete


    - **Property 7: Remote history cascading delete**
    - **Validates: Requirements 4.3, 4.4, 5.3**
  - [x] 6.4 Integrate sync on login in App.tsx


    - Call syncHistoryOnLogin() after successful login
    - Handle sync errors gracefully
    - _Requirements: 4.2_

- [x] 7. Add remote history delete UI





  - [x] 7.1 Add delete option for remote history items in Editor


    - Display delete button for items with remoteId
    - Call deleteHistoryWithCascade() on confirmation
    - Also remove from local storage
    - _Requirements: 5.2, 5.3_

  - [x] 7.2 Write property test for history display update after deletion

    - **Property 8: History display update after deletion**
    - **Validates: Requirements 5.4**

- [x] 8. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement background replacement logo guardrail




  - [x] 9.1 Create logo overlay state capture and restore functions


    - Implement captureLogoState() to save position, size, visibility, zIndex
    - Implement restoreLogoState() to apply saved state
    - Add data-logo-overlay attribute to logo element
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.2 Write property test for logo overlay preservation

    - **Property 1: Logo overlay preservation during background replacement**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 9.3 Write property test for logo compositing order


    - **Property 2: Logo overlay compositing order**
    - **Validates: Requirements 1.4**
  - [x] 9.4 Integrate guardrail into handleChangeBackground in Editor.tsx


    - Capture logo state before calling replaceBackground
    - Restore logo state after operation completes
    - Ensure logo is composited on top of result
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 10. Add tour reset option in settings






  - [x] 10.1 Add reset tour button to settings/profile section

    - Call resetTourCount() on click
    - Show confirmation message
    - _Requirements: 2.5_

- [x] 11. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
