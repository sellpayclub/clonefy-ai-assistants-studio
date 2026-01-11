import { Button } from "@/components/ui/button";
import { Zap, Bot, Mic, MessageSquare, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const ClonefyPromoBanner = () => {
    return (
        <div className="w-full max-w-5xl mx-auto my-16 px-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-white/10">
                {/* Glow Effects */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/20 rounded-full blur-[100px]"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold mb-6">
                            <Zap className="h-4 w-4" />
                            CONHEÇA A CLONEFY
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                            Crie seu{" "}
                            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                                Funcionário de IA
                            </span>{" "}
                            especializado para WhatsApp
                        </h2>
                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            Transforme seu atendimento com uma IA que entende seu produto, responde como você e nunca descansa. É o seu negócio no próximo nível.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-slate-300 text-sm">Escuta e responde áudios</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-slate-300 text-sm">Atendimento 24/7 automático</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-slate-300 text-sm">Treinado com seus dados</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-slate-300 text-sm">Multi-plataforma</span>
                            </div>
                        </div>

                        <Link to="/">
                            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                                QUERO MEU FUNCIONÁRIO DE IA
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="hidden lg:block">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shdaow-lg shadow-emerald-500/50">
                                        <Bot className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Assistente Pro</p>
                                        <p className="text-emerald-400 text-xs flex items-center gap-1">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                            Online agora
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white/10 rounded-2xl p-4 rounded-tl-none mr-8">
                                        <p className="text-white text-sm">Olá! Como posso ajudar sua empresa hoje? Já sei tudo sobre seus produtos!</p>
                                    </div>
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 rounded-tr-none ml-8">
                                        <div className="flex items-center gap-2">
                                            <Mic className="h-4 w-4 text-emerald-400" />
                                            <div className="flex gap-1">
                                                <span className="w-1 h-3 bg-emerald-400/50 rounded-full"></span>
                                                <span className="w-1 h-4 bg-emerald-400 rounded-full"></span>
                                                <span className="w-1 h-2 bg-emerald-400/50 rounded-full"></span>
                                                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                                                <span className="w-1 h-3 bg-emerald-400 rounded-full"></span>
                                            </div>
                                            <span className="text-emerald-400 text-xs ml-auto">0:05</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClonefyPromoBanner;
