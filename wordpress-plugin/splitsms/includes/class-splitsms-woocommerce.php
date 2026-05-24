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

    /** @var bool */
    private $hooks_registered = false;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->settings = SplitSMS_Settings::instance();
        $this->api = new SplitSMS_API($this->settings);

        // SplitSMS often loads before WooCommerce on plugins_loaded — register on woocommerce_init.
        add_action('woocommerce_init', array($this, 'register_hooks'), 5);
    }

    /**
     * Attach WooCommerce hooks once WooCommerce is loaded.
     */
    public function register_hooks() {
        if ($this->hooks_registered || !class_exists('WooCommerce')) {
            return;
        }
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
        if (!$this->settings->feature_enabled('wc_enabled')) {
            return;
        }

        $this->hooks_registered = true;

        add_action('woocommerce_checkout_order_processed', array($this, 'on_order_placed'), 20, 1);
        add_action('woocommerce_store_api_checkout_order_processed', array($this, 'on_order_placed'), 20, 1);
        add_action('woocommerce_order_status_changed', array($this, 'on_status_changed'), 20, 4);
        add_action('woocommerce_payment_complete', array($this, 'on_payment_complete'), 20, 1);

        add_action('woocommerce_order_status_pending_to_processing', array($this, 'on_paid_processing'), 20, 2);
        add_action('woocommerce_order_status_on-hold_to_processing', array($this, 'on_paid_processing'), 20, 2);
        add_action('woocommerce_order_status_failed_to_processing', array($this, 'on_paid_processing'), 20, 2);
        add_action('woocommerce_order_status_pending_to_completed', array($this, 'on_paid_processing'), 20, 2);
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
     * @param int           $order_id
     * @param WC_Order|null $order
     */
    public function on_paid_processing($order_id, $order = null) {
        if (!$this->settings->feature_enabled('wc_payment_on_processing')) {
            return;
        }
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order || !is_a($order, 'WC_Order')) {
            return;
        }
        $this->send_for_order($order_id, $this->settings->get('wc_tpl_payment'), 'wc_payment_processing', true);
    }

    /**
     * @param int      $order_id
     * @param string   $old_status
     * @param string   $new_status
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
        if (!SplitSMS_Settings::is_configured()) {
            $this->log_skip($order_id, $event, 'not_configured');
            return;
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            $this->log_skip($order_id, $event, 'order_not_found');
            return;
        }

        if ($dedupe_payment && $this->payment_sms_already_sent($order_id)) {
            return;
        }

        $phone = $this->resolve_order_phone($order);
        if ('' === $phone) {
            $this->log_skip($order_id, $event, 'no_billing_phone');
            return;
        }

        if ('' === trim($template)) {
            $this->log_skip($order_id, $event, 'empty_template');
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
     * @param WC_Order $order
     */
    private function resolve_order_phone($order) {
        $candidates = array(
            $order->get_billing_phone(),
            $order->get_shipping_phone(),
        );

        $customer_id = $order->get_customer_id();
        if ($customer_id) {
            $candidates[] = get_user_meta($customer_id, 'billing_phone', true);
            $candidates[] = get_user_meta($customer_id, 'shipping_phone', true);
        }

        $meta_keys = apply_filters(
            'splitsms_wc_phone_meta_keys',
            array(
                '_billing_phone',
                'billing_phone',
                '_shipping_phone',
                'shipping_phone',
                'phone',
                '_phone',
                'mobile',
                '_mobile',
                'tel',
                '_tel',
            )
        );
        foreach ($meta_keys as $meta_key) {
            $candidates[] = $order->get_meta($meta_key);
        }

        $custom_key = trim($this->settings->get('wc_phone_meta_key'));
        if ('' !== $custom_key) {
            $candidates[] = $order->get_meta($custom_key);
        }

        foreach ($candidates as $raw) {
            $phone = preg_replace('/[^\d+]/', '', (string) $raw);
            if (strlen($phone) >= 9) {
                return apply_filters('splitsms_wc_order_phone', $phone, $order);
            }
        }

        return '';
    }

    /**
     * @param int    $order_id
     * @param string $event
     * @param string $reason
     */
    private function log_skip($order_id, $event, $reason) {
        $labels = array(
            'no_billing_phone' => __('No phone on order — add billing phone at checkout', 'splitsms'),
            'not_configured' => __('API not configured', 'splitsms'),
            'order_not_found' => __('Order not found', 'splitsms'),
            'empty_template' => __('Message template is empty', 'splitsms'),
        );
        $detail = isset($labels[$reason]) ? $labels[$reason] : $reason;

        SplitSMS_Logger::instance()->log(array(
            'event' => $event . '_skipped',
            'recipient' => '—',
            'message_type' => 'transactional',
            'status' => 'skipped',
            'source' => 'woocommerce',
            'body' => sprintf(
                /* translators: 1: order number 2: reason */
                __('Order #%1$s: %2$s', 'splitsms'),
                $order_id,
                $detail
            ),
            'external_ref' => 'order-' . $order_id,
        ));
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
