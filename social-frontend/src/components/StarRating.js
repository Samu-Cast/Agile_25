import React, { useState } from 'react';
import './StarRating.css'; // optional styling file

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

    const userRating = currentUserId ? userRatingMap[currentUserId] || 0 : 0;

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
                        style={{ cursor: currentUserId ? 'pointer' : 'default' }}
                    >
                        ☕
                    </span>
                ))}
            </div>
            <span className="average-rating">{average} ☕</span>
        </div>
    );
};

export default StarRating;
