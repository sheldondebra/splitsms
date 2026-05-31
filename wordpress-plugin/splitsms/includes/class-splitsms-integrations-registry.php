<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Detects third-party plugins and documents how SplitSMS hooks into them.
 */
class SplitSMS_Integrations_Registry {

    /**
     * @return array<string, array{label:string, active:bool, group:string, note:string}>
     */
    public static function all() {
        $items = array(
            'woocommerce' => array(
                'label' => 'WooCommerce',
                'active' => class_exists('WooCommerce', false),
                'group' => 'store',
                'note' => __('Order placed, payments, processing, completed, cancelled, failed, refunded, and shipping tracking events.', 'splitsms'),
            ),
            'paystack' => array(
                'label' => 'WooCommerce Paystack',
                'active' => class_exists('SplitSMS_Paystack', false)
                    ? SplitSMS_Paystack::is_gateway_present()
                    : self::has_payment_gateway('paystack'),
                'group' => 'gateway',
                'note' => __('SMS when Paystack confirms payment (payment_complete or processing). Set Paystack webhook URL for reliable delivery.', 'splitsms'),
            ),
            'flutterwave' => array(
                'label' => 'WooCommerce Flutterwave (Rave)',
                'active' => self::has_payment_gateway('flutterwave') || self::has_payment_gateway('rave'),
                'group' => 'gateway',
                'note' => __('Same as Paystack — triggers on WooCommerce paid/processing status after gateway confirmation.', 'splitsms'),
            ),
            'stripe' => array(
                'label' => 'WooCommerce Stripe',
                'active' => self::has_payment_gateway('stripe'),
                'group' => 'gateway',
                'note' => __('Triggers when Stripe payment completes via WooCommerce.', 'splitsms'),
            ),
            'cf7' => array(
                'label' => 'Contact Form 7',
                'active' => defined('WPCF7_VERSION'),
                'group' => 'forms',
                'note' => __('SMS after valid submit (wpcf7_submit / mail_sent). Optional SMS when email fails. Skips sync to dashboard.', 'splitsms'),
            ),
            'wpforms' => array(
                'label' => 'WPForms',
                'active' => defined('WPFORMS_VERSION') || function_exists('wpforms'),
                'group' => 'forms',
                'note' => __('SMS after form submission — dedicated integration with skip logs and per-form ID filter.', 'splitsms'),
            ),
            'elementor' => array(
                'label' => 'Elementor Pro Forms',
                'active' => defined('ELEMENTOR_PRO_VERSION'),
                'group' => 'forms',
                'note' => __('SMS on elementor_pro/forms/new_record after form actions. Tel field required.', 'splitsms'),
            ),
            'jetengine' => array(
                'label' => 'JetEngine',
                'active' => defined('JET_ENGINE_VERSION'),
                'group' => 'crocoblock',
                'note' => __('CPT create / status — enable under SplitSMS → Crocoblock.', 'splitsms'),
            ),
            'jetformbuilder' => array(
                'label' => 'JetFormBuilder',
                'active' => defined('JET_FORM_BUILDER_VERSION'),
                'group' => 'crocoblock',
                'note' => __('Add “Send SMS (SplitSMS)” in JetFormBuilder Post Submit Actions, or use global templates under Crocoblock.', 'splitsms'),
            ),
            'jetbooking' => array(
                'label' => 'JetBooking',
                'active' => function_exists('jet_abaf') || defined('JET_ABAF_VERSION'),
                'group' => 'crocoblock',
                'note' => __('Booking created / confirmed / cancelled.', 'splitsms'),
            ),
            'jetappointment' => array(
                'label' => 'JetAppointment',
                'active' => defined('JET_APB_VERSION'),
                'group' => 'crocoblock',
                'note' => __('Appointment booked / status / reminders.', 'splitsms'),
            ),
        );

        return apply_filters('splitsms_integrations_registry', $items);
    }

    /**
     * @param string $needle Gateway id fragment.
     */
    public static function has_payment_gateway($needle) {
        if (!class_exists('WooCommerce', false) || !function_exists('WC')) {
            return false;
        }

        $wc = WC();
        if (!is_object($wc) || !isset($wc->payment_gateways) || !is_object($wc->payment_gateways)) {
            return false;
        }

        $gateways = $wc->payment_gateways;
        if (!method_exists($gateways, 'get_available_payment_gateways')) {
            return false;
        }

        $available = $gateways->get_available_payment_gateways();
        if (!is_array($available)) {
            $available = array();
        }

        if (method_exists($gateways, 'payment_gateways')) {
            $registered = $gateways->payment_gateways();
            if (is_array($registered)) {
                $available = array_merge($registered, $available);
            }
        }

        foreach (array_keys($available) as $id) {
            if (false !== stripos($id, $needle)) {
                return true;
            }
        }
        return false;
    }
}
