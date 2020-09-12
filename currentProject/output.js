const getHistoryString = (turns) => history.slice(turns).map(element => element["text"]).join(' ') // Returns a single string of the text.
const getHistoryText = (turns) => history.slice(turns).map(element => element["text"]) // Returns an array of text.
const getActionTypes = (turns) => history.slice(turns).map(element => element["type"]) // Returns the action types of the previous turns in an array.
const hasAttributes = (keys) => keys.match(/([a-z](=\d+)?)/g).map(attrib => attrib.split('=')) // Pass it a bracket-encapsulated string and it returns an array of [attribute, value] pairs if possible.
