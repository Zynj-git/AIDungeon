function uniqueBy(a, key)
{
    let seen = new Set();
    return a.filter(item => { return seen.has(key(item[1])) ? false : seen.add(key(item[1]));});
}

function chunk (arr, len) // Divides the columns of keyword / entry into pairs of two (relevant when using multiple column pairs per sheet)
{
  let chunks = [], i = 0, n = arr.length;
  while (i < n) { chunks.push(arr.slice(i, i += len)); }
  return chunks;
}

function onOpen()
{
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('AID World Entries')
      .addItem('All Sheets', 'importSheets')
      .addItem('Current Sheet', 'importFromSingleSheet')
      .addToUi();
}

function importFromSingleSheet()
{
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  importValuesFromRange(uniqueBy(chunk(values.flat(), 2), JSON.stringify));
}


function importSheets() // Processes all the keyword / entry pairs of all the sheets, returning a single string.
{
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const values = sheet.flatMap(x => x.getDataRange().getValues()); // Take the values from all the sheets and flatten them into a singular array of value pairs.
  importValuesFromRange(uniqueBy(chunk(values.flat(), 2), JSON.stringify));
}


function importValuesFromRange(values)
{
  const masterWorldEntryDict = []
  for (let j = 1; j < values.length; j++)
  {
    if (values[j][0] && values[j][1]) // We want to ignore pairs that are incomplete (With the new setup we also need to ignore instances where the value is 'keys' since we are feeding it the entire range of values from all the sheets at once)
    {
      const worldEntryDict = {};
      worldEntryDict[values[0][0]] = values[j][0]; // A1 is the first key. This way the script wont need to be updated as long as they stick to only using two keys.
      worldEntryDict[values[0][1]] = values[j][1]; // A2 is the second key
      masterWorldEntryDict.push(worldEntryDict)
    }
  }

  Logger.log(JSON.stringify(masterWorldEntryDict));
  SpreadsheetApp.getUi()
      .alert("Paste the entirety of the following string into AI Dungeon's input field!\n\n" + JSON.stringify(masterWorldEntryDict));
}
