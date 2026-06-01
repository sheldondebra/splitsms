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
$can_update = !empty($status['can_update']);
$update_available = !empty($status['update_available']) || $is_outdated;
$wallet_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/wallet' : '#';
?>

<?php if ($update_available && $latest && $can_update) : ?>
    <div class="splitsms-system-alert splitsms-system-alert--update" role="status">
        <div class="splitsms-system-alert__icon dashicons dashicons-update" aria-hidden="true"></div>
        <div class="splitsms-system-alert__body">
            <strong><?php esc_html_e('Plugin update available', 'splitsms'); ?></strong>
            <p>
                <?php
                printf(
                    /* translators: 1: current version 2: latest version */
                    esc_html__('This site runs SplitSMS v%1$s. v%2$s is available.', 'splitsms'),
                    esc_html($version['installed'] ?? SPLITSMS_VERSION),
                    esc_html($latest)
                );
                ?>
            </p>
        </div>
        <button type="button" class="button button-primary" id="splitsms-update-plugin-btn">
            <?php esc_html_e('Update', 'splitsms'); ?>
        </button>
        <span id="splitsms-update-plugin-result" class="splitsms-inline-result" aria-live="polite"></span>
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
        <?php if (!$configured) : ?>
            <a class="button button-primary" href="<?php echo esc_url(SplitSMS_Settings::signup_url('banner')); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Create account', 'splitsms'); ?></a>
        <?php else : ?>
            <a class="button" href="<?php echo esc_url($wallet_url); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Add funds', 'splitsms'); ?></a>
        <?php endif; ?>
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
            <dt><?php esc_html_e('Latest on splitsms.com', 'splitsms'); ?></dt>
            <dd><?php echo $latest ? 'v' . esc_html($latest) : esc_html__('Could not check', 'splitsms'); ?></dd>
        </div>
        <div class="splitsms-env-details__wide">
            <dt><?php esc_html_e('Site URL', 'splitsms'); ?></dt>
            <dd><code><?php echo esc_html($env['site_url'] ?? home_url('/')); ?></code></dd>
        </div>
    </dl>
</details>
