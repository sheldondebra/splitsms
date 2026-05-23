<?php
/**
 * Crocoblock / JetEngine integration settings UI.
 *
 * @var array<string,mixed> $s Settings array.
 */

if (!defined('ABSPATH')) {
    exit;
}

$detected = SplitSMS_Crocoblock::detect_plugins();
$any = SplitSMS_Crocoblock::any_detected();
$vars_hint = '{name}, {phone}, {email}, {booking_date}, {appointment_date}, {status}, {title}, {form_title}';
?>
<form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-crocoblock')); ?>">
    <?php wp_nonce_field('splitsms_settings'); ?>
    <input type="hidden" name="splitsms_save" value="1" />

    <div class="splitsms-card">
        <h2><?php esc_html_e('Crocoblock / JetEngine', 'splitsms'); ?></h2>
        <p class="description"><?php esc_html_e('No-code SMS for JetEngine CPTs, JetFormBuilder, JetBooking, and JetAppointment.', 'splitsms'); ?></p>

        <?php if (!$any) : ?>
            <p class="splitsms-notice-warn"><?php esc_html_e('Crocoblock tools not detected. Install JetEngine or JetFormBuilder to enable this integration.', 'splitsms'); ?></p>
        <?php else : ?>
            <ul class="splitsms-detect-list">
                <?php foreach ($detected as $slug => $active) : ?>
                    <li><?php echo $active ? '✓' : '○'; ?> <?php echo esc_html(ucwords(str_replace('_', ' ', $slug))); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>

        <p><label><input type="checkbox" name="splitsms[cb_enabled]" value="1" <?php checked(SplitSMS_Settings::instance()->feature_enabled('cb_enabled')); ?> /> <?php esc_html_e('Enable Crocoblock SMS automations', 'splitsms'); ?></label></p>
    </div>

    <div class="splitsms-card">
        <h3><?php esc_html_e('Field mapping', 'splitsms'); ?></h3>
        <table class="form-table">
            <tr>
                <th><?php esc_html_e('Recipient phone field', 'splitsms'); ?></th>
                <td><input type="text" class="regular-text" name="splitsms[cb_phone_field]" value="<?php echo esc_attr($s['cb_phone_field']); ?>" /></td>
            </tr>
            <tr>
                <th><?php esc_html_e('Recipient name field', 'splitsms'); ?></th>
                <td><input type="text" class="regular-text" name="splitsms[cb_name_field]" value="<?php echo esc_attr($s['cb_name_field']); ?>" /></td>
            </tr>
            <tr>
                <th><?php esc_html_e('Admin phone', 'splitsms'); ?></th>
                <td><input type="text" class="regular-text" name="splitsms[cb_admin_phone]" value="<?php echo esc_attr($s['cb_admin_phone']); ?>" /></td>
            </tr>
            <tr>
                <th><?php esc_html_e('Fallback phone', 'splitsms'); ?></th>
                <td><input type="text" class="regular-text" name="splitsms[cb_fallback_phone]" value="<?php echo esc_attr($s['cb_fallback_phone']); ?>" /></td>
            </tr>
            <tr>
                <th><?php esc_html_e('Reminder timing', 'splitsms'); ?></th>
                <td>
                    <select name="splitsms[cb_reminder_offset]">
                        <option value="3600" <?php selected($s['cb_reminder_offset'], '3600'); ?>><?php esc_html_e('1 hour before', 'splitsms'); ?></option>
                        <option value="10800" <?php selected($s['cb_reminder_offset'], '10800'); ?>><?php esc_html_e('3 hours before', 'splitsms'); ?></option>
                        <option value="86400" <?php selected($s['cb_reminder_offset'], '86400'); ?>><?php esc_html_e('1 day before', 'splitsms'); ?></option>
                        <option value="172800" <?php selected($s['cb_reminder_offset'], '172800'); ?>><?php esc_html_e('2 days before', 'splitsms'); ?></option>
                    </select>
                </td>
            </tr>
        </table>
        <p class="description"><?php esc_html_e('Template variables:', 'splitsms'); ?> <code><?php echo esc_html($vars_hint); ?></code></p>
    </div>

    <?php if (!empty($detected['jetengine'])) : ?>
    <section class="splitsms-card splitsms-automation-card">
        <h3>JetEngine</h3>
        <label><input type="checkbox" name="splitsms[cb_jetengine_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetengine_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Post types (comma-separated, empty = all)', 'splitsms'); ?><br />
            <input type="text" class="large-text" name="splitsms[cb_jetengine_post_types]" value="<?php echo esc_attr($s['cb_jetengine_post_types']); ?>" /></label></p>
        <label><input type="checkbox" name="splitsms[cb_jetengine_on_create]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetengine_on_create'])); ?> /> <?php esc_html_e('On create', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetengine_on_status]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetengine_on_status'])); ?> /> <?php esc_html_e('On status change', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetengine_admin_alert]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetengine_admin_alert'])); ?> /> <?php esc_html_e('Admin alert', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Created template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetengine_tpl_created]"><?php echo esc_textarea($s['cb_jetengine_tpl_created']); ?></textarea></label></p>
        <p><label><?php esc_html_e('Status template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetengine_tpl_status]"><?php echo esc_textarea($s['cb_jetengine_tpl_status']); ?></textarea></label></p>
        <p><label><?php esc_html_e('Admin template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetengine_tpl_admin]"><?php echo esc_textarea($s['cb_jetengine_tpl_admin']); ?></textarea></label></p>
    </section>
    <?php endif; ?>

    <?php if (!empty($detected['jetformbuilder'])) : ?>
    <section class="splitsms-card splitsms-automation-card">
        <h3>JetFormBuilder</h3>
        <label><input type="checkbox" name="splitsms[cb_jfb_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jfb_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Form IDs (comma-separated, empty = all)', 'splitsms'); ?><br />
            <input type="text" class="regular-text" name="splitsms[cb_jfb_form_ids]" value="<?php echo esc_attr($s['cb_jfb_form_ids']); ?>" /></label></p>
        <p><label><?php esc_html_e('Phone field', 'splitsms'); ?>
            <input type="text" class="regular-text" name="splitsms[cb_jfb_phone_field]" value="<?php echo esc_attr($s['cb_jfb_phone_field']); ?>" /></label></p>
        <label><input type="checkbox" name="splitsms[cb_jfb_admin_alert]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jfb_admin_alert'])); ?> /> <?php esc_html_e('Admin alert', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Submit template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jfb_tpl_submitted]"><?php echo esc_textarea($s['cb_jfb_tpl_submitted']); ?></textarea></label></p>
    </section>
    <?php endif; ?>

    <?php if (!empty($detected['jetbooking'])) : ?>
    <section class="splitsms-card splitsms-automation-card">
        <h3>JetBooking</h3>
        <label><input type="checkbox" name="splitsms[cb_jetbooking_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetbooking_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Phone field', 'splitsms'); ?>
            <input type="text" class="regular-text" name="splitsms[cb_jetbooking_phone_field]" value="<?php echo esc_attr($s['cb_jetbooking_phone_field']); ?>" /></label></p>
        <label><input type="checkbox" name="splitsms[cb_jetbooking_on_create]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetbooking_on_create'])); ?> /> <?php esc_html_e('Booking created', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetbooking_on_status]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetbooking_on_status'])); ?> /> <?php esc_html_e('Status changed', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetbooking_reminder]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetbooking_reminder'])); ?> /> <?php esc_html_e('Send reminder before check-in', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetbooking_admin_alert]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetbooking_admin_alert'])); ?> /> <?php esc_html_e('Admin alert', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Confirmed template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetbooking_tpl_confirmed]"><?php echo esc_textarea($s['cb_jetbooking_tpl_confirmed']); ?></textarea></label></p>
        <p><label><?php esc_html_e('Reminder template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetbooking_tpl_reminder]"><?php echo esc_textarea($s['cb_jetbooking_tpl_reminder']); ?></textarea></label></p>
    </section>
    <?php endif; ?>

    <?php if (!empty($detected['jetappointment'])) : ?>
    <section class="splitsms-card splitsms-automation-card">
        <h3>JetAppointment</h3>
        <label><input type="checkbox" name="splitsms[cb_jetappointment_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetappointment_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Phone field', 'splitsms'); ?>
            <input type="text" class="regular-text" name="splitsms[cb_jetappointment_phone_field]" value="<?php echo esc_attr($s['cb_jetappointment_phone_field']); ?>" /></label></p>
        <label><input type="checkbox" name="splitsms[cb_jetappointment_on_create]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetappointment_on_create'])); ?> /> <?php esc_html_e('Appointment booked', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetappointment_reminder]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetappointment_reminder'])); ?> /> <?php esc_html_e('Send reminder', 'splitsms'); ?></label><br />
        <label><input type="checkbox" name="splitsms[cb_jetappointment_provider_alert]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cb_jetappointment_provider_alert'])); ?> /> <?php esc_html_e('Provider alert', 'splitsms'); ?></label>
        <p><label><?php esc_html_e('Confirmed template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetappointment_tpl_confirmed]"><?php echo esc_textarea($s['cb_jetappointment_tpl_confirmed']); ?></textarea></label></p>
        <p><label><?php esc_html_e('Provider template', 'splitsms'); ?><br /><textarea class="large-text" rows="2" name="splitsms[cb_jetappointment_tpl_provider]"><?php echo esc_textarea($s['cb_jetappointment_tpl_provider']); ?></textarea></label></p>
    </section>
    <?php endif; ?>

    <div class="splitsms-card">
        <h3><?php esc_html_e('Conditional rules (JSON)', 'splitsms'); ?></h3>
        <p class="description"><?php esc_html_e('Optional. Example: [{"active":1,"integration":"jetbooking","event":"booking_confirmed","field":"status","operator":"equals","value":"confirmed"}]', 'splitsms'); ?></p>
        <textarea class="large-text code" rows="4" name="splitsms[cb_rules]"><?php echo esc_textarea($s['cb_rules']); ?></textarea>
    </div>

    <?php submit_button(__('Save Crocoblock settings', 'splitsms')); ?>
</form>
