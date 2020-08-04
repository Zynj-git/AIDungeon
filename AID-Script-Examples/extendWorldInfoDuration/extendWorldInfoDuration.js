// This is an output modifier by Zynj :)
// Checks the history for the presence of world entries' keywords and add the relevant ones into context for X amount of turns.
if (!state.setup) {
    state.setup = true;
}

let contextString = "";
state.functions = {

    injectContext:
        () => {
            // Hold a string of the latest history elements.
            let historyTracker = ``;
            let newFrontMemory = ``;
            // Check the last X amount of entries in the history
            history.slice(-5).forEach(hStory => historyTracker += `\n${hStory["text"]}`);
            if (historyTracker)
            {
                // Loop through all world entries to check if their keyword is mentioned in history
                worldEntries.forEach(wEntry =>
                {
                    // Split the keywords of the entry into an array we can loop through (max 50 characters)
                    const keyWords = wEntry["keys"].split(',');
                    // Returns true as soon as a match is found.
                    if (keyWords.some(word => new RegExp(`\\b${word}\\b`,"gi").test(historyTracker)))
                    {

                        if (!contextString.includes(`${wEntry["entry"]}`) && (contextString.length + wEntry["entry"].length) <= 1000) // Check for duplicate entries and limit the length as to not cause memory errors
                        {
                            contextString += `\n${wEntry["entry"]}`;
                            //newFrontMemory = `\n${wEntry["entry"]}\n`; // Testing to see if using only one entry as frontMemory at the time functions better (seems to be irrelevant)
                        }
                    }
                })
            }
            // Add the appended string to context
            if (contextString)
            {
                state.memory = {context: memory + contextString}; // frontMemory: newFrontMemory // Set the context to not override user memory and frontMemory to the latest discovered worldEntry
            }

        },
    };

const { injectContext } = state.functions // Shortcuts
const modifier = (text) => {
    let modifiedText = text;

    // After each output check if the history contains keywords for entries and prolong their lifetime,
    // as brought up there's no need to check input because that's the default functionality of AID
    injectContext();

    // Debug to check that it's working.
    //state.message = JSON.stringify(state.memory);
    return {text};
}
modifier(text);
