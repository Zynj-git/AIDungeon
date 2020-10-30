const modifier = (text) =>
{
    // e.g /set john.name John's name is John the Johnster.
    if (text.toLowerCase().includes('/') && text.toLowerCase().includes('set')) { const args = text.split(/ +/); const key = args[1]; const entry = args.splice(2).join(' '); const index = worldEntries.findIndex(element => element["keys"].includes(key)); index >= 0 ? updateWorldEntry(index, key, entry, isNotHidden = true) : addWorldEntry(key, entry, isNotHidden = true); return {text: "", stop: true}}



    return {text}
}

modifier(text)