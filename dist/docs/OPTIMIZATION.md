# Optimization investigation

| Requested area | Implemented behavior | Practical limit |
|---|---|---|
| Kronecker delta simplification | Eliminate one dummy axis for equal-size, certified finite literal vector identity contractions | Static equal extents and simple two-factor product only |
| Sparse inference | Detect numeric literals below one-third nonzero density; coordinate map storage | No zero-skipping contraction traversal |
| Symbolic contraction | Restricted identity-contraction rewrite, explicit free/dummy domains | No contraction-order search, general factorization, or CAS |
| Lazy evaluation | Memoize individual equation cells on demand | Builtin tabulate/grid are lazy in both modes; recursive functions themselves are not memoized |
| Operation fusion | Compute products and masks directly inside reduction callbacks | No cross-binding producer fusion |
| Intermediate tensor elimination | Avoid allocating within-expression product tensors and optimized reduction-term arrays | Named intermediate tensors remain; no global elimination pass |
| Parallelization | Dependency and floating-reduction analysis documented | No worker pool, SIMD, GPU, or actual parallel compiler backend |

These are deliberately modest optimizations. Their correctness domain is in the specification. In particular, a rectangular delta is not a promise of equal dimensions; a scalar zero is not an IEEE annihilator for Infinity/NaN. The rewrite declines cases it cannot certify.

Run `npm run bench` to regenerate `bench/results.json` and `bench/RESULTS.md`. Results include naive Einstein, optimized Einstein, and handwritten JavaScript baselines with pre-timing output checks. The suite is small and noisy. It cannot substantiate a broad performance claim about the language or a comparison with production tensor compilers.

The best next performance change would be specialized generated dense loops over flat numeric buffers, hoisting checked extents and offset arithmetic outside inner loops. This is an engineering recommendation, not an implemented result. It would preserve index-equation semantics: execution by loops is a backend choice, while the surface language specifies domains, projections, and reductions.
