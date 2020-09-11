// This is an output modifier by Zynj :)
// Checks the history for the presence of world entries' keywords and add the relevant ones into context for X amount of turns.
// The worldEntries are sorted by relevancy in the order of most recent appearance, e.g the latest keyword in the output is considered the most relevant one.
// worldEntries whose keys is starting with _ becomes placed in frontMemory once discovered, this can be used to drastically improve the chance of it being relevant.
// frontMemory is a hidden string appended to the end of the input.
// authorsNote:
// The first worldEntry that has authorsNote as a keyword will have its entry utilized as state.memory.authorsNote
// Additional entries marked with authorsNote will be set as a temporary authorsNote until it expires at which point the default authorsNote becomes reinstated.

if (!state.setup) {
    state.setup = true;
    state.durationTimer = 5; // Change this to how many turns you want the discovered entries to stay in context.
}

//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr#273810
String.prototype.regexLastIndexOf = function (regex, startpos) { // Function to be able to search for the lastIndexOf a word / character based on RegEx
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if(typeof (startpos) == "undefined") {
        startpos = this.length;
    } else if(startpos < 0) {
        startpos = 0;
    }
    let stringToWorkWith = this.substring(0, startpos + 1);
    let lastIndexOf = -1;
    let nextStop = 0;
    while((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
}

const getAuthorsNote = () => { return worldEntries.findIndex(entry => entry["keys"].includes('authorsNote')) } // Find the first index of an entry whose keys include 'authorsNote' This is a default fall-back incase the automatic detection hasn't found any.
const getHistoryText = (turns) => { return history.slice(turns).flatMap(elem => elem["text"]).join() } // Fetches the textc ontained in the specified amount of most recent turns as a string.
const discoverWorldEntries = (text) =>  // Searches the string for world entries and returns an array with an index of its latest occurrence plus the corresponding entryText
        {
            const textToSearch = text;
            let discoveredElements = [];
            // Loop through all world entries to check if their keyword is mentioned in textToSearch
            worldEntries.forEach(wEntry =>
            {
                // Split the keywords of the entry into an array we can loop through.
                const keyWords = wEntry["keys"].split(',');
                let keywordIndex = -1; // Keeps track of the last mention of the keyword as to order them by relevancy
                // Returns true as soon as a match is found.
                if (keyWords.some(word =>
                    {
                        const regEx = new RegExp(`\\b${word.trim()}(s+)?\\b`,"gi"); // Wholeword, case- insensitve RegEx match, alternative s for common plural(s).
                        const lastMentionIndex = textToSearch.regexLastIndexOf(regEx)
                        if (lastMentionIndex > keywordIndex) {keywordIndex = lastMentionIndex; return true} // Find the highest value of any of the matching keywords
                    }))
                    {
                        // We're interested in the keywordIndex for sorting purposes
                        // It's the first time the element is discovered, push it to the discoveredElements array.
                        // The pushed array includes [keyWordIndex, wEntry["entry"], frontMemoryTag, authorsNoteTag]
                        if (!discoveredElements.some(element => element.includes(`\n${wEntry["entry"]}`))) {discoveredElements.push([keywordIndex, `${wEntry["entry"]}`, wEntry["keys"].startsWith('_') ? true : false, wEntry["keys"].includes('authorsNote') ? true : false]);}
                        // Find and update the keywordIndex of the element. if it already exists then update the keywordIndex of the element.
                        else {discoveredElements.forEach(element => {if (element.includes(`\n${wEntry["entry"]}`)) {element[0] = keywordIndex}})}
                    }
            })
            return discoveredElements // Return an list of arrays containing [lastIndex, entryText, frontMemoryTag]
        }

const injectContext = () =>
        {
            // Hold a string of the latest history elements.
            let discoveredHistoryElements = []; // Holds pairs of the index it was last discovered at plus the corresponding entry text. [index, entry]
            let historyTracker = getHistoryText(-5); // Assemble a singular string for includes()
            let discoveredFrontMemory = []; //
            let frontMemoryTracker = getHistoryText(-1); // Same, but only check the previous turn.
            // Check the last X amount of entries in the history
            

            if (historyTracker) {discoveredHistoryElements = discoverWorldEntries(historyTracker)}
            if (frontMemoryTracker) {discoveredFrontMemory = discoverWorldEntries(frontMemoryTracker)}
            // Add the appended string to context
            if (discoveredHistoryElements || discoveredFrontMemory)
            {
                let holdDiscoveredWorldEntries = [] // Unshift the elements after sorting here to stay within character recommendations

                let foundAuthorsNote = false; // Toggles to true if a note is found, if it remains false use the default authorsNote.
                discoveredHistoryElements = discoveredHistoryElements.sort(function(a, b){return b[0]-a[0]}); // Sort it based on the keywordIndex value
                discoveredHistoryElements.forEach(element => {if ((holdDiscoveredWorldEntries.join(',').length + element[1].length) < 1000 && element[2] == false) 
                {
                    holdDiscoveredWorldEntries.unshift('\n' + element[1]); // Linebreaks to better separate entry information.
                    if (element[3] == true)  // Check if it passed the authorsNote check.
                    {state.memory.authorsNote = element[1]; foundAuthorsNote = true;} // Add it as an authorsNote.
                }})

                if (!foundAuthorsNote) {state.memory.authorsNote = worldEntries[getAuthorsNote()]["entry"]}

                let holdDiscoveredFrontMemory = [] // Duplicate code handling entries tagged as frontMemory
                discoveredFrontMemory = discoveredFrontMemory.sort(function(a, b){return b[0]-a[0]}); // Sort it based on the keywordIndex value
                discoveredFrontMemory.forEach(element => {if ((holdDiscoveredFrontMemory.join(',').length + element[1].length) < 1000 && element[2]) {holdDiscoveredFrontMemory.unshift(element[1])}})

                const contextString = holdDiscoveredWorldEntries.join(' '); // Join it into a string
                const frontMemoryString = holdDiscoveredFrontMemory.join(' ');

                if (contextString) {state.memory["context"] =  memory.split(0, 1000) + contextString;} else {delete state.memory["context"]} // Attach the discovered worldEntries to the context memory.split(0, 1000)
                if (frontMemoryString) {state.memory["frontMemory"] = `\n> ` + frontMemoryString;} else {delete state.memory["frontMemory"]}
            }
            return
        }

const modifier = (text) => {
    let modifiedText = text;
    // After each output check if the history contains keywords for entries and prolong their lifetime,
    // as brought up there's no need to check input because that's the default functionality of AID
    if (worldEntries) {injectContext();}
    else (state.message += "worldEntries is not defined! Create at least one (1) entry!")
    // Debug to check that it's working.
    state.message = JSON.stringify(state.memory);
    return {text};
}
modifier(text);
