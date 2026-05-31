<?php
/**
 * Integrations admin page layout.
 *
 * @var array<string, mixed> $s
 * @var array<string, array{label:string, active:bool, group:string, note:string}> $registry
 * @var bool $updated
 */

if (!defined('ABSPATH')) {
    exit;
}

$detect_groups = array(
    'store' => __('Store', 'splitsms'),
    'gateway' => __('Payment gateways', 'splitsms'),
    'forms' => __('Forms', 'splitsms'),
    'crocoblock' => __('Crocoblock', 'splitsms'),
);

$nav_sections = array();
if (!empty($registry['woocommerce']['active'])) {
    $nav_sections['splitsms-section-woo'] = __('WooCommerce', 'splitsms');
}
if (SplitSMS_Paystack::is_gateway_present() || SplitSMS_Paystack::is_plugin_active()) {
    $nav_sections['splitsms-section-paystack'] = __('Paystack', 'splitsms');
}
if (!empty($registry['cf7']['active']) || !empty($registry['wpforms']['active']) || !empty($registry['elementor']['active'])) {
    $nav_sections['splitsms-section-forms'] = __('Form plugins', 'splitsms');
}
$nav_sections['splitsms-section-wp'] = __('WordPress', 'splitsms');
$nav_sections['splitsms-section-more'] = __('More', 'splitsms');

$has_form_plugins = !empty($registry['cf7']['active']) || !empty($registry['wpforms']['active']) || !empty($registry['elementor']['active']);
?>

<?php if ($updated) : ?>
    <div class="notice notice-success is-dismissible"><p><?php esc_html_e('Integrations saved.', 'splitsms'); ?></p></div>
<?php endif; ?>

<div class="splitsms-integrations-intro">
    <p class="description">
        <?php esc_html_e('Enable SMS for your store, forms, and WordPress events. Each section below is independent — save once at the bottom.', 'splitsms'); ?>
    </p>
    <?php if (!SplitSMS_Settings::is_configured()) : ?>
        <div class="splitsms-notice-inline splitsms-notice-inline--warn">
            <?php
            printf(
                /* translators: %s: settings page URL */
                esc_html__('Connect your API key in %s before SMS can send.', 'splitsms'),
                '<a href="' . esc_url(admin_url('admin.php?page=splitsms-settings')) . '">' . esc_html__('Settings', 'splitsms') . '</a>'
            );
            ?>
        </div>
    <?php endif; ?>
</div>

<div class="splitsms-card splitsms-detect-panel splitsms-detect-panel--compact">
    <div class="splitsms-detect-panel__head">
        <h2><?php esc_html_e('Detected on this site', 'splitsms'); ?></h2>
        <p class="description">
            <?php esc_html_e('Green = plugin active. Configure matching sections below.', 'splitsms'); ?>
        </p>
    </div>
    <div class="splitsms-detect-groups">
        <?php foreach ($detect_groups as $group_key => $group_label) : ?>
            <?php
            $group_items = array_filter(
                $registry,
                static function ($item) use ($group_key) {
                    return isset($item['group']) && $item['group'] === $group_key;
                }
            );
            if (empty($group_items)) {
                continue;
            }
            ?>
            <div class="splitsms-detect-group">
                <span class="splitsms-detect-group__label"><?php echo esc_html($group_label); ?></span>
                <div class="splitsms-detect-chips">
                    <?php foreach ($group_items as $item) : ?>
                        <span class="splitsms-chip <?php echo $item['active'] ? 'is-active' : 'is-inactive'; ?>" title="<?php echo esc_attr($item['note']); ?>">
                            <span class="splitsms-chip__dot" aria-hidden="true"></span>
                            <?php echo esc_html($item['label']); ?>
                        </span>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <p class="description splitsms-detect-panel__foot">
        <?php esc_html_e('Paystack, Flutterwave, and Stripe connect through WooCommerce — SplitSMS sends SMS when the order is marked paid.', 'splitsms'); ?>
    </p>
</div>

<?php if (!empty($nav_sections)) : ?>
    <nav class="splitsms-section-nav" aria-label="<?php esc_attr_e('Integration sections', 'splitsms'); ?>">
        <?php foreach ($nav_sections as $anchor => $label) : ?>
            <a href="#<?php echo esc_attr($anchor); ?>"><?php echo esc_html($label); ?></a>
        <?php endforeach; ?>
    </nav>
<?php endif; ?>

<form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>" class="splitsms-integrations-form">
    <?php wp_nonce_field('splitsms_settings'); ?>
    <input type="hidden" name="splitsms_save" value="1" />
    <input type="hidden" name="splitsms_form_scope" value="integrations" />

    <?php if (!empty($registry['woocommerce']['active'])) : ?>
        <div id="splitsms-section-woo" class="splitsms-form-section">
            <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/woocommerce-panel.php'; ?>
        </div>
    <?php endif; ?>

    <?php if (SplitSMS_Paystack::is_gateway_present() || SplitSMS_Paystack::is_plugin_active()) : ?>
        <div id="splitsms-section-paystack" class="splitsms-form-section">
            <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/paystack-panel.php'; ?>
        </div>
    <?php endif; ?>

    <?php if ($has_form_plugins) : ?>
        <div id="splitsms-section-forms" class="splitsms-form-section">
            <div class="splitsms-form-section__head">
                <h2><?php esc_html_e('Form plugins', 'splitsms'); ?></h2>
                <p class="description"><?php esc_html_e('Send SMS after a successful form submission. Each plugin has its own phone field and message template.', 'splitsms'); ?></p>
            </div>
            <div class="splitsms-form-section__stack">
                <?php if (!empty($registry['cf7']['active'])) : ?>
                    <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/cf7-panel.php'; ?>
                <?php endif; ?>
                <?php if (!empty($registry['wpforms']['active'])) : ?>
                    <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/wpforms-panel.php'; ?>
                <?php endif; ?>
                <?php if (!empty($registry['elementor']['active'])) : ?>
                    <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/elementor-panel.php'; ?>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>

    <div id="splitsms-section-wp" class="splitsms-form-section">
        <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/wordpress-core-panel.php'; ?>
    </div>

    <div id="splitsms-section-more" class="splitsms-form-section">
        <section class="splitsms-card splitsms-card--accent splitsms-crocoblock-cta">
            <h2><?php esc_html_e('Crocoblock (JetEngine, JetFormBuilder, JetBooking, JetAppointment)', 'splitsms'); ?></h2>
            <p class="description">
                <?php esc_html_e('JetFormBuilder forms use the native “Send SMS (SplitSMS)” post-submit action. Other Jet plugins are configured on the Crocoblock page.', 'splitsms'); ?>
            </p>
            <p>
                <a class="button button-secondary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-crocoblock')); ?>">
                    <?php esc_html_e('Open Crocoblock settings', 'splitsms'); ?>
                </a>
            </p>
        </section>
    </div>

    <div class="splitsms-save-bar">
        <?php submit_button(__('Save integrations', 'splitsms'), 'primary', 'submit', false); ?>
    </div>
</form>
