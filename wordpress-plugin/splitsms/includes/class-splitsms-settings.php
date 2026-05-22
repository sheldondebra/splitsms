<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin options and user preference toggles.
 */
class SplitSMS_Settings {
    const OPTION_KEY = 'splitsms_settings';

    /** @var self|null */
    private static $instance = null;

    /** @var array<string, mixed> */
    private $options = array();

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $stored = get_option(self::OPTION_KEY, array());
        $this->options = wp_parse_args(is_array($stored) ? $stored : array(), self::defaults());
    }

    public static function defaults() {
        return array(
            'api_base_url' => '',
            'api_key' => '',
            'sender_id' => 'SplitSMS',
            'country_code' => 'GH',
            'enabled' => '1',
            // WooCommerce
            'wc_enabled' => '1',
            'wc_order_placed' => '1',
            'wc_order_processing' => '1',
            'wc_order_completed' => '1',
            'wc_order_cancelled' => '0',
            'wc_payment_complete' => '1',
            'wc_tpl_placed' => 'Hi {customer_name}, we received order #{order_id} at {site_name}. Total: {order_total}. Thank you!',
            'wc_tpl_processing' => 'Hi {customer_name}, order #{order_id} is now being processed at {site_name}.',
            'wc_tpl_completed' => 'Hi {customer_name}, order #{order_id} is complete. Thank you for shopping at {site_name}!',
            'wc_tpl_cancelled' => 'Hi {customer_name}, order #{order_id} was cancelled. Contact us if you need help.',
            'wc_tpl_payment' => 'Hi {customer_name}, payment for order #{order_id} ({order_total}) was received. — {site_name}',
            // WordPress core
            'wp_enabled' => '1',
            'wp_user_register' => '1',
            'wp_password_reset' => '0',
            'wp_tpl_register' => 'Welcome to {site_name}, {customer_name}! Your account is ready.',
            'wp_tpl_password_reset' => '{site_name}: use this link to reset your password: {reset_link}',
            // Form plugins
            'cf7_enabled' => '0',
            'cf7_phone_field' => 'your-phone',
            'cf7_message' => 'Thanks for contacting {site_name}. We received your message and will reply soon.',
            'wpforms_enabled' => '0',
            'wpforms_phone_field' => 'phone',
            'wpforms_message' => 'Thanks for your submission at {site_name}. We will be in touch shortly.',
            // Optional login OTP (requires phone on user meta splitsms_phone)
            'otp_login_enabled' => '0',
        );
    }

    public static function activate_defaults() {
        if (!get_option(self::OPTION_KEY)) {
            add_option(self::OPTION_KEY, self::defaults());
        }
    }

    public static function is_configured() {
        $s = self::instance();
        return self::is_yes($s->get('enabled'))
            && '' !== trim($s->get('api_base_url'))
            && '' !== trim($s->get('api_key'));
    }

    public function all() {
        return $this->options;
    }

    public function get($key, $default = '') {
        return isset($this->options[$key]) ? $this->options[$key] : $default;
    }

    public function update(array $input) {
        $defaults = self::defaults();
        $clean = array();
        $checkboxes = array(
            'enabled',
            'wc_enabled',
            'wc_order_placed',
            'wc_order_processing',
            'wc_order_completed',
            'wc_order_cancelled',
            'wc_payment_complete',
            'wp_enabled',
            'wp_user_register',
            'wp_password_reset',
            'cf7_enabled',
            'wpforms_enabled',
            'otp_login_enabled',
        );

        foreach ($defaults as $key => $default) {
            if (!isset($input[$key])) {
                if (in_array($key, $checkboxes, true)) {
                    $clean[$key] = '0';
                } else {
                    $clean[$key] = isset($this->options[$key]) ? $this->options[$key] : $default;
                }
                continue;
            }

            $value = $input[$key];
            if ('api_base_url' === $key) {
                $clean[$key] = esc_url_raw(rtrim($value, '/'));
            } elseif ('api_key' === $key) {
                $clean[$key] = sanitize_text_field($value);
            } elseif (strpos($key, 'tpl_') !== false || in_array($key, array('cf7_message', 'wpforms_message'), true)) {
                $clean[$key] = sanitize_textarea_field($value);
            } elseif (in_array($key, $checkboxes, true)) {
                $clean[$key] = self::is_yes($value) ? '1' : '0';
            } else {
                $clean[$key] = sanitize_text_field($value);
            }
        }

        $this->options = wp_parse_args($clean, $defaults);
        update_option(self::OPTION_KEY, $this->options);
    }

    public static function is_yes($value) {
        return in_array($value, array('1', 1, true, 'yes', 'on'), true);
    }

    public function feature_enabled($key) {
        return self::is_yes($this->get($key));
    }
}
