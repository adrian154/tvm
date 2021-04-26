; contributed by drain
mov 0xfffe, re
mov 99, r0
loop:
    ifeq r0, 0 mov nomore, rf
    call printnum
    mov message0, rc
    call printstr
    call printnum
    mov message1, rc
    call printstr
    sub r0, 1, r0
    call printnum
    mov message2, rc
    call printstr
    mov loop, rf
nomore:
    mov message3, rc
    call printstr
done:
    mov done, rf

; prints number in r0
; only 2 digits for brevity
printnum:
    div r0, 10, r1, r2
    ifeq r1, 0 mov printsecond, rf
    add r1, 48, r1
    out r1
printsecond:
    add r2, 48, r2 ; 48 = '0'
    out r2
    popw rf

; prints string in rc
printstr:
    loadb rc, rd
    ifeq rd, 0 mov doneprint, rf
    out rd
    add rc, 1, rc
    mov printstr, rf
doneprint:
    popw rf

message0: string " bottles of beer on the wall, " byte 0
message1: string " bottles of beer\nTake one down, pass it around, " byte 0
message2: string " bottles of beer on the wall.\n" byte 0
message3: string "No more bottles of beer on the wall, no more bottles of beer on the wall. Go to the store and buy some more, 99 bottles of beer on the wall." byte 0