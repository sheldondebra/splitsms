<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce order, payment, shipping, and refund SMS notifications.
 *
 * Hooks align with WooCommerce order statuses, payment_complete, block checkout,
 * HPOS (custom order tables), and common shipment-tracking plugins.
 *
 * @see https://woocommerce.com/documentation/woocommerce/
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

    /** @var array<int, bool> */
    private $tracking_send_guard = array();

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->settings = SplitSMS_Settings::instance();
        $this->api = new SplitSMS_API($this->settings);
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
        add_action('woocommerce_order_status_on-hold_to_completed', array($this, 'on_paid_processing'), 20, 2);

        add_action('woocommerce_order_refunded', array($this, 'on_order_refunded'), 20, 2);

        add_action('updated_post_meta', array($this, 'on_tracking_meta_updated'), 20, 4);
        add_action('updated_order_meta', array($this, 'on_tracking_meta_updated'), 20, 4);
        add_action('woocommerce_advanced_shipment_tracking_item_added', array($this, 'on_ast_tracking_added'), 20, 3);

        if (function_exists('wcs_order_contains_subscription')) {
            add_action('woocommerce_subscription_renewal_payment_complete', array($this, 'on_subscription_renewal_paid'), 20, 2);
        }
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
     * @param WC_Subscription $subscription
     * @param WC_Order        $renewal_order
     */
    public function on_subscription_renewal_paid($subscription, $renewal_order) {
        unset($subscription);
        if (!$this->settings->feature_enabled('wc_payment_complete') && !$this->settings->feature_enabled('wc_payment_on_processing')) {
            return;
        }
        if (!is_a($renewal_order, 'WC_Order')) {
            return;
        }
        $this->send_for_order($renewal_order->get_id(), $this->settings->get('wc_tpl_payment'), 'wc_subscription_renewal', true);
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
            'failed' => array('wc_order_failed', 'wc_tpl_failed'),
            'refunded' => array('wc_order_refunded', 'wc_tpl_refunded'),
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
     * @param int $order_id
     * @param int $refund_id
     */
    public function on_order_refunded($order_id, $refund_id) {
        if (!$this->settings->feature_enabled('wc_order_refunded')) {
            return;
        }

        $refund = wc_get_order($refund_id);
        $extra = array();
        if ($refund) {
            $extra['refund_amount'] = wp_strip_all_tags(wc_price($refund->get_amount(), array('currency' => $refund->get_currency())));
            $extra['refund_reason'] = (string) $refund->get_reason();
        }

        $this->send_for_order(
            $order_id,
            $this->settings->get('wc_tpl_refunded'),
            'wc_order_refunded',
            false,
            $extra
        );
    }

    /**
     * @param int    $meta_id
     * @param int    $object_id
     * @param string $meta_key
     * @param mixed  $meta_value
     */
    public function on_tracking_meta_updated($meta_id, $object_id, $meta_key, $meta_value) {
        unset($meta_id, $meta_value);
        if (!$this->settings->feature_enabled('wc_order_shipped')) {
            return;
        }

        $keys = apply_filters(
            'splitsms_wc_tracking_meta_keys',
            array(
                '_tracking_number',
                'tracking_number',
                '_wc_shipment_tracking_items',
                '_shipping_tracking_number',
                '_aftership_tracking_number',
            )
        );
        if (!in_array($meta_key, $keys, true)) {
            return;
        }

        $this->maybe_send_shipped_sms((int) $object_id, 'wc_order_shipped');
    }

    /**
     * WooCommerce Advanced Shipment Tracking plugin.
     *
     * @param int   $order_id
     * @param array $tracking_item
     * @param int   $tracking_id
     */
    public function on_ast_tracking_added($order_id, $tracking_item, $tracking_id) {
        unset($tracking_id);
        if (!$this->settings->feature_enabled('wc_order_shipped')) {
            return;
        }

        $extra = array();
        if (is_array($tracking_item)) {
            if (!empty($tracking_item['tracking_number'])) {
                $extra['tracking_number'] = (string) $tracking_item['tracking_number'];
            }
            if (!empty($tracking_item['tracking_provider'])) {
                $extra['tracking_provider'] = (string) $tracking_item['tracking_provider'];
            }
        }

        $this->maybe_send_shipped_sms((int) $order_id, 'wc_order_shipped', $extra);
    }

    /**
     * @param int                 $order_id
     * @param string              $event
     * @param array<string,string> $extra_vars
     */
    private function maybe_send_shipped_sms($order_id, $event, $extra_vars = array()) {
        if (isset($this->tracking_send_guard[$order_id])) {
            return;
        }
        $this->tracking_send_guard[$order_id] = true;

        $this->send_for_order(
            $order_id,
            $this->settings->get('wc_tpl_shipped'),
            $event,
            false,
            $extra_vars
        );
    }

    /**
     * @param int                   $order_id
     * @param string                $template
     * @param string                $event
     * @param bool                  $dedupe_payment
     * @param array<string, string> $extra_vars
     */
    private function send_for_order($order_id, $template, $event, $dedupe_payment = false, $extra_vars = array()) {
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
            $this->log_skip($order_id, $event, 'payment_sms_already_sent');
            return;
        }

        if ($dedupe_payment && $this->is_offline_gateway($order) && !$order->is_paid()) {
            $this->log_skip($order_id, $event, 'offline_gateway_not_paid');
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

        $vars = array_merge($this->order_vars($order), $extra_vars);
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
    private function is_offline_gateway($order) {
        $offline = apply_filters(
            'splitsms_wc_offline_payment_methods',
            array('cod', 'bacs', 'cheque')
        );
        return in_array($order->get_payment_method(), $offline, true);
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
            'payment_sms_already_sent' => __('Payment SMS already sent for this order', 'splitsms'),
            'offline_gateway_not_paid' => __('Offline payment (COD/BACS) — order not marked paid yet', 'splitsms'),
        );
        $detail = isset($labels[$reason]) ? $labels[$reason] : $reason;

        $log_id = SplitSMS_Logger::instance()->log(array(
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

        if ($log_id) {
            SplitSMS_Logger::instance()->sync_log_by_id($log_id);
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
        $shipping_methods = $order->get_shipping_method();
        $tracking = $this->resolve_tracking_number($order);

        return array(
            'site_name' => get_bloginfo('name'),
            'customer_name' => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'order_id' => (string) $order->get_order_number(),
            'order_total' => wp_strip_all_tags($order->get_formatted_order_total()),
            'order_status' => wc_get_order_status_name($order->get_status()),
            'order_date' => $order->get_date_created() ? wc_format_datetime($order->get_date_created()) : '',
            'item_count' => (string) $order->get_item_count(),
            'payment_method' => $gateway_title ? $gateway_title : $gateway,
            'payment_gateway' => $gateway,
            'transaction_id' => (string) $order->get_transaction_id(),
            'paystack_reference' => (string) $order->get_meta('_transaction_id'),
            'shipping_method' => is_string($shipping_methods) ? $shipping_methods : '',
            'shipping_city' => $order->get_shipping_city() ? $order->get_shipping_city() : $order->get_billing_city(),
            'shipping_country' => $order->get_shipping_country() ? $order->get_shipping_country() : $order->get_billing_country(),
            'tracking_number' => $tracking['number'],
            'tracking_provider' => $tracking['provider'],
            'refund_amount' => '',
            'refund_reason' => '',
        );
    }

    /**
     * @param WC_Order $order
     * @return array{number:string, provider:string}
     */
    private function resolve_tracking_number($order) {
        $number = (string) $order->get_meta('_tracking_number');
        $provider = (string) $order->get_meta('_tracking_provider');

        if ('' === $number) {
            $number = (string) $order->get_meta('tracking_number');
        }

        $ast_items = $order->get_meta('_wc_shipment_tracking_items');
        if ('' === $number && is_array($ast_items) && !empty($ast_items)) {
            $first = reset($ast_items);
            if (is_array($first)) {
                if (!empty($first['tracking_number'])) {
                    $number = (string) $first['tracking_number'];
                }
                if ('' === $provider && !empty($first['tracking_provider'])) {
                    $provider = (string) $first['tracking_provider'];
                }
            }
        }

        return array(
            'number' => $number,
            'provider' => $provider,
        );
    }
}
