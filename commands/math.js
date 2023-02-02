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

// export function equalsXY(level1) { // Y X =
//   const {X,Y} = utils.getXY(level1);
//   if (!utils.ofType(X, types.algebreic,types.number,types.globalName)) throw new Error("Invalid type");
//   if (!utils.ofType(Y, types.algebreic,types.number,types.globalName)) throw new Error("Invalid type");
//   level1.stackUp(
//     new values.AlgebreicVariable(
//       Y.chars.concat("=", X.chars)
//     )
//   )
// }