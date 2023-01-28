import * as values from "../value.js";
import * as ops from "./operations.js";
import * as mth from "./math.js";
import * as prg from "./program.js";
import * as ess from "./essentials.js";
import * as tst from "./test.js";
import * as kwd from "./keywords.js";


export const commandTranslations = {
  "~+Backspace": "~Backspace",
  "~^Backspace": "~Backspace",
  "~+^Backspace": "~Backspace"
}

export const commands = {
  // System RPL commands
  "~Enter": level1 => { level1.enter(); }, // push current line to stack
  "~Escape": ess.escape, // stop focus on this line
  "~Backspace": level1 => { level1.delete(); }, // remove current character or remove current level of stack

  "~^a": ess.selectAll,
  "~^c": ess.copy,
  "~^v": ess.paste,

  
  "+": ops.addXY,
  "-": ops.subXY,
  "*": ops.mulXY,
  "/": ops.divXY,
  "^": ops.powXY,
  "%": mth.percentXY,
  "!": mth.factorialX,

  "NEG": ops.negX,
  "INV": ops.invX,
  
  "SWAP": prg.swapXY,

  "DUP": prg.dupX,
  "DUP2": prg.dupXY,

  "STO": prg.stoX,
  "RCL": prg.rclX,
  "GET": prg.getXY,
  "PURGE": prg.purgeX,

  "EVAL": prg.evalX,
  "=": tst.equalsXY,
  ">": tst.greaterXY,
  "<": tst.lesserXY,

  "THEN": prg.thenX,
  "ELSE": prg.else_,
  "FOR": prg.forXY,
  "NEXT": prg.next_,
  "STEP": prg.stepX
}

for (const keyword of kwd.keywords) {
  commands[keyword] = ess.KEYWORD;
}

export const arrowCommands = {
  "~ArrowLeft": level1 => { level1.moveCursor(-1); },
  "~ArrowRight": level1 => { level1.moveCursor(1); },
  "~^ArrowLeft": level1 => { level1.moveCursor(-Infinity); },
  "~^ArrowRight": level1 => { level1.moveCursor(Infinity); },
  "~+ArrowLeft": level1 => { level1.moveHighlight(-1); },
  "~+ArrowRight": level1 => { level1.moveHighlight(1); },
  "~+^ArrowLeft": level1 => { level1.moveHighlight(-Infinity); },
  "~+^ArrowRight": level1 => { level1.moveHighlight(Infinity); }
}
