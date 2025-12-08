import { UnexpectedCharacterError } from "./errors";
import { TextSymbol } from "./enums";
import { IToken } from "./interfaces";

/**
 * A text reader that sorts raw text into lexical categories.
 *
 * The lexer is initialized by passing it an object that can be `new`-ed to
 * produce a new instance of `IToken` (our default `Token` class, for
 * example).
 *
 * The `addRule` method is used to define rules for the set of terminals that
 * the lexer will try to match. The rules are expressed as a token type name,
 * a regular expression, and an optional callback (generally used to transform
 * literal values into their appropriate types).
 *
 * @example
 * ```typescript
 * const lexer = new Lexer(Token)
 *                    .addRule("identifier", /([a-zA-Z_]+[a-zA-Z_0-9]*)/)
 *                    .addRule("digit", /[\d]+/, parseInt)
 * ```
 *
 * The lexer is constructed using this builder interface, allowing us to
 * see all the rules like a list. When we are ready, the `tokenize` method
 * crawls through the source text and checks the list of rules for regular
 * expression matches at the current position. If no match is found, an error
 * will be raised with details about the problem position. If multiple matches
 * are found, then the `best` method is called, which supplies logic for
 * choosing the preferred match. In the default implementation, this is the
 * match with the longest literal. You may override the `best` method in a
 * subclass to change the behaviour.
 *
 * NOTE: The lexer does NOT have an option to ignore any characters
 * automatically. Therefore, whitespace, tabs, etc. have to be accounted
 * for in the rule set. If these tokens are not actually needed, then a list
 * of token type names can be passed as the `filterTypes` parameter to the
 * `tokenize` method in order to exclude them from the final result.
 *
 * @example
 * ```typescript
 * const inputText = "test 1234 more text 2112"
 * lexer.addRule("whitespace", /\s+/)
 * const result = lexer.tokenize(inputText, ["whitespace"])
 * ```
 */
export default class Lexer {
  protected templates: TokenTemplate[] = [];
  protected tokens: IToken[] = [];
  protected tokenType: TokenConstructor;

  protected _start: number = 0;
  protected _line: number = 0;
  protected _column: number = 0;

  constructor(tokenType: TokenConstructor) {
    this.tokenType = tokenType;
  }

  /**
   * Define a new token production rule that will be considered when
   * tokenizing the source text.
   *
   * @param tokenType         The name of the token's lexical category.
   * @param regexPattern      A regular expression defining the lexeme.
   * @param callback          An optional transformer for the lexeme's type.
   */
  public addRule(
    tokenType: string,
    regexPattern: RegExp,
    callback?: (lexeme: string) => unknown
  ): this {
    this.templates.push({
      tokenType: tokenType,
      regexPattern: regexPattern,
      callback: callback,
    });
    return this;
  }

  /**
   * Attempt to sort a source text into lexical categories, represented
   * as tokens.
   *
   * IMPORTANT: The lexer does not ignore whitespaces, newlines, tabs, etc.
   * by default. You must define a token template to capture unwanted
   * characters, then you can add them to the a list of `filterTypes`,
   * which will omit tokens with those labels from the final return.
   *
   * @param text          A source document to be tokenized.
   * @param filterTypes   Token type names that will be excluded from output.
   * @throws              UnexpectedCharacterError if the lexer encounters
   *                      a character that cannot be tokenized with the given
   *                      ruleset.
   * @returns             A list of tokens representing the source text.
   */
  public tokenize(text: string, ...filterTypes: string[]): IToken[] {
    this.tokens = [];
    let best: IToken | null;
    let token: IToken | null;
    this._start = 0;
    this._column = 0;
    this._line = 0;
    while (this.start < text.length) {
      best = null;
      for (let template of this.templates) {
        token = this.match(template, text);
        if (token == null) {
          continue;
        }
        if (best == null) {
          best = token;
        } else {
          best = this.best(best, token);
        }
      }
      if (best == null) {
        throw new UnexpectedCharacterError(
          text.split(TextSymbol.NEWLINE)[this.line],
          this.line,
          this.column
        );
      }
      this.accept(best);
    }
    return this.tokens.filter((x) => !filterTypes.includes(x.tokenType));
  }

  /**
   * Check if a match can be made at the current position in the source
   * text and generate a token if so, or return null if not.
   *
   * @param text      The source text to be analyzed
   * @param start     The position in the text to check for a match
   * @param line      The linebreak-sensitive line count
   * @param column    The linebreak-sensistive column count
   *
   * @returns         A new token if the match was made or null if not.
   */
  public match(template: TokenTemplate, text: string): IToken | null {
    let line = this._line;
    let column = this._column;
    let match = text.slice(this._start).match(template.regexPattern);
    if (!match) {
      return null;
    }
    if (match.index != 0) {
      return null;
    }

    let lexeme = match[0];
    let end = this.start + lexeme.length;

    // Adjust position relative to line breaks
    for (let char of lexeme) {
      if (char == TextSymbol.NEWLINE) {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
    }

    let token = new this.tokenType(
      template.tokenType,
      lexeme,
      this.start,
      end,
      line,
      column
    );
    if (template.callback != undefined) {
      token.value = template.callback(lexeme);
    }
    return token;
  }

  /**
   * Compare the current best token to another token.
   *
   * By default, this checks the longest lexeme match. Override this
   * function or replace its logic to implement a different algorithm.
   *
   * @param best      The current best token.
   * @param other     Another token for comparison.
   *
   * @returns         The better of the two tokens.
   */
  protected best(best: IToken, other: IToken): IToken {
    return best.length >= other.length ? best : other;
  }

  /**
   * Accept the given token by adding it to the list of tokens and by
   * instructing the program counter to advance.
   *
   * @param token     The token to be accepted.
   */
  protected accept(token: IToken) {
    this.tokens.push(token);
    if (token.line != this.line) {
      this._column = 0;
    } else {
      this._column += token.end - token.start;
    }
    this._start = token.end;
    this._line = token.line;
  }

  /**
   * The absolute position in the text to start reading from.
   *
   * @returns The index of the current position in the source text.
   */
  public get start(): number {
    return this._start;
  }

  /**
   * @returns The line in the text, relative to any newlines previously
   * encountered.
   */
  public get line(): number {
    return this._line;
  }

  /**
   * @returns The column in the text, relative to any newlines previously
   * encountered.
   */
  public get column(): number {
    return this._column;
  }
}

/**
 * A template for token type pattern matches.
 */
type TokenTemplate = {
  tokenType: string;
  regexPattern: RegExp;
  callback?: (lexeme: string) => any;
};

/**
 * An interface for an object that returns an instance of an implementation 
 * of `IToken`
 */
type TokenConstructor<T extends IToken = IToken> = new (
  tokenType: string,
  lexeme: string,
  start: number,
  end: number,
  line: number,
  column: number
) => T;
