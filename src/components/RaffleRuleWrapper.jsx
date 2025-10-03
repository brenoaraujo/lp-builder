import React from 'react';

// Simple wrapper component for raffle type rules
const RaffleRuleWrapper = ({ children, hideFor = ["Sweepstakes", "Prize Raffle"] }) => {
    // Get raffle type from localStorage (set during onboarding)
    const raffleType = localStorage.getItem("raffleType");
    const shouldHide = hideFor.includes(raffleType);
    
    if (shouldHide) {
        return null;
    }
    
    return children;
};

export default RaffleRuleWrapper;
