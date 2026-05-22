<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WordPress core and form-plugin SMS hooks.
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

        if ($this->settings->feature_enabled('wp_enabled')) {
            if ($this->settings->feature_enabled('wp_user_register')) {
                add_action('user_register', array($this, 'on_user_register'), 20, 1);
            }
            if ($this->settings->feature_enabled('wp_password_reset')) {
                add_filter('retrieve_password_message', array($this, 'on_password_reset'), 20, 4);
            }
        }

        if ($this->settings->feature_enabled('cf7_enabled') && class_exists('WPCF7_ContactForm')) {
            add_action('wpcf7_mail_sent', array($this, 'on_cf7_sent'), 20, 1);
        }

        if ($this->settings->feature_enabled('wpforms_enabled') && function_exists('wpforms')) {
            add_action('wpforms_process_complete', array($this, 'on_wpforms_complete'), 20, 4);
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
        $this->api->send_sms($phone, $message);
    }

    public function on_password_reset($message, $key, $user_login, $user_data) {
        unset($message);
        $phone = get_user_meta($user_data->ID, 'splitsms_phone', true);
        if ('' === trim($phone)) {
            $phone = get_user_meta($user_data->ID, 'billing_phone', true);
        }
        if ('' === trim($phone)) {
            return '';
        }

        $reset_link = network_site_url('wp-login.php?action=rp&key=' . $key . '&login=' . rawurlencode($user_login), 'login');
        $vars = array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => $user_data->display_name,
            'reset_link' => $reset_link,
        );

        $sms = SplitSMS_API::render_template($this->settings->get('wp_tpl_password_reset'), $vars);
        $this->api->send_sms($phone, $sms);

        return '';
    }

    /**
     * @param WPCF7_ContactForm $contact_form
     */
    public function on_cf7_sent($contact_form) {
        $submission = WPCF7_Submission::get_instance();
        if (!$submission) {
            return;
        }

        $posted = $submission->get_posted_data();
        $field = $this->settings->get('cf7_phone_field', 'your-phone');
        $phone = isset($posted[$field]) ? $posted[$field] : '';

        if ('' === trim($phone)) {
            return;
        }

        $vars = array('site_name' => get_bloginfo('name'));
        $message = SplitSMS_API::render_template($this->settings->get('cf7_message'), $vars);
        $this->api->send_sms($phone, $message);
    }

    public function on_wpforms_complete($fields, $entry, $form_data, $entry_id) {
        unset($entry_id);
        $field_id = $this->settings->get('wpforms_phone_field', 'phone');
        $phone = '';

        if (is_array($fields)) {
            foreach ($fields as $field) {
                if (!empty($field['name']) && $field['name'] === $field_id) {
                    $phone = isset($field['value']) ? $field['value'] : '';
                    break;
                }
            }
        }

        if ('' === trim($phone) && !empty($form_data['fields'])) {
            foreach ($form_data['fields'] as $field) {
                if (!empty($field['label']) && sanitize_title($field['label']) === sanitize_title($field_id)) {
                    $phone = isset($fields[$field['id']]['value']) ? $fields[$field['id']]['value'] : '';
                    break;
                }
            }
        }

        if ('' === trim($phone)) {
            return;
        }

        $vars = array('site_name' => get_bloginfo('name'));
        $message = SplitSMS_API::render_template($this->settings->get('wpforms_message'), $vars);
        $this->api->send_sms($phone, $message);
    }
}
