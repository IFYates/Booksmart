/**
 * Returns all keys of the object, including those inherited from the prototype.
 * @returns {string[]} An array of strings containing all keys.
 */
Object.prototype.allKeys = function () {
    const objectKeys = Object.keys(this)
    const classProperties = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this))
    const classKeys = Object.entries(classProperties)
        .filter(d => d[1].get && d[0] !== '__proto__')
        .map(d => d[0])
    return objectKeys.concat(classKeys).sort()
}
Object.defineProperty(Object.prototype, 'allKeys', { enumerable: false, writable: false, configurable: false })

/**
 * Compares two objects for equality, recursively traversing properties and
 * arrays. If the objects are not the same type, they are not equal.
 * @param {any} other The object to compare to.
 * @returns {boolean} True if the two objects are equal.
 */
Object.prototype.areEquivalent = function (other) {
    if (this === other) {
        return true
    }
    if (Array.isArray(this) && Array.isArray(other)) {
        return this.length === other.length
            && this.every((e, i) => other[i] === e)
    }
    return false
}
Object.defineProperty(Object.prototype, 'areEquivalent', { enumerable: false, writable: false, configurable: false })

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
 * Picks properties from the current object based on the provided defaults and 
 * an optional exclusion predicate.
 * 
 * @param {Object|Array} defaults - An object or array specifying the default 
 * keys to include in the result. If an object, properties will be excluded if
 * the values are identical.
 * @param {Function} [excludeOtherPredicate=null] - An optional function to 
 * determine whether to exclude keys not present in 'defaults'. 
 * Receives the value and key as arguments and excludes the property if 
 * the function doesn't return false.
 * @returns {Object} A new object containing the selected properties.
 */
Object.prototype.pick = function (defaults, excludeOtherPredicate = null) {
    if (Array.isArray(defaults ??= {})) {
        // Convert to object
        defaults = defaults.reduce((res, k) => {
            res[k] = undefined
            return res
        }, {})
    }

    const result = {}
    for (const [key, value] of this.allKeys().map(k => [k, this[k]])) {
        if ((defaults.hasOwnProperty(key) && !(typeof defaults[key] !== 'function' ? defaults[key]?.areEquivalent(value) : defaults[key](value, key)))
            || (!defaults.hasOwnProperty(key) && excludeOtherPredicate?.call(this, value, key) === false)) {
            result[key] = value
        }
    }
    return result
}
Object.defineProperty(Object.prototype, 'pick', { enumerable: false, writable: false, configurable: false })

Object.prototype.strip = function (keys) {
    const obj = { ...this }
    for (const key of keys) {
        if (this.hasOwnProperty(key)) {
            delete obj[key]
        }
    }
    return obj
}
Object.defineProperty(Object.prototype, 'strip', { enumerable: false, writable: false, configurable: false })

/**
 * Removes all keys from the object that don't match the given key list or
 * predicate.
 * @param {string[]|function} [keyList] List of keys to keep. If a function,
 * it will be called with each value and key as arguments, and return true if
 * the key should be kept.
 * @param {function?} [excludeOtherPredicate] Predicate to use if the key is not in
 * the defaults object. True means excluded.
 * @returns {this} The object with removed keys
 */
Object.prototype.tidy = function (defaults, excludeOtherPredicate = null) {
    if (Array.isArray(defaults)) {
        // Convert to object
        defaults = defaults.reduce((res, k) => {
            res[k] = undefined
            return res
        }, {})
    }

    for (const [key, value] of Object.entries(this)) {
        if ((!defaults.hasOwnProperty(key) && excludeOtherPredicate?.call(this, value, key) === true)
            || defaults[key]?.areEquivalent(value)
            || (typeof defaults[key] === 'function' && defaults[key](value, key) === true)) {
            delete this[key]
        }
    }
    return this
}
Object.defineProperty(Object.prototype, 'tidy', { enumerable: false, writable: false, configurable: false })

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

/// TEMP
Number.prototype.toHex = function () {
    var num = this, res = ''
    while (num > 0) {
        const rem = num % 16
        res = '0123456789ABCDEF'.substring(rem, rem + 1) + res
        num = (num - rem) / 16
    }
    return res.length < 2 ? '0' + res : res
}
String.prototype.fromHex = function () {
    var res = 0
    for (var i = 0; i < this.length; ++i) {
        res *= 16
        res += '0123456789ABCDEF'.indexOf(this[i].toUpperCase())
    }
    return res
}