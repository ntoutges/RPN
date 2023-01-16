const variables = {};

// name: string, value: Value
export function setVariable(name, value) {
  variables[name] = value;
}

// names: [string, string...]
export function removeVariable(...names) {
  for (const name of names) {
    if (!(name in variables)) throw new Error("Variable does not exist");
    delete variables[name];
  }
}

export function getVariable(name) {
  if (!(name in variables)) throw new Error("Variable does not exist");
  return variables[name];
}

export function variableExists(name) {
  return name in variables;
}