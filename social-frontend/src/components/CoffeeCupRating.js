import React, { useState } from 'react';
import '../styles/components/CoffeeCupRating.css';

/**
 * CoffeeCupRating Component
 * Displays or allows selection of a 0.5-5 coffee cup rating with SVG icons
 * 
 * @param {number} rating - Current rating (0.5-5, in 0.5 increments)
 * @param {boolean} interactive - If true, allows clicking to change rating
 * @param {function} onChange - Callback when rating changes (rating) => void
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 */
function CoffeeCupRating({ rating = 0, interactive = false, onChange, size = 'medium' }) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (value) => {
        if (interactive && onChange) {
            // Allow toggling: clicking same rating sets it to 0, or use value as-is
            // For half ratings: we'll support clicking on left/right half of cup
            onChange(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (interactive) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0);
        }
    };

    // For interactive mode, handle half-cup clicks
    const handleCupClick = (index, e) => {
        if (!interactive || !onChange) return;

        const cup = e.currentTarget;
        const rect = cup.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // If clicked on left half, use .5, otherwise use full
        const isLeftHalf = x < width / 2;
        const value = isLeftHalf ? index + 0.5 : index + 1;

        onChange(value);
    };

    const handleCupMouseMove = (index, e) => {
        if (!interactive) return;

        const cup = e.currentTarget;
        const rect = cup.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        const isLeftHalf = x < width / 2;
        const value = isLeftHalf ? index + 0.5 : index + 1;

        setHoverRating(value);
    };

    const displayRating = hoverRating || rating;

    // SVG Coffee Cup Component
    const CoffeeCup = ({ fillType }) => (
        <svg
            className={`coffee-cup-svg ${fillType}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Cup body */}
            <path
                d="M4 9h14v7c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V9z"
                className="cup-body"
            />
            {/* Handle */}
            <path
                d="M18 11h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1"
                className="cup-handle"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Steam */}
            <path
                d="M7 5c0-1 .5-2 1.5-2s1.5 1 1.5 2M11 5c0-1 .5-2 1.5-2s1.5 1 1.5 2M15 5c0-1 .5-2 1.5-2S18 4 18 5"
                className="cup-steam"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Half fill overlay for half cups */}
            {fillType === 'half' && (
                <path
                    d="M4 9h7v7c0 1.1-.45 2-1 2H6c-1.1 0-2-.9-2-2V9z"
                    className="cup-half-fill"
                />
            )}
        </svg>
    );

    return (
        <div className={`coffee-cup-rating ${size} ${interactive ? 'interactive' : ''}`}>
            {[0, 1, 2, 3, 4].map((index) => {
                const cupValue = index + 1;
                let fillType = 'empty';

                if (displayRating >= cupValue) {
                    fillType = 'full';
                } else if (displayRating >= cupValue - 0.5) {
                    fillType = 'half';
                }

                return (
                    <span
                        key={index}
                        className={`cup-container ${fillType}`}
                        onClick={(e) => handleCupClick(index, e)}
                        onMouseMove={(e) => handleCupMouseMove(index, e)}
                        onMouseLeave={handleMouseLeave}
                        role={interactive ? 'button' : 'img'}
                        aria-label={`${cupValue} coffee cup${cupValue > 1 ? 's' : ''}`}
                    >
                        <CoffeeCup fillType={fillType} />
                    </span>
                );
            })}
            {interactive && displayRating > 0 && (
                <span className="rating-value">{displayRating.toFixed(1)}</span>
            )}
        </div>
    );
}

export default CoffeeCupRating;
