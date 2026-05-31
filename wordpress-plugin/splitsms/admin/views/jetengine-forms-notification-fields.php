<?php
/**
 * JetEngine legacy form notification fields (Vue template fragment).
 */

if (!defined('ABSPATH')) {
    exit;
}

$configured = SplitSMS_Settings::is_configured();
$settings_url = admin_url('admin.php?page=splitsms-settings');
?>
<?php if (!$configured) : ?>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-control">
        <p class="description" style="color:#b32d2e;margin:0;">
            <?php
            printf(
                /* translators: %s: settings URL */
                esc_html__('Connect SplitSMS in %s before this notification can send on submit.', 'splitsms'),
                '<a href="' . esc_url($settings_url) . '" target="_blank" rel="noopener">' . esc_html__('Settings', 'splitsms') . '</a>'
            );
            ?>
        </p>
    </div>
</div>
<?php endif; ?>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Send to:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <select v-model="currentItem.sms_to">
            <option value="form"><?php esc_html_e('Phone from submitted form field', 'splitsms'); ?></option>
            <option value="custom"><?php esc_html_e('Custom phone / macro', 'splitsms'); ?></option>
            <option value="admin"><?php esc_html_e('Admin phone (SplitSMS settings)', 'splitsms'); ?></option>
        </select>
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type && 'form' === currentItem.sms_to">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Phone field:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <select v-model="currentItem.phone_field">
            <option v-for="field in availableFields" :value="field">{{ field }}</option>
        </select>
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type && 'custom' === currentItem.sms_to">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Custom phone:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <input type="text" v-model="currentItem.custom_phone" placeholder="+233XXXXXXXXX or %phone%">
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Message:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <textarea v-model="currentItem.message" rows="4"></textarea>
        <p class="description"><?php esc_html_e('Use %field_name% macros (JetEngine) or {field_name} (SplitSMS).', 'splitsms'); ?></p>
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Country code field (optional):', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <select v-model="currentItem.country_code_field">
            <option value=""><?php esc_html_e('— None —', 'splitsms'); ?></option>
            <option v-for="field in availableFields" :value="field">{{ field }}</option>
        </select>
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Sender ID override (optional):', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <input type="text" v-model="currentItem.sender_id" placeholder="<?php esc_attr_e('Uses plugin default if empty', 'splitsms'); ?>">
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Also notify admin:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <input type="checkbox" v-model="currentItem.send_admin_copy" true-value="1" false-value="">
    </div>
</div>
<div class="jet-form-editor__row" v-if="'splitsms_send_sms' === currentItem.type && currentItem.send_admin_copy">
    <div class="jet-form-editor__row-label"><?php esc_html_e('Admin message:', 'splitsms'); ?></div>
    <div class="jet-form-editor__row-control">
        <textarea v-model="currentItem.admin_message" rows="3"></textarea>
    </div>
</div>
