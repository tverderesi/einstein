# Einstein 0.1 language specification

## 1. Scope and mathematical model

Einstein combines finite, coordinate-indexed array equations with pure functions and unbounded state recurrence. It is inspired by Einstein notation, not a faithful implementation of abstract differential geometry. Indices are zero-based finite integer coordinates. There is no index variance, metric insertion, change-of-basis checking, unit system, or material/spatial reference-frame distinction. A multidimensional array is not automatically a geometric tensor.

The ideal semantics has arbitrarily large integers and arbitrarily long execution. Implementations have finite memory. The numeric array fragment uses IEEE-754 binary64 values in this implementation. Exact counters use the `natural`/BigInt fragment. Signed BigInt intermediate values are permitted; well-formed counter encodings maintain nonnegative counters. Consequently `natural` is currently an intended domain, not a statically enforced refinement type.

## 2. Lexical syntax

Identifiers match `[A-Za-z_][A-Za-z_0-9]*`. Keywords are `let`, `fn`, `emit`, `true`, and `false`. Strings use JSON double-quoted syntax and escapes. Numbers use decimal syntax with optional fraction and exponent. Appending `n` denotes an exact integer; the practical supported literal form is decimal digits followed by `n` (e.g. `123n`). Negative values use unary minus. Whitespace, `#` comments, and `//` comments are ignored. Semicolons are mandatory.

## 3. Grammar

The following EBNF describes the parser; precedence is listed afterward.

```ebnf
program    = { statement, ";" } ;
statement  = "let", identifier, [ "[", axes, "]" ], "=", expression
           | "fn", identifier, "(", [ identifiers ], ")", "=", expression
           | "emit", expression ;
axes       = axis, { ",", axis } ;
axis       = identifier, [ ":", expression ] ;
identifiers= identifier, { ",", identifier } ;
expression = prefix, { binary-op, expression } ; (* precedence-climbing *)
prefix     = [ "-" | "!" ], primary, { postfix } ;
primary    = literal | identifier | "(", expression, ")"
           | "[", [ expressions ], "]"
           | "{", [ fields ], "}" ;
postfix    = "[", expressions, "]" | ".", identifier
           | "(", [ expressions ], ")" ;
expressions= expression, { ",", expression } ;
fields     = identifier, ":", expression, { ",", identifier, ":", expression } ;
```

A call's callee must be a bare identifier; there are no anonymous functions or method calls. Unary operators may be nested (the parser's recursive prefix production). From lowest to highest, binary precedence is `||`, `&&`, `== !=`, `< > <= >=`, `+ -`, `* / %`; all binary operators associate left. Unary operators bind more tightly than binary operators; postfix indexing binds to its primary.

## 4. Environments, functions, and values

A program extends an immutable lexical environment in source order. Bindings cannot be reassigned or shadowed globally. Functions may call later function declarations, including mutual recursion, but their bodies can only refer to preceding value bindings. Calls made before a function's captured value is initialized can still fail; put calls after their dependencies. Function parameters cannot shadow known global names. Top-level effects are restricted to collecting `emit` outputs; the host chooses how to display them.

Values are numbers, exact integers, Booleans, strings, rectangular arrays, records, tensors, and named function references. Records and literal arrays are frozen. Tensor coordinates and shape are immutable; the runtime may mutate private memo caches without changing observable values. A function is evaluated by substitution/environment extension, with call-by-value arguments except for the special selector below. Recursive calls can exhaust the JavaScript stack; `iterate` handles state recurrence without growing that stack.

`number` division is floating division. Exact integer division truncates toward zero, following BigInt; zero division raises an error. Mixed number/BigInt arithmetic is rejected when statically known and otherwise follows runtime errors. Strings concatenate with `+` when both operands are strings. Comparisons and logical operations have the JavaScript scalar meanings; `==` and `!=` compile to strict equality and inequality. Logical operators short circuit. Intended predicates are Boolean; a complete static Boolean discipline is not yet enforced. Array and record equality is identity equality, not structural equality.

## 5. Index equations

Consider `let C[i,j] = A[i,k] * B[k,j];`.

The LHS declares the ordered free axes `F=(i,j)`. An explicit `i:n` supplies extent `n`. Bare unknown identifiers in subscripts and bare unknown arguments to `delta` bind index variables in the equation, rather than reading globals. A plain subscript `A[...,i,...]` supplies a constraint `extent(i)=shape(A)[axis]`. Every such constraint for a given index must agree; explicit extents participate too. Ragged literals, known rank errors, and statically conflicting extents are errors; unresolved ranks/extents are guarded at runtime.

Shifted subscripts such as `A[i+1]` do not infer an extent by themselves. Supply an explicit free extent or a plain subscript elsewhere. All demanded coordinates are checked; negative indexing is not allowed. `wrap` supplies periodic rank-one access explicitly.

Split the RHS only at its outer additive/subtractive tree into signed terms `σ_q E_q`. Parenthesized nested additions within a product are not distributed. In each term, an index not in `F` must occur exactly twice among subscript identifiers and bare delta arguments. It becomes a contracted index. A free index can occur repeatedly, including inside masks; this is an explicit extension beyond strictly multilinear tensor notation. Each free index must occur in each term unless its LHS extent is explicit, in which case scalar broadcasting is allowed.

Ordinary appearances outside subscripts/delta do not contribute to the occurrence count, but may read an index already bound by the term. The same contraction symbol may be reused in separate additive terms; this implementation unifies all its domain constraints across the equation, which is stricter than alpha-renamed mathematical dummy indices. Rename independent dummies with different extents.

For a free coordinate `f`, the denotation is

\[
 C[f] = \sum_q \sigma_q\left(\sum_{c_1=0}^{D(c_1)-1}\cdots
 \sum_{c_r=0}^{D(c_r)-1} \llbracket E_q\rrbracket_{\rho[f,c]}\right).
\]

Contraction order follows first discovery of dummy indices in source traversal, with the first dummy outermost. Empty numeric reductions return zero. Scalar bindings with contracted indices follow the same rule. Bindings without an index equation or contraction evaluate as ordinary expressions; e.g. `let words=tabulate(30,entry)` can hold strings. Numeric index equations should contain number/Boolean scalar terms; other element types are outside the supported equation fragment and are not completely rejected by the current checker. Arithmetic Boolean masks use `mask(predicate)` to make their numeric meaning explicit.

`delta(i,j)` is 1 when its scalar arguments are strictly equal, otherwise 0. Rectangular deltas are valid; they do not assert that their two domains have equal size. There is no privileged dense identity allocation.

## 6. Selection, recurrence, and nontermination

`select(p,a,b)` evaluates `p`, then **only** the selected expression. For Boolean predicates:

\[
\frac{\rho\vdash p\Downarrow\mathrm{true}\quad\rho\vdash a\Downarrow v}
     {\rho\vdash\operatorname{select}(p,a,b)\Downarrow v}
\qquad
\frac{\rho\vdash p\Downarrow\mathrm{false}\quad\rho\vdash b\Downarrow v}
     {\rho\vdash\operatorname{select}(p,a,b)\Downarrow v}.
\]

It is a lazy Boolean selector, not the eager expression `p*a+(1-p)*b`. It is conditional computation without an `if` statement, but it still has branching semantics. Calling it “branchless” would be false.

`iterate(s,F,H)` defines `s_0=s`, `s_(t+1)=F(s_t)` and returns `s_T` for the least natural `T` such that `H(s_T)` is true. If no such T exists, it diverges. The stop predicate is checked **before** the next transition. An optional fourth argument supplies an operational transition limit; reaching it raises a diagnostic rather than returning a false answer. Runtime call fuel and browser wall-clock termination are additional implementation controls, not part of the universality theorem.

There is no syntactic finite upper bound on T. This is the deliberate extension that escapes finite tensor algebra. It is a pure functional state recurrence even though its runtime implementation uses a constant-stack loop. “No imperative syntax” does not mean the machine cannot execute loops.

## 7. Type and shape analysis

The compiler infers literal scalar categories, literal rectangular shapes, tensor-equation output shapes where extents are static, function categories, and some builtin results. Numeric operator checks, arity checks, free/dummy index checks, and literal shape checks happen before code generation. Function parameters, field reads, and user-function returns often have `unknown` type; recursive signatures are not solved. There is no claim of Hindley–Milner inference, dependent typing, or a type-soundness theorem for this prototype. Dynamic index and extent guards are implemented; unresolved scalar types can still fail or exhibit JavaScript coercion at runtime. This limitation is intentional and documented rather than presented as a finished type system.

## 8. Builtin interface

| Builtins | Meaning |
|---|---|
| `delta(i,j)`, `mask(p)` | Equality indicator and numeric Boolean mask |
| `len(x)`, `at(a,i)`, `cell(a,i,j)`, `wrap(a,i)` | First extent and checked/periodic access |
| `tabulate(n,f)`, `grid(n,m,f[,context])`, `realize(a)` | Memoized tensors with element `f(i)` / `f(i,j,context)` and explicit materialization |
| `select(p,a,b)`, `iterate(s,F,H[,limit])` | Lazy selection and state recurrence |
| `nat(x)`, `num(x)`, `str(x)` | Conversions; `nat` rejects negative inputs |
| `floor`, `sqrt`, `abs`, `min`, `max`, `sin`, `cos` | Scalar mathematics |
| `join(a,s)`, `contains(s,q)`, `search(a,q)` | String operations and case-insensitive string-list filtering |
| `text(s)`, `view(count,query,items)`, `svg(points)` | Pure graphical description records |

## 9. Reactive host contract

A reactive program exports `initial`, `update(state,event)`, and `render(state)`. The host delivers events and stores the returned state. Each render produces a value description; the host maps supported tags to DOM/SVG. Einstein has no ambient DOM access, timers, HTTP, random generator, mutable user variables, or host-expression escape. Search and conditional empty-result messages in the reactive example are computed by Einstein. Rendering and event wiring are effects owned by the JavaScript adapter.

The browser worker is terminated on timeout. Neither a worker nor function fuel is a hardened security boundary against memory exhaustion. The compiler emits JavaScript from a restricted AST, but no security audit is claimed.

## 10. Optimization semantics and limits

The optimized evaluator computes equation elements lazily and memoizes them. The naive evaluator eagerly constructs equation tensors and materializes reduction-term arrays before summing. Both currently keep named tensor intermediates; scalar contraction products are fused into reduction callbacks. No global algebraic reassociation, cross-binding fusion, automatic differentiation, GPU code, or parallel execution is implemented.

A delta contraction is rewritten only for `delta(i,k)*A[k]` (either factor order), where A is a certified finite numeric literal vector and i/k have equal statically known extents. This restriction avoids rectangular-boundary and `0*Infinity` hazards. Sparse numeric literals below one-third nonzero density use coordinate maps; reduction domains remain dense. Signed zero and IEEE exceptional values are not a symbolic real-number algebra; the optimization claim concerns finite numeric mathematical values, with zero sign unobserved by the language's supported numeric predicates.

Lazy evaluation may defer or avoid errors in undemanded elements. Optimized and naive runs are intended to agree on fully demanded, well-defined finite computations. Error timing is not preserved.
