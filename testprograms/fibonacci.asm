; contributed by drain

; the counter quickly overflows 
; writing a version using 32 bit arithmetic is left as an exercise to the reader
fibonacci:
    ; set up stack
    mov 0xffff, re
    mov 1, r0
    mov 1, r1
loop:
    add r0, r1, r2
    call printnumber ; print r0
    mov r1, r0
    mov r2, r1
    out 0xA
    mov loop, rf

printnumber:
    mov re, r3
digitsloop:
    div r0, 10, r0, r4  ; isolate digit
    add r4, 48, r4      ; 48 = '0'
    pushb r4
    ifeq r0, 0 mov printloop, rf
    mov digitsloop, rf
printloop:
    ifeq re, r3 mov doneprint, rf
    popb r0
    out r0 
    mov printloop, rf
doneprint:
    popw rf