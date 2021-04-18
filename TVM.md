# Why? 
TVM (Tiny Virtual Machine) is a purely emulated CPU architecture.

# General Info
The TVM is 16-bit and can address 64K of memory. Data in memory is stored in little-endian order. A *byte* refers to an 8-bit value while a *word* refers to a 16-bit value.

# Registers
The TVM has 16 general-purpose registers, labeled R0 to RF. Each register is 16-bits wide. RF points to the next instruction, and RE is used as a stack register by convention.

The TVM also has a carry flag that can be accessed through the `CC` and `SC` instructions. The carry flag is used as a borrow flag for subtraction instructions.

# Instruction Encoding
The first byte of an instruction is the opcode, determining the operand code.

There a few patterns of instruction operands, with the following encodings:

**Register operands**

* One register: `RA` is encoded as `0x0A`
* Two registers:  `RA, RB` is encoded as `0xAB`
* Three registers: `RA, RB, RC` is encoded as `0xAB 0xC)`
* Four registers: `RA, RB, RC, RD` is encoded as `0xAB 0xCD`

**Immediate operands**

* `Imm8, RA` is encoded as `Imm 0x0A`
* `Imm16, RA` is encoded as `ImmLo ImmHi 0x0A`

Examples:

```
MOV RA, RB =
0x01 0xAB

MOV 0xFF, RA =
0x02 0xFF 0x0A

MOV 0xBEEF, RA =
0x03 0xEF 0xBE 0x0A

ADD RA, RB =
0x0E 0xAB

DIV RA, RB, RC =
0x15 0xAB 0xC0

MUL RA, RB, RC, RD =
0x12 0xAB 0xCD
```

# Instructions

**This table is currently out of date, consult cpu.js first!**

|Opcode|Mnemonic|Operands|Operation|
|------|--------|--------|-----------|
| 0 | NOP | | Does nothing |
| 1 | MOV | R(Src), R(Dst) | Sets Src to Dst |
| 2 | MOV | Imm8, R(Dst) | Sets Dst to Imm8 |
| 3 | MOV | Imm16, R(Dst) | Sets Dst to Imm16 | 
| 4 | STOREB | R(Src), R(Ptr) | Stores lower 8 bits of Src into memory at address Ptr |
| 5 | STOREW | R(Src), R(Ptr) | Stores Src into memory at address Ptr and Ptr + 1 |
| 6 | LOADB | R(Ptr), R(Dst) | Loads byte in memory at Ptr into Dst |
| 7 | LOADW | R(Ptr), R(Dst) | Loads word in memory at Ptr into Dst |
| 8 | NOT | R(A) | Sets A to the bitwise not of A |
| 9 | AND | R(A), R(B) | Sets B to the bitwise AND of A and B |
| 10 | OR | R(A), R(B) | Sets B to the bitwise OR of A and B |
| 11 | XOR | R(A), R(B) | Sets B to the bitwise XOR of A and B |
| 12 | SHL | R(A), R(B) | Shifts A left by B bits |
| 13 | ASR | R(A), R(B) | Shifts A right by B bits, filling vacant bits with the sign bit of the original value |
| 14 | SHR | R(A), R(B) | Shifts A right by B bits, filling vacant bits with zero |
| 15 | ADD | R(A), R(B) | Sets B to `A + B`, also setting the carry flag |
| 16 | ADDC | R(A), R(B) | Sets B to `A + B + CARRY`, also setting the carry flag |
| 17 | SUB | R(A), R(B) | Sets B to `A - B`, also setting the carry flag |
| 18 | SUBB | R(A), R(B) | Sets B to `A - B - CARRY`, also setting the carry flag |
| 19 | MUL | R(A), R(B), R(DstHi), R(DstLo) | Stores the 32-bit result of `A * B` in DstHi and DstLo |
| 20 | IMUL | See `MUL` | Signed variant of `MUL` |
| 21 | DIV | R(A), R(B), R(C) | Divides A by B; stores the truncated result in B and the remainder in C |
| 22 | IDIV | See `DIV` | Signed variant of `DIV` |
| 23 | CC | | Clears the carry flag |
| 24 | SC | | Sets the carry flag |
| 25 | IFZ | R(A) | Runs the next instruction if A is zero |
| 26 | IF | R(A) | Runs the next instruction if A is not zero |
| 27 | IFEQ | R(A), R(B) | Runs the next instruction if `A = B` |
| 28 | IFNEQ | R(A), R(B) | Runs the next instruction if `A != B` |
| 29 | IFGU | R(A), R(B) | Runs the next instruction if `A > B`, treating A and B as unsigned values |
| 30 | IFLU | R(A), R(B) | Runs the next instruction if `A < B`, treating A and B as unsigned values |
| 31 | IFGS | See `IFGU` | Signed variant of `IFGU` |
| 32 | IFLS | See `IFLU` | Signed variant of `IFLU` |
| 33 | IFC | | Runs the next instruction if the carry flag is set |
| 34 | IFNC | | Runs the next instruction if the carry flag is not set |
| 35 | CALL | R(Addr) | Pushes RF onto the stack and sets RF to Addr |
| 36 | PUSHB | R(Src) | Pushes the lower 8 bits of Src onto the stack |
| 37 | PUSHW | R(Src) | Pushes Src onto the stack |
| 38 | POPB | R(Dst) | Pops an 8-bit value off the stack and stores it into Dst |
| 39 | POPW | R(Dst) | Pops a 16-bit value off the stack and stores it into Dst |

# Graphics

# Interrupts and IO

# TODO
Interrupts, devices, general IO crap...