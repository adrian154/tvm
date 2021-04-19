const bottomPane = document.getElementById("bottom-pane");
const table = document.getElementById("registers");
const statusMsg = document.getElementById("status");
const outputBox = document.getElementById("output");
const editor = document.getElementById("editor");

editor.addEventListener("keydown", (event) => {
    if(event.key === "Tab") {
        event.preventDefault();
        const start = event.target.selectionStart, end = event.target.selectionEnd;
        event.target.value = event.target.value.substring(0, start) + "\t" + event.target.value.substring(end);
        event.target.selectionStart = event.target.selectionEnd = start + 1;
        //this.selectionStart = this.selectionEnd = this.selectionStart + 1;

    }
});

// helper for testing: write crap to memory
const write = (CPU, data, offset) => {
    offset = offset ?? 0;
    for(let i = 0; i < data.length; i++) {
        CPU.memory[u16(offset + i)] = data[i];
    }
};

const addRegisterRows = () => {
    const cells = {};
    for(let i = 0; i < 8; i++) {
        const row = document.createElement("tr");
        const label0 = document.createElement("td");
        label0.textContent = "R" + i.toString(16);
        const cell0 = document.createElement("td");
        const label1 = document.createElement("td");
        label1.textContent = "R" + (i + 8).toString(16);
        const cell1 = document.createElement("td");
        cells[i] = cell0;
        cells[i + 8] = cell1;
        row.appendChild(label0);
        row.appendChild(cell0);
        row.appendChild(label1);
        row.appendChild(cell1);
        table.appendChild(row);
    }
    return cells;
};

const registerCells = addRegisterRows();

const cpu = createCPU();

cpu.onPrint = (char) => {
    outputBox.textContent += String.fromCharCode(char);
};

// exec cycle
let running =  false;

const updateDisplays = () => {
    statusMsg.textContent = running ? "RUNNING" : "PAUSED";
    for(let i = 0; i < 16; i++) {
        registerCells[i].textContent = "0x" + cpu.registers[i].toString(16);
    }
};

const run = () => {
    if(running) {
        try {
            step(cpu);
        } catch(error) {
            alert("Runtime error: " + error.message);
            running = false;
        }
        updateDisplays();
    }
    setTimeout(run, 10);
};

const reset = (soft) => {
    outputBox.textContent = "";
    cpu.applyPredicate = false;
    cpu.predicateCondition = true;
    if(!soft) {
        for(let i = 0; i < cpu.memory.length; i++) {
            cpu.memory[i] = 0;
        }
    }
    for(let i = 0; i < cpu.registers.length; i++) {
        cpu.registers[i] = 0;
    }
    cpu.carry = false;
    running = false;
    updateDisplays();
};

reset();
run();

const reassemble = () => {
    try {
        const assembled = assemble(editor.value);
        write(cpu, assembled.code);
        console.log(assembled.symbols);
        reset(true);
    } catch(error) {
        console.error(error);
        alert(error.message);
    }
};

const toggle = () => {
    running = !running;
    updateDisplays();
};

const singlestep = () => {
    step(cpu);
    updateDisplays();
};