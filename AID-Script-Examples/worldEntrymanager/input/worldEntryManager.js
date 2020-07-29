// Allows the player to utilize initial prompts for setting up secret world info based on scenario options.
// ALlows the player to read current entries, edit, updated and add new ones through a primitive syntax and corresponding modifiers.
// Utilizes the import / export script to allow the player to transfer their current world entries into new playthroughs.
// Allows the player to force `state.memory.context`

const modifier = (text) => {


    state.nextOutput = "";
    state.nextContextOutput = "";

    let messageString = "";
    let modifiedText = text;
    if (!state.initialized) { // Initialize constant values

            state.tutorialDone = false;
            state.initialized = true;
            state.blockOutput = false; // While set to true the AI will not output anything.
            // A list of function words to blackList when generating Keywords
            state.blackList = ['a', 'about', 'above', 'across', 'after', 'afterwards', 'again', 'against', 'all', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'amoungst', 'an', 'and', 'another', 'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'are', 'around', 'as', 'at', 'be', 'became', 'because', 'been', 'before', 'beforehand', 'behind', 'being', 'below', 'beside', 'besides', 'between', 'beyond', 'both', 'but', 'by', 'can', 'cannot', 'could', 'dare', 'despite', 'did', 'do', 'does', 'done', 'down', 'during', 'each', 'eg', 'either', 'else', 'elsewhere', 'enough', 'etc', 'even', 'ever', 'every', 'everyone', 'everything', 'everywhere', 'except', 'few', 'first', 'for', 'former', 'formerly', 'from', 'further', 'furthermore', 'had', 'has', 'have', 'he', 'hence', 'her', 'here', 'hereabouts', 'hereafter', 'hereby', 'herein', 'hereinafter', 'heretofore', 'hereunder', 'hereupon', 'herewith', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'however', 'i', 'ie', 'if', 'in', 'indeed', 'inside', 'instead', 'into', 'is', 'it', 'its', 'itself', 'last', 'latter', 'latterly', 'least', 'less', 'lot', 'lots', 'many', 'may', 'me', 'meanwhile', 'might', 'mine', 'more', 'moreover', 'most', 'mostly', 'much', 'must', 'my', 'myself', 'namely', 'near', 'need', 'neither', 'never', 'nevertheless', 'next', 'no', 'nobody', 'none', 'noone', 'nor', 'not', 'nothing', 'now', 'nowhere', 'of', 'off', 'often', 'oftentimes', 'on', 'once', 'one', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'ought', 'our', 'ours', 'ourselves', 'out', 'outside', 'over', 'per', 'perhaps', 'rather', 're', 'same', 'second', 'several', 'shall', 'she', 'should', 'since', 'so', 'some', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhat', 'somewhere', 'still', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'thence', 'there', 'thereabouts', 'thereafter', 'thereby', 'therefore', 'therein', 'thereof', 'thereon', 'thereupon', 'these', 'they', 'third', 'this', 'those', 'though', 'through', 'throughout', 'thru', 'thus', 'to', 'together', 'too', 'top', 'toward', 'towards', 'under', 'until', 'up', 'upon', 'us', 'used', 'very', 'via', 'was', 'we', 'well', 'were', 'what', 'whatever', 'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole', 'whom', 'whose', 'why', 'whyever', 'will', 'with', 'within', 'without', 'would', 'yes', 'yet', 'you', 'your', 'yours', 'yourself', 'yourselves'];

            state.forcedContext = ""; // As long as this holds a string it is used as context.
            state.formatErrorMessage = `Your last input was not formatted properly. Ensure that it is paired with an opening and closing [/]. Your previous input can be copy-pasted here:\n`;
            state.message = "Successfully Initialized";
            console.log("Successfully Initialized");
        }

    if (state.forcedContext) {state.memory = {context: state.forcedContext};} //

    if (modifiedText.includes("exportEntries")) // Provide a string for import
    {
        messageString += JSON.stringify(worldEntries);
        modifiedText = modifiedText.replace("exportEntries", "");
        state.blockOutput = true;
    }

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
        state.blockOutput = true;
        modifiedText = "";
    }


    if (modifiedText.includes("[Syntax Tutorial Complete]") && !(state.tutorialDone)) {state.tutorialDone = true; return {text: modifiedText};} // This is a flag used in my scenario as to not process the syntax while on the tutorial screen

    while (modifiedText.includes("[/]")) // Check if the syntax is in place. [/] Primary Keyword [|]Entry Description[/] <-- is how the syntax should look. [|] takes optional modifiers such as #, ? and !.
    {
        Array.prototype.removeDuplicate = () =>    // Function to remove duplicate words in the keywords
        {
            let result = [];
            this.forEach(word => {if (result.indexOf(word) == -1) {result.push(word);}})
            return result;
        }

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
        //const entryModifiersText = modifiedText.slice(openIndex + openIndex, closeIndex - closeIndex); // Fetch the modifier symbols used.

        const openModifierIndex = modifiedText.indexOf("[", openIndex + 1);
        const closeModifierIndex = modifiedText.indexOf("]", openModifierIndex);
        const syntaxModifier = modifiedText.slice(openModifierIndex, closeModifierIndex + 1); // Detect any modifiers in the syntax e.g # or ?

        const entryText = modifiedText.slice(closeModifierIndex + 1, closeIndex).trim(); // Format the description to be suitable as entry.
        const entryKey = modifiedText.slice(openIndex + 3, openModifierIndex).trim(); // Fetch the primary keyword for the entry. e.g "City Hall" we will populate it with more keywords through the generateWorldEntriesKeywords

        //messageString += openModifierIndex + ' ' + closeModifierIndex
        if (openModifierIndex === closeIndex || closeModifierIndex === closeIndex + 2)
        {
            messageString += `No modifier block detected. Place [] after your keyword as to seperate it from the description.\nOptional modifiers go inside the [] block. e.g [/][?][/]\n${text}`;
            state.blockOutput = true;
            modifiedText = ""; // Clear the input, player's can copy paste from the above message.
            break; // Break out of the while loop as soon as invalid format is detected (it should do this automatically since the text is emptied)
        }


        if (entryText.length > 500)
        {
            entryTextOverlow = entryText.length - 500; // Let them know how many characters they are exceeding it by.
            messageString += `NOTICE!\nYour entry exceeds the recommended character limit of 500 by ${entryTextOverlow} characters!\nThis may lead to unexpected behavior.\nThis is the entry which prompted this message:\n\n${focusText}\n`;
        }

        let addNewEntry = true; // Set a flag that if not changed to false will add a new world entry


        let extendEntry = false; // Set a flag to extend / append to the entry instead of overwriting it.
        if (syntaxModifier.includes("+")) {extendEntry = true;}

        let generateKeyWords = false; // Set a flag to determine whether we should generate additional keywords or not.
        if (syntaxModifier.includes("#")) {generateKeyWords = true;} // Flag it to generate keywords

        let readWorldEntries = false; // Set a flag allowing you to see all the world entries so far.
        if (syntaxModifier.includes("?")) {readWorldEntries = true;}

        if (syntaxModifier.includes("!")) {state.blockOutput = true;}// Set a flag to block the output in case we don't intend to continue or aren't feeding non- syntax encapsuled information along with the prompt

        let editSentence = false; // Set a flag allowing to rewrite a singular sentence in the entry.
        let sentenceToEdit = 0;
        if (/[0-9]/.test(syntaxModifier)) {editSentence = true; sentenceToEdit = syntaxModifier.match(/\d+/g);}

        let keyWords = generateKeyWords ? `${entryKey.trim()},` : `${entryKey.trim()}`; // Store a string for the keyword which generated keywords can be appended to.


        if (!entryKey && syntaxModifier.length === 2) // A mode to toggle a forced context.
        {
            state.forcedContext = entryText;

            if (entryText) {messageString += `Forced Context Enabled\n ${entryText}\n\nForced Context Stays Enabled Until [/][][/] Disables It\n`;}
            else {messageString += `Forced Context Disabled`}

        }


        if (entryKey || readWorldEntries) // No need to process the loop if we are doing nothing with it. Kind of a pointless check, but whatever.
        {
            if (generateKeyWords && entryKey)
            {
                const filterText = entryText.replace(/[^a-zA-Z ']/g, "");
                let generateWorldEntriesKeywords = filterText.replace(/[^a-zA-Z ']/g, " ").split(' ').removeDuplicate().filter(x => !(state.blackList.includes(x.toLowerCase())));// Filter out function words and duplicates then use the remainding words as keywords for world entry
                keyWords += generateWorldEntriesKeywords.join(',').trim(); // Convert the list of keywords into a comma separated string. Make sure the first key is the original "object"
            }


            for (let i=0; i < worldEntries.length; i++)
            {
                if (readWorldEntries)
                {
                    if (entryKey && worldEntries[i]["keys"].startsWith(`${entryKey}`)) // If an entryKey is passed along with ? we just lookup that specific entry.
                    {

                        messageString += `\nKeys: ${worldEntries[i]["keys"]}\nEntry: ${worldEntries[i]["entry"]}\n`;

                    }
                    else if (!entryKey) {messageString += `\nKeys: ${worldEntries[i]["keys"]}\nEntry: ${worldEntries[i]["entry"]}\n`;}

                }
                if (worldEntries[i]["keys"].startsWith(`${entryKey}`)) // Check if the first key is the object we are editing the entry for.
                {
                    addNewEntry = false; // Tell the script to not allow a new entry if a match is found.
                    if (entryText && extendEntry) // Extend the entry instead of replacing it.
                    {
                        generateKeyWords ? updateWorldEntry(i, keyWords, worldEntries[i]["entry"] += `\n${entryText}`) : updateWorldEntry(i, worldEntries[i]["keys"], worldEntries[i]["entry"] += `\n${entryText}`); // If we are generating new keywords update them, if not then use the existing ones.
                        messageString += `\nUpdated World Entry: ${worldEntries[i]["entry"]}\nNew Keywords: ${generateKeyWords ? keyWords : worldEntries[i]["keys"]}\n|There are ${worldEntries.length} entries|\n\n`;
                        break; // Break off as soon as we got our match.
                    }

                    else if (entryText && editSentence)
                    {
                        let splitEntry = worldEntries[i]["entry"].split('.');
                        messageString += `\nUpdated Line ${sentenceToEdit}: ${splitEntry[sentenceToEdit]}\n=\n${entryText}\n`;
                        updatedInput = entryText.substring(0, entryText.lastIndexOf('.')).trim(); // Since we are joining the sentences with a '.' we get rid of the last one in the updated entry.
                        splitEntry[sentenceToEdit] = ' ' + updatedInput;
                        worldEntries[i]["entry"] = splitEntry.join('.');
                    }
                    else if (entryText) // Replace the entry with the updated Description
                    {
                        updateWorldEntry(i, keyWords, `${entryText}`);
                        messageString += `\nUpdated World Entry: ${worldEntries[i]["entry"]}\nNew Keywords: ${keyWords}\n|There are ${worldEntries.length} entries|\n\n`;
                        break; // Break off as soon as we got our match.
                    }
                    else if (!readWorldEntries) // If we are not updating, reading or appending it means we want it to be empty.
                    {
                        removeWorldEntry([i]);
                        messageString += `\nRemoved World Entry for Primary Keyword: ${keyWords}\n|There are ${worldEntries.length} entries|\n\n`;
                    }




                }
            }


            if (entryKey && addNewEntry) // If the entry does not exist we add a new one, do not add non-keyworded entries.
            {
                addWorldEntry(keyWords, `${entryText}`); //Add the world entry by using the generated keys and the rule itself as description
                messageString += `\nNew World Entry: ${entryText}\nKeywords: ${keyWords}\n|There are ${worldEntries.length} entries.|\n\n`;
            }
        }



        modifiedText = modifiedText.replace(focusText, ""); // For each loop remove the first [/] pair.
    }

    state.message = messageString;

    // You must return an object with the text property defined.
    return {text: modifiedText}

}

// Don't modify this part
modifier(text)
