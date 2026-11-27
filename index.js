export { compile } from './compiler.js?v=9affb8c3414f';
export { parse, lex } from './parser.js?v=9affb8c3414f';
export { createRuntime, Tensor, plain } from './runtime.js?v=9affb8c3414f';
import { compile } from './compiler.js?v=9affb8c3414f';
import { createRuntime } from './runtime.js?v=9affb8c3414f';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
