
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\icons\Dog.svelte generated by Svelte v3.20.1 */

    const file = "src\\icons\\Dog.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let circle0;
    	let path4;
    	let path5;
    	let circle1;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let ellipse;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let g0;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			circle0 = svg_element("circle");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			circle1 = svg_element("circle");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			ellipse = svg_element("ellipse");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			set_style(path0, "fill", "#F5DCB4");
    			attr_dev(path0, "d", "M437.677,45.419h-82.581C325.161,57.29,318.525,37.161,256,37.161s-69.161,20.129-99.097,8.258\r\n\th-82.58L63.312,252.904c6.882,81.548,57.462,125.935,97.377,142.107h190.623c39.914-16.172,90.495-60.559,97.377-142.107\r\n\tL437.677,45.419z");
    			add_location(path0, file, 2, 0, 216);
    			set_style(path1, "fill", "#965A50");
    			attr_dev(path1, "d", "M355.097,45.419C448.078,73.25,397.46,216.774,457.33,278.813c8.595,8.906,23.781,4.95,27.368-6.895\r\n\tc4.74-15.651,9.474-40.411,8.721-75.789C492.387,147.613,512,144.517,512,144.517S487.226,28.903,412.903,28.903\r\n\tC388.129,28.903,355.097,45.419,355.097,45.419z");
    			add_location(path1, file, 5, 0, 481);
    			set_style(path2, "fill", "#4B3F4E");
    			attr_dev(path2, "d", "M169.29,260.129L169.29,260.129c-15.897,0-28.903-13.006-28.903-28.903v-16.516\r\n\tc0-15.897,13.006-28.903,28.903-28.903l0,0c15.897,0,28.903,13.006,28.903,28.903v16.516\r\n\tC198.194,247.124,185.187,260.129,169.29,260.129z");
    			add_location(path2, file, 8, 0, 773);
    			set_style(path3, "fill", "#5D5360");
    			attr_dev(path3, "d", "M169.29,185.806c-1.413,0-2.769,0.221-4.129,0.419v40.871c0,9.121,7.395,16.516,16.516,16.516\r\n\tc9.122,0,16.516-7.395,16.516-16.516v-12.386C198.194,198.814,185.187,185.806,169.29,185.806z");
    			add_location(path3, file, 11, 0, 1024);
    			set_style(circle0, "fill", "#FFFFFF");
    			attr_dev(circle0, "cx", "169.29");
    			attr_dev(circle0, "cy", "206.451");
    			attr_dev(circle0, "r", "12.387");
    			add_location(circle0, file, 13, 0, 1244);
    			set_style(path4, "fill", "#4B3F4E");
    			attr_dev(path4, "d", "M342.71,260.129L342.71,260.129c-15.897,0-28.903-13.006-28.903-28.903v-16.516\r\n\tc0-15.897,13.006-28.903,28.903-28.903l0,0c15.897,0,28.903,13.006,28.903,28.903v16.516\r\n\tC371.613,247.124,358.606,260.129,342.71,260.129z");
    			add_location(path4, file, 14, 0, 1313);
    			set_style(path5, "fill", "#5D5360");
    			attr_dev(path5, "d", "M342.71,185.806c-1.413,0-2.769,0.221-4.129,0.419v40.871c0,9.121,7.395,16.516,16.516,16.516\r\n\tc9.122,0,16.516-7.395,16.516-16.516v-12.386C371.613,198.814,358.606,185.806,342.71,185.806z");
    			add_location(path5, file, 17, 0, 1564);
    			set_style(circle1, "fill", "#FFFFFF");
    			attr_dev(circle1, "cx", "342.71");
    			attr_dev(circle1, "cy", "206.451");
    			attr_dev(circle1, "r", "12.387");
    			add_location(circle1, file, 19, 0, 1784);
    			set_style(path6, "fill", "#824641");
    			attr_dev(path6, "d", "M457.33,278.814c8.595,8.906,23.781,4.95,27.368-6.896c2.718-8.976,5.399-21.06,7.08-36.313\r\n\tc-16.234-8.092-30.092-33.91-38.617-77.669C437.677,78.452,416,34.065,355.097,45.419C448.078,73.25,397.46,216.775,457.33,278.814z\r\n\t");
    			add_location(path6, file, 20, 0, 1853);
    			set_style(path7, "fill", "#E7C9A5");
    			attr_dev(path7, "d", "M160.689,395.011h39.141c0,0-68.732-46.107-80.087-127.656\r\n\tC97.654,108.712,139.7,61.247,176.067,49.135c-5.761,0.195-11.745-0.774-19.163-3.715H74.323L63.312,252.904\r\n\tC70.194,334.452,120.774,378.839,160.689,395.011z");
    			add_location(path7, file, 23, 0, 2110);
    			set_style(path8, "fill", "#965A50");
    			attr_dev(path8, "d", "M156.903,45.419C63.922,73.25,114.541,216.775,54.67,278.813c-8.595,8.906-23.781,4.95-27.368-6.895\r\n\tc-4.74-15.651-9.474-40.411-8.721-75.789C19.613,147.613,0,144.517,0,144.517S24.774,28.903,99.097,28.903\r\n\tC123.871,28.903,156.903,45.419,156.903,45.419z");
    			add_location(path8, file, 26, 0, 2360);
    			set_style(path9, "fill", "#824641");
    			attr_dev(path9, "d", "M154.139,44.104c-8.38-3.888-34.516-15.201-55.042-15.201C24.774,28.903,0,144.517,0,144.517\r\n\ts19.613,3.097,18.581,51.613c-0.014,0.648,0.005,1.231-0.005,1.872C66.097,17.715,139.119,37.773,154.139,44.104z");
    			add_location(path9, file, 29, 0, 2646);
    			set_style(ellipse, "fill", "#BC8E78");
    			attr_dev(ellipse, "cx", "256");
    			attr_dev(ellipse, "cy", "400.52");
    			attr_dev(ellipse, "rx", "90.84");
    			attr_dev(ellipse, "ry", "66.06");
    			add_location(ellipse, file, 31, 0, 2883);
    			set_style(path10, "fill", "#FF8087");
    			attr_dev(path10, "d", "M214.71,400.516v41.29c0,22.804,18.486,41.29,41.29,41.29s41.29-18.486,41.29-41.29v-41.29H214.71z");
    			add_location(path10, file, 32, 0, 2960);
    			set_style(path11, "fill", "#E6646E");
    			attr_dev(path11, "d", "M214.71,432.768c11.941-1.496,23.208-5.129,33.032-10.622v11.402c0,4.56,3.698,8.258,8.258,8.258\r\n\ts8.258-3.698,8.258-8.258v-11.507c9.729,5.552,21.026,9.225,33.032,10.73v-32.256h-82.58V432.768z");
    			add_location(path11, file, 34, 0, 3094);
    			set_style(path12, "fill", "#D4AF91");
    			attr_dev(path12, "d", "M309.677,326.194H202.323c-34.206,0-61.935,20.335-61.935,45.419s27.73,45.419,61.935,45.419\r\n\tc17.225,0,32.782-5.169,43.995-13.498c2.839-2.108,6.262-3.162,9.679-3.162c3.423,0,6.846,1.053,9.685,3.162\r\n\tc11.213,8.329,26.77,13.498,43.995,13.498c34.206,0,61.935-20.335,61.935-45.419C371.613,346.529,343.883,326.194,309.677,326.194z");
    			add_location(path12, file, 36, 0, 3320);
    			set_style(path13, "fill", "#5D5360");
    			attr_dev(path13, "d", "M256,293.161c27.365,0,49.548,14.789,49.548,33.032c0,17.594-20.824,26.858-35.853,33.708\r\n\tc-8.712,3.971-18.68,3.971-27.392,0c-15.029-6.85-35.853-16.114-35.853-33.708C206.452,307.951,228.635,293.161,256,293.161z");
    			add_location(path13, file, 40, 0, 3684);
    			set_style(path14, "fill", "#4B3F4E");
    			attr_dev(path14, "d", "M230.968,317.161c-1.155-10.393,6.166-21.507,6.166-21.507\r\n\tc-18.003,4.949-30.682,16.751-30.682,30.539c0,17.593,20.824,26.857,35.853,33.708c8.711,3.97,18.68,3.97,27.392,0\r\n\tc3.232-1.473,6.732-3.069,10.235-4.824C259.613,351.484,233.29,338.065,230.968,317.161z");
    			add_location(path14, file, 42, 0, 3929);
    			add_location(g0, file, 45, 0, 4222);
    			add_location(g1, file, 47, 0, 4233);
    			add_location(g2, file, 49, 0, 4244);
    			add_location(g3, file, 51, 0, 4255);
    			add_location(g4, file, 53, 0, 4266);
    			add_location(g5, file, 55, 0, 4277);
    			add_location(g6, file, 57, 0, 4288);
    			add_location(g7, file, 59, 0, 4299);
    			add_location(g8, file, 61, 0, 4310);
    			add_location(g9, file, 63, 0, 4321);
    			add_location(g10, file, 65, 0, 4332);
    			add_location(g11, file, 67, 0, 4343);
    			add_location(g12, file, 69, 0, 4354);
    			add_location(g13, file, 71, 0, 4365);
    			add_location(g14, file, 73, 0, 4376);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Capa_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, circle0);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, circle1);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, ellipse);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dog> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dog", $$slots, []);
    	return [];
    }

    class Dog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dog",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Card.svelte generated by Svelte v3.20.1 */

    const file$1 = "src\\Card.svelte";

    // (53:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card back svelte-1ns5w28");
    			add_location(div, file$1, 53, 4, 1177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(53:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if isFlipped}
    function create_if_block(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card front svelte-1ns5w28");
    			add_location(div, file$1, 49, 4, 1089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(49:4) {#if isFlipped}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isFlipped*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-1ns5w28");
    			add_location(div, file$1, 47, 0, 1039);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function turn(node, { delay = 0, duration = 500 }) {
    	return {
    		delay,
    		duration,
    		css: (t, u) => `transform: rotateY(${1 - u * 180}deg); opacity: ${1 - u};`
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { isFlipped = false } = $$props;
    	const writable_props = ["isFlipped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("isFlipped" in $$props) $$invalidate(0, isFlipped = $$props.isFlipped);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ isFlipped, turn });

    	$$self.$inject_state = $$props => {
    		if ("isFlipped" in $$props) $$invalidate(0, isFlipped = $$props.isFlipped);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isFlipped, $$scope, $$slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { isFlipped: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get isFlipped() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFlipped(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\icons\Cat.svelte generated by Svelte v3.20.1 */

    const file$2 = "src\\icons\\Cat.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let ellipse;
    	let path4;
    	let path5;
    	let g0;
    	let path6;
    	let path7;
    	let path8;
    	let g1;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let circle0;
    	let path13;
    	let path14;
    	let circle1;
    	let path15;
    	let path16;
    	let path17;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;
    	let g16;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			ellipse = svg_element("ellipse");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			g0 = svg_element("g");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			g1 = svg_element("g");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			circle0 = svg_element("circle");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			circle1 = svg_element("circle");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			g16 = svg_element("g");
    			set_style(path0, "fill", "#FFC850");
    			attr_dev(path0, "d", "M444.379,3.741c10.828-8.798,27.018-1.092,27.018,12.859v222.01l-182.26-107.699L444.379,3.741z");
    			add_location(path0, file$2, 2, 0, 216);
    			set_style(path1, "fill", "#EBAF4B");
    			attr_dev(path1, "d", "M454.828,228.819l-110.973-65.574l92.462-104.241c6.465-7.288,18.511-2.716,18.511,7.027V228.819z");
    			add_location(path1, file$2, 3, 0, 344);
    			set_style(path2, "fill", "#FFC850");
    			attr_dev(path2, "d", "M67.619,3.741C56.79-5.057,40.601,2.649,40.601,16.6v222.01l182.26-107.699L67.619,3.741z");
    			add_location(path2, file$2, 4, 0, 474);
    			set_style(path3, "fill", "#EBAF4B");
    			attr_dev(path3, "d", "M57.17,228.819l110.973-65.574L75.681,59.004c-6.465-7.288-18.511-2.716-18.511,7.027\r\n\tC57.17,66.031,57.17,228.819,57.17,228.819z");
    			add_location(path3, file$2, 5, 0, 596);
    			set_style(ellipse, "fill", "#FFDC64");
    			attr_dev(ellipse, "cx", "255.999");
    			attr_dev(ellipse, "cy", "292.46");
    			attr_dev(ellipse, "rx", "231.97");
    			attr_dev(ellipse, "ry", "219.54");
    			add_location(ellipse, file$2, 7, 0, 759);
    			set_style(path4, "fill", "#FF8087");
    			attr_dev(path4, "d", "M289.137,429.155v16.569c0,18.302-14.836,33.138-33.138,33.138l0,0\r\n\tc-18.302,0-33.138-14.836-33.138-33.138v-16.569l33.138-16.569L289.137,429.155z");
    			add_location(path4, file$2, 8, 0, 842);
    			set_style(path5, "fill", "#5D5360");
    			attr_dev(path5, "d", "M274.293,343.862h-36.588c-7.899,0-12.273,9.157-7.307,15.3l18.295,22.634\r\n\tc3.76,4.651,10.852,4.651,14.613,0l18.295-22.634C286.566,353.019,282.193,343.862,274.293,343.862z");
    			add_location(path5, file$2, 10, 0, 1022);
    			set_style(path6, "fill", "#E1A546");
    			attr_dev(path6, "d", "M479.673,437.439c-1.286,0-2.593-0.299-3.815-0.934c-50.092-26.047-128.491-41.524-129.28-41.678\r\n\t\tc-4.49-0.874-7.419-5.226-6.545-9.717c0.878-4.494,5.186-7.427,9.717-6.545c3.301,0.643,81.515,16.076,133.754,43.239\r\n\t\tc4.057,2.112,5.639,7.111,3.527,11.173C485.555,435.813,482.667,437.439,479.673,437.439z");
    			add_location(path6, file$2, 13, 1, 1234);
    			set_style(path7, "fill", "#E1A546");
    			attr_dev(path7, "d", "M496.255,379.451c-0.712,0-1.436-0.093-2.156-0.287c-46.435-12.483-130.87-10.113-131.703-10.077\r\n\t\tc-4.652,0.134-8.398-3.459-8.531-8.03c-0.138-4.575,3.459-8.394,8.03-8.531c3.56-0.113,87.736-2.476,136.509,10.635\r\n\t\tc4.417,1.189,7.035,5.732,5.849,10.153C503.257,377.012,499.912,379.447,496.255,379.451z");
    			add_location(path7, file$2, 16, 1, 1571);
    			add_location(g0, file$2, 12, 0, 1228);
    			set_style(path8, "fill", "#FFC850");
    			attr_dev(path8, "d", "M313.991,495.431c-128.112,0-231.967-98.291-231.967-219.54c0-89.035,56.034-165.634,136.518-200.081\r\n\tC108.248,92.762,24.032,183.285,24.032,292.46C24.032,413.709,127.887,512,255.999,512c34.037,0,66.328-6.995,95.449-19.459\r\n\tC339.25,494.416,326.748,495.431,313.991,495.431z");
    			add_location(path8, file$2, 20, 0, 1911);
    			set_style(path9, "fill", "#E1A546");
    			attr_dev(path9, "d", "M32.324,437.439c-2.993,0-5.882-1.622-7.358-4.462c-2.112-4.061-0.53-9.061,3.527-11.173\r\n\t\tc52.24-27.163,130.453-42.596,133.754-43.239c4.494-0.902,8.839,2.055,9.717,6.545c0.874,4.49-2.055,8.843-6.545,9.717\r\n\t\tc-0.789,0.154-79.189,15.631-129.28,41.678C34.917,437.14,33.611,437.439,32.324,437.439z");
    			add_location(path9, file$2, 24, 1, 2223);
    			set_style(path10, "fill", "#E1A546");
    			attr_dev(path10, "d", "M15.743,379.451c-3.657,0-7.002-2.439-7.997-6.137c-1.185-4.421,1.432-8.964,5.849-10.153\r\n\t\tc48.777-13.115,132.941-10.736,136.509-10.635c4.571,0.138,8.167,3.956,8.03,8.531c-0.138,4.571-4.098,8.196-8.531,8.03\r\n\t\tc-0.849-0.028-85.297-2.407-131.703,10.077C17.179,379.358,16.455,379.451,15.743,379.451z");
    			add_location(path10, file$2, 27, 1, 2553);
    			add_location(g1, file$2, 23, 0, 2217);
    			set_style(path11, "fill", "#4B3F4E");
    			attr_dev(path11, "d", "M160.727,321.456L160.727,321.456c-15.948,0-28.996-13.048-28.996-28.996v-16.569\r\n\tc0-15.948,13.048-28.996,28.996-28.996l0,0c15.948,0,28.996,13.048,28.996,28.996v16.569\r\n\tC189.723,308.407,176.675,321.456,160.727,321.456z");
    			add_location(path11, file$2, 31, 0, 2891);
    			set_style(path12, "fill", "#5D5360");
    			attr_dev(path12, "d", "M160.727,246.895c-1.418,0-2.778,0.221-4.142,0.421v41.002c0,9.151,7.418,16.569,16.569,16.569\r\n\ts16.569-7.418,16.569-16.569v-12.427C189.723,259.943,176.674,246.895,160.727,246.895z");
    			add_location(path12, file$2, 34, 0, 3145);
    			set_style(circle0, "fill", "#FFFFFF");
    			attr_dev(circle0, "cx", "160.729");
    			attr_dev(circle0, "cy", "267.61");
    			attr_dev(circle0, "r", "12.427");
    			add_location(circle0, file$2, 36, 0, 3359);
    			set_style(path13, "fill", "#4B3F4E");
    			attr_dev(path13, "d", "M351.271,321.456L351.271,321.456c-15.948,0-28.996-13.048-28.996-28.996v-16.569\r\n\tc0-15.948,13.048-28.996,28.996-28.996l0,0c15.948,0,28.996,13.048,28.996,28.996v16.569\r\n\tC380.267,308.407,367.219,321.456,351.271,321.456z");
    			add_location(path13, file$2, 37, 0, 3428);
    			set_style(path14, "fill", "#5D5360");
    			attr_dev(path14, "d", "M351.271,246.895c-1.418,0-2.778,0.221-4.142,0.421v41.002c0,9.151,7.418,16.569,16.569,16.569\r\n\ts16.569-7.418,16.569-16.569v-12.427C380.267,259.943,367.219,246.895,351.271,246.895z");
    			add_location(path14, file$2, 40, 0, 3682);
    			set_style(circle1, "fill", "#FFFFFF");
    			attr_dev(circle1, "cx", "351.269");
    			attr_dev(circle1, "cy", "267.61");
    			attr_dev(circle1, "r", "12.427");
    			add_location(circle1, file$2, 42, 0, 3896);
    			set_style(path15, "fill", "#4B3F4E");
    			attr_dev(path15, "d", "M262.408,382.15l-18.295-36.215c-0.332-0.658-0.518-1.378-0.769-2.074h-5.639\r\n\tc-7.899,0-12.273,9.157-7.308,15.3l18.295,22.634c3.55,4.39,9.981,4.485,13.863,0.587\r\n\tC262.511,382.297,262.453,382.239,262.408,382.15z");
    			add_location(path15, file$2, 43, 0, 3965);
    			set_style(path16, "fill", "#E6646E");
    			attr_dev(path16, "d", "M255.999,412.586l-33.138,16.569v16.569c0,2.629,0.383,5.154,0.961,7.606\r\n\tc8.337-1.034,16.389-3.449,23.892-7.153v7.831c0,4.575,3.709,8.285,8.285,8.285c4.576,0,8.285-3.709,8.285-8.285v-7.83\r\n\tc7.504,3.704,15.556,6.119,23.892,7.152c0.578-2.452,0.961-4.978,0.961-7.606v-16.569L255.999,412.586z");
    			add_location(path16, file$2, 46, 0, 4211);
    			set_style(path17, "fill", "#EBAF4B");
    			attr_dev(path17, "d", "M297.422,437.439c-11.719,0-23.013-3.483-32.653-10.073c-5.162-3.527-12.374-3.527-17.544,0\r\n\tc-9.636,6.59-20.93,10.073-32.649,10.073c-14.259,0-27.993-5.275-38.672-14.85c-3.406-3.058-3.689-8.297-0.635-11.703\r\n\ts8.281-3.689,11.703-0.635c13.911,12.483,35.683,13.847,50.905,3.434c10.841-7.403,25.408-7.403,36.241,0\r\n\tc15.226,10.408,37.001,9.041,50.913-3.43c3.402-3.05,8.636-2.775,11.699,0.639c3.054,3.406,2.767,8.645-0.639,11.699\r\n\tC325.41,432.168,311.681,437.439,297.422,437.439z");
    			add_location(path17, file$2, 49, 0, 4536);
    			add_location(g2, file$2, 54, 0, 5046);
    			add_location(g3, file$2, 56, 0, 5057);
    			add_location(g4, file$2, 58, 0, 5068);
    			add_location(g5, file$2, 60, 0, 5079);
    			add_location(g6, file$2, 62, 0, 5090);
    			add_location(g7, file$2, 64, 0, 5101);
    			add_location(g8, file$2, 66, 0, 5112);
    			add_location(g9, file$2, 68, 0, 5123);
    			add_location(g10, file$2, 70, 0, 5134);
    			add_location(g11, file$2, 72, 0, 5145);
    			add_location(g12, file$2, 74, 0, 5156);
    			add_location(g13, file$2, 76, 0, 5167);
    			add_location(g14, file$2, 78, 0, 5178);
    			add_location(g15, file$2, 80, 0, 5189);
    			add_location(g16, file$2, 82, 0, 5200);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Capa_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, ellipse);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, g0);
    			append_dev(g0, path6);
    			append_dev(g0, path7);
    			append_dev(svg, path8);
    			append_dev(svg, g1);
    			append_dev(g1, path9);
    			append_dev(g1, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, circle0);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, circle1);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    			append_dev(svg, g16);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cat> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cat", $$slots, []);
    	return [];
    }

    class Cat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cat",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\icons\Fish.svelte generated by Svelte v3.20.1 */

    const file$3 = "src\\icons\\Fish.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let path0;
    	let g;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let path31;
    	let path32;
    	let path33;
    	let path34;
    	let path35;
    	let path36;
    	let path37;
    	let path38;
    	let path39;
    	let path40;
    	let path41;
    	let path42;
    	let path43;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			g = svg_element("g");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			path31 = svg_element("path");
    			path32 = svg_element("path");
    			path33 = svg_element("path");
    			path34 = svg_element("path");
    			path35 = svg_element("path");
    			path36 = svg_element("path");
    			path37 = svg_element("path");
    			path38 = svg_element("path");
    			path39 = svg_element("path");
    			path40 = svg_element("path");
    			path41 = svg_element("path");
    			path42 = svg_element("path");
    			path43 = svg_element("path");
    			attr_dev(path0, "d", "m302.558594 46.542969s46.542968-23.273438 93.085937-23.273438c69.8125 0 116.355469 46.542969 116.355469 116.359375 0 46.632813-46.542969 93.085938-46.542969 93.085938zm0 0");
    			attr_dev(path0, "fill", "#004ed6");
    			add_location(path0, file$3, 0, 68, 68);
    			attr_dev(path1, "d", "m344.28125 51.363281 23.269531-23.273437c6.429688-6.425782 16.847657-6.425782 23.273438 0 6.425781 6.425781 6.425781 16.847656 0 23.273437l-23.273438 23.269531c-6.425781 6.425782-16.84375 6.425782-23.269531 0-6.425781-6.425781-6.425781-16.84375 0-23.269531zm0 0");
    			add_location(path1, file$3, 0, 284, 284);
    			attr_dev(path2, "d", "m390.824219 74.632812 23.269531-23.269531c6.429688-6.425781 16.847656-6.425781 23.273438 0 6.425781 6.425781 6.425781 16.84375 0 23.269531l-23.273438 23.273438c-6.425781 6.425781-16.84375 6.425781-23.269531 0s-6.425781-16.847656 0-23.273438zm0 0");
    			add_location(path2, file$3, 0, 557, 557);
    			attr_dev(path3, "d", "m423.734375 111.539062 36.902344-36.90625c6.425781-6.425781 16.847656-6.425781 23.273437 0 6.425782 6.425782 6.425782 16.847657 0 23.273438l-36.90625 36.902344c-6.425781 6.425781-16.84375 6.425781-23.269531 0-6.425781-6.425782-6.425781-16.84375 0-23.269532zm0 0");
    			add_location(path3, file$3, 0, 814, 814);
    			attr_dev(path4, "d", "m447.003906 158.082031 36.90625-36.90625c6.425782-6.425781 16.84375-6.425781 23.269532 0 6.425781 6.425781 6.425781 16.847657 0 23.273438l-36.902344 36.902343c-6.425782 6.425782-16.84375 6.425782-23.273438 0-6.425781-6.425781-6.425781-16.84375 0-23.269531zm0 0");
    			add_location(path4, file$3, 0, 1087, 1087);
    			attr_dev(g, "fill", "#0026b6");
    			add_location(g, file$3, 0, 266, 266);
    			attr_dev(path5, "d", "m7.679688 47.675781c8.875-17.800781 25.371093-30.59375 44.824218-34.761719 31.207032-6.71875 40.613282-12.914062 133.695313-12.914062 116.359375 0 302.53125 93.085938 302.53125 232.714844s-162.902344 209.441406-255.988281 209.441406c-69.8125 0-116.355469-23.269531-116.355469-23.269531s-16.222657 50.695312-45.714844 80.648437c-12.542969 12.757813-31.871094 15.988282-47.878906 8-15.324219-7.589844-24.308594-23.910156-22.523438-40.917968 2.40625-22.054688 32.894531-57.597657 46.304688-71.003907 0 0-41.078125-22.878906-46.285157-69.8125-2.035156-17.109375 6.808594-33.671875 22.15625-41.496093 14.566407-7.347657 32.121094-5.214844 44.507813 5.402343 20.496094 17.691407 49.433594 53.347657 49.433594 82.636719 0 0 209.441406 0 209.441406-93.085938 0 0-46.542969-46.542968-116.355469-46.542968-44.039062 0-173.703125-2.28125-206.992187-140.285156-3.578125-15.066407-1.738281-30.910157 5.199219-44.753907zm0 0");
    			attr_dev(path5, "fill", "#99cefa");
    			add_location(path5, file$3, 0, 1363, 1363);
    			attr_dev(path6, "d", "m243.015625 88.324219c-6.433594 0-11.648437 5.214843-11.648437 11.644531 0 .671875.058593 1.339844.171874 2.003906.816407 4.75 1.21875 9.5625 1.203126 14.382813 0 12.519531-4.3125 23.121093-13.183594 32.414062-.105469.113281-.207032.222657-.304688.335938-.113281.105469-.222656.210937-.328125.320312-4.105469 4.113281-8.707031 7.691407-13.707031 10.652344-5.507812 3.308594-7.289062 10.457031-3.976562 15.964844 3.304687 5.5 10.441406 7.285156 15.945312 3.992187.4375-.261718.878906-.53125 1.328125-.808594l.003906-.003906.058594-.035156.015625-.011719.03125-.019531.042969-.027344.027343-.015625.042969-.027343.023438-.015626.046875-.027343.023437-.015625.039063-.023438.027344-.019531.042968-.027344.027344-.015625.039062-.023437.023438-.015625.050781-.035156.011719-.003907.070312-.046875.058594-.035156.007813-.007812.0625-.039063.007812-.003906.0625-.039063.003907-.003906c4.324218-2.734375 8.414062-5.820312 12.238281-9.21875.046875-.042969.097656-.085938.144531-.132812l.074219-.0625v-.003907c.046875-.042969.097656-.085937.140625-.125l.007812-.003906c.019532-.019531.039063-.039063.0625-.058594l.011719-.011719.058594-.050781.015625-.015625.054687-.050781.019531-.019531.054688-.046875.023438-.019531.050781-.046876.019531-.019531.050781-.046875.027344-.023437.042969-.039063.03125-.03125.035156-.03125.039062-.039062.03125-.027344.046876-.042969.023437-.019531.054687-.054688.019532-.015624.0625-.058594.011718-.007813c.910157-.847656 1.8125-1.726562 2.710938-2.636719.140625-.144531.277344-.289062.410156-.4375.152344-.148437.304688-.296874.453125-.449218 6.921875-7.136719 12.261719-15.65625 15.664063-24.996094v-.003906c.070312-.199219.140625-.398438.210937-.601563.035157-.097656.070313-.199219.101563-.300781l.003906-.003906.101562-.296875v-.007813c.035157-.097656.066407-.199218.101563-.296875v-.003906c.035156-.101563.066406-.203125.097656-.300781l.003907-.007813.03125-.097656c.023437-.070313.042968-.136719.066406-.203125v-.003906c.03125-.101563.0625-.199219.097656-.300782v-.011718c.03125-.097656.0625-.199219.09375-.300782l.003906-.007812c.007813-.03125.019532-.066406.03125-.097656.019532-.070313.039063-.132813.058594-.203125l.003906-.007813c.011719-.035156.019532-.066406.03125-.097656v-.003906l.03125-.097656v-.003907c.011719-.035156.019532-.066406.03125-.101562v-.007813l.03125-.097656c.019532-.070312.039063-.136719.058594-.203125l.003906-.011719.027344-.097656.03125-.105469c.011719-.035156.019531-.066406.027344-.101562l.003906-.007813c.011719-.03125.019531-.066406.027344-.097656l.003906-.007812.027344-.097657v-.003906l.027344-.097656.003906-.011719.027344-.097656.003906-.003906.027344-.097657v-.007812l.027343-.097657.003907-.011718c.007812-.03125.015624-.0625.027343-.097656v-.007813c.011719-.03125.019531-.0625.027344-.09375v-.007813l.027344-.09375.003906-.019531.027344-.09375v-.007812c.011719-.03125.019531-.0625.027343-.097657v-.003906l.027344-.097656.003906-.011719.027344-.101562v-.003907c.007813-.035156.015625-.066406.027344-.101562l.027344-.101562v-.011719c.011718-.035157.019531-.066407.027344-.101563.011718-.035156.019531-.066406.027343-.101562v-.007813c.011719-.03125.019531-.0625.027344-.097656l.003906-.011719c.007813-.035156.015625-.066406.023438-.097656l.003906-.007812c.007813-.035157.015625-.066407.023437-.097657v-.007812c.007813-.03125.019532-.0625.027344-.097657l.027344-.109374v-.011719l.023438-.09375.003906-.011719.027344-.109375c.007812-.035156.015624-.066406.023437-.097656l.003906-.011719c.007813-.03125.015625-.0625.019531-.09375l.003907-.007812.023437-.097657.003906-.015625c.007813-.03125.015626-.066406.023438-.097656l.003906-.011719c.003906-.03125.011719-.058593.019532-.089843l.003906-.011719.023437-.097657.003907-.015624c.007812-.03125.011718-.066407.019531-.097657l.003906-.011719c.007813-.03125.015625-.0625.023437-.09375v-.007812l.023438-.097656.003906-.019532.023438-.09375v-.011718l.023437-.09375.003907-.011719.019531-.097656.003906-.015625.019531-.097656.003906-.015626.019532-.085937.003906-.015625c.007812-.03125.015625-.0625.019531-.09375l.007813-.023438c.003906-.03125.011718-.0625.019531-.09375l.003906-.015624c.003907-.027344.011719-.054688.015625-.082032l.007813-.023437.019531-.089844.003906-.023437.019532-.09375.003906-.015626.019531-.089843v-.011719l.019531-.097656.007813-.023438c.003906-.03125.011719-.0625.019531-.09375v-.011718l.019531-.089844.003907-.019532c.007812-.03125.011718-.0625.019531-.09375l.023437-.117187v-.011719l.019532-.089844.003906-.019531.019531-.09375.023437-.117187v-.011719l.019532-.09375.003906-.015625c.003906-.035156.011719-.066406.019531-.097656l.003907-.019532.015624-.097656.003907-.011718.015625-.089844.003906-.019532c.007812-.03125.011719-.0625.019531-.09375l.003907-.023437c.007812-.03125.011718-.0625.015624-.09375l.003907-.015625c.007812-.03125.011719-.0625.015625-.089844l.027344-.136718c.003906-.03125.011718-.066407.015624-.097657l.003907-.011719.015625-.09375.003906-.015624.015625-.097657.003906-.019531c.007813-.03125.011719-.066406.019531-.097656v-.011719c.007813-.03125.011719-.058594.015626-.089844l.003906-.023437c.007812-.03125.011718-.0625.015625-.09375l.003906-.023438c.007813-.035156.011719-.066406.019531-.097656v-.015625c.007813-.03125.011719-.058594.015625-.089844l.003907-.015625c.003906-.035156.011718-.066406.015624-.097656l.003907-.023438c.007812-.035156.011719-.066406.015625-.097656l.003906-.015625.015625-.089843v-.019532c.007813-.03125.011719-.0625.015625-.09375l.003906-.023437.015625-.097657.003907-.015624c.003906-.03125.007812-.058594.011718-.089844l.003906-.019532.015626-.097656.003906-.023437.015625-.097657.003906-.015624c.003906-.027344.007813-.058594.011719-.085938l.003906-.023438.015625-.097656.003906-.019531.015625-.101563v-.011718l.015625-.09375v-.015625l.015625-.097657.003906-.027343c.003907-.03125.007813-.066407.011719-.097657l.003907-.011718.011718-.09375.003906-.019532c.003907-.03125.011719-.0625.015626-.097656v-.023437l.015624-.097657.003907-.015624.011719-.089844v-.023438l.015624-.097656.003907-.019531c.003906-.035157.007812-.070313.011719-.101563v-.011718l.015624-.09375v-.023438l.015626-.097656.003906-.019532.011718-.101562v-.011719l.011719-.101562.003907-.011719.011718-.101562.003906-.023438.011719-.101562v-.007813c.003907-.035156.011719-.066406.015625-.097656v-.019531c.003906-.03125.007813-.066407.011719-.097657l.003906-.027343c.003907-.03125.007813-.066407.011719-.097657l.003906-.011719.007813-.097656.003906-.019531c.003906-.03125.007813-.0625.011719-.097656l.003906-.023438.007812-.101562.003907-.011719c.003906-.03125.007812-.0625.007812-.09375l.003907-.023438c.003906-.03125.007812-.066406.011718-.101562l.003906-.019531c.003907-.035157.007813-.070313.011719-.101563v-.011718l.007813-.097657.003906-.019531.011719-.097656v-.027344l.011719-.101562v-.011719c.003906-.03125.007812-.066407.011718-.09375l.003906-.023438c0-.03125.003907-.066406.007813-.097656l.003906-.027344c0-.03125.003907-.066406.007813-.101562l.003906-.011719.007812-.09375.003907-.019531c0-.035157.003906-.070313.007812-.105469v-.019531c.003907-.035157.007813-.070313.011719-.105469v-.007812c.003906-.035157.007812-.066407.011719-.097657v-.023437c.003906-.035156.007812-.066406.007812-.101563l.003907-.023437.007812-.101563v-.007812c.003906-.035157.007812-.070313.011719-.101563v-.019531c.003906-.035156.007812-.066406.007812-.101563l.003907-.027343.007812-.101563.003906-.015625.007813-.089843v-.023438c.003906-.035156.003906-.066406.007812-.101562l.003907-.023438.007812-.105469v-.011719c.003906-.03125.003906-.0625.007812-.097656v-.019531c.003907-.035156.007813-.070313.007813-.105469l.003906-.019531.007813-.105469v-.007812c.003906-.035156.003906-.070313.007812-.101563v-.023437c.003906-.035156.007813-.066406.007813-.101563l.003906-.019531c0-.039062.003906-.074219.003906-.109375l.003907-.003906c0-.035157.003906-.070313.007812-.105469v-.019531c0-.035157.003906-.070313.007812-.105469v-.019531c.003907-.039063.003907-.074219.007813-.109375.003906-.039063.003906-.074219.007813-.109375v-.019531l.007812-.105469v-.019531l.007812-.109376v-.003906l.003907-.105468.003906-.019532.003906-.105468v-.023438c.003907-.035156.003907-.070312.007813-.105469v-.007812c.003906-.035157.003906-.070313.003906-.101563l.003906-.023437c0-.035157.003906-.070313.003906-.105469v-.019531l.007813-.109375v-.007813c0-.035156.003906-.066406.003906-.105469l.003907-.019531.003906-.105469v-.023437c0-.035156.003906-.070313.003906-.105469v-.007812c.003906-.035156.003906-.070313.007812-.105469v-.023437l.003907-.101563v-.023437c0-.035157.003906-.070313.003906-.109376v-.003906l.003906-.105468.003907-.023438.003906-.105469v-.023437l.003906-.105469v-.011719c0-.03125 0-.066406.003906-.101562v-.023438c0-.035156.003906-.070312.003906-.105468v-.019532c0-.039062.003907-.074218.003907-.109375v-.007812c0-.035157 0-.070313.003906-.105469v-.023438c0-.035156 0-.070312.003906-.101562v-.132812l.003907-.011719v-.101563l.003906-.027344v-.128906l.003906-.105468v-.113282l.003906-.023437c0-.035157 0-.070313 0-.105469v-.023438c.003906-.039062.003906-.074218.003906-.113281 0-.039062 0-.074219 0-.109375v-.023437c0-.035157 0-.070313.003907-.109375v-.265625c0-.035157 0-.074219 0-.109375l.003906-.023438c0-.074218 0-.148437 0-.226562v-.019532c0-.035156 0-.070312 0-.109374v-.757813c-.003906-.03125-.003906-.0625-.003906-.097656v-.011719c0-.023438 0-.054688 0-.078125v-.03125c0-.023437 0-.046875 0-.070313v-.019531l-.003907-.191406v-.117187c0-.066407 0-.128907-.003906-.195313v-.195313l-.003906-.015624c0-.0625 0-.128907 0-.191407v-.015625l-.003906-.089844v-.007812c0-.066406 0-.128906 0-.195312v-.007813l-.003906-.09375v-.007813l-.003907-.199218-.003906-.097656v-.003907c0-.097656-.003906-.199219-.007813-.296875v-.105468c-.003906-.097657-.007812-.195313-.007812-.296876v-.003906c-.136719-5.09375-.644531-10.167968-1.515625-15.1875-.996094-5.539062-5.8125-9.574218-11.441406-9.585937zm0 0");
    			attr_dev(path6, "fill", "#c9e5fc");
    			add_location(path6, file$3, 0, 2300, 2300);
    			attr_dev(path7, "d", "m197.835938 442.15625c-6.425782 0-11.636719-5.210938-11.636719-11.636719 0-6.417969 5.195312-11.621093 11.613281-11.632812.683594 0 67.382812-.730469 133.199219-44.589844 63.882812-42.589844 64.632812-106.039063 64.632812-106.675781 0-6.425782 5.207031-11.636719 11.632813-11.636719 6.425781 0 11.636718 5.210937 11.636718 11.636719 0 3.113281-.863281 76.609375-74.996093 126.039062-71.925781 47.949219-143.082031 48.496094-146.082031 48.496094zm0 0");
    			attr_dev(path7, "fill", "#c9e5fc");
    			add_location(path7, file$3, 0, 12136, 12136);
    			attr_dev(path8, "d", "m216.507812 186.308594c-12.855468.0625-23.222656 10.535156-23.160156 23.386718.0625 12.449219 9.910156 22.648438 22.347656 23.140626l.042969.003906c.035157 0 .074219 0 .113281.003906h.023438c.046875.003906.085938.003906.132812.007812h.015626l.148437.003907.023437.003906c.035157 0 .070313 0 .109376.003906.222656.007813.449218.019531.671874.03125.199219.007813.398438.011719.597657.015625.214843.019532.433593.035156.652343.046875 45.3125 2.527344 79.789063 24.078125 96.484376 36.867188 10.226562 7.785156 24.824218 5.808593 32.609374-4.417969 7.773438-10.207031 5.816407-24.777344-4.371093-32.574219-20.792969-15.921875-64.308594-43.109375-122.097657-46.34375-.257812-.015625-.511718-.023437-.765624-.03125-.292969-.023437-.589844-.039062-.886719-.054687l-1.65625-.070313c-.347657-.015625-.691407-.023437-1.035157-.023437zm0 0");
    			attr_dev(path8, "fill", "#64aef7");
    			add_location(path8, file$3, 0, 12612, 12612);
    			attr_dev(path9, "d", "m488.730469 232.714844c0-139.628906-186.171875-232.714844-302.53125-232.714844-93.082031 0-102.488281 6.195312-133.695313 12.914062-8.429687 1.90625-16.398437 5.464844-23.441406 10.472657 31.285156.832031 194.300781 9.144531 320.039062 92.96875 139.628907 93.085937 139.628907 281.242187-116.359374 325.800781 93.085937 0 255.988281-69.8125 255.988281-209.441406zm0 0");
    			attr_dev(path9, "fill", "#0a86e3");
    			add_location(path9, file$3, 0, 13467, 13467);
    			attr_dev(path10, "d", "m377.316406 36.082031c-6.429687-.003906-11.644531 5.203125-11.648437 11.628907-.003907 4.011718 2.0625 7.742187 5.460937 9.871093 15.140625 9.347657 29.523438 19.875 43.003906 31.488281l.171876.148438h.003906c.050781.046875.109375.097656.164062.144531l.011719.007813c.054687.046875.113281.097656.164063.144531l.003906.003906c.171875.148438.339844.296875.511718.445313l.007813.007812c.054687.046875.109375.097656.164063.144532l.011718.007812c.050782.046875.101563.089844.15625.136719l.015625.015625c.054688.046875.105469.089844.15625.136718l.011719.011719c.054688.046875.109375.09375.160156.140625l.011719.007813.164063.144531.011718.011719c.050782.046875.105469.09375.15625.136719l.015625.015624c.046875.039063.109375.09375.152344.132813l.023437.019531c.050782.046875.089844.082032.144532.128906l.027344.023438c.042968.039062.097656.089844.144531.128906l.019531.019532c.046875.039062.109375.09375.15625.136718l.011719.011719c.050781.046875.105469.09375.160156.140625l.019531.019531c.054688.046875.09375.082031.144532.128907l.03125.027343c.046874.042969.089843.082031.136718.121094l.03125.027344c.046875.042969.09375.085937.140625.125l.027344.023437c.042969.042969.09375.085938.140625.125l.027344.027344c.042968.039062.089844.082031.136718.121094l.039063.039062c.046875.039063.09375.082032.140625.125l.03125.023438.136719.125.03125.03125c.046875.039062.089843.078125.132812.117187l.035157.03125.128906.117188.039062.035156.132813.121094.03125.027343.136719.125.039062.035157.140625.125.03125.03125c.039063.035156.089844.082031.128906.117187l.042969.039063c.039062.035156.085938.078125.125.113281l.039062.035156.125.113282.042969.039062c.039063.035156.085938.074219.121094.109375l.046875.042969c.046875.042968.078125.070312.121094.113281l.054687.046875c.042969.039062.078125.070312.121094.113281l.046875.039063c.039062.039062.085938.078125.121094.117187.015625.007813.03125.023438.042968.035157.039063.035156.085938.082031.125.117187l.039063.03125c.039063.039063.085937.082031.125.117187l.039063.039063c.039062.035156.085937.078125.125.113281l.039062.039063c.046875.039062.085938.074219.128906.117187l.050782.042969c.042968.042969.078124.074219.125.117187l.046874.042969c.039063.035157.078126.074219.117188.109375l.046875.042969.113281.105469.050782.046875c.039062.035156.074218.070312.113281.105469l.046875.042968.117187.109375c.019531.019531.035157.035157.054688.050781l.113281.105469.0625.058594c.03125.027344.074219.070313.109375.101563l.054687.050781c.035157.035156.074219.070312.109376.105469l.054687.046874.113281.105469.046875.042969c.039063.039062.070313.070312.109375.105469.015625.015625.039063.035156.054688.050781.039062.035156.070312.066406.109375.101562l.066406.0625c.03125.03125.066406.0625.097656.09375l.070313.0625c.039062.039063.070312.070313.109375.105469l.054687.050781c.03125.03125.074219.070313.105469.101563l.058594.054687c.039062.035157.066406.0625.105469.097657l.054687.054687.105469.097656.054687.050782c.039063.039062.070313.070312.109375.105468l.066406.0625.089844.085938c.027344.023438.054688.050781.082032.078125.035156.03125.050781.046875.082031.078125.027343.023438.054687.046875.082031.074219.03125.03125.0625.0625.097656.09375.019532.019531.039063.039062.058594.058593l.097656.09375.0625.058594.09375.089844.082032.074219.078124.082031c.027344.023438.058594.050781.085938.078125l.082031.082031c.027344.023438.054688.050782.082031.074219l.085938.082031.074219.074219.097656.089844.15625.15625c.023437.019531.042969.039062.0625.058593l.097656.09375c.027344.023438.054688.054688.082031.082032.027344.023437.050782.046875.074219.070312l.085938.078125c.023437.027344.050781.050781.074219.078125l.089843.085938.074219.070312c.027344.027344.054688.050782.082031.078125.03125.03125.0625.0625.09375.09375l.066407.0625c.023437.023438.0625.0625.089843.085938l.066407.066406.085937.082031.15625.15625.105469.097656.050781.054688c.039063.035156.074219.070312.109375.105469l.050781.046875.105469.105468.0625.058594.09375.09375.085938.082032.082031.082031c.027343.023437.046875.046875.070312.070312.035157.03125.066407.0625.097657.097657l.058593.054687c.035157.035156.070313.070313.101563.101563.015625.015624.035156.035156.046875.046874.039062.035157.074219.070313.109375.109376l.050781.050781c.035156.035156.070313.066406.105469.101562l.152344.152344c.027343.023437.054687.054687.082031.078125l.097656.097656c.023437.023438.03125.03125.058594.058594.035156.035156.070312.070312.105469.105469l.046874.046875c.039063.039062.074219.074218.113282.113281l.035156.035156c.042969.039063.082031.078125.121094.117188l.03125.03125c.039062.042969.078125.082031.121094.125l.015624.015625c.066407.066406.128907.125.191407.191406l.015625.015625c.039062.039063.078125.078125.117187.117187l.039063.039063c.039062.039063.074218.074219.113281.113281l.039063.039063c.039062.039062.074218.074219.109374.113281l.046876.042969c.039062.039062.074218.078125.113281.113281l.03125.035156c.042969.039063.078125.078125.121093.117188l.03125.035156c.105469.105469.214844.214844.320313.324219l.019531.019531c.042969.042969.085938.085938.128906.128906l.027344.027344c.039063.039062.078125.082031.117188.121094l.035156.035156.117188.121094.179687.179687.164063.167969.03125.03125c.042968.042969.082031.085938.121093.125l.027344.027344c.039063.042968.078125.082031.121094.121094l.03125.035156c.039062.042968.082031.085937.121093.125l.019532.019531.128906.132813.019531.019531c.109375.113281.222657.226562.328125.339843l.019532.019532c.042968.046875.085937.089844.128906.132812l.019531.019532.128906.132812.019531.019531.125.128907.027344.03125c.039063.042968.078125.082031.121094.125l.023438.027343c.109374.113281.214843.222657.324218.335938l.019532.019531c.035156.039062.074218.078125.109374.117188l.042969.042968c.039063.039063.074219.078125.113281.121094l.027344.027344.125.128906.019532.019531c.042968.046875.085937.089844.128906.136719l.003906.003906c.210938.222656.425781.445313.636719.671875l.003906.003907c.042969.046874.089844.097656.136719.144531l.007812.007812c.164063.175781.324219.34375.488282.519531l.003906.003907c.09375.097656.183594.195312.277344.292969l.007812.011718.136719.144532.140625.152343.007812.007813c.511719.550781 1.023438 1.101562 1.535156 1.65625v.003906c.046876.050781.089844.097656.136719.148438l.007813.007812c.160156.175781.320312.351562.480468.527344.09375.101562.183594.203125.277344.304687.046875.050781.09375.101563.136719.152344h.003906c.25.28125.5.558594.753907.839844l.003906.003906c.34375.382813.683594.765625 1.023437 1.148437l.003907.003907c.203124.226562.398437.453125.601562.679687l.011719.015625.128906.144531.007813.007813c.042968.050781.085937.101563.128906.148437l.003906.003907c.246094.28125.492188.5625.738281.847656l.003907.003906.132812.152344.003906.003906c.109375.125.21875.253907.332032.382813.039062.042968.074218.085937.109374.128906l.03125.039062c.035157.039063.074219.082032.109376.125l.027343.03125.113281.128907.023438.03125c.039062.046875.078125.089843.117188.136719l.011718.011718c.148438.171875.296875.347656.445313.519532l.015625.019531.121094.140625.015624.019531.113282.136719.027344.03125c.035156.042968.078124.085937.113281.132812l.015625.015625.308594.367188.011718.011719c.039063.046874.078125.09375.117188.144531l.015625.015625c.039062.042968.078125.089844.113281.132812l.027344.035156c.039062.042969.070312.082032.109375.128907l.027343.03125.105469.128906.035157.039063c.03125.039062.070312.085937.105468.125l.007813.007812c.054687.070312.113281.136719.167969.203125l.023437.027344.105469.128906.03125.035156c.035156.042969.070312.085938.105468.128907l.027344.03125.113282.132812.019531.027344c.039062.046875.074219.089844.113281.136718l.015625.019532c.054687.0625.105469.128906.160156.191406l.023438.03125c.039062.042969.074219.085938.109375.128906l.023437.03125c.035157.042969.074219.085938.109375.128906l.027344.035157c.035156.042969.070312.085937.101562.125l.035157.042969c.035156.039062.066406.078124.101562.121093.011719.019531.019531.027344.035157.046875.035156.039063.066406.078125.101562.121094l.027344.03125c.035156.046875.070312.085938.105468.132812l.011719.011719c.046875.058594.097657.121094.144531.175781l.046876.058594.089843.109375.042969.054688c.035156.039062.066406.078125.097656.117187l.035156.046875c.035157.039063.066407.078125.097657.121094l.042969.050781c.03125.035156.0625.074219.089843.109375l.0625.078125c.023438.03125.050781.0625.074219.09375.023438.023438.046875.054688.066406.082032.035156.039062.066406.082031.101563.121093l.03125.042969c.035156.039062.066406.082031.101562.121094l.035157.042968c.03125.039063.058593.078126.089843.117188l.046875.054688c.03125.039062.0625.078124.089844.113281l.039062.050781c.03125.039062.0625.074219.09375.117188l.042969.050781c.03125.039062.0625.078125.089844.113281.023437.027344.050781.058594.070313.085938.023437.03125.050781.0625.074218.09375l.058594.074218c.03125.039063.0625.078125.09375.117188l.039062.046875c.03125.039062.0625.082031.09375.121093l.035157.042969.097656.121094c.015625.019531.03125.042969.046875.0625l.082031.101563c.019531.027343.042969.054687.0625.082031l.070313.085937c.019531.027344.050781.066406.070312.089844.027344.035156.050782.066406.078125.097656.019531.027344.03125.042969.054688.070313l.082031.101562.050781.070313.082031.101562c.019532.027344.03125.039063.050782.0625.027344.035156.054687.074219.082031.105469l.058594.074219.074219.09375c.023437.035156.046874.0625.070312.09375l.058594.074218.074218.097657c.019532.023437.042969.050781.058594.074219l.078125.09375c.019531.03125.042969.058593.066407.089843l.066406.085938c.023437.027343.046875.058593.070312.089843l.0625.078126c.023438.03125.046875.066406.070313.09375.023437.027343.050781.066406.070312.089843.019531.027344.042969.054688.0625.078125.023438.035156.050781.070313.078125.101563.015625.023437.035156.046875.050782.070312.027343.03125.054687.070313.082031.101563l.046875.0625c.023437.03125.058594.078125.085937.109375.019531.027343.039063.054687.058594.078125.023437.03125.046875.0625.074219.09375.015625.027344.039062.054687.058594.078125.023437.035156.046874.066406.074218.097656l.058594.078125c.027344.035156.058594.078125.085938.109375l.042968.058594.085938.109375.046875.066406.128906.164062.085937.117188.054688.070312.210938.28125c.019531.023438.039062.050782.058593.074219.023438.03125.058594.078125.082031.109375.015626.019532.03125.039063.046876.058594.03125.042969.054687.074219.085937.113281l.128906.175781c.011719.015626.027344.035157.039063.050782.03125.042968.058594.074218.085937.117187.023438.023438.039063.046875.058594.074219.023437.03125.054687.074219.078125.105469l.050781.066406c.027344.039063.058594.078125.089844.117187l.039063.054688c.03125.039062.058593.082031.089843.121094l.042969.054687.082031.113281.046875.0625.085938.113282.039062.054687.089844.121094.042969.0625c.03125.039063.058593.078125.089843.117187l.046876.0625c.027343.039063.0625.085938.089843.125l.039063.050782.09375.125.03125.042968c.03125.042969.066406.089844.097656.132813l.15625.214844.097656.132812.140625.1875.023438.035157.105469.144531.023437.03125c.035156.050781.070313.097656.105469.144531l.023437.03125c.035157.046875.066407.09375.101563.140625l.027344.039063c.035156.046874.066406.09375.101562.140624l.019531.027344c.039063.054688.070313.09375.109375.148438l.019532.027344c.039062.054687.070312.101562.109374.15625l.023438.03125c.035156.046874.070312.097656.105469.144531l.027343.039062c.035157.046875.066407.089844.097657.136719l.027343.035156c.027344.042969.070313.097656.097657.140625l.027343.035157c.035157.050781.066407.097656.101563.144531l.023437.03125c.03125.046875.070313.097656.105469.144531l.019531.03125.113282.160156.015625.023438.109375.148437.019531.03125c.035156.046875.070313.097657.101563.144531l.023437.03125c.03125.042969.074219.105469.101563.144532l.023437.03125.105469.148437.019531.027344c.039063.054687.070313.101563.109375.15625l.011719.015625c.039062.054688.082031.113281.117187.167969l.011719.015625c.039063.058594.074219.109375.113281.164062l.011719.015625c.035156.046875.078125.113281.113281.160157l.015625.019531c.035157.054687.070313.101562.105469.15625l.019531.023437.109375.15625.011719.019532c.039063.054687.074219.105468.113281.160156l.003906.011718c.125.175782.25.347657.382813.515626.109375.179687.226563.359374.347656.535156l.003907.007812c.03125.046875.0625.09375.097656.140625l.003906.007813c.035156.050781.070312.101562.101562.148437h.003907c8.765625 12.6875 15.933593 26.410157 21.339843 40.851563 2.242188 6.023437 8.941407 9.085937 14.964844 6.84375 6.011719-2.238282 9.074219-8.917969 6.851563-14.9375-6.117188-16.351563-14.242188-31.882813-24.183594-46.234375-.136719-.195313-.273437-.386719-.417969-.574219-.125-.199219-.253906-.398438-.390625-.59375-21.773437-31.304688-53.644531-60.492188-92.167969-84.414062-1.839843-1.144532-3.960937-1.75-6.128906-1.75zm0 0");
    			attr_dev(path10, "fill", "#0026b6");
    			add_location(path10, file$3, 0, 13861, 13861);
    			attr_dev(path11, "d", "m256.015625 46.542969c0 12.851562-10.417969 23.269531-23.273437 23.269531-12.851563 0-23.269532-10.417969-23.269532-23.269531 0-12.851563 10.417969-23.273438 23.269532-23.273438 12.855468 0 23.273437 10.421875 23.273437 23.273438zm0 0");
    			attr_dev(path11, "fill", "#0a86e3");
    			add_location(path11, file$3, 0, 26626, 26626);
    			attr_dev(path12, "d", "m325.828125 93.085938c0 12.851562-10.417969 23.269531-23.269531 23.269531-12.851563 0-23.273438-10.417969-23.273438-23.269531 0-12.851563 10.421875-23.273438 23.273438-23.273438 12.851562 0 23.269531 10.421875 23.269531 23.273438zm0 0");
    			attr_dev(path12, "fill", "#0a86e3");
    			add_location(path12, file$3, 0, 26887, 26887);
    			attr_dev(path13, "d", "m139.65625 46.542969c0 12.851562-10.417969 23.269531-23.269531 23.269531-12.851563 0-23.273438-10.417969-23.273438-23.269531 0-12.851563 10.421875-23.273438 23.273438-23.273438 12.851562 0 23.269531 10.421875 23.269531 23.273438zm0 0");
    			attr_dev(path13, "fill", "#001386");
    			add_location(path13, file$3, 0, 27148, 27148);
    			attr_dev(path14, "d", "m116.386719 34.90625c0 6.425781-5.210938 11.636719-11.636719 11.636719s-11.632812-5.210938-11.632812-11.636719 5.207031-11.632812 11.632812-11.632812 11.636719 5.207031 11.636719 11.632812zm0 0");
    			attr_dev(path14, "fill", "#46a4f2");
    			add_location(path14, file$3, 0, 27408, 27408);
    			attr_dev(path15, "d", "m58.207031 116.355469c-6.421875.003906-11.628906-5.199219-11.632812-11.621094 0-.003906 0-.007813 0-.011719v-9.546875c.023437-3.996093-2.042969-7.710937-5.457031-9.792969-39.929688-23.796874-41.085938-47.816406-41.085938-50.476562 0-6.429688 5.214844-11.636719 11.644531-11.632812 6.238281 0 11.367188 4.921874 11.625 11.15625.136719 1 2.636719 14.816406 29.726563 30.953124 10.4375 6.300782 16.816406 17.601563 16.816406 29.792969v9.546875c.003906 6.421875-5.199219 11.632813-11.621094 11.636719-.003906-.003906-.007812-.003906-.015625-.003906zm0 0");
    			attr_dev(path15, "fill", "#64aef7");
    			add_location(path15, file$3, 0, 27628, 27628);
    			attr_dev(path16, "d", "m69.84375 104.722656c0 6.425782-5.210938 11.632813-11.636719 11.632813s-11.632812-5.207031-11.632812-11.632813c0-6.425781 5.207031-11.636718 11.632812-11.636718s11.636719 5.210937 11.636719 11.636718zm0 0");
    			attr_dev(path16, "fill", "#006ce2");
    			add_location(path16, file$3, 0, 28204, 28204);
    			attr_dev(path17, "d", "m21.960938 74.949219c-6.425782-.003907-11.640626 5.203125-11.644532 11.628906-.003906 3.675781 1.730469 7.136719 4.675782 9.332031 2.628906 1.964844 5.410156 3.898438 8.308593 5.785156v3.027344c.007813 15.835938 10.667969 29.691406 25.976563 33.75.625.164063 1.257812.277344 1.898437.335938.609375.195312 1.238281.34375 1.875.4375 1.257813.1875 2.527344.308594 3.800781.355468.152344.007813.304688.011719.457032.011719 6.425781-.007812 11.632812-5.21875 11.628906-11.644531-.003906-6.25-4.945312-11.378906-11.1875-11.621094h-.042969c-.414062-.019531-.828125-.058594-1.238281-.121094-.210938-.03125-.421875-.054687-.628906-.074218-.203125-.066406-.40625-.125-.617188-.179688-3.914062-1.042968-7.007812-4.042968-8.167968-7.925781l-.011719-.035156c-.011719-.046875-.023438-.089844-.039063-.136719v-.003906l-.007812-.03125c-.015625-.046875-.027344-.09375-.039063-.136719v-.003906l-.007812-.03125v-.003907l-.011719-.03125c-.007812-.035156-.015625-.070312-.027344-.105468l-.015625-.070313c-.011719-.046875-.023437-.09375-.03125-.140625l-.003906-.003906-.003906-.027344-.003907-.003906-.007812-.035156c-.003906-.023438-.007812-.046875-.011719-.070313l-.007812-.035156-.003907-.003906-.003906-.03125-.003906-.003907-.027344-.136718v-.007813l-.003906-.027343-.003906-.007813-.003906-.027344v-.007812l-.011719-.066407-.003907-.003906-.003906-.03125v-.007812l-.007812-.027344v-.007812l-.003906-.027344-.003907-.007813-.003906-.027343v-.003907l-.011719-.070312v-.007813l-.007812-.027344v-.007812l-.003906-.027344v-.007812l-.003907-.027344-.003906-.007812-.007813-.066407v-.007812l-.007812-.027344v-.007813l-.003906-.027343v-.007813l-.003906-.027344v-.007812c-.003907-.023438-.007813-.046875-.011719-.070312v-.007813l-.003907-.027344v-.007812l-.003906-.027344v-.007813l-.003906-.027343v-.007813l-.003906-.027344v-.007812l-.003906-.035156-.003907-.003906v-.027344l-.003906-.011719v-.023437l-.003906-.011719v-.023438l-.003907-.011719v-.035156l-.003906-.035156-.003906-.03125v-.011719l-.003906-.023437v-.011719l-.003906-.023437v-.011719l-.003907-.023438v-.011719l-.003906-.035156v-.03125l-.003906-.011718v-.035157l-.003907-.023437v-.039063l-.003906-.007812-.003906-.070313v-.011718l-.003906-.023438v-.046875l-.003906-.023437v-.046876l-.003907-.035156v-.046875l-.003906-.023437v-.082032l-.003906-.03125v-.085937l-.003907-.019531v-9.816406c.023438-3.996094-2.046874-7.714844-5.457031-9.796876l-.109375-.066406-.046875-.027344-.0625-.039062-.058593-.03125-.054688-.035156-.058594-.035156-.050781-.03125c-.019531-.011719-.042969-.023438-.0625-.035157l-.046875-.03125c-.019531-.007812-.042969-.023437-.0625-.035156l-.046875-.027344c-.023437-.015625-.046875-.027343-.066406-.042969l-.039063-.023437c-.023437-.011719-.050781-.027344-.070312-.042969l-.035156-.019531-.078126-.046875-.023437-.015625-.085937-.050781h-.003907c-.132812-.082032-.273437-.167969-.40625-.25l-.007812-.003906c-.03125-.019532-.0625-.039063-.09375-.058594l-.011719-.007813-.09375-.054687-.015625-.007813-.089844-.058593-.011719-.007813c-.03125-.019531-.0625-.035156-.09375-.054687l-.011718-.007813-.09375-.058594-.007813-.003906c-.308593-.1875-.613281-.378906-.917969-.570313-1.148437-.71875-2.265624-1.441406-3.351562-2.160156h-.003906l-.089844-.0625-.003906-.003906-.089844-.058594-.011719-.007812c-.027343-.019532-.058593-.039063-.085937-.058594h-.003906c-.214844-.144531-.429688-.289062-.644532-.433594l-.019531-.015625-.074219-.050781-.023437-.011719-.070313-.050781-.027344-.015625-.066406-.046875-.03125-.019531-.066406-.046875-.03125-.019532-.066406-.046874-.027344-.019532-.066406-.042968-.027344-.019532-.222656-.152344-.035156-.023437-.050782-.035156-.046875-.03125-.046875-.035157-.09375-.0625-.054687-.039062-.039063-.027344-.054687-.039062-.042969-.027344-.054688-.039062-.042968-.027344-.054688-.039063-.042968-.027343-.058594-.042969-.03125-.023438c-.027344-.019531-.050782-.035156-.078125-.050781l-.019531-.015625c-.097657-.066406-.195313-.136719-.292969-.203125l-.003907-.003906-.09375-.066406-.007812-.007813-.085938-.058594-.011718-.007812c-.03125-.023438-.058594-.042969-.085938-.0625l-.015625-.007813-.082031-.058594-.011719-.011718-.085937-.058594-.011719-.007812c-.875-.621094-1.722656-1.238282-2.546875-1.851563-2-1.507813-4.441406-2.316406-6.945312-2.316406zm0 0");
    			attr_dev(path17, "fill", "#c9e5fc");
    			add_location(path17, file$3, 0, 28435, 28435);
    			attr_dev(path18, "d", "m209.472656 232.714844c-12.851562-.003906-23.265625-10.425782-23.261718-23.277344.003906-10.007812 6.40625-18.890625 15.898437-22.0625 2.089844-.726562 53.90625-19.269531 53.90625-71.019531 0-35.335938-16.042969-52.90625-16.726563-53.632813-8.695312-9.300781-8.394531-23.839844.683594-32.769531 9.046875-8.847656 23.523438-8.789063 32.496094.136719 3.089844 3.066406 30.089844 31.65625 30.089844 86.265625 0 85.609375-82.222656 113.996093-85.722656 115.152343-2.375.796876-4.859376 1.203126-7.363282 1.207032zm0 0");
    			attr_dev(path18, "fill", "#64aef7");
    			add_location(path18, file$3, 0, 32700, 32700);
    			attr_dev(path19, "d", "m209.472656 232.714844c-12.851562-.003906-23.265625-10.425782-23.261718-23.277344.003906-10.007812 6.40625-18.890625 15.898437-22.0625 2.089844-.726562 53.90625-19.269531 53.90625-71.019531 0-35.335938-16.042969-52.90625-16.726563-53.632813-8.695312-9.300781-8.394531-23.839844.683594-32.769531 9.046875-8.847656 23.523438-8.789063 32.496094.136719 3.089844 3.066406 30.089844 31.65625 30.089844 86.265625 0 85.609375-82.222656 113.996093-85.722656 115.152343-2.375.796876-4.859376 1.203126-7.363282 1.207032zm0 0");
    			attr_dev(path19, "fill", "#64aef7");
    			add_location(path19, file$3, 0, 33240, 33240);
    			attr_dev(path20, "d", "m277.195312 116.355469c-11.226562-.011719-20.84375-8.042969-22.863281-19.089844-4.15625-22.703125-14.589843-34.066406-15.042969-34.542969-8.695312-9.300781-8.394531-23.839844.679688-32.769531 9.050781-8.847656 23.527344-8.789063 32.5.136719 2.113281 2.113281 20.839844 21.726562 27.632812 58.8125 2.316407 12.632812-6.042968 24.746094-18.671874 27.0625-.011719.003906-.019532.003906-.03125.007812-1.382813.261719-2.792969.390625-4.203126.382813zm0 0");
    			attr_dev(path20, "fill", "#006ce2");
    			add_location(path20, file$3, 0, 33780, 33780);
    			attr_dev(path21, "d", "m418.914062 162.898438c0 12.855468-10.417968 23.273437-23.269531 23.273437-12.855469 0-23.273437-10.417969-23.273437-23.273437 0-12.851563 10.417968-23.269532 23.273437-23.269532 12.851563 0 23.269531 10.417969 23.269531 23.269532zm0 0");
    			attr_dev(path21, "fill", "#0a86e3");
    			add_location(path21, file$3, 0, 34256, 34256);
    			attr_dev(path22, "d", "m349.101562 325.800781c0 12.851563-10.417968 23.269531-23.273437 23.269531-12.851563 0-23.269531-10.417968-23.269531-23.269531 0-12.855469 10.417968-23.273437 23.269531-23.273437 12.855469 0 23.273437 10.417968 23.273437 23.273437zm0 0");
    			attr_dev(path22, "fill", "#64aef7");
    			add_location(path22, file$3, 0, 34518, 34518);
    			attr_dev(path23, "d", "m232.742188 407.25c0 6.425781-5.207032 11.636719-11.632813 11.636719s-11.636719-5.210938-11.636719-11.636719 5.210938-11.636719 11.636719-11.636719 11.632813 5.210938 11.632813 11.636719zm0 0");
    			attr_dev(path23, "fill", "#c9e5fc");
    			add_location(path23, file$3, 0, 34780, 34780);
    			attr_dev(path24, "d", "m279.285156 360.707031c0 6.425781-5.207031 11.636719-11.632812 11.636719-6.429688 0-11.636719-5.210938-11.636719-11.636719s5.207031-11.636719 11.636719-11.636719c6.425781 0 11.632812 5.210938 11.632812 11.636719zm0 0");
    			attr_dev(path24, "fill", "#c9e5fc");
    			add_location(path24, file$3, 0, 34998, 34998);
    			attr_dev(path25, "d", "m372.371094 186.171875c0 12.851563-10.417969 23.269531-23.269532 23.269531-12.851562 0-23.273437-10.417968-23.273437-23.269531s10.421875-23.273437 23.273437-23.273437c12.851563 0 23.269532 10.421874 23.269532 23.273437zm0 0");
    			attr_dev(path25, "fill", "#e1ebfc");
    			add_location(path25, file$3, 0, 35241, 35241);
    			attr_dev(path26, "d", "m162.929688 104.722656c0 6.425782-5.210938 11.632813-11.636719 11.632813s-11.636719-5.207031-11.636719-11.632813c0-6.425781 5.210938-11.636718 11.636719-11.636718s11.636719 5.210937 11.636719 11.636718zm0 0");
    			attr_dev(path26, "fill", "#64aef7");
    			add_location(path26, file$3, 0, 35491, 35491);
    			attr_dev(path27, "d", "m465.457031 267.621094c0 6.425781-5.210937 11.636718-11.636719 11.636718-6.425781 0-11.632812-5.210937-11.632812-11.636718 0-6.425782 5.207031-11.636719 11.632812-11.636719 6.425782 0 11.636719 5.210937 11.636719 11.636719zm0 0");
    			attr_dev(path27, "fill", "#006ce2");
    			add_location(path27, file$3, 0, 35724, 35724);
    			attr_dev(path28, "d", "m418.914062 360.707031c0 6.425781-5.207031 11.636719-11.636718 11.636719-6.425782 0-11.632813-5.210938-11.632813-11.636719s5.207031-11.636719 11.632813-11.636719c6.429687 0 11.636718 5.210938 11.636718 11.636719zm0 0");
    			attr_dev(path28, "fill", "#006ce2");
    			add_location(path28, file$3, 0, 35978, 35978);
    			attr_dev(path29, "d", "m465.457031 314.164062c0 6.425782-5.210937 11.636719-11.636719 11.636719-6.425781 0-11.632812-5.210937-11.632812-11.636719 0-6.425781 5.207031-11.636718 11.632812-11.636718 6.425782 0 11.636719 5.210937 11.636719 11.636718zm0 0");
    			attr_dev(path29, "fill", "#006ce2");
    			add_location(path29, file$3, 0, 36221, 36221);
    			attr_dev(path30, "d", "m349.101562 383.976562c0 6.425782-5.210937 11.636719-11.636718 11.636719-6.425782 0-11.636719-5.210937-11.636719-11.636719 0-6.425781 5.210937-11.632812 11.636719-11.632812 6.425781 0 11.636718 5.207031 11.636718 11.632812zm0 0");
    			attr_dev(path30, "fill", "#64aef7");
    			add_location(path30, file$3, 0, 36475, 36475);
    			attr_dev(path31, "d", "m139.65625 407.25c0 6.425781-5.207031 11.636719-11.632812 11.636719-6.425782 0-11.636719-5.210938-11.636719-11.636719s5.210937-11.636719 11.636719-11.636719c6.425781 0 11.632812 5.210938 11.632812 11.636719zm0 0");
    			attr_dev(path31, "fill", "#64aef7");
    			add_location(path31, file$3, 0, 36729, 36729);
    			attr_dev(path32, "d", "m418.914062 151.265625c0 6.425781-5.207031 11.632813-11.636718 11.632813-6.425782 0-11.632813-5.207032-11.632813-11.632813s5.207031-11.636719 11.632813-11.636719c6.429687 0 11.636718 5.210938 11.636718 11.636719zm0 0");
    			attr_dev(path32, "fill", "#006ce2");
    			add_location(path32, file$3, 0, 36967, 36967);
    			attr_dev(path33, "d", "m116.386719 372.429688c0-29.289063-28.9375-64.945313-49.433594-82.636719-12.386719-10.617188-29.941406-12.75-44.507813-5.402344-15.347656 7.824219-24.1875 24.386719-22.15625 41.496094 5.207032 46.933593 46.285157 69.8125 46.285157 69.8125-13.40625 13.40625-43.894531 48.949219-46.304688 71.003906-2.265625 22.632813 14.246094 42.816406 36.878907 45.082031 12.441406 1.242188 24.773437-3.230468 33.523437-12.160156 29.496094-29.957031 45.714844-80.652344 45.714844-80.652344-23.269531 0-23.269531-23.273437-23.269531-23.273437s0-23.269531 23.269531-23.269531zm0 0");
    			attr_dev(path33, "fill", "#0a86e3");
    			add_location(path33, file$3, 0, 37210, 37210);
    			attr_dev(path34, "d", "m40.710938 280.066406h-.101563l-.050781.003906h-.328125c-.265625.003907-.535157.011719-.800781.019532h-.003907c-.171875.003906-.34375.011718-.515625.019531-6.191406.359375-10.964844 5.59375-10.746094 11.792969.21875 6.371094 5.4375 11.425781 11.8125 11.449218.0625 0 .125-.003906.1875-.003906l.546876-.007812c4.046874-.011719 7.964843 1.433594 11.035156 4.074218 13.046875 11.257813 29.65625 30.722657 37.359375 48.839844 2.515625 5.914063 9.347656 8.667969 15.261719 6.152344 5.898437-2.507812 8.660156-9.3125 6.171874-15.222656-1.089843-2.5625-2.304687-5.121094-3.628906-7.667969v-.003906c-.09375-.175781-.1875-.351563-.28125-.53125l-.003906-.011719c-.046875-.085938-.089844-.171875-.136719-.257812l-.003906-.007813c-.046875-.085937-.089844-.171875-.136719-.253906l-.007812-.019531-.042969-.078126-.007813-.019531-.082031-.148437-.011719-.023438-.039062-.070312-.019531-.039063-.070313-.132812-.011718-.023438-.097657-.175781-.003906-.007812-.078125-.148438-.027344-.042969-.035156-.066406-.023438-.042969c-.019531-.035156-.039062-.070312-.058593-.105468l-.023438-.046876c-.015625-.023437-.023437-.042968-.035156-.066406l-.027344-.050781c-.019531-.03125-.035156-.0625-.054687-.09375l-.0625-.117187c-.011719-.019532-.019532-.035157-.027344-.050782-.015625-.027344-.03125-.058594-.050781-.085937l-.035157-.066407-.0625-.117187-.03125-.050781c-.019531-.035156-.035156-.066406-.054687-.097656l-.027344-.050782-.035156-.0625-.027344-.050781c-.015625-.027344-.027343-.054687-.042969-.078125l-.039062-.070312-.035156-.0625c-.011719-.019532-.019532-.035157-.03125-.050782l-.042969-.082031-.023437-.042969c-.019532-.03125-.035157-.058594-.050782-.089844l-.027344-.046874-.039062-.070313-.023438-.042969c-.019531-.035156-.042968-.070312-.0625-.105468l-.019531-.039063c-.015625-.027344-.03125-.054687-.046875-.078125l-.019531-.035156-.0625-.113282-.015625-.023437c-.015625-.03125-.035156-.0625-.050781-.09375l-.019531-.03125c-.019532-.039063-.039063-.074219-.0625-.109375l-.015626-.023438-.050781-.09375-.019531-.035156c-.019531-.035156-.039062-.066406-.058594-.097656l-.011718-.027344-.058594-.097656-.019532-.039062c-.019531-.03125-.039062-.066407-.058593-.097657l-.007813-.011719c-.019531-.039062-.042968-.078124-.066406-.117187l-.015625-.027344c-.019531-.03125-.039063-.066406-.058594-.097656l-.007812-.019531c-.023438-.039063-.046875-.078125-.070313-.117188l-.011718-.019531c-.019532-.035156-.039063-.070313-.058594-.105469l-.011719-.015625-.140625-.242187-.011719-.015625c-.046875-.082031-.09375-.164063-.140625-.242188l-.007812-.011719c-.050782-.085937-.097656-.167968-.148438-.25v-.003906c-.078125-.128906-.152344-.253906-.230468-.382812-.050782-.082032-.101563-.167969-.148438-.253906l-.003906-.003907c-9.570313-15.59375-21.371094-29.699219-35.027344-41.871093v-.003907c-.058594-.050781-.117188-.101562-.171875-.152343l-.003906-.003907c-.058594-.046875-.113281-.097656-.167969-.144531l-.015625-.011719-.074219-.066406-.003906-.003906c-.027344-.023438-.054688-.046875-.082031-.070313l-.015625-.011718-.070313-.066407-.007812-.007812-.082031-.066407-.015626-.015624-.066406-.054688-.015625-.015625c-.027343-.023437-.050781-.042969-.078125-.066406l-.015625-.015625-.0625-.054688-.023437-.019531c-.023438-.019531-.050782-.042969-.074219-.066406-7.296875-6.289063-16.609375-9.738281-26.242187-9.726563zm0 0");
    			attr_dev(path34, "fill", "#46a4f2");
    			add_location(path34, file$3, 0, 37799, 37799);
    			attr_dev(path35, "d", "m395.644531 93.085938c0 12.851562-10.421875 23.269531-23.273437 23.269531-12.851563 0-23.269532-10.417969-23.269532-23.269531 0-12.851563 10.417969-23.273438 23.269532-23.273438 12.851562 0 23.273437 10.421875 23.273437 23.273438zm0 0");
    			attr_dev(path35, "fill", "#006ce2");
    			add_location(path35, file$3, 0, 41127, 41127);
    			attr_dev(path36, "d", "m151.292969 186.171875c-2.089844 0-51.65625-.296875-78.039063-26.679687-4.542968-4.542969-4.542968-11.910157 0-16.453126 4.542969-4.542968 11.910156-4.542968 16.453125 0 19.519531 19.519532 61.175781 19.859376 61.609375 19.859376 6.425782.015624 11.621094 5.238281 11.605469 11.664062-.011719 6.414062-5.214844 11.605469-11.628906 11.609375zm0 0");
    			attr_dev(path36, "fill", "#e1ebfc");
    			add_location(path36, file$3, 0, 41388, 41388);
    			attr_dev(path37, "d", "m82.929688 393.804688c-6.433594.003906-11.644532 5.222656-11.640626 11.652343 0 1.035157.136719 2.0625.410157 3.058594 2.359375 9.125 7.488281 17.296875 14.675781 23.394531-6.175781 14.039063-15.828125 32.777344-28.351562 47.132813-.117188.132812-.230469.269531-.335938.402343-.121094.125-.242188.253907-.355469.382813-1.058593 1.1875-2.136719 2.34375-3.242187 3.464844-4.230469 4.3125-10.335938 6.21875-16.265625 5.085937-6.308594-1.214844-12.410157 2.917969-13.621094 9.230469-1.210937 6.289063 2.894531 12.375 9.179687 13.613281.625.121094 1.253907.226563 1.886719.316406l.003907.003907.0625.007812h.011718l.066406.011719c.050782.007812.097657.011719.144532.019531h.011718l.054688.007813.070312.011718h.019532l.054687.007813.015625.003906.070313.007813h.007812l.054688.007812.03125.003906.035156.007813.070313.007813.03125.003906.070312.007812.101562.011719.023438.003906.039062.003907.027344.003906.042969.003906.019531.003906.046875.003906h.011719c.054688.007813.113281.015626.167969.019532h.007812l.050781.007812h.015626l.046874.007813h.015626l.050781.003906.003906.003906c.058594.003907.117187.011719.175781.015625h.003906l.054688.007813h.011719l.050781.003906.007812.003906c.078126.007813.15625.015625.234376.019531l.007812.003907.050781.003906h.011719l.054688.003906.007812.003907c.078125.003906.15625.011718.234375.019531h.003906l.054688.003906h.011719l.050781.003906h.007812c.078125.007813.15625.015625.234375.019531h.007813l.050781.003907.015625.003906h.050781l.007813.003906c.078125.003907.152343.007813.230469.015625h.011718l.046875.003906h.019531l.046876.003907h.011718c.054688.003906.109375.007812.164063.011719h.0625l.015625.003906h.066406l.042969.003906h.019531c.054688.003906.105469.007812.15625.007812h.015625l.042969.003907h.023437l.039063.003906h.03125l.035156.003906h.027344c.046875.003907.09375.003907.140625.003907l.027343.003906h.066407l.039062.003906h.066407l.035156.003906h.09375l.035156.003906h.101562l.03125.003907h.105469l.03125.003906h.128907l.03125.003906h.136718l.050782.003907h.175781l.042969.003906h.296874l.027344.003906h.203125c11.082031 0 21.699219-4.449219 29.46875-12.347656l.152344-.152344.027344-.03125.035156-.03125.007813-.011719c.042968-.042969.078124-.082031.121093-.125l.007813-.007812c.300781-.304688.59375-.613281.890625-.921875l.007812-.007813c.023438-.023437.050781-.054687.074219-.078125l.039062-.039062.03125-.035156.023438-.023438c.015625-.019531.03125-.035156.046875-.050781l.023437-.023438.035157-.039062.019531-.019531.050781-.054688.070313-.070312v-.003907c.804687-.851562 1.597656-1.714843 2.378906-2.597656.144531-.160156.28125-.320313.414062-.488281.148438-.152344.292969-.308594.433594-.46875 7.429688-8.710938 13.992188-18.121094 19.59375-28.101563.128906-.230469.257813-.457031.390625-.683593l.046875-.082032.015625-.03125.015625-.027344.007813-.015624.019531-.03125.007812-.015626.050782-.085937.003906-.011719c.054688-.09375.105469-.1875.160156-.28125l.003906-.007812.050782-.085938.003906-.015625.050781-.082031.007813-.019531.019531-.035157.003906-.003906.035157-.058594.015624-.035156.007813-.007812.019531-.039063.011719-.015625c.078125-.140625.15625-.28125.234375-.421875l.003906-.007812.03125-.054688.019532-.03125.007812-.019531.035156-.058594.007813-.011718.050781-.097657.003906-.007812.054688-.097657.003906-.003906c.046875-.085937.097656-.175781.144531-.261718l.019531-.035157.019532-.039062.011718-.015625.015626-.035156.011718-.015626.011719-.027343.019531-.035157.007813-.011718.019531-.035156.007812-.015626.027344-.042968v-.007813c.03125-.050781.058594-.101562.085938-.152343v-.003907l.03125-.050781v-.003906c.027344-.050782.054687-.101563.082031-.152344l.003906-.003906.027344-.046875v-.003907c.007813-.015624.019531-.03125.027344-.046874l.007812-.011719.042969-.085938.015625-.019531c.070313-.132812.144531-.269531.21875-.402344l.011719-.023437.019531-.035157.027344-.050781c.039062-.070312.074219-.136719.113281-.207031l.003906-.003906.019532-.039063.011718-.019531.011719-.023438.015625-.027343c.0625-.117188.128906-.238281.191406-.355469l.003906-.003906.023438-.042969.011719-.023437.015625-.027344.027344-.054688.007812-.011718.050781-.09375.003907-.003907c.015624-.035156.03125-.0625.046874-.09375l.007813-.015625.042969-.074218.027344-.050782c.070312-.128906.136718-.253906.203124-.382812l.007813-.011719c7.148437-13.332031 13.1875-27.226563 18.0625-41.546875h-.089844c-14.53125-.039062-19.953125-9.175781-21.976562-15.984375v-.003906l-.011719-.039063-.023438-.082031-.003906-.003906-.007812-.035157-.003906-.007812-.007813-.035156h-.003906l-.007813-.039063-.003906-.007812-.007812-.03125-.015626-.046875-.007812-.035156-.003906-.011719-.007813-.027344-.003906-.015625-.007813-.019531-.003906-.015625-.003906-.019532-.011719-.039062-.003906-.011719-.003906-.023437-.015625-.046875-.003906-.015625c-1.386719-5.050782-5.976563-8.558594-11.21875-8.566406zm0 0");
    			attr_dev(path37, "fill", "#004ed6");
    			add_location(path37, file$3, 0, 41760, 41760);
    			attr_dev(path38, "d", "m81.480469 349.070312h23.269531c6.425781 0 11.636719 5.210938 11.636719 11.636719s-5.210938 11.636719-11.636719 11.636719h-23.269531c-6.425781 0-11.636719-5.210938-11.636719-11.636719s5.210938-11.636719 11.636719-11.636719zm0 0");
    			attr_dev(path38, "fill", "#46a4f2");
    			add_location(path38, file$3, 0, 46634, 46634);
    			attr_dev(path39, "d", "m58.207031 395.613281h23.273438c6.425781 0 11.636719 5.210938 11.636719 11.636719s-5.210938 11.632812-11.636719 11.632812h-23.273438c-6.425781 0-11.632812-5.207031-11.632812-11.632812s5.207031-11.636719 11.632812-11.636719zm0 0");
    			attr_dev(path39, "fill", "#004ed6");
    			add_location(path39, file$3, 0, 46888, 46888);
    			attr_dev(path40, "d", "m34.9375 442.15625h46.542969c6.425781 0 11.632812 5.210938 11.632812 11.636719s-5.207031 11.632812-11.632812 11.632812h-46.542969c-6.425781 0-11.636719-5.207031-11.636719-11.632812s5.210938-11.636719 11.636719-11.636719zm0 0");
    			attr_dev(path40, "fill", "#004ed6");
    			add_location(path40, file$3, 0, 47142, 47142);
    			attr_dev(path41, "d", "m11.664062 302.527344h46.542969c6.425781 0 11.636719 5.210937 11.636719 11.636718 0 6.425782-5.210938 11.636719-11.636719 11.636719h-46.542969c-6.425781 0-11.632812-5.210937-11.632812-11.636719 0-6.425781 5.207031-11.636718 11.632812-11.636718zm0 0");
    			attr_dev(path41, "fill", "#46a4f2");
    			add_location(path41, file$3, 0, 47393, 47393);
    			attr_dev(path42, "d", "m46.574219 337.433594c0 6.429687-5.210938 11.636718-11.636719 11.636718s-11.636719-5.207031-11.636719-11.636718c0-6.425782 5.210938-11.632813 11.636719-11.632813s11.636719 5.207031 11.636719 11.632813zm0 0");
    			attr_dev(path42, "fill", "#46a4f2");
    			add_location(path42, file$3, 0, 47668, 47668);
    			attr_dev(path43, "d", "m46.574219 430.519531c0 6.425781-5.210938 11.636719-11.636719 11.636719s-11.636719-5.210938-11.636719-11.636719 5.210938-11.632812 11.636719-11.632812 11.636719 5.207031 11.636719 11.632812zm0 0");
    			attr_dev(path43, "fill", "#004ed6");
    			add_location(path43, file$3, 0, 47900, 47900);
    			attr_dev(svg, "viewBox", "0 0 512.00047 512");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, g);
    			append_dev(g, path1);
    			append_dev(g, path2);
    			append_dev(g, path3);
    			append_dev(g, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    			append_dev(svg, path20);
    			append_dev(svg, path21);
    			append_dev(svg, path22);
    			append_dev(svg, path23);
    			append_dev(svg, path24);
    			append_dev(svg, path25);
    			append_dev(svg, path26);
    			append_dev(svg, path27);
    			append_dev(svg, path28);
    			append_dev(svg, path29);
    			append_dev(svg, path30);
    			append_dev(svg, path31);
    			append_dev(svg, path32);
    			append_dev(svg, path33);
    			append_dev(svg, path34);
    			append_dev(svg, path35);
    			append_dev(svg, path36);
    			append_dev(svg, path37);
    			append_dev(svg, path38);
    			append_dev(svg, path39);
    			append_dev(svg, path40);
    			append_dev(svg, path41);
    			append_dev(svg, path42);
    			append_dev(svg, path43);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fish> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Fish", $$slots, []);
    	return [];
    }

    class Fish extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fish",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\icons\Bird.svelte generated by Svelte v3.20.1 */

    const file$4 = "src\\icons\\Bird.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let g0;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			set_style(path0, "fill", "#324D5B");
    			attr_dev(path0, "d", "M227.643,404.086c-3.545-3.545-9.058-3.545-12.209,0c-3.545,3.545-3.545,9.058,0,12.209l61.834,61.44\r\n\tc3.545,3.545,9.058,3.545,12.209,0c3.545-3.545,3.545-9.058,0-12.209L227.643,404.086z M347.766,465.526l-61.834-61.44\r\n\tc-3.545-3.545-9.058-3.545-12.209,0c-3.545,3.545-3.545,9.058,0,12.209l61.834,61.44c3.545,3.545,9.058,3.545,12.209,0\r\n\tC351.311,474.585,351.311,469.071,347.766,465.526z");
    			add_location(path0, file$4, 2, 0, 233);
    			set_style(path1, "fill", "#E2574C");
    			attr_dev(path1, "d", "M382.818,166.597c5.514-11.028,7.089-23.631,7.089-36.628C389.908,57.895,331.225,0,259.151,0h-2.363\r\n\tc0.394,3.151,0,7.089,0,10.24c0,32.689-10.634,63.015-30.326,85.858c-83.889,10.24-151.631,79.163-151.631,165.415\r\n\tc0,48.049,18.905,89.797,51.2,120.123v122.486l80.345-79.557c11.422,2.363,25.6,5.12,37.809,5.12\r\n\tc93.342,0,169.354-74.043,169.354-166.991C413.538,228.037,400.935,193.378,382.818,166.597z");
    			add_location(path1, file$4, 6, 0, 652);
    			set_style(path2, "fill", "#BF392B");
    			attr_dev(path2, "d", "M383.606,164.628c3.545-11.815,9.846-21.662,9.846-34.265c0-13.785-5.908-26.782-9.846-39.385h-1.182\r\n\tc-15.36,0-29.932,1.182-42.142,8.665c3.938,5.12,6.302,11.815,6.302,18.905c0,17.329-14.178,31.508-31.508,31.508\r\n\tc-4.332,0-8.271-0.788-11.815-2.363v22.055c0,43.323,35.446,78.769,78.769,78.769c11.028,0,21.662-0.788,31.114-4.726\r\n\tC413.538,217.403,401.329,186.289,383.606,164.628z M70.892,260.332c0,35.84,11.815,74.831,31.508,102.006\r\n\tc84.283-15.36,149.662-85.858,149.662-171.323c0-35.84-6.302-69.317-25.994-96.492C133.514,104.763,70.892,174.868,70.892,260.332z\r\n\t M155.175,404.48l-29.145,99.643l83.495-78.769C189.834,421.022,171.323,414.72,155.175,404.48z");
    			add_location(path2, file$4, 10, 0, 1086);
    			set_style(path3, "fill", "#2B414D");
    			attr_dev(path3, "d", "M295.385,120.123c0,11.815,9.846,21.662,21.662,21.662c11.815,0,21.662-9.846,21.662-21.662\r\n\ts-9.846-21.662-21.662-21.662C305.231,98.462,295.385,108.308,295.385,120.123z");
    			add_location(path3, file$4, 16, 0, 1776);
    			set_style(path4, "fill", "#FFFFFF");
    			attr_dev(path4, "d", "M307.2,116.185c0,3.151,2.757,5.908,5.908,5.908s5.908-2.757,5.908-5.908s-2.757-5.908-5.908-5.908\r\n\tS307.2,113.034,307.2,116.185z");
    			add_location(path4, file$4, 18, 0, 1979);
    			set_style(path5, "fill", "#EFC75E");
    			attr_dev(path5, "d", "M433.231,157.538c-3.545-16.935-11.815-31.508-42.142-31.508c-29.145,0-40.172,16.542-40.172,37.022\r\n\tc0,2.757-0.788,7.483,0,10.24c7.483-0.394,14.572,0,21.662,0C394.24,173.292,417.083,168.566,433.231,157.538z");
    			add_location(path5, file$4, 20, 0, 2142);
    			set_style(path6, "fill", "#A78B42");
    			attr_dev(path6, "d", "M350.917,173.292c7.089-0.394,14.178,0,21.268,0c21.662,0,44.111-4.726,60.258-15.36\r\n\tc-6.302-5.12-16.542-8.271-25.6-8.271C385.575,149.662,367.065,160.295,350.917,173.292z");
    			add_location(path6, file$4, 22, 0, 2383);
    			add_location(g0, file$4, 24, 0, 2588);
    			add_location(g1, file$4, 26, 0, 2599);
    			add_location(g2, file$4, 28, 0, 2610);
    			add_location(g3, file$4, 30, 0, 2621);
    			add_location(g4, file$4, 32, 0, 2632);
    			add_location(g5, file$4, 34, 0, 2643);
    			add_location(g6, file$4, 36, 0, 2654);
    			add_location(g7, file$4, 38, 0, 2665);
    			add_location(g8, file$4, 40, 0, 2676);
    			add_location(g9, file$4, 42, 0, 2687);
    			add_location(g10, file$4, 44, 0, 2698);
    			add_location(g11, file$4, 46, 0, 2709);
    			add_location(g12, file$4, 48, 0, 2720);
    			add_location(g13, file$4, 50, 0, 2731);
    			add_location(g14, file$4, 52, 0, 2742);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 504.123 504.123");
    			set_style(svg, "enable-background", "new 0 0 504.123 504.123");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bird> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Bird", $$slots, []);
    	return [];
    }

    class Bird extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bird",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\icons\Lion.svelte generated by Svelte v3.20.1 */

    const file$5 = "src\\icons\\Lion.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let circle0;
    	let path16;
    	let path17;
    	let circle1;
    	let path18;
    	let path19;
    	let g0;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			circle0 = svg_element("circle");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			circle1 = svg_element("circle");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			set_style(path0, "fill", "#D26437");
    			attr_dev(path0, "d", "M256.005,12.733c2.886-0.001,5.772-0.767,8.372-2.298C272.375,5.726,286.098,0,305.547,0\r\n\tc37.319,0,66.067,16.516,66.067,16.516l-16.516,16.516c17.752,4.734,27.871,7.57,47.369,17.786\r\n\tc68.569,35.927,101.276,114.343,101.276,114.343h-33.032C512,231.226,512,322.065,512,322.065l-24.774-8.258\r\n\tc0,0,0,74.323-33.032,123.871l-24.774-16.516c0,0-24.774,41.29-66.065,66.065l-16.516-16.516c0,0-41.29,33.032-90.839,41.29\r\n\tc-49.548-8.258-90.839-41.29-90.839-41.29l-16.516,16.516c-41.29-24.774-66.065-66.065-66.065-66.065l-24.774,16.516\r\n\tC24.775,388.13,24.775,313.807,24.775,313.807l-24.774,8.258c0,0,0-90.839,41.29-156.903H8.259c0,0,32.707-78.416,101.276-114.343\r\n\tc19.498-10.216,29.617-13.052,47.369-17.786l-16.516-16.516c0,0,28.747-16.516,66.067-16.516c19.449,0,33.172,5.726,41.17,10.436\r\n\tc2.6,1.531,5.486,2.297,8.372,2.298");
    			add_location(path0, file$5, 2, 0, 232);
    			set_style(path1, "fill", "#B44632");
    			attr_dev(path1, "d", "M187.22,91.077c0,0,23.877-48.754,64.061-79.097c-1.255-0.379-2.491-0.858-3.657-1.544\r\n\tC239.627,5.726,225.904,0,206.455,0c-37.319,0-66.067,16.516-66.067,16.516l16.516,16.516c-17.752,4.734-27.871,7.57-47.369,17.786\r\n\tC40.966,86.745,8.259,165.161,8.259,165.161h33.032c-41.29,66.065-41.29,156.904-41.29,156.904l24.774-8.258\r\n\tc0,0,0,74.323,33.032,123.871l24.774-16.516c0,0,24.774,41.29,66.065,66.065l16.516-16.516c0,0,41.29,33.032,90.839,41.29\r\n\tC256.001,512,196.13,487.226,187.22,91.077z");
    			add_location(path1, file$5, 10, 0, 1083);
    			set_style(path2, "fill", "#EBAF4B");
    			attr_dev(path2, "d", "M410.232,50.111c19.546-3.79,37.454,12.093,35.567,31.913c-2.343,24.606-20.422,67.997-45.196,93.546\r\n\tl-79.57-80.086C351.522,71.282,389.392,54.152,410.232,50.111z");
    			add_location(path2, file$5, 15, 0, 1603);
    			set_style(path3, "fill", "#E18C46");
    			attr_dev(path3, "d", "M342.607,117.198c25.356-19.382,62.841-44.879,73.223-45.922\r\n\tc11.932-1.199,19.371,15.26,14.706,33.023c-4.05,15.422-19.498,43.71-34.876,66.296L342.607,117.198z");
    			add_location(path3, file$5, 17, 0, 1799);
    			set_style(path4, "fill", "#EBAF4B");
    			attr_dev(path4, "d", "M101.77,50.111c-19.546-3.79-37.454,12.093-35.567,31.913c2.343,24.606,20.422,67.997,45.196,93.546\r\n\tl79.57-80.086C160.48,71.282,122.61,54.152,101.77,50.111z");
    			add_location(path4, file$5, 19, 0, 1993);
    			set_style(path5, "fill", "#E18C46");
    			attr_dev(path5, "d", "M169.395,117.198c-25.356-19.382-62.841-44.879-73.223-45.922\r\n\tc-11.932-1.199-19.371,15.26-14.706,33.023c4.05,15.422,19.498,43.71,34.876,66.296L169.395,117.198z");
    			add_location(path5, file$5, 21, 0, 2184);
    			set_style(path6, "fill", "#FFC850");
    			attr_dev(path6, "d", "M355.098,99.097c-32.593-25.35-99.097,16.516-99.097,16.516s-66.504-41.866-99.097-16.516\r\n\tc-74.323,57.806-90.839,222.968-82.581,256c6.009,24.034,57.806,66.065,115.613,82.581h132.129\r\n\tc57.806-16.516,109.604-58.546,115.613-82.581C445.936,322.065,429.42,156.903,355.098,99.097z");
    			add_location(path6, file$5, 23, 0, 2379);
    			set_style(path7, "fill", "#EBAF4B");
    			attr_dev(path7, "d", "M125.236,403.816c-6.343-39.607,8.658-215.343,61.984-312.739c-11.211-0.54-21.899,1.473-30.316,8.02\r\n\tc-74.323,57.806-90.839,222.968-82.581,256c3.617,14.469,23.889,35.439,52.017,53.458\r\n\tC125.916,406.944,125.478,405.326,125.236,403.816z");
    			add_location(path7, file$5, 26, 0, 2689);
    			set_style(path8, "fill", "#FAEBC8");
    			attr_dev(path8, "d", "M437.678,313.701c-6.009,24.034-57.806,66.065-115.613,82.581H189.936\r\n\tc-57.806-16.516-109.604-58.546-115.613-82.581c-0.376-1.501-0.68-3.363-0.95-5.388c-1.635,21.488-1.146,38.401,0.95,46.784\r\n\tc6.009,24.034,57.806,66.065,115.613,82.581h132.129c57.806-16.516,109.604-58.546,115.613-82.581\r\n\tc2.096-8.383,2.585-25.296,0.95-46.784C438.359,310.337,438.054,312.199,437.678,313.701z");
    			add_location(path8, file$5, 29, 0, 2959);
    			set_style(path9, "fill", "#F5DCB4");
    			attr_dev(path9, "d", "M187.462,424.27c4.287,26.336,27.139,46.44,54.686,46.44h27.705\r\n\tc27.433,0,50.211-19.938,54.633-46.113l-68.48-11.693L187.462,424.27z");
    			add_location(path9, file$5, 33, 0, 3370);
    			set_style(path10, "fill", "#FAEBC8");
    			attr_dev(path10, "d", "M301.42,346.839c-19.155,0-35.92,7.742-45.419,19.356c-9.499-11.614-26.265-19.356-45.419-19.356\r\n\tc-29.645,0-53.677,18.486-53.677,41.29s24.032,41.29,53.677,41.29c19.155,0,35.92-7.742,45.419-19.356\r\n\tc9.499,11.614,26.265,19.356,45.419,19.356c29.645,0,53.677-18.486,53.677-41.29S331.066,346.839,301.42,346.839z");
    			add_location(path10, file$5, 35, 0, 3537);
    			set_style(path11, "fill", "#D4AF91");
    			attr_dev(path11, "d", "M298.017,437.411c-14.427,0-28.016-4.782-39.298-13.827c-1.597-1.282-3.831-1.282-5.444,0\r\n\tc-11.274,9.044-24.863,13.827-39.29,13.827c-34.855,0-63.21-28.56-63.21-63.665c0-4.56,3.694-8.258,8.258-8.258\r\n\ts8.258,3.698,8.258,8.258c0,26,20.944,47.149,46.694,47.149c10.629,0,20.645-3.524,28.96-10.198c7.694-6.161,18.427-6.161,26.105,0\r\n\tc8.323,6.673,18.339,10.198,28.968,10.198c25.75,0,46.694-21.149,46.694-47.149c0-4.56,3.694-8.258,8.258-8.258\r\n\ts8.258,3.698,8.258,8.258C361.227,408.851,332.872,437.411,298.017,437.411z");
    			add_location(path11, file$5, 38, 0, 3879);
    			set_style(path12, "fill", "#5D5360");
    			attr_dev(path12, "d", "M211.445,361.269l17.541,14.625c15.648,13.046,38.383,13.046,54.03,0l17.541-14.624\r\n\tc7.771-6.479,3.24-19.128-6.877-19.128c-22.403,0-52.954,0-75.358-0.001C208.205,342.141,203.674,354.79,211.445,361.269z");
    			add_location(path12, file$5, 43, 0, 4426);
    			set_style(path13, "fill", "#FFDC64");
    			attr_dev(path13, "d", "M256.001,214.71c-4.565,0-8.258-3.698-8.258-8.258v-67.419c0-4.56,3.694-8.258,8.258-8.258\r\n\ts8.258,3.698,8.258,8.258v67.419C264.259,211.012,260.566,214.71,256.001,214.71z");
    			add_location(path13, file$5, 45, 0, 4662);
    			set_style(path14, "fill", "#4B3F4E");
    			attr_dev(path14, "d", "M173.42,297.29L173.42,297.29c-13.682,0-24.774-11.092-24.774-24.774v-8.258\r\n\tc0-13.682,11.092-24.774,24.774-24.774l0,0c13.682,0,24.774,11.092,24.774,24.774v8.258\r\n\tC198.195,286.199,187.103,297.29,173.42,297.29z");
    			add_location(path14, file$5, 47, 0, 4866);
    			set_style(path15, "fill", "#5D5360");
    			attr_dev(path15, "d", "M173.42,239.484v28.903c0,6.841,5.546,12.387,12.387,12.387c6.841,0,12.387-5.546,12.387-12.387\r\n\tv-4.129C198.195,250.576,187.103,239.484,173.42,239.484z");
    			add_location(path15, file$5, 50, 0, 5111);
    			set_style(circle0, "fill", "#FFFFFF");
    			attr_dev(circle0, "cx", "173.421");
    			attr_dev(circle0, "cy", "256");
    			attr_dev(circle0, "r", "8.258");
    			add_location(circle0, file$5, 52, 0, 5297);
    			set_style(path16, "fill", "#4B3F4E");
    			attr_dev(path16, "d", "M338.582,297.29L338.582,297.29c-13.682,0-24.774-11.092-24.774-24.774v-8.258\r\n\tc0-13.682,11.092-24.774,24.774-24.774l0,0c13.682,0,24.774,11.092,24.774,24.774v8.258\r\n\tC363.356,286.199,352.264,297.29,338.582,297.29z");
    			add_location(path16, file$5, 53, 0, 5362);
    			set_style(path17, "fill", "#5D5360");
    			attr_dev(path17, "d", "M338.582,239.484v28.903c0,6.841,5.546,12.387,12.387,12.387s12.387-5.546,12.387-12.387v-4.129\r\n\tC363.356,250.576,352.264,239.484,338.582,239.484z");
    			add_location(path17, file$5, 56, 0, 5610);
    			set_style(circle1, "fill", "#FFFFFF");
    			attr_dev(circle1, "cx", "338.581");
    			attr_dev(circle1, "cy", "256");
    			attr_dev(circle1, "r", "8.258");
    			add_location(circle1, file$5, 58, 0, 5790);
    			set_style(path18, "fill", "#4B3F4E");
    			attr_dev(path18, "d", "M260.953,374.633l-17.542-20.173c-2.924-3.363-4.101-7.929-3.9-12.319c-7.473,0-14.69,0-21.189,0\r\n\tc-10.117,0-14.648,12.649-6.878,19.128l17.541,14.625c11.942,9.957,27.993,12.257,41.891,7.016\r\n\tC267.386,380.768,264.009,378.147,260.953,374.633z");
    			add_location(path18, file$5, 59, 0, 5855);
    			set_style(path19, "fill", "#F5DCB4");
    			attr_dev(path19, "d", "M74.324,313.701c-0.376-1.501-0.68-3.363-0.95-5.388c-1.635,21.488-1.146,38.401,0.95,46.784\r\n\tc3.617,14.469,23.889,35.438,52.017,53.458c-0.424-1.611-0.862-3.229-1.104-4.739c-1.26-7.866-1.661-21.163-1.104-38.088\r\n\tC97.159,348.036,77.845,327.788,74.324,313.701z");
    			add_location(path19, file$5, 62, 0, 6130);
    			add_location(g0, file$5, 65, 0, 6423);
    			add_location(g1, file$5, 67, 0, 6434);
    			add_location(g2, file$5, 69, 0, 6445);
    			add_location(g3, file$5, 71, 0, 6456);
    			add_location(g4, file$5, 73, 0, 6467);
    			add_location(g5, file$5, 75, 0, 6478);
    			add_location(g6, file$5, 77, 0, 6489);
    			add_location(g7, file$5, 79, 0, 6500);
    			add_location(g8, file$5, 81, 0, 6511);
    			add_location(g9, file$5, 83, 0, 6522);
    			add_location(g10, file$5, 85, 0, 6533);
    			add_location(g11, file$5, 87, 0, 6544);
    			add_location(g12, file$5, 89, 0, 6555);
    			add_location(g13, file$5, 91, 0, 6566);
    			add_location(g14, file$5, 93, 0, 6577);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Capa_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512.001 512.001");
    			set_style(svg, "enable-background", "new 0 0 512.001 512.001");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, circle0);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, circle1);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lion> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Lion", $$slots, []);
    	return [];
    }

    class Lion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lion",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\icons\Snake.svelte generated by Svelte v3.20.1 */

    const file$6 = "src\\icons\\Snake.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let g0;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g0 = svg_element("g");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			set_style(path0, "fill", "#FF8087");
    			attr_dev(path0, "d", "M95.332,105.225c-2.594-3.661-7.664-4.538-11.321-1.952l-54.087,38.169h-21.8\r\n\tc-4.49,0-8.124,3.638-8.124,8.124c0,4.487,3.634,8.124,8.124,8.124h13.099l-4.554,13.678c-1.42,4.256,0.881,8.858,5.133,10.278\r\n\tc0.857,0.286,1.722,0.42,2.571,0.42c3.404,0,6.569-2.154,7.704-5.558l7.282-21.845l54.014-38.118\r\n\tC97.038,113.96,97.918,108.89,95.332,105.225z");
    			add_location(path0, file$6, 2, 0, 216);
    			set_style(path1, "fill", "#AFD755");
    			attr_dev(path1, "d", "M413.655,440.97c98.844-42.652,103.165-97.57,96.136-119.831\r\n\tc-8.124-25.726-71.594-95.459-279.437-82.595l-16.587,38.978c50.268-7.497,97.998-6.144,134.967,2.054\r\n\tc61.4,13.615,109.266,39.582,96.064,74.11c-15.942,41.696-104.15,69.012-169.575,69.176c-11.09,0.028-28.77-0.692-44.452-4.523\r\n\tl-52.345,36.739C237.533,479.885,333.575,475.525,413.655,440.97z");
    			add_location(path1, file$6, 6, 0, 594);
    			set_style(path2, "fill", "#96BE4B");
    			attr_dev(path2, "d", "M215.967,271.04l-2.2,6.482c50.268-7.497,97.998-6.144,134.967,2.054\r\n\tc61.4,13.615,109.266,39.582,96.064,74.11c-7.774,20.331-32.78,37.205-63.897,49.217c58.541-19.193,106.345-49.904,95.04-81.765\r\n\tC462.757,283.988,363.556,238.544,215.967,271.04z");
    			add_location(path2, file$6, 10, 0, 980);
    			set_style(path3, "fill", "#AFD755");
    			attr_dev(path3, "d", "M256.244,154.644C269.002,30.472,138.111,1.301,62.279,84.573\r\n\t\tc-10.323,11.335-7.072,26.496,11.836,33.065c1.795,5.475,13.99,34.238,70.596,25.954c0,0,2.031,14.725-25.557,113.907\r\n\t\tc-13.465,48.407-26.742,122.201,23.018,173.992c8.63,8.983,19.935,16.411,33.196,22.33c24.032-9.549,47.254-20.26,68.662-32.949\r\n\t\tc-12.845-1.798-25.906-5.13-34.834-11.334c-42.777-29.726-20.79-74.744,5.926-132.192\r\n\t\tC222.653,261.393,251.849,197.415,256.244,154.644z");
    			add_location(path3, file$6, 14, 1, 1265);
    			set_style(path4, "fill", "#AFD755");
    			attr_dev(path4, "d", "M239.663,400.739C172.425,449.452,98.88,430.873,83.95,386.522\r\n\t\tc-11.509-34.189,8.463-59.12,26.234-73.845l11.171-52.299c-37.574,14.725-69.224,43.548-80.734,69.952\r\n\t\tC3.599,415.26,91.397,524.632,236.955,449.483c118.753-61.31,81.006-196.5,165.395-240.788c3.074-1.613,1.663-6.32-1.789-5.949\r\n\t\tC308.247,212.678,302.466,355.238,239.663,400.739z");
    			add_location(path4, file$6, 19, 1, 1744);
    			add_location(g0, file$6, 13, 0, 1259);
    			set_style(path5, "fill", "#96BE4B");
    			attr_dev(path5, "d", "M402.349,208.695c-11.713,0.737-53.688,7.507-84.153,96.196\r\n\tc-11.129,32.396-41.298,153.005-190.918,150.974c-58.692-0.797-96.136-50.776-94.013-99.69\r\n\tc-11.592,79.005,72.599,160.988,203.689,93.309C355.707,388.174,317.961,252.984,402.349,208.695z");
    			add_location(path5, file$6, 24, 0, 2127);
    			set_style(path6, "fill", "#FFDC64");
    			attr_dev(path6, "d", "M172.323,428.471c-50.065-68.835-1.907-165.888,17.918-206.176\r\n\tc20.987-42.652,13.54-96.424,13.54-96.424c-14.217,9.19-59.069,17.722-59.069,17.722s2.031,14.725-25.557,113.907\r\n\tc-13.162,47.319-25.98,118.84,19.922,170.41C149.383,429.726,160.581,429.975,172.323,428.471z");
    			add_location(path6, file$6, 27, 0, 2407);
    			set_style(path7, "fill", "#FFC850");
    			attr_dev(path7, "d", "M165.868,104.884c-45.555,17.396-75.585,18.337-92.516,12.312l0,0\r\n\tc24.984,58.386,130.466,10.523,130.428,8.676C203.273,101.279,185.501,97.386,165.868,104.884z");
    			add_location(path7, file$6, 30, 0, 2709);
    			set_style(path8, "fill", "#4B3F4E");
    			attr_dev(path8, "d", "M144.204,94.34c-5.609,0-10.155-4.546-10.155-10.155v-8.124c0-5.609,4.546-10.155,10.155-10.155\r\n\ts10.155,4.546,10.155,10.155v8.124C154.359,89.794,149.813,94.34,144.204,94.34z");
    			add_location(path8, file$6, 32, 0, 2902);
    			add_location(g1, file$6, 34, 0, 3110);
    			add_location(g2, file$6, 36, 0, 3121);
    			add_location(g3, file$6, 38, 0, 3132);
    			add_location(g4, file$6, 40, 0, 3143);
    			add_location(g5, file$6, 42, 0, 3154);
    			add_location(g6, file$6, 44, 0, 3165);
    			add_location(g7, file$6, 46, 0, 3176);
    			add_location(g8, file$6, 48, 0, 3187);
    			add_location(g9, file$6, 50, 0, 3198);
    			add_location(g10, file$6, 52, 0, 3209);
    			add_location(g11, file$6, 54, 0, 3220);
    			add_location(g12, file$6, 56, 0, 3231);
    			add_location(g13, file$6, 58, 0, 3242);
    			add_location(g14, file$6, 60, 0, 3253);
    			add_location(g15, file$6, 62, 0, 3264);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Capa_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, g0);
    			append_dev(g0, path3);
    			append_dev(g0, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snake> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snake", $$slots, []);
    	return [];
    }

    class Snake extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snake",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\icons\Chicken.svelte generated by Svelte v3.20.1 */

    const file$7 = "src\\icons\\Chicken.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			attr_dev(path0, "d", "m208.578125 423.191406c-4.222656 0-7.644531 3.425782-7.644531 7.648438v48.796875l-36.929688-12.839844c-3.988281-1.386719-8.34375.722656-9.730468 4.710937-1.390626 3.988282.71875 8.347657 4.710937 9.734376l24.648437 8.570312-24.3125 7.207031c-4.046874 1.199219-6.359374 5.457031-5.15625 9.503907.984376 3.324218 4.027344 5.476562 7.328126 5.476562.71875 0 1.449218-.105469 2.175781-.320312l47.085937-13.957032c3.246094-.964844 5.472656-3.945312 5.472656-7.332031v-59.554687c0-4.21875-3.425781-7.644532-7.648437-7.644532zm0 0");
    			attr_dev(path0, "fill", "#ffa812");
    			add_location(path0, file$7, 0, 70, 70);
    			attr_dev(path1, "d", "m294.191406 417.960938c-4.226562 0-7.648437 3.421874-7.648437 7.648437v54.03125l-36.925781-12.84375c-3.988282-1.386719-8.347657.722656-9.734376 4.710937-1.386718 3.988282.722657 8.347657 4.710938 9.734376l24.648438 8.570312-24.3125 7.207031c-4.046876 1.203125-6.355469 5.457031-5.15625 9.503907.984374 3.324218 4.027343 5.476562 7.328124 5.476562.71875 0 1.449219-.101562 2.175782-.316406l47.085937-13.960938c3.246094-.960937 5.472657-3.945312 5.472657-7.332031v-64.785156c0-4.222657-3.421876-7.644531-7.644532-7.644531zm0 0");
    			attr_dev(path1, "fill", "#ffa812");
    			add_location(path1, file$7, 0, 620, 620);
    			attr_dev(path2, "d", "m39.183594 243.121094c-3.410156-28.957032-3.664063-53.019532-1.710938-73.042969-.003906 0-50.121094 35.011719-33.648437 60.933594 8.421875 13.25 23.09375 14.527343 35.425781 12.609375-.023438-.167969-.046875-.332032-.066406-.5zm0 0");
    			attr_dev(path2, "fill", "#ff4755");
    			add_location(path2, file$7, 0, 1171, 1171);
    			attr_dev(path3, "d", "m36.832031 216.421875c-11.375 1.324219-24.199219-.414063-32.164062-11.679687-4.558594 8.722656-6.125 17.960937-.84375 26.265624 8.421875 13.253907 23.09375 14.527344 35.421875 12.613282-.019532-.167969-.042969-.332032-.0625-.5-1.109375-9.410156-1.878906-18.292969-2.351563-26.699219zm0 0");
    			attr_dev(path3, "fill", "#fc2b3a");
    			add_location(path3, file$7, 0, 1429, 1429);
    			attr_dev(path4, "d", "m48.597656 122.433594c-27.234375 7.523437-46.382812 14.484375-44.667968 27.160156 1.578124 11.667969 23.699218 18.15625 33.542968 20.484375 1.898438-19.457031 5.886719-35.09375 11.125-47.644531zm0 0");
    			attr_dev(path4, "fill", "#ffa812");
    			add_location(path4, file$7, 0, 1743, 1743);
    			attr_dev(path5, "d", "m12.347656 135.871094c-6.003906 3.847656-9.15625 8.253906-8.417968 13.722656 1.578124 11.667969 23.699218 18.15625 33.542968 20.484375.605469-6.226563 1.429688-12.054687 2.4375-17.519531-9.949218-2.816406-24.203125-8.226563-27.5625-16.6875zm0 0");
    			attr_dev(path5, "fill", "#ff9a00");
    			add_location(path5, file$7, 0, 1968, 1968);
    			attr_dev(path6, "d", "m80.21875 82.460938c15.519531-10.066407 30.429688-11.15625 35.699219-11.28125 30.46875-.734376 46.96875 10.4375 57.835937 26.648437 9.34375-4.921875 28.492188-17.230469 22.667969-33.070313-8.273437-22.511718-30.929687-9.335937-30.929687-9.335937s6.554687-15.953125-7.625-26.316406c-14.183594-10.363281-31.542969-.660157-31.542969-.660157-4.332031-33.035156-50.769531-40.253906-68.660157-5.820312-14.222656 27.371094 12.855469 52.148438 22.554688 59.835938zm0 0");
    			attr_dev(path6, "fill", "#ff4755");
    			add_location(path6, file$7, 0, 2239, 2239);
    			attr_dev(path7, "d", "m173.753906 97.828125c5.339844-2.8125 13.878906-8.042969 19.132813-14.964844-15.167969-15.746093-36.308594-30.574219-62.980469-32.261719-29.859375-1.886718-52.164062 5.851563-66.929688 13.957032 5.886719 8.304687 13.128907 14.640625 17.242188 17.902344 15.519531-10.066407 30.429688-11.15625 35.699219-11.28125 30.46875-.734376 46.96875 10.4375 57.835937 26.648437zm0 0");
    			attr_dev(path7, "fill", "#fc2b3a");
    			add_location(path7, file$7, 0, 2726, 2726);
    			attr_dev(path8, "d", "m115.917969 71.179688c-14 .335937-96.105469 7.433593-76.734375 171.941406 16.996094 144.332031 119.039062 189.953125 198.941406 189.707031 116.132812-.359375 260.933594-97.9375 218.519531-251.476563 0 0-12.828125-57.058593-57.050781-54.601562-44.21875 2.457031-42.773438 89.40625-138.1875 79.84375-96.792969-9.703125-44.554688-137.851562-145.488281-135.414062zm0 0");
    			attr_dev(path8, "fill", "#ffe9c8");
    			add_location(path8, file$7, 0, 3122, 3122);
    			attr_dev(path9, "d", "m238.125 405.300781c-79.902344.246094-181.945312-45.375-198.941406-189.707031-1.375-11.667969-2.222656-22.519531-2.636719-32.660156-.792969 17.261718-.070313 37.183594 2.636719 60.1875 16.996094 144.332031 119.039062 189.953125 198.941406 189.707031 105.777344-.328125 235.324219-81.308594 225.546875-211.761719-8.839844 114.222656-127.421875 183.929688-225.546875 184.234375zm0 0");
    			attr_dev(path9, "fill", "#ffdca7");
    			add_location(path9, file$7, 0, 3513, 3513);
    			attr_dev(path10, "d", "m263.707031 353.273438c-27.433593 0-57.324219-7.683594-82.429687-32.441407-22.871094-22.558593-30.636719-48.546875-30.957032-49.640625-1.183593-4.054687 1.144532-8.300781 5.199219-9.484375 4.046875-1.175781 8.289063 1.140625 9.476563 5.1875.097656.328125 7.234375 23.769531 27.457031 43.476563 26.785156 26.101562 63.160156 33.824218 108.121094 22.960937 28.121093-6.796875 44.339843-22.4375 52.988281-34.363281 10.480469-14.449219 15.527344-31.609375 13.5-45.90625-.597656-4.183594 2.3125-8.054688 6.492188-8.644531 4.1875-.59375 8.054687 2.3125 8.644531 6.492187 5.179687 36.46875-23.179688 84.03125-78.035157 97.285156-12.074218 2.917969-25.921874 5.078126-40.457031 5.078126zm0 0");
    			attr_dev(path10, "fill", "#ffcf86");
    			add_location(path10, file$7, 0, 3920, 3920);
    			attr_dev(path11, "d", "m113.308594 124.882812c-8.761719 0-15.621094 8.535157-15.621094 19.425782 0 10.894531 6.859375 19.425781 15.621094 19.425781 8.757812 0 15.617187-8.53125 15.617187-19.425781 0-10.890625-6.859375-19.425782-15.617187-19.425782zm0 0");
    			attr_dev(path11, "fill", "#433f43");
    			add_location(path11, file$7, 0, 4630, 4630);
    			attr_dev(svg, "viewBox", "-24 0 511 511.99976");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chicken> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Chicken", $$slots, []);
    	return [];
    }

    class Chicken extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chicken",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\icons\Monkey.svelte generated by Svelte v3.20.1 */

    const file$8 = "src\\icons\\Monkey.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let circle0;
    	let circle1;
    	let circle2;
    	let circle3;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let g0;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let circle4;
    	let path10;
    	let path11;
    	let circle5;
    	let path12;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			circle3 = svg_element("circle");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			g0 = svg_element("g");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			circle4 = svg_element("circle");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			circle5 = svg_element("circle");
    			path12 = svg_element("path");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			set_style(circle0, "fill", "#965A50");
    			attr_dev(circle0, "cx", "66.06");
    			attr_dev(circle0, "cy", "222.97");
    			attr_dev(circle0, "r", "66.06");
    			add_location(circle0, file$8, 2, 0, 216);
    			set_style(circle1, "fill", "#EBC9A0");
    			attr_dev(circle1, "cx", "66.06");
    			attr_dev(circle1, "cy", "222.97");
    			attr_dev(circle1, "r", "41.29");
    			add_location(circle1, file$8, 3, 0, 282);
    			set_style(circle2, "fill", "#965A50");
    			attr_dev(circle2, "cx", "445.94");
    			attr_dev(circle2, "cy", "222.97");
    			attr_dev(circle2, "r", "66.06");
    			add_location(circle2, file$8, 4, 0, 348);
    			set_style(circle3, "fill", "#EBC9A0");
    			attr_dev(circle3, "cx", "445.94");
    			attr_dev(circle3, "cy", "222.97");
    			attr_dev(circle3, "r", "41.29");
    			add_location(circle3, file$8, 5, 0, 415);
    			set_style(path0, "fill", "#AF6E5A");
    			attr_dev(path0, "d", "M442.589,262.049c-8.366-14.436-13.169-30.655-13.169-47.34v-0.001\r\n\tc0-72.373-44.364-134.33-107.355-160.318V24.774l-41.29,16.516l-8.258-33.032c-21.781,7.261-40.361,22.498-54.356,37.298\r\n\tc-77.557,17.283-135.58,86.39-135.58,169.154c0,16.685-4.803,32.904-13.169,47.34c-12.72,21.948-19.863,46.482-19.863,72.402\r\n\tc0,93.496,92.431,169.29,206.452,169.29s206.452-75.794,206.452-169.29C462.452,308.532,455.308,283.997,442.589,262.049z");
    			add_location(path0, file$8, 6, 0, 482);
    			set_style(path1, "fill", "#965A50");
    			attr_dev(path1, "d", "M140.387,364.043c0-30.24,7.143-58.864,19.863-84.469c8.367-16.841,13.169-35.764,13.169-55.23\r\n\tc0-84.035,43.969-155.956,106.493-186.502l-7.396-29.584c-21.781,7.261-40.361,22.498-54.357,37.298\r\n\tC140.604,62.839,82.581,131.946,82.581,214.71c0,16.685-4.802,32.904-13.169,47.34c-12.72,21.948-19.863,46.482-19.863,72.402\r\n\tc0,75.465,60.232,139.37,143.415,161.223C160.282,460.734,140.387,414.619,140.387,364.043z");
    			add_location(path1, file$8, 10, 0, 944);
    			set_style(path2, "fill", "#FAEBC8");
    			attr_dev(path2, "d", "M256,470.71c68.412,0,123.871-44.367,123.871-99.097c0-11.354-2.414-22.245-6.835-32.386\r\n\tc-6.41-14.707-4.228-31.587,6.07-43.889c13.134-15.691,19.908-36.877,16.333-59.635c-4.91-31.259-30.182-56.486-61.448-61.353\r\n\tc-23.892-3.719-46.037,3.968-61.903,18.439c-4.51,4.113-10.3,6.17-16.087,6.17c-5.79,0-11.581-2.056-16.091-6.17\r\n\tc-15.866-14.471-38.011-22.158-61.903-18.439c-31.266,4.866-56.537,30.094-61.448,61.353c-3.575,22.757,3.199,43.943,16.333,59.635\r\n\tc10.298,12.303,12.48,29.182,6.07,43.889c-4.42,10.142-6.835,21.033-6.835,32.386C132.129,426.342,187.588,470.71,256,470.71z");
    			add_location(path2, file$8, 14, 0, 1385);
    			set_style(path3, "fill", "#F5DCB4");
    			attr_dev(path3, "d", "M132.129,371.612c0,18.522,6.468,35.795,17.524,50.625c-5.938-18.411-9.266-37.916-9.266-58.195\r\n\tc0-30.24,7.143-58.864,19.863-84.469c8.367-16.841,13.169-35.764,13.169-55.23c0-17.307,1.96-34.056,5.468-50.08\r\n\tc-0.295,0.042-0.583,0.04-0.879,0.086c-31.266,4.866-56.536,30.094-61.448,61.352c-3.575,22.758,3.2,43.944,16.333,59.635\r\n\tc10.298,12.302,12.481,29.181,6.071,43.889C134.543,349.368,132.129,360.259,132.129,371.612z");
    			add_location(path3, file$8, 19, 0, 1994);
    			set_style(path4, "fill", "#5D5360");
    			attr_dev(path4, "d", "M239.476,330.323c-1.242,0-2.5-0.278-3.685-0.871l-16.516-8.258c-4.081-2.04-5.734-7-3.694-11.081\r\n\t\tc2.048-4.081,7-5.734,11.081-3.694l16.516,8.258c4.081,2.04,5.734,7,3.694,11.081C245.419,328.653,242.508,330.323,239.476,330.323\r\n\t\tz");
    			add_location(path4, file$8, 24, 1, 2452);
    			set_style(path5, "fill", "#5D5360");
    			attr_dev(path5, "d", "M272.524,330.323c-3.032,0-5.944-1.669-7.395-4.565c-2.04-4.081-0.387-9.04,3.694-11.081\r\n\t\tl16.516-8.258c4.073-2.04,9.032-0.387,11.081,3.694c2.04,4.081,0.387,9.04-3.694,11.081l-16.516,8.258\r\n\t\tC275.024,330.044,273.766,330.323,272.524,330.323z");
    			add_location(path5, file$8, 27, 1, 2718);
    			add_location(g0, file$8, 23, 0, 2446);
    			set_style(path6, "fill", "#4B3F4E");
    			attr_dev(path6, "d", "M182.319,363.355c-5.001,0-8.941,4.431-8.248,9.384c5.126,36.617,39.853,64.938,81.929,64.938\r\n\tc42.077,0,76.803-28.321,81.929-64.938c0.693-4.953-3.247-9.384-8.248-9.384H182.319z");
    			add_location(path6, file$8, 31, 0, 3000);
    			set_style(path7, "fill", "#E6646E");
    			attr_dev(path7, "d", "M208.417,424.038c13.457,8.563,29.849,13.639,47.583,13.639s34.126-5.076,47.583-13.639\r\n\tc-5.966-20.666-25.063-35.909-47.583-35.909S214.383,403.371,208.417,424.038z");
    			add_location(path7, file$8, 33, 0, 3211);
    			set_style(path8, "fill", "#4B3F4E");
    			attr_dev(path8, "d", "M181.677,272.516L181.677,272.516c-13.682,0-24.774-11.092-24.774-24.774v-8.258\r\n\tc0-13.682,11.092-24.774,24.774-24.774l0,0c13.682,0,24.774,11.092,24.774,24.774v8.258\r\n\tC206.452,261.424,195.36,272.516,181.677,272.516z");
    			add_location(path8, file$8, 35, 0, 3409);
    			set_style(path9, "fill", "#5D5360");
    			attr_dev(path9, "d", "M181.677,214.71v28.903c0,6.841,5.546,12.387,12.387,12.387s12.387-5.546,12.387-12.387v-4.129\r\n\tC206.452,225.801,195.36,214.71,181.677,214.71z");
    			add_location(path9, file$8, 38, 0, 3660);
    			set_style(circle4, "fill", "#FFFFFF");
    			attr_dev(circle4, "cx", "181.68");
    			attr_dev(circle4, "cy", "231.23");
    			attr_dev(circle4, "r", "8.258");
    			add_location(circle4, file$8, 40, 0, 3836);
    			set_style(path10, "fill", "#4B3F4E");
    			attr_dev(path10, "d", "M330.323,272.516L330.323,272.516c-13.682,0-24.774-11.092-24.774-24.774v-8.258\r\n\tc0-13.682,11.092-24.774,24.774-24.774l0,0c13.682,0,24.774,11.092,24.774,24.774v8.258\r\n\tC355.097,261.424,344.005,272.516,330.323,272.516z");
    			add_location(path10, file$8, 41, 0, 3903);
    			set_style(path11, "fill", "#5D5360");
    			attr_dev(path11, "d", "M330.323,214.71v28.903c0,6.841,5.546,12.387,12.387,12.387s12.387-5.546,12.387-12.387v-4.129\r\n\tC355.097,225.801,344.005,214.71,330.323,214.71z");
    			add_location(path11, file$8, 44, 0, 4155);
    			set_style(circle5, "fill", "#FFFFFF");
    			attr_dev(circle5, "cx", "330.32");
    			attr_dev(circle5, "cy", "231.23");
    			attr_dev(circle5, "r", "8.258");
    			add_location(circle5, file$8, 46, 0, 4332);
    			set_style(path12, "fill", "#FF8087");
    			attr_dev(path12, "d", "M256,437.677c2.792,0,5.538-0.169,8.258-0.415v-16.101c0-4.56-3.694-8.258-8.258-8.258\r\n\ts-8.258,3.698-8.258,8.258v16.101C250.462,437.508,253.208,437.677,256,437.677z");
    			add_location(path12, file$8, 47, 0, 4399);
    			add_location(g1, file$8, 49, 0, 4598);
    			add_location(g2, file$8, 51, 0, 4609);
    			add_location(g3, file$8, 53, 0, 4620);
    			add_location(g4, file$8, 55, 0, 4631);
    			add_location(g5, file$8, 57, 0, 4642);
    			add_location(g6, file$8, 59, 0, 4653);
    			add_location(g7, file$8, 61, 0, 4664);
    			add_location(g8, file$8, 63, 0, 4675);
    			add_location(g9, file$8, 65, 0, 4686);
    			add_location(g10, file$8, 67, 0, 4697);
    			add_location(g11, file$8, 69, 0, 4708);
    			add_location(g12, file$8, 71, 0, 4719);
    			add_location(g13, file$8, 73, 0, 4730);
    			add_location(g14, file$8, 75, 0, 4741);
    			add_location(g15, file$8, 77, 0, 4752);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Capa_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			set_style(svg, "enable-background", "new 0 0 512 512");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle0);
    			append_dev(svg, circle1);
    			append_dev(svg, circle2);
    			append_dev(svg, circle3);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, g0);
    			append_dev(g0, path4);
    			append_dev(g0, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, circle4);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, circle5);
    			append_dev(svg, path12);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Monkey> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Monkey", $$slots, []);
    	return [];
    }

    class Monkey extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Monkey",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Game.svelte generated by Svelte v3.20.1 */
    const file$9 = "src\\Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (121:3) {:else}
    function create_else_block$1(ctx) {
    	let t_value = /*letters*/ ctx[4][/*index*/ ctx[15]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(121:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (119:3) {#if card.flipped}
    function create_if_block$1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*card*/ ctx[13].image;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*card*/ ctx[13].image)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(119:3) {#if card.flipped}",
    		ctx
    	});

    	return block;
    }

    // (118:2) <Card isFlipped={card.flipped}>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*card*/ ctx[13].flipped) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(118:2) <Card isFlipped={card.flipped}>",
    		ctx
    	});

    	return block;
    }

    // (116:1) {#each board as card, index}
    function create_each_block(ctx) {
    	let a;
    	let t;
    	let current;
    	let dispose;

    	const card = new Card({
    			props: {
    				isFlipped: /*card*/ ctx[13].flipped,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*card*/ ctx[13], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(card.$$.fragment);
    			t = space();
    			add_location(a, file$9, 116, 1, 2574);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			mount_component(card, a, null);
    			append_dev(a, t);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty & /*board*/ 4) card_changes.isFlipped = /*card*/ ctx[13].flipped;

    			if (dirty & /*$$scope, board*/ 65540) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(card);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(116:1) {#each board as card, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let t0;
    	let aside;
    	let t1;
    	let t2_value = /*curPlayer*/ ctx[0] + 1 + "";
    	let t2;
    	let t3;
    	let t4_value = /*scores*/ ctx[1][/*curPlayer*/ ctx[0]] + "";
    	let t4;
    	let t5;
    	let footer;
    	let t6;
    	let a0;
    	let t8;
    	let a1;
    	let current;
    	let each_value = /*board*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			aside = element("aside");
    			t1 = text("Player ");
    			t2 = text(t2_value);
    			t3 = text(" - Score: ");
    			t4 = text(t4_value);
    			t5 = space();
    			footer = element("footer");
    			t6 = text("Icons made by ");
    			a0 = element("a");
    			a0.textContent = "Freepik";
    			t8 = text(" from ");
    			a1 = element("a");
    			a1.textContent = "www.flaticon.com";
    			attr_dev(main, "class", "svelte-h4laq6");
    			add_location(main, file$9, 114, 0, 2536);
    			attr_dev(aside, "class", "svelte-h4laq6");
    			add_location(aside, file$9, 128, 0, 2777);
    			attr_dev(a0, "href", "https://www.flaticon.com/authors/freepik");
    			attr_dev(a0, "title", "Freepik");
    			add_location(a0, file$9, 131, 15, 2867);
    			attr_dev(a1, "href", "https://www.flaticon.com/");
    			attr_dev(a1, "title", "Flaticon");
    			add_location(a1, file$9, 131, 99, 2951);
    			attr_dev(footer, "class", "svelte-h4laq6");
    			add_location(footer, file$9, 130, 0, 2843);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, aside, anchor);
    			append_dev(aside, t1);
    			append_dev(aside, t2);
    			append_dev(aside, t3);
    			append_dev(aside, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, t6);
    			append_dev(footer, a0);
    			append_dev(footer, t8);
    			append_dev(footer, a1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pick, board, letters*/ 28) {
    				each_value = /*board*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*curPlayer*/ 1) && t2_value !== (t2_value = /*curPlayer*/ ctx[0] + 1 + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*scores, curPlayer*/ 3) && t4_value !== (t4_value = /*scores*/ ctx[1][/*curPlayer*/ ctx[0]] + "")) set_data_dev(t4, t4_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(aside);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function shuffleArray(array) {
    	for (let i = array.length - 1; i > 0; i--) {
    		const j = Math.floor(Math.random() * (i + 1));
    		const temp = array[i];
    		array[i] = array[j];
    		array[j] = temp;
    	}
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { numPlayers = 0 } = $$props;
    	let curPlayer = 0;
    	let scores = [];

    	for (let i = 0; i < numPlayers; i++) {
    		scores.push(0);
    	}

    	let waiting = false;
    	let idx = 0;
    	let board = [];
    	let selected = [];

    	function reset() {
    		$$invalidate(2, board = [
    			{ image: Dog, id: idx++ },
    			{ image: Dog, id: idx++ },
    			{ image: Cat, id: idx++ },
    			{ image: Cat, id: idx++ },
    			{ image: Fish, id: idx++ },
    			{ image: Fish, id: idx++ },
    			{ image: Bird, id: idx++ },
    			{ image: Bird, id: idx++ },
    			{ image: Lion, id: idx++ },
    			{ image: Lion, id: idx++ },
    			{ image: Snake, id: idx++ },
    			{ image: Snake, id: idx++ },
    			{ image: Monkey, id: idx++ },
    			{ image: Monkey, id: idx++ },
    			{ image: Chicken, id: idx++ },
    			{ image: Chicken, id: idx++ }
    		]);

    		shuffleArray(board);
    		selected = [];
    		waiting = false;
    	}

    	reset();

    	function pick(card) {
    		if (!board.find(c => !c.flipped)) {
    			return reset();
    		}

    		if (waiting) {
    			return next();
    		}

    		if (card.flipped) {
    			return;
    		}

    		if (!board.find(c => !c.flipped)) {
    			return;
    		}

    		card.flipped = true;
    		selected = [...selected, card];

    		if (selected.length === 2) {
    			if (selected[0].image === selected[1].image) {
    				$$invalidate(1, scores[curPlayer] += 1, scores);
    				$$invalidate(1, scores);
    				selected = [];
    			} else {
    				waiting = true;
    			}
    		}

    		$$invalidate(2, board);
    	}

    	function next() {
    		$$invalidate(0, curPlayer += 1);

    		if (curPlayer >= numPlayers) {
    			$$invalidate(0, curPlayer = 0);
    		}

    		waiting = false;
    		selected.forEach(c => c.flipped = false);
    		selected = [];
    		$$invalidate(2, board);
    	}

    	const letters = [
    		"A",
    		"B",
    		"C",
    		"D",
    		"E",
    		"F",
    		"G",
    		"H",
    		"I",
    		"J",
    		"K",
    		"L",
    		"M",
    		"N",
    		"O",
    		"P",
    		"Q",
    		"R",
    		"S",
    		"T",
    		"U",
    		"V",
    		"W",
    		"X",
    		"Y",
    		"Z"
    	];

    	let listener;

    	onMount(() => {
    		listener = window.addEventListener("keypress", e => {
    			const i = letters.findIndex(l => l === e.key.toUpperCase());
    			pick(board[i]);
    		});
    	});

    	onDestroy(() => {
    		window.removeEventListener("keypress", listener);
    	});

    	const writable_props = ["numPlayers"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Game", $$slots, []);
    	const click_handler = card => pick(card);

    	$$self.$set = $$props => {
    		if ("numPlayers" in $$props) $$invalidate(5, numPlayers = $$props.numPlayers);
    	};

    	$$self.$capture_state = () => ({
    		Dog,
    		Card,
    		Cat,
    		Fish,
    		Bird,
    		Lion,
    		Snake,
    		Chicken,
    		Monkey,
    		onDestroy,
    		onMount,
    		shuffleArray,
    		numPlayers,
    		curPlayer,
    		scores,
    		waiting,
    		idx,
    		board,
    		selected,
    		reset,
    		pick,
    		next,
    		letters,
    		listener
    	});

    	$$self.$inject_state = $$props => {
    		if ("numPlayers" in $$props) $$invalidate(5, numPlayers = $$props.numPlayers);
    		if ("curPlayer" in $$props) $$invalidate(0, curPlayer = $$props.curPlayer);
    		if ("scores" in $$props) $$invalidate(1, scores = $$props.scores);
    		if ("waiting" in $$props) waiting = $$props.waiting;
    		if ("idx" in $$props) idx = $$props.idx;
    		if ("board" in $$props) $$invalidate(2, board = $$props.board);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("listener" in $$props) listener = $$props.listener;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		curPlayer,
    		scores,
    		board,
    		pick,
    		letters,
    		numPlayers,
    		waiting,
    		idx,
    		selected,
    		listener,
    		reset,
    		next,
    		click_handler
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { numPlayers: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get numPlayers() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numPlayers(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$a = "src\\App.svelte";

    // (21:0) {:else}
    function create_else_block$2(ctx) {
    	let current;

    	const game = new Game({
    			props: { numPlayers: /*numPlayers*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*numPlayers*/ 2) game_changes.numPlayers = /*numPlayers*/ ctx[1];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(21:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:0) {#if !playing}
    function create_if_block$2(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let div;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let t9;
    	let button3;
    	let t11;
    	let button4;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Memory";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Choose players";
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "1";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "2";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "3";
    			t9 = space();
    			button3 = element("button");
    			button3.textContent = "4";
    			t11 = space();
    			button4 = element("button");
    			button4.textContent = "PLAY";
    			attr_dev(h1, "class", "svelte-1x29gcb");
    			add_location(h1, file$a, 8, 4, 130);
    			attr_dev(h2, "class", "svelte-1x29gcb");
    			add_location(h2, file$a, 10, 4, 153);
    			attr_dev(button0, "class", "svelte-1x29gcb");
    			toggle_class(button0, "selected", /*numPlayers*/ ctx[1] === 1);
    			add_location(button0, file$a, 13, 8, 199);
    			attr_dev(button1, "class", "svelte-1x29gcb");
    			toggle_class(button1, "selected", /*numPlayers*/ ctx[1] === 2);
    			add_location(button1, file$a, 14, 8, 293);
    			attr_dev(button2, "class", "svelte-1x29gcb");
    			toggle_class(button2, "selected", /*numPlayers*/ ctx[1] === 3);
    			add_location(button2, file$a, 15, 8, 387);
    			attr_dev(button3, "class", "svelte-1x29gcb");
    			toggle_class(button3, "selected", /*numPlayers*/ ctx[1] === 4);
    			add_location(button3, file$a, 16, 8, 481);
    			add_location(div, file$a, 12, 4, 184);
    			attr_dev(button4, "class", "svelte-1x29gcb");
    			add_location(button4, file$a, 19, 4, 585);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(div, t7);
    			append_dev(div, button2);
    			append_dev(div, t9);
    			append_dev(div, button3);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button4, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false),
    				listen_dev(button3, "click", /*click_handler_3*/ ctx[5], false, false, false),
    				listen_dev(button4, "click", /*click_handler_4*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numPlayers*/ 2) {
    				toggle_class(button0, "selected", /*numPlayers*/ ctx[1] === 1);
    			}

    			if (dirty & /*numPlayers*/ 2) {
    				toggle_class(button1, "selected", /*numPlayers*/ ctx[1] === 2);
    			}

    			if (dirty & /*numPlayers*/ 2) {
    				toggle_class(button2, "selected", /*numPlayers*/ ctx[1] === 3);
    			}

    			if (dirty & /*numPlayers*/ 2) {
    				toggle_class(button3, "selected", /*numPlayers*/ ctx[1] === 4);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:0) {#if !playing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*playing*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let playing = false;
    	let numPlayers;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => $$invalidate(1, numPlayers = 1);
    	const click_handler_1 = () => $$invalidate(1, numPlayers = 2);
    	const click_handler_2 = () => $$invalidate(1, numPlayers = 3);
    	const click_handler_3 = () => $$invalidate(1, numPlayers = 4);
    	const click_handler_4 = () => $$invalidate(0, playing = true);
    	$$self.$capture_state = () => ({ Game, playing, numPlayers });

    	$$self.$inject_state = $$props => {
    		if ("playing" in $$props) $$invalidate(0, playing = $$props.playing);
    		if ("numPlayers" in $$props) $$invalidate(1, numPlayers = $$props.numPlayers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		playing,
    		numPlayers,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
