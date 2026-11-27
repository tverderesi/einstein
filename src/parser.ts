import {Diagnostic} from './ast.ts';
import type {Expr,Token,Program,Axis} from './ast.ts';
export function lex(source:string):Token[]{
 const out:Token[]=[]; const re=/\s+|#[^\n]*|\/\/[^\n]*|"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?|[A-Za-z_][A-Za-z_0-9]*|==|!=|<=|>=|&&|\|>|\|\||[+*\/%<>=!\-()[\]{},:;.]/gy;
 let at=0;while(at<source.length){re.lastIndex=at;const m=re.exec(source);if(!m)throw new Diagnostic('Unexpected character',at);if(!/^\s|^#|^\/\//.test(m[0]))out.push({text:m[0],offset:at});at=re.lastIndex;}out.push({text:'<eof>',offset:at});return out;
}
const precedence:Record<string,number>={'|>':0.5,'||':1,'&&':2,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
export function parse(source:string):Program{
 const ts=lex(source);let p=0;const peek=()=>ts[p].text;const take=()=>ts[p++].text;
 const expect=(s:string)=>{if(peek()!==s)throw new Diagnostic(`Expected ${s}, got ${peek()}`,ts[p].offset);take();};
 const ident=()=>{const s=take();if(!/^[A-Za-z_]\w*$/.test(s))throw new Diagnostic('Expected identifier',ts[p-1].offset);return s;};
 function list<T>(end:string,f:()=>T):T[]{const a:T[]=[];if(peek()!==end){a.push(f());while(peek()===','){take();a.push(f());}}expect(end);return a;}
 function expr(min=0):Expr{
  let e:Expr;const t=take();
  if(t==='-'||t==='!')e={kind:'unary',op:t,arg:expr(7)};
  else if(t==='('){e=expr();expect(')');}
  else if(t==='[')e={kind:'array',items:list(']',()=>expr())};
  else if(t==='{')e={kind:'record',fields:list('}',()=>{const k=ident();expect(':');return [k,expr()] as [string,Expr];})};
  else if(t.startsWith('"')){try{e={kind:'literal',value:JSON.parse(t)};}catch{throw new Diagnostic('Invalid string');}}
  else if(/^\d/.test(t))e={kind:'literal',value:t.endsWith('n')?t.slice(0,-1):Number(t),nat:t.endsWith('n')};
  else if(t==='true'||t==='false')e={kind:'literal',value:t==='true'};
  else if(/^[A-Za-z_]\w*$/.test(t))e={kind:'id',name:t};else throw new Diagnostic(`Expected expression, got ${t}`,ts[p-1].offset);
  while(true){if(peek()==='('){if(e.kind!=='id')throw new Diagnostic('Only named functions can be called');take();e={kind:'call',name:e.name,args:list(')',()=>expr())};}
   else if(peek()==='['){take();e={kind:'index',base:e,indices:list(']',()=>expr())};}
   else if(peek()==='.'){take();e={kind:'field',base:e,name:ident()};}else break;}
  while((precedence[peek()]??0)>min){const op=take();const right=expr(precedence[op]);if(op==='|>'){if(right.kind==='id')e={kind:'call',name:right.name,args:[e]};else if(right.kind==='call')e={kind:'call',name:right.name,args:[e,...right.args]};else throw new Diagnostic('Pipe target must be a named function or call',ts[p-1].offset);}else e={kind:'binary',op,left:e,right};}return e;
 }
 const out:Program=[];while(peek()!=='<eof>'){
  const tag=take();if(tag==='fn'){const name=ident();expect('(');const params=list(')',ident);expect('=');out.push({kind:'fn',name,params,body:expr()});}
  else if(tag==='let'){const name=ident();let axes:Axis[]=[];if(peek()==='['){take();axes=list(']',()=>{const name=ident();let size:Expr|undefined;if(peek()===':'){take();size=expr();}return {name,size};});}expect('=');out.push({kind:'let',name,axes,body:expr()});}
  else if(tag==='emit')out.push({kind:'emit',body:expr()});else throw new Diagnostic(`Expected fn, let or emit, got ${tag}`,ts[p-1].offset);expect(';');
 }return out;
}
