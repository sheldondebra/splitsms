export class SenderIdsResource {
    constructor(http) {
        this.http = http;
    }
    list(customerId) {
        const q = customerId ? `?customer_id=${encodeURIComponent(customerId)}` : "";
        return this.http.request("GET", `/api/v1/sender-ids${q}`);
    }
    register(input) {
        return this.http.request("POST", "/api/v1/sender-ids", input);
    }
    get(id) {
        return this.http.request("GET", `/api/v1/sender-ids/${encodeURIComponent(id)}`);
    }
}
