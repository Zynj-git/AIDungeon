// Formating my computer so just uploading this output modifier to git.
// Purpose of the script:
// Find the 'names' of 'characters' and apply frontMemory instructions on a turn-based interval that applies to said characters.
// 'getForm(word)' can be a somewhat useful function for interpolating singular to plural forms e.g by feeding it ${getForm('him')} would return 'them' if it's in plural mode.

const modifier = (text) => {

    let modifiedText = text;
    if (text.endsWith('"')) {modifiedText = ` ${modifiedText}`} // Some hacky-code to close more dialogue
    const textLines = text.split('\n')
    const lastLine = textLines[textLines.length - 1]
    if (lastLine && lastLine.startsWith('"') && lastLine.lastIndexOf('"') == 0 && !/^".+?"$/gm.test(lastLine)) {modifiedText += '" '}

    const newInstructionInterval = 4;
    const playerName = 'John'
    state.detectedTargets = [];
    const getHistoryText = (turns) => { return history.slice(turns).flatMap(elem => elem["text"]).join() } // Fetches the textc ontained in the specified amount of most recent turns as a string.
    const getNamesFromWorldEntries = () => //Collects a list of the keys associated with the world entry of a character.
    {
        let arrayOfNames = [];
        if (worldEntries)
        { worldEntries.forEach(wEntry => { if (wEntry["keys"][0].match(/[A-Z]/)) {arrayOfNames.push(wEntry["keys"].split(','))} }) }
        return arrayOfNames
    }

    const validCharacter = getNamesFromWorldEntries(); // Scan the worldEntries for entries beginning with uppercase and assume it's a name

    const detectTargets = () => // Checks the latest history for the presence
    {
        let count = 0;
        const historyTracker = getHistoryText(-5); // Check the last two pairs for words.
        validCharacter.forEach(character =>
            {
                if (character.some(keys => historyTracker.toLowerCase().includes(keys.toLowerCase().trim())))
                {
                    count++ // increase the count since we found a valid character.
                    state.detectedTargets.push(character[0]) // Push the first valid key since that's it's primary identifier.
                }
            })
        return count;
    }
    const targetCount = detectTargets();
    const getForm = (word) =>
    {
        const conversions = {
            'my': 'our',
            'myself': 'ourselves',
            'I': 'we',
            "I'm": "we're",
            'me': 'us',
            'she': 'they',
            'herself': 'themselves',
            'her': 'their',
            'is': 'are',
            'his': 'their',
            'him': 'them',
            'you': 'they',
            'himself': 'themselves',
            'yourself': 'themselves'
        }
        if (targetCount > 1) { return conversions[word] }
        return word
    }
    const formatNewInstruction = () =>
    {
        state.newInstruction.forEach(instruction =>
        {
            let stringToFormat = instruction.split(' ');
            stringToFormat.forEach(word =>
            {
                const findWords = ['me', 'my', 'myself', 'I', "I'm", 'she', 'her', 'herself']
                if (findWords.includes(word))
                {
                    stringToFormat[stringToFormat.indexOf(word)].replace(word, `${getForm(word)}`);
                    state.newInstruction[state.newInstruction.indexOf(instruction)] = stringToFormat.join(' ');
                }
            })
        })
    }

    if (!state.setup || history.length == 1)
    {
        state.setup = true;
        state.instruction = "";

    }

    state.newInstruction = [
    ]

    const getEntriesByKey = (keyword) =>
    {
        let matchedEntries = []
        worldEntries.forEach(elem => {if (elem["keys"].includes(keyword)) {matchedEntries.push(elem["entry"])}})
        return matchedEntries
    } // Fetches the textc ontained in the specified amount of most recent turns as a string.


    const getTargetNames = (characters) =>
    {
        if (characters.length == 1) {return `${characters[0]}`;}
        else if (characters.length == 2) {return `${characters[0]} and ${characters[1]}`}
        else if (characters.length > 2) {return `${characters.splice(0, characters.length - 1).join(", ")}, and ${characters.splice(-1)}`}
        else {return null;}

    }
    const getNewInstruction = () => { return state.newInstruction[Math.floor(Math.random() * state.newInstruction.length)]}

    const targetNames = getTargetNames(state.detectedTargets);
    let characterEntries = [];
    state.detectedTargets.forEach(target => characterEntries.push(getEntriesByKey(target)))


    if (!state.instruction || history.length % newInstructionInterval == 0) {state.instruction = getNewInstruction()}


    if (targetNames && history.length >= 1)
    {
        if (history.length % newInstructionInterval == 0 || !state.instruction)
        {
            if (state.memory.context) {delete state.memory.context;}
            state.memory["frontMemory"] = `:\n`;
            //modifiedText += '\n' // Ensure it starts on an independent, new line.
            state.message = `Characters: ${JSON.stringify(validCharacter)}\nTarget Count: ${targetCount}\nTargets: ${targetNames}\nMemory: ${JSON.stringify(state.memory)}`

        }

        else if (history.length % newInstructionInterval === 1 && state.instruction)
        {
            //if (state.memory.frontMemory) {delete state.memory.frontMemory;}
            state.memory["frontMemory"] = `:\n`
            state.message = `Characters: ${JSON.stringify(validCharacter)}\nTarget Count: ${targetCount}\nTargets: ${targetNames}\nMemory: ${JSON.stringify(state.memory)}`

        }

        else if (history.length % newInstructionInterval === 2 && state.instruction)
        {
            state.memory["frontMemory"] = `:\n`
            state.message = `Characters: ${JSON.stringify(validCharacter)}\nTarget Count: ${targetCount}\nTargets: ${targetNames}\nMemory: ${JSON.stringify(state.memory)}`
        }
        else if (history.length % newInstructionInterval === 3 && state.instruction) {delete state.memory.context; delete state.memory.frontMemory; delete state.message;}
    }

    else {delete state.memory.context; delete state.memory.frontMemory; state.message = "No targets.";}
    return {text: modifiedText}
}

// Don't modify this part
modifier(text)
