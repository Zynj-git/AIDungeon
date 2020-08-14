// This is an output modifier by Zynj :)
// Checks the history for the presence of world entries' keywords and add the relevant ones into context for X amount of turns.
// The worldEntries are sorted by relevancy in the order of most recent appearance, e.g the latest keyword in the output is considered the most relevant one.
// worldEntries whose keys is starting with _ becomes placed in frontMemory once discovered, this can be used to drastically improve the chance of it being relevant.
// frontMemory is a hidden string appended to the end of the input.

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

const discoverWorldEntries = (text) =>  // Searches the string for world entries and returns an array with an index of its latest occurrence plus the corresponding entryText
        {
            const textToSearch = text;
            let discoveredElements = [];
            // Loop through all world entries to check if their keyword is mentioned in history
            worldEntries.forEach(wEntry =>
            {
                // Split the keywords of the entry into an array we can loop through (max 50 characters)
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
                        // The pushed array includes [keyWordIndex, wEntry["entry"], frontMemoryTag]
                        if (!discoveredElements.some(element => element.includes(`\n${wEntry["entry"]}`))) {discoveredElements.push([keywordIndex, `\n${wEntry["entry"]}`, wEntry["keys"].startsWith('_') ? true : false]);}
                        // Find and update the keywordIndex of the element. if it already exists then update the keywordIndex of the element. This if / else statement is probably not the best approach
                        else {discoveredElements.forEach(element => {if (element.includes(`\n${wEntry["entry"]}`)) {element[0] = keywordIndex}})}
                    }
            })
            return discoveredElements // Return an list of arrays containing [lastIndex, entryText]
        }

const injectContext = () =>
        {
            // Hold a string of the latest history elements.
            let discoveredHistoryElements = []; // Holds pairs of the index it was last discovered at plus the corresponding entry text. [index, entry]
            let historyTracker = ``;
            let discoveredFrontMemory = [];
            let frontMemoryTracker = ``;
            // Check the last X amount of entries in the history
            history.slice(-5).forEach(hStory => historyTracker += `\n${hStory["text"]}`);
            history.slice(-1).forEach(hStory => frontMemoryTracker += `\n${hStory["text"]}`); // frontMemoryTracker checks last input 'cus it's a one time thing.

            if (historyTracker) {discoveredHistoryElements = discoverWorldEntries(historyTracker)}
            if (frontMemoryTracker) {discoveredFrontMemory = discoverWorldEntries(frontMemoryTracker)}
            // Add the appended string to context
            if (discoveredHistoryElements || discoveredFrontMemory)
            {
                let holdDiscoveredWorldEntries = [] // Unshift the elements after sorting here to stay within character recommendations

                discoveredHistoryElements = discoveredHistoryElements.sort(function(a, b){return b[0]-a[0]}); // Sort it based on the keywordIndex value
                discoveredHistoryElements.forEach(element => {if ((holdDiscoveredWorldEntries.join(',').length + element[1].length) < 1000 && element[2] == false) {holdDiscoveredWorldEntries.unshift(element[1])}})

                let holdDiscoveredFrontMemory = [] // Duplicate code handling entries tagged as frontMemory
                discoveredFrontMemory = discoveredFrontMemory.sort(function(a, b){return b[0]-a[0]}); // Sort it based on the keywordIndex value
                discoveredFrontMemory.forEach(element => {if ((holdDiscoveredFrontMemory.join(',').length + element[1].length) < 1000 && element[2]) {holdDiscoveredFrontMemory.unshift(element[1])}})


                const contextString = holdDiscoveredWorldEntries.join(',');
                const frontMemoryString = holdDiscoveredFrontMemory.join(',');

                state.memory["context"] = memory.split(0, 1000) + contextString; // Attach the discovered worldEntries to the context
                state.memory["frontMemory"] = frontMemoryString;
            }

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
