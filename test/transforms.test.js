const assert = require("assert");
const Transforms = require("../transforms");

describe("Transforms", function() {
  describe("#transform_sentence()", function() {
    it("Transforms contains #transform_sentence()", function() {
      assert("transform_sentence" in Transforms);
    });

    it("throws error when not provided a string", function() {
      assert.throws(
        function arg_undefined() { Transforms.transform_sentence(undefined); },
        TypeError
      );

      assert.throws(
        function arg_null() { Transforms.transform_sentence(null); },
        TypeError
      );

      assert.throws(
        function arg_boolean() { Transforms.transform_sentence(true); },
        TypeError
      );

      assert.throws(
        function arg_number() { Transforms.transform_sentence(0); },
        TypeError
      );
    });

    it("does not transform a string containing no terminating period", function() {
      const before = "a.b.c";
      assert(Transforms.transform_sentence(before) === before);
    });

    it("removes terminating period from a string containing one", function() {
      const before = "a.b.c.", after = "a.b.c";
      assert(Transforms.transform_sentence(before) === after);
    });
  });
});
