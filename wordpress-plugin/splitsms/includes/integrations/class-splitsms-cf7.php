<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Contact Form 7 — SMS after successful form submission.
 *
 * Uses wpcf7_submit (mail_sent / optional mail_failed) per CF7 DOM event model:
 * @see https://contactform7.com/dom-events/
 * @see https://contactform7.com/docs/
 */
class SplitSMS_CF7 {
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
        if (!defined('WPCF7_VERSION')) {
            return;
        }
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
        if (!SplitSMS_Forms_Manager::source_should_hook('cf7')
            && !$this->settings->feature_enabled('cf7_enabled')) {
            return;
        }

        $this->hooks_registered = true;
        add_action('wpcf7_submit', array($this, 'on_cf7_submit'), 20, 2);
        add_action('wpcf7_mail_sent', array($this, 'on_cf7_mail_sent'), 20, 1);
    }

    /**
     * Primary handler — fires after AJAX/non-AJAX submit completes.
     *
     * @param WPCF7_ContactForm $contact_form
     * @param array             $result
     */
    public function on_cf7_submit($contact_form, $result) {
        if (!is_array($result) || empty($result['status'])) {
            return;
        }

        $status = (string) $result['status'];
        $allowed = array('mail_sent');
        if (SplitSMS_Settings::is_yes($this->settings->get('cf7_on_mail_failed'))) {
            $allowed[] = 'mail_failed';
        }

        if (!in_array($status, $allowed, true)) {
            return;
        }

        $this->process_submission($contact_form, 'cf7_' . $status);
    }

    /**
     * Legacy fallback for CF7 versions / flows where wpcf7_submit result differs.
     *
     * @param WPCF7_ContactForm $contact_form
     */
    public function on_cf7_mail_sent($contact_form) {
        $this->process_submission($contact_form, 'cf7_mail_sent');
    }

    /**
     * @param WPCF7_ContactForm $contact_form
     * @param string            $event
     */
    private function process_submission($contact_form, $event) {
        if (!SplitSMS_Settings::is_configured()) {
            $this->log_skip(0, $event, 'not_configured');
            return;
        }

        if (!is_a($contact_form, 'WPCF7_ContactForm')) {
            return;
        }

        $form_id = (int) $contact_form->id();
        if (!SplitSMS_Forms_Manager::is_form_enabled('cf7', (string) $form_id)) {
            return;
        }

        if (!class_exists('WPCF7_Submission')) {
            $this->log_skip($form_id, $event, 'submission_unavailable');
            return;
        }

        $submission = WPCF7_Submission::get_instance();
        if (!$submission) {
            $this->log_skip($form_id, $event, 'submission_unavailable');
            return;
        }

        $dedupe_key = $form_id . ':' . md5(wp_json_encode($submission->get_posted_data()));
        if (isset($this->request_dedupe[$dedupe_key])) {
            return;
        }
        $this->request_dedupe[$dedupe_key] = true;

        $posted = $submission->get_posted_data();
        if (!is_array($posted)) {
            $this->log_skip($form_id, $event, 'invalid_posted_data');
            return;
        }

        $phone = $this->extract_phone($posted);
        if ('' === $phone) {
            $this->log_skip($form_id, $event, 'no_phone_field');
            return;
        }

        $config = SplitSMS_Forms_Manager::get_form_config('cf7', (string) $form_id);
        $template = $config['message'];
        if ('' === trim($template)) {
            $this->log_skip($form_id, $event, 'empty_template');
            return;
        }

        $vars = $this->template_vars($contact_form, $posted, $phone);
        $message = SplitSMS_API::render_template($template, $vars);

        $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'contact-form-7',
                'event' => $event,
                'external_ref' => 'cf7-' . $form_id,
            )
        );
    }

    /**
     * @param int $form_id
     */
    private function is_form_allowed($form_id) {
        $raw = trim($this->settings->get('cf7_form_ids'));
        if ('' === $raw) {
            return true;
        }

        $allowed = array_filter(array_map('intval', preg_split('/\s*,\s*/', $raw)));
        if (empty($allowed)) {
            return true;
        }

        return in_array($form_id, $allowed, true);
    }

    /**
     * @param array<string, mixed> $posted
     */
    private function extract_phone($posted) {
        $form_id = 0;
        if (class_exists('WPCF7_Submission')) {
            $sub = WPCF7_Submission::get_instance();
            if ($sub && method_exists($sub, 'get_contact_form')) {
                $cf = $sub->get_contact_form();
                if ($cf && method_exists($cf, 'id')) {
                    $form_id = (int) $cf->id();
                }
            }
        }
        $config = $form_id > 0
            ? SplitSMS_Forms_Manager::get_form_config('cf7', (string) $form_id)
            : array('phone_field' => $this->settings->get('cf7_phone_field', 'your-phone'));
        $preferred = trim($config['phone_field'] ?: $this->settings->get('cf7_phone_field', 'your-phone'));
        $phone = $this->read_phone_field($posted, $preferred);
        if ('' !== $phone) {
            return apply_filters('splitsms_cf7_phone', $phone, $posted);
        }

        $fallbacks = apply_filters(
            'splitsms_cf7_phone_fields',
            array(
                'your-phone',
                'your-tel',
                'your-mobile',
                'phone',
                'tel',
                'mobile',
                'phonenumber',
                'phone-number',
                'billing_phone',
                'cell',
                'cellphone',
            )
        );

        foreach ($fallbacks as $field) {
            $phone = $this->read_phone_field($posted, $field);
            if ('' !== $phone) {
                return apply_filters('splitsms_cf7_phone', $phone, $posted);
            }
        }

        foreach ($posted as $key => $value) {
            if (!is_string($key)) {
                continue;
            }
            if (preg_match('/(?:^|[-_])(phone|tel|mobile|cell)(?:$|[-_])/i', $key)) {
                $phone = $this->read_phone_field($posted, $key);
                if ('' !== $phone) {
                    return apply_filters('splitsms_cf7_phone', $phone, $posted);
                }
            }
        }

        return '';
    }

    /**
     * @param array<string, mixed> $posted
     * @param string               $key
     */
    private function read_phone_field($posted, $key) {
        if ('' === $key || !isset($posted[$key])) {
            return '';
        }

        $raw = $posted[$key];
        if (is_array($raw)) {
            $parts = array();
            foreach ($raw as $part) {
                if (is_scalar($part) && '' !== trim((string) $part)) {
                    $parts[] = (string) $part;
                }
            }
            $raw = implode('', $parts);
        }

        $phone = preg_replace('/[^\d+]/', '', (string) $raw);
        return strlen($phone) >= 9 ? $phone : '';
    }

    /**
     * @param WPCF7_ContactForm    $contact_form
     * @param array<string, mixed> $posted
     * @param string               $phone
     * @return array<string, string>
     */
    private function template_vars($contact_form, $posted, $phone) {
        $name = $this->read_text_field($posted, array('your-name', 'name', 'full-name', 'fullname'));
        $first = $this->read_text_field($posted, array('first-name', 'firstname', 'your-first-name'));
        $last = $this->read_text_field($posted, array('last-name', 'lastname', 'your-last-name'));
        if ('' === $name && ('' !== $first || '' !== $last)) {
            $name = trim($first . ' ' . $last);
        }

        $vars = array(
            'site_name' => get_bloginfo('name'),
            'name' => $name,
            'customer_name' => $name,
            'first_name' => $first,
            'last_name' => $last,
            'phone' => $phone,
            'phone_number' => $phone,
            'email' => $this->read_text_field($posted, array('your-email', 'email', 'e-mail')),
            'subject' => $this->read_text_field($posted, array('your-subject', 'subject')),
            'message' => $this->read_text_field($posted, array('your-message', 'message')),
            'form_id' => (string) $contact_form->id(),
            'form_title' => method_exists($contact_form, 'title') ? (string) $contact_form->title() : '',
            'form_name' => method_exists($contact_form, 'title') ? (string) $contact_form->title() : '',
        );

        foreach ($posted as $key => $value) {
            if (!is_string($key) || isset($vars[$key])) {
                continue;
            }
            if (is_array($value)) {
                $value = implode(', ', array_map('strval', $value));
            }
            if (is_scalar($value)) {
                $vars['field_' . sanitize_key($key)] = (string) $value;
            }
        }

        return apply_filters('splitsms_cf7_template_vars', $vars, $contact_form, $posted);
    }

    /**
     * @param array<string, mixed> $posted
     * @param array<int, string>   $keys
     */
    private function read_text_field($posted, $keys) {
        foreach ($keys as $key) {
            if (!isset($posted[$key])) {
                continue;
            }
            $value = $posted[$key];
            if (is_array($value)) {
                $value = implode(', ', array_map('strval', $value));
            }
            $text = trim((string) $value);
            if ('' !== $text) {
                return $text;
            }
        }
        return '';
    }

    /**
     * @param int    $form_id
     * @param string $event
     * @param string $reason
     */
    private function log_skip($form_id, $event, $reason) {
        $labels = array(
            'not_configured' => __('API not configured', 'splitsms'),
            'submission_unavailable' => __('CF7 submission data unavailable', 'splitsms'),
            'invalid_posted_data' => __('Invalid form submission data', 'splitsms'),
            'no_phone_field' => __('No phone field found — add [tel your-phone] or set the phone field name in SplitSMS', 'splitsms'),
            'empty_template' => __('Message template is empty', 'splitsms'),
        );
        $detail = isset($labels[$reason]) ? $labels[$reason] : $reason;

        $log_id = SplitSMS_Logger::instance()->log(array(
            'event' => $event . '_skipped',
            'recipient' => '—',
            'message_type' => 'transactional',
            'status' => 'skipped',
            'source' => 'contact-form-7',
            'body' => sprintf(
                /* translators: 1: form ID 2: reason */
                __('CF7 form #%1$s: %2$s', 'splitsms'),
                $form_id,
                $detail
            ),
            'external_ref' => $form_id > 0 ? 'cf7-' . $form_id : null,
        ));

        if ($log_id) {
            SplitSMS_Logger::instance()->sync_log_by_id($log_id);
        }
    }

    /**
     * @return bool
     */
    public static function is_active() {
        return defined('WPCF7_VERSION');
    }

    /**
     * @return array<int, array{id:int, title:string}>
     */
    public static function list_forms() {
        if (!defined('WPCF7_VERSION') || !post_type_exists('wpcf7_contact_form')) {
            return array();
        }

        $posts = get_posts(array(
            'post_type' => 'wpcf7_contact_form',
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
