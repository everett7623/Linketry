import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, ImagePlus, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  DEFAULT_QR_STYLE,
  QR_STYLE_SIZES,
  checkQrColors,
  type Link as LinkType,
  type QrStyle,
  type QrStyleFormat,
  type QrStyleSize,
} from '@linketry/shared';
import { getQrStyle, saveQrStyle } from '../../api/qrStyle';
import { formatApiErrorMessage } from '../../utils/apiErrorMessage';
import { useLocale } from '../../contexts/LocaleContext';
import { downloadDataUrl } from '../../utils/download';
import { qrFileName } from '../../utils/qrCode';
import {
  QrLogoError,
  canvasToBlob,
  createQrSvg,
  loadQrDecoder,
  prepareQrLogo,
  rasterizeSvg,
} from '../../utils/qrRender';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export interface LinkQrCode {
  link: LinkType;
  url: string;
}

const PREVIEW_WIDTH = 512;

type ScanState = 'checking' | 'passed' | 'failed' | 'unavailable' | 'skipped';

function isStandardLook(style: QrStyle): boolean {
  return (
    style.foreground === DEFAULT_QR_STYLE.foreground &&
    style.background === DEFAULT_QR_STYLE.background &&
    style.logo === null &&
    !style.caption
  );
}

function captionFor(style: QrStyle, url: string): string | null {
  return style.caption ? url.replace(/^https?:\/\//, '') : null;
}

export function QrCodeModal({
  qr,
  onClose,
  onCopy,
}: {
  qr: LinkQrCode | null;
  onClose: () => void;
  onCopy: (link: LinkType) => void;
}) {
  const { t } = useLocale();

  return (
    <Modal
      open={!!qr}
      onClose={onClose}
      title={qr ? t('qrCodeTitle', { slug: qr.link.slug }) : t('qrCode')}
      size="xl"
    >
      {qr && <QrCodeDesigner qr={qr} onCopy={onCopy} />}
    </Modal>
  );
}

function QrCodeDesigner({ qr, onCopy }: { qr: LinkQrCode; onCopy: (link: LinkType) => void }) {
  const { t } = useLocale();
  const { success, error } = useToast();
  const [style, setStyle] = useState<QrStyle>(DEFAULT_QR_STYLE);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanState>('skipped');
  const [busy, setBusy] = useState<'download' | 'save' | 'logo' | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getQrStyle()
      .then((saved) => {
        if (!cancelled) setStyle(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setStyleLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const colorIssue = checkQrColors(style.foreground, style.background);

  useEffect(() => {
    if (!styleLoaded) return;
    let cancelled = false;
    if (colorIssue) {
      setPreview(null);
      setScan('skipped');
      return;
    }
    const standard = isStandardLook(style);
    setScan(standard ? 'skipped' : 'checking');
    (async () => {
      let svg: string;
      try {
        svg = await createQrSvg(qr.url, {
          foreground: style.foreground,
          background: style.background,
          logo: style.logo,
          caption: captionFor(style, qr.url),
          width: PREVIEW_WIDTH,
        });
      } catch {
        if (!cancelled) setRenderError(t('qrModuleUnavailable'));
        return;
      }
      try {
        const canvas = await rasterizeSvg(svg);
        if (cancelled) return;
        setPreview(canvas.toDataURL('image/png'));
        setRenderError(null);
        if (standard) return;
        const decode = await loadQrDecoder();
        if (cancelled) return;
        if (!decode) {
          setScan('unavailable');
          return;
        }
        setScan(decode(canvas) === qr.url ? 'passed' : 'failed');
      } catch {
        if (!cancelled) setRenderError(t('qrFailed'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qr.url, style, styleLoaded, colorIssue, t]);

  const update = (patch: Partial<QrStyle>) => setStyle((current) => ({ ...current, ...patch }));

  const blocked = Boolean(colorIssue) || scan === 'checking' || scan === 'failed' || !preview || Boolean(renderError);

  const download = async () => {
    setBusy('download');
    try {
      const svg = await createQrSvg(qr.url, {
        foreground: style.foreground,
        background: style.background,
        logo: style.logo,
        caption: captionFor(style, qr.url),
        width: style.size,
      });
      const blob =
        style.format === 'svg'
          ? new Blob([svg], { type: 'image/svg+xml' })
          : await canvasToBlob(await rasterizeSvg(svg));
      const objectUrl = URL.createObjectURL(blob);
      downloadDataUrl(objectUrl, qrFileName(qr.link.slug, style.format));
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      success(t('qrDownloaded'));
    } catch {
      error(t('qrFailed'));
    } finally {
      setBusy(null);
    }
  };

  const saveDefault = async () => {
    setBusy('save');
    try {
      setStyle(await saveQrStyle(style));
      success(t('qrStyleSaved'));
    } catch (err) {
      error(`${t('qrStyleSaveFailed')}: ${formatApiErrorMessage(err, t)}`);
    } finally {
      setBusy(null);
    }
  };

  const chooseLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy('logo');
    setLogoError(null);
    try {
      update({ logo: await prepareQrLogo(file) });
    } catch (err) {
      setLogoError(err instanceof QrLogoError && err.reason === 'too_large' ? t('qrLogoTooLarge') : t('qrLogoUnreadable'));
    } finally {
      setBusy(null);
    }
  };

  const guardrail = colorIssue
    ? { tone: 'error', text: t(colorIssue === 'inverted' ? 'qrColorInverted' : colorIssue === 'low_contrast' ? 'qrColorLowContrast' : 'qrColorInvalid') }
    : scan === 'checking'
      ? { tone: 'muted', text: t('qrScanChecking') }
      : scan === 'failed'
        ? { tone: 'error', text: t('qrScanFailed') }
        : scan === 'unavailable'
          ? { tone: 'warning', text: t('qrScanUnavailable') }
          : scan === 'passed'
            ? { tone: 'ok', text: t('qrScanPassed') }
            : null;

  const toneClass = {
    error: 'text-red-400',
    warning: 'text-amber-400',
    ok: 'text-emerald-400',
    muted: 'text-slate-400',
  } as const;

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div
          className="flex aspect-square items-center justify-center rounded-lg border border-slate-700 p-2"
          style={{ backgroundColor: colorIssue ? undefined : style.background }}
        >
          {preview && !renderError ? (
            <img src={preview} alt={t('qrCodeFor', { url: qr.url })} className="h-auto max-h-full w-full object-contain" />
          ) : (
            <p className="px-4 text-center text-sm text-slate-400">{renderError ?? (colorIssue ? t('qrPreviewHidden') : t('qrRendering'))}</p>
          )}
        </div>
        <p className="break-all font-mono text-xs text-slate-400">{qr.url}</p>
        <p role="status" aria-live="polite" className={`min-h-5 text-sm ${guardrail ? toneClass[guardrail.tone as keyof typeof toneClass] : ''}`}>
          {guardrail?.text ?? ''}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">{t('qrStyle')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <ColorField id="qr-foreground" label={t('qrForeground')} value={style.foreground} onChange={(foreground) => update({ foreground })} />
          <ColorField id="qr-background" label={t('qrBackground')} value={style.background} onChange={(background) => update({ background })} />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-300">{t('qrLogo')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {style.logo && <img src={style.logo} alt={t('qrLogoPreview')} className="h-10 w-10 rounded border border-slate-700 bg-white object-contain p-0.5" />}
            <Button
              variant="secondary"
              size="sm"
              icon={<ImagePlus size={14} />}
              loading={busy === 'logo'}
              onClick={() => logoInput.current?.click()}
            >
              {style.logo ? t('qrLogoReplace') : t('qrLogoUpload')}
            </Button>
            {style.logo && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => update({ logo: null })}>
                {t('qrLogoRemove')}
              </Button>
            )}
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              tabIndex={-1}
              aria-label={t('qrLogoUpload')}
              onChange={chooseLogo}
            />
          </div>
          <p className={`text-xs ${logoError ? 'text-red-400' : 'text-slate-500'}`} role={logoError ? 'alert' : undefined}>
            {logoError ?? t('qrLogoHint')}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-600"
            checked={style.caption}
            onChange={(event) => update({ caption: event.target.checked })}
          />
          {t('qrCaption')}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('qrSize')}
            value={style.size}
            onChange={(event) => update({ size: Number(event.target.value) as QrStyleSize })}
          >
            {QR_STYLE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </Select>
          <Select
            label={t('qrFormat')}
            value={style.format}
            onChange={(event) => update({ format: event.target.value as QrStyleFormat })}
          >
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={() => setStyle(DEFAULT_QR_STYLE)}>
            {t('qrResetStyle')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Save size={14} />}
            loading={busy === 'save'}
            disabled={Boolean(colorIssue)}
            onClick={saveDefault}
          >
            {t('qrSaveDefault')}
          </Button>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onCopy(qr.link)} icon={<Copy size={14} />}>
            {t('copyLink')}
          </Button>
          <Button
            size="sm"
            onClick={download}
            disabled={blocked}
            loading={busy === 'download'}
            icon={<Download size={14} />}
          >
            {t(style.format === 'svg' ? 'downloadSvg' : 'downloadPng')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-slate-300">{value}</span>
      </div>
    </div>
  );
}
