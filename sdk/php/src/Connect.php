<?php

namespace SplitSMS;

class Connect
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function listCustomers(array $query = array())
    {
        $params = http_build_query($query);
        $path = '/api/v1/connect/customers' . ($params ? '?' . $params : '');
        return $this->http->request('GET', $path);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function createCustomer(array $payload)
    {
        return $this->http->request('POST', '/api/v1/connect/customers', $payload);
    }

    /**
     * @param string $id
     * @return array<string, mixed>
     */
    public function getCustomer($id)
    {
        return $this->http->request('GET', '/api/v1/connect/customers/' . rawurlencode($id));
    }
}
