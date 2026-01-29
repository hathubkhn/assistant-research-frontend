'use client'
import React, { useEffect, useRef } from 'react';

interface AutoScrollContainerProps {
    children: React.ReactNode;
}

const AutoScrollContainer: React.FC<AutoScrollContainerProps> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const lastChild = container.lastElementChild as HTMLElement;
            lastChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [children]);

    return (
        <div ref={containerRef} className='flex flex-col' style={{ overflowY: 'auto', maxHeight: '100%', minHeight: '100%' }}>
            {children}
        </div>
    );
};
export default AutoScrollContainer