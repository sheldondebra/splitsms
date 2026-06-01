<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WordPress admin UI — dashboard, send, logs, settings.
 */
class SplitSMS_Admin {
    /** @var self|null */
    private static $instance = null;

    /** @var array<string,mixed>|null */
    private $account_cache = null;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_init', array($this, 'handle_actions'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_splitsms_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_splitsms_send_test', array($this, 'ajax_send_test'));
        add_action('wp_ajax_splitsms_list_sender_ids', array($this, 'ajax_list_sender_ids'));
        add_action('wp_ajax_splitsms_refresh_forms', array($this, 'ajax_refresh_forms'));
        add_action('admin_post_splitsms_send_sms', array($this, 'handle_send_sms'));
        add_action('admin_bar_menu', array($this, 'admin_bar_balance'), 100);
        add_filter('plugin_action_links_' . plugin_basename(SPLITSMS_PLUGIN_FILE), array($this, 'plugin_action_links'));
    }

    /**
     * Links on Plugins → Installed Plugins (WordPress.org installs).
     *
     * @param array<int, string> $links
     * @return array<int, string>
     */
    public function plugin_action_links($links) {
        $settings = '<a href="' . esc_url(admin_url('admin.php?page=splitsms-settings')) . '">' . esc_html__('Settings', 'splitsms') . '</a>';
        array_unshift($links, $settings);

        if (!SplitSMS_Settings::is_configured()) {
            $signup = '<a href="' . esc_url(SplitSMS_Settings::signup_url('plugins-list')) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Create account', 'splitsms') . '</a>';
            array_unshift($links, $signup);
        }

        return $links;
    }

    public function register_menu() {
        add_menu_page(
            __('SplitSMS', 'splitsms'),
            __('SplitSMS', 'splitsms'),
            'manage_options',
            'splitsms',
            array($this, 'render_dashboard'),
            'dashicons-email-alt',
            58
        );

        $pages = array(
            'splitsms' => array(__('Dashboard', 'splitsms'), 'render_dashboard'),
            'splitsms-send' => array(__('Send SMS', 'splitsms'), 'render_send'),
            'splitsms-forms' => array(__('Forms', 'splitsms'), 'render_forms'),
            'splitsms-automations' => array(__('Automations', 'splitsms'), 'render_automations'),
            'splitsms-integrations' => array(__('Integrations', 'splitsms'), 'render_integrations'),
            'splitsms-crocoblock' => array(__('Crocoblock', 'splitsms'), 'render_crocoblock'),
            'splitsms-logs' => array(__('Logs', 'splitsms'), 'render_logs'),
            'splitsms-settings' => array(__('Settings', 'splitsms'), 'render_settings'),
            'splitsms-help' => array(__('Help', 'splitsms'), 'render_help'),
        );

        foreach ($pages as $slug => $cfg) {
            if ('splitsms' === $slug) {
                continue;
            }
            add_submenu_page(
                'splitsms',
                $cfg[0],
                $cfg[0],
                'manage_options',
                $slug,
                array($this, $cfg[1])
            );
        }
    }

    public function enqueue_assets($hook) {
        if (false === strpos($hook, 'splitsms')) {
            return;
        }
        wp_enqueue_style(
            'splitsms-admin',
            plugins_url('assets/admin.css', SPLITSMS_PLUGIN_FILE),
            array(),
            SPLITSMS_VERSION
        );
        wp_enqueue_script(
            'splitsms-admin',
            plugins_url('assets/admin.js', SPLITSMS_PLUGIN_FILE),
            array(),
            SPLITSMS_VERSION,
            true
        );
        wp_localize_script(
            'splitsms-admin',
            'SplitSMSAdmin',
            array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonceTest' => wp_create_nonce('splitsms_test'),
                'nonceSend' => wp_create_nonce('splitsms_send_test'),
                'nonceSenderIds' => wp_create_nonce('splitsms_sender_ids'),
                'nonceForms' => wp_create_nonce('splitsms_forms'),
                'nonceUpdate' => wp_create_nonce('splitsms_update_plugin'),
                'updateAvailable' => class_exists('SplitSMS_Plugin_Status')
                    && !empty(SplitSMS_Plugin_Status::version_info(false)['is_outdated']),
                'walletUrl' => defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '',
                'senderIdsUrl' => defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/sender-ids' : '',
                'strings' => array(
                    'testing' => __('Testing connection…', 'splitsms'),
                    'sending' => __('Sending test SMS…', 'splitsms'),
                    'connected' => __('Connected', 'splitsms'),
                    'loadingSenders' => __('Loading sender IDs…', 'splitsms'),
                    'noSenders' => __('No sender IDs found. Register one on SplitSMS.', 'splitsms'),
                    'searchSenders' => __('Search sender IDs…', 'splitsms'),
                    'refreshingForms' => __('Scanning forms…', 'splitsms'),
                    'formsRefreshed' => __('Form list updated.', 'splitsms'),
                    'updating' => __('Updating plugin…', 'splitsms'),
                    'updateDone' => __('Plugin updated. Reloading…', 'splitsms'),
                ),
            )
        );
    }

    public function handle_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $page_raw = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';

        if (isset($_POST['splitsms_save']) && '' !== $page_raw && in_array($page_raw, array('splitsms-settings', 'splitsms-integrations', 'splitsms-crocoblock'), true)) {
            check_admin_referer('splitsms_settings');
            $input = isset($_POST['splitsms']) && is_array($_POST['splitsms'])
                ? wp_unslash($_POST['splitsms'])
                : array();
            $page = $page_raw;
            $scope = 'settings';
            if ('splitsms-integrations' === $page) {
                $scope = 'integrations';
            } elseif ('splitsms-crocoblock' === $page) {
                $scope = 'crocoblock';
            }
            SplitSMS_Settings::instance()->update($input, $scope);
            wp_safe_redirect(add_query_arg(array('page' => $page, 'updated' => '1'), admin_url('admin.php')));
            exit;
        }

        if (isset($_POST['splitsms_save_forms']) && 'splitsms-forms' === $page_raw) {
            check_admin_referer('splitsms_forms');
            $input = isset($_POST['splitsms_form_rules']) && is_array($_POST['splitsms_form_rules'])
                ? wp_unslash($_POST['splitsms_form_rules'])
                : array();
            SplitSMS_Forms_Manager::save_rules($input);
            SplitSMS_Forms_Registry::clear_cache();
            wp_safe_redirect(add_query_arg(array('page' => 'splitsms-forms', 'updated' => '1'), admin_url('admin.php')));
            exit;
        }

        if (isset($_GET['splitsms_remove_key']) && 'splitsms-settings' === $page_raw) {
            check_admin_referer('splitsms_remove_key');
            SplitSMS_Settings::instance()->clear_api_key();
            wp_safe_redirect(add_query_arg(array('page' => 'splitsms-settings', 'removed' => '1'), admin_url('admin.php')));
            exit;
        }
    }

    public function ajax_test_connection() {
        check_ajax_referer('splitsms_test', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Forbidden'), 403);
        }

        $settings = SplitSMS_Settings::instance();
        $overrides = array('enabled' => '1');
        if (!empty($_POST['api_key'])) {
            $candidate = sanitize_text_field(wp_unslash($_POST['api_key']));
            if (SplitSMS_Settings::validate_api_key_format($candidate)) {
                $overrides['api_key'] = $candidate;
            } elseif (SplitSMS_Settings::looks_like_key_prefix_only($candidate)) {
                wp_send_json_error(array(
                    'message' => __('That is only the key prefix. Paste the full ~56-character secret from SplitSMS (shown once when you create or rotate a key).', 'splitsms'),
                ));
            }
        } elseif ('' !== trim($settings->get('api_key')) && SplitSMS_Settings::validate_api_key_format($settings->get('api_key'))) {
            $overrides['api_key'] = $settings->get('api_key');
        }
        if (!empty($_POST['api_base_url'])) {
            $url = esc_url_raw(rtrim(sanitize_text_field(wp_unslash($_POST['api_base_url'])), '/'));
            if (SplitSMS_Settings::is_allowed_api_url($url)) {
                $overrides['api_base_url'] = $url;
            }
        }

        $result = $settings->with_overrides($overrides, function () {
            return (new SplitSMS_API())->test_connection();
        });

        if (!empty($result['ok']) && isset($result['account'])) {
            $a = $result['account'];
            wp_send_json_success(array(
                'message' => sprintf(
                    /* translators: 1: SMS credits 2: wallet amount 3: currency */
                    __('Connected. %1$s SMS · Wallet %2$s %3$s', 'splitsms'),
                    number_format_i18n(isset($a['sms_credits']) ? (int) $a['sms_credits'] : 0),
                    number_format_i18n(isset($a['wallet_balance']) ? (float) $a['wallet_balance'] : 0, 2),
                    isset($a['wallet_currency']) ? $a['wallet_currency'] : 'GHS'
                ),
                'account' => $a,
            ));
        }

        wp_send_json_error(array('message' => isset($result['error']) ? $result['error'] : __('Connection failed', 'splitsms')));
    }

    public function ajax_send_test() {
        check_ajax_referer('splitsms_send_test', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Forbidden'), 403);
        }

        $phone = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
        if ('' === $phone) {
            $phone = SplitSMS_Settings::instance()->get('admin_phone');
        }
        if ('' === trim($phone)) {
            wp_send_json_error(array('message' => __('Add an admin phone number in Settings first.', 'splitsms')));
        }

        $api = new SplitSMS_API();
        $site = get_bloginfo('name');
        $result = $api->send_sms(
            $phone,
            sprintf(__('%s: SplitSMS test message — your WordPress site is connected.', 'splitsms'), $site),
            array('event' => 'test_sms', 'source' => 'admin')
        );

        if (!empty($result['ok'])) {
            wp_send_json_success(array('message' => __('Test SMS sent.', 'splitsms')));
        }
        wp_send_json_error(array('message' => isset($result['error']) ? $result['error'] : __('Send failed', 'splitsms')));
    }

    public function ajax_list_sender_ids() {
        check_ajax_referer('splitsms_sender_ids', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Forbidden'), 403);
        }

        $settings = SplitSMS_Settings::instance();
        $overrides = array('enabled' => '1');
        if (!empty($_POST['api_key'])) {
            $candidate = sanitize_text_field(wp_unslash($_POST['api_key']));
            if (SplitSMS_Settings::validate_api_key_format($candidate)) {
                $overrides['api_key'] = $candidate;
            }
        } elseif ('' !== trim($settings->get('api_key')) && SplitSMS_Settings::validate_api_key_format($settings->get('api_key'))) {
            $overrides['api_key'] = $settings->get('api_key');
        }
        if (!empty($_POST['api_base_url'])) {
            $url = esc_url_raw(rtrim(sanitize_text_field(wp_unslash($_POST['api_base_url'])), '/'));
            if (SplitSMS_Settings::is_allowed_api_url($url)) {
                $overrides['api_base_url'] = $url;
            }
        }

        $result = $settings->with_overrides($overrides, function () {
            return (new SplitSMS_API())->list_sender_ids();
        });

        if (!empty($result['ok'])) {
            wp_send_json_success(array('items' => $result['items']));
        }

        wp_send_json_error(array(
            'message' => isset($result['error']) ? $result['error'] : __('Could not load sender IDs', 'splitsms'),
        ));
    }

    public function handle_send_sms() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Forbidden', 'splitsms'));
        }
        check_admin_referer('splitsms_send_sms');

        $phone = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
        $message = isset($_POST['message']) ? sanitize_textarea_field(wp_unslash($_POST['message'])) : '';
        $redirect = admin_url('admin.php?page=splitsms-send');

        if ('' === trim($phone) || '' === trim($message)) {
            wp_safe_redirect(add_query_arg('error', 'missing', $redirect));
            exit;
        }

        $api = new SplitSMS_API();
        $result = $api->send_sms(
            $phone,
            $message,
            array(
                'event' => 'admin_send',
                'source' => 'wordpress_admin',
            )
        );

        if (!empty($result['ok'])) {
            wp_safe_redirect(add_query_arg('sent', '1', $redirect));
            exit;
        }

        $err = isset($result['error']) ? $result['error'] : __('Send failed', 'splitsms');
        wp_safe_redirect(add_query_arg(array('error' => 'send', 'msg' => rawurlencode($err)), $redirect));
        exit;
    }

    /**
     * @param WP_Admin_Bar $bar
     */
    public function admin_bar_balance($bar) {
        if (!current_user_can('manage_options') || !SplitSMS_Settings::is_configured()) {
            return;
        }
        $acct = $this->get_account();
        if (!$acct) {
            return;
        }
        $credits = isset($acct['sms_credits']) ? number_format_i18n((int) $acct['sms_credits']) : '—';
        $bar->add_node(array(
            'id' => 'splitsms-balance',
            'title' => 'SplitSMS: ' . $credits . ' SMS',
            'href' => admin_url('admin.php?page=splitsms'),
        ));
    }

    public function render_dashboard() {
        $this->render_shell(__('Dashboard', 'splitsms'), function () {
            $configured = SplitSMS_Settings::is_configured();
            $account = $configured ? $this->get_account() : null;
            $registry = SplitSMS_Integrations_Registry::all();
            $active_count = count(array_filter($registry, function ($item) {
                return !empty($item['active']);
            }));
            SplitSMS_Logger::instance()->sync_pending_log_statuses(20);
            $recent = SplitSMS_Logger::instance()->get_logs(5);
            ?>
            <?php if ($account) : ?>
                <div class="splitsms-stats">
                    <div class="splitsms-stat">
                        <p class="splitsms-stat__label"><?php esc_html_e('SMS balance', 'splitsms'); ?></p>
                        <p class="splitsms-stat__value"><?php echo esc_html(number_format_i18n((int) ($account['sms_credits'] ?? 0))); ?></p>
                    </div>
                    <div class="splitsms-stat">
                        <p class="splitsms-stat__label"><?php esc_html_e('Wallet', 'splitsms'); ?></p>
                        <p class="splitsms-stat__value"><?php echo esc_html(($account['wallet_currency'] ?? 'GHS') . ' ' . number_format_i18n((float) ($account['wallet_balance'] ?? 0), 2)); ?></p>
                    </div>
                    <div class="splitsms-stat">
                        <p class="splitsms-stat__label"><?php esc_html_e('Plugins detected', 'splitsms'); ?></p>
                        <p class="splitsms-stat__value"><?php echo esc_html((string) $active_count); ?></p>
                    </div>
                    <div class="splitsms-stat">
                        <p class="splitsms-stat__label"><?php esc_html_e('Plugin version', 'splitsms'); ?></p>
                        <p class="splitsms-stat__value"><?php echo esc_html(SPLITSMS_VERSION); ?></p>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!$configured) : ?>
                <?php
                $context = 'dashboard';
                include SPLITSMS_PLUGIN_DIR . 'admin/views/signup-callout.php';
                ?>
            <?php endif; ?>

            <div class="splitsms-grid">
                <div class="splitsms-card splitsms-card--accent">
                    <h2><?php esc_html_e('Quick start', 'splitsms'); ?></h2>
                    <ol class="splitsms-steps">
                        <?php if (!$configured) : ?>
                            <li><?php esc_html_e('Create a free SplitSMS account (starter SMS credits included).', 'splitsms'); ?></li>
                            <li><?php esc_html_e('Paste your API key in Settings.', 'splitsms'); ?></li>
                        <?php else : ?>
                            <li><?php esc_html_e('Connect your API key in Settings.', 'splitsms'); ?></li>
                        <?php endif; ?>
                        <li><?php esc_html_e('Send a test SMS from the bar above.', 'splitsms'); ?></li>
                        <li><?php esc_html_e('Enable SMS per form under Forms — no custom code needed.', 'splitsms'); ?></li>
                    </ol>
                    <div class="splitsms-quick-actions">
                        <?php if (!$configured) : ?>
                            <a class="button button-primary" href="<?php echo esc_url(SplitSMS_Settings::signup_url('dashboard')); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Create account', 'splitsms'); ?></a>
                            <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>"><?php esc_html_e('Connect API key', 'splitsms'); ?></a>
                        <?php endif; ?>
                        <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-forms')); ?>"><?php esc_html_e('Forms', 'splitsms'); ?></a>
                        <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>"><?php esc_html_e('Integrations', 'splitsms'); ?></a>
                        <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-logs')); ?>"><?php esc_html_e('View logs', 'splitsms'); ?></a>
                    </div>
                </div>
                <div class="splitsms-card">
                    <h2><?php esc_html_e('On this site', 'splitsms'); ?></h2>
                    <ul class="splitsms-list">
                        <?php foreach (array_slice($registry, 0, 6) as $item) : ?>
                            <li><?php echo !empty($item['active']) ? '✓' : '○'; ?> <?php echo esc_html($item['label']); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p><a href="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>"><?php esc_html_e('All integrations →', 'splitsms'); ?></a></p>
                </div>
            </div>

            <?php if (!empty($recent)) : ?>
            <div class="splitsms-card splitsms-logs-table-wrap" style="margin-top:1rem;">
                <h2><?php esc_html_e('Recent activity', 'splitsms'); ?></h2>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Date', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Event', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Status', 'splitsms'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent as $log) : ?>
                            <tr>
                                <td><?php echo esc_html($log->created_at); ?></td>
                                <td><?php echo esc_html($log->event); ?></td>
                                <td><span class="splitsms-badge splitsms-badge--<?php echo esc_attr($log->status); ?>"><?php echo esc_html(SplitSMS_Logger::log_status_label($log->status)); ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
            <?php
        });
    }

    public function render_send() {
        $this->render_shell(__('Send SMS', 'splitsms'), function () {
            if (isset($_GET['sent'])) {
                echo '<div class="notice notice-success"><p>' . esc_html__('SMS sent.', 'splitsms') . '</p></div>';
            }
            if (isset($_GET['error'])) {
                $msg = isset($_GET['msg']) ? sanitize_text_field(wp_unslash($_GET['msg'])) : '';
                $error_code = sanitize_key(wp_unslash($_GET['error']));
                if ('missing' === $error_code) {
                    $msg = __('Phone and message are required.', 'splitsms');
                } elseif ('send' === $error_code && '' === $msg) {
                    $msg = __('Send failed.', 'splitsms');
                }
                if ('' !== $msg) {
                    echo '<div class="notice notice-error"><p>' . esc_html($msg) . '</p></div>';
                }
            }
            ?>
            <div class="splitsms-card">
                <p class="description"><?php esc_html_e('Send a one-off SMS from WordPress. Uses your default sender ID and country code from Settings.', 'splitsms'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="splitsms-inline-form">
                    <input type="hidden" name="action" value="splitsms_send_sms" />
                    <?php wp_nonce_field('splitsms_send_sms'); ?>
                    <p>
                        <label><?php esc_html_e('Phone', 'splitsms'); ?>
                            <input type="text" name="phone" class="regular-text" placeholder="233..." required />
                        </label>
                    </p>
                    <p>
                        <label><?php esc_html_e('Message', 'splitsms'); ?><br />
                            <textarea name="message" class="large-text" rows="4" maxlength="640" required></textarea>
                        </label>
                    </p>
                    <p class="description"><?php esc_html_e('Use the header “Send Test SMS” for a quick connection check, or configure bulk campaigns in your SplitSMS dashboard.', 'splitsms'); ?></p>
                    <?php submit_button(__('Send SMS', 'splitsms')); ?>
                </form>
            </div>
            <?php
        });
    }

    public function render_automations() {
        $this->render_shell(__('Automations', 'splitsms'), function () {
            ?>
            <div class="splitsms-card">
                <p><?php esc_html_e('Automations run when WordPress or WooCommerce events fire. Configure triggers under Integrations and edit message templates there.', 'splitsms'); ?></p>
                <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>"><?php esc_html_e('Open integrations', 'splitsms'); ?></a></p>
            </div>
            <?php
        });
    }

    public function render_integrations() {
        $s = SplitSMS_Settings::instance()->all();
        $registry = SplitSMS_Integrations_Registry::all();
        $updated = isset($_GET['updated']);
        $this->render_shell(__('Integrations', 'splitsms'), function () use ($s, $registry, $updated) {
            include SPLITSMS_PLUGIN_DIR . 'admin/views/integrations-page.php';
        });
    }

    public function render_forms() {
        $forms = SplitSMS_Forms_Manager::forms_for_admin();
        $configured = SplitSMS_Settings::is_configured();
        $updated = isset($_GET['updated']);
        $filter = isset($_GET['filter']) ? sanitize_key(wp_unslash($_GET['filter'])) : 'all';
        if (!in_array($filter, array('all', 'elementor', 'crocoblock', 'forms'), true)) {
            $filter = 'all';
        }
        $this->render_shell(__('Forms', 'splitsms'), function () use ($forms, $configured, $updated, $filter) {
            include SPLITSMS_PLUGIN_DIR . 'admin/views/forms-page.php';
        });
    }

    public function ajax_refresh_forms() {
        check_ajax_referer('splitsms_forms', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Forbidden'), 403);
        }

        SplitSMS_Forms_Registry::clear_cache();
        $forms = SplitSMS_Forms_Manager::forms_for_admin();

        wp_send_json_success(
            array(
                'message' => __('Form list updated.', 'splitsms'),
                'count' => count($forms),
                'redirect' => admin_url('admin.php?page=splitsms-forms&refreshed=1'),
            )
        );
    }

    public function render_logs() {
        SplitSMS_Logger::instance()->sync_pending_log_statuses(100);
        $logs = SplitSMS_Logger::instance()->get_logs(100);
        $this->render_shell(__('Logs', 'splitsms'), function () use ($logs) {
            ?>
            <div class="splitsms-card splitsms-logs-table-wrap">
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Date', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Event', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Recipient', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Status', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Details', 'splitsms'); ?></th>
                            <th><?php esc_html_e('Source', 'splitsms'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($logs)) : ?>
                            <tr><td colspan="6"><?php esc_html_e('No logs yet.', 'splitsms'); ?></td></tr>
                        <?php else : ?>
                            <?php foreach ($logs as $log) : ?>
                                <tr>
                                    <td><?php echo esc_html($log->created_at); ?></td>
                                    <td><?php echo esc_html($log->event); ?></td>
                                    <td><?php echo esc_html($log->recipient ?: '—'); ?></td>
                                    <td><span class="splitsms-badge splitsms-badge--<?php echo esc_attr($log->status); ?>"><?php echo esc_html(SplitSMS_Logger::log_status_label($log->status)); ?></span></td>
                                    <td class="splitsms-log-detail"><?php echo esc_html($log->body ?: '—'); ?></td>
                                    <td><?php echo esc_html($log->source); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            <?php
        });
    }

    public function render_settings() {
        $s = SplitSMS_Settings::instance();
        $opts = $s->all();
        $updated = isset($_GET['updated']);
        $removed = isset($_GET['removed']);
        $show_api_url = apply_filters(
            'splitsms_show_api_base_url_field',
            SplitSMS_Settings::is_local_wp_site() || (defined('WP_DEBUG') && WP_DEBUG)
        );
        $has_saved_key = '' !== $opts['api_key'];
        $saved_key_valid = $has_saved_key && SplitSMS_Settings::validate_api_key_format($opts['api_key']);
        $api_connected = $saved_key_valid && SplitSMS_Settings::is_configured();
        $sender_ids = array();
        $sender_ids_error = '';
        if ($api_connected) {
            $sender_result = (new SplitSMS_API())->list_sender_ids();
            if (!empty($sender_result['ok'])) {
                $sender_ids = $sender_result['items'];
            } else {
                $sender_ids_error = isset($sender_result['error']) ? $sender_result['error'] : '';
            }
        }
        $selected_sender = isset($opts['sender_id']) ? (string) $opts['sender_id'] : '';
        $settings_error = get_transient('splitsms_settings_error');
        if ($settings_error) {
            delete_transient('splitsms_settings_error');
        }
        $this->render_shell(__('Settings', 'splitsms'), function () use ($s, $opts, $updated, $removed, $show_api_url, $has_saved_key, $saved_key_valid, $api_connected, $sender_ids, $sender_ids_error, $selected_sender, $settings_error) {
            ?>
            <?php if ($settings_error) : ?>
                <div class="notice notice-error"><p><?php echo esc_html($settings_error); ?></p></div>
            <?php endif; ?>
            <?php if ($updated) : ?><div class="splitsms-notice-inline"><?php esc_html_e('Settings saved. Your integrations and templates were not changed.', 'splitsms'); ?></div><?php endif; ?>
            <?php if ($removed) : ?><div class="splitsms-notice-inline"><?php esc_html_e('API key removed.', 'splitsms'); ?></div><?php endif; ?>
            <?php if ($has_saved_key && !$saved_key_valid) : ?>
                <div class="notice notice-warning">
                    <p>
                        <?php esc_html_e('The saved value looks like a key prefix only, not the full secret. The plugin cannot call SplitSMS until you paste the complete key (~56 characters) from when the key was created, or rotate the key in SplitSMS and paste the new secret.', 'splitsms'); ?>
                    </p>
                </div>
            <?php endif; ?>

            <?php if (!$api_connected) : ?>
                <?php
                $context = 'settings';
                include SPLITSMS_PLUGIN_DIR . 'admin/views/signup-callout.php';
                ?>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>" class="splitsms-card splitsms-settings-card">
                <?php wp_nonce_field('splitsms_settings'); ?>
                <input type="hidden" name="splitsms_save" value="1" />
                <input type="hidden" name="splitsms[enabled]" value="1" />

                <p class="splitsms-section-title"><?php esc_html_e('Connection', 'splitsms'); ?></p>
                <table class="form-table">
                    <tr>
                        <th><?php esc_html_e('API base URL', 'splitsms'); ?></th>
                        <td>
                            <input
                                type="url"
                                class="regular-text"
                                name="splitsms[api_base_url]"
                                id="splitsms-api-base-url"
                                value="<?php echo esc_attr($opts['api_base_url']); ?>"
                                <?php echo $show_api_url ? '' : 'readonly'; ?>
                            />
                            <p class="description">
                                <?php if (SplitSMS_Settings::is_local_wp_site()) : ?>
                                    <?php esc_html_e('Local dev: use http://127.0.0.1:3000 while npm run dev is running. Production: https://www.splitsms.com', 'splitsms'); ?>
                                <?php else : ?>
                                    <?php esc_html_e('Usually https://www.splitsms.com — change only if instructed by support.', 'splitsms'); ?>
                                <?php endif; ?>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('API key', 'splitsms'); ?></th>
                        <td>
                            <?php if ($api_connected) : ?>
                                <div class="splitsms-api-connected" id="splitsms-api-connected">
                                    <span class="splitsms-status-light splitsms-status-light--ok" aria-hidden="true"></span>
                                    <strong><?php esc_html_e('Connected', 'splitsms'); ?></strong>
                                    <span class="splitsms-api-mask"><?php echo esc_html($s->masked_api_key()); ?></span>
                                    <button type="button" class="button button-link" id="splitsms-replace-key">
                                        <?php esc_html_e('Replace key', 'splitsms'); ?>
                                    </button>
                                </div>
                            <?php endif; ?>
                            <div class="splitsms-api-key-row<?php echo $api_connected ? ' splitsms-api-key-row--replace' : ''; ?>" id="splitsms-api-key-row" <?php echo $api_connected ? 'hidden' : ''; ?>>
                                <input
                                    type="password"
                                    class="regular-text splitsms-api-key-input"
                                    id="splitsms-api-key-input"
                                    name="splitsms[api_key]"
                                    value=""
                                    autocomplete="off"
                                    placeholder="<?php echo esc_attr($has_saved_key ? __('Paste new key to replace', 'splitsms') : __('Paste API key (sk_…)', 'splitsms')); ?>"
                                    data-has-saved="<?php echo $has_saved_key ? '1' : '0'; ?>"
                                    data-saved-key="<?php echo $has_saved_key ? esc_attr($opts['api_key']) : ''; ?>"
                                />
                                <?php if (!$api_connected) : ?>
                                    <button type="button" class="button splitsms-api-key-toggle" id="splitsms-api-key-toggle" aria-pressed="false">
                                        <?php esc_html_e('Show', 'splitsms'); ?>
                                    </button>
                                <?php endif; ?>
                            </div>
                            <?php if ($api_connected) : ?>
                                <p class="description">
                                    <?php esc_html_e('Your API key is saved securely. Click Replace key to paste a new one.', 'splitsms'); ?>
                                    <?php esc_html_e('Scopes: sms.send, wallet.read, sender_ids.read.', 'splitsms'); ?>
                                </p>
                            <?php elseif ($has_saved_key && $saved_key_valid) : ?>
                                <p class="description"><?php esc_html_e('Full key is saved. Click Show to reveal the complete secret, or paste a new key to replace.', 'splitsms'); ?></p>
                            <?php elseif ($has_saved_key) : ?>
                                <p class="description" style="color:#b45309;">
                                    <?php esc_html_e('Saved value is incomplete — paste the full key from SplitSMS (not the short prefix from the keys list).', 'splitsms'); ?>
                                </p>
                            <?php else : ?>
                                <p class="description">
                                    <?php esc_html_e('Paste the full secret shown once when you create a key (~56 characters). Do not copy the short prefix from the keys table.', 'splitsms'); ?>
                                    <?php esc_html_e('Required scopes: sms.send, wallet.read, and sender_ids.read.', 'splitsms'); ?>
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                </table>

                <p class="splitsms-section-title"><?php esc_html_e('SMS defaults', 'splitsms'); ?></p>
                <table class="form-table">
                    <tr>
                        <th><?php esc_html_e('Sender ID', 'splitsms'); ?></th>
                        <td>
                            <?php
                            include SPLITSMS_PLUGIN_DIR . 'admin/views/sender-id-picker.php';
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Country code', 'splitsms'); ?></th>
                        <td>
                            <input type="text" class="small-text" name="splitsms[country_code]" value="<?php echo esc_attr($opts['country_code']); ?>" maxlength="2" />
                            <p class="description"><?php esc_html_e('ISO code for normalizing numbers (e.g. GH, NG).', 'splitsms'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Admin phone', 'splitsms'); ?></th>
                        <td><input type="text" class="regular-text" name="splitsms[admin_phone]" value="<?php echo esc_attr($opts['admin_phone']); ?>" placeholder="233..." /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Low balance alert', 'splitsms'); ?></th>
                        <td>
                            <input type="text" class="regular-text" name="splitsms[low_balance_alert_phone]" value="<?php echo esc_attr($opts['low_balance_alert_phone']); ?>" />
                            <p class="description"><?php esc_html_e('Optional. Receives one low-balance SMS per day when your SplitSMS account is running low.', 'splitsms'); ?></p>
                        </td>
                    </tr>
                </table>

                <p class="splitsms-section-title"><?php esc_html_e('Advanced', 'splitsms'); ?></p>
                <table class="form-table">
                    <tr>
                        <th><?php esc_html_e('Debug logs', 'splitsms'); ?></th>
                        <td><label><input type="checkbox" name="splitsms[debug_logs]" value="1" <?php checked(SplitSMS_Settings::is_yes($opts['debug_logs'])); ?> /> <?php esc_html_e('Verbose logging to plugin log table', 'splitsms'); ?></label></td>
                    </tr>
                </table>

                <p>
                    <button type="button" class="button" id="splitsms-test-btn"><?php esc_html_e('Test connection', 'splitsms'); ?></button>
                    <span id="splitsms-test-result"></span>
                </p>
                <?php submit_button(__('Save settings', 'splitsms')); ?>
                <?php if ('' !== $opts['api_key']) : ?>
                    <p><a class="button button-link-delete" href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=splitsms-settings&splitsms_remove_key=1'), 'splitsms_remove_key')); ?>"><?php esc_html_e('Remove API key', 'splitsms'); ?></a></p>
                <?php endif; ?>

                <?php if (current_user_can('update_plugins')) : ?>
                    <?php
                    $version_info = SplitSMS_Plugin_Status::version_info(false);
                    $has_update = !empty($version_info['is_outdated']) && !empty($version_info['latest']);
                    ?>
                    <p class="splitsms-section-title" style="margin-top:1.5rem;"><?php esc_html_e('Plugin update', 'splitsms'); ?></p>
                    <?php if ($has_update) : ?>
                        <p class="description">
                            <?php
                            printf(
                                esc_html__('v%1$s is installed — v%2$s is available on splitsms.com.', 'splitsms'),
                                esc_html($version_info['installed']),
                                esc_html($version_info['latest'])
                            );
                            ?>
                        </p>
                        <p>
                            <button type="button" class="button button-primary" id="splitsms-update-plugin-btn-settings">
                                <?php esc_html_e('Update plugin', 'splitsms'); ?>
                            </button>
                            <span id="splitsms-update-plugin-result-settings" class="splitsms-inline-result" aria-live="polite"></span>
                        </p>
                    <?php else : ?>
                        <p class="description"><?php esc_html_e('SplitSMS is up to date. You can still reinstall the latest files from splitsms.com if upload failed.', 'splitsms'); ?></p>
                    <?php endif; ?>
                    <p>
                        <a class="button" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=splitsms_reinstall'), 'splitsms_reinstall')); ?>">
                            <?php esc_html_e('Replace from splitsms.com', 'splitsms'); ?>
                        </a>
                    </p>
                    <p class="description">
                        <?php esc_html_e('Downloads the latest zip and replaces wp-content/plugins/splitsms/ — use when re-uploading fails with “folder already exists”. Your API key and settings stay saved.', 'splitsms'); ?>
                    </p>
                <?php endif; ?>
            </form>
            <?php
        });
    }

    public function render_crocoblock() {
        $s = SplitSMS_Settings::instance()->all();
        $updated = isset($_GET['updated']);
        $this->render_shell(__('Crocoblock / JetEngine', 'splitsms'), function () use ($s, $updated) {
            if ($updated) {
                echo '<div class="notice notice-success"><p>' . esc_html__('Settings saved.', 'splitsms') . '</p></div>';
            }
            include SPLITSMS_PLUGIN_DIR . 'admin/views/crocoblock-page.php';
        });
    }

    public function render_help() {
        $docs = defined('SPLITSMS_INTEGRATIONS_URL') ? SPLITSMS_INTEGRATIONS_URL : '';
        $update_url = admin_url('update-core.php');
        $download = defined('SPLITSMS_PLUGIN_DOWNLOAD_LATEST_URL')
            ? SPLITSMS_PLUGIN_DOWNLOAD_LATEST_URL
            : (defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/wordpress-plugin/splitsms.zip' : '');
        $check_url = defined('SPLITSMS_UPDATE_CHECK_URL') ? SPLITSMS_UPDATE_CHECK_URL : '';
        $version = SplitSMS_Plugin_Status::version_info(false);
        $env = SplitSMS_Plugin_Status::environment();
        $forms_url = admin_url('admin.php?page=splitsms-forms');
        $this->render_shell(__('Help', 'splitsms'), function () use ($docs, $update_url, $download, $check_url, $version, $env, $forms_url) {
            ?>
            <div class="splitsms-card">
                <h2><?php esc_html_e('Quick start (no custom code)', 'splitsms'); ?></h2>
                <ol class="splitsms-steps">
                    <?php if (!SplitSMS_Settings::is_configured()) : ?>
                        <li>
                            <a href="<?php echo esc_url(SplitSMS_Settings::signup_url('help')); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Create a free SplitSMS account', 'splitsms'); ?></a>
                            <?php esc_html_e('— starter SMS credits included.', 'splitsms'); ?>
                        </li>
                    <?php endif; ?>
                    <li><?php esc_html_e('SplitSMS → Settings — paste your API key and save.', 'splitsms'); ?></li>
                    <li>
                        <a href="<?php echo esc_url($forms_url); ?>"><?php esc_html_e('SplitSMS → Forms', 'splitsms'); ?></a>
                        <?php esc_html_e('— turn SMS on for each form, pick the phone field, edit the message.', 'splitsms'); ?>
                    </li>
                    <li><?php esc_html_e('SplitSMS → Integrations — enable WooCommerce, WordPress core, or Crocoblock events with toggles and templates.', 'splitsms'); ?></li>
                    <li><?php esc_html_e('SplitSMS → Dashboard — send a test SMS and confirm delivery in Logs.', 'splitsms'); ?></li>
                </ol>
                <p class="description"><?php esc_html_e('You never need to write PHP or add hooks — everything is configured in the plugin UI.', 'splitsms'); ?></p>
            </div>
            <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/help-documentation.php'; ?>
            <div class="splitsms-card">
                <h2><?php esc_html_e('Update plugin', 'splitsms'); ?></h2>
                <?php if (!empty($version['is_outdated']) && !empty($version['latest'])) : ?>
                    <p class="splitsms-help-update-warn">
                        <strong><?php esc_html_e('Update available:', 'splitsms'); ?></strong>
                        <?php
                        printf(
                            esc_html__('This site runs v%1$s — v%2$s is available.', 'splitsms'),
                            esc_html($version['installed']),
                            esc_html($version['latest'])
                        );
                        ?>
                    </p>
                    <?php if (current_user_can('update_plugins')) : ?>
                        <p>
                            <button type="button" class="button button-primary" id="splitsms-update-plugin-btn-help">
                                <?php esc_html_e('Update plugin', 'splitsms'); ?>
                            </button>
                            <span id="splitsms-update-plugin-result-help" class="splitsms-inline-result" aria-live="polite"></span>
                        </p>
                    <?php endif; ?>
                <?php else : ?>
                    <p><?php esc_html_e('SplitSMS is up to date. Use Update on the dashboard banner when a new version is released.', 'splitsms'); ?></p>
                <?php endif; ?>
                <ol class="splitsms-steps">
                    <li>
                        <a href="<?php echo esc_url($update_url); ?>"><?php esc_html_e('Dashboard → Updates', 'splitsms'); ?></a>
                        <?php esc_html_e('— click Update now when SplitSMS appears.', 'splitsms'); ?>
                    </li>
                    <li><?php esc_html_e('Or: Plugins → Installed Plugins → Check for updates (top of page).', 'splitsms'); ?></li>
                    <li>
                        <?php esc_html_e('Manual install:', 'splitsms'); ?>
                        <a href="<?php echo esc_url($download); ?>" target="_blank" rel="noopener"><?php esc_html_e('Download splitsms.zip', 'splitsms'); ?></a>
                        <?php esc_html_e('→ Plugins → Add New → Upload (only if standard update fails).', 'splitsms'); ?>
                    </li>
                </ol>
                <p class="description">
                    <?php esc_html_e('Installed version:', 'splitsms'); ?>
                    <strong><?php echo esc_html($version['installed']); ?></strong>
                    <?php if (!empty($version['latest'])) : ?>
                        · <?php esc_html_e('Latest on splitsms.com:', 'splitsms'); ?>
                        <strong>v<?php echo esc_html($version['latest']); ?></strong>
                    <?php endif; ?>
                    · <?php esc_html_e('WordPress', 'splitsms'); ?> <?php echo esc_html($env['wp_version']); ?>
                    · <?php esc_html_e('PHP', 'splitsms'); ?> <?php echo esc_html($env['php_version']); ?>
                    <?php if ('' !== $check_url) : ?>
                        · <?php esc_html_e('Update check:', 'splitsms'); ?>
                        <code><?php echo esc_html($check_url); ?></code>
                    <?php endif; ?>
                </p>
            </div>
            <div class="splitsms-card">
                <h2><?php esc_html_e('Documentation', 'splitsms'); ?></h2>
                <ul>
                    <li><a href="<?php echo esc_url($docs); ?>" target="_blank" rel="noopener"><?php esc_html_e('Setup guide on splitsms.com', 'splitsms'); ?></a></li>
                    <li><a href="<?php echo esc_url(defined('SPLITSMS_API_DOCS_URL') ? SPLITSMS_API_DOCS_URL : ''); ?>" target="_blank" rel="noopener"><?php esc_html_e('API documentation', 'splitsms'); ?></a></li>
                    <li><a href="https://crocoblock.com/knowledge-base/" target="_blank" rel="noopener"><?php esc_html_e('Crocoblock knowledge base (JetEngine, JetFormBuilder)', 'splitsms'); ?></a></li>
                </ul>
            </div>
            <?php
        });
    }

    /**
     * @param string   $title
     * @param callable $body
     */
    private function render_shell($title, $body) {
        if (!current_user_can('manage_options')) {
            return;
        }
        $configured = SplitSMS_Settings::is_configured();
        $account = $configured ? $this->get_account() : null;
        $status = SplitSMS_Plugin_Status::summary($configured);
        ?>
        <div class="wrap splitsms-admin">
            <div class="splitsms-layout">
                <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/sidebar-nav.php'; ?>
                <div class="splitsms-main">
                    <?php
                    include SPLITSMS_PLUGIN_DIR . 'admin/views/system-status-banner.php';
                    ?>
                    <h1 class="splitsms-page-title"><?php echo esc_html($title); ?></h1>
                    <?php call_user_func($body); ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * @return array<string,mixed>|null
     */
    private function get_account() {
        if (null !== $this->account_cache) {
            return $this->account_cache;
        }
        $api = new SplitSMS_API();
        $result = $api->get_account_status();
        $this->account_cache = !empty($result['account']) ? $result['account'] : null;
        if ($this->account_cache) {
            $this->maybe_send_low_balance_alert($this->account_cache);
        }
        return $this->account_cache;
    }

    /**
     * @param array<string,mixed> $account
     */
    private function maybe_send_low_balance_alert($account) {
        if (empty($account['low_balance'])) {
            return;
        }

        $phone = trim(SplitSMS_Settings::instance()->get('low_balance_alert_phone'));
        if ('' === $phone) {
            return;
        }

        if (get_transient('splitsms_low_balance_alert')) {
            return;
        }

        set_transient('splitsms_low_balance_alert', '1', DAY_IN_SECONDS);

        $site = get_bloginfo('name');
        $credits = isset($account['sms_credits']) ? (int) $account['sms_credits'] : 0;
        $wallet_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : 'https://www.splitsms.com/dashboard/wallet';

        $api = new SplitSMS_API();
        $api->send_sms(
            $phone,
            sprintf(
                /* translators: 1: site name 2: SMS credits 3: wallet URL */
                __('[%1$s] SplitSMS low balance: %2$d SMS credits left. Top up: %3$s', 'splitsms'),
                $site,
                $credits,
                $wallet_url
            ),
            array(
                'event' => 'low_balance_alert',
                'source' => 'wordpress',
            )
        );
    }
}
