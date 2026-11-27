import {stripTypeScriptTypes} from 'node:module';
import {readdir,mkdir,readFile,writeFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const f of await readdir('src'))if(f.endsWith('.ts')){const s=await readFile('src/'+f,'utf8');await writeFile('dist/'+f.replace('.ts','.js'),stripTypeScriptTypes(s,{mode:'transform'}).replaceAll('.ts\'','.js\''));}await cp('playground','dist/playground',{recursive:true});await cp('examples','dist/examples',{recursive:true});console.log('Built compiler, runtime, CLI and playground in dist/');
