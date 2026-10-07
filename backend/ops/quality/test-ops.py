#!/usr/bin/env python3
"""Pruebas aisladas de los scripts. No ejecutan MySQL ni certifican un restore real."""
import gzip
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
FAKE = '''#!/usr/bin/env python3
import os, sys
from pathlib import Path
name = Path(sys.argv[0]).name
with open(os.environ['FAKE_LOG'], 'a') as log:
    log.write(name + ' ' + ' '.join(sys.argv[1:]) + '\\n')
if name == 'mysqldump':
    print('-- fixture sintético, no es un dump productivo')
    sys.exit(int(os.environ.get('DUMP_EXIT', '0')))
if name == 'rsync':
    sys.exit(int(os.environ.get('REMOTE_EXIT', '0')))
if '-e' not in sys.argv:
    sys.stdin.read()
    sys.exit(int(os.environ.get('RESTORE_EXIT', '0')))
sql = sys.argv[sys.argv.index('-e') + 1]
if sql.startswith('DROP DATABASE'):
    sys.exit(int(os.environ.get('DROP_EXIT', '0')))
if sql.startswith('CREATE DATABASE'):
    sys.exit(int(os.environ.get('CREATE_EXIT', '0')))
if 'information_schema.tables' in sql or 'flyway_schema_history WHERE' in sql:
    print('1')
else:
    print(os.environ.get('VIOLATIONS', '0'))
'''


class BackupScriptsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='pamahe-ops-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        bin_dir = self.root / 'bin'
        bin_dir.mkdir()
        for name in ('mysql', 'mysqldump', 'rsync'):
            path = bin_dir / name
            path.write_text(FAKE)
            path.chmod(0o755)
        self.backups = self.root / 'backups'
        self.backups.mkdir()
        self.log = self.root / 'calls.log'
        # Entorno mínimo: no heredar configuración ni secretos del operador.
        self.env = {'PATH': str(bin_dir) + os.pathsep + os.environ['PATH'],
                    'DB_HOST': '127.0.0.1', 'DB_PORT': '3306', 'DB_NAME': 'pamahe_test',
                    'DB_USER': 'fixture', 'DB_PASSWORD': 'fixture-not-a-secret',
                    'BACKUP_DIR': str(self.backups), 'BACKUP_REQUIRE_REMOTE': 'true',
                    'BACKUP_REMOTE': 'backup@example.test:/backups', 'FAKE_LOG': str(self.log)}

    def run_script(self, name, *args, expected=0):
        result = subprocess.run(['bash', str(ROOT / 'ops/backup' / name), *map(str, args)],
                                env=self.env, capture_output=True, text=True, timeout=20)
        self.assertEqual(expected, result.returncode, result.stdout + result.stderr)
        return result

    def calls(self):
        return self.log.read_text() if self.log.exists() else ''

    def fixture(self):
        path = self.backups / 'pamahe_test_20260101T000000Z_1.sql.gz'
        path.write_bytes(gzip.compress(b'-- fixture\n'))
        Path(str(path) + '.sha256').write_text(hashlib.sha256(path.read_bytes()).hexdigest() + '  ' + path.name + '\n')
        return path

    def test_backup_checksum_and_remote(self):
        self.run_script('mysql-backup.sh')
        files = list(self.backups.glob('*.sql.gz'))
        self.assertEqual(1, len(files))
        self.assertTrue(gzip.decompress(files[0].read_bytes()).startswith(b'-- fixture'))
        self.assertEqual(hashlib.sha256(files[0].read_bytes()).hexdigest(), Path(str(files[0]) + '.sha256').read_text().split()[0])
        self.assertIn('StrictHostKeyChecking=yes', self.calls())
        self.assertEqual(0o600, files[0].stat().st_mode & 0o777)

    def test_remote_required_before_dump(self):
        del self.env['BACKUP_REMOTE']
        self.run_script('mysql-backup.sh', expected=2)
        self.assertEqual('', self.calls())

    def test_invalid_remote_rejected_before_dump(self):
        self.env['BACKUP_REMOTE'] = 'bad;command'
        self.run_script('mysql-backup.sh', expected=2)
        self.assertEqual('', self.calls())

    def test_dump_failure_removes_partial(self):
        self.env['DUMP_EXIT'] = '7'
        self.run_script('mysql-backup.sh', expected=7)
        self.assertEqual([], list(self.backups.glob('*.gz*')))
        self.assertNotIn('rsync', self.calls())

    def test_remote_failure_preserves_old_backup(self):
        old = self.fixture()
        os.utime(old, (1, 1))
        self.env['REMOTE_EXIT'] = '23'
        self.run_script('mysql-backup.sh', expected=23)
        self.assertTrue(old.exists())

    def test_retention_only_own_database(self):
        old = self.fixture()
        other = self.backups / 'other_db_20260101.sql.gz'
        other.write_bytes(b'other')
        os.utime(old, (1, 1))
        os.utime(other, (1, 1))
        self.run_script('mysql-backup.sh')
        self.assertFalse(old.exists())
        self.assertTrue(other.exists())

    def test_tampered_backup_never_creates_database(self):
        path = self.fixture()
        path.write_bytes(b'tampered')
        self.run_script('mysql-backup-verify.sh', path, expected=3)
        self.assertEqual('', self.calls())

    def test_restore_needs_exact_target(self):
        self.env.update(RESTORE_CONFIRM='YES', RESTORE_TARGET='different')
        self.run_script('mysql-restore.sh', self.fixture(), expected=20)
        self.assertEqual('', self.calls())

    def test_confirmed_restore_runs_integrity(self):
        self.env.update(RESTORE_CONFIRM='YES', RESTORE_TARGET='pamahe_test')
        self.run_script('mysql-restore.sh', self.fixture())
        self.assertIn('flyway_schema_history WHERE', self.calls())
        self.assertIn('costo_total_al_vender', self.calls())

    def test_temporary_restore_always_drops_owned_database(self):
        self.env['RESTORE_EXIT'] = '8'
        self.run_script('mysql-backup-verify.sh', self.fixture(), expected=8)
        self.assertIn('DROP DATABASE IF EXISTS', self.calls())

    def test_create_failure_does_not_drop_existing_database(self):
        self.env['CREATE_EXIT'] = '9'
        self.run_script('mysql-backup-verify.sh', self.fixture(), expected=9)
        self.assertNotIn('DROP DATABASE', self.calls())

    def test_cleanup_failure_is_not_success(self):
        self.env['DROP_EXIT'] = '9'
        self.run_script('mysql-backup-verify.sh', self.fixture(), expected=33)

    def test_integrity_failure_is_propagated_and_cleaned(self):
        self.env['VIOLATIONS'] = '1'
        self.run_script('mysql-backup-verify.sh', self.fixture(), expected=31)
        self.assertIn('DROP DATABASE', self.calls())

    def test_successful_temporary_restore_checks_and_cleans(self):
        self.run_script('mysql-backup-verify.sh', self.fixture())
        self.assertIn('CREATE DATABASE', self.calls())
        self.assertIn('DROP DATABASE', self.calls())
        self.assertIn('refaccion_operaciones_offline', self.calls())

    def test_latest_selects_only_requested_database(self):
        self.fixture()
        (self.backups / 'other_99999999.sql.gz').write_bytes(b'wrong')
        self.run_script('verify-latest.sh')
        self.assertIn('CREATE DATABASE', self.calls())

    def test_no_backup_is_failure(self):
        self.run_script('verify-latest.sh', expected=4)

    def test_invalid_database_is_rejected(self):
        self.env['DB_NAME'] = 'name`; DROP DATABASE other;'
        self.run_script('mysql-backup.sh', expected=2)
        self.assertEqual('', self.calls())



@unittest.skipUnless(shutil.which('envsubst'), 'Requiere envsubst (gettext)')
class NginxTemplateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='pamahe-nginx-')
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.cert = root / 'cert.pem'
        self.cert.write_text('fixture; no certifica TLS')
        self.output = root / 'pamahe.conf'
        self.env = {'PATH': os.environ['PATH'], 'PAMAHE_API_HOST': 'api.example.test',
                    'PAMAHE_BACKEND_PORT': '8080', 'TLS_CERTIFICATE': str(self.cert),
                    'TLS_CERTIFICATE_KEY': str(self.cert), 'NGINX_TARGET': str(self.output)}

    def render(self):
        return subprocess.run(['bash', str(ROOT / 'ops/nginx/render-config.sh')],
                              env=self.env, capture_output=True, text=True, timeout=10)

    def test_template_preserves_nginx_variables(self):
        result = self.render()
        self.assertEqual(0, result.returncode, result.stderr)
        conf = self.output.read_text()
        self.assertIn('https://api.example.test$request_uri', conf)
        self.assertIn('X-Forwarded-For $remote_addr;', conf)
        self.assertIn('location ^~ /api/actuator/ { return 404; }', conf)
        self.assertNotIn('${PAMAHE_', conf)
        self.assertNotIn('${TLS_', conf)

    def test_host_cannot_inject_configuration(self):
        self.env['PAMAHE_API_HOST'] = 'example.test; include /tmp/injected;'
        self.assertEqual(2, self.render().returncode)
        self.assertFalse(self.output.exists())

    def test_invalid_port_preserves_existing_output(self):
        self.output.write_text('existing')
        self.env['PAMAHE_BACKEND_PORT'] = '65536'
        self.assertEqual(2, self.render().returncode)
        self.assertEqual('existing', self.output.read_text())

if __name__ == '__main__':
    for executable in ('bash', 'gzip', 'sha256sum', 'flock', 'find', 'sort'):
        if not shutil.which(executable):
            raise SystemExit('Requiere Linux/WSL y ' + executable)
    unittest.main(verbosity=2)
