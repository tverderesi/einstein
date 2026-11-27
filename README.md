# Einstein

**Overcomplicating Things: Making Einstein Summation Notation Turing Complete**

An experimental functional language with inferred tensor contractions, exact integer recurrence, and an unnecessarily serious attitude toward dropdown menus.

```einstein
let A = [[1, 2, 3], [4, 5, 6]];
let B = [[7, 8], [9, 10], [11, 12]];
let C[i, j] = A[i, k] * B[k, j];
emit C;
```

## Run

Requires Node.js 24 or newer. No third-party packages or installation step.

```sh
npm run build
npm test
npm run examples
node src/cli.ts run examples/matmul.ein
node src/cli.ts inspect examples/matmul.ein
node dist/cli.js compile examples/matmul.ein --out dist/matmul.js
node -e "import('./dist/matmul.js').then(x=>console.log(JSON.stringify(x.default.output)))"
npm run bench
npm run playground
```

Use `--naive` for eager tensor equations and array-backed reduction temporaries. Generated modules should be placed alongside `dist/runtime.js`, or have their runtime import adjusted.

## Status

Version 0.1 is a working experimental compiler, not a mature general-purpose language. The first implementation includes a lexer/parser, AST, partial type and shape inference, index validation, contraction IR, JavaScript code generation, runtime, CLI, 17 executable examples, 46 automated tests, and recorded microbenchmarks. The browser playground, formal specification, universality reduction, architecture, and finished article are included. The published playground has been checked in a browser; see the validation report.

Universality requires the added unbounded recurrence and exact natural-number operations. Finite tensor contractions alone are not Turing complete. `src/counter-machine.ts` translates two-counter machines into ordinary Einstein source; it adds no privileged execution primitive.

Tensor equations use numeric scalars. Strings and records are supported by ordinary expressions, functions, and `tabulate`/`grid`. Function types are partially inferred; unresolved types and dynamic extents are checked at execution or remain unknown. This is not Hindley–Milner inference.

MIT licensed. See [LICENSE](LICENSE).

## Read and explore

- [Practical language guide](docs/GUIDE.md)
- [Finished article](docs/ARTICLE.md)
- [Language specification](docs/SPECIFICATION.md)
- [Universality proof](docs/UNIVERSALITY.md)
- [Architecture and trade-offs](docs/ARCHITECTURE.md)
- [Optimization investigation](docs/OPTIMIZATION.md)
- [Measured benchmarks](bench/RESULTS.md)
- [Related work](docs/RELATED_WORK.md)
- [Validation report](docs/VALIDATION.md)
- [GitHub Pages setup](docs/PAGES.md)

[Open the live playground and project reader](https://tverderesi.github.io/einstein/playground/). The `gh-pages` branch holds the static site. `npm run playground` serves the same build locally. The UI includes a highlighted editor, JavaScript/IR views, console, tensors, timing, reactive counter/search, conditional messages, and SVG output. Reading views include the article, specification, proof, architecture, optimizations and benchmark tables, with runnable article snippets. React integration is a documented stretch design.

The documentation reader uses KaTeX 0.19.1 from jsDelivr with integrity checks for mathematical typesetting. The compiler/runtime and build still need no third-party packages. If the CDN is unavailable, formulas remain available as LaTeX source. Life is a reactive, continuously evolving 16×16 glider simulation with Play/Pause, Step, Reset, and a generation counter.
