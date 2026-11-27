export function encodeMachine(program, initial = [
    0n,
    0n
]) {
    if (!program.length || initial.some((x)=>x < 0n)) throw Error('Invalid machine');
    const target = (n)=>{
        if (!Number.isInteger(n) || n < 0 || n >= program.length) throw Error('Invalid target');
        return n;
    };
    const state = (pc, a, b)=>`{pc: ${target(pc)}, a: ${a}, b: ${b}}`;
    let step = 's';
    for(let pc = program.length - 1; pc >= 0; pc--){
        const i = program[pc];
        if (![
            'inc',
            'dec',
            'halt'
        ].includes(i.op)) throw Error('Invalid opcode');
        if (i.op !== 'halt' && i.register !== 0 && i.register !== 1) throw Error('Invalid register');
        let e = 's';
        if (i.op === 'inc') e = state(i.next, i.register === 0 ? 's.a + 1n' : 's.a', i.register === 1 ? 's.b + 1n' : 's.b');
        if (i.op === 'dec') {
            const a = i.register === 0 ? 's.a - 1n' : 's.a', b = i.register === 1 ? 's.b - 1n' : 's.b';
            e = `select(${i.register === 0 ? 's.a' : 's.b'} == 0n, ${state(i.zero, 's.a', 's.b')}, ${state(i.next, a, b)})`;
        }
        step = `select(s.pc == ${pc}, ${e}, ${step})`;
    }
    const halts = program.map((i, pc)=>i.op === 'halt' ? `s.pc == ${pc}` : 'false').join(' || ');
    return `fn transition(s) = ${step};\nfn halted(s) = ${halts};\nlet result = iterate({pc: 0, a: ${initial[0]}n, b: ${initial[1]}n}, transition, halted);\nemit result;\n`;
}
