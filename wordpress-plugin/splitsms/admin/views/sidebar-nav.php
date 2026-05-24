<?php
if (!defined('ABSPATH')) {
    exit;
}

$current = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : 'splitsms';
$nav = array(
    'splitsms' => array(__('Dashboard', 'splitsms'), 'dashicons-dashboard'),
    'splitsms-send' => array(__('Send SMS', 'splitsms'), 'dashicons-email'),
    'splitsms-integrations' => array(__('Integrations', 'splitsms'), 'dashicons-admin-plugins'),
    'splitsms-crocoblock' => array(__('Crocoblock', 'splitsms'), 'dashicons-calendar-alt'),
    'splitsms-automations' => array(__('Automations', 'splitsms'), 'dashicons-controls-repeat'),
    'splitsms-logs' => array(__('Logs', 'splitsms'), 'dashicons-list-view'),
    'splitsms-settings' => array(__('Settings', 'splitsms'), 'dashicons-admin-settings'),
    'splitsms-help' => array(__('Help', 'splitsms'), 'dashicons-editor-help'),
);

$wallet_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '#';
$docs_url = defined('SPLITSMS_INTEGRATIONS_URL') ? SPLITSMS_INTEGRATIONS_URL : '#';
$update_url = admin_url('admin.php?page=splitsms-help');
?>
<aside class="splitsms-sidebar" aria-label="<?php esc_attr_e('SplitSMS navigation', 'splitsms'); ?>">
    <div class="splitsms-sidebar__brand">
        <span class="splitsms-sidebar__logo" aria-hidden="true">SMS</span>
        <div>
            <strong>SplitSMS</strong>
            <span class="splitsms-sidebar__version">v<?php echo esc_html(SPLITSMS_VERSION); ?></span>
        </div>
    </div>
    <nav class="splitsms-sidebar__nav">
        <?php foreach ($nav as $slug => $item) : ?>
            <a
                class="splitsms-sidebar__link <?php echo $current === $slug ? 'is-active' : ''; ?>"
                href="<?php echo esc_url(admin_url('admin.php?page=' . $slug)); ?>"
            >
                <span class="dashicons <?php echo esc_attr($item[1]); ?>" aria-hidden="true"></span>
                <?php echo esc_html($item[0]); ?>
            </a>
        <?php endforeach; ?>
    </nav>
    <div class="splitsms-sidebar__footer">
        <a class="splitsms-sidebar__upgrade" href="<?php echo esc_url($wallet_url); ?>" target="_blank" rel="noopener">
            <strong><?php esc_html_e('Add SMS credits', 'splitsms'); ?></strong>
            <span><?php esc_html_e('Top up your SplitSMS wallet', 'splitsms'); ?></span>
        </a>
        <div class="splitsms-sidebar__footer-links">
            <a class="is-update" href="<?php echo esc_url($update_url); ?>">
                <?php esc_html_e('Check for plugin updates', 'splitsms'); ?>
            </a>
            <a href="<?php echo esc_url($docs_url); ?>" target="_blank" rel="noopener">
                <?php esc_html_e('Documentation', 'splitsms'); ?>
            </a>
        </div>
    </div>
</aside>
