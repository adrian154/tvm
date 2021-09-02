; contributed by drain
mov str,r0
loop:
	loadb r0,r1
	ifeq r1,0 mov end,rf
	out r1
	add 1,r0,r0
	mov loop,rf
end: mov end,rf
str: string "Hello, World!" byte 0 ; strings must be manually null terminated