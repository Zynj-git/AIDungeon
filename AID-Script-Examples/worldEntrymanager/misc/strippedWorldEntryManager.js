// This is a stripped down, probably not functional version of the worldEntry Manager to better highlight how the encapsulation is processed
const modifier = (text) => {

    let modifiedText = text;
    if (!state.initialized)   // Initialize constant values
        {
            state.initialized = true;
            console.log("Successfully Initialized");
        }
    while (modifiedText.includes("[/]")) // Check if the syntax is in place. [/] Primary Keyword [|]Entry Description[/] <-- is how the syntax should look. [|] takes optional modifiers such as #, ? and !.
    {
        const openIndex = modifiedText.indexOf("[/]") // Keep track of when a syntax opens and when it closes, allowing for multiple entries in one prompt
        const closeIndex = modifiedText.indexOf("[/]", openIndex + 1); // The text inside of plus the encapsulation itself is removed from the input once everything is processed.
        let incorrectFormat = false; // Store a variable to notify of an unclosed pairing and prevent it from being processed.
        if (closeIndex < 0) {incorrectFormat = true;} //
        if (incorrectFormat) {break;}
        const focusText = modifiedText.slice(openIndex, closeIndex + 3); // Hold the beginning and end of the syntax, we later remove it as to not be passed to the AI nor displayed
        modifiedText = modifiedText.replace(focusText, ""); // For each loop remove the first [/] pair.
    }
    // You must return an object with the text property defined.
    return {text: modifiedText}

}

// Don't modify this part
modifier(text)
