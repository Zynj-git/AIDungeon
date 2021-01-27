state.data = {} // When processing context, rebuild data. Input modifier interacts with "cached" version.
dataStorage = state.data;
delete state.message
let contextMemory = getMemory(text);
let context = getContext(text);
let lines = context.split('\n');
let memoryLines = contextMemory.split('\n');

let modifiedText = text.toLowerCase();
let modifiedContext = context.toLowerCase();
let memoryLinesLength = memoryLines.length

// Adjusted and re-created from spliceContext()
let fullContextLines = [...memoryLines, ...lines];


const modifier = (text) => {
    // Position the various attribute tags, push them into temporary lists etc.
    const execute = {

        "Sanitize the whitelist.":
        {
            "req": true,
            "args": null,
            "exec": sanitizeWhitelist
        },
        "Build qualified entries as Objects in dataStorage.":
        {
            "req": true,
            "args": null,
            "exec": buildObjects
        },

        "Ensure _synonyms is handled first when creating the globalWhitelist.":
        {
            "req": Object.keys(dataStorage)[1] != synonymsPath || Object.keys(dataStorage)[0] != whitelistPath,
            "args": null,
            "exec": fixOrder
        },
        "Build a global whitelist based on context and wildcards.":
        {
            "req": true,
            "args": null,
            "exec": getGlobalWhitelist
        },
        "If an Object is ordered for generation, shift to processing it.":
        {
            "req": state.generate.process,
            "args": text,
            "exec": generateObject
        },

        "Push the Objects to sort.":
        {
            "req": true,
            "args": null,
            "exec": insertJSON
        },
        "Push the EWI Attribute entries to sort.":
        {
            "req": worldEntries.length > 0,
            "args": null,
            "exec": processWorldEntries
        },
        "Sort and process the above by most recent mention.":
        {
            "req": true,
            "args": null,
            "exec": sortObjects
        },
        "Insert Memory Stack":
        {
            "req": true,
            "args": null,
            "exec": insertMemoryStack
        },
        "Check the inserted JSON- lines for the presence of worldEntries keywords.":
        {
            "req": state.settings["entriesFromJSON"],
            "args": null,
            "exec": entriesFromJSONLines
        },
        "Create an always visible entry that displays all created roots for Objects.":
        {
            "req": true,
            "args": null,
            "exec": trackRoots
        },
        "Refresh the variables presented in the HUD.":
        {
            "req": state.displayStats,
            "args": null,
            "exec": updateHUD
        }

    }

    for (action in execute) { if (execute[action]["req"]) { execute[action]["exec"](execute[action]["args"]) } }

    let combinedMemory = memoryLines.join('\n')
    let combinedLines = lines.join('\n').slice(-(info.maxChars - combinedMemory.length - 1));
    const finalText = [combinedMemory, combinedLines].join("\n");

    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength}`, `Total Memory: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }

}
modifier(text)
