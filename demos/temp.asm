; contributed by adrian
; please excuse the sloppy register spilling

; r0 = x
; r1 = y
; rc = trash
mov 0, r0
mov 0, r1

; draw loop
yloop:
    xloop:
        
        ; r2, r3 = x',y' (fixed point)
        shl r0, 3, r2 ; 3 bit shift includes implicit division by 32
        shl r1, 3, r3

        mul r2, r2, rc, r4
        mul r3, r3, rc, r5
        add r4, r5, r6
        cf.
        ifl r6, 255 sf.

        iff. out '#'
        ifnf. out 46

        add r0, 1, r0
        ifeq r0, 32 mov exitxloop, rf
        mov xloop, rf

    exitxloop:
        out 10
        mov 0, r0
        add r1, 1, r1
        ifeq r1, 32 mov exityloop, rf
        mov yloop, rf
exityloop:
    mov exityloop, rf