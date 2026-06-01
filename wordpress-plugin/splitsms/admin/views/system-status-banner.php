<?php
/**
 * Connection, version, and environment banner for all SplitSMS admin pages.
 *
 * @var bool                    $configured
 * @var array<string,mixed>|null $account
 * @var array<string,mixed>      $status
 */

if (!defined('ABSPATH')) {
    exit;
}

$version = isset($status['version']) && is_array($status['version']) ? $status['version'] : array();
$env = isset($status['environment']) && is_array($status['environment']) ? $status['environment'] : array();
$is_outdated = !empty($version['is_outdated']);
$latest = isset($version['latest']) ? $version['latest'] : null;
$custom_updater_enabled = defined('SPLITSMS_ENABLE_CUSTOM_UPDATER') && SPLITSMS_ENABLE_CUSTOM_UPDATER;
$updates_url = isset($status['updates_url']) ? $status['updates_url'] : admin_url('update-core.php');
$wallet_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '#';
?>

<?php if ($custom_updater_enabled && $is_outdated && $latest) : ?>
    <div class="splitsms-system-alert splitsms-system-alert--update" role="status">
        <div class="splitsms-system-alert__icon dashicons dashicons-update" aria-hidden="true"></div>
        <div class="splitsms-system-alert__body">
            <strong><?php esc_html_e('Plugin update available', 'splitsms'); ?></strong>
            <p>
                <?php
                printf(
                    /* translators: 1: current version 2: latest on splitsms.com */
                    esc_html__('This site runs SplitSMS v%1$s. splitsms.com has v%2$s.', 'splitsms'),
                    esc_html($version['installed'] ?? SPLITSMS_VERSION),
                    esc_html($latest)
                );
                ?>
            </p>
        </div>
        <?php if (current_user_can('update_plugins')) : ?>
            <a class="button button-primary" href="<?php echo esc_url($updates_url); ?>">
                <?php esc_html_e('Update plugin', 'splitsms'); ?>
            </a>
        <?php endif; ?>
    </div>
<?php endif; ?>

<div class="splitsms-status-header">
    <div class="splitsms-status-header__main">
        <strong><?php echo $configured ? esc_html__('API connected', 'splitsms') : esc_html__('Not connected', 'splitsms'); ?></strong>
        <span class="splitsms-status-pill <?php echo $configured ? 'splitsms-status-pill--ok' : 'splitsms-status-pill--warn'; ?>">
            <?php echo $configured ? esc_html__('Live', 'splitsms') : esc_html__('Setup required', 'splitsms'); ?>
        </span>
        <span class="splitsms-status-pill splitsms-status-pill--muted">
            <?php esc_html_e('Plugin', 'splitsms'); ?> v<?php echo esc_html($version['installed'] ?? SPLITSMS_VERSION); ?>
            <?php if ($latest && !$is_outdated) : ?>
                <span class="splitsms-status-pill__sub"><?php esc_html_e('Up to date', 'splitsms'); ?></span>
            <?php elseif ($latest) : ?>
                <span class="splitsms-status-pill__sub">→ v<?php echo esc_html($latest); ?></span>
            <?php endif; ?>
        </span>
        <?php if ($account) : ?>
            <?php
            $sms_credits = isset($account['sms_credits']) ? (int) $account['sms_credits'] : 0;
            $wallet_currency = isset($account['wallet_currency']) ? $account['wallet_currency'] : 'GHS';
            $wallet_balance = isset($account['wallet_balance']) ? (float) $account['wallet_balance'] : 0;
            ?>
            <span class="splitsms-status-header__stat"><?php printf(esc_html__('%s SMS credits', 'splitsms'), esc_html(number_format_i18n($sms_credits))); ?></span>
            <span class="splitsms-status-header__stat"><?php printf(esc_html__('%1$s %2$s wallet', 'splitsms'), esc_html($wallet_currency), esc_html(number_format_i18n($wallet_balance, 2))); ?></span>
        <?php endif; ?>
    </div>
    <div class="splitsms-status-header__actions">
        <a class="button" href="<?php echo esc_url($wallet_url); ?>" target="_blank" rel="noopener"><?php esc_html_e('Add funds', 'splitsms'); ?></a>
        <button type="button" class="button button-primary" id="splitsms-send-test-btn"><?php esc_html_e('Send test SMS', 'splitsms'); ?></button>
        <span id="splitsms-send-test-result"></span>
    </div>
</div>

<details class="splitsms-env-details splitsms-card">
    <summary>
        <span class="dashicons dashicons-info-outline" aria-hidden="true"></span>
        <?php esc_html_e('Site details', 'splitsms'); ?>
        <span class="splitsms-env-details__hint"><?php esc_html_e('WordPress & PHP versions sent to SplitSMS when connected', 'splitsms'); ?></span>
    </summary>
    <dl class="splitsms-env-details__grid">
        <div>
            <dt><?php esc_html_e('WordPress', 'splitsms'); ?></dt>
            <dd><?php echo esc_html($env['wp_version'] ?? '—'); ?></dd>
        </div>
        <div>
            <dt><?php esc_html_e('PHP', 'splitsms'); ?></dt>
            <dd><?php echo esc_html($env['php_version'] ?? '—'); ?></dd>
        </div>
        <div>
            <dt><?php esc_html_e('SplitSMS plugin (this site)', 'splitsms'); ?></dt>
            <dd>v<?php echo esc_html($version['installed'] ?? SPLITSMS_VERSION); ?></dd>
        </div>
        <div>
            <dt><?php echo $custom_updater_enabled ? esc_html__('Latest on splitsms.com', 'splitsms') : esc_html__('Update source', 'splitsms'); ?></dt>
            <dd>
                <?php if ($custom_updater_enabled) : ?>
                    <?php echo $latest ? 'v' . esc_html($latest) : esc_html__('Could not check', 'splitsms'); ?>
                <?php else : ?>
                    <?php esc_html_e('WordPress.org plugin updates', 'splitsms'); ?>
                <?php endif; ?>
            </dd>
        </div>
        <div class="splitsms-env-details__wide">
            <dt><?php esc_html_e('Site URL', 'splitsms'); ?></dt>
            <dd><code><?php echo esc_html($env['site_url'] ?? home_url('/')); ?></code></dd>
        </div>
    </dl>
</details>
