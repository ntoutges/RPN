import { Value } from "./value.js";
import types from "./dataTypes.js";

var allVars = {};

export default {
  "+": function() {
    this.stackUp( this.stackDown(false).add( this.stackDown(false) ) )
  },
  "-": function() {
    this.stackUp( this.stackDown(false).sub( this.stackDown(false) ) )
  },
  "*": function() {
    this.stackUp( this.stackDown(false).mul( this.stackDown(false) ) )
  },
  "/": function() {
    this.stackUp( this.stackDown(false).div( this.stackDown(false) ) )
  },
  "^": function() {
    this.stackUp( this.stackDown(false).pow( this.stackDown(false) ) )
  },
  
  "swap": function() {
    const bottom = this.stackDown(false);
    const top = this.stackDown(false);
    this.stackUp(bottom);
    this.stackUp(top);
  },

  "sto": function() {
    const name = this.stackDown(false);
    const value = this.stackDown(false);
    allVars[name] = value;
  },
  'rcl': function() {
    const name = this.stackDown(false);
    if (name in allVars) this.stackUp(allVars[name]);
  },

  "neg": function() {
    this.stackUp( this.stackDown(false).mul( new Value(["-", "1"], -1, types.number) ) )
  },

  "==": function() {
    this.stackUp( this.stackDown(false).equals( this.stackDown(false) ) )
  }
}