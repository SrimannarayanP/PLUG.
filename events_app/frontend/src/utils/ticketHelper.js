// ticketHelper.js


export const checkEventExpiry = (endDate) => {
    if (!endDate) return false

    const end = new Date(endDate)
    const now = new Date()

    const GRACE_PERIOD = 12 * 60 * 60 * 1000 // in ms

    const expirationTime = new Date(end.getTime() + GRACE_PERIOD)

    return now > expirationTime
}


export const getScarcityState = (event) => {
    if (event.is_sold_out) return {status : 'SOLD_OUT', text : "Sold Out"}
    
    if (event.capacity === null) return null

    const threshold = event.capacity * 0.2

    if (event.remaining_capacity <= threshold) {
        if (event.remaining_capacity <= 5) {
            
            return {status : 'CRITICAL', text : `Only ${event.remaining_capacity} Left!`}

        }

        return {status : 'WARNING', text : "Selling Fast"}
    }

    return null
}
