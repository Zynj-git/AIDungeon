// This is a basic template for a typical "command manager"
// Note that functions can't be persistently stored in state and must be re-defined on each input due to current security implications.
// You still have to duplicate the code for both input and output, this will hopefully be resolved later.
const { commandList } = state;
const { prefix, prefixSymbol } = state.config;
const modifier = (text) => {

    delete state.message
    const commandPrefix = text.match(prefix);
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
