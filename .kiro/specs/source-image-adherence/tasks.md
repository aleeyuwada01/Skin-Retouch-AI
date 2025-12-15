# Implementation Plan

- [x] 1. Add SOURCE_ADHERENCE_GUARDRAIL constant








  - [x] 1.1 Create the SOURCE_ADHERENCE_GUARDRAIL constant in constants.ts

    - Add new exported constant with explicit source adherence instructions
    - Include CRITICAL header, mandatory requirements, absolute prohibitions, and allowed modifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3_
  - [x] 1.2 Write property test for guardrail content







    - **Property 5: Guardrail specifies allowed modifications**
    - Verify guardrail contains required keywords: "RETOUCH", "NOT generation", "PRESERVE", "PROHIBITIONS"
    - **Validates: Requirements 1.2, 1.3, 1.4, 3.1, 3.2, 3.3**

- [x] 2. Update SYSTEM_INSTRUCTION with source adherence priority






  - [x] 2.1 Modify SYSTEM_INSTRUCTION in constants.ts

    - Prepend source adherence directive as highest priority instruction
    - Add explicit statement that AI is a photo retoucher, not image generator
    - _Requirements: 2.4_

  - [x] 2.2 Write property test for system instruction

    - **Property 4: System instruction contains source adherence directives**
    - Verify SYSTEM_INSTRUCTION contains source adherence keywords
    - **Validates: Requirements 2.4**




- [x] 3. Integrate guardrail into GeminiService


  - [x] 3.1 Update enhanceImage() to prepend guardrail


    - Import SOURCE_ADHERENCE_GUARDRAIL from constants
    - Prepend guardrail to promptText before style-specific content
    - Ensure guardrail is included for all style types including Custom
    - _Requirements: 1.1, 2.1, 2.2_

  - [x] 3.2 Write property test for enhanceImage guardrail inclusion

    - **Property 1: Guardrail inclusion in all style prompts**
    - **Property 2: Guardrail inclusion for custom prompts**
    - Test that for any style, the prompt includes SOURCE_ADHERENCE_GUARDRAIL
    - **Validates: Requirements 1.1, 2.1, 2.2**
  - [x] 3.3 Update reEnhanceImage() to include guardrail


    - Prepend SOURCE_ADHERENCE_GUARDRAIL to the re-enhance prompt
    - _Requirements: 2.3_

  - [x] 3.4 Write property test for reEnhanceImage guardrail inclusion

    - **Property 3: Guardrail inclusion in re-enhance operations**
    - Verify re-enhance prompt includes guardrail
    - **Validates: Requirements 2.3**

- [x] 4. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
