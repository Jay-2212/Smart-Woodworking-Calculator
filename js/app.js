/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * MAIN APPLICATION MODULE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains the main App component with all state management and orchestration.
 * This is the central hub that coordinates all other modules.
 * 
 * FILE LOCATION: js/app.js
 * 
 * DEPENDENCIES (load order matters):
 * 1. js/constants.js
 *    - Uses: RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT, Icons, ErrorBoundary
 * 2. js/calculations.js
 *    - Uses: calculateLineCFT, getPurchasedFeet, getSizeDims, getMaxDim, getEffectiveCrateDims
 * 3. js/three-scene.js
 *    - Uses: ThreeScene
 * 4. js/components.js
 *    - Uses: NumberInput, CalculationRow, SupportCard, BoxTypeSelector
 * 
 * STATE STRUCTURE:
 * - dims: {l, w, h} - Internal box dimensions
 * - boxType: 'simple' | 'bottom' | 'crate'
 * - crateType: 'simple' | 'bottom'
 * - crateSettings: {plank, gap}
 * - costPerCFT: Price per cubic foot
 * - showStickyStats: Boolean for sticky header visibility
 * - runnerConfig: {bottomDir, sideDir} - Runner orientations
 * - mainRows: Panel dimensions (top, bottom, sides, kara)
 * - supps: Support runner configurations
 * - extras: Array of extra support items
 * - globalRunners: Number of runners (overridable)
 * 
 * CALCULATION FLOW:
 * 1. User enters box dimensions (dims)
 * 2. Auto-calculation (useEffect) updates mainRows and supps
 * 3. CFT calculated for each panel and support
 * 4. Total cost = Total CFT × costPerCFT
 * 
 * ================================================================================
 */

// ================================================================================
// DEPENDENCY CHECK
// ================================================================================

if (!window.AppConstants) {
    console.error('ERROR: js/constants.js must be loaded before js/app.js');
}
if (!window.AppCalculations) {
    console.error('ERROR: js/calculations.js must be loaded before js/app.js');
}
if (!window.AppThreeScene) {
    console.error('ERROR: js/three-scene.js must be loaded before js/app.js');
}
if (!window.AppComponents) {
    console.error('ERROR: js/components.js must be loaded before js/app.js');
}

// Guard against multiple loads
if (!window.App) {

// ================================================================================
// IMPORTS FROM OTHER MODULES
// ================================================================================

// From js/constants.js
const { 
    RUNNER_RECOMMENDATIONS, 
    MIN_RUNNER_COUNT, 
    Icons: AppIcons, 
    ErrorBoundary,
    CUBIC_INCH_TO_CFT_DIVISOR: CFT_DIVISOR
} = window.AppConstants;

// From js/calculations.js
const { 
    calculateLineCFT: calcLineCFT, 
    getPurchasedFeet: getPurchFeet, 
    getSizeDims: getSizeD, 
    getMaxDim: getMaxD, 
    getEffectiveCrateDims: getEffCrateDims
} = window.AppCalculations;

// From js/three-scene.js
const { ThreeScene } = window.AppThreeScene;

// From js/components.js
const { 
    NumberInput, 
    CalculationRow, 
    SupportCard, 
    BoxTypeSelector 
} = window.AppComponents;

// React hooks
const { useState, useEffect, useRef, useMemo } = React;

// ================================================================================
// HELPER FUNCTION
// ================================================================================

/**
 * Gets recommended runner count based on box length.
 * Longer boxes need more runners to prevent flexing/sagging.
 * 
 * @param {number|string} len - Box length in inches
 * @returns {number} Recommended number of runners
 * 
 * THRESHOLDS (from RUNNER_RECOMMENDATIONS in js/constants.js):
 * - > 70": 5 runners
 * - > 60": 4 runners
 * - > 50": 3 runners
 * - Otherwise: 2 runners (MIN_RUNNER_COUNT)
 */
const getRecommendedRunnerCount = (len) => {
    const l = parseFloat(len) || 0;
    for (const { min, count } of RUNNER_RECOMMENDATIONS) {
        if (l > min) return count;
    }
    return MIN_RUNNER_COUNT;
};

// ================================================================================
// INPUT VALIDATION HELPERS
// Keep raw input values in state so an empty field remains visibly incomplete
// instead of being silently treated as a zero-value quotation.
// ================================================================================

const isFiniteInput = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return Number.isFinite(Number(value));
};

const positiveInputError = (value) => {
    if (!isFiniteInput(value)) return 'Enter a number greater than 0.';
    return Number(value) > 0 ? '' : 'Enter a value greater than 0.';
};

const quantityInputError = (value) => {
    if (!isFiniteInput(value)) return 'Enter a quantity. 0 is allowed.';
    return Number(value) >= 0 ? '' : 'Quantity cannot be negative.';
};

const rateInputError = (value) => {
    if (!isFiniteInput(value)) return 'Enter a rate, or type 0 for no charge.';
    return Number(value) >= 0 ? '' : 'Rate cannot be negative.';
};

// ================================================================================
// MAIN APPLICATION COMPONENT
// ================================================================================

/**
 * App Component
 * 
 * The main application component that manages all state and renders the UI.
 * 
 * SECTIONS RENDERED:
 * 1. Sticky Stats Bar (shown on scroll)
 * 2. Header with branding
 * 3. Total Cost Card with CFT and rate
 * 4. Internal Size Input (L × W × H)
 * 5. Box Type Selector
 * 6. 3D Visualization
 * 7. Box Components Table
 * 8. Runners & Supports Section
 *    - Support Cards
 *    - Extra Supports
 */
function App() {
    // ================================================================
    // STATE: Box Dimensions
    // These are the INTERNAL dimensions of the box
    // ================================================================
    const [dims, setDims] = useState({ l: 40, w: 20, h: 20 });

    // ================================================================
    // STATE: Box Type Configuration
    // ================================================================
    const [boxType, setBoxType] = useState('simple');
    const [crateType, setCrateType] = useState('simple');
    const [crateSettings, setCrateSettings] = useState({ plank: 4, gap: 4 });

    // ================================================================
    // STATE: Pricing
    // costPerCFT is the price per cubic foot of wood
    // ================================================================
    const [costPerCFT, setCostPerCFT] = useState(625);

    // ================================================================
    // STATE: UI Controls
    // ================================================================
    const [showStickyStats, setShowStickyStats] = useState(false);
    const headerRef = useRef(null);

    // ================================================================
    // STATE: Runner Configuration
    // Controls the orientation of runners in 3D visualization
    // ================================================================
    const [runnerConfig, setRunnerConfig] = useState({
        bottomDir: 'width',    // 'width' = width-wise, 'length' = horizontal
        sideDir: 'vertical'    // 'vertical' = up/down, 'horizontal' = along length
    });

    // ================================================================
    // STATE: Main Panel Dimensions
    // These get auto-calculated based on box dimensions
    // ================================================================
    const [mainRows, setMainRows] = useState({
        top: { l: 44, w: 22, t: 1, qty: 2 },      // Simple box: displayed as "Top & Bottom" combined row
        bottom: { l: 44, w: 22, t: 1, qty: 2 },   // Simple box: same as top, both shown in one row with qty=2
        sides: { l: 44, w: 20, t: 1, qty: 2 },
        kara: { l: 20, w: 20, t: 1, qty: 2 }
    });

    // ================================================================
    // STATE: Support Runner Configuration
    // These also get auto-calculated
    // ================================================================
    const [supps, setSupps] = useState({
        bottom: { size: '4x2', dim: 22, count: 2 },
        sides: { size: '3x1', dim: 20, count: 4 },
        top: { size: '3x1', dim: 22, count: 2 },
        karaHorz: { size: '3x1', dim: 20, count: 4 },
        karaVert: { size: '3x1', dim: 14, count: 4 }
    });

    // ================================================================
    // STATE: Extra Supports (user-added)
    // ================================================================
    const [extras, setExtras] = useState([]);

    // ================================================================
    // STATE: Global Runner Count
    // User can override the auto-calculated runner count
    // ================================================================
    const [globalRunners, setGlobalRunners] = useState(2);

    // ================================================================
    // COMPUTED: Recommended Runners
    // Recalculates when box length changes
    // ================================================================
    const recommendedRunners = useMemo(() => getRecommendedRunnerCount(dims.l), [dims.l]);

    // ================================================================
    // EFFECT: Sticky Header on Scroll
    // Shows a mini stats bar when user scrolls down
    // ================================================================
    useEffect(() => {
        const handleScroll = () => {
            if (headerRef.current) {
                if (window.scrollY > 280) setShowStickyStats(true);
                else setShowStickyStats(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ================================================================
    // EFFECT: Auto-adjust global runners based on length
    // Updates when dimensions change (both increase and decrease)
    // ================================================================
    useEffect(() => {
        if (boxType === 'simple') {
            // Always update runners to match the recommended count for the current length
            setGlobalRunners(recommendedRunners);
        }
    }, [recommendedRunners, boxType]);

    // ================================================================
    // EFFECT: Auto-calculate dimensions based on box size and type
    // This is the main calculation engine that updates panel and runner sizes
    // ================================================================
    useEffect(() => {
        const l = parseFloat(dims.l) || 0;
        const w = parseFloat(dims.w) || 0;
        const h = parseFloat(dims.h) || 0;

        const isBottomLogic = (boxType === 'bottom' || (boxType === 'crate' && crateType === 'bottom'));
        const isSimpleLogic = !isBottomLogic;
        const estimatedCount = globalRunners;

        if (isSimpleLogic) {
            // ============================================================
            // SIMPLE TYPE CALCULATION
            // Box sits on runners, panels have overhang
            // ============================================================
            const baseL = l + 4;  // 4" overhang on length
            const baseW = w + 2;  // 2" overhang on width

            setMainRows({
                top: { l: baseL, w: baseW, t: 1, qty: 2 },     // qty=2: UI shows "Top & Bottom" as one combined row
                bottom: { l: baseL, w: baseW, t: 1, qty: 2 },  // Same as top, displayed together in the UI
                sides: { l: baseL, w: h, t: 1, qty: 2 },
                kara: { l: w, w: h, t: 1, qty: 2 }
            });

            setSupps(prev => {
                const bSize = getMaxD(prev.bottom.size);
                let bRunLen;
                if (runnerConfig.bottomDir === 'width') bRunLen = baseW;
                else bRunLen = baseL;

                let sRunLen;
                if (runnerConfig.sideDir === 'horizontal') {
                    sRunLen = baseL;
                } else {
                    const bottomAdd = (runnerConfig.bottomDir === 'width') ? bSize : 0;
                    sRunLen = h + bottomAdd + 2;
                }

                const kRunLen = w;
                const kSuppWidth = getSizeD(prev.karaHorz.size).w;
                const kVertLen = Math.max(0, h - (2 * kSuppWidth));

                return {
                    ...prev,
                    bottom: { ...prev.bottom, dim: bRunLen, count: estimatedCount },
                    sides: { ...prev.sides, dim: sRunLen, count: estimatedCount * 2 },
                    top: { ...prev.top, dim: baseW, count: estimatedCount },
                    karaHorz: { ...prev.karaHorz, dim: kRunLen, count: 4 },
                    karaVert: { ...prev.karaVert, dim: kVertLen, count: 4 }
                };
            });

        } else {
            // ============================================================
            // BOTTOM TYPE CALCULATION
            // Runners built into bottom structure
            // ============================================================
            const bRunLen = l + 2;
            const sidePanelL = l + 2;
            const sidePanelH = h + 1;
            const sideRunLen = l + 4;
            const topL = l + 4;
            const topW = w + 4;

            setMainRows({
                top: { l: topL, w: topW, t: 1, qty: 1 },
                bottom: { l: l, w: w, t: 1, qty: 1 },
                sides: { l: sidePanelL, w: sidePanelH, t: 1, qty: 2 },
                kara: { l: w, w: h + 1, t: 1, qty: 2 }
            });

            setSupps(prev => {
                const bSize = getMaxD(prev.bottom.size);
                const kVertLen = h + bSize + 2;

                return {
                    ...prev,
                    bottom: { ...prev.bottom, dim: bRunLen, count: estimatedCount },
                    sides: { ...prev.sides, dim: sideRunLen, count: estimatedCount * 2 },
                    top: { ...prev.top, dim: topL, count: estimatedCount },
                    karaHorz: { ...prev.karaHorz, count: 0 },
                    karaVert: { ...prev.karaVert, dim: kVertLen, count: estimatedCount * 2 }
                };
            });
        }

    }, [dims.l, dims.w, dims.h, boxType, crateType, globalRunners, runnerConfig, supps.bottom.size, supps.karaHorz.size]);

    // ================================================================
    // HANDLERS: User Interactions
    // ================================================================
    
    /**
     * Handler for global runner count changes
     * Validates and updates the runner count
     */
    const handleGlobalRunnerChange = (val) => {
        const parsedValue = parseInt(val);
        const validatedCount = Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
        setGlobalRunners(validatedCount);
    };

    /**
     * Handler for main row (panel) updates
     */
    const updateMainRow = (key, field, val) => {
        setMainRows(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    };

    /**
     * Handler for support runner updates
     */
    const updateSupp = (key, field, val) => {
        setSupps(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    };

    /**
     * Handler for runner configuration changes
     */
    const handleConfigChange = (key, val) => {
        setRunnerConfig(prev => ({ ...prev, [key]: val }));
    };

    /**
     * Moves only when the user asks for help, never while they are typing.
     */
    const focusFirstInvalid = () => {
        const first = document.querySelector('[aria-invalid="true"]');
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first?.focus({ preventScroll: true });
    };

    /**
     * Handlers for extra supports
     */
    const addExtra = () => setExtras(p => [...p, { 
        id: Date.now(), 
        l: 12, 
        w: 3, 
        t: 1, 
        qty: 1, 
        size: '3x1' 
    }]);
    
    const removeExtra = (id) => setExtras(p => p.filter(x => x.id !== id));
    
    const updateExtra = (id, field, val) => {
        setExtras(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));
    };

    // ================================================================
    // CALCULATIONS: CFT Totals
    // ================================================================
    
    /**
     * Calculates CFT for a single row, applying crate adjustments if needed
     */
    const getRowCFT = (label, data) => {
        let effL = data.l;
        let effW = data.w;
        if (boxType === 'crate') {
            let partName = '';
            if (label.includes('Sides')) partName = 'Sides';
            else if (label.includes('Kara')) partName = 'Kara';
            else if (label.includes('Top')) partName = 'Top';

            if (partName) {
                const specificBoxType = (crateType === 'simple') ? 'crateSimple' : 'crateBottom';
                const res = getEffCrateDims(partName, data.l, data.w, specificBoxType, crateSettings);
                effL = res.l;
                effW = res.w;
            }
        }
        return calcLineCFT(effL, effW, data.t, data.qty);
    };

    // Total CFT for all panels
    const totalBoard = boxType === 'simple'
        ? getRowCFT("Top", mainRows.top) +
            getRowCFT("Sides", mainRows.sides) +
            getRowCFT("Kara", mainRows.kara)
        : getRowCFT("Top", mainRows.top) +
            getRowCFT("Bottom", mainRows.bottom) +
            getRowCFT("Sides", mainRows.sides) +
            getRowCFT("Kara", mainRows.kara);

    /**
     * Calculates CFT for a support runner configuration
     */
    const sumSupp = (s) => {
        const d = getSizeD(s.size);
        const feet = getPurchFeet(s.dim);
        return ((feet * d.w * d.t) / CFT_DIVISOR) * s.count;
    };

    // Total CFT for all supports (including extras)
    const totalSupp = sumSupp(supps.bottom) + sumSupp(supps.sides) + sumSupp(supps.top) +
        sumSupp(supps.karaHorz) + sumSupp(supps.karaVert) +
        extras.reduce((acc, e) => acc + calcLineCFT(e.l, e.w, e.t, e.qty), 0);

    // Grand totals
    const grandTotalCFT = totalBoard + totalSupp;
    const grandTotalCost = grandTotalCFT * costPerCFT;

    // Helper flag for bottom type logic
    const isBottomType = (boxType === 'bottom' || (boxType === 'crate' && crateType === 'bottom'));

    // ============================================================================
    // COMPUTED: Quote readiness
    // Crate plank/gap settings are intentionally excluded: their protected rules
    // retain their existing behavior in this hardening pass.
    // ============================================================================
    const validation = useMemo(() => {
        const errors = [];
        const main = {};
        const panels = {};
        const supports = {};
        const extraSupports = {};

        const addError = (label, message) => {
            if (message) errors.push({ label, message });
            return message;
        };

        const mainLabels = { l: 'Internal length', w: 'Internal width', h: 'Internal height' };
        Object.keys(mainLabels).forEach(key => {
            main[key] = addError(mainLabels[key], positiveInputError(dims[key]));
        });

        const panelLabels = {
            top: 'Top & Bottom',
            bottom: 'Bottom',
            sides: 'Sides',
            kara: 'Kara (Ends)'
        };
        const visiblePanelKeys = isBottomType ? ['bottom', 'top', 'sides', 'kara'] : ['top', 'sides', 'kara'];
        visiblePanelKeys.forEach(key => {
            const row = mainRows[key];
            panels[key] = {
                l: addError(`${panelLabels[key]} length`, positiveInputError(row.l)),
                w: addError(`${panelLabels[key]} width`, positiveInputError(row.w)),
                t: addError(`${panelLabels[key]} thickness`, positiveInputError(row.t)),
                qty: addError(`${panelLabels[key]} quantity`, quantityInputError(row.qty))
            };
        });

        const supportLabels = {
            bottom: 'Bottom Supports',
            sides: 'Side Supports',
            top: 'Top Lid Supports',
            karaHorz: 'Kara Horizontal',
            karaVert: isBottomType ? 'Kara Vertical (Ends)' : 'Kara Vertical (Gap)'
        };
        const visibleSupportKeys = isBottomType
            ? ['bottom', 'sides', 'top', 'karaVert']
            : ['bottom', 'sides', 'top', 'karaHorz', 'karaVert'];
        visibleSupportKeys.forEach(key => {
            supports[key] = addError(`${supportLabels[key]} quantity`, quantityInputError(supps[key].count));
        });

        extras.forEach((extra, index) => {
            const label = `Extra support ${index + 1}`;
            extraSupports[extra.id] = {
                l: addError(`${label} length`, positiveInputError(extra.l)),
                w: addError(`${label} width`, positiveInputError(extra.w)),
                t: addError(`${label} thickness`, positiveInputError(extra.t)),
                qty: addError(`${label} quantity`, quantityInputError(extra.qty))
            };
        });

        const rate = addError('Rate', rateInputError(costPerCFT));

        return {
            main,
            panels,
            supports,
            extraSupports,
            rate,
            errors,
            isComplete: errors.length === 0
        };
    }, [dims, mainRows, supps, extras, costPerCFT, isBottomType]);

    const quoteSummary = validation.isComplete
        ? `Quote ready: ${grandTotalCFT.toFixed(2)} CFT, ₹${Math.round(grandTotalCost).toLocaleString()}.`
        : 'Quote incomplete. Fill the highlighted values before using this total.';

    // ================================================================
    // COMPUTED: Dimension values for direction toggle buttons
    // Pre-calculate dimensions for both directions to display in UI
    // ================================================================
    const runnerDimensions = useMemo(() => {
        const l = parseFloat(dims.l) || 0;
        const w = parseFloat(dims.w) || 0;
        const h = parseFloat(dims.h) || 0;
        const baseL = l + 4;  // 4" overhang on length
        const baseW = w + 2;  // 2" overhang on width
        const bSize = getMaxD(supps.bottom.size);
        
        // Bottom supports: width-wise vs horizontal
        const bottomWidthDim = Math.round(baseW);
        const bottomLengthDim = Math.round(baseL);
        
        // Side supports: vertical vs horizontal
        const bottomAdd = (runnerConfig.bottomDir === 'width') ? bSize : 0;
        const sideVerticalDim = Math.round(h + bottomAdd + 2);
        const sideHorizontalDim = Math.round(baseL);
        
        return {
            bottomWidthDim,
            bottomLengthDim,
            sideVerticalDim,
            sideHorizontalDim
        };
    }, [dims.l, dims.w, dims.h, supps.bottom.size, runnerConfig.bottomDir]);

    // ================================================================
    // RENDER
    // ================================================================
    return React.createElement('div', { className: "min-h-screen pb-10 wood-pattern" },

        // ============================================================
        // STICKY STATS BAR
        // Shows on scroll for quick reference
        // Always rendered but hidden/shown with CSS to prevent flickering
        // ============================================================
        React.createElement('div', {
            className: `fixed top-0 left-0 w-full bg-slate-900 z-[100] shadow-xl border-b-4 border-amber-600 p-3 px-4 transition-all duration-300 ${
                showStickyStats ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
            }`,
            style: { willChange: 'transform, opacity' }
        },
            React.createElement('div', {
                className: "max-w-2xl mx-auto flex justify-between items-center text-white"
            },
                React.createElement('div', null,
                    React.createElement('div', {
                        className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    }, "Internal Size"),
                    React.createElement('div', {
                        className: "text-xl font-black text-amber-500 leading-none mt-1"
                    }, 
                        dims.l, 
                        React.createElement('span', { className: "text-slate-500 text-sm" }, " x "),
                        dims.w,
                        React.createElement('span', { className: "text-slate-500 text-sm" }, " x "),
                        dims.h
                    )
                ),
                React.createElement('div', { className: "text-right" },
                    React.createElement('div', {
                        className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    }, "Type"),
                    React.createElement('div', {
                        className: "text-lg font-black text-white uppercase"
                    }, boxType)
                )
            )
        ),

        // ============================================================
        // HEADER
        // Brand name and app title
        // ============================================================
        React.createElement('div', {
            ref: headerRef,
            className: "bg-slate-900 text-white shadow-xl relative z-50 border-b-4 border-amber-600"
        },
            React.createElement('div', { className: "max-w-2xl mx-auto p-4 pb-4" },
                React.createElement('div', {
                    className: "flex flex-col items-center justify-center text-center"
                },
                    React.createElement('h1', {
                        className: "font-brand font-black text-2xl md:text-3xl text-amber-500 tracking-wide uppercase",
                        style: { textShadow: '2px 2px 0px #000' }
                    }, "Ambica Wooden Works"),
                    React.createElement('p', {
                        className: "text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1"
                    }, "Smart CFT Calculator")
                )
            )
        ),

        // ============================================================
        // MAIN CONTENT
        // ============================================================
        React.createElement('div', { className: "max-w-2xl mx-auto p-3 space-y-6 mt-4" },

            // ============================================================
            // TOTAL COST CARD
            // ============================================================
            React.createElement('div', {
                className: "bg-slate-800 rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] border-4 border-amber-600 text-center"
            },
                React.createElement('div', {
                    className: "text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-2"
                }, validation.isComplete ? "Total Project Cost" : "Quote needs attention"),
                React.createElement('div', {
                    className: `text-6xl font-black text-white leading-none mb-6 ${validation.isComplete ? '' : 'quote-total--incomplete'}`,
                    'data-testid': "grand-total-cost"
                },
                    validation.isComplete
                        ? React.createElement(React.Fragment, null,
                            React.createElement('span', {
                                className: "text-3xl text-amber-600 align-top mr-1"
                            }, "₹"),
                            Math.round(grandTotalCost).toLocaleString()
                        )
                        : "Complete values"
                ),

                !validation.isComplete && React.createElement('div', {
                    className: "quote-incomplete",
                    'data-testid': 'quote-incomplete'
                },
                    React.createElement('strong', null, "Quote incomplete."),
                    React.createElement('span', null, `${validation.errors.length} highlighted value${validation.errors.length === 1 ? '' : 's'} need attention.`),
                    React.createElement('button', {
                        type: 'button',
                        onClick: focusFirstInvalid,
                        className: "quote-incomplete__button"
                    }, "Show first missing value")
                ),

                React.createElement('p', {
                    className: "quote-result-summary",
                    'data-testid': 'quote-result-summary',
                    'aria-live': 'polite'
                }, quoteSummary),

                // Rate and CFT inputs
                React.createElement('div', {
                    className: "quote-rate-summary bg-slate-900 p-4 rounded-xl border border-slate-700"
                },
                    React.createElement('div', { className: "flex flex-col items-center" },
                        React.createElement('label', {
                            for: 'rate-per-cft',
                            className: "text-xs font-bold text-slate-400 uppercase mb-1"
                        }, "Rate (₹/CFT)"),
                        React.createElement(NumberInput, {
                            id: 'rate-per-cft',
                            value: costPerCFT,
                            onChange: setCostPerCFT,
                            step: 1,
                            min: 0,
                            inputLabel: 'Rate, rupees per CFT',
                            invalid: Boolean(validation.rate),
                            className: "bg-white text-slate-900 font-black text-3xl w-32 p-2 rounded-lg text-center border-4 border-amber-500 focus:ring-4 focus:ring-amber-500/50"
                        }),
                        validation.rate && React.createElement('span', {
                            id: 'rate-per-cft-error',
                            className: "field-error field-error--dark"
                        }, validation.rate),
                        !validation.rate && Number(costPerCFT) === 0 && React.createElement('span', {
                            className: "quote-zero-rate"
                        }, "₹0 rate selected")
                    ),
                    React.createElement('div', {
                        className: "quote-rate-summary__divider h-12 w-0.5 bg-slate-600 mx-2"
                    }),
                    React.createElement('div', { className: "flex flex-col items-center" },
                        React.createElement('span', {
                            className: "text-xs font-bold text-slate-400 uppercase mb-1"
                        }, "Total CFT"),
                        React.createElement('span', {
                            className: "text-3xl font-black text-amber-400",
                            'data-testid': "grand-total-cft"
                        }, validation.isComplete ? grandTotalCFT.toFixed(2) : '—')
                    )
                )
            ),

            // ============================================================
            // INTERNAL SIZE INPUT
            // ============================================================
            React.createElement('div', {
                className: "bg-white p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black"
            },
                React.createElement('div', {
                    className: "flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-2"
                },
                    React.createElement('h2', {
                        className: "text-lg font-black text-black uppercase tracking-widest flex items-center gap-2"
                    },
                        React.createElement(AppIcons.Box, { className: "text-amber-600" }),
                        " Internal Size"
                    )
                ),
                React.createElement('div', { className: "grid grid-cols-3 gap-4" },
                    ['l', 'w', 'h'].map(k => {
                        const name = k === 'l' ? 'length' : k === 'w' ? 'width' : 'height';
                        const error = validation.main[k];
                        const inputId = `internal-${k}`;
                        return (
                        React.createElement('div', { key: k, className: "flex flex-col" },
                            React.createElement('label', {
                                for: inputId,
                                className: "text-xs text-black font-black mb-2 uppercase tracking-wide bg-amber-100 w-full text-center py-1 rounded border border-amber-200"
                            }, `Internal ${name}, inches`),
                            React.createElement('input', {
                                id: inputId,
                                'aria-label': `Internal ${name}, inches`,
                                'aria-invalid': error ? 'true' : 'false',
                                ...(error ? { 'aria-describedby': `${inputId}-error` } : {}),
                                type: "number",
                                value: dims[k],
                                onInput: (e) => setDims({ ...dims, [k]: e.target.value }),
                                className: `bg-white border-4 border-slate-900 rounded-xl p-2 text-4xl font-black text-black text-center focus:ring-4 focus:ring-amber-200 focus:border-amber-600 outline-none transition-all ${error ? 'input-invalid' : ''}`
                            }),
                            error && React.createElement('span', {
                                id: `${inputId}-error`,
                                className: "field-error"
                            }, error)
                        )
                    );
                    })
                )
            ),

            // ============================================================
            // BOX TYPE SELECTOR
            // ============================================================
            React.createElement(BoxTypeSelector, {
                type: boxType,
                setType: setBoxType,
                subType: crateType,
                setSubType: setCrateType,
                crateSettings: crateSettings,
                setCrateSettings: setCrateSettings
            }),

            // ============================================================
            // 3D VISUALIZATION
            // ============================================================
            React.createElement('div', {
                className: "bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black overflow-hidden relative",
                style: { height: '400px' }
            },
                React.createElement('div', {
                    className: "absolute top-0 left-0 bg-black text-white px-3 py-2 text-xs font-black uppercase rounded-br-lg z-10 flex items-center gap-2"
                },
                    React.createElement(AppIcons.Rotate, { size: 14 }),
                    " Tap & Drag to Rotate"
                ),
                React.createElement(ErrorBoundary, null,
                    React.createElement(ThreeScene, {
                        dims: dims,
                        boxType: boxType,
                        crateType: crateType,
                        mainRows: mainRows,
                        supps: supps,
                        runnerConfig: runnerConfig
                    })
                ),
                React.createElement('div', {
                    className: "absolute bottom-2 right-2 text-[10px] text-slate-400 font-bold bg-white/90 px-2 py-1 rounded border border-slate-200 pointer-events-none"
                }, "*Visualisation based on Calculated Cuts")
            ),

            // ============================================================
            // BOX COMPONENTS TABLE
            // ============================================================
            React.createElement('div', {
                className: "bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black overflow-hidden"
            },
                // Header
                React.createElement('div', {
                    className: "bg-slate-900 p-3 flex justify-between items-center"
                },
                    React.createElement('span', {
                        className: "font-black text-sm text-white uppercase tracking-wide"
                    }, "Box Components"),
                    React.createElement('span', {
                        className: "font-black text-xl text-amber-400",
                        'data-testid': "board-total"
                    }, 
                        totalBoard.toFixed(3),
                        React.createElement('span', { className: "text-xs text-slate-400" }, " CFT")
                    )
                ),

                // Column headers
                React.createElement('div', {
                    className: "calculation-column-headings bg-slate-100 border-b-2 border-slate-300 p-2 grid grid-cols-12 gap-2 text-[10px] font-black text-slate-600 uppercase text-center tracking-widest"
                },
                    React.createElement('div', { className: "col-span-3 text-left pl-1" }, "Part"),
                    React.createElement('div', { className: "col-span-2" }, "Len"),
                    React.createElement('div', { className: "col-span-2" }, "Wid"),
                    React.createElement('div', { className: "col-span-2" }, "Thk"),
                    React.createElement('div', { className: "col-span-1" }, "Qty"),
                    React.createElement('div', { className: "col-span-2 text-right" }, "CFT")
                ),

                // Rows
                React.createElement('div', { className: "p-3" },
                    !isBottomType && React.createElement(React.Fragment, null,
                        React.createElement(CalculationRow, {
                            label: "Top & Bottom",
                            data: mainRows.top,
                            onChange: (f, v) => { updateMainRow('top', f, v); updateMainRow('bottom', f, v); },
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateSimple",
                            invalidFields: validation.panels.top
                        }),
                        React.createElement(CalculationRow, {
                            label: "Sides",
                            data: mainRows.sides,
                            onChange: (f, v) => updateMainRow('sides', f, v),
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateSimple",
                            invalidFields: validation.panels.sides
                        }),
                        React.createElement(CalculationRow, {
                            label: "Kara (Ends)",
                            data: mainRows.kara,
                            onChange: (f, v) => updateMainRow('kara', f, v),
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateSimple",
                            invalidFields: validation.panels.kara
                        })
                    ),

                    isBottomType && React.createElement(React.Fragment, null,
                        React.createElement(CalculationRow, {
                            label: "Bottom",
                            data: mainRows.bottom,
                            onChange: (f, v) => updateMainRow('bottom', f, v),
                            isCrate: false,
                            crateSettings: crateSettings,
                            boxType: "crateBottom",
                            invalidFields: validation.panels.bottom
                        }),
                        React.createElement(CalculationRow, {
                            label: "Top Lid",
                            data: mainRows.top,
                            onChange: (f, v) => updateMainRow('top', f, v),
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateBottom",
                            invalidFields: validation.panels.top
                        }),
                        React.createElement(CalculationRow, {
                            label: "Sides",
                            data: mainRows.sides,
                            onChange: (f, v) => updateMainRow('sides', f, v),
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateBottom",
                            invalidFields: validation.panels.sides
                        }),
                        React.createElement(CalculationRow, {
                            label: "Kara (Ends)",
                            data: mainRows.kara,
                            onChange: (f, v) => updateMainRow('kara', f, v),
                            isCrate: boxType === 'crate',
                            crateSettings: crateSettings,
                            boxType: "crateBottom",
                            invalidFields: validation.panels.kara
                        })
                    )
                )
            ),

            // ============================================================
            // RUNNERS & SUPPORTS SECTION
            // ============================================================
            React.createElement('div', {
                className: "space-y-4 pt-4 border-t-4 border-dashed border-slate-300"
            },
                // Section header with global runner control
                React.createElement('div', {
                    className: "runners-section-header flex items-center justify-between bg-black text-white p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                },
                    React.createElement('div', null,
                        React.createElement('h3', {
                            className: "font-black text-xl uppercase tracking-wide text-amber-500"
                        }, "Runners & Supports"),
                        React.createElement('p', {
                            className: "text-sm text-slate-300 font-bold mt-1"
                        },
                            "Total: ",
                            React.createElement('span', {
                                'data-testid': "supports-total"
                            }, `${totalSupp.toFixed(3)} CFT`)
                        )
                    ),

                    React.createElement('div', { className: "flex flex-col items-end" },
                        React.createElement('span', {
                            className: "text-[10px] font-bold uppercase text-slate-400 mb-1"
                        }, "Global Override"),
                        React.createElement('div', {
                            className: "flex items-center bg-white rounded-lg p-1"
                        },
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => handleGlobalRunnerChange(globalRunners - 1),
                                'aria-label': 'Decrease global runner override',
                                className: "w-12 h-12 flex items-center justify-center bg-slate-200 rounded hover:bg-slate-300 text-black font-black text-xl"
                            }, "-"),
                            React.createElement('span', {
                                className: "w-12 text-center text-2xl font-black text-black"
                            }, globalRunners),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => handleGlobalRunnerChange(globalRunners + 1),
                                'aria-label': 'Increase global runner override',
                                className: "w-12 h-12 flex items-center justify-center bg-amber-500 rounded text-black font-black text-xl hover:bg-amber-600"
                            }, "+")
                        )
                    )
                ),

                // Support Cards Grid
                React.createElement('div', {
                    className: "grid grid-cols-1 md:grid-cols-2 gap-4"
                },
                    React.createElement(SupportCard, {
                        label: "Bottom Supports",
                        sizeOptions: ['4x3', '3x2', '4x2', '4x1.5', '4x1', '3x1'],
                        dimValue: supps.bottom.dim,
                        settings: supps.bottom,
                        onUpdate: (f, v) => updateSupp('bottom', f, v),
                        colorClass: "bg-amber-50 border-amber-900",
                        configKey: "bottomDir",
                        runnerConfig: runnerConfig,
                        onConfigChange: handleConfigChange,
                        fixedDir: isBottomType ? 'Horizontal' : null,
                        widthDim: runnerDimensions.bottomWidthDim,
                        lengthDim: runnerDimensions.bottomLengthDim,
                        invalidCount: validation.supports.bottom
                    }),

                    React.createElement(SupportCard, {
                        label: "Side Supports",
                        sizeOptions: ['3x1', '4x1', '3x1.5', '4x1.5'],
                        dimValue: supps.sides.dim,
                        settings: supps.sides,
                        onUpdate: (f, v) => updateSupp('sides', f, v),
                        configKey: "sideDir",
                        runnerConfig: runnerConfig,
                        onConfigChange: handleConfigChange,
                        fixedDir: isBottomType ? 'Horizontal' : null,
                        widthDim: runnerDimensions.sideVerticalDim,
                        lengthDim: runnerDimensions.sideHorizontalDim,
                        invalidCount: validation.supports.sides
                    }),

                    React.createElement(SupportCard, {
                        label: "Top Lid Supports",
                        sizeOptions: ['3x1', '4x1', '3x1.5'],
                        dimValue: supps.top.dim,
                        settings: supps.top,
                        onUpdate: (f, v) => updateSupp('top', f, v),
                        invalidCount: validation.supports.top
                    }),

                    !isBottomType && React.createElement(React.Fragment, null,
                        React.createElement(SupportCard, {
                            label: "Kara Horizontal",
                            sizeOptions: ['3x1', '4x1'],
                            dimValue: supps.karaHorz.dim,
                            settings: supps.karaHorz,
                            onUpdate: (f, v) => updateSupp('karaHorz', f, v),
                            invalidCount: validation.supports.karaHorz
                        }),
                        React.createElement(SupportCard, {
                            label: "Kara Vertical (Gap)",
                            sizeOptions: ['3x1', '4x1'],
                            dimValue: supps.karaVert.dim,
                            settings: supps.karaVert,
                            onUpdate: (f, v) => updateSupp('karaVert', f, v),
                            invalidCount: validation.supports.karaVert
                        })
                    ),
                    
                    isBottomType && React.createElement(SupportCard, {
                        label: "Kara Vertical (Ends)",
                        sizeOptions: ['3x1', '4x1'],
                        dimValue: supps.karaVert.dim,
                        settings: supps.karaVert,
                        onUpdate: (f, v) => updateSupp('karaVert', f, v),
                        fixedDir: "Vertical",
                        invalidCount: validation.supports.karaVert
                    })
                ),

                // Extra Supports
                extras.map((ex, index) => {
                    const number = index + 1;
                    const label = `Extra support ${number}`;
                    const inputPrefix = `extra-support-${number}`;
                    const errors = validation.extraSupports[ex.id] || {};
                    const incomplete = Object.values(errors).some(Boolean);

                    return React.createElement('div', {
                        key: ex.id,
                        className: "rounded-xl shadow-md border-2 border-blue-600 bg-white overflow-hidden mb-3"
                    },
                        React.createElement('div', {
                            className: "p-3 border-b border-blue-200 flex justify-between items-center bg-blue-50"
                        },
                            React.createElement('span', {
                                className: "text-sm font-black text-blue-800 uppercase tracking-wide"
                            }, `Extra Support ${number}`),
                            React.createElement('div', { className: "flex items-center gap-3" },
                                React.createElement('span', {
                                    className: "font-mono font-black text-xl text-amber-800",
                                    'aria-label': `${label} CFT`
                                }, incomplete ? '—' : calcLineCFT(ex.l, ex.w, ex.t, ex.qty).toFixed(2)),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => removeExtra(ex.id),
                                    'aria-label': `Remove ${label}`,
                                    className: "text-white bg-red-600 p-2 rounded-lg border-2 border-red-800 hover:bg-red-700 shadow-sm"
                                }, React.createElement(AppIcons.Trash, { size: 20 }))
                            )
                        ),
                        React.createElement('div', { className: "p-4 space-y-3" },
                            React.createElement('div', { className: "extra-support-fields" },
                                React.createElement('div', { className: "extra-support-fields__size" },
                                    React.createElement('label', {
                                        for: `${inputPrefix}-size`,
                                        className: "text-xs text-black font-black uppercase mb-1 block"
                                    }, "Size"),
                                    React.createElement('select', {
                                        id: `${inputPrefix}-size`,
                                        'aria-label': `${label} size`,
                                        className: "w-full border-2 border-slate-900 rounded-lg p-2 font-black text-black",
                                        value: ex.size,
                                        onChange: (e) => {
                                            const s = getSizeD(e.target.value);
                                            updateExtra(ex.id, 'size', e.target.value);
                                            updateExtra(ex.id, 'w', s.w);
                                            updateExtra(ex.id, 't', s.t);
                                        }
                                    },
                                        React.createElement('option', { value: "Custom" }, "Custom"),
                                        React.createElement('option', { value: "3x1" }, "3 x 1"),
                                        React.createElement('option', { value: "4x1" }, "4 x 1")
                                    )
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', {
                                        for: `${inputPrefix}-width`,
                                        className: "text-xs text-black font-black uppercase mb-1 block"
                                    }, "Width, inches"),
                                    React.createElement(NumberInput, {
                                        id: `${inputPrefix}-width`,
                                        value: ex.w,
                                        onChange: (v) => updateExtra(ex.id, 'w', v),
                                        inputLabel: `${label} width, inches`,
                                        invalid: Boolean(errors.w)
                                    }),
                                    errors.w && React.createElement('span', {
                                        id: `${inputPrefix}-width-error`,
                                        className: "field-error"
                                    }, errors.w)
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', {
                                        for: `${inputPrefix}-thickness`,
                                        className: "text-xs text-black font-black uppercase mb-1 block"
                                    }, "Thickness, inches"),
                                    React.createElement(NumberInput, {
                                        id: `${inputPrefix}-thickness`,
                                        value: ex.t,
                                        onChange: (v) => updateExtra(ex.id, 't', v),
                                        step: 0.25,
                                        inputLabel: `${label} thickness, inches`,
                                        invalid: Boolean(errors.t)
                                    }),
                                    errors.t && React.createElement('span', {
                                        id: `${inputPrefix}-thickness-error`,
                                        className: "field-error"
                                    }, errors.t)
                                )
                            ),
                            React.createElement('div', { className: "grid grid-cols-2 gap-3" },
                                React.createElement('div', null,
                                    React.createElement('label', {
                                        for: `${inputPrefix}-length`,
                                        className: "text-xs text-black font-black uppercase mb-1 block"
                                    }, "Length, inches"),
                                    React.createElement(NumberInput, {
                                        id: `${inputPrefix}-length`,
                                        value: ex.l,
                                        onChange: (v) => updateExtra(ex.id, 'l', v),
                                        inputLabel: `${label} length, inches`,
                                        invalid: Boolean(errors.l)
                                    }),
                                    errors.l && React.createElement('span', {
                                        id: `${inputPrefix}-length-error`,
                                        className: "field-error"
                                    }, errors.l)
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', {
                                        for: `${inputPrefix}-quantity`,
                                        className: "text-xs text-black font-black uppercase mb-1 block"
                                    }, "Quantity"),
                                    React.createElement(NumberInput, {
                                        id: `${inputPrefix}-quantity`,
                                        value: ex.qty,
                                        onChange: (v) => updateExtra(ex.id, 'qty', v),
                                        step: 1,
                                        min: 0,
                                        inputLabel: `${label} quantity`,
                                        invalid: Boolean(errors.qty),
                                        className: "bg-blue-50"
                                    }),
                                    errors.qty && React.createElement('span', {
                                        id: `${inputPrefix}-quantity-error`,
                                        className: "field-error"
                                    }, errors.qty)
                                )
                            )
                        )
                    );
                }),

                // Add Extra Support Button
                React.createElement('button', {
                    type: 'button',
                    onClick: addExtra,
                    'aria-label': 'Add extra support',
                    className: "w-full py-5 bg-white border-4 border-dashed border-blue-300 text-blue-600 rounded-xl font-black hover:bg-blue-50 mt-4 flex justify-center items-center gap-2 shadow-sm uppercase tracking-wide text-lg transition-colors"
                },
                    React.createElement(AppIcons.Plus, { size: 28 }),
                    " Add Extra Support"
                )
            )
        )
    );
}

} // End guard

// ================================================================================
// EXPORTS AND INITIALIZATION
// ================================================================================

// Export App component
window.App = App;

// Render the app
if (typeof ReactDOM !== 'undefined' && document.getElementById('root')) {
    ReactDOM.render(React.createElement(App), document.getElementById('root'));
}
