// Holds background function and processing that shouldn't be utilized in your scripts, but does affect how they are treated.
// e.g the various input types has various pre-processing that you should be aware of, but it's not particularily important for testing purposes
// other than to determine the 'type' key in history.
import fs from 'fs'
import {worldEntries, state, history, memory} from './interface.mjs'

const prefix = '/' // This is the command prefix used for written commands in AI Dungeon.
export const processInput = () => {const parameters = process.argv.slice(2); let type, text; if (parameters.length > 1) {type = parameters[0].slice(prefix.length); text = parameters[1]} else {type = 'continue'; text = parameters[0]} return {"text": text, "type": type}}
export const updateHistory = (input) => history.push(input)
export const updateState = () => {const formatData = {"state": {"memory":{"context": state.memory.context,"frontMemory": state.memory.frontMemory,"authorsNote": state.memory.authorsNote}},"memory": memory,"worldEntries": worldEntries,"history": history}; fs.writeFile("persistentData.json", JSON.stringify(formatData, null, 2), (err) => {if (err) {console.error(err);return;};console.log("State Updated in persistentData.json");});}
//const getForm = (word) => {const conversions = {'I': 'you','me': 'you','myself': 'yourself','mine': 'yours','my': 'your',}; if (conversions.hasOwnProperty(word)) {return conversions[word]} return word}
