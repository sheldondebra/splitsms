<?php
/**
 * Contact Form 7 setup + settings (Integrations page).
 *
 * @var array<int, array{id:int, title:string}> $cf7_forms
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
$cf7_forms = SplitSMS_CF7::list_forms();
?>
<section class="splitsms-card splitsms-integration-card splitsms-cf7-panel">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('Contact Form 7', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('SMS after a valid submission when mail is sent (or when mail fails — optional). Use a [tel] field for the visitor phone.', 'splitsms'); ?>
                <a href="https://contactform7.com/docs/" target="_blank" rel="noopener"><?php esc_html_e('CF7 docs', 'splitsms'); ?></a>
            </p>
        </div>
        <label class="splitsms-toggle-label">
            <input type="checkbox" name="splitsms[cf7_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cf7_enabled'])); ?> />
            <?php esc_html_e('Enable', 'splitsms'); ?>
        </label>
    </header>

    <div class="splitsms-integration-card__grid">
        <div class="splitsms-field-block">
            <?php if (empty($cf7_forms)) : ?>
                <div class="splitsms-notice-inline splitsms-notice-inline--warn">
                    <?php esc_html_e('No CF7 forms found. Create a form with [tel* your-phone] and save.', 'splitsms'); ?>
                </div>
            <?php else : ?>
                <h3><?php esc_html_e('Forms on this site', 'splitsms'); ?></h3>
                <ul class="splitsms-form-id-list">
                    <?php foreach ($cf7_forms as $form) : ?>
                        <li><code><?php echo esc_html((string) $form['id']); ?></code> <?php echo esc_html($form['title']); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>

            <p>
                <label class="splitsms-field-label" for="splitsms-cf7-phone"><?php esc_html_e('Phone field name', 'splitsms'); ?></label>
                <input id="splitsms-cf7-phone" type="text" class="regular-text" name="splitsms[cf7_phone_field]" value="<?php echo esc_attr($s['cf7_phone_field']); ?>" placeholder="your-phone" />
                <span class="description"><?php esc_html_e('Must match your [tel] field name, e.g. your-phone.', 'splitsms'); ?></span>
            </p>
            <p>
                <label class="splitsms-field-label" for="splitsms-cf7-ids"><?php esc_html_e('Form IDs (optional)', 'splitsms'); ?></label>
                <input id="splitsms-cf7-ids" type="text" class="regular-text" name="splitsms[cf7_form_ids]" value="<?php echo esc_attr($s['cf7_form_ids']); ?>" placeholder="123, 456" />
                <span class="description"><?php esc_html_e('Comma-separated. Empty = all forms.', 'splitsms'); ?></span>
            </p>
            <p>
                <label><input type="checkbox" name="splitsms[cf7_on_mail_failed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cf7_on_mail_failed'])); ?> /> <?php esc_html_e('Send SMS even if CF7 email fails', 'splitsms'); ?></label>
            </p>
        </div>

        <div class="splitsms-field-block">
            <h3><?php esc_html_e('Message template', 'splitsms'); ?></h3>
            <p><textarea class="large-text" rows="4" name="splitsms[cf7_message]"><?php echo esc_textarea($s['cf7_message']); ?></textarea></p>
            <details class="splitsms-details">
                <summary><?php esc_html_e('Template variables', 'splitsms'); ?></summary>
                <p class="description splitsms-var-list">
                    {site_name}, {name}, {email}, {subject}, {message}, {form_title}, {form_id}, {phone}, {field_your_phone}
                </p>
            </details>
        </div>
    </div>
</section>
