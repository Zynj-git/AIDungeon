delete state.message
let contextMemory = getMemory(text);
let context = getContext(text);
let lines = context.split('\n');
let memoryLines = contextMemory.split('\n');
let modifiedText = text.toLowerCase();
let modifiedContext = context.toLowerCase();

const modifier = (text) => {
    // Position the various attribute tags, push them into temporary lists etc.
    let whitelistIndex;
       if (state.scene) {insertScene()}
    if (state.generate.process) { return { text: generateObject(text) } }
    assignParents(modifiedContext);
    lines.reverse(); insertJSON(modifiedContext); lines.reverse();
    if (state.settings["entriesFromJSON"]) { entriesFromJSONLines() }
    if (worldEntries.length > 0) { processWorldEntries(worldEntries); whitelistIndex = worldEntries.findIndex(element => element["keys"] == 'whitelist.');}
    // Position the various additional context content into their correct positions.    
    if (whitelistIndex > -1) { const whitelist = worldEntries[whitelistIndex]; worldEntries.splice(whitelistIndex, 1), worldEntries.unshift(whitelist)}
    //console.log(memoryLines)


    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");
    // Last replace to merge stacking JSON lines into one - experimental, might be bad.
    let combinedLines = lines.join('\n').replace(/\n$/, "").replace(/\]\n\[/g, '][').slice(-(info.maxChars - info.memoryLength - contextMemoryLength)).replace(/^[^\[]*.]/g, '');
    const finalText = [combinedMemory, combinedLines].join("\n")
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }

}
modifier(text)
