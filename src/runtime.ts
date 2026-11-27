export type Value = any;
export class Tensor {
 readonly shape:readonly number[]; readonly storage:string; #read:(coords:number[])=>Value;
 constructor(shape:number[],read:(coords:number[])=>Value,storage='lazy'){
  if(shape.some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Invalid tensor extent');this.shape=Object.freeze([...shape]);this.#read=read;this.storage=storage;Object.freeze(this);
 }
 get(coords:number[]):Value{if(coords.length!==this.shape.length||coords.some((i,d)=>!Number.isInteger(i)||i<0||i>=this.shape[d]))throw Error(`Index [${coords}] outside shape [${this.shape}]`);return this.#read(coords);}
 toJSON():Value{const walk=(c:number[]):Value=>c.length===this.shape.length?this.get(c):Array.from({length:this.shape[c.length]},(_,i)=>walk([...c,i]));return walk([]);}
}
const shapeCache=new WeakMap<object,number[]>();
export function shape(v:Value):number[]{if(v instanceof Tensor)return [...v.shape];if(!Array.isArray(v))return [];if(shapeCache.has(v))return [...shapeCache.get(v)!];const s=v.length?shape(v[0]):[];if(v.some(x=>JSON.stringify(shape(x))!==JSON.stringify(s)))throw Error('Ragged tensor');const result=[v.length,...s];if(Object.isFrozen(v))shapeCache.set(v,result);return result;}
export function get(v:Value,...coords:number[]):Value {if(v instanceof Tensor)return v.get(coords);const s=shape(v);if(coords.length!==s.length||coords.some((x,d)=>!Number.isInteger(x)||x<0||x>=s[d]))throw Error(`Index [${coords}] outside shape [${s}]`);let a=v;for(let d=0;d<coords.length;d++){if(a instanceof Tensor)return a.get(coords.slice(d));a=a[coords[d]];}return a;}
export function tensor(s:number[],f:(...coords:number[])=>Value,lazy=true):Tensor{
 if(!lazy){const map=new Map<string,Value>();const fill=(c:number[])=>{if(c.length===s.length)map.set(c.join(','),f(...c));else for(let i=0;i<s[c.length];i++)fill([...c,i]);};fill([]);return new Tensor(s,c=>map.get(c.join(',')),'dense');}
 const memo=new Map<string,Value>();return new Tensor(s,c=>{const k=c.join(',');if(!memo.has(k))memo.set(k,f(...c));return memo.get(k);});
}
export function literal(a:Value,opt=true):Value{const s=shape(a);const flat=a.flat(Infinity);if(opt&&flat.length&&flat.every(x=>typeof x==='number')&&flat.filter(x=>x!==0).length<flat.length/3){const m=new Map<string,number>();const visit=(v:Value,c:number[])=>{if(Array.isArray(v))v.forEach((x,i)=>visit(x,[...c,i]));else if(v!==0)m.set(c.join(','),v);};visit(a,[]);return new Tensor(s,c=>m.get(c.join(','))??0,'sparse');}return Object.freeze(a.map((x:Value)=>Array.isArray(x)?literal(x,false):x));}
export function sum(n:number,f:(i:number)=>number,opt=true):number{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid reduction extent');if(!opt)return Array.from({length:n},(_,i)=>f(i)).reduce((a,b)=>a+b,0);let s=0;for(let i=0;i<n;i++)s+=f(i);return s;}
export function extent(v:Value,d:number):number{const n=shape(v)[d];if(n===undefined)throw Error('Tensor rank mismatch');return n;}
export function agree(...xs:number[]):number{if(!xs.length||xs.some(x=>x!==xs[0])||!Number.isSafeInteger(xs[0])||xs[0]<0)throw Error(`Index extent mismatch: ${xs}`);return xs[0];}
export function plain(v:Value):Value{if(typeof v==='bigint')return v.toString()+'n';if(v instanceof Tensor)return plain(v.toJSON());if(Array.isArray(v))return v.map(plain);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,plain(x)]));return v;}
export const builtins:Record<string,Value>={
 delta:(i:Value,j:Value)=>Number(i===j),mask:(b:Value)=>Number(Boolean(b)),len:(v:Value)=>v instanceof Tensor?v.shape[0]:v.length,
 str:(v:Value)=>String(v),nat:(v:Value)=>{const n=BigInt(v);if(n<0n)throw Error('Negative natural');return n;},num:Number,
 floor:Math.floor,sqrt:Math.sqrt,abs:Math.abs,min:Math.min,max:Math.max,sin:Math.sin,cos:Math.cos,
 tabulate:(n:number,f:Value)=>tensor([n],f),grid:(n:number,m:number,f:Value)=>tensor([n,m],f),
 at:(a:Value,i:number)=>get(a,i),cell:(a:Value,i:number,j:number)=>get(a,i,j),
 wrap:(a:Value,i:number)=>get(a,((i%extent(a,0))+extent(a,0))%extent(a,0)),
 join:(a:Value,s:string)=>Array.from({length:extent(a,0)},(_,i)=>get(a,i)).join(s),
 contains:(s:string,q:string)=>s.toLowerCase().includes(q.toLowerCase()),
 text:(s:Value)=>Object.freeze({tag:'text',text:String(s)}),
 svg:(points:Value)=>Object.freeze({tag:'svg',points:plain(points)}),
 view:(count:Value,query:Value,items:Value)=>Object.freeze({tag:'view',count,query,items:plain(items)})
};
export function iterate(seed:Value,step:Value,done:Value,limit=Infinity):Value{let state=seed,n=0;while(!done(state)){if(n++>=limit)throw Error('Iteration fuel exhausted');state=step(state);}return state;}
export function createRuntime(options:{fuel?:number}={}){
 let fuel=options.fuel??Infinity;return {Tensor,shape,get,tensor,literal,sum,extent,agree,plain,builtins,iterate,
 tick:()=>{if(--fuel<0)throw Error('Execution fuel exhausted');},};
}
