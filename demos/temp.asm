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