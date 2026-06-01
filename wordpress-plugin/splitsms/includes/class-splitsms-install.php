<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Clean installs, upgrades, and full removal of plugin files.
 */
class SplitSMS_Install {
    const PLUGIN_SLUG = 'splitsms/splitsms.php';

    /**
     * Load wp-admin update helpers when needed.
     */
    private static function load_update_api() {
        if (!function_exists('wp_update_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }
    }

    /**
     * Load plugin upgrader classes.
     */
    private static function load_upgrader() {
        if (!function_exists('request_filesystem_credentials')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if (!class_exists('WP_Upgrader')) {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        }
        if (!class_exists('Automatic_Upgrader_Skin')) {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skin.php';
        }
    }

    /**
     * Register runtime hooks (upgrader + admin reinstall).
     */
    public static function init() {
        add_filter('upgrader_clear_destination', array(__CLASS__, 'clear_destination_on_update'), 10, 4);
        add_filter('upgrader_overwrite_package', array(__CLASS__, 'allow_overwrite_package'), 10, 2);
        add_filter('upgrader_package_options', array(__CLASS__, 'normalize_upgrader_options'), 10, 1);
        add_action('admin_post_splitsms_update_plugin', array(__CLASS__, 'handle_update_plugin'));
        add_action('admin_post_splitsms_reinstall', array(__CLASS__, 'handle_reinstall'));
        add_action('wp_ajax_splitsms_update_plugin', array(__CLASS__, 'ajax_update_plugin'));
        add_action('admin_notices', array(__CLASS__, 'admin_notices'));
    }

    /**
     * On activation: remove duplicate splitsms-* folders and fix nested installs.
     */
    public static function on_activate() {
        self::remove_stale_installations();
        self::repair_nested_installation();
    }

    /**
     * Delete all plugin data (options, tables, cron, transients). WordPress deletes the plugin folder after uninstall.php.
     */
    public static function uninstall_data() {
        self::unregister_from_wordpress();

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

        // Remove every splitsms* folder — hosts often leave files and WordPress lists the plugin again.
        self::remove_stale_installations(true);
    }

    /**
     * Remove SplitSMS from active lists, auto-updates, and update cache so it does not come back after delete.
     */
    private static function unregister_from_wordpress() {
        $plugin = self::PLUGIN_SLUG;

        $active = get_option('active_plugins', array());
        if (is_array($active)) {
            $active = array_values(array_diff($active, array($plugin)));
            update_option('active_plugins', $active);
        }

        $auto = get_site_option('auto_update_plugins', array());
        if (is_array($auto)) {
            $auto = array_values(array_diff($auto, array($plugin)));
            update_site_option('auto_update_plugins', $auto);
        }

        if (is_multisite()) {
            $network = get_site_option('active_sitewide_plugins', array());
            if (is_array($network) && isset($network[$plugin])) {
                unset($network[$plugin]);
                update_site_option('active_sitewide_plugins', $network);
            }
        }

        delete_site_transient('update_plugins');
    }

    /**
     * Allow WordPress to replace an existing SplitSMS folder when uploading or updating the zip.
     *
     * @param bool  $overwrite
     * @param array $args
     * @return bool
     */
    public static function allow_overwrite_package($overwrite, $args) {
        if (!is_array($args)) {
            return $overwrite;
        }

        if (!empty($args['plugin']) && self::PLUGIN_SLUG === $args['plugin']) {
            return true;
        }

        if (!empty($args['plugins']) && is_array($args['plugins']) && in_array(self::PLUGIN_SLUG, $args['plugins'], true)) {
            return true;
        }

        return $overwrite;
    }

    /**
     * Delete the old plugin directory before in-dashboard updates / reinstalls.
     *
     * @param bool        $clear
     * @param array       $args
     * @param string|null $package
     * @param WP_Upgrader $upgrader
     * @return bool
     */
    public static function clear_destination_on_update($clear, $args, $package, $upgrader) {
        unset($package, $upgrader);

        if (!is_array($args)) {
            return $clear;
        }

        $is_splitsms = false;
        if (!empty($args['plugin']) && self::PLUGIN_SLUG === $args['plugin']) {
            $is_splitsms = true;
        }
        if (!empty($args['plugins']) && is_array($args['plugins']) && in_array(self::PLUGIN_SLUG, $args['plugins'], true)) {
            $is_splitsms = true;
        }

        if ($is_splitsms) {
            self::remove_stale_installations(true);
            return true;
        }

        return $clear;
    }

    /**
     * Ensure SplitSMS updates replace in-place even on hosts where rollback temp backup move fails.
     *
     * @param array<string,mixed> $options
     * @return array<string,mixed>
     */
    public static function normalize_upgrader_options($options) {
        if (!is_array($options)) {
            return $options;
        }

        $hook_extra = isset($options['hook_extra']) && is_array($options['hook_extra']) ? $options['hook_extra'] : array();
        $plugin = isset($hook_extra['plugin']) ? (string) $hook_extra['plugin'] : '';
        $plugins = isset($hook_extra['plugins']) && is_array($hook_extra['plugins']) ? $hook_extra['plugins'] : array();
        $is_splitsms = (self::PLUGIN_SLUG === $plugin) || in_array(self::PLUGIN_SLUG, $plugins, true);

        if (!$is_splitsms) {
            return $options;
        }

        $options['clear_destination'] = true;
        $options['abort_if_destination_exists'] = false;
        // Avoid rollback-temp backup move on environments that cannot move plugin directories.
        $options['temp_backup'] = array();

        return $options;
    }

    /**
     * Whether a newer release is available (splitsms.com or WordPress update API).
     *
     * @return bool
     */
    public static function is_update_available() {
        $info = SplitSMS_Plugin_Status::version_info(false);
        if (!empty($info['is_outdated'])) {
            return true;
        }

        if (!is_admin() || !current_user_can('update_plugins')) {
            return false;
        }

        self::load_update_api();
        if (function_exists('wp_update_plugins')) {
            wp_update_plugins();
        }

        $updates = get_site_transient('update_plugins');
        return is_object($updates) && isset($updates->response[ self::PLUGIN_SLUG ]);
    }

    /**
     * Resolve download URL: WordPress.org / update transient first, then splitsms.com.
     *
     * @param bool $allow_same_version When true, return latest zip even if versions match (reinstall).
     * @return string|null
     */
    public static function resolve_update_package_url($allow_same_version = false) {
        if (is_admin() && current_user_can('update_plugins')) {
            self::load_update_api();
            if (function_exists('wp_update_plugins')) {
                wp_update_plugins();
            }
        }

        $updates = get_site_transient('update_plugins');
        if (is_object($updates) && isset($updates->response[ self::PLUGIN_SLUG ])) {
            $item = $updates->response[ self::PLUGIN_SLUG ];
            if (!empty($item->package)) {
                return (string) $item->package;
            }
        }

        $remote = SplitSMS_Plugin_Status::remote_manifest(true);
        $latest = is_array($remote) && !empty($remote['version']) ? (string) $remote['version'] : '';
        $download = is_array($remote) && !empty($remote['download_url']) ? (string) $remote['download_url'] : '';

        if ($download && ($allow_same_version || ($latest && version_compare(SPLITSMS_VERSION, $latest, '<')))) {
            return $download;
        }

        if ($allow_same_version) {
            if (defined('SPLITSMS_PLUGIN_DOWNLOAD_URL')) {
                return SPLITSMS_PLUGIN_DOWNLOAD_URL;
            }
            $base = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL : 'https://www.splitsms.com';
            return $base . '/wordpress-plugin/splitsms.zip';
        }

        return null;
    }

    /**
     * Download and install the latest plugin package.
     *
     * @param bool $allow_same_version Reinstall latest zip when already up to date.
     * @return true|WP_Error
     */
    public static function perform_plugin_update($allow_same_version = false) {
        if (!current_user_can('update_plugins')) {
            return new WP_Error('forbidden', __('You do not have permission to update plugins.', 'splitsms'));
        }

        if (!$allow_same_version && !self::is_update_available()) {
            return new WP_Error('up_to_date', __('SplitSMS is already up to date.', 'splitsms'));
        }

        $package = self::resolve_update_package_url($allow_same_version);
        if (!$package) {
            return new WP_Error('no_package', __('Could not find a download URL for the update.', 'splitsms'));
        }

        self::load_upgrader();

        self::remove_stale_installations(true);

        $skin = new Automatic_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader($skin);

        $result = $upgrader->run(
            array(
                'package'                     => $package,
                'destination'                 => WP_PLUGIN_DIR,
                'clear_destination'           => true,
                'abort_if_destination_exists' => false,
                'clear_working'               => true,
                'hook_extra'                  => array(
                    'plugin' => self::PLUGIN_SLUG,
                    'type'   => 'plugin',
                    'action' => 'update',
                ),
            )
        );

        delete_transient(SplitSMS_Plugin_Status::REMOTE_TRANSIENT);
        delete_site_transient('update_plugins');
        if (function_exists('wp_clean_plugins_cache')) {
            wp_clean_plugins_cache(true);
        }

        if (is_wp_error($result)) {
            return $result;
        }

        if (false === $result) {
            $message = __('Plugin update failed. Check your filesystem permissions.', 'splitsms');
            if (is_object($skin) && method_exists($skin, 'get_errors')) {
                $errors = $skin->get_errors();
                if (is_wp_error($errors) && $errors->has_errors()) {
                    return $errors;
                }
            }
            return new WP_Error('update_failed', $message);
        }

        if (!is_plugin_active(self::PLUGIN_SLUG)) {
            activate_plugin(self::PLUGIN_SLUG);
        }

        return true;
    }

    /**
     * @return string
     */
    private static function installed_version_after_update() {
        if (!function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $file = WP_PLUGIN_DIR . '/' . self::PLUGIN_SLUG;
        if (!is_readable($file)) {
            return SPLITSMS_VERSION;
        }
        $data = get_plugin_data($file, false, false);
        return !empty($data['Version']) ? (string) $data['Version'] : SPLITSMS_VERSION;
    }

    /**
     * AJAX: one-click update from SplitSMS admin.
     */
    public static function ajax_update_plugin() {
        check_ajax_referer('splitsms_update_plugin', 'nonce');

        $result = self::perform_plugin_update(false);
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }

        wp_send_json_success(
            array(
                'message' => sprintf(
                    /* translators: %s: plugin version */
                    __('SplitSMS updated to v%s.', 'splitsms'),
                    self::installed_version_after_update()
                ),
                'version' => self::installed_version_after_update(),
            )
        );
    }

    /**
     * POST: update plugin (redirect back to referrer).
     */
    public static function handle_update_plugin() {
        if (!current_user_can('update_plugins')) {
            wp_die(esc_html__('You do not have permission to update plugins.', 'splitsms'));
        }

        check_admin_referer('splitsms_update_plugin');

        $result = self::perform_plugin_update(false);
        $redirect = wp_get_referer();
        if (!$redirect) {
            $redirect = admin_url('admin.php?page=splitsms-dashboard');
        }

        if (is_wp_error($result)) {
            wp_safe_redirect(
                add_query_arg(
                    array(
                        'splitsms_update' => 'error',
                        'splitsms_msg'    => rawurlencode($result->get_error_message()),
                    ),
                    $redirect
                )
            );
            exit;
        }

        wp_safe_redirect(
            add_query_arg(
                array(
                    'splitsms_update' => 'success',
                    'splitsms_ver'    => rawurlencode(self::installed_version_after_update()),
                ),
                $redirect
            )
        );
        exit;
    }

    /**
     * Download latest zip from splitsms.com and replace the current installation (settings preserved in DB).
     */
    public static function handle_reinstall() {
        if (!current_user_can('update_plugins')) {
            wp_die(esc_html__('You do not have permission to update plugins.', 'splitsms'));
        }

        check_admin_referer('splitsms_reinstall');

        $result = self::perform_plugin_update(true);
        if (is_wp_error($result)) {
            wp_safe_redirect(
                add_query_arg(
                    array(
                        'page'             => 'splitsms-settings',
                        'splitsms_reinstall' => 'error',
                        'splitsms_msg'     => rawurlencode($result->get_error_message()),
                    ),
                    admin_url('admin.php')
                )
            );
            exit;
        }

        if (!is_plugin_active(self::PLUGIN_SLUG)) {
            activate_plugin(self::PLUGIN_SLUG);
        }

        wp_safe_redirect(
            add_query_arg(
                array(
                    'page'               => 'splitsms-settings',
                    'splitsms_reinstall' => 'success',
                ),
                admin_url('admin.php')
            )
        );
        exit;
    }

    /**
     * Admin notices for update/reinstall result and orphaned folders.
     */
    public static function admin_notices() {
        if (!current_user_can('activate_plugins')) {
            return;
        }

        if (isset($_GET['splitsms_update']) && 'success' === $_GET['splitsms_update']) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $ver = isset($_GET['splitsms_ver']) ? sanitize_text_field(wp_unslash($_GET['splitsms_ver'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '<div class="notice notice-success is-dismissible"><p>';
            if ('' !== $ver) {
                printf(
                    /* translators: %s: plugin version */
                    esc_html__('SplitSMS updated to v%s. Your settings were kept.', 'splitsms'),
                    esc_html(urldecode($ver))
                );
            } else {
                esc_html_e('SplitSMS was updated successfully. Your settings were kept.', 'splitsms');
            }
            echo '</p></div>';
        }

        if (isset($_GET['splitsms_update']) && 'error' === $_GET['splitsms_update'] && !empty($_GET['splitsms_msg'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '<div class="notice notice-error is-dismissible"><p>';
            echo esc_html(urldecode(sanitize_text_field(wp_unslash($_GET['splitsms_msg'])))); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '</p></div>';
        }

        if (isset($_GET['splitsms_reinstall']) && 'success' === $_GET['splitsms_reinstall']) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '<div class="notice notice-success is-dismissible"><p>';
            esc_html_e('SplitSMS was reinstalled from splitsms.com. Your settings were kept.', 'splitsms');
            echo '</p></div>';
        }

        if (isset($_GET['splitsms_reinstall']) && 'error' === $_GET['splitsms_reinstall'] && !empty($_GET['splitsms_msg'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '<div class="notice notice-error is-dismissible"><p>';
            echo esc_html(urldecode(sanitize_text_field(wp_unslash($_GET['splitsms_msg'])))); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            echo '</p></div>';
        }

        $orphans = self::find_stale_installations();
        if (empty($orphans)) {
            return;
        }

        echo '<div class="notice notice-warning"><p>';
        esc_html_e('SplitSMS found extra plugin folders from a previous upload (e.g. splitsms-1). Use “Replace from splitsms.com” on SplitSMS → Settings, or delete those folders under wp-content/plugins/, then upload the zip again.', 'splitsms');
        echo '</p></div>';
    }

    /**
     * Remove splitsms, splitsms-1, … folders except the running install.
     *
     * @param bool $include_current When true (reinstall), remove every SplitSMS folder first.
     */
    public static function remove_stale_installations($include_current = false) {
        if (!defined('WP_PLUGIN_DIR')) {
            return;
        }

        $current = defined('SPLITSMS_PLUGIN_DIR')
            ? wp_normalize_path(trailingslashit(SPLITSMS_PLUGIN_DIR))
            : '';

        foreach (self::find_stale_installations($include_current ? '' : $current) as $dir) {
            self::delete_directory($dir);
        }
    }

    /**
     * @param string $except_dir Normalized path to keep (with trailing slash), or empty to remove all.
     * @return string[]
     */
    private static function find_stale_installations($except_dir = '') {
        $found = array();
        $except_dir = '' !== $except_dir ? wp_normalize_path(trailingslashit($except_dir)) : '';
        $plugins_dir = wp_normalize_path(trailingslashit(WP_PLUGIN_DIR));

        $matches = glob($plugins_dir . 'splitsms*', GLOB_ONLYDIR);
        if (!is_array($matches)) {
            return $found;
        }

        foreach ($matches as $dir) {
            $dir = wp_normalize_path(trailingslashit($dir));
            if ('' !== $except_dir && $dir === $except_dir) {
                continue;
            }
            if (!is_readable($dir . 'splitsms.php')) {
                continue;
            }
            $found[] = $dir;
        }

        return $found;
    }

    /**
     * Fix accidental wp-content/plugins/splitsms/splitsms/ nested copy from bad zips.
     */
    private static function repair_nested_installation() {
        if (!defined('SPLITSMS_PLUGIN_DIR')) {
            return;
        }

        $nested = wp_normalize_path(trailingslashit(SPLITSMS_PLUGIN_DIR) . 'splitsms/');
        if (!is_readable($nested . 'splitsms.php')) {
            return;
        }

        self::delete_directory($nested);
    }

    /**
     * Recursively delete a directory under wp-content/plugins/.
     *
     * @param string $dir
     */
    private static function delete_directory($dir) {
        $dir = wp_normalize_path(untrailingslashit($dir));
        $plugins_dir = wp_normalize_path(untrailingslashit(WP_PLUGIN_DIR));

        if (0 !== strpos($dir, $plugins_dir . '/') && $dir !== $plugins_dir) {
            return;
        }

        if (!function_exists('request_filesystem_credentials')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        global $wp_filesystem;
        if (empty($wp_filesystem)) {
            WP_Filesystem();
        }

        if ($wp_filesystem && $wp_filesystem->exists($dir)) {
            $wp_filesystem->delete($dir, true);
            return;
        }

        if (!is_dir($dir)) {
            return;
        }

        $items = scandir($dir);
        if (!is_array($items)) {
            return;
        }

        foreach ($items as $item) {
            if ('.' === $item || '..' === $item) {
                continue;
            }
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                self::delete_directory($path);
            } else {
                wp_delete_file($path);
            }
        }

        rmdir($dir);
    }
}
