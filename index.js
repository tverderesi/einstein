export { compile } from './compiler.js';
export { parse, lex } from './parser.js';
export { createRuntime, Tensor, plain } from './runtime.js';
import { compile } from './compiler.js';
import { createRuntime } from './runtime.js';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
