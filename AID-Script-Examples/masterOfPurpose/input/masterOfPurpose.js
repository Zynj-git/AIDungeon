// This is a proof of concept of utilizing `state.memory.context` to re-direct player's input into "actions" for "NPCs" to act upon as if it's their own.
// It's area of use is rather vast and once it's no longer full spaghetti code sprinkled with feces then it should be nice to have.
// e.g if you want to assign a quest to one of the "characters" then this will constantly feed into the context that they (from their perspective) want to carry out the quest.
// You could also chunk in pieces of information eventually by separating it into rotating segments that are brought up when appropriate e.g you learn something about someone and it's then appended to the context once in a while.
// Exact specifics of what I'm trying to get out of this isn't determined yet, but if someone wants to take the idea and re-work it for their own purposes then please, by all means do so.
// I can't say that any piece of coded here is done in a reasonable way.

const modifier = (text) => {

    state.message = "";
    if (!state.initialized)
    {
        state.initialized = true;

        state.clearFrontMemory = false;
        state.detectedPronouns = []
        state.targetPronoun = "female"
        state.contextMessage = ""
        state.conversions = {
                "female": [["yourself", "herself"], ["yours", "hers"], ["your", "her"], ["you", "she"]],
                "male": [["yourself", "himself"], ["yours", "him"], ["your", "his"], ["you", "he"]],
                "you": [["mine", "yours"], ["my", "your"], ["me", "you"]]
            }
        state.pronouns = { // Got to find a better way of storing and establishing which state.conversions should be used.
                "female": ["she", "her", "woman", "girl", "lady", "wife", "girlfriend", "female", "sister", "mother", "guardswoman", "queen", "princess", "witch"],
                "male": ["he", "his", "man", "sir", "gentleman", "husband", "boyfriend", "male", "brother", "father", "guardsman", "king", "prince", "wizard"]
                }
        state.purpose = "";
    }
    let modifiedText = text.toLowerCase();
    function convertPronouns(textToConvert) { // With the power of spaghetti we split the text into individual words and check if they are in the list of female / male state.state.pronouns, if they are we assemble them into a list.


        textToConvert = textToConvert.split(" ")// Split the words into an array that we can check individually

        detectedPronouns = [] // Any pronoun from the input is temporarily stored here.
        for (let i = 0; i < textToConvert.length; i++)
        {
            if (state.pronouns["female"].includes(textToConvert[i])) {detectedPronouns.push(textToConvert[i])}
            if (state.pronouns["male"].includes(textToConvert[i])) {detectedPronouns.push(textToConvert[i])}
        }
        textToConvert = textToConvert.join(" ") // Restore it to a string so we can replace content later.

        // In v 1.0 (Overcooked Pasta) we just sample the last pronoun and assume that is the target we are referring to. Might consider finding a way to weight re-occurrences or check for phrasing instead.
        // It then flags the targetPronoun as being either female or male.
        if (state.pronouns["female"].includes(detectedPronouns[detectedPronouns.length - 1])) {state.targetPronoun = "female"}
        if (state.pronouns["male"].includes(detectedPronouns[detectedPronouns.length - 1])) {state.targetPronoun = "male"}


        // Check for exact matches of the words within the state.conversions dictionary and replace them with their corresponding option.
        // The intention is to accurately convert player phrases like "Can you do this for me", "Do you want to do a mission for me?" etc. into a context piece stating "He / She wants to do this for you", "He / She has accepted your mission and He / She intends to kill the dragon for you."
        if (state.targetPronoun === "female")
        {
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["female"][0][0] + "\\b", 'gi'), state.conversions["female"][0][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["female"][1][0] + "\\b", 'gi'), state.conversions["female"][1][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["female"][2][0] + "\\b", 'gi'), state.conversions["female"][2][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["female"][3][0] + "\\b", 'gi'), state.conversions["female"][3][1])
        }

        else if (state.targetPronoun === "male")
        {
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["male"][0][0] + "\\b", 'gi'), state.conversions["male"][0][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["male"][1][0] + "\\b", 'gi'), state.conversions["male"][1][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["male"][2][0] + "\\b", 'gi'), state.conversions["male"][2][1])
            textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["male"][3][0] + "\\b", 'gi'), state.conversions["male"][3][1])
        }

        // Instances of "my", "me", "mine" always get converted.
        textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["you"][0][0] + "\\b", 'gi'), state.conversions["you"][0][1])
        textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["you"][1][0] + "\\b", 'gi'), state.conversions["you"][1][1])
        textToConvert = textToConvert.replace(new RegExp("\\b" + state.conversions["you"][2][0] + "\\b", 'gi'), state.conversions["you"][2][1])

        state.purpose = textToConvert;
        return textToConvert
    }


    const triggerPhrase = "your purpose is to"

    if (modifiedText.includes(triggerPhrase)) { // Phrase to not have it trigger all the time, can expand with multiple phrases / phrasings, especially on the output part.


        convertPronouns(modifiedText);

        // We cut out non-essential parts of the direct speech and convert the state.pronouns for that before attaching it to the context in its converted form.
        let firstOption = modifiedText.slice(modifiedText.indexOf(triggerPhrase) + triggerPhrase.length, modifiedText.lastIndexOf('"') - 1);
        //if (firstOption.includes('be ')) {firstOption = firstOption.replace('be ', '');}
        //const beingBe = ["being", "be"];
        // We put the converted input into the context in a way that has the AI presume that the actions and intentions are of their own volition.
        // A proper phrasing is required, but anything that re-instates that they really do in fact want to carry out this task as their primary goal seems to work well.
        // Also phrases in present tense as to have it seem that it is something they are currently considering.
        // Using words that the AI usually throws at me when someone is described as being "obsessed", "intent", "focused" about something and you end up in those situations that it's difficult to pull it away from wanting to continue with whatever they're doing regardless of the circumstances.
        convertPronouns(firstOption);
        state.contextMessage = `\n${state.conversions[state.targetPronoun][3][1]} is inexplicably pursuing ${state.conversions[state.targetPronoun][2][1]} purpose;${state.purpose}`;
        state.memory = {frontMemory: state.contextMessage}
        state.clearFrontMemory = true;

    }

    if (modifiedText.includes("/purpose")) // Test a refresh command
    {
        if (state.contextMessage)
        {
            state.memory = {context: memory + state.contextMessage, frontMemory: state.contextMessage}
            state.clearFrontMemory = true;
            return '';
        }
    }
    if (state.contextMessage) {state.memory = {context: memory + state.contextMessage};}
    state.message = JSON.stringify(state.memory); // Display the current context for debug purposes to check that it's somewhat working as intended.
    return {text}
}



modifier(text)
