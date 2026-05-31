<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WPForms — SMS after successful form submission.
 */
class SplitSMS_WPForms {
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
        if (!function_exists('wpforms')) {
            return;
        }
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
        if (!SplitSMS_Forms_Manager::source_should_hook('wpforms')
            && !$this->settings->feature_enabled('wpforms_enabled')) {
            return;
        }

        $this->hooks_registered = true;
        add_action('wpforms_process_complete', array($this, 'on_wpforms_complete'), 20, 4);
    }

    /**
     * @param array<int, array<string,mixed>> $fields
     * @param array<string,mixed>             $entry
     * @param array<string,mixed>             $form_data
     * @param int                             $entry_id
     */
    public function on_wpforms_complete($fields, $entry, $form_data, $entry_id) {
        unset($entry, $entry_id);

        $form_id = isset($form_data['id']) ? (int) $form_data['id'] : 0;
        if (!SplitSMS_Forms_Manager::is_form_enabled('wpforms', (string) $form_id)) {
            return;
        }

        $dedupe_key = $form_id . ':' . md5(wp_json_encode($fields));
        if (!empty($this->request_dedupe[$dedupe_key])) {
            return;
        }
        $this->request_dedupe[$dedupe_key] = true;

        $config = SplitSMS_Forms_Manager::get_form_config('wpforms', (string) $form_id);
        $field_key = strtolower($config['phone_field'] ?: $this->settings->get('wpforms_phone_field', 'phone'));
        $phone = $this->extract_phone($fields, $form_data, $field_key);

        if ('' === trim($phone)) {
            $this->log_skip($form_id, 'no_phone_field');
            return;
        }

        $vars = $this->build_vars($fields, $form_data, $phone);
        $template = $config['message'];
        if ('' === trim($template)) {
            $this->log_skip($form_id, 'empty_template');
            return;
        }

        $message = SplitSMS_API::render_template($template, $vars);
        $result = $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'wpforms',
                'event' => 'form_submitted',
                'external_ref' => 'wpforms-' . $form_id,
            )
        );

        if (empty($result['ok']) && !empty($result['log_id'])) {
            SplitSMS_Logger::instance()->sync_log_by_id($result['log_id']);
        }
    }

    /**
     * @param array<int, array<string,mixed>>|mixed $fields
     * @param array<string,mixed>                   $form_data
     * @param string                                $phone
     * @return array<string, string>
     */
    private function build_vars($fields, $form_data, $phone) {
        $vars = array(
            'site_name' => get_bloginfo('name'),
            'phone' => $phone,
            'phone_number' => $phone,
            'form_name' => isset($form_data['settings']['form_title']) ? (string) $form_data['settings']['form_title'] : '',
            'form_id' => isset($form_data['id']) ? (string) $form_data['id'] : '0',
        );

        if (is_array($fields)) {
            foreach ($fields as $field) {
                if (!is_array($field)) {
                    continue;
                }
                $name = isset($field['name']) ? strtolower((string) $field['name']) : '';
                $value = isset($field['value']) ? (string) $field['value'] : '';
                if (in_array($name, array('name', 'your-name', 'full_name'), true)) {
                    $vars['name'] = $value;
                }
                if (in_array($name, array('first_name', 'first name', 'firstname'), true)) {
                    $vars['first_name'] = $value;
                }
                if (in_array($name, array('last_name', 'last name', 'lastname'), true)) {
                    $vars['last_name'] = $value;
                }
                if (in_array($name, array('email', 'your-email'), true)) {
                    $vars['email'] = $value;
                }
            }
        }

        if (empty($vars['name']) && (!empty($vars['first_name']) || !empty($vars['last_name']))) {
            $first = isset($vars['first_name']) ? $vars['first_name'] : '';
            $last = isset($vars['last_name']) ? $vars['last_name'] : '';
            $vars['name'] = trim($first . ' ' . $last);
        }

        return $vars;
    }

    /**
     * @param array<int, array<string,mixed>>|mixed $fields
     * @param array<string,mixed>                   $form_data
     * @param string                                $field_key
     */
    private function extract_phone($fields, $form_data, $field_key) {
        if (!is_array($fields)) {
            return '';
        }

        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }
            $type = isset($field['type']) ? strtolower((string) $field['type']) : '';
            $name = isset($field['name']) ? strtolower((string) $field['name']) : '';
            $value = isset($field['value']) ? (string) $field['value'] : '';
            if ('phone' === $type || $name === $field_key || false !== strpos($name, 'phone')) {
                if ('' !== trim($value)) {
                    return preg_replace('/\s+/', '', $value);
                }
            }
        }

        if (!empty($form_data['fields']) && is_array($form_data['fields'])) {
            foreach ($form_data['fields'] as $fid => $meta) {
                if (!is_array($meta)) {
                    continue;
                }
                $label = isset($meta['label']) ? strtolower(sanitize_title($meta['label'])) : '';
                $type = isset($meta['type']) ? strtolower((string) $meta['type']) : '';
                if ('phone' === $type || $label === $field_key || false !== strpos($label, 'phone')) {
                    if (isset($fields[$fid]['value']) && '' !== trim((string) $fields[$fid]['value'])) {
                        return preg_replace('/\s+/', '', (string) $fields[$fid]['value']);
                    }
                }
            }
        }

        return '';
    }

    /**
     * @param int $form_id
     */
    private function is_form_allowed($form_id) {
        $allowed = trim((string) $this->settings->get('wpforms_form_ids', ''));
        if ('' === $allowed) {
            return true;
        }

        $ids = array_map('intval', array_map('trim', explode(',', $allowed)));
        return in_array((int) $form_id, $ids, true);
    }

    /**
     * @param int    $form_id
     * @param string $reason
     */
    private function log_skip($form_id, $reason) {
        $labels = array(
            'no_phone_field' => __('No phone field found — add a Phone field or set the field name in SplitSMS', 'splitsms'),
            'empty_template' => __('Message template is empty', 'splitsms'),
        );
        $detail = isset($labels[$reason]) ? $labels[$reason] : $reason;

        $log_id = SplitSMS_Logger::instance()->log(array(
            'event' => 'wpforms_skipped',
            'recipient' => '—',
            'message_type' => 'transactional',
            'status' => 'skipped',
            'source' => 'wpforms',
            'body' => sprintf(
                /* translators: 1: form ID 2: reason */
                __('WPForms form #%1$s: %2$s', 'splitsms'),
                $form_id,
                $detail
            ),
            'external_ref' => $form_id > 0 ? 'wpforms-' . $form_id : null,
        ));

        if ($log_id) {
            SplitSMS_Logger::instance()->sync_log_by_id($log_id);
        }
    }

    /**
     * @return bool
     */
    public static function is_active() {
        return function_exists('wpforms');
    }

    /**
     * @return array<int, array{id:int, title:string}>
     */
    public static function list_forms() {
        if (!function_exists('wpforms') || !post_type_exists('wpforms')) {
            return array();
        }

        $posts = get_posts(array(
            'post_type' => 'wpforms',
            'post_status' => 'publish',
            'numberposts' => 100,
            'orderby' => 'title',
            'order' => 'ASC',
        ));

        $forms = array();
        foreach ($posts as $post) {
            $forms[] = array(
                'id' => (int) $post->ID,
                'title' => $post->post_title,
            );
        }

        return $forms;
    }
}
