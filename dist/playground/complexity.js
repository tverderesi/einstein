// Analytical bounds for the bundled sources, not automatic analysis of edits.
// Fixed tensor rank, amortized O(1) map access, fixed-precision scalar arithmetic.
export const exampleComplexities = {
  hello: {time:'O(L)', memory:'O(L)', notes:'L is the emitted text length; includes presenting the output.'},
  fizzbuzz: {time:'O(n) scalar steps + O(output characters)', memory:'O(n) output slots + output characters', notes:'n entries. Decimal number strings contribute up to O(n log n) characters.'},
  factorial: {time:'O(n) exact multiplications; at most O(n M(B)) bit work', memory:'O(B) live integer bits', notes:'B = O(n log n) bits in n!; M(B) bounds a multiplication of at most B-bit integers. Text conversion is additional.'},
  fibonacci: {time:'O(n) additions; O(n²) bit work with linear-time addition', memory:'O(n) live integer bits', notes:'The nth Fibonacci number has Θ(n) bits. This is an iterative state recurrence, not the exponential recursive algorithm.'},
  primes: {time:'O(n√n) trial-division steps (upper bound)', memory:'O(n) output slots + O(√n) stack + text', notes:'Tests every integer up to n by trial division; numeric string storage is counted separately.'},
  sorting: {time:'O(n²)', memory:'O(n) value slots', notes:'Stable rank computation and delta-based placement both scan pairs. This is not comparison-sort O(n log n).'},
  palindrome: {time:'O(n)', memory:'O(n) including the input', notes:'For length n: optimized reduction adds O(1) workspace; naive reduction materializes O(n) terms.'},
  'binary-search': {time:'Search O(log n); whole run O(n)', memory:'Search O(1); input O(n)', notes:'The array is already sorted. Constructing its literal input is linear even though searching it is logarithmic.'},
  matmul: {time:'O(mkn)', memory:'O(mk + kn + mn)', notes:'A is m×k and B is k×n; includes both inputs and the fully demanded output. No Strassen algorithm or BLAS backend.'},
  'gradient-descent': {time:'O(T)', memory:'O(1) live scalar state', notes:'T scalar updates. For this quadratic and fixed step, real-arithmetic convergence needs O(log(1/ε)) updates; floating-point stagnation can invalidate that tolerance claim.'},
  fem: {time:'O(E q² N + E q N²)', memory:'O(E q N + q² + N²)', notes:'E elements, q local DOFs, N global DOFs. Counts this dense incidence contraction and its intermediate; sparse scatter assembly is a different algorithm.'},
  rule110: {time:'O(W · 3^T)', memory:'O(W T + T)', notes:'W cells and T time rows. Each cell recursively recomputes three predecessor trees. Only grid outputs are memoized. A staged implementation could use O(W T) work.'},
  life: {time:'O(N) per generation; O(GN) for G generations', memory:'O(N) live board and rendering data', notes:'N is the number of cells. Each cell reads eight neighbors. Realization prevents retaining all past board closures; the host redraw is also linear.'},
  delta: {time:'O(n)', naiveTime:'O(n²)', memory:'O(n)', notes:'For the bundled finite literal vector, optimization removes the dummy axis. Both modes still construct n inputs and display n outputs.'},
  reactive: {time:'Counter update O(1); search/render O(n · C_match)', memory:'O(n) result slots + text', notes:'n names; C_match includes case normalization and substring matching. String lengths and the JavaScript matching algorithm matter.'},
  svg: {time:'O(n)', memory:'O(n)', notes:'n fixed-precision points, including materialization and polyline creation.'},
  pipes: {time:'O(Σ C_stage); example O(n + output characters)', memory:'Stage-dependent; example O(n + output characters)', notes:'A pipe introduces ordinary function application, not an implicit array traversal. The example tabulates n labels and joins them.'},
};

export function complexityFor(name, optimize=true) {
  const entry=exampleComplexities[name];
  return entry ? {...entry,time:!optimize&&entry.naiveTime?entry.naiveTime:entry.time} : null;
}
