mov r0, r0


start:
	mov 1, r0
	loop_up:
		call drawN
		add r0, 1, r0
		ifneq r0, 30 mov loop_up, rf
	
	loop_down:
		call drawN
		sub r0, 1, r0
		ifneq r0, 1 mov loop_down, rf
	mov start, rf



end:
	mov end, rf


; pass in r0 the number of * to draw, then it prints a newline
; TRASHES: nothing
drawN:
	pushw r0
	
	drawN_loop:
		tmpprint 0x2A
		sub r0, 1, r0
		ifneq r0, 0 mov drawN_loop, rf
	tmpprint 0x0A
	popw r0
	popw rf
