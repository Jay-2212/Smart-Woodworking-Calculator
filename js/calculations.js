/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * CALCULATIONS MODULE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains all pure calculation functions for wood CFT (Cubic Feet) calculations.
 * These are pure functions with no UI dependencies - just math and business logic.
 * 
 * FILE LOCATION: js/calculations.js
 * 
 * DEPENDENCIES:
 * - js/constants.js (must be loaded first)
 *   - Uses: HALF_FOOT_THRESHOLD, CUBIC_INCH_TO_CFT_DIVISOR, INCHES_PER_FOOT, isInvalidNumber
 * 
 * USED BY:
 * - js/components.js (CalculationRow, SupportCard use these for CFT display)
 * - js/app.js (main calculation totals)
 * - js/three-scene.js (getSizeDims for 3D rendering dimensions)
 * - js/tests.js (unit tests verify these functions)
 * 
 * EXPORTS (via window.AppCalculations):
 * - getPurchasedFeet: Converts inches to purchasable feet (0.5 increments)
 * - calculateLineCFT: Calculates CFT for a single line item
 * - getSizeDims: Lookup table for wood size dimensions
 * - getMaxDim: Gets maximum dimension from a size code
 * - calculateCrateEffectiveLength: Calculates wood needed for crates with gaps
 * - getEffectiveCrateDims: Adjusts crate dimensions based on gap settings
 * 
 * ================================================================================
 */

// ================================================================================
// DEPENDENCY CHECK
// Ensure constants are loaded before this module
// ================================================================================

if (!window.AppConstants) {
    console.error('ERROR: js/constants.js must be loaded before js/calculations.js');
}

// Guard against multiple loads
if (!window.AppCalculations) {

// Destructure needed constants for cleaner code
const { HALF_FOOT_THRESHOLD, CUBIC_INCH_TO_CFT_DIVISOR, INCHES_PER_FOOT, isInvalidNumber } = window.AppConstants;

// ================================================================================
// CORE CALCULATION FUNCTIONS
// ================================================================================

/**
 * Calculates how many feet of wood to purchase based on actual inches needed.
 * 
 * BUSINESS RULE:
 * Wood is sold in half-foot increments (0.5, 1.0, 1.5, 2.0, etc.)
 * If actual length falls between increments, round up to next 0.5 or 1.0
 * 
 * EXAMPLES:
 * - 12" (1.0 ft) → Buy 1.0 ft
 * - 15" (1.25 ft) → Buy 1.5 ft (rounds up to next 0.5)
 * - 19" (1.58 ft) → Buy 2.0 ft (rounds up to next 1.0)
 * 
 * @param {number} inches - Actual length needed in inches
 * @returns {number} Feet to purchase (in 0.5 increments)
 * 
 * CONNECTED TO:
 * - calculateLineCFT() - Uses this to convert inches to purchasable feet
 * - SupportCard component - Displays "Purchase" value using this function
 * - Tests in js/tests.js - TEST 1 verifies this function
 */
const getPurchasedFeet = (inches) => {
    // Validate input - return 0 for invalid values
    if (isInvalidNumber(inches)) return 0;
    
    const feet = inches / INCHES_PER_FOOT;
    const whole = Math.floor(feet);
    const fraction = feet - whole;

    if (fraction === 0) return whole;
    if (fraction <= HALF_FOOT_THRESHOLD) return whole + 0.5;
    return whole + 1.0;
};

/**
 * Calculates CFT (Cubic Feet) for a wood piece.
 * 
 * FORMULA: (Length_in_feet × Width_in_inches × Thickness_in_inches) / 12
 * 
 * WHY 12?
 * In woodworking, CFT is the industry standard calculation:
 * - Length is in feet, width and thickness are in inches
 * - Dividing by 12 converts the result to cubic feet
 * - This matches the standard lumber measurement conventions
 * 
 * @param {number} l - Length in inches
 * @param {number} w - Width in inches  
 * @param {number} t - Thickness in inches
 * @param {number} qty - Quantity of pieces
 * @returns {number} Total CFT
 * 
 * CONNECTED TO:
 * - CalculationRow component - Calculates CFT for each table row
 * - App component - getRowCFT() and extra supports use this
 * - Tests in js/tests.js - TEST 2 verifies this function
 */
const calculateLineCFT = (l, w, t, qty) => {
    // Validate all inputs - return 0 for any invalid value
    if (isInvalidNumber(l) || isInvalidNumber(w) || isInvalidNumber(t) || isInvalidNumber(qty)) return 0;
    
    const feet = getPurchasedFeet(l);
    return ((feet * w * t) / CUBIC_INCH_TO_CFT_DIVISOR) * qty;
};

// ================================================================================
// SIZE DIMENSION LOOKUPS
// Maps size codes to actual dimensions
// ================================================================================

/**
 * Wood size dimension lookup table.
 * Common sizes: "3x1" means 3" wide × 1" thick
 * 
 * AVAILABLE SIZES:
 * - '3x1':   3" wide × 1" thick (common for light supports)
 * - '4x1':   4" wide × 1" thick
 * - '3x1.5': 3" wide × 1.5" thick
 * - '4x1.5': 4" wide × 1.5" thick
 * - '3x2':   3" wide × 2" thick
 * - '4x2':   4" wide × 2" thick (common for bottom runners)
 * - '4x3':   4" wide × 3" thick (heavy duty)
 * - '4x4':   4" wide × 4" thick (posts)
 * 
 * @param {string} sizeStr - Size code like "3x1", "4x2", etc.
 * @returns {object} {w: width, t: thickness} in inches
 * 
 * CONNECTED TO:
 * - SupportCard component - Reads dimensions for CFT calculation
 * - ThreeScene component - Uses dimensions for 3D visualization
 * - App component - Auto-calculation uses this for runner dimensions
 * - Tests in js/tests.js - TEST 3 verifies this function
 */
const getSizeDims = (sizeStr) => {
    const map = {
        '3x1': { w: 3, t: 1 },
        '4x1': { w: 4, t: 1 },
        '3x1.5': { w: 3, t: 1.5 },
        '4x1.5': { w: 4, t: 1.5 },
        '3x2': { w: 3, t: 2 },
        '4x2': { w: 4, t: 2 },
        '4x3': { w: 4, t: 3 },
        '4x4': { w: 4, t: 4 }
    };
    return map[sizeStr] || { w: 3, t: 1 }; // Default to 3x1 if not found
};

/**
 * Gets the maximum dimension from a wood size.
 * Used for spacing calculations in 3D visualization.
 * 
 * @param {string} sizeStr - Size code
 * @returns {number} Maximum of width or thickness
 * 
 * CONNECTED TO:
 * - ThreeScene component - Uses for runner spacing
 * - App component - Auto-calculation for side runner lengths
 */
const getMaxDim = (sizeStr) => {
    if (!sizeStr || typeof sizeStr !== 'string') return 0;
    const dims = getSizeDims(sizeStr);
    return Math.max(dims.w, dims.t);
};

// ================================================================================
// CRATE-SPECIFIC CALCULATIONS
// For boxes with gaps between planks (ventilated crates)
// ================================================================================

/**
 * Calculates effective wood length for crates with gaps between planks.
 * 
 * BUSINESS CONTEXT:
 * Crates use planks with gaps for ventilation. If you need to cover 20" width,
 * and each plank is 4" with 4" gaps, you need: ceil(20/(4+4)) = 3 planks
 * Effective wood = 3 planks × 4" = 12" of actual wood
 * 
 * VISUAL EXAMPLE (20" span, 4" planks, 4" gaps):
 * |====|    |====|    |====|
 *  4"   4"   4"   4"   4"
 *  ← ───────── 20" ──────── →
 * 
 * @param {number} span - Total distance to cover (inches)
 * @param {number} plankWidth - Width of each plank (inches)
 * @param {number} gap - Gap between planks (inches)
 * @returns {number} Total inches of wood needed
 * 
 * CONNECTED TO:
 * - getEffectiveCrateDims() - Uses this for dimension adjustments
 * - CalculationRow component - Shows adjusted dimensions for crates
 * - Tests in js/tests.js - TEST 4 and TEST 6 verify this function
 */
const calculateCrateEffectiveLength = (span, plankWidth, gap) => {
    // Validate inputs using consistent helper
    if (isInvalidNumber(span)) return 0;
    if (isInvalidNumber(plankWidth)) return 0;
    // gap can be 0 (no gaps between planks), but not negative
    if (gap === null || gap === undefined || isNaN(gap) || gap < 0) return 0;
    
    const unit = plankWidth + gap;
    const planks = Math.ceil(span / unit);
    return planks * plankWidth;
};

/**
 * Adjusts dimensions for crate parts based on plank gaps.
 * Different parts (Sides, Kara, Top) adjust differently.
 * 
 * ADJUSTMENT RULES BY PART:
 * - Sides: Only height (W) is adjusted for gaps
 * - Kara: Both width (L) and height (W) are adjusted
 * - Top: For crateBottom type, both length and width adjusted
 * 
 * @param {string} partName - 'Sides', 'Kara', or 'Top'
 * @param {number} originalL - Original length
 * @param {number} originalW - Original width
 * @param {string} boxType - 'crateSimple' or 'crateBottom'
 * @param {object} crateSettings - {plank, gap} settings
 * @returns {object} {l, w, note} - Adjusted dimensions and explanation
 * 
 * CONNECTED TO:
 * - CalculationRow component - Uses for displaying adjusted dimensions
 * - App component - getRowCFT() uses for crate CFT calculations
 */
const getEffectiveCrateDims = (partName, originalL, originalW, boxType, crateSettings) => {
    const { plank, gap } = crateSettings;
    if (!plank || !gap) return { l: originalL, w: originalW, note: null };

    let result = { l: originalL, w: originalW, note: null };

    if (partName === 'Sides') {
        // Sides: Only height is adjusted (planks run horizontally)
        const effH = calculateCrateEffectiveLength(originalW, plank, gap);
        result.w = effH;
        result.note = 'Height adjusted for gaps';
    } else if (partName === 'Kara') {
        // Kara (end panels): Both dimensions adjusted
        const effW = calculateCrateEffectiveLength(originalL, plank, gap);
        const effH = calculateCrateEffectiveLength(originalW, plank, gap);
        result.l = effW;
        result.w = effH;
        result.note = 'Width & Height adjusted';
    } else if (partName === 'Top') {
        // Top: Only adjusted for crateBottom type
        if (boxType === 'crateBottom') {
            const effL = calculateCrateEffectiveLength(originalL, plank, gap);
            const effW = calculateCrateEffectiveLength(originalW, plank, gap);
            result.l = effL;
            result.w = effW;
            result.note = 'Length & Width adjusted';
        }
    }

    return result;
};

// ================================================================================
// EXPORTS
// Make calculation functions available globally for other modules
// ================================================================================

// Attach to window object for global access (since we're not using ES modules)
window.AppCalculations = {
    getPurchasedFeet,
    calculateLineCFT,
    getSizeDims,
    getMaxDim,
    calculateCrateEffectiveLength,
    getEffectiveCrateDims
};

} // End guard
