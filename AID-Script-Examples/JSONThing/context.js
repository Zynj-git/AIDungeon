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

const modifier = (text) => {

    let contextMemory = getMemory(text);
    let contextMemoryLength = 0;
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');
    let modifiedText = text.toLowerCase();
    let modifiedContext = context.toLowerCase();
    //console.log(memoryLines)

    // Loop through the previously defined properties in reverse order, then reverse again. Flip flop, *dab*.
    if (worldEntries.some(element => element["keys"].includes('.'))) {
        const globalWhitelist = [getWhitelist(), getContextualProperties(getHistoryString(-4)).flat()].flat()
        const globalReplacer = (name, val) => { if (globalWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        const localWhitelist = getContextualProperties(getHistoryString(-1)).flat();
        const localReplacer = (name, val) => { if (localWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        // Process child references before inserting the JSON lines.
        for (const data in dataStorage) {
            if (dataStorage[data].hasOwnProperty("child")) {
                let indexPos = -1;
                let finalParent; // Measure the child properties against each other, the final/most recent mention becomes set as root.

                for (let parentRoot in dataStorage[data]["child"]) {
                    // Check first for presence of root then fallback to presence of root.synonyms and fetch the highest value of synonyms.
                    const searchFor = parentRoot.replace(`[`, '').replace(`]`, '');
                    const index = modifiedContext.includes(searchFor) ? modifiedContext.lastIndexOf(searchFor) : dataStorage.hasOwnProperty(searchFor) && dataStorage[searchFor].hasOwnProperty("synonyms") ? dataStorage[searchFor]["synonyms"].split(',').map(element => modifiedContext.lastIndexOf(element.toLowerCase())).sort().reverse().shift() : -1;
                    if (index >= 0 && index > indexPos) {
                        indexPos = index;
                        let toCopy; // Find the first bracket-encapsulated property of parent e.g tavern.child.ironforge.[axar]
                        for (const element in dataStorage[data]["child"][searchFor]) {
                            // Copies are indicated by bracket-encapsulation; look for a single presence of it then break out.
                            if (element.includes('[')) {
                                toCopy = element.replace(`[`, '').replace(`]`, '');
                                finalParent = dataStorage[toCopy];
                                break;
                            }
                            // If it's not a copy of an existing root, grab the entire branch.
                            else {
                                finalParent = dataStorage[data]['child'][searchFor]
                            }
                        }
                    }
                }

                if (finalParent) {
                    // Do a risque move and merge synonyms together. 
                    if (dataStorage['synonyms'].hasOwnProperty(data)) { finalParent['synonyms'] = ', ' + dataStorage['synonyms'][data]; }
                    if (dataStorage[data].hasOwnProperty('synonyms')) { finalParent['synonyms'] = ', ' + dataStorage[data]['synonyms']; }
                    // Merge the root, e.g tavern with tavern.children.nordfall; non-unique properties are over-written.
                    Object.assign(dataStorage[data], finalParent);
                }
            }

            // Reverse for .some() to hit last match instead of first.
            lines.reverse().some(line => {
                const regEx = new RegExp('\\b' + data, 'gi');
                if (!line.includes('[') && (regEx.test(line) || getRootSynonyms(data).some(synonym => line.toLowerCase().includes(synonym)))) {
                    // Stringify the dataStorage by displaying the whitelisted/contextual properties.
                    const string = JSON.stringify(dataStorage[data], globalReplacer);
                    // If it's not an empty JSON [{}] <-- 4 chars and none of the lines currently include the JSON (e.g when trying to display from unique and child)
                    if (string.length > 4 && !lines.some(line => line.includes(string))) { lines.splice(lines.indexOf(line) + 1, 0, `[${JSON.stringify(dataStorage[data], globalReplacer)}]`) }
                }
            });
            // Reverse the line back into normal order.
            lines.reverse();
         

        }


        const JSONLines = lines.filter(line => line.startsWith('['))
        const JSONString = JSONLines.join('\n');
        const normalWorldEntries = worldEntries.filter(element => { if (!element["keys"].includes('.') && (!element["keys"].includes('whitelist'))) { return true } });
        //console.log(JSONString, normalWorldEntries)
        normalWorldEntries.forEach(element => element["keys"].split(',').some(keyword => { if (JSONString.toLowerCase().includes(keyword.toLowerCase()) && !text.includes(element["entry"])) { if (info.memoryLength + contextMemoryLength + element["entry"].length <= info.maxChars / 2) { memoryLines.splice(-1, 0, element["entry"]); contextMemoryLength += element["entry"].length + 1; return true; } } }))

        // Uncommenting this line adds 'actionized' properties to the fore-front of context to have them directly affect the outcome. Should not be necessary, but may improve outcomes in certain situations. Feel free to experiment with it. If a property is not whitelisted, it's required to have a synonyms. definition to show.
        //getHistoryString(-1).split(' ').reverse().some(word => { for (const data in dataStorage) {if (word.toLowerCase().includes(data)) { JSON.stringify(dataStorage[data], localReplacer).length > 2 ? lines.splice(lines.length, 0, `\n> [${JSON.stringify(dataStorage[data], localReplacer)}]\n`) : {} ; return true}}})
    }




    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");
    let combinedLines = lines.join('\n').slice(-(info.maxChars - info.memoryLength - contextMemoryLength)).replace(/\n$/, "").replace(/]\n\[/g, '][').replace(/^[^\[]*.]/g, ''); // Last replace to merge stacking JSON lines into one - experimental, might be bad.
    // Lazy patchwork to """fix""" linebreak spam.
    //while (combinedLines.includes('\n\n')) { combinedLines = combinedLines.replace('\n\n', '\n') }
    const finalText = [combinedMemory, combinedLines].join("\n")
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }
}
modifier(text)