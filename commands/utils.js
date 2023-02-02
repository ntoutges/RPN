import * as values from "../value.js";
import { types } from "../dataTypes.js";

export function getLevels(level1, count) {
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(level1.stackDown(false));
  }
  return values;
}

// get "X" level value
export function getX(level1) {
  return level1.stackDown(false)
}

// get "X" and "Y" level values
export function getXY(level1) {
  return {
    "X": level1.stackDown(false),
    "Y": level1.stackDown(false)
  }
}

// X and Y must not be [unset]
export function validTypes(X,Y) {
  return X.type != dataTypes.unset && Y.type != dataTypes.unset;
}

// X and Y must both be of types [type]
export function sameType(X,Y, type) {
  return X.type == type && Y.type == type;
}

// X can be type1/2, as long as Y is the other type
// (doesn't matter which order X/Y are in)
export function orderlessType(X,Y, type1, type2) {
  return (X.type == type1 && Y.type == type2) || (X.type == type2 && Y.type == type1);
}

export function ofType(X, ...types) {
  return types.includes(X.type);
}

export function runCommand(level1, commandVal) {
  if (!Array.isArray(commandVal)) commandVal = commandVal.split("");
  (new values.CommandValue(commandVal)).execute(level1);
}

export function getAllListValues(list, restrictions=[]) {
  let allVals = [];
  for (const val of list.value) {
    if (val.type == types.list) allVals = allVals.concat(getAllListValues(val));
    else {
      if (restrictions.length == 0 || restrictions.includes(val.type)) allVals.push(val);
      else throw new Error("Invald data type");
    }
  }
  return allVals;
}

export function isFalsy(value) {
  if (value.type == types.number) { return value.value[0] == 0n; }
  else if (value.type == types.string) return value.value.length == 0;
  return true;
}

export function isTruthy(value) { return !isFalsy(value); }