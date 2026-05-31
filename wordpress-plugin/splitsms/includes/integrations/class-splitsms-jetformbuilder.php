<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetFormBuilder — native SplitSMS Notification action + optional global submit hook.
 */
class SplitSMS_JetFormBuilder {
    /** @var self|null */
    private static $instance = null;

    /** @var SplitSMS_Crocoblock|null */
    private $cb = null;

    /** @var array<int, bool> */
    private static $action_sent_forms = array();

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $detected = SplitSMS_Crocoblock::detect_plugins();
        if (empty($detected['jetformbuilder'])) {
            return;
        }

        add_action('jet-form-builder/actions/register', array($this, 'register_form_action'), 10, 1);
        add_action('enqueue_block_editor_assets', array($this, 'register_editor_assets'), -9);
        add_action('jet-form-builder/editor-assets/after', array($this, 'enqueue_editor_assets'));

        if (!SplitSMS_Settings::is_configured()) {
            return;
        }

        add_action('plugins_loaded', array($this, 'maybe_register_global_hook'), 26);
    }

    /**
     * Global after-submit SMS when enabled in Forms manager or Crocoblock settings.
     */
    public function maybe_register_global_hook() {
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
        if (!SplitSMS_Forms_Manager::source_should_hook('jfb')
            && !SplitSMS_Settings::instance()->feature_enabled('cb_jfb_enabled')) {
            return;
        }

        $this->cb = SplitSMS_Crocoblock::instance();
        add_action('jet-form-builder/form-handler/after-send', array($this, 'on_after_send'), 30, 2);
    }

    /**
     * @param object $manager Jet_Form_Builder\Actions\Manager
     */
    public function register_form_action($manager) {
        if (!class_exists('\Jet_Form_Builder\Actions\Types\Base')) {
            return;
        }
        if (!is_object($manager) || !method_exists($manager, 'register_action_type')) {
            return;
        }

        require_once SPLITSMS_PLUGIN_DIR . 'includes/integrations/class-splitsms-jfb-send-sms-action.php';

        if (!class_exists('SplitSMS_JFB_Send_Sms_Action')) {
            return;
        }

        $manager->register_action_type(new SplitSMS_JFB_Send_Sms_Action());
    }

    /**
     * Register editor script handle (mirrors JetFormBuilder action modules).
     */
    public function register_editor_assets() {
        $asset_path = SPLITSMS_PLUGIN_DIR . 'assets/jfb-editor/build/editor.asset.php';
        $script_path = SPLITSMS_PLUGIN_DIR . 'assets/jfb-editor/build/editor.js';

        if (!is_readable($asset_path) || !is_readable($script_path)) {
            return;
        }

        $script_asset = require $asset_path;
        if (!is_array($script_asset)) {
            return;
        }

        $dependencies = isset($script_asset['dependencies']) && is_array($script_asset['dependencies'])
            ? $script_asset['dependencies']
            : array();

        $dependencies[] = 'jet-fb-components';
        $dependencies[] = 'jet-fb-data';
        $dependencies[] = 'jet-fb-actions-v2';
        $dependencies[] = 'jet-fb-blocks-v2-to-actions-v2';

        wp_register_script(
            'splitsms-jfb-send-sms-editor',
            plugins_url('assets/jfb-editor/build/editor.js', SPLITSMS_PLUGIN_FILE),
            array_values(array_unique($dependencies)),
            isset($script_asset['version']) ? $script_asset['version'] : SPLITSMS_VERSION,
            true
        );
    }

    /**
     * Enqueue editor bundle when JetFormBuilder form editor loads.
     */
    public function enqueue_editor_assets() {
        if (wp_script_is('splitsms-jfb-send-sms-editor', 'registered')) {
            wp_enqueue_script('splitsms-jfb-send-sms-editor');
        }
    }

    /**
     * @param int $form_id
     */
    public static function note_action_sent($form_id) {
        if ($form_id > 0) {
            self::$action_sent_forms[(int) $form_id] = true;
        }
    }

    /**
     * @param int $form_id
     * @return bool
     */
    public static function action_sent_for_form($form_id) {
        return !empty(self::$action_sent_forms[(int) $form_id]);
    }

    /**
     * @param object $handler Jet_Form_Builder\Form_Handler
     * @param bool   $is_success
     */
    public function on_after_send($handler, $is_success) {
        if (!$is_success || null === $this->cb) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        $form_id = 0;
        $fields = array();

        if (is_object($handler)) {
            if (method_exists($handler, 'get_form_id')) {
                $form_id = (int) $handler->get_form_id();
            } elseif (isset($handler->form_id)) {
                $form_id = (int) $handler->form_id;
            }

            if (method_exists($handler, 'get_request_data')) {
                $fields = (array) $handler->get_request_data();
            } elseif (method_exists($handler, 'get_fields')) {
                $fields = (array) $handler->get_fields();
            } elseif (isset($handler->request_data) && is_array($handler->request_data)) {
                $fields = $handler->request_data;
            } elseif (isset($handler->fields) && is_array($handler->fields)) {
                $fields = $handler->fields;
            }
        }

        if (self::action_sent_for_form($form_id)) {
            return;
        }

        if (!SplitSMS_Forms_Manager::is_form_enabled('jfb', (string) $form_id)) {
            return;
        }

        $config = SplitSMS_Forms_Manager::get_form_config('jfb', (string) $form_id);

        $vars = self::normalize_request_vars($fields);
        $vars['form_id'] = (string) $form_id;
        $form_post = $form_id ? get_post($form_id) : null;
        $vars['form_title'] = $form_post ? $form_post->post_title : '';

        $this->cb->send_event(array(
            'integration' => 'jetformbuilder',
            'event' => 'form_submitted',
            'source' => 'JetFormBuilder',
            'template' => $config['message'],
            'vars' => $vars,
            'phone_field' => $config['phone_field'],
        ));

        if ($settings->feature_enabled('cb_jfb_admin_alert') && '' !== trim($config['admin_message'])) {
            $this->cb->send_event(array(
                'integration' => 'jetformbuilder',
                'event' => 'form_submitted_admin',
                'source' => 'JetFormBuilder',
                'template' => $config['admin_message'],
                'vars' => $vars,
                'admin_alert' => true,
            ));
        } elseif ($settings->feature_enabled('cb_jfb_admin_alert')) {
            $this->cb->send_event(array(
                'integration' => 'jetformbuilder',
                'event' => 'form_submitted_admin',
                'source' => 'JetFormBuilder',
                'template' => $settings->get('cb_jfb_tpl_admin'),
                'vars' => $vars,
                'admin_alert' => true,
            ));
        }
    }

    /**
     * @param array<string, mixed> $fields
     * @return array<string, string>
     */
    public static function normalize_request_vars($fields) {
        $vars = array();
        foreach ($fields as $key => $value) {
            if (is_scalar($value)) {
                $vars[(string) $key] = (string) $value;
            }
        }

        if (isset($vars['first_name']) && !isset($vars['name'])) {
            $vars['name'] = trim($vars['first_name'] . ' ' . (isset($vars['last_name']) ? $vars['last_name'] : ''));
        }

        return $vars;
    }
}
