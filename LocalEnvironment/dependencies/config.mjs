import fs from 'fs'
import {processInput, updateHistory, updateState, clearState, getData} from './background.mjs'
import {addWorldEntry, updateWorldEntry, removeWorldEntry} from './native.mjs'


export const config = {
    "prefix": '/',
    "backgroundFunctions":
    {
        updateHistory,
        processInput,
        updateState,
        clearState,
        getData
    },
    "nativeFunctions":
    {
        addWorldEntry,
        updateWorldEntry,
        removeWorldEntry
    },
    "data": null // This is read and set before execution then used to write after execution.
}