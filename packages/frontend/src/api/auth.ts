export function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing Token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}
