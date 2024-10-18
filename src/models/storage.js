/*
Wrapper around Chrome storage.
Uses chrome.storage.sync to preserve changes across all user browsers.
Note that this has a 100KB limit - 8KB per key.
*/
class Storage {
    static async get(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(key, (result) => {
                try {
                    result[key] = JSON.parse(result[key])
                } catch { }
                resolve(result[key])
            })
        })
    }

    static async set(key, value) {
        return new Promise((resolve, reject) => {
            value = JSON.stringify(value)
            chrome.storage.sync.set({ [key]: value }, () => {
                resolve()
            })
        })
    }
}

export default Storage