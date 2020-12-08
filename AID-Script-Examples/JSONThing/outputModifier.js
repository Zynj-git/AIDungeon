const modifier = (text) => {

    let modifiedText = text.toLowerCase();
    if (state.generate.process) { parseGen(text); return {text: ''}; }
    return { text }
}


modifier(text)