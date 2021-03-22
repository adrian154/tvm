// Needs CPU.js

// the assembler syntax is intentionally designed to require no backtracking while parsing
// it makes code a little obtuse, but... never look back (puts on sunglasses)

// "verbs" are labels or opcodes
const State = Object.freeze({
    FIND_VERB_START: 0,
    PARSE_LABEL_DECLARATION: 1,
    PARSE_OPCODE: 2,
    FIND_OPERAND_START: 3,
    PARSE_DECIMAL_LITERAL: 4,
    PARSE_HEX_LITERAL: 5,
    PARSE_REGISTER: 6,
    PARSE_LABEL_LITERAL: 7,
    CONTINUE: 8
});

const Char = Object.freeze({
    WHITESPACE: /\s/,
    NAME: /[a-zA-Z0-9_-]/,
    DIGIT: /\d+/,
    HEX: /[0-9a-fA-F]/
});

const Token = Object.freeze({
    LABEL_DECLARATION: "decl_label",
    OPCODE: "opcode",
    NUMBER: "number",
    REGISTER: "reg",
    LABEL: "label"
});

const resolveOpcode = mnemonic => INSTRUCTIONS.filter(insn => insn.toUpperCase() === mnemonic.toUpperCase());

const tokenize = assembly => {

    let state = State.FIND_VERB_START;
    let curTok = "";
    const tokens = [];
    let index = 0;
    let stay = false;

    while(index < assembly.length) {

        const char = assembly[index];
        console.log(char, state);

        switch(state) {
            
            case State.FIND_VERB_START: {
                if(char === "$") {
                    curTok = "";
                    state = State.PARSE_LABEL_DECLARATION;
                } else if(char.match(Char.NAME)) {
                    curTok = "";
                    state = State.PARSE_OPCODE;
                    stay = true;
                } else if(!char.match(Char.WHITESPACE)) {
                    throw new Error("Illegal character");
                }
                break;
            }

            case State.PARSE_LABEL_DECLARATION: {
                if(char.match(Char.NAME)) {
                    curTok += char;
                } else if(char === ":") {
                    state = State.FIND_VERB_START;
                } else {
                    throw new Error("Illegal character");
                }
                break;
            }

            case State.PARSE_OPCODE: {
                if(char.match(Char.NAME)) {
                    curTok += char;
                } else if(char.match(Char.WHITESPACE)) {
                    
                    tokens.push({type: Token.OPCODE, value: curTok});
                    curTok = "";
                    state = State.FIND_OPERAND_START;

                } else {
                    throw new Error("Illegal character in opcode name");
                }
                break;
            }

            case State.FIND_OPERAND_START: {
                if(char.match(Char.DIGIT)) {
                    state = State.PARSE_DECIMAL_LITERAL;
                    stay = true;
                } else if(char === "R" || char === "r") {
                    state = State.PARSE_REGISTER;
                } else if(char === "$") {
                    state = State.PARSE_LABEL_LITERAL;
                } else if(!char.match(Char.WHITESPACE)) {
                    throw new Error("Illegal character, expecting operand");
                }
                break;
            }

            case State.PARSE_HEX_LITERAL:
            case State.PARSE_DECIMAL_LITERAL: {
                if(state === State.PARSE_DECIMAL_LITERAL && char.match(Char.DIGIT) || char.match(Char.HEX)) {
                    curTok += char;
                } else if(state === State.PARSE_DECIMAL_LITERAL && char === "x") {
                    curTok = "";
                    state = State.PARSE_HEX_LITERAL;
                } else {
                    tokens.push({type: Token.NUMBER, value: parseInt(curTok, state === State.PARSE_HEX_LITERAL ? 16 : 10)});
                    state = State.CONTINUE;
                    stay = true;
                }
                break;
            }

            case State.PARSE_REGISTER: {
                if(char.match(Char.HEX)) {
                    tokens.push({type: Token.REGISTER, value: parseInt(char, 16)});
                    state = State.CONTINUE;
                } else {
                    throw new Error("Invalid register literal");
                }
                break;
            }

            case State.PARSE_LABEL_LITERAL: {
                if(char.match(Char.NAME)) {
                    curTok += char;
                } else if(char.match(Char.WHITESPACE)) {
                    tokens.push({type: Token.LABEL, name: curTok});
                    state = State.CONTINUE;
                    stay = true;
                } else {
                    throw new Error("Illegal character in label name");
                }
                break;
            }

            case State.CONTINUE: {
                if(char === ",") {
                    state = State.FIND_OPERAND_START;
                } else if(char.match(Char.WHITESPACE)) {
                    state = State.FIND_VERB_START;
                } else {
                    throw new Error("Illegal character, expecting operand");
                }
            }

        }
        
        if(!stay) {
            index++;
        }

        stay = false;

    }

    if(!(state == State.CONTINUE || state == State.FIND_VERB_START)) {
        throw new Error("Unexpected end of input");
    }

    return tokens;

};

const assemble = assembly => {
    const tokens = tokenize(assembly);
    return tokens;
};

console.log(assemble(`

call $test0
call $test1

$test0:

	mov 0xfa,   rc
	mov 0xdead, rd
	storeb rc,  rd
	storew rd,  rc loadb
    rc,   ra
	loadw rc,       r6 ret

$test1:

	mov 0xbeef, r0
	not r0
	mov 0xcafe, r1
	and r0, r1
	or r1, r0
    
`));