"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useExitModal } from "@/contexts/ExitModalContext";

export function ExitModal() {
  const router = useRouter();
  const { showExitModal, pendingNav, setShowExitModal, setPendingNav } = useExitModal();

  if (!showExitModal) return null;

  const handleConfirm = () => {
    setShowExitModal(false);
    const target = pendingNav;
    setPendingNav(null);
    if (target) {
      router.push(target);
    }
  };

  const handleCancel = () => {
    setShowExitModal(false);
    setPendingNav(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Icon icon="exit_to_app" size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            SAIR DO AMBIENTE PÚBLICO?
          </h2>
          <p className="text-on-surface-variant text-center mt-2">
            Você está visualizando um ambiente público. Ao sair, perde o acesso a menos que clique novamente no link.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleConfirm}
              className="w-full bg-error text-white font-bold py-3 px-6 rounded-xl hover:bg-error/90 transition-colors"
            >
              SIM, SAIR
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-xl hover:bg-surface-container-highest transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}