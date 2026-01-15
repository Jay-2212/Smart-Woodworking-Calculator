/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * UI COMPONENTS MODULE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains all reusable React UI components for the calculator interface.
 * These components handle user input and display calculated values.
 * 
 * FILE LOCATION: js/components.js
 * 
 * DEPENDENCIES:
 * - React (loaded globally via CDN in index.html)
 * - js/constants.js (must be loaded first)
 *   - Uses: Icons
 * - js/calculations.js (must be loaded first)
 *   - Uses: calculateLineCFT, getPurchasedFeet, getSizeDims, getEffectiveCrateDims
 * 
 * USED BY:
 * - js/app.js (main application renders these components)
 * 
 * EXPORTS (via window.AppComponents):
 * - NumberInput: Styled numeric input field
 * - CalculationRow: Row in the box components table
 * - SupportCard: Card for runner/support configuration
 * - BoxTypeSelector: Selector for box type (Simple/Bottom/Crate)
 * 
 * COMPONENT HIERARCHY:
 * App (js/app.js)
 * ├── BoxTypeSelector
 * │   └── (internal crate settings inputs)
 * ├── CalculationRow (multiple)
 * │   └── NumberInput (multiple)
 * ├── SupportCard (multiple)
 * │   └── NumberInput (multiple)
 * └── Extra Supports section
 *     └── NumberInput (multiple)
 * 
 * ================================================================================
 */

// ================================================================================
// DEPENDENCY CHECK
// ================================================================================

if (!window.AppConstants) {
    console.error('ERROR: js/constants.js must be loaded before js/components.js');
}

if (!window.AppCalculations) {
    console.error('ERROR: js/calculations.js must be loaded before js/components.js');
}

// Guard against multiple loads
if (!window.AppComponents) {

// Get needed functions and components from other modules
const { Icons } = window.AppConstants;
const { 
    calculateLineCFT, 
    getPurchasedFeet, 
    getSizeDims, 
    getEffectiveCrateDims 
} = window.AppCalculations;

// Named constant for CFT divisor (used in SupportCard)
const CUBIC_INCH_TO_CFT_DIVISOR = window.AppConstants.CUBIC_INCH_TO_CFT_DIVISOR;

// ================================================================================
// NUMBER INPUT COMPONENT
// ================================================================================

/**
 * NumberInput Component
 * 
 * A styled number input with step control.
 * Used throughout the app for dimension and quantity inputs.
 * 
 * STYLING:
 * - Monospace font for numeric alignment
 * - High contrast (white bg, black text/border)
 * - Amber focus ring for visibility
 * 
 * @param {object} props - Component props
 * @param {number|string} props.value - Current input value
 * @param {function} props.onChange - Callback when value changes
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.step - Step increment (default: 0.125 for 1/8" precision)
 * 
 * USED IN:
 * - CalculationRow (Length, Width, Thickness, Qty inputs)
 * - SupportCard (Quantity input)
 * - Extra supports section (all inputs)
 */
const NumberInput = ({ value, onChange, className = "", step = 0.125 }) => (
    React.createElement('input', {
        type: "number",
        value: value,
        onChange: (e) => {
            const val = e.target.value;
            onChange(val === '' ? '' : parseFloat(val));
        },
        step: step,
        className: `w-full bg-white border-2 border-slate-900 rounded-lg px-2 py-3 text-center font-mono font-black text-xl text-black focus:ring-4 focus:ring-amber-400 focus:border-amber-700 outline-none transition-all shadow-sm ${className}`
    })
);

// ================================================================================
// CALCULATION ROW COMPONENT
// ================================================================================

/**
 * CalculationRow Component
 * 
 * Displays one row in the main calculation table.
 * Shows: Label, Length, Width, Thickness, Qty, and calculated CFT.
 * 
 * For crates, applies gap adjustments and shows the effective wood dimensions.
 * 
 * @param {object} props - Component props
 * @param {string} props.label - Row label (e.g., "Top & Bottom", "Sides", "Kara")
 * @param {object} props.data - {l, w, t, qty} - Dimension data
 * @param {function} props.onChange - Callback when a value changes (field, value)
 * @param {boolean} props.isCrate - Whether this is a crate type
 * @param {object} props.crateSettings - {plank, gap} - Crate configuration
 * @param {string} props.boxType - 'crateSimple' or 'crateBottom'
 * 
 * LAYOUT (12-column grid):
 * - Part label: 3 columns
 * - Length input: 2 columns
 * - Width input: 2 columns
 * - Thickness input: 2 columns
 * - Quantity input: 1 column
 * - CFT result: 2 columns
 * 
 * CONNECTED TO:
 * - js/calculations.js → getEffectiveCrateDims() for crate gap adjustments
 * - js/calculations.js → calculateLineCFT() for CFT calculation
 */
const CalculationRow = ({ label, data, onChange, isCrate, crateSettings, boxType }) => {
    let effL = data.l || 0;
    let effW = data.w || 0;
    let note = null;

    // Apply crate gap adjustments if applicable
    if (isCrate) {
        let partName = '';
        if (label.includes('Sides')) partName = 'Sides';
        else if (label.includes('Kara')) partName = 'Kara';
        else if (label.includes('Top')) partName = 'Top';

        if (partName) {
            const res = getEffectiveCrateDims(partName, data.l, data.w, boxType, crateSettings);
            effL = res.l;
            effW = res.w;
            note = res.note;
        }
    }

    // Calculate CFT using effective dimensions
    const cft = calculateLineCFT(effL, effW, data.t || 0, data.qty || 0);

    return React.createElement('div', {
        className: `grid grid-cols-12 gap-2 items-center border-b-2 border-slate-300 py-4 last:border-0 ${isCrate && note ? 'bg-amber-100/50' : ''}`
    },
        // Part Label (with GAP indicator for crates)
        React.createElement('div', { className: "col-span-3" },
            React.createElement('div', { 
                className: "text-sm font-black text-black uppercase tracking-tight leading-tight" 
            }, label),
            isCrate && note && React.createElement('div', {
                className: "text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200 inline-block px-1 rounded mt-1"
            }, "GAP ACTIVE")
        ),
        
        // Length Input (with effective wood indicator)
        React.createElement('div', { className: "col-span-2 relative" },
            React.createElement(NumberInput, {
                value: data.l,
                onChange: (v) => onChange('l', v),
                className: "text-lg py-2"
            }),
            isCrate && note && note.includes("Length") && React.createElement('div', {
                className: "absolute -bottom-4 left-0 w-full text-[9px] text-center font-bold text-amber-800 bg-amber-100 rounded px-1"
            }, `Wood: ${effL}`)
        ),
        
        // Width Input (with effective wood indicator)
        React.createElement('div', { className: "col-span-2 relative" },
            React.createElement(NumberInput, {
                value: data.w,
                onChange: (v) => onChange('w', v),
                className: "text-lg py-2"
            }),
            isCrate && note && (note.includes("Height") || note.includes("Width")) && React.createElement('div', {
                className: "absolute -bottom-4 left-0 w-full text-[9px] text-center font-bold text-amber-800 bg-amber-100 rounded px-1"
            }, `Wood: ${effW}`)
        ),
        
        // Thickness Input
        React.createElement('div', { className: "col-span-2" },
            React.createElement(NumberInput, {
                value: data.t,
                onChange: (v) => onChange('t', v),
                step: 0.25,
                className: "text-lg py-2"
            })
        ),
        
        // Quantity Input
        React.createElement('div', { className: "col-span-1" },
            React.createElement(NumberInput, {
                value: data.qty,
                onChange: (v) => onChange('qty', v),
                className: "px-0 text-lg py-2",
                step: 1
            })
        ),
        
        // CFT Result
        React.createElement('div', { 
            className: "col-span-2 text-right font-mono font-black text-amber-800 text-lg" 
        }, cft.toFixed(2))
    );
};

// ================================================================================
// SUPPORT CARD COMPONENT
// ================================================================================

/**
 * SupportCard Component
 * 
 * Displays a card for one type of support runner.
 * Shows size selector, length, quantity controls, and calculated CFT.
 * 
 * FEATURES:
 * - Size dropdown (e.g., 3x1, 4x2)
 * - Auto-calculated length (based on box dimensions)
 * - Quantity +/- buttons and direct input
 * - "Purchase" value showing feet to buy (0.5 increments)
 * - CFT calculation for this support type
 * - Optional direction toggle (vertical/horizontal)
 * 
 * @param {object} props - Component props
 * @param {string} props.label - Card title (e.g., "Bottom Supports")
 * @param {string[]} props.sizeOptions - Available size codes
 * @param {number} props.dimValue - Dimension value (length)
 * @param {object} props.settings - {size, dim, count} - Current settings
 * @param {function} props.onUpdate - Callback when settings change (field, value)
 * @param {string} props.colorClass - CSS class for card color
 * @param {string} props.configKey - Key for runner config ('bottomDir' or 'sideDir')
 * @param {object} props.runnerConfig - Current runner configuration
 * @param {function} props.onConfigChange - Callback for config changes
 * @param {string} props.fixedDir - If set, shows fixed direction instead of toggle
 * 
 * CONNECTED TO:
 * - js/calculations.js → getSizeDims() for dimension lookup
 * - js/calculations.js → getPurchasedFeet() for purchase calculation
 */
const SupportCard = ({ 
    label, 
    sizeOptions, 
    dimValue, 
    settings, 
    onUpdate, 
    colorClass = "bg-white", 
    configKey, 
    runnerConfig, 
    onConfigChange, 
    fixedDir 
}) => {
    // Get dimensions from size code and calculate CFT
    const sDims = getSizeDims(settings.size);
    const feet = getPurchasedFeet(settings.dim);
    const cft = ((feet * sDims.w * sDims.t) / CUBIC_INCH_TO_CFT_DIVISOR) * settings.count;

    return React.createElement('div', {
        className: `rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 overflow-hidden ${colorClass}`
    },
        // Header with label and CFT
        React.createElement('div', {
            className: "p-3 border-b-2 border-slate-900 flex justify-between items-center bg-slate-200"
        },
            React.createElement('span', { 
                className: "text-sm font-black text-black uppercase tracking-wide" 
            }, label),
            React.createElement('span', { 
                className: "font-mono font-black text-xl text-amber-800" 
            }, 
                cft.toFixed(2),
                React.createElement('span', { className: "text-xs text-black" }, " CFT")
            )
        ),
        
        // Card body
        React.createElement('div', { className: "p-4 space-y-4" },
            // Size and Length row
            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                // Size dropdown
                React.createElement('div', null,
                    React.createElement('label', { 
                        className: "text-xs text-black font-black mb-1 uppercase block tracking-wider" 
                    }, "Size"),
                    React.createElement('select', {
                        value: settings.size,
                        onChange: (e) => onUpdate('size', e.target.value),
                        className: "w-full bg-white border-2 border-slate-900 rounded-lg py-2 px-2 text-xl font-black text-black focus:ring-4 focus:ring-amber-400 outline-none appearance-none"
                    },
                        sizeOptions.map(s => React.createElement('option', { key: s, value: s }, s))
                    )
                ),
                // Length display (read-only)
                React.createElement('div', null,
                    React.createElement('label', { 
                        className: "text-xs text-black font-black mb-1 uppercase block tracking-wider" 
                    }, "Length"),
                    React.createElement('div', {
                        className: "w-full bg-slate-100 border-2 border-slate-400 rounded-lg py-2 px-2 text-xl font-black text-slate-600 text-center"
                    }, `${settings.dim}"`)
                )
            ),

            // Direction toggle (if configurable and not fixed)
            !fixedDir && configKey && React.createElement('div', {
                className: "flex bg-slate-100 p-1 rounded-lg border border-slate-300"
            },
                React.createElement('button', {
                    onClick: () => onConfigChange(configKey, configKey === 'bottomDir' ? 'width' : 'vertical'),
                    className: `flex-1 py-1 text-xs font-black uppercase rounded transition-all ${runnerConfig[configKey] === (configKey === 'bottomDir' ? 'width' : 'vertical') ? 'bg-white shadow text-black border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`
                }, configKey === 'bottomDir' ? 'Width-wise' : 'Vertical'),
                React.createElement('button', {
                    onClick: () => onConfigChange(configKey, configKey === 'bottomDir' ? 'length' : 'horizontal'),
                    className: `flex-1 py-1 text-xs font-black uppercase rounded transition-all ${runnerConfig[configKey] === (configKey === 'bottomDir' ? 'length' : 'horizontal') ? 'bg-white shadow text-black border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`
                }, 'Horizontal')
            ),
            
            // Fixed direction indicator
            fixedDir && React.createElement('div', {
                className: "text-[10px] text-center font-black uppercase text-slate-500 bg-slate-100 py-1 rounded border border-slate-200"
            }, `Fixed: ${fixedDir}`),

            // Quantity controls and Purchase display
            React.createElement('div', { className: "flex items-center gap-4" },
                // Quantity control section
                React.createElement('div', { className: "flex-grow" },
                    React.createElement('label', { 
                        className: "text-xs text-black font-black mb-1 uppercase block tracking-wider" 
                    }, "Quantity"),
                    React.createElement('div', { className: "flex items-center gap-2" },
                        // Minus button
                        React.createElement('button', {
                            onClick: () => onUpdate('count', Math.max(0, settings.count - 1)),
                            className: "bg-slate-200 w-12 h-12 flex items-center justify-center rounded-lg border-2 border-slate-900 font-bold hover:bg-slate-300 active:bg-slate-400 text-xl"
                        }, "-"),
                        // Number input
                        React.createElement(NumberInput, {
                            value: settings.count,
                            onChange: (v) => onUpdate('count', v),
                            step: 1,
                            className: "py-2 text-2xl font-black bg-white"
                        }),
                        // Plus button
                        React.createElement('button', {
                            onClick: () => onUpdate('count', settings.count + 1),
                            className: "bg-slate-200 w-12 h-12 flex items-center justify-center rounded-lg border-2 border-slate-900 font-bold hover:bg-slate-300 active:bg-slate-400 text-xl"
                        }, "+")
                    )
                ),
                // Purchase display (feet to buy)
                React.createElement('div', { className: "w-24" },
                    React.createElement('label', { 
                        className: "text-xs text-black font-black mb-1 uppercase block text-right tracking-wider" 
                    }, "Purchase"),
                    React.createElement('div', {
                        className: "bg-amber-100 border-2 border-amber-800 rounded-lg py-2 px-2 text-right"
                    },
                        React.createElement('span', { 
                            className: "text-2xl font-black text-amber-900" 
                        }, feet.toFixed(1)),
                        React.createElement('span', { 
                            className: "text-xs text-black ml-1 font-bold" 
                        }, "ft")
                    )
                )
            )
        )
    );
};

// ================================================================================
// BOX TYPE SELECTOR COMPONENT
// ================================================================================

/**
 * BoxTypeSelector Component
 * 
 * Allows user to select box type: Simple, Bottom, or Crate.
 * For crates, shows additional configuration for plank width and gap size.
 * 
 * BOX TYPES:
 * - Simple: Standard box, panels sit on top of base
 * - Bottom: Heavy-duty, runners integrated into bottom structure
 * - Crate: Ventilated, with configurable gaps between planks
 * 
 * CRATE SUB-TYPES:
 * - Simple Crate: Crate with simple construction
 * - Bottom Crate: Crate with bottom-type construction
 * 
 * @param {object} props - Component props
 * @param {string} props.type - Current box type
 * @param {function} props.setType - Callback to change box type
 * @param {string} props.subType - Current crate sub-type
 * @param {function} props.setSubType - Callback to change crate sub-type
 * @param {object} props.crateSettings - {plank, gap} configuration
 * @param {function} props.setCrateSettings - Callback to change crate settings
 * 
 * CONNECTED TO:
 * - js/app.js → State management for box type
 * - js/calculations.js → getEffectiveCrateDims() uses crateSettings
 */
const BoxTypeSelector = ({ type, setType, subType, setSubType, crateSettings, setCrateSettings }) => {
    return React.createElement('div', {
        className: "bg-white p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-black mb-6"
    },
        // Section label
        React.createElement('label', {
            className: "text-sm text-black font-black uppercase tracking-wide block mb-3 border-b-2 border-slate-100 pb-2"
        }, "Select Box Type"),
        
        // Box type buttons
        React.createElement('div', { className: "grid grid-cols-3 gap-3" },
            ['simple', 'bottom', 'crate'].map(t => 
                React.createElement('button', {
                    key: t,
                    onClick: () => setType(t),
                    className: `py-4 px-2 rounded-xl text-base font-black uppercase tracking-wider transition-all border-2 ${
                        type === t
                            ? 'bg-amber-600 border-black text-white shadow-inner transform scale-105'
                            : 'bg-white border-slate-300 text-slate-900 hover:border-black hover:bg-slate-100'
                    }`
                }, t)
            )
        ),

        // Crate-specific configuration (shown only when crate is selected)
        type === 'crate' && React.createElement('div', {
            className: "mt-4 pt-4 border-t-2 border-slate-200 animate-fade-in bg-amber-50 -mx-4 px-4 pb-4 rounded-b-lg"
        },
            React.createElement('label', {
                className: "text-xs text-amber-900 font-black uppercase mb-2 block"
            }, "Crate Configuration"),
            
            // Crate sub-type buttons
            React.createElement('div', { className: "grid grid-cols-2 gap-3 mb-4" },
                React.createElement('button', {
                    onClick: () => setSubType('simple'),
                    className: `py-3 text-sm font-black uppercase rounded-lg border-2 shadow-sm ${
                        subType === 'simple' ? 'bg-blue-600 border-black text-white' : 'bg-white border-slate-400 text-slate-800'
                    }`
                }, "Simple Crate"),
                React.createElement('button', {
                    onClick: () => setSubType('bottom'),
                    className: `py-3 text-sm font-black uppercase rounded-lg border-2 shadow-sm ${
                        subType === 'bottom' ? 'bg-blue-600 border-black text-white' : 'bg-white border-slate-400 text-slate-800'
                    }`
                }, "Bottom Crate")
            ),

            // Plank and Gap settings
            React.createElement('div', {
                className: "grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border-2 border-amber-200 shadow-sm"
            },
                // Plank Width input
                React.createElement('div', null,
                    React.createElement('label', {
                        className: "text-[11px] text-amber-900 font-black uppercase block mb-1"
                    }, "Plank Width (Inch)"),
                    React.createElement('div', {
                        className: "flex items-center bg-white border-2 border-amber-300 rounded-lg overflow-hidden"
                    },
                        React.createElement('input', {
                            type: "number",
                            value: crateSettings.plank,
                            onChange: (e) => setCrateSettings({ 
                                ...crateSettings, 
                                plank: parseFloat(e.target.value) || 0 
                            }),
                            className: "w-full py-2 text-center font-black text-xl text-black outline-none"
                        })
                    )
                ),
                // Gap Size input
                React.createElement('div', null,
                    React.createElement('label', {
                        className: "text-[11px] text-amber-900 font-black uppercase block mb-1"
                    }, "Gap Size (Inch)"),
                    React.createElement('div', {
                        className: "flex items-center bg-white border-2 border-amber-300 rounded-lg overflow-hidden"
                    },
                        React.createElement('input', {
                            type: "number",
                            value: crateSettings.gap,
                            onChange: (e) => setCrateSettings({ 
                                ...crateSettings, 
                                gap: parseFloat(e.target.value) || 0 
                            }),
                            className: "w-full py-2 text-center font-black text-xl text-black outline-none"
                        })
                    )
                )
            )
        )
    );
};

// ================================================================================
// EXPORTS
// Make components available globally for other modules
// ================================================================================

window.AppComponents = {
    NumberInput,
    CalculationRow,
    SupportCard,
    BoxTypeSelector
};

} // End guard
