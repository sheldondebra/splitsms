<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Crocoblock detection + shared SMS helpers for Jet* integrations.
 */
class SplitSMS_Crocoblock {

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
    }

    /**
     * @return array<string,bool>
     */
    public static function detect_plugins() {
        return array(
            'jetengine' => defined('JET_ENGINE_VERSION') || class_exists('Jet_Engine'),
            'jetformbuilder' => defined('JET_FORM_BUILDER_VERSION') || class_exists('Jet_Form_Builder\\Plugin'),
            'jetbooking' => function_exists('jet_abaf') || defined('JET_ABAF_VERSION'),
            'jetappointment' => defined('JET_APB_VERSION') || class_exists('Jet_Appointment'),
            'jetwoobuilder' => defined('JET_WOO_BUILDER_VERSION'),
            'jetsmartfilters' => defined('JET_SMART_FILTERS_VERSION'),
        );
    }

    public static function any_detected() {
        foreach (self::detect_plugins() as $active) {
            if ($active) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param array<string,mixed> $args
     */
    public function send_event($args) {
        if (!SplitSMS_Settings::is_configured()) {
            return array('ok' => false, 'error' => 'not_configured');
        }

        $integration = isset($args['integration']) ? sanitize_key($args['integration']) : 'crocoblock';
        if (!$this->integration_enabled($integration)) {
            return array('ok' => false, 'error' => 'integration_disabled');
        }
        $event = isset($args['event']) ? sanitize_text_field($args['event']) : 'event';
        $source = isset($args['source']) ? sanitize_text_field($args['source']) : $integration;
        $template = isset($args['template']) ? $args['template'] : '';
        $vars = isset($args['vars']) && is_array($args['vars']) ? $args['vars'] : array();
        $phone = isset($args['phone']) ? preg_replace('/\s+/', '', $args['phone']) : '';
        $admin_alert = !empty($args['admin_alert']);
        $schedule_reminder = !empty($args['schedule_reminder']);
        $reminder_at = isset($args['reminder_at']) ? (int) $args['reminder_at'] : 0;

        if ('' === trim($phone) && !$admin_alert) {
            $phone_field = isset($args['phone_field']) ? $args['phone_field'] : $this->settings->get('cb_phone_field', 'phone');
            $phone = $this->extract_field($vars, $phone_field);
        }

        if ('' === trim($phone)) {
            $phone = $this->settings->get('cb_fallback_phone');
        }

        if ($admin_alert) {
            $phone = $this->settings->get('cb_admin_phone');
            if ('' === trim($phone)) {
                $phone = $this->settings->get('admin_phone');
            }
        }

        if ('' === trim($phone)) {
            return array('ok' => false, 'error' => 'missing_phone');
        }

        if (!$this->passes_conditions($integration, $event, $vars)) {
            return array('ok' => false, 'error' => 'condition_failed');
        }

        $vars['site_name'] = get_bloginfo('name');
        $message = SplitSMS_API::render_template($template, $this->stringify_vars($vars));

        if ($schedule_reminder && $reminder_at > time()) {
            SplitSMS_Reminders::schedule(array(
                'integration' => $integration,
                'event' => $event,
                'phone' => $phone,
                'message' => $message,
                'send_at' => $reminder_at,
                'meta' => array('vars' => $vars),
            ));
            return array('ok' => true, 'scheduled' => true);
        }

        return $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => $source,
                'event' => $event,
                'external_ref' => $integration . '-' . $event,
            )
        );
    }

    /**
     * @param array<string,mixed> $data
     * @param string            $field_key
     */
    public function extract_field($data, $field_key) {
        if ('' === trim($field_key)) {
            return '';
        }

        if (isset($data[$field_key])) {
            return is_scalar($data[$field_key]) ? (string) $data[$field_key] : '';
        }

        foreach ($data as $key => $value) {
            if (strtolower((string) $key) === strtolower($field_key) && is_scalar($value)) {
                return (string) $value;
            }
        }

        return '';
    }

    /**
     * @param array<string,mixed> $vars
     * @return array<string,string>
     */
    private function stringify_vars($vars) {
        $out = array();
        foreach ($vars as $key => $value) {
            if (is_scalar($value) || null === $value) {
                $out[(string) $key] = (string) $value;
            }
        }
        return $out;
    }

    /**
     * @param string              $integration
     * @param string              $event
     * @param array<string,mixed> $vars
     */
    public function passes_conditions($integration, $event, $vars) {
        $raw = $this->settings->get('cb_rules', '');
        if ('' === trim($raw)) {
            return true;
        }

        $rules = json_decode($raw, true);
        if (!is_array($rules)) {
            return true;
        }

        foreach ($rules as $rule) {
            if (!is_array($rule) || empty($rule['active'])) {
                continue;
            }
            if (isset($rule['integration']) && $rule['integration'] !== $integration) {
                continue;
            }
            if (isset($rule['event']) && $rule['event'] !== '' && $rule['event'] !== $event) {
                continue;
            }

            $field = isset($rule['field']) ? $rule['field'] : '';
            $op = isset($rule['operator']) ? $rule['operator'] : 'equals';
            $expected = isset($rule['value']) ? (string) $rule['value'] : '';
            $actual = $this->extract_field($vars, $field);

            if (!$this->match_condition($actual, $op, $expected)) {
                return false;
            }
        }

        return true;
    }

  private function match_condition($actual, $op, $expected) {
        switch ($op) {
            case 'not_equals':
                return $actual !== $expected;
            case 'contains':
                return '' !== $expected && false !== stripos($actual, $expected);
            case 'empty':
                return '' === trim($actual);
            case 'not_empty':
                return '' !== trim($actual);
            case 'greater_than':
                return is_numeric($actual) && is_numeric($expected) && (float) $actual > (float) $expected;
            case 'less_than':
                return is_numeric($actual) && is_numeric($expected) && (float) $actual < (float) $expected;
            case 'equals':
            default:
                return $actual === $expected;
        }
    }

    /**
     * @return int
     */
    /**
     * Crocoblock master toggle OR per-module toggle must be on.
     *
     * @param string $integration jetengine|jetformbuilder|jetbooking|jetappointment
     */
    public function integration_enabled($integration) {
        if ($this->settings->feature_enabled('cb_enabled')) {
            return true;
        }
        $map = array(
            'jetengine' => 'cb_jetengine_enabled',
            'jetformbuilder' => 'cb_jfb_enabled',
            'jetbooking' => 'cb_jetbooking_enabled',
            'jetappointment' => 'cb_jetappointment_enabled',
        );
        $key = isset($map[$integration]) ? $map[$integration] : '';
        return '' !== $key && $this->settings->feature_enabled($key);
    }

    public function reminder_offset_seconds() {
        $key = $this->settings->get('cb_reminder_offset', '86400');
        $map = array(
            '3600' => HOUR_IN_SECONDS,
            '10800' => 3 * HOUR_IN_SECONDS,
            '86400' => DAY_IN_SECONDS,
            '172800' => 2 * DAY_IN_SECONDS,
        );
        return isset($map[$key]) ? $map[$key] : DAY_IN_SECONDS;
    }
}
