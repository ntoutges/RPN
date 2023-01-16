import { types, props } from "./dataTypes.js";
import { commands } from "./commands/commands.js";
import * as Vars from "./variables.js"
import { charsToString, charsFromString, separateLines } from "./utils.js";

const NUMBER = /^[+-]?((\d+)|(\d*\.\d+))(E[+-]?\d+)?$/;
const VARIABLE = /^\D[A-Za-z\d]*$/; // not (a-z, 0-9)
const ALGEBREIC = /^[A-Za-z\d+\-*/]+$/ // not (a-z, 0-9, operators, parentheses)

export function buildVal(chars) {
  const stringVal = chars.join("");
  const isNumber = NUMBER.test(stringVal);

  if (isNumber) return new NumberValue(chars); // value is a number
  // else if (stringVal in commands) return new CommandValue(stringVal); // value is a command
  else if (stringVal[0] == "\"") return new StringValue(chars.slice(1,chars.length-1)) // value is a string
  else if (stringVal[0] == "\'") { // (global/local) variable, or algebreic object
    const valueChars = chars.slice(1,chars.length-1); // remove (')s and (")s
    const value = valueChars.join("");
    if (NUMBER.test(value)) return new NumberValue(valueChars); // if it is just a number within 's, just create a number
    else if (VARIABLE.test(value)) { // alphanumeric
      return new GlobalVariableValue(valueChars); // TODO: also need to test for local variable, eventually
    }
    if (ALGEBREIC.test(value)) return new AlgebreicVariable(valueChars); // algebreic
    throw new Error(`Invalid value within expression ${stringVal}`)
  }
  else if (stringVal[0] == "{") return new ListValue(chars.slice(1,chars.length-1)); // value is a list
  else if (stringVal in commands) {
    return new CommandValue(stringVal);
  }

  else if (VARIABLE.test(stringVal)) { // treat as a variable without single quotes
    if (Vars.variableExists(chars)) return Vars.getVariable(chars);
    return new GlobalVariableValue(chars); // TODO: also need to test for local variable, eventually
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
}

// TODO: Make discrete classes for each data type to clean up mega class of Value
export class NumberValue extends Value {
  constructor(valueChars) { // expects a number
    if (typeof valueChars == "string") valueChars = charsFromString(valueChars);

    let value = valueChars.join("");
    const E_index = value.indexOf("E");
    
    let decimalPos = 0;
    let mantissa = 0;
    if (valueChars.length == 2 && typeof valueChars[1] == "number") { // passing in mantissa and decimalPos to be converted into string (to prevent errors)
      if (valueChars[1] == 0) value = valueChars[0].toString(); // decimal point is ignored
      else {
        let valStr = "";
        for (let i = valueChars[1] - valStr.length; i > 0; i--) { valStr += "0"; } 
        valStr += valueChars[0].toString();
        value = valStr.substring(0, valStr.length - valueChars[1]) + "." + valStr.substring(valStr.length - valueChars[1]);
      }
    }

    let mantissaStr;
    let exponent = 0;
    if (E_index == -1) mantissaStr = value; // no exponent
    else {
      mantissaStr = value.substring(0, E_index);
      exponent = parseInt(value.substring(E_index+1));
    }

    const D_index = value.indexOf("."); // used to determine how much to add to the exponent
    decimalPos = 0; // digits (from the right) indicating the location of the decimal point
    if (D_index != -1) decimalPos = mantissaStr.length - D_index - 1;
    decimalPos -= exponent;
    if (decimalPos > 0) exponent = 0;
    else {
      exponent = -decimalPos;
      decimalPos = 0;
    }
    
    if (decimalPos > 0) {
      let trailingZeroes = mantissaStr.match(/0*$/);
      decimalPos -= trailingZeroes[0].length;
      mantissaStr = mantissaStr.substring(0, mantissaStr.length - trailingZeroes[0].length); // remove trailing zeroes after decimal
    }
    if (D_index != -1) mantissaStr = mantissaStr.replace(".", ""); // remove decimal place

    mantissa = BigInt(mantissaStr) * (BigInt(10) ** BigInt(exponent));

    super( [], [mantissa, decimalPos], types.number );
    this.renderStandard(21);
  }

  renderStandard(charsShown) {
    // hyper inefficient, but it doesn't run often enough to warrant optimization (I'm lazy)

    this.renderFixed();
    if (this.chars.length > charsShown) this.renderScientific(charsShown);
  }

  renderScientific(charsShown) {
    const mantissa = this.value[0];
    const mantissaStr = (mantissa < 0 ? -mantissa : mantissa).toString();
    const dP = this.value[1];
    
    let mantissaDp = mantissaStr[0];
    let exponent = 0;
    if (mantissaStr.length > 1) {
      mantissaDp += "." + mantissaStr.substring(1);
      exponent = mantissaStr.substring(1).length - dP;
    }
    else exponent = -dP;

    const exponentStr = "E" + exponent;
    mantissaDp = (mantissa < 0) ? "-" + mantissaDp : mantissaDp;
    mantissaDp = mantissaDp.substring(0, charsShown - exponentStr.length);

    // remove trailing zeroes
    if (mantissaDp.length > 1) { // decimal point garunteed
      let trailingZeroes = mantissaDp.match(/0*$/);
      mantissaDp = mantissaDp.substring(0, trailingZeroes.index);
      
      // remove possible trailing decimal point
      if (mantissaDp[mantissaDp.length-1] == ".") mantissaDp = mantissaDp.substring(0, mantissaDp.length-1);
    }

    this.chars = (mantissaDp + exponentStr).split("");
  }
  renderEngineering() {
    
  }
  renderFixed() {
    const dP = this.value[1]; // decimal Point
    const mantissa = this.value[0];
    
    let chars = (mantissa < 0 ? -mantissa : mantissa).toString();    

    if (dP != 0) {
      for (let i = chars.length; i < dP; i++) { chars = "0" + chars; }
      chars = chars.substring(0, chars.length - dP) + "." + chars.substring(chars.length - dP);
    }

    this.chars = (mantissa < 0 ? "-" + chars : chars).split("");
  }

  toInt() { return this.value[0] / BigInt(10 ** this.value[1]); }
  toNumberInt() { return Number( this.value[0] / BigInt(10 ** this.value[1]) ); }
}

export class StringValue extends Value {
  constructor(valueChars) {
    if (typeof valueChars == "string") valueChars = charsFromString(valueChars);
    super(
      ["\""].concat(valueChars, "\""),
      charsToString(valueChars),
      types.string
    );
  }
}

export class GlobalVariableValue extends Value {
  constructor(valueChars) {
    if (typeof valueChars == "string") valueChars = charsFromString(valueChars);
    super(
      ["\'"].concat(valueChars, "\'"),
      charsToString(valueChars),
      types.globalName
    );
  }
}

export class AlgebreicVariable extends Value {
  constructor(valueChars) {
    super(
      ["\'"].concat(valueChars, "\'"),
      charsToString(valueChars),
      types.algebreic
    );
  }
}

export class CommandValue extends Value {
  constructor(valueChars) {
    super(valueChars, valueChars, types.command);
  }
  
  execute(level1) {
    if (!level1.isSolid) level1.solidify();
    try { commands[this.value](level1); }
    catch(err) {
      console.error(err);
    }
  }
}

export class ListValue extends Value {
  constructor(valueChars) {
    const valueCharsArr = separateLines(valueChars);
    const values = [];
    for (let chars of valueCharsArr) {
      values.push( buildVal(chars) );
    }
    super([], values, types.list)
    this.render();
    console.log(this)
  }
  render() {
    let chars = ["{"];
    for (let value of this.value) {
      if (props[value.type].r) value.render(); // if (recurrsive): render
      chars = chars.concat(value.chars, " ");
    }
    if (chars.length > 1) chars[chars.length-1] = "}"; // replace trailing space with closing bracket
    else chars.push("}"); // complete bracket pair
    this.chars = chars;
  }
}