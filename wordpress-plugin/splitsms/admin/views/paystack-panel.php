<?php
/**
 * Paystack + WooCommerce setup panel (Integrations page).
 *
 * @var bool $paystack_active
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
<section class="splitsms-card splitsms-paystack-panel">
    <h2><?php esc_html_e('Paystack + WooCommerce', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS does not connect to Paystack directly. When Paystack confirms payment, WooCommerce updates the order and SplitSMS sends your SMS templates.', 'splitsms'); ?>
        <a href="https://support.paystack.com/en/articles/2124162" target="_blank" rel="noopener"><?php esc_html_e('Paystack WordPress guide', 'splitsms'); ?></a>
        ·
        <a href="https://woocommerce.com/document/paystack/" target="_blank" rel="noopener"><?php esc_html_e('WooCommerce Paystack docs', 'splitsms'); ?></a>
    </p>

    <div class="splitsms-paystack-status <?php echo $all_ready ? 'is-ready' : 'is-pending'; ?>">
        <strong>
            <?php
            if ($all_ready) {
                esc_html_e('Paystack SMS setup looks complete', 'splitsms');
            } else {
                printf(
                    /* translators: 1: completed steps 2: total steps */
                    esc_html__('Setup checklist: %1$d / %2$d', 'splitsms'),
                    (int) $ready_count,
                    count($checklist)
                );
            }
            ?>
        </strong>
    </div>

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

    <?php if ('' !== $webhook_url) : ?>
    <div class="splitsms-paystack-webhook">
        <p><strong><?php esc_html_e('Paystack webhook URL (required for reliable payment SMS)', 'splitsms'); ?></strong></p>
        <p class="description">
            <?php esc_html_e('Paste this in Paystack Dashboard → Settings → API Keys & Webhooks. Without it, orders may stay pending when checkout redirects fail — and payment SMS will not send.', 'splitsms'); ?>
        </p>
        <code class="splitsms-paystack-webhook-url" id="splitsms-paystack-webhook-url"><?php echo esc_html($webhook_url); ?></code>
        <button type="button" class="button" id="splitsms-copy-webhook"><?php esc_html_e('Copy webhook URL', 'splitsms'); ?></button>
    </div>
    <?php endif; ?>

    <div class="splitsms-paystack-notes">
        <h3><?php esc_html_e('Paystack tips', 'splitsms'); ?></h3>
        <ul>
            <li><?php esc_html_e('Use Test Mode in Paystack and WooCommerce until checkout works, then switch both to Live Mode.', 'splitsms'); ?></li>
            <li><?php esc_html_e('Collect billing phone at checkout — Paystack payment SMS uses the WooCommerce billing phone.', 'splitsms'); ?></li>
            <li><?php esc_html_e('Enable “Payment complete” and “Paid → processing (Paystack)” below — they cover inline checkout and webhook recovery.', 'splitsms'); ?></li>
            <?php if (!SplitSMS_Settings::is_yes($s['wc_payment_complete']) && !SplitSMS_Settings::is_yes($s['wc_payment_on_processing'])) : ?>
                <li class="splitsms-paystack-warn"><?php esc_html_e('Neither payment SMS toggle is enabled — customers will not receive payment confirmation texts.', 'splitsms'); ?></li>
            <?php endif; ?>
        </ul>
    </div>
</section>
