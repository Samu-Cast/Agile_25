import React, { useState } from 'react';
import '../styles/components/StarRating.css'; // optional styling file

/**
 * StarRating component renders 5 clickable stars for rating.
 * Props:
 *  - postId: string
 *  - userRatingMap: object mapping userId -> rating (0-5)
 *  - currentUserId: string | undefined
 *  - onRatingChange: function(postId, rating)
 */
const StarRating = ({ postId, userRatingMap = {}, currentUserId, onRatingChange }) => {
    const [hover, setHover] = useState(0);

    // Compute average rating
    const ratings = Object.values(userRatingMap);
    const average =
        ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
            : '0.0';

    const userRating = currentUserId ? Number(userRatingMap[currentUserId] || 0) : 0;

    const handleClick = (rating) => {
        if (!currentUserId) {
            alert('Devi essere loggato per valutare!');
            return;
        }
        onRatingChange(postId, rating);
    };

    return (
        <div className="star-rating">
            <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${star <= (hover || userRating) ? 'filled' : ''}`}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => handleClick(star)}
                        style={{
                            cursor: currentUserId ? 'pointer' : 'default',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={star <= (hover || userRating) ? '#6F4E37' : '#BDBDBD'}
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ transition: 'fill 0.2s' }}
                        >
                            <path d="M2,19H17V8H2V19M19,8H21C22.1,8 23,8.9 23,10V12C23,13.1 22.1,14 21,14H19V8M17,21H2V23H17V21Z" />
                        </svg>
                    </span>
                ))}
            </div>
            <span className="average-rating">{average} ☕</span>
        </div>
    );
};

export default StarRating;
