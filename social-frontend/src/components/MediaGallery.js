import React, { useState } from 'react';
import '../styles/components/MediaGallery.css';

/**
 * MediaGallery Component
 * Displays a grid of images and videos with lightbox functionality
 * 
 * @param {Array<string>} mediaUrls - Array of image/video URLs
 * @param {string} altText - Alt text for images
 */
function MediaGallery({ mediaUrls = [], altText = "Media content" }) {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    if (!mediaUrls || mediaUrls.length === 0) return null;

    const isVideo = (url) => {
        return url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video'));
    };

    const openLightbox = (index) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const goToNext = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % mediaUrls.length);
    };

    const goToPrev = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
    };

    const getGridClass = () => {
        const count = mediaUrls.length;
        if (count === 1) return 'grid-single';
        if (count === 2) return 'grid-two';
        if (count === 3) return 'grid-three';
        if (count === 4) return 'grid-four';
        return 'grid-many';
    };

    return (
        <>
            <div className={`media-gallery ${getGridClass()}`}>
                {mediaUrls.map((url, index) => (
                    <div
                        key={index}
                        className="media-item"
                        onClick={() => openLightbox(index)}
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

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="lightbox" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        {isVideo(mediaUrls[lightboxIndex]) ? (
                            <video
                                src={mediaUrls[lightboxIndex]}
                                controls
                                autoPlay
                                className="lightbox-media"
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <img
                                src={mediaUrls[lightboxIndex]}
                                alt={`${altText} ${lightboxIndex + 1}`}
                                className="lightbox-media"
                            />
                        )}

                        {mediaUrls.length > 1 && (
                            <>
                                <button className="lightbox-nav prev" onClick={goToPrev}>
                                    ‹
                                </button>
                                <button className="lightbox-nav next" onClick={goToNext}>
                                    ›
                                </button>
                            </>
                        )}

                        <button className="lightbox-close" onClick={closeLightbox}>
                            ×
                        </button>

                        <div className="lightbox-counter">
                            {lightboxIndex + 1} / {mediaUrls.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default MediaGallery;
