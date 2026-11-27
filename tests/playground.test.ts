import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
// Execute the actual browser worker module in a Node worker with a Web Worker
// message shim. This checks compilation, materialization, events and errors;
// it does not claim browser DOM or visual testing.
function worker(){return new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:m=>parentPort.postMessage(m)};import(${JSON.stringify(new URL('../dist/playground/worker.js',import.meta.url).href)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});}
function request(w:Worker,data:unknown):Promise<any>{return new Promise((resolve,reject)=>{const onError=(e:Error)=>{w.off('message',onMessage);reject(e);};const onMessage=(m:unknown)=>{w.off('error',onError);resolve(m);};w.once('message',onMessage);w.once('error',onError);w.postMessage(data);});}
test('actual playground worker compiles every example',async()=>{const w=worker();try{for(const name of readdirSync('examples').filter(n=>n.endsWith('.ein'))){const r=await request(w,{source:readFileSync('examples/'+name,'utf8'),optimize:true});assert.equal(r.type,'result',name+': '+r.message);assert.ok(r.execution>=0);}}finally{await w.terminate();}});
test('playground worker handles reactive events and compilation errors',async()=>{const w=worker();try{const r=await request(w,{source:readFileSync('examples/reactive.ein','utf8'),optimize:true});assert.equal(r.reactive,true);const event=await request(w,{type:'event',event:{increment:2,query:'euler'}});assert.deepEqual(event.view.items,['Euler']);assert.equal(event.view.count,2);const err=await request(w,{source:'emit unknown;',optimize:true});assert.equal(err.type,'error');assert.match(err.message,/Unbound/);}finally{await w.terminate();}});
