import * as utils from "./utils.js"
import { types } from "../dataTypes.js";
import * as values from "../value.js";

export function equalsXY(level1) {
  const {X,Y} = utils.getXY(level1);
  level1.stackUp(
    new values.NumberValue(
      (X.equals(Y)) ? "1" : "0"
    )
  ) 
}

export function greaterXY(level1) {
  utils.runCommand(level1, "-");
  const X = utils.getX(level1);
  level1.stackUp(
    new values.NumberValue(
      (X.value[0] > 0) ? "1" : "0"
    )
  )
}

export function greaterEqualXY(level1) {
  utils.runCommand(level1, "-");
  const X = utils.getX(level1);
  level1.stackUp(
    new values.NumberValue(
      (X.value[0] >= 0) ? "1" : "0"
    )
  )
}

export function lesserXY(level1) {
  utils.runCommand(level1, "-");
  const X = utils.getX(level1);
  level1.stackUp(
    new values.NumberValue(
      (X.value[0] < 0) ? "1" : "0"
    )
  )
}

export function lesserEqualXY(level1) {
  utils.runCommand(level1, "-");
  const X = utils.getX(level1);
  level1.stackUp(
    new values.NumberValue(
      (X.value[0] <= 0) ? "1" : "0"
    )
  )
}