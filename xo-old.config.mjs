const xoJson = {
    "rules": {
        "brace-style": "off",
        "@typescript-eslint/brace-style": [
            "error",
            "stroustrup"
        ],
        "comma-dangle": [
            "error",
            "always-multiline"
        ],
        "curly": [
            "error",
            "multi-line"
        ],
        "import/no-unresolved": [
            "error",
            {
                "ignore": [
                    "relations.local",
                    "settings.local"
                ]
            }
        ],
        "import/no-unassigned-import": [
            "error",
            {
                "allow": [
                    "prototype/*",
                    "**/constants"
                ]
            }
        ],
        "prefer-destructuring": [
            "error",
            {
                "array": false,
                "object": false
            }
        ],
        "unicorn/prefer-node-protocol": [
            "off"
        ],
        "unicorn/no-array-callback-reference": [
            "off"
        ],
        "unicorn/no-array-method-this-argument": [
            "off"
        ]
    },
    "globals": [
        "_",
        "Game",
        "Memory"
    ],
    "ignores": [
        "snippets.js",
        "mock/constants.ts",
        "src/utils/Profiler"
    ],
    "settings": {
        "import/resolver": {
            "typescript": {}
        }
    }
}
export default []