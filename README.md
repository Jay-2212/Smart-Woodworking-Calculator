# 🪵 Smart Woodworking Calculator

<div align="center">

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=three.js&logoColor=white)

**A sophisticated web-based calculator for woodworking professionals to estimate material requirements and costs for wooden boxes and crates.**

[Features](#-features) • [Demo](#-demo) • [Getting Started](#-getting-started) • [Usage](#-usage) • [Technology](#-technology-stack) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

The **Smart Woodworking Calculator** is a professional tool designed for woodworking businesses, specifically **Ambica Wooden Works**, to accurately calculate wood requirements for custom boxes and crates. It provides real-time Cubic Feet (CFT) calculations, 3D visualization, and cost estimation to streamline the quotation and planning process.

### Why This Tool?

- ⚡ **Instant Calculations** - Get real-time CFT calculations as you adjust dimensions
- 🎯 **Accurate Estimates** - Precise measurements for material ordering and cost quotations
- 📦 **Multiple Box Types** - Support for Simple, Bottom, and Crate configurations
- 🔄 **Interactive 3D View** - Visualize your box design before building
- 💰 **Cost Tracking** - Automatic cost calculation based on CFT and rates
- 📱 **Mobile Friendly** - Works seamlessly on desktop, tablet, and mobile devices

---

## ✨ Features

### 🎨 Core Capabilities

| Feature | Description |
|---------|-------------|
| **Box Type Selection** | Choose from Simple, Bottom, or Crate box types with different structural configurations |
| **3D Visualization** | Interactive 3D model with drag-to-rotate functionality for better understanding |
| **Auto Calculations** | Automatically calculates panel dimensions, support requirements, and runner configurations |
| **CFT Tracking** | Real-time Cubic Feet calculations for accurate material estimation |
| **Cost Estimation** | Set your rate per CFT and get instant total cost calculations |
| **Customizable Supports** | Add extra supports and customize runner configurations |
| **Crate Configurations** | Special handling for ventilated crates with customizable plank and gap settings |

### 📐 Box Types Supported

#### 1️⃣ **Simple Box**
Standard box construction where the box sits on runners with panel overhang.
- Suitable for general-purpose shipping
- Panels have overhang for durability
- Configurable runner orientations

#### 2️⃣ **Bottom Box**
Advanced construction with runners built into the bottom structure.
- Enhanced structural integrity
- Bottom runners integrated into design
- Ideal for heavier loads

#### 3️⃣ **Crate Box**
Ventilated crate design with customizable gaps for airflow.
- Configurable plank width and gap spacing
- Available in Simple or Bottom variants
- Perfect for products requiring ventilation

### 🛠️ Smart Features

- **Automatic Runner Recommendations** - Suggests optimal number of runners based on box length
- **Responsive Design** - Adapts to any screen size for mobile and desktop use
- **Sticky Stats Bar** - Quick-access statistics that appear when scrolling
- **Error Handling** - Robust validation and error boundaries for stability
- **Test Suite** - Comprehensive automated tests that run on page load

---

## 🎬 Demo

### Interface Preview

The calculator features a clean, professional interface with:

- **Header Section** - Displays the brand name and calculator title
- **Cost Overview Card** - Prominent display of total cost and CFT with rate input
- **Dimension Inputs** - Easy-to-use inputs for internal box dimensions (Length × Width × Height)
- **Box Type Selector** - Visual buttons to switch between box types
- **3D Visualization** - Interactive 3D preview with rotation controls
- **Component Breakdown** - Detailed table showing all panels and their calculations
- **Runner & Support Management** - Customizable support configurations with visual cards
- **Extra Supports** - Add unlimited custom support pieces

### How It Looks

The interface uses a warm color scheme with:
- 🟨 **Amber/Yellow accents** - Representing wood tones
- ⚫ **Dark slate backgrounds** - Professional appearance
- ⚪ **Clean white cards** - Easy to read and organize information
- 🔵 **Blue highlights** - For interactive elements

---

## 🚀 Getting Started

### Prerequisites

This is a **pure client-side application** with no build process or dependencies to install. All you need is:

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jay-2212/Smart-Woodworking-Calculator.git
   cd Smart-Woodworking-Calculator
   ```

2. **Open the application**
   
   **Option A: Direct File Access**
   ```bash
   # Simply open index.html in your browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

   **Option B: Local Server (Recommended)**
   ```bash
   # Using Python
   python -m http.server 8000
   # OR using Node.js
   npx http-server -p 8000
   # OR using PHP
   php -S localhost:8000
   ```
   
   Then open `http://localhost:8000` in your browser.

3. **Start Calculating!** 🎉

No build process, no npm install, no compilation needed!

---

## 💡 Usage

### Basic Workflow

1. **Enter Box Dimensions**
   - Input the internal dimensions: Length, Width, and Height (in inches)
   - These represent the space inside the box

2. **Select Box Type**
   - Choose **Simple** for standard boxes
   - Choose **Bottom** for reinforced bottom structure
   - Choose **Crate** for ventilated designs

3. **Adjust Runner Configuration**
   - The calculator automatically suggests runner count based on box length
   - Override with custom runner count if needed
   - Toggle runner orientations for optimal structural support

4. **Review Calculations**
   - View automatic panel dimension calculations
   - Check CFT breakdown for each component
   - See total CFT and cost estimation

5. **Customize Supports**
   - Modify support runner sizes and quantities
   - Add extra support pieces as needed
   - Each support has independent size and quantity controls

6. **Get Total Cost**
   - Enter your rate per CFT
   - View instant cost calculation
   - Use for quotations and material ordering

### Advanced Features

#### Crate Configuration
For ventilated crates, customize:
- **Plank Width** - Width of each wooden plank
- **Gap Size** - Space between planks for ventilation

#### Runner Orientations
- **Bottom Runners** - Choose between width-wise or length-wise orientation
- **Side Runners** - Choose between vertical or horizontal positioning

#### Extra Supports
Add custom support pieces:
- Select from preset sizes (3×1, 4×1) or use custom dimensions
- Set length, width, thickness, and quantity independently

---

## 🔧 Technology Stack

### Frontend Technologies

| Technology | Purpose | Version/Type |
|------------|---------|--------------|
| **HTML5** | Structure and markup | Standard |
| **CSS3** | Styling with utility classes | Tailwind-like system |
| **JavaScript (ES6+)** | Application logic | Vanilla JS |
| **React** | UI framework | Custom minimal implementation |
| **Three.js** | 3D visualization engine | Custom minimal implementation |

### Architecture Highlights

- **📦 Modular Design** - Separated into focused modules for maintainability
- **🔌 No Dependencies** - Custom React-like and Three.js-like implementations
- **⚡ Zero Build** - No webpack, no babel, no transpilation needed
- **🧪 Built-in Tests** - Automated test suite runs on page load
- **📱 Responsive** - Mobile-first design with utility CSS classes

### Why Custom Implementations?

This project uses **custom minimal implementations** of React and Three.js rather than full libraries:

✅ **Benefits:**
- No external dependencies or CDN reliance
- Faster load times with minimal code
- Complete control over functionality
- Easier to understand and modify
- No version conflicts or breaking changes

---

## 📁 Project Structure

```
Smart-Woodworking-Calculator/
│
├── index.html              # Main entry point
├── README.md              # This file
├── ARCHITECTURE.md        # Detailed technical documentation
│
├── js/                    # JavaScript modules
│   ├── constants.js       # Configuration and constants
│   ├── calculations.js    # CFT calculation functions
│   ├── three-scene.js     # 3D visualization engine
│   ├── components.js      # Reusable UI components
│   ├── app.js            # Main application component
│   └── tests.js          # Automated test suite
│
├── libs/                  # Custom library implementations
│   ├── react-simple.js   # Minimal React-like framework
│   └── three-minimal.js  # Minimal Three.js-like 3D engine
│
└── styles/
    └── main.css          # All CSS utility classes
```

### Module Dependencies

```
index.html
    ↓
libs/ (react-simple.js, three-minimal.js)
    ↓
constants.js → calculations.js → three-scene.js
    ↓              ↓                    ↓
    └────────→ components.js ←──────────┘
                  ↓
              app.js (Main Application)
                  ↓
              tests.js
```

---

## 🏗️ Architecture

The application follows a **modular architecture** with clear separation of concerns:

### Design Principles

1. **Separation of Concerns** - Each module has a single, well-defined purpose
2. **Pure Functions** - Calculation logic is isolated from UI code
3. **Unidirectional Data Flow** - State flows down, events bubble up
4. **Error Boundaries** - Graceful error handling prevents crashes
5. **Progressive Enhancement** - Works without JavaScript (fallback loading state)

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `constants.js` | Configuration values, icons, error handling |
| `calculations.js` | Pure calculation functions for CFT and dimensions |
| `three-scene.js` | 3D rendering and visualization logic |
| `components.js` | Reusable UI components (inputs, cards, selectors) |
| `app.js` | State management and application orchestration |
| `tests.js` | Automated tests for calculation accuracy |

For detailed technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🧪 Testing

The application includes a comprehensive test suite that runs automatically on page load.

### Running Tests

Tests execute automatically when you open the application. Check the browser console (F12) to see results.

**Manual test execution:**
```javascript
// Open browser console and run:
window.AppTests.runTests();
```

### Test Coverage

Tests verify:
- ✅ CFT calculation accuracy
- ✅ Feet rounding logic (0.5 ft increments)
- ✅ Size dimension lookups
- ✅ Crate gap calculations
- ✅ Edge cases and invalid inputs

---

## 🎨 Customization

### Modifying Styles

Edit `styles/main.css` to customize the appearance:
- Color schemes
- Font families
- Spacing and layout
- Utility classes

### Adjusting Calculations

⚠️ **Note:** Calculation logic contains business-specific formulas. Modifications should be made carefully.

To adjust general behavior:
- Edit `js/constants.js` for thresholds and recommendations
- Modify `js/calculations.js` for calculation logic (with caution)

### Adding New Box Types

1. Add new type to `js/components.js` → `BoxTypeSelector`
2. Implement calculation logic in `js/app.js`
3. Update 3D visualization in `js/three-scene.js`
4. Add corresponding tests in `js/tests.js`

---

## 📝 Development Guidelines

### Code Style

- **Naming**: Use clear, descriptive variable names
- **Comments**: Document complex logic and business rules
- **Functions**: Keep functions pure and testable where possible
- **Modules**: Maintain clear module boundaries

### Load Order

⚠️ **Critical:** JavaScript files must be loaded in this exact order:

1. `constants.js` (no dependencies)
2. `calculations.js` (needs constants)
3. `three-scene.js` (needs calculations)
4. `components.js` (needs constants, calculations)
5. `app.js` (needs all above)
6. `tests.js` (needs constants, calculations)

### Debugging

**Browser Console** (F12):
- View test results
- Check for error messages
- Inspect state and calculations

**Common Issues:**
- Wrong load order → "undefined is not a function"
- Invalid inputs → Check validation in console
- 3D not rendering → Check Three.js initialization

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs** - Open an issue with details
- 💡 **Suggest Features** - Share your ideas
- 📖 **Improve Documentation** - Help others understand the code
- 🔧 **Submit Pull Requests** - Fix bugs or add features

### Contribution Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly (check browser console for test results)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Guidelines

- Follow existing code style and structure
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📄 License

This project is developed for **Ambica Wooden Works**. All rights reserved.

---

## 👥 Authors

**Ambica Wooden Works Team**

---

## 🙏 Acknowledgments

- Built with ❤️ for the woodworking industry
- Inspired by the need for accurate material estimation
- Thanks to all contributors and testers

---

## 📞 Support

For questions, issues, or suggestions:

- 📧 Open an issue on GitHub
- 📚 Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- 🔍 Review the code comments for inline documentation

---

## 🎯 Future Enhancements

Potential features for future versions:

- [ ] Save/Load project configurations
- [ ] PDF export for quotations
- [ ] Material database with current pricing
- [ ] Multi-box project management
- [ ] Print-friendly layouts
- [ ] Historical project tracking
- [ ] Multiple wood types/species support

---

<div align="center">

**Made with 🪵 and ❤️ for the Woodworking Community**

⭐ Star this repo if you find it helpful!

</div>
