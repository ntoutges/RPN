import * as utils from "./utils.js";
import { types } from "../dataTypes.js";
import * as values from "../value.js";

export function percentXY(level1) {
  level1.stackUp(new values.NumberValue("0.01"));
  utils.runCommand(level1, "*");
  utils.runCommand(level1, "*")
}

export function factorialX(level1) {
  const number = utils.getX(level1);
  const integer = number.toInt();
  
  let total = 1n;
  for (let i = 2n; i <= integer; i++) { total *= i; }
  level1.stackUp(new values.NumberValue(total.toString()));
}