<?php
/**
 * WooCommerce integration settings (Integrations page).
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
?>
<section class="splitsms-card splitsms-integration-card splitsms-woo-panel">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('WooCommerce', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('Customer phone is required on the order (billing or shipping). Enable phone on checkout in WooCommerce → Settings → General if missing.', 'splitsms'); ?>
            </p>
        </div>
        <label class="splitsms-toggle-label">
            <input type="checkbox" name="splitsms[wc_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_enabled'])); ?> />
            <?php esc_html_e('Enable WooCommerce SMS', 'splitsms'); ?>
        </label>
    </header>

    <?php if (!SplitSMS_Settings::is_configured()) : ?>
        <div class="splitsms-notice-inline splitsms-notice-inline--warn">
            <?php esc_html_e('Connect your API key in Settings first — WooCommerce SMS will not send until connected.', 'splitsms'); ?>
        </div>
    <?php elseif (!SplitSMS_Settings::is_yes($s['wc_enabled'])) : ?>
        <div class="splitsms-notice-inline splitsms-notice-inline--warn">
            <?php esc_html_e('Enable WooCommerce SMS above and save. Check SplitSMS → Logs after placing a test order.', 'splitsms'); ?>
        </div>
    <?php endif; ?>

    <div class="splitsms-integration-card__grid splitsms-integration-card__grid--woo">
        <div class="splitsms-field-block">
            <h3><?php esc_html_e('Order events', 'splitsms'); ?></h3>
            <fieldset class="splitsms-check-grid splitsms-check-grid--compact">
                <label><input type="checkbox" name="splitsms[wc_order_placed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_placed'])); ?> /> <?php esc_html_e('Order placed', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_payment_complete]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_payment_complete'])); ?> /> <?php esc_html_e('Payment complete', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_payment_on_processing]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_payment_on_processing'])); ?> /> <?php esc_html_e('Paid → processing (Paystack / Flutterwave)', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_processing]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_processing'])); ?> /> <?php esc_html_e('Processing status SMS', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_completed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_completed'])); ?> /> <?php esc_html_e('Completed', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_cancelled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_cancelled'])); ?> /> <?php esc_html_e('Cancelled', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_failed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_failed'])); ?> /> <?php esc_html_e('Payment failed', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_refunded]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_refunded'])); ?> /> <?php esc_html_e('Refunded', 'splitsms'); ?></label>
                <label><input type="checkbox" name="splitsms[wc_order_shipped]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_shipped'])); ?> /> <?php esc_html_e('Shipped (tracking added)', 'splitsms'); ?></label>
            </fieldset>
            <p class="description">
                <?php esc_html_e('Online gateways use payment_complete + paid→processing. COD/BACS only send payment SMS when the order is marked paid.', 'splitsms'); ?>
            </p>
        </div>

        <div class="splitsms-field-block">
            <h3><?php esc_html_e('Phone field', 'splitsms'); ?></h3>
            <p>
                <label class="splitsms-field-label" for="splitsms-wc-phone-meta"><?php esc_html_e('Custom phone meta key (optional)', 'splitsms'); ?></label>
                <input id="splitsms-wc-phone-meta" type="text" class="regular-text" name="splitsms[wc_phone_meta_key]" value="<?php echo esc_attr($s['wc_phone_meta_key']); ?>" placeholder="_billing_phone" />
                <span class="description"><?php esc_html_e('If checkout stores phone in custom order meta, enter the meta key here.', 'splitsms'); ?></span>
            </p>
            <details class="splitsms-details">
                <summary><?php esc_html_e('Template variables', 'splitsms'); ?></summary>
                <p class="description splitsms-var-list">
                    {site_name}, {customer_name}, {first_name}, {last_name}, {order_id}, {order_total}, {order_status}, {order_date}, {item_count}, {payment_method}, {payment_gateway}, {transaction_id}, {paystack_reference}, {shipping_method}, {shipping_city}, {tracking_number}, {tracking_provider}, {refund_amount}
                </p>
            </details>
        </div>
    </div>

    <details class="splitsms-details splitsms-details--templates" open>
        <summary><strong><?php esc_html_e('Message templates', 'splitsms'); ?></strong></summary>
        <div class="splitsms-template-grid">
            <p><label><?php esc_html_e('Order placed', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_placed]"><?php echo esc_textarea($s['wc_tpl_placed']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Payment received', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_payment]"><?php echo esc_textarea($s['wc_tpl_payment']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Processing', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_processing]"><?php echo esc_textarea($s['wc_tpl_processing']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Completed', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_completed]"><?php echo esc_textarea($s['wc_tpl_completed']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Cancelled', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_cancelled]"><?php echo esc_textarea($s['wc_tpl_cancelled']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Payment failed', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_failed]"><?php echo esc_textarea($s['wc_tpl_failed']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Refunded', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_refunded]"><?php echo esc_textarea($s['wc_tpl_refunded']); ?></textarea></label></p>
            <p><label><?php esc_html_e('Shipped', 'splitsms'); ?>
                <textarea class="large-text" rows="2" name="splitsms[wc_tpl_shipped]"><?php echo esc_textarea($s['wc_tpl_shipped']); ?></textarea></label></p>
        </div>
    </details>
</section>
