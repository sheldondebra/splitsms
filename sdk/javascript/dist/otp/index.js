export class OtpResource {
    constructor(http) {
        this.http = http;
    }
    send(phone, countryCode = "GH") {
        return this.http.request("POST", "/api/v1/otp/send", {
            phone,
            countryCode,
        });
    }
    verify(phone, code) {
        return this.http.request("POST", "/api/v1/otp/verify", {
            phone,
            code,
        });
    }
}
