/**
 * A parser for some kind of scriptable text-based game's DSL.
 * 
 * In this game DSL, the order of arguments does not matter, only the
 * types. A player can say `build blacksmith (3,4) worker5` or
 * `build 3,4 worker5 blacksmith` and so on. The interpreter is (or would
 * be) responsible for understanding that `blacksmith` is the "what", that
 * `worker5` is the "who", and that `(3,4)` is the "where". Similarly, the
 * player can say `attack worker5 warrior3` and the interpreter must know
 * that `worker5` refers to the enemy's unit rather than the player's own.
 * But the parser does not care about this, it just checks that some
 * variant of the correct argument types are present and sorts the
 * tokens accordingly.
 */

import Lexer from "../src/lexer";
import Parser from "../src/parser";
import Token from "../src/token";

enum TokenType {
  MOVE = "move",
  BUILD = "build",
  INVENTORY = "inventory",
  INFORMATION = "information",
  EXTRACT = "extract",
  ATTACK = "attack",
  COMMA = "comma",
  SEMICOLON = "semicolon",
  IDENTIFIER = "identifier",
  INTEGER = "integer",
  WHITESPACE = "whitespace",
  L_PAREN = "l_paren",
  R_PAREN = "r_paren",
}

const tileScriptLexer = new Lexer(Token)
  .addRule(TokenType.MOVE, /move/)
  .addRule(TokenType.BUILD, /build/)
  .addRule(TokenType.INVENTORY, /inv(entory)?/)
  .addRule(TokenType.INFORMATION, /info(rmation)?/)
  .addRule(TokenType.EXTRACT, /extract/)
  .addRule(TokenType.ATTACK, /attack/)
  .addRule(TokenType.INTEGER, /\d+/, parseInt)
  .addRule(TokenType.COMMA, /,/)
  .addRule(TokenType.SEMICOLON, /;/)
  .addRule(TokenType.L_PAREN, /\(/)
  .addRule(TokenType.R_PAREN, /\)/)
  .addRule(TokenType.IDENTIFIER, /[a-zA-Z_][a-zA-Z_0-9]*/)
  .addRule(TokenType.WHITESPACE, /\s/);

interface Coordinates {
  x: number;
  y: number;
}

interface Identifier {
  literal: string;
}
type Primitive = Coordinates | Identifier;

interface Statement {
  type: string;
}

interface Expression {
  type: string;
}

interface BinaryOperation extends Expression {
  type: "BinaryOperation";
}

interface CrudOperation extends Statement {
  type: "CrudOperation";
  name: string;
  arguments: Primitive[];
}

interface Block extends Statement {
  type: "Block";
  statements: Statement[];
}

interface Condition extends Statement {
  type: "Condition";
  protasis: Expression;
  apodosis: Block;
}

interface Assignment extends Statement {
  type: "Assignment";
  identifier: Identifier;
  expression: Expression;
}

function makeCrudOperation(name: string, args: Primitive[]): CrudOperation {
  return { type: "CrudOperation", name: name, arguments: args };
}

class TileScriptParser extends Parser<Statement[]> {
  public parse(input: string): Statement[] {
    this.reset();
    this.source = input;
    this.tokens = tileScriptLexer.tokenize(input, TokenType.WHITESPACE);
    const expressions = [];
    while (!this.isAtEnd()) {
      try {
        expressions.push(this.parseStatement());
      } catch (e) {
        this.synchronize();
      }
    }
    if (this.hadError()) {
      throw Error(this.errors.join("\n"));
    }
    return expressions;
  }

  synchronize() {
    console.log(`${this.currentPosition}::${this.tokens.length}`);
    while (!this.isAtEnd()) {
      if (this.currentPosition === 0) {
        this.advance();
        continue;
      }
      const p = this.previous();
      if (p && p.tokenType === TokenType.SEMICOLON) {
        return;
      }
      this.advance();
    }
  }

  parseCoordinates(): Coordinates {
    let x: Token, y: Token;
    const innerParse = () => {
      x = this.consume(TokenType.INTEGER, "Coordinate 'x' must be an integer");
      this.match(TokenType.COMMA);
      y = this.consume(TokenType.INTEGER, "Coordinate 'y' must be an integer");
      return [x, y];
    };
    // With parentheses: "(4, 5)" or "(4 5)""
    if (this.match(TokenType.L_PAREN)) {
      [x, y] = innerParse();
      this.consume(
        TokenType.R_PAREN,
        "Coordinates with open parenthesis must have closing parenthesis"
      );
      // Without parentheses: "4, 5" or "4 5"
    } else {
      [x, y] = innerParse();
    }
    return { x: x.value as number, y: y.value as number };
  }

  parseIdentifier(): Identifier {
    return { literal: this.advance().lexeme };
  }

  parseStatement(): Statement {
    return this.parseCrudOperation();
  }
  parseCrudOperation(): CrudOperation {
    let name: string;
    const args: Primitive[] = [];

    if (this.match(TokenType.INVENTORY)) {
      name = TokenType.INVENTORY;
    } else if (this.match(TokenType.INFORMATION)) {
      name = TokenType.INFORMATION;
      // information locationName (resourceName, unitName, etc.)
      if (this.check(TokenType.IDENTIFIER)) {
        args.push(this.parseIdentifier());
      }
      // information locationCoords
      args.push(this.parseCoordinates());
    } else if (this.match(TokenType.MOVE)) {
      name = TokenType.MOVE;
      if (this.check(TokenType.IDENTIFIER)) {
        args.push(this.parseIdentifier());
        // move unitName locationName
        // move locationName unitName
        if (this.check(TokenType.IDENTIFIER)) {
          args.push(this.parseIdentifier());

          // move unitName locationCoords
        } else {
          args.push(this.parseCoordinates());
        }
      }
      // move locationCoords unitName
      else {
        args.push(this.parseCoordinates());
        args.push(this.parseIdentifier());
      }
    } else if (this.match(TokenType.ATTACK)) {
      name = TokenType.ATTACK;
      if (this.check(TokenType.IDENTIFIER)) {
        args.push(this.parseIdentifier());
        // attack unitName1 unitName2
        // attack unitName locationName
        if (this.check(TokenType.IDENTIFIER)) {
          args.push(this.parseIdentifier());
          // attack unitName locationCoords
        } else {
          args.push(this.parseCoordinates());
        }
      }
    } else if (this.match(TokenType.EXTRACT)) {
      name = TokenType.EXTRACT;
      if (this.check(TokenType.IDENTIFIER)) {
        args.push(this.parseIdentifier());
        // extract resourceName unitName locationCoords
        // extract unitName resourceName locationCoords
        if (this.check(TokenType.IDENTIFIER)) {
          args.push(this.parseIdentifier());
          args.push(this.parseCoordinates());
          // extract resourceName locationCoords unitName
          // extract unitName locationCoords resourceName
        } else {
          args.push(this.parseCoordinates());
          args.push(this.parseIdentifier());
        }
      }
      // extract locationCoords resourceName unitName
      // extract locationCoords unitName resourceName
      else {
        args.push(this.parseCoordinates());
        args.push(this.parseIdentifier());
        args.push(this.parseIdentifier());
      }
    } else if (this.match(TokenType.BUILD)) {
      name = TokenType.BUILD;
      if (this.check(TokenType.IDENTIFIER)) {
        args.push(this.parseIdentifier());
        // build buildingName unitName locationCoords
        // build unitName buildingName locationCoords
        if (this.check(TokenType.IDENTIFIER)) {
          args.push(this.parseIdentifier());
          args.push(this.parseCoordinates());
          // build buildingName locationCoords unitName
          // build unitName locationCoords buildingName
        } else {
          args.push(this.parseCoordinates());
          args.push(this.parseIdentifier());
        }
      }
      // build locationCoords buildingName unitName
      // build locationCoords unitName buildingName
      else {
        args.push(this.parseCoordinates());
        args.push(this.parseIdentifier());
        args.push(this.parseIdentifier());
      }
    } else {
      throw Error("Unable to parse.");
    }
    this.consume(
      TokenType.SEMICOLON,
      "Game statements must end with a semicolon"
    );

    return makeCrudOperation(name, args);
  }
}

const p = new TileScriptParser();
console.log(
  p.parse(`inventory; 
extract (3,5) gold worker4; 
build house 3, 4 worker3;
info 44 3;
move worker3 blacksmith;`)
);

// TODO: apart from simple game commands, we want to allow players to script
// their moves using a simple pseudo code, e.g.:
let stmts = `
function tryUpgradeCoords(coords: Coordinates) {
    if Worker at coords and Building at coords then {
        let w mean Worker at coords;
        let b mean Building at coords;
        if cost of b's nextUpgrade is less than Player's money then {
            build b's nextUpgrade at coords with w;
        }
    }
}
`;
/**
 * This will make for some very descriptive code that doesn't
 * need a lot of comments (hopefully), but we will have to translate
 * some idioms into computery syntax under the hood:
 *
 * cost of + parent-object -> suffle morphemes to parent-object DOT cost
 * parent-object + 's nextUpgrade -> replace apostrophe with DOT
 *
 * thus:
 * cost of b's nextUpgrade -> b.nextUpgrade.cost
 */
