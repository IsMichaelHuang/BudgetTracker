

export function formatToDate(dateString?: string) {
    if (!dateString) return ""

    // Regex if the string already matches YYYY-MM-DD
    if (/^d{4}-\d{2}$/.test(dateString)) return dateString

    // Covert the data object to YYYY-MM-DD
    try {
        return new Date(dateString).toISOString().slice(0, 10)
    } catch {
        return ""
    }
}

