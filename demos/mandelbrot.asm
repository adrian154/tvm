; contributed by adrian
; please excuse the sloppy register spilling

; r0 = x
; r1 = y
; rc = trash
mov 0, r0
mov 0, r1

; draw loop
xloop:
    yloop:
        
        ; r2, r3 = x',y' (fixed point)
        shl r0, 3, r2 ; 3 bit shift includes implicit division by 32
        shl r1, 3, r3

        ; x' = x * 2 - 1.5
        mul r2, 2, rc, r3 ; discard upper bits
        sub r2, 382

        ; y' = y * 2 - 1
        mul r3, 2, rc, r3 
        sub r3, 255

        ; r4, r5 = zimaginary, zreal
        ; r6 = zloop counter
        ; iterate z_{n+1} = z_n^2 + c
        mov 0, r4
        mov 0, r5
        mov 0, r6

        ; flag = whether z is in the mandelbrot set
        sf

        zloop:

            ; r7, r8 = temp
            ; r9, ra = z components
            mul r4, r4, r7
            mul r5, r5, r8

            ; calculate Im(z)
            sub r7, r8, r9
            add r9, r2, r9

            ; calculate Re(z)
            mul r4, 2, ra
            mul ra, r5, ra
            add ra, r3, ra

            ; move temp components back to main
            mov r4, r9
            mov r5, ra

            ifl r9, 1
            ifl ra, 1
            mov zloop_cont, rf

            ; break
            cf
            mov exitzloop, rf

            zloop_cont:

            add r6, 1, r6
            ifeq r6, 32 mov exitzloop, rf
            mov zloop, rf

        exitzloop:

        iff out '#'
        ifnf out ' '

        add r1, 1, r1
        ifeq r1, 64 mov exityloop, rf
        mov yloop, rf

    exityloop:
     add r0, 1, r0
        ifeq r0, 64 mov exitxloop, rf
        mov xloop, rf
exitxloop:
    mov exitxloop, rf