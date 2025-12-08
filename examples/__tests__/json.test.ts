import JsonParser from "../json";

describe("JsonParser", () => {
  let parser: JsonParser;

  beforeEach(() => {
    parser = new JsonParser();
  });

  describe("simple objects", () => {
    it("should parse empty object", () => {
      const result = parser.parse("{}");

      expect(result).toEqual({});
    });

    it("should parse object with single string property", () => {
      const result = parser.parse('{"name":"John"}');

      expect(result).toEqual({ name: "John" });
    });

    it("should parse object with single number property", () => {
      const result = parser.parse('{"age":30}');

      expect(result).toEqual({ age: 30 });
    });

    it("should parse object with single boolean property", () => {
      const result = parser.parse('{"active":true}');

      expect(result).toEqual({ active: true });
    });

    it("should parse object with null property", () => {
      const result = parser.parse('{"value":null}');

      expect(result).toEqual({ value: null });
    });

    it("should parse object with multiple properties", () => {
      const result = parser.parse('{"name":"Alice","age":25,"active":true}');

      expect(result).toEqual({ name: "Alice", age: 25, active: true });
    });
  });

  describe("nested objects", () => {
    it("should parse object with nested object", () => {
      const result = parser.parse('{"person":{"name":"Bob"}}');

      expect(result).toEqual({ person: { name: "Bob" } });
    });

    it("should parse deeply nested objects", () => {
      const result = parser.parse('{"a":{"b":{"c":"value"}}}');

      expect(result).toEqual({ a: { b: { c: "value" } } });
    });

    it("should parse object with multiple nested objects", () => {
      const result = parser.parse(
        '{"person":{"name":"Alice"},"address":{"city":"NYC"}}'
      );

      expect(result).toEqual({
        person: { name: "Alice" },
        address: { city: "NYC" },
      });
    });
  });

  describe("arrays", () => {
    it("should parse empty arrays", () => {
      const result = parser.parse('{"array": []}');

      expect(result).toEqual({ array: [] });
    });

    it("should parse array with single number", () => {
      const result = parser.parse('{"numbers":[1]}');

      expect(result).toEqual({ numbers: [1] });
    });

    it("should parse array with multiple numbers", () => {
      const result = parser.parse('{"numbers":[1,2,3,4,5]}');

      expect(result).toEqual({ numbers: [1, 2, 3, 4, 5] });
    });

    it("should parse array with strings", () => {
      const result = parser.parse('{"names":["Alice","Bob","Charlie"]}');

      expect(result).toEqual({ names: ["Alice", "Bob", "Charlie"] });
    });

    it("should parse array with mixed types", () => {
      const result = parser.parse('{"mixed":[1,"two",true,null]}');

      expect(result).toEqual({ mixed: [1, "two", true, null] });
    });

    it("should parse array with nested arrays", () => {
      const result = parser.parse('{"matrix":[[1,2],[3,4]]}');

      expect(result).toEqual({
        matrix: [
          [1, 2],
          [3, 4],
        ],
      });
    });

    it("should parse array with nested objects", () => {
      const result = parser.parse(
        '{"users":[{"name":"Alice"},{"name":"Bob"}]}'
      );

      expect(result).toEqual({
        users: [{ name: "Alice" }, { name: "Bob" }],
      });
    });
  });

  describe("number formats", () => {
    it("should parse integer", () => {
      const result = parser.parse('{"value":42}');

      expect(result).toEqual({ value: 42 });
    });

    it("should parse negative integer", () => {
      const result = parser.parse('{"value":-42}');

      expect(result).toEqual({ value: -42 });
    });

    it("should parse zero", () => {
      const result = parser.parse('{"value":0}');

      expect(result).toEqual({ value: 0 });
    });

    it("should parse decimal number", () => {
      const result = parser.parse('{"value":3.14}');

      expect(result).toEqual({ value: 3.14 });
    });

    it("should parse negative decimal", () => {
      const result = parser.parse('{"value":-2.5}');

      expect(result).toEqual({ value: -2.5 });
    });

    it("should parse number with exponent", () => {
      const result = parser.parse('{"value":1e10}');

      expect(result).toEqual({ value: 1e10 });
    });

    it("should parse number with negative exponent", () => {
      const result = parser.parse('{"value":1e-5}');

      expect(result).toEqual({ value: 1e-5 });
    });

    it("should parse number with positive exponent notation", () => {
      const result = parser.parse('{"value":2.5e+3}');

      expect(result).toEqual({ value: 2.5e3 });
    });
  });

  describe("string formats", () => {
    it("should parse simple string", () => {
      const result = parser.parse('{"text":"hello"}');

      expect(result).toEqual({ text: "hello" });
    });

    it("should parse empty string", () => {
      const result = parser.parse('{"text":""}');

      expect(result).toEqual({ text: "" });
    });

    it("should parse string with spaces", () => {
      const result = parser.parse('{"text":"hello world"}');

      expect(result).toEqual({ text: "hello world" });
    });

    it("should parse string with escaped quotes", () => {
      const result = parser.parse('{"text":"She said \\"hello\\""}');

      expect(result).toEqual({ text: 'She said "hello"' });
    });

    it("should parse string with escaped backslash", () => {
      const result = parser.parse('{"path":"C:\\\\Users"}');

      expect(result).toEqual({ path: "C:\\Users" });
    });

    it("should parse string with escaped unicode hex", () => {
      const result = parser.parse('{"char":"\\u9f42"}');

      expect(result).toEqual({ char: "\u9f42" });
    });
  });

  describe("boolean values", () => {
    it("should parse true", () => {
      const result = parser.parse('{"flag":true}');

      expect(result).toEqual({ flag: true });
    });

    it("should parse false", () => {
      const result = parser.parse('{"flag":false}');

      expect(result).toEqual({ flag: false });
    });

    it("should parse multiple booleans", () => {
      const result = parser.parse('{"active":true,"deleted":false}');

      expect(result).toEqual({ active: true, deleted: false });
    });
  });

  describe("whitespace handling", () => {
    it("should parse with spaces", () => {
      const result = parser.parse('{ "name" : "Alice" }');

      expect(result).toEqual({ name: "Alice" });
    });

    it("should parse with tabs and newlines", () => {
      const input = `{
        "name": "Bob",
        "age": 30
      }`;
      const result = parser.parse(input);

      expect(result).toEqual({ name: "Bob", age: 30 });
    });

    it("should parse with excessive whitespace", () => {
      const result = parser.parse('  {  "key"  :  "value"  }  ');

      expect(result).toEqual({ key: "value" });
    });

    it("should parse compact JSON", () => {
      const result = parser.parse('{"a":1,"b":2,"c":3}');

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe("complex structures", () => {
    it("should parse typical user object", () => {
      const input = `{
        "id": 123,
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "active": true,
        "roles": ["admin", "user"],
        "metadata": null
      }`;

      const result = parser.parse(input);

      expect(result).toEqual({
        id: 123,
        name: "Alice Johnson",
        email: "alice@example.com",
        active: true,
        roles: ["admin", "user"],
        metadata: null,
      });
    });

    it("should parse nested data structure", () => {
      const input = `{
        "company": {
          "name": "Tech Corp",
          "employees": [
            {"name": "Alice", "role": "Engineer"},
            {"name": "Bob", "role": "Manager"}
          ],
          "founded": 2020
        }
      }`;

      const result = parser.parse(input);

      expect(result).toEqual({
        company: {
          name: "Tech Corp",
          employees: [
            { name: "Alice", role: "Engineer" },
            { name: "Bob", role: "Manager" },
          ],
          founded: 2020,
        },
      });
    });

    it("should parse array-heavy structure", () => {
      const input = `{
        "matrix": [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]
      }`;

      const result = parser.parse(input);

      expect(result).toEqual({
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      });
    });

    it("should parse deeply nested mixed structure", () => {
      const input = `{
        "data": {
          "users": [
            {
              "id": 1,
              "profile": {
                "name": "Alice",
                "tags": ["developer", "admin"]
              }
            }
          ]
        }
      }`;

      const result = parser.parse(input);

      expect(result).toEqual({
        data: {
          users: [
            {
              id: 1,
              profile: {
                name: "Alice",
                tags: ["developer", "admin"],
              },
            },
          ],
        },
      });
    });
  });

  describe("error handling", () => {
    it("should throw error for missing opening brace", () => {
      expect(() => parser.parse('"name":"value"}')).toThrow();
    });

    it("should throw error for missing closing brace", () => {
      expect(() => parser.parse('{"name":"value"')).toThrow();
    });

    it("should throw error for missing colon", () => {
      expect(() => parser.parse('{"name""value"}')).toThrow();
    });

    it("should throw error for missing comma between properties", () => {
      expect(() => parser.parse('{"a":1"b":2}')).toThrow();
    });

    it("should throw error for non-string key", () => {
      expect(() => parser.parse('{123:"value"}')).toThrow();
    });

    it("should throw error for trailing comma", () => {
      expect(() => parser.parse('{"name":"value",}')).toThrow();
    });

    it("should throw error for missing array closing bracket", () => {
      expect(() => parser.parse('{"arr":[1,2,3}')).toThrow();
    });

    it("should throw error for invalid value", () => {
      expect(() => parser.parse('{"key":undefined}')).toThrow();
    });

    it("should throw error for unquoted string", () => {
      expect(() => parser.parse('{"name":Alice}')).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should throw error when no valid value token is found", () => {
      expect(() => parser.parse('{"key"::')).toThrow("No value found");
    });
    it("should handle object with single property and no trailing comma", () => {
      const result = parser.parse('{"key":"value"}');

      expect(result).toEqual({ key: "value" });
    });

    it("should handle array with single element", () => {
      const result = parser.parse('{"arr":[42]}');

      expect(result).toEqual({ arr: [42] });
    });

    it("should handle empty string as key", () => {
      const result = parser.parse('{"":"empty key"}');

      expect(result).toEqual({ "": "empty key" });
    });

    it("should handle numeric strings", () => {
      const result = parser.parse('{"number":"123"}');

      expect(result).toEqual({ number: "123" });
    });

    it("should handle boolean-like strings", () => {
      const result = parser.parse('{"bool":"true"}');

      expect(result).toEqual({ bool: "true" });
    });

    it("should handle special characters in keys", () => {
      const result = parser.parse('{"key_with_underscore":"value"}');

      expect(result).toEqual({ key_with_underscore: "value" });
    });

    it("should differentiate between number and string number", () => {
      const result = parser.parse('{"num":42,"str":"42"}');

      expect(result).toEqual({ num: 42, str: "42" });
      expect(typeof (result as any).num).toBe("number");
      expect(typeof (result as any).str).toBe("string");
    });

    it("should handle null vs string null", () => {
      const result = parser.parse('{"nullValue":null,"stringNull":"null"}');

      expect(result).toEqual({ nullValue: null, stringNull: "null" });
      expect((result as any).nullValue).toBeNull();
      expect((result as any).stringNull).toBe("null");
    });
  });

  describe("real-world JSON examples", () => {
    it("should parse API response structure", () => {
      const input = `{
        "status": "success",
        "data": {
          "id": 456,
          "attributes": {
            "name": "Product A",
            "price": 29.99,
            "inStock": true,
            "tags": ["electronics", "gadget"]
          }
        },
        "meta": {
          "timestamp": 1234567890,
          "version": "1.0"
        }
      }`;

      const result = parser.parse(input);

      expect(result).toHaveProperty("status", "success");
      expect(result).toHaveProperty("data.id", 456);
      expect(result).toHaveProperty("data.attributes.price", 29.99);
    });

    it("should parse configuration object", () => {
      const input = `{
        "server": {
          "port": 8080,
          "host": "localhost",
          "ssl": false
        },
        "database": {
          "connection": "mongodb://localhost:27017",
          "pool": 10
        },
        "features": ["auth", "logging", "monitoring"]
      }`;

      const result = parser.parse(input);

      expect((result as any).server.port).toBe(8080);
      expect((result as any).features).toHaveLength(3);
    });
  });
});
