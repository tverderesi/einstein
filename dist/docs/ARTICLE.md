# Overcomplicating Things: Making Einstein Summation Notation Turing Complete

### An unnecessarily elaborate approach to general-purpose computing through tensor contractions.

> “Einstein summation notation has successfully described physical phenomena for over a century. Unfortunately, it cannot render a dropdown menu. This article proposes an extension to address this deeply unimportant limitation.”

## Abstract

We present Einstein, an experimental functional programming language combining finite index equations, inferred contraction domains, immutable structured values, and unbounded state recurrence. A TypeScript compiler lowers the language to JavaScript. The accompanying implementation includes a CLI, a browser playground, numerical and general-purpose examples, automated tests, and measured benchmarks. We establish universality of the ideal extended language by an effective reduction from deterministic two-counter machines. We do not establish universality of finite tensor algebra, superior performance, or a compelling reason to undertake this work. The first is false, the second is contradicted by measurements, and the third is outside the scope of the grant proposal.

## 1. A notation with an unfortunate lack of menus

An index equation can encode a substantial computation in a small space:

\[
C_{ij}=A_{ik}B_{kj}.
\]

The free indices i and j describe the result's coordinates. The repeated index k describes a reduction. With finite compatible arrays, this is matrix multiplication. Written as Einstein source:

```einstein
let A = [[1, 2, 3], [4, 5, 6]];
let B = [[7, 8], [9, 10], [11, 12]];
let C[i, j] = A[i, k] * B[k, j];
emit C;
```

The actual output is `[[58,64],[139,154]]`. Run it with:

```sh
node src/cli.ts run examples/matmul.ein
```

This syntax specifies domains, projections, and reductions, rather than making the programmer write loop counters or mutation. The backend still needs an execution strategy, often loops. A tensor compiler does not become fraudulent merely because a processor eventually increments a register.

The restriction is mathematical rather than aesthetic: a fixed collection of finite, terminating contractions cannot perform arbitrary unbounded computation. Growing the matrix in one's imagination does not provide an execution semantics for growing it in the program. To earn the title, we must add something consequential and admit that we added it.

## 2. Foundations, with appropriate disclaimers about tensors

Einstein 0.1 operates on coordinate-indexed arrays. It does not track covariant and contravariant slots, metrics, units, or transformations between material and spatial configurations. In continuum mechanics, coordinate components acquire geometric meaning through transformation laws. Our array of FizzBuzz strings has not acquired such a law merely by being given a subscript.

For an equation with free coordinates f and contracted coordinates c, evaluation has the form

\[
C[f]=\sum_{c\in D}\phi(f,c).
\]

The compiler infers D from input tensor axes, checks agreement, and derives the output shape from the free indices. Explicit extents such as `i:4` allow generated domains even when no input supplies one. Repeated dummy indices must occur exactly twice in each outer additive term. Masks permit nonlinear pointwise expressions within a term; this is a specified language extension rather than a claim that all such expressions are multilinear tensor contractions.

The Kronecker delta becomes a primitive equality indicator:

```einstein
let A = [10, 20, 30, 40];
let copied[i: 4] = delta(i, k) * A[k];
emit copied;
```

The naive implementation performs the reduction. The optimized implementation can eliminate k for this certified finite literal vector. It does not allocate an identity matrix and then congratulate itself for multiplying by it.

There are subtleties. A rectangular delta can truncate or zero-extend a vector. Moreover, IEEE floating arithmetic gives `0 * Infinity = NaN`, so an algebraic identity over the reals does not automatically justify a JavaScript rewrite. The implemented optimizer declines rectangular, dynamic, and uncertified non-finite cases. Tests exercise these boundaries. The specification states the numeric domain instead of hiding the issue beneath the word “symbolic.”

## 3. Introducing the thing that actually supplies universality

We add immutable records, exact integer arithmetic, lazy Boolean selection, and an unbounded recurrence operator:

\[
s_0=s,\qquad s_{t+1}=F(s_t),\qquad
T=\min\{t\in\mathbb{N}:H(s_t)\}.
\]

`iterate(s,F,H)` returns s_T if T exists, and otherwise diverges. It checks H before applying the next transition. The implementation uses a constant-stack host loop, but the language meaning is a pure recurrence over immutable states.

For instance, this executable factorial program returns `2432902008176640000n`:

```einstein
fn step(s) = {n: s.n - 1n, value: s.value * s.n};
fn done(s) = s.n == 0n;
let result = iterate({n: 20n, value: 1n}, step, done);
emit result.value;
```

For readable application chains, `x |> f(a)` passes x as the first argument to f, and pipelines associate left. This is conventional functional application syntax, not a new universality primitive.

The `n` suffix denotes exact BigInt arithmetic. Finite memory remains finite memory; the universality statement concerns the conventional ideal semantics with unbounded resources. JavaScript Number counters would instead lose integer precision and invalidate a purported exact simulation at sufficiently large values.

`select(predicate,a,b)` evaluates only the selected alternative. This matters for recursion and partial expressions. It is not eager multiplication by Boolean masks, and it is not honestly described as branchless. We have removed the `if` statement from the surface language, not conditional computation from the universe.

### 3.1 A universality proof that does not rely on a picture

A deterministic two-counter machine has a finite instruction table, two unbounded natural counters, and increment, conditional decrement/zero-test, and halt instructions. This is a standard universal machine model; the external computability premise is Minsky's result, not a new finding of this project [1].

Encode a configuration as `{pc:q,a:a,b:b}`. Each increment becomes a pure record expression. Each test/decrement becomes a lazy selector, for example:

```einstein
select(s.a == 0n,
       {pc: 4, a: s.a,      b: s.b},
       {pc: 2, a: s.a - 1n, b: s.b})
```

A finite selector chain dispatches on pc. A finite disjunction identifies halt labels. Unbounded `iterate` applies the transition until that predicate holds.

Each transition evaluates to exactly the record encoding of the corresponding machine successor. The proof is a case analysis on increment and the two zero-test outcomes. Induction on execution length then establishes equality of every finite prefix. The recurrence returns exactly when the machine halts, with identical final counters; otherwise it diverges. Composing this effective translation with the standard universality of two-counter machines establishes Turing completeness of the extended ideal language.

The complete construction, assumptions, simulation lemma, and halting-preservation argument are in [UNIVERSALITY.md](UNIVERSALITY.md). The executable translator is [counter-machine.ts](../src/counter-machine.ts). It produces ordinary Einstein source, without a machine-execution builtin. Tests check all instruction cases over small configurations and exact arithmetic beyond 2^53. Finite tests support the implementation; they do not replace the induction.

A surprising consequence deserves emphasis: the universal subset needs no tensor contraction. This is not a novel theorem about index notation. It is a conventional universal functional core living beside index equations, wearing the same lab coat.

### 3.2 Rule 110 and the temptation of attractive triangles

Cook proved Rule 110 universal under suitable computational encodings and backgrounds [2]. Our example implements its local truth table and a finite periodic simulation. All eight neighborhood cases are checked against the binary rule encoding.

A fixed ring of sixteen Boolean cells has only 65,536 states. Drawing a longer history does not increase that state space. The demonstration therefore does not inherit Cook's universality proof. An actual reduction through Rule 110 would require an appropriate unbounded background representation and faithful computational encoding. We use the counter-machine construction for the theorem and reserve Rule 110 for its traditional purpose in experimental programming languages: making the output look reassuringly computational.

## 4. The compiler, which regrettably works

The compiler is written in TypeScript and targets JavaScript. It has no third-party package dependencies. Node.js 24 executes the TypeScript source using built-in type stripping; a build script writes browser-compatible JavaScript modules. This build is transpilation, not a static `tsc` validation step.

The pipeline contains:

1. A lexer with token offsets and a precedence-climbing expression parser.
2. A discriminated AST for declarations, records, arrays, calls, and index expressions.
3. Symbol, arity, literal shape, index occurrence, and domain-constraint analysis.
4. A contraction IR with signed terms, free axes, and ordered reductions.
5. Conservative rewrites and JavaScript expression generation.
6. A runtime for checked access, lazy tensors, sparse literals, output conversion, and recurrence.

Generated programs execute JavaScript expressions and runtime calls; they do not re-interpret their AST. The CLI can emit an ES module instead of immediately executing it. `inspect` displays contraction IR for readers who find a normal program insufficiently administrative.

Type inference is partial. Literal categories and many shapes are inferred, but recursive function signatures, record-field types, and dynamic builtin results may remain unknown. Some failures remain runtime failures. There is no claim of a complete static type system or a type-soundness theorem. Diagnostics are useful but not yet source-mapped across all semantic passes.

## 5. Useful computation, against our better judgment

The repository includes executable examples for Hello World, FizzBuzz, factorial, Fibonacci, prime testing, sorting, palindrome detection, binary search, matrix multiplication, gradient descent, finite-element stiffness assembly, Rule 110, and Conway's Game of Life. Additional examples demonstrate delta simplification, reactive views, and SVG output.

Sorting uses stable destination ranks: count entries with a smaller value, breaking equal-value ties by original position, then scatter with an equality indicator. This costs quadratic work. Nobody should replace a production sort with it merely because the indices are aligned attractively.

Finite-element assembly is less unnatural. For two unit axial bar elements with local stiffness

\[
k=\begin{bmatrix}1&-1\\-1&1\end{bmatrix},
\qquad K_{ij}=\sum_{e,a,b}P_{eai}k_{ab}P_{ebj},
\]

the example computes:

```einstein
let P = [[[1, 0, 0], [0, 1, 0]], [[0, 1, 0], [0, 0, 1]]];
let ke = [[1, -1], [-1, 1]];
let Q[e, a, j] = ke[a, b] * P[e, b, j];
let K[i, j] = P[e, a, i] * Q[e, a, j];
emit K;
```

The output is `[[1,-1,0],[-1,2,-1],[0,-1,1]]`. Its rigid-translation null mode is physically appropriate before boundary conditions are applied. The language finally encounters a problem for which its notation is helpful, and responds with visible discomfort.

Gradient descent minimizes `(x-3)^2` using the analytic derivative `2*(x-3)` and a step size of 0.1. The checked run stops after 74 updates at approximately `3.0000004717990665`, satisfying the gradient tolerance. This example demonstrates recurrence; it does not implement automatic differentiation or claim convergence for arbitrary objectives.

## 6. Optimization and measurable disappointment

Implemented optimizations include a restricted delta identity rewrite, sparse literal representation, cell-wise laziness, scalar contraction fusion, and elimination of reduction-term arrays in optimized mode. The compiler does not perform contraction-order search, cross-binding fusion, general symbolic algebra, sparse zero-skipping schedules, or parallel code generation. Those are separate engineering projects rather than alternative names for a Map.

The benchmark suite checks all outputs before timing, warms each implementation five times, and records fifteen executions with median, minimum, and maximum wall times. Parsing and JavaScript function construction are excluded from execution timings; runtime creation, literals, and full output materialization are included. Handwritten JavaScript baselines reuse resident input arrays, so allocation is not matched. Fixed implementation order, very short samples, shared hardware, and absent confidence intervals limit interpretation.

The measured results below are taken directly from the recorded report, not estimated speedups.

| Kernel | JavaScript ms | Naive Einstein ms | Optimized Einstein ms |
|---|---:|---:|---:|
| delta-copy | 0.000300 | 0.982680 | 0.059059 |
| matrix-product | 0.030926 | 2.185470 | 1.507310 |
| dot-product | 0.007682 | 0.199901 | 0.209947 |
| sparse-dot | 0.001993 | 0.056616 | 0.039881 |

Recorded on v24.22.3, AMD EPYC 9V74 80-Core Processor, linux/x64, at 2026-11-27T04:45:19.282Z. Matrix-example compilation median: 0.886435 ms. See [raw JSON](../bench/results.json) and [full protocol/results](../bench/RESULTS.md).

The delta result shows the value of removing an unnecessary dimension of work. It does not show that the generic runtime is fast. The matrix result exposes the costs of wrapped accesses, callbacks, bounds validation, and memoization. Dot-product optimization can lose on this workload, and sparse storage does not yet skip zero iterations. Reporting only the delta speedup would constitute an efficient optimization of the abstract rather than the compiler.

Free output coordinates offer parallelization opportunities, while recurrence dependencies constrain temporal parallelism. Parallel floating reductions would additionally need a stated rounding and reproducibility policy. No parallel benchmark or speedup is claimed. The obvious next backend is specialized loops over flat numeric buffers, with domain checks hoisted out of hot paths.

## 7. At last, a user interface

The playground provides a source editor with highlighting, generated JavaScript and IR tabs, an execution console, tensor visualization, timings, and selectable examples. Its prominent documentation section includes this article, the specification, the universality proof, architecture notes, and measured benchmark tables. KaTeX typesets the LaTeX formulas; complete code examples can be opened directly in the editor. Compilation and execution take place in a module worker with an operational timeout. These limits keep the interface usable; they are not part of the ideal language semantics.

A reactive program supplies `initial`, `update(state,event)`, and `render(state)`. An event yields a new immutable state. Rendering yields a pure record interpreted by a small DOM/SVG host. The example implements a counter, case-insensitive search of mathematicians, and a conditional empty-result message. A separate program generates sine-curve points rendered as an SVG polyline. Life uses a continuously evolving 16×16 glider with Play/Pause, Step, Reset, and a generation counter; each clock event invokes the Einstein state reducer.

The host owns event delivery and effects. Einstein computes state and view values. This is a minimal functional rendering protocol, not a full layout engine or a React replacement. A React adapter could own the worker lifecycle and map view records to components; it remains a stretch design documented in the architecture, not a shipped integration.

Worker integration tests exercise every example and reactive messages. Visual interaction in a real browser is reported separately in [VALIDATION.md](VALIDATION.md); passing a worker test is not evidence of pixel-level correctness. The original dropdown limitation has nevertheless been addressed with an actual HTML select. The host supplied the tag, which is approximately how existing UI frameworks also remain on speaking terms with the browser.

## 8. Prior art and the limits of originality

APL and J have long explored executable mathematical notation, arrays, reductions, and higher-order operators; Iverson's historical account describes that lineage directly [3]. This project does not invent array programming or functional composition.

Futhark is a statically typed, purely functional, data-parallel array language with an optimizing compiler and CPU/GPU targets [4]. Einstein is an educational prototype with a much weaker type analysis and backend. Comparing the two without that qualification would require a confidence interval on the author's audacity.

TACO compiles tensor algebra expressions together with storage formats into efficient kernels, with substantive research on dense and sparse iteration [5]. Our inferred domains and scalar reduction callbacks are modest relatives of those ideas, not a competing sparse compilation theory. Einops also supplies readable named-axis einsum expressions [6]; named indices are established practice.

The project's contribution is therefore the particular small language, inspectable compiler, runnable examples, explicitly scoped reduction proof, reactive adapter, and measured accompanying narrative. No priority claim is made for index-based programming, functional tensor computation, symbolic delta elimination, or universality through recurrence.

## 9. Conclusion

Einstein can multiply matrices, assemble a tiny stiffness matrix, compute exact factorials, simulate a universal machine model in its ideal semantics, and ask the browser to show a list of mathematicians. Its execution is reproducible, its limitations are documented, and several of its benchmark numbers are inconvenient.

Finite contractions remain finite. Universality comes from the admitted extension. The dropdown menu works through a host adapter. The engineering undertaking is unnecessary, but its unnecessary parts are now available for inspection.

## References

1. Marvin Minsky. *Computation: Finite and Infinite Machines*. Prentice-Hall, 1967. The two-counter instruction model and halting premise are also stated in Jasper Berendsen, Taolue Chen, and David N. Jansen, “Undecidability of Cost-Bounded Reachability in Priced Probabilistic Timed Automata,” TAMC 2009, pp. 128–137, §2.2. [Author-hosted paper](https://www.cs.ox.ac.uk/people/taolue.chen/pub-papers/Tamc09.pdf).
2. Matthew Cook. “Universality in Elementary Cellular Automata.” *Complex Systems* 15(1), 2004, pp. 1–40. [Publisher abstract](https://www.complex-systems.com/abstracts/v15_i01_a01/). [DOI](https://doi.org/10.25088/ComplexSystems.15.1.1).
3. Kenneth E. Iverson. “A Personal View of APL.” [Author's essay, J Software](https://www.jsoftware.com/papers/APLPersonalView1.htm).
4. Futhark project. [Why Futhark?](https://futhark-lang.org/index.html).
5. Fredrik Kjolstad, Shoaib Kamil, Stephen Chou, David Lugato, and Saman Amarasinghe. *The Tensor Algebra Compiler*. MIT-CSAIL-TR-2017-003, 2017. [MIT repository and paper](https://dspace.mit.edu/entities/publication/7c5a633e-581c-4fdc-9bf7-5857ca09617f).
6. Einops project. [einops.einsum documentation](https://einops.rocks/api/einsum/).

External pages consulted during implementation on 2026-11-27. Sources establish prior work and the imported universality premise; the implementation claims and numerical results refer to this repository's checked artifacts.
