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
        add_action('admin_bar_menu', array($this, 'admin_bar_balance'), 100);
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
                'walletUrl' => defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '',
                'strings' => array(
                    'testing' => __('Testing connection…', 'splitsms'),
                    'sending' => __('Sending test SMS…', 'splitsms'),
                ),
            )
        );
    }

    public function handle_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['splitsms_save']) && isset($_GET['page']) && in_array($_GET['page'], array('splitsms-settings', 'splitsms-integrations', 'splitsms-crocoblock'), true)) {
            check_admin_referer('splitsms_settings');
            $input = isset($_POST['splitsms']) && is_array($_POST['splitsms'])
                ? wp_unslash($_POST['splitsms'])
                : array();
            SplitSMS_Settings::instance()->update($input);
            wp_safe_redirect(add_query_arg(array('page' => sanitize_text_field(wp_unslash($_GET['page'])), 'updated' => '1'), admin_url('admin.php')));
            exit;
        }

        if (isset($_GET['splitsms_remove_key']) && isset($_GET['page']) && 'splitsms-settings' === $_GET['page']) {
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

        $api = new SplitSMS_API();
        $result = $api->test_connection();

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
            $wc = class_exists('WooCommerce');
            ?>
            <div class="splitsms-grid">
                <div class="splitsms-card">
                    <h2><?php esc_html_e('Quick start', 'splitsms'); ?></h2>
                    <ol class="splitsms-steps">
                        <li><?php esc_html_e('Connect your SplitSMS API key in Settings.', 'splitsms'); ?></li>
                        <li><?php esc_html_e('Send a test SMS from the header.', 'splitsms'); ?></li>
                        <li><?php esc_html_e('Enable WooCommerce or form integrations.', 'splitsms'); ?></li>
                    </ol>
                    <?php if (!$configured) : ?>
                        <p><a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>"><?php esc_html_e('Connect API key', 'splitsms'); ?></a></p>
                    <?php endif; ?>
                </div>
                <div class="splitsms-card">
                    <h2><?php esc_html_e('Integrations', 'splitsms'); ?></h2>
                    <ul class="splitsms-list">
                        <li><?php echo $wc ? '✓' : '○'; ?> WooCommerce</li>
                        <li><?php echo class_exists('WPCF7') ? '✓' : '○'; ?> Contact Form 7</li>
                        <li><?php echo function_exists('wpforms') ? '✓' : '○'; ?> WPForms</li>
                    </ul>
                    <p><a href="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>"><?php esc_html_e('Manage integrations →', 'splitsms'); ?></a></p>
                </div>
            </div>
            <?php
        });
    }

    public function render_send() {
        $this->render_shell(__('Send SMS', 'splitsms'), function () {
            ?>
            <div class="splitsms-card">
                <p class="description"><?php esc_html_e('Send a one-off SMS from WordPress. Uses your default sender ID and country code from Settings.', 'splitsms'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="splitsms-inline-form">
                    <?php /* bulk send UI in a later phase */ ?>
                    <p>
                        <label><?php esc_html_e('Phone', 'splitsms'); ?>
                            <input type="text" name="phone" class="regular-text" placeholder="233..." />
                        </label>
                    </p>
                    <p>
                        <label><?php esc_html_e('Message', 'splitsms'); ?><br />
                            <textarea name="message" class="large-text" rows="4" maxlength="640"></textarea>
                        </label>
                    </p>
                    <p class="description"><?php esc_html_e('Use the header “Send Test SMS” for a quick connection check, or configure bulk campaigns in your SplitSMS dashboard.', 'splitsms'); ?></p>
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
            if ($updated) {
                echo '<div class="notice notice-success"><p>' . esc_html__('Integrations saved.', 'splitsms') . '</p></div>';
            }
            ?>
            <div class="splitsms-card splitsms-detect-panel">
                <h2><?php esc_html_e('Detected on this site', 'splitsms'); ?></h2>
                <ul class="splitsms-detect-list splitsms-detect-list--grid">
                    <?php foreach ($registry as $slug => $item) : ?>
                        <li class="<?php echo $item['active'] ? 'is-active' : 'is-inactive'; ?>">
                            <span class="splitsms-detect-dot" aria-hidden="true"></span>
                            <strong><?php echo esc_html($item['label']); ?></strong>
                            <span class="description"><?php echo esc_html($item['note']); ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <p class="description">
                    <?php esc_html_e('Paystack, Flutterwave, and Stripe do not connect to SplitSMS directly — they run on your WooCommerce checkout. SplitSMS sends SMS when WooCommerce marks the order paid.', 'splitsms'); ?>
                </p>
            </div>

            <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>">
                <?php wp_nonce_field('splitsms_settings'); ?>
                <input type="hidden" name="splitsms_save" value="1" />

                <?php if (!empty($registry['woocommerce']['active'])) : ?>
                <section class="splitsms-card">
                    <h2>WooCommerce</h2>
                    <p class="description"><?php esc_html_e('Variables: {customer_name}, {first_name}, {order_id}, {order_total}, {payment_method}, {payment_gateway}', 'splitsms'); ?></p>
                    <fieldset class="splitsms-check-grid">
                        <label><input type="checkbox" name="splitsms[wc_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_enabled'])); ?> /> <?php esc_html_e('Enable WooCommerce SMS', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_order_placed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_placed'])); ?> /> <?php esc_html_e('Order placed', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_payment_complete]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_payment_complete'])); ?> /> <?php esc_html_e('Payment complete', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_payment_on_processing]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_payment_on_processing'])); ?> /> <?php esc_html_e('Paid → processing (Paystack / Flutterwave)', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_order_processing]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_processing'])); ?> /> <?php esc_html_e('Processing status SMS', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_order_completed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_completed'])); ?> /> <?php esc_html_e('Completed', 'splitsms'); ?></label>
                        <label><input type="checkbox" name="splitsms[wc_order_cancelled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_cancelled'])); ?> /> <?php esc_html_e('Cancelled', 'splitsms'); ?></label>
                    </fieldset>
                    <p><label><?php esc_html_e('Payment received template', 'splitsms'); ?><br />
                        <textarea class="large-text" rows="2" name="splitsms[wc_tpl_payment]"><?php echo esc_textarea($s['wc_tpl_payment']); ?></textarea></label></p>
                </section>
                <?php endif; ?>

                <section class="splitsms-card">
                    <h2><?php esc_html_e('Form plugins', 'splitsms'); ?></h2>
                    <div class="splitsms-form-grid">
                        <div>
                            <h3>Contact Form 7 <?php echo !empty($registry['cf7']['active']) ? '✓' : '—'; ?></h3>
                            <label><input type="checkbox" name="splitsms[cf7_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cf7_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
                            <p><label><?php esc_html_e('Phone field name', 'splitsms'); ?>
                                <input type="text" class="regular-text" name="splitsms[cf7_phone_field]" value="<?php echo esc_attr($s['cf7_phone_field']); ?>" /></label></p>
                            <p><label><?php esc_html_e('Message', 'splitsms'); ?><br />
                                <textarea class="large-text" rows="2" name="splitsms[cf7_message]"><?php echo esc_textarea($s['cf7_message']); ?></textarea></label></p>
                        </div>
                        <div>
                            <h3>WPForms <?php echo !empty($registry['wpforms']['active']) ? '✓' : '—'; ?></h3>
                            <label><input type="checkbox" name="splitsms[wpforms_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wpforms_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
                            <p><label><?php esc_html_e('Phone field (name or label slug)', 'splitsms'); ?>
                                <input type="text" class="regular-text" name="splitsms[wpforms_phone_field]" value="<?php echo esc_attr($s['wpforms_phone_field']); ?>" /></label></p>
                            <p><label><?php esc_html_e('Message', 'splitsms'); ?><br />
                                <textarea class="large-text" rows="2" name="splitsms[wpforms_message]"><?php echo esc_textarea($s['wpforms_message']); ?></textarea></label></p>
                        </div>
                        <div>
                            <h3>Elementor Pro <?php echo !empty($registry['elementor']['active']) ? '✓' : '—'; ?></h3>
                            <label><input type="checkbox" name="splitsms[elementor_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['elementor_enabled'])); ?> /> <?php esc_html_e('Enable', 'splitsms'); ?></label>
                            <p><label><?php esc_html_e('Phone field ID', 'splitsms'); ?>
                                <input type="text" class="regular-text" name="splitsms[elementor_phone_field]" value="<?php echo esc_attr($s['elementor_phone_field']); ?>" /></label></p>
                            <p><label><?php esc_html_e('Message', 'splitsms'); ?><br />
                                <textarea class="large-text" rows="2" name="splitsms[elementor_message]"><?php echo esc_textarea($s['elementor_message']); ?></textarea></label></p>
                        </div>
                    </div>
                </section>

                <p class="description">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=splitsms-crocoblock')); ?>"><?php esc_html_e('Configure Crocoblock (JetEngine, JetFormBuilder, JetBooking, JetAppointment) →', 'splitsms'); ?></a>
                </p>

                <?php submit_button(__('Save integrations', 'splitsms')); ?>
            </form>
            <?php
        });
    }

    public function render_logs() {
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
                            <th><?php esc_html_e('Source', 'splitsms'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($logs)) : ?>
                            <tr><td colspan="5"><?php esc_html_e('No logs yet.', 'splitsms'); ?></td></tr>
                        <?php else : ?>
                            <?php foreach ($logs as $log) : ?>
                                <tr>
                                    <td><?php echo esc_html($log->created_at); ?></td>
                                    <td><?php echo esc_html($log->event); ?></td>
                                    <td><?php echo esc_html($log->recipient); ?></td>
                                    <td><span class="splitsms-badge splitsms-badge--<?php echo esc_attr($log->status); ?>"><?php echo esc_html($log->status); ?></span></td>
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
        $this->render_shell(__('Settings', 'splitsms'), function () use ($s, $opts, $updated, $removed) {
            ?>
            <?php if ($updated) : ?><div class="notice notice-success"><p><?php esc_html_e('Settings saved.', 'splitsms'); ?></p></div><?php endif; ?>
            <?php if ($removed) : ?><div class="notice notice-success"><p><?php esc_html_e('API key removed.', 'splitsms'); ?></p></div><?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>" class="splitsms-card">
                <?php wp_nonce_field('splitsms_settings'); ?>
                <input type="hidden" name="splitsms_save" value="1" />
                <table class="form-table">
                    <tr>
                        <th><?php esc_html_e('API key', 'splitsms'); ?></th>
                        <td>
                            <?php if ('' !== $opts['api_key']) : ?>
                                <p><code><?php echo esc_html($s->masked_api_key()); ?></code></p>
                            <?php endif; ?>
                            <input type="password" class="regular-text" name="splitsms[api_key]" placeholder="<?php esc_attr_e('Paste new key to replace', 'splitsms'); ?>" autocomplete="off" />
                            <p class="description"><?php esc_html_e('Get your key from splitsms.com → App connections.', 'splitsms'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Sender ID', 'splitsms'); ?></th>
                        <td><input type="text" class="regular-text" name="splitsms[sender_id]" value="<?php echo esc_attr($opts['sender_id']); ?>" /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Admin phone', 'splitsms'); ?></th>
                        <td><input type="text" class="regular-text" name="splitsms[admin_phone]" value="<?php echo esc_attr($opts['admin_phone']); ?>" /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Low balance alert phone', 'splitsms'); ?></th>
                        <td><input type="text" class="regular-text" name="splitsms[low_balance_alert_phone]" value="<?php echo esc_attr($opts['low_balance_alert_phone']); ?>" /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Debug logs', 'splitsms'); ?></th>
                        <td><label><input type="checkbox" name="splitsms[debug_logs]" value="1" <?php checked(SplitSMS_Settings::is_yes($opts['debug_logs'])); ?> /> <?php esc_html_e('Verbose logging', 'splitsms'); ?></label></td>
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
        $this->render_shell(__('Help', 'splitsms'), function () use ($docs) {
            ?>
            <div class="splitsms-card">
                <h2><?php esc_html_e('Documentation', 'splitsms'); ?></h2>
                <ul>
                    <li><a href="<?php echo esc_url($docs); ?>" target="_blank" rel="noopener"><?php esc_html_e('Setup guide on splitsms.com', 'splitsms'); ?></a></li>
                    <li><a href="<?php echo esc_url(defined('SPLITSMS_API_DOCS_URL') ? SPLITSMS_API_DOCS_URL : ''); ?>" target="_blank" rel="noopener"><?php esc_html_e('API documentation', 'splitsms'); ?></a></li>
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
        ?>
        <div class="wrap splitsms-admin">
            <?php $this->render_status_header($configured, $account); ?>
            <h1><?php echo esc_html($title); ?></h1>
            <?php call_user_func($body); ?>
        </div>
        <?php
    }

    /**
     * @param bool                    $configured
     * @param array<string,mixed>|null $account
     */
    private function render_status_header($configured, $account) {
        $wallet_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '#';
        ?>
        <div class="splitsms-status-header">
            <div class="splitsms-status-header__main">
                <strong><?php echo $configured ? esc_html__('SplitSMS Connected', 'splitsms') : esc_html__('Not connected', 'splitsms'); ?></strong>
                <?php if ($account) : ?>
                    <?php
                    $sms_credits = isset($account['sms_credits']) ? (int) $account['sms_credits'] : 0;
                    $wallet_currency = isset($account['wallet_currency']) ? $account['wallet_currency'] : 'GHS';
                    $wallet_balance = isset($account['wallet_balance']) ? (float) $account['wallet_balance'] : 0;
                    $api_status = isset($account['status']) ? $account['status'] : 'active';
                    ?>
                    <span><?php printf(esc_html__('SMS Balance: %s SMS', 'splitsms'), esc_html(number_format_i18n($sms_credits))); ?></span>
                    <span><?php printf(esc_html__('Wallet: %1$s %2$s', 'splitsms'), esc_html($wallet_currency), esc_html(number_format_i18n($wallet_balance, 2))); ?></span>
                    <span><?php printf(esc_html__('API: %s', 'splitsms'), esc_html($api_status)); ?></span>
                <?php endif; ?>
            </div>
            <div class="splitsms-status-header__actions">
                <a class="button" href="<?php echo esc_url($wallet_url); ?>" target="_blank" rel="noopener"><?php esc_html_e('Add funds', 'splitsms'); ?></a>
                <button type="button" class="button button-primary" id="splitsms-send-test-btn"><?php esc_html_e('Send test SMS', 'splitsms'); ?></button>
                <span id="splitsms-send-test-result"></span>
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
        return $this->account_cache;
    }
}
