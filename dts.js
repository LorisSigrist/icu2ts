//generates the type-declarations for this package
import { createBundle } from "dts-buddy";

export default createBundle({
    output: "types/index.d.ts",
    modules: {
        "icu2ts": "./src/index.js",
    },
});
