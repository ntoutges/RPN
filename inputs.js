import { level1 } from "./script.js";
import { commands, arrowCommands, commandTranslations } from "./commands.js";

const translations = {
  "+Enter": "\n"
}

window.addEventListener("keydown", e => {
  let key = e.key;
  let isPrintable = true;
  let translation = "";
  if (key.length != 1 || e.ctrlKey || e.altKey) {
    // order of [Shift][Ctrl][Alt]
    translation = translation = (e.shiftKey ? "+" : "") + (e.ctrlKey ? "^" : "") + (e.altKey ? "!" : "") + e.key;
    if (translation in translations) key = translations[translation];
    else isPrintable = false;
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