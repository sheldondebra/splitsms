<?php
/**
 * Auto-generated from config/site.json — run: npm run sync:site-config
 * Do not edit manually; change config/site.json and re-sync.
 */
if (!defined('ABSPATH')) {
    exit;
}

define('SPLITSMS_APP_URL', 'https://www.splitsms.com');
define('SPLITSMS_SIGNUP_URL', 'https://www.splitsms.com/signup');
define('SPLITSMS_LOGIN_URL', 'https://www.splitsms.com/login');
define('SPLITSMS_API_DOCS_URL', 'https://www.splitsms.com/api-docs');
define('SPLITSMS_INTEGRATIONS_URL', 'https://www.splitsms.com/integrations');
define('SPLITSMS_PLUGIN_DOWNLOAD_URL', 'https://www.splitsms.com/wordpress-plugin/SplitSMS-v1.7.2.zip');
define('SPLITSMS_PLUGIN_DOWNLOAD_LATEST_URL', 'https://www.splitsms.com/wordpress-plugin/splitsms.zip');
define('SPLITSMS_UPDATE_CHECK_URL', 'https://www.splitsms.com/api/plugin/update');
define('SPLITSMS_PLUGIN_VERSION', '1.7.2');
define('SPLITSMS_ALLOW_CLOUD_PACKAGES', true);
define('SPLITSMS_ENABLE_CUSTOM_UPDATER', false);

if (!function_exists('splitsms_allow_cloud_packages')) {
    function splitsms_allow_cloud_packages() {
        return defined('SPLITSMS_ALLOW_CLOUD_PACKAGES') && SPLITSMS_ALLOW_CLOUD_PACKAGES;
    }
}

if (!function_exists('splitsms_enable_custom_updater')) {
    function splitsms_enable_custom_updater() {
        return defined('SPLITSMS_ENABLE_CUSTOM_UPDATER') && SPLITSMS_ENABLE_CUSTOM_UPDATER;
    }
}
