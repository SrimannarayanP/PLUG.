// ticketHelper.js


export const checkEventExpiry = (endDate) => {
    if (!endDate) return false

    const end = new Date(endDate)
    const now = new Date()

    const GRACE_PERIOD = 12 * 60 * 60 * 1000 // in ms

    const expirationTime = new Date(end.getTime() + GRACE_PERIOD)

    return now > expirationTime
}
