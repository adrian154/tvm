# TVM

**TVM (Tiny Virtual Machine)** is a made-up CPU architecture.

# General Info

TVM is 16-bit and can address up to 64K of memory. Numbers are stored in little-endian order. 

# Registers

The TVM has 16 registers, each 16 bits wide. They are labeled R0 to RF. Two registers have special functions: 
* RE is the stack pointer, used by the stack instructions.
* RF is the instruction pointer.

TVM also has a general-purpose flag, used as a carry flag by addition operations and a borrow flag by subtraction operations.

# Instruction Encoding

The first byte of each instruction has this structure:
* Bits 0-5: Opcode, a number identifying which instruction is encoded
* Bits 6-7: 
    * Bit 6: Whether the second source operand is a register (0) or an immediate value (1)
    * Bit 7: Whether the first source operand is a register (0) or an immediate value (1)

There are two types of operands:
* **Sources**: Any value which is not modified in the instruction. A source can be a 16-bit immediate value or a register; this is determined by the upper 2 bits of the first byte in the instruction.
* **Registers**: A reference to a register.

Registers are encoded as a single byte containing the register number. Immediate values are encoded as two bytes in little-endian order.

All instructions have one of seven fixed operand patterns.

* (No registers)
* **R**
* **Source**
* **Source, Register**
* **Source, Source**
* **Source, Source, Register** 

The order of the operands is the order they will be stored as part of the intruction.

# Instructions

|Opcode|Mnemonic|Operands|Description|
|-|-|-|-|
|`0x0`|NOP|None|Does  nothing|
|`0x2`|MOV|Source, Register|Sets value of Register to value of Source|
|`0x3`|STOREB|Source(Value), Source(Address)|Stores lower byte of Value into memory at \[Address]|
|`0x4`|STOREW|Source(Value), Source(Address)|Stores Value into memory at \[Address] and \[Address + 1]|
|`0x5`|LOADB|Source, Register|Loads byte in memory at address \[Source] into Register|
|`0x6`|LOADW|Source, Register|Loads word in memory at address \[Source] into Register|
|`0x7`|NOT|Register|Stores bitwise NOT of Register into Register|
|`0x8`|AND|Source(A), Source(B), Register|Stores the bitwise AND of A and B into Register|
|`0x9`|OR|Source(A), Source(B), Register|Stores the bitwise OR of A and B into Register|
|`0xa`|XOR|Source(A), Source(B)|Stores the bitwise XOR of A and B into Register|
|`0xb`|SHL|Source(Value), Source(Bits), Register|Stores Value shifted left by Bits into Register|
|`0xc`|ASR|Source, Source, Register|Stores Value shifted right by Bits into Register, filling empty bits with the original MSB|
|`0xd`|SHR|Source, Source, Register|Stores Value shifted right by Bits into Register, filling empty bits with zero|
|`0xe`|ADD|Source(A), Source(B), Register|Stores A + B into Register, setting the flag to the carried bit|
|`0xf`|ADDC|Source(A), Source(B), Register|Stores A + B + Flag into Register, setting the flag to the carried bit|
|`0x10`|SUB|Source(A), Source(B), Register|Stores A - B into Register, setting the flag to the borrowed bit|
|`0x11`|SUBB|Source(A), Source(B), Register|Stores A - B - Flag into Register, setting the flag to the borrowed bit|
|`0x12`|MUL|Source(A), Source(B), Register(Hi), Register(Lo)|Multiples A by B, storing the higher and lower 16 bits into Hi and Lo respectively.|
|`0x13`|IMUL|Source(A), Source(B), Register(Hi), Register(Lo)|Signed variant of 0x12|
|`0x14`|DIV|Source(A), Source(B), Register(Quotient), Register(Remainder)|Stores A / B truncated into Quotient, and stores the remainder of the operation in Remainder|
|`0x15`|IDIV|Source(A), Source(B), Register(Quotient), Register(Remainder)|Signed variant of 0x14|
|`0x16`|CF|None|Clears the flag|
|`0x17`|SF|None|Sets the flag|
|`0x18`|IFZ|Register|Executes the next instruction if Register is zero|
|`0x19`|IF|Register|Executes the next instruction if Register is not zero|
|`0x1a`|IFEQ|Source(A), Source(B)|Executes the next instruction if A and B are equal|
|`0x1b`|IFNEQ|Source(A), Source(B)|Executes the next instruction if A and B are not equal|
|`0x1c`|IFG|Source(A), Source(B)|Executes the next instruction if A is greater than B (unsigned comparison)|
|`0x1d`|IFL|Source(A), Source(B)|Executes the next instruction if A is less than B (unsigned comparison)|
|`0x1e`|IFGS|Source, Source|Signed variant of 0x1c|
|`0x1f`|IFLS|Source, Source|Signed variant of 0x1d|
|`0x20`|IFF|None|Executes the next instruction if the flag is set|
|`0x21`|IFNF|None|Executes the next instruction if the flag is not set|
|`0x22`|CALL|Source|Pushes RF to the stack and sets RF to Source|
|`0x23`|PUSHB|Source|Pushes the lower byte of Source to the stack and moves the stack pointer down one byte|
|`0x24`|PUSHW|Source|Pushes Source to the stack and moves the stack pointer down two bytes|
|`0x25`|POPB|Register|Pops a byte from the stack into Register and moves the stack pointer up one byte|
|`0x26`|POPW|Register|Pops a word from the stack into Register and moves the stack pointer up two bytes|
|`0x27`|TMPPRINT|Source|**TEMPORARY** Prints Source to the terminal as ASCII/whatever|