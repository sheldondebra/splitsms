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
     * @param string              $to
     * @param string              $message
     * @param array<string,mixed> $extra
     * @return array{ok:bool, error?:string, data?:array}
     */
    public function send_sms($to, $message, $extra = array()) {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => SplitSMS_Settings::configuration_error());
        }

        $to = preg_replace('/\s+/', '', $to);
        if ('' === $to) {
            return array('ok' => false, 'error' => 'empty_phone');
        }

        $event = isset($extra['event']) ? $extra['event'] : 'sms_send';
        $source = isset($extra['source']) ? $extra['source'] : 'wordpress';
        $external_ref = isset($extra['external_ref']) ? $extra['external_ref'] : null;

        $log_id = SplitSMS_Logger::instance()->log(array(
            'event' => $event,
            'recipient' => $to,
            'message_type' => 'transactional',
             'status' => 'pending',
            'source' => $source,
            'body' => $message,
            'external_ref' => $external_ref,
        ));

        $url = $this->endpoint('/api/v1/sms/send');
        $body = array(
            'sender' => isset($extra['sender']) ? $extra['sender'] : $this->settings->get('sender_id', 'SplitSMS'),
            'message' => $message,
            'to' => $to,
            'countryCode' => isset($extra['countryCode']) ? $extra['countryCode'] : $this->settings->get('country_code', 'GH'),
        );

        $response = $this->request('POST', $url, $body);
        if (!empty($response['ok'])) {
            $message_id = null;
            if (isset($response['data']['data']['message_id'])) {
                $message_id = $response['data']['data']['message_id'];
            } elseif (isset($response['data']['message_id'])) {
                $message_id = $response['data']['message_id'];
            }
            $this->update_log_status($log_id, 'sent', $message_id);
            return array('ok' => true, 'data' => $response['data'], 'log_id' => $log_id);
        }

        $err = isset($response['error']) ? $response['error'] : 'send_failed';
        $this->update_log_status($log_id, 'failed');
        return array('ok' => false, 'error' => $err, 'data' => isset($response['data']) ? $response['data'] : null, 'log_id' => $log_id);
    }

    /**
     * @return array{ok:bool, error?:string, account?:array}
     */
    public function get_account_status() {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => SplitSMS_Settings::configuration_error());
        }

        $response = $this->request('GET', $this->endpoint('/api/v1/account/status'));
        if (!empty($response['ok']) && isset($response['data']['account'])) {
            return array('ok' => true, 'account' => $response['data']['account']);
        }

        return $this->test_connection_legacy();
    }

    /**
     * @return array{ok:bool, error?:string, balance?:float, account?:array}
     */
    public function test_connection() {
        $status = $this->get_account_status();
        if (!empty($status['ok']) && isset($status['account'])) {
            $acct = $status['account'];
            return array(
                'ok' => true,
                'balance' => isset($acct['wallet_balance']) ? (float) $acct['wallet_balance'] : 0,
                'account' => $acct,
            );
        }
        return $status;
    }

    /**
     * Register this WordPress site with SplitSMS.
     *
     * @return array{ok:bool, error?:string}
     */
    public function connect_site() {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => 'not_configured');
        }

        global $wp_version;
        $payload = array(
            'site_url' => home_url('/'),
            'site_name' => get_bloginfo('name'),
            'wp_version' => $wp_version,
            'plugin_version' => SPLITSMS_VERSION,
            'php_version' => PHP_VERSION,
        );

        $response = $this->request('POST', $this->endpoint('/api/v1/wordpress/connect'), $payload);
        return !empty($response['ok'])
            ? array('ok' => true)
            : array('ok' => false, 'error' => isset($response['error']) ? $response['error'] : 'connect_failed');
    }

    /**
     * @param array<string,mixed> $row
     * @return array{ok:bool, error?:string}
     */
    public function push_log($row) {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => 'not_configured');
        }

        $payload = array(
            'site_url' => home_url('/'),
            'event' => isset($row['event']) ? $row['event'] : 'sms',
            'recipient' => isset($row['recipient']) ? $row['recipient'] : null,
            'message_type' => isset($row['message_type']) ? $row['message_type'] : null,
            'status' => isset($row['status']) ? $row['status'] : 'pending',
            'source' => isset($row['source']) ? $row['source'] : 'wordpress',
            'body' => isset($row['body']) ? $row['body'] : null,
            'cost' => isset($row['cost']) ? $row['cost'] : null,
            'external_ref' => isset($row['external_ref']) ? $row['external_ref'] : null,
            'message_id' => isset($row['message_id']) ? $row['message_id'] : null,
        );

        $response = $this->request('POST', $this->endpoint('/api/v1/wordpress/logs'), $payload);
        return !empty($response['ok'])
            ? array('ok' => true)
            : array('ok' => false, 'error' => isset($response['error']) ? $response['error'] : 'log_failed');
    }

    /**
     * @param string               $template
     * @param array<string,string> $vars
     */
    public static function render_template($template, $vars) {
        $out = $template;
        foreach ($vars as $key => $value) {
            $out = str_replace('{' . $key . '}', $value, $out);
        }
        return $out;
    }

    /**
     * @param string $path
     */
    private function endpoint($path) {
        $base = rtrim($this->settings->get('api_base_url'), '/');
        return $base . $path;
    }

    /**
     * @param string              $method
     * @param string              $url
     * @param array<string,mixed>|null $body
     * @return array{ok:bool, error?:string, data?:array}
     */
    private function request($method, $url, $body = null) {
        $args = array(
            'timeout' => 20,
            'method' => $method,
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->settings->get('api_key'),
                'Accept' => 'application/json',
            ),
        );

        if (null !== $body) {
            $args['headers']['Content-Type'] = 'application/json';
            $args['body'] = wp_json_encode($body);
        }

        if (SplitSMS_Settings::is_local_api_url($url)) {
            $args['sslverify'] = false;
            $args['reject_unsafe_urls'] = false;
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            $this->debug_log('HTTP error: ' . $response->get_error_message());
            return array('ok' => false, 'error' => $response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        $raw = wp_remote_retrieve_body($response);
        $data = json_decode($raw, true);

        if ($code >= 200 && $code < 300 && is_array($data) && !empty($data['success'])) {
            return array('ok' => true, 'data' => $data);
        }

        if (is_array($data) && isset($data['error']['message'])) {
            $message_err = $data['error']['message'];
            if (isset($data['error']['code']) && 'FORBIDDEN' === $data['error']['code']) {
                $message_err .= ' ' . __('Add wallet.read permission to your API key.', 'splitsms');
            }
        } else {
            $message_err = sprintf(
                /* translators: 1: HTTP status code 2: request URL */
                __('API request failed (%1$s) — %2$s', 'splitsms'),
                (string) $code,
                $url
            );
        }

        $this->debug_log($message_err . ' [' . $code . '] ' . $url);
        return array('ok' => false, 'error' => $message_err, 'data' => is_array($data) ? $data : null);
    }

    /**
     * @return array{ok:bool, error?:string, balance?:float}
     */
    private function test_connection_legacy() {
        $response = $this->request('GET', $this->endpoint('/api/v1/balance'));
        if (!empty($response['ok'])) {
            $data = $response['data'];
            $balance = isset($data['wallet']['balance']) ? (float) $data['wallet']['balance'] : 0;
            $credits = isset($data['sms_credits']) ? (int) $data['sms_credits'] : 0;
            return array(
                'ok' => true,
                'balance' => $balance,
                'account' => array(
                    'wallet_balance' => $balance,
                    'sms_credits' => $credits,
                    'wallet_currency' => isset($data['wallet']['currency']) ? $data['wallet']['currency'] : 'GHS',
                    'status' => !empty($data['sandbox']) ? 'sandbox' : 'active',
                ),
            );
        }
        return array('ok' => false, 'error' => isset($response['error']) ? $response['error'] : 'Could not reach SplitSMS API');
    }

    /**
     * @param int         $log_id
     * @param string      $status
     * @param string|null $message_id
     */
    private function update_log_status($log_id, $status, $message_id = null) {
        if (!$log_id) {
            return;
        }
        global $wpdb;
        $data = array('status' => $status);
        $format = array('%s');
        if ($message_id) {
            $data['message_id'] = $message_id;
            $format[] = '%s';
        }
        $wpdb->update(self::logger_table(), $data, array('id' => $log_id), $format, array('%d'));
    }

    private static function logger_table() {
        return SplitSMS_Logger::table_name();
    }

    private function debug_log($message) {
        if (SplitSMS_Settings::instance()->feature_enabled('debug_logs') || (defined('WP_DEBUG') && WP_DEBUG)) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[SplitSMS] ' . $message);
        }
    }
}
