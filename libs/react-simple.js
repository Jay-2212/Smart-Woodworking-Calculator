/**
 * Simple React-compatible library
 * This provides the essential React API for this application
 */
(function(global) {
    'use strict';

    // Store the root component and container
    let rootContainer = null;
    let rootComponent = null;
    let componentState = {};
    let stateIndex = 0;
    let effectsQueue = [];
    let isRendering = false;

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
            stateIndex = 0;
            const componentProps = { ...props, children };
            
            // Handle class components
            if (type.prototype && type.prototype.render) {
                const instance = new type(componentProps);
                const componentVNode = instance.render();
                return createDOMElement(componentVNode);
            }
            
            // Handle function components
            const componentVNode = type(componentProps);
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
        stateIndex = 0;
        effectsQueue = [];
        
        try {
            const vnode = createElement(rootComponent);
            const newDOM = createDOMElement(vnode);
            
            // Use replaceChildren for smoother update (less flash)
            if (rootContainer.replaceChildren) {
                rootContainer.replaceChildren(newDOM);
            } else {
                // Fallback for older browsers
                rootContainer.innerHTML = '';
                rootContainer.appendChild(newDOM);
            }
            
            // Run effects
            effectsQueue.forEach(effect => effect());
        } finally {
            isRendering = false;
        }
    }

    // useState implementation
    function useState(initialValue) {
        const currentIndex = stateIndex++;
        const key = `state_${currentIndex}`;
        
        if (!(key in componentState)) {
            componentState[key] = typeof initialValue === 'function' ? initialValue() : initialValue;
        }

        const setState = (newValue) => {
            const nextValue = typeof newValue === 'function' 
                ? newValue(componentState[key]) 
                : newValue;
            
            if (componentState[key] !== nextValue) {
                componentState[key] = nextValue;
                setTimeout(rerender, 0);
            }
        };

        return [componentState[key], setState];
    }

    // useEffect implementation
    let effectDeps = {};
    function useEffect(callback, deps) {
        const currentIndex = stateIndex++;
        const key = `effect_${currentIndex}`;
        
        const hasChanged = !effectDeps[key] || !deps || 
            deps.some((dep, i) => dep !== effectDeps[key][i]);

        if (hasChanged) {
            effectDeps[key] = deps;
            effectsQueue.push(callback);
        }
    }

    // useRef implementation
    let refs = {};
    function useRef(initialValue) {
        const currentIndex = stateIndex++;
        const key = `ref_${currentIndex}`;
        
        if (!refs[key]) {
            refs[key] = { current: initialValue };
        }
        
        return refs[key];
    }

    // useMemo implementation
    let memos = {};
    function useMemo(factory, deps) {
        const currentIndex = stateIndex++;
        const key = `memo_${currentIndex}`;
        
        if (!memos[key]) {
            memos[key] = { value: undefined, deps: undefined };
        }
        
        const memo = memos[key];
        const hasChanged = !memo.deps || !deps || 
            deps.some((dep, i) => dep !== memo.deps[i]);

        if (hasChanged) {
            memo.value = factory();
            memo.deps = deps;
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
