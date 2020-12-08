

// TODO: Duplication prevention for child plus original match, hit most recent mention of the two.
// Sanitize and convert the whitelist into an object for easier manipulation.
const modifier = (text) => {

    delete state.message
    let contextMemory = getMemory(text);
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');
    let modifiedText = text.toLowerCase();
    let modifiedContext = context.toLowerCase();

    const whitelistIndex = worldEntries.findIndex(element => element["keys"] == 'whitelist.')
    if (whitelistIndex) { const whitelist = worldEntries[whitelistIndex]; worldEntries.splice(whitelistIndex, 1), worldEntries.unshift(whitelist)}
    //console.log(memoryLines)

    if (state.scene) {lines = insertScene(lines)}
    if (state.generate.process) { return { text: generateObject(text) } }
    assignParents(modifiedContext);
    lines = insertJSON(lines, modifiedContext);
    if (state.settings["entriesFromJSON"]) { entriesFromJSONLines(lines, memoryLines) }

    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");
    // Last replace to merge stacking JSON lines into one - experimental, might be bad.
    let combinedLines = lines.join('\n').replace(/\n$/, "").replace(/\]\n\[/g, '][').slice(-(info.maxChars - info.memoryLength - contextMemoryLength)).replace(/^[^\[]*.]/g, '');
    const finalText = [combinedMemory, combinedLines].join("\n")
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }
}
modifier(text)