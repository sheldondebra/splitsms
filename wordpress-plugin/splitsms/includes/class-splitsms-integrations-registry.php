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
                'active' => class_exists('WooCommerce'),
                'group' => 'store',
                'note' => __('Order placed, processing, completed, cancelled, and payment complete events.', 'splitsms'),
            ),
            'paystack' => array(
                'label' => 'WooCommerce Paystack',
                'active' => self::has_payment_gateway('paystack'),
                'group' => 'gateway',
                'note' => __('SMS fires when WooCommerce marks the order paid (payment_complete or processing). Configure Paystack webhooks in WooCommerce.', 'splitsms'),
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
                'active' => class_exists('WPCF7_ContactForm'),
                'group' => 'forms',
                'note' => __('SMS after successful form submit (wpcf7_mail_sent).', 'splitsms'),
            ),
            'wpforms' => array(
                'label' => 'WPForms',
                'active' => function_exists('wpforms'),
                'group' => 'forms',
                'note' => __('SMS after form submission (wpforms_process_complete).', 'splitsms'),
            ),
            'elementor' => array(
                'label' => 'Elementor Pro Forms',
                'active' => defined('ELEMENTOR_PRO_VERSION') && class_exists('\ElementorPro\Plugin'),
                'group' => 'forms',
                'note' => __('SMS on Elementor Pro form submit (new_record).', 'splitsms'),
            ),
            'jetengine' => array(
                'label' => 'JetEngine',
                'active' => defined('JET_ENGINE_VERSION') || class_exists('Jet_Engine'),
                'group' => 'crocoblock',
                'note' => __('CPT create / status — enable under SplitSMS → Crocoblock.', 'splitsms'),
            ),
            'jetformbuilder' => array(
                'label' => 'JetFormBuilder',
                'active' => defined('JET_FORM_BUILDER_VERSION') || class_exists('Jet_Form_Builder\\Plugin'),
                'group' => 'crocoblock',
                'note' => __('Form submit SMS — enable JetFormBuilder under Crocoblock.', 'splitsms'),
            ),
            'jetbooking' => array(
                'label' => 'JetBooking',
                'active' => function_exists('jet_abaf') || defined('JET_ABAF_VERSION'),
                'group' => 'crocoblock',
                'note' => __('Booking created / confirmed / cancelled.', 'splitsms'),
            ),
            'jetappointment' => array(
                'label' => 'JetAppointment',
                'active' => defined('JET_APB_VERSION') || class_exists('Jet_Appointment'),
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
        if (!class_exists('WooCommerce') || !function_exists('WC')) {
            return false;
        }
        $gateways = WC()->payment_gateways();
        if (!$gateways || !method_exists($gateways, 'get_available_payment_gateways')) {
            return false;
        }
        foreach (array_keys($gateways->get_available_payment_gateways()) as $id) {
            if (false !== stripos($id, $needle)) {
                return true;
            }
        }
        return false;
    }
}
