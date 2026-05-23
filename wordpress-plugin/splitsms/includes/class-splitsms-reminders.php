<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Scheduled SMS reminders (bookings / appointments).
 */
class SplitSMS_Reminders {
    const TABLE = 'splitsms_reminders';
    const CRON_HOOK = 'splitsms_process_reminders';

    public static function table_name() {
        global $wpdb;
        return $wpdb->prefix . self::TABLE;
    }

    public static function create_table() {
        global $wpdb;
        $table = self::table_name();
        $charset = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            integration varchar(32) NOT NULL DEFAULT '',
            event varchar(64) NOT NULL DEFAULT '',
            phone varchar(32) NOT NULL,
            message text NOT NULL,
            send_at datetime NOT NULL,
            status varchar(16) NOT NULL DEFAULT 'pending',
            meta longtext NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY send_at (send_at),
            KEY status (status)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function schedule($row) {
        global $wpdb;

        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like(self::table_name()))) !== self::table_name()) {
            self::create_table();
        }

        $send_at = isset($row['send_at']) ? (int) $row['send_at'] : 0;
        if ($send_at <= time()) {
            return 0;
        }

        $wpdb->insert(
            self::table_name(),
            array(
                'integration' => isset($row['integration']) ? sanitize_key($row['integration']) : '',
                'event' => isset($row['event']) ? sanitize_text_field($row['event']) : 'reminder',
                'phone' => isset($row['phone']) ? sanitize_text_field($row['phone']) : '',
                'message' => isset($row['message']) ? wp_kses_post($row['message']) : '',
                'send_at' => gmdate('Y-m-d H:i:s', $send_at),
                'status' => 'pending',
                'meta' => !empty($row['meta']) ? wp_json_encode($row['meta']) : null,
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );

        return (int) $wpdb->insert_id;
    }

    public static function process_due() {
        if (!SplitSMS_Settings::is_configured()) {
            return;
        }

        global $wpdb;
        $table = self::table_name();
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table) {
            return;
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE status = %s AND send_at <= %s ORDER BY send_at ASC LIMIT 20",
                'pending',
                gmdate('Y-m-d H:i:s')
            )
        );

        if (empty($rows)) {
            return;
        }

        $api = new SplitSMS_API();
        foreach ($rows as $row) {
            $result = $api->send_sms(
                $row->phone,
                $row->message,
                array(
                    'source' => 'wordpress_crocoblock',
                    'event' => $row->event . '_reminder',
                    'external_ref' => $row->integration . '-reminder-' . $row->id,
                )
            );

            $wpdb->update(
                $table,
                array('status' => !empty($result['ok']) ? 'sent' : 'failed'),
                array('id' => (int) $row->id),
                array('%s'),
                array('%d')
            );
        }
    }

    public static function register_cron() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 300, 'splitsms_quarter_hour', self::CRON_HOOK);
        }
    }

    public static function clear_cron() {
        wp_clear_scheduled_hook(self::CRON_HOOK);
    }
}

add_filter(
    'cron_schedules',
    function ($schedules) {
        if (!isset($schedules['splitsms_quarter_hour'])) {
            $schedules['splitsms_quarter_hour'] = array(
                'interval' => 15 * MINUTE_IN_SECONDS,
                'display' => __('Every 15 minutes (SplitSMS)', 'splitsms'),
            );
        }
        return $schedules;
    }
);

add_action('splitsms_process_reminders', array('SplitSMS_Reminders', 'process_due'));
