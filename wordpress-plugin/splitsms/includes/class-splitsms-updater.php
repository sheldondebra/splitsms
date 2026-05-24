<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check www.splitsms.com for plugin updates (version.json / update API).
 */
class SplitSMS_Updater {
    /** @var self|null */
    private static $instance = null;

    private $plugin_file;
    private $plugin_slug = 'splitsms';

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->plugin_file = plugin_basename(SPLITSMS_PLUGIN_FILE);
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_update'));
        add_filter('plugins_api', array($this, 'plugin_info'), 20, 3);
    }

    /**
     * @param object $transient
     * @return object
     */
    public function check_update($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }

        $remote = $this->fetch_remote();
        if (!$remote || empty($remote['version'])) {
            return $transient;
        }

        if (version_compare(SPLITSMS_VERSION, $remote['version'], '<')) {
            $obj = new stdClass();
            $obj->slug = $this->plugin_slug;
            $obj->plugin = $this->plugin_file;
            $obj->new_version = $remote['version'];
            $obj->url = isset($remote['homepage']) ? $remote['homepage'] : SPLITSMS_INTEGRATIONS_URL;
            $obj->package = isset($remote['download_url']) ? $remote['download_url'] : SPLITSMS_PLUGIN_DOWNLOAD_URL;
            $transient->response[$this->plugin_file] = $obj;
        }

        return $transient;
    }

    /**
     * @param false|object|array $result
     * @param string             $action
     * @param object             $args
     * @return false|object
     */
    public function plugin_info($result, $action, $args) {
        if ('plugin_information' !== $action || empty($args->slug) || $this->plugin_slug !== $args->slug) {
            return $result;
        }

        $remote = $this->fetch_remote();
        if (!$remote) {
            return $result;
        }

        $info = new stdClass();
        $info->name = isset($remote['name']) ? $remote['name'] : 'SplitSMS';
        $info->slug = $this->plugin_slug;
        $info->version = $remote['version'];
        $info->author = '<a href="' . esc_url(SPLITSMS_APP_URL) . '">SplitSMS</a>';
        $info->homepage = isset($remote['homepage']) ? $remote['homepage'] : SPLITSMS_APP_URL;
        $info->requires = isset($remote['requires']) ? $remote['requires'] : '6.0';
        $info->tested = isset($remote['tested']) ? $remote['tested'] : '6.7';
        $info->requires_php = isset($remote['requires_php']) ? $remote['requires_php'] : '7.4';
        $info->download_link = isset($remote['download_url']) ? $remote['download_url'] : SPLITSMS_PLUGIN_DOWNLOAD_URL;
        $info->sections = array(
            'description' => __('Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.', 'splitsms'),
            'changelog' => !empty($remote['changelog'])
                ? wp_kses_post($remote['changelog'])
                : sprintf(
                    /* translators: %s: site URL */
                    __('Updates are distributed from %s. Go to Dashboard → Updates to install the latest version.', 'splitsms'),
                    SPLITSMS_APP_URL
                ),
        );

        return $info;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetch_remote() {
        $url = defined('SPLITSMS_UPDATE_CHECK_URL') ? SPLITSMS_UPDATE_CHECK_URL : SPLITSMS_APP_URL . '/api/plugin/update';

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
        return is_array($data) ? $data : null;
    }
}
