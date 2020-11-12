const modifier = (text) => {

    let modifiedText = text.toLowerCase();

    if (state.generate.primer) {
        const string = state.generate.primer + text;
        const toParse = string.match(/{.*}/)[0];
        const obj = JSON.parse(toParse);
        Object.keys(obj).forEach(key => addWorldEntry(state.generate.root + '.' + key, obj[key], isNotHidden = true));
        console.log(toParse);
    }




    return { text }
}


modifier(text)