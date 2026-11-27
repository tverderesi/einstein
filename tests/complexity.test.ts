import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {exampleComplexities,complexityFor} from '../playground/complexity.js';
import {compile} from '../src/index.ts';

test('each executable reference example has explicit time and memory costs',()=>{
 const names=readdirSync('examples').filter(n=>n.endsWith('.ein')).map(n=>n.slice(0,-4)).sort();
 assert.deepEqual(Object.keys(exampleComplexities).sort(),names);
 for(const name of names){const c=complexityFor(name);assert.ok(c?.time&&c.memory&&c.notes,name);}
});

test('delta cost distinction matches the generated reduction schedules',()=>{
 const source=readFileSync('examples/delta.ein','utf8');
 const optimized=compile(source).ir.find(b=>b.name==='copied')!;
 const naive=compile(source,{optimize:false}).ir.find(b=>b.name==='copied')!;
 assert.equal(optimized.axes.length,1);assert.deepEqual(optimized.terms[0].reduce,[]);
 assert.equal(naive.axes.length,1);assert.equal(naive.terms[0].reduce.length,1);
 assert.equal(complexityFor('delta')?.time,'O(n)');
 assert.equal(complexityFor('delta',false)?.time,'O(n²)');
});
