; contributed by adrian
; draws a circle
mov 0, r1
yloop:
	mov 0, r0
	
	xloop:
		sub r0, 16, r2
		sub r1, 16, r3
		imul r2, r2, rc, r4
		imul r3, r3, rc, r5
		add r4, r5, r4
		
		cf.
		ifl r4, 100 sf.
		
		iff. out '#'
		ifnf. out '.'

		ifeq r0, 32
		mov exitxloop, rf
		add r0, 1, r0
		mov xloop, rf 
	exitxloop:
	
    out 10

	ifeq r1, 32
	mov done, rf
	add r1, 1, r1
	mov yloop, rf
done:
mov done, rf