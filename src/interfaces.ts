/**
 * Interface for tokens used by our lexer and parser.
 * 
 * If you want to use your own lexer with the default parser, you can have 
 * it produce tokens conforming to this interface, plus whatever additional
 * metadata your parser might need.
 */
export interface IToken {
  
  // The transformed value of the lexeme, if there is one.
  value?: unknown;

  // The category into which the token is sorted.
  tokenType: string;

  // The literal string match that generated the token.
  lexeme: string;

  // The start of the lexeme in the source text.
  start: number;

  // The end of the lexeme in the source text.
  end: number;

  // The lexeme's line in the source text, when newlines are accounted for.
  line: number;

  // The lexeme's column in the source text, when newlines are accounted for.
  column: number;

  // Return a printable string representing this token.
  toString(): string;

  // The length of the token's lexeme.
  get length(): number;
}
