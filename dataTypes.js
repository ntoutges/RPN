export const types = {
  "number": 0,
  "string": 2,
  "list": 5,
  "globalName": 6,
  "localName": 7,
  "program": 8,
  "algebreic": 9,
  "binaryInteger": 10,
  "command": 19,

  "variableName": 98,
  "unset": 99
}

// r: recursive -- whether or not to check validity within pairs
// i: indicator -- pair start that indicates type
export const props = {
  0:  { "r":0 },
  2:  { "r":0, "i":"\"" },
  5:  { "r":1, "i":"{" },
  6:  { "r":0, "i":"\'" },
  7:  { "r":0, "i":"\'" },
  8:  { "r":1, "i":"<<" },
  9:  { "r":0, "i":"\'" },
  10: { "r":0 },
  19: { "r":0 },

  98: { "r":0 },
  99: { "r":0 }
}