<?php

namespace SplitSMS;

class Sms
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function send(array $payload)
    {
        return $this->http->request('POST', '/api/v1/sms/send', $payload);
    }

    /**
     * @param string $id
     * @return array<string, mixed>
     */
    public function get($id)
    {
        return $this->http->request('GET', '/api/v1/messages/' . rawurlencode($id));
    }
}
