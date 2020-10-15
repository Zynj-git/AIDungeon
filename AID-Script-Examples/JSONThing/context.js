// Define a property and assign its value by using World Information.
// The element's keys are a dot notated path e.g john.character.name
// The element's entry (e.g John) will be assigned as the value of the path's destination, in the above example that would result in 'name: John'
state.data = {}
const dataStorage = state.data;
// Traverse the keys until we reach the destination.
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }
// Assign the property defined in the wEntry's keys with its entry value.
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.').slice(0, -1).join('.'); getKey(path, obj)[property] = value }
// Loop through worldEntries and assign the properties within state.data
worldEntries.forEach(wEntry => { if (wEntry["keys"].includes('.')) {setProperty(wEntry["keys"], wEntry["entry"], dataStorage) }})
const modifier = (text) => {

    let contextMemory = getMemory(text);
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');

    // Loop through the previously defined properties in reverse order, then reverse again. Flip flop, *dab*.
    for (var data in dataStorage) { lines.reverse().some(line => {if (!line.includes('[') && line.toLowerCase().includes(data)) {lines.splice(lines.indexOf(line) + 1, 0, `[${JSON.stringify(dataStorage[data])}]`); return true}}); lines.reverse(); }
    let combinedLines = lines.join('\n').slice(-(info.maxChars - info.memoryLength))
    // Lazy patchwork to """fix""" linebreak spam.
    while (combinedLines.includes('\n\n')) { combinedLines = combinedLines.replace('\n\n', '\n') }
    const finalText = [contextMemory, combinedLines].join("")
    return { text: finalText }
}
modifier(text)