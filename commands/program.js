import * as utils from "./utils.js"
import * as Vars from "../variables.js";
import { types } from "../dataTypes.js";
import * as values from "../value.js";

export function swapXY(level1) {
  const {X,Y} = utils.getXY(level1);
  level1.stackUp(X);
  level1.stackUp(Y);
}

export function stoX(level1) {
  const {X,Y} = utils.getXY(level1);
  if (X.type == types.globalName) {
    Vars.setVariable( X.value, Y );
  }
}

export function rclX(level1) {
  const X = level1.stackDown(false);
  if (X.type == types.globalName) {
    level1.stackUp( Vars.getVariable(X.value) );
  }
}

export function getXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (X.type != types.number) throw new Error("Invalid index type")

  let index = X.toNumberInt();
  switch(Y.type) {
    case types.list:
      if (index < 0) index += Y.value.length; // same as python
      if (index < 0 || index >= Y.value.length) throw new Error("Index out of bounds");
      level1.stackUp(Y.value[index]);
      break;
    
    case types.string:
      if (index < 0) index += Y.value.length; // same as python
      if (index < 0 || index >= Y.value.length) throw new Error("Index out of bounds");
      level1.stackUp( new values.StringValue(Y.value[index]) );
      break;

    default:
      throw new Error("Invalid GET type")
  }
}
