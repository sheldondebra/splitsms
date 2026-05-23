import { buyCreditsAction, applyPromoAction } from "@/lib/actions/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type WalletCreditsPanelProps = {
  currency: string;
  walletBalance: number;
};

const innerCardClass =
  "flex flex-1 flex-col rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6 min-h-[13rem]";

export function WalletCreditsPanel({ currency, walletBalance }: WalletCreditsPanelProps) {
  return (
    <div className="flex flex-col gap-5 flex-1 h-full">
      <div className={cn(innerCardClass)}>
        <div className="flex items-center gap-2.5 mb-3">
          <Coins className="h-5 w-5 text-primary" />
          <p className="text-base font-semibold">Buy SMS credits</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Convert wallet balance ({currency}{" "}
          {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}) into message
          credits for sending SMS.
        </p>
        <form action={buyCreditsAction} className="mt-auto space-y-5">
          <div className="space-y-2">
            <Label htmlFor="credits" className="text-sm font-medium">
              Number of credits
            </Label>
            <Input
              id="credits"
              name="credits"
              type="number"
              min={1}
              defaultValue={100}
              className="h-12 text-base tabular-nums"
            />
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl font-semibold text-base">
            Buy credits from wallet
          </Button>
        </form>
      </div>

      <div className={cn(innerCardClass)}>
        <div className="flex items-center gap-2.5 mb-3">
          <Tag className="h-5 w-5 text-primary" />
          <p className="text-base font-semibold">Promo code</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Have a promo code? Apply it for bonus credits or wallet balance.
        </p>
        <form action={applyPromoAction} className="mt-auto flex flex-col gap-3 sm:flex-row">
          <Input
            name="code"
            placeholder="Enter code"
            className="h-12 flex-1 uppercase text-base"
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="secondary"
            className="h-12 shrink-0 rounded-xl px-8 font-semibold text-base sm:min-w-[7rem]"
          >
            Apply
          </Button>
        </form>
      </div>
    </div>
  );
}
