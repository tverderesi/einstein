import {parse} from './parser.ts';
import {Diagnostic} from './ast.ts';
import {builtins} from './runtime.ts';
import type {Expr,Statement,Axis,Program} from './ast.ts';
export type Type={kind:string;shape?:number[]};
export type TermIR={expression:Expr;sign:number;reduce:string[]};
export type BindingIR={name:string;axes:Axis[];domains:Record<string,Expr[]>;terms:TermIR[];type:Type;notes:string[]};
export type Compilation={ast:Program;ir:BindingIR[];code:string;types:Record<string,Type>;optimizations:string[]};
const children=(e:Expr):Expr[]=>e.kind==='binary'?[e.left,e.right]:e.kind==='unary'?[e.arg]:e.kind==='call'?e.args:e.kind==='index'?[e.base,...e.indices]:e.kind==='field'?[e.base]:e.kind==='array'?e.items:e.kind==='record'?e.fields.map(x=>x[1]):[];
function walk(e:Expr,f:(e:Expr)=>void){f(e);children(e).forEach(x=>walk(x,f));}
const id=(name:string):Expr=>({kind:'id',name});
const call=(name:string,args:Expr[]):Expr=>({kind:'call',name,args});
const lit=(value:number):Expr=>({kind:'literal',value});
function terms(e:Expr,sign=1):{expression:Expr;sign:number}[]{return e.kind==='binary'&&(e.op==='+'||e.op==='-')?[...terms(e.left,sign),...terms(e.right,e.op==='+'?sign:-sign)]:[{expression:e,sign}];}
function replace(e:Expr,from:string,to:string):Expr{if(e.kind==='id')return e.name===from?id(to):e;if(e.kind==='binary')return {...e,left:replace(e.left,from,to),right:replace(e.right,from,to)};if(e.kind==='call')return {...e,args:e.args.map(a=>replace(a,from,to))};if(e.kind==='index')return {...e,base:replace(e.base,from,to),indices:e.indices.map(a=>replace(a,from,to))};return e;}
const numeric=(t:Type)=>['number','natural','unknown'].includes(t.kind);
export function compile(source:string,options:{optimize?:boolean}={}):Compilation{
 const optimize=options.optimize!==false,ast=parse(source),types:Record<string,Type>=Object.create(null),ir:BindingIR[]=[],optimizations:string[]=[];
 const fns=new Map(ast.filter(s=>s.kind==='fn').map(s=>[s.name,s]));
 const symbols=new Set([...Object.keys(builtins),'select','iterate',...fns.keys()]);
 const safe=(n:string)=>'v_'+n;
 const arity:Record<string,number[]>={select:[3],iterate:[3,4],delta:[2],mask:[1],len:[1],str:[1],nat:[1],num:[1],floor:[1],sqrt:[1],abs:[1],sin:[1],cos:[1],tabulate:[2],grid:[3],at:[2],cell:[3],wrap:[2],join:[2],contains:[2],text:[1],svg:[1],view:[3],search:[2]};
 function infer(e:Expr,locals:Set<string>):Type{
  if(e.kind==='literal')return {kind:e.nat?'natural':typeof e.value};
  if(e.kind==='id'){if(!locals.has(e.name)&&!symbols.has(e.name))throw new Diagnostic(`Unbound name ${e.name}`);return types[e.name]??{kind:fns.has(e.name)?'function':'unknown'};}
  if(e.kind==='array'){const ts=e.items.map(x=>infer(x,locals));const s=ts[0]?.shape??[];if(ts.some(x=>JSON.stringify(x.shape??[])!==JSON.stringify(s)))throw new Diagnostic('Ragged array literal');return {kind:'tensor',shape:[ts.length,...s]};}
  if(e.kind==='record'){e.fields.forEach(x=>infer(x[1],locals));return {kind:'record'};}
  if(e.kind==='field'){infer(e.base,locals);if(['__proto__','constructor','prototype'].includes(e.name))throw new Diagnostic('Reserved field');return {kind:'unknown'};}
  if(e.kind==='index'){const t=infer(e.base,locals);e.indices.forEach(x=>infer(x,locals));if(t.shape&&t.shape.length!==e.indices.length)throw new Diagnostic('Tensor rank mismatch');if(t.kind!=='tensor'&&t.kind!=='unknown')throw new Diagnostic('Indexing requires tensor');return {kind:'number'};}
  if(e.kind==='unary'){infer(e.arg,locals);return {kind:e.op==='!'?'boolean':'number'};}
  if(e.kind==='binary'){const a=infer(e.left,locals),b=infer(e.right,locals);if(['==','!=','<','>','<=','>=','&&','||'].includes(e.op))return {kind:'boolean'};if(e.op==='+'&&a.kind==='string'&&b.kind==='string')return {kind:'string'};if(!numeric(a)||!numeric(b))throw new Diagnostic(`Operator ${e.op} requires numeric operands`);if((a.kind==='natural'&&b.kind==='number')||(a.kind==='number'&&b.kind==='natural'))throw new Diagnostic('Cannot mix natural and number');return {kind:a.kind==='natural'||b.kind==='natural'?'natural':'number'};}
  if(!symbols.has(e.name))throw new Diagnostic(`Unknown function ${e.name}`);
  const allowed=arity[e.name]??(fns.has(e.name)?[fns.get(e.name)!.params.length]:undefined);if(allowed&&!allowed.includes(e.args.length))throw new Diagnostic(`Wrong arity for ${e.name}`);
  const ats=e.args.map(x=>infer(x,locals));if(e.name==='select'){if(ats[1].kind!==ats[2].kind&&!ats.some(x=>x.kind==='unknown'))throw new Diagnostic('select alternatives have different types');return ats[1].kind==='unknown'?ats[2]:ats[1];}
  if(['str','join'].includes(e.name))return {kind:'string'};if(e.name==='nat')return {kind:'natural'};if(['text','svg','view'].includes(e.name))return {kind:'record'};if(['tabulate','grid','search'].includes(e.name))return {kind:'tensor'};if(e.name==='contains')return {kind:'boolean'};return {kind:fns.has(e.name)||e.name==='iterate'?'unknown':'number'};
 }
 function arrayCode(e:Expr):string{return e.kind==='array'?`[${e.items.map(arrayCode).join(',')}]`:emit(e);}
 function emit(e:Expr):string{
  switch(e.kind){case 'literal':return e.nat?`BigInt(${JSON.stringify(e.value)})`:JSON.stringify(e.value);case 'id':return symbols.has(e.name)&&e.name in builtins?`rt.builtins[${JSON.stringify(e.name)}]`:safe(e.name);
   case 'array':return `rt.literal(${arrayCode(e)},${optimize})`;
   case 'record':return `Object.freeze({${e.fields.map(([k,v])=>`${JSON.stringify(k)}:${emit(v)}`).join(',')}})`;
   case 'field':return `${emit(e.base)}[${JSON.stringify(e.name)}]`;
   case 'index':return `rt.get(${emit(e.base)},${e.indices.map(emit).join(',')})`;
   case 'unary':return `(${e.op}${emit(e.arg)})`;
   case 'binary':return `(${emit(e.left)} ${e.op==='=='?'===':e.op==='!='?'!==':e.op} ${emit(e.right)})`;
   case 'call':if(e.name==='select')return `(${emit(e.args[0])}?${emit(e.args[1])}:${emit(e.args[2])})`;if(e.name==='iterate')return `rt.iterate(${e.args.map(emit).join(',')})`;if(e.name==='_extent')return `rt.extent(${e.args.map(emit).join(',')})`;return `${emit(id(e.name))}(${e.args.map(emit).join(',')})`;
  }
 }
 // Functions may be mutually recursive, but may only close over earlier bindings.
 const lines:string[]=['"use strict";','const output=[];'];
 const declared=new Set<string>();const finiteBindings=new Set<string>();
 for(const st of ast){
  if(st.kind==='fn'){if(declared.has(st.name)||st.name in builtins||['select','iterate'].includes(st.name))throw new Diagnostic(`Duplicate/reserved name ${st.name}`);if(st.params.some(p=>symbols.has(p)))throw new Diagnostic('Parameter shadows global name');if(new Set(st.params).size!==st.params.length)throw new Diagnostic('Duplicate parameter');declared.add(st.name);infer(st.body,new Set(st.params));lines.push(`function ${safe(st.name)}(${st.params.map(safe).join(',')}){rt.tick();return ${emit(st.body)};}`);types[st.name]={kind:'function'};continue;}
  if(st.kind==='emit'){infer(st.body,new Set());lines.push(`output.push(${emit(st.body)});`);continue;}
  if(declared.has(st.name)||symbols.has(st.name))throw new Diagnostic(`Duplicate/reserved name ${st.name}`);
  if(new Set(st.axes.map(a=>a.name)).size!==st.axes.length)throw new Diagnostic('Duplicate free index');
  const domains:Record<string,Expr[]>=Object.create(null),free=new Set(st.axes.map(a=>a.name));
  st.axes.forEach(a=>{if(symbols.has(a.name))throw new Diagnostic(`Index shadows binding ${a.name}`);if(a.size){infer(a.size,new Set());domains[a.name]=[a.size];}});
  const ts=terms(st.body),termIR:TermIR[]=[];
  for(const t of ts){const counts:Record<string,number>=Object.create(null);const indices=new Set(free);
   // Unknown identifiers inside subscripts are bound index variables. Simple
   // subscripts infer domains; shifted ones need an explicit free extent.
   walk(t.expression,e=>{if(e.kind==='index')e.indices.forEach((x,d)=>{walk(x,z=>{if(z.kind==='id'&&!symbols.has(z.name)){indices.add(z.name);counts[z.name]=(counts[z.name]??0)+1;}});if(x.kind==='id'&&indices.has(x.name)){(domains[x.name]??=[]).push(call('_extent',[e.base,lit(d)]));}});});
   walk(t.expression,e=>{if(e.kind==='call'&&e.name==='delta')for(const x of e.args)if(x.kind==='id'&&!symbols.has(x.name)){indices.add(x.name);counts[x.name]=(counts[x.name]??0)+1;}});
   const reduce=[...indices].filter(i=>!free.has(i));for(const i of reduce)if(counts[i]!==2)throw new Diagnostic(`Contracted index ${i} occurs ${counts[i]} times; expected two`);
   for(const i of free)if(!counts[i]&&!st.axes.find(a=>a.name===i)?.size)throw new Diagnostic(`Free index ${i} missing from term`);
   infer(t.expression,indices);termIR.push({...t,reduce});
  }
  for(const i of new Set([...free,...termIR.flatMap(t=>t.reduce)]))if(!domains[i]?.length)throw new Diagnostic(`Cannot infer extent of ${i}`);
  // Resolve static shape constraints before optimization.
  function known(e:Expr):number|undefined{if(e.kind==='literal'&&typeof e.value==='number')return e.value;if(e.kind==='call'&&e.name==='_extent'&&e.args[0].kind==='id'&&e.args[1].kind==='literal')return types[e.args[0].name]?.shape?.[Number(e.args[1].value)];return undefined;}
  for(const ds of Object.values(domains)){const ns=ds.map(known).filter((x):x is number=>x!==undefined);if(ns.some(n=>n<0||!Number.isSafeInteger(n))||ns.some(n=>n!==ns[0]))throw new Diagnostic('Static index extent mismatch');}
  const notes:string[]=[];
  if(optimize){for(const t of termIR){for(const k of [...t.reduce]){
   const factors:Expr[]=[];const flatten=(e:Expr)=>{if(e.kind==='binary'&&e.op==='*'){flatten(e.left);flatten(e.right);}else factors.push(e);};flatten(t.expression);
   const d=factors.findIndex(e=>e.kind==='call'&&e.name==='delta'&&e.args.length===2&&e.args.every(x=>x.kind==='id')&&e.args.some(x=>x.kind==='id'&&x.name===k)&&e.args.some(x=>x.kind==='id'&&free.has(x.name)));
   if(d>=0){const delta=factors[d] as Extract<Expr,{kind:'call'}>;const j=(delta.args.find(x=>x.kind==='id'&&x.name!==k) as {name:string}).name;
    // Only simplify a certified finite literal vector over equal static domains.
    const other=factors.find((_,q)=>q!==d);const nk=known(domains[k][0]),nj=known(domains[j][0]);
    if(factors.length!==2||!other||other.kind!=='index'||other.base.kind!=='id'||!finiteBindings.has(other.base.name)||other.indices.length!==1||other.indices[0].kind!=='id'||other.indices[0].name!==k||nk===undefined||nk!==nj)continue;
    factors.splice(d,1);t.expression=replace(factors.reduce((a,b)=>({kind:'binary',op:'*',left:a,right:b}),lit(1)),k,j);t.reduce=t.reduce.filter(x=>x!==k);notes.push(`delta elimination ${k} -> ${j}`);
   }
  }}if(termIR.some(t=>t.reduce.length))notes.push('fused scalar contraction / no product tensor');if(free.size)notes.push('lazy memoized tensor');}
  const localDomains=Object.entries(domains).map(([k,ds])=>`const d_${safe(st.name)}_${safe(k)}=rt.agree(${ds.map(emit).join(',')});`);
  lines.push(...localDomains);const bound=(k:string)=>`d_${safe(st.name)}_${safe(k)}`;
  const pieces=termIR.map(t=>{let x=emit(t.expression);for(const k of [...t.reduce].reverse())x=`rt.sum(${bound(k)},(${safe(k)})=>${x},${optimize})`;return `${t.sign<0?'-':'+'}(${x})`;});
  const tensorMode=free.size>0||termIR.some(t=>t.reduce.length)||Object.keys(domains).length>0;
  const value=tensorMode?`(${pieces.join('')})`:emit(st.body);
  lines.push(`const ${safe(st.name)}=${free.size?`rt.tensor([${st.axes.map(a=>bound(a.name)).join(',')}],(${st.axes.map(a=>safe(a.name)).join(',')})=>${value},${optimize})`:value};`);
  const type=free.size?{kind:'tensor',shape:st.axes.map(a=>known(domains[a.name][0])!).every(x=>x!==undefined)?st.axes.map(a=>known(domains[a.name][0])!):undefined}:infer(st.body,new Set(Object.keys(domains)));
  types[st.name]=type;ir.push({name:st.name,axes:st.axes,domains,terms:termIR,type,notes});optimizations.push(...notes.map(n=>`${st.name}: ${n}`));declared.add(st.name);symbols.add(st.name);
  const finiteLiteral=(e:Expr):boolean=>e.kind==='literal'?typeof e.value==='number'&&Number.isFinite(e.value):e.kind==='array'?e.items.every(finiteLiteral):e.kind==='unary'&&e.op==='-'?finiteLiteral(e.arg):false;
  if(st.body.kind==='array'&&finiteLiteral(st.body))finiteBindings.add(st.name);
 }
 lines.push(`return {output,functions:{${[...fns.keys()].map(n=>`${JSON.stringify(n)}:${safe(n)}`).join(',')}},bindings:{${[...declared].filter(n=>!fns.has(n)).map(n=>`${JSON.stringify(n)}:${safe(n)}`).join(',')}}};`);
 return {ast,ir,types,code:lines.join('\n'),optimizations};
}
