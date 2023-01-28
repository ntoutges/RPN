export function escape(level1) {
  if (level1.isSolid) return;
    level1.setChars([], false);
    level1.solidify(false);
    level1.stackDown(true);
}

export function selectAll(level1) {
  level1.cursor = level1.value.chars.length;
    level1.moveHighlight(-level1.value.chars.length, false);
    level1.moveWindow(level1.cursor);
    level1.clearLine();
    level1.render();
}

export function copy(level1) {
  navigator.clipboard.writeText(
    level1.charsToString(
      level1.getHighlightedText()
    )
  );
}

export function paste(level1) {
  navigator.clipboard.readText().then(txt => {
    level1.addChars( level1.charsFromString(txt) );
  });
}

export function KEYWORD(level1) {} // keywords reserved for providing context, and themselves do nothing
