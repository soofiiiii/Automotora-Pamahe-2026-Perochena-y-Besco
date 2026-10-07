import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('verify_be12', Path(__file__).with_name('verify-be12.py'))
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


class EvidenceTests(unittest.TestCase):
    def test_rejects_actual_failed_sales(self):
        with self.assertRaises(ValueError):
            verify.check_summary(Path(__file__).with_name('ventas-2026-09-24T20-44-37-230Z.json'), 'ventas')

    def test_missing_lcp_is_not_success(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'empty.ndjson'; p.write_text('')
            with self.assertRaises(ValueError):
                verify.check_lcp_raw(p, 'https://catalogo.example.test/')

    def test_raw_samples_must_be_complete_positive_and_same_url(self):
        for values, url, valid in [([900] * 10, 'https://catalogo.example.test/', True),
                                   ([900] * 9, 'https://catalogo.example.test/', False),
                                   ([2100] * 10, 'https://catalogo.example.test/', False),
                                   ([0] * 10, 'https://catalogo.example.test/', False),
                                   ([900] * 10, 'https://login.example.test/', False)]:
            with self.subTest(values=values, url=url), tempfile.TemporaryDirectory() as d:
                p = Path(d) / 'raw.ndjson'
                p.write_text('\n'.join(json.dumps({'type': 'Point', 'metric': 'browser_web_vital_lcp',
                             'data': {'value': v, 'tags': {'url': url}}}) for v in values))
                if valid:
                    self.assertEqual(900, verify.check_lcp_raw(p, 'https://catalogo.example.test/'))
                else:
                    with self.assertRaises(ValueError):
                        verify.check_lcp_raw(p, 'https://catalogo.example.test/')

    def test_nonfinite_metric_rejected(self):
        for value in [None, float('nan'), float('inf'), True]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                verify.metric({'m': {'values': {'p(95)': value}}}, 'm', 'p(95)')


if __name__ == '__main__':
    unittest.main()
