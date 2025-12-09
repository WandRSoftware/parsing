# Parsing

This library is a collection of base classes that can be used to construct hand-rolled lexers and parsers.

## Hand-Rolled Parsers

Why would you want to roll your own parser instead of just using a parser generator? 

- Your language is small and more or less finalized, so changes are easy and the cost of maintaining the parser is low
- You want customized error recovery
- You want to implement your own parsing algorithm(s)
- You want custom debugging behaviour
- You want to keep the number of dependencies in your project small
- You want to fine-tune the performance of your parser
- Your parser is MVP or a mockup of something that you may parse/compile differently in production
- You are a student and want to learn more about how parsers work

## Example

In order to parse text into tokens, we need two things: a set of token type categories that we can sort text into, and a `Lexer` that will match regular expressions to those categories to produce tokens.

For the token types, we can use simple strings, but string enums make for easier reading and maintenance.

```typescript
import { Lexer, Parser, Token } from "parsing";

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
```

Now that we have our token types, we need to define a lexer that can recognize them. 

Our `Lexer` is initialized with a `new`-able object that can construct the tokens that will be used in the sorting process. Naturally, the default `Token` class can be used here.

Our `Lexer` provides a simple method-chaining interface that makes defining and reading rules easy:

```typescript
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
```

This method accepts a token type, a regular expression, and an optional transformer function that can be used to convert lexemes into other values.

Each method call in the chain returns a new instance, which could also represent a distinct rule if it were assigned to a variable. For example, this lexer will have all the rules defined above, plus a new silly rule, while the original `JsonLexer` variable will refer to a separate instance that lacks the new rule:

```typescript
const WeirdJsonLexer = JsonLexer.addRule("silly_rule", /:-\)/)
```

The last thing to do is define a parser that can recognize larger syntactic patterns made up by the tokens. For this, the `Parser` class serves as a base, supplying methods germane to parsing, from which you can construct your algorithms.

```typescript

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
```
