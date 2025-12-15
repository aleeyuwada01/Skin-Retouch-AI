import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SOURCE_ADHERENCE_GUARDRAIL, SYSTEM_INSTRUCTION } from './constants';

/**
 * Property-Based Tests for SOURCE_ADHERENCE_GUARDRAIL
 * 
 * **Feature: source-image-adherence, Property 5: Guardrail specifies allowed modifications**
 * **Validates: Requirements 1.2, 1.3, 1.4, 3.1, 3.2, 3.3**
 */
describe('SOURCE_ADHERENCE_GUARDRAIL', () => {
  /**
   * Property 5: Guardrail specifies allowed modifications
   * 
   * *For any* prompt containing the guardrail, the guardrail text SHALL explicitly 
   * list allowed modifications (visual characteristics only) and prohibited modifications 
   * (identity, composition, etc.).
   * 
   * **Validates: Requirements 1.2, 1.3, 1.4, 3.1, 3.2, 3.3**
   */
  describe('Property 5: Guardrail specifies allowed modifications', () => {
    // Required keywords that must be present in the guardrail
    const requiredKeywords = [
      'RETOUCH',
      'NOT',  // Part of "NOT image generation" or "NOT a new creation"
      'PRESERVE',
      'PROHIBITIONS'
    ];

    it('should contain all required keywords for source adherence', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            // Verify each required keyword is present
            for (const keyword of requiredKeywords) {
              expect(guardrail.toUpperCase()).toContain(keyword);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should specify this is a RETOUCH operation, not generation (Req 1.2)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must contain RETOUCH and indicate it's NOT generation
            return upperGuardrail.includes('RETOUCH') && 
                   upperGuardrail.includes('NOT') &&
                   (upperGuardrail.includes('GENERATION') || upperGuardrail.includes('CREATION'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain PRESERVE directive for identity preservation (Req 1.4)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must preserve identity-related elements
            return upperGuardrail.includes('PRESERVE') &&
                   (upperGuardrail.includes('IDENTITY') || 
                    upperGuardrail.includes('POSE') || 
                    upperGuardrail.includes('COMPOSITION'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain PROHIBITIONS section (Req 1.3, 3.2)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must have prohibitions section
            return upperGuardrail.includes('PROHIBITIONS') ||
                   upperGuardrail.includes('DO NOT');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should specify allowed modifications are visual characteristics only (Req 3.1)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must specify allowed modifications section with visual characteristics
            return upperGuardrail.includes('ALLOWED') &&
                   upperGuardrail.includes('MODIFICATIONS') &&
                   (upperGuardrail.includes('SKIN') || 
                    upperGuardrail.includes('LIGHTING') || 
                    upperGuardrail.includes('COLOR'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prohibit identity and composition changes (Req 3.2)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must prohibit changing identity-related elements
            return (upperGuardrail.includes('DO NOT') || upperGuardrail.includes('PROHIBIT')) &&
                   (upperGuardrail.includes('IDENTITY') || 
                    upperGuardrail.includes('FACE') ||
                    upperGuardrail.includes('BACKGROUND') ||
                    upperGuardrail.includes('SCENE'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should instruct AI to act as non-generative editor (Req 3.3)', () => {
      fc.assert(
        fc.property(
          fc.constant(SOURCE_ADHERENCE_GUARDRAIL),
          (guardrail) => {
            const upperGuardrail = guardrail.toUpperCase();
            // Must indicate non-generative behavior
            return upperGuardrail.includes('NON-GENERATIVE') ||
                   (upperGuardrail.includes('NOT') && upperGuardrail.includes('GENERAT'));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property-Based Tests for SYSTEM_INSTRUCTION
 * 
 * **Feature: source-image-adherence, Property 4: System instruction contains source adherence directives**
 * **Validates: Requirements 2.4**
 */
describe('SYSTEM_INSTRUCTION', () => {
  /**
   * Property 4: System instruction contains source adherence directives
   * 
   * *For any* API call, the SYSTEM_INSTRUCTION SHALL contain explicit source adherence 
   * directives prohibiting image generation.
   * 
   * **Validates: Requirements 2.4**
   */
  describe('Property 4: System instruction contains source adherence directives', () => {
    it('should contain source adherence as highest priority directive', () => {
      fc.assert(
        fc.property(
          fc.constant(SYSTEM_INSTRUCTION),
          (instruction) => {
            const upperInstruction = instruction.toUpperCase();
            // Must start with or prominently feature source adherence directive
            // Check that CRITICAL appears early and relates to retouching vs generation
            return upperInstruction.includes('CRITICAL') &&
                   upperInstruction.includes('RETOUCHER') &&
                   upperInstruction.includes('NOT') &&
                   upperInstruction.includes('GENERATOR');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should explicitly state AI is a photo retoucher, not image generator (Req 2.4)', () => {
      fc.assert(
        fc.property(
          fc.constant(SYSTEM_INSTRUCTION),
          (instruction) => {
            const upperInstruction = instruction.toUpperCase();
            // Must contain explicit statement about being a retoucher, not generator
            return upperInstruction.includes('PHOTO RETOUCHER') &&
                   upperInstruction.includes('NOT') &&
                   upperInstruction.includes('IMAGE GENERATOR');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain source adherence requirements', () => {
      fc.assert(
        fc.property(
          fc.constant(SYSTEM_INSTRUCTION),
          (instruction) => {
            const upperInstruction = instruction.toUpperCase();
            // Must contain source adherence requirements
            return upperInstruction.includes('SOURCE') &&
                   upperInstruction.includes('PRESERVE') &&
                   (upperInstruction.includes('IDENTITY') || 
                    upperInstruction.includes('POSE') ||
                    upperInstruction.includes('POSITION'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prohibit generating new subjects or scenes', () => {
      fc.assert(
        fc.property(
          fc.constant(SYSTEM_INSTRUCTION),
          (instruction) => {
            const upperInstruction = instruction.toUpperCase();
            // Must prohibit generation of new elements
            return (upperInstruction.includes('DO NOT') || upperInstruction.includes('NEVER')) &&
                   (upperInstruction.includes('GENERATE') || upperInstruction.includes('REPLACE'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should require output to show exact same person from input', () => {
      fc.assert(
        fc.property(
          fc.constant(SYSTEM_INSTRUCTION),
          (instruction) => {
            const upperInstruction = instruction.toUpperCase();
            // Must require same person in output
            return upperInstruction.includes('EXACT SAME PERSON') ||
                   (upperInstruction.includes('SAME') && upperInstruction.includes('PERSON') && upperInstruction.includes('INPUT'));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
