// To prevent the AI from outputting parenthesized information, we simply remove it.
const modifier = (text) =>
{ 
    let modifiedText = text;
    modifiedText = modifiedText.replace(/ ?\(.*\)/gm, '');
    if (!modifiedText.startsWith('\n') || !modifiedText.startsWith(' ')) { modifiedText = ' ' + modifiedText}
    return {text: modifiedText}
}
modifier(text)