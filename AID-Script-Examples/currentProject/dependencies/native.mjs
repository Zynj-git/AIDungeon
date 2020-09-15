// This is a file with functions that imitate the behavior of the native scripting functionalities behind AI Dungeon.
// While they might not be 100% accurate to what's happening in the background, the results should be valuable enough to use them for local testing.
// Please let me know if you have tips on improvements or functionality that contradicts the native functionality.
import { config } from './config.mjs';
export function addWorldEntry (keys, entry) {config.data.worldEntries.push({"keys": keys, "entry": entry})}
export function updateWorldEntry (index, keys, entry) {config.data.worldEntries[index] = {"keys": keys, "entry": entry}}
export function removeWorldEntry (index) {config.data.worldEntries.splice(index, 1)}