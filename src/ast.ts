export type Expr = {kind:'literal'; value:number|string|boolean; nat?:boolean} | {kind:'id';name:string} | {kind:'array';items:Expr[]} | {kind:'record';fields:[string,Expr][]} | {kind:'field';base:Expr;name:string} | {kind:'index';base:Expr;indices:Expr[]} | {kind:'call';name:string;args:Expr[]} | {kind:'binary';op:string;left:Expr;right:Expr} | {kind:'unary';op:string;arg:Expr};
export type Axis = {name:string;size?:Expr};
export type Statement = {kind:'fn';name:string;params:string[];body:Expr} | {kind:'let';name:string;axes:Axis[];body:Expr} | {kind:'emit';body:Expr};
export type Program = Statement[];
export type Token = {text:string;offset:number};
export class Diagnostic extends Error { offset?:number; constructor(message:string, offset?:number){super(message+(offset===undefined?'':` at offset ${offset}`));this.name='EinsteinError';this.offset=offset;} }
