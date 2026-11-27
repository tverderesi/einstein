# A practical guide to Einstein

Start here if you would like to write a program before reading a proof about it. This guide covers the implemented language, including the parts that are conventional functional programming in a suspiciously mathematical coat.

Complete Einstein examples below have a **Try in playground** button. It loads the source into the editor and runs it. Examples are self-contained: each button replaces the whole editor, not just the selected line.

## 1. Your first program

```einstein
emit "Hello, World!";
```

`emit` collects an output for the host to display. End every statement with a semicolon. Comments begin with `#` or `//`.

A `let` gives a value an immutable name:

```einstein
let greeting = "Hello, tensors.";
let answer = 6 * 7;
emit greeting;
emit answer;
```

There is no assignment after definition. To represent changing state, compute a new value.

## 2. Scalars, arrays, and records

Numbers are floating point. A suffix `n` gives an exact BigInt integer. Do not mix those two numeric representations in arithmetic.

```einstein
let pi = 3.141592653589793;
let exact = 9007199254740993n;
let vector = [10, 20, 30];
let matrix = [[1, 2], [3, 4]];
let person = {name: "Noether", theoremCount: 1};
emit pi;
emit exact + 1n;
emit vector[1];
emit matrix[0, 1];
emit person.name;
```

Indices start at zero. `matrix[0,1]` supplies all coordinates in one pair of brackets. Out-of-bounds access raises an error. Multidimensional arrays must be rectangular: `[[1],[2,3]]` is rejected.

Strings use JSON-style double quotes and escapes. Records use named fields, read with a dot. Arrays, records, and language state are immutable values.

## 3. Free indices build the result

The indices on the left-hand side describe the axes of the output. An explicit extent creates a domain:

```einstein
let sequence[i: 5] = i + 1;
let doubled[i] = sequence[i] * 2;
emit sequence;
emit doubled;
```

The result is `[1,2,3,4,5]` followed by `[2,4,6,8,10]`. In `doubled`, the compiler learns that i has five positions from `sequence[i]`.

A free index is a coordinate of the result. It does not get summed away. You can reorder free indices to transpose:

```einstein
let A = [[1, 2, 3], [4, 5, 6]];
let transpose[j, i] = A[i, j];
emit transpose;
```

The output is `[[1,4],[2,5],[3,6]]`. No loop or mutable destination array appears in the source.

## 4. Contracted indices disappear through summation

An index absent from the left-hand side contracts when it occurs exactly twice in the term:

```einstein
let values = [1, 2, 3];
let weights = [10, 20, 30];
let dot = values[i] * weights[i];
emit dot;
```

This produces 140. The i domain comes from both vectors; their extents must agree. A bare one-occurrence `let total=values[i]` is rejected by the strict repeated-dummy rule. A sum can instead use an all-ones vector of matching extent.

For matrix-vector multiplication:

\[
y_i = \sum_j A_{ij}x_j.
\]

```einstein
let A = [[1, 2, 3], [4, 5, 6]];
let x = [10, 20, 30];
let y[i] = A[i, j] * x[j];
emit y;
```

This produces `[140,320]`. i survives; j contracts. The compiler infers output shape `[2]` and reduction extent 3.

For matrix multiplication, retain two free indices:

```einstein
let A = [[1, 2], [3, 4]];
let B = [[5, 6], [7, 8]];
let C[i, j] = A[i, k] * B[k, j];
emit C;
```

The output is `[[19,22],[43,50]]`. Each outer additive term has its own reduction. Independent dummy symbols with different extents should have different names, because the current checker unifies constraints by name within an equation.

## 5. Masks and Kronecker deltas

`mask(predicate)` converts a Boolean into numeric 1 or 0. It works well for selecting finite numeric contributions:

```einstein
let a = [3, -2, 5, -7];
let positive[i] = a[i] * mask(a[i] > 0);
emit positive;
```

This gives `[3,0,5,0]`. i is free and may appear more than twice in a nonlinear pointwise mask expression.

`delta(i,j)` is an equality indicator, not an allocated identity matrix:

```einstein
let a = [10, 20, 30];
let copied[i: 3] = delta(i, k) * a[k];
emit copied;
```

The compiler can simplify this particular contraction when the vector is a finite numeric literal and both extents are statically equal. More complicated cases still execute correctly through the general reduction path.

A mask multiplies values that are evaluated. It is not a safe way to hide a divergent expression or division by zero. Use lazy selection for that.

## 6. Pure functions and lazy selection

Functions have a single expression body and can call other named functions:

```einstein
fn square(x) = x * x;
fn describe(x) = select(x >= 0, "nonnegative", "negative");
emit square(12);
emit describe(-5);
```

`select(p,a,b)` evaluates p and then only a or b. It has conditional semantics without an `if` statement. Logical `&&` and `||` also short circuit.

```einstein
fn safeReciprocal(x) = select(x == 0, 0, 1 / x);
emit safeReciprocal(0);
emit safeReciprocal(4);
```

Functions may recurse. They cannot refer to value bindings declared later in the file. Put captured constants before their functions, and put execution after dependencies have been initialized. Anonymous functions and mutable local variables are not implemented.

## 7. Pipes connect computations

The pipe operator `|>` reads left to right. It passes its left value as the first argument to a named function:

```einstein
fn add(x, n) = x + n;
fn square(x) = x * x;
emit 3 |> add(4) |> square |> str;
```

The output is the string `"49"`. This is the same application as `str(square(add(3,4)))`. A target without parentheses takes the piped value as its only argument. A target with parentheses receives that value before its written arguments.

```einstein
fn label(i) = "Element " + str(i);
emit 4 |> tabulate(label) |> join(", ");
```

Pipes associate left and have the lowest binary precedence: `3+4 |> square` means `square(3+4)`. Use parentheses to add arithmetic after a pipeline. Only named functions/calls are supported as targets; there are no anonymous function expressions.

## 8. Recurrence without mutating state

`iterate(initial,step,done)` describes a sequence of immutable states. It stops at the first state for which done is true, checking that predicate before another step.

```einstein
fn step(s) = {remaining: s.remaining - 1n, product: s.product * s.remaining};
fn done(s) = s.remaining == 0n;
let result = iterate({remaining: 10n, product: 1n}, step, done);
emit result.product;
```

This computes `3628800n`. If done never becomes true, the ideal computation does not terminate. The browser imposes a practical timeout and function-call fuel. An optional fourth argument to iterate limits transition count:

```einstein
fn step(s) = {x: s.x - 0.1 * (2 * (s.x - 3)), n: s.n + 1};
fn done(s) = abs(s.x - 3) < 0.000001;
let result = iterate({x: 10, n: 0}, step, done, 1000);
emit result;
```

State recurrence plus exact unbounded counters supplies the universality-bearing extension. Finite contractions do not acquire that property by themselves. The proof explains the distinction in full.

## 9. Generating strings and structured tensors

Numeric index equations are for numeric/Boolean scalar computations. Use `tabulate` or `grid` when elements are strings or records:

```einstein
fn label(i) = "Element " + str(i);
let labels = tabulate(4, label);
emit labels;
```

```einstein
fn point(i) = {x: i * 12, y: 60 + 40 * sin(i / 4)};
let points = tabulate(40, point);
emit svg(points);
```

A grid calls `f(i,j)`. Its optional context argument calls `f(i,j,context)`, useful when a new grid depends on an earlier immutable one. `realize(tensor)` materializes its finite contents. The Life example uses this to avoid retaining a growing chain of earlier lazy generations.

## 10. Reactive programs

A reactive program exports an initial value and two named functions, update and render:

```einstein
let initial = {count: 0, query: ""};
fn update(s, event) = {count: s.count + event.increment, query: event.query};
fn render(s) = view(s.count, s.query, ["Einstein", "Noether", "Cauchy"]);
emit render(initial);
```

The host sends button and input events to update. The returned value becomes the next state. Render produces a pure view description that the host turns into controls.

Select **reactive** from the example menu for searchable lists and conditional messages. Select **life** for a running glider: Pause freezes the clock, Step advances exactly one generation, and Reset restores the seed. The neighbor calculation and Conway rules run in Einstein, while JavaScript supplies clock events and rendering.

This is a small supported view protocol, not arbitrary HTML or a full component framework. SVG descriptions currently draw polylines from numeric points.

## 11. Using the playground effectively

The editor contains the full current program. **Compile & run** starts a fresh worker and state; **Stop** terminates it. Toggle optimization to compare eager equation evaluation with lazy memoized evaluation and the conservative delta rewrite.

The console displays emitted values. Numeric arrays also appear as tensor tables. **JavaScript** shows generated executable code; **Contraction IR** shows domains, free axes, and reduction variables. Compilation and execution times are measured separately, and execute time includes materializing displayed output. Browser timings are illustrative rather than controlled benchmarks.

If an input is silently doing nothing after a deployment, refresh the page. Versioned frontend assets reduce stale-cache mismatches; the source repository remains the authoritative version.

## 12. Common mistakes

| Message or symptom | Likely cause | Fix |
|---|---|---|
| Contracted index occurs once | A dummy has no matching occurrence | Retain it as a free output axis or supply a matching factor |
| Static index extent mismatch | Two uses of an index have different axis lengths | Correct the shapes or rename unrelated dummy indices |
| Cannot infer extent | Only shifted subscripts or standalone index expressions occur | Supply a free-axis extent such as `i:10` |
| Unbound name | Misspelling or a value used before declaration | Define dependencies first |
| Cannot mix natural and number | BigInt arithmetic mixed with binary64 values | Use a consistent representation, or explicit `nat`/`num` conversions |
| Index outside shape | Negative, too large, or wrong-rank coordinate | Correct coordinates; use `wrap` for a periodic vector |
| Execution fuel exhausted | Too much recursion/work in a run or event | Check termination and domain sizes; use iterate for constant-stack recurrence |
| Only a numeric table appears | The program emitted one finite result | Use the reactive automaton/view protocol for ongoing interaction |

The compiler's type inference is partial. An accepted program is not a guarantee that every scalar operation is well typed; unresolved function and record types can still fail at runtime. See the specification for exact limits.

## 13. Running locally

Install Node.js 24 or newer, clone the repository, and run:

```sh
npm run check
npm run playground
```

No compiler dependencies need installing. KaTeX's documentation stylesheet, script, and fonts load from a versioned CDN; if unavailable, math falls back to visible LaTeX source.

For the command line:

```sh
node src/cli.ts run examples/matmul.ein
node src/cli.ts inspect examples/matmul.ein
node src/cli.ts run examples/matmul.ein --naive
npm run bench
```

Next, read the [formal specification](SPECIFICATION.md), [universality proof](UNIVERSALITY.md), or [article](ARTICLE.md). The guide teaches usage; those documents state the semantics, assumptions, and measured consequences.
