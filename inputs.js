import { level1 } from "./script.js";
import { commands, arrowCommands, commandTranslations } from "./commands/commands.js";
import * as value from "./value.js";

const translations = {
  "+Enter": "\n",

  "NumpadAdd": "add",
  "NumpadSubtract": "sub",
  "NumpadMultiply": "mul",
  "NumpadDivide": "div",
  "+^+": "add",
  "^+": "add",
  "^-": "sub",
  "+^*": "mul",
  "^*": "mul",
  "^/": "div",
  "+^^": "pow",
  "^^": "pow",
  "!-": "neg"
};

const hotkeys = {
  "add": () => { (new value.CommandValue("+")).execute(level1); },
  "sub": () => { (new value.CommandValue("-")).execute(level1); },
  "mul": () => { (new value.CommandValue("*")).execute(level1); },
  "div": () => { (new value.CommandValue("/")).execute(level1); },
  "pow": () => { (new value.CommandValue("^")).execute(level1); },
  "neg": () => { new value.CommandValue("neg").execute(level1); }
}

window.addEventListener("keydown", e => {
  let key = e.key;
  let isPrintable = true;
  let translation = "";

  if (e.code in translations) key = translations[e.code];
  else if (key.length != 1 || e.ctrlKey || e.altKey) {
    // order of [Shift][Ctrl][Alt]
    translation = (e.shiftKey ? "+" : "") + (e.ctrlKey ? "^" : "") + (e.altKey ? "!" : "") + key;
    if (translation in translations) key = translations[translation];
    else isPrintable = false;
  }

  if (key in hotkeys) {
    hotkeys[key]();
    e.preventDefault();
    return;
  }

  if (isPrintable) { level1.addChar(key); }
  else runCommand(translation);
});

function runCommand(command) {
  let sRC = "~" + command; // System RPL command
  if (sRC in commandTranslations) sRC = commandTranslations[sRC];
  if (sRC in commands) {
    try {
      commands[sRC](level1);
    }
    catch(err) {
      console.error(err);
    }
  }
  else if (sRC in arrowCommands) { arrowCommands[sRC](level1); }
  else {
    console.log("INVALID COMMAND: ", command);
  }
}