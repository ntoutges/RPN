const $ = window.$;

import { Level } from "./levels.js";
import "./inputs.js";

const levelHeight = 40;
export var level1 = null;

generateLevels(8);

function generateLevels(count) {
  const levelsContainer = $("#level-holder");

  let nextLevel = null;
  for (let i = count; i > 0; i--) { // generate highest level first
    const level = $(`<div class=\"levels\" data-level=\"${i}\" style=\"height:${levelHeight}px\">`);
    levelsContainer.append(level);
    // turns each level into an element in a linked list
    nextLevel = new Level({
      element: level,
      nextLevel,
      depth: i,
      charsShown: 24
    });

    nextLevel.render();
  }

  level1 = nextLevel; // 'nextLevel' will always be the last level generated, thus the lowest, thus the first
}

// update screen
// setInterval(() => level1.render(), 100);

setInterval(() => {
  level1.runCursor(9);
}, 100)

// note to self: try to use ctrl/alt as modifier keys