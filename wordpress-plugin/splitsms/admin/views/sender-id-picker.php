<?php
/**
 * Sender ID picker — loads IDs from the connected SplitSMS account.
 *
 * @var string $selected_sender
 * @var array<int, array<string, mixed>> $sender_ids
 * @var string $sender_ids_error
 * @var bool $api_connected
 */

if (!defined('ABSPATH')) {
    exit;
}

$register_url = defined('SPLITSMS_APP_URL')
    ? SPLITSMS_APP_URL . '/dashboard/sender-ids'
    : 'https://www.splitsms.com/dashboard/sender-ids';

if (!function_exists('splitsms_sender_status_tone')) {
    /**
     * @param string $status
     */
    function splitsms_sender_status_tone($status) {
        $status = strtoupper((string) $status);
        if ('APPROVED' === $status) {
            return 'ok';
        }
        if ('REJECTED' === $status) {
            return 'denied';
        }
        return 'pending';
    }
}

if (!function_exists('splitsms_sender_status_label')) {
    /**
     * @param string $status
     */
    function splitsms_sender_status_label($status) {
        $status = strtoupper((string) $status);
        if ('APPROVED' === $status) {
            return __('Active', 'splitsms');
        }
        if ('REJECTED' === $status) {
            return __('Denied', 'splitsms');
        }
        return __('Pending', 'splitsms');
    }
}

$selected_item = null;
foreach ($sender_ids as $item) {
    if (isset($item['value']) && $item['value'] === $selected_sender) {
        $selected_item = $item;
        break;
    }
}
?>

<div class="splitsms-sender-picker-wrap" id="splitsms-sender-picker-wrap">
    <input type="hidden" name="splitsms[sender_id]" id="splitsms-sender-id-value" value="<?php echo esc_attr($selected_sender); ?>" />

    <?php if (!$api_connected) : ?>
        <p class="description">
            <?php esc_html_e('Connect your API key first, then choose a sender ID from your SplitSMS account.', 'splitsms'); ?>
        </p>
    <?php elseif ('' !== $sender_ids_error) : ?>
        <div class="splitsms-notice-inline splitsms-notice-inline--warn">
            <?php echo esc_html($sender_ids_error); ?>
        </div>
        <p class="description">
            <?php esc_html_e('Ensure your API key includes the sender_ids.read scope, then save settings and reload this page.', 'splitsms'); ?>
        </p>
    <?php elseif (empty($sender_ids)) : ?>
        <div class="splitsms-notice-inline splitsms-notice-inline--warn">
            <?php esc_html_e('No sender IDs on this account yet.', 'splitsms'); ?>
            <a href="<?php echo esc_url($register_url); ?>" target="_blank" rel="noopener noreferrer">
                <?php esc_html_e('Register a sender ID on SplitSMS →', 'splitsms'); ?>
            </a>
        </div>
    <?php else : ?>
        <?php if ('' !== $selected_sender && !$selected_item) : ?>
            <div class="splitsms-notice-inline splitsms-notice-inline--warn">
                <?php esc_html_e('The saved sender ID is not on your account — pick one from the list below.', 'splitsms'); ?>
            </div>
        <?php endif; ?>
        <div class="splitsms-sender-picker" id="splitsms-sender-picker">
            <label class="screen-reader-text" for="splitsms-sender-search"><?php esc_html_e('Search sender IDs', 'splitsms'); ?></label>
            <div class="splitsms-sender-picker__control">
                <span class="splitsms-status-light splitsms-status-light--<?php echo esc_attr($selected_item ? splitsms_sender_status_tone($selected_item['status']) : 'pending'); ?>" id="splitsms-sender-selected-light" aria-hidden="true"></span>
                <input
                    type="search"
                    class="regular-text splitsms-sender-picker__search"
                    id="splitsms-sender-search"
                    value="<?php echo esc_attr($selected_sender); ?>"
                    placeholder="<?php esc_attr_e('Search sender IDs…', 'splitsms'); ?>"
                    autocomplete="off"
                    aria-expanded="false"
                    aria-controls="splitsms-sender-list"
                    aria-autocomplete="list"
                    role="combobox"
                />
                <button type="button" class="button splitsms-sender-picker__toggle" id="splitsms-sender-toggle" aria-label="<?php esc_attr_e('Show sender IDs', 'splitsms'); ?>">▾</button>
            </div>

            <ul class="splitsms-sender-picker__list" id="splitsms-sender-list" role="listbox" hidden>
                <?php foreach ($sender_ids as $item) : ?>
                    <?php
                    $value = isset($item['value']) ? (string) $item['value'] : '';
                    if ('' === $value) {
                        continue;
                    }
                    $status = isset($item['status']) ? (string) $item['status'] : 'PENDING';
                    $tone = splitsms_sender_status_tone($status);
                    $is_selected = $value === $selected_sender;
                    ?>
                    <li
                        class="splitsms-sender-picker__option<?php echo $is_selected ? ' is-selected' : ''; ?>"
                        role="option"
                        aria-selected="<?php echo $is_selected ? 'true' : 'false'; ?>"
                        data-value="<?php echo esc_attr($value); ?>"
                        data-status="<?php echo esc_attr(strtolower($status)); ?>"
                        data-tone="<?php echo esc_attr($tone); ?>"
                        data-label="<?php echo esc_attr(splitsms_sender_status_label($status)); ?>"
                    >
                        <span class="splitsms-status-light splitsms-status-light--<?php echo esc_attr($tone); ?>" aria-hidden="true"></span>
                        <span class="splitsms-sender-picker__value"><?php echo esc_html($value); ?></span>
                        <span class="splitsms-sender-picker__meta">
                            <?php echo esc_html(splitsms_sender_status_label($status)); ?>
                            <?php if (!empty($item['is_default'])) : ?>
                                · <?php esc_html_e('Default', 'splitsms'); ?>
                            <?php endif; ?>
                            <?php if (!empty($item['country_code'])) : ?>
                                · <?php echo esc_html(strtoupper((string) $item['country_code'])); ?>
                            <?php endif; ?>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>

        <p class="description splitsms-sender-picker__hint" id="splitsms-sender-hint">
            <?php if ($selected_item && 'APPROVED' !== strtoupper((string) $selected_item['status'])) : ?>
                <?php esc_html_e('This sender ID is not approved yet — SMS may fail until SplitSMS activates it.', 'splitsms'); ?>
            <?php else : ?>
                <?php esc_html_e('Green = active, yellow = pending approval, red = denied. Only sender IDs from your account can be used.', 'splitsms'); ?>
            <?php endif; ?>
            <a href="<?php echo esc_url($register_url); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Manage sender IDs →', 'splitsms'); ?></a>
        </p>
    <?php endif; ?>
</div>
