<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor Pro form submissions → SMS.
 */
class SplitSMS_Elementor {

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
        if (!defined('ELEMENTOR_PRO_VERSION')) {
            return;
        }

        $this->settings = SplitSMS_Settings::instance();
        if (!$this->settings->feature_enabled('elementor_enabled')) {
            return;
        }

        $this->api = new SplitSMS_API($this->settings);
        add_action('elementor_pro/forms/new_record', array($this, 'on_new_record'), 20, 2);
    }

    /**
     * @param \ElementorPro\Modules\Forms\Record  $record
     * @param \ElementorPro\Modules\Forms\Classes\Form_Record $handler
     */
    public function on_new_record($record, $handler) {
        unset($handler);
        if (!is_object($record) || !method_exists($record, 'get')) {
            return;
        }

        $raw = $record->get('fields');
        if (!is_array($raw)) {
            return;
        }

        $fields = array();
        foreach ($raw as $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = isset($item['id']) ? (string) $item['id'] : '';
            $title = isset($item['title']) ? (string) $item['title'] : $id;
            $value = isset($item['value']) ? $item['value'] : '';
            if (is_array($value)) {
                $value = implode(', ', $value);
            }
            $fields[$id] = (string) $value;
            if ('' !== $title) {
                $fields[sanitize_title($title)] = (string) $value;
            }
        }

        $phone_field = $this->settings->get('elementor_phone_field', 'phone');
        $phone = $this->find_phone($fields, $phone_field);
        if ('' === trim($phone)) {
            return;
        }

        $name = $this->find_name($fields);
        $vars = array(
            'site_name' => get_bloginfo('name'),
            'name' => $name,
            'first_name' => isset($fields['first_name']) ? $fields['first_name'] : (isset($fields['firstname']) ? $fields['firstname'] : ''),
            'last_name' => isset($fields['last_name']) ? $fields['last_name'] : (isset($fields['lastname']) ? $fields['lastname'] : ''),
            'email' => isset($fields['email']) ? $fields['email'] : '',
            'phone' => $phone,
            'phone_number' => $phone,
            'form_name' => method_exists($record, 'get_form_settings') ? (string) $record->get_form_settings('form_name') : '',
        );

        if ('' === trim($vars['name']) && ('' !== trim($vars['first_name']) || '' !== trim($vars['last_name']))) {
            $vars['name'] = trim($vars['first_name'] . ' ' . $vars['last_name']);
        }

        $message = SplitSMS_API::render_template($this->settings->get('elementor_message'), $vars);
        $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'elementor',
                'event' => 'form_submitted',
                'external_ref' => 'elementor-form',
            )
        );
    }

    /**
     * @param array<string,string> $fields
     * @param string             $preferred
     */
    private function find_phone($fields, $preferred) {
        $candidates = array_unique(array_filter(array(
            $preferred,
            'phone',
            'phone_number',
            'tel',
            'mobile',
            'your-phone',
            'billing_phone',
        )));

        foreach ($candidates as $key) {
            if (isset($fields[$key]) && '' !== trim($fields[$key])) {
                return preg_replace('/\s+/', '', $fields[$key]);
            }
            foreach ($fields as $field_key => $value) {
                if (false !== stripos((string) $field_key, $key) && '' !== trim($value)) {
                    return preg_replace('/\s+/', '', $value);
                }
            }
        }

        foreach ($fields as $value) {
            if (preg_match('/^\+?[0-9]{8,15}$/', preg_replace('/[^\d+]/', '', $value))) {
                return preg_replace('/\s+/', '', $value);
            }
        }

        return '';
    }

    /**
     * @param array<string,string> $fields
     */
    private function find_name($fields) {
        foreach (array('name', 'full_name', 'your-name', 'customer_name') as $key) {
            if (!empty($fields[$key])) {
                return $fields[$key];
            }
        }
        if (!empty($fields['first_name'])) {
            return trim($fields['first_name'] . ' ' . (isset($fields['last_name']) ? $fields['last_name'] : ''));
        }
        return '';
    }
}
