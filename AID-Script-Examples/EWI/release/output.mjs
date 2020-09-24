// To prevent the AI from outputting parenthesized information, we simply remove it.
const modifier = (text) =>{ text = text.replace(/ \(.*\)/gm, ''); return {text}}
modifier(text)