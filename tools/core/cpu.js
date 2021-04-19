const OperandPattern = Object.freeze({
    NONE: 0,
    R: 1,
    Src: 2,
    SrcR: 3,
    SrcSrc: 4,
    SrcSrcR: 5,
    SrcSrcRR: 6
});

const SRC_TYPE_REG = 0;
const SRC_TYPE_IMM = 1;

const createCPU = () => ({
    applyPredicate: false,
    predicateCondition: true,
    memory: new Uint8Array(65536),
    registers: new Array(16).fill(0),
    flag: false
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
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = Src;
        }
    },
    0x04: {
        name: "STOREB",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.memory[SrcB] = u8(SrcA);
        }
    },
    0x05: {
        name: "STOREW",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            storeWord(CPU, SrcB, SrcA);
        }
    },
    0x06: {
        name: "LOADB",
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = CPU.memory[Src];
        }
    },
    0x07: {
        name: "LOADW",
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = readWord(CPU, Src);
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
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA & SrcB); 
        }
    },
    0x0A: {
        name: "OR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA | SrcB);
        }
    },
    0x0B: {
        name: "XOR",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA ^ SrcB);
        }
    },
    0x0C: {
        name: "SHL",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA << SrcB);
        }
    },
    0x0D: {
        name: "ASR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA >> SrcB); 
        }
    },
    0x0E: {
        name: "SHR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = u16(SrcA >>> SrcB);
        }
    },
    0x0F: {
        name: "ADD",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA + SrcB;
            CPU.registers[R] = u16(result);
            CPU.flag = Boolean(result >> 16);
        }
    },
    0x10: {
        name: "ADDC",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA + SrcB + CPU.flag;
            CPU.registers[R] = u16(result);
            CPU.flag = Boolean(result >> 16);
        }
    },
    0x11: {
        name: "SUB",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA - SrcB;
            CPU.registers[R] = u16(result);
            CPU.flag = Boolean(result >> 16);
        }
    },
    0x12: {
        name: "SUBB",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA - SrcB - CPU.flag;
            CPU.registers[R] = u16(result);
            CPU.flag = Boolean(result >> 16);
        }
    },
    0x13: {
        name: "MUL",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const result = SrcA * SrcB;
            CPU.registers[RA] = (result >> 16) & 0xffff;
            CPU.registers[RB] = result & 0xFFFF;     
        }
    },
    0x14: {
        name: "IMUL",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const result = signExt(SrcA) * signExt(SrcB);
            CPU.registers[RA] = (result >> 16) & 0xffff;
            CPU.registers[RB] = result & 0xFFFF;
        }
    },
    0x15: {
        name: "DIV",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            CPU.registers[RA] = Math.trunc(SrcA / SrcB);
            CPU.registers[RB] = SrcA % SrcB;
        }
    },
    0x16: {
        name: "IDIV",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const A = signExt(SrcA);
            const B = signExt(SrcB);
            CPU.registers[RA] = Math.trunc(A / B);
            CPU.registers[RB] = A % B;
        }
    },
    0x17: {
        name: "CF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.flag = false;
        }
    },
    0x18: {
        name: "SF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.flag = true;
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
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA == SrcB;
        }
    },
    0x1C: {
        name: "IFNEQ",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA != SrcB;
        }
    },
    0x1D: {
        name: "IFGU",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = u16(SrcA) > u16(SrcB);
        }
    },
    0x1E: {
        name: "IFLU",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = u16(SrcA) < u16(SrcB);
        }
    },
    0x1F: {
        name: "IFGS",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = signExt(SrcA) > signExt(SrcB);
        }
    },
    0x20: {
        name: "IFLS",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = signExt(SrcA) < signExt(SrcB);
        }
    },
    0x21: {
        name: "IFC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.flag;
        }
    },
    0x22: {
        name: "IFNC",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = !CPU.flag;
        }
    },
    0x23: {
        name: "CALL",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP] = u16(CPU.registers[SP] - 2);
            storeWord(CPU, CPU.registers[SP], CPU.registers[IP]);
            CPU.registers[IP] = Src;
        }
    },
    0x24: {
        name: "PUSHB",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP] = u16(CPU.registers[SP] - 1);
            CPU.memory[CPU.registers[SP]] = u8(Src);
        }
    },
    0x25: {
        name: "PUSHW",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP] = u16(CPU.registers[SP] - 2);
            storeWord(CPU, CPU.registers[SP], Src);
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
    0x28: {
        name: "TMPPRINT",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            if(CPU.onPrint) {
                CPU.onPrint(Src);
            }
        }
    }
};

const readSrc = (CPU, type) => {
    if(type == SRC_TYPE_IMM) {
        const value = readWord(CPU, CPU.registers[IP]);
        CPU.registers[IP] += 2;
        return value;
    } else {
        const value = CPU.registers[CPU.memory[CPU.registers[IP]++] & 0x0F];
        return value;
    }
};

const readRegister = (CPU) => CPU.memory[CPU.registers[IP]++] & 0x0F;

const step = (CPU) => {

    // decode instruction
    const opcodeFull = CPU.memory[CPU.registers[IP]++];
    const opcode = opcodeFull & 0b111111; // take off top two bits which are used for src/dest
    const src0Type = (opcodeFull & 0b10000000) >> 7;
    const src1Type = (opcodeFull & 0b01000000) >> 6;
    const insn = Instructions[opcode];

    if(!insn) {
        throw new Error(`Assembly error: Unknown opcode 0x${opcode.toString(16)}`);
    }

    // read operands
    let operands;
    switch(insn.operands) {
        case OperandPattern.NONE:
            operands = [];
        break;
        case OperandPattern.R:
            operands = [readRegister(CPU)];
        break;
        case OperandPattern.Src:
            operands = [readSrc(CPU, src0Type)];
        break;
        case OperandPattern.SrcR:
            operands = [readSrc(CPU, src0Type), readRegister(CPU)];
        break;
        case OperandPattern.SrcSrc:
            operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type)];
        break;
        case OperandPattern.SrcSrcR:
            operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type), readRegister(CPU)];
        break;
        case OperandPattern.SrcSrcRR:
            operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type), readRegister(CPU), readRegister(CPU)];
        break;
    }
    
    if(CPU.applyPredicate) {
        CPU.applyPredicate = false;
        if(!CPU.predicateCondition) return;
    }

    //console.log(CPU.registers[IP], insn.name, operands, src0Type, src1Type, cpu.applyPredicate, cpu.predicateCondition);

    insn.handler(CPU, ...operands);

};