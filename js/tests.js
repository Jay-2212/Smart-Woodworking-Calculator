/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * TESTS & VERIFICATION MODULE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains all test functions to verify calculation accuracy.
 * Run these in the browser console (F12) to ensure calculations are correct.
 * 
 * FILE LOCATION: js/tests.js
 * 
 * DEPENDENCIES:
 * - js/constants.js (must be loaded first)
 *   - Uses: INCHES_PER_FOOT, CUBIC_INCH_TO_CFT_DIVISOR
 * - js/calculations.js (must be loaded first)
 *   - Uses: getPurchasedFeet, calculateLineCFT, getSizeDims, calculateCrateEffectiveLength
 * 
 * HOW TO RUN:
 * 1. Open the app in a browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Tests run automatically on page load
 * 5. Look for ✅ (pass) or ❌ (fail) indicators
 * 
 * TEST CATEGORIES:
 * - TEST 1: Purchased Feet Calculation
 * - TEST 2: CFT Calculation
 * - TEST 3: Size Dimensions Lookup
 * - TEST 4: Crate Gap Calculation
 * - TEST 5: Edge Cases - Input Validation
 * - TEST 6: More Crate Gap Scenarios
 * - TEST 7: Runner Thresholds
 * 
 * ================================================================================
 */

// ================================================================================
// DEPENDENCY CHECK
// ================================================================================

if (!window.AppConstants) {
    console.error('ERROR: js/constants.js must be loaded before js/tests.js');
}

if (!window.AppCalculations) {
    console.error('ERROR: js/calculations.js must be loaded before js/tests.js');
}

// Get constants and calculation functions
const { INCHES_PER_FOOT, CUBIC_INCH_TO_CFT_DIVISOR } = window.AppConstants;
const { 
    getPurchasedFeet, 
    calculateLineCFT, 
    getSizeDims, 
    calculateCrateEffectiveLength 
} = window.AppCalculations;

// ================================================================================
// TEST SUITE
// ================================================================================

/**
 * Main Test Suite
 * 
 * Runs all tests and outputs results to the browser console.
 * Each test includes:
 * - What is being tested
 * - Expected result
 * - Actual result
 * - Pass/fail indicator
 * 
 * ADDING NEW TESTS:
 * 1. Create a new test section with console.log header
 * 2. Define test inputs and expected outputs
 * 3. Run the function being tested
 * 4. Compare result with expected value
 * 5. Log ✅ for pass, ❌ for fail
 */
function runTests() {
    console.log("🧪 ==================== RUNNING TESTS ====================");
    console.log("");

    // ================================================================
    // TEST 1: Purchased Feet Calculation
    // Tests: getPurchasedFeet() from js/calculations.js
    // 
    // Business Rule: Wood is sold in 0.5 foot increments
    // ================================================================
    
    console.log("📊 TEST 1: Purchased Feet Calculation");
    console.log("   Testing: getPurchasedFeet() from js/calculations.js");
    console.log("   Business Rule: Round up to nearest 0.5 ft increment");
    console.log("");
    
    const test1a = getPurchasedFeet(12);  // 12" = 1.0 ft exactly
    const test1b = getPurchasedFeet(15);  // 15" = 1.25 ft → buy 1.5 ft
    const test1c = getPurchasedFeet(19);  // 19" = 1.58 ft → buy 2.0 ft
    const test1d = getPurchasedFeet(24);  // 24" = 2.0 ft exactly

    console.log(test1a === 1.0 ? "✅ 12 inches = 1.0 ft" : `❌ FAILED: Expected 1.0, got ${test1a}`);
    console.log(test1b === 1.5 ? "✅ 15 inches = 1.5 ft" : `❌ FAILED: Expected 1.5, got ${test1b}`);
    console.log(test1c === 2.0 ? "✅ 19 inches = 2.0 ft" : `❌ FAILED: Expected 2.0, got ${test1c}`);
    console.log(test1d === 2.0 ? "✅ 24 inches = 2.0 ft" : `❌ FAILED: Expected 2.0, got ${test1d}`);
    console.log("");

    // ================================================================
    // TEST 2: CFT Calculation
    // Tests: calculateLineCFT() from js/calculations.js
    // 
    // Formula: (feet × width × thickness) / 144 × qty
    // ================================================================
    
    console.log("📊 TEST 2: CFT Calculation");
    console.log("   Testing: calculateLineCFT() from js/calculations.js");
    console.log("   Formula: (feet × width × thickness) / 144 × qty");
    console.log("");
    
    const test2a = calculateLineCFT(24, 3, 1, 1);  // 2ft × 3" × 1" × 1pc = 0.5 CFT
    const test2b = calculateLineCFT(24, 3, 1, 2);  // Same but 2 pieces = 1.0 CFT

    console.log(test2a.toFixed(2) === "0.50" ? "✅ 24×3×1×1 = 0.50 CFT" : `❌ FAILED: Expected 0.50, got ${test2a.toFixed(2)}`);
    console.log(test2b.toFixed(2) === "1.00" ? "✅ 24×3×1×2 = 1.00 CFT" : `❌ FAILED: Expected 1.00, got ${test2b.toFixed(2)}`);
    console.log("");

    // ================================================================
    // TEST 3: Size Dimensions Lookup
    // Tests: getSizeDims() from js/calculations.js
    // 
    // Verifies dimension lookup table is correct
    // ================================================================
    
    console.log("📊 TEST 3: Size Dimensions Lookup");
    console.log("   Testing: getSizeDims() from js/calculations.js");
    console.log("   Verifies: Size codes map to correct width × thickness");
    console.log("");
    
    const test3a = getSizeDims('3x1');
    const test3b = getSizeDims('4x2');

    console.log(test3a.w === 3 && test3a.t === 1 ? "✅ '3x1' = {w:3, t:1}" : `❌ FAILED: Got ${JSON.stringify(test3a)}`);
    console.log(test3b.w === 4 && test3b.t === 2 ? "✅ '4x2' = {w:4, t:2}" : `❌ FAILED: Got ${JSON.stringify(test3b)}`);
    console.log("");

    // ================================================================
    // TEST 4: Crate Gap Calculation
    // Tests: calculateCrateEffectiveLength() from js/calculations.js
    // 
    // Calculates actual wood needed when planks have gaps
    // ================================================================
    
    console.log("📊 TEST 4: Crate Gap Calculation");
    console.log("   Testing: calculateCrateEffectiveLength() from js/calculations.js");
    console.log("   Scenario: 20\" span, 4\" planks, 4\" gaps");
    console.log("   Expected: ceil(20/8) = 3 planks × 4\" = 12\" wood");
    console.log("");
    
    const test4a = calculateCrateEffectiveLength(20, 4, 4);
    console.log(test4a === 12 ? "✅ 20\" span with 4\" planks + 4\" gaps = 12\" wood" : `❌ FAILED: Expected 12, got ${test4a}`);
    console.log("");

    // ================================================================
    // TEST 5: Edge Cases - Input Validation
    // Tests: All calculation functions with invalid inputs
    // 
    // Ensures functions handle edge cases gracefully
    // ================================================================
    
    console.log("📊 TEST 5: Edge Cases - Input Validation");
    console.log("   Testing: calculateLineCFT(), getPurchasedFeet() with invalid inputs");
    console.log("");
    
    // Zero inputs
    const test5a = calculateLineCFT(0, 3, 1, 1);
    console.log(test5a === 0 ? "✅ Zero length = 0 CFT" : `❌ FAILED: Expected 0, got ${test5a}`);
    
    // Negative inputs
    const test5b = calculateLineCFT(-10, 3, 1, 1);
    console.log(test5b === 0 ? "✅ Negative input = 0 CFT" : `❌ FAILED: Expected 0, got ${test5b}`);
    
    // NaN inputs
    const test5c = calculateLineCFT(NaN, 3, 1, 1);
    console.log(test5c === 0 ? "✅ NaN input = 0 CFT" : `❌ FAILED: Expected 0, got ${test5c}`);
    
    // Large dimension test
    const test5d = calculateLineCFT(120, 4, 2, 1);  // 120" = 10 ft × 4" × 2" = 0.556 CFT
    const expectedFeet = 120 / INCHES_PER_FOOT;  // 10 feet
    const expected5d = ((expectedFeet * 4 * 2) / CUBIC_INCH_TO_CFT_DIVISOR);
    console.log(Math.abs(test5d - expected5d) < 0.01 ? "✅ Large dimension (10ft) works" : `❌ FAILED: Expected ${expected5d}, got ${test5d}`);
    
    // getPurchasedFeet with invalid inputs
    const test5e = getPurchasedFeet(-5);
    console.log(test5e === 0 ? "✅ getPurchasedFeet with negative = 0" : `❌ FAILED: Expected 0, got ${test5e}`);
    
    const test5f = getPurchasedFeet(NaN);
    console.log(test5f === 0 ? "✅ getPurchasedFeet with NaN = 0" : `❌ FAILED: Expected 0, got ${test5f}`);
    console.log("");

    // ================================================================
    // TEST 6: More Crate Gap Scenarios
    // Tests: calculateCrateEffectiveLength() with various configurations
    // ================================================================
    
    console.log("📊 TEST 6: More Crate Gap Scenarios");
    console.log("   Testing: calculateCrateEffectiveLength() edge cases");
    console.log("");
    
    // Gap = 0 (no gaps, planks touch each other)
    const test6a = calculateCrateEffectiveLength(20, 4, 0);
    const expected6a = Math.ceil(20/4) * 4;  // ceil(20/4) = 5 planks × 4" = 20"
    console.log(test6a === expected6a ? "✅ No gap = full plank coverage" : `❌ FAILED: Expected ${expected6a}, got ${test6a}`);
    
    // Gap larger than plank
    const test6b = calculateCrateEffectiveLength(30, 4, 8);  // 4" plank, 8" gap = 12" unit
    const expected6b = Math.ceil(30/12) * 4;  // ceil(30/12) = 3 planks × 4" = 12"
    console.log(test6b === expected6b ? "✅ Large gap works" : `❌ FAILED: Expected ${expected6b}, got ${test6b}`);
    
    // Exact fit scenario
    const test6c = calculateCrateEffectiveLength(24, 4, 4);  // 24" with 8" units = exactly 3 units
    const expected6c = 3 * 4;  // 3 planks × 4" = 12"
    console.log(test6c === expected6c ? "✅ Exact fit works" : `❌ FAILED: Expected ${expected6c}, got ${test6c}`);
    
    // Invalid inputs
    const test6d = calculateCrateEffectiveLength(-10, 4, 4);
    console.log(test6d === 0 ? "✅ Negative span = 0" : `❌ FAILED: Expected 0, got ${test6d}`);
    console.log("");

    // ================================================================
    // TEST 7: Runner Thresholds
    // Tests: Runner recommendation logic
    // 
    // Threshold Logic (from js/constants.js):
    // - > 70": 5 runners
    // - > 60": 4 runners
    // - > 50": 3 runners
    // - Otherwise: 2 runners (minimum)
    // ================================================================
    
    console.log("📊 TEST 7: Runner Thresholds");
    console.log("   Testing: Runner recommendation logic");
    console.log("   Thresholds: >70\"=5, >60\"=4, >50\"=3, else=2");
    console.log("");
    
    // Note: This logic is defined in js/app.js getRecommendedRunnerCount
    // We replicate it here for testing
    const testRunnerLogic = (len) => {
        const l = parseFloat(len) || 0;
        const thresholds = [
            { min: 70, count: 5 },
            { min: 60, count: 4 },
            { min: 50, count: 3 }
        ];
        for (const { min, count } of thresholds) {
            if (l > min) return count;
        }
        return 2; // MIN_RUNNER_COUNT
    };
    
    const test7a = testRunnerLogic(45);  // < 50" → 2 runners
    const test7b = testRunnerLogic(55);  // 50 < x ≤ 60 → 3 runners
    const test7c = testRunnerLogic(65);  // 60 < x ≤ 70 → 4 runners
    const test7d = testRunnerLogic(75);  // > 70" → 5 runners
    
    console.log(test7a === 2 ? "✅ 45\" = 2 runners" : `❌ FAILED: Expected 2, got ${test7a}`);
    console.log(test7b === 3 ? "✅ 55\" = 3 runners" : `❌ FAILED: Expected 3, got ${test7b}`);
    console.log(test7c === 4 ? "✅ 65\" = 4 runners" : `❌ FAILED: Expected 4, got ${test7c}`);
    console.log(test7d === 5 ? "✅ 75\" = 5 runners" : `❌ FAILED: Expected 5, got ${test7d}`);
    console.log("");

    // ================================================================
    // TEST SUMMARY
    // ================================================================
    
    console.log("🎯 All calculation tests complete!");
    console.log("");
    console.log("===============================================================");
    console.log("📁 File Dependencies:");
    console.log("   - js/constants.js → INCHES_PER_FOOT, CUBIC_INCH_TO_CFT_DIVISOR");
    console.log("   - js/calculations.js → All calculation functions");
    console.log("===============================================================");
}

// ================================================================================
// EXPORTS AND AUTO-RUN
// ================================================================================

// Attach to window for manual re-running
window.AppTests = {
    runTests
};

// Auto-run tests when this script loads
runTests();
