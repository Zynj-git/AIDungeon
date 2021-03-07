console.log(`Turn: ${info.actionCount}`)
if (!state.data) { state.data = {} }
let dataStorage = state.data;
let contextMemoryLength = 0; // Keep count of additional context added.
if (!state.generate) { state.generate = {} }
if (!state.settings) { state.settings = {} }
if (!state.settings.globalWhitelist) { state.settings.globalWhitelist = [] }
const DefaultSettings = {
    'cross': false,
    'filter': false,
    'mode': true,
}
for (const setting in DefaultSettings) { if (!state.settings.hasOwnProperty(setting)) { state.settings[setting] = DefaultSettings[setting] } }

const Expressions = {

    "invalid": /((("|')[^"']*("|'):)\s*({}|null|"")),?\s*/g,
    "clean": /,\s*(?=})/g,
    "listener": /<l=[^>]*>|<\/l>/g,
    "placeholder": /\$\{[^{}]*}/g,
    "attributes": /(\w(=+-*\d*)?)/g,
    "split": /=+/,
    "EWI": /#\[.*\]$/,
    "flags": /(?<=^\/.*\/)([ygmiu]+)/,
    "expectFlags": /(?<=^\/.*\/)/
}

state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
    prefixSymbol: '/',
    libraryPath: '_exp',
    whitelistPath: '_whitelist',
    synonymsPath: '_synonyms',
    configPath: '_config',
    wildcardPath: '/*',
    pathSymbol: '.',
    openListener: '<l',
    closeListener: '</l>'
}
let { cross } = state.settings;
const { whitelistPath, synonymsPath, pathSymbol, wildcardPath, configPath, libraryPath, openListener, closeListener } = state.config;
const Paths = [whitelistPath, synonymsPath, libraryPath];
const getRandomObjects = (arr) =>
{
    const hash = {};
    const result = [];
    arr.forEach(el =>
    {
        const value = el.metadata?.attributes?.find(e => e[0] == 'r');
        if (value)
        {

            if (!hash[value[1]])
            {
                hash[value[1]] = [];
                result.push(hash[value[1]]);
            };
            hash[value[1]].push(el);
        } else
        {
            result.push([el])
        };
    });

    return result.map(e =>
    {
        const find = e.filter(x => x.metadata?.random?.picked);

        if (find.length == 1 && (find[0].metadata.random.action == info.actionCount || !getHistoryString(-1).includes(find[0].metadata.matches[0])))
        { return [find[0]] }

        else
        {
            if (find.length > 0) { find.forEach(e => e.metadata.random.picked = false); }
            return e
        };
    }).map(e =>
    {
        if (e.length > 1)
        {
            const random = e[Math.floor(Math.random() * e.length)];
            random.metadata.random = { "picked": true };
            random.metadata.random.action = info.actionCount;
            return random
        }

        else { return e[0] }
    });
};

//https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
const replacerWithPath = (replacer) => { let m = new Map(); return function (field, value) { let path = m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field); if (value === Object(value)) m.set(value, path); return replacer.call(this, field, value, path.replace(/undefined\.\.?/, '')); } }
const worldEntriesFromObject = (obj, root) =>
{
    JSON.stringify(obj, replacerWithPath(function (field, value, path)
    {
        if (typeof value != 'object')
        {
            const index = worldInfo.findIndex(e => e["keys"] == `${root}.${path}`.replace(/^\.*|\.$/g, ''));
            index >= 0 ? updateWorldEntry(index, `${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), hidden = false) : addWorldEntry(`${root}.${path}`.replace(/^\.*|\.$/g, ''), value.toString(), hidden = false);
        }
        return value;
    }));
}
const getHistoryString = (start, end = undefined) => history.slice(start, end).map(e => e["text"]).join('\n') // Returns a single string of the text.
const getHistoryText = (start, end = undefined) => history.slice(start, end).map(e => e["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(e => e["type"]) // Returns the action types of the previous turns in an array.


// Ensure that '_synonyms' is processed first in the loop. It's executed if (Object.keys(dataStorage)[0] != synonymsPath)
const fixOrder = () =>
{
    dataStorage = Object.assign({ "_whitelist": {}, "_synonyms": {} }, dataStorage);
    state.data = dataStorage;
}

// Consider implementing a negative 'every' check for 'do not match' instances, expression prefixed by '!'
const regExMatch = (keys, text = undefined) =>
{
    if (typeof keys != 'string') { console.log(`Invalid Expressions: ${keys}`); return }
    // Test the multi-lines individually, last/bottom line qualifying becomes result.
    const array = keys.split(/\n/g);
    const result = [];
    let key = '';
    try
    {
        array.forEach(line =>
        {
            const string = text ? text : getSlice(line, state.settings.mode).join('\n')
            const expressions = line.slice(0, /#\[.*\]/.test(line) ? line.lastIndexOf('#') : line.length).split(/(?<!\\),/g);

            if (expressions.every(exp =>
            {
                const regExRaw = exp;
                const regExString = regExRaw.replace(/(^\/)|(\/.*)$/g, '').replace(/\\,/, '');
                const regExFlags = Expressions["flags"].test(regExRaw) ? [...new Set([...regExRaw.match(Expressions["flags"]).join('').split(''), 'g'])].join('') : Expressions["expectFlags"].test(regExRaw) ? 'g' : 'gi';
                const regEx = new RegExp(regExString, regExFlags);
                return regEx.test(string);
            }))
            {
                key = line;
                const regExRawLast = expressions.pop();
                const regExString = regExRawLast.replace(/(^\/)|(\/.*)$/g, '').replace(/\\,/, '');
                const regExFlags = Expressions["flags"].test(regExRawLast) ? [...new Set([...regExRawLast.match(Expressions["flags"]).join('').split(''), 'g'])].join('') : Expressions["expectFlags"].test(regExRawLast) ? 'g' : 'gi'
                const regEx = new RegExp(regExString, regExFlags);
                result.push([...string.matchAll(regEx)].filter(Boolean).pop());
            }
        })
    }
    catch (error)
    {
        console.log(`In regExMatch:\n${error.name}: ${error.message}`);
        state.message = `In regExMatch:\n${error.name}: ${error.message}`;

    }
    return [result.length > 0 ? result.pop().filter(Boolean) : undefined, key]
}


const getAttributes = (string) => { const regEx = new RegExp(String.raw`(${Object.keys(Attributes).sort((a, b) => b.length - a.length).join('|')})(=+-*\d*)?`, 'g'); const index = string.search(Expressions["EWI"]); if (index >= 0) { const match = string.slice(index).match(regEx); if (Boolean(match)) { return match.map(e => e.includes('=') ? e.split(Expressions["split"]) : [e, 0]).map(e => [e[0], Number(e[1])]) } } }
const lens = (obj, path) => path.split('.').reduce((o, key) => o && o[key] ? o[key] : null, obj);
const replaceLast = (x, y, z) => { let a = x.split(""); let length = y.length; if (x.lastIndexOf(y) != -1) { for (let i = x.lastIndexOf(y); i < x.lastIndexOf(y) + length; i++) { if (i == x.lastIndexOf(y)) { a[i] = z; } else { delete a[i]; } } } return a.join(""); }
const getMemory = (text) => { return info.memoryLength ? text.slice(0, info.memoryLength) : '' } // If memoryLength is set then slice of the beginning until the end of memoryLength, else return an empty string.
const getContext = (text) => { return info.memoryLength ? text.slice(info.memoryLength) : text } // If memoryLength is set then slice from the end of memory to the end of text, else return the entire text.

// Extract the last cluster in the RegEx' AND check then filter out non-word/non-whitespace symbols to TRY and assemble the intended words.
const addDescription = (entry, value = 0) =>
{
    const result = entry.metadata.matches.pop()
    let search = lines.join('\n');
    // Find a match for the last expression and grab the most recent word for positioning. Filter out undefined/false values.
    if (search.includes(result) && result && !Boolean(value))
    {
        search = search.slice(0, search.toLowerCase().lastIndexOf(result.toLowerCase())) + result.slice(0, -result.length) + entry["entry"] + ' ' + (result) + search.slice(search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
        lines = search.split('\n');
    }
    else if (search.includes(result) && result && Boolean(value))
    {
        search = search.slice(0, search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length) + ' ' + entry["entry"] + search.slice(search.toLowerCase().lastIndexOf(result.toLowerCase()) + result.length)
        lines = search.split('\n');
    }
}

// Reference to Object is severed during processing, so index it instead.
const addAuthorsNote = (entry, value = 0) => state.memory.authorsNote = `${entry["entry"]}`
const showWorldEntry = (entry, value = 0) => entry.hidden = false;
const addPositionalEntry = (entry, value = 0) => { spliceContext((Boolean(value) ? -(value) : copyLines.length), entry["entry"]); }
const addMemoryEntry = (entry, value = 0) =>
{
    if ((info.memoryLength + contextMemoryLength + entry["entry"].length) < (info.maxChars / 2))
    {
        spliceMemory(Boolean(value) ? -(value) : (memoryLines.length - 1), entry["entry"]);
    }

}
const getRange = (list) => list ? list.find(e => e[0] == 'l') || [undefined, undefined] : [undefined, undefined];
const getSlice = (string, mode = true) =>
{
    const attributes = getAttributes(string);
    const length = getRange(attributes);

    if (mode)
    {
        let measure = 0;
        const compare = copyLines.length;
        let actions = 0;

        for (let i = history.length - 1; i >= 0; i--)
        {
            const test = history[i]["text"].split('\n')
            if (test.length + measure <= compare)
            {
                measure += test.length;
                actions++;
            }
            else { if (copyLines.some(l => history[i]["text"].includes(l))) { actions++ } break; }
        }

        return getHistoryText(length[1] > 0 ? -length[1] : -actions, length[1] >= 0 ? history.length : length[1])
    }

    else { return lines.slice(length[1] > 0 ? -length[1] : 0, length[1] >= 0 ? lines.length : length[1]); }
}

const getLineIndex = (find, range) =>
{
    let result;
    if (range > 0) { for (let i = copyLines.length - copyLines.slice(-range).length; i < copyLines.length; i++) { if (copyLines[i].includes(find)) { result = i; } } }
    else if (range < 0) { for (let i = 0; i < copyLines.length + range; i++) { if (copyLines[i].includes(find)) { result = i; } } }
    else { copyLines.forEach((l, i) => { if (l.includes(find)) { result = i; } }) }
    return result
}

const addTrailingEntry = (entry, value = 0) =>
{

    const { attributes, matches } = entry.metadata;

    const range = getRange(attributes);
    const find = matches[0];
    const index = getLineIndex(find, range[1]);
    if (index >= 0) { spliceContext((index - value) >= 0 ? index - value : 0, entry["entry"]) }

    return;
}

const Attributes = {
    'a': addAuthorsNote, // [a] adds it as authorsNote, only one authorsNote at a time.
    's': showWorldEntry, // [r] reveals the entry once mentioned, used in conjuction with [e] to only reveal if all keywords are mentioned at once.
    'e': () => { }, // [e] tells the custom keyword check to only run the above functions if every keyword of the entry matches.
    'd': addDescription, // [d] adds the first sentence of the entry as a short, parenthesized descriptor to the last mention of the revelant keyword(s) e.g John (a business man)
    'i': () => { }, // [i] Ignores the entry if present.
    'r': () => { }, // [r] picks randomly between entries with the same matching keys. e.g 'you.*catch#[rp=1]' and 'you.*catch#[rd]' has 50% each to be picked.
    'm': addMemoryEntry,
    'p': addPositionalEntry, // Inserts the <entry> <value> amount of lines into context, e.g [p=1] inserts it one line into context.
    'w': () => { }, // [w] assigns the weight attribute, the higher value the more recent/relevant it will be in context/frontMemory/intermediateMemory etc.
    't': addTrailingEntry, // [t] adds the entry at a line relative to the activator in context. [t=2] will trail context two lines behind the activating word.
    'l': () => { },
    'x': () => { }, // [x] ignores the entry if not X amount of rounds have processed.
}

const getWhitelist = () => { const index = getEntryIndex('_whitelist.'); return index >= 0 ? worldInfo[index]["entry"].split(/,|\n/g).map(e => e.trim()) : [] }
const getWildcard = (display, offset = 0) => { const wildcard = display.split('.').slice(offset != 0 ? 0 : 1).join('.'); const list = display.split('.'); const index = list.indexOf(wildcard.slice(wildcard.lastIndexOf('.') + 1)); return [list[index].replace(wildcardPath, ''), index + offset] }
const getPlaceholder = (value) => typeof value == 'string' ? value.replace(Expressions["placeholder"], match => dataStorage[libraryPath][match.replace(/\$\{|\}/g, '')]) : value
const updateListener = (value, display, visited) =>
{
    // Check if it has previously qualified in 'visited' instead of running regExMatch on each node.
    const qualified = visited.some(e => e.includes(display.split('.')[0]));
    if (qualified)
    {
        const array = value.split(/(?<!\\),/g)
        const result = array.map(e =>
        {
            const find = e.match(/(?<=<l=)[^>]*(?=>)/g)
            if (find)
            {
                const expression = getPlaceholder(find[0])
                const match = regExMatch(`${expression}`)
                if (Boolean(match[0])) { return e.replace(/(?<=>)[^<]*(?=<)/g, match[0][0]) }
                else { return e }

            }
            else { return e }
        })

        const keys = display.toLowerCase().trim()
        const setKeys = display.includes('.') ? keys : `${keys}.`;
        const setValue = result.join(',')
        const index = getEntryIndex(setKeys);
        index >= 0 ? updateWorldEntry(index, setKeys, setValue, hidden = false) : addWorldEntry(setKeys, setValue, hidden = false)

    }
}
const globalReplacer = () =>
{

    const paths = [];
    const search = lines.join('\n')
    // Toggle the wildcard state to search down full path.
    // If the current path does not include the wildcard path, toggle it to false.
    let wildcards = [];
    const visited = [];
    const whitelist = getWhitelist().map(e =>
    {
        if (e.includes(wildcardPath)) { wildcards.push(getWildcard(e, 1)); return e.replace(wildcardPath, ''); }
        else { return e.split('.') }
    }).flat();


    //console.log(`Wildcards: ${wildcards}`)
    function replacer(replace)
    {
        let m = new Map();
        return function (key, value)
        {
            let path = m.get(this) + (Array.isArray(this) ? `[${key}]` : '.' + key);
            let display = path.replace(/undefined\.\.?/, '')
            const root = display.split('.')[0]

            // Find and store whether the Object qualifies to avoid repeated calls to regExMatch.
            // Without this, it'll call regExMatch for each node. While with this one may run:
            // visited.some(e => e.includes(node))
            if (dataStorage.hasOwnProperty(root) && dataStorage[root].hasOwnProperty(synonymsPath) && !visited.some(e => e[0].includes(root)))
            {
                const match = regExMatch(getPlaceholder(dataStorage[root][synonymsPath]))

                if (Boolean(match[0])) { visited.push([root, match[0][0]]) }
            }

            if (value === Object(value)) { m.set(value, path); }

            const final = replace.call(this, key, value, display);
            let current;

            if (Boolean(key) && (whitelist.includes(key)))
            {
                if (typeof value == 'string' && value.includes(closeListener)) { updateListener(value, display, visited); }
            }

            else if (typeof value == 'string')
            {
                // Only match paths in `_synonyms`.
                const match = display.startsWith(synonymsPath) ? regExMatch(getPlaceholder(value)) : undefined;
                if (value.includes(closeListener)) { updateListener(value, display, visited); }
                // Key is a wildcard and its value qualifies the regEx match.
                if (key.includes(wildcardPath) && Boolean(value) && Boolean(match[0])) { wildcards.push(getWildcard(display)) }
                // The current path contains one of the wildcards.
                else if (wildcards.some(e => { if (display.split('.')[e[1]] == e[0]) { current = e[0]; return true } }))
                {
                    const array = display.split('.');
                    paths.push([array, 0]);
                }
                else if (display.startsWith(synonymsPath) && Boolean(value) && Boolean(match[0])) { paths.push([display.split('.'), lines.join('\n').lastIndexOf(match[0][match[0].length - 1])]); }

            }
            return final;
        }
    }


    JSON.stringify(dataStorage, replacer(function (key, value, path) { return value; }));
    return [...new Set([...whitelist, ...paths.sort((a, b) => a[1] - b[1]).map(e => e[0]).flat()])].filter(e => !Paths.includes(e)).map(e => e.replace(wildcardPath, ''))
}

// globalWhitelist - Should only make one call to it per turn in context modifiers. Other modifiers access it via state.
const getGlobalWhitelist = () => state.settings.globalWhitelist = globalReplacer();
const setProperty = (keys, value, obj) => { const property = keys.split('.').pop(); const path = keys.split('.')[1] ? keys.split('.').slice(0, -1).join('.') : keys.replace('.', ''); if (property[1]) { getKey(path, obj)[property] = value ? value : null; } else { dataStorage[path] = value; } }
const getKey = (keys, obj) => { return keys.split('.').reduce((a, b) => { if (typeof a[b] != "object" || a[b] == null) { a[b] = {} } if (!a.hasOwnProperty(b)) { a[b] = {} } return a && a[b] }, obj) }

const buildObjects = () =>
{

    // Consume and process entries whose keys start with '!' or contains '.' and does not contain a '#'.
    const regEx = /(^!|\.)(?!.*#)/
    worldInfo.filter(wEntry => regEx.test(wEntry["keys"])).forEach(wEntry =>
    {
        if (wEntry["keys"].startsWith('!'))
        {
            const root = wEntry["keys"].match(/(?<=!)[^.]*/)[0];
            try
            {
                // Parse the contents into an Object.
                const object = JSON.parse(wEntry["entry"].match(/{.*}/)[0]);
                // Remove the parsed entry to prevent further executions of this process.
                removeWorldEntry(worldInfo.indexOf(wEntry));
                // Build individual entries of the Object into worldEntries.
                worldEntriesFromObject(object, root);
                // Re-process entries that begin with the exact root path.
                state.message = `Built Objects from !${root}.`
                worldInfo.filter(e => e["keys"].split('.')[0] == root).forEach(wEntry => setProperty(wEntry["keys"].split(',').filter(e => e.includes('.')).map(e => e.trim()).join(''), wEntry["entry"], dataStorage))
            }
            catch (error)
            {
                console.log(error);
                state.message = `Failed to parse implicit conversion of !${root}. Verify the entry's format!`
            }
        }
        else { setProperty(wEntry["keys"].split(',').filter(e => e.includes('.')).map(e => e.trim()).join(''), wEntry["entry"], dataStorage); }

    })
}

const sanitizeWhitelist = () => { const index = worldInfo.findIndex(e => e["keys"].includes(whitelistPath)); if (index >= 0) { worldInfo[index]["keys"] = whitelistPath + '.'; } }
const trackRoots = () => { const list = Object.keys(dataStorage); const index = worldInfo.findIndex(e => e["keys"] == 'rootList'); if (index < 0) { addWorldEntry('rootList', list, hidden = false) } else { updateWorldEntry(index, 'rootList', list, hidden = false) } }

// spliceContext takes a position to insert a line into the full context (memoryLines and lines combined) then reconstructs it with 'memory' taking priority.
// TODO: Sanitize and add counter, verify whether memory having priority is detrimental to the structure - 'Remember' should never be at risk of ommitance.
const spliceContext = (pos, string) =>
{

    const linesLength = lines.join('\n').length
    const memoryLength = memoryLines.join('\n').length

    let adjustedLines = 0;
    if ((linesLength + memoryLength) + string.length > info.maxChars && false)
    {
        const adjustor = lines.join('\n').slice(string.length).split('\n');
        adjustedLines = lines.length - adjustor.length;
        lines = adjustor;
    }

    lines.splice(pos ? pos : 0, 0, string);
    //lines.splice(pos - adjustedLines >= 0 ? pos - adjustedLines : pos, 0, string)
    return
}

const spliceMemory = (pos, string) =>
{
    contextMemoryLength += string.length;
    memoryLines.splice(pos, 0, string);
    return

}

const cleanString = (string) => string.replace(/\\/g, ' ').replace(Expressions["listener"], '').replace(Expressions["invalid"], '').replace(Expressions["clean"], '');
const insertJSON = () =>
{

    // Cleanup edge-cases of empty Objects in the presented string.
    const { globalWhitelist } = state.settings;
    console.log(`Global Whitelist: ${globalWhitelist}`)

    const list = []
    for (const data in dataStorage)
    {

        if (typeof dataStorage[data] == 'object')
        {
            if (!dataStorage[data].hasOwnProperty(synonymsPath)) { dataStorage[data][synonymsPath] = `${data}#[t]` }
            let string = cleanString(JSON.stringify(dataStorage[data], globalWhitelist));
            if (state.settings["filter"]) { string = string.replace(/"|{|}/g, ''); }
            if (string.length > 4)
            {
                const object = { "keys": dataStorage[data][synonymsPath].split('\n').map(e => !e.includes('#') ? e + '#[t]' : e).join('\n'), "entry": `[${string}]`, "metadata": { "isObject": true } }
                list.push(object)
            }
        }
    }
    if (list.length > 0) { preprocess(list) };
}

const getEWI = () => { return worldInfo.filter(e => Expressions["EWI"].test(e["keys"])) }
const processEWI = () => preprocess(getEWI());
const execAttributes = (object) =>
{
    const { attributes } = object.metadata;
    const ignore = attributes.find(e => e[0] == 'x');
    if (((ignore ? ignore[1] < history.length : true) && attributes.length > 0) && (object.metadata.hasOwnProperty('ignore') ? object.metadata.ignore.count > 0 : true))
    {
        try { attributes.forEach(pair => { Attributes[pair[0]](object, pair[1]) }) }
        catch (error) { console.log(`${error.name}: ${error.message}`) }
    }
}

// Sort all Objects/entries by the order of most-recent mention before processing.
// expects sortList to be populated by Objects with properties {"key": string, "entry": string}
const preprocess = (list) =>
{
    const search = copyLines.join('\n')
    const attributed = list.map(e =>
    {

        const match = regExMatch(getPlaceholder(e["keys"]));
        if (!e.hasOwnProperty('metadata')) { e.metadata = {}; };
        if (Boolean(match[0]))
        {
            e.metadata.index = search.lastIndexOf(match[0][match[0].length - 1]);
            e.metadata.qualifier = match[1];
            e.metadata.matches = match[0];
            e.metadata.attributes = getAttributes(match[1]).filter(a => { if (Attributes.hasOwnProperty(a[0])) { return true } else { state.message += `[${a[0]}] is an invalid attribute!\n`; return false } });
            const ignore = e.metadata.attributes.find(a => a[0] == 'i');
            if (ignore) // TODO: Refund ignore counter if actions are undone.
            {
                if (!e.metadata.hasOwnProperty('ignore')) { e.metadata.ignore = { "original": ignore[1], "count": ignore[1] } }
                if (ignore[1] != e.metadata.ignore.original) { e.metadata.ignore.original == ignore[1]; e.metadata.ignore.count = ignore[1]; }
                if ((e.metadata?.lastSeen != info.actionCount ?? false) && getHistoryString(-1).includes(e.metadata.matches[0])) { e.metadata.ignore.count-- }
            }
            e.metadata.lastSeen = info.actionCount;
            return e;
        }

    }).filter(Boolean)


    getRandomObjects(attributed)
        .filter(e => Expressions["EWI"].test(e.metadata.qualifier))
        .sort((a, b) => b.metadata.index - a.metadata.index)
        .forEach(e => { execAttributes(e); });
}

/*  Cross Lines pulls eligble World Information if its keywords are found within a JSON-line that is present in the context. 
    Insertions are done strictly through the memoryLines section of the context.
*/
const crossLines = () =>
{
    const JSONLines = lines.filter(line => /\[\{.*\}\]/.test(line));
    const JSONString = JSONLines.join('\n');
    worldInfo.forEach(e =>
    {
        if (!Object.keys(dataStorage).includes(e["keys"].split('.')[0]) && !e["keys"].startsWith('!')) // Handle regular entries - EWI likely fails test.
        {
            if (Boolean(regExMatch(e["keys"], JSONString)[0]) && !text.includes(e["entry"]))
            {
                if (info.memoryLength + contextMemoryLength + e["entry"].length <= info.maxChars / 2)
                {
                    spliceMemory(memoryLines.length - 1, e["entry"]);
                    return true;
                }
            }

        }
    })
}


const parseAsRoot = (text, root) =>
{
    const toParse = text.match(/{.*}/g);
    if (toParse)
    {
        toParse.forEach(string =>
        {
            const obj = JSON.parse(string);
            worldEntriesFromObject(obj, root);
            text = text.replace(string, '');
        })
    }
}



const getEntryIndex = (keys) => worldInfo.findIndex(e => e["keys"].toLowerCase() == keys.toLowerCase())
const updateHUD = () =>
{
    const { globalWhitelist } = state.settings;
    state.displayStats.forEach((e, i) => { if (dataStorage.hasOwnProperty(e["key"].trim())) { state.displayStats[i] = { "key": `${e["key"].trim()}`, "value": `${cleanString(JSON.stringify(dataStorage[e["key"].trim()], globalWhitelist)).replace(/\{|\}/g, '')}    ` } } })
}
state.commandList = {
    set: // Identifier and name of function
    {
        name: 'set',
        description: "Sets or updates a World Entry's keys and entry to the arguments given in addition to directly updating the object.",
        args: true,
        usage: '<root>.<property> <value>',
        execute: (args) =>
        {

            const keys = args[0].trim()
            const setKeys = keys.includes('.') ? keys : `${keys}.`;
            const setValue = args.slice(1).join(' ');
            const index = getEntryIndex(setKeys);

            index >= 0 ? updateWorldEntry(index, setKeys, setValue, hidden = false) : addWorldEntry(setKeys, setValue, hidden = false)

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
        execute: (args) =>
        {

            const path = args.join('').trim();
            if (dataStorage && dataStorage.hasOwnProperty(args[0].split('.')[0].trim()))
            {
                state.message = `Data Sheet for ${path}:\n${JSON.stringify(lens(dataStorage, path), null)}`;
            }
            else { state.message = `${path} was invalid!` }
            return

        }

    },
    delete:
    {
        name: 'delete',
        description: 'Deletes all dot-separated entries that match the provided argument.',
        args: true,
        usage: '<root> or <root>.<path>',
        execute: (args) =>
        {

            const keys = args[0].toLowerCase().trim();
            const setKeys = keys.includes('.') ? keys : `${keys}.`;
            worldInfo.filter(e => e["keys"].toLowerCase().startsWith(setKeys)).forEach(e => removeWorldEntry(worldInfo.indexOf(e)))
            state.message = `Deleted all entries matching: ${keys}`;
        }
    },
    show:
    {
        name: 'show',
        description: "Shows entries starting with the provided argument in World Information.",
        args: true,
        usage: '<root> or <root>.<property>',
        execute: (args) =>
        {

            const keys = args[0].toLowerCase()
            worldInfo.forEach(e => { if (e["keys"].toLowerCase().startsWith(keys)) { e["hidden"] = false; } })
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
        execute: (args) =>
        {

            const keys = args[0].toLowerCase()
            worldInfo.forEach(e => { if (e["keys"].toLowerCase().startsWith(keys)) { e["hidden"] = true; } })
            state.message = `Hiding all entries starting with ${keys} in World Information!`;
            return
        }
    },
    cross:
    {
        name: 'cross',
        description: `Toggles fetching of World Information from JSON Lines: ${state.settings["cross"]}`,
        args: false,
        execute: (args) =>
        {

            state.settings["cross"] = !state.settings["cross"];
            state.message = `World Information from JSON Lines: ${state.settings["cross"]}`
            return
        }
    },
    filter:
    {
        name: 'filter',
        description: `Toggles the filtering of quotation and curly-brackets within JSON lines: ${state.settings["filter"]}\nSaves character count, but may have detrimental effects.`,
        args: false,
        execute: (args) =>
        {
            state.settings["filter"] = !state.settings["filter"];
            state.message = `'"{}' filter set to ${state.settings["filter"]}`
            return
        }
    },
    from:
    {
        name: "from",
        description: 'Creates an Object with the given root from the passed JSON- line.',
        args: true,
        usage: '<root> <JSON- Line/Object>',
        execute: (args) =>
        {
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
        args: true,
        usage: '<root>',
        execute: (args) =>
        {

            if (!state.displayStats) { state.displayStats = [] }
            //getGlobalWhitelist(getHistoryString(-10).slice(-info.maxChars))
            const { globalWhitelist } = state.settings;
            const root = args[0].trim();
            const index = state.displayStats.findIndex(e => e["key"].trim() == root)

            if (dataStorage.hasOwnProperty(root))
            {
                const object = { "key": root, "value": `${cleanString(JSON.stringify(dataStorage[root], globalWhitelist).replace(/\{|\}/g, '')).replace(/\{|\}/g, '')}    ` }
                if (index >= 0) { state.displayStats.splice(index, 1) }
                else { state.displayStats.push(object) }
            }

        }
    },
    mode:
    {
        name: "mode",
        description: "Switches between actions (true) or lines (false) for conditions.",
        args: false,
        usage: '',
        execute: (args) =>
        {
            state.settings.mode = !state.settings.mode
            state.message = `Conditions now search amount of ${state.settings.mode == true ? 'actions' : 'lines'}.`
        }
    }


};