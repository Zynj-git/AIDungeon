// This is a file with functions that imitate the behavior of the native scripting functionalities behind AI Dungeon.
// While they might not be 100% accurate to what's happening in the background, the results should be valuable enough to use them for local testing.
// Please let me know if you have tips on improvements or functionality that contradicts the native functionality.
const prefix = '/' // This is the command prefix used for written commands in AI Dungeon.
import {worldEntries, state} from './interface.mjs'
export const addWorldEntry = (keys, entry) => worldEntries.push({"keys": keys, "entry": entry})
export const updateWorldEntry = (index, keys, entry) => worldEntries[index] = {"keys": keys, "entry": entry}

export const processInput = () => // Imitates the input processing on the various input types. e.g /do, /story, /say or a lack thereof.
{
    const parameters = process.argv.slice(2)
    let type, text;
    if (parameters.length > 1) {type = parameters[0].slice(prefix.length); text = parameters[1]} else {type = 'continue'; text = parameters[0]}
    return {"text": text, "type": type}
}