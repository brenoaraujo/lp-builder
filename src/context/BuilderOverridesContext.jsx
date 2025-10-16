// src/context/BuilderOverridesContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from "react";

const BuilderOverridesContext = createContext(null);

export function BuilderOverridesProvider({ children, inviteToken, inviteRow, onUpdateInvite }) {
  const [overridesBySection, setOverridesBySection] = useState(() => {
    return inviteRow?.overrides_json || {};
  });

  // Debounced save to database
  const saveTimeoutRef = useRef(null);
  
  const debouncedSave = useCallback((newOverrides) => {
    if (!inviteToken || !onUpdateInvite) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdateInvite({ overrides_json: newOverrides });
      } catch (error) {
        console.error('Failed to save overrides:', error);
      }
    }, 1000); // 1 second debounce
  }, [inviteToken, onUpdateInvite]);

  // Update overrides when inviteRow changes
  useEffect(() => {
    if (inviteRow?.overrides_json) {
      setOverridesBySection(inviteRow.overrides_json);
    }
  }, [inviteRow?.overrides_json]);

  // Persist changes to database
  useEffect(() => {
    debouncedSave(overridesBySection);
  }, [overridesBySection, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Individual useCallback hooks to prevent unnecessary recreation
  const setSection = useCallback((key, next) =>
    setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...next } })),
    []
  );

  const setCopy = useCallback((key, label, value) =>
    setOverridesBySection(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), copy: { ...(prev[key]?.copy || {}), [label]: value } }
    })),
    []
  );

  const setDisplay = useCallback((key, label, value) =>
    setOverridesBySection(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), display: { ...(prev[key]?.display || {}), [label]: value } }
    })),
    []
  );

  const setVariant = useCallback((key, variant) =>
    setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), variant } })),
    []
  );

  const setVisible = useCallback((key, visible) =>
    setOverridesBySection(prev => ({ ...prev, [key]: { ...(prev[key] || {}), visible } })),
    []
  );

  const setTheme = useCallback((key, themeOverrides) =>
    setOverridesBySection(prev => ({
      ...prev,
      [key]: { 
        ...(prev[key] || {}), 
        theme: themeOverrides 
      }
    })),
    []
  );

  const addExtraContentSection = useCallback(() => {
    setOverridesBySection(prev => {
      const existingKeys = Object.keys(prev).filter(key => key.startsWith('extraContent_'));
      const nextIndex = existingKeys.length + 1;
      const newKey = `extraContent_${nextIndex}`;
      return {
        ...prev,
        [newKey]: { visible: true, variant: 'A', copy: {}, display: {} }
      };
    });
    // Return the key by reading from state after update
    const existingKeys = Object.keys(overridesBySection).filter(key => key.startsWith('extraContent_'));
    const nextIndex = existingKeys.length + 1;
    return `extraContent_${nextIndex}`;
  }, [overridesBySection]);

  const removeExtraContentSection = useCallback((key) => {
    setOverridesBySection(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getExtraContentSections = useCallback(() => {
    return Object.keys(overridesBySection)
      .filter(key => key.startsWith('extraContent_'))
      .sort((a, b) => {
        const aIndex = parseInt(a.split('_')[1]);
        const bIndex = parseInt(b.split('_')[1]);
        return aIndex - bIndex;
      });
  }, [overridesBySection]);

  const reset = useCallback(() => setOverridesBySection({}), []);

  const api = useMemo(() => ({
    overridesBySection,
    setSection,
    setCopy,
    setDisplay,
    setVariant,
    setVisible,
    setTheme,
    addExtraContentSection,
    removeExtraContentSection,
    getExtraContentSections,
    reset
  }), [
    overridesBySection,
    setSection,
    setCopy,
    setDisplay,
    setVariant,
    setVisible,
    setTheme,
    addExtraContentSection,
    removeExtraContentSection,
    getExtraContentSections,
    reset
  ]);

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