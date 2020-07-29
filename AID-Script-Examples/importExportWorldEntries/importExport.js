// Input modifier script to import / export world entries
// Adds the entries in the JSON stringifed version of worldEntries into the current adventure / story instance's worldEntries; updates existing entries based on primary (zeroeth) keyword.
// Utilized in the worldEntryManager
const modifier = (text) => {

    let modifiedText = text
    state.message = ""; // This clears the wall of text upon the player's next input.
    let messageString = "";
    if (modifiedText.includes("exportEntries")) {messageString += JSON.stringify(worldEntries)} // Input exportEntries to be provided a message to put in your clipboard.
    if (modifiedText.includes("[{")) // Handle the importing of the exportEntries string
    {
        entriesToImport = JSON.parse(modifiedText);

        entriesToImport.forEach(iEntry =>
        {
            // Create a segment for updating / overriding existing primary keys
            const iEntryKeys = iEntry["keys"].split(','); // We extract the keys into an array and compare the first element (primary key)
            let skipEntry = false; // If this is switched to true then don't attempt to add the entry
            worldEntries.forEach(wEntry => // We are not worried about execution time, so doing an unecessary loop is okay.
            {
                const wEntryKeys = wEntry["keys"].split(',');
                if (iEntryKeys[0] === wEntryKeys[0])
                {
                    updateWorldEntry(worldEntries.indexOf(wEntry), iEntry["keys"], iEntry["entry"]);
                    messageString += `Updated World Entry: ${iEntry["entry"]}\nKeywords: ${iEntry["keys"]}\n|There are ${worldEntries.length} entries.|\n\n`;
                    skipEntry = true;
                }
            })
            if (!skipEntry) // It did not already find the entry in worldEntries, so we add instead of updating.
            {
                addWorldEntry(iEntry["keys"], iEntry["entry"]);
                messageString += `New World Entry: ${iEntry["entry"]}\nKeywords: ${iEntry["keys"]}\n|There are ${worldEntries.length} entries.|\n\n`;
            }
        })
    }

    state.message = `${messageString}`
    return {text: modifiedText}
}

// Don't modify this part
modifier(text)
