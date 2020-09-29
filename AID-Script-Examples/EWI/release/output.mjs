// To prevent the AI from outputting parenthesized information, we simply remove it.
const modifier = (text) =>
{ 
    text = text.replace(/ \(.*\)/gm, '');

    if (!text.startsWith('\n') || !text.startsWith(' ')) { text = ' ' + text}
    return {text}
}
modifier(text)