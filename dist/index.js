export { compile } from './compiler.js?v=0433d9b07186';
export { parse, lex } from './parser.js?v=0433d9b07186';
export { createRuntime, Tensor, plain } from './runtime.js?v=0433d9b07186';
import { compile } from './compiler.js?v=0433d9b07186';
import { createRuntime } from './runtime.js?v=0433d9b07186';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
