const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const hasAttributes = (keys) => {const attrib = keys.match(/([a-z](=\d+)?)/g); if(attrib) {return attrib.map(attrib => attrib.split('='))}} // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.

String.prototype.sliceString = function(a, b) {return this.slice(this.indexOf(a), this.indexOf(b) +1)} // Slightly cleaner to read and write than doing the indexing yourself.


const getMemory = (text) => {return info.memoryLength ? text.slice(0, info.memoryLength) : ''} // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => {return info.memoryLength ? text.slice(info.memoryLength + 1) : text} // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.

const addDescription = (entry, value = 0) =>
{
    const searchKeys = entry["keys"].replace(/\$/g, '').split(',')
    let finalIndex = null;
    let keyPhrase = null;
    searchKeys.forEach(key => { if(!assignedDescriptors.includes(key)) {const keyIndex = context.lastIndexOf(key); if (keyIndex > finalIndex) {finalIndex = keyIndex; keyPhrase = key; assignedDescriptors.push(key)}}}) // Find the last mention of a valid key from the entry.

    if (finalIndex)
    {

        console.log(finalIndex)
        const beginString = context.slice(0, finalIndex) // Establish the point up until the phrase/word we want to append to.
        const endString = context.slice(finalIndex + keyPhrase.length)
        const entryString = entry["entry"].slice(0, entry["entry"].indexOf(entry["entry"].match(/[.!?]/))) // Extract the first sentence from the entry.
        context = beginString + keyPhrase + ' (' + entryString + ') ' + endString; // Assemble it with parenthesis encapsulation (less likely to interrupt narrative).
    }  
    lines = context.split('\n')
}
const addFrontMemory = (entry, value = 0) => { state.memory.frontMemory = state.memory.frontMemory.replace(/\n>/gm, '').trim(); state.memory.frontMemory += `\n> ${entry["entry"]}`} // Last entry in the stack becomes actionized wheras the prior ones are cannonical.
const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const revealWorldEntry = (entry, value = 0) => entry.isNotHidden = true 
const addContext = (entry, value = 0) => {storeContext += ' ' + entry["entry"]; console.log(entry)}

const entryFunctions = {
    'a': addAuthorsNote, // [a] adds it as authorsNote, only one authorsNote at a time.
    'f': addFrontMemory, // [f] adds it to the frontMemory stack, multiple can be added at a time, but only the latest one becomes an action.
    'r': revealWorldEntry, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'c': addContext, // [c] adds it to context, recommended to pre-fix keywords with $ to avoid duplicates from normal processing.
    'e': () => {}, // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.
    'd': addDescription // [d] adds the first sentence of the entry as a short, parenthesized descriptor to the last mention of the revelant keyword(s) e.g John (a business man)
}

let assignedDescriptors = [] // Assemble a list of descriptors that have already been assigned to avoid duplicates.
let storeContext = '' // Assemble the context from the various entries.
// Pass the worldEntries list and check attributes, then process them.
const processWorldEntries = (entries) =>
{
    const lastTurnString = getHistoryString(-1).toLowerCase().trim() // What we check the keywords against, this time around we basically check where in the context the last history element is then slice forward.
    entries.forEach(wEntry => // Take a quick sprint through the worldEntries list and process its elements.
    {
        // Only process attributes of entries detected on the previous turn. (Using the presumed native functionality of substring acceptance instead of RegEx wholeword match)
        // During the custom check we also (temporarily) remove the '$' prefix as to not need special processing of that later, a trim is also done.
        if (wEntry["keys"].replace(/\$/g, '').split(',').some(keyword => lastTurnString.includes(keyword.toLowerCase().trim()))) 
        
        {
            try // We try to do something. If code goes kaboom then we just catch the error and proceed. This is to deal with non-attribute assigned entries e.g those with empty bracket-encapsulations []
            {
                // Get the attribute value pairs. [attrib, value]
                const entryAttributes = hasAttributes(wEntry["keys"].sliceString('[', ']')) 
                // Do a strict/every match if it's flagged as such, entry will only be processed if all keywords match as opposed to any.
                if (entryAttributes.some(attrib => attrib.includes('e')))
                { if (wEntry["keys"].replace(/\$/g, '').replace(/\[(.+)?\]/g, '').split(',').every(keyword => lastTurnString.includes(keyword.toLowerCase().trim()))) { entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1])) } }   
                // If it's not flagged with 'e' then process as normal (any check)
                else {entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1]))}
                
            }
            catch (error) {console.log(error)} //I run tests in a local environment so this actually does something. Woah.
        }
        
    })
}

let contextMemory = getMemory(text);
let context = getContext(text);
let lines = context.split('\n'); // Split the line-breaks within the context into separated strings in an array.
const modifier = (text) =>
{

    state.memory.frontMemory = ``

    
    if (worldEntries) {processWorldEntries(worldEntries);}
    
    state.memory.context = memory + storeContext;
    const combinedLines = lines.join("\n").slice(-(info.maxChars - info.memoryLength))
    const finalText = [contextMemory, combinedLines].join("")

    return {text: finalText}
}
modifier(text)
