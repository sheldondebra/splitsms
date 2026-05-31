<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin health — version check vs splitsms.com, environment details, cloud sync.
 */
class SplitSMS_Plugin_Status {
    const REMOTE_TRANSIENT = 'splitsms_remote_manifest';
    const REMOTE_TTL = 3600;
    const SYNC_TRANSIENT = 'splitsms_cloud_sync_at';
    const SYNC_INTERVAL = 43200;

    /**
     * @return array<string, mixed>|null
     */
    public static function remote_manifest($force = false) {
        if (!$force) {
            $cached = get_transient(self::REMOTE_TRANSIENT);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $url = defined('SPLITSMS_UPDATE_CHECK_URL')
            ? SPLITSMS_UPDATE_CHECK_URL
            : SPLITSMS_APP_URL . '/api/plugin/update';

        $response = wp_remote_get(
            $url,
            array(
                'timeout' => 15,
                'headers' => array('Accept' => 'application/json'),
            )
        );

        if (is_wp_error($response) || 200 !== wp_remote_retrieve_response_code($response)) {
            return null;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($data) || empty($data['version'])) {
            return null;
        }

        set_transient(self::REMOTE_TRANSIENT, $data, self::REMOTE_TTL);

        return $data;
    }

    /**
     * @return array{
     *   installed:string,
     *   latest:?string,
     *   is_outdated:bool,
     *   download_url:?string,
     *   changelog:?string
     * }
     */
    public static function version_info($force_remote = false) {
        $remote = self::remote_manifest($force_remote);
        $latest = is_array($remote) && !empty($remote['version']) ? (string) $remote['version'] : null;

        return array(
            'installed' => SPLITSMS_VERSION,
            'latest' => $latest,
            'is_outdated' => $latest ? version_compare(SPLITSMS_VERSION, $latest, '<') : false,
            'download_url' => is_array($remote) && !empty($remote['download_url'])
                ? (string) $remote['download_url']
                : (defined('SPLITSMS_PLUGIN_DOWNLOAD_URL') ? SPLITSMS_PLUGIN_DOWNLOAD_URL : null),
            'changelog' => is_array($remote) && !empty($remote['changelog']) ? (string) $remote['changelog'] : null,
        );
    }

    /**
     * @return array{wp_version:string, php_version:string, site_url:string, site_name:string}
     */
    public static function environment() {
        global $wp_version;

        return array(
            'wp_version' => is_string($wp_version) ? $wp_version : '',
            'php_version' => PHP_VERSION,
            'site_url' => home_url('/'),
            'site_name' => get_bloginfo('name'),
        );
    }

    /**
     * Push site + version metadata to SplitSMS when API is connected.
     */
    public static function sync_with_cloud($force = false) {
        if (!SplitSMS_Settings::is_configured()) {
            return false;
        }

        if (!$force && get_transient(self::SYNC_TRANSIENT)) {
            return true;
        }

        $api = new SplitSMS_API();
        $result = $api->connect_site();

        if (!empty($result['ok'])) {
            set_transient(self::SYNC_TRANSIENT, time(), self::SYNC_INTERVAL);
        }

        return !empty($result['ok']);
    }

    /**
     * Full status for admin UI.
     *
     * @return array<string, mixed>
     */
    public static function summary($configured) {
        if ($configured) {
            self::sync_with_cloud(false);
        }

        $version = self::version_info(false);
        $env = self::environment();

        return array(
            'configured' => $configured,
            'version' => $version,
            'environment' => $env,
            'updates_url' => admin_url('update-core.php'),
            'help_url' => admin_url('admin.php?page=splitsms-help'),
        );
    }

    public static function register_admin_notices() {
        add_action('admin_notices', array(__CLASS__, 'render_outdated_notice'));
    }

    public static function render_outdated_notice() {
        if (!current_user_can('update_plugins')) {
            return;
        }

        $version = self::version_info(false);
        if (empty($version['is_outdated']) || empty($version['latest'])) {
            return;
        }

        $updates = admin_url('update-core.php');
        ?>
        <div class="notice notice-warning splitsms-update-notice">
            <p>
                <strong><?php esc_html_e('SplitSMS plugin update available', 'splitsms'); ?></strong>
                <?php
                printf(
                    /* translators: 1: installed version 2: latest version */
                    esc_html__('You have v%1$s — v%2$s is available on splitsms.com.', 'splitsms'),
                    esc_html($version['installed']),
                    esc_html($version['latest'])
                );
                ?>
                <a href="<?php echo esc_url($updates); ?>"><?php esc_html_e('Update now', 'splitsms'); ?></a>
            </p>
        </div>
        <?php
    }
}
