// This is a stripped down, probably not functional version of the worldEntry Manager to better highlight how the encapsulation is processed
const modifier = (text) => {

    let messageString = "";
    let modifiedText = text;
    if (!state.initialized) { // Initialize constant values
            state.initialized = true;
            console.log("Successfully Initialized");
        }
    while (modifiedText.includes("[/]")) // Check if the syntax is in place. [/] Primary Keyword [|]Entry Description[/] <-- is how the syntax should look. [|] takes optional modifiers such as #, ? and !.
    {
        const openIndex = modifiedText.indexOf("[/]") // Keep track of when a syntax opens and when it closes, allowing for multiple entries in one prompt
        const closeIndex = modifiedText.indexOf("[/]", openIndex + 1);
        let incorrectFormat = false; // Store a variable to notify of an unclosed pairing and prevent it from being processed.
        if (closeIndex < 0) {incorrectFormat = true;} //
        if (incorrectFormat)
        {
            messageString += state.formatErrorMessage + text;
            state.blockOutput = true;
            modifiedText = ""; // Clear the input, player's can copy paste from the above message.
            break; // Break out of the while loop as soon as invalid format is detected (it should do this automatically since the text is emptied)
        }
        const focusText = modifiedText.slice(openIndex, closeIndex + 3); // Hold the beginning and end of the syntax, we later remove it as to not be passed to the AI nor displayed
        modifiedText = modifiedText.replace(focusText, ""); // For each loop remove the first [/] pair.
    }

    // You must return an object with the text property defined.
    return {text: modifiedText}

}

// Don't modify this part
modifier(text)
