#!/usr/bin/env python3
"""Prueba la publicación de resultados sin ejecutar backup real ni enviar alertas."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'monitoring/run-job.sh'

class MonitoringJobTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='pamahe-monitor-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.env = {'PATH': os.environ['PATH'], 'TEXTFILE_DIR': str(self.root)}

    def run_job(self, code, job='backup'):
        return subprocess.run(['bash', str(SCRIPT), job, 'bash', '-c', 'exit "$1"', 'fixture', str(code)],
                              env=self.env, capture_output=True, text=True, timeout=10)

    def test_success_publishes_private_atomic_metrics(self):
        self.assertEqual(0, self.run_job(0).returncode)
        p = self.root / 'pamahe_backup.prom'
        self.assertIn('pamahe_job_last_exit_code{job_name="backup"} 0', p.read_text())
        self.assertEqual(0o640, p.stat().st_mode & 0o777)
        self.assertEqual([], list(self.root.glob('*.prom.*')))

    def test_failure_preserves_exit_code_and_last_success(self):
        self.assertEqual(0, self.run_job(0).returncode)
        p = self.root / 'pamahe_backup.prom'
        before = p.read_text().splitlines()[-1]
        self.assertEqual(7, self.run_job(7).returncode)
        self.assertIn('pamahe_job_last_exit_code{job_name="backup"} 7', p.read_text())
        self.assertEqual(before, p.read_text().splitlines()[-1])

    def test_first_failure_has_no_fake_success(self):
        self.assertEqual(9, self.run_job(9).returncode)
        self.assertIn('pamahe_job_last_success_timestamp_seconds{job_name="backup"} 0',
                      (self.root / 'pamahe_backup.prom').read_text())

    def test_restore_has_independent_metrics(self):
        self.run_job(0)
        self.assertEqual(3, self.run_job(3, 'restore_verify').returncode)
        self.assertIn('job_name="restore_verify"', (self.root / 'pamahe_restore_verify.prom').read_text())
        self.assertIn('last_exit_code{job_name="backup"} 0', (self.root / 'pamahe_backup.prom').read_text())

    def test_invalid_job_cannot_create_arbitrary_path(self):
        self.assertEqual(2, self.run_job(0, '../invalid').returncode)
        self.assertEqual([], list(self.root.glob('*.prom')))

    def test_missing_directory_fails_before_command(self):
        self.env['TEXTFILE_DIR'] = str(self.root / 'missing')
        self.assertEqual(2, self.run_job(0).returncode)

if __name__ == '__main__':
    unittest.main(verbosity=2)
