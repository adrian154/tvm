; credit: carson june 2021

; compiled with xenon 62b0d21

;func out(Char x) {} // intrinsic
;func[A, B] cast(A a) B {} // intrinsic
;
;func digitToAscii(Int i) Char {
;    return cast::[Int, Char](i + 48);
;}
;
;func print(Int i) {
;    if (0 > i) {
;        out('-');
;        print(0 - i);
;        return;
;    };
;    if(i > 9) {
;        print(i / 10);
;    };
;    out(digitToAscii(i % 10));
;}
;
;func main() {
;    val Int i = 0-30;
;    i = i + 1;
;    loop {
;        if(i == 30) return;
;        print(i);
;        out(cast::[Int, Char](10));
;        i = i + 1;
;    }
;}










    mov start_, rf
start_:
    call main
    mov halt_, rf
out:
    pushw rd
    mov re, rd
    oloadb rd, 4, r0
    out r0
    popw rd
    popw rf
digitToAscii:
    pushw rd
    mov re, rd
    add re, 0, re
    oloadw rd, 4, r0
    pushw r0
    mov 48, r0
    popw r1
    add r0, r1, r0
    mov digitToAscii_digitToAscii_end_, rf
digitToAscii_digitToAscii_end_:
    sub re, 0, re
    popw rd
    popw rf
print:
    pushw rd
    mov re, rd
    add re, 0, re
    mov 0, r0
    pushw r0
    oloadw rd, 4, r0
    mov r0, r2
    popw r1
    mov 0, r0
    ifgs r1, r2
    mov 1, r0
    ifeq 0, r0
    mov pfsznbqqiyr_else_, rf
    mov 45, r0
    pushb r0
    call out
    add 1, re, re
    mov 0, r0
    pushw r0
    oloadw rd, 4, r0
    popw r1
    sub r1, r0, r0
    pushw r0
    call print
    add 2, re, re
    mov print_print_end_, rf
print_l_4__end_:
    mov klgzyklsjbe_end_, rf
pfsznbqqiyr_else_:
klgzyklsjbe_end_:
    oloadw rd, 4, r0
    pushw r0
    mov 9, r0
    mov r0, r2
    popw r1
    mov 0, r0
    ifgs r1, r2
    mov 1, r0
    ifeq 0, r0
    mov xrnslvuncsi_else_, rf
    oloadw rd, 4, r0
    pushw r0
    mov 10, r0
    popw r1
    idiv r1, r0, r0, r1
    pushw r0
    call print
    add 2, re, re
print_l_5__end_:
    mov rqapzavecwn_end_, rf
xrnslvuncsi_else_:
rqapzavecwn_end_:
    oloadw rd, 4, r0
    pushw r0
    mov 10, r0
    popw r1
    idiv r1, r0, r1, r0
    pushw r0
    call digitToAscii
    add 2, re, re
    pushb r0
    call out
    add 1, re, re
print_print_end_:
    sub re, 0, re
    popw rd
    popw rf
foo:
    pushw rd
    mov re, rd
    add re, 0, re
    oloadw rd, 4, r0
    pushw r0
    mov 3, r0
    popw r1
    storew r0, r1
foo_foo_end_:
    sub re, 0, re
    popw rd
    popw rf
main:
    pushw rd
    mov re, rd
    add re, 2, re
    mov 0, r0
    pushw r0
    mov 30, r0
    popw r1
    sub r1, r0, r0
    ostorew r0, rd, 2
    oloadw rd, 2, r0
    pushw r0
    mov 1, r0
    popw r1
    add r0, r1, r0
    ostorew r0, rd, 2
main_l_8__start_:
    oloadw rd, 2, r0
    pushw r0
    mov 30, r0
    popw r1
    mov r0, r2
    mov 0, r0
    ifeq r1, r2
    mov 1, r0
    ifeq 0, r0
    mov qbmqzjmjfxr_else_, rf
    mov main_main_end_, rf
    mov lepgqwpdnrk_end_, rf
qbmqzjmjfxr_else_:
lepgqwpdnrk_end_:
    oloadw rd, 2, r0
    pushw r0
    call print
    add 2, re, re
    mov 10, r0
    pushb r0
    call out
    add 1, re, re
    oloadw rd, 2, r0
    pushw r0
    mov 1, r0
    popw r1
    add r0, r1, r0
    ostorew r0, rd, 2
    mov main_l_8__start_, rf
main_l_8__end_:
main_main_end_:
    sub re, 2, re
    popw rd
    popw rf
halt_:
    mov halt_, rf

