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

        $form_id = isset($context['form_id']) ? (int) $context['form_id'] : 0;
        $source = isset($context['source']) ? (string) $context['source'] : 'wordpress';
        $event = isset($context['event']) ? (string) $context['event'] : 'form_sms';

        $primary = self::send_one($settings, $data, false, $context, $form_id, $source, $event);
        if (empty($primary['ok'])) {
            $msg = isset($primary['error']) ? (string) $primary['error'] : 'send_failed';
            return self::fail($context, $msg);
        }

        if (!empty($settings['send_admin_copy']) && !empty($settings['admin_message'])) {
            $admin = self::send_one($settings, $data, true, $context, $form_id, $source, $event . '_admin');
            if (empty($admin['ok'])) {
                $msg = isset($admin['error']) ? (string) $admin['error'] : 'send_failed';
                return self::fail($context, $msg);
            }
        }

        return array('ok' => true);
    }

    /**
     * Parse JetEngine/JetFormBuilder macros (%field%, {field}) using submitted data.
     *
     * @param string               $content
     * @param array<string, mixed> $data
     * @param array<string, mixed> $context
     * @return string
     */
    public static function parse_macros($content, array $data, array $context = array()) {
        $content = (string) $content;

        if (isset($context['macro_parser']) && is_callable($context['macro_parser'])) {
            $content = (string) call_user_func($context['macro_parser'], $content);
        } elseif (class_exists('JFB_Modules\Rich_Content\Module')) {
            $content = (string) \JFB_Modules\Rich_Content\Module::rich($content);
        }

        $vars = self::build_macro_vars($data, $context);

        $content = preg_replace_callback(
            '/%([a-zA-Z0-9_\-]+)%/',
            static function ($matches) use ($vars) {
                $key = $matches[1];
                return array_key_exists($key, $vars) ? (string) $vars[$key] : $matches[0];
            },
            $content
        );

        return SplitSMS_API::render_template($content, $vars);
    }

    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $context
     * @return array<string, string>
     */
    public static function build_macro_vars(array $data, array $context = array()) {
        $vars = self::normalize_vars($data);
        $vars['site_name'] = get_bloginfo('name');
        $vars['site_url'] = home_url('/');

        $form_id = isset($context['form_id']) ? (int) $context['form_id'] : 0;
        if ($form_id > 0) {
            $vars['form_id'] = (string) $form_id;
            if (!isset($vars['post_id'])) {
                $vars['post_id'] = (string) $form_id;
            }
            $form_post = get_post($form_id);
            if ($form_post instanceof WP_Post) {
                $vars['form_title'] = $form_post->post_title;
            }
        }

        if (!empty($context['post_id'])) {
            $vars['post_id'] = (string) (int) $context['post_id'];
        }

        $user_id = get_current_user_id();
        if ($user_id > 0) {
            $vars['user_id'] = (string) $user_id;
            if (!isset($vars['user_login'])) {
                $user = get_userdata($user_id);
                if ($user) {
                    $vars['user_login'] = $user->user_login;
                    $vars['user_email'] = $user->user_email;
                }
            }
        }

        return apply_filters('splitsms_form_macro_vars', $vars, $data, $context);
    }

    /**
     * @param string $phone
     * @return string
     */
    public static function sanitize_phone_value($phone) {
        $phone = sanitize_text_field((string) $phone);
        $phone = preg_replace('/[^\d+]/', '', $phone);

        return strlen($phone) >= 9 ? $phone : '';
    }

    /**
     * @param string $message
     * @return string
     */
    public static function sanitize_message_value($message) {
        return sanitize_textarea_field((string) $message);
    }

    /**
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @param array<string, mixed> $context
     * @return string
     */
    public static function resolve_phone(array $settings, array $data, array $context = array()) {
        $sms_to = isset($settings['sms_to']) ? sanitize_key($settings['sms_to']) : 'form';

        if ('admin' === $sms_to) {
            return self::sanitize_phone_value(self::resolve_admin_phone());
        }

        if ('custom' === $sms_to) {
            $raw = isset($settings['custom_phone']) ? (string) $settings['custom_phone'] : '';
            $parsed = self::parse_macros($raw, $data, $context);
            return self::sanitize_phone_value($parsed);
        }

        $field = isset($settings['phone_field']) ? sanitize_key($settings['phone_field']) : 'phone';
        if ('' === $field) {
            $field = 'phone';
        }

        $value = isset($data[$field]) ? $data[$field] : '';
        if (is_array($value)) {
            $value = implode(', ', array_map('strval', $value));
        }

        return self::sanitize_phone_value((string) $value);
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
     * @param array<string, mixed> $context
     * @return string
     */
    public static function render_message($template, array $data, array $context = array()) {
        $rendered = self::parse_macros($template, $data, $context);
        return self::sanitize_message_value($rendered);
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
     * @param array<string, mixed> $settings
     * @param array<string, mixed> $data
     * @param bool                 $admin_copy
     * @param array<string, mixed> $context
     * @param int                  $form_id
     * @param string               $source
     * @param string               $event
     * @return array{ok:bool, error?:string}
     */
    private static function send_one(array $settings, array $data, $admin_copy, array $context, $form_id, $source, $event) {
        $phone = $admin_copy
            ? self::sanitize_phone_value(self::resolve_admin_phone())
            : self::resolve_phone($settings, $data, $context);

        if ('' === $phone) {
            self::log_result($source, $event . '_failed', '—', 'failed', __('Phone number is empty after parsing macros.', 'splitsms'), $form_id);
            return array('ok' => false, 'error' => 'empty_phone');
        }

        $template = $admin_copy
            ? (isset($settings['admin_message']) ? (string) $settings['admin_message'] : '')
            : (isset($settings['message']) ? (string) $settings['message'] : '');

        $message = self::render_message($template, $data, $context);
        if ('' === $message) {
            self::log_result($source, $event . '_failed', $phone, 'failed', __('Message is empty after parsing macros.', 'splitsms'), $form_id);
            return array('ok' => false, 'error' => 'empty_message');
        }

        $extra = array(
            'source' => sanitize_key($source),
            'event' => sanitize_key($event),
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
            $error = isset($result['error']) ? sanitize_text_field((string) $result['error']) : __('Send failed', 'splitsms');
            return array('ok' => false, 'error' => $error);
        }

        return array('ok' => true);
    }

    /**
     * @param string $source
     * @param string $event
     * @param string $recipient
     * @param string $status
     * @param string $body
     * @param int    $form_id
     */
    private static function log_result($source, $event, $recipient, $status, $body, $form_id) {
        $log_id = SplitSMS_Logger::instance()->log(
            array(
                'event' => sanitize_key($event),
                'recipient' => $recipient,
                'message_type' => 'transactional',
                'status' => sanitize_key($status),
                'source' => sanitize_key($source),
                'body' => $body,
                'external_ref' => $form_id ? 'je-form:' . $form_id : null,
            )
        );

        if ($log_id) {
            SplitSMS_Logger::instance()->sync_log_by_id($log_id);
        }
    }

    /**
     * @param array<string, mixed> $context
     * @param string               $message
     * @return array{ok:bool, error:string}
     */
    private static function fail(array $context, $message) {
        $source = isset($context['source']) ? (string) $context['source'] : 'wordpress';
        $event = isset($context['event']) ? (string) $context['event'] : 'form_sms';
        $form_id = isset($context['form_id']) ? (int) $context['form_id'] : 0;

        self::log_result($source, $event . '_failed', '—', 'failed', sanitize_text_field($message), $form_id);

        if (!empty($context['on_error']) && is_callable($context['on_error'])) {
            call_user_func($context['on_error'], $message);
        }

        return array('ok' => false, 'error' => $message);
    }
}
