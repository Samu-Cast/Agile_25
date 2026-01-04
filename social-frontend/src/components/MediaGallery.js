import React, { useState, useRef } from 'react';
import '../styles/components/MediaGallery.css';

/**
 * MediaGallery Component
 * Displays a horizontal carousel of images and videos with navigation
 * 
 * @param {Array<string>} mediaUrls - Array of image/video URLs
 * @param {string} altText - Alt text for images
 */
function MediaGallery({ mediaUrls = [], altText = "Media content" }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef(null);

    if (!mediaUrls || mediaUrls.length === 0) return null;

    const isVideo = (url) => {
        return url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video'));
    };

    const goToNext = (e) => {
        if (e) e.stopPropagation();
        const nextIndex = (currentIndex + 1) % mediaUrls.length;
        setCurrentIndex(nextIndex);
        scrollToIndex(nextIndex);
    };

    const goToPrev = (e) => {
        if (e) e.stopPropagation();
        const prevIndex = (currentIndex - 1 + mediaUrls.length) % mediaUrls.length;
        setCurrentIndex(prevIndex);
        scrollToIndex(prevIndex);
    };

    const scrollToIndex = (index) => {
        if (carouselRef.current) {
            const itemWidth = carouselRef.current.offsetWidth;
            carouselRef.current.scrollTo({
                left: itemWidth * index,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft;
            const itemWidth = carouselRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / itemWidth);
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        }
    };

    return (
        <div className="media-gallery-container">
            <div
                className="media-carousel"
                ref={carouselRef}
                onScroll={handleScroll}
            >
                {mediaUrls.map((url, index) => (
                    <div
                        key={index}
                        className="carousel-item"
                    >
                        {isVideo(url) ? (
                            <video
                                src={url}
                                className="media-video"
                                preload="metadata"
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <img
                                src={url}
                                alt={`${altText} ${index + 1}`}
                                className="media-image"
                                loading="lazy"
                            />
                        )}
                        {isVideo(url) && (
                            <div className="video-overlay">
                                <span className="play-icon">▶</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows - only show if more than 1 media */}
            {mediaUrls.length > 1 && (
                <>
                    <button
                        className="carousel-nav prev"
                        onClick={goToPrev}
                        aria-label="Previous"
                    >
                        ‹
                    </button>
                    <button
                        className="carousel-nav next"
                        onClick={goToNext}
                        aria-label="Next"
                    >
                        ›
                    </button>

                    {/* Indicators */}
                    <div className="carousel-indicators">
                        {mediaUrls.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    scrollToIndex(index);
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default MediaGallery;
