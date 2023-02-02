export const keywords = [
  "IF",
  // "THEN",
  // "ELSE",
  "END"
];

export const blockStart = {
  "IF": ["THEN"],
  "THEN": ["ELSE", "END"],
  "ELSE": ["END"],
  "FOR": ["NEXT", "STEP"]
};

export const blockEnd = {
  "THEN": [],
  "ELSE": [],
  "END": [],
  "NEXT": [],
  "STEP": []
};

export const blockOffsets = {
  "THEN": 0,
  "ELSE": 1, // jumping to ELSE will skip else operation
  "END": 0,
  "NEXT": 0,
  "STEP": 0,
  "FOR": 2
}

for (let starter in blockStart) {
  const starterEnds = blockStart[starter];
  for (const ender of starterEnds) {
    blockEnd[ender].push(starter);
  }
}