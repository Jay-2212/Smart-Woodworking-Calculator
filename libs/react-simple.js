/**
 * Simple React-compatible library
 * This provides the essential React API for this application
 */
(function(global) {
    'use strict';

    // Store the root component and container
    let rootContainer = null;
    let rootComponent = null;
    
    // Component-scoped hook storage
    let componentStack = [];      // Stack of component IDs during render
    let hookStates = {};          // Map: componentId -> { states: [], refs: [], effectDeps: [] }
    let hookIndex = 0;            // Current hook index within a component
    let componentCounter = 0;     // Counter to generate unique component IDs
    let componentIdMap = new WeakMap(); // Map function -> stable ID
    
    let effectsQueue = [];
    let isRendering = false;

    // Get or create a stable ID for a component function
    function getComponentId(type) {
        if (!componentIdMap.has(type)) {
            componentIdMap.set(type, `comp_${componentCounter++}`);
        }
        return componentIdMap.get(type);
    }
    
    // Get current component's hook storage
    function getCurrentHookStorage() {
        const componentId = componentStack[componentStack.length - 1];
        if (!componentId) return null;
        if (!hookStates[componentId]) {
            hookStates[componentId] = { states: [], refs: [], effectDeps: [], memos: [] };
        }
        return hookStates[componentId];
    }

    // Create a simple VNode structure
    function createElement(type, props, ...children) {
        const flatChildren = children.flat(Infinity).filter(c => c != null && c !== false && c !== '');
        return {
            type,
            props: props || {},
            children: flatChildren
        };
    }

    // Convert VNode to real DOM
    function createDOMElement(vnode) {
        if (vnode == null || vnode === false || vnode === '') {
            return document.createTextNode('');
        }

        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return document.createTextNode(String(vnode));
        }

        if (Array.isArray(vnode)) {
            const fragment = document.createDocumentFragment();
            vnode.forEach(child => {
                const childDOM = createDOMElement(child);
                if (childDOM) fragment.appendChild(childDOM);
            });
            return fragment;
        }

        const { type, props, children } = vnode;

        // Handle component functions
        if (typeof type === 'function') {
            const componentId = getComponentId(type);
            componentStack.push(componentId);
            hookIndex = 0;
            
            const componentProps = { ...props, children };
            let componentVNode;
            
            try {
                // Handle class components
                if (type.prototype && type.prototype.render) {
                    const instance = new type(componentProps);
                    componentVNode = instance.render();
                } else {
                    // Handle function components
                    componentVNode = type(componentProps);
                }
            } finally {
                componentStack.pop();
            }
            
            return createDOMElement(componentVNode);
        }

        // Create DOM element
        const element = document.createElement(type);

        // Set props
        Object.keys(props).forEach(name => {
            if (name === 'children') return;
            
            if (name === 'className') {
                element.className = props[name];
            } else if (name === 'style' && typeof props[name] === 'object') {
                Object.assign(element.style, props[name]);
            } else if (name.startsWith('on')) {
                const eventName = name.substring(2).toLowerCase();
                element.addEventListener(eventName, props[name]);
            } else if (name === 'ref') {
                if (props[name]) {
                    props[name].current = element;
                }
            } else if (name === 'dangerouslySetInnerHTML') {
                element.innerHTML = props[name].__html;
            } else if (name === 'value') {
                element.value = props[name];
            } else if (name === 'checked') {
                element.checked = props[name];
            } else {
                element.setAttribute(name, props[name]);
            }
        });

        // Append children
        children.forEach(child => {
            const childElement = createDOMElement(child);
            if (childElement) {
                element.appendChild(childElement);
            }
        });

        return element;
    }

    // Re-render the app
    function rerender() {
        if (isRendering || !rootContainer || !rootComponent) return;
        
        isRendering = true;
        effectsQueue = [];
        
        try {
            const vnode = createElement(rootComponent);
            const newDOM = createDOMElement(vnode);
            
            // Use replaceChildren for smoother update (less flash)
            // Supported in Chrome 86+, Firefox 78+, Safari 14+ (2020-2021)
            if (rootContainer.replaceChildren) {
                rootContainer.replaceChildren(newDOM);
            } else {
                // Fallback for older browsers (IE, older Safari/Chrome)
                rootContainer.innerHTML = '';
                rootContainer.appendChild(newDOM);
            }
            
            // Run effects after DOM is updated
            effectsQueue.forEach(effect => effect());
        } finally {
            isRendering = false;
        }
    }

    // useState implementation - component scoped
    function useState(initialValue) {
        const storage = getCurrentHookStorage();
        if (!storage) {
            console.error('useState called outside of component render');
            return [initialValue, () => {}];
        }
        
        const currentIndex = hookIndex++;
        
        if (storage.states[currentIndex] === undefined) {
            storage.states[currentIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;
        }

        const setState = (newValue) => {
            const nextValue = typeof newValue === 'function' 
                ? newValue(storage.states[currentIndex]) 
                : newValue;
            
            if (storage.states[currentIndex] !== nextValue) {
                storage.states[currentIndex] = nextValue;
                setTimeout(rerender, 0);
            }
        };

        return [storage.states[currentIndex], setState];
    }

    // useEffect implementation - component scoped
    function useEffect(callback, deps) {
        const storage = getCurrentHookStorage();
        if (!storage) {
            console.error('useEffect called outside of component render');
            return;
        }
        
        const currentIndex = hookIndex++;
        const prevDeps = storage.effectDeps[currentIndex];
        
        const hasChanged = !prevDeps || !deps || 
            deps.some((dep, i) => dep !== prevDeps[i]);

        if (hasChanged) {
            storage.effectDeps[currentIndex] = deps ? [...deps] : undefined;
            effectsQueue.push(callback);
        }
    }

    // useRef implementation - component scoped
    function useRef(initialValue) {
        const storage = getCurrentHookStorage();
        if (!storage) {
            console.error('useRef called outside of component render');
            return { current: initialValue };
        }
        
        const currentIndex = hookIndex++;
        
        if (!storage.refs[currentIndex]) {
            storage.refs[currentIndex] = { current: initialValue };
        }
        
        return storage.refs[currentIndex];
    }

    // useMemo implementation - component scoped
    function useMemo(factory, deps) {
        const storage = getCurrentHookStorage();
        if (!storage) {
            console.error('useMemo called outside of component render');
            return factory();
        }
        
        const currentIndex = hookIndex++;
        
        if (!storage.memos[currentIndex]) {
            storage.memos[currentIndex] = { value: undefined, deps: undefined };
        }
        
        const memo = storage.memos[currentIndex];
        const hasChanged = !memo.deps || !deps || 
            deps.some((dep, i) => dep !== memo.deps[i]);

        if (hasChanged) {
            memo.value = factory();
            memo.deps = deps ? [...deps] : undefined;
        }

        return memo.value;
    }

    // Component class
    class Component {
        constructor(props) {
            this.props = props;
            this.state = {};
        }

        setState(update) {
            this.state = { ...this.state, ...update };
            rerender();
        }

        render() {
            return null;
        }
    }

    // Render function
    function render(vnode, container) {
        rootContainer = container;
        rootComponent = vnode.type;
        rerender();
    }

    // Export API
    global.React = {
        createElement,
        useState,
        useEffect,
        useRef,
        useMemo,
        Component
    };

    global.ReactDOM = {
        render
    };

})(window);
