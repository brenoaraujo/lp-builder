import React, { useState, useEffect, useCallback } from 'react';
import { useInviteRow } from '../hooks/useInviteRow.js';
import { useInviteToken } from '../hooks/useInviteToken.js';

// Simple wrapper component for raffle type rules
const RaffleRuleWrapper = ({ 
    children, 
    hideFor = ["Sweepstakes", "Prize Raffle"],
    raffleType: propRaffleType = null,  // NEW: accept raffle type as prop
    forceRender = false  // NEW: render hidden instead of null
}) => {
    const [raffleType, setRaffleType] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const inviteToken = useInviteToken();
    const { row: inviteRow } = useInviteRow(inviteToken);
    
    // Get raffle type from database (set during onboarding)
    const getRaffleType = useCallback(() => {
        try {
            if (inviteRow?.onboarding_json?.charityInfo?.raffleType) {
                return inviteRow.onboarding_json.charityInfo.raffleType;
            }
            // Fallback to localStorage for backward compatibility
            const charityInfo = JSON.parse(localStorage.getItem("charityInfo") || "{}");
            return charityInfo.raffleType || null;
        } catch (error) {
            console.warn("Failed to parse charityInfo:", error);
            return null;
        }
    }, [inviteRow?.onboarding_json?.charityInfo?.raffleType]);
    
    useEffect(() => {
        // Set initial value and mark as loaded
        setRaffleType(getRaffleType());
        setIsLoaded(true);
    }, [getRaffleType]);
    
    // Use prop if provided, otherwise use hooks
    const effectiveRaffleType = propRaffleType || raffleType;
    
    // Don't render anything until we've loaded the raffle type (unless prop is provided)
    if (!isLoaded && !propRaffleType) {
        return null;
    }
    
    const shouldHide = effectiveRaffleType && hideFor.includes(effectiveRaffleType);
    
    if (shouldHide) {
        if (forceRender) {
            return <div style={{ display: 'none' }}>{children}</div>;
        }
        return null;
    }
    
    return children;
};

export default RaffleRuleWrapper;
