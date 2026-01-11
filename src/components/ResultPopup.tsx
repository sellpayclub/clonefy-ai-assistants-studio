import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowRight, Bot, Check, Copy, ExternalLink, Mic, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

interface ResultPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    resultLabel: string;
    resultValue: string;
    actionUrl?: string;
    actionLabel?: string;
}

const ResultPopup = ({
    isOpen,
    onClose,
    title,
    description,
    resultLabel,
    resultValue,
    actionUrl,
    actionLabel = "Testar Link",
}: ResultPopupProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(resultValue);
        setIsCopied(true);
        toast.success("Copiado para a área de transferência!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                {/* Result Section */}
                <div className="p-6 sm:p-8 bg-white">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="h-6 w-6 text-emerald-500" />
                            {title}
                        </DialogTitle>
                        {description && (
                            <DialogDescription className="text-slate-500">
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">{resultLabel}</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 truncate font-mono">
                                {resultValue}
                            </div>
                            <Button
                                onClick={copyToClipboard}
                                variant="outline"
                                className={`shrink-0 rounded-xl px-4 border-slate-200 hover:bg-slate-50 ${isCopied ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : ''}`}
                            >
                                {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                        {actionUrl && (
                            <a href={actionUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <Button variant="ghost" className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl gap-2 font-semibold">
                                    {actionLabel} <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* Clonefy Promo Banner */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                            <Bot className="h-8 w-8 text-white" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">
                                Automatize seu WhatsApp com IA
                            </h3>
                            <p className="text-slate-300 text-sm mb-3">
                                A Clonefy cria Funcionários de IA que atendem 24/7, escutam áudios e respondem como você.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-white/10 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Check className="h-3 w-3 text-emerald-400" /> Atendimento 24h
                                </span>
                                <span className="bg-white/10 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Mic className="h-3 w-3 text-emerald-400" /> Responde Áudios
                                </span>
                            </div>
                        </div>

                        <Link to="/" onClick={onClose}>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-6 py-5 shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
                                CONHECER <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ResultPopup;
