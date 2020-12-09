delete state.message
let contextMemory = getMemory(text);
let context = getContext(text);
let lines = context.split('\n');
let memoryLines = contextMemory.split('\n');
let modifiedText = text.toLowerCase();
let modifiedContext = context.toLowerCase();

// Adjusted and re-created from spliceContext()
let fullContextLines = [...memoryLines, ...lines];


const modifier = (text) => {
    // Position the various attribute tags, push them into temporary lists etc.
    let whitelistIndex;

    const execute = {

        "consume":
        {
            "req": true,
            "args": null,
            "exec": consumeWorldEntries
        },
        "genObject":
        {
            "req": state.generate.process,
            "args": text,
            "exec": generateObject
        },
        "insertJSON":
        {
            "req": true,
            "args": modifiedContext,
            "exec": insertJSON
        },
        "insertWorldEntriesFoundInJSONLines":
        {
            "req": state.settings["entriesFromJSON"],
            "args": null,
            "exec": entriesFromJSONLines
        },
        "worldEntriesAttributeProcessing":
        {
            "req": worldEntries.length > 0,
            "args": worldEntries,
            "exec": processWorldEntries
        }

    }

    for (action in execute) { if (execute[action]["req"]) {execute[action]["exec"](execute[action]["args"])} }


    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");

    let combinedLines = lines.join('\n').replace(/\n$/, "").replace(/\]\n\[/g, '][').slice(-(info.maxChars - combinedMemory.length - 1)).replace(/^[^\[]*.]/g, '');
    const finalText = [combinedMemory, combinedLines].join("\n")
    
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength}`)
    return { text: finalText }

}
modifier(text)
