const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const hasAttributes = (keys) => {const attrib = keys.match(/([a-z](=\d+)?)/g); if(attrib) {return attrib.map(attrib => attrib.split('='))}} // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.

const setFrontMemory = (entry, value = 0) => state.memory.frontMemory += `\n> ${entry["entry"]}`
const setAuthorsNote = (entry, value = 0) => state.memory.authorsNote += `${entry["entry"]}`
const revealWorldEntry = (entry, value = 0) => entry.isNotHidden = true 
const entryFunctions = {
    'a': setAuthorsNote,
    'f': setFrontMemory,
    'r': revealWorldEntry,   
}

String.prototype.sliceString = function(a, b) {return this.slice(this.indexOf(a), this.indexOf(b) +1)} // Slightly cleaner to read and write than doing the indexing yourself.

// A decision regarding performance hasn't been finalized. Managing internal cooldowns should be done in a non- intrusive manner.
// Suggestion 1) Store the ID and do an index check against worldEntries when a change is detected to fetch attributes and values, then process them without further detections.
// This could be a simple previousLength != currentLength check to find disparity. If an ID does not match then assume its deleted and remove it from the internal array.
//const idWorldEntries = (entries) => entries.map(entry => [entry["id"], hasAttributes(sliceString(entry["keys"], '[', ']'))]) // Fetch the ID and attribute values of the entries then store ID + Attribs in state.

// Suggestion 2) Add unique keys to the worldEntries elements e.g "modifierWeight" then use the already running (overhead) keyword and worldEntry processing (which the entire script relies on regardless)
// To read the "modded" keys of the elements. With this there's no need to manage the script's/state's internal data to manage deletion/update attribute values.
// Cooldowns can also be handled by adjusting a counter attached to the key on each turn.

// Pass the worldEntries list and check attributes, then process them.
const processWorldEntries = (entries) =>
{
    const lastTurnString = getHistoryString(-1).toLowerCase()
    entries.forEach(wEntry =>
    {
        
        if (wEntry["keys"].split(',').some(keyword => lastTurnString.includes(keyword.toLowerCase()))) // Only process attributes of entries detected on the previous turn. (Using the presumed native functionality of substring acceptance instead of RegEx wholeword match)
        
        {
            try 
            {
                const entryAttributes = hasAttributes(wEntry["keys"].sliceString('[', ']')) // Get the attribute value pairs. [attrib, value]
                entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1]))
            }
            catch (error) {state.message += JSON.stringify(error)}
        }
    })
}

const modifier = (text) =>
{
    state.message = ``
    state.memory.frontMemory = ``
    delete state.memory.authorsNote
    delete state.memory.context
    if (worldEntries) {processWorldEntries(worldEntries)}
    state.message += JSON.stringify(state.memory.frontMemory)
    return {text}
}
modifier(text)