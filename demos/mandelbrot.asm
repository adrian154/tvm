; contributed by adrian
; draws the mandelbrot set.. crudely

mov 0, r1
yloop:
	mov 0, r0
	
	xloop:

        ; r2, r3: normalized coordinates
        ; bit shift include implicit divide 
        shl r0, 2, r2
        shl r1, 3, r3
        
        imul r2, 2, rc, r2
        sub r2, 382, r2

        imul r3, 2, rc, r3
        sub r3, 255, r3

        ; rb = whether the pixel is in the set
        mov 1, rb
        
        ; r4, r5 = z components
        ; r6 = zloop counter
        mov 0, r4
        mov 0, r5
        mov 0, r6
        zloop:

            imul r4, r4, r7, r8 ; discard top bits
            shr r8, 8, r8      ; drop bottom 8 bits of result
            shl r7, 8, r7      ; move lower byte of top 16 bits to the lower word
            or r7, r8, r7
            ; r7 = Re(z)^2

            imul r5, r5, r8, r9
            shr r9, 8, r9
            shl r8, 8, r8
            or r8, r9, r8
            ; r8 = Im(z)^2

            sub r7, r8, r7
            add r7, r2, r7
            ; r7 = Re(z)^2 - Im(z)^2 + x

            imul r4, r5, r8, r9
            shr r9, 8, r9
            shl r8, 8, r8
            or r8, r9, r8
            shl r8, 1, r8 
            add r8, r3, r8
            ; r8 = 2 * Re(z) * Im(z) + y

            mov r7, r4
            mov r8, r5

            ; if any component exceeds one, assume it's not bounded and leave the loop
            ifgs r4, 255 mov 0, rb
            ifgs r5, 255 mov 0, rb
            ifeq rb, 0 mov zloop-exit, rf

            ifeq r6, 32 mov zloop-exit, rf
            add r6, 1, r6
            mov zloop, rf

        zloop-exit: 
		
        ; print step
		ifeq rb, 1 out '#'
        ifeq rb, 0 out '.'

		ifeq r0, 64 mov exitxloop, rf
		add r0, 1, r0
		mov xloop, rf 
	exitxloop:
	
    ; newline
    out 10

	ifeq r1, 32
	mov done, rf
	add r1, 1, r1
	mov yloop, rf
done:
mov done, rf