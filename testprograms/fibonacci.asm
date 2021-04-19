fibonacci:
    movb r0, 1
    movb r1, 1
loop:
    add r0, r1, r2
    mov r1, r0
    mov r2, r1
    debugprint r0
    movw rf, loop