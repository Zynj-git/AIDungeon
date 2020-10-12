// Traverse the keys until we reach the destination.
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { return a && a[b] }, obj) }
// Store the semi-persistent data somewhere.
state.data = {}
const dataStorage = state.data;
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }

// Do some basic wizardry.
worldEntries.forEach(wEntry => {
    const keys = wEntry["keys"].replace(/\[|\]/g, '').split('.')
    const property = keys.slice(-1)

    // Check if first time initialization of the parent property is necessary.
    if (!dataStorage.hasOwnProperty(keys[0])) { dataStorage[keys[0]] = {}; }
    // Find the object we wish to manipulate.
    let object = getKey(keys.slice(0, keys.length - 1).join('.'), dataStorage)
    // If the object is defined then assign the 'entry' as its value.
    if (object != undefined) { object[property] = wEntry["entry"] }
    else { console.log(`Property: ${property} does not have a valid parent path!`) }
})

const modifier = (text) => {

    let contextMemory = getMemory(text).split('\n');
    let context = getContext(text);
    let modifiedText = text.toLowerCase()

    console.log(state.data)
    for (var data in dataStorage) {
        // Match 'full sentences' that begin with a capital letter and contains the data target.
        console.log(data)
        if (context.toLowerCase().includes(data)) // Check if the text contains the target.
        {
            const regEx = new RegExp('('+ data + ')[A-Za-z,;: \'-]*|(["A-Z]|' + data + ')[A-Za-z,;: \'-]*' + data, 'gi')
            const textToReplace = context.match(regEx).pop()
            console.log(textToReplace)
            context = context.replace(textToReplace, `\n[${JSON.stringify(dataStorage[data])}]\n${textToReplace}`)
        }
    }
    const finalText = [contextMemory, context.slice(-(info.maxChars - info.memoryLength))].join("")
    return { text: finalText }
}
modifier(text)