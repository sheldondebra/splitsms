<?php
/**
 * Plugin Name:       SplitSMS
 * Plugin URI:        https://www.splitsms.com/integrations
 * Description:       Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.
 * Version:           1.6.8
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            SplitSMS
 * License:           GPL v2 or later
 * Text Domain:       splitsms
 * Domain Path:       /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('SPLITSMS_VERSION')) {
    define('SPLITSMS_VERSION', '1.6.8');
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
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-install.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-settings.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-logger.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-api.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-integrations-registry.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-forms-registry.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-forms-manager.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-plugin-status.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-paystack.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-reminders.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-crocoblock.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetengine.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-form-sms-helper.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetengine-forms.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetformbuilder.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetbooking.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-jetappointment.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-cf7.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-wpforms.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/integrations/class-splitsms-elementor.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-woocommerce.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-wordpress.php');
$bootstrap_ok = $bootstrap_ok && splitsms_require('admin/class-splitsms-admin.php');
$custom_updater_enabled = defined('SPLITSMS_ENABLE_CUSTOM_UPDATER') && SPLITSMS_ENABLE_CUSTOM_UPDATER;
if ($custom_updater_enabled) {
    $bootstrap_ok = $bootstrap_ok && splitsms_require('includes/class-splitsms-updater.php');
}

if (!$bootstrap_ok) {
    return;
}

/**
 * Plugin activation — create tables and default options.
 */
function splitsms_activate() {
    if (class_exists('SplitSMS_Install')) {
        SplitSMS_Install::on_activate();
    }
    if (!class_exists('SplitSMS_Settings')) {
        return;
    }
    SplitSMS_Settings::activate_defaults();
}
register_activation_hook(__FILE__, 'splitsms_activate');

if (!$bootstrap_ok) {
    return;
}

SplitSMS_Install::init();

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
    if (defined('SPLITSMS_ENABLE_CUSTOM_UPDATER') && SPLITSMS_ENABLE_CUSTOM_UPDATER && class_exists('SplitSMS_Updater')) {
        SplitSMS_Updater::instance();
    }
    SplitSMS_Plugin_Status::register_admin_notices();
    SplitSMS_Reminders::register_cron_hooks();

    // Register form builder actions even before API key is saved.
    SplitSMS_JetFormBuilder::instance();
    SplitSMS_JetEngine_Forms::instance();
    SplitSMS_Elementor::instance();

    if (SplitSMS_Settings::is_configured()) {
        SplitSMS_WooCommerce::instance();
        SplitSMS_WordPress::instance();
        SplitSMS_CF7::instance();
        SplitSMS_WPForms::instance();
        SplitSMS_JetEngine::instance();
        SplitSMS_JetBooking::instance();
        SplitSMS_JetAppointment::instance();
    }
}
add_action('plugins_loaded', 'splitsms_init');

/**
 * Load plugin translations.
 */
function splitsms_load_textdomain() {
    load_plugin_textdomain('splitsms', false, dirname(plugin_basename(__FILE__)) . '/languages');
}
add_action('plugins_loaded', 'splitsms_load_textdomain', 5);

/**
 * Add privacy policy guidance in wp-admin.
 */
function splitsms_add_privacy_policy_content() {
    if (!function_exists('wp_add_privacy_policy_content')) {
        return;
    }

    $content = '<p>' . esc_html__('SplitSMS sends SMS notifications through the SplitSMS API when you enable integrations.', 'splitsms') . '</p>';
    $content .= '<p>' . esc_html__('Data sent to SplitSMS may include recipient phone numbers, message content, event names, delivery status, and technical metadata (site URL, WordPress version, plugin version, PHP version) when API connection/cloud sync is enabled.', 'splitsms') . '</p>';
    $content .= '<p>' . esc_html__('SplitSMS stores local delivery logs in your WordPress database. If you uninstall SplitSMS from Plugins > Delete, plugin logs/settings are removed by the plugin uninstall routine.', 'splitsms') . '</p>';
    $content .= '<p>' . esc_html__('Review your legal requirements for SMS consent, retention, and international data transfer before enabling automated messaging.', 'splitsms') . '</p>';

    wp_add_privacy_policy_content(
        __('SplitSMS', 'splitsms'),
        wp_kses_post($content)
    );
}
add_action('admin_init', 'splitsms_add_privacy_policy_content');

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
    delete_transient('splitsms_remote_manifest');
}
}
add_action('upgrader_process_complete', 'splitsms_after_plugin_update', 10, 2);
