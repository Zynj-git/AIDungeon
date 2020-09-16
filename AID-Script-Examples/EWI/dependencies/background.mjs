// Holds background function and processing that shouldn't be utilized in your scripts, but does affect how they are treated.
// e.g the various input types has various pre-processing that you should be aware of, but it's not particularily important for testing purposes
// other than to determine the 'type' key in history.
import fs from 'fs'
import { config } from './config.mjs'
export function getData () {return JSON.parse(fs.readFileSync('data.json'))}
export function processInput () { const parameters = process.argv.slice(2); let type, text; if (parameters.length > 1) { type = parameters[0].slice(config.prefix.length); text = parameters[1] } else { type = 'continue'; text = parameters[0] } return { "text": text, "type": type } }
export function updateHistory (input) {config.data.history.push(input)}
export function updateState (input) { updateHistory(input); const formatData = config.data; fs.writeFileSync("data.json", JSON.stringify(formatData, null, 2)); console.log("State Updated in data.json"); }
//const getForm = (word) => {const conversions = {'I': 'you','me': 'you','myself': 'yourself','mine': 'yours','my': 'your',}; if (conversions.hasOwnProperty(word)) {return conversions[word]} return word}
export function clearState () { const formatData = { "state": { "memory": { "context": "", "frontMemory": "", "authorsNote": "" } }, "memory": "", "worldEntries": [], "history": [] }; fs.writeFileSync("data.json", JSON.stringify(formatData, null, 2)); console.log("State Cleared in data.json"); }
function getExecutedFile () {return process.argv[1].slice(process.argv[1].lastIndexOf('\\') + 1)}