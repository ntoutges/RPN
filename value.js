import { types, props } from "./dataTypes.js";
import { commands } from "./commands/commands.js";
import * as Vars from "./variables.js"
import { charsToString, charsFromString, separateLines } from "./utils.js";
import pairs from "./pairs.js";
import * as kwd from "./commands/keywords.js";

const NUMBER = /^[+-]?((\d+)|(\d*\.\d+))(E[+-]?\d+)?$/;
const VARIABLE = /^\D[A-Za-z\d]*$/; // not (a-z, 0-9)
const ALGEBREIC = /^[A-Za-z\d+\-*/=]+$/ // not (a-z, 0-9, operators, parentheses)

export function buildVal(chars, variableConvert=true) {
  const stringVal = chars.join("");
  const isNumber = NUMBER.test(stringVal);

  if (isNumber) return new NumberValue(chars); // value is a number
  // else if (stringVal in commands) return new CommandValue(stringVal); // value is a command
  else if (chars[0] == "\"") return new StringValue(chars.slice(1,chars.length-1)) // value is a string
  else if (chars[0] == "\'") { // (global/local) variable, or algebreic object
    const valueChars = chars.slice(1,chars.length-1); // remove (')s and (")s
    const value = valueChars.join("");
    if (NUMBER.test(value)) return new NumberValue(valueChars); // if it is just a number within 's, just create a number
    else if (VARIABLE.test(value)) { // alphanumeric
      return new GlobalVariableValue(valueChars); // TODO: also need to test for local variable, eventually
    }
    if (ALGEBREIC.test(value)) return new AlgebreicVariable(valueChars); // algebreic
    throw new Error(`Invalid value within expression ${stringVal}`)
  }
  else if (chars[0] == "{") return new ListValue(chars.slice(1,chars.length-1)); // value is a list
  else if (chars[0] == "<<") return new ProgramValue(chars.slice(1,chars.length-1)); // value is a program
  else if (stringVal in commands) {
    return new CommandValue(chars);
  }

  else if (VARIABLE.test(stringVal)) { // treat as a variable without single quotes
    if (variableConvert) {
      if (Vars.variableExists(chars)) return Vars.getVariable(chars);
      return new GlobalVariableValue(chars); // TODO: also need to test for local variable, eventually
    }
    else return new VariableNameValue(chars);
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

  equals(other) { return this.type == other.type && this.value == other.value; }
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

  equals(other) { return this.type == other.type && this.value[0] == other.value[0] && this.value[1] == other.value[1]; }

  add(other) {
    const dP = Math.max(other.value[1], this.value[1]);
    const val = (this.value[0] * 10n ** BigInt(dP - this.value[1])) + (other.value[0] * 10n ** BigInt(dP - other.value[1]));
    return new NumberValue([val, dP]);
  }
  sub(other) {
    const dP = Math.max(other.value[1], this.value[1]);
    const val = (this.value[0] * 10n ** BigInt(dP - this.value[1])) - (other.value[0] * 10n ** BigInt(dP - other.value[1]));
    return new NumberValue([val, dP]);
  }
  mul(other) {
    const dP = this.value[1] + other.value[1];
    const val = this.value[0] * other.value[0];
    return new NumberValue([val, dP]);
  }
  div(other, DIVISION_DECIMALS=0) {
    let numerator = this.value[0];
    const denominator = other.value[0];
    const dP = this.value[1] - other.value[1];

    let intResult = (numerator / denominator).toString();
    let decResult = "";

    numerator %= denominator;
    
    let itt = 0;
    // const numerators = {};
    while (numerator != 0n && itt < DIVISION_DECIMALS /* && !(numerator in numerators) */) {
      // numerators[numerator] = true;
      numerator *= 10n;
      decResult += numerator / denominator;
      numerator %= denominator;
      itt++;
    }
    
    // // division has reached the point where it repeats, so this skips the math and just duplicates the string
    // const pattern = decResult;
    // for (let i = decResult.length; i <= DIVISION_DECIMALS; i += pattern.length) { decResult += pattern; }
    // decResult = decResult.substring(0, DIVISION_DECIMALS); // ensure exact correct length

    if (decResult == "") decResult = "0"; // garuntee value in here

    return new NumberValue(`${intResult}.${decResult}E${-dP}`);
  }
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

export class VariableNameValue extends Value {
  constructor(valueChars) {
    if (typeof valueChars == "string") valueChars = charsFromString(valueChars);
    super(
      valueChars,
      charsToString(valueChars),
      types.variableName
    );
  }
  RCL() {
    return Vars.variableExists(this.value) ?
      Vars.getVariable(this.value) :
      new GlobalVariableValue(this.value);
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
    super(valueChars, charsToString(valueChars), types.command);
  }
  
  execute(level1, blocks=null, bI, i) { // (b)lock (I)ndex
    if (!level1.isSolid) level1.solidify();
    try { return commands[this.value](level1, blocks, bI, i); }
    catch(err) {
      console.error(err);
    }
  }
}

export class MultiValue extends Value {
  constructor(valueChars, type) {
    const valueCharsArr = separateLines(valueChars);
    const values = [];
    for (let chars of valueCharsArr) {
      values.push( buildVal(chars, false) );
    }
    super([], values, type);
    this.render();
  }
  render() {
    const pairStart = props[this.type].i; // { / [ / <<
    let chars = [pairStart];
    for (let value of this.value) {
      if (props[value.type].r) value.render(); // if (recurrsive): render
      chars = chars.concat(value.chars, " ");
    }
    if (chars.length > 1) chars[chars.length-1] = pairs.start[pairStart]; // replace trailing space with closing bracket
    else chars.push(pairs.start[pairStart]); // complete bracket pair
    this.chars = chars;
  }

  equals(other) {
    if (this.type != other.type || this.value.length != other.value.length) return false;
    for (let i in this.value) { if (!this.value[i].equals(other.value[i])) return false; }
    return true;
  }
}

export class ListValue extends MultiValue {
  constructor(valueChars) {
    super(valueChars, types.list);
  }
}

export class ProgramValue extends MultiValue {
  constructor(valueChars) {
    super(valueChars, types.program);
    
    const bIPs = []; // (b)locks (I)n (P)rogres(s) -- just fun to say
    const blocks = []; // finalized blocks
    for (let i in this.value) {
      const term = this.value[i].value;
      if (term in kwd.blockEnd) {
        // invalid ending
        if (bIPs.length == 0 || !kwd.blockStart[bIPs[bIPs.length-1].fT].includes(term)) throw new Error(`Invalid block-end: ${term}`);
        const block = bIPs.pop();
        block.setTo(term, i);
      }
      if (term in kwd.blockStart) {
        const block = new ProgramBlock(term,i);
        bIPs.push(block);
        blocks.push(block);
      }
    }
    
    const doRender = bIPs.length != 0;
    for (let i = bIPs.length-1; i >= 0; i--) { // end all unfinished blocks with the universal ender -- END (unless the option is not available, which throws an error)
      const uBlock = bIPs[i]; // (u)nfinished (Block)
      if (kwd.blockStart[uBlock.fT].includes("END")) {
        this.value.push(new CommandValue(["E","N","D"]));
        const block = bIPs.pop();
        block.setTo("END", this.value.length-1);
      }
      else throw new Error(`Unmatched block-start: ${uBlock.fT}`)
    }
    if (doRender) this.render();

    this.value.push(blocks);
  }
  getCommands() { return this.value.slice(0, this.value.length-1); } // last index reserved for context
  getBlocks() { return this.value[this.value.length-1]; }
  getBlockAreas() {
    const commands = this.getCommands();
    const blocks = this.getBlocks();
    const areas = [];
    for (const block of blocks) { areas.push(block.getBlockArea(commands)); }
    return areas;
  }
}

export class ProgramBlock {
  constructor(fromTxt, fromI) {
    this.setFrom(fromTxt, fromI);
    this.int = null;
    this.vars = [];
  }
  setFrom(fromTxt, fromI) {
    this.fT = fromTxt; // the text that indicates the start of the block
    this.fI = +fromI; // the index that indicates the start of the block (not included in final block output)
  }
  setTo(toTxt, toI) {
    this.tT = toTxt; // the text that indicates the end of the block
    this.tI = +toI; // the index that indicates the end of the block (not included in the final block output)
  }
  getStart() { return this.fI + 1; }

  getBlockArea(programListing) { return programListing.slice(this.fI+1, this.tI); }

  // interrupts are temporary functions that will run on the next cycle
  setInterrupt(funct) { this.int = funct; }
  hasInterrupt(funct) { return this.int != null; }
  getInterrupt() {
    const interrupt = this.int;
    this.int = null;
    return interrupt;
  }
}