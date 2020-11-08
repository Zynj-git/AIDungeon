// This is a basic template for a typical "command manager"
// Note that functions can't be persistently stored in state and must be re-defined on each input due to current security implications.
// You still have to duplicate the code for both input and output, this will hopefully be resolved later.

state.config = {
    prefix: /^\n> You \/|^\n> You say "\/|^\/|^\n\//gi,
}

state.commandList = { // Store a function in state with the intention of being able to call from both input / output script without duplicating code.
    set: // Identifier and name of function
    {
        name: 'set',
        description: 'Displays a message on the HUD.',
        args: true,
        usage: '<root>.<property> <value>',
        execute:
            (args) => {

                const setKeys = args[0].toLowerCase().trim()
                console.log(setKeys)
                const setValue = args.slice(1).join('')

                const index = worldEntries.findIndex(element => element["keys"] === setKeys);
                console.log(index)
                index >= 0 ? updateWorldEntry(index, setKeys, setValue, isNotHidden = true)  : addWorldEntry(setKeys, setValue, isNotHidden = true)
                state.message = `${setKeys} set to ${setValue}`;
                state.message += JSON.stringify(worldEntries);
            }
    },
};

const { commandList } = state;
const { prefix } = state.config;
const modifier = (text) => {

    delete state.message
    const commandPrefix = text.match(state.config["prefix"]);
    console.log(commandPrefix)
    if (commandPrefix && commandPrefix[0]) {
        console.log('success')
        state.message = `Text startsWith: ${commandPrefix[0]}`;
        const args = text.slice(commandPrefix[0].length).split(/ +/); // Create a list of the words provided.
        const commandName = args.shift(); // Fetch and remove the actual command from the list.
        if (!(commandName in commandList)) { state.message = "Invalid Command!"; return {text: '', stop: true}; }
        const command = commandList[commandName];

        if (command.args && !args.length) //If the command expects to be passed arguments, but none are present then
        {
            let reply = `You didn't provide any arguments!\n`
            if (command.usage) { reply += `Example: \`${prefix}${command.name} ${command.usage}\``; } // Provide instructions for how to use the command if provided.
            state.message = reply;
            return { text: '', stop: true };
        }


        try { command.execute(args); return {text: '', stop: true}}
        catch (error) { state.message = `There was an error!\n${error}`; }

    }

    return { text };
}
modifier(text);
