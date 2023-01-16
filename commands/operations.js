import { types } from "../dataTypes.js";
import * as values from "../value.js";
import * as utils from "./utils.js";
import * as prg from "./program.js";

const DIVISION_DECIMALS = 100;

export function addXY(level1)  {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) { // number + number
    const dP = Math.max(X.value[1], Y.value[1]);
    const val = (Y.value[0] * 10n ** BigInt(dP - Y.value[1])) + (X.value[0] * 10n ** BigInt(dP - X.value[1]));
    level1.stackUp( new values.NumberValue([val, dP]) );
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
    const dP = Math.max(X.value[1], Y.value[1]);
    const val = (Y.value[0] * 10n ** BigInt(dP - Y.value[1])) - (X.value[0] * 10n ** BigInt(dP - X.value[1]));
    level1.stackUp( new values.NumberValue([val, dP]) );
  }
}

export function mulXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) {
    const dP = Y.value[1] + X.value[1];
    const val = Y.value[0] * X.value[0];
    level1.stackUp( new values.NumberValue([val, dP]) );
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
    let numerator = Y.value[0];
    const denominator = X.value[0];
    const dP = Y.value[1] - X.value[1];

    let intResult = (numerator / denominator).toString();
    let decResult = "";

    numerator %= denominator;
    
    let itt = 0;
    // const numerators = {};
    while (numerator != 0n && itt < DIVISION_DECIMALS /* && !(numerator in numerators) */) {
      // numerators[numerator] = true;
      numerator *= 10n;
      decResult += numerator / denominator;
      numerator %= denominator;
      itt++;
    }
    
    // // division has reached the point where it repeats, so this skips the math and just duplicates the string
    // const pattern = decResult;
    // for (let i = decResult.length; i <= DIVISION_DECIMALS; i += pattern.length) { decResult += pattern; }
    // decResult = decResult.substring(0, DIVISION_DECIMALS); // ensure exact correct length

    if (decResult == "") decResult = "0"; // garuntee value in here

    level1.stackUp( new values.NumberValue(`${intResult}.${decResult}E${-dP}`) );
  }
}

export function powXY(level1) {
  const {X,Y} = utils.getXY(level1);
  if (utils.sameType(X,Y, types.number)) level1.stackUp( new values.NumberValue(Y.value ** X.value) );
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