// worldEntries are not accessible from within the online script editor and tests must be ran through actual scenario tests; this is how a typical worldEntries list is formatted.
// Keys is a comma-delimited string of words and by default can be assigned a max of 50 characters, but via the associated functions there is no limit.
// Entries by standard takes 500 characters, but again; scripts bypass any such restrictions although it's not recommended to do so.
worldEntries = [{"id": 0.012345689, "keys": "key, words", "entry": "your custom entry"}]
const history = [{"text": "This is the history", "type": "continue"},{"text": "These is the history", "type": "continue"}]
const worldEntries = [{"keys": "These, are, your, keys", "entry": "This is an entry."}, {"keys": "This, is, your, key", "entry": "This is an entry."}]

addWorldEntry(keys, entry)
removeWorldEntry(index)
updateWorldEntry(index, keys, entry)
