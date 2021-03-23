state.stop = true;
delete state.message


const modifier = (text) => 
{
    return CommandHandler(text) || { text };
}
modifier(text);
