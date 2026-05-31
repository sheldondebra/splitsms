export class ConnectResource {
    constructor(http) {
        this.http = http;
    }
    listCustomers(params = {}) {
        const q = new URLSearchParams();
        if (params.limit !== undefined)
            q.set("limit", String(params.limit));
        if (params.external_ref)
            q.set("external_ref", params.external_ref);
        const query = q.toString();
        return this.http.request("GET", `/api/v1/connect/customers${query ? `?${query}` : ""}`);
    }
    createCustomer(input) {
        return this.http.request("POST", "/api/v1/connect/customers", input);
    }
    getCustomer(id) {
        return this.http.request("GET", `/api/v1/connect/customers/${encodeURIComponent(id)}`);
    }
}
