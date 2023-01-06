import { Value } from "./value.js";
import types from "./dataTypes.js";
import { level1 } from "./script.js";

var allVars = {};

export const commandTranslations = {
  "~+Backspace": "~Backspace",
  "~^Backspace": "~Backspace",
  "~+^Backspace": "~Backspace"
}

export const commands = {
  // System RPL commands
  "~Enter": level1 => {
    if (level1.isSolid) level1.stackUp( level1.value ); // duplicate value on stack
    else level1.solidify(); // push written value to stack
  }, // push current line to stack
  "~Escape": level1 => { // stop focus on this line
    if (level1.isSolid) return;
    level1.setChars([], false);
    level1.solidify(false);
    level1.stackDown(true);
  },
  "~Backspace": level1 => { // remove current character or remove current level of stack
    if (level1.isSolid) level1.stackDown();
    else level1.popChar();
  },

  "~^a": level1 => {
    level1.cursor = level1.value.chars.length;
    level1.moveHighlight(-level1.value.chars.length, false);
    level1.moveWindow(level1.cursor);
    level1.clearLine();
    level1.render();
  },
  "~^c": level1 => {
    navigator.clipboard.writeText(
      level1.charsToString(
        level1.getHighlightedText()
      )
    );
  },
  "~^v": level1 => {
    navigator.clipboard.readText().then(txt => {
      level1.addChars( level1.charsFromString(txt) );
    });
  },

  
  "+": (level1) =>  { level1.stackUp( level1.stackDown(false).add( level1.stackDown(false) ) ) },
  "-": (level1) => { level1.stackUp( level1.stackDown(false).sub( level1.stackDown(false) ) ) },
  "*": (level1) => { level1.stackUp( level1.stackDown(false).mul( level1.stackDown(false) ) ) },
  "/": (level1) => { level1.stackUp( level1.stackDown(false).div( level1.stackDown(false) ) ) },
  "^": (level1) => { level1.stackUp( level1.stackDown(false).pow( level1.stackDown(false) ) ) },
  
  
  // "swap": function() {
  //   const bottom = this.stackDown(false);
  //   const top = this.stackDown(false);
  //   this.stackUp(bottom);
  //   this.stackUp(top);
  // },

  // "sto": function() {
  //   const name = this.stackDown(false);
  //   const value = this.stackDown(false);
  //   allVars[name] = value;
  // },
  // 'rcl': function() {
  //   const name = this.stackDown(false);
  //   if (name in allVars) this.stackUp(allVars[name]);
  // },

  // "neg": function() {
  //   this.stackUp( this.stackDown(false).mul( new Value(["-", "1"], -1, types.number) ) )
  // },

  // "==": function() {
  //   this.stackUp( this.stackDown(false).equals( this.stackDown(false) ) )
  // }
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