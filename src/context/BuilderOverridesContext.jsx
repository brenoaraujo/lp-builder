// src/context/BuilderOverridesContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const BuilderOverridesContext = createContext(null);
const STORAGE_KEY = "builderOverrides";

export function BuilderOverridesProvider({ children, initial }) {
  const [overridesBySection, setOverridesBySection] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initial || {};
  });

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overridesBySection));
    } catch {}
  }, [overridesBySection]);

  const api = useMemo(() => ({
    overridesBySection,
    setSection: (key, next) =>
      setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...next } })),
    setCopy: (key, label, value) =>
      setOverridesBySection(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), copy: { ...(prev[key]?.copy || {}), [label]: value } }
      })),
    setDisplay: (key, label, value) =>
      setOverridesBySection(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), display: { ...(prev[key]?.display || {}), [label]: value } }
      })),
    setVariant: (key, variant) =>
      setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), variant } })),
    setVisible: (key, visible) =>
      setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), visible } })),
    reset: () => setOverridesBySection({}),
  }), [overridesBySection]);

  return (
    <BuilderOverridesContext.Provider value={api}>
      {children}
    </BuilderOverridesContext.Provider>
  );
}

export function useBuilderOverrides() {
  const ctx = useContext(BuilderOverridesContext);
  if (!ctx) throw new Error("useBuilderOverrides must be used within BuilderOverridesProvider");
  return ctx;
}