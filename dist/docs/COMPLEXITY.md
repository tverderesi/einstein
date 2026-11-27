# Big O: the cost of unnecessary elegance

These are analytical bounds for the implemented operations and bundled reference programs. They describe growth with input size, not milliseconds, and are not inferred automatically for arbitrary editor contents. The examples use small fixed inputs; the bounds describe the same algorithms with corresponding dimensions generalized.

## Cost model

Unless noted otherwise, count fixed-precision scalar operations, fixed-rank tensor accesses, and amortized constant-time map operations. A rank-r checked access or coordinate-key construction also has rank-dependent cost; treating r as fixed suppresses it. A cold shape validation can scan the whole input, while subsequent reads use cached shapes for frozen arrays. Coordinate formatting/hashing is treated as constant per machine-word coordinate; a character-level model must restore key-length costs. Parameters such as n mean the numeric value or number of entries, not the number of bits used to encode that parameter.

Memory bounds count live value slots, including input/output where specified, not garbage waiting for collection or the source/compiled-code text. Decimal strings and BigInt bit lengths are additional dimensions; they are called out rather than pretending every number occupies one word. Output serialization and DOM work must be counted when timing the whole playground.

The existing benchmark suite measures a few concrete sizes. It does not experimentally establish these asymptotic bounds.

## Core operations

| Operation | Time | Additional live space | Conditions |
|---|---|---|---|
| Fixed-precision arithmetic, scalar `mask` or `delta` | O(1) | O(1) | Fixed-size scalar values; no tensor allocation implied |
| Checked tensor access | O(r) after shape caching | O(r) temporary coordinates | Constant when rank r is fixed; first array-shape validation may scan N values |
| Literal construction / shape validation | O(N) for fixed rank | O(N) peak | Even a sparse literal is initially emitted as N source values and scanned |
| Sparse numeric storage after construction | Dense reductions still traverse their full domain | O(z) retained numeric entries | z nonzero entries, fixed rank; peak construction memory remains O(N) |
| Pointwise equation over N entries | O(N C) when fully demanded | O(N) memoized output | C is the scalar body cost; fewer demanded entries can reduce work |
| Dot product of length n | O(n) | O(1) optimized, O(n) naive | Excludes already resident inputs; naive reduction builds a term array |
| Matrix product m×k by k×n | O(mkn) | O(mn) output; naive adds O(k) reduction workspace | Includes input storage separately as O(mk+kn); positive dimensions |
| Lazy `select(p,a,b)` | Cost(p) + cost(selected arm) | Depends on selected arm | The other arm is not evaluated; selection does not multiply eager masks |
| Pipe application | Cost(x) + cost(args) + cost(f application) | Depends on called function | The pipe does not itself map over x |
| `tabulate(n,f)` / `grid(r,c,f)` | O(1) construction at fixed rank; O(N C_f) full demand | O(D) memo entries after D demands | Metadata setup excludes function arguments; N is n or rc |
| `realize(tensor)` | O(N) reads plus uncached element work | O(N) materialized values | Discards the dependency chain only when earlier lazy objects become unreachable |
| `iterate(s,F,H)` for T transitions | Sum of transition costs and T+1 stop tests | Live state + temporary next state | Retained history and growing exact numbers change the bound; divergence has no finite T |
| `str` / `join` / text rendering | Includes number conversion and output length | Includes output length | Not constant-time just because it is one builtin call |

For nested naive reductions with dimensions d₁…dᵣ, simultaneously live reduction-term arrays require O(d₁+…+dᵣ) slots along the active recursion path, rather than an allocated product tensor of size ∏d. This is in addition to input, output, intermediate tensors, and scalar-body workspace.

## Reading cost from an index equation

Let the free-index domain contain F output coordinates and the contracted-index domain contain C combinations. If the scalar body costs B, full evaluation of one term takes:

\[
O(F C B),\qquad
F=\prod_{i\in\mathrm{free}}d_i,\qquad
C=\prod_{j\in\mathrm{contracted}}d_j.
\]

Add the bounds of separate additive terms. This is a bound for the current direct contraction schedule, not the best possible algebraic algorithm. Shape discovery, input construction, and demanded named intermediates add their own costs. Memoized intermediate cells are charged when first evaluated; repeated reads do not recompute their body.

For `C[i,j]=A[i,k]*B[k,j]`, F=mn and C=k, giving O(mnk). For a scalar dot product, F=1 and C=n, giving O(n). Free indices describe how many outputs exist; dummy indices describe how much work each output performs.

## Symbolic simplification changes the algorithm

The bundled delta copy is an instructive case:

\[
y_i=\sum_{k=0}^{n-1}\delta_{ik}x_k.
\]

The naive implementation evaluates n outputs with n terms each: O(n²). In the certified finite-vector case, the optimizer replaces each contraction with a direct read, giving O(n) work for all outputs. Neither result is O(1) for the whole displayed vector: constructing and displaying n values is linear.

Sparse representation does not currently cause zero-skipping iteration. A sparse dot product is still O(n), even if only z≪n entries are nonzero. The stored representation and the iteration schedule are different concerns.

## Bundled reference programs

| Program | Time | Live memory | Model / limitation |
|---|---|---|---|
| hello | O(L) | O(L) | L is the emitted text length; includes presenting the output. |
| fizzbuzz | O(n) scalar steps + O(output characters) | O(n) output slots + output characters | n entries. Decimal number strings contribute up to O(n log n) characters. |
| factorial | O(n) exact multiplications; at most O(n M(B)) bit work | O(B) live integer bits | B = O(n log n) bits in n!; M(B) bounds a multiplication of at most B-bit integers. Text conversion is additional. |
| fibonacci | O(n) additions; O(n²) bit work with linear-time addition | O(n) live integer bits | The nth Fibonacci number has Θ(n) bits. This is an iterative state recurrence, not the exponential recursive algorithm. |
| primes | O(n√n) trial-division steps (upper bound) | O(n) output slots + O(√n) stack + text | Tests every integer up to n by trial division; numeric string storage is counted separately. |
| sorting | O(n²) | O(n) value slots | Stable rank computation and delta-based placement both scan pairs. This is not comparison-sort O(n log n). |
| palindrome | O(n) | O(n) including the input | For length n: optimized reduction adds O(1) workspace; naive reduction materializes O(n) terms. |
| binary-search | Search O(log n); whole run O(n) | Search O(1); input O(n) | The array is already sorted. Constructing its literal input is linear even though searching it is logarithmic. |
| matmul | O(mkn) | O(mk + kn + mn) | A is m×k and B is k×n; includes both inputs and the fully demanded output. No Strassen algorithm or BLAS backend. |
| gradient-descent | O(T) | O(1) live scalar state | T scalar updates. For this quadratic and fixed step, real-arithmetic convergence needs O(log(1/ε)) updates; floating-point stagnation can invalidate that tolerance claim. |
| fem | O(E q² N + E q N²) | O(E q N + q² + N²) | E elements, q local DOFs, N global DOFs. Counts this dense incidence contraction and its intermediate; sparse scatter assembly is a different algorithm. |
| rule110 | O(W · 3^T) | O(W T + T) | W cells and T time rows. Each cell recursively recomputes three predecessor trees. Only grid outputs are memoized. A staged implementation could use O(W T) work. |
| life | O(N) per generation; O(GN) for G generations | O(N) live board and rendering data | N is the number of cells. Each cell reads eight neighbors. Realization prevents retaining all past board closures; the host redraw is also linear. |
| delta | O(n²) naive; O(n) optimized | O(n) | For the bundled finite literal vector, optimization removes the dummy axis. Both modes still construct n inputs and display n outputs. |
| reactive | Counter update O(1); search/render O(n · C_match) | O(n) result slots + text | n names; C_match includes case normalization and substring matching. String lengths and the JavaScript matching algorithm matter. |
| svg | O(n) | O(n) | n fixed-precision points, including materialization and polyline creation. |
| pipes | O(Σ C_stage); example O(n + output characters) | Stage-dependent; example O(n + output characters) | A pipe introduces ordinary function application, not an implicit array traversal. The example tabulates n labels and joins them. |

The panel beside each bundled program shows the same reference bounds. Editing the source clears that estimate; general automatic complexity analysis is not implemented. Function recursion, data-dependent termination, growing numbers, and algebraic rewrites prevent a reliable blanket inference from syntax alone.

## Exact arithmetic is not unit-cost arithmetic

Factorial performs n multiplications, but its final result has B=Θ(n log n) bits. If M(B) upper-bounds multiplication of two integers of at most B bits, a conservative arithmetic bound is O(n M(B)), with O(B) live integer bits. Multiplication by a small loop counter can be cheaper than general B-by-B multiplication; the bound deliberately does not claim JavaScript uses a particular multiplication algorithm.

The iterative Fibonacci example makes O(n) additions, but its operands grow to Θ(n) bits. Under a linear-time bit-addition model:

\[
\sum_{k=1}^{n}O(k)=O(n^2)
\]

bit work is required, with O(n) live bits. Printing the exact answer costs additional conversion and output work. Calling these programs simply “O(n) time and O(1) space” would hide the thing that actually grows.

## The expensive examples are deliberately exposed

The Rule 110 demonstration uses `value(t,i)` recursively without memoizing function calls. Each call above t=0 evaluates three predecessor calls:

\[
C(t)=3C(t-1)+O(1)=\Theta(3^t).
\]

Evaluating W cells across T history rows therefore takes O(W3^T) work, with O(WT) stored history and O(T) stack. Memoizing the outer grid does not memoize all recursive `value` calls. A conventional generation-by-generation automaton would take O(WT) time and O(W) live board space when history is discarded. The included Life example uses that staged-state approach, with O(N) work per generation for N cells.

The FEM example similarly uses a dense incidence formulation. With E elements, q local DOFs and N global DOFs:

\[
Q_{eaj}=\sum_b k_{ab}P_{ebj},\qquad
K_{ij}=\sum_{e,a}P_{eai}Q_{eaj},
\]

so the two stages require O(Eq²N) and O(EqN²) work. A local scatter assembler can accumulate O(Eq²) element contributions; materializing a dense global matrix also needs O(N²) storage/initialization. Those are different implementations of the same assembly relation. This compiler does not yet discover the scatter schedule from sparse incidence structure.

## Search, strings, and stopping times

Binary search performs O(log n) comparisons on an already resident sorted array, with constant-size search state. Its whole bundled run still constructs an n-entry literal, making total input-plus-search work O(n). Sorting the input first would be another cost.

String search depends on both the number of names and their lengths. The reactive example normalizes case and calls JavaScript substring matching for each candidate. Its useful bound is O(n C_match), where C_match includes normalization and matching of a candidate and query. No specific substring-search algorithm is promised by this project.

Gradient descent takes O(T) scalar work for T updates in the one-dimensional example. For its quadratic and fixed convergent step, ideal real-arithmetic T is O(log(1/ε)) for a fixed initial error. Floating-point stagnation, different objectives, or an inappropriate step size invalidate that simplified stopping bound.

`iterate` has no fixed upper bound on T in general. Turing completeness is not a promise of a pleasant complexity class.

## How to compare with measurements

Use [benchmarks](../bench/RESULTS.md) for recorded wall times and the [optimization notes](OPTIMIZATION.md) for what is implemented. Big O suppresses constant factors, input sizes, cache effects, allocation costs, and engine optimizations. Two O(n) routines can differ enormously on a small input; an O(n²) routine can also win at sufficiently small sizes. Neither observation changes its asymptotic bound.
