import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run,plain} from '../src/index.ts';
test('every practical-guide Einstein snippet compiles and executes',()=>{const md=readFileSync('docs/GUIDE.md','utf8');let n=0;for(const match of md.matchAll(/```einstein\n([\s\S]*?)```/g)){const r=run(match[1],{fuel:100000});plain(r.output);n++;}assert.ok(n>=15);});
