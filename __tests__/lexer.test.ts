import Lexer from "../src/lexer";
import Token from "../src/token";
import { UnexpectedCharacterError } from "../src/errors";

describe("Lexer", () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer(Token);
  });

  describe("constructor", () => {
    it("should create a lexer with the given token constructor", () => {
      expect(lexer).toBeInstanceOf(Lexer);
    });

    it("should initialize with empty state", () => {
      expect(lexer.start).toBe(0);
      expect(lexer.line).toBe(0);
      expect(lexer.column).toBe(0);
    });

    it("should accept custom token implementations", () => {
      class CustomToken extends Token {}
      const customLexer = new Lexer(CustomToken);
      
      expect(customLexer).toBeInstanceOf(Lexer);
    });
  });

  describe("addRule", () => {
    it("should add a rule without a callback", () => {
      const result = lexer.addRule("IDENTIFIER", /[a-zA-Z]+/);
      
      expect(result).toBe(lexer); // Should return this for chaining
    });

    it("should add a rule with a callback", () => {
      const result = lexer.addRule("NUMBER", /\d+/, parseInt);
      
      expect(result).toBe(lexer);
    });

    it("should support method chaining", () => {
      const result = lexer
        .addRule("IDENTIFIER", /[a-zA-Z]+/)
        .addRule("NUMBER", /\d+/, parseInt)
        .addRule("WHITESPACE", /\s+/);
      
      expect(result).toBe(lexer);
    });

    it("should allow multiple rules with different patterns", () => {
      lexer
        .addRule("KEYWORD", /if|else|while/)
        .addRule("OPERATOR", /[+\-*/]/)
        .addRule("PAREN", /[()]/);
      
      expect(lexer).toBeInstanceOf(Lexer);
    });
  });

  describe("tokenize", () => {
    describe("basic tokenization", () => {
      it("should tokenize a simple identifier", () => {
        lexer.addRule("IDENTIFIER", /[a-zA-Z]+/);
        
        const tokens = lexer.tokenize("hello");
        
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe("IDENTIFIER");
        expect(tokens[0].lexeme).toBe("hello");
      });

      it("should tokenize multiple tokens", () => {
        lexer
          .addRule("IDENTIFIER", /[a-zA-Z]+/)
          .addRule("NUMBER", /\d+/, parseInt)
          .addRule("WHITESPACE", /\s+/);
        
        const tokens = lexer.tokenize("hello 123", "WHITESPACE");
        
        expect(tokens).toHaveLength(2);
        expect(tokens[0].lexeme).toBe("hello");
        expect(tokens[1].lexeme).toBe("123");
      });

      it("should handle empty input", () => {
        lexer.addRule("IDENTIFIER", /[a-zA-Z]+/);
        
        const tokens = lexer.tokenize("");
        
        expect(tokens).toHaveLength(0);
      });

      it("should tokenize the entire input", () => {
        lexer
          .addRule("LETTER", /[a-z]/)
          .addRule("DIGIT", /\d/);
        
        const tokens = lexer.tokenize("a1b2c3");
        
        expect(tokens).toHaveLength(6);
        expect(tokens.map(t => t.lexeme).join("")).toBe("a1b2c3");
      });
    });

    describe("token positioning", () => {
      it("should track start and end positions", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("SPACE", /\s+/);
        
        const tokens = lexer.tokenize("foo bar", "SPACE");
        
        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(3);
        expect(tokens[1].start).toBe(4);
        expect(tokens[1].end).toBe(7);
      });

      it("should track line numbers with newlines", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("NEWLINE", /\n/);
        
        const tokens = lexer.tokenize("foo\nbar");
        
        expect(tokens[0].line).toBe(0);
        expect(tokens[1].line).toBe(1); // newline token itself
        expect(tokens[2].line).toBe(1); // after newline
      });

      it("should track column numbers", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("SPACE", / /);
        
        const tokens = lexer.tokenize("one two");
        
        expect(tokens[0].column).toBe(3); // after "one"
        expect(tokens[1].column).toBe(4); // after space
        expect(tokens[2].column).toBe(7); // after "two"
      });

      it("should reset column after newline", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("NEWLINE", /\n/);
        
        const tokens = lexer.tokenize("foo\nbar");
        
        expect(tokens[0].column).toBe(3);
        expect(tokens[2].column).toBe(3); // reset after newline
      });
    });

    describe("callbacks", () => {
      it("should apply callback to transform token value", () => {
        lexer.addRule("NUMBER", /\d+/, parseInt);
        
        const tokens = lexer.tokenize("42");
        
        expect(tokens[0].lexeme).toBe("42");
        expect(tokens[0].value).toBe(42);
      });

      it("should work without callback", () => {
        lexer.addRule("NUMBER", /\d+/);
        
        const tokens = lexer.tokenize("42");
        
        expect(tokens[0].value).toBeUndefined();
      });

      it("should apply different callbacks to different rules", () => {
        lexer
          .addRule("INT", /\d+/, parseInt)
          .addRule("FLOAT", /\d+\.\d+/, parseFloat)
          .addRule("SPACE", /\s+/);
        
        const tokens = lexer.tokenize("42 3.14", "SPACE");
        
        expect(tokens[0].value).toBe(42);
        expect(tokens[1].value).toBe(3.14);
      });

      it("should handle custom transformation functions", () => {
        lexer.addRule("BOOL", /true|false/, (s) => s === "true");
        
        const tokens = lexer.tokenize("true");
        
        expect(tokens[0].value).toBe(true);
      });
    });

    describe("filtering", () => {
      it("should filter out specified token types", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("SPACE", /\s+/);
        
        const tokens = lexer.tokenize("foo bar baz", "SPACE");
        
        expect(tokens).toHaveLength(3);
        expect(tokens.every(t => t.tokenType === "WORD")).toBe(true);
      });

      it("should filter multiple token types", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("SPACE", /\s+/)
          .addRule("COMMA", /,/);
        
        const tokens = lexer.tokenize("foo, bar", "SPACE", "COMMA");
        
        expect(tokens).toHaveLength(2);
        expect(tokens.map(t => t.lexeme)).toEqual(["foo", "bar"]);
      });

      it("should return all tokens when no filter is specified", () => {
        lexer
          .addRule("WORD", /[a-z]+/)
          .addRule("SPACE", /\s+/);
        
        const tokens = lexer.tokenize("foo bar");
        
        expect(tokens).toHaveLength(3); // foo, space, bar
      });
    });

    describe("error handling", () => {
      it("should throw UnexpectedCharacterError for unmatched characters", () => {
        lexer.addRule("LETTER", /[a-z]+/);
        
        expect(() => lexer.tokenize("hello123")).toThrow(UnexpectedCharacterError);
      });

      it("should provide error details with line number", () => {
        lexer
          .addRule("LETTER", /[a-z]+/)
          .addRule("NEWLINE", /\n/);
        
        try {
          lexer.tokenize("hello\n123");
          fail("Should have thrown an error");
        } catch (e) {
          expect(e).toBeInstanceOf(UnexpectedCharacterError);
          expect((e as UnexpectedCharacterError).line).toBe(1);
        }
      });

      it("should provide error details with column number", () => {
        lexer.addRule("LETTER", /[a-z]+/);
        
        try {
          lexer.tokenize("abc123");
          fail("Should have thrown an error");
        } catch (e) {
          expect(e).toBeInstanceOf(UnexpectedCharacterError);
          expect((e as UnexpectedCharacterError).column).toBe(3);
        }
      });

      it("should include excerpt in error", () => {
        lexer.addRule("LETTER", /[a-z]+/);
        
        try {
          lexer.tokenize("hello@world");
          fail("Should have thrown an error");
        } catch (e) {
          expect(e).toBeInstanceOf(UnexpectedCharacterError);
          expect((e as UnexpectedCharacterError).excerpt).toContain("hello@world");
        }
      });
    });
  });

  describe("match", () => {
    it("should return null when pattern doesn't match", () => {
      lexer.addRule("DIGIT", /\d+/);
      
      const template = {
        tokenType: "DIGIT",
        regexPattern: /\d+/,
      };
      
      const token = lexer.match(template, "abc");
      
      expect(token).toBeNull();
    });

    it("should return null when match is not at current position", () => {
      lexer.addRule("DIGIT", /\d+/);
      
      const template = {
        tokenType: "DIGIT",
        regexPattern: /\d+/,
      };
      
      // Match exists but not at position 0
      const token = lexer.match(template, "abc123");
      
      expect(token).toBeNull();
    });

    it("should create token when pattern matches at current position", () => {
      const template = {
        tokenType: "WORD",
        regexPattern: /[a-z]+/,
      };
      
      const token = lexer.match(template, "hello world");
      
      expect(token).not.toBeNull();
      expect(token!.tokenType).toBe("WORD");
      expect(token!.lexeme).toBe("hello");
    });

    it("should apply callback when provided", () => {
      const template = {
        tokenType: "NUMBER",
        regexPattern: /\d+/,
        callback: parseInt,
      };
      
      const token = lexer.match(template, "42");
      
      expect(token!.value).toBe(42);
    });

    it("should handle newlines in lexeme", () => {
      const template = {
        tokenType: "TEXT",
        regexPattern: /[^\n]+\n/,
      };
      
      const token = lexer.match(template, "hello\nworld");
      
      expect(token!.lexeme).toBe("hello\n");
      expect(token!.line).toBe(1);
    });
  });

  describe("best", () => {
    it("should prefer longer matches", () => {
      lexer
        .addRule("SHORT", /if/)
        .addRule("LONG", /[a-z]+/);
      
      const tokens = lexer.tokenize("iffy");
      
      expect(tokens[0].tokenType).toBe("LONG");
      expect(tokens[0].lexeme).toBe("iffy");
    });

    it("should handle ties by preferring first match", () => {
      lexer
        .addRule("FIRST", /abc/)
        .addRule("SECOND", /abc/);
      
      const tokens = lexer.tokenize("abc");
      
      expect(tokens[0].tokenType).toBe("FIRST");
    });
  });

  describe("state management", () => {
    it("should reset state between tokenize calls", () => {
      lexer.addRule("LETTER", /[a-z]+/);
      
      lexer.tokenize("hello");
      const tokens2 = lexer.tokenize("world");
      
      expect(tokens2[0].start).toBe(0);
      expect(tokens2[0].line).toBe(0);
    });

    it("should maintain state during single tokenize call", () => {
      lexer
        .addRule("WORD", /[a-z]+/)
        .addRule("SPACE", /\s+/);
      
      const tokens = lexer.tokenize("one two three");
      
      expect(tokens[0].start).toBe(0);
      expect(tokens[2].start).toBe(4);
      expect(tokens[4].start).toBe(8);
    });
  });

  describe("complex scenarios", () => {
    it("should handle programming language tokens", () => {
      lexer
        .addRule("KEYWORD", /if|else|while|for/)
        .addRule("IDENTIFIER", /[a-zA-Z_][a-zA-Z0-9_]*/)
        .addRule("NUMBER", /\d+/, parseInt)
        .addRule("OPERATOR", /[+\-*/=>]/)
        .addRule("PAREN", /[()]/)
        .addRule("WHITESPACE", /\s+/);
      
      const tokens = lexer.tokenize("if (x > 10)", "WHITESPACE");
      
      expect(tokens.map(t => t.tokenType)).toEqual([
        "KEYWORD",
        "PAREN",
        "IDENTIFIER",
        "OPERATOR",
        "NUMBER",
        "PAREN",
      ]);
    });

    it("should handle string literals", () => {
      lexer
        .addRule("STRING", /"[^"]*"/, (s) => s.slice(1, -1))
        .addRule("SPACE", /\s+/);
      
      const tokens = lexer.tokenize('"hello world"', "SPACE");
      
      expect(tokens[0].lexeme).toBe('"hello world"');
      expect(tokens[0].value).toBe("hello world");
    });

    it("should handle multi-line input", () => {
      lexer
        .addRule("WORD", /[a-z]+/)
        .addRule("NEWLINE", /\n/)
        .addRule("SPACE", /\s+/);
      
      const input = "line one\nline two\nline three";
      const tokens = lexer.tokenize(input, "SPACE", "NEWLINE");
      
      expect(tokens).toHaveLength(6);
      expect(tokens[3].line).toBe(1); // "three" is on line 2 (i.e. index 1)
    });

    it("should handle operators and punctuation", () => {
      lexer
        .addRule("DOUBLE_OP", /==|!=|<=|>=/)
        .addRule("SINGLE_OP", /[<>=+\-*/]/)
        .addRule("NUMBER", /\d+/);
      
      const tokens = lexer.tokenize("1==2");
      
      expect(tokens[0].lexeme).toBe("1");
      expect(tokens[1].lexeme).toBe("==");
      expect(tokens[2].lexeme).toBe("2");
    });

    it("should handle complex expressions", () => {
      lexer
        .addRule("NUMBER", /\d+(\.\d+)?/, parseFloat)
        .addRule("OPERATOR", /[+\-*/()]/)
        .addRule("WHITESPACE", /\s+/);
      
      const tokens = lexer.tokenize("(3.14 + 2) * 5", "WHITESPACE");
      
      expect(tokens).toHaveLength(7);
      expect(tokens[1].value).toBe(3.14);
      expect(tokens[3].value).toBe(2);
    });
  });

  describe("getters", () => {
    it("should expose start position", () => {
      expect(lexer.start).toBe(0);
    });

    it("should expose line number", () => {
      expect(lexer.line).toBe(0);
    });

    it("should expose column number", () => {
      expect(lexer.column).toBe(0);
    });

    it("should update position during tokenization", () => {
      lexer
        .addRule("CHAR", /./);
      
      lexer.tokenize("abc");
      
      expect(lexer.start).toBe(3);
      expect(lexer.column).toBe(3);
    });
  });
});