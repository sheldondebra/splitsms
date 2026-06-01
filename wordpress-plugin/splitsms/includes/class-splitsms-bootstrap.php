<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Safe plugin boot — core always loads; integrations load only when needed.
 */
class SplitSMS_Bootstrap {

    /** @var bool */
    private static $booted = false;

    /** @var string|null */
    private static $boot_error = null;

    /**
     * Core services (admin, logger, settings).
     */
    public static function init() {
        if (self::$booted) {
            return;
        }

        if (!class_exists('SplitSMS_Settings')) {
            return;
        }

        try {
            self::init_core();
            self::$booted = true;
        } catch (Throwable $e) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
            self::$boot_error = $e->getMessage();
            if (defined('WP_DEBUG') && WP_DEBUG) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
                error_log('SplitSMS bootstrap failed: ' . $e->getMessage());
            }
            add_action('admin_notices', array(__CLASS__, 'render_boot_error_notice'));
        }
    }

    /**
     * @return void
     */
    private static function init_core() {
        SplitSMS_Settings::instance();
        SplitSMS_Logger::instance();

        if (is_admin()) {
            self::require_file('includes/class-splitsms-integrations-registry.php');
            self::require_file('includes/class-splitsms-forms-registry.php');
            self::require_file('includes/class-splitsms-forms-manager.php');
            self::require_file('includes/class-splitsms-paystack.php');
            self::require_file('admin/class-splitsms-admin.php');
            SplitSMS_Admin::instance();
            SplitSMS_Plugin_Status::register_admin_notices();
        }

        SplitSMS_Reminders::register_cron_hooks();
        self::register_form_builders();

        if (SplitSMS_Settings::is_configured()) {
            self::register_event_integrations();
        }
    }

    public static function render_boot_error_notice() {
        if (!current_user_can('manage_options') || !self::$boot_error) {
            return;
        }
        echo '<div class="notice notice-error"><p>';
        echo esc_html(
            sprintf(
                /* translators: %s: error message */
                __('SplitSMS could not start: %s. Deactivate and reinstall v%2$s from splitsms.com.', 'splitsms'),
                self::$boot_error,
                defined('SPLITSMS_VERSION') ? SPLITSMS_VERSION : ''
            )
        );
        echo '</p></div>';
    }

    /**
     * Form builder actions (available before API key is saved).
     */
    public static function register_form_builders() {
        add_action('elementor_pro/init', array(__CLASS__, 'boot_elementor'), 5);
        self::boot_jet_forms();
    }

    public static function boot_elementor() {
        if (!defined('ELEMENTOR_PRO_VERSION')) {
            return;
        }
        if (!self::require_file('includes/integrations/class-splitsms-elementor.php')) {
            return;
        }
        SplitSMS_Elementor::instance();
    }

    public static function boot_jet_forms() {
        self::require_file('includes/integrations/class-splitsms-crocoblock.php');

        if (defined('JET_FORM_BUILDER_VERSION') && self::require_file('includes/integrations/class-splitsms-jetformbuilder.php')) {
            SplitSMS_JetFormBuilder::instance();
        }

        if (defined('JET_ENGINE_VERSION') && self::require_file('includes/integrations/class-splitsms-jetengine-forms.php')) {
            SplitSMS_JetEngine_Forms::instance();
        }
    }

    /**
     * WooCommerce, CF7, WPForms, Crocoblock event hooks (requires API key).
     */
    public static function register_event_integrations() {
        if (class_exists('WooCommerce', false) && self::require_file('includes/class-splitsms-woocommerce.php')) {
            SplitSMS_WooCommerce::instance();
        }

        if (self::require_file('includes/class-splitsms-wordpress.php')) {
            SplitSMS_WordPress::instance();
        }

        if (self::is_cf7_active() && self::require_file('includes/integrations/class-splitsms-cf7.php')) {
            SplitSMS_CF7::instance();
        }

        if (self::is_wpforms_active() && self::require_file('includes/integrations/class-splitsms-wpforms.php')) {
            SplitSMS_WPForms::instance();
        }

        if (defined('JET_ENGINE_VERSION')) {
            self::require_file('includes/integrations/class-splitsms-crocoblock.php');
            if (self::require_file('includes/integrations/class-splitsms-jetengine.php')) {
                SplitSMS_JetEngine::instance();
            }
            if (self::require_file('includes/integrations/class-splitsms-jetbooking.php')) {
                SplitSMS_JetBooking::instance();
            }
            if (self::require_file('includes/integrations/class-splitsms-jetappointment.php')) {
                SplitSMS_JetAppointment::instance();
            }
        }
    }

    /**
     * @return bool
     */
    public static function is_cf7_active() {
        return class_exists('WPCF7', false) || class_exists('WPCF7_ContactForm', false) || function_exists('wpcf7');
    }

    /**
     * @return bool
     */
    public static function is_wpforms_active() {
        return function_exists('wpforms') || class_exists('WPForms', false);
    }

    /**
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
