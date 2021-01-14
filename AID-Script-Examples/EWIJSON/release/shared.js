// Design Document: https://docs.google.com/document/d/1YGdOtaunrcTlTWG7I9pwgXKxZeEYe3FR8eT96cZ-d28/edit
// TODO: Create AND/OR logic gates for synonym fetching.
// TODO: Create dynamic RegEx searches constructed from the Object root as a requirement and 'other Objects of the same type' as disqualifiers.
//       Note that the order has to be changed completely as at the current point of insertion these processes are already completed (preemtively).
//       Rewriting the 'globalReplacer' to redefine itself by the conditions of each individual Object is a possible solution, would ensure that unique edge-cases are handled.
//       Also allows float and sprawler detection range to function independently of what's in the full context.

// DONE: Dynamic configuration of Objects. Float position and insertion. Sprawler enabler. Reverse logic is reversed to permit interaction with the full extent of context via spliceContext() from anywhere, e.g when and if asynchronus functions become relevant.

if (!state.data) { state.data = {} } //
let dataStorage = state.data;
let contextMemoryLength = 0; // Keep count of additional context added.
if (!state.generate) { state.generate = {} }
if (!state.settings) { state.settings = {} }
// If key (setting[0]) is not in state.settings, initiate it with setting[1] as default value.
const initSettings = [['entriesFromJSON', true], ['filter', false], ['searchTurnsRange', 4], ['parityMode', false]]
initSettings.forEach(setting => { if (!Object.keys(state.settings).includes(setting[0])) { state.settings[setting[0]] = setting[1] } })
const ewiAttribConfig = ['a', 'd', 'm', 'p', 's', 't']


// Config for consistency.
state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
    prefixSymbol: '/',
    whitelistPath: '_whitelist',
    synonymsPath: '_synonyms',
    pathSymbol: '.'
}
if (!state.settings.ewi) { state.settings.ewi = {} }
ewiAttribConfig.forEach(attr => { if (!state.settings.ewi.hasOwnProperty(attr)) { state.settings.ewi[attr] = { "range": 4 } } })
console.log(`Turn: ${info.actionCount}`)
let { entriesFromJSON } = state.settings;
const { whitelistPath, synonymsPath, pathSymbol } = state.config;

// https://www.tutorialspoint.com/group-by-element-in-array-javascript
const groupElementsBy = arr => {
    const hash = Object.create(null),
        result = [];
    arr.forEach(el => {
        const keys = el.keys.slice(0, el.keys.indexOf('#'))
        if (!hash[keys]) {
            hash[keys] = [];
            result.push(hash[keys]);
        };
        hash[keys].push(el);
    });
    return result;
};
//https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
const replacerWithPath = (replacer) => { let m = new Map(); return function (field, value) { let path = m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field); if (value === Object(value)) m.set(value, path); return replacer.call(this, field, value, path.replace(/undefined\.\.?/, '')); } }
const worldEntriesFromObject = (obj, root) => { JSON.stringify(obj, replacerWithPath(function (field, value, path) { if (typeof value != 'object') { const index = worldEntries.findIndex(element => element["keys"] == `${root}.${path}`.replace(/^\.*|\.$/g, '')); index >= 0 ? updateWorldEntry(index, `${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), isNotHidden = true) : addWorldEntry(`${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), isNotHidden = true); } return value; })); }
//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr#273810
String.prototype.regexLastIndexOf = function (regex, startpos) { regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : "")); if (typeof (startpos) == "undefined") { startpos = this.length; } else if (startpos < 0) { startpos = 0; } let stringToWorkWith = this.substring(0, startpos + 1); let lastIndexOf = -1; let nextStop = 0; while ((result = regex.exec(stringToWorkWith)) != null) { lastIndexOf = result.index; regex.lastIndex = ++nextStop; } return lastIndexOf; }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const getAttributes = (keys) => { const attrib = keys.match(/([a-z](=\d+)?)/g); if (attrib) { return attrib.map(attrib => attrib.split('=')) } } // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.

const regExMatch = (expressions, string) => {

    const result = [];
    // Test the multi-lines individually, last/bottom line qualifying becomes result.
    const lines = expressions.split(/\n/g);
    try {
        lines.forEach(line => {
            const expressions = line.slice(0, line.includes('#') ? line.indexOf('#') : line.length).split(/(?<!\\),/g);
            if (expressions.every(exp => {
                const regEx = new RegExp(exp, 'i');
                return regEx.test(string)
            })) {
                result.push([...string.matchAll(new RegExp(expressions.pop(), 'gi'))].pop())
            }
        })
    }
    catch (error) { console.log(`An invalid RegEx was detected!\n${JSON.stringify(error)}`); state.message = `An invalid RegEx was detected!\n${JSON.stringify(error)}`; }
    return result.pop()
}
const lens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : null, obj);
// TODO: Find a reliable method of emergency deleting specific points in Object.
const delLens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : delete obj[o][key]);

String.prototype.extractString = function (a, b) { return this.slice(this.indexOf(a), this.indexOf(b) + 1) } // Slightly cleaner to read and write than doing the indexing yourself.
const replaceLast = (x, y, z) => { let a = x.split(""); let length = y.length; if (x.lastIndexOf(y) != -1) { for (let i = x.lastIndexOf(y); i < x.lastIndexOf(y) + length; i++) { if (i == x.lastIndexOf(y)) { a[i] = z; } else { delete a[i]; } } } return a.join(""); }
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' } // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text } // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.

// Extract the last cluster in the RegEx' AND check then filter out non-word/non-whitespace symbols to TRY and assemble the intended words.
const format = (entry) => entry["keys"].slice(entry["keys"].includes(",") || entry["keys"].includes(".*") ? entry["keys"].regexLastIndexOf(/(,|\.\*)/g) : 0, entry["keys"].includes('#') ? entry["keys"].indexOf('#') : entry["keys"].length).replace(/[^\w-\s]/g, ',').split(',').map(e => e.trim()).filter(e => e.length > 1);
const addDescription = (entry, value = 0) => {
    let searchText = lines.join('\n');
    const expressions = entry["keys"].replace(/#.*/, '').split(',');

    // Test if it would pass EVERY expression.
    try {

        if (expressions.every(exp => {
            const regEx = new RegExp(exp, 'i');
            if (regEx.test(searchText)) {
                return true;
            }
        })) {
            const regEx = new RegExp(expressions.pop(), 'ig');
            // Find a match for the last expression and grab the most recent word for positioning. Filter out undefined/false values.
            const result = [...searchText.matchAll(regEx)].pop().filter(Boolean).pop()
            if (result && value == 0) {
                searchText = searchText.slice(0, searchText.toLowerCase().lastIndexOf(result.toLowerCase())) + result.slice(0, -result.length) + entry["entry"] + ' ' + (result) + searchText.slice(searchText.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
            } else if (result && value != 0) {
                searchText = searchText.slice(0, searchText.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length) + ' ' + entry["entry"] + searchText.slice(searchText.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
            }

            lines = searchText.split('\n');
        }

    }
    catch (error) { console.log(`An invalid RegEx was detected!\n${JSON.stringify(error)}`); state.message = `An invalid RegEx was detected!\n${JSON.stringify(error)}`; }
}

const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const showWorldEntry = (entry, value = 0) => entry.isNotHidden = true
const addPositionalEntry = (entry, value = 0) => { spliceContext((value != 0 ? -(value) : lines.length), entry["entry"]) }
const addMemoryEntry = (entry, value = 0) => { spliceMemory((value != 0 ? -(value) : memoryLines.length), entry["entry"]) }
const addTrailingEntry = (entry, value = 0) => {

    // TODO: Create unified function with [d] attribute.
    let finalIndex = -1;
    const searchKeys = format(entry);
    lines.forEach((line, i) => { if (searchKeys.some(key => line.toLowerCase().includes(key.toLowerCase()))) { finalIndex = i; } })
    console.log(searchKeys, finalIndex)
    if (finalIndex >= 0) {
        spliceContext((finalIndex) - value, entry["entry"])
    }
    return;
}

const getWhitelist = () => dataStorage.hasOwnProperty(whitelistPath) && typeof dataStorage[whitelistPath] == 'string' ? dataStorage[whitelistPath].toLowerCase().split(/,|\n/g).map(element => element.trim()) : []

// TODO: Feed it the positional argument of the Object for float searches.
// TODO: Only retrieve the absolute necessities of information, currently its a slight rework of the function utilized in 'createWorldEntriesFromObject' func.
const getContextualProperties = (search) => {
    function replacer(replace) {
        let m = new Map();
        return function (key, value) {
            let path = m.get(this) + (Array.isArray(this) ? `[${key}]` : '.' + key);

            if (value === Object(value)) {
                m.set(value, path);
            }
            const final = replace.call(this, key, value, path.replace(/undefined\.\.?/, ''));


            if (typeof final == 'string' && Boolean(final) && regExMatch(value, search)) {
                paths.push(path.split('.'));
            }


            return final;
        }
    }
    const paths = [];
    JSON.stringify(dataStorage[synonymsPath], replacer(function (key, value, path) {
        return value;
    }));
    return [...paths.flat()]
}

const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.')[1] ? keys.split('.').slice(0, -1).join('.') : keys.replace('.', ''); if (property[1]) { getKey(path, obj)[property] = value ? value : null; } else { dataStorage[path] = value; } }
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object" || a[b] == null) { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }

const consumeWorldEntries = () => {

    worldEntries.filter(wEntry => ((wEntry["keys"].includes('.') || wEntry["keys"].startsWith('!')) && (!wEntry["keys"].includes('#')))).forEach(wEntry => {
        removeWorldEntry(worldEntries.indexOf(wEntry))
        if (wEntry["keys"].startsWith('!')) {
            const root = wEntry["keys"].match(/(?<=!)[^.]*/)[0];
            try {
                const object = JSON.parse(wEntry["entry"].match(/{.*}/)[0]);
                dataStorage[root] = object;
            }
            catch (error) { console.log(error); state.message = `Failed to parse implicit conversion of !${root}. Verify the entry's format!` }
        }
        else { setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage); }
    })
}

const sanitizeWhitelist = () => { const index = worldEntries.findIndex(element => element["keys"].includes('_whitelist')); if (index >= 0) { worldEntries[index]["keys"] = '_whitelist.'; } }
const parityMode = () => worldEntriesFromObject(dataStorage, '');
const trackRoots = () => { const list = Object.keys(dataStorage); const index = worldEntries.findIndex(element => element["keys"] == 'rootList'); if (index < 0) { addWorldEntry('rootList', list, isNotHidden = true) } else { updateWorldEntry(index, 'rootList', list, isNotHidden = true) } }
const globalWhitelist = [getWhitelist(), getContextualProperties(getHistoryString(-state.settings.searchTurnsRange)).flat()].flat();
const globalReplacer = (key, value) => { if (value == null || value.constructor != Object) { return value == null ? undefined : value } return Object.keys(value).sort((a, b) => globalWhitelist.indexOf(a) - globalWhitelist.indexOf(b)).filter(element => globalWhitelist.includes(element)).reduce((s, k) => { s[k] = value[k]; return s }, {}) }
const localWhitelist = getContextualProperties(getHistoryString(-1)).flat();
const localReplacer = (name, val) => { if (localWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };

// Close opened brackets for the string before attempting to JSON.parse() it - slight increase to success rate.
const getDepth = (string) => { const opened = string.match(/{/g); const closed = string.match(/}/g); return (opened ? opened.length : 0) - (closed ? closed.length : 0) }
const fixDepth = (string) => { let count = getDepth(string); while (count > 0) { count--; string += `}`; } return string }

// TODO: If AND/OR segments are present, only map those that qualify.
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty(synonymsPath) ? dataStorage[root][synonymsPath].split(',').map(element => element.toLowerCase().trim()) : []

// spliceContext takes a position to insert a line into the full context (memoryLines and lines combined) then reconstructs it with 'memory' taking priority.
// TODO: Sanitize and add counter, verify whether memory having priority is detrimental to the structure - 'Remember' should never be at risk of ommitance.
const spliceContext = (pos, string) => {

    const linesLength = lines.join('\n').length
    const memoryLength = memoryLines.join('\n').length

    let adjustedLines = 0;
    if ((linesLength + memoryLength) + string.length > info.maxChars) { const adjustor = lines.join('\n').slice(string.length).split('\n'); adjustedLines = lines.length - adjustor.length; lines = adjustor; }
    lines.splice(pos - adjustedLines, 0, string)
    return
}

const spliceMemory = (pos, string) => {
    contextMemoryLength += string.length;
    lines.splice(pos, 0, string);
    return
}

//[tavern|inn, Keysworth, tavern-keeper|tavernkeeper], [${obj}, look|watch|spectate, hair]

// TODO: Get the sprawler into a functional state, but that depends on supplimental functions such as 'getRootSynonyms' and the 'globalReplacer'.
// For parity: 'globalReplacer' might need to be shifted out with a local one and processed on each individual Object as search-length within context will vary depending on float and the blockers in RegEx.
const insertJSON = (text) => {


    // An Object that stores meta-info for comparison and ordering during processing - e.g to adjust positions as things are pushed around.
    const masterObject = {}
    const configValues = [['float', null], ['sprawl', false], ['inline', false]]


    for (const data in dataStorage) {

        if (typeof dataStorage[data] == 'object') {
            if (!dataStorage[data].hasOwnProperty("_config") || typeof dataStorage[data]["_config"] != 'object' || dataStorage[data]["_config"] == null) { dataStorage[data]["_config"] = {} }
            configValues.forEach(setting => { if (!dataStorage[data]["_config"].hasOwnProperty(setting[0])) { dataStorage[data]["_config"][setting[0]] = setting[1] } })
            if (!dataStorage[data].hasOwnProperty(synonymsPath)) { dataStorage[data][synonymsPath] = data }

            const { float, sprawl, inline } = dataStorage[data]["_config"];

            let find = regExMatch(dataStorage[data][synonymsPath], lines.join('\n'));
            let finalLineIndex;
            if (find) {
                lines.filter(line => !line.includes('[{')).forEach(line => {
                    if (line.includes(find[0])) { finalLineIndex = lines.indexOf(line); }
                })
            }
            if (finalLineIndex >= 0 || (float)) {
                let string = JSON.stringify(dataStorage[data], globalReplacer).replace(/\\/g, '');

                if (state.settings["filter"]) { string = string.replace(/"|{|}/g, ''); }

                if (string.length > 4 && float) {
                    float.includes('ML') ? spliceMemory(memoryLines.length, `[${string}]`) : spliceContext(float, `[${string}]`);
                }
                else if (string.length > 4 && !lines.some(line => line.includes(string))) { spliceContext(finalLineIndex, `[${string}]`); };
            }

        }
    }
}




const entriesFromJSONLines = () => {
    const JSONLines = lines.filter(line => /\[\{.*\}\]/.test(line));
    const JSONString = JSONLines.join('\n');
    worldEntries.forEach(element =>
        element["keys"].split(',').some(keyword => {
            if (JSONString.toLowerCase().includes(keyword.toLowerCase()) && !text.includes(element["entry"])) {


                if (info.memoryLength + contextMemoryLength + element["entry"].length <= info.maxChars / 2) {
                    spliceMemory(memory.split('\n').length, element["entry"]); return true;
                }
            }
        }))
}
const parseGen = (text) => { state.generate.process = false; const string = fixDepth(`${state.generate.sections.primer}${text}`); const toParse = string.match(/{.*}/); if (toParse) { const obj = JSON.parse(toParse[0]); worldEntriesFromObject(obj, state.generate.root.split(' ')[0]); state.message = `Generated Object for ${state.generate.root} as type ${state.generate.types[0]}\nResult: ${JSON.stringify(obj)}` } else { state.message = `Failed to parse AI Output for Object ${state.generate.root} type ${state.generate.type[0]}` } }
const parseAsRoot = (text, root) => { const toParse = text.match(/{.*}/g); if (toParse) { toParse.forEach(string => { const obj = JSON.parse(string); worldEntriesFromObject(obj, root); text = text.replace(string, ''); }) } }
const generateObject = (text) => {

    const { root, types } = state.generate;
    const type = types[0]
    const getExamples = (obj, types) => { let exampleString = ``; for (const data in obj) { if (types.some(type => obj[data].hasOwnProperty(type))) { const string = JSON.stringify(obj[data], globalReplacer).replace(/\\/g, ''); if (string.length + exampleString.length <= 1000) { exampleString += '\n' + string; } } } return exampleString }
    const getAbout = (about) => getHistoryString(-100).split('.').filter(sentence => sentence.toLowerCase().includes(about.toLowerCase())).join('.').trim();
    const createExample = (args) => {
        const assign = args.map(element => [element, '<value>']);
        const obj = Object.fromEntries(assign);
        return JSON.stringify(obj).replace(/\\/g, '');
    }

    state.generate.process = false
    //const example = createExample(types);
    const storedContext = text.substring(0, 0.4 * text.length).trim();
    const objectExamples = getExamples(dataStorage, types);
    const rootInformation = getAbout(root).slice(-(info.maxChars) - (objectExamples.length - storedContext.length));

    state.generate.sections = {
        "stored": `${storedContext}`,
        "examples": `\n--\nObject representation for ${type}s:${objectExamples}`,
        //"dummy": `\n${example}`,
        "about": `\n--\nInformation about ${type} ${root}:\n${rootInformation}`,
        "preprimer": `\n--\nObject representation for ${type} ${root}:`,
        "primer": `\n{"${type}":"${root}",`
    }
    const { stored, examples, dummy, about, preprimer, primer } = state.generate.sections;
    const buildString = stored + (objectExamples ? examples : '') + (rootInformation ? about : '') + preprimer + primer

    for (section in state.generate.sections) { console.log(`${section} Length: ${state.generate.sections[section].length}`) }
    console.log(`Final Text: ${buildString.length}`, `Max Text: ${info.maxChars}`)

    return { text: generateObject(text) }
}

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

                console.log(setKeys, setValue)
                if (dataStorage) { setProperty(setKeys, setValue, dataStorage); state.message = `${setKeys} set to ${setValue}`; if (state.settings["parityMode"]) { parityMode() } } // Immediately reflect the changes in state.data
                return
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

                // TODO: Permit the consumption of specific entries, currently this is also inadvertently execute /hide
                sanitizeWhitelist();
                consumeWorldEntries();
                const path = args.join('').toLowerCase().trim();
                if (dataStorage && dataStorage.hasOwnProperty(args[0].split('.')[0].toLowerCase().trim())) {

                    state.message = `Data Sheet for ${path}:\n${JSON.stringify(lens(dataStorage, path), null)}`;
                    if (state.settings["parityMode"]) { parityMode() }
                }
                else { state.message = `${path} was invalid!` }
                return

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
                let whitelist = dataStorage[whitelistPath].split(',').map(element => element.trim().toLowerCase());
                whitelist.includes(toWhitelist) ? whitelist.splice(whitelist.indexOf(toWhitelist), 1) : whitelist.push(toWhitelist);
                dataStorage[whitelistPath] = whitelist.toString();
                state.message = `Toggled whitelisting for ${toWhitelist}`;
                return

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

                //const getKeyNoTransform = (keys, obj) => { return keys.split('.').reduce((a, b) => { return a && a[b] }, obj) }
                args = args.map(element => element.trim()).join('').toLowerCase().split('.');
                const path = args.join('.')

                const object = args.length > 1 ? lens(dataStorage[args[0]], args.slice(1).join('.')) : dataStorage[args[0]]
                if (object) {
                    worldEntriesFromObject(object, path)
                    state.message = `Showing all Objects starting with ${path} in World Information!`;
                }
                else { worldEntriesFromObject(dataStorage, ''); state.message = `Showing ALL Objects in World Information!` }// }
                return
            }
    },

    parity:
    {
        name: 'parity',
        description: `Rebuilds Objects to World Entries after consumption at end of turn: ${state.settings["parityMode"]}`,
        args: false,
        usage: '/parity',
        execute:
            (args) => {
                state.settings["parityMode"] = !state.settings["parityMode"];
                state.message = `Parity Mode ${state.settings["parityMode"]} - Objects Rebuilt in World Information interface at end of turn.`;
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
                worldEntries.forEach(wEntry => { if (wEntry["keys"].startsWith(path) && wEntry["keys"].includes('.')) { removeWorldEntry(worldEntries.indexOf(wEntry)); setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage); } })
                state.message = `Hiding all entries starting with ${path} in World Information!`;
                return
            }
    },
    cross:
    {
        name: 'cross',
        description: `Toggles fetching of World Information from JSON Lines: ${state.settings["entriesFromJSON"]}`,
        args: false,
        execute:
            (args) => {

                state.settings["entriesFromJSON"] = !state.settings["entriesFromJSON"];
                state.message = `World Information from JSON Lines: ${state.settings["entriesFromJSON"]}`
                return
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
                return
            }
    },
    gen:
    {
        name: 'gen',
        description: `Generates an Object for the passed <root> by bringing examples matching <type> into context.`,
        args: true,
        usage: '<root>|<type>',
        execute:
            (args) => {

                if (!args.join(' ').includes('|')) { state.message = `Error: Separator '|' between <root> and <type> not detected.`; return }


                //args = args.map(element => element.trim())
                state.generate.root = args.slice(0, args.indexOf('|')).join(' ');
                state.generate.types = args.slice(args.indexOf('|') + 1);
                state.generate.process = true;
                state.stop = false;
                return

            }
    },
    scene:
    {
        name: 'scene',
        description: 'Inserts \'[Scene Description: <text>]\', one line back in context before insertion of JSON.',
        args: true,
        usage: '<text>',
        execute:
            (args) => {

                if (args.join(' ').trim()) {
                    state.scene = `[Scene Description: ${args.join(' ')}]`;
                    state.message = `Scene description set to ${state.scene}`
                }
                else { delete state.scene; state.message = 'Scene Description Deleted!' }
            }
    },
    delete:
    {
        name: 'delete',
        description: 'Deletes the provided Object from state.',
        args: true,
        usage: '<Object>',
        execute:
            (args) => {

                delete dataStorage[args[0]];
                state.message = `Deleted Object: ${args[0]}`;
            }
    },
    searchRange:
    {
        name: 'searchRange',
        description: 'Set the search range for attribute conditions - Default (4)\nValid Attributes are: a,d,p,s, and t',
        args: true,
        usage: '<Attribute> <Number> e.g /searchRange t 50',
        execute:
            (args) => {

                const attribute = args[0].replace(/\[|\]/g, '');

                const value = Number(args.slice(1).join(''))
                console.log(attribute, value)
                if (state.settings.ewi.hasOwnProperty(attribute)) { state.settings.ewi[attribute]["range"] = value; state.message = `Search Range of [${attribute}] set to ${value}!` }
                else { state.message = `[${attribute}] is not configureable for range!` }
            }
    },
    from:
    {
        name: "from",
        description: 'Creates an Object with the given root from the passed JSON- line.',
        args: 'true',
        usage: '<root> <JSON- Line/Object>',
        execute:
            (args) => {
                const obj = args.slice(1).join(' ')
                const root = args[0]
                parseAsRoot(obj, root)
                state.message = `Created Object '${root}' from ${obj}!`

            }
    }
};



const entryFunctions = {
    'a': { "func": addAuthorsNote, "range": state.settings.ewi['a'] }, // [a] adds it as authorsNote, only one authorsNote at a time.
    's': { "func": showWorldEntry, "range": state.settings.ewi['s'] }, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'e': () => { }, // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.
    'd': { "func": addDescription, "range": state.settings.ewi['d'] }, // [d] adds the first sentence of the entry as a short, parenthesized descriptor to the last mention of the revelant keyword(s) e.g John (a business man)
    'r': () => { }, // [r] picks randomly between entries with the same matching keys. e.g 'you.*catch#[rp=1]' and 'you.*catch#[rd]' has 50% each to be picked.
    'm': { "func": addMemoryEntry, "range": state.settings.ewi['m'] },
    'p': { "func": addPositionalEntry, "range": state.settings.ewi['p'] }, // Inserts the <entry> <value> amount of lines into context, e.g [p=1] inserts it one line into context.
    'w': () => { }, // [w] assigns the weight attribute, the higher value the more recent/relevant it will be in context/frontMemory/intermediateMemory etc.
    't': { "func": addTrailingEntry, "range": state.settings.ewi['t'] } // [t] adds the entry at a line relative to the activator in context. [t=2] will trail context two lines behind the activating word.
}

// To avoid complicating it with measurements of the additonal string, and at the cost of slightly less flexibility, we assign different functions to handle the positioning.
// spliceMemory would be to position it 'at the top of context'/'end of memory' while spliceLines is for short/medium injections towards the lower part of context.

// Pass the worldEntries list and check attributes, then process them.

const pickRandom = () => {
    const lists = groupElementsBy(worldEntries.filter(element => /#.*\[.*r.*\]/.test(element.keys)));
    const result = [worldEntries.filter(element => !/#.*\[.*r.*\]/.test(element.keys))];
    lists.forEach(element => result.push(element[Math.floor(Math.random() * element.length)]))
    return result.flat()
}
const processWorldEntries = () => {
    const entries = pickRandom() // Copy the entries to avoid in-place manipulation.
    entries.sort((a, b) => a["keys"].split('#').slice(-1)[0].match(/(?<=w=)\d+/) - b["keys"].split('#').slice(-1)[0].match(/(?<=w=)\d+/)).filter(e => e["keys"].includes('#')).forEach(wEntry => // Take a quick sprint through the worldEntries list and process its elements.
    {
        const regEx = /(\w(=\d*)?)/gi
        let attribPairs = regEx.test(wEntry["keys"]) ? wEntry["keys"].slice(wEntry["keys"].lastIndexOf('#')).match(regEx).map(e => e.split('=')).filter(e => entryFunctions[e[0]].hasOwnProperty('func')) : []
        if (attribPairs && attribPairs.length > 0) {

            // What we check the keywords against, this time around we basically check where in the context the last history element is then slice forward.
            const hasRange = attribPairs.filter(a => entryFunctions[a[0]].hasOwnProperty('range'))
            const lastTurnString = lines.slice(-entryFunctions[hasRange[hasRange.length - 1][0]]["range"]).join('\n');
            const basicCheck = regExMatch(wEntry["keys"], lastTurnString)
            //console.log(`Checking if '${wEntry["keys"]}' passes check: ${basicCheck.length > 0 ? true : false}`)// Only process attributes of entries detected on the previous turn. (Using the presumed native functionality of substring acceptance instead of RegEx wholeword match)
            if (basicCheck) {
                try // We try to do something. If code goes kaboom then we just catch the error and proceed. This is to deal with non-attribute assigned entries e.g those with empty bracket-encapsulations []
                {

                    attribPairs.forEach(pair => entryFunctions[pair[0]]["func"](wEntry, pair[1]))


                }
                catch (error) { console.log(error) } // Catch the error as it'd most likely not be destructive or otherwise detrimental.
            }
        }

    })
}