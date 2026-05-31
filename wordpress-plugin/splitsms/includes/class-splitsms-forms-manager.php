<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Per-form SMS rules (enable toggle, message, phone field).
 */
class SplitSMS_Forms_Manager {

    /**
     * @return array<string, array<string, string>>
     */
    public static function get_rules() {
        $rules = SplitSMS_Settings::instance()->get('forms_rules');
        return is_array($rules) ? $rules : array();
    }

    /**
     * @param array<string, array<string, string>> $rules
     */
    public static function save_rules(array $rules) {
        $clean = array();
        foreach ($rules as $key => $rule) {
            if (!is_array($rule)) {
                continue;
            }
            $key = sanitize_text_field((string) $key);
            if ('' === $key || false === strpos($key, ':')) {
                continue;
            }
            $clean[$key] = array(
                'enabled' => SplitSMS_Settings::is_yes($rule['enabled'] ?? '0') ? '1' : '0',
                'message' => sanitize_textarea_field($rule['message'] ?? ''),
                'phone_field' => sanitize_text_field($rule['phone_field'] ?? ''),
                'admin_message' => sanitize_textarea_field($rule['admin_message'] ?? ''),
            );
        }

        $options = SplitSMS_Settings::instance()->all();
        $options['forms_rules'] = $clean;
        update_option(SplitSMS_Settings::OPTION_KEY, wp_parse_args($options, SplitSMS_Settings::defaults()));
    }

    /**
     * @param string   $source
     * @param string[] $candidate_ids
     */
    public static function is_form_enabled_any($source, array $candidate_ids) {
        foreach ($candidate_ids as $id) {
            $id = trim((string) $id);
            if ('' === $id) {
                continue;
            }
            if (self::is_form_enabled($source, $id)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param string   $source
     * @param string[] $candidate_ids
     * @return array{enabled:bool, message:string, phone_field:string, admin_message:string, from_manager:bool}
     */
    public static function get_form_config_any($source, array $candidate_ids) {
        foreach ($candidate_ids as $id) {
            $id = trim((string) $id);
            if ('' === $id) {
                continue;
            }
            $key = SplitSMS_Forms_Registry::form_key($source, $id);
            if (isset(self::get_rules()[$key])) {
                return self::get_form_config($source, $id);
            }
        }
        $first = trim((string) ($candidate_ids[0] ?? ''));
        return self::get_form_config($source, '' !== $first ? $first : '0');
    }

    /**
     * @param string $source
     * @param string $id
     */
    public static function is_form_enabled($source, $id) {
        $key = SplitSMS_Forms_Registry::form_key($source, $id);
        $rules = self::get_rules();

        if (isset($rules[$key])) {
            return SplitSMS_Settings::is_yes($rules[$key]['enabled']);
        }

        return self::legacy_is_form_enabled($source, $id);
    }

    /**
     * Whether hooks for a source should register (any enabled form or legacy master toggle).
     *
     * @param string $source
     */
    public static function source_should_hook($source) {
        $rules = self::get_rules();
        if (!empty($rules)) {
            foreach ($rules as $key => $rule) {
                if (0 === strpos($key, $source . ':') && SplitSMS_Settings::is_yes($rule['enabled'])) {
                    return true;
                }
            }
        }

        return self::legacy_source_enabled($source);
    }

    /**
     * @param string $source
     * @param string $id
     * @return array{enabled:bool, message:string, phone_field:string, admin_message:string, from_manager:bool}
     */
    public static function get_form_config($source, $id) {
        $settings = SplitSMS_Settings::instance();
        $key = SplitSMS_Forms_Registry::form_key($source, $id);
        $rules = self::get_rules();
        $defaults = self::default_message_and_phone($source);

        if (isset($rules[$key])) {
            $rule = $rules[$key];
            return array(
                'enabled' => SplitSMS_Settings::is_yes($rule['enabled']),
                'message' => '' !== trim($rule['message']) ? $rule['message'] : $defaults['message'],
                'phone_field' => '' !== trim($rule['phone_field']) ? $rule['phone_field'] : $defaults['phone_field'],
                'admin_message' => $rule['admin_message'] ?? '',
                'from_manager' => true,
            );
        }

        return array(
            'enabled' => self::legacy_is_form_enabled($source, $id),
            'message' => $defaults['message'],
            'phone_field' => $defaults['phone_field'],
            'admin_message' => '',
            'from_manager' => false,
        );
    }

    /**
     * Merge discovered forms with saved rules for the admin UI.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function forms_for_admin() {
        $discovered = SplitSMS_Forms_Registry::discover();
        $rules = self::get_rules();

        foreach ($discovered as &$form) {
            $key = $form['key'];
            $defaults = self::default_message_and_phone($form['source']);
            $saved = isset($rules[$key]) ? $rules[$key] : array();

            $form['enabled'] = isset($saved['enabled'])
                ? SplitSMS_Settings::is_yes($saved['enabled'])
                : self::legacy_is_form_enabled($form['source'], $form['id']);

            $form['message'] = isset($saved['message']) && '' !== trim($saved['message'])
                ? $saved['message']
                : $defaults['message'];

            $form['phone_field'] = isset($saved['phone_field']) && '' !== trim($saved['phone_field'])
                ? $saved['phone_field']
                : $defaults['phone_field'];

            $form['admin_message'] = $saved['admin_message'] ?? '';
        }
        unset($form);

        return $discovered;
    }

    /**
     * @param string $source
     * @param string $id
     */
    private static function legacy_is_form_enabled($source, $id) {
        if (!self::legacy_source_enabled($source)) {
            return false;
        }

        $settings = SplitSMS_Settings::instance();

        switch ($source) {
            case 'cf7':
                return self::legacy_id_in_list($settings->get('cf7_form_ids'), $id);
            case 'wpforms':
                return self::legacy_id_in_list($settings->get('wpforms_form_ids'), $id);
            case 'elementor':
                return self::legacy_id_in_list($settings->get('elementor_form_names'), $id, true);
            case 'jfb':
                return self::legacy_id_in_list($settings->get('cb_jfb_form_ids'), $id);
            case 'jetengine_form':
                return SplitSMS_Settings::is_yes($settings->get('cb_enabled'));
            default:
                return false;
        }
    }

    /**
     * @param string $source
     */
    private static function legacy_source_enabled($source) {
        $settings = SplitSMS_Settings::instance();
        switch ($source) {
            case 'cf7':
                return $settings->feature_enabled('cf7_enabled');
            case 'wpforms':
                return $settings->feature_enabled('wpforms_enabled');
            case 'elementor':
                return $settings->feature_enabled('elementor_enabled');
            case 'jfb':
                return $settings->feature_enabled('cb_jfb_enabled') && $settings->feature_enabled('cb_enabled');
            case 'jetengine_form':
                return $settings->feature_enabled('cb_enabled');
            default:
                return false;
        }
    }

    /**
     * @param string $raw
     * @param string $id
     * @param bool   $match_name
     */
    private static function legacy_id_in_list($raw, $id, $match_name = false) {
        $raw = trim((string) $raw);
        if ('' === $raw) {
            return true;
        }
        $tokens = array_filter(array_map('trim', preg_split('/\s*,\s*/', $raw)));
        if (empty($tokens)) {
            return true;
        }
        foreach ($tokens as $token) {
            if ($token === $id || (string) (int) $token === $id) {
                return true;
            }
            if ($match_name && false !== stripos($id, $token)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param string $source
     * @return array{message:string, phone_field:string}
     */
    private static function default_message_and_phone($source) {
        $settings = SplitSMS_Settings::instance();
        switch ($source) {
            case 'cf7':
                return array(
                    'message' => $settings->get('cf7_message'),
                    'phone_field' => $settings->get('cf7_phone_field', 'your-phone'),
                );
            case 'wpforms':
                return array(
                    'message' => $settings->get('wpforms_message'),
                    'phone_field' => $settings->get('wpforms_phone_field', 'phone'),
                );
            case 'elementor':
                return array(
                    'message' => $settings->get('elementor_message'),
                    'phone_field' => $settings->get('elementor_phone_field', 'phone'),
                );
            case 'jfb':
                return array(
                    'message' => $settings->get('cb_jfb_tpl_submitted'),
                    'phone_field' => $settings->get('cb_jfb_phone_field', 'phone'),
                );
            case 'jetengine_form':
                return array(
                    'message' => __('Hi {name}, thanks for your submission at {site_name}.', 'splitsms'),
                    'phone_field' => $settings->get('cb_phone_field', 'phone'),
                );
            default:
                return array(
                    'message' => __('Thanks for contacting {site_name}.', 'splitsms'),
                    'phone_field' => 'phone',
                );
        }
    }
}
