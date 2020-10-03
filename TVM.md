# Why? 

TVM is a purely emulated CPU architecture since I like assembly programming but hate reality.

# General Info

The TVM is 16-bit and can access 64K of memory. Data in memory is stored in little-endian order.

# Registers

The TVM has 16 general-purpose registers, labeled R0 to RF. Each register is 16-bits wide.

RF points to the next instruction, and RE is used as a stack register.

The TVM has some flag registers. How these are stored is implemetation-dependent.
* Carry flag
* Borrow flag
* Greater flag
* Equal flag

# Instructions

Instructions are decoded according to the following process:

* Read first byte, the opcode
* The lowest six bits represent the instruction
* For each operand the instruction accepts:
  * If the operand is a source:
    * If the operand is the first source, look at the 7th bit in the opcode. If that bit is 0, the operand should be read as an register. If the bit is 1, the operand should be read as an immediate value.
    * If the operand is the second source, repeat the same process but instead look at the 8th bit in the opcode.
  * Otherwise, the operator is encoded as a register.

Register operands are encoded as a single byte corresponding to the register number. Immediate value operands are encoded as two bytes, a little-endian 16-bit integer.

For example:

```
MOV R0, R5
becomes
0x01 0x00 0x05 

MOV 0xDEAD, R5
becomes
0x41 0xAD 0xDE 0x05
```

|Mnemonic|Opcode|Operand 1|Operand 2|Operand 3|Operand 4|Desc|
|--------|------|---------|---------|---------|---------|----|
|NOP|0x00| | | | |No-op|
|MOV|0x01|Src|Reg Dst| | |Moves value of Src into register Dst|
|STOREB|0x02|Src|Imm16 Dst| | |Stores lower 8 bits of value of Src in memory at location \[Dst]|
|STOREB|0x03|Src|Reg Dst| | |Stores lower 8 bits of value of Src in memory at location \[Dst]|
|STOREW|0x04|Src|Imm16 Dst| | |Stores value of Src in memory at location \[Dst]|
|STOREW|0x05|Src|Reg Dst| | |Stores value of Src in memory at location \[Dst]|
|LOADW|0x07|Src|Reg Dst| | |Loads 16-bit value in memory at location \[Src] into register Dst|
|LOADB|0x08|Src|Reg Dst| | |Loads 8-bit value in memory at location \[Src] into register Dst|
|AND|0x0A|Src A|Src B|Reg Dst| |Stores bitwise AND of A and B into register Dst|
|OR|0x0B|Src A|Src B|Reg Dst| |Stores bitwise OR of A and B into register Dst|
|XOR|0x0C|Src A|Src B|Reg Dst| |Stores bitwise XOR of A and B into register Dst|
|NOT|0x0D|Reg SrcDst| | | |Stores bitwise NOT of register SrcDst into register SrcDst|
|LSL|0x0E|Src Val|Src Bits|Reg Dst| |Stores Val << Bits into register Dst, not preserving the sign bit|
|LSR|0x0F|Src Val|Src Bits|Reg Dst| |Stores Val >> Bits into register Dst, not preserving the sign bit|
|ASL|0x10|Src Val|Src Bits|Reg Dst| |Stores Val << Bits into register Dst, preserving the sign bit|
|ASR|0x11|Src Val|Src Bits|Reg Dst| |Stores Val >> Bits into register Dst, preserving the sign bit|
|ADD|0x12|Src Val1|Src Val2|Reg Dst| |Stores Val1 + Val2 into register Dst. Updates carry flag|
|ADDC|0x13|Src Val1|Src Val2|Reg Dst| |Stores Val1 + Val2 into register Dst, taking into account the carry flag. Updates the carry flag|
|SUB|0x14|Src Val1|Src Val2|Reg Dst| |Stores Val1 - Val2 into register Dst. Updates borrow flag|
|SUBB|0x15|Src Val1|Src Val2|Reg Dst| |Stores Val1 - Val2 into register Dst, taking into account the borrow flag. Updates the borrow flag|
|CC|0x16| | | | |Clears the carry flag|
|SC|0x17| | | | |Sets the carry flag|
|CB|0x18| | | | |Clears the borrow flag|
|SB|0x19| | | | |Sets the borrow flag|
|CG|0x1A| | | | |Clears the greater flag|
|SG|0x1B| | | | |Sets the greater flag|
|CE|0x1C| | | | |Clears the equal flag|
|SE|0x1D| | | | |Sets the equal flag|
|MUL|0x1E|Src Val1|Src Val2|Reg DstHi|Reg DstLo|Stores Val1 * Val2 into registers \[DstHi, DstLo]|
|MULT|0x1F|Src Val1|Src Val2|Reg Dst| |Stores Val1 * Val2 into register Dst, truncating the upper 16 bits of the result|
|MUL|0x20|Src Val1|Src Val2|Reg DstHi|Reg DstLo|Stores Val1 * Val2 (unsigned) into registers \[DstHi, DstLo]|
|UMULT|0x21|Src Val1|Src Val2|Reg Dst| |Stores Val1 * Val2 (unsigned) into register Dst, truncating the upper 16 bits of the result|
|DIV|0x22|Src Val1|Src Val2|Reg Dst| |Stores Val1 / Val2 into register Dst|
|UDIV|0x23|Src Val1|Src Val2|Reg Dst| |Stores Val1 / Val2 (unsigned) into register Dst|
|CMP|0x24|Src Val1|Src Val2| | |Sets equal flag if Val1 == Val2 and clears it if not. Sets greater flag if Val1 > Val2 and clears it if not|
|IFG|0x25| | | | |Runs next instruction if the greater flag is set. Otherwise, skips|
|IFGE|0x26| | | | |Runs next instruction if the greater flag is set or the equal flag is set. Otherwise, skips|
|IFE|0x27| | | | |Runs next instruction if the equal flag is set. Otherwise, skips|
|IFLE|0x28| | | | |Runs next instruction if the greater flag is not set or the equal flag is set. Otherwise, skips|
|IFL|0x29| | | | |Runs next instruction if the greater flag is not set. Otherwise, skips|
|CALL|0x2E|Src| | | |Stores RF into memory at location \[RE] and sets RF to the value of Src|

# TODO
Stack and interrupts
