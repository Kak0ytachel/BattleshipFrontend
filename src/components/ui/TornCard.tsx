import './TornCard.css';
import type {ReactNode} from "react";

type TornCardProps = {"children"?: ReactNode, width: number, height: number, className?: unknown};

export default function TornCard({ children = null, width, height, className = null }: TornCardProps)  {
    return (
        <>
            {/* Invisible SVG filter definition injected into the DOM */}
            <svg style={{ display: 'none' }}>
                <defs>
                    <filter id="heavy-tear-filter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={5} result="noise"/>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={30} xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                </defs>
            </svg>

            {/* Component Structure */}
            <div className="torn-container" style={{ width: width, height: height }}>
                <div className="torn-content">
                    {children}
                    <div className={`torn-border-layer ${className || ''}`} />
                </div>
            </div>
        </>
    );
};