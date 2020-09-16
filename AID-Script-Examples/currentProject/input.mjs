import { config } from './dependencies/config.mjs'
const { updateHistory, processInput, updateState, clearState, getData} = config.backgroundFunctions; config.data = getData()
const { addWorldEntry, removeWorldEntry, updateWorldEntry } = config.nativeFunctions; let {worldEntries, state} = config.data; const {history, memory} = config.data
const input = processInput(); const text = input["text"];
// Ignore the above and do not include it in your AI Dungeon script, it enables the use of native functions and imitates AI Dungeon's behavior.
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const hasAttributes = (keys) => {const attrib = keys.match(/([a-z](=\d+)?)/g); if(attrib) {return attrib.map(attrib => attrib.split('='))}} // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.

const addFrontMemory = (entry, value = 0) => { state.memory.frontMemory = state.memory.frontMemory.replace(/> /gm, '').trim(); state.memory.frontMemory += `\n> ${entry["entry"]}`} // Last entry in the stack becomes actionized wheras the prior ones are cannonical.
const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const revealWorldEntry = (entry, value = 0) => entry.isNotHidden = true 
const addContext = (entry, value = 0) => storeContext += ' ' + entry["entry"]

const entryFunctions = {
    'a': addAuthorsNote, // [a] adds it as authorsNote, only one authorsNote at a time.
    'f': addFrontMemory, // [f] adds it to the frontMemory stack, multiple can be added at a time, but only the latest one becomes an action.
    'r': revealWorldEntry, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'c': addContext, // [c] adds it to context, recommended to pre-fix keywords with $ to avoid duplicates from normal processing.
    'e': () => {} // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.

}

let storeContext = ''
String.prototype.sliceString = function(a, b) {return this.slice(this.indexOf(a), this.indexOf(b) +1)} // Slightly cleaner to read and write than doing the indexing yourself.
// Pass the worldEntries list and check attributes, then process them.
const processWorldEntries = (entries) =>
{
    const lastTurnString = text.toLowerCase() // What we check the keywords against.
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

const modifier = (text) =>
{
    state.memory.frontMemory = ``
    if (worldEntries) {processWorldEntries(worldEntries); }
    state.memory.context = memory + storeContext;
    return {text}
}
modifier(text)
















// Do not include the below code in your scripts. It handles local persistent storage.
updateState(input) // Stores persistent data in data.json
//clearState() // Clear persistent data in data.json
