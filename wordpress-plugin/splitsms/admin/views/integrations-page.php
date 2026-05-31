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
    'gateway' => __('Payments', 'splitsms'),
    'forms' => __('Forms', 'splitsms'),
    'crocoblock' => __('Crocoblock', 'splitsms'),
);

$nav_sections = array();
if (!empty($registry['woocommerce']['active'])) {
    $nav_sections['splitsms-section-woo'] = array(
        'label' => __('WooCommerce', 'splitsms'),
        'icon' => 'dashicons-cart',
    );
}
if (SplitSMS_Paystack::is_gateway_present() || SplitSMS_Paystack::is_plugin_active()) {
    $nav_sections['splitsms-section-paystack'] = array(
        'label' => __('Paystack', 'splitsms'),
        'icon' => 'dashicons-money-alt',
    );
}
if (!empty($registry['cf7']['active']) || !empty($registry['wpforms']['active']) || !empty($registry['elementor']['active'])) {
    $nav_sections['splitsms-section-forms'] = array(
        'label' => __('Form plugins', 'splitsms'),
        'icon' => 'dashicons-feedback',
    );
}
$nav_sections['splitsms-section-wp'] = array(
    'label' => __('WordPress', 'splitsms'),
    'icon' => 'dashicons-wordpress',
);
$nav_sections['splitsms-section-more'] = array(
    'label' => __('Crocoblock', 'splitsms'),
    'icon' => 'dashicons-admin-plugins',
);

$has_form_plugins = !empty($registry['cf7']['active']) || !empty($registry['wpforms']['active']) || !empty($registry['elementor']['active']);
$configured = SplitSMS_Settings::is_configured();

$status_cards = array();
if (!empty($registry['woocommerce']['active'])) {
    $status_cards[] = array(
        'anchor' => 'splitsms-section-woo',
        'label' => __('WooCommerce', 'splitsms'),
        'icon' => 'dashicons-cart',
        'enabled' => SplitSMS_Settings::is_yes($s['wc_enabled']),
        'detail' => SplitSMS_Settings::is_yes($s['wc_enabled'])
            ? __('Store SMS active', 'splitsms')
            : __('Turn on below', 'splitsms'),
    );
}
if (!empty($registry['cf7']['active'])) {
    $status_cards[] = array(
        'anchor' => 'splitsms-section-forms',
        'label' => 'Contact Form 7',
        'icon' => 'dashicons-email',
        'enabled' => SplitSMS_Settings::is_yes($s['cf7_enabled']),
        'detail' => SplitSMS_Settings::is_yes($s['cf7_enabled']) ? __('Form SMS active', 'splitsms') : __('Off', 'splitsms'),
    );
}
if (!empty($registry['wpforms']['active'])) {
    $status_cards[] = array(
        'anchor' => 'splitsms-section-forms',
        'label' => 'WPForms',
        'icon' => 'dashicons-forms',
        'enabled' => SplitSMS_Settings::is_yes($s['wpforms_enabled']),
        'detail' => SplitSMS_Settings::is_yes($s['wpforms_enabled']) ? __('Form SMS active', 'splitsms') : __('Off', 'splitsms'),
    );
}
if (!empty($registry['elementor']['active'])) {
    $status_cards[] = array(
        'anchor' => 'splitsms-section-forms',
        'label' => 'Elementor Pro',
        'icon' => 'dashicons-layout',
        'enabled' => SplitSMS_Settings::is_yes($s['elementor_enabled']),
        'detail' => SplitSMS_Settings::is_yes($s['elementor_enabled']) ? __('Form SMS active', 'splitsms') : __('Off', 'splitsms'),
    );
}
$status_cards[] = array(
    'anchor' => 'splitsms-section-wp',
    'label' => __('WordPress', 'splitsms'),
    'icon' => 'dashicons-admin-users',
    'enabled' => SplitSMS_Settings::is_yes($s['wp_enabled']),
    'detail' => SplitSMS_Settings::is_yes($s['wp_enabled']) ? __('Core SMS active', 'splitsms') : __('Off', 'splitsms'),
);

$enabled_count = count(array_filter($status_cards, static function ($card) {
    return !empty($card['enabled']);
}));
$active_plugins = count(array_filter($registry, static function ($item) {
    return !empty($item['active']);
}));
?>

<div class="splitsms-integrations-page">

<?php if ($updated) : ?>
    <div class="notice notice-success is-dismissible"><p><?php esc_html_e('Integrations saved.', 'splitsms'); ?></p></div>
<?php endif; ?>

<?php if ($has_form_plugins) : ?>
    <div class="splitsms-card splitsms-forms-promo" style="margin-bottom:1rem;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div>
            <strong><?php esc_html_e('Manage forms in one place', 'splitsms'); ?></strong>
            <p class="description" style="margin:0.25rem 0 0;">
                <?php esc_html_e('SplitSMS → Forms lists every Elementor and Crocoblock form with per-form toggles and custom messages.', 'splitsms'); ?>
            </p>
        </div>
        <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-forms')); ?>">
            <?php esc_html_e('Open Forms manager', 'splitsms'); ?>
        </a>
    </div>
<?php endif; ?>

<div class="splitsms-intel-grid">
    <section class="splitsms-card splitsms-intel-summary">
        <div class="splitsms-intel-summary__head">
            <div>
                <h2><?php esc_html_e('Integration overview', 'splitsms'); ?></h2>
                <p class="description">
                    <?php
                    printf(
                        /* translators: 1: enabled integrations 2: total integrations */
                        esc_html__('%1$d of %2$d channels enabled · %3$d plugins detected on this site', 'splitsms'),
                        (int) $enabled_count,
                        count($status_cards),
                        (int) $active_plugins
                    );
                    ?>
                </p>
            </div>
            <?php if (!$configured) : ?>
                <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>">
                    <?php esc_html_e('Connect API', 'splitsms'); ?>
                </a>
            <?php else : ?>
                <span class="splitsms-intel-pill splitsms-intel-pill--ok">
                    <span class="splitsms-status-light splitsms-status-light--ok" aria-hidden="true"></span>
                    <?php esc_html_e('API connected', 'splitsms'); ?>
                </span>
            <?php endif; ?>
        </div>

        <?php if (!$configured) : ?>
            <div class="splitsms-notice-inline splitsms-notice-inline--warn">
                <?php
                printf(
                    esc_html__('Connect your API key in %s before SMS can send.', 'splitsms'),
                    '<a href="' . esc_url(admin_url('admin.php?page=splitsms-settings')) . '">' . esc_html__('Settings', 'splitsms') . '</a>'
                );
                ?>
            </div>
        <?php endif; ?>

        <div class="splitsms-intel-cards">
            <?php foreach ($status_cards as $card) : ?>
                <a href="#<?php echo esc_attr($card['anchor']); ?>" class="splitsms-intel-card <?php echo !empty($card['enabled']) ? 'is-enabled' : 'is-disabled'; ?>">
                    <span class="splitsms-intel-card__icon dashicons <?php echo esc_attr($card['icon']); ?>" aria-hidden="true"></span>
                    <span class="splitsms-intel-card__body">
                        <strong><?php echo esc_html($card['label']); ?></strong>
                        <span><?php echo esc_html($card['detail']); ?></span>
                    </span>
                    <span class="splitsms-intel-card__dot" aria-hidden="true"></span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="splitsms-card splitsms-intel-detect">
        <h2><?php esc_html_e('Detected plugins', 'splitsms'); ?></h2>
        <p class="description"><?php esc_html_e('Green = installed and active on this site.', 'splitsms'); ?></p>
        <div class="splitsms-detect-grid">
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
                <div class="splitsms-detect-grid__group">
                    <span class="splitsms-detect-grid__label"><?php echo esc_html($group_label); ?></span>
                    <ul class="splitsms-detect-grid__list">
                        <?php foreach ($group_items as $slug => $item) : ?>
                            <li class="<?php echo $item['active'] ? 'is-active' : 'is-inactive'; ?>" title="<?php echo esc_attr($item['note']); ?>">
                                <span class="splitsms-status-light splitsms-status-light--<?php echo $item['active'] ? 'ok' : 'pending'; ?>" aria-hidden="true"></span>
                                <?php echo esc_html($item['label']); ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endforeach; ?>
        </div>
        <p class="description splitsms-detect-grid__foot">
            <?php esc_html_e('Payment gateways trigger SMS through WooCommerce when an order is marked paid.', 'splitsms'); ?>
        </p>
    </section>
</div>

<?php if (!empty($nav_sections)) : ?>
    <nav class="splitsms-section-nav" aria-label="<?php esc_attr_e('Integration sections', 'splitsms'); ?>">
        <?php foreach ($nav_sections as $anchor => $meta) : ?>
            <a href="#<?php echo esc_attr($anchor); ?>" data-section="<?php echo esc_attr($anchor); ?>">
                <span class="dashicons <?php echo esc_attr($meta['icon']); ?>" aria-hidden="true"></span>
                <?php echo esc_html($meta['label']); ?>
            </a>
        <?php endforeach; ?>
    </nav>
<?php endif; ?>

<form method="post" action="<?php echo esc_url(admin_url('admin.php?page=splitsms-integrations')); ?>" class="splitsms-integrations-form">
    <?php wp_nonce_field('splitsms_settings'); ?>
    <input type="hidden" name="splitsms_save" value="1" />
    <input type="hidden" name="splitsms_form_scope" value="integrations" />

    <?php if (!empty($registry['woocommerce']['active'])) : ?>
        <div id="splitsms-section-woo" class="splitsms-form-section" data-section-label="<?php esc_attr_e('WooCommerce', 'splitsms'); ?>">
            <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/woocommerce-panel.php'; ?>
        </div>
    <?php endif; ?>

    <?php if (SplitSMS_Paystack::is_gateway_present() || SplitSMS_Paystack::is_plugin_active()) : ?>
        <div id="splitsms-section-paystack" class="splitsms-form-section" data-section-label="<?php esc_attr_e('Paystack', 'splitsms'); ?>">
            <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/paystack-panel.php'; ?>
        </div>
    <?php endif; ?>

    <?php if ($has_form_plugins) : ?>
        <div id="splitsms-section-forms" class="splitsms-form-section" data-section-label="<?php esc_attr_e('Form plugins', 'splitsms'); ?>">
            <div class="splitsms-form-section__banner">
                <span class="dashicons dashicons-feedback" aria-hidden="true"></span>
                <div>
                    <h2><?php esc_html_e('Form plugins', 'splitsms'); ?></h2>
                    <p class="description"><?php esc_html_e('SMS after successful submissions — each plugin has its own phone field and template.', 'splitsms'); ?></p>
                </div>
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

    <div id="splitsms-section-wp" class="splitsms-form-section" data-section-label="<?php esc_attr_e('WordPress', 'splitsms'); ?>">
        <?php include SPLITSMS_PLUGIN_DIR . 'admin/views/wordpress-core-panel.php'; ?>
    </div>

    <div id="splitsms-section-more" class="splitsms-form-section" data-section-label="<?php esc_attr_e('Crocoblock', 'splitsms'); ?>">
        <section class="splitsms-card splitsms-card--accent splitsms-crocoblock-cta">
            <div class="splitsms-crocoblock-cta__inner">
                <span class="dashicons dashicons-admin-plugins splitsms-crocoblock-cta__icon" aria-hidden="true"></span>
                <div>
                    <h2><?php esc_html_e('Crocoblock', 'splitsms'); ?></h2>
                    <p class="description">
                        <?php esc_html_e('JetFormBuilder, JetEngine, JetBooking, and JetAppointment — configure SMS actions and templates on the Crocoblock page.', 'splitsms'); ?>
                    </p>
                    <a class="button button-secondary" href="<?php echo esc_url(admin_url('admin.php?page=splitsms-crocoblock')); ?>">
                        <?php esc_html_e('Open Crocoblock settings', 'splitsms'); ?>
                    </a>
                </div>
            </div>
        </section>
    </div>

    <div class="splitsms-save-bar">
        <p class="splitsms-save-bar__hint"><?php esc_html_e('All integration settings save together.', 'splitsms'); ?></p>
        <?php submit_button(__('Save integrations', 'splitsms'), 'primary', 'submit', false); ?>
    </div>
</form>

</div>
