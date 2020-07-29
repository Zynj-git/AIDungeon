# Takes an xlsx file and converts the keyword / entry pairs into a string that can be read by the import / export script for AI Dungeon.
# This is what I based my Google Spreadsheet script solution upon and can be considered outdated.

from pandas import *
import json
xls = ExcelFile('worldEntries.xlsx') # This is the name of the excel file you are using.
worldEntriesDict = [] # All the world entry dictionaries from the Excel file gets appended to this list.
for i in range(0, len(xls.sheet_names)): # Loop trough each of the sheets in the file and process it into properly formated "dictionaries"
    data = xls.parse(xls.sheet_names[i], usecols = [0, 1]) # Parse the keys / entry columns of the file into readable data. Anything outside of column A and B is ignored.
    for dict in data.to_dict(orient = "records"): # Convert it to a dictionary in the format AI Dungeon expects.
        clean_dict = {k: dict[k] for k in dict if type(dict[k]) is str} #Empty fields in the spreadsheet is considered NaN, remove those entries.
        if len(clean_dict.keys()) > 1: #If either keywords or entry is not set, remove it as it is useless and also breaks the import.
            worldEntriesDict.append(clean_dict) # Append it to the list before printing the final string containing all the world entries.

print(json.dumps(worldEntriesDict)) #This provides you with a string you can paste into AI Dungeon's input field if importing is enabled for the scenario.
