import Parser from "../src/parser";
import Token from "../src/token";
import { IToken } from "../src/interfaces";

// Concrete implementation for testing
class TestParser extends Parser<string> {
  public parse(input: string): string {
    this.source = input;
    // Simple test implementation that just returns concatenated lexemes
    return this.tokens.map(t => t.lexeme).join("");
  }

  // Expose protected methods for testing
  public testCheck(identifier: string): boolean {
    return this.check(identifier);
  }

  public testMakeErrorMsg(msg: string): string {
    return this.makeErrorMsg(msg);
  }

  public testIsAtEnd(): boolean {
    return this.isAtEnd();
  }

  public testLookAround(nodes: number): IToken | null {
    return this.lookAround(nodes);
  }

  public testAdvance(): IToken {
    return this.advance();
  }

  public testConsume(identifier: string, errorMsg: string): IToken {
    return this.consume(identifier, errorMsg);
  }

  public testMatch(...identifiers: string[]): boolean {
    return this.match(...identifiers);
  }

  public testPrevious(): IToken | null {
    return this.previous();
  }

  public testCurrent(): IToken | null {
    return this.current();
  }

  public testPeek(): IToken | null {
    return this.peek();
  }

  public testPeekNext(): IToken | null {
    return this.peekNext();
  }

  public testHadError(): boolean {
    return this.hadError();
  }

  public testAddError(msg: string): Error {
    return this.addError(msg);
  }

  // Allow setting tokens for testing
  public setTokens(tokens: IToken[]): void {
    this.tokens = tokens;
  }

  public getTokens(): IToken[] {
    return this.tokens;
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public getCurrentPosition(): number {
    return this.currentPosition;
  }

  public setCurrentPosition(pos: number): void {
    this.currentPosition = pos;
  }
}

describe("Parser", () => {
  let parser: TestParser;
  let tokens: IToken[];

  beforeEach(() => {
    parser = new TestParser();
    tokens = [
      new Token("KEYWORD", "if", 0, 2, 0, 2),
      new Token("PAREN", "(", 3, 4, 0, 4),
      new Token("IDENTIFIER", "x", 4, 5, 0, 5),
      new Token("OPERATOR", ">", 6, 7, 0, 7),
      new Token("NUMBER", "10", 8, 10, 0, 10),
      new Token("PAREN", ")", 10, 11, 0, 11),
    ];
  });

  describe("initialization", () => {
    it("should start with position at 0", () => {
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should start with empty token list", () => {
      expect(parser.getTokens()).toEqual([]);
    });

    it("should start with empty error list", () => {
      expect(parser.getErrors()).toEqual([]);
    });

    it("should have empty source", () => {
      expect(parser["source"]).toBe("");
    });
  });

  describe("reset", () => {
    it("should reset position to 0", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(3);
      
      parser.reset();
      
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should clear tokens", () => {
      parser.setTokens(tokens);
      
      parser.reset();
      
      expect(parser.getTokens()).toEqual([]);
    });

    it("should clear errors", () => {
      parser.testAddError("Test error");
      
      parser.reset();
      
      expect(parser.getErrors()).toEqual([]);
    });

    it("should allow parser to be reused", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(5);
      parser.testAddError("Error");
      
      parser.reset();
      
      expect(parser.getCurrentPosition()).toBe(0);
      expect(parser.getTokens()).toEqual([]);
      expect(parser.getErrors()).toEqual([]);
    });
  });

  describe("isAtEnd", () => {
    it("should return true when position equals token length", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(6);
      
      expect(parser.testIsAtEnd()).toBe(true);
    });

    it("should return true when position exceeds token length", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(10);
      
      expect(parser.testIsAtEnd()).toBe(true);
    });

    it("should return false when position is less than token length", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(0);
      
      expect(parser.testIsAtEnd()).toBe(false);
    });

    it("should return true for empty token list", () => {
      parser.setTokens([]);
      
      expect(parser.testIsAtEnd()).toBe(true);
    });
  });

  describe("lookAround", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(2); // At "x"
    });

    it("should return current token with offset 0", () => {
      const token = parser.testLookAround(0);
      
      expect(token?.lexeme).toBe("x");
    });

    it("should return next token with positive offset", () => {
      const token = parser.testLookAround(1);
      
      expect(token?.lexeme).toBe(">");
    });

    it("should return previous token with negative offset", () => {
      const token = parser.testLookAround(-1);
      
      expect(token?.lexeme).toBe("(");
    });

    it("should return null for negative position", () => {
      parser.setCurrentPosition(0);
      const token = parser.testLookAround(-1);
      
      expect(token).toBeNull();
    });

    it("should return null for position beyond token length", () => {
      const token = parser.testLookAround(10);
      
      expect(token).toBeNull();
    });

    it("should handle large positive offsets", () => {
      const token = parser.testLookAround(3);
      
      expect(token?.lexeme).toBe(")");
    });

    it("should handle large negative offsets", () => {
      const token = parser.testLookAround(-2);
      
      expect(token?.lexeme).toBe("if");
    });
  });

  describe("advance", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return current token", () => {
      const token = parser.testAdvance();
      
      expect(token.lexeme).toBe("if");
    });

    it("should increment position by 1", () => {
      parser.testAdvance();
      
      expect(parser.getCurrentPosition()).toBe(1);
    });

    it("should advance through all tokens", () => {
      const lexemes: string[] = [];
      
      while (!parser.testIsAtEnd()) {
        lexemes.push(parser.testAdvance().lexeme);
      }
      
      expect(lexemes).toEqual(["if", "(", "x", ">", "10", ")"]);
      expect(parser.getCurrentPosition()).toBe(6);
    });

    it("should allow advancing from any position", () => {
      parser.setCurrentPosition(3);
      
      const token = parser.testAdvance();
      
      expect(token.lexeme).toBe(">");
      expect(parser.getCurrentPosition()).toBe(4);
    });
  });

  describe("check", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return true when current token matches identifier", () => {
      expect(parser.testCheck("KEYWORD")).toBe(true);
    });

    it("should return false when current token does not match", () => {
      expect(parser.testCheck("NUMBER")).toBe(false);
    });

    it("should check token at current position", () => {
      parser.setCurrentPosition(2);
      
      expect(parser.testCheck("IDENTIFIER")).toBe(true);
      expect(parser.testCheck("KEYWORD")).toBe(false);
    });

    it("should return false when at end", () => {
      parser.setCurrentPosition(6);
      
      expect(parser.testCheck("KEYWORD")).toBe(false);
    });

    it("should return false for empty token list", () => {
      parser.setTokens([]);
      
      expect(parser.testCheck("KEYWORD")).toBe(false);
    });
  });

  describe("consume", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
      parser["source"] = "if (x > 10)";
    });

    it("should return and advance on successful match", () => {
      const token = parser.testConsume("KEYWORD", "Expected keyword");
      
      expect(token.lexeme).toBe("if");
      expect(parser.getCurrentPosition()).toBe(1);
    });

    it("should throw error on failed match", () => {
      expect(() => {
        parser.testConsume("NUMBER", "Expected number");
      }).toThrow();
    });

    it("should add error message to error list on failure", () => {
      try {
        parser.testConsume("NUMBER", "Expected number");
      } catch (e) {
        // Expected
      }
      
      expect(parser.getErrors().length).toBe(1);
      expect(parser.getErrors()[0]).toContain("Expected number");
    });

    it("should include error diagram in message", () => {
      try {
        parser.testConsume("NUMBER", "Expected number");
      } catch (e) {
        expect((e as Error).message).toContain("column");
        expect((e as Error).message).toContain("line");
      }
    });

    it("should consume multiple tokens in sequence", () => {
      parser.testConsume("KEYWORD", "Expected keyword");
      parser.testConsume("PAREN", "Expected paren");
      parser.testConsume("IDENTIFIER", "Expected identifier");
      
      expect(parser.getCurrentPosition()).toBe(3);
    });

    it("should not advance position on failure", () => {
      const initialPos = parser.getCurrentPosition();
      
      try {
        parser.testConsume("NUMBER", "Expected number");
      } catch (e) {
        // Expected
      }
      
      expect(parser.getCurrentPosition()).toBe(initialPos);
    });
  });

  describe("match", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return true and advance on match", () => {
      const result = parser.testMatch("KEYWORD");
      
      expect(result).toBe(true);
      expect(parser.getCurrentPosition()).toBe(1);
    });

    it("should return false and not advance on no match", () => {
      const result = parser.testMatch("NUMBER");
      
      expect(result).toBe(false);
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should match first identifier from multiple options", () => {
      const result = parser.testMatch("NUMBER", "KEYWORD", "OPERATOR");
      
      expect(result).toBe(true);
      expect(parser.getCurrentPosition()).toBe(1);
    });

    it("should handle multiple identifiers with none matching", () => {
      const result = parser.testMatch("NUMBER", "OPERATOR", "IDENTIFIER");
      
      expect(result).toBe(false);
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should check identifiers in order", () => {
      parser.setCurrentPosition(3); // At ">"
      
      const result = parser.testMatch("KEYWORD", "OPERATOR");
      
      expect(result).toBe(true);
      expect(parser.testPrevious()?.lexeme).toBe(">");
    });

    it("should work with single identifier", () => {
      const result = parser.testMatch("KEYWORD");
      
      expect(result).toBe(true);
    });
  });

  describe("previous", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return null at position 0", () => {
      expect(parser.testPrevious()).toBeNull();
    });

    it("should return previous token", () => {
      parser.setCurrentPosition(2);
      
      const token = parser.testPrevious();
      
      expect(token?.lexeme).toBe("(");
    });

    it("should not modify position", () => {
      parser.setCurrentPosition(2);
      
      parser.testPrevious();
      
      expect(parser.getCurrentPosition()).toBe(2);
    });

    it("should work after advance", () => {
      parser.testAdvance();
      
      const token = parser.testPrevious();
      
      expect(token?.lexeme).toBe("if");
    });
  });

  describe("current", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return token at current position", () => {
      const token = parser.testCurrent();
      
      expect(token?.lexeme).toBe("if");
    });

    it("should return null when at end", () => {
      parser.setCurrentPosition(6);
      
      expect(parser.testCurrent()).toBeNull();
    });

    it("should not modify position", () => {
      parser.testCurrent();
      
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should track with position changes", () => {
      parser.setCurrentPosition(3);
      
      const token = parser.testCurrent();
      
      expect(token?.lexeme).toBe(">");
    });
  });

  describe("peek", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return next token", () => {
      const token = parser.testPeek();
      
      expect(token?.lexeme).toBe("(");
    });

    it("should return null at end", () => {
      parser.setCurrentPosition(5);
      
      expect(parser.testPeek()).toBeNull();
    });

    it("should not modify position", () => {
      parser.testPeek();
      
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should work from any position", () => {
      parser.setCurrentPosition(2);
      
      const token = parser.testPeek();
      
      expect(token?.lexeme).toBe(">");
    });
  });

  describe("peekNext", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
    });

    it("should return token at position + 2", () => {
      const token = parser.testPeekNext();
      
      expect(token?.lexeme).toBe("x");
    });

    it("should return null near end", () => {
      parser.setCurrentPosition(4);
      
      expect(parser.testPeekNext()).toBeNull();
    });

    it("should not modify position", () => {
      parser.testPeekNext();
      
      expect(parser.getCurrentPosition()).toBe(0);
    });

    it("should work from any position", () => {
      parser.setCurrentPosition(1);
      
      const token = parser.testPeekNext();
      
      expect(token?.lexeme).toBe(">");
    });
  });

  describe("hadError", () => {
    it("should return false initially", () => {
      expect(parser.testHadError()).toBe(false);
    });

    it("should return true after error is added", () => {
      parser.testAddError("Test error");
      
      expect(parser.testHadError()).toBe(true);
    });

    it("should return true with multiple errors", () => {
      parser.testAddError("Error 1");
      parser.testAddError("Error 2");
      
      expect(parser.testHadError()).toBe(true);
      expect(parser.getErrors().length).toBe(2);
    });

    it("should return false after reset", () => {
      parser.testAddError("Error");
      parser.reset();
      
      expect(parser.testHadError()).toBe(false);
    });
  });

  describe("addError", () => {
    it("should add error to error list", () => {
      parser.testAddError("Test error");
      
      expect(parser.getErrors()).toContain("Test error");
    });

    it("should return Error object", () => {
      const error = parser.testAddError("Test error");
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    it("should accumulate multiple errors", () => {
      parser.testAddError("Error 1");
      parser.testAddError("Error 2");
      parser.testAddError("Error 3");
      
      expect(parser.getErrors().length).toBe(3);
    });
  });

  describe("makeErrorMsg", () => {
    beforeEach(() => {
      parser.setTokens(tokens);
      parser["source"] = "if (x > 10)";
    });

    it("should include original error message", () => {
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("Parse error");
    });

    it("should include column information", () => {
      parser.setCurrentPosition(1);
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("column");
    });

    it("should include line information", () => {
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("line");
    });

    it("should include source excerpt", () => {
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("if (x > 10)");
    });

    it("should include error pointer (caret)", () => {
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("^");
    });

    it("should handle position 0 edge case", () => {
      parser.setCurrentPosition(0);
      
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("column 0");
      expect(msg).toContain("line 0");
    });

    it("should handle multi-line source", () => {
      const multiLineTokens = [
        new Token("KEYWORD", "if", 0, 2, 0, 2),
        new Token("NEWLINE", "\n", 2, 3, 0, 3),
        new Token("KEYWORD", "else", 3, 7, 1, 4),
      ];
      parser.setTokens(multiLineTokens);
      parser["source"] = "if\nelse";
      parser.setCurrentPosition(3);
      
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("line 1");
      expect(msg).toContain("else");
    });

    it("should point to correct column", () => {
      parser.setCurrentPosition(5); // After "10"
      
      const msg = parser.testMakeErrorMsg("Parse error");
      
      expect(msg).toContain("column 10");
    });
  });

  describe("parse", () => {
    it("should set source property", () => {
      parser.setTokens(tokens);
      
      parser.parse("if (x > 10)");
      
      expect(parser["source"]).toBe("if (x > 10)");
    });

    it("should process tokens", () => {
      parser.setTokens(tokens);
      
      const result = parser.parse("if (x > 10)");
      
      expect(result).toBe("if(x>10)");
    });

    it("should handle empty input", () => {
      parser.setTokens([]);
      
      const result = parser.parse("");
      
      expect(result).toBe("");
    });
  });

  describe("complex parsing scenarios", () => {
    it("should handle typical parse loop pattern", () => {
      parser.setTokens(tokens);
      const consumed: string[] = [];
      
      while (!parser.testIsAtEnd()) {
        const token = parser.testCurrent();
        if (token) {
          consumed.push(token.lexeme);
        }
        parser.testAdvance();
      }
      
      expect(consumed).toEqual(["if", "(", "x", ">", "10", ")"]);
    });

    it("should handle lookahead pattern", () => {
      parser.setTokens(tokens);
      
      // Check if we have "if" followed by "("
      if (parser.testCheck("KEYWORD")) {
        const next = parser.testPeek();
        if (next?.tokenType === "PAREN") {
          parser.testAdvance();
          parser.testAdvance();
          expect(parser.testCurrent()?.lexeme).toBe("x");
        }
      }
    });

    it("should handle error recovery pattern", () => {
      parser.setTokens(tokens);
      parser["source"] = "if (x > 10)";
      
      try {
        parser.testConsume("NUMBER", "Expected number");
      } catch (e) {
        // Recover by advancing to next token
        parser.testAdvance();
      }
      
      expect(parser.testCurrent()?.lexeme).toBe("(");
    });

    it("should handle match with fallback", () => {
      parser.setTokens(tokens);
      
      if (!parser.testMatch("NUMBER")) {
        // Fallback: try other options
        expect(parser.testMatch("KEYWORD", "IDENTIFIER")).toBe(true);
      }
    });

    it("should handle sequential consumption", () => {
      parser.setTokens(tokens);
      parser["source"] = "if (x > 10)";
      
      const keyword = parser.testConsume("KEYWORD", "Expected keyword");
      const lparen = parser.testConsume("PAREN", "Expected (");
      const ident = parser.testConsume("IDENTIFIER", "Expected identifier");
      
      expect(keyword.lexeme).toBe("if");
      expect(lparen.lexeme).toBe("(");
      expect(ident.lexeme).toBe("x");
      expect(parser.getCurrentPosition()).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("should handle single token", () => {
      const singleToken = [new Token("NUMBER", "42", 0, 2, 0, 2)];
      parser.setTokens(singleToken);
      
      expect(parser.testCurrent()?.lexeme).toBe("42");
      expect(parser.testPeek()).toBeNull();
    });

    it("should handle operations at boundaries", () => {
      parser.setTokens(tokens);
      parser.setCurrentPosition(5); // Last token
      
      expect(parser.testCurrent()?.lexeme).toBe(")");
      expect(parser.testPeek()).toBeNull();
      expect(parser.testPrevious()?.lexeme).toBe("10");
    });

    it("should handle rapid position changes", () => {
      parser.setTokens(tokens);
      
      parser.setCurrentPosition(3);
      expect(parser.testCurrent()?.lexeme).toBe(">");
      
      parser.setCurrentPosition(0);
      expect(parser.testCurrent()?.lexeme).toBe("if");
      
      parser.setCurrentPosition(5);
      expect(parser.testCurrent()?.lexeme).toBe(")");
    });
  });
});