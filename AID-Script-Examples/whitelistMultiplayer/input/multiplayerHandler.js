// WIP Multiplayer manager by Zynj

// NOTE: REPLACE state.gameHost and state.whitelist before starting the game.
// Intended to be played in adventure / hardcore multiplayer games
// You can populate state.blackList with words that should be censored; will include an in-game command for those later.
// state.gameHost does not affect anything at the moment, but will later on.
// Commands do not trigger input / output
// Whitelisted players can currently run commands
// Non- whitelisted players can not trigger input / output.
// Characters duplicating a whitelisted name or starting with an exact match of a whitelisted name bypasses the list, will include a blacklist to combat abusers.
// Standard continue is disabled for the time being until I do some slicing and splicing to re- enable it in a sanitized manner.

state.config = {
    prefix: '/',
    altPrefix: '\n/'
}
if (!state.setup)
{
    state.setup = true;
    state.blackList = [ // Any word inserted in the "words" array will be replaced by REDACTED
        {"words": ["svelk"], "replacement": "[REDACTED]"}]
    state.gameHost = "Zynj"; // Hold the name of the game host.
    state.whitelist = ["Zynj"]; // Contains the name of the players that can provide inputs when whitelist is active
    state.whitelistEnabled = true; // Switch to false when whitelist should be enforced
    state.banlist = [];
    state.permitOutput = false; // Set to false whenever a non- whitelisted person attempts to prompt continue
}


state.commandList = {

    assignHost:
        {name: "assignHost",
        description: "Assigns the player as host of the game, enabling administrative commands.",
        args: true,
        usage: '<playerName>',
        execute:

            (args) => {
                if (state.gameHost) {state.message = `Game Host is assigned to: ${state.gameHost}`; modifiedText = ""; console.log(`Game Host is assigned to: ${state.gameHost}`)}
                else
                {
                    state.gameHost = args.join(' ');
                    if (!state.whitelist.includes(state.gameHost)) // Ensure the host is whitelisted.
                        {state.whitelist.unshift(state.gameHost);}
                    state.message = `Game host has been assigned to: ${state.gameHost}`;
                    console.log(`Game host has been assigned to: ${state.gameHost}`)
                }

                console.log()
                return
            }},

    filterBlacklist:
        {name: "filterBlacklist",
        description: "Replaces any blacklisted words with [REDACTED]",
        args: false,
        usage: false,
        execute:
            (text) => {

                const { blackList } = state;
                let fetchText = text.split(" "); // Split the text into individual words and compare them against the blacklist, replace them with [REDACTED]
                const searchText = fetchText.map(elem => elem.replace(/\W/gi, ""));
                searchText.forEach(word => blackList.forEach(nWord => {if (nWord["words"].includes(word.toLowerCase())) {text = text.replace(word, nWord["replacement"])}}));
                console.log(text)
                return text;
            }},

    whitelistPlayer:
        {
            name: "whitelistPlayer",
            description: "Assigns the player name to the list of whitelisted players.",
            args: true,
            usage: "<playerName>",
            execute:
                (args) => {
                    const playerToWhiteList = args.join(' ').replace(/[^a-zA-Z\d ]/gi, "") // Remove symbols;
                    if (!state.whitelist.includes(playerToWhiteList)) {state.whitelist.push(playerToWhiteList); state.message = `${playerToWhiteList} has been added to the whitelist!`}
                    else {const index = state.whitelist.indexOf(playerToWhiteList); if (index > -1) {state.whitelist.splice(index, 1); state.message = `${playerToWhiteList} has been removed from the whitelist!`}}
                }
        },

    banPlayer:
        {
            name: "banPlayer",
            description: "Adds the player to the list of banned players.",
            args: true,
            usage: "<playerName>",
            execute:
                (args) => {
                    const playerToBan = args.join(' ').replace(/[^a-zA-Z\d ]/gi, "") // Remove symbols;
                    if (!state.banlist.includes(playerToBan)) {state.banlist.push(playerToBan); state.message = `${playerToBan} has been added to the banlist!`}
                    else {const index = state.banlist.indexOf(playerToBan); if (index > -1) {state.banlist.splice(index, 1); state.message = `${playerToBan} has been removed from the banlist!`}}
                }
        },

    checkWhitelist:
        {
            name: "checkWhitelist",
            description: "Assesses whether the input was provided by a whitelisted player.",
            args: true,
            usage: false,
            execute:
                (text) => {

                    if (state.whitelist.some(player => text.startsWith('\n> '+ player) && !state.banlist.some(player => text.startsWith('\n> ' + player))))
                        {
                            console.log("Whitelist passed");
                            state.message = "Whitelist Passed";
                            state.permitOutput = true;
                            return true;
                        }
                    else {console.log("Whitelist failed"); state.message = "Whitelist Failed"; state.permitOutput = false; return false;}
                }
        },

    toggleWhitelist:
        {
            name: "toggleWhitelist",
            description: "Enables the whitelist system, mandating that a player is in the list for input to be processed.",
            args: false,
            usage: false,
            execute:
                () =>
                {
                    state.whitelistEnabled = !state.whitelistEnabled;
                    state.message = `whitelistEnabled is now ${state.whitelistEnabled}!`;
                }
        }
}

const { prefix, altPrefix } = state.config;
const { commandList } = state;
const modifier = (text) =>
{


    let modifiedText = text;
    if (history.length >= 2 && state.whitelistEnabled && !commandList.checkWhitelist.execute(text)) {return "";}

    if (text.includes(prefix) || text.includes(altPrefix))
    {
        state.message = `Text startsWith: ${prefix}`;
        const args = text.slice(text.indexOf(prefix) + prefix.length).split(/ +/); // Create a list of the words provided.
        const commandName = args.shift(); // Fetch and remove the actual command from the list.
        if (!(commandName in commandList)) {state.message = "Invalid Command!"; return "";} // Command is not in the list, lets exist early.
        const command = commandList[commandName];

        if (command.args && !args.length) //If the command expects to be passed arguments, but none are present then
        {
            let reply = `You didn't provide any arguments!\n`
            if (command.usage) {reply += `Example: \`${prefix}${command.name} ${command.usage}\``;} // Provide instructions for how to use the command if provided.
            state.message = reply;
            console.log(`${reply}`);

            return "";
        }


        try{command.execute(args);}
        catch (error) {state.message = `There was an error!\n${error}`; console.log(`There was an error!\n${error}`)}
        state.permitOutput = false; // Prevent commands from triggering an output.
        return ""; // Disguise the usage of commands.
    }

    console.log(modifiedText);
    return {text: commandList.filterBlacklist.execute(modifiedText)}
}

modifier(text)
