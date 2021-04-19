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
    FindOperandEnd: 3,
    FindCommentEnd: 4
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
                } else if(char === ";") {
                    state = State.FindCommentEnd;
                } else if(!testWhitespace(char)) {
                    throw new Error(`Illegal character in verb: "${char}" (line ${line})`);
                }
                break;
            }
            case State.FindVerbEnd: {
                if(NAME_CHAR.test(char)) {
                    curToken += char;
                } else if(char === ":") {
                    tokens.push({type: Token.LabelDeclaration, name: curToken, line: line});
                    state = State.FindVerbStart;
                } else if(char === "." || testWhitespace(char)) {
                    tokens.push({type: Token.Instruction, name: curToken, line: line});
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
                        tokens.push({type: Token.Register, register: parseInt(match[1], 16), line: line});
                    } else if((match = curToken.match(HEX_LITERAL))) {
                        tokens.push({type: Token.Number, value: parseInt(match[1], 16), line: line});
                    } else if((match = curToken.match(BINARY_LITERAL))) {
                        tokens.push({type: Token.Number, value: parseInt(match[1], 2), line: line});
                    } else if(DECIMAL_LITERAL.test(curToken)) {
                        tokens.push({type: Token.Number, value: parseInt(curToken), line: line});
                    } else if(LABEL.test(curToken)) {
                        tokens.push({type: Token.Label, name: curToken, line: line});
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
            case State.FindCommentEnd: {
                if(char === "\n") {
                    state = State.FindVerbStart; 
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
        instruction.opcode = Number(opcode); // necessary cast, thanks @pancake
        dictionary[instruction.name.toLowerCase()] = instruction;
        dictionary[instruction.name.toUpperCase()] = instruction; 
    }
    return dictionary;
};

const opcodeDictionary = createOpcodeDictionary();

const checkType = (token, type) => {
    if(!token || token.type !== type) {
        throw new Error(`Expected ${type} but got ${token?.type ?? "end of input"} (line ${token.line})`);
    }
    return token;
};

const checkIsSource = (token) => {
    if(token.type !== Token.Number && token.type !== Token.Register && token.type !== Token.Label) {
        throw new Error(`Expected source but got ${token?.type ?? "end of input"} (line ${token.line})`);
    }
    return token;
};

const parse = (tokens) => {

    let instructions = [];
    
    while(tokens.length > 0) {
        
        const token = tokens.shift();
        if(token.type === Token.LabelDeclaration) {
            instructions.push({labelDeclaration: true, name: token.name});
        } else if(token.type === Token.Instruction) {
            
            const instruction = opcodeDictionary[token.name];
            if(!instruction) {
                throw new Error(`Unknown instruction "${token.name}" (line ${token.line})`);
            }
            
            let operands;
            switch(instruction.operands) {
                case OperandPattern.NONE: break;
                case OperandPattern.R:
                    operands = [checkType(tokens.shift(), Token.Register)];
                break;
                case OperandPattern.Src:
                    operands = [checkIsSource(tokens.shift())];
                break;
                case OperandPattern.SrcR:
                    operands = [checkIsSource(tokens.shift()), checkType(tokens.shift(), Token.Register)]; 
                break;
                case OperandPattern.SrcSrc:
                    operands = [checkIsSource(tokens.shift()), checkIsSource(tokens.shift())];
                break;
                case OperandPattern.SrcSrcR:
                    operands = [checkIsSource(tokens.shift()), checkIsSource(tokens.shift()), checkType(tokens.shift(), Token.Register)];
                break;
                case OperandPattern.SrcSrcRR:
                    operands = [checkIsSource(tokens.shift), checkIsSource(tokens.shift), checkType(tokens.shift(), Token.Register), checkType(tokens.shift(), Token.Register)];
                break;
            }

            instructions.push({opcode: instruction.opcode, pattern: instruction.operands, operands: operands});

        } else {
            throw new Error(`Unexpected ${token.type} while parsing, anticipated a label declaration or instruction (line ${token.line})`);
        }

    }

    return instructions;

};

const encode = (instruction) => {
    let srcMask = 0;
    if(instruction.pattern >= OperandPattern.Src) {
        if(instruction.pattern > OperandPattern.SrcSrc) {
            srcMask = (instruction.operands[0].hasOwnProperty("value") ? SRC_TYPE_IMM : SRC_TYPE_REG) << 1 | (instruction.operands[1].value ? SRC_TYPE_IMM : SRC_TYPE_REG)
        } else {
            srcMask = (instruction.operands[0].hasOwnProperty("value") ? SRC_TYPE_IMM : SRC_TYPE_REG) << 1;
        }
    }
    const buffer = [instruction.opcode | (srcMask << 6)];
    for(const operand of instruction.operands) {
        if(operand.type == Token.Register) {
            console.log("register " + operand.register);
            buffer.push(operand.register);
        } else if(operand.hasOwnProperty("value")) {
            console.log("imm " + operand.value)
            buffer.push(operand.value & 0xFF, (operand.value & 0xFF00) >> 8);
        }
    }
    console.log(instruction.opcode, buffer);
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
            let instructionLength = 1;
            for(const operand of instruction.operands) {
                instructionLength += operand.type == Token.Register ? 1 : 2;
            }
            offset += instructionLength;
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

    return {code: buffer, symbols: labels};

};