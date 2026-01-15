/**
 * Minimal React implementation for Smart Woodworking Calculator
 * This is a lightweight alternative to React that implements only the features used by this app
 */

(function(global) {
    'use strict';

    // Component instance tracking
    let currentComponent = null;
    let hookIndex = 0;

    // Create element function
    function createElement(type, props, ...children) {
        props = props || {};
        const flatChildren = children.flat(Infinity).filter(c => c != null && c !== false);
        return {
            type,
            props: {
                ...props,
                children: flatChildren.length === 1 ? flatChildren[0] : flatChildren
            }
        };
    }

    // Render virtual DOM to real DOM
    function render(vnode, container) {
        container.innerHTML = '';
        const dom = createDom(vnode);
        container.appendChild(dom);
    }

    function createDom(vnode) {
        if (vnode == null || typeof vnode === 'boolean') {
            return document.createTextNode('');
        }
        
        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return document.createTextNode(vnode);
        }

        if (Array.isArray(vnode)) {
            const fragment = document.createDocumentFragment();
            vnode.forEach(child => {
                fragment.appendChild(createDom(child));
            });
            return fragment;
        }

        const { type, props } = vnode;
        
        // Handle function components
        if (typeof type === 'function') {
            currentComponent = { hooks: [], hookIndex: 0 };
            hookIndex = 0;
            const componentVNode = type(props);
            return createDom(componentVNode);
        }

        // Create DOM element
        const dom = document.createElement(type);

        // Set attributes
        Object.keys(props).forEach(key => {
            if (key === 'children') return;
            if (key === 'className') {
                dom.className = props[key];
            } else if (key === 'style' && typeof props[key] === 'object') {
                Object.assign(dom.style, props[key]);
            } else if (key.startsWith('on') && typeof props[key] === 'function') {
                const eventName = key.substring(2).toLowerCase();
                dom.addEventListener(eventName, props[key]);
            } else if (key === 'ref' && typeof props[key] === 'object') {
                props[key].current = dom;
            } else if (key === 'dangerouslySetInnerHTML') {
                dom.innerHTML = props[key].__html;
            } else {
                dom.setAttribute(key, props[key]);
            }
        });

        // Append children
        const { children } = props;
        if (children) {
            const childArray = Array.isArray(children) ? children : [children];
            childArray.forEach(child => {
                if (child != null && child !== false) {
                    dom.appendChild(createDom(child));
                }
            });
        }

        return dom;
    }

    // useState hook
    function useState(initialValue) {
        const component = currentComponent;
        const index = hookIndex++;

        if (!component.hooks[index]) {
            component.hooks[index] = {
                value: typeof initialValue === 'function' ? initialValue() : initialValue
            };
        }

        const setState = (newValue) => {
            const hook = component.hooks[index];
            const nextValue = typeof newValue === 'function' ? newValue(hook.value) : newValue;
            if (hook.value !== nextValue) {
                hook.value = nextValue;
                // Re-render the entire app
                const root = document.getElementById('root');
                if (root && global.App) {
                    currentComponent = component;
                    hookIndex = 0;
                    render(createElement(global.App), root);
                }
            }
        };

        return [component.hooks[index].value, setState];
    }

    // useEffect hook
    function useEffect(callback, deps) {
        const component = currentComponent;
        const index = hookIndex++;

        if (!component.hooks[index]) {
            component.hooks[index] = { deps: undefined, cleanup: null };
        }

        const hook = component.hooks[index];
        const hasChanged = !deps || !hook.deps || deps.some((dep, i) => dep !== hook.deps[i]);

        if (hasChanged) {
            if (hook.cleanup) {
                hook.cleanup();
            }
            hook.cleanup = callback() || null;
            hook.deps = deps;
        }
    }

    // useRef hook
    function useRef(initialValue) {
        const component = currentComponent;
        const index = hookIndex++;

        if (!component.hooks[index]) {
            component.hooks[index] = { current: initialValue };
        }

        return component.hooks[index];
    }

    // useMemo hook
    function useMemo(factory, deps) {
        const component = currentComponent;
        const index = hookIndex++;

        if (!component.hooks[index]) {
            component.hooks[index] = { value: undefined, deps: undefined };
        }

        const hook = component.hooks[index];
        const hasChanged = !deps || !hook.deps || deps.some((dep, i) => dep !== hook.deps[i]);

        if (hasChanged) {
            hook.value = factory();
            hook.deps = deps;
        }

        return hook.value;
    }

    // Component class for error boundaries
    class Component {
        constructor(props) {
            this.props = props;
            this.state = {};
        }

        setState(newState) {
            this.state = { ...this.state, ...newState };
            // Re-render
            const root = document.getElementById('root');
            if (root && global.App) {
                render(createElement(global.App), root);
            }
        }
    }

    // Export to global
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
