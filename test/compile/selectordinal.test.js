import { compile } from "../../src/compile.js";
import { describe, it, expect } from "vitest";
import { formatJS } from "./utils.js";

describe("compile selectordinal", () => {
    it("compiles a selectordinal", () => {
        let message = "{count, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}";
        let compiled = compile(message, "en");

        for (let i = 1; i < 10; i++) {
            let result = eval(`(${compiled})({ count: ${i} })`);
            let correct = formatJS(message, { count: i });

            expect(result).toMatch(correct);
        }
    });
});