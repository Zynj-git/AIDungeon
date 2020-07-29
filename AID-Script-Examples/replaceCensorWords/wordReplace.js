// A barebones quick example of replacing certain words with another.

if (!state.setup)
{
    state.setup = true;
    state.nounConversion = [ // Non- plural form, we detect plurality from the original text.
        {"words": ["vampire", "zombie"], "replacement": "person"},
        {"words": ["tank", "car", "truck"], "replacement": "horse"},
        {"words": ["svelk"], "replacement": "elf"},
        {"words": ["hotel", "motel"], "replacement": "tavern"},
        {"words": ["pistol", "gun", "sniper"], "replacement": "bow"},
        ]
}

const { nounConversion } = state;
const modifier = (text) =>
{
    let fetchText = text.split(" ");
    const searchText = fetchText.map(elem => elem.replace(/\W/gi, ""));
    searchText.forEach(word => nounConversion.forEach(nWord => {if (nWord["words"].includes(word.toLowerCase())) {text = text.replace(word, nWord["replacement"])}}));
    console.log(text)
    return {text}
}

modifier(text)
