export class MessagesResource {
    constructor(http) {
        this.http = http;
    }
    /** Send one or more SMS messages */
    send(input) {
        return this.http.request("POST", "/api/v1/sms/send", input);
    }
    /** Get delivery status for a message */
    get(id) {
        return this.http.request("GET", `/api/v1/messages/${id}`);
    }
    /** List delivery reports */
    reports(params = {}) {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined)
                q.set(k, String(v));
        }
        const query = q.toString();
        return this.http.request("GET", `/api/v1/reports${query ? `?${query}` : ""}`);
    }
}
