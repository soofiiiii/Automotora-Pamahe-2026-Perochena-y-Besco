
SELECT @@version AS mysql_version, @@innodb_flush_log_at_trx_commit AS durable_commit,
       @@sync_binlog AS sync_binlog, @@max_connections AS max_connections,
       @@innodb_buffer_pool_size AS buffer_pool_bytes;
SELECT VARIABLE_NAME, VARIABLE_VALUE FROM performance_schema.global_status
WHERE VARIABLE_NAME IN ('Threads_running', 'Threads_connected', 'Innodb_row_lock_waits',
                         'Innodb_row_lock_time', 'Innodb_log_waits');
SELECT DIGEST, LEFT(DIGEST_TEXT, 300) AS normalized_sql, COUNT_STAR,
       ROUND(SUM_TIMER_WAIT / 1000000000, 2) AS total_ms,
       ROUND(AVG_TIMER_WAIT / 1000000000, 2) AS avg_ms,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT, SUM_ERRORS
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = DATABASE()
ORDER BY SUM_TIMER_WAIT DESC LIMIT 20;

SELECT REQUESTING_ENGINE_TRANSACTION_ID, BLOCKING_ENGINE_TRANSACTION_ID
FROM performance_schema.data_lock_waits;
