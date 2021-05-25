const bottomPane = document.getElementById("bottom-pane");
const table = document.getElementById("registers");
const statusMsg = document.getElementById("status");
const otherStateMsg = document.getElementById("other-state");
const outputBox = document.getElementById("output");
const editor = document.getElementById("editor");
const runButton = document.getElementById("run-button");
const formatSelector = document.getElementById("number-format");
const uploader = document.getElementById("uploader");

editor.addEventListener("keydown", (event) => {
    if(event.key === "Tab") {
        event.preventDefault();
        const start = event.target.selectionStart, end = event.target.selectionEnd;
        event.target.value = event.target.value.substring(0, start) + "\t" + event.target.value.substring(end);
        event.target.selectionStart = event.target.selectionEnd = start + 1;
    }
});

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
    otherStateMsg.textContent = `Flag is ${cpu.flag ? "set" : "unset"}; the next instruction ${(cpu.applyPredicate ? cpu.predicateCondition : true) ? "will" : "will not"} be executed`;
    if(running) {
        runButton.classList.remove("green");
        runButton.classList.add("red");
        runButton.textContent = "Stop";
    } else {
        runButton.classList.remove("red");
        runButton.classList.add("green");
        runButton.textContent = "Run";
    }
    const radix = Number(formatSelector.value);
    const fullLength = radix == 2 ? 16 : radix == 10 ? 5 : 4;
    for(let i = 0; i < 16; i++) {
        registerCells[i].textContent = cpu.registers[i].toString(radix).padStart(fullLength, "0");
    }
};

const singlestep = () => {
    try {
        step(cpu);
    } catch(error) {
        alert("Runtime error: " + error.message);
        running = false;
    }
};

let speed = 200;

const run = () => {
    if(running) {
        for(let i = 0; i < speed && running; i++) {
            singlestep();
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
        alert("Successfully assembled!");
    } catch(error) {
        console.error(error);
        alert(error.message);
    }
};

const toggle = () => {
    running = !running;
    updateDisplays();
};

const download = () => {
    const blob = new Blob([cpu.memory], {type: "application/octet-stream"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dump.bin`;
    a.click();
};

uploader.addEventListener("change", () => {
    const file = uploader.files[0];
    file.arrayBuffer().then(arrayBuffer => {
        if(arrayBuffer.byteLength != 65536) {
            alert("The uploaded file isn't the right size.");
            return;
        } else {
            write(cpu, new Uint8Array(arrayBuffer), 0);
            alert("Wrote uploaded dump to memory!");
        }
    });
});

const upload = () => {
    uploader.click();
};