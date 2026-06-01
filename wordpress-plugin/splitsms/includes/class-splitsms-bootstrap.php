<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Safe plugin boot — only load integrations when their dependencies exist.
 */
class SplitSMS_Bootstrap {

    /**
     * Core services (admin, logger, settings).
     */
    public static function init() {
        if (!class_exists('SplitSMS_Settings')) {
            return;
        }

        SplitSMS_Settings::instance();
        SplitSMS_Logger::instance();

        if (is_admin()) {
            SplitSMS_Admin::instance();
            SplitSMS_Plugin_Status::register_admin_notices();
        }

        SplitSMS_Reminders::register_cron_hooks();
        self::register_form_builders();

        if (SplitSMS_Settings::is_configured()) {
            self::register_event_integrations();
        }
    }

    /**
     * Form builder actions (work before API key is saved).
     */
    public static function register_form_builders() {
        add_action('elementor_pro/init', array(__CLASS__, 'boot_elementor'), 5);
        add_action('plugins_loaded', array(__CLASS__, 'boot_jet_forms'), 25);
    }

    public static function boot_elementor() {
        if (!defined('ELEMENTOR_PRO_VERSION') || !class_exists('SplitSMS_Elementor')) {
            return;
        }
        SplitSMS_Elementor::instance();
    }

    public static function boot_jet_forms() {
        if (class_exists('SplitSMS_JetFormBuilder')) {
            SplitSMS_JetFormBuilder::instance();
        }
        if (defined('JET_ENGINE_VERSION') && class_exists('SplitSMS_JetEngine_Forms')) {
            SplitSMS_JetEngine_Forms::instance();
        }
    }

    /**
     * WooCommerce, CF7, WPForms, Crocoblock event hooks (requires API key).
     */
    public static function register_event_integrations() {
        if (class_exists('WooCommerce') && class_exists('SplitSMS_WooCommerce')) {
            SplitSMS_WooCommerce::instance();
        }
        if (class_exists('SplitSMS_WordPress')) {
            SplitSMS_WordPress::instance();
        }
        if (self::is_cf7_active() && class_exists('SplitSMS_CF7')) {
            SplitSMS_CF7::instance();
        }
        if (self::is_wpforms_active() && class_exists('SplitSMS_WPForms')) {
            SplitSMS_WPForms::instance();
        }
        if (defined('JET_ENGINE_VERSION')) {
            if (class_exists('SplitSMS_JetEngine')) {
                SplitSMS_JetEngine::instance();
            }
            if (class_exists('SplitSMS_JetBooking')) {
                SplitSMS_JetBooking::instance();
            }
            if (class_exists('SplitSMS_JetAppointment')) {
                SplitSMS_JetAppointment::instance();
            }
        }
    }

    /**
     * @return bool
     */
    public static function is_cf7_active() {
        return class_exists('WPCF7') || class_exists('WPCF7_ContactForm') || function_exists('wpcf7');
    }

    /**
     * @return bool
     */
    public static function is_wpforms_active() {
        return function_exists('wpforms') || class_exists('WPForms');
    }

    /**
     * Load an optional PHP file only when readable (never fatal).
     *
     * @param string $relative Path under plugin root.
     * @return bool
     */
    public static function require_file($relative) {
        $path = SPLITSMS_PLUGIN_DIR . ltrim($relative, '/');
        if (!is_readable($path)) {
            return false;
        }
        require_once $path;
        return true;
    }
}
