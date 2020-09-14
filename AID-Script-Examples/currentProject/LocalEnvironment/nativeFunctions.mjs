// This is a file with functions that imitate the behavior of the native scripting functionalities behind AI Dungeon.
// While they might not be 100% accurate to what's happening in the background, the results should be valuable enough to use them for local testing.
// Please let me know if you have tips on improvements or functionality that contradicts the native functionality.

import {worldEntries, state} from './interface.mjs'
export const addWorldEntry = (keys, entry) => worldEntries.push({"keys": keys, "entry": entry})
export const updateWorldEntry = (index, keys, entry) => worldEntries[index] = {"keys": keys, "entry": entry}
export const removeWorldEntry = (index) => worldEntries.splice(index, 1)