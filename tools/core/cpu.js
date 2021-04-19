const OperandPattern = Object.freeze({
    NONE: 0,
    R: 1,
    RR: 2,
    RRR: 3,
    RRRR: 4,
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

const readWord = (CPU, offset) => CPU.memory[u16(offset)] | (CPU.memory[u16(offset + 1)] << 8);

const u8 = value => value & 0xff;
const u16 = value => value & 0xffff;

// Sign extend 16-bit to 32-bit
const signExt = value => (value >> 15 ? 0xffff : 0x0000) << 16 | value;

// Special registers
const SP = 0xE;
const IP = 0xF;

const Instructions = {
    0x00: {
        name: "NOP",
        operands: OperandPattern.NONE,
        handler: (CPU) => {}
    },
    0x01: {
        name: "MOV",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = CPU.registers[RA];
        }
    },
    0x02: {
        name: "MOVB",
        operands: OperandPattern.Imm8R,
        handler: (CPU, imm, R) => {
            CPU.registers[R] = imm;
        }
    },
    0x03: {
        name: "MOVW",
        operands: OperandPattern.Imm16R,
        handler: (CPU, imm, R) => {
            CPU.registers[R] = imm;
        }
    },
    0x04: {
        name: "STOREB",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.memory[CPU.registers[RB]] = u8(CPU.registers[RA]);
        }
    },
    0x05: {
        name: "STOREW",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            storeWord(CPU, CPU.registers[RB], CPU.registers[RA]);
        }
    },
    0x06: {
        name: "LOADB",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = CPU.memory[CPU.registers[RA]];
        }
    },
    0x07: {
        name: "LOADW",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = readWord(CPU, CPU.registers[RA]);
        }
    },
    0x08: {
        name: "NOT",
        operands: OperandPattern.R,
        handler: (CPU, RA) => {
            CPU.registers[RA] = u16(~CPU.registers[RA]);
        }
    },
    0x09: {
        name: "AND",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] & CPU.registers[RB]); 
        }
    },
    0x0A: {
        name: "OR",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] | CPU.registers[RB]);
        }
    },
    0x0B: {
        name: "XOR",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RB] = u16(CPU.registers[RA] ^ CPU.registers[RB]);
        }
    },
    0x0C: {
        name: "SHL",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] << CPU.registers[RB]);
        }
    },
    0x0D: {
        name: "ASR",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] >> CPU.registers[RB]); 
        }
    },
    0x0E: {
        name: "SHR",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.registers[RA] = u16(CPU.registers[RA] >>> CPU.registers[RB]);
        }
    },
    0x0F: {
        name: "ADD",
        operands: OperandPattern.RRR,
        handler: (CPU, RA, RB, RC) => {
            const result = CPU.registers[RA] + CPU.registers[RB];
            CPU.registers[RC] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x10: {
        name: "ADDC",
        operands: OperandPattern.RRR,
        handler: (CPU, RA, RB, RC) => {
            const result = CPU.registers[RA] + CPU.registers[RB] + CPU.carry;
            CPU.registers[RC] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x11: {
        name: "SUB",
        operands: OperandPattern.RRR,
        handler: (CPU, RA, RB, RC) => {
            const result = CPU.registers[RA] - CPU.registers[RB];
            CPU.registers[RC] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x12: {
        name: "SUBB",
        operands: OperandPattern.RRR,
        handler: (CPU, RA, RB, RC) => {
            const result = CPU.registers[RA] - CPU.registers[RB] - CPU.carry;
            CPU.registers[RC] = u16(result);
            CPU.carry = Boolean(result >> 16);
        }
    },
    0x13: {
        name: "MUL",
        operands: OperandPattern.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            const result = CPU.registers[RA] * CPU.registers[RB];
            CPU.registers[RC] = (result >> 16) & 0xffff;
            CPU.registers[RD] = result & 0xFFFF;     
        }
    },
    0x14: {
        name: "IMUL",
        operands: OperandPattern.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            const result = signExt(CPU.registers[RA]) * signExt(CPU.registers[RB]);
            CPU.registers[RC] = (result >> 16) & 0xffff;
            CPU.registers[RD] = result & 0xFFFF;
        }
    },
    0x15: {
        name: "DIV",
        operands: OperandPattern.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            CPU.registers[RC] = Math.trunc(CPU.registers[RA] / CPU.registers[RB]);
            CPU.registers[RD] = CPU.registers[RA] % CPU.registers[RB];
        }
    },
    0x16: {
        name: "IDIV",
        operands: OperandPattern.RRRR,
        handler: (CPU, RA, RB, RC, RD) => {
            const A = signExt(CPU.registers[RA]);
            const B = signExt(CPU.registers[RB]);
            CPU.registers[RC] = Math.trunc(A / B);
            CPU.registers[RD] = A % B;
        }
    },
    0x17: {
        name: "CC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.carry = false;
        }
    },
    0x18: {
        name: "SC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.carry = true;
        }
    },
    0x19: {
        name: "IFZ",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R == 0;
        }
    },
    0x1A: {
        name: "IF",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R != 0;
        }
    },
    0x1B: {
        name: "IFEQ",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.registers[RA] == CPU.registers[RB];
        }
    },
    0x1C: {
        name: "IFNEQ",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.registers[RA] != CPU.registers[RB];
        }
    },
    0x1D: {
        name: "IFGU",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = u16(CPU.registers[RA]) > u16(CPU.registers[RB]);
        }
    },
    0x1E: {
        name: "IFLU",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = u16(CPU.registers[RA]) < u16(CPU.registers[RB]);
        }
    },
    0x1F: {
        name: "IFGS",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = signExt(CPU.registers[RA]) > signExt(CPU.registers[RB]);
        }
    },
    0x20: {
        name: "IFLS",
        operands: OperandPattern.RR,
        handler: (CPU, RA, RB) => {
            CPU.predicateCondition = signExt(CPU.registers[RA]) < signExt(CPU.registers[RB]);
        }
    },
    0x21: {
        name: "IFC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.predicateCondition = CPU.carry;
        }
    },
    0x22: {
        name: "IFNC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.predicateCondition = !CPU.carry;
        }
    },
    0x23: {
        name: "CALL",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.storeWord(CPU, CPU.registers[SP], CPU.registers[IP]);
            CPU.registers[SP] = u16(CPU.registers[SP] - 2);
            CPU.registers[IP] = CPU.registers[R];
        }
    },
    0x24: {
        name: "PUSHB",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.memory[CPU.registers[SP]] = u8(CPU.registers[R]);
            CPU.registers[SP] = u16(CPU.registers[SP] - 1);
        }
    },
    0x25: {
        name: "PUSHW",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.storeWord(CPU, CPU.registers[SP], CPU.registers[R]);
            CPU.registers[SP] = u16(CPU.registers[SP] - 2);
        }
    },
    0x26: {
        name: "POPB",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.registers[R] = CPU.memory[CPU.registers[SP]];
            CPU.registers[SP] = u16(CPU.registers[SP] + 1);
        }
    },
    0x27: {
        name: "POPW",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.registers[R] = readWord(CPU, CPU.registers[SP]);
            CPU.registers[SP] = u16(CPU.registers[SP] + 2); 
        }
    },
    0xF0: {
        name: "TMPPRINT",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            if(CPU.onPrint) {
                CPU.onPrint(CPU.registers[R]);
            }
        }
    }
};

const readRegisterOperands = (CPU, count) => {
    const list = [];
    let offset = 1;
    for(let i = 0; i < count; i++) {
        if(i % 2) {
            list.push(CPU.memory[CPU.registers[IP] + offset] & 0x0F);
            offset++;
        } else {
            list.push((CPU.memory[CPU.registers[IP] + offset] & 0xF0) >> 4);
        }
    }
    return list;
};

const step = (CPU) => {

    // decode instruction
    const insnPtr = CPU.registers[IP];
    const opcode = CPU.memory[insnPtr];
    const insn = Instructions[opcode];

    if(!insn) {
        throw new Error(`Unknown opcode 0x${opcode.toString(16)}`);
    }

    let operands, bytes;
    switch(insn.operands) {
        case OperandPattern.NONE:
            operands = [];
            bytes = 0;
        break;
        case OperandPattern.R:
        case OperandPattern.RR:
        case OperandPattern.RRR:
        case OperandPattern.RRRR:
            operands = readRegisterOperands(CPU, insn.operands);
            bytes = Math.ceil(insn.operands / 2)
        break;
        case OperandPattern.Imm8R:
            operands = [
                CPU.memory[insnPtr + 1],
                CPU.memory[insnPtr + 2] & 0xF
            ];
            bytes = 2;
        break;
        case OperandPattern.Imm16R: 
            operands = [
                CPU.memory[insnPtr + 1] |
                CPU.memory[insnPtr + 2] << 8,
                CPU.memory[insnPtr + 3] & 0xF
            ];
            bytes = 3;
        break;
    }
    
    // debug purposes
    //console.log(insn.name, operands, CPU.applyPredicate, CPU.predicateCondition);

    // advance instruction pointer
    CPU.registers[IP] += bytes + 1;

    if(CPU.applyPredicate) {
        CPU.applyPredicate = false;
        if(!CPU.predicateCondition) return;
    }

    insn.handler(CPU, ...operands);

};