// Detect keywords of characters listed in worldEntries, denoted by having a capitalized primary key.
// Append the first sentence of the entry as a paranthesized extension of their name in the transient context.
// Hopefully this will function to cross-reference the information with what's already present in context through memory and world information.


const addDescription = (entry, value = 0) =>
{
    const searchKeys = entry["keys"].split(',')
    const context = lines.join('\n')
    const finalIndex = null;
    const keyPhrase = null;
    searchKeys.forEach(key => {const keyIndex = context.lastIndexOf(key); if (keyIndex > finalIndex) {finalIndex = keyIndex; keyPhrase = key;}}) // Find the last mention of a valid key from the entry.

    const beginString = context.substring(0, finalIndex) // Establish the point up until the phrase/word we want to append to.
    const endString = context.substring(finalIndex + keyPhrase.length)
    const entryString = entry["entry"].slice(0, entry["entry"].indexOf(entry["entry"].match(/[.!?]/))) // Extract the first sentence from the entry.
    
    context = beginString + '(' + entryString + ')' + endString;
    lines = context.split('\n')
}



const modifier = (text) =>
{



    fullContext = [memory, context].join('') // Join the various things into a cohesive string of text.
    return {text: fullContext}
}
const memory = info.memoryLength ? text.slice(0, info.memoryLength) : ''
const context = info.memoryLength ? text.slice(info.memoryLength + 1) : text


const text = "This is the story about Heather who is your doting girlfriend.";
const replacer = "Heather (Your doting slut)";
const replaced = replaceLast('Heather', replacer, text);
console.log(replaced);