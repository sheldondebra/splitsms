<?php
/**
 * In-plugin documentation (mirrors splitsms.com/docs WordPress chapter).
 *
 * @package SplitSMS
 */

if (!defined('ABSPATH')) {
    exit;
}

$docs_url = defined('SPLITSMS_INTEGRATIONS_URL') ? SPLITSMS_INTEGRATIONS_URL : 'https://www.splitsms.com/integrations/wordpress';
$signup   = SplitSMS_Settings::signup_url('help-docs');
$forms_url = admin_url('admin.php?page=splitsms-forms');
?>
<div class="splitsms-card splitsms-help-docs">
    <h2><?php esc_html_e('How SplitSMS works', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS is a cloud SMS platform. This plugin connects your WordPress site to your SplitSMS account. When an event happens — order placed, form submitted, user registered — the plugin sends an SMS through the SplitSMS API and logs the result here and on splitsms.com.', 'splitsms'); ?>
    </p>
    <ol class="splitsms-steps">
        <li>
            <a href="<?php echo esc_url($signup); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Create a free SplitSMS account', 'splitsms'); ?></a>
            <?php esc_html_e('(starter SMS credits included).', 'splitsms'); ?>
        </li>
        <li><?php esc_html_e('Developers → API Keys on splitsms.com — create a key with sms.send permission.', 'splitsms'); ?></li>
        <li><?php esc_html_e('SplitSMS → Settings — paste the full API key (~56 characters), pick Sender ID, save.', 'splitsms'); ?></li>
        <li><?php esc_html_e('Enable WooCommerce / WordPress / Crocoblock under Integrations, or configure forms (below).', 'splitsms'); ?></li>
        <li><?php esc_html_e('Check SplitSMS → Logs and your splitsms.com dashboard for delivery status.', 'splitsms'); ?></li>
    </ol>
</div>

<div class="splitsms-card">
    <h2><?php esc_html_e('Admin menu guide', 'splitsms'); ?></h2>
    <table class="widefat striped splitsms-help-table">
        <thead>
            <tr>
                <th><?php esc_html_e('Page', 'splitsms'); ?></th>
                <th><?php esc_html_e('What it does', 'splitsms'); ?></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong><?php esc_html_e('Dashboard', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('Balance, test SMS, stats, connection and update status.', 'splitsms'); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Settings', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('API key, Sender ID, admin phone, replace-from-cloud reinstall.', 'splitsms'); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Forms', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('Toggle SMS per form, phone field, message — no custom code.', 'splitsms'); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Integrations', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('WooCommerce events, WordPress core, CF7/WPForms/Elementor toggles.', 'splitsms'); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Crocoblock', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('JetEngine, JetBooking, JetAppointment templates and reminders.', 'splitsms'); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Logs', 'splitsms'); ?></strong></td>
                <td><?php esc_html_e('Every send, skip, and failure; status updates Sent → Delivered.', 'splitsms'); ?></td>
            </tr>
        </tbody>
    </table>
</div>

<div class="splitsms-card">
    <h2><?php esc_html_e('Forms manager (quick setup)', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('SplitSMS → Forms auto-detects Contact Form 7, WPForms, Elementor Pro, JetFormBuilder, and JetEngine forms.', 'splitsms'); ?>
    </p>
    <ol class="splitsms-steps">
        <li>
            <a href="<?php echo esc_url($forms_url); ?>"><?php esc_html_e('Open SplitSMS → Forms', 'splitsms'); ?></a>
            <?php esc_html_e('and click Refresh list after adding new forms.', 'splitsms'); ?>
        </li>
        <li><?php esc_html_e('Toggle Send SMS on for the form you want.', 'splitsms'); ?></li>
        <li><?php esc_html_e('Select the phone field and edit the message template.', 'splitsms'); ?></li>
        <li><?php esc_html_e('Optional: enable Admin copy to SMS yourself on each submission.', 'splitsms'); ?></li>
        <li><?php esc_html_e('Save and submit a test entry — check Logs.', 'splitsms'); ?></li>
    </ol>
</div>

<div class="splitsms-card">
    <h2><?php esc_html_e('Native form actions (per-form in builder)', 'splitsms'); ?></h2>
    <table class="widefat striped splitsms-help-table">
        <thead>
            <tr>
                <th><?php esc_html_e('Builder', 'splitsms'); ?></th>
                <th><?php esc_html_e('Where', 'splitsms'); ?></th>
                <th><?php esc_html_e('Action', 'splitsms'); ?></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>JetFormBuilder</td>
                <td><?php esc_html_e('Post Submit Actions', 'splitsms'); ?></td>
                <td><strong><?php esc_html_e('Send SMS', 'splitsms'); ?></strong></td>
            </tr>
            <tr>
                <td>JetEngine Forms</td>
                <td><?php esc_html_e('Notifications', 'splitsms'); ?></td>
                <td><strong><?php esc_html_e('Send SMS', 'splitsms'); ?></strong></td>
            </tr>
            <tr>
                <td>Elementor Pro</td>
                <td><?php esc_html_e('Actions After Submit', 'splitsms'); ?></td>
                <td><strong><?php esc_html_e('SplitSMS Notification', 'splitsms'); ?></strong></td>
            </tr>
        </tbody>
    </table>
    <p class="description">
        <?php esc_html_e('Pick the phone field, write your message, optional admin copy and sender ID. Macros: %phone%, %post_id%, %user_id%. When a native action runs, duplicate global hooks are skipped for that submission.', 'splitsms'); ?>
    </p>
</div>

<div class="splitsms-card">
    <h2><?php esc_html_e('WooCommerce', 'splitsms'); ?></h2>
    <p class="description">
        <?php esc_html_e('Enable events under SplitSMS → Integrations. SMS goes to billing phone (then shipping, custom meta, or user meta). Placeholders: {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {paystack_reference}, {tracking_number}, {refund_amount}, {site_name}.', 'splitsms'); ?>
    </p>
    <p class="description">
        <?php esc_html_e('If no SMS is sent, open Logs — skip reasons show missing phone or disabled events.', 'splitsms'); ?>
    </p>
</div>

<div class="splitsms-card">
    <h2><?php esc_html_e('Troubleshooting', 'splitsms'); ?></h2>
    <ul class="splitsms-help-list">
        <li><strong><?php esc_html_e('Invalid API key', 'splitsms'); ?></strong> — <?php esc_html_e('Paste the full ~56-character secret, not the prefix only.', 'splitsms'); ?></li>
        <li><strong><?php esc_html_e('Plugin file not found', 'splitsms'); ?></strong> — <?php esc_html_e('Delete all splitsms* folders under wp-content/plugins/ and re-upload the zip.', 'splitsms'); ?></li>
        <li><strong><?php esc_html_e('Update failed', 'splitsms'); ?></strong> — <?php esc_html_e('Use Replace from splitsms.com on Settings or manual upload.', 'splitsms'); ?></li>
        <li><strong><?php esc_html_e('No SMS on form', 'splitsms'); ?></strong> — <?php esc_html_e('Check Forms toggle, phone field, and Logs skip reason.', 'splitsms'); ?></li>
    </ul>
    <p>
        <a href="<?php echo esc_url($docs_url); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Full documentation on splitsms.com', 'splitsms'); ?></a>
    </p>
</div>
