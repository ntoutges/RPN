const $ = window.$;

import characters from "./graphics.js";
import commands from "./commands.js";
import types from "./dataTypes.js";
import pairs from "./pairs.js";
import { buildVal, Value } from "./value.js"

const levelHeight = 40;
var level1 = null;

class ILevel { // the InfiniLevel -- allows for unlimited stack expansion
  constructor(nextLevel) {
    this.value = new Value([]); // what is shown to the user
    this.next = nextLevel;
    this.isReal = false; // doesn't occupy screen space

    this.isSolid = true;
  }

  delete() {
    if (this.isSolid) this.stackDown();
    else this.popChar();
  }
  enter() {
    if (this.value.chars.length == 0) this.clearHole(); // eliminate this hole in the stack
    else if (!this.isSolid) this.solidify(); // don't push stack up; instead solifiy this stack level 
    else this.duplicate(); // value is solid, and there is a value to be copied
  }

  handleInput(char) {
    if (char == "Enter") return this.enter();
    else if (!this.isWithinPairs(this.column) && (char in commands)) {
      try { this.execute(char); }
      catch(err) {
        console.log(err);
      }
    }
    else this.addChar(char);
  }

  setChars(chars) {
    this.clear();
    this.value.chars = chars;
  }
  addChar(char, index=this.value.chars.length) {
    if (this.isSolid) this.liquify(); // don't try to edit a solidified line

    if (char in characters) this.value.chars.splice(index,0, char);
    else this.value.chars.splice(index,0, "unknown");
  }
  popChar(index=this.value.chars.length) {
    if (this.column == 0) return false; // unable to pop value
    this.value.chars.splice(index-1,1);
    return true; // able to pop value
  }
  clear() { this.value = new Value([]); }
  getChars() { return this.value.chars; }
  stackUp(newValue=new Value([])) {
    if (this.value.chars.length != 0) {
      if (this.next == null) this.next = new ILevel(null); // expand stack if necessary
      this.next.stackUp(this.value);
    }
    this.value = newValue;
  }
  stackDown() {
    const oldValue = this.value;
    if (this.next == null) { this.clear(); }
    else {
      this.value = this.next.value;
      this.next.stackDown();
      if (this.next.getChars().length == 0 && !this.next.isReal) this.next = null; // delete stack above this point, as it is empty
    }
    return oldValue;
  }
  clearHole() {
    this.stackDown();
    this.solidify();
  }
  duplicate() { this.stackUp( this.value ); } // works because values are immutable

  // these are mainly so the sub-class has a notification as to when the level state changse
  solidify() {
    let lines = [];
    
    try { lines = this.separateLines(); }
    catch (err) {
      console.log(err);
    }
    if (lines.length == 0) { lines.push([]); } // ensure that the line will always be updated
    
    for (let i in lines) {
      try { this.value = buildVal(lines[i]); }
      catch (err) {
        console.log(err);
        break;
      }

      this.isSolid = true;

      if (this.value.type == types.command) {
        const commandVal = this.stackDown().value; // take command off stack
        this.execute(commandVal);
      }
      
      if (i != lines.length-1) this.stackUp();
    }
  }
  liquify() {
    this.stackUp(); // get rid of whatever is on the current level, so it doesn't interfere
    this.isSolid = false;
  }

  execute(commandVal) {
    if (!this.isSolid) this.solidify();
    commands[commandVal].call(this);
  }

  isWithinPairs(index=this.value.chars.length) {
    let pairEnding = null;
    for (let i = 0; i < index; i++) { // encountered line start
      const char = this.value.chars[i];
      if (pairEnding == null && char in pairs.start) pairEnding = pairs.start[char]; // detect character opening up pair
      else if (char == pairEnding) pairEnding = null; // detect character closing pair
    }
    return pairEnding != null;
  }

  separateLines() {
    // if input should be put on multiple levels of the stack, separate
    const lines = [];
    let line = [];
    let pairEnding = null; // stores the character that will close this pair
    for (let char of this.value.chars) {
      if (pairEnding == null && (char == " " || char == "," || char == "\n")) { // skip adding any seperator characters to line
        if (line.length != 0) lines.push(line);
        line = [];
        continue;
      }
      line.push(char);
      
      if (pairEnding == null && char in pairs.start) pairEnding = pairs.start[char];
      else if (char == pairEnding) {
        pairEnding = null;
        lines.push(line);
        line = [];
      }
    }
    if (pairEnding != null) line.push(pairEnding);
    if (line.length != 0) lines.push(line);
    return lines;
  }
}

class Level extends ILevel {
  constructor(element, nextLevel, depth) {
    const canvas = $(`<canvas height=\"${element.height()}\" width=\"${element.width()}\">`)
    element.append(canvas);

    super(nextLevel);
    
    this.isReal = true; // occupies screen space
    this.column = 0;
    this.el = element;
    this.ctx = canvas.get(0).getContext("2d");
    this.cursor = 50; // timeout for when cursor disappears

    const xScale = 5
    const yScale = element.height() / 10.1;

    this.ctx.scale(xScale, yScale);
    this.width = canvas.get(0).width / xScale;
    this.depth = depth;
  }

  render() {
    this.ctx.beginPath();

    // different modes of rendering depending on input method
    if (this.isSolid) this.renderSolid();
    else              this.renderLiquid();
    // this.column = this.value.chars.length;
    this.ctx.fill();
  }

  renderSolid() {
    let toRenderDepth = this.depth.toString().split("").concat(":");
    let toRender = this.value.chars;
    let spacing = 22 - toRender.length;

    if (toRender.length > 21 - toRenderDepth.length) {
      toRender = toRender.slice(0,20 - toRenderDepth.length).concat("...");
      spacing = toRenderDepth.length + 1;
    }

    for (let i in toRenderDepth) {
      const char = characters[toRenderDepth[i]];
      this.renderAt(char, i*6);
    }

    for (let i = 0; i < toRender.length; i++) {
      const char = characters[toRender[i]];
      const baseX = (i + spacing)*6; // 5px wide + 1px spacing
      this.renderAt(char, baseX);
    }
  }

  renderLiquid() {
    let toRender = this.value.chars.concat(); // make copy of this.value
    if (this.cursor > 0) toRender.splice(this.column, 1, "<="); // add in cursor

    let drawAll = false; // indicate whether or not to redraw line
    if (toRender.length >= 22) { // cut off what cannot be shown on the screen, and add ellipsis to the left to indicate the cut
      this.clearLine(); // all numbers will be shifted, so line must be cleared before it can be redrawn
      if (toRender.length > 22) toRender = ["..."].concat(toRender.slice(-21)); // only want ellipsis if all cannot be drawn
      drawAll = true;
    }

    for (let i = drawAll ? 0 : 0; i < toRender.length; i++) {
      const char = characters[toRender[i]];
      this.renderAt(char, i*6);
    }
  }

  renderAt(char, baseX) {
    for (let x = 0; x < 5; x++) { // characters are 5px wide
      const offX = baseX+x;
      for (let y = 0; y < char.length; y++) { // characters are (9/10)px tall
        if (char[y][x] != " ") {
          this.ctx.rect(offX, y, 1,1);
        }
      }
    }
  }
  runCursor(step=10) {
    this.cursor -= step;

    let updateCursor = false;
    if (this.cursor <= -50) {
      this.cursor = 50;
      updateCursor = true;
    }
    else if (this.cursor < 0 && this.cursor + step >= 0) updateCursor = true;

    if (updateCursor) {
      this.ctx.clearRect(this.column*6,0, 6,10.1);
      this.render();
    }
  }

  clearLine() { this.ctx.clearRect(0,0, this.width, 10.1); } // clears whatever has been written to the screen
  clearLineEnd(added=0) { this.ctx.clearRect(this.column*6,0, added+(this.value.chars.length-this.column)*6,10.1); } // clear after [this.column]
  clear() {
    this.column = 0;
    this.editingAt = 0;
    this.clearLine()
    super.clear();
    this.render();
  }
  setChars(chars) {
    super.setChars(chars)
    this.render();
  }
  addChar(char) {
    super.addChar(char, this.column);
    this.clearLineEnd()
    this.column++;
    this.cursor = 50;
    this.render();
  }
  popChar() {
    if (!super.popChar(this.column)) return;
    this.column--;
    this.clearLineEnd(11) // erase this character, and the pointer
    this.cursor = 50;
    this.render();
  }
  
  stackUp(newValue=new Value([])) {
    super.stackUp(newValue);
    this.clearLine();
    this.render();
  }
  stackDown() {
    const val = super.stackDown();
    this.clearLine();
    this.render();
    return val;
  }
  
  solidify() {
    this.column = 0;
    this.clearLine();
    super.solidify();
    this.render();
  }
  liquify() {
    this.column = 0;
    super.liquify();
    this.clearLine();
    this.cursor = 50;
    this.render();
  }

  moveEdit(step) {
    if (!this.isSolid) {
      this.clearLine();
    }

    this.column = Math.min(Math.max(this.column+step, 0), this.value.chars.length); // constrain column to valid values
    this.cursor = 50;
    this.render();
  }
}

generateLevels(8);

function generateLevels(count) {
  const levelsContainer = $("#level-holder");

  let nextLevel = null;
  for (let i = count; i > 0; i--) { // generate highest level first
    const level = $(`<div class=\"levels\" data-level=\"${i}\" style=\"height:${levelHeight}px\">`);
    levelsContainer.append(level);
    nextLevel = new Level(level, nextLevel, i); // turns each level into an element in a linked list

    nextLevel.render();
  }

  level1 = nextLevel; // 'nextLevel' will always be the last level generated, thus the lowest, thus the first
}

// update screen
// setInterval(() => level1.render(), 100);


// handle key presses
$("body").keypress((event) => {
  if (event.key == "Enter" && event.shiftKey) return level1.handleInput("\n");
  level1.handleInput(event.key);
});

$("body").keydown((event) => {
  if (event.keyCode == 8) level1.delete();
  else if (event.ctrlKey && event.keyCode == 86) navigator.clipboard.readText().then(text => {
    for (let char of text) {
      level1.handleInput(char);
    } 
  });

  if (event.keyCode == 37) { level1.moveEdit(event.ctrlKey ? -Infinity : -1); }
  else if (event.keyCode == 39) { level1.moveEdit(event.ctrlKey ? Infinity : 1); }
});

setInterval(() => {
  level1.runCursor(9);
}, 100)

// note to self: try to use ctrl/alt as modifier keys