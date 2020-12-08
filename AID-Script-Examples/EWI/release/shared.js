// Design Document: https://docs.google.com/document/d/1YGdOtaunrcTlTWG7I9pwgXKxZeEYe3FR8eT96cZ-d28/edit
// TODO: Create AND/OR logic gates for synonym fetching.
// TODO: Create dynamic RegEx searches constructed from the Object root as a requirement and 'other Objects of the same type' as disqualifiers.
//       Note that the order has to be changed completely as at the current point of insertion these processes are already completed (preemtively).
//       Rewriting the 'globalReplacer' to redefine itself by the conditions of each individual Object is a possible solution, would ensure that unique edge-cases are handled.
//       Also allows float and sprawler detection range to function independently of what's in the full context.

// DONE: Dynamic configuration of Objects. Float position and insertion. Sprawler enabler. Reverse logic is reversed to permit interaction with the full extent of context via spliceContext() from anywhere, e.g when and if asynchronus functions become relevant.

if (!state.data) { state.data = {} } // Rebuild data from World Information, relatively intensive in comparison to persistent storage, but easier to manage.
let dataStorage = state.data;
let contextMemoryLength = 0; // Keep count of additional context added.
if (!state.generate) { state.generate = {} }
if (!state.settings) { state.settings = {} }
// If key (setting[0]) is not in state.settings, initiate it with setting[1] as default value.
const initSettings = [['entriesFromJSON', true], ['filter', false]]
initSettings.forEach(setting => { if (!Object.keys(state.settings).includes(setting[0])) { state.settings[setting[0]] = setting[1] } })

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

//https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
const replacerWithPath = (replacer) => { let m = new Map(); return function (field, value) { let path = m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field); if (value === Object(value)) m.set(value, path); return replacer.call(this, field, value, path.replace(/undefined\.\.?/, '')); } }
const worldEntriesFromObject = (obj, root) => { JSON.stringify(obj, replacerWithPath(function (field, value, path) { if (typeof value != 'object') { const index = worldEntries.findIndex(element => element["keys"] == `${root}.${path}`.replace(/\.$/g, '')); index >= 0 ? updateWorldEntry(index, `${root}.${path}`.replace(/\.$/g, ''), value.toString(), isNotHidden = true) : addWorldEntry(`${root}.${path}`.replace(/\.$/g, ''), value.toString(), isNotHidden = true); } return value; })); }
//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr#273810
String.prototype.regexLastIndexOf = function (regex, startpos) { regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : "")); if (typeof (startpos) == "undefined") { startpos = this.length; } else if (startpos < 0) { startpos = 0; } let stringToWorkWith = this.substring(0, startpos + 1); let lastIndexOf = -1; let nextStop = 0; while ((result = regex.exec(stringToWorkWith)) != null) { lastIndexOf = result.index; regex.lastIndex = ++nextStop; } return lastIndexOf; }
const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const getAttributes = (keys) => { const attrib = keys.match(/([a-z](=\d+)?)/g); if (attrib) { return attrib.map(attrib => attrib.split('=')) } } // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.
const lens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : null, obj);

const everyCheck = (entry, string) => {
    string = string.toLowerCase().trim();

    const keys = entry["keys"].replace(/\$|,?\s*?\[[^\[\]]*\]/g, '').toLowerCase().trim().split(',');
    const anyArray = keys.filter(element => element.includes('|'));

    const anyCheck = anyArray.map(element => element.trim()).every(element => element.split('|').some(key => string.includes(key)));
    const everyArray = keys.map(element => element.trim()).filter(element => !element.includes('|')).every(key => string.includes(key));

    console.log(`Keys: ${keys}`, `Any: ${anyArray}`, `Every: ${everyArray}`);
    if (everyArray && anyCheck) { return true }
}



String.prototype.extractString = function (a, b) { return this.slice(this.indexOf(a), this.indexOf(b) + 1) } // Slightly cleaner to read and write than doing the indexing yourself.
const replaceLast = (x, y, z) => { let a = x.split(""); let length = y.length; if (x.lastIndexOf(y) != -1) { for (let i = x.lastIndexOf(y); i < x.lastIndexOf(y) + length; i++) { if (i == x.lastIndexOf(y)) { a[i] = z; } else { delete a[i]; } } } return a.join(""); }
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' } // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text } // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.

// Format entry keys for addDescription, last OR sequence is used to determine eligible words, the rest become AND/OR gates.
const format = (entry) => {
    let filter = entry["keys"].replace(/\$/g, '').replace(/,?\s*?\[[^\[\]]*\]/g, '').split(',');
    let array = filter.length > 1 ? filter.slice(-1) : filter;
    return array.join(',').replace(/\|/g, ',').split(',').map(element => element.trim())
};

const addDescription = (entry, value = 0) => {
    let searchText = lines.join('\n');
    const searchKeys = format(entry);
    console.log('Search', searchKeys);
    let finalIndex = -1;
    let keyPhrase;
    searchKeys.forEach(key => {
        const regEx = new RegExp(`\\b${key.trim()}`, "gi");
        const keyIndex = searchText.toLowerCase().regexLastIndexOf(regEx);
        if (keyIndex > finalIndex) {
            finalIndex = keyIndex;
            keyPhrase = key;
        }
    });
    if (finalIndex && !(entry["entry"].replace(/[,.!?]*/g, '').split(' ').some(word => searchText.includes(`${keyPhrase} ${word}`) || searchText.includes(`${word} ${keyPhrase}`)))) {
        searchText = replaceLast(searchText, keyPhrase, value != 0 ? `${keyPhrase} ${entry["entry"]}` : `${entry["entry"]} ${keyPhrase}`);
    } lines = searchText.split('\n');
}



const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const revealWorldEntry = (entry, value = 0) => entry.isNotHidden = true
const addPositionalEntry = (entry, value = 0) => { const segment = value > lines.length ? memoryLines : lines; segment.splice((value != 0 ? -(value) : lines.length), 0, entry["entry"]) }

const getWhitelist = () => dataStorage.hasOwnProperty(whitelistPath) ? dataStorage[whitelistPath].split(',').map(element => element.trim()) : []


// TODO: Feed it the positional argument of the Object for float searches.
// TODO: Only retrieve the absolute necessities of information, currently its a slight rework of the function utilized in 'createWorldEntriesFromObject' func.
const getContextualProperties = (search) => {

    function buildSynonyms(replacer) {
        let m = new Map();
        return function(field, value) {
          let path = m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field);
      
          if (value === Object(value)) {
            m.set(value, path);
          }
          const final = replacer.call(this, field, value, path.replace(/undefined\.\.?/, ''));
      
          if (typeof final != 'object') {
            // TODO: Insert a function to check the qualification of AND/OR sequences.
            if (typeof value == 'string') {
                paths.push(path.replace(/undefined\.\.?/, '').split('.'));
                values.push(value.split(','));
            }
      
          }
          return final;
        }
      }
    
    const paths = []
    const values = []
    JSON.stringify(dataStorage[synonymsPath], buildSynonyms(function(field, value, path) {
        return value;
      }));



    const finalSynonyms = [...paths.flat(), ...values.flat()]

    return finalSynonyms
}

const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.')[1] ? keys.split('.').slice(0, -1).join('.') : keys.replace('.', ''); if (property[1]) { getKey(path, obj)[property] = value ? value : null; } else { dataStorage[path] = value; } }
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object") { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }

// TODO: Figure out why the native 'removeWorldEntry' function doesn't do the thing. It don't boop the entries away 😡
const consumeWorldEntries = () => {

    if (worldEntries.some(element => element["keys"].includes('.'))) {

        worldEntries.forEach(wEntry => {
            if (wEntry["keys"].includes('.')) {
                const index = worldEntries.findIndex(element => element["keys"] == wEntry["keys"]);
                removeWorldEntry(index); // <------------
                setProperty(wEntry["keys"].toLowerCase().split(',').filter(element => element.includes('.')).map(element => element.trim()).join(''), wEntry["entry"], dataStorage);

            }
        })
    }
}
const globalWhitelist = [getWhitelist(), getContextualProperties(text).flat()].flat();
const globalReplacer = (key, value) => { if (value == null || value.constructor != Object) { return value } return Object.keys(value).sort((a, b) => globalWhitelist.indexOf(a) - globalWhitelist.indexOf(b)).filter(element => globalWhitelist.includes(element)).reduce((s, k) => { s[k] = value[k]; return s }, {}) }
const localWhitelist = getContextualProperties(getHistoryString(-1)).flat();
const localReplacer = (name, val) => { if (localWhitelist.some(element => element.includes(name)) && val) { return Array.isArray(val) ? val.join(', ') : val } else { return undefined } };

// Close opened brackets for the string before attempting to JSON.parse() it - slight increase to success rate.
const getDepth = (string) => { const opened = string.match(/{/g); const closed = string.match(/}/g); return (opened ? opened.length : 0) - (closed ? closed.length : 0) }
const fixDepth = (string) => { let count = getDepth(string); while (count > 0) { count--; string += `}`; } return string }
/////
const assignParents = (text) => { for (const data in dataStorage) { if (dataStorage[data].hasOwnProperty("child")) { let indexPos = -1; let finalParent; let finalParentName; for (let parentRoot in dataStorage[data]["child"]) { const searchFor = parentRoot.replace(`[`, '').replace(`]`, ''); const index = text.includes(searchFor) ? text.lastIndexOf(searchFor) : dataStorage.hasOwnProperty(searchFor) && dataStorage[searchFor].hasOwnProperty("synonyms") ? dataStorage[searchFor]["synonyms"].split(',').map(element => text.lastIndexOf(element.toLowerCase())).sort().reverse().shift() : -1; if (index >= 0 && index > indexPos) { indexPos = index; let toCopy; for (const element in dataStorage[data]["child"][searchFor]) { if (element.includes('[')) { toCopy = element.replace(`[`, '').replace(`]`, ''); finalParent = dataStorage[toCopy]; finalParentName = searchFor; break; } else { finalParent = dataStorage[data]['child'][searchFor]; } } } } if (finalParent) { finalParent['synonyms'] ? finalParent['synonyms'] += ',' + data + ', ' + finalParentName : finalParent['synonyms'] = data + ', ' + finalParentName; if (dataStorage['synonyms'].hasOwnProperty(data)) { finalParent['synonyms'] += ', ' + dataStorage['synonyms'][data]; } if (dataStorage[data].hasOwnProperty('synonyms')) { finalParent['synonyms'] += ', ' + dataStorage[data]['synonyms']; } Object.assign(dataStorage[data], finalParent); } } } }

// TODO: If AND/OR segments are present, only map those that qualify.
const getRootSynonyms = (root) => dataStorage[root].hasOwnProperty(synonymsPath) ? dataStorage[root][synonymsPath].split(',').map(element => element.toLowerCase().trim()) : []

// spliceContext takes a position to insert a line into the full context (memoryLines and lines combined) then reconstructs it with 'memory' taking priority.
// TODO: Sanitize and add counter, verify whether memory having priority is detrimental to the structure - 'Remember' should never be at risk of ommitance.
const spliceContext = (pos, string) => {

    // Add a variable to keep track of the length on strings, not certain if it'll be relevant as all splicing is done on the combined context rather than the native 'memory'/'story' split.
    // Might have to check if it 'would be in memory if inserted normally' e.g by checking memoryLines.length against the 'pos' argument supplied here.
    fullContextLines.splice(pos, 0, string);
    memoryLines = fullContextLines.slice(0, memoryLines.length + 1);
    lines = fullContextLines.slice(memoryLines.length);
    // Re-assemble 'fullContextLines'
    fullContextLines = [...memoryLines, ...lines];

}
//[tavern|inn, Keysworth, tavern-keeper|tavernkeeper], [${obj}, look|watch|spectate, hair]

// TODO: Get the sprawler into a functional state, but that depends on supplimental functions such as 'getRootSynonyms' and the 'globalReplacer'.
// For parity: 'globalReplacer' might need to be shifted out with a local one and processed on each individual Object as search-length within context will vary depending on float and the blockers in RegEx.
const insertJSON = (text) => {


    // An Object that stores meta-info for comparison and ordering during processing - e.g to adjust positions as things are pushed around.
    const masterObject = {}
    const configValues = [['float', null], ['sprawl', false]]


    for (const data in dataStorage) {

        if (typeof dataStorage[data] == 'object') {
            if (!dataStorage[data].hasOwnProperty("_config") || typeof dataStorage[data]["_config"] != 'object' || dataStorage[data]["_config"] == null) {dataStorage[data]["_config"] = {}}
            configValues.forEach(setting => {if (!dataStorage[data]["_config"].hasOwnProperty(setting[0])) {dataStorage[data]["_config"][setting[0]] = setting[1]}})
            

            const { float, sprawl } = dataStorage[data]["_config"];

            let finalLineIndex;
            // Determine if the Object should be present, somewhere.
            const checkWords = [...[data], ...getRootSynonyms(data)];
            fullContextLines.forEach(line => {
                if (checkWords.some(word => line.toLowerCase().includes(word))) { finalLineIndex = fullContextLines.indexOf(line) }
            })
            console.log(`Final Index Line`, finalLineIndex)
            if (finalLineIndex > -1) {
                let string = JSON.stringify(dataStorage[data], globalReplacer).replace(/\\/g, '');
                if (state.settings["filter"]) { string = string.replace(/"|{|}/g, ''); }

                if (float) {
                    spliceContext(float, string);
                }

                else {
                    fullContextLines.some(line => {
                       
                        if (string.length > 4 && !fullContextLines.some(line => line.includes(string))) {
                            spliceContext(finalLineIndex, `[${string}]`);
                            return true;
                        }
                        
                    });
                }

            }


            console.log(`Check: ${checkWords}| Final: ${null}`);

        }
    }
}




const entriesFromJSONLines = () => { const JSONLines = lines.filter(line => line.startsWith('[')); const JSONString = JSONLines.join('\n'); const normalWorldEntries = worldEntries.filter(element => !element["keys"].includes('.')); normalWorldEntries.forEach(element => element["keys"].split(',').some(keyword => { if (JSONString.toLowerCase().includes(keyword.toLowerCase()) && !text.includes(element["entry"])) { if (info.memoryLength + contextMemoryLength + element["entry"].length <= info.maxChars / 2) { memoryLines.splice(-1, 0, element["entry"]); contextMemoryLength += element["entry"].length + 1; return true; } } })) }
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

                if (dataStorage) { setProperty(setKeys, setValue, dataStorage) } // Immediately reflect the changes in state.data
                state.message = `${setKeys} set to ${setValue}`;
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

                consumeWorldEntries();
                if (dataStorage) {
                    const path = args.join('').toLowerCase().trim();
                    state.message = `Data Sheet for ${path}:\n${JSON.stringify(lens(dataStorage, path), null)}`;
                }
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
                dataStorage[whitelistPath] = whitelist;
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
                const objectPath = args.length > 1 ? args.slice(1).join('.') : args[0]
                console.log('objectPath', objectPath)

                console.log('path', path, args.length)
                const object = args.length > 1 ? lens(args.slice(1).join('.'), dataStorage[args[0]]) : dataStorage[args[0]]
                console.log('object', object)
                worldEntriesFromObject(object, path)
                state.message = `Showing all Objects starting with ${path} in World Information!`;
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

                const path = args.join('').trim().toLowerCase();
                worldEntries.forEach(wEntry => { if (wEntry["keys"].startsWith(path)) { wEntry["isNotHidden"] = false; } })
                state.message = `Hiding all entries starting with ${path} in World Information!`;
                Object.assign(worldEntries, worldEntries)
                return
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

                console.log(args)
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
        description: 'Inserts <text> in a bracket-enapsulated string, one line back in context before insertion of JSON.',
        args: true,
        usage: '<text>',
        execute:
            (args) => {

                state.scene = `[Scene Description: ${args.join(' ')}]`
                state.message = `Scene description set to ${state.scene}`
            }
    }
};

const entryFunctions = {
    'a': addAuthorsNote, // [a] adds it as authorsNote, only one authorsNote at a time.
    'r': revealWorldEntry, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'e': () => { }, // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.
    'd': addDescription, // [d] adds the first sentence of the entry as a short, parenthesized descriptor to the last mention of the revelant keyword(s) e.g John (a business man)
    'p': addPositionalEntry, // Inserts the <entry> <value> amount of lines into context, e.g [p=1] inserts it one line into context.
    'w': () => { }, // [w] assigns the weight attribute, the higher value the more recent/relevant it will be in context/frontMemory/intermediateMemory etc.
}

// To avoid complicating it with measurements of the additonal string, and at the cost of slightly less flexibility, we assign different functions to handle the positioning.
// spliceMemory would be to position it 'at the top of context'/'end of memory' while spliceLines is for short/medium injections towards the lower part of context.

// Pass the worldEntries list and check attributes, then process them.
const processWorldEntries = (entries) => {
    entries = [...entries] // Copy the entries to avoid in-place manipulation.

    entries.sort((a, b) => a["keys"].match(/(?<=w=)\d+/) - b["keys"].match(/(?<=w=)\d+/)).forEach(wEntry => // Take a quick sprint through the worldEntries list and process its elements.
    {
        const entryAttributes = getAttributes(wEntry["keys"].extractString('[', ']'))

        if (entryAttributes && entryAttributes.length > 0) {
            const lastTurnString = entryAttributes.some(attrib => attrib.includes('p') || attrib.includes('d')) ? getHistoryString(-1).toLowerCase().trim() : getHistoryString(-4).toLowerCase().trim() // What we check the keywords against, this time around we basically check where in the context the last history element is then slice forward.

            const basicCheck = wEntry["keys"].replace(/\$/g, '').replace(/\|/g, ',').split(',').some(keyword => lastTurnString.includes(keyword.toLowerCase().trim()))
            console.log(`Entry: ${wEntry["keys"]}: BasicCheck: ${basicCheck}`)// Only process attributes of entries detected on the previous turn. (Using the presumed native functionality of substring acceptance instead of RegEx wholeword match)
            // During the custom check we also (temporarily) remove the '$' prefix as to not need special processing of that later, a trim is also done.
            if (basicCheck) {
                try // We try to do something. If code goes kaboom then we just catch the error and proceed. This is to deal with non-attribute assigned entries e.g those with empty bracket-encapsulations []
                {

                    // Do a strict/every match if it's flagged as such, entry will only be processed if all keywords match as opposed to any.
                    if (entryAttributes.some(attrib => attrib.includes('e'))) { if (everyCheck(wEntry, lastTurnString)) { entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1])) } }
                    // If it's not flagged with 'e' then process as normal (any check)
                    else { entryAttributes.forEach(attrib => entryFunctions[attrib[0]](wEntry, attrib[1])) }


                }
                catch (error) { console.log(error) } // Catch the error as it'd most likely not be destructive or otherwise detrimental.
            }
        }

    })
}