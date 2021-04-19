triangle:
    mov 1, r0	; r0 = outer loop counter
loop0:
    mov 0, r1	; r1 = inner loop counter
loop1:
    ifeq r0, r1 mov exitloop1, rf
    mov 42, r2	; 42 = *
    tmpprint r2
    add r1, 1, r1
    mov loop1, rf 
exitloop1:
    mov 0xA, r6 ; 0xA = \n
    tmpprint r6
    add r0, 1, r0
    ifeq r0, 15 mov done, rf
    mov loop0, rf
done:
    mov done, rf
                    