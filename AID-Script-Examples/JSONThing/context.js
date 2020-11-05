// Define a property and assign its value by using World Information.
// The element's keys are a dot notated path e.g john.character.name
// The element's entry (e.g John) will be assigned as the value of the path's destination, in the above example that would result in 'name: John'

// NOTE: Current issues are mainly optimization and quality-of-life related.
// state.data does not need to, nor should it be, used for storage in this situation, but for debugging purposes it's handy to view them via it.
// Storing the data, persistently, in state would have the benefit of not implicitly having to rebuild the objects on each turn, but ensuring ease-of-use for seamless updating would incur additional processing and code regardless.

// const replacer should be reworked to properly display an Array value as Array instead of converting it (.toString()) in order to follow the philosophy of 'true JSON', although presenting it as a comma-separated string is permissable.
// const replacer should also not present undefined properties, but implementing a straight-forward logic for that eludes the capacity of my smol brain.
// The above issue arises when a synonym. definition attempts to trigger a property at the end of a branch containing some defined in addition to some undefined properties.
// Example: john.reaction.war is defined while john.reaction.peace is undefined. When any of the synonym.peace definitions activate it will bring forth the john.reaction branch in an attempt to present the .peace value, but ends up presenting "nothing" ([{}])

// Create a parent/child reference structure to localize properties without explicit synonyms. e.g if the situation takes place in nordfall.location then a generic tavern.location should pull the correct descriptor (Nordfall themed), assigning and depending on unique roots e.g 'The Frozen Nord' is too inconsistent and infeasable.
// [{"location": "Nordfall"}] <--- Check a line matching a specific requirement, e.g a hidden property label such as nordfall.parent - true.
// [{"location": "Tavern", "name": "The Frozen Nord", "yelp-five-star-ratings": 5}] <---  (pseudo) tavern.child - Nordfall; somehow attach it with endless combinations.
// Create a hierachy within the generic root e.g tavern.child.nordfall then fetch additional properties and restructure the object with the child hierarchy.

state.data = {}
console.log(`Turn: ${info.actionCount}`)
const dataStorage = state.data;
// Traverse the keys until we reach the destination, if a key on the path is assigned a value, convert it to an empty object to not interrupt the pathing.
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty('synonyms') ? dataStorage[root]["synonyms"].split(',').map(element => element.toLowerCase().trim()) : []
// Whitelisted properties defined in an entry keyworded 'whitelist' will always display above the last mention of root.
const getWhitelist = () => worldEntries.filter(entry => entry["keys"].includes('whitelist'))[0]["entry"].split(',').map(element => element.trim())
// Contextual properties will be added to the JSON when a related synonym.property entry is found in the last turn. e.g synonym.cake would bring john.preferences.food.favorite.cake into the JSON for that turn.
// It adds the property path, omitting 'synonyms', to the whitelist so each of ['preferences', 'food', 'favorite', 'cake'] would be whitelisted. john.preferences.food.favorite.hotdog would for example not show as 'hotdog' is not whitelisted.
const getContextualProperties = (modifiedText) => { return worldEntries.filter(entry => entry["keys"].includes('synonyms.') && entry["entry"].split(',').some(key => modifiedText.includes(key.toLowerCase()))).map(element => element["keys"].toLowerCase().split('.').slice(1)); }
// Assign the property defined in the wEntry's keys with its entry value.
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.').slice(0, -1).join('.'); getKey(path, obj)[property] = value } // value.includes(',') ? value.split(',').map(element => element.trim()) :  value
const modifier = (text) => {

    let contextMemory = getMemory(text);
    let contextMemoryLength = 0;
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');
    let modifiedText = text.toLowerCase();
    //console.log(memoryLines)

    // Loop through the previously defined properties in reverse order, then reverse again. Flip flop, *dab*.
    if (worldEntries.some(element => element["keys"].includes('.'))) {
        const globalWhitelist = [getWhitelist(), getContextualProperties(getHistoryString(-4)).flat()].flat()
        const globalReplacer = (name, val) => { if (globalWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        const localWhitelist = getContextualProperties(getHistoryString(-1)).flat();
        const localReplacer = (name, val) => { if (localWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        worldEntries.forEach(wEntry => { if (wEntry["keys"].includes('.')) { setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage) } })
        for (const root in dataStorage) {

            if (dataStorage[root].hasOwnProperty("child")) {
                let indexPos = -1;
                let finalParent; // Measure the child properties against each other, the final/most recent mention becomes set as root.

                for (const parentRoot in dataStorage[root]["child"]) {
                    // Check first for presence of root then fallback to presence of root.synonyms and fetch the highest value of synonyms.
                    const index = modifiedText.includes(parentRoot) ? modifiedText.lastIndexOf(parentRoot) : dataStorage.hasOwnProperty(parentRoot) && dataStorage[parentRoot].hasOwnProperty("synonyms") ? dataStorage[parentRoot]["synonyms"].split(',').map(element => modifiedText.lastIndexOf(element.toLowerCase())).sort().reverse().shift() : null;
                    if (index >= 0 && index > indexPos) {
                        indexPos = index; finalParent = dataStorage[root]["child"][parentRoot];
                    }
                }

                dataStorage[root] = finalParent; // Replace the root, e.g tavern with tavern.children.nordfall

            }
        }

        // Check if root or a qualifying phrase/word in root.synonyms is present.
        for (const data in dataStorage) { lines.reverse().some(line => { if (!line.includes('[') && (line.toLowerCase().includes(data) || getRootSynonyms(data).some(synonym => line.toLowerCase().includes(synonym)))) { lines.splice(lines.indexOf(line) + 1, 0, `[${JSON.stringify(dataStorage[data], globalReplacer)}]`); return true } }); lines.reverse(); }


        const JSONLines = lines.filter(line => line.startsWith('[{'))
        const JSONString = JSONLines.join('\n');
        const normalWorldEntries = worldEntries.filter(element => { if (!element["keys"].includes('.') && (!element["keys"].includes('whitelist'))) { return true } });
        //console.log(JSONString, normalWorldEntries)
        normalWorldEntries.forEach(element => element["keys"].split(',').some(keyword => { if (JSONString.toLowerCase().includes(keyword.toLowerCase().trim()) && !text.includes(element["entry"])) { if (info.memoryLength + element["entry"].length <= info.maxChars / 2) { memoryLines.splice(-1, 0, element["entry"]); contextMemoryLength += element["entry"].length + 1; return true; } } }))

        // Uncommenting this line adds 'actionized' properties to the fore-front of context to have them directly affect the outcome. Should not be necessary, but may improve outcomes in certain situations. Feel free to experiment with it. If a property is not whitelisted, it's required to have a synonyms. definition to show.
        //getHistoryString(-1).split(' ').reverse().some(word => { for (const data in dataStorage) {if (word.toLowerCase().includes(data)) { JSON.stringify(dataStorage[data], localReplacer).length > 2 ? lines.splice(lines.length, 0, `\n> [${JSON.stringify(dataStorage[data], localReplacer)}]\n`) : {} ; return true}}})
    }




    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");
    let combinedLines = lines.join('\n').slice(-(info.maxChars - info.memoryLength - contextMemoryLength)).replace(/\n$/, "");
    // Lazy patchwork to """fix""" linebreak spam.
    //while (combinedLines.includes('\n\n')) { combinedLines = combinedLines.replace('\n\n', '\n') }
    const finalText = [combinedMemory, combinedLines].join("\n")
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`)
    return { text: finalText }
}
modifier(text)