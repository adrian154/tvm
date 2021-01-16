# Why? 

TVM is a purely emulated CPU architecture since I like assembly programming but hate reality.

# General Info

The TVM is 16-bit and can address 64K of memory. Data in memory is stored in little-endian order.

A *byte* refers to an 8-bit value while a *word* refers to a 16-bit value.

# Registers

The TVM has 16 general-purpose registers, labeled R0 to RF. Each register is 16-bits wide.

RF points to the next instruction, and RE is used as a stack register by convention.

The TVM has some flags that can be set and unset with specialized instructions.
* Carry flag
* Borrow flag

# Instructions

The first byte of an instruction is always the opcode.

There a few patterns of instruction operands, with the following encodings:

**Register operands**

* `RA, RB` is encoded as `0xAB`
* `RA, RB, RC` is encoded as `0xAB 0xC0`
* `RA, RB, RC, RD` is encoded as `0xAB 0xCD`

**Immediate operands**

* `Imm8, RA` is encoded as `Imm 0xA0`
* `Imm16, RA` is encoded as `ImmLo ImmHi 0xA0`

Examples:

```
MOV RA, RB =
0x01 0xAB

MOV 0xFF, RA =
0x01 0xFF 0xA0

MOV 0xBEEF, RA =
0x01 0xEF 0xBE 0xA0

ADD RA, RB, RC =
0x0E 0xAB 0xC0

MUL RA, RB, RC, RD =
0x12 0xAB 0xCD
```

|Mnemonic|Opcode|Operand 1 |Operand 2 |Operand 3 |Operand 4 |Desc|
|--------|------|----------|----------|----------|----------|----|
|NOP     |0x00  |          |          |          |          |    |
|MOV     |0x01  | Reg(Src) | Reg(Dst) |          |          | Sets register Dst to the value stored in register Src |
|MOV     |0x02  | Imm8     | Reg      |          |          | Sets lower byte of the register to the immediate value |
|MOV     |0x03  | Imm16    | Reg      |          |          | Sets the register to the immediate value |
|STOREB  |0x04  | Reg(Src) | Reg(Ptr) |          |          | Sets the byte in memory pointed to by register Ptr to the value of the lower byte of register Src |
|STOREW  |0x05  | Reg(Src) | Reg(Ptr) |          |          | Sets the word in memory pointed to by register Ptr to the value of register Src |
|LOADB   |0x06  | Reg(Ptr) | Reg(Dst) |          |          | Sets the lower byte of register Dst to the byte in memory pointed to by register Ptr |
|LOADW   |0x07  | Reg(Ptr) | Reg(Dst) |          |          | Sets register Dst to the word in memory pointed to by register Ptr |
|NOT     |0x08  | Reg(Src) | Reg(DST) |          |          | Sets register Dst to the bitwise NOT of register Src
|AND     |0x08  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the bitwise AND of register A and B |
|OR      |0x09  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the bitwise OR of register A and B | 
|XOR     |0x0A  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the bitwise XOR of reigster A and B |
|ASL     |0x0B  | Reg(Val) | Reg(Bits)| Reg(Dst) |          | Sets register Dst to the value of register Val shifted left by (register Bits) bits |
|ASR     |0x0C  | Reg(Val) | Reg(Bits)| Reg(Dst) |          | Sets register Dst to the value of register Val shifted right by (register Bits) bits, preserving the sign bit (MSB) |
|LSR     |0x0D  | Reg(Val) | Reg(Bits)| Reg(Dst) |          | Sets register Dst to the value of register Val shifted right by (register Bits) bits, **not** preserving the sign bit |
|ADD     |0x0E  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the value of register A plus register B. Updates the carry flag |
|ADDC    |0x0F  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the value of register A plus register B, **taking into account the carry flag**. Updates the carry flag |
|SUB     |0x10  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the value of register A minus register B. Updates the borrow flag |
|SUBB    |0x11  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets register Dst to the value of register A minus register B, **taking into account the borrow flag**. Updates the borrow flag |
|MUL     |0x12  | Reg(A)   | Reg(B)   |Reg(DstHi)|Reg(DstLo)| Sets \[DstHi, DstLo] to the value of register A times register B, treating the two registers as one 32-bit value |
|MULT    |0x13  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets Dst to the value of register A times register B, truncating the upper 16 bits of the result |
|DIV     |0x14  | Reg(A)   | Reg(B)   | Reg(Dst) |          | Sets Dst to the value of register A divided by register B |
|CC      |0x15  |          |          |          |          | Clears the carry flag |
|SC      |0x16  |          |          |          |          | Sets the carry flag |
|CB      |0x17  |          |          |          |          | Clears the borrow flag |
|SB      |0x18  |          |          |          |          | Sets the borrow flag |
|IFZ     |0x19  | Reg      |          |          |          | Runs the next instruction only if the register is zero |
|IFNZ    |0x1A  | Reg      |          |          |          | Runs the next instruction only if the register is not zero |
|IFEQ    |0x1B  | Reg(A)   | Reg(B)   |          |          | Runs the next instruction only if register A equals register B |
|IFNEQ   |0x1C  | Reg(A)   | Reg(B)   |          |          | Runs the next instruction only if register A does not equal register B |
|IFG     |0x1D  | Reg(A)   | Reg(B)   |          |          | Runs the next instruction only if register A is greater than register B |
|IFL     |0x1E  | Reg(A)   | Reg(B)   |          |          | Runs the next instruction only if register A is less than register B |
|CALL    |0x1F  | Reg      |          |          |          | Pushes RF onto the stack, and sets RF to the register |
|PUSHB   |0x20  | Reg      |          |          |          | Sets the byte in memory pointed to by RF to the register, and decrements RF |
|PUSHW   |0x21  | Reg      |          |          |          | Sets the word in memory pointed to by RF to the register, and decrements RF |

# TODO
Support for signed operations, describe interrupts/devices