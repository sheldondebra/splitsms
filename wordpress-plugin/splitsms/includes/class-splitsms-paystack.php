<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Paystack + WooCommerce helpers (woo-paystack gateway).
 *
 * SplitSMS does not call Paystack APIs — it sends SMS when WooCommerce marks orders paid
 * after the Paystack gateway or webhook confirms payment.
 *
 * @see https://support.paystack.com/en/articles/2124162
 * @see https://woocommerce.com/document/paystack/
 */
class SplitSMS_Paystack {

    /**
     * @return bool
     */
    public static function is_plugin_active() {
        if (class_exists('WC_Gateway_Paystack', false)) {
            return true;
        }
        if (defined('TBZ_WC_PAYSTACK_VERSION')) {
            return true;
        }
        if (function_exists('is_plugin_active')) {
            return is_plugin_active('woo-paystack/woo-paystack.php')
                || is_plugin_active('woo-paystack/paystack-gateway.php');
        }
        return false;
    }

    /**
     * Whether any Paystack gateway is registered with WooCommerce.
     *
     * @return bool
     */
    public static function is_gateway_present() {
        if (!class_exists('WooCommerce', false) || !function_exists('WC')) {
            return self::is_plugin_active();
        }

        $wc = WC();
        if (!is_object($wc) || !isset($wc->payment_gateways) || !is_object($wc->payment_gateways)) {
            return self::is_plugin_active();
        }

        $gateways = $wc->payment_gateways;
        if (method_exists($gateways, 'payment_gateways')) {
            $registered = $gateways->payment_gateways();
            if (is_array($registered)) {
                foreach (array_keys($registered) as $id) {
                    if (self::is_gateway_id($id)) {
                        return true;
                    }
                }
            }
        }

        return SplitSMS_Integrations_Registry::has_payment_gateway('paystack');
    }

    /**
     * @param string $gateway_id
     */
    public static function is_gateway_id($gateway_id) {
        return false !== stripos((string) $gateway_id, 'paystack');
    }

    /**
     * @param WC_Order $order
     */
    public static function is_paystack_order($order) {
        if (!is_a($order, 'WC_Order')) {
            return false;
        }
        return self::is_gateway_id($order->get_payment_method());
    }

    /**
     * Webhook URL shown in Paystack WooCommerce gateway settings.
     *
     * @return string
     */
    public static function get_webhook_url() {
        if (!function_exists('WC') || !WC()) {
            return '';
        }
        if (!function_exists('wc_get_page_id')) {
            return '';
        }
        return WC()->api_request_url('Tbz_WC_Paystack_Webhook');
    }

    /**
     * Recommended SplitSMS toggles for Paystack stores.
     *
     * @return array<string, bool>
     */
    public static function recommended_toggles() {
        return array(
            'wc_enabled' => true,
            'wc_order_placed' => true,
            'wc_payment_complete' => true,
            'wc_payment_on_processing' => true,
            'wc_order_processing' => false,
            'wc_order_completed' => false,
            'wc_order_cancelled' => true,
        );
    }

    /**
     * @return array<int, array{done:bool, label:string, detail:string}>
     */
    public static function setup_checklist() {
        $items = array();

        $items[] = array(
            'done' => class_exists('WooCommerce', false),
            'label' => __('WooCommerce is installed', 'splitsms'),
            'detail' => __('Paystack for WooCommerce requires WooCommerce.', 'splitsms'),
        );

        $items[] = array(
            'done' => self::is_plugin_active(),
            'label' => __('Paystack WooCommerce gateway is installed', 'splitsms'),
            'detail' => sprintf(
                /* translators: %s: Paystack integrations URL */
                __('Install from %s or Plugins → Add New → “Paystack WooCommerce Payment Gateway”.', 'splitsms'),
                'https://paystack.com/integrations'
            ),
        );

        $items[] = array(
            'done' => SplitSMS_Settings::is_configured(),
            'label' => __('SplitSMS API key connected', 'splitsms'),
            'detail' => __('Required scopes: sms.send and wallet.read.', 'splitsms'),
        );

        $items[] = array(
            'done' => SplitSMS_Settings::is_yes(SplitSMS_Settings::instance()->get('wc_enabled')),
            'label' => __('WooCommerce SMS enabled in SplitSMS', 'splitsms'),
            'detail' => __('SplitSMS → Integrations → Enable WooCommerce SMS.', 'splitsms'),
        );

        $items[] = array(
            'done' => SplitSMS_Settings::is_yes(SplitSMS_Settings::instance()->get('wc_payment_complete'))
                || SplitSMS_Settings::is_yes(SplitSMS_Settings::instance()->get('wc_payment_on_processing')),
            'label' => __('Payment confirmation SMS enabled', 'splitsms'),
            'detail' => __('Enable “Payment complete” and/or “Paid → processing (Paystack)”.', 'splitsms'),
        );

        $webhook = self::get_webhook_url();
        $items[] = array(
            'done' => '' !== $webhook,
            'label' => __('Paystack webhook URL available', 'splitsms'),
            'detail' => __('Copy the webhook URL below into Paystack Dashboard → Settings → API Keys & Webhooks. This ensures orders are marked paid when the customer’s network drops after checkout.', 'splitsms'),
        );

        return $items;
    }
}
