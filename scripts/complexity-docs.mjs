import {readFile,writeFile,readdir} from 'node:fs/promises';
import {exampleComplexities} from '../playground/complexity.js';
const heading='## Bundled reference programs',ending='The panel beside each bundled program';
let doc=await readFile('docs/COMPLEXITY.md','utf8');let table='| Program | Time | Live memory | Model / limitation |\n|---|---|---|---|\n';
for(const [name,c] of Object.entries(exampleComplexities))table+=`| ${name} | ${c.naiveTime?`${c.naiveTime} naive; ${c.time} optimized`:c.time} | ${c.memory} | ${c.notes} |\n`;
const start=doc.indexOf(heading)+heading.length,end=doc.indexOf(ending,start);if(start<heading.length||end<0)throw Error('Missing complexity table boundaries');doc=doc.slice(0,start)+'\n\n'+table+'\n'+doc.slice(end);await writeFile('docs/COMPLEXITY.md',doc);
for(const file of await readdir('examples')){if(!file.endsWith('.ein'))continue;const cost=exampleComplexities[file.slice(0,-4)];if(!cost)throw Error('Missing cost for '+file);let source=await readFile('examples/'+file,'utf8');source=source.replace(/^# Big O:.*\n# Memory:.*\n/,'');const time=cost.naiveTime?`${cost.naiveTime} naive; ${cost.time} optimized`:cost.time;await writeFile('examples/'+file,`# Big O: ${time}. Reference cost model: docs/COMPLEXITY.md\n# Memory: ${cost.memory}.\n`+source);}
