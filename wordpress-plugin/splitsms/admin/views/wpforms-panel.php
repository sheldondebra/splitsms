<?php
/**
 * WPForms setup panel (Integrations page).
 *
 * @var array<int, array{id:int, title:string}> $wpforms_forms
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
$wpforms_forms = SplitSMS_WPForms::list_forms();
?>
<section class="splitsms-card splitsms-wpforms-panel">
    <h2><?php esc_html_e('WPForms', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS sends an SMS after a successful WPForms submission. Add a Phone field to your form and set the field name below.', 'splitsms'); ?>
        <a href="https://wpforms.com/docs/" target="_blank" rel="noopener"><?php esc_html_e('WPForms documentation', 'splitsms'); ?></a>
    </p>

    <?php if (empty($wpforms_forms)) : ?>
        <p class="splitsms-notice-inline" style="background:#fffbeb;border-color:#fcd34d;color:#92400e;">
            <?php esc_html_e('No WPForms found. Create a form with a Phone field type.', 'splitsms'); ?>
        </p>
    <?php else : ?>
        <p><strong><?php esc_html_e('Forms on this site', 'splitsms'); ?></strong></p>
        <ul class="splitsms-cf7-form-list">
            <?php foreach ($wpforms_forms as $form) : ?>
                <li>
                    <code><?php echo esc_html((string) $form['id']); ?></code>
                    <?php echo esc_html($form['title']); ?>
                </li>
            <?php endforeach; ?>
        </ul>
        <p class="description">
            <?php esc_html_e('Leave “Form IDs” empty to SMS on all forms, or enter comma-separated IDs.', 'splitsms'); ?>
        </p>
    <?php endif; ?>

    <p class="description">
        <?php esc_html_e('Template variables: {site_name}, {name}, {email}, {form_name}, {form_id}, {phone}.', 'splitsms'); ?>
    </p>

    <?php if (!SplitSMS_Settings::is_yes($s['wpforms_enabled'])) : ?>
        <p class="splitsms-cf7-warn"><?php esc_html_e('Enable WPForms below and save to activate SMS on submit.', 'splitsms'); ?></p>
    <?php endif; ?>
</section>
