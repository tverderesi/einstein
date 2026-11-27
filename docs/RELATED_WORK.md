# Research notes and attribution

| Source | Established idea used for context | What Einstein actually contributes |
|---|---|---|
| [Iverson, A Personal View of APL](https://www.jsoftware.com/papers/APLPersonalView1.htm) | Mathematical array notation, reductions, functions/operators; APL/J history | A small independent prototype, no claim to invent array programming |
| [Futhark project](https://futhark-lang.org/index.html) | Pure functional array programming and optimizing parallel backends | JavaScript target with much weaker inference/optimization |
| [Kjolstad et al., TACO report](https://dspace.mit.edu/entities/publication/7c5a633e-581c-4fdc-9bf7-5857ca09617f) | Compiling tensor expressions plus storage formats to kernels | Explicit finite contraction IR and a limited literal/vector rewrite |
| [Einops named-axis einsum](https://einops.rocks/api/einsum/) | Readable named-axis tensor products/reductions | Standalone language with pure recurrence and a toy UI protocol |
| [Cook, Rule 110 universality](https://www.complex-systems.com/abstracts/v15_i01_a01/) | A proven universal cellular automaton with suitable encodings/backgrounds | Local-rule implementation and finite periodic demo; no imported proof for the finite ring |
| [Berendsen et al., TAMC 2009 §2.2](https://www.cs.ox.ac.uk/people/taolue.chen/pub-papers/Tamc09.pdf), citing Minsky (1967) | Standard two-counter-machine instruction set and undecidability premise | Explicit effective translation into implemented Einstein constructs and simulation/halting proof |

Sources above were searched and opened during implementation. The direct Cook PDF URL encountered an error; the publisher abstract and DOI were accessible. The Minsky book was not directly inspected; its theorem is identified as an external standard premise and the inspected paper supplies the concrete machine formulation. This is focused prior-art research, not an exhaustive novelty search.
