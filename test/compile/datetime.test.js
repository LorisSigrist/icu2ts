import { compile } from "../../src/compile.js";
import { describe, it, expect } from "vitest";
import { formatJS } from "./utils.js";

describe("compile date & time", () => {

    it("compiles a message with a short time argument into a function", () => {
        const message = "Hello {time, time, short}";
        const compiled = compile(message, "en");

        const values = { time: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ time: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });

    it("compiles a message with a medium time argument into a function", () => {
        const message = "Hello {time, time, medium}";
        const compiled = compile(message, "en");

        const values = { time: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ time: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });

    it("compiles a message with a long time argument into a function", () => {
        const message = "Hello {time, time, long}";
        const compiled = compile(message, "en");

        const values = { time: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ time: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });

    it("compiles a message with a short date argument into a function", () => {
        const message = "Hello {date, date, short}";
        const compiled = compile(message, "en");

        const values = { date: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ date: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });

    it("compiles a message with a medium date argument into a function", () => {
        const message = "Hello {date, date, medium}";
        const compiled = compile(message, "en");

        const values = { date: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ date: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });

    it("compiles a message with a long date argument into a function", () => {
        const message = "Hello {date, date, long}";
        const compiled = compile(message, "en");

        const values = { date: new Date(2021, 1, 1, 12, 0, 0) };
        const result = eval(
            `(${compiled})({ date: new Date(2021, 1, 1, 12, 0, 0) })`,
        );

        const correct = formatJS(message, values);
        expect(result).toMatch(correct);
    });
});