delete state.message
let contextMemory = getMemory(text);
let context = getContext(text);
let lines = context.split('\n');

// EWIJSON Dependencies - START.
state.EWI.data = {} // When processing context, rebuild data. Input modifier interacts with "cached" version.
dataStorage = state.EWI.data;
const { execute } = state.EWI;
const linesLength = context.length;

let memoryLines = contextMemory.split('\n');
let memoryLinesLength = memoryLines.length

let copyLines = [...lines];
let copyMemoryLines = [...memoryLines];
for (let action in execute) { if (execute[action]["req"]) { execute[action]["exec"](execute[action]["args"]) } }
contextMemory = memoryLines.join('\n') // NOTE: Overwrites contextMemory with changes applied by EWI.
// EWIJSON Dependencies - END.

const modifier = (text) =>
{
    let combinedLines = lines.join('\n').slice(-(info.maxChars - contextMemory.length - 1));
    const finalText = [contextMemory, combinedLines].join("");

    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength}`, `Total Memory: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }
}
modifier(text)