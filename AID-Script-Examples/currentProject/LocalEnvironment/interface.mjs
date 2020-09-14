import fs from 'fs' 
const persistentData = JSON.parse(fs.readFileSync('persistentData.json')) // Read data
import { processInput, updateHistory, updateState, clearState} from './dependencies/background.mjs' // Ignore
import { updateWorldEntry, addWorldEntry, removeWorldEntry} from './nativeFunctions.mjs' // Import native functions.
export let {worldEntries, state} = persistentData // Give native functions access.
export const {history, memory} = persistentData
const input = processInput(); const text = input["text"];
// Don't include the above import/exports in your scripts.





const modifier = (text) =>
{
    let modifiedText = text;
    return {text: modifiedText}
}
modifier(text)
















// Do not include the below section in your scripts.
updateHistory(input); // Logs the input/text into history.
updateState(); // Persistent storage for your changes.
//clearState(); // Creates a clean-slate of the data/state.