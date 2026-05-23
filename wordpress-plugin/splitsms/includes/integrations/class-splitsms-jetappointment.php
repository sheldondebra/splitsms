<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetAppointment SMS notifications.
 */
class SplitSMS_JetAppointment {
    /** @var self|null */
    private static $instance = null;

    /** @var SplitSMS_Crocoblock */
    private $cb;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $detected = SplitSMS_Crocoblock::detect_plugins();
        if (empty($detected['jetappointment'])) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        if (!$settings->feature_enabled('cb_jetappointment_enabled')) {
            return;
        }

        $this->cb = SplitSMS_Crocoblock::instance();

        add_action('jet-apb/db/appointment/insert', array($this, 'on_insert'), 30, 2);
        add_action('jet-apb/db/appointment/update', array($this, 'on_update'), 30, 2);
        add_action('jet-apb/db/appointments/insert', array($this, 'on_insert'), 30, 2);
        add_action('jet-apb/db/appointments/update', array($this, 'on_update'), 30, 2);
    }

    /**
     * @param int                  $appointment_id
     * @param array<string,mixed>  $appointment
     */
    public function on_insert($appointment_id, $appointment = array()) {
        $this->handle('appointment_created', $appointment_id, $appointment, 'cb_jetappointment_tpl_created');
    }

    /**
     * @param int                  $appointment_id
     * @param array<string,mixed>  $appointment
     */
    public function on_update($appointment_id, $appointment = array()) {
        $this->handle('appointment_updated', $appointment_id, $appointment, 'cb_jetappointment_tpl_status');
    }

    /**
     * @param string               $event
     * @param int                  $appointment_id
     * @param array<string,mixed>  $appointment
     * @param string               $template_key
     */
    private function handle($event, $appointment_id, $appointment, $template_key) {
        $settings = SplitSMS_Settings::instance();
        $vars = $this->appointment_vars($appointment_id, $appointment);
        $status = isset($vars['status']) ? strtolower($vars['status']) : '';

        if ('appointment_created' === $event && !$settings->feature_enabled('cb_jetappointment_on_create')) {
            return;
        }

        if ('appointment_updated' === $event) {
            if (!$settings->feature_enabled('cb_jetappointment_on_status')) {
                return;
            }
            if (in_array($status, array('approved', 'confirmed', 'active'), true)) {
                $template_key = 'cb_jetappointment_tpl_confirmed';
                $event = 'appointment_confirmed';
            } elseif (in_array($status, array('cancelled', 'canceled', 'rejected'), true)) {
                $template_key = 'cb_jetappointment_tpl_cancelled';
                $event = 'appointment_cancelled';
            }
        }

        $this->cb->send_event(array(
            'integration' => 'jetappointment',
            'event' => $event,
            'source' => 'JetAppointment',
            'template' => $settings->get($template_key),
            'vars' => $vars,
            'phone_field' => $settings->get('cb_jetappointment_phone_field', $settings->get('cb_phone_field', 'phone')),
        ));

        if ($settings->feature_enabled('cb_jetappointment_admin_alert')) {
            $this->cb->send_event(array(
                'integration' => 'jetappointment',
                'event' => $event . '_admin',
                'source' => 'JetAppointment',
                'template' => $settings->get('cb_jetappointment_tpl_admin'),
                'vars' => $vars,
                'admin_alert' => true,
            ));
        }

        if ($settings->feature_enabled('cb_jetappointment_reminder') && in_array($event, array('appointment_created', 'appointment_confirmed'), true)) {
            $reminder_at = $this->reminder_timestamp($vars);
            if ($reminder_at > time()) {
                $this->cb->send_event(array(
                    'integration' => 'jetappointment',
                    'event' => 'appointment_reminder',
                    'source' => 'JetAppointment',
                    'template' => $settings->get('cb_jetappointment_tpl_reminder'),
                    'vars' => $vars,
                    'phone_field' => $settings->get('cb_jetappointment_phone_field', $settings->get('cb_phone_field', 'phone')),
                    'schedule_reminder' => true,
                    'reminder_at' => $reminder_at,
                ));
            }
        }

        if ($settings->feature_enabled('cb_jetappointment_provider_alert')) {
            $provider_phone = $this->cb->extract_field($vars, $settings->get('cb_provider_phone_field', 'provider_phone'));
            if ('' !== trim($provider_phone)) {
                $this->cb->send_event(array(
                    'integration' => 'jetappointment',
                    'event' => $event . '_provider',
                    'source' => 'JetAppointment',
                    'template' => $settings->get('cb_jetappointment_tpl_provider'),
                    'vars' => $vars,
                    'phone' => $provider_phone,
                ));
            }
        }
    }

    /**
     * @param int                  $appointment_id
     * @param array<string,mixed>  $appointment
     * @return array<string,string>
     */
    private function appointment_vars($appointment_id, $appointment) {
        $vars = array(
            'appointment_id' => (string) $appointment_id,
            'name' => '',
            'client_name' => '',
            'phone' => '',
            'provider_name' => '',
            'provider_phone' => '',
            'appointment_date' => '',
            'appointment_time' => '',
            'status' => '',
            'service_name' => '',
        );

        if (!is_array($appointment)) {
            return $vars;
        }

        foreach ($appointment as $key => $value) {
            if (is_scalar($value)) {
                $vars[$key] = (string) $value;
            }
        }

        if (isset($vars['user_name']) && '' === $vars['name']) {
            $vars['name'] = $vars['user_name'];
        }
        if (isset($vars['user_phone']) && '' === $vars['phone']) {
            $vars['phone'] = $vars['user_phone'];
        }
        if (isset($vars['client_name']) && '' === $vars['name']) {
            $vars['name'] = $vars['client_name'];
        }
        if (isset($vars['date'])) {
            $vars['appointment_date'] = (string) $vars['date'];
        }
        if (isset($vars['slot']) || isset($vars['time'])) {
            $vars['appointment_time'] = isset($vars['slot']) ? (string) $vars['slot'] : (string) $vars['time'];
        }

        return $vars;
    }

    /**
     * @param array<string,string> $vars
     * @return int
     */
    private function reminder_timestamp($vars) {
        $cb = SplitSMS_Crocoblock::instance();
        $offset = $cb->reminder_offset_seconds();
        $date_str = isset($vars['appointment_date']) ? $vars['appointment_date'] : '';
        $time_str = isset($vars['appointment_time']) ? $vars['appointment_time'] : '09:00';
        if ('' === $date_str) {
            return 0;
        }
        $ts = strtotime(trim($date_str . ' ' . $time_str));
        return $ts ? $ts - $offset : 0;
    }
}
