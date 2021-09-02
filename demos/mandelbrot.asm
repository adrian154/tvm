
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

        ; r4, r5 = zx, zy
        ; r6 = zloop counter
        ; iterate z_{n+1} = z_n + c
        mov 0, r4
        mov 0, r5
        mov 0, r6
        zloop:

            ; TODO

            add r6, 1, r6
            ifeq r6, 32 mov exitzloop, rf
            mov exitzloop, rf
        exitzloop:

        ifl r4, 1 ifl r5, 1 mov rf, print
        back:

        add r1, 1, r1
        ifeq r1, 64 mov exityloop, rf
        mov yloop, rf

    exityloop:
    add r0, 1, r0
    ifeq r0, 64 mov exitxloop, rf
    mov xloop, rf
exitxloop:
mov exitxloop, rf

print:

; TODO
mov back, rf