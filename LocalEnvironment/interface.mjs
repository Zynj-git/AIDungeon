// Ignore this section and don't include it in your actual scripts. It's just here to emulate the native functionality of AI Dungeon's scripting.
import fs from 'fs' // This is required for writing back into the file on the end of the turn.
const persistentData = JSON.parse(fs.readFileSync('persistentData.json')) // Stored in a JSON file that's written to on the end of script execution after temporary changes have been made.
import { updateWorldEntry, addWorldEntry } from './nativeFunctions.mjs' // Defined as const values in nativeFunctions.mjs
export let {worldEntries, state} = persistentData // Reassignable
const {history, memory} = persistentData // None reassignable
const updateState = () => {const formatData = {"state": {"memory":{"context": state.memory.context,"frontMemory": state.memory.frontMemory,"authorsNote": state.memory.authorsNote}},"memory": memory,"worldEntries": worldEntries,"history": history}; fs.writeFile("persistentData.json", JSON.stringify(formatData, null, 2), (err) => {if (err) {console.error(err);return;};console.log("State Updated in persistentData.json");});}
const text = process.argv.slice(2)[0] // Pass a string as the text argument e.g node interface.mjs "Hello World!"
// Don't include the above section in your scripts. It's just here to emulate the native functionality of AI Dungeon's scripting.

const modifier = (text) =>
{

    state.memory.authorsNote = "12391121231231313231"
    addWorldEntry("new, keys", "new entry")
    updateWorldEntry(0, "HellO?", "Can you hear me?")
    
    console.log(text)
    return {text}
}
modifier(text) // Don't change this line.
updateState(); // Remove this line to prevent stored/persistent changes.