import Dialog from './base.js'

Dialog.showInfo = () => {
    return Dialog.show('About Booksmart', (dialog) => {
        dialog.style.width = '33%'
        
        add('p', 'Thanks for using Booksmart!')

        add('p', 'Booksmart is a simple bookmark manager and customisable homepage extension for Chrome or ')
            .add('a', 'Vivaldi', { href: 'https://vivaldi.com' })
            .then('span', '.')

        add('p', () => {
            add('div', 'Booksmart is an open source project. The source code is available on GitHub: ').add('a', 'https://github.com/ifyates/Booksmart', { href: 'https://github.com/ifyates/Booksmart' })
            add('div', 'If you find a bug, or want to contribute to the project, please do it there.')
        })

        add('p', 'If you want to support the project or thank me, you can buying me a 🍵: ').add('a', 'https://buymeacoffee.com/ifyates', { href: 'https://buymeacoffee.com/ifyates' })
        
        add('p', { style: 'text-align:right' }, () => {
            add('div', 'Booksmart v1.0 October 2024')
            add('div', 'Copyright (c) 2024, IFYates. All rights reserved.')
        })

        add('div', { style: 'margin-top:2em; text-align:center' }, () => {
            add('button', 'Close').onclick = () => dialog.close()
        })
    })
}