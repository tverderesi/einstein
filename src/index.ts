export {compile} from './compiler.ts';
export {parse,lex} from './parser.ts';
export {createRuntime,Tensor,plain} from './runtime.ts';
import {compile} from './compiler.ts';
import {createRuntime} from './runtime.ts';
export function run(source:string,options:{optimize?:boolean;fuel?:number}={}){const compilation=compile(source,options);const runtime=createRuntime(options);const result=new Function('rt',compilation.code)(runtime);return {...result,compilation};}
