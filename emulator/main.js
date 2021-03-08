// helper for testing: write crap to memory
const write = (CPU, data, offset) => {
    offset = offset ?? 0;
    for(let i = 0; i < data.length; i++) {
        CPU.memory[u16(offset + i)] = data[i];
    }
};

const CPU = createCPU();

write(CPU, [

    0x02, 0xfa, 0xc, // mov 0xfa, rc
    0x03, 0xad, 0xde, 0xd, // mov 0xdead, rd
    0x04, 0xcd, // storeb rc, rd 
    0x05, 0xdc, // storew rd, rc
    0x06, 0xca, // loadb rc, ra
    0x07, 0xc6, // loadw rc, r6

    0x03, 0xef, 0xbe, 0x0, // mov 0xbeef, r0
    0x08, 0x0, // NOT r0
    0x03, 0xfe, 0xca, 0x1, // mov 0xcafe, r1
    0x09, 0x01, // AND r0, r1
    0x0A, 0x10, // OR r1, r0

]);

for(let i = 0; i < 100; i++) {
    step(CPU);
}