import { TextSymbol } from "./enums";

export class UnexpectedCharacterError extends Error {
  constructor(
    public readonly excerpt: string,
    public readonly line: number,
    public readonly column: number
  ) {
    if (column <= 0) {
      column = 1;
    }
    let arrow = TextSymbol.MINUS.repeat(column) + TextSymbol.CARET;
    let diagram = `Near here:\n\t\t${excerpt}\n\t\t${arrow}`;
    let errMsg = `Lexer encountered an unexpected character at column ${column} on line ${line}:\n\t${diagram}`;
    super(errMsg);
  }
}
