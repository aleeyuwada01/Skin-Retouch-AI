# Requirements Document

## Introduction

This document specifies requirements for adding a source adherence guardrail to the existing image retouching system. The current style prompts work correctly for retouching, but the AI occasionally ignores the source image and generates entirely new images. This feature adds a protective guardrail layer that explicitly instructs the AI to treat the operation as retouching (not generation) and strictly adhere to the provided source image.

## Glossary

- **Source Image**: The original image uploaded by the user for retouching
- **Source Adherence Guardrail**: A set of explicit instructions prepended to all prompts that enforce retouching behavior over generation
- **Retouching System**: The GeminiService class that processes images through the Gemini API
- **SYSTEM_INSTRUCTION**: The system-level instruction sent to Gemini that defines the AI's role and constraints
- **Prompt Prefix**: Instructions added before the style-specific prompt to enforce source adherence
- **Identity Preservation**: Maintaining the recognizable features and characteristics of subjects in the source image

## Requirements

### Requirement 1

**User Story:** As a user, I want the AI to always retouch my uploaded image rather than generate a new one, so that I get an enhanced version of my actual photo.

#### Acceptance Criteria

1. WHEN a source image is submitted for retouching THEN the Retouching System SHALL prepend source adherence guardrail instructions to the prompt
2. WHEN the guardrail is applied THEN the Retouching System SHALL explicitly instruct the AI that this is a RETOUCH operation, not image generation
3. WHEN the guardrail is applied THEN the Retouching System SHALL prohibit the AI from creating new subjects, replacing subjects, or generating new scenes
4. WHEN the guardrail is applied THEN the Retouching System SHALL instruct the AI to preserve the exact subject identity, pose, composition, and background from the source image

### Requirement 2

**User Story:** As a developer, I want the source adherence guardrail to be applied consistently across all retouch operations, so that the protection is comprehensive.

#### Acceptance Criteria

1. WHEN any retouch style is selected THEN the Retouching System SHALL include the source adherence guardrail in the final prompt
2. WHEN a custom prompt is provided THEN the Retouching System SHALL wrap the custom instruction with source adherence guardrails
3. WHEN the re-enhance operation is triggered THEN the Retouching System SHALL include the source adherence guardrail
4. WHEN the SYSTEM_INSTRUCTION is configured THEN the Retouching System SHALL include source adherence directives at the highest priority level

### Requirement 3

**User Story:** As a user, I want the guardrail to clearly define what the AI can and cannot modify, so that enhancements are limited to visual characteristics only.

#### Acceptance Criteria

1. WHEN the guardrail is applied THEN the Retouching System SHALL specify that only visual characteristics (lighting, color, texture, contrast, skin smoothing) may be modified
2. WHEN the guardrail is applied THEN the Retouching System SHALL prohibit modifications to subject identity, facial structure, body shape, clothing, and scene composition
3. WHEN the guardrail is applied THEN the Retouching System SHALL instruct the AI to act as a non-generative photo editor
