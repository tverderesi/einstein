export { compile } from './compiler.js?v=66f6d7376a10';
export { parse, lex } from './parser.js?v=66f6d7376a10';
export { createRuntime, Tensor, plain } from './runtime.js?v=66f6d7376a10';
import { compile } from './compiler.js?v=66f6d7376a10';
import { createRuntime } from './runtime.js?v=66f6d7376a10';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
