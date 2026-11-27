export class Tensor {
    shape;
    storage;
    #read;
    constructor(shape, read, storage = 'lazy'){
        if (shape.some((n)=>!Number.isSafeInteger(n) || n < 0)) throw Error('Invalid tensor extent');
        this.shape = Object.freeze([
            ...shape
        ]);
        this.#read = read;
        this.storage = storage;
        Object.freeze(this);
    }
    get(coords) {
        if (coords.length !== this.shape.length || coords.some((i, d)=>!Number.isInteger(i) || i < 0 || i >= this.shape[d])) throw Error(`Index [${coords}] outside shape [${this.shape}]`);
        return this.#read(coords);
    }
    toJSON() {
        const walk = (c)=>c.length === this.shape.length ? this.get(c) : Array.from({
                length: this.shape[c.length]
            }, (_, i)=>walk([
                    ...c,
                    i
                ]));
        return walk([]);
    }
}
const shapeCache = new WeakMap();
export function shape(v) {
    if (v instanceof Tensor) return [
        ...v.shape
    ];
    if (!Array.isArray(v)) return [];
    if (shapeCache.has(v)) return [
        ...shapeCache.get(v)
    ];
    const s = v.length ? shape(v[0]) : [];
    if (v.some((x)=>JSON.stringify(shape(x)) !== JSON.stringify(s))) throw Error('Ragged tensor');
    const result = [
        v.length,
        ...s
    ];
    if (Object.isFrozen(v)) shapeCache.set(v, result);
    return result;
}
export function get(v, ...coords) {
    if (v instanceof Tensor) return v.get(coords);
    const s = shape(v);
    if (coords.length !== s.length || coords.some((x, d)=>!Number.isInteger(x) || x < 0 || x >= s[d])) throw Error(`Index [${coords}] outside shape [${s}]`);
    let a = v;
    for(let d = 0; d < coords.length; d++){
        if (a instanceof Tensor) return a.get(coords.slice(d));
        a = a[coords[d]];
    }
    return a;
}
export function tensor(s, f, lazy = true) {
    if (!lazy) {
        const map = new Map();
        const fill = (c)=>{
            if (c.length === s.length) map.set(c.join(','), f(...c));
            else for(let i = 0; i < s[c.length]; i++)fill([
                ...c,
                i
            ]);
        };
        fill([]);
        return new Tensor(s, (c)=>map.get(c.join(',')), 'dense');
    }
    const memo = new Map();
    return new Tensor(s, (c)=>{
        const k = c.join(',');
        if (!memo.has(k)) memo.set(k, f(...c));
        return memo.get(k);
    });
}
export function literal(a, opt = true) {
    const s = shape(a);
    const flat = a.flat(Infinity);
    if (opt && flat.length && flat.every((x)=>typeof x === 'number') && flat.filter((x)=>x !== 0).length < flat.length / 3) {
        const m = new Map();
        const visit = (v, c)=>{
            if (Array.isArray(v)) v.forEach((x, i)=>visit(x, [
                    ...c,
                    i
                ]));
            else if (v !== 0) m.set(c.join(','), v);
        };
        visit(a, []);
        return new Tensor(s, (c)=>m.get(c.join(',')) ?? 0, 'sparse');
    }
    return Object.freeze(a.map((x)=>Array.isArray(x) ? literal(x, false) : x));
}
export function sum(n, f, opt = true) {
    if (!Number.isSafeInteger(n) || n < 0) throw Error('Invalid reduction extent');
    if (!opt) return Array.from({
        length: n
    }, (_, i)=>f(i)).reduce((a, b)=>a + b, 0);
    let s = 0;
    for(let i = 0; i < n; i++)s += f(i);
    return s;
}
export function extent(v, d) {
    const n = shape(v)[d];
    if (n === undefined) throw Error('Tensor rank mismatch');
    return n;
}
export function agree(...xs) {
    if (!xs.length || xs.some((x)=>x !== xs[0]) || !Number.isSafeInteger(xs[0]) || xs[0] < 0) throw Error(`Index extent mismatch: ${xs}`);
    return xs[0];
}
export function plain(v) {
    if (typeof v === 'bigint') return v.toString() + 'n';
    if (v instanceof Tensor) return plain(v.toJSON());
    if (Array.isArray(v)) return v.map(plain);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x])=>[
            k,
            plain(x)
        ]));
    return v;
}
export const builtins = {
    delta: (i, j)=>Number(i === j),
    mask: (b)=>Number(Boolean(b)),
    len: (v)=>v instanceof Tensor ? v.shape[0] : v.length,
    str: (v)=>String(v),
    nat: (v)=>{
        const n = BigInt(v);
        if (n < 0n) throw Error('Negative natural');
        return n;
    },
    num: Number,
    floor: Math.floor,
    sqrt: Math.sqrt,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    sin: Math.sin,
    cos: Math.cos,
    tabulate: (n, f)=>tensor([
            n
        ], f),
    grid: (n, m, f, context)=>tensor([
            n,
            m
        ], (i, j)=>f(i, j, context)),
    realize: (v)=>v instanceof Tensor ? literal(v.toJSON(), false) : v,
    at: (a, i)=>get(a, i),
    cell: (a, i, j)=>get(a, i, j),
    wrap: (a, i)=>get(a, (i % extent(a, 0) + extent(a, 0)) % extent(a, 0)),
    join: (a, s)=>Array.from({
            length: extent(a, 0)
        }, (_, i)=>get(a, i)).join(s),
    search: (a, q)=>Object.freeze(Array.from({
            length: extent(a, 0)
        }, (_, i)=>get(a, i)).filter((x)=>String(x).toLowerCase().includes(q.toLowerCase()))),
    contains: (s, q)=>s.toLowerCase().includes(q.toLowerCase()),
    text: (s)=>Object.freeze({
            tag: 'text',
            text: String(s)
        }),
    svg: (points)=>Object.freeze({
            tag: 'svg',
            points: plain(points)
        }),
    view: (count, query, items)=>Object.freeze({
            tag: 'view',
            count,
            query,
            items: plain(items)
        })
};
export function iterate(seed, step, done, limit = Infinity) {
    let state = seed, n = 0;
    while(!done(state)){
        if (n++ >= limit) throw Error('Iteration fuel exhausted');
        state = step(state);
    }
    return state;
}
export function createRuntime(options = {}) {
    let fuel = options.fuel ?? Infinity;
    return {
        Tensor,
        shape,
        get,
        tensor,
        literal,
        sum,
        extent,
        agree,
        plain,
        builtins,
        iterate,
        resetFuel: ()=>{
            fuel = options.fuel ?? Infinity;
        },
        tick: ()=>{
            if (--fuel < 0) throw Error('Execution fuel exhausted');
        }
    };
}
