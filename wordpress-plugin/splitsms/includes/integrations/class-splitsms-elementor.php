<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor Pro Forms — SMS after form submission.
 *
 * Primary hook: elementor_pro/forms/new_record (after form actions run).
 * Fallback: elementor_pro/forms/mail_sent (after email action succeeds).
 *
 * @see https://developers.elementor.com/docs/hooks/forms/
 */
class SplitSMS_Elementor {
    /** @var self|null */
    private static $instance = null;

    /** @var SplitSMS_Settings */
    private $settings;

    /** @var SplitSMS_API */
    private $api;

    /** @var bool */
    private $hooks_registered = false;

    /** @var array<string, bool> */
    private $request_dedupe = array();

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->settings = SplitSMS_Settings::instance();
        $this->api = new SplitSMS_API($this->settings);
        add_action('plugins_loaded', array($this, 'register_hooks'), 25);
    }

    public function register_hooks() {
        if ($this->hooks_registered) {
            return;
        }
        if (!defined('ELEMENTOR_PRO_VERSION')) {
            return;
        }
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
        if (!SplitSMS_Forms_Manager::source_should_hook('elementor')
            && !$this->settings->feature_enabled('elementor_enabled')) {
            return;
        }

        $this->hooks_registered = true;
        add_action('elementor_pro/forms/new_record', array($this, 'on_new_record'), 20, 2);
        add_action('elementor_pro/forms/mail_sent', array($this, 'on_mail_sent'), 20, 2);
    }

    /**
     * After all form actions (email, webhooks, etc.) have run.
     *
     * @param object $record Form_Record instance.
     * @param object $handler Ajax handler.
     */
    public function on_new_record($record, $handler) {
        unset($handler);
        $this->process_submission($record, 'elementor_new_record');
    }

    /**
     * After Elementor email action succeeds — fallback if new_record path differs.
     *
     * @param array  $settings Form settings.
     * @param object $record   Form_Record instance.
     */
    public function on_mail_sent($settings, $record) {
        unset($settings);
        $this->process_submission($record, 'elementor_mail_sent');
    }

    /**
     * @param object $record
     * @param string $event
     */
    private function process_submission($record, $event) {
        if (!SplitSMS_Settings::is_configured()) {
            $this->log_skip('', $event, 'not_configured');
            return;
        }

        if (!is_object($record) || !method_exists($record, 'get')) {
            $this->log_skip('', $event, 'invalid_record');
            return;
        }

        $form_name = method_exists($record, 'get_form_settings')
            ? (string) $record->get_form_settings('form_name')
            : '';
        $form_id = method_exists($record, 'get_form_settings')
            ? (string) $record->get_form_settings('id')
            : '';
        $post_id = function_exists('get_queried_object_id') ? (int) get_queried_object_id() : 0;

        $candidates = array_filter(
            array(
                $post_id > 0 && '' !== $form_id ? $post_id . '-' . $form_id : '',
                $form_id,
                $form_name,
            )
        );

        if (!SplitSMS_Forms_Manager::is_form_enabled_any('elementor', $candidates)) {
            return;
        }

        $parsed = $this->parse_fields($record);
        if (empty($parsed['by_id'])) {
            $this->log_skip($form_name, $event, 'no_fields');
            return;
        }

        $dedupe_key = md5($form_name . ':' . $form_id . ':' . wp_json_encode($parsed['by_id']));
        if (isset($this->request_dedupe[$dedupe_key])) {
            return;
        }
        $this->request_dedupe[$dedupe_key] = true;

        $phone = $this->extract_phone($record, $parsed);
        if ('' === $phone) {
            $this->log_skip($form_name, $event, 'no_phone_field');
            return;
        }

        $config = SplitSMS_Forms_Manager::get_form_config_any('elementor', $candidates);
        $template = $config['message'];
        if ('' === trim($template)) {
            $this->log_skip($form_name, $event, 'empty_template');
            return;
        }

        $vars = $this->template_vars($record, $parsed, $phone, $form_name, $form_id);
        $message = SplitSMS_API::render_template($template, $vars);

        $ref = 'elementor';
        if ('' !== $form_id) {
            $ref .= '-' . sanitize_key($form_id);
        } elseif ('' !== $form_name) {
            $ref .= '-' . sanitize_key($form_name);
        }

        $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'elementor',
                'event' => $event,
                'external_ref' => $ref,
            )
        );
    }

    /**
     * @param string $form_name
     * @param string $form_id
     */
    private function is_form_allowed($form_name, $form_id) {
        $raw = trim($this->settings->get('elementor_form_names'));
        if ('' === $raw) {
            return true;
        }

        $allowed = array_filter(array_map('trim', preg_split('/\s*,\s*/', $raw)));
        if (empty($allowed)) {
            return true;
        }

        foreach ($allowed as $token) {
            if ($token === $form_name || $token === $form_id) {
                return true;
            }
            if (is_numeric($token) && (string) $token === $form_id) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param object $record
     * @return array{by_id:array<string,string>,by_type:array<string,array<int,string>>,meta:array<string,string>}
     */
    private function parse_fields($record) {
        $raw = $record->get('fields');
        $by_id = array();
        $by_type = array();
        $meta = array();

        if (!is_array($raw)) {
            return array('by_id' => $by_id, 'by_type' => $by_type, 'meta' => $meta);
        }

        foreach ($raw as $key => $field) {
            if (!is_array($field)) {
                continue;
            }

            $id = isset($field['id']) ? (string) $field['id'] : (string) $key;
            $title = isset($field['title']) ? (string) $field['title'] : $id;
            $type = isset($field['type']) ? (string) $field['type'] : '';
            $value = isset($field['value']) ? $field['value'] : '';
            if (is_array($value)) {
                $value = implode(', ', array_map('strval', $value));
            }
            $text = trim((string) $value);

            $by_id[$id] = $text;
            if ('' !== sanitize_title($title)) {
                $by_id[sanitize_title($title)] = $text;
            }

            if ('' !== $type) {
                if (!isset($by_type[$type])) {
                    $by_type[$type] = array();
                }
                if ('' !== $text) {
                    $by_type[$type][] = $text;
                }
            }

            $meta[$id] = $title;
        }

        return array(
            'by_id' => $by_id,
            'by_type' => $by_type,
            'meta' => $meta,
        );
    }

    /**
     * @param object                                             $record
     * @param array{by_id:array<string,string>,by_type:array} $parsed
     */
    private function extract_phone($record, $parsed) {
        $form_id = method_exists($record, 'get_form_settings')
            ? (string) $record->get_form_settings('id')
            : '';
        $post_id = function_exists('get_queried_object_id') ? (int) get_queried_object_id() : 0;
        $candidates = array_filter(array(
            $post_id > 0 && '' !== $form_id ? $post_id . '-' . $form_id : '',
            $form_id,
        ));
        $config = SplitSMS_Forms_Manager::get_form_config_any('elementor', $candidates);
        $preferred = trim($config['phone_field'] ?: $this->settings->get('elementor_phone_field', 'phone'));

        if ('' !== $preferred && method_exists($record, 'get_field')) {
            $match = $record->get_field(array('id' => $preferred));
            if (!empty($match) && is_array($match)) {
                $field = is_array($match[0]) ? $match[0] : $match;
                $phone = $this->normalize_phone(isset($field['value']) ? $field['value'] : '');
                if ('' !== $phone) {
                    return apply_filters('splitsms_elementor_phone', $phone, $record, $parsed);
                }
            }
        }

        if ('' !== $preferred && isset($parsed['by_id'][$preferred])) {
            $phone = $this->normalize_phone($parsed['by_id'][$preferred]);
            if ('' !== $phone) {
                return apply_filters('splitsms_elementor_phone', $phone, $record, $parsed);
            }
        }

        $fallback_keys = apply_filters(
            'splitsms_elementor_phone_fields',
            array('phone', 'tel', 'mobile', 'phone_number', 'your-phone', 'phonenumber')
        );
        foreach ($fallback_keys as $key) {
            if (isset($parsed['by_id'][$key])) {
                $phone = $this->normalize_phone($parsed['by_id'][$key]);
                if ('' !== $phone) {
                    return apply_filters('splitsms_elementor_phone', $phone, $record, $parsed);
                }
            }
        }

        if (!empty($parsed['by_type']['tel'])) {
            foreach ($parsed['by_type']['tel'] as $value) {
                $phone = $this->normalize_phone($value);
                if ('' !== $phone) {
                    return apply_filters('splitsms_elementor_phone', $phone, $record, $parsed);
                }
            }
        }

        foreach ($parsed['by_id'] as $key => $value) {
            if (preg_match('/(?:^|[-_])(phone|tel|mobile|cell)(?:$|[-_])/i', (string) $key)) {
                $phone = $this->normalize_phone($value);
                if ('' !== $phone) {
                    return apply_filters('splitsms_elementor_phone', $phone, $record, $parsed);
                }
            }
        }

        return '';
    }

    /**
     * @param mixed $raw
     */
    private function normalize_phone($raw) {
        if (is_array($raw)) {
            $raw = implode('', array_map('strval', $raw));
        }
        $phone = preg_replace('/[^\d+]/', '', (string) $raw);
        return strlen($phone) >= 9 ? $phone : '';
    }

    /**
     * @param object                                             $record
     * @param array{by_id:array<string,string>,by_type:array} $parsed
     * @param string                                             $phone
     * @param string                                             $form_name
     * @param string                                             $form_id
     * @return array<string, string>
     */
    private function template_vars($record, $parsed, $phone, $form_name, $form_id) {
        $fields = $parsed['by_id'];
        $name = $this->read_text($fields, array('name', 'full_name', 'your-name', 'customer_name'));
        $first = $this->read_text($fields, array('first_name', 'firstname', 'first-name'));
        $last = $this->read_text($fields, array('last_name', 'lastname', 'last-name'));
        if ('' === $name && ('' !== $first || '' !== $last)) {
            $name = trim($first . ' ' . $last);
        }

        $vars = array(
            'site_name' => get_bloginfo('name'),
            'name' => $name,
            'customer_name' => $name,
            'first_name' => $first,
            'last_name' => $last,
            'email' => $this->read_text($fields, array('email', 'your-email', 'e-mail')),
            'subject' => $this->read_text($fields, array('subject', 'your-subject')),
            'message' => $this->read_text($fields, array('message', 'your-message')),
            'phone' => $phone,
            'phone_number' => $phone,
            'form_name' => $form_name,
            'form_title' => $form_name,
            'form_id' => $form_id,
        );

        foreach ($fields as $key => $value) {
            if (!isset($vars[$key])) {
                $vars['field_' . sanitize_key($key)] = $value;
            }
        }

        return apply_filters('splitsms_elementor_template_vars', $vars, $record, $parsed);
    }

    /**
     * @param array<string, string> $fields
     * @param array<int, string>    $keys
     */
    private function read_text($fields, $keys) {
        foreach ($keys as $key) {
            if (!empty($fields[$key])) {
                return $fields[$key];
            }
        }
        return '';
    }

    /**
     * @param string $form_label
     * @param string $event
     * @param string $reason
     */
    private function log_skip($form_label, $event, $reason) {
        $labels = array(
            'not_configured' => __('API not configured', 'splitsms'),
            'invalid_record' => __('Elementor form record unavailable', 'splitsms'),
            'no_fields' => __('No form fields in submission', 'splitsms'),
            'no_phone_field' => __('No phone field — add a Tel field in Elementor and set its Field ID below', 'splitsms'),
            'empty_template' => __('Message template is empty', 'splitsms'),
        );
        $detail = isset($labels[$reason]) ? $labels[$reason] : $reason;
        $label = '' !== $form_label ? $form_label : __('unknown', 'splitsms');

        $log_id = SplitSMS_Logger::instance()->log(array(
            'event' => $event . '_skipped',
            'recipient' => '—',
            'message_type' => 'transactional',
            'status' => 'skipped',
            'source' => 'elementor',
            'body' => sprintf(
                /* translators: 1: form name 2: reason */
                __('Elementor form "%1$s": %2$s', 'splitsms'),
                $label,
                $detail
            ),
            'external_ref' => '' !== $form_label ? 'elementor-' . sanitize_key($form_label) : null,
        ));

        if ($log_id) {
            SplitSMS_Logger::instance()->sync_log_by_id($log_id);
        }
    }

    /**
     * @return bool
     */
    public static function is_active() {
        return defined('ELEMENTOR_PRO_VERSION');
    }
}
