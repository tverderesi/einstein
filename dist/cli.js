#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { readFileSync, writeFileSync } from 'node:fs';
import { compile, run, plain } from './index.js?v=31a1a7e39894';
const [command, file, ...args] = process.argv.slice(2);
try {
    if (!file || ![
        'run',
        'compile',
        'inspect'
    ].includes(command)) throw Error('Usage: node src/cli.ts run|compile|inspect FILE [--naive] [--out FILE]');
    const source = readFileSync(file, 'utf8'), optimize = !args.includes('--naive');
    if (command === 'run') run(source, {
        optimize,
        fuel: 1000000
    }).output.forEach((v)=>console.log(typeof v === 'string' ? v : JSON.stringify(plain(v))));
    else {
        const c = compile(source, {
            optimize
        });
        const s = command === 'inspect' ? JSON.stringify(c.ir, null, 2) : `import {createRuntime} from './runtime.js?v=31a1a7e39894';\nconst rt=createRuntime();\nconst result=(()=>{${c.code}\n})();\nexport default result;\n`;
        const oi = args.indexOf('--out');
        if (oi >= 0) writeFileSync(args[oi + 1], s);
        else console.log(s);
    }
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
}
