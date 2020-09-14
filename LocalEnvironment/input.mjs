import { config } from './dependencies/config.mjs'
const { updateHistory, processInput, updateState, clearState, getData} = config.backgroundFunctions; config.data = getData()
const { addWorldEntry, removeWorldEntry, updateWorldEntry } = config.nativeFunctions; let {worldEntries, state} = config.data; const {history, memory} = config.data
const input = processInput(); const text = input["text"];
// Ignore the above and do not include it in your AI Dungeon script, it enables the use of native functions and imitates AI Dungeon's behavior.

const modifier = (text) =>
{
    let modifiedText = text;
    return {text: modifiedText}
}
modifier(text)



















// Do not include the below code in your scripts. It handles local persistent storage.
updateState(input) // Stores persistent data in data.json
//clearState() // Clear persistent data in data.json
