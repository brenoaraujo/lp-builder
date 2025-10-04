import React, { useState, useEffect, useCallback } from 'react';

// Simple wrapper component for raffle type rules
const RaffleRuleWrapper = ({ children, hideFor = ["Sweepstakes", "Prize Raffle"] }) => {
    const [raffleType, setRaffleType] = useState(null);
    
    // Get raffle type from localStorage (set during onboarding)
    const getRaffleType = useCallback(() => {
        try {
            const charityInfo = JSON.parse(localStorage.getItem("charityInfo") || "{}");
            return charityInfo.raffleType || null;
        } catch (error) {
            console.warn("Failed to parse charityInfo from localStorage:", error);
            return null;
        }
    }, []);
    
    useEffect(() => {
        // Set initial value
        setRaffleType(getRaffleType());
        
        // Listen for storage changes (when onboarding completes)
        const handleStorageChange = (e) => {
            if (e.key === "charityInfo") {
                setRaffleType(getRaffleType());
            }
        };
        
        window.addEventListener("storage", handleStorageChange);
        
        // Also check periodically in case storage event doesn't fire
        const interval = setInterval(() => {
            const currentRaffleType = getRaffleType();
            setRaffleType(prev => prev !== currentRaffleType ? currentRaffleType : prev);
        }, 1000);
        
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearInterval(interval);
        };
    }, [getRaffleType]);
    
    const shouldHide = raffleType && hideFor.includes(raffleType);
    
    if (shouldHide) {
        return null;
    }
    
    return children;
};

export default RaffleRuleWrapper;
