<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * JetEngine custom post type SMS triggers.
 */
class SplitSMS_JetEngine {
    /** @var self|null */
    private static $instance = null;

    /** @var SplitSMS_Crocoblock */
    private $cb;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $detected = SplitSMS_Crocoblock::detect_plugins();
        if (empty($detected['jetengine'])) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        if (!$settings->feature_enabled('cb_jetengine_enabled')) {
            return;
        }

        $this->cb = SplitSMS_Crocoblock::instance();

        add_action('save_post', array($this, 'on_save_post'), 30, 3);
        add_action('transition_post_status', array($this, 'on_status_change'), 30, 3);
    }

    /**
     * @param int     $post_id
     * @param WP_Post $post
     * @param bool    $update
     */
    public function on_save_post($post_id, $post, $update) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        if (!$this->is_target_post_type($post->post_type)) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        if ($update && !$settings->feature_enabled('cb_jetengine_on_update')) {
            return;
        }
        if (!$update && !$settings->feature_enabled('cb_jetengine_on_create')) {
            return;
        }

        $vars = $this->post_vars($post_id);
        $event = $update ? 'post_updated' : 'post_created';

        $this->cb->send_event(array(
            'integration' => 'jetengine',
            'event' => $event,
            'source' => 'JetEngine',
            'template' => $settings->get($update ? 'cb_jetengine_tpl_update' : 'cb_jetengine_tpl_created'),
            'vars' => $vars,
            'phone_field' => $settings->get('cb_phone_field', 'phone'),
        ));

        if ($settings->feature_enabled('cb_jetengine_admin_alert')) {
            $this->cb->send_event(array(
                'integration' => 'jetengine',
                'event' => $event . '_admin',
                'source' => 'JetEngine',
                'template' => $settings->get('cb_jetengine_tpl_admin'),
                'vars' => $vars,
                'admin_alert' => true,
            ));
        }
    }

    /**
     * @param string  $new_status
     * @param string  $old_status
     * @param WP_Post $post
     */
    public function on_status_change($new_status, $old_status, $post) {
        if ($new_status === $old_status || !$this->is_target_post_type($post->post_type)) {
            return;
        }

        $settings = SplitSMS_Settings::instance();
        if (!$settings->feature_enabled('cb_jetengine_on_status')) {
            return;
        }

        $vars = $this->post_vars($post->ID);
        $vars['status'] = $new_status;
        $vars['old_status'] = $old_status;

        $this->cb->send_event(array(
            'integration' => 'jetengine',
            'event' => 'status_' . $new_status,
            'source' => 'JetEngine',
            'template' => $settings->get('cb_jetengine_tpl_status'),
            'vars' => $vars,
            'phone_field' => $settings->get('cb_phone_field', 'phone'),
        ));
    }

    /**
     * @param string $post_type
     */
    private function is_target_post_type($post_type) {
        $settings = SplitSMS_Settings::instance();
        $list = $settings->get('cb_jetengine_post_types', '');
        if ('' === trim($list)) {
            return true;
        }

        $types = array_map('trim', explode(',', $list));
        return in_array($post_type, $types, true);
    }

    /**
     * @param int $post_id
     * @return array<string,string>
     */
    private function post_vars($post_id) {
        $post = get_post($post_id);
        $vars = array(
            'name' => '',
            'phone' => '',
            'email' => '',
            'title' => $post ? $post->post_title : '',
            'post_id' => (string) $post_id,
            'post_type' => $post ? $post->post_type : '',
            'status' => $post ? $post->post_status : '',
        );

        $meta = get_post_meta($post_id);
        foreach ($meta as $key => $values) {
            if (isset($values[0]) && is_scalar($values[0])) {
                $vars[$key] = (string) $values[0];
            }
        }

        if (isset($vars['customer_name'])) {
            $vars['name'] = $vars['customer_name'];
        } elseif (isset($vars['client_name'])) {
            $vars['name'] = $vars['client_name'];
        }

        return $vars;
    }
}
