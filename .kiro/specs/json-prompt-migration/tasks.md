 # Implementation Plan

- [x] 1. Define TypeScript interfaces for JSON prompt structures





  - [x] 1.1 Create RetouchingStep, OutputSettings, GlobalStyle interfaces in types.ts


    - Define step_name, target_area, operation, intensity, value, details fields
    - _Requirements: 7.1_

  - [x] 1.2 Create RetouchPromptJSON interface in types.ts

    - Include task_type, input_image_id, style_profile, output_settings, retouching_steps, global_style, metadata
    - _Requirements: 1.1, 7.1_

  - [x] 1.3 Create GuardrailJSON interface in types.ts

    - Include protocol, mandatory_requirements, absolute_prohibitions, allowed_modifications, identity_rule
    - _Requirements: 3.1, 7.1_
  - [x] 1.4 Create SystemInstructionJSON interface in types.ts


    - Include role, absolute_rule, source_adherence, goal, critical_rules, absolute_restrictions, retouching_process, final_check
    - _Requirements: 5.1, 7.1_
  - [x] 1.5 Update StyleConfig interface to include promptJson field


    - Add optional promptJson: RetouchPromptJSON field alongside existing prompt string
    - _Requirements: 7.1_

- [x] 2. Create JSON schema validation utility






  - [x] 2.1 Create validateRetouchPromptJSON function in constants.ts

    - Validate required fields: task_type, style_profile, retouching_steps, global_style
    - Return validation result with missing fields list
    - _Requirements: 1.3_

  - [x] 2.2 Write property test for schema validation

    - **Property 2: Schema Validation Completeness**
    - **Validates: Requirements 1.3**

- [x] 3. Create BASE_RETOUCH_JSON constant






  - [x] 3.1 Convert BASE_RETOUCH text to JSON structure in constants.ts

    - Create all 9 retouching steps with proper structure
    - Include output_settings and global_style
    - _Requirements: 4.1_

  - [x] 3.2 Write property test for base retouch round trip

    - **Property 4: Base Retouch Round Trip**
    - **Validates: Requirements 4.3**

- [x] 4. Create GUARDRAIL_JSON constant






  - [x] 4.1 Convert SOURCE_ADHERENCE_GUARDRAIL to JSON structure in constants.ts

    - Extract mandatory_requirements as array
    - Extract absolute_prohibitions as array
    - Extract allowed_modifications as array
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Write property test for guardrail round trip

    - **Property 3: Guardrail Round Trip**
    - **Validates: Requirements 3.3**

- [x] 5. Create SYSTEM_INSTRUCTION_JSON constant






  - [x] 5.1 Convert SYSTEM_INSTRUCTION to JSON structure in constants.ts

    - Extract critical_rules as array
    - Extract absolute_restrictions as array
    - Convert retouching process to RetouchingStep array
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Write property test for system instruction round trip

    - **Property 5: System Instruction Round Trip**
    - **Validates: Requirements 5.3**

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Migrate style prompts to JSON format





  - [x] 7.1 Create SCULPTED_GLOW_JSON with style-specific retouching steps


    - Include skin perfection, dodge & burn, eye enhancement steps
    - _Requirements: 2.1_

  - [x] 7.2 Create DARK_SKIN_GLOW_JSON with melanin-specific instructions
    - Include hyperpigmentation handling, undertone preservation steps

    - _Requirements: 2.2_
  - [x] 7.3 Create GILDED_EDITORIAL_JSON with high-intensity parameters

    - Include luminosity steps with high intensity values
    - _Requirements: 2.3_
  - [x] 7.4 Create ULTRA_GLAM_JSON with extreme settings

    - Set smoothing intensity >= 0.95
    - Include extreme highlight and contour steps
    - _Requirements: 2.4_

  - [x] 7.5 Create SOFT_BEAUTY_JSON with moderate parameters
    - Include moderate smoothing and subtle glow steps
    - _Requirements: 2.5_
  - [x] 7.6 Write property test for JSON serialization round trip

    - **Property 1: JSON Serialization Round Trip**
    - **Validates: Requirements 1.2**

- [x] 8. Create merge utility function





  - [x] 8.1 Implement mergeRetouchPrompts function in constants.ts


    - Combine base retouching_steps with style-specific steps
    - Deep merge global_style with style values taking precedence
    - Handle output_settings override
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 8.2 Write property test for merge preserves base steps

    - **Property 6: Merge Preserves Base Steps**
    - **Validates: Requirements 4.2, 8.1**

  - [x] 8.3 Write property test for merge produces valid JSON

    - **Property 7: Merge Produces Valid JSON**
    - **Validates: Requirements 8.2**


  - [x] 8.4 Write property test for style override precedence





    - **Property 8: Style Override Precedence**
    - **Validates: Requirements 8.4**

- [x] 9. Create format utility function






  - [x] 9.1 Implement formatPromptForModel function in constants.ts

    - Convert RetouchPromptJSON to formatted JSON string
    - Ensure output is valid JSON
    - _Requirements: 1.4, 6.1_

  - [x] 9.2 Write property test for format output validity

    - **Property 9: Format Output is Valid JSON**
    - **Validates: Requirements 1.4**

- [x] 10. Update STYLES array with JSON prompts






  - [x] 10.1 Add promptJson field to each style in STYLES array

    - Use mergeRetouchPrompts to combine BASE_RETOUCH_JSON with style JSON
    - Keep legacy prompt field for backward compatibility
    - _Requirements: 1.1, 8.1_

  - [x] 10.2 Write unit tests for style JSON structures

    - Verify each style has expected step names
    - Verify Ultra Glam intensity >= 0.90
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
