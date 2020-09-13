// Execute the script through the command line, the first argument becomes 'text' use /do, /say and /story before your string to assign the type.
// e.g node interface.mjs "Hello World!"
// 'text' then becomes "Hello World!"
// If you intend to repeatedly test the same string, then just replace the const text declaration.
// Native functions are found in nativeFunctions.mjs

// Ignore this section and don't include it in your actual scripts. It's just here to emulate the native functionality of AI Dungeon's scripting.
import fs from 'fs' // This is required for writing back into the file on the end of the turn.
const persistentData = JSON.parse(fs.readFileSync('persistentData.json')) // Stored in a JSON file that's written to on the end of script execution after temporary changes have been made.
// Import background functionalities for local testing. None of these are relevant for your actual scripts.
import { processInput, updateHistory, updateState} from './background.mjs' // Imports functions used for pre-processing the input to e.g determine its type in history.
const input = processInput(); const text = input["text"]; // Create the 'text' object, it's later passed to history after processing.
// Import the 'native' (emulated) functions of AI Dungeon, these can all be used in the same manner within AI Dungeon itself.
import { updateWorldEntry, addWorldEntry, removeWorldEntry} from './nativeFunctions.mjs'
// This imports the persistent values as an emulation of 'state'/game follows the same structure as native AI Dungeon. e.g state.memory.authorsNote
export let {worldEntries, state} = persistentData // Reassignable
export const {history, memory} = persistentData // None reassignable
// Don't include the above section in your scripts. It's just here to emulate the native functionality of AI Dungeon's scripting.


const modifier = (text) =>
{

    state.memory.authorsNote = "12391121231231313231"
    addWorldEntry("new, keys", "new entry")
    updateWorldEntry(0, "HellO?", "Can you hear me?")
    console.log()
    return {text}
}
modifier(text) // Don't change this line.



// Do not include the below section in your scripts.
// The below code handles persistence/history updates after each execution.
// Omit this section if you don't wish or need to utilize this functionality.
updateHistory(input); // Adds the text and
updateState(); // Remove this line to prevent stored/persistent changes.