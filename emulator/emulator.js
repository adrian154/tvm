// helper for testing: write crap to memory
const write = (CPU, data, offset) => {
    offset = offset ?? 0;
    for(let i = 0; i < data.length; i++) {
        CPU.memory[u16(offset + i)] = data[i];
    }
};

const cpu = createCPU();

/*
write(CPU, [

    0x02, 0xfa, 0xc, // mov 0xfa, rc
    0x03, 0xad, 0xde, 0xd, // mov 0xdead, rd
    0x04, 0xcd, // storeb rc, rd 
    0x05, 0xdc, // storew rd, rc
    0x06, 0xca, // loadb rc, ra
    0x07, 0xc6, // loadw rc, r6
    0x15, 0xab, 0xc0, // div ra, rb, rc

    0x03, 0xef, 0xbe, 0x0, // mov 0xbeef, r0
    0x08, 0x0, // NOT r0
    0x03, 0xfe, 0xca, 0x1, // mov 0xcafe, r1
    0x09, 0x01, // AND r0, r1
    0x0A, 0x10, // OR r1, r0

]);
*/

/*
write(cpu, [
    0x02, 0x00, 0x01, // mov r0, 0
    0x02, 0x01, 0x01, // mov r1, 1
    0x0f, 0x01, 0x20, // add r0, r1, r2
    0x01, 0x10, // mov r1, r0
    0x01, 0x21, // mov r2, r1
    0xf0, 0x00, // ...evil
    0x02, 0x6, 0x0f, // mov rf, 0x6 (jump)
]);
*/

    //[2, 0, 1, 2, 1, 1, 15, 1, 32, 1, 16, 1, 33, 240, 0, 3, 15, ]
write(cpu, [2, 1, 0, 2, 1, 1, 15, 1, 32, 1, 16, 1, 33, 240, 0, 3, 6, 0, 15]);

for(let i = 0; i < 100; i++) {
    step(cpu);
}