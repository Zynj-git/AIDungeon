const modifier = (text) => {

    let modifiedText = text.toLowerCase();

    if (state.generate && state.generate.process && state.generate.primer) {
        state.generate.process = false;
        const string = state.generate.primer + text;
        console.log(string)
        const toParse = string.match(/{.*}/)[0];
        const obj = JSON.parse(toParse);
        Object.keys(obj).forEach(key => addWorldEntry(state.generate.root + '.' + key, obj[key], isNotHidden = true));
        console.log(obj);
        return {text: ''};
        
    }




    return { text }
}


modifier(text)