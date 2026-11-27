# Measured benchmark results

Node v24.22.3; AMD EPYC 9V74 80-Core Processor; linux/x64; 2026-11-27T04:45:19.282Z.

5 warm-ups, 15 independent executions per implementation; median/min/max wall time. Compile and new Function excluded, runtime/literals/materialization included. JS baseline uses resident input arrays; not allocation-matched. Fixed implementation order; no confidence interval or isolation. All outputs checked before timing.

| Kernel | Size | Implementation | Median ms | Min ms | Max ms |
|---|---|---|---:|---:|---:|
| delta-copy | 96 entries | javascript | 0.000300 | 0.000241 | 0.003625 |
| delta-copy | 96 entries | naive | 0.982680 | 0.953465 | 1.243713 |
| delta-copy | 96 entries | optimized | 0.059059 | 0.053550 | 0.157647 |
| matrix-product | 20 x 20 | javascript | 0.030926 | 0.030235 | 0.036706 |
| matrix-product | 20 x 20 | naive | 2.185470 | 2.057417 | 2.552462 |
| matrix-product | 20 x 20 | optimized | 1.507310 | 1.430523 | 1.755603 |
| dot-product | 300 entries | javascript | 0.007682 | 0.002454 | 0.016785 |
| dot-product | 300 entries | naive | 0.199901 | 0.197548 | 0.429897 |
| dot-product | 300 entries | optimized | 0.209947 | 0.191979 | 0.357858 |
| sparse-dot | 120 entries, 1 nonzero | javascript | 0.001993 | 0.001913 | 0.005468 |
| sparse-dot | 120 entries, 1 nonzero | naive | 0.056616 | 0.053851 | 0.091107 |
| sparse-dot | 120 entries, 1 nonzero | optimized | 0.039881 | 0.038498 | 0.193000 |

Matrix example compile median: 0.886435 ms.

These are microbenchmarks of this prototype, not a comparison with mature array compilers. Sparse storage currently saves representation space but does not skip zero iterations.
