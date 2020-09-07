// Handles the user input to delete or save the auto-generated world information.
// When it prompts for selection, feed it an input consisting of the number or numbers assigned to the entry you wish to delete.
// You should be able to e.g do 1 3 5 to delete those in one go, but that might not be working as intended right now; difficult to debug this.

const modifier = (text) =>
{
    if (!state.setup || !state.copyWorldEntries)
    {
        state.setup = true;
        state.blockOutput = false; // Switches to true to signal that the ouput should be emptied. We also do not display the input.
        state.copyWorldEntries = worldEntries.slice(); // Store a copy of the worldEntries for comparison. Ensure that it's a copy and not a direct reference.
        state.manageEntries = [] // Store the deletable entries and its corresponding numerical value that's used for the user's input to signal deletion.
    }

    if (state.manageEntries && /[0-9]+ ?/gi.test(text)) // Only process this type of input if there are entries to manage and input begins with a valid number.
    {
        const indexes = text.split(' ').sort() // Expected format is an unsorted, numerical order '1 2 3', sort it in ascending order to permit free-form order.
        indexes.forEach(index => // Match the inputs against state.manageEntries to find the real index of the associated worldEntry in worldEntries, then delete it.
            {
                const value = (index - 1) // Correct the value to match the index of array.
                if (value >= 0) 
                {
                    // This has been a mess to debug so I'm going to write out the code step-by-step.
                    const entryToIndex = state.manageEntries[value] // Checks the element on the value index which is the provided number - 1 e.g 1 === 0, 2 === 1
                    const indexToRemove = worldEntries.indexOf(entryToIndex) // Check worldEntries for the index of the entry element to index, this should be a positive value since entryToIndex is an exact copy.
                    removeWorldEntry(indexToRemove); // Finally, once the entryToIndex has been found in worldEntries, remove the corresponding index from worldEntries.
                    state.manageEntries.splice(value, 1); // The last step is to manipulate state.manageEntries to reflect the changes made and allow the output modifier to re-assign numbers that correspond with the correct indexes.
                     // NOTE: The above splicing handles itself incorrectly since I don't account for the adjusted order of the array!
                } 
            })
        state.blockOutput = true; // Signal that the output should be blocked.
        return {text: ""}; // Return an empty input and prevent the code from processing what's below.
    }

    
    if (state.blockOutput) {state.copyWorldEntries = worldEntries.slice(); state.blockOutput = false;} // Only refresh the comparison after we release ourselves from the above block. This happens either on invalid input or once state.manageEntries is emptied.
    return {text}
}
modifier(text)