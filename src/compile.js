import { TYPE, parse } from "@formatjs/icu-messageformat-parser";

/**
 * Compiles a message into a function that can be used to format the message
 * 
 * @param {string} message
 * @param {string} locale
 * @return {string} String literal or function that returns a string
 */
export function compile(message, locale) {
    const parsed = parse(message, {
        shouldParseSkeletons: true,
        requiresOtherClause: false,
    });

    return compileAST(parsed, locale);
}

/**
 * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement[]} elements
 * @param {string} locale
 * @returns {string}
 */
function compileAST(elements, locale) {
    if (hasOnlyLiterals(elements)) {
        return '()=>"' + elements.map((e) => e.value).join("") + '"';
    }

    const args = getArgumentNames(elements);

    return (
        "({" +
        Array.from(args).join(",") +
        "}) => `" +
        elements.map((el) => compileElement(el, locale, null)).join("") +
        "`"
    );
}

/**
 * Compile a single element
 * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement} element
 * @param {string} locale
 * @param {string | null} poundValue
 * @returns {string}
 */
function compileElement(element, locale, poundValue) {
    switch (element.type) {
        case TYPE.literal:
            return element.value;
        case TYPE.argument:
            return "${" + element.value + "}";
        case TYPE.tag:
            return (
                "<${" +
                element.value +
                "}>" +
                element.children
                    .map((el) => compileElement(el, locale, poundValue))
                    .join("") +
                "</${" +
                element.value +
                "}>"
            );
        case TYPE.select: {
            return compileSelect(element, locale, poundValue);
        }
        case TYPE.pound: {
            if (poundValue === null) {
                throw new Error(
                    "Pound sign used outside of plural/select element",
                );
            }
            return "${new Intl.NumberFormat(\""+ locale +"\").format(" + poundValue + ")}";
        }
        case TYPE.plural: {
            return compilePlural(element, locale, poundValue);
        }
        case TYPE.time: {
            return (
                "${" +
                `new Intl.DateTimeFormat("${locale}",` +
                `{timeStyle: "${element.style}"}` +
                `).format(${element.value})}`
            );
        }
        case TYPE.date: {
            return (
                "${" +
                `new Intl.DateTimeFormat("${locale}",` +
                `{dateStyle: "${element.style}"}` +
                `).format(${element.value})}`
            );
        }
    }
}

/**
 * @param {import("@formatjs/icu-messageformat-parser").SelectElement} element
 * @param {string} locale
 * @param {string | null} poundValue
 * @returns {string}
 */
function compileSelect(element, locale, poundValue) {
    let fallback = '""';

    /**
     * @type {Record<string, string>}
     */
    const options = {};

    for (const [key, option] of Object.entries(element.options)) {
        if (key === "other") {
            fallback =
                "`" +
                option.value
                    .map((el) => compileElement(el, locale, poundValue))
                    .join("") +
                "`";
        } else {
            options[key] =
                "`" +
                option.value
                    .map((el) => compileElement(el, locale, poundValue))
                    .join("") +
                "`";
        }
    }

    let str = "${";

    for (const [key, option] of Object.entries(options)) {
        str += `${element.value} === "${key}" ? ${option} : `;
    }

    str += `${fallback}`;

    str += "}";
    return str;
}

/**
 * @param {import("@formatjs/icu-messageformat-parser").PluralElement} element
 * @param {string} locale
 * @param {string | null} poundValue
 * @returns {string}
 */
function compilePlural(element, locale, poundValue) {
    /*
    zero: This category is used for languages that have grammar specialized specifically for zero number of items. (Examples are Arabic and Latvian.)
    one: This category is used for languages that have grammar specialized specifically for one item. Many languages, but not all, use this plural category. (Many popular Asian languages, such as Chinese and Japanese, do not use this category.)
    two: This category is used for languages that have grammar specialized specifically for two items. (Examples are Arabic and Welsh.)
    few: This category is used for languages that have grammar specialized specifically for a small number of items. For some languages this is used for 2-4 items, for some 3-10 items, and other languages have even more complex rules.
    many: This category is used for languages that have grammar specialized specifically for a larger number of items. (Examples are Arabic, Polish, and Russian.)
    other: This category is used if the value doesn't match one of the other plural categories. Note that this is used for "plural" for languages (such as English) that have a simple "singular" versus "plural" dichotomy.
    =value: This is used to match a specific value regardless of the plural categories of the current locale.
    */

    /** @type {Record<number, string>} */
    const exactValues = {};

    /** @type {Record<Intl.LDMLPluralRule | string, string>} */
    const pluralValues = {};

    let fallback = '""';

    for (const [key, option] of Object.entries(element.options)) {
        if (key.startsWith("=")) {
            const number = parseInt(key.slice(1));
            exactValues[number] =
                "`" +
                option.value
                    .map((el) => compileElement(el, locale, element.value))
                    .join("") +
                "`";
        } else if (key === "other") {
            fallback =
                "`" +
                option.value
                    .map((el) => compileElement(el, locale, element.value))
                    .join("") +
                "`";
        }
        else {
            pluralValues[key] =
                "`" +
                option.value
                    .map((el) => compileElement(el, locale, element.value))
                    .join("") +
                "`";
        }
    }

    let str = "${";

    for (const [number, option] of Object.entries(exactValues)) {
        str += `${element.value} == ${number} ? ${option} : `;
    }

    for (const [pluralRule, option] of Object.entries(pluralValues)) {
        str += `new Intl.PluralRules("${locale}", {type: "${element.pluralType}"}).select(${element.value}) === "${pluralRule}" ? ${option} : `;
    }

    str += `${fallback} }`;
    return str;
}

/**
 * Walk the AST to find all argument names, so that we can destructure the arguments
 * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement[]} elements
 * @returns {Set<string>}
 */
function getArgumentNames(elements) {
    const args = new Set();

    /**
     * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement[]} elements
     */
    function walk(elements) {
        for (const element of elements) {
            switch (element.type) {
                case TYPE.date:
                case TYPE.number:
                case TYPE.time:
                case TYPE.argument:
                    args.add(element.value);
                    break;
                case TYPE.tag:
                    args.add(element.value);
                    walk(element.children);
                    break;
                case TYPE.select:
                case TYPE.plural:
                    args.add(element.value);
                    for (const [key, option] of Object.entries(
                        element.options,
                    )) {
                        walk(option.value);
                    }

                    break;
            }
        }
    }

    walk(elements);
    return args;
}

/**
 * A TypeGuard that checks if an array of elements contains only literals
 *
 * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement[]} elements
 * @returns {elements is import("@formatjs/icu-messageformat-parser").LiteralElement[]}
 */
function hasOnlyLiterals(elements) {
    let hasOnlyLiterals = true;
    for (const element of elements) {
        hasOnlyLiterals &&= element.type === TYPE.literal;
    }
    return hasOnlyLiterals;
}
