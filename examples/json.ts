/**
 * Example parser using the base class.
 *
 * This parser is a simple tree-walk algorithm, but your parser doesn't have
 * to follow this pattern necessarily.
 */
import Lexer from "../src/lexer";
import Parser from "../src/parser";
import Token from "../src/token";

enum TokenType {
  number = "number",
  string = "string",
  boolean = "boolean",
  null = "null",
  object_open = "object_open",
  object_close = "object_close",
  array_open = "array_open",
  array_close = "array_close",
  whitespace = "whitespace",
  comma = "comma",
  colon = "colon",
}

const JsonLexer = new Lexer(Token)
  .addRule(
    TokenType.number,
    /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
    (it) => +it
  )
  .addRule(
    TokenType.string,
    /\"([^\0-\x1F\"\\]|\\[\"\\\/bfnrt]|\\u[0-9a-fA-F]{4})*\"/
  )
  .addRule(TokenType.boolean, /true|false/)
  .addRule(TokenType.null, /null/)
  .addRule(TokenType.object_open, /{/)
  .addRule(TokenType.object_close, /}/)
  .addRule(TokenType.array_open, /\[/)
  .addRule(TokenType.array_close, /\]/)
  .addRule(TokenType.whitespace, /\s/)
  .addRule(TokenType.comma, /,/)
  .addRule(TokenType.colon, /:/);

export default class JsonParser extends Parser<object> {

  public parse(input: string): object {
    this.reset();
    this.source = input;
    this.tokens = JsonLexer.tokenize(input, TokenType.whitespace);
    try {
      return this.parseObject();
    } catch (e) {
      throw Error(this.errors.join("\n"));
    }
  }

  private parseValue(): Object | Array<any> | string | boolean | null | number {
    if (this.check(TokenType.object_open)) {
      return this.parseObject();
    }
    if (this.check(TokenType.array_open)) {
      return this.parseArray();
    }
    if (this.match(TokenType.string)) {
      const rawString = this.previous()!.lexeme.slice(1, -1);
      // Unescape the string
      return rawString
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .replace(/\\\//g, "/")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
    }
    if (this.match(TokenType.number)) {
      return this.previous()!.value!;
    }
    if (this.match(TokenType.null)) {
      return null;
    }
    if (this.match(TokenType.boolean)) {
      return this.previous()!.lexeme === "true";
    }
    this.errors.push("No value found")
    throw Error();
  }

  private parseArray(): Array<any> {
    this.consume(TokenType.array_open, "JSON array must begin with '['");
    if (this.match(TokenType.array_close)) {
      return [];
    }
    let members = [this.parseValue()];
    while (this.match(TokenType.comma)) {
      members.push(this.parseValue());
    }
    this.consume(TokenType.array_close, "JSON array must end with ']'");
    return members;
  }

  private parseObject(): Object {
    this.consume(TokenType.object_open, "JSON object must begin with '{'");
    if (this.match(TokenType.object_close)) {
      return {};
    }
    const members = this.parseKeyValuePair();
    while (this.match(TokenType.comma)) {
      Object.assign(members, this.parseKeyValuePair());
    }
    this.consume(TokenType.object_close, "JSON object must end with '}'");
    return members;
  }

  private parseKeyValuePair(): Object {
    this.consume(TokenType.string, "JSON object key must be a string");
    const key = this.previous()!.lexeme.slice(1, -1);
    this.consume(
      TokenType.colon,
      "Object key-value pairs must be separated by a ':'"
    );
    const value = this.parseValue();
    return { [key]: value };
  }
}
