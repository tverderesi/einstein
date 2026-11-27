import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import {readdir,mkdir,readFile,writeFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of await readdir('src'))if(f.endsWith('.ts')){const s=await readFile('src/'+f,'utf8');await writeFile('dist/'+f.replace('.ts','.js'),stripTypeScriptTypes(s,{mode:'transform'}).replaceAll('.ts\'','.js\''));}await cp('playground','dist/playground',{recursive:true});await cp('examples','dist/examples',{recursive:true});console.log('Built compiler, runtime, CLI and playground in dist/');

await writeFile('dist/index.html','<!doctype html><meta charset="utf-8"><title>Einstein</title><meta http-equiv="refresh" content="0;url=./playground/"><a href="./playground/">Open Einstein playground</a>\n');await writeFile('dist/.nojekyll','');

await cp('docs','dist/docs',{recursive:true});await mkdir('dist/bench',{recursive:true});await cp('bench/RESULTS.md','dist/bench/RESULTS.md');await cp('bench/results.json','dist/bench/results.json');

// Version all transitive browser modules, not just the entry point: otherwise a
// cached compiler/runtime can disagree with a newly deployed worker protocol.
const modulePaths=[];for(const dir of ['dist','dist/playground'])for(const name of (await readdir(dir)).sort())if(name.endsWith('.js'))modulePaths.push(dir+'/'+name);
const versionHash=createHash('sha256');for(const path of modulePaths)versionHash.update(await readFile(path));versionHash.update(await readFile('playground/style.css'));const appVersion=versionHash.digest('hex').slice(0,12);
for(const path of modulePaths){const js=await readFile(path,'utf8');await writeFile(path,js.replace(/from (['"])(\.{1,2}\/[^'"]+\.js)\1/g,(_,quote,spec)=>`from ${quote}${spec}?v=${appVersion}${quote}`));}
const html=await readFile('dist/playground/index.html','utf8');await writeFile('dist/playground/index.html',html.replace('src="app.js"',`src="app.js?v=${appVersion}"`).replace('href="style.css"',`href="style.css?v=${appVersion}"`));
