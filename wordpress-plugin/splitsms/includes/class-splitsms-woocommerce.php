<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce order and payment SMS notifications.
 * Works with Paystack, Flutterwave, Stripe, and other gateways via WooCommerce order status hooks.
 */
class SplitSMS_WooCommerce {
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
        if (!class_exists('WooCommerce')) {
            return;
        }

        $this->settings = SplitSMS_Settings::instance();
        $this->api = new SplitSMS_API($this->settings);

        if (!$this->settings->feature_enabled('wc_enabled')) {
            return;
        }

        add_action('woocommerce_checkout_order_processed', array($this, 'on_order_placed'), 20, 1);
        add_action('woocommerce_order_status_changed', array($this, 'on_status_changed'), 20, 4);
        add_action('woocommerce_payment_complete', array($this, 'on_payment_complete'), 20, 1);

        // Paystack / Flutterwave often set processing before payment_complete fires.
        add_action('woocommerce_order_status_pending_to_processing', array($this, 'on_paid_processing'), 20, 2);
        add_action('woocommerce_order_status_on-hold_to_processing', array($this, 'on_paid_processing'), 20, 2);
        add_action('woocommerce_order_status_failed_to_processing', array($this, 'on_paid_processing'), 20, 2);
    }

    public function on_order_placed($order_id) {
        if (!$this->settings->feature_enabled('wc_order_placed')) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_placed'), 'wc_order_placed');
    }

    public function on_payment_complete($order_id) {
        if (!$this->settings->feature_enabled('wc_payment_complete')) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_payment'), 'wc_payment_complete', true);
    }

    /**
     * Fires when gateways (Paystack, Flutterwave, etc.) move order to processing.
     *
     * @param int      $order_id
     * @param WC_Order $order
     */
    public function on_paid_processing($order_id, $order = null) {
        if (!$this->settings->feature_enabled('wc_payment_on_processing')) {
            return;
        }
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order || !$order->is_paid()) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_payment'), 'wc_payment_processing', true);
    }

    /**
     * @param int    $order_id
     * @param string $old_status
     * @param string $new_status
     * @param WC_Order $order
     */
    public function on_status_changed($order_id, $old_status, $new_status, $order) {
        unset($old_status, $order);

        $map = array(
            'processing' => array('wc_order_processing', 'wc_tpl_processing'),
            'completed' => array('wc_order_completed', 'wc_tpl_completed'),
            'cancelled' => array('wc_order_cancelled', 'wc_tpl_cancelled'),
        );

        if (!isset($map[$new_status])) {
            return;
        }

        list($flag, $template_key) = $map[$new_status];
        if (!$this->settings->feature_enabled($flag)) {
            return;
        }

        $this->send_for_order($order_id, $this->settings->get($template_key), 'wc_order_' . $new_status);
    }

    /**
     * @param int    $order_id
     * @param string $template
     * @param string $event
     * @param bool   $dedupe_payment
     */
    private function send_for_order($order_id, $template, $event, $dedupe_payment = false) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        if ($dedupe_payment && $this->payment_sms_already_sent($order_id)) {
            return;
        }

        $phone = $order->get_billing_phone();
        if ('' === trim($phone)) {
            return;
        }

        $vars = $this->order_vars($order);
        $message = SplitSMS_API::render_template($template, $vars);
        $result = $this->api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'woocommerce',
                'event' => $event,
                'external_ref' => 'order-' . $order_id,
            )
        );

        if ($dedupe_payment && !empty($result['ok'])) {
            $order->update_meta_data('_splitsms_payment_sms_sent', '1');
            $order->save();
        }
    }

    /**
     * @param int $order_id
     */
    private function payment_sms_already_sent($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return false;
        }
        return '1' === $order->get_meta('_splitsms_payment_sms_sent');
    }

    /**
     * @param WC_Order $order
     * @return array<string, string>
     */
    private function order_vars($order) {
        $gateway = $order->get_payment_method();
        $gateway_title = $order->get_payment_method_title();

        return array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'order_id' => (string) $order->get_order_number(),
            'order_total' => wp_strip_all_tags($order->get_formatted_order_total()),
            'order_status' => wc_get_order_status_name($order->get_status()),
            'payment_method' => $gateway_title ? $gateway_title : $gateway,
            'payment_gateway' => $gateway,
            'tracking_number' => (string) $order->get_meta('_tracking_number'),
        );
    }
}
