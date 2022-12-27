import types from "./dataTypes.js";
import commands from "./commands.js";

const VARIABLE = /^\d|[^a-z0-9+\-*=()/]/; // not (a-z, 0-9)
const ALGEBREIC = /[^a-z0-9+\-*=()/]/ // not (a-z, 0-9, operators, parentheses)

export function buildVal(chars) {
  const stringVal = chars.join("");

  if (stringVal.length != 0 && !isNaN(stringVal)) return new NumberValue(parseFloat(stringVal)); // value is a number
  // else if (stringVal in commands) return new CommandValue(stringVal); // value is a command
  else if (stringVal[0] == "\"") return new StringValue(stringVal) // value is a string
  else if (stringVal[0] == "\'") { // (global/local) variable, or algebreic object
    const value = stringVal.substring(1,stringVal.length-1); // remove 's
    if (value.length != 0 && !isNaN(value)) return new NumberValue(parseFloat(value)); // if it is just a number within 's, just create a number
    else if (!VARIABLE.test(value)) { // alphanumeric
      return new GlobalVariableValue(stringVal); // TODO: also need to test for local variable, eventually
    }
    if (!ALGEBREIC.test(value)) return new AlgebreicVariable(stringVal); // algebreic
    throw new Error(`Invalid value within expression ${stringVal}`)
  }
  else if (stringVal in commands) {
    return new CommandValue(stringVal);
  }
  return new Value(chars);
}

// note to self: Values should be immutable
export class Value {
  constructor(chars=[], val=null, type=99) {
    this.chars = chars;
    this.value = val;
    this.type = type;
  }

  // none of these commands should be triggered, so they will all cause an error
  add() { throw new Error("Invalid arguments"); }
  sub() { throw new Error("Invalid arguments"); }
  mul() { throw new Error("Invalid arguments"); }
  div() { throw new Error("Invalid arguments"); }
  pow() { throw new Error("Invalid arguments"); }
}

// TODO: Make discrete classes for each data type to clean up mega class of Value
export class NumberValue extends Value {
  constructor(value) { // expects a number
    if (!isFinite(value)) { // convert infinity to real number
      if (value > 0) value = Number.MAX_VALUE;
      else value = Number.MIN_VALUE;
    }

    let number = value.toString();
    if (Math.abs(value) >= 1e18) {
      const exponent = Math.floor(Math.log10(value));
      const exponentStr = exponent.toString();
      const mantissa = (number / (10**exponent)).toString().substring(0, 18-exponentStr.length);
      number = mantissa + "E" + exponentStr;
    }
    else if (Math.abs(value) < 1) number = number.substring(1); // remove leading 0
    
    const chars = number.split("");
    super(chars, value, types.number);
  }

  add(other) {
    if (other.type == types.number) return new NumberValue(other.value + this.value);
    if (other.type == types.string) return new StringValue(other.value + this.chars.join(""));
    super.add();
  }
  sub(other) {
    if (other.type == types.number) return new NumberValue(other.value - this.value);
    super.sub();
  }
  mul(other) {
    if (other.type == types.number) return new NumberValue(other.value * this.value);
    if (other.type == types.string) return other.mul(this);
    super.mul();
  }
  div(other) {
    if (other.type == types.number) return new NumberValue(other.value / this.value);
    super.div();
  }
  pow(other) {
    if (other.type == types.number) return new NumberValue(other.value ** this.value);
    super.pow();
  }
}

export class StringValue extends Value {
  constructor(stringVal) {
    if (stringVal[0] != "\"") stringVal = "\"" + stringVal + "\""; // add in quotes that may be missing from [stringVal]

    const value = stringVal.substring(1, stringVal.length-1); // remove quotes for value
    const chars = stringVal.split("");
    super(chars, value, types.string);
  }

  add(other) {
    if (other.type == types.string) return new StringValue(other.value + this.value);
    if (other.type == types.number) return new StringValue(other.chars.join("") + this.value);
    super.add();
  }
  mul(other) { // acts like python string multiplication (which I like)
    if (other.type == types.number) {
      let newValue = "";
      for (let i = 0; i < other.value; i++) newValue += this.value;
      return new StringValue(newValue);
    }
    super.mul();
  }
}

export class GlobalVariableValue extends Value {
  constructor(stringVal) { // 's expected
    const value = stringVal.substring(1, stringVal.length-1);
    const chars = stringVal.split("");
    super(chars, value, types.globalName);
  }
}

export class AlgebreicVariable extends Value {
  constructor(stringVal) {
    if (stringVal[0] != "\'") stringVal = "\'" + stringVal + "\'"; // add in 's that may be missing from [stringVal]

    const value = stringVal.substring(1, stringVal.length-1);
    const chars = stringVal.split("");
    super(chars, value, types.algebreic);
  }
}

export class CommandValue extends Value {
  constructor(stringVal) {
    super(stringVal.toString(), stringVal, types.command);
  }
  
  // execute(level) {
  //   if (!level.isSolid)  level.solidify();
  //   commands[this.value].call(level);
  // }
}
