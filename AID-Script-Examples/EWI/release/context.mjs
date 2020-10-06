let contextMemory = getMemory(text).split('\n');
let context = getContext(text);
let lines = context.split('\n'); // Split the line-breaks within the context into separated strings in an array.

const entryFunctions = {
    'a': addAuthorsNote, // [a] adds it as authorsNote, only one authorsNote at a time.
    'f': addFrontMemory, // [f] adds it to the frontMemory stack, multiple can be added at a time, but only the latest one becomes an action.
    'r': revealWorldEntry, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'c': addBackMemory, // [c] adds it to context, recommended to pre-fix keywords with $ to avoid duplicates from normal processing.
    'e': () => {}, // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.
    'd': addDescription, // [d] adds the first sentence of the entry as a short, parenthesized descriptor to the last mention of the revelant keyword(s) e.g John (a business man)
    'm': addMiddleMemory, // [i] adds a stack of entries two lines above the last input, serves as a mix between authorsNote and frontMemory.
    'w': () => {}, // [w] assigns the weight attribute, the higher value the more recent/relevant it will be in context/frontMemory/intermediateMemory etc.
}

// To avoid complicating it with measurements of the additonal string, and at the cost of slightly less flexibility, we assign different functions to handle the positioning.
// spliceMemory would be to position it 'at the top of context'/'end of memory' while spliceLines is for short/medium injections towards the lower part of context.
let contextStacks = { // Handle the positioning of the various additional contexts in a formated list to have an easier overview of what's going on.
    'frontMemory': ["", lines.length, spliceLines], // Splice it at the end of the array, push would naturally be easier, but /shrug
    'middleMemory': ["", -3, spliceLines], // Splice it one line back.
    'backMemory': ["", contextMemory.length, spliceMemory] // Splice it at the end of memory contextMemory.length
}
let assignedDescriptors = [] // Assemble a list of descriptors that have already been assigned (in an attempt) to avoid duplicates.
// Pass the worldEntries list and check attributes, then process them.
const processWorldEntries = (entries) =>
{
    entries = [...entries] // Copy the entries to avoid in-place manipulation.
    const lastTurnString = getHistoryString(-4).toLowerCase().trim() // What we check the keywords against, this time around we basically check where in the context the last history element is then slice forward.
    entries.sort((a, b) => a["keys"].match(/(?<=w=)\d+/) - b["keys"].match(/(?<=w=)\d+/)).forEach(wEntry => // Take a quick sprint through the worldEntries list and process its elements.
    {
        const basicCheck = wEntry["keys"].replace(/\$/g, '').replace(/\|/g, ',').split(',').some(keyword => lastTurnString.includes(keyword.toLowerCase().trim()))
        console.log(`Entry: ${wEntry["keys"]}: BasicCheck: ${basicCheck}`)// Only process attributes of entries detected on the previous turn. (Using the presumed native functionality of substring acceptance instead of RegEx wholeword match)
        // During the custom check we also (temporarily) remove the '$' prefix as to not need special processing of that later, a trim is also done.
        if (basicCheck) 
        
        {
            try // We try to do something. If code goes kaboom then we just catch the error and proceed. This is to deal with non-attribute assigned entries e.g those with empty bracket-encapsulations []
            {
                // Get the attribute value pairs. [attrib, value]
                const entryAttributes = hasAttributes(wEntry["keys"].extractString('[', ']')) 
                // Do a strict/every match if it's flagged as such, entry will only be processed if all keywords match as opposed to any.
                if (entryAttributes.some(attrib => attrib.includes('e')))
                { if (everyCheck(wEntry, lastTurnString)) { entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1])) } }   
                // If it's not flagged with 'e' then process as normal (any check)
                else {entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1]))}
                
            }
            catch (error) {console.log(error)} // Catch the error as it'd most likely not be destructive or otherwise detrimental.
        }
        
    })
}


const modifier = (text) =>
{
    // Position the various attribute tags, push them into temporary lists etc.
    if (worldEntries) {processWorldEntries(worldEntries);}
    // Position the various additional context content into their correct positions.    
    Object.keys(contextStacks).forEach(key => {contextStacks[key][2](contextStacks[key][0], contextStacks[key][1])})
    contextMemory = contextMemory.join('\n')
    const combinedLines = lines.join("\n").slice(-(info.maxChars - contextMemory.length)) // Account for additional context added to memory
    const finalText = [contextMemory, combinedLines].join("")
    return {text: finalText.replace(/^[^A-Z].+[,;.:]/, '')}
}
modifier(text)
