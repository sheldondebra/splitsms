<?php

namespace SplitSMS;

class Wallet
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
    public function balance()
    {
        return $this->http->request('GET', '/api/v1/wallet/balance');
    }

    /**
     * @return array<string, mixed>
     */
    public function accountBalance()
    {
        return $this->http->request('GET', '/api/v1/balance');
    }
}
