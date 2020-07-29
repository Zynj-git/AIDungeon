const modifier = (text) => {

    let modifiedText = text

    if (state.blockOutput) { modifiedText = ""; state.blockOutput = false;} // Block it from adding text when format is wrong.
    if (state.nextContextOutput) { // If we have a temporary output to feed it based on input, attach it to the context.
        state.memory = {context: memory + state.nextContextOutput};
        state.nextContextOutput = "";
    }

    if (state.forcedContext) {state.memory = {context: memory + '\n' + state.forcedContext};} //

    return {text: modifiedText};
}


// Don't modify this part
modifier(text)
