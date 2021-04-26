; contributed by arson
mov r0, r0

; ===========
; bubble sort
; ===========


; we'll sort bytes here as it's easier than words

; ten random numbers

; we'll also put this in memory from 0xAAAA to 0xAAAA + 30, inclusive exclusive, not on the stack

add 0xAAAA, 30, re ; abuse stack pointer to make pushing numbers easier

pushb 1 ; some random data
pushb 8
pushb 7
pushb 2
pushb 4
pushb 4
pushb 6
pushb 7
pushb 0
pushb 0
pushb 8
pushb 4
pushb 7
pushb 0
pushb 4
pushb 7
pushb 2
pushb 9
pushb 9
pushb 0
pushb 0
pushb 5
pushb 9
pushb 3
pushb 2
pushb 4
pushb 0
pushb 2
pushb 4
pushb 4

mov 0, re ; put stack pointer back somewhere reasonabe
          ; note: should probably pick somewhere other than 0xAAAA to store data
          ; on the stack itself would probably have been a better choice tbh

call printAAAA 

call printNewline
mainLoop:
	
	mov 0xAAAA, r0
	add r0, 30, r5
	call oneIter

	ifeq r6, 1 mov mainLoop, rf




end:
	mov end, rf

; takes in r0 as the initial pointer (probably 0xAAAA)
; takes in r5 as the final pointer, exclusive (probably 0xAAAA + 30)
; trashes r1, r2, r3
; returns in r6 if the array was mutated (0 = was not mutated, 1 = was mutated)
oneIter:
	mov 2, r6
	add r0, 1, r1
	oneIter_loop:
		loadb r0, r2
		loadb r1, r3
		ifg r2, r3 mov swap, rf	
		mov noswap, rf
		swap:
			storeb r2, r1
			storeb r3, r0
			mov 1, r6
			call printAAAA
		noswap:
		add r0, 1, r0
		add r1, 1, r1
		ifneq r1, r5 mov oneIter_loop, rf
	ifeq r6, 2 mov 0, r6
	popw rf





; prints the 30 elem array at 0xAAAA
; clean
printAAAA:
	pushw r0 ; for the printing char
	pushw r1 ; for the pointer
	pushw r2 ; for the ending pointer
	mov 0xAAAA, r1
	add r1, 30, r2
	printAAAA_loop:
		loadb r1, r0
		call printNumber
		out 32 ; print a space
		add r1, 1, r1
		ifneq r2, r1 mov printAAAA_loop, rf
	call printNewline
	popw r2
	popw r1
	popw r0
	popw rf




; prints a newline
; clean
printNewline:
	out 0x0A
	popw rf





; prints the number in r0, assumes that there is only one digit
; clean
printNumber:
	add r0, 48, r0
	out r0
	sub r0, 48, r0
	popw rf
