<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WordPress core SMS — registration and password reset.
 */
class SplitSMS_WordPress {
    /** @var self|null */
    private static $instance = null;

    /** @var SplitSMS_Settings */
    private $settings;

    /** @var SplitSMS_API */
    private $api;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->settings = SplitSMS_Settings::instance();
        $this->api = new SplitSMS_API($this->settings);

        if (!$this->settings->feature_enabled('wp_enabled')) {
            return;
        }

        if ($this->settings->feature_enabled('wp_user_register')) {
            add_action('user_register', array($this, 'on_user_register'), 20, 1);
        }
        if ($this->settings->feature_enabled('wp_password_reset')) {
            add_filter('retrieve_password_message', array($this, 'on_password_reset'), 20, 4);
        }
    }

    public function on_user_register($user_id) {
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }

        $phone = get_user_meta($user_id, 'billing_phone', true);
        if ('' === trim($phone)) {
            $phone = get_user_meta($user_id, 'splitsms_phone', true);
        }
        if ('' === trim($phone)) {
            return;
        }

        $vars = array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => $user->display_name,
        );

        $message = SplitSMS_API::render_template($this->settings->get('wp_tpl_register'), $vars);
        $this->api->send_sms($phone, $message, array(
            'source' => 'wordpress',
            'event' => 'user_register',
        ));
    }

    /**
     * @param string   $message
     * @param string   $key
     * @param string   $user_login
     * @param WP_User  $user_data
     * @return string
     */
    public function on_password_reset($message, $key, $user_login, $user_data) {
        $phone = get_user_meta($user_data->ID, 'splitsms_phone', true);
        if ('' === trim($phone)) {
            $phone = get_user_meta($user_data->ID, 'billing_phone', true);
        }
        if ('' === trim($phone)) {
            return $message;
        }

        $reset_link = network_site_url('wp-login.php?action=rp&key=' . $key . '&login=' . rawurlencode($user_login), 'login');
        $vars = array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => $user_data->display_name,
            'reset_link' => $reset_link,
        );

        $sms = SplitSMS_API::render_template($this->settings->get('wp_tpl_password_reset'), $vars);
        $this->api->send_sms($phone, $sms, array(
            'source' => 'wordpress',
            'event' => 'password_reset',
        ));

        return '';
    }
}
