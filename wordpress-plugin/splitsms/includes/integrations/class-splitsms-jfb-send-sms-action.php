<?php

if (!defined('ABSPATH')) {
    exit;
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
        return __('Send SMS (SplitSMS)', 'splitsms');
    }

    /**
     * @return bool
     */
    public function dependence() {
        return class_exists('\Jet_Form_Builder\Actions\Types\Base')
            && SplitSMS_Settings::is_configured();
    }

    /**
     * @return bool
     */
    public function is_disabled() {
        return !SplitSMS_Settings::is_configured();
    }

    /**
     * @return array<string, string>
     */
    public function editor_labels() {
        return array(
            'sms_to' => __('Send to:', 'splitsms'),
            'phone_field' => __('Phone field:', 'splitsms'),
            'custom_phone' => __('Custom phone:', 'splitsms'),
            'message' => __('Message:', 'splitsms'),
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
            'message' => array(
                'default' => __('Hi %field_name%, thanks for your submission at {site_name}.', 'splitsms'),
            ),
        );
    }

    /**
     * @param array<string, mixed> $request
     * @param \Jet_Form_Builder\Actions\Action_Handler $handler
     */
    public function do_action(array $request, \Jet_Form_Builder\Actions\Action_Handler $handler) {
        unset($handler);

        $phone = $this->resolve_phone($request);
        if ('' === trim($phone)) {
            throw new \Jet_Form_Builder\Exceptions\Action_Exception(
                'failed',
                esc_html__('SplitSMS: phone number is empty.', 'splitsms')
            );
        }

        $message = $this->render_message($request);
        if ('' === trim($message)) {
            throw new \Jet_Form_Builder\Exceptions\Action_Exception(
                'failed',
                esc_html__('SplitSMS: message is empty.', 'splitsms')
            );
        }

        $form_id = 0;
        if (function_exists('jet_fb_handler') && is_object(jet_fb_handler())) {
            $form_id = (int) jet_fb_handler()->form_id;
        }

        SplitSMS_JetFormBuilder::note_action_sent($form_id);

        $api = new SplitSMS_API(SplitSMS_Settings::instance());
        $result = $api->send_sms(
            $phone,
            $message,
            array(
                'source' => 'JetFormBuilder',
                'event' => 'jfb_action',
                'external_ref' => $form_id ? 'jfb:' . $form_id : null,
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
     * @param array<string, mixed> $request
     * @return string
     */
    private function resolve_phone(array $request) {
        $sms_to = isset($this->settings['sms_to']) ? sanitize_key($this->settings['sms_to']) : 'form';

        if ('admin' === $sms_to) {
            $settings = SplitSMS_Settings::instance();
            $phone = $settings->get('cb_admin_phone');
            if ('' === trim((string) $phone)) {
                $phone = $settings->get('admin_phone');
            }
            return preg_replace('/\s+/', '', (string) $phone);
        }

        if ('custom' === $sms_to) {
            $raw = isset($this->settings['custom_phone']) ? (string) $this->settings['custom_phone'] : '';
            return preg_replace('/\s+/', '', $this->rich_content($raw, $request));
        }

        $field = isset($this->settings['phone_field']) ? sanitize_key($this->settings['phone_field']) : 'phone';
        if ('' === $field) {
            $field = 'phone';
        }

        $value = '';
        if (function_exists('jet_fb_context')) {
            $value = jet_fb_context()->get_value($field);
        }
        if ('' === trim((string) $value) && isset($request[$field])) {
            $value = $request[$field];
        }

        return preg_replace('/\s+/', '', (string) $value);
    }

    /**
     * @param array<string, mixed> $request
     * @return string
     */
    private function render_message(array $request) {
        $template = isset($this->settings['message']) ? (string) $this->settings['message'] : '';
        $rendered = $this->rich_content($template, $request);
        $vars = SplitSMS_JetFormBuilder::normalize_request_vars($request);
        $vars['site_name'] = get_bloginfo('name');

        return SplitSMS_API::render_template($rendered, $vars);
    }

    /**
     * @param string               $content
     * @param array<string, mixed> $request
     * @return string
     */
    private function rich_content($content, array $request) {
        if (class_exists('JFB_Modules\Rich_Content\Module')) {
            return (string) \JFB_Modules\Rich_Content\Module::rich($content);
        }

        $vars = SplitSMS_JetFormBuilder::normalize_request_vars($request);
        return SplitSMS_API::render_template($content, $vars);
    }
}
