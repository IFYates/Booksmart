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
 * Removes all keys from the object that don't match the given key list or
 * predicate.
 * @param {string[]|function} [keyList] List of keys to keep. If a function,
 * it will be called with each value and key as arguments, and return true if
 * the key should be kept.
 * @param {function?} [fallbackPredicate] Predicate to use if the key is not in
 * the defaults object.
 * @returns {this} The object with removed keys
 */
Object.prototype.tidy = function (defaults, fallbackPredicate) {
    if (Array.isArray(defaults)) {
        defaults = defaults.reduce((res, k) => { res[k] = undefined; return res }, {})
    }
    for (var [key, value] of Object.entries(this)) {
        if ((!defaults.hasOwnProperty(key) && (!fallbackPredicate || fallbackPredicate(value, key) === true))
            || areEquivalent(defaults[key], value)
            || (typeof defaults[key] === 'function' && defaults[key](value, key) === true)) {
            delete this[key]
        }
    }
    return this
}
Object.defineProperty(Object.prototype, 'tidy', { enumerable: false, writable: false, configurable: false });
function areEquivalent(a, b) {
    if (a === b) {
        return true
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length
            && a.every((e, i) => b[i] === e)
    }
    return false
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