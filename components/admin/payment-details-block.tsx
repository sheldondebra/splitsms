import type { PaymentInstrumentDetails } from "@/lib/payments/payment-details";
import {
  formatInstrumentLabel,
  instrumentDetailRows,
  instrumentReferenceRows,
} from "@/lib/payments/payment-details";
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ChevronDown,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Landmark,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PaymentDetailsBlock({
  instrument,
  paymentId,
  providerReference,
  className,
  defaultOpen = false,
}: {
  instrument: PaymentInstrumentDetails | null;
  paymentId?: string;
  providerReference?: string | null;
  className?: string;
  defaultOpen?: boolean;
}) {
  const rows = instrumentDetailRows(instrument);
  const refs = instrumentReferenceRows(instrument, paymentId, providerReference);
  const summary = formatInstrumentLabel(instrument) ?? "Payment details";
  const Icon = iconForInstrument(instrument);
  const subtitle = instrument?.payerName ?? instrument?.payerEmail ?? null;

  if (rows.length === 0 && refs.length === 0 && !summary) return null;

  return (
    <details
      className={cn(
        "group rounded-lg border border-border/50 bg-muted/10 text-xs overflow-hidden",
        className,
      )}
      open={defaultOpen}
    >
      <summary
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer select-none",
          "hover:bg-muted/20 transition-colors",
          "[&::-webkit-details-marker]:hidden list-none",
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground truncate">{summary}</span>
          {subtitle && (
            <span className="block text-[11px] text-muted-foreground truncate">{subtitle}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-border/40 px-3 py-2 space-y-2">
        {rows.length > 0 && (
          <ul className="space-y-1.5">
            {rows.map((row) => (
              <DetailRow key={row.key} rowKey={row.key} label={row.label} value={row.value} />
            ))}
          </ul>
        )}

        {refs.length > 0 && (
          <div className={cn(rows.length > 0 && "pt-2 border-t border-border/30")}>
            <ul className="space-y-1.5">
              {refs.map((row) => (
                <DetailRow
                  key={row.key}
                  rowKey={row.key}
                  label={row.label}
                  value={row.value}
                  mono
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

function DetailRow({
  rowKey,
  label,
  value,
  mono,
}: {
  rowKey: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  const RowIcon = iconForRowKey(rowKey);
  return (
    <li className="flex items-start gap-2 min-w-0">
      <RowIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-foreground min-w-0 flex-1 text-right truncate",
          mono && "font-mono text-[11px]",
        )}
        title={value}
      >
        {value}
      </span>
    </li>
  );
}

function iconForInstrument(instrument: PaymentInstrumentDetails | null) {
  const channel = instrument?.channel?.toLowerCase() ?? "";
  if (channel.includes("mobile") || instrument?.network) return Smartphone;
  if (channel.includes("bank")) return Building2;
  if (channel.includes("card") || instrument?.last4) return CreditCard;
  return Wallet;
}

function iconForRowKey(key: string) {
  switch (key) {
    case "payerName":
      return User;
    case "payerEmail":
      return Mail;
    case "payerPhone":
      return Phone;
    case "expires":
      return Calendar;
    case "country":
      return Globe;
    case "bank":
      return Landmark;
    case "gateway":
      return CheckCircle2;
    case "providerPaymentId":
    case "providerReference":
    case "paymentId":
      return Hash;
    default:
      return CreditCard;
  }
}
