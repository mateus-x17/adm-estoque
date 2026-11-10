import { create } from "zustand";
import { persist } from "zustand/middleware";

// arquivo responsável pelo estado global da Organização, lista de lojas/filiais e loja selecionada pelo ADMIN

export const useTenantStore = create(
  persist(
    (set) => ({
      stores: [],
      selectedLojaId: "all", // 'all' para visão consolidada da rede pelo ADMIN, ou ID numérico da filial
      setStores: (stores = []) => set({ stores: Array.isArray(stores) ? stores : [] }),
      setSelectedLojaId: (selectedLojaId = "all") =>
        set({ selectedLojaId: selectedLojaId ? String(selectedLojaId) : "all" }),
      clearTenant: () => set({ stores: [], selectedLojaId: "all" }),
    }),
    {
      name: "tenant-scope",
      getStorage: () => localStorage,
    }
  )
);

