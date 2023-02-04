import characters from "./graphics.js";
import { commands } from "./commands/commands.js";
import { types } from "./dataTypes.js";
import pairs from "./pairs.js";
import { buildVal, Value } from "./value.js"
import { charsToString, charsFromString, separateLines } from "./utils.js";

const CURSOR_FLASH_TIME = 700;
const CURSOR_BLINK_TIME = 100;
const CHARACTER_ASPECT_RATIO = 10 / 6 // y/x

var doRender = true; // all Levels will share this

const useSILevel = true;

const separators = " \n+-*/,";
const SEPARATORS = {};
for (const char of separators) { SEPARATORS[char] = true; }

const functs = [];
export function onRenderableChange(funct) { functs.push(funct); }

export function setRenderable(value=true) {
  const oldValue = doRender;
  doRender = value;
  if (value != oldValue) {
    functs.forEach(funct => funct(doRender));
  }
}

export class ILevel { // the InfiniLevel -- allows for unlimited stack expansion
  constructor(nextLevel, charsShown) {
    this.value = new Value([]); // what is shown to the user
    this.next = nextLevel;
    this.isReal = false; // doesn't occupy screen space
    this.charsShown = charsShown;
    
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

  setChars(chars) {
    this.clear();
    this.value.chars = chars;
  }
  addChar(char, index=this.value.chars.length) {
    if (this.isSolid) this.liquify(); // don't try to edit a solidified line

    if (char in characters) this.value.chars.splice(index,0, char);
    else this.value.chars.splice(index,0, "unknown");
  }
  addChars(chars, index=this.value.chars.length) {
    for (let i in chars) {
      this.addChar(chars[i], index, i == chars.length-1);
    }
  }
  popChar(index=this.value.chars.length) {
    if (this.cursor == 0) return false; // unable to pop value
    this.value.chars.splice(index-1,1);
    return true; // able to pop value
  }
  clear() { this.value = new Value([]); }
  getChars() { return this.value.chars; }
  stackUp(newValue=new Value([])) {
    if (this.value.chars.length != 0) {
      if (this.next == null) this.next = (useSILevel) ? new SILevel() : new ILevel(null); // expand stack if necessary
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
    
    try { lines = separateLines(this.value.chars); }
    catch (err) {
      console.log(err);
    }
    if (lines.length == 0) { lines.push([]); } // ensure that the line will always be updated
    
    this.isSolid = true;
    for (let i in lines) {
      try {
        const value = buildVal(lines[i]);
        if (value.type == types.command) {
          this.stackDown();
          value.execute(this);
        }
        else this.value = value;
      }
      catch (err) {
        console.log(err);
        break;
      }
      
      if (i != lines.length-1) this.stackUp();
    }
  }
  liquify() {
    this.stackUp(); // get rid of whatever is on the current level, so it doesn't interfere
    this.isSolid = false;
    this.cursor = 0;
    this.highlight = -2;
    this.windowLeft = 0;
  }

  execute(commandVal) {
    if (!this.isSolid) this.solidify();
    commands[commandVal](this);
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
}

export class SILevel { // the SuperInfiniLevel -- allows for unlimited stack expansion, beyond the limitations of the call stack
  constructor(charsShown) {
    this.isReal = false; // doesn't occupy screen space
    this.charsShown = charsShown;

    this.values = [new Value()];
    // if (nextLevel instanceof SILevel) { this.values = this.values.concat(nextLevel.values); }
    // else { this.values.push(nextLevel.value); }
    
    this.isSolid = true;
  }

  get value() { return (this.values.length > 0) ? this.values[this.values.length-1] : new Value(); } // what is shown to the user
  set value(newVal) { this.values[0] = newVal; }

  delete() {
    if (this.isSolid) this.stackDown();
    else this.popChar();
  }
  enter() {
    if (this.value.chars.length == 0) this.clearHole(); // eliminate this hole in the stack
    else if (!this.isSolid) this.solidify(); // don't push stack up; instead solifiy this stack level 
    else this.duplicate(); // value is solid, and there is a value to be copied
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
  addChars(chars, index=this.value.chars.length) {
    for (let i in chars) {
      this.addChar(chars[i], index, i == chars.length-1);
    }
  }
  popChar(index=this.value.chars.length) {
    if (this.cursor == 0) return false; // unable to pop value
    this.value.chars.splice(index-1,1);
    return true; // able to pop value
  }
  clear() { this.value = new Value([]); }
  getChars() { return this.value.chars; }
  stackUp(newValue=new Value([])) {
    if (this.value.chars.length == 0) this.value = newValue;
    else this.values.push(newValue);
  }
  stackDown() {
    const oldValue = this.value;
    this.values.pop();
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
    
    try { lines = separateLines(this.value.chars); }
    catch (err) {
      console.log(err);
    }
    if (lines.length == 0) { lines.push([]); } // ensure that the line will always be updated
    
    this.isSolid = true;
    for (let i in lines) {
      try {
        const value = buildVal(lines[i]);
        if (value.type == types.command) {
          this.stackDown();
          value.execute(this);
        }
        else this.value = value;
      }
      catch (err) {
        console.log(err);
        break;
      }
      
      if (i != lines.length-1) this.stackUp();
    }
  }
  liquify() {
    this.stackUp(); // get rid of whatever is on the current level, so it doesn't interfere
    this.isSolid = false;
    this.cursor = 0;
    this.highlight = -2;
    this.windowLeft = 0;
  }

  execute(commandVal) {
    if (!this.isSolid) this.solidify();
    commands[commandVal](this);
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
}

export class Level extends ILevel {
  constructor({
    element,
    nextLevel,
    depth,
    charsShown
  }) {
    const canvasWidth = element.height() / CHARACTER_ASPECT_RATIO * charsShown;

    const canvas = $(`<canvas height=\"${element.height()}\" width=\"${canvasWidth}\" class=\"level-screens\">`)
    element.append(canvas);

    super(nextLevel, charsShown);
    
    this.cursorType = [ "=<", "=>", 0 ];

    this.isReal = true; // occupies screen space
    this.cursor = 0;     // indicates the main cursor
    this.highlight = -2; // indicates the secondary cursor
    this.windowLeft = 0; 
    this.el = element;
    this.ctx = canvas.get(0).getContext("2d");
    
    this.cursorToggleTime = 0; // time for when cursor disappears
    this.cursorEN = true;

    const xScale = canvas.width() / (6 * charsShown);
    const yScale = canvas.height() / 10.1; // .1 used to get rid of annoying gaps

    this.ctx.scale(xScale, yScale);
    this.width = canvas.get(0).width / xScale;
    this.depth = depth;
  }

  renderRecursive() {
    this.render();
    if (this.next && this.next instanceof Level) this.next.renderRecursive();
  }
  
  render() {
    if (!doRender) return; // don't try to render
    this.ctx.beginPath();

    // different modes of rendering depending on input method
    if (this.isSolid) this.renderSolid();
    else              this.renderLiquid();
    // this.cursor = this.value.chars.length;
    this.ctx.fill();
  }

  renderSolid() {
    let toRenderDepth = this.depth.toString().split("").concat(":");
    let toRender = this.value.chars;
    
    /// DEBUG
    // toRender = toRender.concat(":", this.value.type.toString().split(""))
    /// END DEBUG

    let spacing = this.charsShown - toRender.length;

    if (toRender.length > this.charsShown - toRenderDepth.length-1) {
      toRender = toRender.slice(0,this.charsShown - toRenderDepth.length-2).concat("...");
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
    let invertLeft = Math.min(this.highlight,this.cursor);
    let invertRight = Math.max(this.highlight,this.cursor);

    if (this.windowLeft == -1 && this.highlight != -1 && this.cursor != -1) this.windowLeft = 0;
    if (this.windowLeft < 0) {
      const leftPad = [];
      for (let i = this.windowLeft; i < 0; i++) { leftPad.push(" "); }
      toRender = leftPad.concat(toRender);

      invertLeft -= this.windowLeft;
      invertRight -= this.windowLeft;
    }
    
    let windowLeft = Math.max(0, this.windowLeft)
    let windowRight = windowLeft+this.charsShown-1;

    if (this.cursorEN) {
      if (this.highlight != -2) {
        // add in highlight cursor
        toRender.splice(invertRight, 1, "=<");
        if (invertLeft >= 0) toRender.splice(invertLeft, 1, "=>");
      }
      else toRender.splice(this.cursor, 1, "=<"); // add in cursor
    }

    let drawAll = false; // indicate whether or not to redraw line
    if (this.value.chars.length+1 >= this.charsShown) { // cut off what cannot be shown on the screen, and add ellipsis to the left to indicate the cut
      this.clearLine(); // all numbers will be shifted, so line must be cleared before it can be redrawn
      if (this.value.chars.length+1 > this.charsShown) { // only want ellipsis if all cannot be drawn
        const min = (this.highlight == -2) ? this.cursor : Math.min(this.cursor, this.highlight);
        const max = (this.highlight == -2) ? this.cursor : Math.max(this.cursor, this.highlight);

        const leftOverflow = windowLeft > 0 && (min != windowLeft || !this.cursorEN);
        const rightOverflow = windowRight+1 < this.value.chars.length && (max != windowRight || !this.cursorEN); 

        if (leftOverflow && rightOverflow) toRender = ["..."].concat(toRender.slice(windowLeft+1, windowRight), "...");
        else if (rightOverflow) toRender = toRender.slice(windowLeft,windowRight).concat("...");
        else if (leftOverflow) toRender = ["..."].concat(toRender.slice(windowLeft+1, windowRight+2));
        else toRender = toRender.slice(windowLeft,windowRight+1);
      }
      drawAll = true;
    }

    if (invertLeft != -2) this.ctx.rect((invertLeft-windowLeft)*6+5,0, 1,10); // fill left slice of character
    for (let i = drawAll ? 0 : 0; i < toRender.length; i++) {
      const char = characters[toRender[i]];
      this.renderAt(char, i*6, (invertLeft != -2 && i > invertLeft-windowLeft && i < invertRight-windowLeft));
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
  runCursor() {
    if (this.isSolid) return;

    const date = (new Date).getTime();
    if (date > this.cursorToggleTime) {
      this.cursorToggleTime = date + CURSOR_FLASH_TIME;
      this.cursorEN = !this.cursorEN;
      
      this.clearLine();
      this.render();
    }
  }
  showCursor(blink=false) {
    if (this.isSolid) return;
    
    this.cursorEN = !blink;
    const date = (new Date).getTime();
    if (blink) this.cursorToggleTime = date + CURSOR_BLINK_TIME;
    else this.cursorToggleTime = date + CURSOR_FLASH_TIME;

    // this.clearLine();
    // this.render();
  }

  clearLine() { this.ctx.clearRect(0,0, this.width, 10.1); } // clears whatever has been written to the screen
  clearLineEnd(added=0) { this.ctx.clearRect(this.cursor*6,0, added+(this.value.chars.length-this.cursor)*6,10.1); } // clear after [this.cursor]
  clear() {
    this.cursor = 0;
    this.windowLeft = 0;
    this.editingAt = 0;
    this.clearLine()
    super.clear();
    this.render();
  }
  setChars(chars, render=true) {
    super.setChars(chars)

    if (!render) return;
    this.clearLine();
    this.render();
  }
  addChar(char, _, render=true) {
    this.removeHighlighted();
    super.addChar(char, this.cursor);
    // this.clearLineEnd(11); // TODO: figure out why this doesn't work
    this.cursor++;
    this.windowLeft = Math.max(this.cursor-this.charsShown+1, this.windowLeft); // only move [windowLeft] if [cursor] goes past the right window bound
    
    if (render) {
      this.showCursor()
      this.clearLine();
      this.render();
    }
  }
  popChar() {
    if (this.removeHighlighted()) {
      this.moveCursor(-1);
      return; // don't pop another character after removing highlighed characters
    }
    if (!super.popChar(this.cursor)) return;
    this.moveCursor(-1);

    if (this.cursor-this.charsShown+2 == this.windowLeft) this.windowLeft = Math.max(0, this.cursor-this.charsShown+1); // cursor is at far right, so keep it there
    else this.windowLeft = Math.min(this.cursor, this.windowLeft); // cursor is not at right, so move window normally
    this.clearLine();
    this.render();
  }
  removeHighlighted() {
    if (this.highlight == -2) return false; // none highlighed
    const leftBound = Math.min(this.highlight, this.cursor)+1;
    const rightBound = Math.max(this.highlight, this.cursor);

    const deleteCount = rightBound - leftBound;
    this.value.chars.splice(leftBound, deleteCount); // remove highlighed characters
    
    if (this.highlight > this.cursor) this.highlight -= deleteCount;

    this.moveCursor(-1); // remove highlight
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
  
  solidify(render=true) {
    this.cursor = 0;
    super.solidify();
    if (!render) return;
    this.clearLine();
    this.render();
  }
  liquify(render=true) {
    this.cursor = 0;
    super.liquify();
    if (!render) return;
    this.showCursor();
    this.clearLine();
    this.render();
  }

  moveCursor(step, render=true) {
    if (step != 0 && this.highlight > -2) {
      this.removeHighlight(step, render);
      this.moveCursor(0);
      return;
    }

    if (!Number.isFinite(step)) {
      const finiteStep = Math.sign(step);
      let oldCursor = this.cursor;
      this.cursor += finiteStep;
      // this.reRenderChar(oldCursor + this.cursorType[2]);
      this.moveCursor(0, render);
      if (this.cursor == 0) return;

      const spaceInvert = this.value.chars[this.cursor] in SEPARATORS;
      while (oldCursor != this.cursor && this.cursor >= 0 && this.cursor < this.value.chars.length) {
        oldCursor = this.cursor;
        this.cursor += finiteStep;
        if (spaceInvert ^ this.value.chars[this.cursor] in SEPARATORS) { break; }
      }
      // this.moveCursor(-finiteStep);
      if (step < 0) this.cursor++;
      this.moveCursor(0);
      return;
    }
    
    // const oldCursor = this.cursor;
    this.cursor += step;

    if (this.highlight == -2 && this.cursor < 0) this.cursor = 0;
    else if (this.highlight != -2 && this.cursor < -1) this.cursor = -1;
    else if (this.highlight == -2 && this.cursor < -1) this.cursor = -1;
    else if (this.cursor >= this.value.chars.length) this.cursor = this.value.chars.length;

    // this.reRenderChar(oldCursor + this.cursorType[2]);
    // if (oldCursor != this.cursor) {
    //   this.reRenderChar(this.cursor + this.cursorType[2]);
    // }
    this.showCursor();
    this.moveWindow(this.cursor);

    if (render) {
      this.clearLine();
      this.render();
    }
  }

  moveHighlight(step, render=true) {
    // const oldHighlight = this.highlight;
    
    if (this.highlight == -2 && step == 0) return;
    if (this.highlight == -2) {
      this.highlight = -3;
      if (step > 0) {
        this.moveCursor(-2, render);
        this.highlight = this.cursor + 1;
      }
      else { this.highlight = this.cursor - 1; }
    }

    if (!Number.isFinite(step)) {
      const finiteStep = Math.sign(step);
      let oldHighlight = this.highlight;
      this.highlight += finiteStep;
      if (this.highlight == -2) this.highlight = -1;
      // this.reRenderChar(oldHighlight - this.cursorType[2]);

      const spaceInvert = this.value.chars[this.highlight] in SEPARATORS;
      while (oldHighlight != this.highlight && this.highlight > -1 && this.highlight <= this.value.chars.length) {
        oldHighlight = this.highlight;
        this.highlight += finiteStep;
        if (spaceInvert ^ this.value.chars[this.highlight] in SEPARATORS) { break; }
      }
      this.moveHighlight(0, render);
      return;
    }

    this.highlight += step;
    if (this.highlight < -1) this.highlight = -1;
    else if (this.highlight > this.value.chars.length) this.highlight = this.value.chars.length;
    
    if (Math.abs(this.cursor - this.highlight) <= 1) {
      this.cursor -= 2 * Math.sign(step);
      this.highlight += 2 * Math.sign(step);
    }

    this.showCursor();

    // this.reRenderChar(oldHighlight - this.cursorType[2])
    // if (oldHighlight != this.highlight) {
    //   this.reRenderChar(this.highlight - this.cursorType[2]);
    // }
    // this.moveCursor(0);
    this.moveWindow(this.highlight);

    if (render) {
      this.clearLine();
      this.render();
    }
  }

  removeHighlight(step=0, render=true) {
    const oldHighlight = this.highlight;
    this.highlight = -2;
    
    if (step == 0) return;

    this.cursor = (step > 0) ? Math.max(oldHighlight, this.cursor) : Math.min(oldHighlight, this.cursor) + 2;

    if (render) {
      this.clearLine();
      this.render();
    }
  }
  moveWindow(focus) {
    let doBlink = false;
    if (focus < this.windowLeft) {
      this.windowLeft = focus;
      doBlink = true;
    }
    else if (focus - this.charsShown >= this.windowLeft) {
      this.windowLeft = Math.min(focus, this.value.chars.length) - this.charsShown + 1;
      doBlink = true;
    }
    else if (focus <= 0) doBlink = true;

    if (doBlink) this.showCursor(true);
  }

  // moveEdit(step) {
  //   if (!this.isSolid) { this.clearLine(); }

  //   // standard operation
  //   if (this.highlight == -2) this.cursor = Math.min(Math.max(this.cursor+step, 0), this.value.chars.length); // constrain cursor to valid values
  //   // exiting highlight state, and move to highlight if [step] is in that direction
  //   else if (this.highlight < this.cursor && step < 0) this.cursor = this.highlight + 1;
  //   else if (this.highlight > this.cursor) {
  //     if (step > 0) this.cursor = this.highlight;
  //     else this.cursor += 1;
  //   }
  //   else this.cursor = Math.max(this.cursor, 0); // ensure this value not less than 0
  //   this.windowLeft = Math.min(Math.max(this.windowLeft, this.cursor-21), this.cursor); // only move [windowLeft] if [cursor] goes past the left/right bounds
  //   this.highlight = -2;
  //   this.cursorToggleTime = 50;
  //   this.render();
  // }

  // moveHighlight(step) {
  //   if (!this.isSolid) { this.clearLine(); }
    
  //   if (this.highlight == -2) {
  //     if (step < 0) this.highlight = this.cursor - 1;
  //     if (step > 0) {
  //       this.cursor--;
  //       this.highlight = this.cursor + 1;
  //     }
  //   }
  //   this.cursorToggleTime = 50;
  //   this.highlight = Math.min(Math.max(this.highlight+step, -1), this.value.chars.length); // constrain highlight to valid values
  //   this.windowLeft = Math.max(Math.min(this.windowLeft, this.highlight), this.highlight-21, 0); // only move [windowLeft] if [highlight] goes past the left/right bounds
    
  //   if (Math.abs(this.highlight - this.cursor) == 1) this.moveEdit(1);
  //   else this.render();
  // }

  getHighlightedText() {
    if (this.highlight == -2) return [this.value.chars[Math.max(this.cursor-1, 0)]]
    const min = Math.min(this.cursor, this.highlight);
    const max = Math.max(this.cursor, this.highlight);
    return this.value.chars.slice(min+1,max);
  }

  charsToString(chars=this.value.chars) { return charsToString(chars); }
  charsFromString(string) { return charsFromString(string); }
}
