export class WalletResource {
    constructor(http) {
        this.http = http;
    }
    balance() {
        return this.http.request("GET", "/api/v1/wallet/balance");
    }
    /** Alias for account-level balance */
    accountBalance() {
        return this.http.request("GET", "/api/v1/balance");
    }
    transactions(params = {}) {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined)
                q.set(k, String(v));
        }
        const query = q.toString();
        return this.http.request("GET", `/api/v1/wallet/transactions${query ? `?${query}` : ""}`);
    }
}
