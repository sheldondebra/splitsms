<?php

namespace SplitSMS;

class Otp
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /**
     * @return array<string, mixed>
     */
    public function send($phone, $countryCode = 'GH')
    {
        return $this->http->request('POST', '/api/v1/otp/send', array(
            'phone' => $phone,
            'countryCode' => $countryCode,
        ));
    }

    /**
     * @return array<string, mixed>
     */
    public function verify($phone, $code)
    {
        return $this->http->request('POST', '/api/v1/otp/verify', array(
            'phone' => $phone,
            'code' => $code,
        ));
    }
}
