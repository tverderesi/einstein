import {readdirSync,readFileSync} from 'node:fs';
import {run,plain} from '../src/index.ts';
let failed=0;for(const f of readdirSync('examples').filter(x=>x.endsWith('.ein'))){try{const s=readFileSync('examples/'+f,'utf8');const a=plain(run(s,{fuel:5000000}).output),b=plain(run(s,{optimize:false,fuel:5000000}).output);if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Optimized/naive mismatch');console.log('PASS',f,JSON.stringify(a).slice(0,150));}catch(e){failed++;console.error('FAIL',f,(e as Error).message);}}if(failed)process.exitCode=1;
