// pretty run of the mill assembler

// single char regexes
const WHITESPACE = /\s/;
const NAME_CHAR = /[a-zA-Z0-9_-]/;

// patterns
const DECIMAL_LITERAL = /^[0-9]+$/;
const HEX_LITERAL = /^0x([a-fA-F0-9]+$)/;
const BINARY_LITERAL = /^0b([01]+)$/;
const REGISTER = /^[rR]([0-9a-fA-F])$/;
const LABEL = /^[a-zA-Z0-9_-]+$/;

const Token = Object.freeze({
    LabelDeclaration: "label declaration",
    Instruction: "instruction",
    Register: "register",
    Number: "number",
    Label: "label"
});

const State = Object.freeze({
    FindVerbStart: 0,
    FindVerbEnd: 1,
    FindOperandStart: 2,
    FindOperandEnd: 3
});

const tokenize = (text) => {

    let state = State.FindVerbStart;
    let curToken = "";
    let pos = 0;
    let stay = false;
    let tokens = [];
    let line = 1;

    const testWhitespace = (char) => {
        if(WHITESPACE.test(char)) {
            if(char === "\n") line++; 
            return true;
        } else {
            return false;
        }
    };

    while(pos < text.length) {

        const char = text[pos];

        switch(state) {
            case State.FindVerbStart: {
                if(NAME_CHAR.test(char)) {
                    state = State.FindVerbEnd;
                    curToken = "";
                    stay = true;
                } else if(!testWhitespace(char)) {
                    throw new Error(`Illegal character in verb: "${char}" (line ${line})`);
                }
                break;
            }
            case State.FindVerbEnd: {
                if(NAME_CHAR.test(char)) {
                    curToken += char;
                } else if(char === ":") {
                    tokens.push({type: Token.LabelDeclaration, name: curToken});
                    state = State.FindVerbStart;
                } else if(char === "." || testWhitespace(char)) {
                    tokens.push({type: Token.Instruction, name: curToken});
                    if(char !== ".") {
                        state = State.FindOperandStart;
                    }
                } else {
                    throw new Error(`Illegal character in verb: "${char}" (line ${line})`);
                }
                break;
            }
            case State.FindOperandStart: {
                if(!testWhitespace(char)) {
                    state = State.FindOperandEnd;
                    curToken = "";
                    stay = true;
                }
                break;
            }
            case State.FindOperandEnd: {
                if(char === "," || testWhitespace(char)) {

                    // parse operand
                    let match;
                    if((match = curToken.match(REGISTER))) {
                        tokens.push({type: Token.Register, register: parseInt(match[1], 16)});
                    } else if((match = curToken.match(HEX_LITERAL))) {
                        tokens.push({type: Token.Number, value: parseInt(match[1], 16)});
                    } else if((match = curToken.match(BINARY_LITERAL))) {
                        tokens.push({type: Token.Number, value: parseInt(match[1], 2)});
                    } else if(DECIMAL_LITERAL.test(curToken)) {
                        tokens.push({type: Token.Number, value: parseInt(curToken)});
                    } else if(LABEL.test(curToken)) {
                        tokens.push({type: Token.Label, name: curToken});
                    } else {
                        throw new Error(`Illegal operand "${curToken}" (line ${line})`);
                    }

                    if(char === ",") {
                        state = State.FindOperandStart;
                    } else {
                        state = State.FindVerbStart;
                    }

                } else {
                    curToken += char;
                }
                break;
            }
        }

        if(stay) {
            stay = false;
        } else {
            pos++;
        }

    }

    if(state != State.FindVerbStart) {
        throw new Error("Reached unexpected end of input");
    }

    return tokens;

};

const createOpcodeDictionary = () => {
    const dictionary = {};
    for(const opcode in Instructions) {
        const instruction = Instructions[opcode];
        instruction.opcode = Number(opcode); // thanks pankek 
        dictionary[instruction.name.toLowerCase()] = instruction;
        dictionary[instruction.name.toUpperCase()] = instruction; 
    }
    return dictionary;
};

const opcodeDictionary = createOpcodeDictionary();

const parse = (tokens) => {

    let instructions = [];
    
    while(tokens.length > 0) {
        
        const token = tokens.shift();
        if(token.type === Token.LabelDeclaration) {
            instructions.push({labelDeclaration: true, name: token.name});
        } else if(token.type === Token.Instruction) {
            const instruction = opcodeDictionary[token.name];
            if(!instruction) {
                throw new Error(`Unknown instruction "${token.name}"`);
            }
            const operands = [];
            if(instruction.operands <= OperandPattern.RRRR) {
                for(let i = 0; i < instruction.operands; i++) {
                    const operand = tokens.shift();
                    if(!operand || operand.type !== Token.Register) {
                        throw new Error(`Unexpected ${token?.type ?? "end of input"} while parsing, anticipated a register`);
                    }
                    operands.push(operand);
                }
            } else if(instruction.operands == OperandPattern.Imm8R || instruction.operands == OperandPattern.Imm16R) {
                const registerOp = tokens.shift();
                const immOp = tokens.shift();
                if(!registerOp || !immOp) {
                    throw new Error(`Unexpected end of input while parsing, anticipated a register`)
                }
                if(registerOp.type !== Token.Register || (immOp.type !== Token.Number && immOp.type !== Token.Label)) {
                    throw new Error(`Operand type mismatch, expected a register then an immediate value but got a ${registerOp.type} then a ${immOp.type}`)
                }
                operands.push(registerOp, immOp);
            }
            instructions.push({opcode: instruction.opcode, pattern: instruction.operands, operands: operands});
        } else {
            throw new Error(`Unexpected ${token.type} while parsing, anticipated a label declaration or instruction`);
        }

    }

    return instructions;

};

const InstructionLengths = Object.freeze({
    [OperandPattern.R]: 2,
    [OperandPattern.RR]: 2,
    [OperandPattern.RRR]: 3,
    [OperandPattern.RRRR]: 4,
    [OperandPattern.Imm8R]: 3,
    [OperandPattern.Imm16R]: 4
});

const encode = (instruction) => {
    const buffer = [instruction.opcode];
    if(instruction.pattern <= OperandPattern.RRRR) {
        for(let i = 0; i < instruction.operands.length; i++) {
            const idx = Math.trunc(i / 2 + 1);
            if(i % 2 == 0) buffer[Math.trunc(idx)] = instruction.operands[i].register << 4;
            else buffer[Math.trunc(idx)] |= instruction.operands[i].register;
        }
    } else if(instruction.pattern == OperandPattern.Imm8R) {
        buffer.push(instruction.operands[1].value, instruction.operands[0].register);
    } else if(instruction.pattern == OperandPattern.Imm16R) {
        buffer.push(instruction.operands[1].value & 0xff, (instruction.operands[1].value & 0xff00) >> 8, instruction.operands[0].register);
    }
    return buffer;
};

const assemble = (text) => {

    const instructions = parse(tokenize(text + " "));
    const labels = {};
    let offset = 0;
    
    // resolve labels
    for(const instruction of instructions) {
        if(instruction.labelDeclaration) {
            if(labels[instruction.name]) throw new Error(`Duplicate label name ${instruction.name}`);
            labels[instruction.name] = offset;
        } else {
            offset += InstructionLengths[instruction.pattern];
        }
    }

    // do it
    let buffer = [];
    for(const instruction of instructions) {
        if(!instruction.labelDeclaration) {
            // replace labels
            for(const operand of instruction.operands) {
                if(operand.type == Token.Label) {
                    if(!labels[operand.name]) {
                        throw new Error(`Unknown label "${operand.name}"`);
                    }
                    operand.value = labels[operand.name];
                }
            }
            buffer = buffer.concat(encode(instruction));
        }
    }

    return buffer;

};