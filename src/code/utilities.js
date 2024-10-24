/**
 * Checks if the given string is a valid URL.
 * @param {string} url URL to test
 * @returns {boolean|URL} The URL if valid, false if not
 */
globalThis.isURL = function (url) {
    try {
        return !!new URL(url).hostname
    } catch {
        return false
    }
}

/**
 * Converts the given value to a number, returning the original value or a
 * default one if the conversion fails.
 * @param {any} value The value to convert.
 * @param {number} [otherwise=0] The default value to return if the
 * conversion fails. Defaults to 0.
 * @returns {number} The converted number, or the default value.
 */
globalThis.num = function (value, otherwise = 0) {
    const result = Number(value)
    return !isNaN(result) ? result : otherwise
}

/**
 * Tries to parse a JSON string, returning the result or a default value on failure.
 * If the second argument is a function, it is called with no arguments and its
 * return value is used as the default.
 * @param {string} json The JSON string to parse.
 * @param {function|any} [alt] The default value to return on failure.
 * @returns {any} The parsed JSON or the default value.
 */
globalThis.tryParse = function (json, alt) {
    try {
        return json instanceof Object ? json : JSON.parse(json)
    } catch {
        return typeof (alt) === 'function' ? alt() : alt
    }
}