<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin options and user preference toggles.
 */
class SplitSMS_Settings {
    const OPTION_KEY = 'splitsms_settings';
    const DB_VERSION_OPTION = 'splitsms_db_version';

    /** @var self|null */
    private static $instance = null;

    /** @var array<string, mixed> */
    private $options = array();

    /** @var array<string, mixed> */
    private $temp_overrides = array();

    public static function instance() {
        if (null === self::$instance) {
            self::maybe_upgrade();
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $stored = get_option(self::OPTION_KEY, array());
        $this->options = wp_parse_args(is_array($stored) ? $stored : array(), self::defaults());
    }

    /**
     * Merge new option keys on plugin update without resetting saved settings.
     */
    public static function maybe_upgrade() {
        if (!defined('SPLITSMS_VERSION')) {
            return;
        }

        $stored_ver = get_option(self::DB_VERSION_OPTION, '0');
        if (is_string($stored_ver) && version_compare($stored_ver, SPLITSMS_VERSION, '>=')) {
            return;
        }

        $stored = get_option(self::OPTION_KEY, array());
        if (!is_array($stored)) {
            $stored = array();
        }

        $defaults = self::defaults();
        $merged = $stored;
        foreach ($defaults as $key => $default) {
            if (!array_key_exists($key, $merged)) {
                $merged[$key] = $default;
            }
        }

        if ('' !== trim((string) ($merged['api_key'] ?? ''))) {
            $merged['enabled'] = '1';
        }

        if (self::is_local_wp_site()) {
            $prod = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL : 'https://www.splitsms.com';
            $current = isset($merged['api_base_url']) ? rtrim((string) $merged['api_base_url'], '/') : '';
            if ('' === $current || $current === rtrim($prod, '/')) {
                $merged['api_base_url'] = 'http://127.0.0.1:3000';
            }
        }

        update_option(self::OPTION_KEY, $merged);
        update_option(self::DB_VERSION_OPTION, SPLITSMS_VERSION);

        if (class_exists('SplitSMS_Logger')) {
            SplitSMS_Logger::create_table();
        }
        if (class_exists('SplitSMS_Reminders')) {
            SplitSMS_Reminders::create_table();
            SplitSMS_Reminders::register_cron();
        }
    }

    public static function defaults() {
        $app_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL : 'https://www.splitsms.com';
        return array(
            'api_base_url' => $app_url,
            'api_key' => '',
            'api_key_suffix' => '',
            'sender_id' => 'SplitSMS',
            'country_code' => 'GH',
            'admin_phone' => '',
            'low_balance_alert_phone' => '',
            'debug_logs' => '0',
            'enabled' => '1',
            'wc_enabled' => '1',
            'wc_order_placed' => '1',
            'wc_order_processing' => '1',
            'wc_order_completed' => '1',
            'wc_order_cancelled' => '0',
            'wc_payment_complete' => '1',
            'wc_payment_on_processing' => '1',
            'wc_phone_meta_key' => '',
            'wc_tpl_placed' => 'Hi {customer_name}, we received order #{order_id} at {site_name}. Total: {order_total}. Thank you!',
            'wc_tpl_processing' => 'Hi {customer_name}, order #{order_id} is now being processed at {site_name}.',
            'wc_tpl_completed' => 'Hi {customer_name}, order #{order_id} is complete. Thank you for shopping at {site_name}!',
            'wc_tpl_cancelled' => 'Hi {customer_name}, order #{order_id} was cancelled. Contact us if you need help.',
            'wc_tpl_payment' => 'Hi {customer_name}, payment for order #{order_id} ({order_total}) was received. — {site_name}',
            'wp_enabled' => '1',
            'wp_user_register' => '1',
            'wp_password_reset' => '0',
            'wp_tpl_register' => 'Welcome to {site_name}, {customer_name}! Your account is ready.',
            'wp_tpl_password_reset' => '{site_name}: use this link to reset your password: {reset_link}',
            'cf7_enabled' => '0',
            'cf7_phone_field' => 'your-phone',
            'cf7_message' => 'Thanks for contacting {site_name}. We received your message and will reply soon.',
            'wpforms_enabled' => '0',
            'wpforms_phone_field' => 'phone',
            'wpforms_message' => 'Thanks for your submission at {site_name}. We will be in touch shortly.',
            'elementor_enabled' => '0',
            'elementor_phone_field' => 'phone',
            'elementor_message' => 'Hi {name}, thanks for contacting {site_name}. We received your form and will reply soon.',
            'otp_login_enabled' => '0',
            // Crocoblock / JetEngine
            'cb_enabled' => '0',
            'cb_phone_field' => 'phone',
            'cb_name_field' => 'name',
            'cb_fallback_phone' => '',
            'cb_admin_phone' => '',
            'cb_reminder_offset' => '86400',
            'cb_rules' => '',
            'cb_jetengine_enabled' => '0',
            'cb_jetengine_post_types' => '',
            'cb_jetengine_on_create' => '1',
            'cb_jetengine_on_update' => '0',
            'cb_jetengine_on_status' => '1',
            'cb_jetengine_admin_alert' => '1',
            'cb_jetengine_tpl_created' => 'Hi {name}, your {post_type} entry "{title}" was received at {site_name}.',
            'cb_jetengine_tpl_update' => 'Hi {name}, your entry "{title}" was updated at {site_name}.',
            'cb_jetengine_tpl_status' => 'Hi {name}, your entry status is now {status}. — {site_name}',
            'cb_jetengine_tpl_admin' => 'New {post_type} entry: {title}. Phone: {phone}. — {site_name}',
            'cb_jfb_enabled' => '0',
            'cb_jfb_form_ids' => '',
            'cb_jfb_phone_field' => 'phone',
            'cb_jfb_admin_alert' => '1',
            'cb_jfb_tpl_submitted' => 'Hi {name}, we received your form "{form_title}" at {site_name}.',
            'cb_jfb_tpl_admin' => 'New form submission: {form_title}. Phone: {phone}.',
            'cb_jetbooking_enabled' => '0',
            'cb_jetbooking_phone_field' => 'user_phone',
            'cb_jetbooking_on_create' => '1',
            'cb_jetbooking_on_status' => '1',
            'cb_jetbooking_reminder' => '1',
            'cb_jetbooking_admin_alert' => '1',
            'cb_jetbooking_tpl_created' => 'Hi {name}, your booking for {check_in} is received. — {site_name}',
            'cb_jetbooking_tpl_confirmed' => 'Hi {name}, your booking for {check_in} is confirmed.',
            'cb_jetbooking_tpl_cancelled' => 'Hi {name}, your booking was cancelled. Contact us if you need help.',
            'cb_jetbooking_tpl_status' => 'Hi {name}, your booking status is now {status}.',
            'cb_jetbooking_tpl_reminder' => 'Reminder: your booking check-in is {check_in}. — {site_name}',
            'cb_jetbooking_tpl_admin' => 'New booking from {name}. Check-in: {check_in}. Phone: {phone}.',
            'cb_jetappointment_enabled' => '0',
            'cb_jetappointment_phone_field' => 'user_phone',
            'cb_jetappointment_on_create' => '1',
            'cb_jetappointment_on_status' => '1',
            'cb_jetappointment_reminder' => '1',
            'cb_jetappointment_admin_alert' => '1',
            'cb_jetappointment_provider_alert' => '0',
            'cb_provider_phone_field' => 'provider_phone',
            'cb_jetappointment_tpl_created' => 'Hi {name}, your appointment on {appointment_date} at {appointment_time} is booked.',
            'cb_jetappointment_tpl_confirmed' => 'Hi {name}, your appointment is confirmed for {appointment_date} at {appointment_time}.',
            'cb_jetappointment_tpl_cancelled' => 'Hi {name}, your appointment was cancelled.',
            'cb_jetappointment_tpl_status' => 'Hi {name}, your appointment status is {status}.',
            'cb_jetappointment_tpl_reminder' => 'Reminder: appointment with {provider_name} on {appointment_date} at {appointment_time}.',
            'cb_jetappointment_tpl_admin' => 'New appointment: {client_name} on {appointment_date}. Phone: {phone}.',
            'cb_jetappointment_tpl_provider' => 'New appointment booked by {client_name} for {appointment_date} at {appointment_time}.',
        );
    }

    public static function activate_defaults() {
        if (!get_option(self::OPTION_KEY)) {
            add_option(self::OPTION_KEY, self::defaults());
        }
        if (class_exists('SplitSMS_Logger')) {
            SplitSMS_Logger::create_table();
        }
        if (class_exists('SplitSMS_Reminders')) {
            SplitSMS_Reminders::create_table();
            SplitSMS_Reminders::register_cron();
        }
    }

    public static function is_configured() {
        $s = self::instance();
        return self::is_yes($s->get('enabled'))
            && '' !== trim($s->get('api_base_url'))
            && '' !== trim($s->get('api_key'));
    }

    /**
     * Full SplitSMS keys are sk_test_/sk_live_ plus 48 hex chars (~56 characters).
     */
    public static function validate_api_key_format($key) {
        $key = trim((string) $key);
        if ('' === $key) {
            return true;
        }
        return (bool) preg_match('/^sk_(test|live)_[a-f0-9]{48}$/i', $key);
    }

    /**
     * True when user likely pasted the dashboard prefix (14 chars) instead of the full secret.
     */
    public static function looks_like_key_prefix_only($key) {
        $key = trim((string) $key);
        if ('' === $key) {
            return false;
        }
        if (self::validate_api_key_format($key)) {
            return false;
        }
        return (bool) preg_match('/^sk_(test|live)_[a-f0-9]{0,12}$/i', $key)
            && strlen($key) <= 16;
    }

    /**
     * Mask stored API key for display.
     */
    public function masked_api_key() {
        $key = $this->get('api_key');
        if ('' === $key) {
            return '';
        }
        $suffix = $this->get('api_key_suffix');
        if ('' === $suffix && strlen($key) > 4) {
            $suffix = substr($key, -4);
        }
        $prefix = strlen($key) > 8 ? substr($key, 0, 7) : 'sk_';
        return $prefix . str_repeat('*', 12) . $suffix;
    }

    public static function is_allowed_api_url($url) {
        if (!is_string($url) || '' === $url) {
            return false;
        }
        $parsed = parse_url($url);
        $host = isset($parsed['host']) ? strtolower($parsed['host']) : '';
        if ('' === $host) {
            return false;
        }
        $allowed = apply_filters(
            'splitsms_allowed_api_hosts',
            array(
                'www.splitsms.com',
                'splitsms.com',
                'localhost',
                '127.0.0.1',
                '::1',
                'host.docker.internal',
            )
        );
        return in_array($host, $allowed, true);
    }

    /**
     * True when this WordPress install looks like Local / dev (.local, localhost, etc.).
     */
    public static function is_local_wp_site() {
        $host = wp_parse_url(home_url(), PHP_URL_HOST);
        if (!is_string($host) || '' === $host) {
            return defined('WP_DEBUG') && WP_DEBUG;
        }
        $host = strtolower($host);
        return (defined('WP_DEBUG') && WP_DEBUG)
            || false !== strpos($host, '.local')
            || false !== strpos($host, 'localhost')
            || '127.0.0.1' === $host;
    }

    /**
     * @param string $url
     */
    public static function is_local_api_url($url) {
        if (!is_string($url) || '' === $url) {
            return false;
        }
        $host = wp_parse_url($url, PHP_URL_HOST);
        if (!is_string($host) || '' === $host) {
            return false;
        }
        $host = strtolower($host);
        return in_array($host, array('localhost', '127.0.0.1', '::1', 'host.docker.internal'), true);
    }

    public function all() {
        return $this->options;
    }

    public function get($key, $default = '') {
        if (isset($this->temp_overrides[$key])) {
            return $this->temp_overrides[$key];
        }
        return isset($this->options[$key]) ? $this->options[$key] : $default;
    }

    /**
     * Run a callback with temporary option overrides (e.g. test connection before save).
     *
     * @template T
     * @param array<string,mixed> $overrides
     * @param callable():T        $callback
     * @return T
     */
    public function with_overrides(array $overrides, $callback) {
        $previous = $this->temp_overrides;
        $this->temp_overrides = array_merge($this->temp_overrides, $overrides);
        try {
            return $callback();
        } finally {
            $this->temp_overrides = $previous;
        }
    }

    /**
     * Keys each admin form is allowed to change (other keys are preserved).
     *
     * @return array<string, array{keys:string[], checkboxes:string[]}>
     */
    public static function form_scopes() {
        return array(
            'settings' => array(
                'keys' => array(
                    'api_base_url',
                    'api_key',
                    'sender_id',
                    'country_code',
                    'admin_phone',
                    'low_balance_alert_phone',
                    'debug_logs',
                    'enabled',
                ),
                'checkboxes' => array('debug_logs', 'enabled'),
            ),
            'integrations' => array(
                'keys' => array(
                    'wc_enabled',
                    'wc_order_placed',
                    'wc_order_processing',
                    'wc_order_completed',
                    'wc_order_cancelled',
                    'wc_payment_complete',
                    'wc_payment_on_processing',
                    'wc_phone_meta_key',
                    'wc_tpl_payment',
                    'wp_enabled',
                    'wp_user_register',
                    'wp_password_reset',
                    'cf7_enabled',
                    'cf7_phone_field',
                    'cf7_message',
                    'wpforms_enabled',
                    'wpforms_phone_field',
                    'wpforms_message',
                    'elementor_enabled',
                    'elementor_phone_field',
                    'elementor_message',
                ),
                'checkboxes' => array(
                    'wc_enabled',
                    'wc_order_placed',
                    'wc_order_processing',
                    'wc_order_completed',
                    'wc_order_cancelled',
                    'wc_payment_complete',
                    'wc_payment_on_processing',
                    'wp_enabled',
                    'wp_user_register',
                    'wp_password_reset',
                    'cf7_enabled',
                    'wpforms_enabled',
                    'elementor_enabled',
                ),
            ),
            'crocoblock' => array(
                'keys' => array(
                    'cb_enabled',
                    'cb_phone_field',
                    'cb_name_field',
                    'cb_fallback_phone',
                    'cb_admin_phone',
                    'cb_reminder_offset',
                    'cb_rules',
                    'cb_jetengine_enabled',
                    'cb_jetengine_post_types',
                    'cb_jetengine_on_create',
                    'cb_jetengine_on_update',
                    'cb_jetengine_on_status',
                    'cb_jetengine_admin_alert',
                    'cb_jetengine_tpl_created',
                    'cb_jetengine_tpl_update',
                    'cb_jetengine_tpl_status',
                    'cb_jetengine_tpl_admin',
                    'cb_jfb_enabled',
                    'cb_jfb_form_ids',
                    'cb_jfb_phone_field',
                    'cb_jfb_admin_alert',
                    'cb_jfb_tpl_submitted',
                    'cb_jfb_tpl_admin',
                    'cb_jetbooking_enabled',
                    'cb_jetbooking_phone_field',
                    'cb_jetbooking_on_create',
                    'cb_jetbooking_on_status',
                    'cb_jetbooking_reminder',
                    'cb_jetbooking_admin_alert',
                    'cb_jetbooking_tpl_created',
                    'cb_jetbooking_tpl_confirmed',
                    'cb_jetbooking_tpl_cancelled',
                    'cb_jetbooking_tpl_status',
                    'cb_jetbooking_tpl_reminder',
                    'cb_jetbooking_tpl_admin',
                    'cb_jetappointment_enabled',
                    'cb_jetappointment_phone_field',
                    'cb_jetappointment_on_create',
                    'cb_jetappointment_on_status',
                    'cb_jetappointment_reminder',
                    'cb_jetappointment_admin_alert',
                    'cb_jetappointment_provider_alert',
                    'cb_provider_phone_field',
                    'cb_jetappointment_tpl_created',
                    'cb_jetappointment_tpl_confirmed',
                    'cb_jetappointment_tpl_cancelled',
                    'cb_jetappointment_tpl_status',
                    'cb_jetappointment_tpl_reminder',
                    'cb_jetappointment_tpl_admin',
                    'cb_jetappointment_tpl_provider',
                ),
                'checkboxes' => array(
                    'cb_enabled',
                    'cb_jetengine_enabled',
                    'cb_jetengine_on_create',
                    'cb_jetengine_on_update',
                    'cb_jetengine_on_status',
                    'cb_jetengine_admin_alert',
                    'cb_jfb_enabled',
                    'cb_jfb_admin_alert',
                    'cb_jetbooking_enabled',
                    'cb_jetbooking_on_create',
                    'cb_jetbooking_on_status',
                    'cb_jetbooking_reminder',
                    'cb_jetbooking_admin_alert',
                    'cb_jetappointment_enabled',
                    'cb_jetappointment_on_create',
                    'cb_jetappointment_on_status',
                    'cb_jetappointment_reminder',
                    'cb_jetappointment_admin_alert',
                    'cb_jetappointment_provider_alert',
                ),
            ),
        );
    }

    /**
     * @param array<string,mixed> $input
     * @param string              $scope settings|integrations|crocoblock
     */
    public function update(array $input, $scope = 'settings') {
        $defaults = self::defaults();
        $scopes = self::form_scopes();
        $scope_def = isset($scopes[$scope]) ? $scopes[$scope] : $scopes['settings'];
        $scope_keys = $scope_def['keys'];
        $scope_checkboxes = $scope_def['checkboxes'];
        $clean = array();
        $checkboxes = array(
            'enabled',
            'debug_logs',
            'wc_enabled',
            'wc_order_placed',
            'wc_order_processing',
            'wc_order_completed',
            'wc_order_cancelled',
            'wc_payment_complete',
            'wc_payment_on_processing',
            'wp_enabled',
            'wp_user_register',
            'wp_password_reset',
            'cf7_enabled',
            'wpforms_enabled',
            'elementor_enabled',
            'otp_login_enabled',
            'cb_enabled',
            'cb_jetengine_enabled',
            'cb_jetengine_on_create',
            'cb_jetengine_on_update',
            'cb_jetengine_on_status',
            'cb_jetengine_admin_alert',
            'cb_jfb_enabled',
            'cb_jfb_admin_alert',
            'cb_jetbooking_enabled',
            'cb_jetbooking_on_create',
            'cb_jetbooking_on_status',
            'cb_jetbooking_reminder',
            'cb_jetbooking_admin_alert',
            'cb_jetappointment_enabled',
            'cb_jetappointment_on_create',
            'cb_jetappointment_on_status',
            'cb_jetappointment_reminder',
            'cb_jetappointment_admin_alert',
            'cb_jetappointment_provider_alert',
        );

        foreach ($defaults as $key => $default) {
            if (!in_array($key, $scope_keys, true)) {
                $clean[$key] = isset($this->options[$key]) ? $this->options[$key] : $default;
                continue;
            }

            if (!isset($input[$key])) {
                if (in_array($key, $checkboxes, true)) {
                    if (in_array($key, $scope_checkboxes, true)) {
                        $clean[$key] = '0';
                    } else {
                        $clean[$key] = isset($this->options[$key]) ? $this->options[$key] : $default;
                    }
                } elseif ('api_key' === $key) {
                    $clean[$key] = isset($this->options[$key]) ? $this->options[$key] : '';
                    $clean['api_key_suffix'] = isset($this->options['api_key_suffix']) ? $this->options['api_key_suffix'] : '';
                } else {
                    $clean[$key] = isset($this->options[$key]) ? $this->options[$key] : $default;
                }
                continue;
            }

            $value = $input[$key];
            if ('api_base_url' === $key) {
                $url = esc_url_raw(rtrim($value, '/'));
                if (!self::is_allowed_api_url($url)) {
                    $url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL : 'https://www.splitsms.com';
                }
                $clean[$key] = $url;
            } elseif ('api_key' === $key) {
                $value = sanitize_text_field($value);
                if ('' === $value && isset($this->options['api_key'])) {
                    $clean[$key] = $this->options['api_key'];
                    $clean['api_key_suffix'] = isset($this->options['api_key_suffix']) ? $this->options['api_key_suffix'] : '';
                } elseif ('' !== $value && !self::validate_api_key_format($value)) {
                    set_transient(
                        'splitsms_settings_error',
                        self::looks_like_key_prefix_only($value)
                            ? __('That is only the key prefix (e.g. sk_test_99a064), not the full secret. In SplitSMS, create or rotate a key and copy the entire ~56-character key shown once.', 'splitsms')
                            : __('Invalid API key format. Paste the full key from SplitSMS (starts with sk_test_ or sk_live_ and is about 56 characters).', 'splitsms'),
                        45
                    );
                    $clean[$key] = isset($this->options['api_key']) ? $this->options['api_key'] : '';
                    $clean['api_key_suffix'] = isset($this->options['api_key_suffix']) ? $this->options['api_key_suffix'] : '';
                } else {
                    $clean[$key] = $value;
                    $clean['api_key_suffix'] = strlen($value) >= 4 ? substr($value, -4) : '';
                }
            } elseif (strpos($key, '_tpl') !== false || strpos($key, 'tpl_') !== false || 'cb_rules' === $key || in_array($key, array('cf7_message', 'wpforms_message', 'elementor_message'), true)) {
                $clean[$key] = sanitize_textarea_field($value);
            } elseif (in_array($key, $checkboxes, true)) {
                $clean[$key] = self::is_yes($value) ? '1' : '0';
            } else {
                $clean[$key] = sanitize_text_field($value);
            }
        }

        if ('' !== trim((string) ($clean['api_key'] ?? ''))) {
            $clean['enabled'] = '1';
        }

        $this->options = wp_parse_args($clean, $defaults);
        update_option(self::OPTION_KEY, $this->options);

        if (self::is_configured()) {
            $api = new SplitSMS_API();
            $api->connect_site();
        }
    }

    public static function is_yes($value) {
        return in_array($value, array('1', 1, true, 'yes', 'on'), true);
    }

    public function feature_enabled($key) {
        return self::is_yes($this->get($key));
    }

    public function clear_api_key() {
        $this->options['api_key'] = '';
        $this->options['api_key_suffix'] = '';
        $this->options['enabled'] = '0';
        update_option(self::OPTION_KEY, $this->options);
    }

    /**
     * Human-readable reason when is_configured() is false.
     */
    public static function configuration_error() {
        $s = self::instance();
        if ('' === trim($s->get('api_key'))) {
            return __('API key is missing. Paste your key and click Save settings, then Test connection.', 'splitsms');
        }
        if (!self::is_yes($s->get('enabled'))) {
            return __('Plugin is disabled. Save settings again to re-enable, or update to the latest plugin version.', 'splitsms');
        }
        if ('' === trim($s->get('api_base_url'))) {
            return __('API base URL is missing.', 'splitsms');
        }
        return __('SplitSMS is not configured.', 'splitsms');
    }
}
