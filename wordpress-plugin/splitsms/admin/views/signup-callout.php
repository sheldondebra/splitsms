<?php
/**
 * Prompt WordPress.org / new installs to create a SplitSMS account.
 *
 * @var string $context UTM campaign context.
 */

if (!defined('ABSPATH')) {
    exit;
}

$context = isset($context) ? sanitize_key($context) : 'admin';
$signup_url = SplitSMS_Settings::signup_url($context);
$login_url = SplitSMS_Settings::login_url($context);
$api_keys_url = defined('SPLITSMS_APP_URL') ? SPLITSMS_APP_URL . '/dashboard/api-keys' : '#';
?>
<div class="splitsms-card splitsms-signup-callout">
    <div class="splitsms-signup-callout__body">
        <h2><?php esc_html_e('Create your SplitSMS account', 'splitsms'); ?></h2>
        <p>
            <?php esc_html_e('New to SplitSMS? Create a free account on splitsms.com — you get starter SMS credits, an API key, and a dashboard to manage sends.', 'splitsms'); ?>
        </p>
        <ol class="splitsms-steps splitsms-steps--compact">
            <li><?php esc_html_e('Create account on splitsms.com', 'splitsms'); ?></li>
            <li><?php esc_html_e('Copy your API key from Developers → API Keys', 'splitsms'); ?></li>
            <li><?php esc_html_e('Paste the key in SplitSMS → Settings on this site', 'splitsms'); ?></li>
        </ol>
    </div>
    <div class="splitsms-signup-callout__actions">
        <a class="button button-primary button-hero" href="<?php echo esc_url($signup_url); ?>" target="_blank" rel="noopener noreferrer">
            <?php esc_html_e('Create free account', 'splitsms'); ?>
        </a>
        <a class="button button-secondary" href="<?php echo esc_url($login_url); ?>" target="_blank" rel="noopener noreferrer">
            <?php esc_html_e('Log in', 'splitsms'); ?>
        </a>
        <p class="description">
            <?php
            printf(
                /* translators: %s: API keys URL */
                esc_html__('Already signed up? %s', 'splitsms'),
                '<a href="' . esc_url($api_keys_url) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Get your API key →', 'splitsms') . '</a>'
            );
            ?>
        </p>
    </div>
</div>
