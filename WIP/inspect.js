const modifier = (text) => // Input modifier
{ if (text.toLowerCase().includes('describe')) { state.memory.frontMemory = '\n> The narrator begins to describe eloquently.'} return {text}}
modifier(text)

const modifier = (text) => // Output modifier
{ delete state.memory.frontMemory; return {text} }
modifier(text)