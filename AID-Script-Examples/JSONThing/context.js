// Define a property and assign its value by using World Information.
// The element's keys are a dot notated path e.g john.character.name
// The element's entry (e.g John) will be assigned as the value of the path's destination, in the above example that would result in 'name: John'
state.data = {}
const dataStorage = state.data;
// Traverse the keys until we reach the destination.
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }
// Whitelisted properties defined in an entry keyworded 'whitelist' will always display above the last mention of root.
const getWhitelist = () => worldEntries.filter(entry => entry["keys"].includes('whitelist'))[0]["entry"].split(',').map(element => element.trim())
// Contextual properties will be referenced in frontMemory when prompted.
const getContextualProperties = (text) => { return worldEntries.filter(entry => entry["keys"].includes('synonyms.') && entry["entry"].split(',').some(key=> text.includes(key))).map(element => element["keys"].split('.').slice(1));}
// Assign the property defined in the wEntry's keys with its entry value.
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.').slice(0, -1).join('.'); getKey(path, obj)[property] = value.includes(',') ? value.split(',').map(element => element.trim()) : value }

// By whitelisting and checking the elements, we only fetch valid, assigned, values for that turn.
//const whitelist = ['character', getContextualProperties(getHistoryString(-1)).flat()].flat()
//console.log(whitelist)
//const replacer = (name, val) => { if (whitelist.some(element => element.includes(name)) && val) {return val}};
// Loop through worldEntries and assign the properties within state.data
worldEntries.forEach(wEntry => { if (wEntry["keys"].includes('.')) {setProperty(wEntry["keys"], wEntry["entry"], dataStorage) }})

const modifier = (text) => {

    delete state.memory.frontMemory;
    let contextMemory = getMemory(text);
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');

    // Loop through the previously defined properties in reverse order, then reverse again. Flip flop, *dab*.
    for (const data in dataStorage) { lines.reverse().some(line => {if (!line.includes('[') && line.toLowerCase().includes(data)) {lines.splice(lines.indexOf(line) + 1, 0, `[${JSON.stringify(dataStorage[data], [getWhitelist(), getContextualProperties(getHistoryString(-1))].flat())}]`); return true}}); lines.reverse(); }
    getHistoryString(-1).split(' ').reverse().some(word => { for (const data in dataStorage) {if (word.toLowerCase().includes(data)) { const whitelist = getContextualProperties(getHistoryString(-1)).flat(); console.log(whitelist); whitelist.length >= 1 ? lines.splice(lines.length, 0, `\n> [${JSON.stringify(dataStorage[data], ['character', whitelist].flat())}]\n`) : {}; return true}}})

    let combinedLines = lines.join('\n').slice(-(info.maxChars - info.memoryLength))
    // Lazy patchwork to """fix""" linebreak spam.
    //while (combinedLines.includes('\n\n')) { combinedLines = combinedLines.replace('\n\n', '\n') }
    const finalText = [contextMemory, combinedLines].join("\n")
    return { text: finalText }
}
modifier(text)