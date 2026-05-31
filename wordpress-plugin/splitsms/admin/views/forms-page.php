<?php
/**
 * Forms manager — per-form SMS toggles and messages.
 *
 * @var array<int, array<string, mixed>> $forms
 * @var bool                              $configured
 * @var bool                              $updated
 * @var string                            $filter
 */

if (!defined('ABSPATH')) {
    exit;
}

$total = count($forms);
$enabled_count = count(array_filter($forms, static function ($f) {
    return !empty($f['enabled']);
}));
$native_count = count(array_filter($forms, static function ($f) {
    return !empty($f['native_config']);
}));

$filters = array(
    'all' => __('All forms', 'splitsms'),
    'elementor' => __('Elementor', 'splitsms'),
    'crocoblock' => __('Crocoblock', 'splitsms'),
    'forms' => __('Other plugins', 'splitsms'),
);

$vars_hint = '{name}, {phone}, {email}, {form_title}, {form_name}, {site_name}, {message}, {subject}';
?>

<div class="splitsms-forms-page">

<?php if ($updated) : ?>
    <div class="notice notice-success is-dismissible"><p><?php esc_html_e('Form SMS settings saved.', 'splitsms'); ?></p></div>
<?php endif; ?>

<?php if (!$configured) : ?>
    <div class="splitsms-notice-inline splitsms-notice-inline--warn">
        <?php esc_html_e('Connect your SplitSMS API key under Settings before SMS can send.', 'splitsms'); ?>
        <a href="<?php echo esc_url(admin_url('admin.php?page=splitsms-settings')); ?>"><?php esc_html_e('Go to Settings', 'splitsms'); ?></a>
    </div>
<?php endif; ?>

<div class="splitsms-forms-toolbar splitsms-card">
    <div class="splitsms-forms-toolbar__intro">
        <h2><?php esc_html_e('Forms on this site', 'splitsms'); ?></h2>
        <p class="description">
            <?php
            printf(
                /* translators: 1: total forms 2: enabled count */
                esc_html__('SplitSMS found %1$d forms. %2$d enabled for SMS.', 'splitsms'),
                (int) $total,
                (int) $enabled_count
            );
            ?>
        </p>
    </div>
    <div class="splitsms-forms-toolbar__actions">
        <button type="button" class="button" id="splitsms-refresh-forms">
            <span class="dashicons dashicons-update" aria-hidden="true"></span>
            <?php esc_html_e('Refresh list', 'splitsms'); ?>
        </button>
    </div>
</div>

<div class="splitsms-forms-filters" role="tablist" aria-label="<?php esc_attr_e('Filter forms', 'splitsms'); ?>">
    <?php foreach ($filters as $slug => $label) : ?>
        <button
            type="button"
            class="splitsms-forms-filter <?php echo $filter === $slug ? 'is-active' : ''; ?>"
            data-filter="<?php echo esc_attr($slug); ?>"
            role="tab"
            aria-selected="<?php echo $filter === $slug ? 'true' : 'false'; ?>"
        >
            <?php echo esc_html($label); ?>
        </button>
    <?php endforeach; ?>
</div>

<form method="post" action="" class="splitsms-forms-save-form">
    <?php wp_nonce_field('splitsms_forms'); ?>
    <input type="hidden" name="splitsms_save_forms" value="1" />

    <?php if (empty($forms)) : ?>
        <div class="splitsms-card splitsms-forms-empty">
            <p><strong><?php esc_html_e('No forms detected yet', 'splitsms'); ?></strong></p>
            <p class="description">
                <?php esc_html_e('Install Elementor Pro, JetFormBuilder, JetEngine Forms, Contact Form 7, or WPForms — then click Refresh list.', 'splitsms'); ?>
            </p>
        </div>
    <?php else : ?>
        <div class="splitsms-forms-list">
            <?php foreach ($forms as $index => $form) :
                $group = isset($form['source_group']) ? (string) $form['source_group'] : 'forms';
                $filter_group = 'crocoblock' === $group ? 'crocoblock' : ('elementor' === $form['source'] ? 'elementor' : 'forms');
                $key = esc_attr($form['key']);
                $is_native = !empty($form['native_config']);
                $is_enabled = !empty($form['enabled']);
                ?>
                <article
                    class="splitsms-form-card splitsms-form-card--<?php echo esc_attr($form['source_color']); ?> <?php echo $is_enabled ? 'is-enabled' : 'is-disabled'; ?> <?php echo $is_native ? 'is-native' : ''; ?>"
                    data-filter-group="<?php echo esc_attr($filter_group); ?>"
                    data-source="<?php echo esc_attr($form['source']); ?>"
                >
                    <header class="splitsms-form-card__head">
                        <div class="splitsms-form-card__meta">
                            <span class="splitsms-form-type splitsms-form-type--<?php echo esc_attr($form['source_color']); ?>">
                                <?php echo esc_html($form['source_label']); ?>
                            </span>
                            <h3 class="splitsms-form-card__title"><?php echo esc_html($form['title']); ?></h3>
                            <?php if (!empty($form['native_note'])) : ?>
                                <p class="splitsms-form-card__note"><?php echo esc_html($form['native_note']); ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="splitsms-form-card__controls">
                            <?php if ($is_native) : ?>
                                <span class="splitsms-form-native-badge"><?php esc_html_e('Form editor', 'splitsms'); ?></span>
                                <a class="button button-small" href="<?php echo esc_url($form['edit_url']); ?>"><?php esc_html_e('Edit form', 'splitsms'); ?></a>
                            <?php else : ?>
                                <label class="splitsms-switch" title="<?php esc_attr_e('Send SMS on submit', 'splitsms'); ?>">
                                    <input
                                        type="checkbox"
                                        class="splitsms-switch__input"
                                        name="splitsms_form_rules[<?php echo $key; ?>][enabled]"
                                        value="1"
                                        <?php checked($is_enabled); ?>
                                    />
                                    <span class="splitsms-switch__track" aria-hidden="true"></span>
                                    <span class="splitsms-switch__label"><?php echo $is_enabled ? esc_html__('On', 'splitsms') : esc_html__('Off', 'splitsms'); ?></span>
                                </label>
                                <button type="button" class="button button-link splitsms-form-card__toggle" aria-expanded="false">
                                    <?php esc_html_e('Message', 'splitsms'); ?>
                                    <span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>
                                </button>
                            <?php endif; ?>
                        </div>
                    </header>

                    <?php if (!$is_native) : ?>
                        <div class="splitsms-form-card__body" hidden>
                            <div class="splitsms-form-card__grid">
                                <div class="splitsms-field-block">
                                    <label class="splitsms-field-label" for="splitsms-phone-<?php echo (int) $index; ?>">
                                        <?php esc_html_e('Phone field name', 'splitsms'); ?>
                                    </label>
                                    <input
                                        type="text"
                                        class="regular-text"
                                        id="splitsms-phone-<?php echo (int) $index; ?>"
                                        name="splitsms_form_rules[<?php echo $key; ?>][phone_field]"
                                        value="<?php echo esc_attr($form['phone_field']); ?>"
                                        placeholder="phone"
                                    />
                                    <p class="description"><?php esc_html_e('Form field ID that holds the visitor phone number.', 'splitsms'); ?></p>
                                </div>
                                <div class="splitsms-field-block splitsms-field-block--wide">
                                    <label class="splitsms-field-label" for="splitsms-msg-<?php echo (int) $index; ?>">
                                        <?php esc_html_e('SMS message', 'splitsms'); ?>
                                    </label>
                                    <textarea
                                        class="large-text"
                                        rows="3"
                                        id="splitsms-msg-<?php echo (int) $index; ?>"
                                        name="splitsms_form_rules[<?php echo $key; ?>][message]"
                                    ><?php echo esc_textarea($form['message']); ?></textarea>
                                    <details class="splitsms-details">
                                        <summary><?php esc_html_e('Available variables', 'splitsms'); ?></summary>
                                        <p class="splitsms-var-list"><code><?php echo esc_html($vars_hint); ?></code></p>
                                    </details>
                                </div>
                                <?php if (in_array($form['source'], array('jfb', 'jetengine_form'), true)) : ?>
                                    <div class="splitsms-field-block splitsms-field-block--wide">
                                        <label class="splitsms-field-label" for="splitsms-admin-<?php echo (int) $index; ?>">
                                            <?php esc_html_e('Admin copy (optional)', 'splitsms'); ?>
                                        </label>
                                        <textarea
                                            class="large-text"
                                            rows="2"
                                            id="splitsms-admin-<?php echo (int) $index; ?>"
                                            name="splitsms_form_rules[<?php echo $key; ?>][admin_message]"
                                            placeholder="<?php esc_attr_e('Leave empty to use default admin alert template.', 'splitsms'); ?>"
                                        ><?php echo esc_textarea($form['admin_message']); ?></textarea>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <p class="splitsms-form-card__footer">
                                <a href="<?php echo esc_url($form['edit_url']); ?>" target="_blank" rel="noopener">
                                    <?php esc_html_e('Edit form in WordPress', 'splitsms'); ?>
                                    <span class="dashicons dashicons-external" aria-hidden="true"></span>
                                </a>
                                <span class="splitsms-form-card__id">ID: <?php echo esc_html($form['id']); ?></span>
                            </p>
                        </div>
                    <?php endif; ?>
                </article>
            <?php endforeach; ?>
        </div>

        <div class="splitsms-save-bar">
            <button type="submit" class="button button-primary button-large"><?php esc_html_e('Save form SMS settings', 'splitsms'); ?></button>
            <?php if ($native_count > 0) : ?>
                <span class="description">
                    <?php
                    printf(
                        /* translators: %d: count */
                        esc_html__('%d form(s) use SplitSMS inside the form builder — edit those in JetFormBuilder or JetEngine.', 'splitsms'),
                        (int) $native_count
                    );
                    ?>
                </span>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</form>

</div>
