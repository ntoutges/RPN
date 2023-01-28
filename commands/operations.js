import { types } from "../dataTypes.js";
import * as values from "../value.js";
import * as utils from "./utils.js";
import * as prg from "./program.js";

const DIVISION_DECIMALS = 100;

export function addXY(level1)  {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) { // number + number
    level1.stackUp( Y.add(X) );
  }
  else if (utils.orderlessType(X,Y, types.number, types.string) || utils.sameType(X,Y, types.string)) {
    let xVal = X.value;
    let yVal = Y.value;

    // type coersion of number to string
    if (X.type == types.number) xVal = X.chars.join("");
    else if (Y.type == types.number) yVal = Y.chars.join("");

    level1.stackUp( new values.StringValue(yVal + xVal) );
  }
}

export function subXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) {
    level1.stackUp( Y.sub(X) );
  }
}

export function mulXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) {
    level1.stackUp( Y.mul(X) );
  }
  else if (utils.orderlessType(X,Y, types.number, types.string)) {
    let numVal = X.value;
    let strVal = Y.value;
    if (X.type == types.string) {
      strVal = X.val;
      numVal = Y.val;
    }
    let ittCt = numVal[0] / BigInt(10 ** numVal[1]);
    let finalStr = "";

    if (ittCt < 0) {
      ittCt *= -1n;
      strVal = strVal.split("").reverse().join(""); // reverse 'strVal'
    }

    for (let i = 0n; i < ittCt; i++) { finalStr += strVal; }

    level1.stackUp( new values.StringValue(finalStr) );
  }
}

export function divXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) { // Y X /
    level1.stackUp( Y.div(X, DIVISION_DECIMALS) );
  }
}

// WARNING: DOES NOT WORK ON NON-INT VALUES
export function powXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) level1.stackUp( new values.NumberValue((Y.value[0] ** X.value[0]).toString()) );
}

export function negX(level1) {
  level1.stackUp( new values.NumberValue("-1"), false);
  utils.runCommand(level1, "*");
}

export function invX(level1) { // reciprocal
  level1.stackUp( new values.NumberValue("1") );
  prg.swapXY(level1);
  divXY(level1);
}