const modifier = (text) => {

    if (state.contextMessage)
    {

        // The intention of this output part is to have the frontcontext be active for one input / output cycle before defaulting to only occupying state.memory.context
      if (state.clearFrontMemory && state.contextMessage)
      {
        if (state.turnTimer === 1)
        {
          state.clearFrontMemory = false;
          state.turnTimer = 0;
          state.memory = {context: memory + state.contextMessage}
          return {text}
        }
        state.turnTimer++;
      }


    }

    return {text}
}

modifier(text)
