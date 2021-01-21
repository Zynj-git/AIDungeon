if (!state.data) {state.data = {}}
let dataStorage = state.data;
let contextMemoryLength = 0; // Keep count of additional context added.
if (!state.generate) { state.generate = {} }
if (!state.settings) { state.settings = {} }
if (!state.settings.globalWhitelist) { state.settings.globalWhitelist = [] }
// If key (setting[0]) is not in state.settings, initiate it with setting[1] as default value.
const initSettings = [['entriesFromJSON', true], ['filter', false], ['searchTurnsRange', 4], ['parityMode', false]]
initSettings.forEach(setting => { if (!Object.keys(state.settings).includes(setting[0])) { state.settings[setting[0]] = setting[1] } })
const ewiAttribConfig = ['a', 'd', 'm', 'p', 's', 't']

const invalid = /((("|')[^"']*("|'):)\s*({}|null|"")),?\s*/g;
const clean = /,\s*(?=})/g;
const listener = /<l=[^>]*>|<\/l>/g
// Config for consistency.
state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
    prefixSymbol: '/',
    libraryPath: '_exp',
    whitelistPath: '_whitelist',
    synonymsPath: '_synonyms',
    configPath: '_config',
    wildcardPath: '/*',
    pathSymbol: '.'
}

const placeholder = /\$\{[^{}]*}/g
const openListener = '<l';
const closeListener = '</l>'

if (!state.settings.ewi) { state.settings.ewi = {} }
ewiAttribConfig.forEach(attr => { if (!state.settings.ewi.hasOwnProperty(attr)) { state.settings.ewi[attr] = { "range": 4 } } })
console.log(`Turn: ${info.actionCount}`)
let { entriesFromJSON } = state.settings;
const { whitelistPath, synonymsPath, pathSymbol, wildcardPath, configPath, libraryPath } = state.config;
const internalPaths = [whitelistPath, synonymsPath, libraryPath]

// https://www.tutorialspoint.com/group-by-e-in-array-javascript
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
const worldEntriesFromObject = (obj, root) => { JSON.stringify(obj, replacerWithPath(function (field, value, path) { if (typeof value != 'object') { const index = worldEntries.findIndex(e => e["keys"] == `${root}.${path}`.replace(/^\.*|\.$/g, '')); index >= 0 ? updateWorldEntry(index, `${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), isNotHidden = true) : addWorldEntry(`${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), isNotHidden = true); } return value; })); }
//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr#273810
String.prototype.regexLastIndexOf = function (regex, startpos) { regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : "")); if (typeof (startpos) == "undefined") { startpos = this.length; } else if (startpos < 0) { startpos = 0; } let stringToWorkWith = this.substring(0, startpos + 1); let lastIndexOf = -1; let nextStop = 0; while ((result = regex.exec(stringToWorkWith)) != null) { lastIndexOf = result.index; regex.lastIndex = ++nextStop; } return lastIndexOf; }
const getHistoryString = (turns) => history.slice(turns).map(e => e["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(e => e["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(e => e["type"]) // Returns the action types of the previous turns in an array.

// Ensure that '_synonyms' is processed first in the loop. It's executed if (Object.keys(dataStorage)[0] != synonymsPath)
// NOTE: Could have unintended side effects of the re-assignment. If it causes issues, check if this can be reworked.
const fixOrder = () => { dataStorage = Object.assign({ "_whitelist": {}, "_synonyms": {} }, dataStorage); state.data = dataStorage }
const regExMatch = (expressions, string) => {
    if (typeof expressions != 'string') { console.log(`Invalid Expressions: ${expressions}`); return }
    const result = [];
    const attributes = /#/;
    // Test the multi-lines individually, last/bottom line qualifying becomes result.
    const lines = expressions.split(/\n/g);
    try {
        lines.forEach(line => {
            // Construct a pair of [0] expressions and [1] meta-info.
            const expressions = [line.slice(0, attributes.test(line) ? line.lastIndexOf('#') : line.length).split(/(?<!\\),/g), attributes.test(line) ? line.slice(line.lastIndexOf('#') + 1) : ""];
            if (expressions[0].every(exp => {
                const regEx = new RegExp(exp.replace(/\\/g, ''), 'i');
                return regEx.test(string)
            })) {
                result.push([[...string.matchAll(new RegExp(expressions[0].pop(), 'gi'))].filter(Boolean).pop(), Boolean(expressions[1]) ? expressions[1].match(/(\w(=\d*)?)/gi).map(e => e.split('=')) : []])
            }
        })
    }
    catch (error) { console.log(`An invalid RegEx was detected!\n${error.name}: ${error.message}`); state.message = `An invalid RegEx was detected!\n${error.name}: ${error.message}` } 
    return result.pop()
}
const lens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : null, obj);
const replaceLast = (x, y, z) => { let a = x.split(""); let length = y.length; if (x.lastIndexOf(y) != -1) { for (let i = x.lastIndexOf(y); i < x.lastIndexOf(y) + length; i++) { if (i == x.lastIndexOf(y)) { a[i] = z; } else { delete a[i]; } } } return a.join(""); }
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' } // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text } // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.

// Extract the last cluster in the RegEx' AND check then filter out non-word/non-whitespace symbols to TRY and assemble the intended words.
const addDescription = (entry, value = 0) => {
    const range = entryFunctions['d']['range'];
    const result = entry["keys"].pop()
    let search = lines.slice(-range).join('\n');
    // Find a match for the last expression and grab the most recent word for positioning. Filter out undefined/false values.
    if (search.includes(result) && result && !Boolean(value)) {
        search = search.slice(0, search.toLowerCase().lastIndexOf(result.toLowerCase())) + result.slice(0, -result.length) + entry["entry"] + ' ' + (result) + search.slice(search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
        lines = search.split('\n');
    } else if (search.includes(result) && result && Boolean(value)) {
        search = search.slice(0, search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length) + ' ' + entry["entry"] + search.slice(search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
        lines = search.split('\n');
    }
}

const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const showWorldEntry = (entry, value = 0) => entry.isNotHidden = true
const addPositionalEntry = (entry, value = 0) => {
    const range = entryFunctions['p']['range'];
    const result = entry["keys"][0];
    if (lines.slice(-range).join('\n').includes(result)) { spliceContext((Boolean(value) ? -(value) : lines.length), entry["entry"]) }
}
const addMemoryEntry = (entry, value = 0) => {
    const range = entryFunctions['m']['range'];
    const result = entry["keys"][0];
    if (lines.slice(-range).join('\n').includes(result)) { spliceMemory((Boolean(value) ? -(value) : memoryLines.length), entry["entry"]) }

}
const addTrailingEntry = (entry, value = 0) => {

    const range = entryFunctions['t']['range'];
    const result = entry["keys"][0];

    let finalIndex = -1;
    lines.slice(-range).forEach((line, i) => { if (line.includes(result)) { finalIndex = i; } })
    if (finalIndex >= 0) {
        spliceContext((finalIndex) - value, entry["entry"])
    }
    return;
}

const getWhitelist = () => dataStorage.hasOwnProperty(whitelistPath) && typeof dataStorage[whitelistPath] == 'string' ? dataStorage[whitelistPath].toLowerCase().split(/,|\n/g).map(e => e.trim()) : []
const getWildcard = (display, offset = 0) => { const wildcard = display.split('.').slice(offset != 0 ? 0 : 1).join('.'); const list = display.split('.'); const index = list.indexOf(wildcard.slice(wildcard.lastIndexOf('.') + 1)); return [list[index].replace(wildcardPath, ''), index + offset] }
const getPlaceholder = (value) => typeof value == 'string' ? value.replace(placeholder, match => dataStorage[libraryPath][match.replace(/\$\{|\}/g, '')]) : value
const updateListener = (object, key, value, search, display, visited) => {
    // Check if it has previously qualified in 'visited' instead of running regExMatch on each node.
    const qualified = visited.some(e => e.includes(display.split('.')[0]));
    if (qualified) {
        const array = value.split(/(?<!\\),/g)
        const result = array.map(e => {
            const find = e.match(/(?<=<l\s*=\s*)[^>]*(?=>)/g)[0]
            const expression = getPlaceholder(find)
            const match = regExMatch(`${expression}`, search)
            if (match) {
                return e.replace(/(?<=>)[^<]*(?=<)/g, match[0][0])
            } else {
                return e
            }
        })
        object[key] = result.join(',')
    }
}
const globalReplacer = () => {

    const search = lines.join('\n')
    // Toggle the wildcard state to search down full path.
    // If the current path does not include the wildcard path, toggle it to false.
    let wildcards = [];
    const visited = [];
    const whitelist = getWhitelist().map(e => {
        if (e.includes(wildcardPath)) {
            wildcards.push(getWildcard(e, 1));
            return e.replace(wildcardPath, '')
        } else {
            return e.split('.')
        }
    }).flat();
    //console.log(`Wildcards: ${wildcards}`)
    function replacer(replace) {
        let m = new Map();
        return function (key, value) {
            let path = m.get(this) + (Array.isArray(this) ? `[${key}]` : '.' + key);
            let display = path.replace(/undefined\.\.?/, '')
            const root = display.split('.')[0]

            // Find and store whether the Object qualifies to avoid repeated calls to regExMatch.
            // Without this, it'll call regExMatch for each node. While with this one may run:
            // visited.some(e => e.includes(node))
            if (dataStorage.hasOwnProperty(root) && !visited.some(e => e[0].includes(root))) {
                const match = regExMatch(getPlaceholder(dataStorage[root][synonymsPath]), search)
                if (match) { visited.push([root, match[0][0]]) }
            }

            if (value === Object(value)) {
                m.set(value, path);
            }
            const final = replace.call(this, key, value, display);
            let current;
            // If the key is in the _whitelist, then implicitly push it.
            if (Boolean(key) && (whitelist.includes(key))) {
                paths.push(key)
                if (value.includes(closeListener)) { updateListener(this, key, value, search, display, visited); }
            } else if (typeof value == 'string') {
                const match = regExMatch(getPlaceholder(value), search);
                if (value.includes(closeListener)) { updateListener(this, key, value, search, display, visited); }
                // Key is a wildcard and its value qualifies the regEx match.
                if (key.includes(wildcardPath) && Boolean(value) && match) {
                    wildcards.push(getWildcard(display))
                }

                // The current path contains one of the wildcards.
                else if (wildcards.some(e => {
                    if (display.split('.')[e[1]] == e[0]) {
                        current = e[0];
                        return true
                    }
                })) {
                    const array = display.split('.')
                    paths.push(array)

                } else if (display.startsWith(synonymsPath) && typeof value == 'string' && Boolean(value) && match) {
                    paths.push(display.split('.'));
                }

            }
            return final;
        }
    }

    const paths = [];
    JSON.stringify(dataStorage, replacer(function (key, value, path) {
        return value;
    }));
    return [...new Set([...whitelist, ...paths.flat()])].filter(e => internalPaths.every(i => !i.includes(e))).map(e => e.replace(wildcardPath, ''))
}

// globalWhitelist - Should only make one call to it per turn in context modifiers. Other modifiers access it via state.
const getGlobalWhitelist = () => state.settings.globalWhitelist = globalReplacer();
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.')[1] ? keys.split('.').slice(0, -1).join('.') : keys.replace('.', ''); if (property[1]) { getKey(path, obj)[property] = value ? value : null; } else { dataStorage[path] = value; } }
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object" || a[b] == null) { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }

const buildObjects = () => {

    // Consume and process entries whose keys start with '!' or contains '.' and does not contain a '#'.
    const regEx = /(^!|\.)(?!.*#)/
    worldEntries.filter(wEntry => regEx.test(wEntry["keys"])).forEach(wEntry => {
        if (wEntry["keys"].startsWith('!')) {
            const root = wEntry["keys"].match(/(?<=!)[^.]*/)[0];
            try {
                // Parse the contents into an Object.
                const object = JSON.parse(wEntry["entry"].match(/{.*}/)[0]);
                // Remove the parsed entry to prevent further executions of this process.
                removeWorldEntry(worldEntries.indexOf(wEntry));
                // Build individual entries of the Object into worldEntries.
                worldEntriesFromObject(object, root);
                // Re-process entries that begin with the exact root path.
                state.message = `Built Objects from !${root}.`
                worldEntries.filter(e => e["keys"].split('.')[0] == root).forEach(wEntry => setProperty(wEntry["keys"].toLowerCase().split(',').filter(e => e.includes('.')).map(e => e.trim()).join(''), wEntry["entry"], dataStorage))
            }
            catch (error) { console.log(error); state.message = `Failed to parse implicit conversion of !${root}. Verify the entry's format!` }
        }
        else { setProperty(wEntry["keys"].toLowerCase().split(',').filter(e => e.includes('.')).map(e => e.trim()).join(''), wEntry["entry"], dataStorage); }

    })
}

const sanitizeWhitelist = () => { const index = worldEntries.findIndex(e => e["keys"].includes(whitelistPath)); if (index >= 0) { worldEntries[index]["keys"] = whitelistPath + '.'; } }
const trackRoots = () => { const list = Object.keys(dataStorage); const index = worldEntries.findIndex(e => e["keys"] == 'rootList'); if (index < 0) { addWorldEntry('rootList', list, isNotHidden = true) } else { updateWorldEntry(index, 'rootList', list, isNotHidden = true) } }
// Close opened brackets for the string before attempting to JSON.parse() it - slight increase to success rate.
const getDepth = (string) => { const opened = string.match(/{/g); const closed = string.match(/}/g); return (opened ? opened.length : 0) - (closed ? closed.length : 0) }
const fixDepth = (string) => { let count = getDepth(string); while (count > 0) { count--; string += `}`; } return string }

// TODO: If AND/OR segments are present, only map those that qualify.
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty(synonymsPath) ? dataStorage[root][synonymsPath].split(',').map(e => e.toLowerCase().trim()) : []

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
    memoryLines.splice(pos, 0, string);
    return
}

const cleanString = (string) => string.replace(/\\/g, '').replace(listener, '').replace(invalid, '').replace(clean, '');
//[tavern|inn, Keysworth, tavern-keeper|tavernkeeper], [${obj}, look|watch|spectate, hair]

// TODO: Get the sprawler into a functional state, but that depends on supplimental functions such as 'getRootSynonyms' and the 'globalReplacer'.
// For parity: 'globalReplacer' might need to be shifted out with a local one and processed on each individual Object as search-length within context will vary depending on float and the blockers in RegEx.
const insertJSON = () => {

    // Cleanup edge-cases of empty Objects in the presented string.
    const { globalWhitelist } = state.settings;
    console.log(`Global Whitelist: ${globalWhitelist}`)
    for (const data in dataStorage) {

        if (typeof dataStorage[data] == 'object') {
            if (!dataStorage[data].hasOwnProperty(synonymsPath)) { dataStorage[data][synonymsPath] = `${data}#[t]` }
            let string = cleanString(JSON.stringify(dataStorage[data], globalWhitelist));
            if (state.settings["filter"]) { string = string.replace(/"|{|}/g, ''); }

            if (string.length > 4) {
                const object = { "keys": dataStorage[data][synonymsPath].split('\n').map(e => !e.includes('#') ? e + '#[t]' : e).join('\n'), "entry": `[${string}]` }
                execAttributes(object)
            }

        }
    }
}

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



const pickRandom = () => {
    const lists = groupElementsBy(worldEntries.filter(e => /#.*\[.*r.*\]/.test(e.keys)));
    const result = [worldEntries.filter(e => !/#.*\[.*r.*\]/.test(e.keys))];
    lists.forEach(e => result.push(e[Math.floor(Math.random() * e.length)]))
    return result.flat()
}
const processWorldEntries = () => {
    const entries = pickRandom(); // Ensure unique assortment of entries that adhere to the [r] attribute if present.
    entries.filter(e => e["keys"].includes('#')).forEach(wEntry => execAttributes(wEntry));
}

// execAttributes expects an Object with properties {"key": string, "entry": string}
const execAttributes = (entry) => {
    const process = regExMatch(getPlaceholder(entry["keys"]), lines.join('\n'));
    attributes = Boolean(process) ? process[1].filter(e => entryFunctions[e[0]].hasOwnProperty('func')) : [];
    if (attributes.length > 0) {
        try {
            attributes.forEach(pair => { entryFunctions[pair[0]]["func"]({ "keys": process[0], "entry": entry["entry"] }, pair[1]) })
        }
        catch (error) { console.log(`${error.name}: ${error.message}`) }
    }
}

const entriesFromJSONLines = () => {
    const JSONLines = lines.filter(line => /\[\{.*\}\]/.test(line));
    const JSONString = JSONLines.join('\n');
    worldEntries.forEach(e =>
        e["keys"].split(',').some(keyword => {
            if (JSONString.toLowerCase().includes(keyword.toLowerCase()) && !text.includes(e["entry"])) {


                if (info.memoryLength + contextMemoryLength + e["entry"].length <= info.maxChars / 2) {
                    spliceMemory(memory.split('\n').length, e["entry"]); return true;
                }
            }
        }))
}
const parseGen = (text) => { state.generate.process = false; const string = fixDepth(`${state.generate.sections.primer}${text}`); const toParse = string.match(/{.*}/); if (toParse) { const obj = JSON.parse(toParse[0]); worldEntriesFromObject(obj, state.generate.root.split(' ')[0]); state.message = `Generated Object for ${state.generate.root} as type ${state.generate.types[0]}\nResult: ${JSON.stringify(obj)}` } else { state.message = `Failed to parse AI Output for Object ${state.generate.root} type ${state.generate.type[0]}` } }
const parseAsRoot = (text, root) => { const toParse = text.match(/{.*}/g); if (toParse) { toParse.forEach(string => { const obj = JSON.parse(string); worldEntriesFromObject(obj, root); text = text.replace(string, ''); }) } }

// TODO: Consider re-implementation of this ('generateObject'). Might not see a lot of use considering the energy cost and chance of failed outputs.
const generateObject = (text) => {

    const { root, types } = state.generate;
    const type = types[0]
    const getExamples = (obj, types) => { let exampleString = ``; for (const data in obj) { if (types.some(type => obj[data].hasOwnProperty(type))) { const string = JSON.stringify(obj[data], state.settings.globalWhitelist).replace(/\\/g, ''); if (string.length + exampleString.length <= 1000) { exampleString += '\n' + string; } } } return exampleString }
    const getAbout = (about) => getHistoryString(-100).split('.').filter(sentence => sentence.toLowerCase().includes(about.toLowerCase())).join('.').trim();
    const createExample = (args) => {
        const assign = args.map(e => [e, '<value>']);
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

const getEntryIndex = (keys) => worldEntries.findIndex(e => e["keys"].toLowerCase() == keys.toLowerCase())
const updateHUD = () => { const { globalWhitelist } = state.settings; state.displayStats.forEach((e, i) => { if (dataStorage.hasOwnProperty(e["key"].trim())) { state.displayStats[i] = { "key": `${e["key"].trim()}`, "value": `${cleanString(JSON.stringify(dataStorage[e["key"].trim()], globalWhitelist)).replace(/\{|\}/g, '')}    ` } } }) }
state.commandList = {
    set: // Identifier and name of function
    {
        name: 'set',
        description: "Sets or updates a World Entry's keys and entry to the arguments given in addition to directly updating the object.",
        args: true,
        usage: '<root>.<property> <value>',
        execute:
            (args) => {

                const keys = args[0].toLowerCase().trim()
                const setKeys = keys.includes('.') ?  keys : `${keys}.`;
                const setValue = args.slice(1).join(' ');
                const index = getEntryIndex(setKeys);

                index >= 0 ? updateWorldEntry(index, setKeys, setValue, isNotHidden = true) : addWorldEntry(setKeys, setValue, isNotHidden = true)

                state.message = `Set ${setKeys} to ${setValue}!`
                if (state.displayStats) { updateHUD(); }
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

                const path = args.join('').toLowerCase().trim();
                if (dataStorage && dataStorage.hasOwnProperty(args[0].split('.')[0].toLowerCase().trim())) {
                    state.message = `Data Sheet for ${path}:\n${JSON.stringify(lens(dataStorage, path), null)}`;
                }
                else { state.message = `${path} was invalid!` }
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

                const keys = args[0].toLowerCase()
                worldEntries.forEach(e => {if (e["keys"].toLowerCase().startsWith(keys)) {e["isNotHidden"] = true;}})
                state.message = `Showing all entries starting with ${keys} in World Information!`;
                return
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

                const keys = args[0].toLowerCase()
                worldEntries.forEach(e => {if (e["keys"].toLowerCase().startsWith(keys)) {e["isNotHidden"] = false;}})
                state.message = `Hiding all entries starting with ${keys} in World Information!`;
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


                //args = args.map(e => e.trim())
                state.generate.root = args.slice(0, args.indexOf('|')).join(' ');
                state.generate.types = args.slice(args.indexOf('|') + 1);
                state.generate.process = true;
                state.stop = false;
                return

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
    },
    hud:
    {
        name: "hud",
        description: "Tracks the Object in the HUD",
        args: 'true',
        usage: '<root>',
        execute:
            (args) => {

                if (!state.displayStats) { state.displayStats = [] }
                //getGlobalWhitelist(getHistoryString(-10).slice(-info.maxChars))
                const { globalWhitelist } = state.settings;
                const root = args[0].trim();
                const index = state.displayStats.findIndex(e => e["key"].trim() == root)

                if (dataStorage.hasOwnProperty(root)) {
                    const object = { "key": root, "value": `${cleanString(JSON.stringify(dataStorage[root], globalWhitelist).replace(/\{|\}/g, '')).replace(/\{|\}/g, '')}    ` }
                    if (index >= 0) { state.displayStats.splice(index, 1) }
                    else { state.displayStats.push(object) }
                }

            }
    }
};

