import types from "./dataTypes.js";
import commands from "./commands.js";

export default class Value {
  constructor(chars, val=null, type) { // input of characters, input of value
    this.chars = chars;
    this.value = null;
    this.type = types.unset;
    
    if (val != null) {
      this.value = val;
      this.type = type;
      return;
    }
    if (chars.length == 0) return; // don't try to set an unsettable value

    const stringVal = chars.join("");
    const noIndicators = stringVal.substring(1, stringVal.length-1)
    if (!isNaN(stringVal,10)) { // value is a number
      this.value = parseFloat(stringVal);
      this.type = types.number;
      this.chars = parseFloat(stringVal).toString().replace("e", "E").replace("+", ""); // convert [N]e+[M] to [N]E[M]
    }
    else if (stringVal in commands) {
      this.value = stringVal; // value is a command
      this.type = types.command;
    }
    else if (stringVal[0] == "\"") { // if it starts with ", it must also end with "
      this.value = stringVal.substring(1,stringVal.length-1); // remove quotes // value is a string
      this.type = types.string;
    }
    else if (stringVal[0] == "\'") {// if it starts with ', it must also end with '
      this.value = stringVal;
      // (global/local) variable, or algebreic object
      let isVariable = true;
      let isAlgebra = false;
      for (let char of noIndicators) {
        if (isVariable && !ALPHANUMERIC.includes(char)) {
          isVariable = false;
          isAlgebra = true;
        }
        if (isAlgebra && !ALGEBREIC.includes(char)) { isAlgebra = false; }
      }
      if (isVariable) {
        this.type = types.globalName; // default, for now
      }
      else if (isAlgebra) {
        // second chance to be a number
        if (isNaN(noIndicators)) { // remove 's from string to check if number
          this.value = parseFloat(noIndicators);
          this.type = types.number;
        }
        else this.type = types.algebreicObject;
      }
      else throw new Error(`Invalid value within expression ${stringVal}`)
    }
//     else if (stringVal[0] == "<") { // if it starts with <, it must also end with >
      
//     }
    else {
      this.value = `'${stringVal}'`; // default
      this.chars = ["\'"].concat(chars).concat("\'"); // add single quotes
      console.log(this.chars)
      this.type = types.globalName;
    }
  }
  
  copy() {
    return new Value(
      this.chars,
      this.value,
      this.type
    );
  }

  add(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    if (this.type == types.number && other.type == types.number) return this.addNumber(other);
    if (this.type == types.string || other.type == types.string) return this.addString(other);
  }
  sub(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    if (this.type == types.number && other.type == types.number) return this.subNumber(other);
  }
  mul(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    if (this.type == types.number && other.type == types.number) return this.mulNumber(other);
  }
  div(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    if (this.type == types.number && other.type == types.number) return this.divNumber(other);
  }
  pow(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    if (this.type == types.number && other.type == types.number) return this.powNumber(other);
  }
  
  equals(other) {
    if (this.type == 99 || other.type == 99) throw new Error("Not enough arguments");

    const val = ((this.type == other.type) && JSON.stringify(this.value) == JSON.stringify(other.value)) ? 1 : 0;
    return new Value(
      val.toString(),
      val,
      types.number
    )
  }
  
  operateNumber(newVal) {
    return new Value(
      newVal.toString(),
      newVal,
      types.number
    );
  }
  addNumber(other) { return this.operateNumber(other.value + this.value); }
  subNumber(other) { return this.operateNumber(other.value - this.value); }
  mulNumber(other) { return this.operateNumber(other.value * this.value); }
  divNumber(other) { return this.operateNumber(other.value / this.value); }
  powNumber(other) { return this.operateNumber(other.value ** this.value); }
  
  addString(other) {
    const newVal = other.value + this.value;
    const newValChars = ["\""].concat(newVal.split("")).concat("\"");
    return new Value(
      newValChars,
      newVal,
      types.string
    );
  }
}