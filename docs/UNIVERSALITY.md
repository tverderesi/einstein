# A reduction from two-counter machines

## Claim and assumptions

**Theorem.** The ideal Einstein language containing immutable records, exact natural counter arithmetic, Boolean equality, lazy `select`, pure functions, and unbounded `iterate` can simulate every deterministic two-counter machine step for step, preserving halting and final counters. Since that machine model is computationally universal, the ideal language is Turing complete.

This theorem does not say finite tensor contraction is universal. Nor does it say finite RAM, a browser timeout, JavaScript `Number`, or a fixed-width Rule 110 ring is universal. The universality-bearing extension is explicitly the unbounded recurrence over unbounded exact counters. No new result about computability is asserted.

We use the conventional Minsky instruction set: `INC(r,q)`, `DEC(r,q_nonzero,q_zero)`, and `HALT`, for r in {0,1}. Both counters range over N, the control label ranges over a fixed finite set, and a decrement tests zero before subtracting. The standard universality theorem for this exact kind of increment/test-decrement machine is the external premise, originating with Minsky's *Computation: Finite and Infinite Machines* (1967). The instruction model and its halting undecidability are also used explicitly in [Berendsen, Chen, and Jansen (2009), §2.2](https://www.cs.ox.ac.uk/people/taolue.chen/pub-papers/Tamc09.pdf). This document supplies the reduction into Einstein; it does not re-prove Minsky's theorem.

## Effective translation

Encode configuration `(q,a,b)` as `{pc:q,a:a,b:b}`. Control labels use exact small integer-valued numbers; each particular source program has finitely many labels. Counters use exact `n` literals and BigInt arithmetic. Restrict source program size to representable exact labels in the implementation; the ideal model has no such bound.

For each instruction at label q, construct an expression B_q:

| Instruction | Einstein expression B_q |
|---|---|
| INC(0,k) | `{pc:k,a:s.a+1n,b:s.b}` |
| INC(1,k) | `{pc:k,a:s.a,b:s.b+1n}` |
| DEC(0,k,z) | `select(s.a==0n,{pc:z,a:s.a,b:s.b},{pc:k,a:s.a-1n,b:s.b})` |
| DEC(1,k,z) | `select(s.b==0n,{pc:z,a:s.a,b:s.b},{pc:k,a:s.a,b:s.b-1n})` |
| HALT | `s` |

Define `transition(s)` as a finite nested selection of B_q by `s.pc==q`. Its default case is `s`, unreachable from a validated well-formed machine. Define `halted(s)` as the disjunction of `s.pc==h` over halt labels h (or false when there are none). Execute:

```einstein
let result = iterate(initial, transition, halted);
emit result;
```

[`src/counter-machine.ts`](../src/counter-machine.ts) performs this translation for arbitrary validated finite instruction tables and nonnegative initial counters. It generates only ordinary Einstein source. There is no counter-machine builtin, JavaScript source escape, or hidden Turing machine in the runtime. Translation size is O(m) in the instruction count plus the digit length of initial counters. Generated instruction dispatch costs O(m) scalar tests per simulated step in the worst case; exact integer operations cost time in their bit length, not unit time.

## Simulation lemma

Let E(C) denote the record encoding of machine configuration C. If C is nonhalting and the machine makes one step C→C', then evaluating `transition(E(C))` terminates with E(C').

**Proof.** Its finite selection chain reaches exactly the branch whose label equals C's label. For INC, one specified counter increases by exactly 1 and the other is copied; the next label is k, so the result is E(C'). For DEC, if the relevant counter is zero the first alternative copies both counters and selects z. If it is positive, the second alternative subtracts exactly 1 and selects k. Lazy selection means only the chosen alternative is evaluated. The new counters remain natural. These exhaust the instruction cases. ∎

The stop test `halted(E(C))` is true exactly for machine halt configurations, by its construction as a disjunction over the halt labels.

## Finite and infinite execution

Induct on t. At t=0 the initial recurrence state is E(C_0). If state t is E(C_t) and is nonhalting, the simulation lemma gives state t+1 equal to E(C_(t+1)). Therefore every finite prefix of the recurrence encodes exactly the corresponding machine execution prefix.

If the machine first halts at T, all earlier stop tests are false and test T is true. By the definition of `iterate`, the translated program returns E(C_T), with the same final counters. Conversely, if the translated `iterate` returns at T, its stop predicate is true, so C_T is a halt configuration. Thus termination is equivalent. If the machine never halts, every stop test is false and the ideal translated computation has no returned value. This is divergence, not a fabricated timeout answer.

Composing this effective, halting-preserving translation with the standard simulation of Turing machines by two-counter machines establishes the theorem. ∎

## Implemented evidence and its scope

Automated tests check all instruction forms over both counters in small configurations, halting output for a transfer loop, exact growth beyond 2^53, and fuel exhaustion for a nonhalting increment loop. Such tests can detect implementation errors but cannot prove unbounded universality; the finite induction above establishes the semantic result.

The runtime implements `iterate` with a constant-stack loop. The mathematical recurrence remains pure: each state is a new immutable value. A loop in the implementation is not a claim that the surface notation itself secretly supplied unbounded computation before recurrence was added.

## Why Rule 110 is supplementary

Cook proved universality of Rule 110 using appropriately encoded computations and backgrounds: [Cook (2004)](https://www.complex-systems.com/abstracts/v15_i01_a01/), DOI [10.25088/ComplexSystems.15.1.1](https://doi.org/10.25088/ComplexSystems.15.1.1). The included program implements the correct local truth table and a finite periodic space-time sample. Exhaustive tests check all eight neighborhoods.

A finite periodic lattice with finitely many Boolean cells has finitely many states. It cannot hold arbitrary unbounded computations, however impressive its triangles look. A proof via Rule 110 would additionally require an unbounded/lazy spatial domain, appropriate infinite-background representation, and a faithful encoding of Cook's computation. Those facilities are not established here. The counter-machine reduction is the actual proof; the Rule 110 picture is an example.
