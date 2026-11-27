export { compile } from './compiler.js?v=31a1a7e39894';
export { parse, lex } from './parser.js?v=31a1a7e39894';
export { createRuntime, Tensor, plain } from './runtime.js?v=31a1a7e39894';
import { compile } from './compiler.js?v=31a1a7e39894';
import { createRuntime } from './runtime.js?v=31a1a7e39894';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
