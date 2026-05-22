<?php
/**
 * Plugin Name:       SplitSMS
 * Plugin URI:        https://splitsms.com
 * Description:       Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            SplitSMS
 * License:           GPL v2 or later
 * Text Domain:       splitsms
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SPLITSMS_VERSION', '1.0.0');
define('SPLITSMS_PLUGIN_FILE', __FILE__);
define('SPLITSMS_PLUGIN_DIR', plugin_dir_path(__FILE__));

require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-settings.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-api.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-woocommerce.php';
require_once SPLITSMS_PLUGIN_DIR . 'includes/class-splitsms-wordpress.php';
require_once SPLITSMS_PLUGIN_DIR . 'admin/class-splitsms-admin.php';

/**
 * Bootstrap plugin services.
 */
function splitsms_init() {
    SplitSMS_Settings::instance();
    SplitSMS_Admin::instance();

    if (SplitSMS_Settings::is_configured()) {
        SplitSMS_WooCommerce::instance();
        SplitSMS_WordPress::instance();
    }
}
add_action('plugins_loaded', 'splitsms_init');

register_activation_hook(__FILE__, array('SplitSMS_Settings', 'activate_defaults'));
