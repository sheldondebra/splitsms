<?php
/**
 * Elementor Pro Forms setup + settings (Integrations page).
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
?>
<section class="splitsms-card splitsms-integration-card splitsms-elementor-panel">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('Elementor Pro Forms', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('SMS on elementor_pro/forms/new_record after form actions. Add a Tel field and set its Field ID in Advanced.', 'splitsms'); ?>
                <a href="https://developers.elementor.com/docs/hooks/forms/" target="_blank" rel="noopener"><?php esc_html_e('Elementor hooks', 'splitsms'); ?></a>
            </p>
        </div>
        <label class="splitsms-toggle-label">
            <input type="checkbox" name="splitsms[elementor_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['elementor_enabled'])); ?> />
            <?php esc_html_e('Enable', 'splitsms'); ?>
        </label>
    </header>

    <div class="splitsms-integration-card__grid">
        <div class="splitsms-field-block">
            <p>
                <label class="splitsms-field-label" for="splitsms-elementor-phone"><?php esc_html_e('Phone field ID', 'splitsms'); ?></label>
                <input id="splitsms-elementor-phone" type="text" class="regular-text" name="splitsms[elementor_phone_field]" value="<?php echo esc_attr($s['elementor_phone_field']); ?>" placeholder="phone" />
                <span class="description"><?php esc_html_e('Elementor Tel field → Advanced → Field ID.', 'splitsms'); ?></span>
            </p>
            <p>
                <label class="splitsms-field-label" for="splitsms-elementor-names"><?php esc_html_e('Form names (optional)', 'splitsms'); ?></label>
                <input id="splitsms-elementor-names" type="text" class="regular-text" name="splitsms[elementor_form_names]" value="<?php echo esc_attr($s['elementor_form_names']); ?>" placeholder="Contact Form, Quote" />
                <span class="description"><?php esc_html_e('Comma-separated. Empty = all forms.', 'splitsms'); ?></span>
            </p>
        </div>

        <div class="splitsms-field-block">
            <h3><?php esc_html_e('Message template', 'splitsms'); ?></h3>
            <p><textarea class="large-text" rows="4" name="splitsms[elementor_message]"><?php echo esc_textarea($s['elementor_message']); ?></textarea></p>
            <details class="splitsms-details">
                <summary><?php esc_html_e('Template variables', 'splitsms'); ?></summary>
                <p class="description splitsms-var-list">
                    {site_name}, {name}, {email}, {subject}, {message}, {form_name}, {form_id}, {phone}, {field_phone}
                </p>
            </details>
        </div>
    </div>
</section>
