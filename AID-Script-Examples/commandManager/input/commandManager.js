// This is a basic template for a typical "command manager"
// Note that functions can't be persistently stored in state and must be re-defined on each input due to current security implications.
// You still have to duplicate the code for both input and output, this will hopefully be resolved later.

state.config = {
    prefix: "\n/",
}

state.commandList = { // Store a function in state with the intention of being able to call from both input / output script without duplicating code.
    printMod: // Identifier and name of function
        {name: 'printMod',
        description: 'Displays a message on the HUD.',
        args: true,
        usage: '<text>',
        execute:
            (args) =>
            {
                const textToDisplay = args.join(' ');
                state.message = textToDisplay; // Message to let us know which part of the script is calling it.
            },
        },
    };

const { commandList } = state;
const { prefix } = state.config;
const modifier = (text) =>
{

    if (text.startsWith(prefix))
    {
        state.message = `Text startsWith: ${prefix}`;
        const args = text.slice(prefix.length).split(/ +/); // Create a list of the words provided.
        const commandName = args.shift(); // Fetch and remove the actual command from the list.
        if (!(commandName in commandList)) {state.message = "Invalid Command!"; return "";} // Command is not in the list, lets exist early.
        const command = commandList[commandName];

        if (command.args && !args.length) //If the command expects to be passed arguments, but none are present then
        {
            let reply = `You didn't provide any arguments!\n`
            if (command.usage) {reply += `Example: \`${prefix}${command.name} ${command.usage}\``;} // Provide instructions for how to use the command if provided.
            state.message = reply;
            return "";
        }


        try{command.execute(args);}
        catch (error) {state.message = `There was an error!\n${error}`;}

    }

    return {text};
}
modifier(text);
