import {stripTypeScriptTypes} from 'node:module';
import {readdir,mkdir,readFile,writeFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of await readdir('src'))if(f.endsWith('.ts')){const s=await readFile('src/'+f,'utf8');await writeFile('dist/'+f.replace('.ts','.js'),stripTypeScriptTypes(s,{mode:'transform'}).replaceAll('.ts\'','.js\''));}await cp('playground','dist/playground',{recursive:true});await cp('examples','dist/examples',{recursive:true});console.log('Built compiler, runtime, CLI and playground in dist/');

await writeFile('dist/index.html','<!doctype html><meta charset="utf-8"><title>Einstein</title><meta http-equiv="refresh" content="0;url=./playground/"><a href="./playground/">Open Einstein playground</a>\n');await writeFile('dist/.nojekyll','');

await cp('docs','dist/docs',{recursive:true});await mkdir('dist/bench',{recursive:true});await cp('bench/RESULTS.md','dist/bench/RESULTS.md');await cp('bench/results.json','dist/bench/results.json');
