const modifier = (text) => {

  let modifiedText = text
  const lowered = text.toLowerCase()

  if (history.length >= 2 && state.whitelistEnabled && !state.permitOutput) {state.permitOutput = false; return "";}

    // You must return an object with the text property defined.
  return {text: modifiedText}
}

// Don't modify this part
modifier(text)
