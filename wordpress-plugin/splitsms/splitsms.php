<?php
/**
 * Plugin Name:       SplitSMS
 * Plugin URI:        https://www.splitsms.com/integrations
 * Description:       Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.
 * Version:           1.2.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            SplitSMS
 * License:           GPL v2 or later
 * Text Domain:       splitsms
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SPLITSMS_VERSION', '1.2.0');
define('SPLITSMS_PLUGIN_FILE', __FILE__);
define('SPLITSMS_PLUGIN_DIR', plugin_dir_path(__FILE__));

require_once SPLITSMS_PLUGIN_DIR . 'includes/splitsms-config.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-settings.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-logger.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-api.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-reminders.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-crocoblock.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-jetengine.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-jetformbuilder.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-jetbooking.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-jetappointment.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-woocommerce.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-wordpress.php';
require_once SPLITSMS_PLUGIN_DIR . 'admin/class-splitsms-admin.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-updater.php';

/**
 * Bootstrap plugin services.
 */
function splitsms_init() {
    SplitSMS_Settings::instance();
    SplitSMS_Logger::instance();
    SplitSMS_Admin::instance();
    SplitSMS_Updater::instance();
    SplitSMS_Reminders::register_cron();

    if (SplitSMS_Settings::is_configured()) {
        SplitSMS_WooCommerce::instance();
        SplitSMS_WordPress::instance();
        SplitSMS_JetEngine::instance();
        SplitSMS_JetFormBuilder::instance();
        SplitSMS_JetBooking::instance();
        SplitSMS_JetAppointment::instance();
    }
}
add_action('plugins_loaded', 'splitsms_init');

register_activation_hook(__FILE__, array('SplitSMS_Settings', 'activate_defaults'));

register_uninstall_hook(__FILE__, 'splitsms_uninstall');

/**
 * Remove plugin data on uninstall.
 */
function splitsms_uninstall() {
    delete_option('splitsms_settings');
    if (class_exists('SplitSMS_Reminders')) {
        SplitSMS_Reminders::clear_cron();
    }
    global $wpdb;
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_logs'); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_reminders'); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}
