// textHelper.js


import DOMPurify from 'dompurify'


export const stripHtml = (html) => {

    if (!html) return ''

    // Server side check: If we are on the server, we must use RegEx as DOMPurify requires a window/component to work fully. 
    if (typeof window === 'undefined') {

        return html.replace(/<[^>]*>?/gm, '')

    }

    // Client side: Use DOMPurify to sanitise first.
    const cleanHtml = DOMPurify.sanitize(html)
    const tmp = document.createElement('DIV')

    tmp.innerHTML = cleanHtml

    return tmp.textContent || ''
}
