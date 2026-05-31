<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Local SMS log storage + optional cloud sync to SplitSMS.
 */
class SplitSMS_Logger {
    const TABLE = 'splitsms_logs';

    /** @var self|null */
    private static $instance = null;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

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
            event varchar(64) NOT NULL DEFAULT '',
            recipient varchar(32) DEFAULT NULL,
            message_type varchar(32) DEFAULT NULL,
            status varchar(32) NOT NULL DEFAULT 'pending',
            source varchar(64) DEFAULT NULL,
            body text DEFAULT NULL,
            cost decimal(10,4) DEFAULT NULL,
            external_ref varchar(128) DEFAULT NULL,
            message_id varchar(64) DEFAULT NULL,
            synced tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY created_at (created_at)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    /**
     * @param array<string,mixed> $row
     */
    public function log(array $row) {
        global $wpdb;

        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like(self::table_name()))) !== self::table_name()) {
            self::create_table();
        }

        $wpdb->insert(
            self::table_name(),
            array(
                'event' => isset($row['event']) ? sanitize_text_field($row['event']) : 'sms',
                'recipient' => isset($row['recipient']) ? sanitize_text_field($row['recipient']) : null,
                'message_type' => isset($row['message_type']) ? sanitize_text_field($row['message_type']) : null,
                'status' => isset($row['status']) ? sanitize_text_field($row['status']) : 'pending',
                'source' => isset($row['source']) ? sanitize_text_field($row['source']) : null,
                'body' => isset($row['body']) ? wp_kses_post($row['body']) : null,
                'cost' => isset($row['cost']) ? floatval($row['cost']) : null,
                'external_ref' => isset($row['external_ref']) ? sanitize_text_field($row['external_ref']) : null,
                'message_id' => isset($row['message_id']) ? sanitize_text_field($row['message_id']) : null,
                'synced' => 0,
                'created_at' => current_time('mysql'),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%s', '%d', '%s')
        );

        return (int) $wpdb->insert_id;
    }

    /**
     * Push a stored log row to SplitSMS (after send completes).
     *
     * @param int $id Local log row ID.
     */
    public function sync_log_by_id($id) {
        $id = (int) $id;
        if ($id <= 0 || !SplitSMS_Settings::is_configured()) {
            return;
        }

        global $wpdb;
        $table = self::table_name();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id), ARRAY_A);
        if (!$row) {
            return;
        }

        $api = new SplitSMS_API();
        $result = $api->push_log($row);

        if (!empty($result['ok'])) {
            $wpdb->update(
                $table,
                array('synced' => 1),
                array('id' => $id),
                array('%d'),
                array('%d')
            );
        }
    }

    /**
     * @param int $limit
     * @return array<int,object>
     */
    public function get_logs($limit = 50) {
        global $wpdb;
        $table = self::table_name();

        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table) {
            self::create_table();
        }

        $limit = max(1, min(200, (int) $limit));

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        return $wpdb->get_results($wpdb->prepare("SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d", $limit));
    }

    public static function on_activate() {
        self::create_table();
    }
}
