<?php
/**
 * Plugin Name:       SplitSMS
 * Plugin URI:        https://www.splitsms.com/integrations
 * Description:       Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.
 * Version:           1.7.2
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            SplitSMS
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       splitsms
 * Domain Path:       /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('SPLITSMS_VERSION')) {
    define('SPLITSMS_VERSION', '1.7.2');
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

/** Core only — integrations load lazily via SplitSMS_Bootstrap. */
$core_files = array(
    'includes/splitsms-config.php',
    'includes/class-splitsms-install.php',
    'includes/class-splitsms-bootstrap.php',
    'includes/class-splitsms-settings.php',
    'includes/class-splitsms-logger.php',
    'includes/class-splitsms-api.php',
    'includes/class-splitsms-plugin-status.php',
    'includes/class-splitsms-reminders.php',
    'includes/integrations/class-splitsms-form-sms-helper.php',
);

$bootstrap_ok = true;
foreach ($core_files as $file) {
    $bootstrap_ok = $bootstrap_ok && splitsms_require($file);
}

if (!$bootstrap_ok) {
    return;
}

add_action(
    'plugins_loaded',
    static function () {
        if (class_exists('SplitSMS_Install')) {
            SplitSMS_Install::init();
        }
    },
    1
);

/**
 * Plugin activation — create tables and default options.
 */
function splitsms_activate() {
    try {
        if (class_exists('SplitSMS_Install')) {
            SplitSMS_Install::on_activate();
        }
        if (class_exists('SplitSMS_Settings')) {
            SplitSMS_Settings::activate_defaults();
        }
    } catch (Throwable $e) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
        if (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('SplitSMS activation error: ' . $e->getMessage());
        }
    }
}
register_activation_hook(__FILE__, 'splitsms_activate');

/**
 * Bootstrap plugin services.
 */
function splitsms_init() {
    if (class_exists('SplitSMS_Bootstrap')) {
        SplitSMS_Bootstrap::init();
    }
}
add_action('plugins_loaded', 'splitsms_init', 10);

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
    unset($upgrader);

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
    if (class_exists('SplitSMS_Plugin_Status')) {
        delete_transient(SplitSMS_Plugin_Status::REMOTE_TRANSIENT);
    }
}
add_action('upgrader_process_complete', 'splitsms_after_plugin_update', 10, 2);
