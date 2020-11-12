const modifier = (text) => {

    let modifiedText = text.toLowerCase();

    if (state.generate.process && state.generate.primer) {
        state.generate.process = false;
        const string = state.generate.primer + text;
        console.log(string)
        const toParse = string.match(/{.*}/);
        if (toParse)
        {
            const obj = JSON.parse(toParse[0]);
            worldEntriesFromObject(obj, state.generate.root);
            console.log(obj);
            state.message = `Generated Object for ${state.generate.root} as type ${state.generate.type}\nResult: ${JSON.stringify(obj)}`
        }
        else {state.message = `Failed to parse AI Output for Object ${state.generate.root} type ${state.generate.type}`}
        return {text: ''};
        
    }




    return { text }
}


modifier(text)