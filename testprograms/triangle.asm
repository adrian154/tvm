triangle:
	movb r0, 1
	movb r3, 1
	movb r4, 15
loop0:
	movb r1, 0
loop1:
	ifeq r0, r1
	movw rf, exitloop1
	movb r2, 42
	tmpprint r2
	add r1, r3, r1
	movw rf, loop1
exitloop1:
	movb r6, 0xA
	tmpprint r6
	add r0, r3, r0
	ifeq r0, r4
	movw rf, done
	movw rf, loop0
done:
	movw rf, done