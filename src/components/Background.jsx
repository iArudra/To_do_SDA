import React, { useMemo } from 'react';
import './Background.css';

const Background = ({ theme }) => {
    const isDark = theme === 'dark';

    // Generate random positions for stars
    const stars = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`, // Keep stars in the upper 60%
            size: `${Math.random() * 2 + 1}px`,
            duration: `${Math.random() * 3 + 2}s`,
            delay: `${Math.random() * 2}s`
        }));
    }, []);

    // Generate clouds
    const clouds = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 40 - 20}%`, // Start off-screen or partial
            top: `${Math.random() * 30 + 5}%`,
            scale: Math.random() * 0.5 + 0.8,
            duration: `${Math.random() * 20 + 30}s`, // Slow movement
            delay: `-${Math.random() * 20}s` // Start mid-animation
        }));
    }, []);

    // Generate dandelion seeds
    const seeds = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 20}%`,
            duration: `${Math.random() * 10 + 10}s`,
            delay: `${Math.random() * 10}s`
        }));
    }, []);

    return (
        <div className={`background-container ${isDark ? 'background-night' : 'background-day'}`}>

            {/* Celestial Body */}
            <div className={`celestial-body ${isDark ? 'moon' : 'sun'}`}></div>

            {/* Day Elements */}
            {!isDark && clouds.map(cloud => (
                <div
                    key={cloud.id}
                    className="cloud"
                    style={{
                        top: cloud.top,
                        left: cloud.left, // Initial position, animation handles movement
                        width: `${120 * cloud.scale}px`,
                        height: `${50 * cloud.scale}px`,
                        animationDuration: cloud.duration,
                        animationDelay: cloud.delay
                    }}
                />
            ))}

            {!isDark && seeds.map(seed => (
                <div
                    key={seed.id}
                    className="dandelion-seed"
                    style={{
                        left: seed.left,
                        bottom: seed.bottom,
                        animationDuration: seed.duration,
                        animationDelay: seed.delay
                    }}
                />
            ))}

            {/* Night Elements */}
            {isDark && stars.map(star => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: star.left,
                        top: star.top,
                        width: star.size,
                        height: star.size,
                        animationDuration: star.duration,
                        animationDelay: star.delay
                    }}
                />
            ))}

            {/* Landscape Hills - Colors change via CSS vars in index.css */}
            <div
                className="hill hill-3"
                style={{ backgroundColor: isDark ? 'var(--hill-3-dark)' : 'var(--hill-3-light)' }}
            ></div>
            <div
                className="hill hill-2"
                style={{ backgroundColor: isDark ? 'var(--hill-2-dark)' : 'var(--hill-2-light)' }}
            ></div>
            <div
                className="hill hill-1"
                style={{ backgroundColor: isDark ? 'var(--hill-1-dark)' : 'var(--hill-1-light)' }}
            ></div>

        </div>
    );
};

export default Background;
