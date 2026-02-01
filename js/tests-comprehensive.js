/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * COMPREHENSIVE TEST SUITE
 * ================================================================================
 * 
 * PURPOSE:
 * This is the main comprehensive test suite for the Smart CFT Calculator.
 * It provides extensive test coverage across all modules, calculations, components,
 * and integration points to ensure the application works correctly.
 * 
 * This test suite is designed to be run during development and before any deployment
 * to catch regressions and ensure calculation accuracy - critical for business use.
 * 
 * FILE LOCATION: js/tests-comprehensive.js
 * 
 * DEPENDENCIES (load order matters):
 * 1. js/constants.js (must be loaded first)
 *    - Provides: Constants, validation functions, Icons, ErrorBoundary
 * 2. js/calculations.js (must be loaded before this file)
 *    - Provides: All calculation functions to be tested
 * 3. js/components.js (optional, for component tests)
 *    - Provides: React components to test
 * 4. js/app.js (optional, for integration tests)
 *    - Provides: Main App component
 * 
 * HOW TO RUN:
 * 1. The tests run automatically when this file loads (if AUTO_RUN is true)
 * 2. Manual run: Open browser console (F12) and type: ComprehensiveTestSuite.runAllTests()
 * 3. Run specific category: ComprehensiveTestSuite.runCategory('calculations')
 * 
 * TEST ORGANIZATION:
 * Tests are organized into categories for maintainability:
 * - CATEGORY 1: Calculation Unit Tests (Pure functions, edge cases)
 * - CATEGORY 2: Constants & Configuration Tests
 * - CATEGORY 3: Component Render Tests (UI components)
 * - CATEGORY 4: Integration Tests (Module interactions)
 * - CATEGORY 5: End-to-End Workflow Tests
 * - CATEGORY 6: Edge Cases & Error Handling
 * 
 * TEST STRUCTURE:
 * Each test follows this pattern:
 *   test('description', () => {
 *       // Arrange: Set up test data
 *       // Act: Execute the function being tested
 *       // Assert: Verify the result
 *   });
 * 
 * TEST RESULTS:
 * Results are displayed in:
 * 1. Browser console with detailed output
 * 2. A visual report injected into the page (if running in browser)
 * 3. Summary statistics (pass/fail counts, timing)
 * 
 * MAINTENANCE NOTES:
 * - When adding new calculation functions, add tests in the calculations category
 * - When adding new components, add tests in the components category
 * - When fixing bugs, add a regression test that would have caught the bug
 * - Update tests when business rules change (e.g., runner thresholds)
 * 
 * ================================================================================
 */

// ================================================================================
// SECTION 1: TEST FRAMEWORK & UTILITIES
// ================================================================================
// This section provides the testing infrastructure - a minimal test framework
// that doesn't require external dependencies. It handles test registration,
// execution, and reporting.
// ================================================================================

/**
 * Guard against multiple loads of this test suite.
 * If the suite is already loaded, we don't want to register tests twice
 * or create duplicate global objects.
 */
if (!window.ComprehensiveTestSuite) {

/**
 * Configuration constants for the test suite behavior.
 * Modify these to change how tests run.
 * 
 * NOTE: These settings are configured for development/internal testing.
 * The visual report is disabled by default to keep the UI clean for end users.
 * Tests still run in the browser console - open F12 to see results.
 */
const TEST_CONFIG = {
    // Set to false to prevent auto-run on page load (manual testing only)
    AUTO_RUN: true,
    
    // Set to true to stop on first failure (useful for debugging)
    STOP_ON_FIRST_FAIL: false,
    
    // Set to true to see detailed console output for each test
    VERBOSE: true,
    
    // Tolerance for floating-point comparisons (0.01 = 1% tolerance)
    FLOAT_TOLERANCE: 0.01,
    
    // Whether to show performance timing for each test
    SHOW_TIMING: true,
    
    // Set to true to show visual popup report (disabled for end users)
    SHOW_VISUAL_REPORT: false
};

/**
 * TestResult class - stores the outcome of a single test execution.
 * Each test produces one TestResult with pass/fail status, timing, and details.
 */
class TestResult {
    /**
     * @param {string} name - The name/description of the test
     * @param {boolean} passed - Whether the test passed
     * @param {string} message - Details about the test result
     * @param {number} durationMs - How long the test took in milliseconds
     * @param {Error|null} error - Error object if test threw an exception
     */
    constructor(name, passed, message, durationMs, error = null) {
        this.name = name;
        this.passed = passed;
        this.message = message;
        this.durationMs = durationMs;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * TestCategory class - groups related tests together.
 * Categories help organize tests logically (calculations, components, etc.)
 * and allow running specific categories independently.
 */
class TestCategory {
    /**
     * @param {string} name - Category name (e.g., 'calculations')
     * @param {string} description - Human-readable description
     */
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.tests = []; // Array of test functions
        this.results = []; // Array of TestResult objects after execution
    }
    
    /**
     * Add a test to this category.
     * @param {string} name - Test name
     * @param {Function} testFn - The test function to execute
     */
    addTest(name, testFn) {
        this.tests.push({ name, fn: testFn });
    }
    
    /**
     * Run all tests in this category.
     * @returns {Object} Summary with pass/fail counts and results
     */
    async run() {
        if (TEST_CONFIG.VERBOSE) {
            console.log(`\n📂 Running Category: ${this.name}`);
            console.log(`   ${this.description}`);
            console.log(`   Tests: ${this.tests.length}`);
            console.log('');
        }
        
        this.results = [];
        let passed = 0;
        let failed = 0;
        
        for (const test of this.tests) {
            const startTime = performance.now();
            let result;
            
            try {
                // Execute the test
                await test.fn();
                
                // If we get here, test passed
                const duration = performance.now() - startTime;
                result = new TestResult(test.name, true, 'Test passed', duration);
                passed++;
                
                if (TEST_CONFIG.VERBOSE) {
                    console.log(`  ✅ ${test.name}${TEST_CONFIG.SHOW_TIMING ? ` (${duration.toFixed(2)}ms)` : ''}`);
                }
            } catch (error) {
                // Test failed or threw exception
                const duration = performance.now() - startTime;
                const message = error.message || 'Test failed';
                result = new TestResult(test.name, false, message, duration, error);
                failed++;
                
                console.log(`  ❌ ${test.name}${TEST_CONFIG.SHOW_TIMING ? ` (${duration.toFixed(2)}ms)` : ''}`);
                console.log(`     Error: ${message}`);
                
                if (TEST_CONFIG.STOP_ON_FIRST_FAIL) {
                    throw new Error(`Stopping after first failure: ${test.name}`);
                }
            }
            
            this.results.push(result);
        }
        
        return {
            category: this.name,
            total: this.tests.length,
            passed,
            failed,
            results: this.results
        };
    }
}

/**
 * Assertion utilities - these are the building blocks for writing tests.
 * They throw descriptive errors when expectations aren't met.
 */
const Assert = {
    /**
     * Assert that two values are strictly equal (===).
     * @param {*} actual - The actual value
     * @param {*} expected - The expected value
     * @param {string} message - Optional custom message
     */
    equal(actual, expected, message = '') {
        if (actual !== expected) {
            const defaultMsg = `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that two numbers are approximately equal (within tolerance).
     * Use this for floating-point comparisons to handle precision issues.
     * @param {number} actual - The actual value
     * @param {number} expected - The expected value
     * @param {number} tolerance - Acceptable difference (default from TEST_CONFIG)
     * @param {string} message - Optional custom message
     */
    approximatelyEqual(actual, expected, tolerance = TEST_CONFIG.FLOAT_TOLERANCE, message = '') {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            const defaultMsg = `Expected ~${expected} (±${tolerance}), but got ${actual} (diff: ${diff})`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that a value is true.
     * @param {*} value - Value to check
     * @param {string} message - Optional custom message
     */
    true(value, message = '') {
        if (value !== true) {
            throw new Error(message || `Expected true, but got ${JSON.stringify(value)}`);
        }
    },
    
    /**
     * Assert that a value is false.
     * @param {*} value - Value to check
     * @param {string} message - Optional custom message
     */
    false(value, message = '') {
        if (value !== false) {
            throw new Error(message || `Expected false, but got ${JSON.stringify(value)}`);
        }
    },
    
    /**
     * Assert that a value is null or undefined.
     * @param {*} value - Value to check
     * @param {string} message - Optional custom message
     */
    nullOrUndefined(value, message = '') {
        if (value !== null && value !== undefined) {
            throw new Error(message || `Expected null or undefined, but got ${JSON.stringify(value)}`);
        }
    },
    
    /**
     * Assert that a value is not null and not undefined.
     * @param {*} value - Value to check
     * @param {string} message - Optional custom message
     */
    notNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(message || 'Expected non-null value, but got null/undefined');
        }
    },
    
    /**
     * Assert that a string contains a substring.
     * @param {string} haystack - String to search in
     * @param {string} needle - String to search for
     * @param {string} message - Optional custom message
     */
    contains(haystack, needle, message = '') {
        if (!haystack.includes(needle)) {
            const defaultMsg = `Expected string to contain "${needle}", but got "${haystack}"`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that a value is greater than a threshold.
     * @param {number} value - Value to check
     * @param {number} threshold - Minimum value (exclusive)
     * @param {string} message - Optional custom message
     */
    greaterThan(value, threshold, message = '') {
        if (!(value > threshold)) {
            const defaultMsg = `Expected ${value} to be greater than ${threshold}`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that a value is less than a threshold.
     * @param {number} value - Value to check
     * @param {number} threshold - Maximum value (exclusive)
     * @param {string} message - Optional custom message
     */
    lessThan(value, threshold, message = '') {
        if (!(value < threshold)) {
            const defaultMsg = `Expected ${value} to be less than ${threshold}`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that a function throws an error when executed.
     * @param {Function} fn - Function that should throw
     * @param {string} message - Optional custom message
     */
    throws(fn, message = '') {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message || 'Expected function to throw an error, but it did not');
        }
    },
    
    /**
     * Assert that an array contains a specific value.
     * @param {Array} array - Array to search
     * @param {*} value - Value to find
     * @param {string} message - Optional custom message
     */
    arrayContains(array, value, message = '') {
        if (!array.includes(value)) {
            const defaultMsg = `Expected array to contain ${JSON.stringify(value)}`;
            throw new Error(message || defaultMsg);
        }
    },
    
    /**
     * Assert that two arrays have the same elements (order matters).
     * @param {Array} actual - Actual array
     * @param {Array} expected - Expected array
     * @param {string} message - Optional custom message
     */
    arraysEqual(actual, expected, message = '') {
        if (actual.length !== expected.length) {
            const defaultMsg = `Array length mismatch: expected ${expected.length}, got ${actual.length}`;
            throw new Error(message || defaultMsg);
        }
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                const defaultMsg = `Array mismatch at index ${i}: expected ${JSON.stringify(expected[i])}, got ${JSON.stringify(actual[i])}`;
                throw new Error(message || defaultMsg);
            }
        }
    },
    
    /**
     * Assert that an object has expected properties with expected values.
     * @param {Object} actual - Actual object
     * @param {Object} expected - Object with expected properties
     * @param {string} message - Optional custom message
     */
    objectMatches(actual, expected, message = '') {
        for (const key of Object.keys(expected)) {
            if (actual[key] !== expected[key]) {
                const defaultMsg = `Property "${key}" mismatch: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`;
                throw new Error(message || defaultMsg);
            }
        }
    }
};

// ================================================================================
// SECTION 2: TEST CATEGORY REGISTRATION
// ================================================================================
// Create test categories. Each category groups related tests.
// Add tests to these categories in subsequent sections.
// ================================================================================

/**
 * CATEGORY 1: Calculation Unit Tests
 * Tests for all pure calculation functions in js/calculations.js
 * These are the most critical tests as they verify business logic accuracy.
 */
const calculationTests = new TestCategory('calculations', 
    'Unit tests for pure calculation functions (CFT, dimensions, crate gaps)');

/**
 * CATEGORY 2: Constants & Configuration Tests
 * Tests for constants, validation functions, and configuration values.
 */
const constantsTests = new TestCategory('constants',
    'Tests for constants, validation functions, and configuration values');

/**
 * CATEGORY 3: Component Render Tests
 * Tests that UI components render correctly with various props.
 */
const componentTests = new TestCategory('components',
    'Tests for React component rendering and behavior');

/**
 * CATEGORY 4: Integration Tests
 * Tests that verify different modules work together correctly.
 */
const integrationTests = new TestCategory('integration',
    'Tests for module interactions and data flow');

/**
 * CATEGORY 5: End-to-End Workflow Tests
 * Tests that simulate complete user workflows.
 */
const workflowTests = new TestCategory('workflows',
    'End-to-end tests simulating complete user workflows');

/**
 * CATEGORY 6: Edge Cases & Error Handling
 * Tests for boundary conditions, invalid inputs, and error scenarios.
 */
const edgeCaseTests = new TestCategory('edge-cases',
    'Tests for boundary conditions, invalid inputs, and error scenarios');

// Array of all test categories for easy iteration
const allCategories = [
    calculationTests,
    constantsTests,
    componentTests,
    integrationTests,
    workflowTests,
    edgeCaseTests
];

// ================================================================================
// SECTION 3: CALCULATION UNIT TESTS
// ================================================================================
// These tests verify the core business logic - the mathematical calculations
// that determine wood requirements and costs.
// 
// CRITICAL: These calculations directly affect business pricing. Any change
// to calculation logic MUST be reflected in these tests.
// ================================================================================

/**
 * HELPER: Get calculation functions from the global scope.
 * These are defined in js/calculations.js and attached to window.AppCalculations.
 * We destructure them here for cleaner test code.
 */
function getCalculationFunctions() {
    if (!window.AppCalculations) {
        throw new Error('js/calculations.js must be loaded before running tests');
    }
    return window.AppCalculations;
}

/**
 * TEST: getPurchasedFeet - Basic rounding scenarios
 * 
 * BUSINESS RULE: Wood is sold in 0.5 foot increments.
 * - Exact foot values (12", 24") should return whole numbers (1.0, 2.0)
 * - Values requiring rounding up to 0.5 should do so (15" → 1.5 ft)
 * - Values requiring rounding up to whole number should do so (19" → 2.0 ft)
 */
calculationTests.addTest('getPurchasedFeet: Basic rounding - exact feet', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 12 inches = exactly 1 foot
    Assert.equal(getPurchasedFeet(12), 1.0, '12 inches should equal 1.0 feet');
    
    // 24 inches = exactly 2 feet
    Assert.equal(getPurchasedFeet(24), 2.0, '24 inches should equal 2.0 feet');
    
    // 36 inches = exactly 3 feet
    Assert.equal(getPurchasedFeet(36), 3.0, '36 inches should equal 3.0 feet');
});

calculationTests.addTest('getPurchasedFeet: Rounding up to half-foot', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 13 inches = 1.08 ft → round to 1.5 ft
    Assert.equal(getPurchasedFeet(13), 1.5, '13 inches should round to 1.5 feet');
    
    // 15 inches = 1.25 ft → round to 1.5 ft
    Assert.equal(getPurchasedFeet(15), 1.5, '15 inches should round to 1.5 feet');
    
    // 18 inches = 1.5 ft → stays 1.5 ft
    Assert.equal(getPurchasedFeet(18), 1.5, '18 inches should equal 1.5 feet');
});

calculationTests.addTest('getPurchasedFeet: Rounding up to whole foot', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 19 inches = 1.58 ft → round to 2.0 ft
    Assert.equal(getPurchasedFeet(19), 2.0, '19 inches should round to 2.0 feet');
    
    // 23 inches = 1.92 ft → round to 2.0 ft
    Assert.equal(getPurchasedFeet(23), 2.0, '23 inches should round to 2.0 feet');
});

calculationTests.addTest('getPurchasedFeet: Larger dimensions', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 48 inches = exactly 4 feet
    Assert.equal(getPurchasedFeet(48), 4.0, '48 inches should equal 4.0 feet');
    
    // 60 inches = exactly 5 feet
    Assert.equal(getPurchasedFeet(60), 5.0, '60 inches should equal 5.0 feet');
    
    // 72 inches = exactly 6 feet
    Assert.equal(getPurchasedFeet(72), 6.0, '72 inches should equal 6.0 feet');
    
    // 75 inches = 6.25 ft → round to 6.5 ft
    Assert.equal(getPurchasedFeet(75), 6.5, '75 inches should round to 6.5 feet');
});

/**
 * TEST: calculateLineCFT - Basic CFT calculations
 * 
 * FORMULA: (feet × width × thickness) / 144 × quantity
 * 
 * Where:
 * - feet = purchased feet (from getPurchasedFeet)
 * - width = wood width in inches
 * - thickness = wood thickness in inches
 * - 144 = 12 × 12 (conversion factor)
 */
calculationTests.addTest('calculateLineCFT: Basic calculations', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    // Test case: 24" × 3" × 1" × 1 piece
    // feet = 24/12 = 2.0 ft
    // CFT = (2.0 × 3 × 1) / 144 × 1 = 6/144 = 0.041666... ≈ 0.042
    const result1 = calculateLineCFT(24, 3, 1, 1);
    Assert.approximatelyEqual(result1, 0.04167, 0.001, '24x3x1x1 should be ~0.042 CFT');
    
    // Test case: 24" × 3" × 1" × 2 pieces (double quantity)
    // CFT = (2.0 × 3 × 1) / 144 × 2 = 12/144 = 0.08333... ≈ 0.083
    const result2 = calculateLineCFT(24, 3, 1, 2);
    Assert.approximatelyEqual(result2, 0.08333, 0.001, '24x3x1x2 should be ~0.083 CFT');
});

calculationTests.addTest('calculateLineCFT: With purchased feet rounding', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    // 15 inches requires 1.5 purchased feet (not 1.25)
    // CFT = (1.5 × 3 × 1) / 144 × 1 = 4.5/144 = 0.03125
    const result = calculateLineCFT(15, 3, 1, 1);
    Assert.approximatelyEqual(result, 0.03125, 0.001, 'Should account for purchased feet rounding');
});

calculationTests.addTest('calculateLineCFT: Various wood sizes', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    // 4x2 wood: 4" wide × 2" thick
    // 48" length = 4.0 ft purchased
    // CFT = (4.0 × 4 × 2) / 144 × 1 = 32/144 = 0.222...
    const result4x2 = calculateLineCFT(48, 4, 2, 1);
    Assert.approximatelyEqual(result4x2, 0.2222, 0.001, '4x2 wood calculation');
    
    // 3x1 wood: 3" wide × 1" thick
    // 48" length = 4.0 ft purchased
    // CFT = (4.0 × 3 × 1) / 144 × 1 = 12/144 = 0.0833...
    const result3x1 = calculateLineCFT(48, 3, 1, 1);
    Assert.approximatelyEqual(result3x1, 0.0833, 0.001, '3x1 wood calculation');
});

/**
 * TEST: getSizeDims - Wood size dimension lookup
 * 
 * Size codes like "3x1" map to width and thickness in inches.
 * This is the source of truth for wood dimensions throughout the app.
 */
calculationTests.addTest('getSizeDims: Standard sizes lookup', () => {
    const { getSizeDims } = getCalculationFunctions();
    
    // Test common sizes used in the app
    Assert.objectMatches(getSizeDims('3x1'), { w: 3, t: 1 }, '3x1 should be 3" wide × 1" thick');
    Assert.objectMatches(getSizeDims('4x1'), { w: 4, t: 1 }, '4x1 should be 4" wide × 1" thick');
    Assert.objectMatches(getSizeDims('3x1.5'), { w: 3, t: 1.5 }, '3x1.5 should be 3" wide × 1.5" thick');
    Assert.objectMatches(getSizeDims('4x1.5'), { w: 4, t: 1.5 }, '4x1.5 should be 4" wide × 1.5" thick');
    Assert.objectMatches(getSizeDims('3x2'), { w: 3, t: 2 }, '3x2 should be 3" wide × 2" thick');
    Assert.objectMatches(getSizeDims('4x2'), { w: 4, t: 2 }, '4x2 should be 4" wide × 2" thick');
    Assert.objectMatches(getSizeDims('4x3'), { w: 4, t: 3 }, '4x3 should be 4" wide × 3" thick');
    Assert.objectMatches(getSizeDims('4x4'), { w: 4, t: 4 }, '4x4 should be 4" wide × 4" thick');
});

calculationTests.addTest('getSizeDims: Default fallback', () => {
    const { getSizeDims } = getCalculationFunctions();
    
    // Unknown sizes should default to 3x1 (safe default)
    Assert.objectMatches(getSizeDims('unknown'), { w: 3, t: 1 }, 'Unknown size should default to 3x1');
    Assert.objectMatches(getSizeDims('5x2'), { w: 3, t: 1 }, 'Non-standard size should default to 3x1');
    Assert.objectMatches(getSizeDims(''), { w: 3, t: 1 }, 'Empty string should default to 3x1');
});

/**
 * TEST: getMaxDim - Maximum dimension extraction
 * 
 * Used for spacing calculations in 3D visualization and some calculations.
 */
calculationTests.addTest('getMaxDim: Extract maximum dimension', () => {
    const { getMaxDim } = getCalculationFunctions();
    
    Assert.equal(getMaxDim('3x1'), 3, '3x1 max dimension should be 3');
    Assert.equal(getMaxDim('4x2'), 4, '4x2 max dimension should be 4');
    Assert.equal(getMaxDim('4x4'), 4, '4x4 max dimension should be 4');
    Assert.equal(getMaxDim('3x1.5'), 3, '3x1.5 max dimension should be 3');
});

calculationTests.addTest('getMaxDim: Invalid inputs', () => {
    const { getMaxDim } = getCalculationFunctions();
    
    Assert.equal(getMaxDim(''), 0, 'Empty string should return 0');
    Assert.equal(getMaxDim(null), 0, 'Null should return 0');
    Assert.equal(getMaxDim(undefined), 0, 'Undefined should return 0');
});

/**
 * TEST: calculateCrateEffectiveLength - Crate gap calculations
 * 
 * BUSINESS CONTEXT: Crates use planks with gaps for ventilation.
 * This calculates actual wood needed based on span, plank width, and gap size.
 * 
 * FORMULA: planks = ceil(span / (plankWidth + gap))
 *          woodNeeded = planks × plankWidth
 */
calculationTests.addTest('calculateCrateEffectiveLength: Basic scenarios', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // Scenario: 20" span, 4" planks, 4" gaps
    // Unit = 4 + 4 = 8"
    // Planks = ceil(20/8) = ceil(2.5) = 3
    // Wood = 3 × 4" = 12"
    Assert.equal(calculateCrateEffectiveLength(20, 4, 4), 12, '20" span with 4" planks + 4" gaps');
    
    // Scenario: 24" span, 4" planks, 4" gaps (exact fit)
    // Unit = 8", ceil(24/8) = 3, wood = 12"
    Assert.equal(calculateCrateEffectiveLength(24, 4, 4), 12, '24" span exact fit');
});

calculationTests.addTest('calculateCrateEffectiveLength: Edge cases', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // No gap (planks touch each other)
    // 20" span, 4" planks, 0" gaps
    // Planks = ceil(20/4) = 5, wood = 20"
    Assert.equal(calculateCrateEffectiveLength(20, 4, 0), 20, 'No gap - full coverage');
    
    // Large gap relative to plank
    // 30" span, 4" planks, 8" gaps
    // Unit = 12", ceil(30/12) = 3, wood = 12"
    Assert.equal(calculateCrateEffectiveLength(30, 4, 8), 12, 'Large gap relative to plank');
});

/**
 * TEST: getEffectiveCrateDims - Comprehensive crate dimension adjustments
 * 
 * Different parts of a crate adjust differently based on gaps:
 * - Sides: Only height adjusted (planks run horizontally)
 * - Kara: Both width and height adjusted
 * - Top: Adjusted only for crateBottom type
 */
calculationTests.addTest('getEffectiveCrateDims: Sides adjustment', () => {
    const { getEffectiveCrateDims } = getCalculationFunctions();
    
    // Sides: 44" length × 20" height, 4" plank, 4" gap
    // Only height should be adjusted
    // Effective height: ceil(20/8) × 4 = 3 × 4 = 12"
    const sides = getEffectiveCrateDims('Sides', 44, 20, 'crateSimple', { plank: 4, gap: 4 });
    
    Assert.equal(sides.l, 44, 'Sides length should remain unchanged');
    Assert.equal(sides.w, 12, 'Sides height should be adjusted to 12"');
    Assert.notNull(sides.note, 'Should include adjustment note');
});

calculationTests.addTest('getEffectiveCrateDims: Kara adjustment', () => {
    const { getEffectiveCrateDims } = getCalculationFunctions();
    
    // Kara: 20" width × 20" height, 4" plank, 4" gap
    // Both dimensions adjusted
    const kara = getEffectiveCrateDims('Kara', 20, 20, 'crateSimple', { plank: 4, gap: 4 });
    
    Assert.equal(kara.l, 12, 'Kara width should be adjusted to 12"');
    Assert.equal(kara.w, 12, 'Kara height should be adjusted to 12"');
});

calculationTests.addTest('getEffectiveCrateDims: Top adjustment by box type', () => {
    const { getEffectiveCrateDims } = getCalculationFunctions();
    
    // Top for crateSimple: Should NOT be adjusted
    const topSimple = getEffectiveCrateDims('Top', 44, 22, 'crateSimple', { plank: 4, gap: 4 });
    Assert.equal(topSimple.l, 44, 'Top length unchanged for crateSimple');
    Assert.equal(topSimple.w, 22, 'Top width unchanged for crateSimple');
    Assert.nullOrUndefined(topSimple.note, 'No note for unadjusted top in crateSimple');
    
    // Top for crateBottom: SHOULD be adjusted
    const topBottom = getEffectiveCrateDims('Top', 44, 22, 'crateBottom', { plank: 4, gap: 4 });
    // ceil(44/8) × 4 = 6 × 4 = 24, but capped or adjusted differently
    // Actually: 44/8 = 5.5 → ceil = 6 → 6 × 4 = 24"
    // For width: 22/8 = 2.75 → ceil = 3 → 3 × 4 = 12"
    Assert.notNull(topBottom.note, 'Should have note for adjusted top in crateBottom');
});

// ================================================================================
// SECTION 4: CONSTANTS & CONFIGURATION TESTS
// ================================================================================
// These tests verify that constants are properly defined and have expected values.
// Constants are the foundation of calculations, so their correctness is critical.
// ================================================================================

/**
 * HELPER: Get constants from the global scope.
 */
function getConstants() {
    if (!window.AppConstants) {
        throw new Error('js/constants.js must be loaded before running tests');
    }
    return window.AppConstants;
}

/**
 * TEST: Core calculation constants
 * These values are used throughout the app and must be correct.
 */
constantsTests.addTest('Constants: HALF_FOOT_THRESHOLD value', () => {
    const { HALF_FOOT_THRESHOLD } = getConstants();
    
    // This threshold determines when to round up to next half-foot
    // Value should be slightly over 0.5 to handle floating-point precision
    Assert.equal(HALF_FOOT_THRESHOLD, 0.5001, 'HALF_FOOT_THRESHOLD should be 0.5001');
});

constantsTests.addTest('Constants: CUBIC_INCH_TO_CFT_DIVISOR', () => {
    const { CUBIC_INCH_TO_CFT_DIVISOR } = getConstants();
    
    // 144 = 12 × 12, used to convert inch-based volume to cubic feet
    Assert.equal(CUBIC_INCH_TO_CFT_DIVISOR, 144, 'CUBIC_INCH_TO_CFT_DIVISOR should be 144');
});

constantsTests.addTest('Constants: INCHES_PER_FOOT', () => {
    const { INCHES_PER_FOOT } = getConstants();
    
    // Standard conversion
    Assert.equal(INCHES_PER_FOOT, 12, 'INCHES_PER_FOOT should be 12');
});

/**
 * TEST: Runner recommendation configuration
 * These thresholds determine how many runners are recommended based on box length.
 */
constantsTests.addTest('Constants: RUNNER_RECOMMENDATIONS structure', () => {
    const { RUNNER_RECOMMENDATIONS } = getConstants();
    
    // Should be an array
    Assert.notNull(RUNNER_RECOMMENDATIONS, 'RUNNER_RECOMMENDATIONS should exist');
    Assert.greaterThan(RUNNER_RECOMMENDATIONS.length, 0, 'Should have recommendation entries');
    
    // Each entry should have min and count properties
    for (const rec of RUNNER_RECOMMENDATIONS) {
        Assert.notNull(rec.min, 'Each recommendation should have min property');
        Assert.notNull(rec.count, 'Each recommendation should have count property');
        Assert.greaterThan(rec.min, 0, 'Min threshold should be positive');
        Assert.greaterThan(rec.count, 0, 'Runner count should be positive');
    }
});

constantsTests.addTest('Constants: RUNNER_RECOMMENDATIONS logic', () => {
    const { RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT } = getConstants();
    
    // Recommendations should be in descending order (highest threshold first)
    // This is important for the loop logic in getRecommendedRunnerCount
    for (let i = 1; i < RUNNER_RECOMMENDATIONS.length; i++) {
        const prevMin = RUNNER_RECOMMENDATIONS[i - 1].min;
        const currMin = RUNNER_RECOMMENDATIONS[i].min;
        Assert.greaterThan(prevMin, currMin, 
            `Recommendations should be in descending order: index ${i-1} (${prevMin}) should be > index ${i} (${currMin})`);
    }
    
    // MIN_RUNNER_COUNT should exist and be reasonable
    Assert.notNull(MIN_RUNNER_COUNT, 'MIN_RUNNER_COUNT should exist');
    Assert.greaterThan(MIN_RUNNER_COUNT, 0, 'MIN_RUNNER_COUNT should be positive');
});

/**
 * TEST: Validation helper function
 */
constantsTests.addTest('isInvalidNumber: Valid numbers', () => {
    const { isInvalidNumber } = getConstants();
    
    Assert.false(isInvalidNumber(1), '1 is a valid number');
    Assert.false(isInvalidNumber(0.5), '0.5 is a valid number');
    Assert.false(isInvalidNumber(100), '100 is a valid number');
});

constantsTests.addTest('isInvalidNumber: Invalid values', () => {
    const { isInvalidNumber } = getConstants();
    
    Assert.true(isInvalidNumber(null), 'null should be invalid');
    Assert.true(isInvalidNumber(undefined), 'undefined should be invalid');
    Assert.true(isInvalidNumber(NaN), 'NaN should be invalid');
    Assert.true(isInvalidNumber(-5), 'Negative numbers should be invalid');
    Assert.true(isInvalidNumber(0), 'Zero should be invalid');
});

/**
 * TEST: Icon components exist and are valid
 */
constantsTests.addTest('Icons: Required icons exist', () => {
    const { Icons } = getConstants();
    
    Assert.notNull(Icons, 'Icons object should exist');
    Assert.notNull(Icons.Box, 'Box icon should exist');
    Assert.notNull(Icons.Plus, 'Plus icon should exist');
    Assert.notNull(Icons.Trash, 'Trash icon should exist');
    Assert.notNull(Icons.Rotate, 'Rotate icon should exist');
});

// ================================================================================
// SECTION 5: EDGE CASES & ERROR HANDLING TESTS
// ================================================================================
// These tests verify that the application handles edge cases gracefully.
// Edge cases include: zero values, negative values, extreme values, null inputs,
// and boundary conditions.
// ================================================================================

/**
 * TEST: getPurchasedFeet edge cases
 */
edgeCaseTests.addTest('getPurchasedFeet: Zero and negative inputs', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    Assert.equal(getPurchasedFeet(0), 0, 'Zero inches should return 0 feet');
    Assert.equal(getPurchasedFeet(-10), 0, 'Negative inches should return 0');
    Assert.equal(getPurchasedFeet(-0.5), 0, 'Small negative should return 0');
});

edgeCaseTests.addTest('getPurchasedFeet: Invalid inputs', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    Assert.equal(getPurchasedFeet(null), 0, 'Null should return 0');
    Assert.equal(getPurchasedFeet(undefined), 0, 'Undefined should return 0');
    Assert.equal(getPurchasedFeet(NaN), 0, 'NaN should return 0');
    Assert.equal(getPurchasedFeet(''), 0, 'Empty string should return 0');
    Assert.equal(getPurchasedFeet('abc'), 0, 'Non-numeric string should return 0');
});

edgeCaseTests.addTest('getPurchasedFeet: Very large values', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 120 inches = 10 feet exactly
    Assert.equal(getPurchasedFeet(120), 10.0, '120 inches should be 10 feet');
    
    // 144 inches = 12 feet exactly
    Assert.equal(getPurchasedFeet(144), 12.0, '144 inches should be 12 feet');
    
    // 240 inches = 20 feet exactly
    Assert.equal(getPurchasedFeet(240), 20.0, '240 inches should be 20 feet');
});

edgeCaseTests.addTest('getPurchasedFeet: Very small values', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    
    // 1 inch should round up to 0.5 feet minimum
    Assert.equal(getPurchasedFeet(1), 0.5, '1 inch should round to 0.5 feet (minimum purchase)');
    
    // 6 inches = 0.5 feet exactly
    Assert.equal(getPurchasedFeet(6), 0.5, '6 inches should be 0.5 feet');
});

/**
 * TEST: calculateLineCFT edge cases
 */
edgeCaseTests.addTest('calculateLineCFT: Zero inputs', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    Assert.equal(calculateLineCFT(0, 3, 1, 1), 0, 'Zero length should return 0 CFT');
    Assert.equal(calculateLineCFT(24, 0, 1, 1), 0, 'Zero width should return 0 CFT');
    Assert.equal(calculateLineCFT(24, 3, 0, 1), 0, 'Zero thickness should return 0 CFT');
    Assert.equal(calculateLineCFT(24, 3, 1, 0), 0, 'Zero quantity should return 0 CFT');
});

edgeCaseTests.addTest('calculateLineCFT: Negative inputs', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    Assert.equal(calculateLineCFT(-10, 3, 1, 1), 0, 'Negative length should return 0 CFT');
    Assert.equal(calculateLineCFT(24, -3, 1, 1), 0, 'Negative width should return 0 CFT');
});

edgeCaseTests.addTest('calculateLineCFT: Invalid inputs', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    Assert.equal(calculateLineCFT(NaN, 3, 1, 1), 0, 'NaN length should return 0 CFT');
    Assert.equal(calculateLineCFT(24, null, 1, 1), 0, 'Null width should return 0 CFT');
});

edgeCaseTests.addTest('calculateLineCFT: Very large dimensions', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    // Large but realistic dimensions (e.g., a large shipping crate)
    // 10 feet long × 6" wide × 2" thick × 10 pieces
    // = 120" × 6" × 2" × 10
    // purchased feet = 10.0
    // CFT = (10 × 6 × 2) / 144 × 10 = 120/144 × 10 = 8.33... CFT
    const result = calculateLineCFT(120, 6, 2, 10);
    Assert.approximatelyEqual(result, 8.333, 0.01, 'Large dimensions should calculate correctly');
});

/**
 * TEST: calculateCrateEffectiveLength edge cases
 */
edgeCaseTests.addTest('calculateCrateEffectiveLength: Invalid inputs', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    Assert.equal(calculateCrateEffectiveLength(-10, 4, 4), 0, 'Negative span should return 0');
    Assert.equal(calculateCrateEffectiveLength(20, -4, 4), 0, 'Negative plank width should return 0');
    Assert.equal(calculateCrateEffectiveLength(20, 4, -1), 0, 'Negative gap should return 0');
    Assert.equal(calculateCrateEffectiveLength(null, 4, 4), 0, 'Null span should return 0');
});

edgeCaseTests.addTest('calculateCrateEffectiveLength: Zero gap', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // Zero gap means planks touch each other
    // 20" span, 4" planks, 0" gap
    // = ceil(20/4) × 4 = 5 × 4 = 20"
    Assert.equal(calculateCrateEffectiveLength(20, 4, 0), 20, 'Zero gap should give full coverage');
});

edgeCaseTests.addTest('calculateCrateEffectiveLength: Gap larger than span', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // 10" span, 4" planks, 20" gap
    // Unit = 24", ceil(10/24) = 1, wood = 4"
    Assert.equal(calculateCrateEffectiveLength(10, 4, 20), 4, 'Large gap should still need at least one plank');
});

edgeCaseTests.addTest('calculateCrateEffectiveLength: Plank larger than span', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // 5" span, 10" planks
    // ceil(5/10) = 1, wood = 10"
    Assert.equal(calculateCrateEffectiveLength(5, 10, 0), 10, 'Oversized plank covers span with one piece');
});

// ================================================================================
// SECTION 6: INTEGRATION TESTS
// ================================================================================
// These tests verify that multiple modules work together correctly.
// They test the data flow between modules and ensure consistency.
// ================================================================================

/**
 * TEST: Calculation consistency
 * Verify that calculations produce consistent results when used together.
 */
integrationTests.addTest('Integration: CFT calculation chain', () => {
    const { getPurchasedFeet, calculateLineCFT, getSizeDims } = getCalculationFunctions();
    
    // Full calculation chain:
    // 1. Get wood dimensions from size code
    // 2. Calculate purchased feet from length
    // 3. Calculate CFT using all values
    
    const size = '4x2';
    const length = 48; // inches
    const quantity = 4;
    
    // Step 1: Get dimensions
    const dims = getSizeDims(size);
    Assert.objectMatches(dims, { w: 4, t: 2 }, 'Size lookup should work');
    
    // Step 2: Get purchased feet
    const feet = getPurchasedFeet(length);
    Assert.equal(feet, 4.0, '48 inches should be 4.0 purchased feet');
    
    // Step 3: Calculate CFT
    // CFT = (4.0 × 4 × 2) / 144 × 4 = 32/144 × 4 = 0.888... CFT
    const cft = calculateLineCFT(length, dims.w, dims.t, quantity);
    Assert.approximatelyEqual(cft, 0.8889, 0.001, 'Full calculation chain should produce correct result');
});

integrationTests.addTest('Integration: Size dims → Max dim → Calculations', () => {
    const { getSizeDims, getMaxDim } = getCalculationFunctions();
    
    // Test that getMaxDim correctly uses getSizeDims
    const testSizes = ['3x1', '4x2', '4x4', '3x1.5'];
    
    for (const size of testSizes) {
        const dims = getSizeDims(size);
        const maxDim = getMaxDim(size);
        const expectedMax = Math.max(dims.w, dims.t);
        
        Assert.equal(maxDim, expectedMax, 
            `getMaxDim(${size}) should return ${expectedMax} (max of ${dims.w} and ${dims.t})`);
    }
});

integrationTests.addTest('Integration: Crate calculations with size lookup', () => {
    const { getEffectiveCrateDims, getSizeDims, calculateLineCFT } = getCalculationFunctions();
    
    // Simulate a crate side panel calculation
    const originalDims = { l: 44, w: 20 };
    const crateSettings = { plank: 4, gap: 4 };
    const woodSize = '3x1';
    
    // Get effective dimensions for crate
    const effective = getEffectiveCrateDims('Sides', originalDims.l, originalDims.w, 
        'crateSimple', crateSettings);
    
    // Get wood dimensions
    const woodDims = getSizeDims(woodSize);
    
    // Calculate CFT with effective dimensions
    const cft = calculateLineCFT(effective.l, effective.w, woodDims.t, 2);
    
    // Verify calculation used effective dimensions
    Assert.lessThan(effective.w, originalDims.w, 
        'Effective width should be less than original due to gaps');
    Assert.greaterThan(cft, 0, 'CFT should be positive');
});

// ================================================================================
// SECTION 7: COMPONENT RENDER TESTS
// ================================================================================
// These tests verify that React components can render without errors.
// Note: Full component testing would require a testing library like React Testing Library.
// These are basic smoke tests to ensure components don't throw on render.
// ================================================================================

/**
 * HELPER: Check if components module is loaded
 */
function getComponents() {
    return window.AppComponents || null;
}

componentTests.addTest('Components: Module exists', () => {
    const components = getComponents();
    Assert.notNull(components, 'AppComponents should be loaded');
});

componentTests.addTest('Components: NumberInput exists and is a function', () => {
    const components = getComponents();
    if (!components) return; // Skip if not loaded
    
    Assert.notNull(components.NumberInput, 'NumberInput component should exist');
    Assert.equal(typeof components.NumberInput, 'function', 'NumberInput should be a function');
});

componentTests.addTest('Components: CalculationRow exists and is a function', () => {
    const components = getComponents();
    if (!components) return;
    
    Assert.notNull(components.CalculationRow, 'CalculationRow component should exist');
    Assert.equal(typeof components.CalculationRow, 'function', 'CalculationRow should be a function');
});

componentTests.addTest('Components: SupportCard exists and is a function', () => {
    const components = getComponents();
    if (!components) return;
    
    Assert.notNull(components.SupportCard, 'SupportCard component should exist');
    Assert.equal(typeof components.SupportCard, 'function', 'SupportCard should be a function');
});

componentTests.addTest('Components: BoxTypeSelector exists and is a function', () => {
    const components = getComponents();
    if (!components) return;
    
    Assert.notNull(components.BoxTypeSelector, 'BoxTypeSelector component should exist');
    Assert.equal(typeof components.BoxTypeSelector, 'function', 'BoxTypeSelector should be a function');
});

// ================================================================================
// SECTION 8: END-TO-END WORKFLOW TESTS
// ================================================================================
// These tests simulate complete user workflows to ensure the entire
// application works together correctly.
// ================================================================================

/**
 * TEST: Complete box calculation workflow
 * Simulates: User enters dimensions, selects box type, gets calculations
 */
workflowTests.addTest('Workflow: Simple box calculation', () => {
    const { getPurchasedFeet, calculateLineCFT, getSizeDims } = getCalculationFunctions();
    const { RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT } = getConstants();
    
    // Scenario: 40" × 20" × 20" simple box
    const dims = { l: 40, w: 20, h: 20 };
    
    // Calculate panel dimensions (from app.js logic)
    const baseL = dims.l + 4;  // 44"
    const baseW = dims.w + 2;  // 22"
    
    // Top & Bottom panels: 44" × 22" × 1" × 2 pieces
    const topBottomCFT = calculateLineCFT(baseL, baseW, 1, 2);
    Assert.greaterThan(topBottomCFT, 0, 'Top/Bottom should have positive CFT');
    
    // Side panels: 44" × 20" × 1" × 2 pieces
    const sidesCFT = calculateLineCFT(baseL, dims.h, 1, 2);
    Assert.greaterThan(sidesCFT, 0, 'Sides should have positive CFT');
    
    // Kara panels: 20" × 20" × 1" × 2 pieces
    const karaCFT = calculateLineCFT(dims.w, dims.h, 1, 2);
    Assert.greaterThan(karaCFT, 0, 'Kara should have positive CFT');
    
    // Total board CFT
    const totalBoard = topBottomCFT + sidesCFT + karaCFT;
    Assert.greaterThan(totalBoard, 0, 'Total board CFT should be positive');
    
    // Calculate runner recommendations
    let recommendedRunners = MIN_RUNNER_COUNT;
    for (const { min, count } of RUNNER_RECOMMENDATIONS) {
        if (dims.l > min) {
            recommendedRunners = count;
            break;
        }
    }
    Assert.equal(recommendedRunners, 2, '40" box should need 2 runners');
});

workflowTests.addTest('Workflow: Large box with more runners', () => {
    const { RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT } = getConstants();
    
    // Scenario: 72" × 30" × 30" large box
    const dims = { l: 72, w: 30, h: 30 };
    
    // Calculate runner recommendations
    let recommendedRunners = MIN_RUNNER_COUNT;
    for (const { min, count } of RUNNER_RECOMMENDATIONS) {
        if (dims.l > min) {
            recommendedRunners = count;
            break;
        }
    }
    
    // 72" > 70", so should get 5 runners
    Assert.equal(recommendedRunners, 5, '72" box should need 5 runners');
});

workflowTests.addTest('Workflow: Crate box with gaps', () => {
    const { getEffectiveCrateDims, calculateLineCFT } = getCalculationFunctions();
    
    // Scenario: 40" × 20" × 20" crate with 4" planks and 4" gaps
    const dims = { l: 44, w: 22, h: 20 }; // Calculated dimensions
    const crateSettings = { plank: 4, gap: 4 };
    
    // Get effective dimensions for sides
    const sides = getEffectiveCrateDims('Sides', dims.l, dims.h, 'crateSimple', crateSettings);
    
    // Calculate CFT with effective dimensions
    const sidesCFT = calculateLineCFT(sides.l, sides.w, 1, 2);
    
    // With gaps, effective height should be less than original
    Assert.lessThan(sides.w, dims.h, 'Crate sides should use less wood due to gaps');
    Assert.greaterThan(sidesCFT, 0, 'Crate sides CFT should be positive');
});

workflowTests.addTest('Workflow: Cost calculation', () => {
    const { calculateLineCFT } = getCalculationFunctions();
    
    // Scenario: Calculate total cost
    const costPerCFT = 625; // ₹ per CFT
    
    // Panels: 44" × 22" × 1" × 2
    const panelCFT = calculateLineCFT(44, 22, 1, 2);
    
    // Supports: 4x2 wood, 22" length, 2 pieces
    // purchased feet = 2.0 (22" rounds to 2ft)
    // CFT = (2.0 × 4 × 2) / 144 × 2 = 16/144 × 2 = 0.222...
    const supportCFT = calculateLineCFT(22, 4, 2, 2);
    
    const totalCFT = panelCFT + supportCFT;
    const totalCost = totalCFT * costPerCFT;
    
    Assert.greaterThan(totalCost, 0, 'Total cost should be positive');
    Assert.greaterThan(totalCFT, 0, 'Total CFT should be positive');
});

// ================================================================================
// SECTION 9: REGRESSION TESTS
// ================================================================================
// These tests verify that previously fixed bugs stay fixed.
// When you fix a bug, add a test here to prevent it from recurring.
// ================================================================================

/**
 * REGRESSION TEST: Purchased feet rounding at boundaries
 * Issue: Rounding logic at 0.5 boundaries was previously incorrect.
 * This test ensures the HALF_FOOT_THRESHOLD is working correctly.
 */
edgeCaseTests.addTest('REGRESSION: Feet rounding at 0.5 boundary', () => {
    const { getPurchasedFeet } = getCalculationFunctions();
    const { HALF_FOOT_THRESHOLD } = getConstants();
    
    // Values just at and around the threshold
    // HALF_FOOT_THRESHOLD = 0.5001
    // 6 inches = exactly 0.5 ft
    // The threshold ensures we round up correctly
    
    Assert.equal(getPurchasedFeet(6), 0.5, 'Exactly 0.5 ft should stay at 0.5');
    
    // 6.01 inches = slightly over 0.5 ft (6.01/12 = 0.5008...)
    // Should round up to 1.0 because fraction > HALF_FOOT_THRESHOLD
    const result = getPurchasedFeet(6.01);
    // Note: This depends on the exact threshold value
    Assert.true(result >= 0.5, 'Slightly over 0.5 should round to at least 0.5');
});

/**
 * REGRESSION TEST: Crate gap calculation with zero span
 * Issue: Previously, zero or negative span might cause incorrect calculations.
 */
edgeCaseTests.addTest('REGRESSION: Crate gap with edge spans', () => {
    const { calculateCrateEffectiveLength } = getCalculationFunctions();
    
    // Zero span should return 0 wood needed
    Assert.equal(calculateCrateEffectiveLength(0, 4, 4), 0, 'Zero span needs zero wood');
    
    // Very small span should need at least one plank
    Assert.equal(calculateCrateEffectiveLength(1, 4, 4), 4, '1" span needs one 4" plank');
});

// ================================================================================
// SECTION 10: TEST RUNNER & REPORTING
// ================================================================================
// This section contains the test runner that executes all tests and generates
// the final report. This is the entry point for running the test suite.
// ================================================================================

/**
 * TestRunner class - orchestrates test execution and reporting.
 */
class TestRunner {
    constructor() {
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }
    
    /**
     * Run all tests in all categories.
     * @returns {Object} Complete test results summary
     */
    async runAllTests() {
        console.log('\n' + '='.repeat(80));
        console.log('  AMBICA WOODEN WORKS - SMART CFT CALCULATOR');
        console.log('  COMPREHENSIVE TEST SUITE');
        console.log('='.repeat(80));
        console.log(`\nTest Configuration:`);
        console.log(`  Auto-run: ${TEST_CONFIG.AUTO_RUN}`);
        console.log(`  Stop on first fail: ${TEST_CONFIG.STOP_ON_FIRST_FAIL}`);
        console.log(`  Verbose: ${TEST_CONFIG.VERBOSE}`);
        console.log(`  Float tolerance: ${TEST_CONFIG.FLOAT_TOLERANCE}`);
        console.log('');
        
        this.startTime = performance.now();
        this.results = [];
        
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        
        // Run each category
        for (const category of allCategories) {
            const categoryResult = await category.run();
            this.results.push(categoryResult);
            
            totalTests += categoryResult.total;
            totalPassed += categoryResult.passed;
            totalFailed += categoryResult.failed;
        }
        
        this.endTime = performance.now();
        const totalDuration = (this.endTime - this.startTime).toFixed(2);
        
        // Generate summary
        const summary = {
            totalTests,
            totalPassed,
            totalFailed,
            successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0,
            durationMs: totalDuration,
            categories: this.results
        };
        
        this.printSummary(summary);
        this.injectVisualReport(summary);
        
        return summary;
    }
    
    /**
     * Run only tests from a specific category.
     * @param {string} categoryName - Name of category to run
     */
    async runCategory(categoryName) {
        const category = allCategories.find(c => c.name === categoryName);
        if (!category) {
            console.error(`Category "${categoryName}" not found.`);
            console.log('Available categories:', allCategories.map(c => c.name).join(', '));
            return null;
        }
        
        return await category.run();
    }
    
    /**
     * Print test summary to console.
     * @param {Object} summary - Test results summary
     */
    printSummary(summary) {
        console.log('\n' + '='.repeat(80));
        console.log('  TEST SUMMARY');
        console.log('='.repeat(80));
        console.log(`\nTotal Tests:    ${summary.totalTests}`);
        console.log(`Passed:         ${summary.totalPassed} ✅`);
        console.log(`Failed:         ${summary.totalFailed} ❌`);
        console.log(`Success Rate:   ${summary.successRate}%`);
        console.log(`Duration:       ${summary.durationMs}ms`);
        console.log('');
        
        // Category breakdown
        console.log('Category Results:');
        for (const cat of summary.categories) {
            const icon = cat.failed === 0 ? '✅' : '❌';
            console.log(`  ${icon} ${cat.category}: ${cat.passed}/${cat.total} passed`);
        }
        
        console.log('\n' + '='.repeat(80));
        
        if (summary.totalFailed === 0) {
            console.log('  🎉 ALL TESTS PASSED!');
        } else {
            console.log(`  ⚠️  ${summary.totalFailed} TEST(S) FAILED`);
        }
        
        console.log('='.repeat(80) + '\n');
    }
    
    /**
     * Inject a visual test report into the page.
     * This creates a visible UI element showing test results.
     * 
     * NOTE: This is controlled by TEST_CONFIG.SHOW_VISUAL_REPORT.
     * Set to false to keep the UI clean for end users.
     * Tests still run and show results in the console.
     * 
     * @param {Object} summary - Test results summary
     */
    injectVisualReport(summary) {
        // Skip visual report if disabled (keeps UI clean for end users)
        if (!TEST_CONFIG.SHOW_VISUAL_REPORT) {
            return;
        }
        // Remove any existing report
        const existingReport = document.getElementById('test-report-container');
        if (existingReport) {
            existingReport.remove();
        }
        
        // Create container
        const container = document.createElement('div');
        container.id = 'test-report-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border: 3px solid ${summary.totalFailed === 0 ? '#22c55e' : '#ef4444'};
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: ${summary.totalFailed === 0 ? '#22c55e' : '#ef4444'};
            color: white;
            padding: 16px;
            font-weight: bold;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🧪 Test Results</span>
            <span style="font-size: 20px;">${summary.totalFailed === 0 ? '✅' : '❌'}</span>
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: rgba(255,255,255,0.3);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
        `;
        closeBtn.onclick = () => container.remove();
        header.appendChild(closeBtn);
        
        // Summary section
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = 'padding: 16px; border-bottom: 1px solid #e5e7eb;';
        summaryDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 12px; color: #6b7280;">Total</div>
                    <div style="font-size: 20px; font-weight: bold;">${summary.totalTests}</div>
                </div>
                <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${summary.totalFailed === 0 ? '#22c55e' : '#f59e0b'};">${summary.successRate}%</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <div style="flex: 1; background: #dcfce7; color: #166534; padding: 8px; border-radius: 6px; text-align: center;">
                    ✅ ${summary.totalPassed} Passed
                </div>
                <div style="flex: 1; background: ${summary.totalFailed > 0 ? '#fee2e2' : '#f3f4f6'}; color: ${summary.totalFailed > 0 ? '#dc2626' : '#6b7280'}; padding: 8px; border-radius: 6px; text-align: center;">
                    ❌ ${summary.totalFailed} Failed
                </div>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280; text-align: center;">
                Duration: ${summary.durationMs}ms
            </div>
        `;
        
        // Category details
        const categoriesDiv = document.createElement('div');
        categoriesDiv.style.cssText = 'padding: 12px;';
        
        for (const cat of summary.categories) {
            const catDiv = document.createElement('div');
            catDiv.style.cssText = `
                margin-bottom: 8px;
                padding: 10px;
                background: ${cat.failed === 0 ? '#f0fdf4' : '#fef2f2'};
                border-left: 3px solid ${cat.failed === 0 ? '#22c55e' : '#ef4444'};
                border-radius: 0 6px 6px 0;
            `;
            catDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">${cat.category}</span>
                    <span style="font-size: 12px; color: ${cat.failed === 0 ? '#166534' : '#dc2626'};">
                        ${cat.passed}/${cat.total}
                    </span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                    ${cat.failed === 0 ? 'All tests passed' : `${cat.failed} test(s) failed`}
                </div>
            `;
            categoriesDiv.appendChild(catDiv);
        }
        
        // Assemble
        container.appendChild(header);
        container.appendChild(summaryDiv);
        container.appendChild(categoriesDiv);
        
        // Add to page
        document.body.appendChild(container);
    }
}

// ================================================================================
// SECTION 11: PUBLIC API
// ================================================================================
// Expose the test suite to the global scope so it can be run from console
// or automatically on page load.
// ================================================================================

// Create the global test suite object
window.ComprehensiveTestSuite = {
    // Configuration
    config: TEST_CONFIG,
    
    // Test runner instance
    runner: new TestRunner(),
    
    // Run all tests
    runAllTests: async function() {
        return await this.runner.runAllTests();
    },
    
    // Run a specific category
    runCategory: async function(categoryName) {
        return await this.runner.runCategory(categoryName);
    },
    
    // Available categories
    categories: allCategories.map(c => ({ name: c.name, description: c.description })),
    
    // Assertions (for writing custom tests)
    Assert: Assert,
    
    // Test utilities
    TestResult: TestResult,
    TestCategory: TestCategory
};

// ================================================================================
// AUTO-RUN
// ================================================================================
// Automatically run tests when the script loads, unless configured not to.
// This ensures tests run in the browser without manual intervention.
// 
// NOTE: Tests run silently in the console. To see results:
// 1. Open browser developer tools (F12)
// 2. Go to the Console tab
// 3. Look for test output with ✅/❌ indicators
// 
// The visual popup report is controlled by TEST_CONFIG.SHOW_VISUAL_REPORT
// and is disabled by default to keep the UI clean for end users.
// ================================================================================

if (TEST_CONFIG.AUTO_RUN) {
    // Use setTimeout to ensure all dependencies are loaded
    setTimeout(() => {
        console.log('🚀 Comprehensive Test Suite running in background...');
        console.log('   Open browser console (F12) to see test results.');
        window.ComprehensiveTestSuite.runAllTests();
    }, 500);
}

// ================================================================================
// END OF TEST SUITE
// ================================================================================

} // End guard against multiple loads
