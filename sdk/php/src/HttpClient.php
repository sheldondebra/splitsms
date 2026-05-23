<?php

namespace SplitSMS;

class HttpClient
{
    /** @var string */
    private $apiKey;

    /** @var string */
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'https://www.splitsms.com')
    {
        if (!$apiKey) {
            throw new SplitSMSError('apiKey is required');
        }
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /**
     * @param string $method
     * @param string $path
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    public function request($method, $path, $body = null)
    {
        $url = $this->baseUrl . $path;
        $ch = curl_init($url);
        if ($ch === false) {
            throw new SplitSMSError('Failed to initialize cURL');
        }

        $headers = array(
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
        );

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            throw new SplitSMSError($err ?: 'Request failed');
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $data = array();
        }

        if ($status < 200 || $status >= 300) {
            $msg = isset($data['error']['message']) ? $data['error']['message'] : 'API request failed';
            $code = isset($data['error']['code']) ? $data['error']['code'] : null;
            throw new SplitSMSError($msg, $code, $status);
        }

        return $data;
    }
}
