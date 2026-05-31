<?php
/**
 * Plugin Name:       SplitSMS
 * Plugin URI:        https://www.splitsms.com/integrations
 * Description:       Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.
 * Version:           1.6.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            SplitSMS
 * License:           GPL v2 or later
 * Text Domain:       splitsms
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('SPLITSMS_VERSION')) {
    define('SPLITSMS_VERSION', '1.6.0');
}
if (!defined('SPLITSMS_PLUGIN_FILE')) {
    define('SPLITSMS_PLUGIN_FILE', __FILE__);
}
if (!defined('SPLITSMS_PLUGIN_DIR')) {
    define('SPLITSMS_PLUGIN_DIR', plugin_dir_path(__FILE__));
}

/**
 * Load a required plugin file or show an admin notice (avoids hard fatal on missing files).
 *
 * @param string $relative Path relative to plugin root.
 * @return bool
 */
function splitsms_require($relative) {
    $path = SPLITSMS_PLUGIN_DIR . ltrim($relative, '/');
    if (!is_readable($path)) {
        if (!function_exists('add_action')) {
            return false;
        }
        add_action(
            'admin_notices',
            function () use ($relative) {
                if (!current_user_can('activate_plugins')) {
                    return;
                }
                echo '<div class="notice notice-error"><p>';
                echo esc_html(
                    sprintf(
                        /* translators: %s: file path */
                        __('SplitSMS could not load required file: %s. Re-install the plugin from splitsms.com.', 'splitsms'),
                        $relative
                    )
                );
                echo '</p></div>';
            }
        );
        return false;
    }
    require_once $path;
    return true;
}

$bootstrap_ok = true;
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/splitsms-config.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-settings.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-logger.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-api.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-integrations-registry.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-paystack.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-reminders.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-crocoblock.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetengine.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetformbuilder.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetbooking.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetappointment.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-cf7.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-wpforms.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-elementor.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-woocommerce.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-wordpress.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('admin/class-splitsms-admin.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-updater.php');

if (!$bootstrap_ok) {
    return;
}

/**
 * Plugin activation — create tables and default options.
 */
function splitsms_activate() {
    if (!class_exists('SplitSMS_Settings')) {
        return;
    }
    SplitSMS_Settings::activate_defaults();
}
register_activation_hook(__FILE__, 'splitsms_activate');

/**
 * Bootstrap plugin services.
 */
function splitsms_init() {
    if (!class_exists('SplitSMS_Settings')) {
        return;
    }

    SplitSMS_Settings::instance();
    SplitSMS_Logger::instance();
    SplitSMS_Admin::instance();
    SplitSMS_Updater::instance();
    SplitSMS_Reminders::register_cron_hooks();

    if (SplitSMS_Settings::is_configured()) {
        SplitSMS_WooCommerce::instance();
        SplitSMS_WordPress::instance();
        SplitSMS_CF7::instance();
        SplitSMS_WPForms::instance();
        SplitSMS_JetEngine::instance();
        SplitSMS_JetFormBuilder::instance();
        SplitSMS_JetBooking::instance();
        SplitSMS_JetAppointment::instance();
        SplitSMS_Elementor::instance();
    }
}
add_action('plugins_loaded', 'splitsms_init');

/**
 * Declare compatibility with WooCommerce HPOS (custom order tables).
 */
function splitsms_declare_wc_compatibility() {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            SPLITSMS_PLUGIN_FILE,
            true
        );
    }
}
add_action('before_woocommerce_init', 'splitsms_declare_wc_compatibility');

/**
 * After plugin update via WordPress — merge new settings keys only.
 *
 * @param WP_Upgrader $upgrader
 * @param array       $options
 */
function splitsms_after_plugin_update($upgrader, $options) {
    if (
        !is_array($options)
        || empty($options['action'])
        || 'update' !== $options['action']
        || empty($options['type'])
        || 'plugin' !== $options['type']
    ) {
        return;
    }

    $plugin_basename = plugin_basename(SPLITSMS_PLUGIN_FILE);
    $updated = isset($options['plugins']) && is_array($options['plugins'])
        ? $options['plugins']
        : array();
    if (!in_array($plugin_basename, $updated, true)) {
        return;
    }

    if (class_exists('SplitSMS_Settings')) {
        SplitSMS_Settings::maybe_upgrade();
    }
}
add_action('upgrader_process_complete', 'splitsms_after_plugin_update', 10, 2);

register_uninstall_hook(__FILE__, 'splitsms_uninstall');

/**
 * Remove plugin data on uninstall.
 */
function splitsms_uninstall() {
    delete_option('splitsms_settings');
    delete_option('splitsms_db_version');
    if (class_exists('SplitSMS_Reminders')) {
        SplitSMS_Reminders::clear_cron();
    }
    global $wpdb;
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_logs'); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
    $wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'splitsms_reminders'); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}
