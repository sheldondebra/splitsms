<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * SplitSMS REST API client.
 */
class SplitSMS_API {
    /** @var SplitSMS_Settings */
    private $settings;

    public function __construct(SplitSMS_Settings $settings = null) {
        $this->settings = $settings ?: SplitSMS_Settings::instance();
    }

    /**
     * @param string       $to      E.164 or local number.
     * @param string       $message SMS body.
     * @param array<string> $extra  Optional overrides: sender, countryCode.
     * @return array{ok:bool, error?:string, data?:array}
     */
    public function send_sms($to, $message, $extra = array()) {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => 'not_configured');
        }

        $to = preg_replace('/\s+/', '', $to);
        if ('' === $to) {
            return array('ok' => false, 'error' => 'empty_phone');
        }

        $base = rtrim($this->settings->get('api_base_url'), '/');
        $url = $base . '/api/v1/sms/send';

        $body = array(
            'sender' => isset($extra['sender']) ? $extra['sender'] : $this->settings->get('sender_id', 'SplitSMS'),
            'message' => $message,
            'to' => $to,
            'countryCode' => isset($extra['countryCode']) ? $extra['countryCode'] : $this->settings->get('country_code', 'GH'),
        );

        $response = wp_remote_post(
            $url,
            array(
                'timeout' => 20,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->settings->get('api_key'),
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ),
                'body' => wp_json_encode($body),
            )
        );

        if (is_wp_error($response)) {
            $this->log('HTTP error: ' . $response->get_error_message());
            return array('ok' => false, 'error' => $response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        $raw = wp_remote_retrieve_body($response);
        $data = json_decode($raw, true);

        if ($code >= 200 && $code < 300 && is_array($data) && !empty($data['success'])) {
            return array('ok' => true, 'data' => $data);
        }

        $message_err = is_array($data) && isset($data['error']['message'])
            ? $data['error']['message']
            : 'API request failed (' . $code . ')';

        $this->log($message_err);
        return array('ok' => false, 'error' => $message_err, 'data' => $data);
    }

    /**
     * @return array{ok:bool, error?:string, balance?:float}
     */
    public function test_connection() {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => 'not_configured');
        }

        $base = rtrim($this->settings->get('api_base_url'), '/');
        $url = $base . '/api/v1/balance';

        $response = wp_remote_get(
            $url,
            array(
                'timeout' => 15,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->settings->get('api_key'),
                    'Accept' => 'application/json',
                ),
            )
        );

        if (is_wp_error($response)) {
            return array('ok' => false, 'error' => $response->get_error_message());
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (is_array($data) && !empty($data['success'])) {
            $balance = isset($data['wallet']['balance']) ? (float) $data['wallet']['balance'] : 0;
            return array('ok' => true, 'balance' => $balance);
        }

        return array('ok' => false, 'error' => 'Could not reach SplitSMS API');
    }

    /**
     * Replace {placeholders} in templates.
     *
     * @param string               $template
     * @param array<string, string> $vars
     */
    public static function render_template($template, $vars) {
        $out = $template;
        foreach ($vars as $key => $value) {
            $out = str_replace('{' . $key . '}', $value, $out);
        }
        return $out;
    }

    private function log($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[SplitSMS] ' . $message);
        }
    }
}
