const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const hasAttributes = (keys) => {const attrib = keys.match(/([a-z](=\d+)?)/g); if(attrib) {return attrib.map(attrib => attrib.split('='))}} // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.
const everyCheck = (entry, string) => // an AND/OR check for keywords. Not foolproof, but should be fine as long as proper syntax is abided.
{
    string = string.toLowerCase().trim()
    const keys = entry["keys"].replace(/\$/g, '').replace(/\[(.+)?\]/g, '').toLowerCase().split(',')
    const anyArray = keys.filter(element => element.includes('|')).join('|').split('|').some(key => string.includes(key.trim()))
    const everyArray = keys.filter(element => !element.includes('|')).every(key => string.includes(key.trim()))
    if (everyArray && anyArray) {return true}
}
String.prototype.extractString = function(a, b) {return this.slice(this.indexOf(a), this.indexOf(b) +1)} // Slightly cleaner to read and write than doing the indexing yourself.

const spliceLines = (string, pos, req = 1) => { if (lines.length > req) {lines.splice(pos, 0, string)}} // This is run on each of the additional context to position them accordingly.
const spliceMemory = (string, pos, req = 1) => contextMemory.splice(pos, 0, string)
const getMemory = (text) => {return info.memoryLength ? text.slice(0, info.memoryLength) : ''} // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => {return info.memoryLength ? text.slice(info.memoryLength + 1) : text} // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.
// This basically took a 'just make it work 4Head approach', not happy with it, but it *does* work.
// The "challenge" is to insert the words on their last appearance rather than simply inserting on linebreaks.
// Whole-word match should be used, but I'm not keen on re-iterating the same searches in alernative means several times.
// Adding parenthesized descriptors should be done indepentendly of the 'lastInputString' search, but that'd somewhat conflict with the current attribute system (I'll look into it).
// The issue with having a ton of semi- persistent parenthesized enapsulations is that the AI will begin using them too (consider doing last mention before previous action?)
// Though with the intended use- case (short descriptors) it shouldn't be too much of an issue e.g John (the hero) or David (party member); this is one of the reason why I've placed a limiter of utilizing the first sentence only.
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
        const entryString = entry["entry"].match(/[^.!?]+/) // Extract the first sentence from the entry - unsure about whether long descriptors should be permitted, and also how they would affect the generation flow.
        context = beginString + keyPhrase + ' (' + entryString + ')' + endString; // Assemble it with parenthesis encapsulation (less likely to interrupt narrative).
    }  
    lines = context.split('\n')
}  

const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const revealWorldEntry = (entry, value = 0) => entry.isNotHidden = true

// frontMemory is fairly dependant on cooldowns which is why it's the only one that has that implemented at the moment.
const addFrontMemory = (entry, value = 0) => 
{  
    if (!entry.fLastSeen) {entry.fLastSeen = info.actionCount};
    if (info.actionCount - entry.fLastSeen >= value) {entry.fLastSeen = info.actionCount;}
    if ((info.actionCount % entry.fLastSeen) == value || (info.actionCount - entry.fLastSeen == 0))
    {  
        contextStacks["frontMemory"][0] = contextStacks["frontMemory"][0].replace(/\n>/gm, '').trim(); 
        contextStacks["frontMemory"][0] += `\n> ${entry["entry"]}`; 
        entry.fLastSeen = info.actionCount;
    }
}
const addBackMemory = (entry, value = 0) => contextStacks["backMemory"][0] += entry["entry"] + ' '
const addMiddleMemory = (entry, value = 0) => contextStacks["middleMemory"][0] += entry["entry"] + ' '

