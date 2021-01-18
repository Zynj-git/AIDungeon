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
        "Consume all entries then build them as Objects in dataStorage.":
        {
            "req": true,
            "args": null,
            "exec": consumeWorldEntries
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

        "Insert the Objects as JSON- lines.":
        {
            "req": true,
            "args": modifiedContext,
            "exec": insertJSON
        },
        "Process the EWI Attribute entries.":
        {
            "req": worldEntries.length > 0,
            "args": null,
            "exec": processWorldEntries
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
        "If parity mode is enabled, reconstruct and display all Objects as entries in the World Information interface.":
        {
            "req": state.settings["parityMode"],
            "args": null,
            "exec": parityMode
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
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength}`)
    return { text: finalText }

}
modifier(text)
