import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { useApiWallet } from "@/hooks/useApiWallet";
import { Button } from "@/components/ui/button";

/**
 * Banner informativo (não bloqueia nada) que avisa quando o saldo de API
 * está acabando ou zerado, com link para a página de recarga.
 */
const ApiBalanceBanner = () => {
  const { isLow, isEmpty, loading } = useApiWallet();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !isLow) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 text-sm border-b ${
        isEmpty
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
      }`}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">
        {isEmpty
          ? "Seu saldo de API acabou. Recarregue para manter sua IA respondendo no WhatsApp."
          : "Seu saldo de API está acabando. Recarregue para não ficar sem IA."}
      </span>
      <Button asChild size="sm" variant={isEmpty ? "destructive" : "default"} className="h-7">
        <Link to="/saldo-api">Recarregar</Link>
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="opacity-70 hover:opacity-100"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ApiBalanceBanner;
