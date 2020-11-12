state.data = {} // Rebuild data from World Information, relatively intensive in comparison to persistent storage, but easier to manage.
let dataStorage = state.data;

if (!state.generate) {state.generate = {}}
if (!state.settings) {state.settings = {}}
// If key (setting[0]) is not in state.settings, initiate it with setting[1] as default value.
const initSettings = [['entriesFromJSON', true], ['filter', false]]
initSettings.forEach(setting => {if (!Object.keys(state.settings).includes(setting[0])) { state.settings[setting[0]] = setting[1] }})

state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
    prefixSymbol: '/',
    whitelistPath: 'whitelist',
    synonymsPath: 'synonyms',
    pathSymbol: '.'
}


console.log(`Turn: ${info.actionCount}`)

let { entriesFromJSON } = state.settings;
const { whitelistPath, synonymsPath, pathSymbol } = state.config;

// Traverse the keys until we reach the destination, if a key on the path is assigned a value, convert it to an empty object to not interrupt the pathing.
//https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
const worldEntriesFromObject = (obj, root) => { function replacerWithPath(replacer) { let m = new Map(); return function(field, value) { let path= m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field); if (value===Object(value)) m.set(value, path); return replacer.call(this, field, value, path.replace(/undefined\.\.?/,'')); } } JSON.stringify(obj, replacerWithPath(function(field, value, path) { if (typeof value != 'object') { let index = worldEntries.findIndex(element => element["keys"] == path); index >= 0 ? updateWorldEntry(index, `${root}.${path}`, value, isNotHidden = true) : addWorldEntry(`${root}.${path}`, value, isNotHidden = true); } return value; })); }

//const sortJSON = (string) => { const order = [getWhitelist(), getContextualProperties(getHistoryString(-4)).flat()].flat(); const regEx = /{|}|"/gi; string = string.split('",').sort((a, b) => order.indexOf(a.replace(regEx, '').trim().split(':')[0]) - order.indexOf(b.replace(regEx, '').trim().split(':')[0])); return string.join('",') }
//const sortObject = (obj) => { const order = getWhitelist(); return Object.keys(obj).sort((a, b) => { order.indexOf(a) - order.indexOf(b) }).reduce((res, key) => (res[key] = obj[key], res), {})};

const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' }
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text }
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty(synonymsPath) ? dataStorage[root][synonymsPath].split(',').map(element => element.toLowerCase().trim()) : []
// Whitelisted properties defined in an entry keyworded 'whitelist' will always display above the last mention of root.
const getWhitelist = () => dataStorage[whitelistPath].split(',').map(element => element.trim())
// Contextual properties will be added to the JSON when a related synonym.property entry is found in the last turn. e.g synonym.cake would bring john.preferences.food.favorite.cake into the JSON for that turn.
// It adds the property path, omitting 'synonyms', to the whitelist so each of ['preferences', 'food', 'favorite', 'cake'] would be whitelisted. john.preferences.food.favorite.hotdog would for example not show as 'hotdog' is not whitelisted.
const getContextualProperties = (search) => { return worldEntries.filter(entry => entry["keys"].startsWith(synonymsPath) && entry["entry"].split(',').some(key => search.includes(key.toLowerCase()))).map(element => element["keys"].toLowerCase().split('.').slice(1)); }
// Assign the property defined in the wEntry's keys with its entry value.
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.')[1] ? keys.split('.').slice(0, -1).join('.') : keys.replace('.', ''); if (property[1]) { getKey(path, obj)[property] = value ? value : null; } else { dataStorage[path] = value; } }
// If the worldEntries are setup to use the system then process and populate dataStorage
if (worldEntries.some(element => element["keys"].includes('.'))) { worldEntries.forEach(wEntry => { if (wEntry["keys"].includes('.')) { setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage) } }) }

state.commandList = {
    set: // Identifier and name of function
    {
        name: 'set',
        description: "Sets or updates a World Entry's keys and entry to the arguments given in addition to directly updating the object.",
        args: true,
        usage: '<root>.<property> <value>',
        execute:
            (args) => {

                const setKeys = args[0].toLowerCase().trim();
                const setValue = args.slice(1).join(' ');
                const index = worldEntries.findIndex(element => element["keys"] === setKeys);

                index >= 0 ? updateWorldEntry(index, setKeys, setValue, isNotHidden = true) : addWorldEntry(setKeys, setValue, isNotHidden = true);

                if (!setValue && index >= 0) { removeWorldEntry(index) }
                if (dataStorage) { setProperty(setKeys, setValue, dataStorage) } // Immediately reflect the changes in state.data
                state.message = `${setKeys} set to ${setValue}`;
            }
    },
    get:
    {
        name: 'get',
        description: "Fetches and displays the properties of an object.",
        args: true,
        usage: '<root> or <root>.<property>',
        execute:
            (args) => {

                if (dataStorage) {
                    const path = args.join('').toLowerCase().trim();
                    const lens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : null, obj);
                    state.message = `Data Sheet for ${path}:\n${JSON.stringify(lens(dataStorage, path), null)}`;
                }

            }

    },
    whitelist:
    {
        name: 'whitelist',
        description: "Toggles the whitelisting of passed argument.",
        args: true,
        usage: '<word>',
        execute:
            (args) => {

                const toWhitelist = args.join(' ').toLowerCase();
                const whitelistIndex = worldEntries.findIndex(element => element["keys"].includes(whitelistPath));
                let whitelist = worldEntries[whitelistIndex]["entry"].split(',').map(element => element.trim().toLowerCase());

                whitelist.includes(toWhitelist) ? whitelist.splice(whitelist.indexOf(toWhitelist), 1) : whitelist.push(toWhitelist);
                updateWorldEntry(whitelistIndex, whitelistPath + pathSymbol, whitelist.join(', '), isNotHidden = true);
                state.message = `Toggled whitelisting for ${toWhitelist}`;

            }

    },
    show:
    {
        name: 'show',
        description: "Shows entries starting with the provided argument in World Information.",
        args: true,
        usage: '<root> or <root>.<property>',
        execute:
            (args) => {

                const path = args.join('').trim().toLowerCase();
                worldEntries.forEach(wEntry => { if (wEntry["keys"].startsWith(path)) { wEntry["isNotHidden"] = true; } })
                state.message = `Showing all entries starting with ${path} in World Information!`;
            }
    },
    hide:
    {
        name: 'hide',
        description: "Hides entries starting with the provided argument in World Information.",
        args: true,
        usage: '<root> or <root>.<property>',
        execute:
            (args) => {

                const path = args.join('').trim().toLowerCase();
                worldEntries.forEach(wEntry => { if (wEntry["keys"].startsWith(path)) { wEntry["isNotHidden"] = false; } })
                state.message = `Hiding all entries starting with ${path} in World Information!`;
            }
    },
    fromJSON:
    {
        name: 'fromJSON',
        description: `Toggles fetching of World Information from JSON Lines: ${state.settings["entriesFromJSON"]}`,
        args: false,
        execute:
            (args) => {
                
                state.settings["entriesFromJSON"] = !state.settings["entriesFromJSON"];
                state.message = `World Information from JSON Lines: ${state.settings["entriesFromJSON"]}`
            }
    },
    filter:
    {
        name: 'filter',
        description: `Toggles the filtering of quotation and curly-brackets within JSON lines: ${state.settings["filter"]}\nSaves character count, but may have detrimental effects.`,
        args: false,
        execute:
            (args) => {
                state.settings["filter"] = !state.settings["filter"];
                state.message = `'"{}' filter set to ${state.settings["filter"]}`
            }
    },
    gen:
    {
        name: 'gen',
        description: `Generates an Object for the passed <root> by bringing examples matching <type> into context.`,
        args: true,
        usage: '<root> <type>',
        execute:
            (args) => {

                state.generate.root = args[0];
                state.generate.type = args.slice(1).join(' ');
                state.generate.process = true;
                state.generate.primer = `{"${ state.generate.type}": "${state.generate.root}",`
                state.stop = false;
                

            }
    }
};

