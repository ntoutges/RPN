import { Value } from "./value.js";
import types from "./dataTypes.js";

export default {
  "+": function() {
    this.stackUp( this.stackDown().add( this.stackDown() ) )
  },
  "-": function() {
    this.stackUp( this.stackDown().sub( this.stackDown() ) )
  },
  "*": function() {
    this.stackUp( this.stackDown().mul( this.stackDown() ) )
  },
  "/": function() {
    this.stackUp( this.stackDown().div( this.stackDown() ) )
  },
  "^": function() {
    this.stackUp( this.stackDown().pow( this.stackDown() ) )
  },
  
  "neg": function() {
this.stackUp( this.stackDown().mul( new Value(["-", "1"], -1, types.number) ) )
  },

  "==": function() {
    this.stackUp(
      this.stackDown().equals( this.stackDown() )
    )
  }
}