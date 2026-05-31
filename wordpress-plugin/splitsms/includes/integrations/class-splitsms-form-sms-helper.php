<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shared SMS dispatch helpers for JetFormBuilder + JetEngine legacy forms.
 */
class SplitSMS_Form_Sms_Helper {

    /**
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @param array<string, mixed> $context
     * @return array{ok:bool, error?:string}
     */
    public static function dispatch(array $settings, array $data, array $context = array()) {
        if (!SplitSMS_Settings::is_configured()) {
            return self::fail($context, SplitSMS_Settings::configuration_error());
        }

        $macro = isset($context['macro_parser']) && is_callable($context['macro_parser'])
            ? $context['macro_parser']
            : null;

        $form_id = isset($context['form_id']) ? (int) $context['form_id'] : 0;
        $source = isset($context['source']) ? (string) $context['source'] : 'wordpress';
        $event = isset($context['event']) ? (string) $context['event'] : 'form_sms';

        $primary = self::send_one($settings, $data, false, $macro, $form_id, $source, $event);
        if (empty($primary['ok'])) {
            $msg = isset($primary['error']) ? (string) $primary['error'] : 'send_failed';
            return self::fail($context, $msg);
        }

        if (!empty($settings['send_admin_copy']) && !empty($settings['admin_message'])) {
            $admin = self::send_one($settings, $data, true, $macro, $form_id, $source, $event . '_admin');
            if (empty($admin['ok'])) {
                $msg = isset($admin['error']) ? (string) $admin['error'] : 'send_failed';
                return self::fail($context, $msg);
            }
        }

        return array('ok' => true);
    }

    /**
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @param bool                 $admin_copy
     * @param callable|null        $macro
     * @param int                  $form_id
     * @param string               $source
     * @param string               $event
     * @return array{ok:bool, error?:string}
     */
    private static function send_one(array $settings, array $data, $admin_copy, $macro, $form_id, $source, $event) {
        $phone = $admin_copy
            ? self::resolve_admin_phone()
            : self::resolve_phone($settings, $data, $macro);

        if ('' === trim($phone)) {
            return array('ok' => false, 'error' => 'empty_phone');
        }

        $template = $admin_copy
            ? (isset($settings['admin_message']) ? (string) $settings['admin_message'] : '')
            : (isset($settings['message']) ? (string) $settings['message'] : '');

        $message = self::render_message($template, $data, $macro);
        if ('' === trim($message)) {
            return array('ok' => false, 'error' => 'empty_message');
        }

        $extra = array(
            'source' => $source,
            'event' => $event,
            'external_ref' => $form_id ? 'je-form:' . $form_id : null,
        );

        $sender = isset($settings['sender_id']) ? trim((string) $settings['sender_id']) : '';
        if ('' !== $sender) {
            $extra['sender'] = sanitize_text_field($sender);
        }

        $country = self::resolve_country_code($settings, $data);
        if ('' !== $country) {
            $extra['countryCode'] = $country;
        }

        $api = new SplitSMS_API(SplitSMS_Settings::instance());
        $result = $api->send_sms($phone, $message, $extra);

        if (empty($result['ok'])) {
            $error = isset($result['error']) ? (string) $result['error'] : 'send_failed';
            return array('ok' => false, 'error' => $error);
        }

        return array('ok' => true);
    }

    /**
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @param callable|null        $macro
     * @return string
     */
    public static function resolve_phone(array $settings, array $data, $macro = null) {
        $sms_to = isset($settings['sms_to']) ? sanitize_key($settings['sms_to']) : 'form';

        if ('admin' === $sms_to) {
            return self::resolve_admin_phone();
        }

        if ('custom' === $sms_to) {
            $raw = isset($settings['custom_phone']) ? (string) $settings['custom_phone'] : '';
            if ($macro) {
                $raw = (string) call_user_func($macro, $raw);
            }
            return preg_replace('/\s+/', '', $raw);
        }

        $field = isset($settings['phone_field']) ? sanitize_key($settings['phone_field']) : 'phone';
        if ('' === $field) {
            $field = 'phone';
        }

        $value = isset($data[$field]) ? $data[$field] : '';
        if (is_array($value)) {
            $value = implode(', ', $value);
        }

        return preg_replace('/\s+/', '', (string) $value);
    }

    /**
     * @return string
     */
    public static function resolve_admin_phone() {
        $settings = SplitSMS_Settings::instance();
        $phone = $settings->get('cb_admin_phone');
        if ('' === trim((string) $phone)) {
            $phone = $settings->get('admin_phone');
        }
        return preg_replace('/\s+/', '', (string) $phone);
    }

    /**
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @return string
     */
    public static function resolve_country_code(array $settings, array $data) {
        $field = isset($settings['country_code_field']) ? sanitize_key($settings['country_code_field']) : '';
        if ('' === $field || !isset($data[$field])) {
            return '';
        }

        $value = $data[$field];
        if (is_array($value)) {
            $value = reset($value);
        }

        $value = strtoupper(preg_replace('/[^A-Za-z]/', '', (string) $value));
        return strlen($value) === 2 ? $value : '';
    }

    /**
     * @param string               $template
     * @param array<string, mixed> $data
     * @param callable|null        $macro
     * @return string
     */
    public static function render_message($template, array $data, $macro = null) {
        $rendered = $template;
        if ($macro) {
            $rendered = (string) call_user_func($macro, $rendered);
        }

        $vars = self::normalize_vars($data);
        $vars['site_name'] = get_bloginfo('name');
        $vars['phone'] = self::resolve_phone(array('sms_to' => 'form', 'phone_field' => 'phone'), $data, $macro);

        return SplitSMS_API::render_template($rendered, $vars);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    public static function normalize_vars(array $data) {
        $vars = array();
        foreach ($data as $key => $value) {
            if (is_scalar($value)) {
                $vars[(string) $key] = (string) $value;
            } elseif (is_array($value)) {
                $vars[(string) $key] = implode(', ', array_map('strval', $value));
            }
        }

        if (isset($vars['first_name']) && !isset($vars['name'])) {
            $vars['name'] = trim($vars['first_name'] . ' ' . (isset($vars['last_name']) ? $vars['last_name'] : ''));
        }

        return $vars;
    }

    /**
     * @param array<string, mixed> $context
     * @param string               $message
     * @return array{ok:bool, error:string}
     */
    private static function fail(array $context, $message) {
        if (!empty($context['on_error']) && is_callable($context['on_error'])) {
            call_user_func($context['on_error'], $message);
        }
        return array('ok' => false, 'error' => $message);
    }
}
