export class CampaignsResource {
    constructor(http) {
        this.http = http;
    }
    list(params = {}) {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined)
                q.set(k, String(v));
        }
        const query = q.toString();
        return this.http.request("GET", `/api/v1/campaigns${query ? `?${query}` : ""}`);
    }
    get(id) {
        return this.http.request("GET", `/api/v1/campaigns/${id}`);
    }
    messages(id, params = {}) {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined)
                q.set(k, String(v));
        }
        const query = q.toString();
        return this.http.request("GET", `/api/v1/campaigns/${id}/messages${query ? `?${query}` : ""}`);
    }
}
