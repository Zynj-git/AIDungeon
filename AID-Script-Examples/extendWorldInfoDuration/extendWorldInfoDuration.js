// This is an output modifier by Zynj :)
// Checks the history for the presence of world entries' keywords and add the relevant ones into context for X amount of turns.
if (!state.setup) {
    state.setup = true;
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


state.functions = {

    injectContext:
        () => {
            // Hold a string of the latest history elements.
            let discoveredElements = []; // Holds pairs of the index it was last discovered at plus the corresponding entry text. [index, entry]
            let historyTracker = ``;
            let newFrontMemory = ``;
            // Check the last X amount of entries in the history
            history.slice(-2).forEach(hStory => historyTracker += `\n${hStory["text"]}`);
            if (historyTracker)
            {
                // Loop through all world entries to check if their keyword is mentioned in history
                worldEntries.forEach(wEntry =>
                {
                    // Split the keywords of the entry into an array we can loop through (max 50 characters)
                    const keyWords = wEntry["keys"].split(',');
                    let keywordIndex = -1; // Keeps track of the last mention of the keyword as to order them by relevancy
                    // Returns true as soon as a match is found.
                    if (keyWords.some(word =>
                        {
                            const regEx = new RegExp(`\\b${word}\\b`,"gi"); // Wholeword, case- insensitve RegEx match.
                            const lastMentionIndex = historyTracker.regexLastIndexOf(regEx)
                            if (lastMentionIndex > keywordIndex) {keywordIndex = lastMentionIndex; return true} // Find the highest value of any of the matching keywords
                            //if (regEx.test(historyTracker)) { keywordIndex = historyTracker.regexLastIndexOf(regEx); return true}
                        }))
                    { // This block belongs to the above if statement

                        if (!discoveredElements.some(element => element.includes(`\n${wEntry["entry"]}`))) // It's the first time the element is discovered, push it to the discoveredElements array.
                        {
                            discoveredElements.push([keywordIndex, `\n${wEntry["entry"]}`]); // We're interested in the keywordIndex for sorting purposes
                        }
                        else // Find and update the keywordIndex of the element. if it already exists then update the keywordIndex of the element. This if / else statement is probably not the best approach
                        {
                            discoveredElements.forEach(element => {if (element.includes(`\n${wEntry["entry"]}`)) {element[0] = keywordIndex}})
                        }
                    }
                })
            }
            // Add the appended string to context
            if (discoveredElements)
            {
                let tempArray = [] // Unshift the elements after sorting here to stay within character recommendations
                discoveredElements = discoveredElements.sort(function(a, b){return b[0]-a[0]}); // Sort it based on the keywordIndex value then flatmap the elements of the pairs (entry text)
                discoveredElements.forEach(element => {if ((tempArray.join(',').length + element[1].length) < 1000) {tempArray.unshift(element[1])}})

                const contextString = tempArray.join(',');
                state.memory = {context: memory.split(0, 1000) + contextString}; // Attach the discovered worldEntries to the context
            }

        },
    };

const { injectContext } = state.functions // Shortcuts
const modifier = (text) => {
    let modifiedText = text;

    // After each output check if the history contains keywords for entries and prolong their lifetime,
    // as brought up there's no need to check input because that's the default functionality of AID
    if (worldEntries) {injectContext();}


    // Debug to check that it's working.
    state.message = JSON.stringify(state.memory);
    return {text};
}
modifier(text);
