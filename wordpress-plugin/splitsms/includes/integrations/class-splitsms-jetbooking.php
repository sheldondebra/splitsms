<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetBooking reservation SMS.
 */
class SplitSMS_JetBooking {
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
        if (empty($detected['jetbooking'])) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        if (!$settings->feature_enabled('cb_jetbooking_enabled')) {
            return;
        }

        $this->cb = SplitSMS_Crocoblock::instance();

        add_action('jet-booking/db/booking-insert', array($this, 'on_booking_insert'), 30, 2);
        add_action('jet-booking/db/booking-update', array($this, 'on_booking_update'), 30, 2);
    }

    /**
     * @param int                  $booking_id
     * @param array<string,mixed>  $booking
     */
    public function on_booking_insert($booking_id, $booking = array()) {
        $this->handle_booking_event('booking_created', $booking_id, $booking, 'cb_jetbooking_tpl_created');
    }

    /**
     * @param int                  $booking_id
     * @param array<string,mixed>  $booking
     */
    public function on_booking_update($booking_id, $booking = array()) {
        $this->handle_booking_event('booking_updated', $booking_id, $booking, 'cb_jetbooking_tpl_status');
    }

    /**
     * @param string               $event
     * @param int                  $booking_id
     * @param array<string,mixed>  $booking
     * @param string               $template_key
     */
    private function handle_booking_event($event, $booking_id, $booking, $template_key) {
        $settings = SplitSMS_Settings::instance();
        if (!is_array($booking) || empty($booking)) {
            $booking = $this->get_booking($booking_id);
        }

        $vars = $this->booking_vars($booking_id, $booking);
        $status = isset($vars['status']) ? strtolower($vars['status']) : '';

        if ('booking_created' === $event && !$settings->feature_enabled('cb_jetbooking_on_create')) {
            return;
        }

        if ('booking_updated' === $event) {
            if (!$settings->feature_enabled('cb_jetbooking_on_status')) {
                return;
            }
            if ('confirmed' === $status || 'completed' === $status) {
                $template_key = 'cb_jetbooking_tpl_confirmed';
                $event = 'booking_confirmed';
            } elseif ('cancelled' === $status || 'canceled' === $status) {
                $template_key = 'cb_jetbooking_tpl_cancelled';
                $event = 'booking_cancelled';
            }
        }

        $this->cb->send_event(array(
            'integration' => 'jetbooking',
            'event' => $event,
            'source' => 'JetBooking',
            'template' => $settings->get($template_key),
            'vars' => $vars,
            'phone_field' => $settings->get('cb_jetbooking_phone_field', $settings->get('cb_phone_field', 'phone')),
        ));

        if ($settings->feature_enabled('cb_jetbooking_admin_alert')) {
            $this->cb->send_event(array(
                'integration' => 'jetbooking',
                'event' => $event . '_admin',
                'source' => 'JetBooking',
                'template' => $settings->get('cb_jetbooking_tpl_admin'),
                'vars' => $vars,
                'admin_alert' => true,
            ));
        }

        if ($settings->feature_enabled('cb_jetbooking_reminder') && in_array($event, array('booking_created', 'booking_confirmed'), true)) {
            $reminder_at = $this->reminder_timestamp($vars);
            if ($reminder_at > time()) {
                $this->cb->send_event(array(
                    'integration' => 'jetbooking',
                    'event' => 'booking_reminder',
                    'source' => 'JetBooking',
                    'template' => $settings->get('cb_jetbooking_tpl_reminder'),
                    'vars' => $vars,
                    'phone_field' => $settings->get('cb_jetbooking_phone_field', $settings->get('cb_phone_field', 'phone')),
                    'schedule_reminder' => true,
                    'reminder_at' => $reminder_at,
                ));
            }
        }
    }

    /**
     * @param int $booking_id
     * @return array<string,mixed>
     */
    private function get_booking($booking_id) {
        if (function_exists('jet_abaf_get_booking')) {
            $row = jet_abaf_get_booking($booking_id);
            return is_array($row) ? $row : array();
        }
        if (function_exists('jet_abaf') && is_object(jet_abaf()) && isset(jet_abaf()->db)) {
            $row = jet_abaf()->db->get_booking_by('booking_id', $booking_id);
            return is_array($row) ? $row : array();
        }
        return array();
    }

    /**
     * @param int                  $booking_id
     * @param array<string,mixed>  $booking
     * @return array<string,string>
     */
    private function booking_vars($booking_id, $booking) {
        $vars = array(
            'booking_id' => (string) $booking_id,
            'name' => '',
            'phone' => '',
            'email' => '',
            'booking_date' => '',
            'booking_time' => '',
            'check_in' => '',
            'check_out' => '',
            'status' => '',
            'service_name' => '',
        );

        foreach ($booking as $key => $value) {
            if (is_scalar($value)) {
                $vars[$key] = (string) $value;
            }
        }

        if (isset($booking['check_in_date'])) {
            $vars['booking_date'] = (string) $booking['check_in_date'];
            $vars['check_in'] = (string) $booking['check_in_date'];
        }
        if (isset($booking['check_out_date'])) {
            $vars['check_out'] = (string) $booking['check_out_date'];
        }
        if (isset($booking['user_email'])) {
            $vars['email'] = (string) $booking['user_email'];
        }
        if (isset($booking['user_name'])) {
            $vars['name'] = (string) $booking['user_name'];
        }
        if (isset($booking['user_phone'])) {
            $vars['phone'] = (string) $booking['user_phone'];
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
        $date_str = isset($vars['check_in']) && '' !== $vars['check_in'] ? $vars['check_in'] : (isset($vars['booking_date']) ? $vars['booking_date'] : '');
        if ('' === $date_str) {
            return 0;
        }
        $ts = strtotime($date_str . ' 09:00:00');
        if (!$ts) {
            $ts = strtotime($date_str);
        }
        return $ts ? $ts - $offset : 0;
    }
}
