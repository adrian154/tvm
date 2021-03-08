// helper for testing: write crap to memory
const write = (CPU, data, offset) => {
    offset = offset ?? 0;
    for(let i = 0; i < data.length; i++) {
        CPU.memory[u16(offset + i)] = data[i];
    }
};

const CPU = createCPU();

write(CPU, [
    0x02, 0xfa, 0xc, // mov 0xfa, re
    0x03, 0xad, 0xde, 0xd, // mov 0xdead, rd
    0x04,
]);

for(let i = 0; i < 100; i++) {
    step(CPU);
}