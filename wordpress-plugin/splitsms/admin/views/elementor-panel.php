<?php
/**
 * Elementor Pro Forms setup panel (Integrations page).
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
?>
<section class="splitsms-card splitsms-elementor-panel">
    <h2><?php esc_html_e('Elementor Pro Forms', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS hooks into elementor_pro/forms/new_record — after Elementor runs form actions (email, webhooks, etc.). Add a Tel field to your form and set its Field ID below.', 'splitsms'); ?>
        <a href="https://developers.elementor.com/docs/hooks/forms/" target="_blank" rel="noopener"><?php esc_html_e('Elementor Forms hooks', 'splitsms'); ?></a>
    </p>

    <p class="description">
        <?php esc_html_e('In Elementor: edit form → add Tel field → Advanced → set Field ID (e.g. phone). Use that ID in “Phone field ID” below.', 'splitsms'); ?>
    </p>

    <p class="description">
        <?php esc_html_e('Template variables: {site_name}, {name}, {email}, {subject}, {message}, {form_name}, {form_id}, {phone}, plus {field_phone} for any field.', 'splitsms'); ?>
    </p>

    <?php if (!SplitSMS_Settings::is_yes($s['elementor_enabled'])) : ?>
        <p class="splitsms-elementor-warn"><?php esc_html_e('Enable Elementor Pro below and save to activate SMS on submit.', 'splitsms'); ?></p>
    <?php endif; ?>
</section>
