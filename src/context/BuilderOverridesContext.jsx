// src/context/BuilderOverridesContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from "react";

const BuilderOverridesContext = createContext(null);

export function BuilderOverridesProvider({ children, inviteToken, inviteRow, onUpdateInvite, skipAutoSave = false, skipSync = false }) {
  const [overridesBySection, setOverridesBySection] = useState(() => {
    // During onboarding, initialize from onboarding_json.sectionOverrides
    if (skipSync && inviteRow?.onboarding_json?.sectionOverrides) {
      console.log('🔄 BuilderOverridesContext: Initializing from onboarding_json.sectionOverrides');
      return inviteRow.onboarding_json.sectionOverrides;
    }
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

  // Update overrides when inviteRow changes (skip during onboarding)
  useEffect(() => {
    if (skipSync) {
      console.log('⏸️ BuilderOverridesContext sync skipped (onboarding mode)');
      return;
    }
    if (inviteRow?.overrides_json) {
      setOverridesBySection(inviteRow.overrides_json);
    }
  }, [inviteRow?.overrides_json, skipSync]);

  // Persist changes to database (only if not skipped)
  useEffect(() => {
    if (skipAutoSave) {
      console.log('⏸️ BuilderOverridesContext auto-save skipped (onboarding mode)');
      return;
    }
    debouncedSave(overridesBySection);
  }, [overridesBySection, debouncedSave, skipAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    setTheme: (key, themeOverrides) =>
      setOverridesBySection(prev => ({
        ...prev,
        [key]: { 
          ...(prev[key] || {}), 
          theme: themeOverrides 
        }
      })),
    addExtraContentSection: () => {
      const existingKeys = Object.keys(overridesBySection).filter(key => key.startsWith('extraContent_'));
      const nextIndex = existingKeys.length + 1;
      const newKey = `extraContent_${nextIndex}`;
      setOverridesBySection(prev => ({
        ...prev,
        [newKey]: { visible: true, variant: 'A', copy: {}, display: {} }
      }));
      return newKey;
    },
    removeExtraContentSection: (key) => {
      setOverridesBySection(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    },
    getExtraContentSections: () => {
      return Object.keys(overridesBySection)
        .filter(key => key.startsWith('extraContent_'))
        .sort((a, b) => {
          const aIndex = parseInt(a.split('_')[1]);
          const bIndex = parseInt(b.split('_')[1]);
          return aIndex - bIndex;
        });
    },
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