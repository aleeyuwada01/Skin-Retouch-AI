# Requirements Document

## Introduction

This feature migrates the existing text-based prompts for retouch styles, background rules, safeguards, and base prompts in `constants.ts` to a structured JSON format. The JSON format provides better organization, machine-readability, and compatibility with image generation models that expect structured input. The migration covers: style configurations (Sculpted Glow, Dark Skin Glow, Gilded Editorial, Ultra Glam, Soft Beauty), the SOURCE_ADHERENCE_GUARDRAIL, the BASE_RETOUCH template, and the SYSTEM_INSTRUCTION.

## Glossary

- **Retouch Style**: A predefined configuration that defines how skin retouching should be applied (e.g., Sculpted Glow, Ultra Glam)
- **Prompt**: Text instructions sent to the AI model describing the desired retouching operation
- **JSON Prompt Schema**: A structured JSON format that encodes retouching instructions with explicit fields for task type, style profile, retouching steps, and global settings
- **Guardrail**: Safety instructions that prevent the AI from generating new images instead of retouching existing ones
- **Base Retouch**: The foundational retouching instructions applied to all styles
- **Retouching Step**: A discrete operation in the retouching pipeline (e.g., skin smoothing, dodge & burn, eye whitening)
- **Style Config**: The TypeScript interface defining a retouch style's properties

## Requirements

### Requirement 1

**User Story:** As a developer, I want retouch style prompts stored in JSON format, so that image generation models can parse and process them more reliably.

#### Acceptance Criteria

1. WHEN the system loads a retouch style THEN the system SHALL retrieve the prompt as a valid JSON object conforming to the defined schema
2. WHEN a JSON prompt is serialized THEN the system SHALL produce a string that can be deserialized back to an equivalent JSON object
3. WHEN a style prompt JSON is parsed THEN the system SHALL validate that all required fields (task_type, style_profile, retouching_steps, global_style) are present
4. WHEN the system formats a JSON prompt for the AI model THEN the system SHALL produce a properly formatted JSON string

### Requirement 2

**User Story:** As a developer, I want the JSON schema to support all existing retouch styles, so that no functionality is lost during migration.

#### Acceptance Criteria

1. WHEN migrating Sculpted Glow style THEN the system SHALL preserve all retouching steps including skin perfection, dodge & burn, and eye enhancement
2. WHEN migrating Dark Skin Glow style THEN the system SHALL preserve melanin-specific instructions and hyperpigmentation handling
3. WHEN migrating Gilded Editorial style THEN the system SHALL preserve high-intensity luminosity and heavy contouring parameters
4. WHEN migrating Ultra Glam style THEN the system SHALL preserve extreme smoothing (0.90+ intensity) and maximum highlight settings
5. WHEN migrating Soft Beauty style THEN the system SHALL preserve moderate smoothing and subtle glow parameters

### Requirement 3

**User Story:** As a developer, I want the SOURCE_ADHERENCE_GUARDRAIL converted to JSON format, so that safety constraints are structured and machine-readable.

#### Acceptance Criteria

1. WHEN the guardrail JSON is loaded THEN the system SHALL contain explicit fields for mandatory requirements, absolute prohibitions, and allowed modifications
2. WHEN the guardrail is applied THEN the system SHALL include all original prohibitions (no new person generation, no scene changes, no identity alteration)
3. WHEN the guardrail JSON is serialized and deserialized THEN the system SHALL produce an equivalent guardrail object

### Requirement 4

**User Story:** As a developer, I want the BASE_RETOUCH template converted to JSON format, so that foundational retouching steps are structured and reusable.

#### Acceptance Criteria

1. WHEN the base retouch JSON is loaded THEN the system SHALL contain all 9 retouching steps (segmentation, skin evening, texture preservation, dodge & burn, blemish removal, cross-region harmony, eye whitening, teeth whitening, final check)
2. WHEN a style extends the base retouch THEN the system SHALL merge style-specific steps with base steps without losing base functionality
3. WHEN the base retouch JSON is serialized and deserialized THEN the system SHALL produce an equivalent base retouch object

### Requirement 5

**User Story:** As a developer, I want the SYSTEM_INSTRUCTION converted to JSON format, so that global AI behavior rules are structured and consistent.

#### Acceptance Criteria

1. WHEN the system instruction JSON is loaded THEN the system SHALL contain fields for critical rules, absolute restrictions, and the retouching process
2. WHEN the system instruction is applied THEN the system SHALL include all original restrictions (no cropping, no teeth addition, single image output)
3. WHEN the system instruction JSON is serialized and deserialized THEN the system SHALL produce an equivalent system instruction object

### Requirement 6

**User Story:** As a developer, I want utility functions to convert between JSON prompts and string prompts, so that backward compatibility is maintained.

#### Acceptance Criteria

1. WHEN a JSON prompt is converted to string format THEN the system SHALL produce a human-readable string suitable for models that expect text prompts
2. WHEN a legacy string prompt exists THEN the system SHALL provide a migration path to convert it to JSON format
3. WHEN the conversion functions are used THEN the system SHALL preserve all semantic meaning from the original prompt

### Requirement 8

**User Story:** As a developer, I want the existing behavior of adding base rules to styles preserved, so that JSON concatenation maintains the same functionality as the current text-based approach.

#### Acceptance Criteria

1. WHEN a style prompt references BASE_RETOUCH THEN the system SHALL include all base retouching steps in the final JSON output
2. WHEN concatenating base JSON with style JSON THEN the system SHALL produce a valid combined JSON object (not invalid nested JSON)
3. WHEN the combined JSON is sent to the AI model THEN the system SHALL maintain the same semantic meaning as the current text concatenation approach
4. WHEN style-specific steps override base steps THEN the system SHALL apply the style-specific values while preserving non-conflicting base rules

### Requirement 7

**User Story:** As a developer, I want TypeScript interfaces for all JSON prompt structures, so that type safety is enforced throughout the codebase.

#### Acceptance Criteria

1. WHEN defining JSON prompt types THEN the system SHALL export TypeScript interfaces for RetouchPromptJSON, GuardrailJSON, BaseRetouchJSON, and SystemInstructionJSON
2. WHEN a JSON prompt object is created THEN the system SHALL validate it against the corresponding TypeScript interface at compile time
3. WHEN the interfaces are used THEN the system SHALL provide autocomplete and type checking in the IDE
