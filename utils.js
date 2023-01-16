import pairs from "./pairs.js";

export function charsToString(chars) {
  let str = "";
    let workingChar = null;
    let workingRepeats = 0;
    for (let i = 0; i < chars.length+1; i++) {
      const char = (i < chars.length) ? chars[i] : null;
      if (char != workingChar) {
        if (workingChar != null) {
          const workingRepeatsHex = workingRepeats.toString(16);
          const escapeSequence = "\x18#" + workingRepeatsHex + "\x18";
          const escapedChar = (workingChar.length != 1) ? `\x18$${workingChar}\x18` : workingChar; // this 'character' is represented by multiple characters
          
          if (workingRepeats < escapeSequence.length+1) for (let i = 0; i < workingRepeats; i++) str += escapedChar;
          else str += escapeSequence + escapedChar;
        }

        workingRepeats = 0;
        workingChar = char;
      }
      
      workingRepeats++;
    }
    return str;
}

export function charsFromString(string) {
  const chars = [];
    
  let repeats = 1;
  let workingChar = "";
  
  for (let i = 0; i < string.length; i++) {
    if (string[i] == "\x18") {
      const substring = string.substring(i+2);
      const endI = substring.indexOf("\x18");
      const data = substring.substring(0,endI);
      switch(string[i+1]) {
        case "#":
          repeats = (endI == -1 || isNaN(parseInt(data, 16))) ? 1 : parseInt(data, 16);
          break;
        case "$":
          workingChar = data;
          break;
      }  
      i += 2 + endI;
    }
    else workingChar = string[i]
    
    if (workingChar.length != 0) {
      for (let i = 0; i < repeats; i++) { chars.push(workingChar); }
      repeats = 1;
      workingChar = "";
    }
  }
  return chars;
}

export function separateLines(chars) {
  // if input should be put on multiple levels of the stack, separate
  const lines = [];
  let line = [];
  let pairEndings = []; // stores the characters that will close these pairs
  let separatingActive = true;
  for (let char of chars) {
    if (pairEndings.length == 0 && (char == " " || char == "," || char == "\n")) { // skip adding any seperator characters to line
      if (line.length != 0) lines.push(line);
      line = [];
      continue;
    }
    line.push(char);
    
    if (
      separatingActive
      && (pairEndings.length == 0 || (pairEndings.length > 0 && pairEndings[pairEndings.length-1] != char))
      && char in pairs.start
    ) {
      if (pairEndings.length == 0 && line.length > 1) { // turn 1{2} => 1 {2}; (essentially)
        const pairStart = line[line.length-1];
        lines.push(line.slice(0,line.length-1));
        line = [pairStart];
      }
      pairEndings.push(pairs.start[char]);
      if (!pairs.doNest[char]) separatingActive = false;
    }
    else if (pairEndings.length > 0 && char == pairEndings[pairEndings.length-1]) {
      pairEndings.pop();
      if (pairEndings.length == 0) {
        lines.push(line);
        line = [];
      }
      separatingActive = true;
    }
  }
  for (let i = pairEndings.length-1; i >= 0; i--) {
    line.push(pairEndings[i])
  }
  if (line.length != 0) lines.push(line);
  return lines;
}