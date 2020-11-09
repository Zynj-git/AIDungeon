state.data = {} // Rebuild data from World Information, relatively intensive in comparison to persistent storage, but easier to manage.
console.log(`Turn: ${info.actionCount}`)
const dataStorage = state.data;
// Traverse the keys until we reach the destination, if a key on the path is assigned a value, convert it to an empty object to not interrupt the pathing.
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty('synonyms') ? dataStorage[root]["synonyms"].split(',').map(element => element.toLowerCase().trim()) : []
// Whitelisted properties defined in an entry keyworded 'whitelist' will always display above the last mention of root.
const getWhitelist = () => worldEntries.filter(entry => entry["keys"].includes('whitelist'))[0]["entry"].split(',').map(element => element.trim())
// Contextual properties will be added to the JSON when a related synonym.property entry is found in the last turn. e.g synonym.cake would bring john.preferences.food.favorite.cake into the JSON for that turn.
// It adds the property path, omitting 'synonyms', to the whitelist so each of ['preferences', 'food', 'favorite', 'cake'] would be whitelisted. john.preferences.food.favorite.hotdog would for example not show as 'hotdog' is not whitelisted.
const getContextualProperties = (search) => { return worldEntries.filter(entry => entry["keys"].includes('synonyms.') && entry["entry"].split(',').some(key => search.includes(key.toLowerCase()))).map(element => element["keys"].toLowerCase().split('.').slice(1)); }
// Assign the property defined in the wEntry's keys with its entry value.
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.').slice(0, -1).join('.'); getKey(path, obj)[property] = value ? value : null } // value.includes(',') ? value.split(',').map(element => element.trim()) :  value
// If the worldEntries are setup to use the system then process and populate dataStorage
if (worldEntries.some(element => element["keys"].includes('.'))) {worldEntries.forEach(wEntry => { if (wEntry["keys"].includes('.')) { setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage) } })}
