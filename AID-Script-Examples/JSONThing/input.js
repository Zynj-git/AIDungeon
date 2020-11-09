// This is a basic template for a typical "command manager"
// Note that functions can't be persistently stored in state and must be re-defined on each input due to current security implications.
// You still have to duplicate the code for both input and output, this will hopefully be resolved later.

state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
    prefixSymbol: '/'
}

state.commandList = { // Store a function in state with the intention of being able to call from both input / output script without duplicating code.
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
                
                if (!setValue && index >= 0) {removeWorldEntry(index)}
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
                const whitelistIndex = worldEntries.findIndex(element => element["keys"].includes('whitelist'));
                let whitelist = worldEntries[whitelistIndex]["entry"].split(',');

                whitelist.includes(toWhitelist) ? whitelist.splice(whitelist.indexOf(toWhitelist), 1) : whitelist.push(toWhitelist);
                updateWorldEntry(whitelistIndex, 'whitelist', whitelist.join(', '), isNotHidden = true);
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
                worldEntries.forEach(wEntry => {if (wEntry["keys"].startsWith(path)) {wEntry["isNotHidden"] = true;}})
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
                worldEntries.forEach(wEntry => {if (wEntry["keys"].startsWith(path)) {wEntry["isNotHidden"] = false;}})
                state.message = `Hiding all entries starting with ${path} in World Information!`;
            }
    }
};

const { commandList } = state;
const { prefix, prefixSymbol } = state.config;
const modifier = (text) => {

    delete state.message
    const commandPrefix = text.match(state.config["prefix"]);
    console.log(commandPrefix)
    if (commandPrefix && commandPrefix[0]) {
        //state.message = `Text startsWith: ${commandPrefix[0]}`;
        const args = text.slice(commandPrefix[0].length).replace(/"\n$|.\n$/, '').split(/ +/); // Create a list of the words provided, remove symbols from pre-processing polution.
        const commandName = args.shift().replace(/\W*/gi, ''); // Fetch and remove the actual command from the list.
        if (!(commandName in commandList)) { state.message = "Invalid Command!"; return { text: '', stop: true }; }
        const command = commandList[commandName];

        if (command.args && !args.length) //If the command expects to be passed arguments, but none are present then
        {
            let reply = `You didn't provide any arguments!\n`
            if (command.usage) { reply += `Example: ${prefixSymbol}${command.name} ${command.usage}\n`; } // Provide instructions for how to use the command if provided.
            if (command.description) { reply += `${command.description}`; }
            state.message = reply;
            return { text: '', stop: true };
        }


        try { command.execute(args); return { text: '', stop: true } }
        catch (error) { state.message = `There was an error!\n${error}`; }

    }

    return { text };
}
modifier(text);
