// TODO: Duplication prevention for child plus original match, hit most recent mention of the two.
// Sanitize and convert the whitelist into an object for easier manipulation.
const modifier = (text) => {

    delete state.message
    let contextMemory = getMemory(text);
    let contextMemoryLength = 0;
    let context = getContext(text);
    let lines = context.split('\n');
    let memoryLines = contextMemory.split('\n');
    let modifiedText = text.toLowerCase();
    let modifiedContext = context.toLowerCase();
    //console.log(memoryLines)

    if (worldEntries.some(element => element["keys"].includes('.'))) {
        const globalWhitelist = [getWhitelist(), getContextualProperties(getHistoryString(-4)).flat()].flat()
        const globalReplacer = (name, val) => { if (globalWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        const localWhitelist = getContextualProperties(getHistoryString(-1)).flat();
        const localReplacer = (name, val) => { if (localWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };
        // Process child references before inserting the JSON lines.
        
        // Reverse lines to hit last match instead of first.
        lines.reverse()
        for (const data in dataStorage) {
            if (dataStorage[data].hasOwnProperty("child")) {
                let indexPos = -1;
                let finalParent; // Measure the child properties against each other, the final/most recent mention becomes set as root.

                // Successful detections, especially soft-copies of unique root, results in duplicate JSON line insertions.
                // Comparing properties is insufficient as generic child inheritance does not equal child - e.g synonyms polution.
                // Previous solution implemented a 'skip' property to 'finalParent' on assignment, but did not hit 'most recent' (first .some() match determined insertion).
                // As Object is innumerable by default, relying on a specific order is infeasable without redundant sorting and recreation of key/value pairs.

                for (let parentRoot in dataStorage[data]["child"]) {
                    // Check first for presence of root then fallback to presence of root.synonyms and fetch the highest value of synonyms.
                    const searchFor = parentRoot.replace(`[`, '').replace(`]`, '');
                    const index = modifiedContext.includes(searchFor) ? modifiedContext.lastIndexOf(searchFor) : dataStorage.hasOwnProperty(searchFor) && dataStorage[searchFor].hasOwnProperty("synonyms") ? dataStorage[searchFor]["synonyms"].split(',').map(element => modifiedContext.lastIndexOf(element.toLowerCase())).sort().reverse().shift() : -1;
                    if (index >= 0 && index > indexPos) {
                        indexPos = index;
                        let toCopy; // Find the first bracket-encapsulated property of parent e.g tavern.child.ironforge.[axar]
                        for (const element in dataStorage[data]["child"][searchFor]) {
                            // Copies are indicated by bracket-encapsulation; look for a single presence of root to copy then break out.
                            if (element.includes('[')) {
                                toCopy = element.replace(`[`, '').replace(`]`, '');
                                finalParent = dataStorage[toCopy];
                                break;
                            }
                            // If it's not a copy of an existing root, grab the entire branch from root.child[...]
                            else {
                                finalParent = dataStorage[data]['child'][searchFor]
                            }
                        }
                    }
                }

                if (finalParent) {
                    // Do a risque move and merge synonyms together. 
                    finalParent['synonyms'] ? finalParent['synonyms'] += data : finalParent['synonyms'] = data;
                    if (dataStorage['synonyms'].hasOwnProperty(data)) { finalParent['synonyms'] += ', ' + dataStorage['synonyms'][data]; }
                    if (dataStorage[data].hasOwnProperty('synonyms')) { finalParent['synonyms'] += ', ' + dataStorage[data]['synonyms']; }
                    // Merge the root, e.g tavern with tavern.children.nordfall; non-unique properties are over-written.
                    Object.assign(dataStorage[data], finalParent);
                }
            }

            // Correctly (🤔) find the most recent match between synonyms and child copies.
            let finalIndex = -1; let finalWord; const checkWords = [...[data], ...getRootSynonyms(data)]; checkWords.forEach(word => { const index = modifiedContext.lastIndexOf(word.toLowerCase()); if (index > finalIndex) {finalIndex = index; finalWord = word;}})
            //console.log(`Check: ${checkWords}| Final: ${finalWord}`)
            // Insertion of JSON lines at last match.
            lines.some(line => {   
                const regEx = new RegExp('\\b' + finalWord, 'gi');
                if (!line.includes('[') && regEx.test(line)) {
                    // Stringify the dataStorage by displaying the whitelisted/contextual properties.
                    let string = JSON.stringify(dataStorage[data], globalReplacer).replace(/\\/g, '');
                    if (state.settings["filter"]) {string = string.replace(/"|{|}/g, '')}
                    // If it's not an empty JSON [{}] <-- 4 chars and none of the lines currently include the JSON (e.g when trying to display from unique and child)
                    // Could potentially check for string duplicates per line, but order is an issue... compare indexes?
                    if (string.length > 4 && !lines.some(line => line.includes(string))) { lines.splice(lines.indexOf(line) + 1, 0, `[${string}]`); return true;}
                }
            });
        }
        // Reverse the line back into normal order.
        lines.reverse(); 

        const JSONLines = lines.filter(line => line.startsWith('['))
        const JSONString = JSONLines.join('\n');
        if (state.settings["entriesFromJSON"]) {const normalWorldEntries = worldEntries.filter(element => { if (!element["keys"].includes('.') && (!element["keys"].includes(whitelistPath))) { return true } }); normalWorldEntries.forEach(element => element["keys"].split(',').some(keyword => { if (JSONString.toLowerCase().includes(keyword.toLowerCase()) && !text.includes(element["entry"])) { if (info.memoryLength + contextMemoryLength + element["entry"].length <= info.maxChars / 2) { memoryLines.splice(-1, 0, element["entry"]); contextMemoryLength += element["entry"].length + 1; return true; } } })) }
        // Uncommenting this line adds 'actionized' properties to the fore-front of context to have them directly affect the outcome. Should not be necessary, but may improve outcomes in certain situations. Feel free to experiment with it. If a property is not whitelisted, it's required to have a synonyms. definition to show.
        //getHistoryString(-1).split(' ').reverse().some(word => { for (const data in dataStorage) {if (word.toLowerCase().includes(data)) { JSON.stringify(dataStorage[data], localReplacer).length > 2 ? lines.splice(lines.length, 0, `\n> [${JSON.stringify(dataStorage[data], localReplacer)}]\n`) : {} ; return true}}})
    }




    let combinedMemory = memoryLines.join('\n').replace(/\n$/, "");
    let combinedLines = lines.join('\n').slice(-(info.maxChars - info.memoryLength - contextMemoryLength)).replace(/\n$/, "").replace(/\]\n\[/g, '][').replace(/^[^\[]*.]/g, ''); // Last replace to merge stacking JSON lines into one - experimental, might be bad.
    // Lazy patchwork to """fix""" linebreak spam.
    //while (combinedLines.includes('\n\n')) { combinedLines = combinedLines.replace('\n\n', '\n') }
    const finalText = [combinedMemory, combinedLines].join("\n")
    // Debug to check if the context is intact and properly utilized, optimally the numbers should always match
    console.log(`Final Text: ${finalText.length}`, `Max Text: ${info.maxChars}`, `MemoryLength: ${info.memoryLength + contextMemoryLength}`)
    return { text: finalText }
}
modifier(text)