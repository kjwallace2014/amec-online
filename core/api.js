const BASE_PATH = (() => {
    let path = window.location.pathname;
    path = path.substring(0, path.lastIndexOf("/") + 1);
    return path;
})();

const API = BASE_PATH + "api/";

async function api(endpoint, options = {}) {

    const response = await fetch(
        API + endpoint,
        {
            credentials: "include",
            ...options
        }
    );

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error("API returned non-JSON response:", {
            endpoint,
            status: response.status,
            response: text
        });

        throw new Error(
            `API error (${response.status}): Server returned non-JSON response.`
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `API request failed (${response.status})`
        );
    }

    return data;
}
