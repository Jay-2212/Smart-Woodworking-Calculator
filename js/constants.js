/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * CONSTANTS MODULE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains all app-wide constants, magic numbers, and icon definitions.
 * Centralizes configuration values that may need adjustment across the app.
 * 
 * FILE LOCATION: js/constants.js
 * 
 * DEPENDENCIES:
 * - React (loaded globally via CDN in index.html)
 * 
 * USED BY:
 * - js/calculations.js (uses HALF_FOOT_THRESHOLD, CUBIC_INCH_TO_CFT_DIVISOR, INCHES_PER_FOOT)
 * - js/components.js (uses Icons, ErrorBoundary)
 * - js/app.js (uses RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT)
 * - js/three-scene.js (uses getSizeDims for dimensions)
 * 
 * EXPORTS:
 * - HALF_FOOT_THRESHOLD: Business threshold for half-foot rounding
 * - CUBIC_INCH_TO_CFT_DIVISOR: Conversion factor (144 = 12" × 12")
 * - INCHES_PER_FOOT: Standard inches per foot (12)
 * - RUNNER_RECOMMENDATIONS: Array of {min, count} for auto-runner calculation
 * - MIN_RUNNER_COUNT: Minimum number of runners (2)
 * - isInvalidNumber: Validation helper function
 * - Icon: SVG icon wrapper component
 * - Icons: Collection of app icons (Box, Plus, Trash, Rotate)
 * - ErrorBoundary: React error boundary for 3D visualization
 * 
 * ================================================================================
 */

// ================================================================================
// MAGIC NUMBERS - CALCULATION CONSTANTS
// These values are used in wood purchasing and CFT calculations
// ================================================================================

/**
 * Business threshold for half-foot rounding in wood purchasing.
 * Wood is sold in 0.5 foot increments, so we round up to the nearest 0.5 or 1.0.
 * The tiny tolerance (0.0001) prevents floating-point precision issues.
 * 
 * USED IN: js/calculations.js → getPurchasedFeet()
 */
const HALF_FOOT_THRESHOLD = 0.5001;

/**
 * Conversion factor for CFT calculation.
 * Since CFT formula uses: (feet × inches × inches) / 144
 * Where 144 = 12" × 12" (converting inch dimensions to foot-based volume)
 * 
 * FORMULA CONTEXT:
 * 1 cubic foot = 12" × 12" × 12" = 1728 cubic inches
 * When we have: feet × inches × inches, we divide by 144 (12×12) to get CFT
 * 
 * USED IN: js/calculations.js → calculateLineCFT()
 */
const CUBIC_INCH_TO_CFT_DIVISOR = 144;

/**
 * Standard inches per foot conversion.
 * 
 * USED IN: js/calculations.js → getPurchasedFeet()
 */
const INCHES_PER_FOOT = 12;

// ================================================================================
// RUNNER RECOMMENDATIONS - AUTO-CALCULATION THRESHOLDS
// Determines how many support runners to use based on box length
// ================================================================================

/**
 * Runner count recommendations based on box length.
 * Longer boxes need more runners to prevent flexing/sagging.
 * 
 * Array is in HIGH-TO-LOW order for threshold checking:
 * - If length > 70": use 5 runners
 * - If length > 60": use 4 runners
 * - If length > 50": use 3 runners
 * - Otherwise: use MIN_RUNNER_COUNT (2)
 * 
 * USED IN: js/app.js → getRecommendedRunnerCount()
 */
const RUNNER_RECOMMENDATIONS = [
    { min: 70, count: 5 },
    { min: 60, count: 4 },
    { min: 50, count: 3 }
];

/**
 * Minimum number of runners for any box.
 * Even small boxes need at least 2 runners for stability.
 * 
 * USED IN: js/app.js → getRecommendedRunnerCount()
 */
const MIN_RUNNER_COUNT = 2;

// ================================================================================
// VALIDATION HELPERS
// ================================================================================

/**
 * Validation helper - checks for invalid numeric values.
 * Returns true for values that should not be used in calculations.
 * 
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is invalid (null, undefined, NaN, or <= 0)
 * 
 * USED IN: js/calculations.js → getPurchasedFeet(), calculateLineCFT(), calculateCrateEffectiveLength()
 */
const isInvalidNumber = (value) => value === null || value === undefined || isNaN(value) || value <= 0;

// ================================================================================
// ICON COMPONENTS
// SVG-based icons used throughout the UI
// ================================================================================

/**
 * Base Icon component for rendering SVG icons.
 * Provides consistent styling for all icons in the app.
 * 
 * @param {ReactNode} path - SVG path elements to render
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 * 
 * USED BY: Icons object below
 */
const Icon = ({ path, size = 24, className = "" }) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 3,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className
    }, path)
);

/**
 * Icon library - all icons used in the app.
 * Each icon is a function component that wraps the base Icon component.
 * 
 * Available Icons:
 * - Box: 3D box icon for the header
 * - Plus: Plus symbol for adding items
 * - Trash: Delete/remove icon
 * - Rotate: Rotation indicator for 3D view
 * 
 * USED IN: js/components.js, js/app.js
 */
const Icons = {
    Box: (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement('path', { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
        React.createElement('polyline', { points: "3.27 6.96 12 12.01 20.73 6.96" }),
        React.createElement('line', { x1: "12", y1: "22.08", x2: "12", y2: "12" })
    )}),
    Plus: (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement('line', { x1: "12", y1: "5", x2: "12", y2: "19" }),
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )}),
    Trash: (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement('polyline', { points: "3 6 5 6 21 6" }),
        React.createElement('path', { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
    )}),
    Rotate: (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement('path', { d: "M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" })
    )})
};

// ================================================================================
// ERROR BOUNDARY COMPONENT
// Catches errors in 3D visualization and prevents app crash
// ================================================================================

/**
 * Error Boundary Component for 3D Visualization.
 * Wraps the Three.js scene to catch rendering errors gracefully.
 * 
 * BEHAVIOR:
 * - Catches JavaScript errors in child components
 * - Displays a user-friendly error message instead of crashing
 * - Logs errors to console for debugging
 * 
 * USED IN: js/app.js (wraps ThreeScene component)
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
    }

    componentDidCatch(error, info) {
        console.error('3D Visualization Error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                style: {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fef3c7',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    flexDirection: 'column',
                    padding: '20px',
                    textAlign: 'center'
                }
            },
                React.createElement('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '⚠️'),
                React.createElement('div', {
                    style: { fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }
                }, '3D Visualization Error'),
                React.createElement('div', {
                    style: { color: '#78350f', fontSize: '14px' }
                }, 'Something went wrong. Please refresh the page.')
            );
        }
        return this.props.children;
    }
}

// ================================================================================
// EXPORTS
// Make constants available globally for other modules
// ================================================================================

// Attach to window object for global access (since we're not using ES modules)
window.AppConstants = {
    HALF_FOOT_THRESHOLD,
    CUBIC_INCH_TO_CFT_DIVISOR,
    INCHES_PER_FOOT,
    RUNNER_RECOMMENDATIONS,
    MIN_RUNNER_COUNT,
    isInvalidNumber,
    Icon,
    Icons,
    ErrorBoundary
};
