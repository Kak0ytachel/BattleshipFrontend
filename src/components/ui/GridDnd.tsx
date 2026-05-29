import { useState, useRef, useCallback, useEffect } from "react";
import ship1 from "/src/assets/ship1.svg";
import ship2 from "/src/assets/ship2.svg";
import ship2r from "/src/assets/ship2r.svg";
import ship3 from "/src/assets/ship3.svg";
import ship3r from "/src/assets/ship3r.svg";
import "./GridDnd.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Block {
    id: string;
    label: string;
    w: number;
    h: number;
    color: string;
}

interface PlacedBlock {
    blockId: string;
    col: number;
    row: number;
}

export interface BlockCoords {
    blockId: string;
    label: string;
    color: string;
    cells: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 6;
const ROWS = 6;
const CELL_SIZE = 50; // px
const GAP = 0;        // px
const GRID_PAD = -1;  // px

const PALETTE: Block[] = [
    { id: "a", label: "1×3", w: 3, h: 1, color: "rgba(59 130 246 / 0.4)" },
    { id: "b", label: "1×2", w: 2, h: 1, color: "rgba(59 130 246 / 0.4)" },
    { id: "c", label: "2×1", w: 2, h: 1, color: "rgba(59 130 246 / 0.4)" },
    // { id: "d", label: "3×1", w: 3, h: 1, color: "#10b981" },
    { id: "d", label: "1×1", w: 1, h: 1, color: "rgba(59 130 246 / 0.4)" },
    { id: "e", label: "1×1", w: 1, h: 1, color: "rgba(59 130 246 / 0.4)" },
    { id: "f", label: "1×1", w: 1, h: 1, color: "rgba(59 130 246 / 0.4)" },
    // { id: "f", label: "3×3", w: 3, h: 3, color: "#ef4444" },
];

// ─── Textures ─────────────────────────────────────────────────────────────────
// One bespoke SVG image per block id, pre-encoded as data URIs.
// Each motif is designed at 40×40 and tiled via background-repeat.

const TEXTURES: Record<string, string> = (() => {
    // const colors: Record<string, string> = {
    //     a: "#f59e0b", b: "#6366f1", c: "#ec4899",
    //     d: "#3b82f6", e: "#ef4444", f: "#10b981",
    // };

    const svgs: Record<string, string> = {
        a: ship3,
        ar: ship3r,
        br: ship2r,
        b: ship2,
        cr: ship2r,
        c: ship2,
        d: ship1,
        e: ship1,
        f: ship1
    };

    return Object.fromEntries(
        Object.entries(svgs).map(([id, fn]) => {

            // const backgroundValue = ;
                // result.trim().startsWith("<svg")
                // ? `url("data:image/svg+xml,${encodeURIComponent(result)}")`
                // :

            return [id, `url("${fn}")`];
        })
    );
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cellLabel(col: number, row: number): string {
    return `${col + 1}${String.fromCharCode(65 + row)}`; // TODO check if correct
}

function fits(col: number, row: number, w: number, h: number): boolean {
    return col >= 0 && row >= 0 && col + w <= COLS && row + h <= ROWS;
}

function overlaps(
    col: number, row: number, w: number, h: number,
    placed: PlacedBlock[], excludeId: string | null,
    rotations: Record<string, number>
): boolean {
    const c0 = col - 1, r0 = row - 1, c1 = col + w + 1, r1 = row + h + 1;
    for (const p of placed) {
        if (p.blockId === excludeId) continue;
        const base = PALETTE.find((x) => x.id === p.blockId)!;
        const rot = rotations[p.blockId] ?? 0;
        const bw = rot ? base.h : base.w;
        const bh = rot ? base.w : base.h;
        const noOverlap = c1 <= p.col || p.col + bw <= c0 || r1 <= p.row || p.row + bh <= r0;
        if (!noOverlap) return true;
    }
    return false;
}

function cursorToCell(cursorX: number, cursorY: number, offsetPxX: number, offsetPxY: number) {
    const step = CELL_SIZE + GAP;
    return {
        col: Math.floor((cursorX - offsetPxX) / step),
        row: Math.floor((cursorY - offsetPxY) / step),
    };
}

function blockPx(ew: number, eh: number) {
    return {
        width:  ew * CELL_SIZE + (ew - 1) * GAP,
        height: eh * CELL_SIZE + (eh - 1) * GAP,
    };
}

// ─── BlockFace ────────────────────────────────────────────────────────────────

interface BlockFaceProps {
    block: Block;
    rotated: boolean;
    pw: number;
    ph: number;
    onGrid?: boolean;
    placed?: boolean;
    placedLeft?: number;
    placedTop?: number;
    onClick?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onDoubleClick?: () => void;
}

function BlockFace({
                       block, rotated, pw, ph, onGrid = false, placed: isPlaced = false,
                       placedLeft, placedTop, onClick, draggable, onDragStart, onDragEnd, onDoubleClick,
                   }: BlockFaceProps) {
    const classes = [
        "block-face",
        onGrid    ? "block-face--on-grid"  : "",
        isPlaced  ? "block-face--placed"   : "",
    ].filter(Boolean).join(" ");

    const style: React.CSSProperties = {
        width: pw,
        height: ph,
        "--block-color": block.color,
        backgroundImage: onGrid ? undefined : TEXTURES[block.id + (rotated ? "r" : "") ],
    } as React.CSSProperties;

    if (isPlaced) {
        style.left = placedLeft;
        style.top  = placedTop;
    }

    // const labelText = onGrid
    //     ? "···"
    //     : rotated && block.w !== block.h
    //         ? `${block.h}×${block.w}↺`
    //         : block.label;

    return (
        <div
            className={classes}
            style={style}
            draggable={draggable}
            onClick={onClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDoubleClick={onDoubleClick}
        >
            {/*<span className="block-face__label">{labelText}</span>*/}
            {!onGrid && block.w !== block.h && !rotated && (
                <span className="block-face__rotate-hint">↺</span>
            )}
        </div>
    );
}

// ─── ResultPanel ──────────────────────────────────────────────────────────────

// function ResultPanel({ results, width }: { results: BlockCoords[]; width: number }) {
//     return (
//         <div className="result-panel" style={{ width }}>
//             <div className="result-panel__heading">
//                 <span className="result-panel__heading-icon">✓</span>
//                 ALL BLOCKS PLACED
//             </div>
//             <div className="result-panel__rows">
//                 {results.map((r, i) => (
//                     <div
//                         key={r.blockId}
//                         className="result-panel__row"
//                         style={{ animationDelay: `${i * 0.06}s` }}
//                     >
//                         <div
//                             className="result-panel__swatch"
//                             style={{
//                                 background: r.color,
//                                 boxShadow: `0 0 8px ${r.color}88`,
//                             }}
//                         />
//                         <span className="result-panel__block-label">{r.label}</span>
//                         <div className="result-panel__cells">
//                             {r.cells.map((cell, ci) => (
//                                 <span
//                                     key={cell}
//                                     className="result-panel__cell-badge"
//                                     style={{
//                                         color: r.color,
//                                         background: `${r.color}22`,
//                                         border: `1px solid ${r.color}55`,
//                                         animationDelay: `${i * 0.06 + ci * 0.03}s`,
//                                     }}
//                                 >
//                   {cell}
//                 </span>
//                             ))}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// ─── Main component ───────────────────────────────────────────────────────────

interface DragDropGridProps {
    onAllPlaced?: (coords: BlockCoords[], placed: PlacedBlock[]) => void;
}

export default function DragDropGrid({ onAllPlaced }: DragDropGridProps = {}) {
    const [placed, setPlaced]     = useState<PlacedBlock[]>([]);
    const [rotations, setRotations] = useState<Record<string, number>>({});
    const [ghost, setGhost]       = useState<{
        col: number; row: number; w: number; h: number; valid: boolean;
    } | null>(null);
    const [result, setResult]     = useState<BlockCoords[] | null>(null);

    const drag = useRef<{
        blockId: string; w: number; h: number;
        offsetPxX: number; offsetPxY: number; fromGrid: boolean;
    } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null!);

    const effectiveWH = useCallback((block: Block, blockId: string) => {
        const rot = rotations[blockId] ?? 0;
        return rot ? { w: block.h, h: block.w } : { w: block.w, h: block.h };
    }, [rotations]);

    const cursorInGrid = useCallback((e: React.DragEvent) => {
        const rect = gridRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return { x: e.clientX - rect.left - GRID_PAD, y: e.clientY - rect.top - GRID_PAD };
    }, []);

    const prevAns = useRef<BlockCoords[] | null>(null);

    //  fire onAllPlaced when every block is placed
    useEffect(() => {
        if (placed.length !== PALETTE.length) { setResult(null); return; }
        const coords: BlockCoords[] = placed.map((p) => {
            const block = PALETTE.find((b) => b.id === p.blockId)!;
            const { w, h } = effectiveWH(block, p.blockId);
            const cells: string[] = [];
            for (let r = p.row; r < p.row + h; r++)
                for (let c = p.col; c < p.col + w; c++)
                    cells.push(cellLabel(c, r));
            cells.sort();
            return { blockId: p.blockId, label: block.label, color: block.color, cells };
        });

        setResult(coords);
        if (JSON.stringify(coords) === JSON.stringify(prevAns.current)) return;
        prevAns.current = coords;
        onAllPlaced?.(coords, placed);

    }, [placed, effectiveWH, onAllPlaced]);

    // ── Rotation ──
    const toggleRotation = useCallback((blockId: string) => {
        const base = PALETTE.find((b) => b.id === blockId)!;
        if (base.w === base.h) return;
        setRotations((prev) => ({ ...prev, [blockId]: prev[blockId] ? 0 : 1 }));
    }, []);

    // ── Drag start (palette) ──
    const onPaletteDragStart = useCallback((e: React.DragEvent, block: Block) => {
        e.dataTransfer.effectAllowed = "move";
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const { w, h } = effectiveWH(block, block.id);
        drag.current = {
            blockId: block.id, w, h,
            offsetPxX: e.clientX - rect.left,
            offsetPxY: e.clientY - rect.top,
            fromGrid: false,
        };
    }, [effectiveWH]);

    // ── Drag start (placed block) ──
    const onPlacedDragStart = useCallback((e: React.DragEvent, _p: PlacedBlock, block: Block) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const { w, h } = effectiveWH(block, block.id);
        drag.current = {
            blockId: block.id, w, h,
            offsetPxX: e.clientX - rect.left,
            offsetPxY: e.clientY - rect.top,
            fromGrid: true,
        };
        setTimeout(() => { (e.currentTarget as HTMLElement).style.opacity = "0"; }, 0);
    }, [effectiveWH]);

    const onPlacedDragEnd = useCallback((e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
        setGhost(null);
    }, []);

    // ── Shared target computation ──
    const computeTarget = useCallback((e: React.DragEvent) => {
        if (!drag.current) return null;
        const pos = cursorInGrid(e);
        if (!pos) return null;
        const { w, h, offsetPxX, offsetPxY, blockId, fromGrid } = drag.current;
        const { col, row } = cursorToCell(pos.x, pos.y, offsetPxX, offsetPxY);
        const valid =
            fits(col, row, w, h) &&
            !overlaps(col, row, w, h, placed, fromGrid ? blockId : null, rotations);
        return { col, row, w, h, valid, blockId, fromGrid };
    }, [placed, rotations, cursorInGrid]);

    const onGridDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const t = computeTarget(e);
        if (!t) return;
        setGhost({ col: t.col, row: t.row, w: t.w, h: t.h, valid: t.valid });
        e.dataTransfer.dropEffect = t.valid ? "move" : "none";
    }, [computeTarget]);

    const onGridDragLeave = useCallback(() => setGhost(null), []);

    const onGridDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setGhost(null);
        const t = computeTarget(e);
        if (!t || !t.valid) return;
        const { col, row, blockId, fromGrid } = t;
        setPlaced((prev) => {
            const next = fromGrid ? prev.filter((p) => p.blockId !== blockId) : prev;
            return [...next, { blockId, col, row }];
        });
        drag.current = null;
    }, [computeTarget]);

    const onRemove = useCallback((blockId: string) => {
        setPlaced((prev) => prev.filter((p) => p.blockId !== blockId));
    }, []);

    // ── Derived: occupied + halo sets ──
    const placedIds      = new Set(placed.map((p) => p.blockId));
    const occupiedCells  = new Set<string>();
    const haloCells      = new Set<string>();

    for (const p of placed) {
        const base = PALETTE.find((x) => x.id === p.blockId)!;
        const { w: bw, h: bh } = effectiveWH(base, p.blockId);
        for (let r = p.row; r < p.row + bh; r++)
            for (let c = p.col; c < p.col + bw; c++)
                occupiedCells.add(`${c},${r}`);
        for (let r = p.row - 1; r < p.row + bh + 1; r++)
            for (let c = p.col - 1; c < p.col + bw + 1; c++)
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !occupiedCells.has(`${c},${r}`))
                    haloCells.add(`${c},${r}`);
    }

    // ── Axis label data ──
    const colLabelItems = Array.from({ length: COLS }, (_, i) => i);
    const rowLabelItems = Array.from({ length: ROWS }, (_, i) => i);

    // ── Background cell data ──
    const cellItems = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const key = `${c},${r}`;
            const cls = occupiedCells.has(key) ? "cell cell--occupied"
                : haloCells.has(key)     ? "cell cell--halo"
                    : "cell";
            cellItems.push(
                <div
                    key={key}
                    className={cls}
                    style={{ gridColumn: c + 1, gridRow: r + 1 }}
                />
            );
        }
    }

    // ── Pixel geometry ──
    // const gridContentWidth = COLS * CELL_SIZE + (COLS - 1) * GAP;
    // const resultPanelWidth = gridContentWidth + GRID_PAD * 2;

    return (
        <div className="grid-app">
            {/* Header */}
            {/*<div className="grid-app__title">*/}
                {/*<h1>GRID LAYOUT</h1>*/}
                {/*<p>click to rotate · drag to place · double-click placed block to remove</p>*/}
            {/*</div>*/}



            {/* Grid + axis labels */}
            <div className="grid-wrapper">
                {/* Column number labels */}
                <div
                    className="grid-col-labels"
                    style={{
                        gap: GAP,
                        paddingLeft: GRID_PAD + 18,
                    }}
                >
                    {colLabelItems.map((i) => (
                        <div key={i} className="grid-col-label" style={{ width: CELL_SIZE }}>
                            {String.fromCharCode(65 + i)}
                        </div>
                    ))}
                </div>

                <div className="grid-row-and-board">
                    {/* Row letter labels */}
                    <div
                        className="grid-row-labels"
                        style={{
                            gap: GAP,
                            paddingTop: GRID_PAD,
                            paddingBottom: GRID_PAD,
                        }}
                    >
                        {rowLabelItems.map((i) => (
                            <div key={i} className="grid-row-label" style={{ height: CELL_SIZE }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Board */}
                    <div
                        ref={gridRef}
                        className="grid-board"
                        onDragOver={onGridDragOver}
                        onDragLeave={onGridDragLeave}
                        onDrop={onGridDrop}
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
                            gridTemplateRows:    `repeat(${ROWS}, ${CELL_SIZE}px)`,
                            gap: GAP,
                            padding: GRID_PAD,
                        }}
                    >
                        {cellItems}

                        {/* Drop ghost */}
                        {ghost && (
                            <div
                                className={`drop-ghost ${ghost.valid ? "drop-ghost--valid" : "drop-ghost--invalid"}`}
                                style={{
                                    left:   ghost.col * (CELL_SIZE + GAP) + GRID_PAD,
                                    top:    ghost.row * (CELL_SIZE + GAP) + GRID_PAD,
                                    width:  ghost.w * CELL_SIZE + (ghost.w - 1) * GAP,
                                    height: ghost.h * CELL_SIZE + (ghost.h - 1) * GAP,
                                }}
                            />
                        )}

                        {/* Placed blocks */}
                        {placed.map((p) => {
                            const block   = PALETTE.find((b) => b.id === p.blockId)!;
                            const rotated = !!(rotations[p.blockId]);
                            const { w: ew, h: eh } = effectiveWH(block, p.blockId);
                            const { width, height } = blockPx(ew, eh);
                            return (
                                <BlockFace
                                    key={p.blockId}
                                    block={block} rotated={rotated}
                                    pw={width} ph={height}
                                    placed
                                    placedLeft={p.col * (CELL_SIZE + GAP) + GRID_PAD}
                                    placedTop={ p.row * (CELL_SIZE + GAP) + GRID_PAD}
                                    draggable
                                    onClick={() => toggleRotation(p.blockId)}
                                    onDragStart={(e) => onPlacedDragStart(e, p, block)}
                                    onDragEnd={onPlacedDragEnd}
                                    onDoubleClick={() => onRemove(p.blockId)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Palette */}
            <div className="palette">
                {PALETTE.map((block) => {
                    const onGrid  = placedIds.has(block.id);
                    const rotated = !!(rotations[block.id]);
                    const { w: ew, h: eh } = effectiveWH(block, block.id);
                    const { width, height } = blockPx(ew, eh);
                    return (
                        <BlockFace
                            key={block.id}
                            block={block} rotated={rotated}
                            pw={width} ph={height}
                            onGrid={onGrid}
                            draggable={!onGrid}
                            onClick={!onGrid ? () => toggleRotation(block.id) : undefined}
                            onDragStart={!onGrid ? (e) => onPaletteDragStart(e, block) : undefined}
                        />
                    );
                })}
            </div>

            {/* Result panel */}
            {/*{result && <ResultPanel results={result} width={resultPanelWidth} />}*/}
        </div>
    );
}