chrome.bookmarks.getTree((tree) => {
    const bookmarkList = document.getElementById('bookmarkList')

    var txt = document.createElement('li')
    txt.textContent = 'now: ' + new Date()
    bookmarkList.appendChild(txt)

    txt = document.createElement('li')
    txt.textContent = 'URL: ' + chrome.runtime.getURL('index.html')
    bookmarkList.appendChild(txt)

    var url = chrome.runtime.getURL('index.html')
    chrome.tabs.create({ url: url })
})