// Handles the user input to delete or save the auto-generated world information.
// When it prompts for selection, feed it an input consisting of the number or numbers assigned to the entry you wish to delete.
// You should be able to e.g do 1 3 5 to delete those in one go, but that might not be working as intended right now; difficult to debug this.

const modifier = (text) =>
{
    if (!state.setup)
    {
        state.setup = true;
        state.blockOutput = false; // Switches to true to signal that the ouput should be emptied. We also do not display the input.
        state.copyWorldEntries = worldEntries; // Store a copy of the worldEntries for comparison.
        state.manageEntries = [] // Store the deletable entries and its corresponding numerical value that's used for the user's input to signal deletion.
    }

    if (state.manageEntries && /[0-9]+ ?/gi.test(text)) // Only process this type of input if there are entries to manage and input begins with a valid number.
    {
        const searchText = text.replace('\n', '');
        const deleteEntries = searchText.split(' ').sort() // Expected format is '1 2 3', sort it in ascending order to permit free-form order.
        deleteEntries.forEach(entry => // Match the inputs against state.manageEntries to find the real index of the associated worldEntry in worldEntries, then delete it.
            {
                const value = (entry - 1) // Correct the value to match the index of array.
                state.message += `Deleting Entry: [${worldEntries[state.manageEntries[value]]["keys"]}] [${worldEntries[state.manageEntries[value]]["entry"]}]`
                if (value >= 0) {removeWorldEntry(state.manageEntries[value])} // Check manageEntries for the index of the entry to delete, then delete it.
            })
        
        state.manageEntries = []; // Empty it to prevent processing when providing inputs.
        state.blockOutput = true; // Signal that the output should be blocked.
        return {text: ""}; // Return an empty input.
    }
    return {text}
}
modifier(text)