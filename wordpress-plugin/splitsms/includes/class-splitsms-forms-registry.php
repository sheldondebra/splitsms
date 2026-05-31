<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Discovers forms from Elementor, Crocoblock, CF7, WPForms, etc.
 */
class SplitSMS_Forms_Registry {
    const CACHE_KEY = 'splitsms_forms_discovered';
    const CACHE_TTL = 300;

    /** @var array<string, array{label:string, group:string, color:string}> */
    public static function source_meta() {
        return array(
            'cf7' => array(
                'label' => __('Contact Form 7', 'splitsms'),
                'group' => 'forms',
                'color' => 'cf7',
            ),
            'wpforms' => array(
                'label' => 'WPForms',
                'group' => 'forms',
                'color' => 'wpforms',
            ),
            'elementor' => array(
                'label' => __('Elementor Pro', 'splitsms'),
                'group' => 'elementor',
                'color' => 'elementor',
            ),
            'jfb' => array(
                'label' => 'JetFormBuilder',
                'group' => 'crocoblock',
                'color' => 'jfb',
            ),
            'jetengine_form' => array(
                'label' => __('JetEngine Forms', 'splitsms'),
                'group' => 'crocoblock',
                'color' => 'jetengine',
            ),
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function discover($force_refresh = false) {
        if (!$force_refresh) {
            $cached = get_transient(self::CACHE_KEY);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $forms = array();
        $forms = array_merge($forms, self::discover_cf7());
        $forms = array_merge($forms, self::discover_wpforms());
        $forms = array_merge($forms, self::discover_elementor());
        $forms = array_merge($forms, self::discover_jfb());
        $forms = array_merge($forms, self::discover_jetengine_forms());

        $forms = apply_filters('splitsms_discovered_forms', $forms);

        usort(
            $forms,
            static function ($a, $b) {
                $type = strcmp((string) ($a['source'] ?? ''), (string) ($b['source'] ?? ''));
                if (0 !== $type) {
                    return $type;
                }
                return strcasecmp((string) ($a['title'] ?? ''), (string) ($b['title'] ?? ''));
            }
        );

        set_transient(self::CACHE_KEY, $forms, self::CACHE_TTL);

        return $forms;
    }

    public static function clear_cache() {
        delete_transient(self::CACHE_KEY);
    }

    /**
     * @param string $source
     * @param string $id
     */
    public static function form_key($source, $id) {
        return sanitize_key($source) . ':' . sanitize_key((string) $id);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function discover_cf7() {
        if (!class_exists('SplitSMS_CF7') || !SplitSMS_CF7::is_active()) {
            return array();
        }

        $out = array();
        foreach (SplitSMS_CF7::list_forms() as $form) {
            $id = (string) $form['id'];
            $out[] = self::form_row(
                'cf7',
                $id,
                $form['title'],
                admin_url('admin.php?page=wpcf7&post=' . (int) $form['id'] . '&action=edit'),
                false,
                ''
            );
        }
        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function discover_wpforms() {
        if (!class_exists('SplitSMS_WPForms') || !SplitSMS_WPForms::is_active()) {
            return array();
        }

        $out = array();
        foreach (SplitSMS_WPForms::list_forms() as $form) {
            $id = (string) $form['id'];
            $out[] = self::form_row(
                'wpforms',
                $id,
                $form['title'],
                admin_url('admin.php?page=wpforms-builder&view=fields&form_id=' . (int) $form['id']),
                false,
                ''
            );
        }
        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function discover_elementor() {
        if (!defined('ELEMENTOR_PRO_VERSION')) {
            return array();
        }

        $post_types = apply_filters(
            'splitsms_elementor_scan_post_types',
            array('page', 'post', 'elementor_library')
        );

        $posts = get_posts(
            array(
                'post_type' => $post_types,
                'post_status' => array('publish', 'draft', 'private'),
                'posts_per_page' => 200,
                'meta_key' => '_elementor_data',
                'fields' => 'ids',
            )
        );

        $out = array();
        $seen = array();

        foreach ($posts as $post_id) {
            $raw = get_post_meta((int) $post_id, '_elementor_data', true);
            if (!is_string($raw) || '' === $raw) {
                continue;
            }
            $elements = json_decode($raw, true);
            if (!is_array($elements)) {
                continue;
            }

            $page_title = get_the_title((int) $post_id);
            self::walk_elementor_elements(
                $elements,
                (int) $post_id,
                $page_title,
                $out,
                $seen
            );
        }

        return $out;
    }

    /**
     * @param array<int, mixed>                    $elements
     * @param int                                  $post_id
     * @param string                               $page_title
     * @param array<int, array<string, mixed>>     $out
     * @param array<string, bool>                  $seen
     */
    private static function walk_elementor_elements($elements, $post_id, $page_title, &$out, &$seen) {
        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            $widget = isset($element['widgetType']) ? (string) $element['widgetType'] : '';
            if ('form' === $widget) {
                $settings = isset($element['settings']) && is_array($element['settings'])
                    ? $element['settings']
                    : array();
                $form_name = isset($settings['form_name']) ? (string) $settings['form_name'] : '';
                $element_id = isset($element['id']) ? (string) $element['id'] : '';
                $widget_id = $element_id !== '' ? $element_id : wp_generate_password(8, false);

                $dedupe = $post_id . ':' . $widget_id;
                if (isset($seen[$dedupe])) {
                    continue;
                }
                $seen[$dedupe] = true;

                $title = '' !== $form_name ? $form_name : sprintf(
                    /* translators: %s: page title */
                    __('Form on %s', 'splitsms'),
                    $page_title
                );

                $id = $post_id . '-' . $widget_id;
                $out[] = self::form_row(
                    'elementor',
                    $id,
                    $title,
                    admin_url('post.php?post=' . $post_id . '&action=elementor'),
                    false,
                    sprintf(
                        /* translators: 1: page title 2: widget id */
                        __('Embedded on “%1$s” (widget %2$s)', 'splitsms'),
                        $page_title,
                        $widget_id
                    )
                );
            }

            if (!empty($element['elements']) && is_array($element['elements'])) {
                self::walk_elementor_elements($element['elements'], $post_id, $page_title, $out, $seen);
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function discover_jfb() {
        if (!defined('JET_FORM_BUILDER_VERSION')) {
            return array();
        }

        $post_type = post_type_exists('jet-form-builder') ? 'jet-form-builder' : '';
        if ('' === $post_type) {
            return array();
        }

        $posts = get_posts(
            array(
                'post_type' => $post_type,
                'post_status' => array('publish', 'draft'),
                'posts_per_page' => 100,
                'orderby' => 'title',
                'order' => 'ASC',
            )
        );

        $out = array();
        foreach ($posts as $post) {
            $native = self::jfb_has_native_action((int) $post->ID);
            $out[] = self::form_row(
                'jfb',
                (string) $post->ID,
                $post->post_title,
                admin_url('admin.php?page=jet-form-builder-edit&post_id=' . (int) $post->ID),
                $native,
                $native
                    ? __('SplitSMS action configured in JetFormBuilder editor', 'splitsms')
                    : ''
            );
        }

        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function discover_jetengine_forms() {
        if (!defined('JET_ENGINE_VERSION')) {
            return array();
        }

        $raw = apply_filters('jet_engine/forms/booking/forms', null);
        if (!is_array($raw) || empty($raw)) {
            $raw = get_option('jet_engine_forms', array());
        }
        if (empty($raw) && post_type_exists('jet-engine-forms')) {
            $posts = get_posts(array(
                'post_type' => 'jet-engine-forms',
                'post_status' => array('publish', 'draft'),
                'numberposts' => 100,
                'orderby' => 'title',
                'order' => 'ASC',
            ));
            foreach ($posts as $post) {
                $raw[(string) $post->ID] = array(
                    'id' => (string) $post->ID,
                    'name' => $post->post_title,
                    'edit_link' => admin_url('admin.php?page=jet-engine-forms&subpage=edit&form=' . (int) $post->ID),
                );
            }
        }
        if (!is_array($raw)) {
            return array();
        }

        $out = array();
        foreach ($raw as $form_id => $form) {
            if (is_numeric($form_id) && is_string($form)) {
                $title = $form;
                $id = (string) $form_id;
                $native = false;
            } elseif (is_array($form)) {
                $id = isset($form['id']) ? (string) $form['id'] : (string) $form_id;
                $title = isset($form['name']) ? (string) $form['name'] : (isset($form['title']) ? (string) $form['title'] : sprintf(__('Form #%s', 'splitsms'), $id));
                $native = self::jetengine_form_has_native_sms($form);
            } else {
                continue;
            }

            $edit = admin_url('admin.php?page=jet-engine-forms&subpage=edit&form=' . rawurlencode($id));
            if (!empty($form['edit_link']) && is_string($form['edit_link'])) {
                $edit = $form['edit_link'];
            }

            $out[] = self::form_row(
                'jetengine_form',
                $id,
                $title,
                $edit,
                $native,
                $native
                    ? __('SplitSMS notification configured in JetEngine form editor', 'splitsms')
                    : __('JetEngine booking / legacy form', 'splitsms')
            );
        }

        return $out;
    }

    /**
     * @param string $source
     * @param string $id
     * @param string $title
     * @param string $edit_url
     * @param bool   $native_config
     * @param string $native_note
     * @return array<string, mixed>
     */
    private static function form_row($source, $id, $title, $edit_url, $native_config, $native_note) {
        $meta = isset(self::source_meta()[$source]) ? self::source_meta()[$source] : array(
            'label' => ucfirst($source),
            'group' => 'forms',
            'color' => 'default',
        );

        return array(
            'key' => self::form_key($source, $id),
            'source' => $source,
            'source_label' => $meta['label'],
            'source_group' => $meta['group'],
            'source_color' => $meta['color'],
            'id' => $id,
            'title' => $title,
            'edit_url' => $edit_url,
            'native_config' => (bool) $native_config,
            'native_note' => $native_note,
        );
    }

    /**
     * @param int $form_id
     */
    private static function jfb_has_native_action($form_id) {
        $meta = get_post_meta($form_id);
        if (!is_array($meta)) {
            return false;
        }
        foreach ($meta as $values) {
            if (!is_array($values)) {
                $values = array($values);
            }
            foreach ($values as $value) {
                if (is_string($value) && false !== strpos($value, 'splitsms_send_sms')) {
                    return true;
                }
                if (is_array($value) && wp_json_encode($value) && false !== strpos(wp_json_encode($value), 'splitsms_send_sms')) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param array<string, mixed> $form
     */
    private static function jetengine_form_has_native_sms($form) {
        if (!isset($form['notifications']) || !is_array($form['notifications'])) {
            return false;
        }
        foreach ($form['notifications'] as $notification) {
            if (!is_array($notification)) {
                continue;
            }
            $type = isset($notification['type']) ? (string) $notification['type'] : '';
            if ('splitsms_send_sms' === $type) {
                return true;
            }
        }
        return false;
    }
}
