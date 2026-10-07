import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  clickButton,
  launchBrowser,
  loginUi,
  clearSession,
  setFieldByLabel,
  setOffline,
  screenshot,
  sleep,
  waitFor,
  waitForPath,
  waitForText,
} from '../browser-tools.mjs';

export {
  clickButton,
  launchBrowser,
  loginUi,
  clearSession,
  setFieldByLabel,
  setOffline,
  screenshot,
  sleep,
  waitFor,
  waitForPath,
  waitForText,
};

export const safeSlug = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export async function clickByText(cdp, text, { exact = true } = {}) {
  const wanted = JSON.stringify(text);
  const exactJs = exact ? '===' : '.includes';
  const found = await cdp.evaluate(`(() => {
    const wanted = ${wanted};
    const candidates = [...document.querySelectorAll('button,a,label')];
    const el = candidates.find((node) => {
      const value = (node.innerText || node.textContent || '').trim();
      return ${exact ? 'value === wanted' : 'value.includes(wanted)'};
    });
    if (!el) return false;
    el.click();
    return true;
  })()`);
  if (!found) throw new Error(`No se encontró el control con texto: ${text}`);
}

export async function setCheckboxByText(cdp, text, checked = true) {
  const ok = await cdp.evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const labels = [...document.querySelectorAll('label')];
    const label = labels.find((node) => (node.innerText || '').trim().includes(wanted));
    const input = label?.querySelector('input[type="checkbox"]');
    if (!input) return false;
    if (input.checked !== ${checked ? 'true' : 'false'}) input.click();
    return input.checked === ${checked ? 'true' : 'false'};
  })()`);
  if (!ok) throw new Error(`No se pudo establecer el checkbox: ${text}`);
}

export async function setInputBySelector(cdp, selector, value) {
  const ok = await cdp.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el), 'value'
    )?.set;
    if (setter) setter.call(el, ${JSON.stringify(value)});
    else el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`No se encontró el selector: ${selector}`);
}

export async function uploadFirstFileInput(cdp, filePath) {
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: 'input[type="file"]',
  });
  if (!nodeId) throw new Error('No se encontró un input de archivo en la página.');
  await cdp.send('DOM.setFileInputFiles', { nodeId, files: [path.resolve(filePath)] });
}

export async function captureEvidence({
  cdp,
  evidenceDir,
  section,
  order,
  title,
  description,
  manifest,
}) {
  const folder = path.join(evidenceDir, section);
  await mkdir(folder, { recursive: true });
  const filename = `${String(order).padStart(2, '0')}-${safeSlug(title)}.png`;
  const fullPath = path.join(folder, filename);
  await sleep(250);
  await screenshot(cdp, fullPath);
  manifest.push({
    section,
    order,
    title,
    description,
    file: path.relative(evidenceDir, fullPath).replaceAll('\\', '/'),
    url: await cdp.evaluate('location.href'),
    capturedAt: new Date().toISOString(),
  });
  return fullPath;
}

export async function writeManifest(evidenceDir, metadata, manifest, log) {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    path.join(evidenceDir, 'manifest.json'),
    `${JSON.stringify({ metadata, captures: manifest }, null, 2)}\n`,
  );
  const markdown = [
    '# Evidencia para Manual de Usuario — Automotora Pamahe',
    '',
    `Ejecución: **${metadata.runId}**`,
    '',
    'Las imágenes se encuentran ordenadas por sección y por número de paso. Cada captura representa una pantalla o situación útil para explicar el uso del sistema.',
    '',
    ...manifest.flatMap((item) => [
      `## ${item.section}/${String(item.order).padStart(2, '0')} — ${item.title}`,
      '',
      item.description,
      '',
      `Archivo: \`${item.file}\``,
      '',
    ]),
  ].join('\n');
  await writeFile(path.join(evidenceDir, 'INDICE_EVIDENCIAS.md'), `${markdown}\n`);
  await writeFile(path.join(evidenceDir, 'execution.log'), `${log.join('\n')}\n`);
}

export function makeLogger(lines) {
  return (name, status = 'INFO', detail = '') => {
    const line = `${new Date().toISOString()} [${status}] ${name}${detail ? ` — ${detail}` : ''}`;
    lines.push(line);
    console.log(line);
  };
}
