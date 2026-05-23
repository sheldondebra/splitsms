<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WordPress admin settings UI.
 */
class SplitSMS_Admin {
    /** @var self|null */
    private static $instance = null;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_init', array($this, 'handle_save'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_splitsms_test_connection', array($this, 'ajax_test_connection'));
    }

    public function register_menu() {
        add_options_page(
            __('SplitSMS', 'splitsms'),
            __('SplitSMS', 'splitsms'),
            'manage_options',
            'splitsms',
            array($this, 'render_page')
        );
    }

    public function enqueue_assets($hook) {
        if ('settings_page_splitsms' !== $hook) {
            return;
        }
        wp_enqueue_style(
            'splitsms-admin',
            plugins_url('assets/admin.css', SPLITSMS_PLUGIN_FILE),
            array(),
            SPLITSMS_VERSION
        );
    }

    public function handle_save() {
        if (!isset($_POST['splitsms_save']) || !current_user_can('manage_options')) {
            return;
        }
        check_admin_referer('splitsms_settings');

        $input = isset($_POST['splitsms']) && is_array($_POST['splitsms'])
            ? wp_unslash($_POST['splitsms'])
            : array();

        SplitSMS_Settings::instance()->update($input);

        wp_safe_redirect(add_query_arg(array('page' => 'splitsms', 'updated' => '1'), admin_url('options-general.php')));
        exit;
    }

    public function ajax_test_connection() {
        check_ajax_referer('splitsms_test', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Forbidden'), 403);
        }

        $api = new SplitSMS_API();
        $result = $api->test_connection();

        if (!empty($result['ok'])) {
            wp_send_json_success(
                array(
                    'message' => sprintf(
                        /* translators: %s wallet balance */
                        __('Connected. Wallet balance: %s', 'splitsms'),
                        isset($result['balance']) ? $result['balance'] : '—'
                    ),
                )
            );
        }

        wp_send_json_error(
            array('message' => isset($result['error']) ? $result['error'] : __('Connection failed', 'splitsms'))
        );
    }

    public function render_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $s = SplitSMS_Settings::instance()->all();
        $wc_active = class_exists('WooCommerce');
        $updated = isset($_GET['updated']);
        ?>
        <div class="wrap splitsms-admin">
            <h1><?php esc_html_e('SplitSMS', 'splitsms'); ?></h1>
            <p class="description">
                <?php esc_html_e('Connect your store to SplitSMS. Turn features on or off to match how you want to notify customers.', 'splitsms'); ?>
            </p>

            <?php if ($updated) : ?>
                <div class="notice notice-success is-dismissible"><p><?php esc_html_e('Settings saved.', 'splitsms'); ?></p></div>
            <?php endif; ?>

            <form method="post" action="">
                <?php wp_nonce_field('splitsms_settings'); ?>

                <div class="splitsms-panels">
                    <section class="splitsms-panel">
                        <h2><?php esc_html_e('API connection', 'splitsms'); ?></h2>
                        <table class="form-table" role="presentation">
                            <tr>
                                <th scope="row"><label for="splitsms_enabled"><?php esc_html_e('Enable plugin', 'splitsms'); ?></label></th>
                                <td><input type="checkbox" id="splitsms_enabled" name="splitsms[enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['enabled'])); ?> /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="api_base_url"><?php esc_html_e('API base URL', 'splitsms'); ?></label></th>
                                <td>
                                    <input type="url" class="regular-text" id="api_base_url" name="splitsms[api_base_url]" value="<?php echo esc_attr($s['api_base_url']); ?>" placeholder="<?php echo esc_attr(defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL : 'https://www.splitsms.com'); ?>" required />
                                    <p class="description">
                                        <?php
                                        printf(
                                            /* translators: %s: docs URL */
                                            esc_html__('Your SplitSMS site URL (no trailing slash). Docs: %s', 'splitsms'),
                                            '<a href="' . esc_url(defined('SPLITSMS_API_DOCS_URL') ? SPLITSMS_API_DOCS_URL : '') . '" target="_blank" rel="noopener">' . esc_html__('API documentation', 'splitsms') . '</a>'
                                        );
                                        ?>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="api_key"><?php esc_html_e('API key', 'splitsms'); ?></label></th>
                                <td>
                                    <input type="password" class="regular-text" id="api_key" name="splitsms[api_key]" value="<?php echo esc_attr($s['api_key']); ?>" autocomplete="off" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="sender_id"><?php esc_html_e('Sender ID', 'splitsms'); ?></label></th>
                                <td><input type="text" class="regular-text" id="sender_id" name="splitsms[sender_id]" value="<?php echo esc_attr($s['sender_id']); ?>" /></td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="country_code"><?php esc_html_e('Country code', 'splitsms'); ?></label></th>
                                <td><input type="text" class="small-text" id="country_code" name="splitsms[country_code]" value="<?php echo esc_attr($s['country_code']); ?>" maxlength="10" /></td>
                            </tr>
                        </table>
                        <p>
                            <button type="button" class="button" id="splitsms-test-btn"><?php esc_html_e('Test connection', 'splitsms'); ?></button>
                            <span id="splitsms-test-result"></span>
                        </p>
                    </section>

                    <?php if ($wc_active) : ?>
                    <section class="splitsms-panel">
                        <h2><?php esc_html_e('WooCommerce', 'splitsms'); ?></h2>
                        <p class="description"><?php esc_html_e('SMS uses the billing phone on each order. Placeholders: {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {site_name}', 'splitsms'); ?></p>
                        <fieldset>
                            <label><input type="checkbox" name="splitsms[wc_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_enabled'])); ?> /> <?php esc_html_e('Enable WooCommerce SMS', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wc_order_placed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_placed'])); ?> /> <?php esc_html_e('Order placed (checkout)', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wc_payment_complete]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_payment_complete'])); ?> /> <?php esc_html_e('Payment complete', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wc_order_processing]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_processing'])); ?> /> <?php esc_html_e('Status → Processing', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wc_order_completed]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_completed'])); ?> /> <?php esc_html_e('Status → Completed', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wc_order_cancelled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wc_order_cancelled'])); ?> /> <?php esc_html_e('Status → Cancelled', 'splitsms'); ?></label>
                        </fieldset>
                        <?php $this->template_fields('wc', array(
                            'wc_tpl_placed' => __('Order placed template', 'splitsms'),
                            'wc_tpl_payment' => __('Payment complete template', 'splitsms'),
                            'wc_tpl_processing' => __('Processing template', 'splitsms'),
                            'wc_tpl_completed' => __('Completed template', 'splitsms'),
                            'wc_tpl_cancelled' => __('Cancelled template', 'splitsms'),
                        ), $s); ?>
                    </section>
                    <?php else : ?>
                    <section class="splitsms-panel splitsms-muted">
                        <h2><?php esc_html_e('WooCommerce', 'splitsms'); ?></h2>
                        <p><?php esc_html_e('Install and activate WooCommerce to unlock order SMS notifications.', 'splitsms'); ?></p>
                    </section>
                    <?php endif; ?>

                    <section class="splitsms-panel">
                        <h2><?php esc_html_e('WordPress', 'splitsms'); ?></h2>
                        <fieldset>
                            <label><input type="checkbox" name="splitsms[wp_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_enabled'])); ?> /> <?php esc_html_e('Enable WordPress SMS', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wp_user_register]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_user_register'])); ?> /> <?php esc_html_e('New user registration (needs billing_phone or splitsms_phone user meta)', 'splitsms'); ?></label><br />
                            <label><input type="checkbox" name="splitsms[wp_password_reset]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wp_password_reset'])); ?> /> <?php esc_html_e('Password reset via SMS (sends link; disables email body)', 'splitsms'); ?></label>
                        </fieldset>
                        <?php $this->template_fields('wp', array(
                            'wp_tpl_register' => __('Registration template', 'splitsms'),
                            'wp_tpl_password_reset' => __('Password reset template', 'splitsms'),
                        ), $s); ?>
                    </section>

                    <section class="splitsms-panel">
                        <h2><?php esc_html_e('Form plugins', 'splitsms'); ?></h2>
                        <h3><?php esc_html_e('Contact Form 7', 'splitsms'); ?></h3>
                        <label><input type="checkbox" name="splitsms[cf7_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['cf7_enabled'])); ?> /> <?php esc_html_e('Send SMS after successful submit', 'splitsms'); ?></label>
                        <p>
                            <label><?php esc_html_e('Phone field name', 'splitsms'); ?>
                                <input type="text" class="regular-text" name="splitsms[cf7_phone_field]" value="<?php echo esc_attr($s['cf7_phone_field']); ?>" />
                            </label>
                        </p>
                        <p>
                            <label><?php esc_html_e('Message template', 'splitsms'); ?><br />
                                <textarea class="large-text" rows="2" name="splitsms[cf7_message]"><?php echo esc_textarea($s['cf7_message']); ?></textarea>
                            </label>
                        </p>

                        <h3><?php esc_html_e('WPForms', 'splitsms'); ?></h3>
                        <label><input type="checkbox" name="splitsms[wpforms_enabled]" value="1" <?php checked(SplitSMS_Settings::is_yes($s['wpforms_enabled'])); ?> /> <?php esc_html_e('Send SMS after successful submit', 'splitsms'); ?></label>
                        <p>
                            <label><?php esc_html_e('Phone field name / label slug', 'splitsms'); ?>
                                <input type="text" class="regular-text" name="splitsms[wpforms_phone_field]" value="<?php echo esc_attr($s['wpforms_phone_field']); ?>" />
                            </label>
                        </p>
                        <p>
                            <label><?php esc_html_e('Message template', 'splitsms'); ?><br />
                                <textarea class="large-text" rows="2" name="splitsms[wpforms_message]"><?php echo esc_textarea($s['wpforms_message']); ?></textarea>
                            </label>
                        </p>
                    </section>
                </div>

                <?php submit_button(__('Save preferences', 'splitsms'), 'primary', 'splitsms_save'); ?>
            </form>
        </div>
        <script>
        (function () {
            var btn = document.getElementById('splitsms-test-btn');
            var out = document.getElementById('splitsms-test-result');
            if (!btn) return;
            btn.addEventListener('click', function () {
                out.textContent = '<?php echo esc_js(__('Testing…', 'splitsms')); ?>';
                var fd = new FormData();
                fd.append('action', 'splitsms_test_connection');
                fd.append('nonce', '<?php echo esc_js(wp_create_nonce('splitsms_test')); ?>');
                fetch(ajaxurl, { method: 'POST', body: fd, credentials: 'same-origin' })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        out.textContent = data.success ? (data.data && data.data.message ? data.data.message : 'OK') : (data.data && data.data.message ? data.data.message : 'Failed');
                        out.style.color = data.success ? '#0a7a0a' : '#b32d2e';
                    })
                    .catch(function () { out.textContent = 'Request failed'; out.style.color = '#b32d2e'; });
            });
        })();
        </script>
        <?php
    }

    /**
     * @param string               $prefix
     * @param array<string,string> $fields
     * @param array<string,mixed>  $s
     */
    private function template_fields($prefix, $fields, $s) {
        echo '<table class="form-table splitsms-templates" role="presentation">';
        foreach ($fields as $key => $label) {
            printf(
                '<tr><th scope="row"><label for="%1$s">%2$s</label></th><td><textarea class="large-text" rows="2" id="%1$s" name="splitsms[%1$s]">%3$s</textarea></td></tr>',
                esc_attr($key),
                esc_html($label),
                esc_textarea($s[$key])
            );
        }
        echo '</table>';
    }
}
