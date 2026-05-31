<?php
/**
 * WPForms setup + settings (Integrations page).
 *
 * @var array<int, array{id:int, title:string}> $wpforms_forms
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
$wpforms_forms = SplitSMS_WPForms::list_forms();
?>
<section class="splitsms-card splitsms-integration-card splitsms-wpforms-panel">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('WPForms', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('SMS after a successful WPForms submission. Add a Phone field to your form.', 'splitsms'); ?>
                <a href="https://wpforms.com/docs/" target="_blank" rel="noopener"><?php esc_html_e('WPForms docs', 'splitsms'); ?></a>
            </p>
        </div>
        <label class="splitsms-toggle-label">
            <input type="checkbox" name="splitsms[wpforms_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wpforms_enabled'])); ?> />
            <?php esc_html_e('Enable', 'splitsms'); ?>
        </label>
    </header>

    <div class="splitsms-integration-card__grid">
        <div class="splitsms-field-block">
            <?php if (empty($wpforms_forms)) : ?>
                <div class="splitsms-notice-inline splitsms-notice-inline--warn">
                    <?php esc_html_e('No WPForms found. Create a form with a Phone field.', 'splitsms'); ?>
                </div>
            <?php else : ?>
                <h3><?php esc_html_e('Forms on this site', 'splitsms'); ?></h3>
                <ul class="splitsms-form-id-list">
                    <?php foreach ($wpforms_forms as $form) : ?>
                        <li><code><?php echo esc_html((string) $form['id']); ?></code> <?php echo esc_html($form['title']); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>

            <p>
                <label class="splitsms-field-label" for="splitsms-wpforms-phone"><?php esc_html_e('Phone field (name or label slug)', 'splitsms'); ?></label>
                <input id="splitsms-wpforms-phone" type="text" class="regular-text" name="splitsms[wpforms_phone_field]" value="<?php echo esc_attr($s['wpforms_phone_field']); ?>" />
            </p>
            <p>
                <label class="splitsms-field-label" for="splitsms-wpforms-ids"><?php esc_html_e('Form IDs (optional)', 'splitsms'); ?></label>
                <input id="splitsms-wpforms-ids" type="text" class="regular-text" name="splitsms[wpforms_form_ids]" value="<?php echo esc_attr($s['wpforms_form_ids']); ?>" placeholder="123, 456" />
                <span class="description"><?php esc_html_e('Comma-separated. Empty = all forms.', 'splitsms'); ?></span>
            </p>
        </div>

        <div class="splitsms-field-block">
            <h3><?php esc_html_e('Message template', 'splitsms'); ?></h3>
            <p><textarea class="large-text" rows="4" name="splitsms[wpforms_message]"><?php echo esc_textarea($s['wpforms_message']); ?></textarea></p>
            <details class="splitsms-details">
                <summary><?php esc_html_e('Template variables', 'splitsms'); ?></summary>
                <p class="description splitsms-var-list">
                    {site_name}, {name}, {email}, {form_name}, {form_id}, {phone}
                </p>
            </details>
        </div>
    </div>
</section>
