import { parse, TYPE } from "@formatjs/icu-messageformat-parser";

/**
 * Generates a typescript type for the arguments in a message.
 *
 * @param {string} message
 * @returns {string}
 */
export function generateType(message) {
    const parsed = parse(message, { requiresOtherClause: false });
    const type = generateTypeFromAST(parsed);
    if (type.length === 0) return "{}";
    return type;
}

/**
 * @param {import("@formatjs/icu-messageformat-parser").MessageFormatElement[]} elements
 * @returns {string} - The typescript type. If the type is empty, then the return value is an empty string.
 */
function generateTypeFromAST(elements) {
    const intersectionElements = [];

    for (const element of elements) {
        switch (element.type) {
            case TYPE.number: {
                intersectionElements.push(`{ ${element.value}: number}`);
                break;
            }

            case TYPE.argument: {
                intersectionElements.push(
                    `{ ${element.value}: string | number }`,
                );
                break;
            }

            case TYPE.date:
            case TYPE.time: {
                intersectionElements.push(`{ ${element.value}: Date }`);
                break;
            }

            case TYPE.tag: {
                intersectionElements.push(`{ ${element.value}: string }`);

                //Make sure to also generate types for the children of the tag
                const contentType = generateTypeFromAST(element.children);
                if (contentType.length > 0) {
                    intersectionElements.push(`(${contentType})`);
                }

                break;
            }

            case TYPE.plural: {
                let str = "";
                str += `{ ${element.value}: number }`;

                const branchTypes = [];
                let emptyBranch = false;
                for (const [key, option] of Object.entries(element.options)) {
                    const branchType = generateTypeFromAST(option.value);
                    if (branchType.length > 0) {
                        branchTypes.push(branchType);
                    } else {
                        emptyBranch = true;
                    }
                }

                if (branchTypes.length > 0) {
                    str += " & ((";
                    str += branchTypes.join(") | (");
                    if (emptyBranch) str += ") | ({}";
                    str += "))";
                }

                intersectionElements.push(str);
                break;
            }

            case TYPE.select: {
                let hasOther = false;
                let options = Object.keys(element.options);
                if (options.includes("other")) {
                    hasOther = true;
                    options = options.filter((option) => option !== "other");
                }

                if (hasOther) {
                    const optionsString =
                        options.map((option) => `"${option}"`).join(" | ") +
                        " | (string & {})";
                    let str = `{ ${element.value}: ${optionsString} }`;

                    const branchTypes = [];
                    let emptyBranch = false;
                    for (const [key, option] of Object.entries(
                        element.options,
                    )) {
                        const branchType = generateTypeFromAST(option.value);
                        if (branchType.length > 0) {
                            branchTypes.push(branchType);
                        } else {
                            emptyBranch = true;
                        }
                    }

                    if (branchTypes.length > 0) {
                        str += " & ((";
                        str += branchTypes.join(") | (");
                        if (emptyBranch) str += ") | ({}";

                        str += "))";
                    }

                    intersectionElements.push(str);
                    break;
                } else {
                    const unionElements = [];
                    for (const option of options) {
                        const branchType = generateTypeFromAST(
                            element.options[option].value,
                        );
                        if (branchType === "")
                            unionElements.push(
                                `{ ${element.value}: "${option}" }`,
                            );
                        else {
                            unionElements.push(
                                `({ ${element.value}: "${option}" } & (${branchType}))`,
                            );
                        }
                    }

                    let str = unionElements.join(" | ");
                    intersectionElements.push(str);
                }
                break;
            }
        }
    }

    return intersectionElements.join(" & ");
}
