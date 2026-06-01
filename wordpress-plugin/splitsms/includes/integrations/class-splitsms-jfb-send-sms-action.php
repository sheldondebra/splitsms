<?php

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('\Jet_Form_Builder\Actions\Types\Base')) {
    return;
}

/**
 * JetFormBuilder post-submit action: Send SMS via SplitSMS.
 *
 * @see https://github.com/Crocoblock/jetformbuilder/wiki/PHP-Hooks
 */
class SplitSMS_JFB_Send_Sms_Action extends \Jet_Form_Builder\Actions\Types\Base {

    /**
     * @return string
     */
    public function get_id() {
        return 'splitsms_send_sms';
    }

    /**
     * @return string
     */
    public function get_name() {
        return __('Send SMS', 'splitsms');
    }

    /**
     * @return bool
     */
    public function dependence() {
        return class_exists('\Jet_Form_Builder\Actions\Types\Base');
    }

    /**
     * @return bool
     */
    public function is_disabled() {
        return !SplitSMS_Settings::is_configured();
    }

    /**
     * @return string
     */
    public function self_script_name() {
        return 'splitsmsSendSmsData';
    }

    /**
     * @return array<string, string>
     */
    public function editor_labels() {
        return array(
            'sms_to' => __('Phone number / Send to:', 'splitsms'),
            'phone_field' => __('Phone field:', 'splitsms'),
            'custom_phone' => __('Phone number (macros):', 'splitsms'),
            'country_code_field' => __('Country code field (optional):', 'splitsms'),
            'message' => __('Message:', 'splitsms'),
            'sender_id' => __('Sender ID override (optional):', 'splitsms'),
            'send_admin_copy' => __('Also notify admin:', 'splitsms'),
            'admin_message' => __('Admin message:', 'splitsms'),
        );
    }

    /**
     * @return array<string, string>
     */
    public function editor_labels_help() {
        return array(
            'phone_field' => __('Choose the form field that stores the recipient phone number.', 'splitsms'),
            'custom_phone' => __('Supports JetFormBuilder macros such as %phone%, %post_id%, %user_id%.', 'splitsms'),
            'country_code_field' => __('Optional field for ISO country code (e.g. GH). Falls back to plugin default.', 'splitsms'),
            'message' => __('SMS body. Supports all form macros (%field%, {field}, %post_id%, %user_id%).', 'splitsms'),
            'sender_id' => __('Leave empty to use the Sender ID from SplitSMS settings.', 'splitsms'),
            'admin_message' => __('Sent to the admin phone in SplitSMS Crocoblock settings.', 'splitsms'),
        );
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function action_attributes() {
        return array(
            'sms_to' => array(
                'default' => 'form',
            ),
            'phone_field' => array(
                'default' => 'phone',
            ),
            'custom_phone' => array(
                'default' => '',
            ),
            'country_code_field' => array(
                'default' => '',
            ),
            'message' => array(
                'default' => __('Hi {name}, thanks for your submission at {site_name}.', 'splitsms'),
            ),
            'sender_id' => array(
                'default' => '',
            ),
            'send_admin_copy' => array(
                'default' => '',
            ),
            'admin_message' => array(
                'default' => __('New form submission from {name} ({phone}) on {site_name}.', 'splitsms'),
            ),
        );
    }

    /**
     * Editor dropdown options (JetFormBuilder reads this server-side).
     *
     * @return array<string, mixed>
     */
    public function action_data() {
        $sms_to = array(
            array(
                'value' => 'form',
                'label' => __('Phone from submitted form field', 'splitsms'),
            ),
            array(
                'value' => 'custom',
                'label' => __('Custom phone / macro', 'splitsms'),
            ),
            array(
                'value' => 'admin',
                'label' => __('Admin phone (SplitSMS settings)', 'splitsms'),
            ),
        );

        if (class_exists('\Jet_Form_Builder\Classes\Tools')) {
            return array(
                'smsTo' => \Jet_Form_Builder\Classes\Tools::with_placeholder($sms_to),
                'configured' => SplitSMS_Settings::is_configured(),
                'settingsUrl' => admin_url('admin.php?page=splitsms-settings'),
            );
        }

        return array(
            'smsTo' => $sms_to,
            'configured' => SplitSMS_Settings::is_configured(),
            'settingsUrl' => admin_url('admin.php?page=splitsms-settings'),
        );
    }

    /**
     * @param array<string, mixed> $request
     * @param \Jet_Form_Builder\Actions\Action_Handler $handler
     */
    public function do_action(array $request, \Jet_Form_Builder\Actions\Action_Handler $handler) {
        unset($handler);

        if (!SplitSMS_Settings::is_configured()) {
            throw new \Jet_Form_Builder\Exceptions\Action_Exception(
                'failed',
                esc_html(SplitSMS_Settings::configuration_error())
            );
        }

        $form_id = $this->current_form_id();
        SplitSMS_JetFormBuilder::note_action_sent($form_id);

        $result = SplitSMS_Form_Sms_Helper::dispatch(
            $this->settings,
            $request,
            array(
                'form_id' => $form_id,
                'post_id' => $form_id,
                'source' => 'JetFormBuilder',
                'event' => 'jfb_send_sms',
            )
        );

        if (empty($result['ok'])) {
            $error = isset($result['error']) ? (string) $result['error'] : 'send_failed';
            throw new \Jet_Form_Builder\Exceptions\Action_Exception(
                'failed',
                sprintf(
                    /* translators: %s: API error code or message */
                    esc_html__('SplitSMS could not send the message (%s).', 'splitsms'),
                    esc_html($error)
                )
            );
        }
    }

    /**
     * @return int
     */
    private function current_form_id() {
        if (function_exists('jet_fb_handler') && is_object(jet_fb_handler())) {
            return (int) jet_fb_handler()->form_id;
        }
        return 0;
    }

}
