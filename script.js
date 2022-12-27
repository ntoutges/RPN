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
    this.column = 0;
    this.column2 = -2;
    this.windowLeft = 0;
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
    this.column2 = -2; // indicates the left cursor
    this.windowLeft = 0;
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

    /// DEBUG
    toRender = toRender.concat(":", this.value.type.toString().split(""))
    /// END DEBUG

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
    let invertLeft = Math.min(this.column2,this.column);
    let invertRight = Math.max(this.column2,this.column);

    
    if (this.windowLeft == -1 && this.column2 != -1 && this.column != -1) this.windowLeft = 0;
    
    let windowLeft = this.windowLeft
    let windowRight = windowLeft+21;

    if (this.cursor > 0) {
      if (this.column2 != -2) {
        // add in highlight cursors
        toRender.splice(invertRight, 1, "<=");
        if (invertLeft != -1) toRender.splice(invertLeft, 1, "=>");
      }
      else toRender.splice(this.column, 1, "<="); // add in cursor
    }
    else if (invertLeft == -1) toRender.splice(0,0, " "); // for spacing reasons

    let drawAll = false; // indicate whether or not to redraw line
    if (this.value.chars.length+1 >= 22) { // cut off what cannot be shown on the screen, and add ellipsis to the left to indicate the cut
      this.clearLine(); // all numbers will be shifted, so line must be cleared before it can be redrawn
      if (this.value.chars.length+1 > 22) { // only want ellipsis if all cannot be drawn
        const leftOverflow = this.windowLeft > 0 && ((invertLeft != this.windowLeft && invertRight != this.windowLeft) || this.cursor <= 0);
        const rightOverflow = windowRight+1 < this.value.chars.length && ((invertLeft != windowRight && invertRight != windowRight) || this.cursor <= 0); 

        if (leftOverflow && rightOverflow) toRender = ["..."].concat(toRender.slice(windowLeft+1, windowRight), "...");
        else if (rightOverflow) toRender = toRender.slice(windowLeft,windowRight).concat("...");
        else if (leftOverflow) toRender = ["..."].concat(toRender.slice(windowLeft+1, windowRight+2));
        else toRender = toRender.slice(windowLeft,windowRight+1);
      }
      drawAll = true;
    }

    if (invertLeft != -2) this.ctx.rect((invertLeft-this.windowLeft)*6+5,0, 1,10); // fill left slice of character
    for (let i = drawAll ? 0 : 0; i < toRender.length; i++) {
      const char = characters[toRender[i]];
      this.renderAt(char, i*6, (invertLeft != -2 && i > invertLeft-this.windowLeft && i < invertRight-this.windowLeft));
    }
  }

  renderAt(char, baseX, invert) {
    for (let x = 0; x < 5; x++) { // characters are 5px wide
      const offX = baseX+x;
      for (let y = 0; y < char.length; y++) { // characters are (9/10)px tall
        if (char[y][x] != " " ^ invert) {
          this.ctx.rect(offX, y, 1,1);
        }
      }
    }
    if (invert) {
      this.ctx.rect(baseX+5,0, 1,10); // fill gap with inversion
      if (char.length != 10) { // not a character that goes to the bottom
        this.ctx.rect(baseX,9,6,1); // fill bottom part of character
      }
    }
    // this.ctx.fillStyle = "#2222" + Math.floor(16 + Math.random() * 239).toString(16)
    // this.ctx.fill();
  }
  runCursor(step=10) {
    if (this.isSolid) return;

    this.cursor -= step;

    let updateCursor = false;
    if (this.cursor <= -50) {
      this.cursor = 50;
      updateCursor = true;
    }
    else if (this.cursor < 0 && this.cursor + step >= 0) updateCursor = true;

    if (updateCursor) {
      // this.ctx.clearRect(this.column*6,0, 6,10.1);
      this.clearLine();
      this.render();
    }
  }

  clearLine() { this.ctx.clearRect(0,0, this.width, 10.1); } // clears whatever has been written to the screen
  clearLineEnd(added=0) { this.ctx.clearRect(this.column*6,0, added+(this.value.chars.length-this.column)*6,10.1); } // clear after [this.column]
  clear() {
    this.column = 0;
    this.windowLeft = 0;
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
    this.removeHighlighted();
    super.addChar(char, this.column);
    // this.clearLineEnd(11); // TODO: figure out why this doesn't work
    this.clearLine();
    this.column++;
    this.windowLeft = Math.max(this.column-21, this.windowLeft); // only move [windowLeft] if [column] goes past the right window bound
    this.cursor = 50;
    this.render();
  }
  popChar() {
    if (this.removeHighlighted()) return; // don't pop another character after removing highlighed characters
    if (!super.popChar(this.column)) return;
    this.column--;

    if (this.column-20 == this.windowLeft) this.windowLeft = Math.max(0, this.column-21); // cursor is at far right, so keep it there
    else this.windowLeft = Math.min(this.column, this.windowLeft); // cursor is not at right, so move window normally
    this.clearLineEnd(11) // erase this character, and the pointer
    this.cursor = 50;
    this.render();
  }
  removeHighlighted() {
    if (this.column2 == -2) return false; // none highlighed
    const leftBound = Math.min(this.column2, this.column)+1;
    const rightBound = Math.max(this.column2, this.column);

    const deleteCount = rightBound - leftBound;
    this.value.chars.splice(leftBound, deleteCount); // remove highlighed characters
    
    if (this.column2 > this.column) this.column2 -= deleteCount;

    this.moveEdit(-1); // remove highlight
    return true;
  }
  
  stackUp(newValue=new Value([]), render=true) {
    super.stackUp(newValue);
    if (render) {
      this.clearLine();
      this.render();
    }
  }
  stackDown(render=true) {
    const val = super.stackDown();
    if (render) {
      this.clearLine();
      this.render();
    }
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
    if (!this.isSolid) { this.clearLine(); }

    // standard operation
    if (this.column2 == -2) this.column = Math.min(Math.max(this.column+step, 0), this.value.chars.length); // constrain column to valid values
    // exiting highlight state, and move to column2 if [step] is in that direction
    else if (this.column2 < this.column && step < 0) this.column = this.column2 + 1;
    else if (this.column2 > this.column) {
      if (step > 0) this.column = this.column2;
      else this.column += 1;
    }
    else this.column = Math.max(this.column, 0); // ensure this value not less than 0
    this.windowLeft = Math.min(Math.max(this.windowLeft, this.column-21), this.column); // only move [windowLeft] if [column] goes past the left/right bounds
    this.column2 = -2;
    this.cursor = 50;
    this.render();
  }

  moveHighlight(step) {
    if (!this.isSolid) { this.clearLine(); }
    
    if (this.column2 == -2) {
      if (step < 0) this.column2 = this.column - 1;
      if (step > 0) {
        this.column--;
        this.column2 = this.column + 1;
      }
    }
    this.cursor = 50;
    this.column2 = Math.min(Math.max(this.column2+step, -1), this.value.chars.length); // constrain column2 to valid values
    this.windowLeft = Math.max(Math.min(this.windowLeft, this.column2), this.column2-21, 0); // only move [windowLeft] if [column2] goes past the left/right bounds
    
    if (Math.abs(this.column2 - this.column) == 1) this.moveEdit(1);
    else this.render();
  }

  copy() {
    if (this.column2 == -2) return "";
    const leftBound = Math.min(this.column2, this.column)+1;
    const rightBound = Math.max(this.column2, this.column);
    return this.value.chars.slice(leftBound, rightBound).join("");
  }
  cut() {
    const text = this.copy();
    this.removeHighlighted();
    return text;
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

  if (event.keyCode == 37) {
    if (event.shiftKey) level1.moveHighlight(event.ctrlKey ? Infinity : -1)
    else level1.moveEdit(event.ctrlKey ? -Infinity : -1);
  }
  else if (event.keyCode == 39) {
    if (event.shiftKey) level1.moveHighlight(event.ctrlKey ? Infinity : 1)
    else level1.moveEdit(event.ctrlKey ? Infinity : 1);
  }

  else if (event.ctrlKey) {
    if (event.keyCode == 65) { // ctrl-a
      event.preventDefault();
      level1.moveEdit(-Infinity);
      level1.moveHighlight(Infinity);
    }
    else if (event.keyCode == 67) { // ctrl-c
      event.preventDefault();
      navigator.clipboard.writeText(level1.copy())
    }
    else if (event.keyCode == 88) { // ctrl-x
      event.preventDefault();
      navigator.clipboard.writeText(level1.cut());
    }
  }
});

setInterval(() => {
  level1.runCursor(9);
}, 100)

// note to self: try to use ctrl/alt as modifier keys