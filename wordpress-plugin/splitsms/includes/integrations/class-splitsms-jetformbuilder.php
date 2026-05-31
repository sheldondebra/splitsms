<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetFormBuilder — native Send SMS form action + optional global submit hook.
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

        $settings = SplitSMS_Settings::instance();
        if (!$settings->feature_enabled('cb_jfb_enabled')) {
            return;
        }

        $this->cb = SplitSMS_Crocoblock::instance();
        add_action('jet-form-builder/form-handler/after-send', array($this, 'on_after_send'), 30, 2);
    }

    /**
     * @param object $manager Jet_Form_Builder\Actions\Manager
     */
    public function register_form_action($manager) {
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }
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

        $allowed = $settings->get('cb_jfb_form_ids', '');
        if ('' !== trim($allowed)) {
            $ids = array_map('intval', array_map('trim', explode(',', $allowed)));
            if (!in_array($form_id, $ids, true)) {
                return;
            }
        }

        $vars = self::normalize_request_vars($fields);
        $vars['form_id'] = (string) $form_id;
        $form_post = $form_id ? get_post($form_id) : null;
        $vars['form_title'] = $form_post ? $form_post->post_title : '';

        $this->cb->send_event(array(
            'integration' => 'jetformbuilder',
            'event' => 'form_submitted',
            'source' => 'JetFormBuilder',
            'template' => $settings->get('cb_jfb_tpl_submitted'),
            'vars' => $vars,
            'phone_field' => $settings->get('cb_jfb_phone_field', $settings->get('cb_phone_field', 'phone')),
        ));

        if ($settings->feature_enabled('cb_jfb_admin_alert')) {
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
