import { TextSymbol } from "./enums";
import { IToken } from "./interfaces";
import ParserBase from "./parser.base";

/**
 * A subclass of `ParserBase` designed to parse string text into a
 * representation `T` that uses `IToken` tokens with string identifiers
 * (i.e. `IToken.tokenType: string`).
 *
 * This configuration is suitable for most situations where a parser needs to
 * deal with string text, which is the most common use case. Thus, this class
 * serves as the default parser base for the library.
 */
export default abstract class Parser<T> extends ParserBase<
  string, 
  IToken,
  string,
  T
> {
  /**
   * This property must be set to the in-tokenized input in order to allow
   * the `makeErrorMsg` method to create a readable diagram of the parse error.
   */
  protected source: string = "";

  /**
   * Generate an error diagram according to the token at the current position
   * and append it to the given error message.
   *
   * @param errorMsg  A message about the error.
   * @returns         The original message, plus a diagram of the problem area
   */
  protected makeErrorMsg(errorMsg: string): string {
    // Edge case: parse error at pos 0 with no tokens.
    let tLine = 0;
    let tCol = 0;

    // Normal error case.
    if (this.currentPosition != 0) {
      let token = this.tokens[this.currentPosition - 1];
      tCol = token.column;
      tLine = token.line;
    }

    // Create error diagram.
    let arrow = TextSymbol.MINUS.repeat(tCol) + TextSymbol.CARET;
    let excerpt: string;
    if (this.source.includes(TextSymbol.NEWLINE)) {
      excerpt = this.source.split(TextSymbol.NEWLINE)[tLine];
    } else {
      excerpt = this.source;
    }
    let diagram = `Near here (column ${tCol} on line ${tLine}):\n\t\t${excerpt}\n\t\t${arrow}`;
    return `${errorMsg}: \n\t${diagram}`;
  }

  protected check(identifier: string): boolean {
    return this.current()?.tokenType == identifier;
  }
}
