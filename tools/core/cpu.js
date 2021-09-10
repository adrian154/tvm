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
    registers: new Uint16Array(16).fill(0),
    flag: false
});

// memory is handled by two functions
// CPU.store(value, offset) 
// CPU.read(offset)
// one byte is handled at a time
// offset should be AND'd with 0xffff

// util funcs for multibyte access
const storeWord = (CPU, offset, value) => {
    CPU.store(value & 0xff, u16(offset));
    CPU.store((value & 0xff00) >> 8, u16(offset + 1));
};

const readWord = (CPU, offset) => CPU.read(u16(offset)) | (CPU.read(u16(offset + 1)) << 8);

// other misc helpers
const u8 = value => value & 0xff;
const u16 = value => value & 0xffff;
const signExt = value => (value >> 15 ? 0xffff : 0x0000) << 16 | value;

// Special registers
const SP = 0xE;
const IP = 0xF;

const Instructions = {
    0: {
        name: "NOP",
        operands: OperandPattern.NONE,
        handler: (CPU) => {}
    },
    2: {
        name: "MOV",
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = Src;
        }
    },
    3: {
        name: "STOREB",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.store(SrcA, SrcB);
        }
    },
    4: {
        name: "STOREW",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            storeWord(CPU, SrcB, SrcA);
        }
    },
    5: {
        name: "LOADB",
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = CPU.read(Src);
        }
    },
    6: {
        name: "LOADW",
        operands: OperandPattern.SrcR,
        handler: (CPU, Src, R) => {
            CPU.registers[R] = readWord(CPU, Src);
        }
    },
    7: {
        name: "NOT",
        operands: OperandPattern.R,
        handler: (CPU, RA) => {
            CPU.registers[RA] = ~CPU.registers[RA];
        }
    },
    8: {
        name: "AND",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA & SrcB; 
        }
    },
    9: {
        name: "OR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA | SrcB;
        }
    },
    10: {
        name: "XOR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA ^ SrcB;
        }
    },
    11: {
        name: "SHL",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA << SrcB;
        }
    },
    12: {
        name: "ASR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA >> SrcB; 
        }
    },
    13: {
        name: "SHR",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            CPU.registers[R] = SrcA >>> SrcB;
        }
    },
    14: {
        name: "ADD",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA + SrcB;
            CPU.registers[R] = result;
            CPU.flag = Boolean(result >> 16);
        }
    },
    15: {
        name: "ADDC",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA + SrcB + CPU.flag;
            CPU.registers[R] = result;
            CPU.flag = Boolean(result >> 16);
        }
    },
    16: {
        name: "SUB",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA - SrcB;
            CPU.registers[R] = result;
            CPU.flag = Boolean(result >> 16);
        }
    },
    17: {
        name: "SUBB",
        operands: OperandPattern.SrcSrcR,
        handler: (CPU, SrcA, SrcB, R) => {
            const result = SrcA - SrcB - CPU.flag;
            CPU.registers[R] = result;
            CPU.flag = Boolean(result >> 16);
        }
    },
    18: {
        name: "MUL",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const result = SrcA * SrcB;
            CPU.registers[RA] = result >> 16;
            CPU.registers[RB] = result;     
        }
    },
    19: {
        name: "IMUL",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const result = signExt(SrcA) * signExt(SrcB);
            CPU.registers[RA] = result >> 16;
            CPU.registers[RB] = result;
        }
    },
    20: {
        name: "DIV",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            CPU.registers[RA] = Math.trunc(SrcA / SrcB);
            CPU.registers[RB] = SrcA % SrcB;
        }
    },
    21: {
        name: "IDIV",
        operands: OperandPattern.SrcSrcRR,
        handler: (CPU, SrcA, SrcB, RA, RB) => {
            const A = signExt(SrcA);
            const B = signExt(SrcB);
            CPU.registers[RA] = Math.trunc(A / B);
            CPU.registers[RB] = A % B;
        }
    },
    22: {
        name: "CF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.flag = false;
        }
    },
    23: {
        name: "SF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.flag = true;
        }
    },
    24: {
        name: "IFZ",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R === 0;
        }
    },
    25: {
        name: "IF",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = R !== 0;
        }
    },
    26: {
        name: "IFEQ",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA == SrcB;
        }
    },
    27: {
        name: "IFNEQ",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA !== SrcB;
        }
    },
    28: {
        name: "IFG",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA > SrcB;
        }
    },
    29: {
        name: "IFL",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = SrcA < SrcB;
        }
    },
    30: {
        name: "IFGS",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = signExt(SrcA) > signExt(SrcB);
        }
    },
    31: {
        name: "IFLS",
        operands: OperandPattern.SrcSrc,
        handler: (CPU, SrcA, SrcB) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = signExt(SrcA) < signExt(SrcB);
        }
    },
    32: {
        name: "IFF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = CPU.flag;
        }
    },
    33: {
        name: "IFNF",
        operands: OperandPattern.NONE,
        handler: (CPU) => {
            CPU.applyPredicate = true;
            CPU.predicateCondition = !CPU.flag;
        }
    },
    34: {
        name: "CALL",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP] -= 2;
            storeWord(CPU, CPU.registers[SP], CPU.registers[IP]);
            CPU.registers[IP] = Src;
        }
    },
    35: {
        name: "PUSHB",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP]--;
            CPU.store(Src, CPU.registers[SP]);
        }
    },
    36: {
        name: "PUSHW",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            CPU.registers[SP]-= 2;
            storeWord(CPU, CPU.registers[SP], Src);
        }
    },
    37: {
        name: "POPB",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.registers[R] = CPU.read(CPU.registers[SP]);
            CPU.registers[SP] = CPU.registers[SP] + 1;
        }
    },
    38: {
        name: "POPW",
        operands: OperandPattern.R,
        handler: (CPU, R) => {
            CPU.registers[R] = readWord(CPU, CPU.registers[SP]);
            CPU.registers[SP] = CPU.registers[SP] + 2; 
        }
    },
    39: {
        name: "OUT",
        operands: OperandPattern.Src,
        handler: (CPU, Src) => {
            if(CPU.onPrint) {
                CPU.onPrint(Src & 0xff);
            }
        }
    }
};

// operand reading helpers
const fetchInsnByte = (CPU) => CPU.read(CPU.registers[IP]++);
const readRegister = (CPU) => fetchInsnByte(CPU) & 0x0F;
const readImmediate = (CPU) => fetchInsnByte(CPU) | (fetchInsnByte(CPU) << 8);
const readSrc = (CPU, type) => type === SRC_TYPE_REG ? CPU.registers[readRegister(CPU)] : readImmediate(CPU); 

const step = (CPU) => {

    // decode instruction
    const opcodeFull = CPU.memory[CPU.registers[IP]++];
    const opcode = opcodeFull & 0b111111; // opcode = lower 6 bits
    const src0Type = (opcodeFull >> 6) & 0b10;
    const src1Type = (opcodeFull >> 6) & 0b01;
    const insn = Instructions[opcode];

    if(!insn) {
        throw new Error(`Unknown opcode ${opcode} (byte 0x${opcodeFull.toString(16)})`);
    }

    // read operands
    // this part is a little horrible
    let operands;
    switch(insn.operands) {
        case OperandPattern.NONE:       operands = []; break;
        case OperandPattern.R:          operands = [readRegister(CPU)]; break;
        case OperandPattern.Src:        operands = [readSrc(CPU, src0Type)]; break;
        case OperandPattern.SrcR:       operands = [readSrc(CPU, src0Type), readRegister(CPU)]; break;
        case OperandPattern.SrcSrc:     operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type)]; break;
        case OperandPattern.SrcSrcR:    operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type), readRegister(CPU)]; break;
        case OperandPattern.SrcSrcRR:   operands = [readSrc(CPU, src0Type), readSrc(CPU, src1Type), readRegister(CPU), readRegister(CPU)]; break;
    }
    
    if(CPU.applyPredicate) {
        CPU.applyPredicate = false;
        if(!CPU.predicateCondition) return;
    }

    insn.handler(CPU, ...operands);

};