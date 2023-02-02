import * as utils from "./utils.js"
import * as Vars from "../variables.js";
import { types } from "../dataTypes.js";
import * as values from "../value.js";
import { blockOffsets } from "./keywords.js";
import * as tst from "./test.js";

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

export function purgeX(level1) {
  const X = utils.getX(level1);
  switch (X.type) {
    case types.globalName:
      Vars.removeVariable(X.value);
      break;
    case types.list:
      const values = utils.getAllListValues(X, [types.globalName, types.variableName]);
      const valueNames = [];
      for (const val of values) { valueNames.push(val.value); }
      Vars.removeVariable.apply(this, valueNames);
      break;
    default:
    throw new Error("Bad variable type");  
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

export function sizeX(level1) {
  const X = utils.getX(level1);
  level1.stackUp( new values.NumberValue(X.value.length.toString()) );
}

export function evalX(level1) {
  const X = utils.getX(level1);
  if (X.type != types.program) {
    level1.stackUp(X);
    return;
  }
  const commands = X.getCommands();
  const blocks = X.getBlocks();

  let workingBlocksDir = 0;
  for (let i = 0; i < commands.length; i++) {
    const value = commands[i];
    if (workingBlocksDir < blocks.length && blocks[workingBlocksDir].hasInterrupt()) { // run interrupt
      const goto = blocks[workingBlocksDir].getInterrupt()(value, i);
      if (goto != undefined) {
        i = goto;
        workingBlocksDir = 0;
        continue;
      }
    }

    switch(value.type) {
      case types.command:
        while (workingBlocksDir < blocks.length - 1 && blocks[workingBlocksDir].fI < i) { workingBlocksDir++; }
        const goto = value.execute(level1, blocks, workingBlocksDir, i);
        if (goto != undefined) {
          if (goto-1 < i) workingBlocksDir = 0; // inefficient, to improve
          i = goto-1;
        } // account for i++ in loop
        break;
      case types.program:
        level1.stackUp(value);
        utils.runCommand(level1, "EVAL");
        break;
      case types.variableName:
        level1.stackUp( value.RCL() );
      break;
      default:
        level1.stackUp(value);
    }
  }
}

export function dupX(level1) {
  const X = utils.getX(level1);
  level1.stackUp(X);
  level1.stackUp(X);
}

export function dupXY(level1) {
  const {X,Y} = utils.getXY(level1);
  level1.stackUp(Y);
  level1.stackUp(X);
  level1.stackUp(Y);
  level1.stackUp(X);
}

export function dropX(level1) {
  level1.stackDown();
}

export function thenX(level1, blocks=null, bI) {
  const X = utils.getX(level1);
  if (blocks == null) return;
  if (utils.isFalsy(X)) { // don't need to do anything if truthy (just let program keep running)
    return blocks[bI].tI + blockOffsets[blocks[bI].tT];
  }
}

export function else_(_, blocks=null, bI) {
  if (blocks == null) return;
  return blocks[bI].tI; // jump to end of this block
}

export function forXY(level1, blocks=null, bI) {
  const {X,Y} = utils.getXY(level1);
  if (!utils.sameType(X,Y, types.number)) throw new Error("Invalid FOR type");
  if (blocks == null) return;
  blocks[bI].setInterrupt((value, i) => {
    if (value.type != types.variableName) throw new Error("Invalid FOR type");
    Vars.setVariable(value.value, Y);
    blocks[bI].vars[0] = value.value;
    blocks[bI].vars[1] = X; // number to end at
    return i;
  });
}

export function next_(level1, blocks=null, bI, i) {
  for (let j = bI; j >= 0; j--) {
    if (blocks[j].tI == i) {
      const numToTest = Vars.getVariable(blocks[j].vars[0]).add(new values.NumberValue("1"));
      Vars.setVariable(blocks[j].vars[0], numToTest);
      level1.stackUp(numToTest);
      level1.stackUp(blocks[j].vars[1]);

      tst.lesserEqualXY(level1)
      if (utils.isTruthy(utils.getX(level1))) return blocks[j].fI + blockOffsets[blocks[j].fT];
      break;
    }
  }
}

export function stepX(level1, blocks=null, bI, i) {
  for (let j = bI; j >= 0; j--) {
    if (blocks[j].tI == i) {
      const X = utils.getX(level1);
      if (X.type != types.number) throw new Error("Invalid STEP type");

      const numToTest = Vars.getVariable(blocks[j].vars[0]).add(X);
      Vars.setVariable(blocks[j].vars[0], numToTest);
      level1.stackUp(numToTest);
      level1.stackUp(blocks[j].vars[1]);

      tst.lesserEqualXY(level1)
      if (utils.isTruthy(utils.getX(level1))) return blocks[j].fI + blockOffsets[blocks[j].fT];
      break;
    }
  }
}