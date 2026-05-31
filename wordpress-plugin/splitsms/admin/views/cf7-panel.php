<?php
/**
 * Contact Form 7 setup panel (Integrations page).
 *
 * @var array<int, array{id:int, title:string}> $cf7_forms
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
$cf7_forms = SplitSMS_CF7::list_forms();
?>
<section class="splitsms-card splitsms-cf7-panel">
    <h2><?php esc_html_e('Contact Form 7', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS sends an SMS after a valid CF7 submission when mail is sent (or when mail fails but the form passed validation — optional). Use a [tel] field for the visitor phone number.', 'splitsms'); ?>
        <a href="https://contactform7.com/docs/" target="_blank" rel="noopener"><?php esc_html_e('CF7 documentation', 'splitsms'); ?></a>
    </p>

    <?php if (empty($cf7_forms)) : ?>
        <p class="splitsms-notice-inline" style="background:#fffbeb;border-color:#fcd34d;color:#92400e;">
            <?php esc_html_e('No Contact Form 7 forms found. Install CF7 and create a form with a tel field, e.g. [tel your-phone].', 'splitsms'); ?>
        </p>
    <?php else : ?>
        <p><strong><?php esc_html_e('Forms on this site', 'splitsms'); ?></strong></p>
        <ul class="splitsms-cf7-form-list">
            <?php foreach ($cf7_forms as $form) : ?>
                <li>
                    <code><?php echo esc_html((string) $form['id']); ?></code>
                    <?php echo esc_html($form['title']); ?>
                </li>
            <?php endforeach; ?>
        </ul>
        <p class="description">
            <?php esc_html_e('Leave “Form IDs” empty to SMS on all forms, or enter comma-separated IDs (e.g. 123,456).', 'splitsms'); ?>
        </p>
    <?php endif; ?>

    <p class="description">
        <?php esc_html_e('Recommended form field: [tel* your-phone] — then set Phone field name to your-phone below.', 'splitsms'); ?>
        <?php esc_html_e('Template variables: {site_name}, {name}, {email}, {subject}, {message}, {form_title}, {form_id}, {phone}, plus {field_your_phone} for any posted field.', 'splitsms'); ?>
    </p>

    <?php if (!SplitSMS_Settings::is_yes($s['cf7_enabled'])) : ?>
        <p class="splitsms-cf7-warn"><?php esc_html_e('Enable Contact Form 7 below and save to activate SMS on submit.', 'splitsms'); ?></p>
    <?php endif; ?>
</section>
