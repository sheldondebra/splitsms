<?php

namespace SplitSMS;

class SenderIds
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /**
     * @param string|null $customerId
     * @return array<string, mixed>
     */
    public function list($customerId = null)
    {
        $path = '/api/v1/sender-ids';
        if ($customerId) {
            $path .= '?customer_id=' . rawurlencode($customerId);
        }
        return $this->http->request('GET', $path);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function register(array $payload)
    {
        return $this->http->request('POST', '/api/v1/sender-ids', $payload);
    }

    /**
     * @param string $id
     * @return array<string, mixed>
     */
    public function get($id)
    {
        return $this->http->request('GET', '/api/v1/sender-ids/' . rawurlencode($id));
    }
}
