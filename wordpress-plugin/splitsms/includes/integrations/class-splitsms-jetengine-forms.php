<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetEngine legacy forms (JetEngine → Forms) — SplitSMS Notification type.
 *
 * @see https://crocoblock.com/knowledge-base/jetengine/how-to-create-a-booking-form-layout/
 */
class SplitSMS_JetEngine_Forms {

    /** @var self|null */
    private static $instance = null;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        if (!defined('JET_ENGINE_VERSION')) {
            return;
        }

        add_filter('jet-engine/forms/booking/notification-types', array($this, 'register_notification_type'), 20);
        add_action('jet-engine/forms/booking/notification/splitsms_send_sms', array($this, 'handle_notification'), 10, 2);
        add_action('jet-engine/forms/booking/notifications/fields-after', array($this, 'render_editor_fields'));
        add_action('jet-engine/forms/editor/assets', array($this, 'enqueue_editor_assets'), 20);
    }

    /**
     * @param array<string, string> $types
     * @return array<string, string>
     */
    public function register_notification_type($types) {
        $types['splitsms_send_sms'] = __('SplitSMS Notification', 'splitsms');
        return $types;
    }

    /**
     * @param array<string, mixed>                    $notification
     * @param Jet_Engine_Booking_Forms_Notifications $handler
     */
    public function handle_notification($notification, $handler) {
        if (!is_object($handler) || !isset($handler->data) || !is_array($handler->data)) {
            return;
        }

        $form_id = isset($handler->form) ? (int) $handler->form : 0;
        $macro = array($handler, 'parse_macros');

        $result = SplitSMS_Form_Sms_Helper::dispatch(
            $notification,
            $handler->data,
            array(
                'form_id' => $form_id,
                'source' => 'JetEngine Forms',
                'event' => 'jetengine_form_sms',
                'macro_parser' => $macro,
                'on_error' => function ($message) use ($handler) {
                    if (is_object($handler) && method_exists($handler, 'set_specific_status')) {
                        $handler->set_specific_status((string) $message);
                    }
                },
            )
        );

        if (empty($result['ok']) && is_object($handler) && method_exists($handler, 'log')) {
            $handler->log[] = false;
            return;
        }

        if (is_object($handler) && property_exists($handler, 'log')) {
            $handler->log[] = true;
        }
    }

    /**
     * Vue editor fields in JetEngine → Forms → Notifications Settings.
     */
    public function render_editor_fields() {
        include SPLITSMS_PLUGIN_DIR . 'admin/views/jetengine-forms-notification-fields.php';
    }

    /**
     * Default values when the notification type is selected in the form builder.
     *
     * @param object $editor JetEngine forms editor instance.
     */
    public function enqueue_editor_assets($editor) {
        unset($editor);

        if (!wp_script_is('jet-engine-forms', 'enqueued')) {
            return;
        }

        $defaults = wp_json_encode(array(
            'sms_to' => 'form',
            'phone_field' => 'phone',
            'custom_phone' => '',
            'country_code_field' => '',
            'message' => __('Hi %name%, thanks for your submission at {site_name}.', 'splitsms'),
            'sender_id' => '',
            'send_admin_copy' => '',
            'admin_message' => __('New form submission from %name% on {site_name}.', 'splitsms'),
        ));

        $configured = SplitSMS_Settings::is_configured() ? 'true' : 'false';

        wp_add_inline_script(
            'jet-engine-forms',
            "(function(){if(!window.JetEngineFormSettings){return;}window.JetEngineFormSettings.splitsms_defaults={$defaults};window.JetEngineFormSettings.splitsms_configured={$configured};})();",
            'before'
        );
    }
}
