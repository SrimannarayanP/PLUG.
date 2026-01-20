// imageHelper.js


export const getImageUrl = (path) => {

    if (!path) return null

    if (path.startsWith('http')) return path

    const BASE_URL = 'http://127.0.0.1:8000'

    return `${BASE_URL}${path}`

}
