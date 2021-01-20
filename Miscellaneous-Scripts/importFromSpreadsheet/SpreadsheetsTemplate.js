// Takes four columns (that can be arbitrarily named), these columns (left to right) represent: keys, entry, isNotHidden, and id.
// The first row is ignored and can be used to list these properties.
// Only keys and entry are required, isNotHidden will default to true (providing any value will set it to false). 'id' is optional, but required for re-importing/merging.

// NOTE: Use unique IDs to ensure entries with same entry/keys are permitted.
function uniqueBy(a, key)
{
    let seen = new Set();
    return a.filter(item => { return seen.has(key(item)) ? false : seen.add(key(item));});
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
  importValuesFromRange(uniqueBy(chunk(values.flat(), 4), JSON.stringify));
}


function importSheets() // Processes all the keyword / entry pairs of all the sheets, returning a single string.
{
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const values = sheet.flatMap(aSheet => aSheet.getDataRange().getValues()); // Take the values from all the sheets and flatten them into a singular array of value pairs.
  importValuesFromRange(uniqueBy(chunk(values.flat(), 4), JSON.stringify));
}


function importValuesFromRange(values)
{
  const masterWorldEntryDict = []
  for (let j = 1; j < values.length; j++)
  {
    if (values[j][0] && values[j][1]) // We want to ignore pairs that are incomplete (With the new setup we also need to ignore instances where the value is 'keys' since we are feeding it the entire range of values from all the sheets at once)
    {
      const worldEntryDict = {};
      worldEntryDict["keys"] = values[j][0];
      worldEntryDict["entry"] = values[j][1]; 
      worldEntryDict['isNotHidden'] = values[j][2].toString() ? values[j][2] : true;
      values[j][3] ? worldEntryDict['id'] = values[j][3] : {};
      masterWorldEntryDict.push(worldEntryDict)
    }
  }

  //Logger.log(JSON.stringify(masterWorldEntryDict));
  SpreadsheetApp.getUi()
    .alert("Paste the entirety of the following string into a JSON file then import the file into World Information!\n\n" + JSON.stringify(masterWorldEntryDict));
}
