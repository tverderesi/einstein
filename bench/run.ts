import {performance} from 'node:perf_hooks';
import {cpus,platform,arch} from 'node:os';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {compile,createRuntime,plain} from '../src/index.ts';
const samples=15,warmup=5;
function measure(f:()=>unknown){for(let i=0;i<warmup;i++)f();const times:number[]=[];let checksum='';for(let i=0;i<samples;i++){const t=performance.now();const v=f();times.push(performance.now()-t);checksum=JSON.stringify(v);}times.sort((a,b)=>a-b);return {median_ms:times[Math.floor(samples/2)],min_ms:times[0],max_ms:times.at(-1),checksum_bytes:checksum.length};}
function executable(source:string,optimize:boolean){const c=compile(source,{optimize}),f=new Function('rt',c.code);return ()=>plain(f(createRuntime()).output);}
const rows:any[]=[];
function bench(name:string,source:string,baseline:()=>unknown,dimensions:string){const opt=executable(source,true),naive=executable(source,false),expected=baseline();assert.deepEqual(opt(),expected);assert.deepEqual(naive(),expected);for(const [implementation,f] of [['javascript',baseline],['naive',naive],['optimized',opt]] as const)rows.push({name,dimensions,implementation,...measure(f)});}
const n=96,A=Array.from({length:n},(_,i)=>(i%17)-8);
bench('delta-copy',`let A=${JSON.stringify(A)};let B[i:${n}]=delta(i,k)*A[k];emit B;`,()=>[[...A]],`${n} entries`);
const m=20,MA=Array.from({length:m},(_,i)=>Array.from({length:m},(_,j)=>(i+j)%7-3)),MB=MA.map(r=>[...r].reverse());
bench('matrix-product',`let A=${JSON.stringify(MA)};let B=${JSON.stringify(MB)};let C[i,j]=A[i,k]*B[k,j];emit C;`,()=>[MA.map(row=>Array.from({length:m},(_,j)=>{let s=0;for(let k=0;k<m;k++)s+=row[k]*MB[k][j];return s;}))],`${m} x ${m}`);
const v=Array.from({length:300},(_,i)=>i%11),w=v.map(x=>x-5);
bench('dot-product',`let A=${JSON.stringify(v)};let B=${JSON.stringify(w)};let dot=A[i]*B[i];emit dot;`,()=>[v.reduce((s,x,i)=>s+x*w[i],0)],'300 entries');
const sparse=Array.from({length:120},(_,i)=>i===93?7:0);
bench('sparse-dot',`let A=${JSON.stringify(sparse)};let dot=A[i]*A[i];emit dot;`,()=>[sparse.reduce((s,x)=>s+x*x,0)],'120 entries, 1 nonzero');
// Compile time is measured separately; execution excludes parsing/code generation,
// includes runtime creation, literal allocation, and full output materialization.
const compileTimes=measure(()=>compile(`let A=${JSON.stringify(MA)};let B=${JSON.stringify(MB)};let C[i,j]=A[i,k]*B[k,j];emit C;`).code.length);
const report={timestamp:new Date().toISOString(),node:process.version,platform:platform(),arch:arch(),cpu:cpus()[0]?.model,cpu_count:cpus().length,warmup,samples,protocol:'5 warm-ups, 15 independent executions per implementation; median/min/max wall time. Compile and new Function excluded, runtime/literals/materialization included. JS baseline uses resident input arrays; not allocation-matched. Fixed implementation order; no confidence interval or isolation. All outputs checked before timing.',compile:compileTimes,results:rows};
writeFileSync('bench/results.json',JSON.stringify(report,null,2)+'\n');
let md='# Measured benchmark results\n\n'+`Node ${report.node}; ${report.cpu}; ${report.platform}/${report.arch}; ${report.timestamp}.\n\n${report.protocol}\n\n`+'| Kernel | Size | Implementation | Median ms | Min ms | Max ms |\n|---|---|---|---:|---:|---:|\n';for(const r of rows)md+=`| ${r.name} | ${r.dimensions} | ${r.implementation} | ${r.median_ms.toFixed(6)} | ${r.min_ms.toFixed(6)} | ${r.max_ms.toFixed(6)} |\n`;md+=`\nMatrix example compile median: ${compileTimes.median_ms.toFixed(6)} ms.\n\nThese are microbenchmarks of this prototype, not a comparison with mature array compilers. Sparse storage currently saves representation space but does not skip zero iterations.\n`;writeFileSync('bench/RESULTS.md',md);console.log(md);
