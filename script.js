const $ = window.$;

import characters from "./graphics.js";

const levelHeight = 40;
var level1 = null;

class ILevel { // the InfiniLevel -- allows for unlimited stack expansion
  constructor(nextLevel) {
    this.value = [];
    this.next = nextLevel;
    this.isReal = false; // doesn't occupy screen space

    this.isSolid = true;
  }

  delete() {
    if (this.isSolid) this.stackDown();
    else this.popChar();
  }
  enter() {
    if (this.value.length == 0) this.clearHole(); // eliminate this hole in the stack
    else if (!this.isSolid) this.solidify(); // don't push stack up; instead solifiy this stack level 
    else this.duplicate(); // value is solid, and there is a value to be copied
  }

  setChars(chars) {
    this.clear();
    this.value = chars;
  }
  addChar(char) {
    if (this.isSolid) this.liquify(); // don't try to edit a solidified line

    if (char in characters) this.value.push(char);
    else this.value.push("unknown");
  }
  popChar() {
    if (this.column == 0) return false; // unable to pop value
    this.value.pop();
    return true; // able to pop value
  }
  clear() { this.value = []; }
  getChars() { return this.value; }
  stackUp(newValue=[]) {
    if (this.value.length != 0) {
      if (this.next == null) this.next = new ILevel(null); // expand stack if necessary
      this.next.stackUp(this.value);
    }
    this.setChars(newValue);
  }
  stackDown() {
    if (this.next == null) this.clear()
    else {
      this.setChars(this.next.getChars());
      this.next.stackDown();
      if (this.next.getChars().length == 0 && !this.next.isReal) this.next = null; // delete stack above this point, as it is empty
    }
  }
  clearHole() {
    this.stackDown();
    this.solidify();
  }
  duplicate() { this.stackUp(this.value.concat()); } // concat to make a copy of this value

  // these are mainly so the sub-class has a notification as to when the level state changse
  solidify() { this.isSolid = true; }
  liquify() {
    this.stackUp(); // get rid of whatever is on the current level, so it doesn't interfere
    this.isSolid = false;
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

    this.column = this.value.length;
    this.ctx.fill();
  }

  renderSolid() {
    let toRenderDepth = this.depth.toString().split("").concat(":");
    let toRender = this.value;
    let spacing = 22 - toRender.length;


    if (toRender.length > 22 - toRenderDepth.length) {
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
    let toRender = this.value.concat("<=");

    let drawAll = false; // indicate whether or not to redraw line
    if (toRender.length >= 22) { // cut off what cannot be shown on the screen, and add ellipsis to the left to indicate the cut
      this.clearLine(); // all numbers will be shifted, so line must be cleared before it can be redrawn
      if (toRender.length > 22) toRender = ["..."].concat(toRender.slice(-21)); // only want ellipsis if all cannot be drawn
      drawAll = true;
    }

    for (let i = drawAll ? 0 : this.column; i < toRender.length; i++) {
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

  clearLine() { this.ctx.clearRect(0,0, this.width, 10.1); } // clears whatever has been written to the screen

  clear() {
    this.column = 0;
    this.clearLine()
    super.clear();
    this.render();
  }
  setChars(chars) {
    super.setChars(chars)
    this.render();
  }
  addChar(char) {
    super.addChar(char)
    this.ctx.clearRect(this.column*6,0, 5,10.1);
    this.render();
  }
  popChar() {
    if (!super.popChar()) return;
    this.column--;
    this.ctx.clearRect(this.column*6,0, 11,10.1); // erase this character, and the pointer
    this.render();
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
    this.clearLine() // error: ":" showing through under pointer -- find why!
    this.render();
  }
}

generateLevels(4);

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
  if (event.keyCode == 13) return level1.enter();
  level1.addChar(String.fromCharCode(event.charCode));
});

$("body").keydown((event) => {
  if (event.keyCode == 8) level1.delete();
});
