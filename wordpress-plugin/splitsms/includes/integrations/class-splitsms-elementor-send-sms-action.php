<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor Pro Forms — SplitSMS action under Actions After Submit.
 *
 * @see https://developers.elementor.com/docs/form-actions/add-new-action/
 */
class SplitSMS_Elementor_Send_Sms_Action extends \ElementorPro\Modules\Forms\Classes\Action_Base {

    /**
     * @return string
     */
    public function get_name() {
        return 'splitsms';
    }

    /**
     * @return string
     */
    public function get_label() {
        return __('SplitSMS Notification', 'splitsms');
    }

    /**
     * @param \Elementor\Widget_Base $widget
     */
    public function register_settings_section($widget) {
        $widget->start_controls_section(
            'section_splitsms',
            array(
                'label' => __('SplitSMS', 'splitsms'),
                'condition' => array(
                    'submit_actions' => $this->get_name(),
                ),
            )
        );

        if (!SplitSMS_Settings::is_configured()) {
            $widget->add_control(
                'splitsms_connect_notice',
                array(
                    'type' => \Elementor\Controls_Manager::RAW_HTML,
                    'raw' => sprintf(
                        /* translators: %s: settings URL */
                        '<p class="elementor-panel-alert elementor-panel-alert-warning">%s</p>',
                        esc_html__(
                            'Connect your SplitSMS API key in WordPress before this action can send SMS.',
                            'splitsms'
                        )
                    ),
                )
            );
        }

        $widget->add_control(
            'splitsms_sms_to',
            array(
                'label' => __('Send to', 'splitsms'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'form',
                'options' => array(
                    'form' => __('Phone from form field', 'splitsms'),
                    'custom' => __('Custom phone / field macros', 'splitsms'),
                    'admin' => __('Admin phone (SplitSMS settings)', 'splitsms'),
                ),
            )
        );

        $widget->add_control(
            'splitsms_phone_field',
            array(
                'label' => __('Phone field ID', 'splitsms'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'phone',
                'description' => __('Tel field → Advanced → Field ID (e.g. phone).', 'splitsms'),
                'condition' => array(
                    'splitsms_sms_to' => 'form',
                ),
            )
        );

        $widget->add_control(
            'splitsms_custom_phone',
            array(
                'label' => __('Custom phone', 'splitsms'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
                'description' => __('Use field macros like {phone} or [field id="phone"].', 'splitsms'),
                'condition' => array(
                    'splitsms_sms_to' => 'custom',
                ),
            )
        );

        $widget->add_control(
            'splitsms_message',
            array(
                'label' => __('Message', 'splitsms'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Hi {name}, thanks for contacting {site_name}.', 'splitsms'),
                'rows' => 4,
            )
        );

        $widget->add_control(
            'splitsms_sender_id',
            array(
                'label' => __('Sender ID override (optional)', 'splitsms'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
            )
        );

        $widget->add_control(
            'splitsms_send_admin_copy',
            array(
                'label' => __('Also notify admin', 'splitsms'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'return_value' => 'yes',
                'default' => '',
            )
        );

        $widget->add_control(
            'splitsms_admin_message',
            array(
                'label' => __('Admin message', 'splitsms'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('New form submission from {name} ({phone}) on {site_name}.', 'splitsms'),
                'rows' => 3,
                'condition' => array(
                    'splitsms_send_admin_copy' => 'yes',
                ),
            )
        );

        $widget->end_controls_section();
    }

    /**
     * @param \ElementorPro\Modules\Forms\Classes\Form_Record  $record
     * @param \ElementorPro\Modules\Forms\Classes\Ajax_Handler $ajax_handler
     */
    public function run($record, $ajax_handler) {
        if (!SplitSMS_Settings::is_configured()) {
            if (is_object($ajax_handler) && method_exists($ajax_handler, 'add_error_message')) {
                $ajax_handler->add_error_message(esc_html(SplitSMS_Settings::configuration_error()));
            }
            return;
        }

        if (!is_object($record) || !method_exists($record, 'get')) {
            return;
        }

        SplitSMS_Elementor::note_native_action_handled($record);

        $form_settings = (array) $record->get('form_settings');
        $parsed = SplitSMS_Elementor::parse_record_fields($record);
        $data = isset($parsed['by_id']) ? $parsed['by_id'] : array();

        $form_name = method_exists($record, 'get_form_settings')
            ? (string) $record->get_form_settings('form_name')
            : '';
        $form_id = method_exists($record, 'get_form_settings')
            ? (string) $record->get_form_settings('id')
            : '';

        $vars = SplitSMS_Elementor::build_template_vars($record, $parsed, '', $form_name, $form_id);
        $macro = function ($content) use ($vars) {
            return SplitSMS_API::render_template((string) $content, $vars);
        };

        $action_settings = array(
            'sms_to' => isset($form_settings['splitsms_sms_to']) ? $form_settings['splitsms_sms_to'] : 'form',
            'phone_field' => isset($form_settings['splitsms_phone_field']) ? $form_settings['splitsms_phone_field'] : 'phone',
            'custom_phone' => isset($form_settings['splitsms_custom_phone']) ? $form_settings['splitsms_custom_phone'] : '',
            'message' => isset($form_settings['splitsms_message']) ? $form_settings['splitsms_message'] : '',
            'sender_id' => isset($form_settings['splitsms_sender_id']) ? $form_settings['splitsms_sender_id'] : '',
            'send_admin_copy' => !empty($form_settings['splitsms_send_admin_copy']) ? 'yes' : '',
            'admin_message' => isset($form_settings['splitsms_admin_message']) ? $form_settings['splitsms_admin_message'] : '',
        );

        $ref = 'elementor-action';
        if ('' !== $form_id) {
            $ref .= '-' . sanitize_key($form_id);
        }

        $result = SplitSMS_Form_Sms_Helper::dispatch(
            $action_settings,
            $data,
            array(
                'source' => 'elementor',
                'event' => 'elementor_action',
                'macro_parser' => $macro,
                'on_error' => function ($message) use ($ajax_handler) {
                    if (is_object($ajax_handler) && method_exists($ajax_handler, 'add_error_message')) {
                        $ajax_handler->add_error_message(
                            sprintf(
                                /* translators: %s: error message */
                                esc_html__('SplitSMS: %s', 'splitsms'),
                                esc_html($message)
                            )
                        );
                    }
                },
            )
        );

        if (empty($result['ok']) && is_object($ajax_handler) && method_exists($ajax_handler, 'add_error_message')) {
            $error = isset($result['error']) ? (string) $result['error'] : __('Send failed', 'splitsms');
            $ajax_handler->add_error_message(
                sprintf(
                    /* translators: %s: error message */
                    esc_html__('SplitSMS: %s', 'splitsms'),
                    esc_html($error)
                )
            );
        }
    }

    /**
     * @param array $element
     * @return array
     */
    public function on_export($element) {
        unset(
            $element['splitsms_sms_to'],
            $element['splitsms_phone_field'],
            $element['splitsms_custom_phone'],
            $element['splitsms_message'],
            $element['splitsms_sender_id'],
            $element['splitsms_send_admin_copy'],
            $element['splitsms_admin_message']
        );

        return $element;
    }
}
