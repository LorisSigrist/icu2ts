# icu2ts
This is meant as a building block for typesafe i18n libraries.

- Generate type definitions for ICU messages.
- Compile ICU messages into JS functions

## Generate Types

```ts
import { generateType } from "icu2ts";

const message =
    "Hello {name}! You have {count, plural, one {1 message} other {# messages}}.";

const typeDefinition = generateType(message);

// typeDefinition = { name: string, count: number };
```

The types may not be as compact as they could be, but they are correct.

### Caveats

When a `select`, `plural`, or `selectordinal` with an "other" branch is encountered it is not possible to use a type-union, since the fallback type would match all branches, not just the fallback. Instead, the type is a union of all branch-types. This is rarely a problem, but you should be aware of it.

Eg:

```ts
const msg = "{count, plural, one {1 {arg1}} other {# {arg2}}}";
//becomes
{ count: number } & ({ arg1: string } | { arg2: string }); //No type-narrowing
```

Until TypeScript supports a union of the form `"a" | string`, this is the best we can do.

## Compile Messages
Use the compile function to generate a function that can be used to format the message. These functions can be used to eliminate the need for a runtime i18n library.

```ts
import { compile } from "icu2ts";

const message = "Hello {name}! You have {count, plural, one {1 message} other {# messages}}.";

const compiled = compile(message, "en");

// compiled : ({name,count}) => `Hello ${name}! You have ${new Intl.PluralRules("en", {type: "cardinal"}).select(count) === "one" ? `1 message` : `${new Intl.NumberFormat("en").format(count)} messages` }.`
```

This code minifies very well, and does not require any runtime dependencies.