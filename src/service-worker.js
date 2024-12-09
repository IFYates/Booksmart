chrome.action.onClicked.addListener(() => {
    const url = chrome.runtime.getURL('index.html')
    chrome.tabs.create({ url: url })
})

chrome.action.setIcon({
    path: chrome.runtime.getURL('assets/icon.png')
})