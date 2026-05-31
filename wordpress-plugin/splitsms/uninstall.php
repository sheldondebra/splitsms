<?php
/**
 * Fired when the plugin is deleted from WordPress → Plugins → Delete.
 * WordPress removes the plugin folder after this file runs.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$install_file = dirname(__FILE__) . '/includes/class-splitsms-install.php';
if (is_readable($install_file)) {
    require_once $install_file;
    SplitSMS_Install::uninstall_data();
} else {
    delete_option('splitsms_settings');
    delete_option('splitsms_db_version');
    delete_transient('splitsms_settings_error');
    delete_transient('splitsms_low_balance_alert');
    wp_clear_scheduled_hook('splitsms_process_reminders');

    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.NotPrepared
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_logs');
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.NotPrepared
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_reminders');
}
