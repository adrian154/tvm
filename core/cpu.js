const OPERAND_PATTERN = Object.freeze({
    NONE: 0,
    R: 1,
    RR: 2,
    RRRR: 3,
    Imm8R: 5,
    Imm16R: 6
});

const createCPU = () => ({
    applyPredicate: false,
    predicateCondition: true,
    memory: new Uint8Array(65536),
    registers: new Array(16).fill(0),
    carry: false
});

const storeWord = (CPU, offset, value) => {
    CPU.memory[u16(offset)] = value & 0xff;
    CPU.memory[u16(offset + 1)] = (value & 0xff00) >>> 8;
};

const readWord = (CPU, offset) => {
    return CPU.memory[u16(offset)] | (CPU.memory[u16(offset + 1)] << 8);
};

const u8 = value => value & 0xff;
const u16 = value => value & 0xffff;

// Sign extend 16-bit to 32-bit
const signExt = value => (value >> 15 ? 0xffff : 0x0000) << 16 | value;

const INSTRUCTIONS = {
    0x00: {
        name: "NOP",
        operands: OPERAND_PATTERN.NONE,
        handler: (CPU) => {}
    },
    0x01: {
        name: "MOV",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = CPU.registers[RA];
        }
    },
    0x02: {
        name: "MOV",
        operands: OPERAND_PATTERN.Imm8R,
        handler: (CPU, imm, R) => {
            CPU.registers[R] |= imm;
        }
    },
    0x03: {
        name: "MOV",
        operands: OPERAND_PATTERN.Imm16R,
        handler: (CPU, imm, R) => {
            CPU.registers[R] = imm;
        }
    },
    0x04: {
        name: "STOREB",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.memory[CPU.registers[RB]] = u8(CPU.registers[RA]);
        }
    },
    0x05: {
        name: "STOREW",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            storeWord(CPU, CPU.registers[RB], CPU.registers[RA]);
        }
    },
    0x06: {
        name: "LOADB",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = CPU.memory[CPU.registers[RA]];
        }
    },
    0x07: {
        name: "LOADW",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = readWord(CPU, CPU.registers[RA]);
        }
    },
    0x08: {
        name: "NOT",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(~CPU.registers[RA]);
        }
    },
    0x09: {
        name: "AND",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] & CPU.registers[RB]); 
        }
    },
    0x0A: {
        name: "OR",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] | CPU.registers[RB]);
        }
    },
    0x0B: {
        name: "XOR",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] ^ CPU.registers[RB]);
        }
    },

    0x0C: {
        name: "SHL",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] << CPU.registers[RB]);
        }
    },
    0x0D: {
        name: "ASR",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] >> CPU.registers[RB]); 
        }
    },
    0x0E: {
        name: "SHR",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] >>> CPU.registers[RB]);
        }
    },
    0x0F: {
        name: "ADD",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB) => {
            const result = CPU.registers[RA] + CPU.registers[RB];
            CPU.registers[RB] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x10: {
        name: "ADDC",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB) => {
            const result = CPU.registers[RA] + CPU.registers[RB] + CPU.carry;
            CPU.registers[RB] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x11: {
        name: "SUB",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB) => {
            const result = CPU.registers[RA] - CPU.registers[RB];
            CPU.registers[RB] = u16(result);
            CPU.borrow = Boolean(result >> 16);
        }
    },
    0x12: {
        name: "SUBB",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB) => {
            const result = CPU.registers[RA] - CPU.registers[RB] - CPU.carry;
            CPU.registers[RB] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x13: {
        name: "MUL",
        operands: OPERAND_PATTERN.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            const result = CPU.registers[RA] * CPU.registers[RB];
            CPU.registers[RC] = (result >> 16) & 0xffff;
            CPU.registers[RD] = result & 0xFFFF;     
        }
    },
    0x27: {
        name: "IMUL",
        operands: OPERAND_PATTERN.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            const result = signExt(CPU.registers[RA]) * signExt(CPU.registers[RB]);
            CPU.registers[RC] = (result >> 16) & 0xffff;
            CPU.registers[RD] = result & 0xFFFF;
        }
    },
    0x15: {
        name: "DIV",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB, RC) => {
            CPU.registers[RB] = Math.trunc(CPU.registers[RA] / CPU.registers[RB]);
            CPU.registers[RC] = CPU.registers[RA] % CPU.registers[RB];
        }
    },
    0x28: {
        name: "IDIV",
        operands: OPERAND_PATTERN.RRR,
        handler: (CPU, RA, RB, RC) => {
            const A = signExt(CPU.registers[RA]);
            const B = signExt(CPU.registers[RB]);
            CPU.registers[RB] = Math.trunc(A / B);
            CPU.registers[RC] = A % B;
        }
    },
    0x16: {
        name: "CC",
        operands: OPERAND_PATTERN.NONE,
        handler: (CPU) => {
            CPU.carry = false;
        }
    },
    0x17: {
        name: "SC",
        operands: OPERAND_PATTERN.NONE,
        handler: (CPU) => {
            CPU.carry = true;
        }
    },
    0x1A: {
        name: "IFZ",
        operands: OPERAND_PATTERN.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R == 0;
        }
    },
    0x1B: {
        name: "IF",
        operands: OPERAND_PATTERN.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R != 0;
        }
    },
    0x1C: {
        name: "IFEQ",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.registers[RA] == CPU.registers[RB];
        }
    },
    0x1D: {
        name: "IFNEQ",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.registers[RA] != CPU.registers[RB];
        }
    },
    0x1E: {
        name: "IFGU",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = u16(CPU.registers[RA]) > u16(CPU.registers[RB]);
        }
    },
    0x1F: {
        name: "IFLU",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = u16(CPU.registers[RA]) < u16(CPU.registers[RB]);
        }
    },
    0x23: {
        name: "IFGS",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = signExt(CPU.registers[RA]) > signExt(CPU.registers[RB]);
        }
    },
    0x24: {
        name: "IFLS",
        operands: OPERAND_PATTERN.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = signExt(CPU.registers[RA]) < signExt(CPU.registers[RB]);
        }
    },
    0x25: {
        name: "IFC",
        operands: OPERAND_PATTERN.NONE,
        handler: (CPU) => {
            CPU.predicateCondition = CPU.carry;
        }
    },
    0x26: {
        name: "IFNC",
        operands: OPERAND_PATTERN.NONE,
        handler: (CPU) => {
            CPU.predicateCondition = !CPU.carry;
        }
    },
    0x20: {
        name: "CALL",
        operands: OPERAND_PATTERN.R,
        handler: (CPU, R) => {
            CPU.storeWord(CPU, CPU.registers[0xE], CPU.registers[0xF]);
            CPU.registers[0xE] = u16(CPU.registers[0xE] - 2);
            CPU.registers[0xF] = CPU.registers[R];
        }
    },
    0x21: {
        name: "PUSHB",
        operands: OPERAND_PATTERN.R,
        handler: (CPU, R) => {
            CPU.memory[CPU.registers[0xE]] = u8(CPU.registers[R]);
            CPU.registers[0xE] = u16(CPU.registers[0xE] - 1);
        }
    },
    0x22: {
        name: "PUSHW",
        operands: OPERAND_PATTERN.R,
        handler: (CPU, R) => {
            CPU.storeWord(CPU, CPU.registers[0xE], CPU.registers[R]);
            CPU.registers[0xE] = u16(CPU.registers[0xE] - 2);
        }
    }
};

const readRegisterOperands = (CPU, count) => {
    const list = [];
    let offset = 1;
    for(let i = 0; i < count; i++) {
        if(i % 2) {
            list.push(CPU.memory[CPU.registers[0xF] + offset] & 0x0F);
            offset++;
        } else {
            list.push((CPU.memory[CPU.registers[0xF] + offset] & 0xF0) >> 4);
        }
    }
    return list;
};

const step = (CPU) => {

    // reset predicate after an iteration
    if(CPU.applyPredicate) CPU.applyPredicate = false;

    // decode instruction
    const insnPtr = CPU.registers[0xF];
    const opcode = CPU.memory[insnPtr];
    const insn = INSTRUCTIONS[opcode];

    if(!insn) {
        throw new Error(`Unknown opcode 0x${opcode.toString(16)}`);
    }

    let operands, bytes;
    switch(insn.operands) {
        case OPERAND_PATTERN.NONE:
            operands = [];
            bytes = 0;
        break;
        case OPERAND_PATTERN.R:
            operands = readRegisterOperands(CPU, 1);
            bytes = 1;
        break;
        case OPERAND_PATTERN.RR:
            operands = readRegisterOperands(CPU, 2);
            bytes = 1;
        break;
        case OPERAND_PATTERN.RRRR:
            operands = readRegisterOperands(CPU, 4);
            bytes = 2;
        break;
        case OPERAND_PATTERN.Imm8R:
            operands = [
                CPU.memory[insnPtr + 1],
                CPU.memory[insnPtr + 2] & 0xF
            ];
            bytes = 2;
        break;
        case OPERAND_PATTERN.Imm16R: 
            operands = [
                CPU.memory[insnPtr + 1] |
                CPU.memory[insnPtr + 2] << 8,
                CPU.memory[insnPtr + 3] & 0xF
            ];
            bytes = 3;
        break;
    }

    // temp: disassemble & print
    let str = insn.name + " ";
    switch(insn.operands) {
        case OPERAND_PATTERN.R:
        case OPERAND_PATTERN.RR:
        case OPERAND_PATTERN.RRRR:
            str += operands.map(reg => "R" + reg.toString(16)).join(", ");
            break;
        case OPERAND_PATTERN.Imm8R:
        case OPERAND_PATTERN.Imm16R:
            str += " 0x" + operands[0].toString(16) + ", R" + operands[1].toString(16);
            break;
    }

    console.log(str);

    // advance instruction pointer
    CPU.registers[0xF] += bytes + 1;

    if(CPU.applyPredicate ? CPU.predicateCondition : true) {
        insn.handler(CPU, ...operands);
    }

};