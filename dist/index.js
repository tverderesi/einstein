export { compile } from './compiler.js?v=62a061ace6d6';
export { parse, lex } from './parser.js?v=62a061ace6d6';
export { createRuntime, Tensor, plain } from './runtime.js?v=62a061ace6d6';
import { compile } from './compiler.js?v=62a061ace6d6';
import { createRuntime } from './runtime.js?v=62a061ace6d6';
export function run(source, options = {}) {
    const compilation = compile(source, options);
    const runtime = createRuntime(options);
    const result = new Function('rt', compilation.code)(runtime);
    return {
        ...result,
        compilation
    };
}
