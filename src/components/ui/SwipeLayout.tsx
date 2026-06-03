import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import './SwipeLayout.css';
const PAGES = ['/game', '/opponent'];


const SwipeLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentIndex = PAGES.indexOf(location.pathname);

    // Track which animation class to apply
    const [animationClass, setAnimationClass] = useState('');

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentIndex === 0) {
                setAnimationClass('slide-from-right'); // Content comes from the right
                navigate(PAGES[1]);
            }
        },
        onSwipedRight: () => {
            if (currentIndex === 1) {
                setAnimationClass('slide-from-left'); // Content comes from the left
                navigate(PAGES[0]);
            }
        },
        preventScrollOnSwipe: true,
        trackMouse: true,
    });

    // Handle dot clicks (optional direction matching)
    const handleDotClick = (index: number) => {
        if (index === currentIndex) return;
        setAnimationClass(index > currentIndex ? 'slide-from-right' : 'slide-from-left');
        navigate(PAGES[index]);
    };

    return (
        <div {...handlers} className="swipe-page-container">
            {/* Giving this wrapper a `key` equal to the pathname is the magic trick.
        It forces React to tear down and rebuild this DOM node on route change,
        ensuring the CSS animation runs every single time you switch pages.
      */}
            <main key={location.pathname} className={`page-content ${animationClass}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default SwipeLayout;