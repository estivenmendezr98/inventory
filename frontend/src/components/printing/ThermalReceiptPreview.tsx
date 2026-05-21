import { buildThermalReceiptLines } from '../../lib/thermal-receipt-format';
import type { ThermalReceiptPayload } from '../../lib/thermal-receipt-types';
import { cn } from '../../lib/utils';

type Props = {
  data: ThermalReceiptPayload;
  className?: string;
};

export function ThermalReceiptPreview({ data, className }: Props) {
  const lines = buildThermalReceiptLines(data);
  const widthClass = data.template.pageSize === '58mm' ? 'max-w-[58mm]' : 'max-w-[80mm]';

  return (
    <div
      className={cn(
        'mx-auto rounded border border-border bg-white p-3 text-black shadow-sm',
        widthClass,
        className,
      )}
    >
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-snug m-0">
        {lines.join('\n')}
      </pre>
    </div>
  );
}
