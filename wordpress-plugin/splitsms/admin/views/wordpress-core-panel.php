<?php
/**
 * WordPress core integration settings (Integrations page).
 */

if (!defined('ABSPATH')) {
    exit;
}

$s = SplitSMS_Settings::instance()->all();
?>
<section class="splitsms-card splitsms-integration-card">
    <header class="splitsms-integration-card__head">
        <div>
            <h2><?php esc_html_e('WordPress core', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('SMS on user registration and optional password reset. Phone is read from user meta billing_phone or splitsms_phone.', 'splitsms'); ?>
            </p>
        </div>
        <label class="splitsms-toggle-label">
            <input type="checkbox" name="splitsms[wp_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_enabled'])); ?> />
            <?php esc_html_e('Enable WordPress SMS', 'splitsms'); ?>
        </label>
    </header>

    <fieldset class="splitsms-check-grid splitsms-check-grid--compact">
        <label><input type="checkbox" name="splitsms[wp_user_register]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_user_register'])); ?> /> <?php esc_html_e('Welcome SMS on registration', 'splitsms'); ?></label>
        <label><input type="checkbox" name="splitsms[wp_password_reset]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_password_reset'])); ?> /> <?php esc_html_e('Password reset via SMS (when phone exists)', 'splitsms'); ?></label>
    </fieldset>

    <div class="splitsms-template-grid splitsms-template-grid--two">
        <p><label><?php esc_html_e('Registration template', 'splitsms'); ?>
            <textarea class="large-text" rows="2" name="splitsms[wp_tpl_register]"><?php echo esc_textarea($s['wp_tpl_register']); ?></textarea></label></p>
        <p><label><?php esc_html_e('Password reset template', 'splitsms'); ?>
            <textarea class="large-text" rows="2" name="splitsms[wp_tpl_password_reset]"><?php echo esc_textarea($s['wp_tpl_password_reset']); ?></textarea></label>
            <span class="description"><?php esc_html_e('Use {reset_link} for the login reset URL.', 'splitsms'); ?></span></p>
    </div>
</section>
