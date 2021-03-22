# Why? 
TVM (Tiny Virtual Machine) is a purely emulated CPU architecture.

# General Info
The TVM is 16-bit and can address 64K of memory. Data in memory is stored in little-endian order. A *byte* refers to an 8-bit value while a *word* refers to a 16-bit value.

# Registers
The TVM has 16 general-purpose registers, labeled R0 to RF. Each register is 16-bits wide. RF points to the next instruction, and RE is used as a stack register by convention.

The TVM also has a carry flag that can be accessed through the `CC` and `SC` instructions.

# Instructions
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

TODO: Update with a table of instructions. For now go to CPU.js.

# TODO
Interrupts, devices, general IO crap...