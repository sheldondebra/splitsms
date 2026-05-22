<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce order and payment SMS notifications.
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
    }

    public function on_order_placed($order_id) {
        if (!$this->settings->feature_enabled('wc_order_placed')) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_placed'));
    }

    public function on_payment_complete($order_id) {
        if (!$this->settings->feature_enabled('wc_payment_complete')) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_payment'));
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

        $this->send_for_order($order_id, $this->settings->get($template_key));
    }

    private function send_for_order($order_id, $template) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $phone = $order->get_billing_phone();
        if ('' === trim($phone)) {
            return;
        }

        $vars = $this->order_vars($order);
        $message = SplitSMS_API::render_template($template, $vars);
        $this->api->send_sms($phone, $message);
    }

    /**
     * @param WC_Order $order
     * @return array<string, string>
     */
    private function order_vars($order) {
        return array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
            'order_id' => (string) $order->get_order_number(),
            'order_total' => wp_strip_all_tags($order->get_formatted_order_total()),
            'order_status' => wc_get_order_status_name($order->get_status()),
            'payment_method' => $order->get_payment_method_title(),
            'tracking_number' => (string) $order->get_meta('_tracking_number'),
        );
    }
}
