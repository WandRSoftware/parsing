import { IToken } from "./interfaces";

/**
 * The lexical category to which a segment belongs, as well as its location
 * in the source text, both literally, and when newlines are counted.
 */
export default class Token implements IToken {
  /**
   * Initialize a new token.
   *
   * @param tokenType   The main lexical category of the token
   * @param lexeme      The literal lexeme that generated the token.
   * @param start       The start index in the source text.
   * @param end         The end index in the source text.
   * @param line        The line in the source text, counting newlines.
   * @param column      The column in the source text, counting newlines.
   */
  public value?: unknown;

  constructor(
    readonly tokenType: string,
    readonly lexeme: string,
    readonly start: number,
    readonly end: number,
    readonly line: number,
    readonly column: number
  ) { }

  public toString(): string {
    return `Token(${this.tokenType}, ${this.lexeme}, ${this.line}[${this.column}])`;
  }

  /**
   * The length of the lexeme string literal.
   */
  public get length(): number {
    return this.lexeme.length;
  }

}