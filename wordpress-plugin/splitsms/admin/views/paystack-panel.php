<?php
/**
 * Paystack + WooCommerce setup panel (Integrations page).
 */

if (!defined('ABSPATH')) {
    exit;
}

$checklist = SplitSMS_Paystack::setup_checklist();
$webhook_url = SplitSMS_Paystack::get_webhook_url();
$s = SplitSMS_Settings::instance()->all();
$ready_count = 0;
foreach ($checklist as $item) {
    if (!empty($item['done'])) {
        $ready_count++;
    }
}
$all_ready = $ready_count === count($checklist);
?>
<section class="splitsms-card splitsms-integration-card splitsms-paystack-panel">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('Paystack + WooCommerce', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('SplitSMS sends SMS when WooCommerce marks the order paid — not directly from Paystack.', 'splitsms'); ?>
                <a href="https://support.paystack.com/en/articles/2124162" target="_blank" rel="noopener"><?php esc_html_e('Paystack guide', 'splitsms'); ?></a>
                ·
                <a href="https://woocommerce.com/document/paystack/" target="_blank" rel="noopener"><?php esc_html_e('WooCommerce docs', 'splitsms'); ?></a>
            </p>
        </div>
        <span class="splitsms-intel-pill <?php echo $all_ready ? 'splitsms-intel-pill--ok' : 'splitsms-intel-pill--warn'; ?>">
            <span class="splitsms-status-light splitsms-status-light--<?php echo $all_ready ? 'ok' : 'pending'; ?>" aria-hidden="true"></span>
            <?php
            if ($all_ready) {
                esc_html_e('Setup complete', 'splitsms');
            } else {
                printf(
                    esc_html__('%1$d / %2$d steps', 'splitsms'),
                    (int) $ready_count,
                    count($checklist)
                );
            }
            ?>
        </span>
    </header>

    <div class="splitsms-paystack-layout">
        <div class="splitsms-paystack-layout__checklist">
            <h3><?php esc_html_e('Checklist', 'splitsms'); ?></h3>
            <ol class="splitsms-paystack-checklist">
                <?php foreach ($checklist as $item) : ?>
                    <li class="<?php echo !empty($item['done']) ? 'is-done' : 'is-todo'; ?>">
                        <span class="splitsms-paystack-check" aria-hidden="true"><?php echo !empty($item['done']) ? '✓' : '○'; ?></span>
                        <span>
                            <strong><?php echo esc_html($item['label']); ?></strong>
                            <span class="description"><?php echo esc_html($item['detail']); ?></span>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ol>
        </div>

        <div class="splitsms-paystack-layout__side">
            <?php if ('' !== $webhook_url) : ?>
            <div class="splitsms-paystack-webhook">
                <p><strong><?php esc_html_e('Webhook URL', 'splitsms'); ?></strong></p>
                <p class="description">
                    <?php esc_html_e('Paste in Paystack Dashboard → Settings → API Keys & Webhooks.', 'splitsms'); ?>
                </p>
                <code class="splitsms-paystack-webhook-url" id="splitsms-paystack-webhook-url"><?php echo esc_html($webhook_url); ?></code>
                <button type="button" class="button button-secondary" id="splitsms-copy-webhook"><?php esc_html_e('Copy URL', 'splitsms'); ?></button>
            </div>
            <?php endif; ?>

            <div class="splitsms-paystack-notes">
                <h3><?php esc_html_e('Tips', 'splitsms'); ?></h3>
                <ul>
                    <li><?php esc_html_e('Test in Paystack + WooCommerce test mode before going live.', 'splitsms'); ?></li>
                    <li><?php esc_html_e('Collect billing phone at checkout.', 'splitsms'); ?></li>
                    <li><?php esc_html_e('Enable “Payment complete” and “Paid → processing” in WooCommerce below.', 'splitsms'); ?></li>
                    <?php if (!SplitSMS_Settings::is_yes($s['wc_payment_complete']) && !SplitSMS_Settings::is_yes($s['wc_payment_on_processing'])) : ?>
                        <li class="splitsms-paystack-warn"><?php esc_html_e('Payment SMS toggles are off — enable them in the WooCommerce section.', 'splitsms'); ?></li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </div>
</section>
