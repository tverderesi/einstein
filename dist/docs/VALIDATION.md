# Validation report

Validated on 2026-11-27 with Node.js v24.22.3, Linux x64.

| Check | Observed result |
|---|---|
| `npm run check` | Build succeeded, 46 tests passed, all 17 examples passed naive/optimized differential execution |
| Generated standalone ES module | Matrix program compiled, imported with the runtime, and returned `[[[58,64],[139,154]]]` |
| Benchmark suite | Four kernels × three implementations, output assertions passed, 5 warm-ups / 15 timed runs; raw results recorded |
| Counter translation | Instruction cases checked over small configurations, transfer-loop termination, nonhalting fuel diagnostic, exact integer growth beyond 2^53 |
| Numerical checks | Randomized matrix products against ordinary JavaScript; exact FEM matrix; gradient tolerance; exhaustive Rule 110 truth table; Life glider translation after four generations |
| Worker integration | Actual playground worker tested with a Node Web Worker message shim, all examples and reactive/error messages passed |
| Published browser playground | Loaded on GitHub Pages; matrix tensor output, counter increment, search for Euler, conditional no-results message, SVG image, IR tab, and editor diagnostics directly observed |

Browser tests were manual tool-driven interactions, not a committed end-to-end browser test suite. They establish these observed paths, not all browser compatibility, accessibility, mobile layout, or security properties. Localhost was inaccessible from the remote browser; direct GitHub Pages testing subsequently succeeded. The language guide was opened on the live site, its LaTeX formula rendered through KaTeX, and its first runnable snippet produced Hello World. Animated Life was directly observed progressing to generation 127. Revised stable playback controls and pipe integration are checked separately after publication.

The build strips TypeScript types with Node's experimental built-in API; it does not perform a static `tsc` check. Semantic tests validate behavior, not type soundness. The proof is a mathematical reduction under stated ideal semantics, not a claim that testing proves universality.
