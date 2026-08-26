"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "splitsms.member-sidebar-collapsed";

type MemberSidebarCollapseContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const MemberSidebarCollapseContext = createContext<MemberSidebarCollapseContextValue>({
  collapsed: false,
  toggle: () => undefined,
});

export function MemberSidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
      else if (stored === "0") setCollapsed(false);
      else if (window.matchMedia("(max-width: 1279px)").matches) setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <MemberSidebarCollapseContext.Provider value={{ collapsed, toggle }}>
      {children}
    </MemberSidebarCollapseContext.Provider>
  );
}

export function useMemberSidebarCollapsed() {
  return useContext(MemberSidebarCollapseContext);
}
