// pretty run of the mill assembler

// single char regexes
const WHITESPACE = /\s/;
const NAME_CHAR = /[a-zA-Z0-9_-]/;

// patterns
const DECIMAL_LITERAL = /^-?[0-9]+$/;
const HEX_LITERAL = /^0x([a-fA-F0-9]+)$/;
const BINARY_LITERAL = /^0b([01]+)$/;
const CHAR_LITERAL = /^'(.)'$/;
const REGISTER = /^[rR]([0-9a-fA-F])$/;
const LABEL = /^[a-zA-Z0-9_-]+$/;

const Token = Object.freeze({
    LabelDeclaration: "label declaration",
    Instruction: "instruction",
    Register: "register",
    Number: "number",
    Label: "label",
    String: "string"
});

const State = Object.freeze({
    FindVerbStart: 0,
    FindVerbEnd: 1,
    FindOperandStart: 2,
    FindOperandEnd: 3,
    FindCommentEnd: 4,
    FindStringEnd: 5,
    HandleEscape: 6,
    AfterOperand: 7
});

const assembleError = (line, message) => new Error(`line ${line}: ${message}`);

const tokenize = (text) => {

    let state = State.FindVerbStart;
    let curToken = "";
    let pos = 0;
    let stay = false;
    let tokens = [];
    let line = 1;

    while(pos < text.length) {

        const char = text[pos];
        if(char === "\n" && !stay) {
            line++;
        }

        console.log(char, state);

        switch(state) {

            case State.FindVerbStart: {
            
                // start parsing verb
                if(NAME_CHAR.test(char)) {
                    state = State.FindVerbEnd;
                    curToken = "";
                    stay = true;
                } else if(char === ";") {
                    state = State.FindCommentEnd;
                } else if(!WHITESPACE.test(char)) {
                    throw assembleError(line, `Illegal character in verb: "${char}"`);
                }

                break;
            
            }
            
            case State.FindVerbEnd: {
                if(NAME_CHAR.test(char)) {
                    curToken += char;
                } else if(char === ":") {
                    // false alarm, it was a label declaration
                    tokens.push({type: Token.LabelDeclaration, name: curToken, line: line});
                    state = State.FindVerbStart;
                } else if(char === "." || WHITESPACE.test(char)) {
                    // caveat: periods are necessary to indicate to the assembler that an instruction has no operands
                    tokens.push({type: Token.Instruction, name: curToken, line: line});
                    if(char == ".") {
                        state = State.FindVerbStart;
                    } else {
                        state = State.FindOperandStart;
                    }
                } else {
                    throw assembleError(line, `Illegal character in verb: "${char}"`);
                }
                break;
            }
            
            case State.FindOperandStart: {
                if(!WHITESPACE.test(char)) {
                    if(char === "\"") {
                        state = State.FindStringEnd;
                    } else {
                        state = State.FindOperandEnd;
                        stay = true;
                    }
                    curToken = "";
                }
                break;
            }
            
            case State.FindStringEnd: {

                // end quote
                if(char === "\"") { 
                    tokens.push({type: Token.String, string: JSON.parse('"' + curToken + '"')});
                    state = State.AfterOperand;
                } else if(char === "\\") {
                    // escape sequence
                    state = State.HandleEscape;
                } else {
                    curToken += char;
                }
                break;

            }

            case State.HandleEscape: {
            
                // do nothing, let the parser advance
                curToken += "\\" + char;
                state = State.FindStringEnd;
                break;
            
            }

            case State.FindOperandEnd: {

                if(char === "," || char === ";" || WHITESPACE.test(char)) {

                    // parse operand
                    let match;
                    if((match = curToken.match(REGISTER))) {
                        tokens.push({type: Token.Register, register: parseInt(match[1], 16), line: line});
                    } else if((match = curToken.match(HEX_LITERAL))) {
                        tokens.push({type: Token.Number, value: u16(parseInt(match[1], 16)), line: line});
                    } else if((match = curToken.match(BINARY_LITERAL))) {
                        tokens.push({type: Token.Number, value: u16(parseInt(match[1], 2)), line: line});
                    } else if((match = curToken.match(CHAR_LITERAL))) {
                        tokens.push({type: Token.Number, value: match[1].charCodeAt(0) & 0xff, line: line});
                    } else if(DECIMAL_LITERAL.test(curToken)) {
                        tokens.push({type: Token.Number, value: u16(parseInt(curToken)), line: line});
                    } else if(LABEL.test(curToken)) {
                        tokens.push({type: Token.Label, name: curToken, line: line});
                    } else {
                        throw assembleError(line, `Illegal operand "${curToken}`);
                    }

                    stay = true;
                    state = State.AfterOperand;

                } else {
                    curToken += char;
                }
                break;
            }
            
            case State.AfterOperand: {
                if(char === ",") {
                    state = State.FindOperandStart;
                } else if(char === ";") {
                    state = State.FindCommentEnd;
                } else {
                    state = State.FindVerbStart;
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

    if(state !== State.FindVerbStart) {
        throw assembleError(line, "Reached unexpected end of input");
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
        throw assembleError(token.line, `Expected ${type} but got ${token?.type ?? "end of input"}`);
    }
    return token;
};

const checkIsSource = (token) => {
    if(token.type !== Token.Number && token.type !== Token.Register && token.type !== Token.Label) {
        throw assembleError(token.line, `Expected source but got ${token?.type ?? "end of input"}`);
    }
    return token;
};

const checkIsImmediate = (token) => {
    if(!token.hasOwnProperty("value")) {
        throw assembleError(token.line, `Expected immediate value but got ${token?.type ??  "end of input"}`);
    }
    return token;
};

const parse = (tokens) => {

    let instructions = [];
    
    while(tokens.length > 0) {
        
        const token = tokens.shift();
        if(token.type === Token.LabelDeclaration) {
            instructions.push({labelDeclaration: true, name: token.name, line: token.line});
        } else if(token.type === Token.Instruction) {
            
            const instruction = opcodeDictionary[token.name];
            if(!instruction) {

                // builtins
                if(token.name.toLowerCase() === "byte") {
                    const values = [];
                    while(tokens[0]?.hasOwnProperty("value")) {
                        const value = tokens.shift().value;
                        if(value > 0xff) throw assembleError(token.line, `Encountered value too large to fit within byte`);
                        values.push(value);
                    }
                    instructions.push({data: values});
                    continue;
                }
                
                if(token.name.toLowerCase() === "word") {
                    const values = [];
                    while(tokens[0]?.hasOwnProperty("value")) {
                        const value = tokens.shift().value;
                        values.push(value & 0xff, value >> 8);
                    }
                    instructions.push({data: values});
                    continue;
                }
                
                if(token.name.toLowerCase() === "string") {
                    // TODO: fix this lazy string encoding
                    const string = checkType(tokens.shift(), Token.String).string;
                    instructions.push({data: string.split("").map(char => char.charCodeAt(0) & 0xff)});
                    continue;
                }

                throw assembleError(token.line, `Unknown instruction "${token.name}"`);

            }
            
            let operands;
            switch(instruction.operands) {
                case OperandPattern.NONE: 
                    operands = [];
                break;
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
                    operands = [checkIsSource(tokens.shift()), checkIsSource(tokens.shift()), checkType(tokens.shift(), Token.Register), checkType(tokens.shift(), Token.Register)];
                break;
                case OperandPattern.SrcSrcI:
                    operands = [checkIsSource(tokens.shift()), checkIsSource(tokens.shift()), checkIsImmediate(tokens.shift())];
                break;
                case OperandPattern.SrcIR:
                    operands = [checkIsSource(tokens.shift()), checkIsImmediate(tokens.shift()), checkType(tokens.shift(), Token.Register)];
                break;
            }

            instructions.push({opcode: instruction.opcode, pattern: instruction.operands, operands: operands, line: token.line});

        } else {
            throw assembleError(token.line, `Unexpected ${token.type} while parsing, anticipated a label declaration or instruction`);
        }

    }

    return instructions;

};

const encode = (instruction) => {
    if(instruction.data) return instruction.data;
    let srcMask = 0;
    if(instruction.pattern >= OperandPattern.Src) {
        srcMask = (instruction.operands[0].hasOwnProperty("value") ? SRC_TYPE_IMM : SRC_TYPE_REG) << 1;
        if(instruction.pattern >= OperandPattern.SrcSrc) {
            srcMask |= (instruction.operands[1].hasOwnProperty("value") ? SRC_TYPE_IMM : SRC_TYPE_REG);
        }
    }
    const buffer = [instruction.opcode | (srcMask << 6)];
    for(const operand of instruction.operands) {
        if(operand.type === Token.Register) {
            buffer.push(operand.register);
        } else if(operand.hasOwnProperty("value")) {
            buffer.push(operand.value & 0xFF, (operand.value & 0xFF00) >> 8);
        }
    }
    return buffer;
};

const assemble = (text) => {

    // this next part is super janky - attach some whitespace to fix problems
    const instructions = parse(tokenize(text + "\n "));
    const labels = {};
    let offset = 0;
    
    // resolve labels
    for(const instruction of instructions) {
        if(instruction.labelDeclaration) {
            if(labels[instruction.name]) throw assembleError(instruction.line, `Duplicate label name ${instruction.name}`);
            labels[instruction.name] = offset;
        } else if(instruction.data) {
            offset += instruction.data.length;
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
        // replace labels
        if(instruction.labelDeclaration) continue;
        if(instruction.operands) {
            for(const operand of instruction.operands) {
                if(operand.type === Token.Label) {
                    if(!labels.hasOwnProperty(operand.name)) {
                        throw assembleError(instruction.line, `Unknown label "${operand.name}"`);
                    }
                    operand.value = labels[operand.name];
                }
            }
        }
        buffer = buffer.concat(encode(instruction));
    }

    return {code: buffer, symbols: labels};

};