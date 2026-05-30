import { useState, useRef, useCallback, useEffect } from "react";
import ship1 from "/src/assets/ship1.svg";
import ship2 from "/src/assets/ship2.svg";
import ship2r from "/src/assets/ship2r.svg";
import ship3 from "/src/assets/ship3.svg";
import ship3r from "/src/assets/ship3r.svg";
import shotShipIcon from "/src/assets/shot-ship.svg"
import shotEmptyIcon from "/src/assets/shot-empty.svg"
import triedIcon from "/src/assets/tried.svg"
import "./GridStatic.css"
import "./GridDnd.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Block {
    id: string;
    label: string;
    w: number;
    h: number;
}

export interface PlacedBlock {
    blockId: string;
    col: number;
    row: number;
    rot?: number;
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
    { id: "a", label: "1×3", w: 3, h: 1},
    { id: "b", label: "1×2", w: 2, h: 1 },
    { id: "c", label: "2×1", w: 2, h: 1 },
    // { id: "d", label: "3×1", w: 3, h: 1, color: "#10b981" },
    { id: "d", label: "1×1", w: 1, h: 1 },
    { id: "e", label: "1×1", w: 1, h: 1 },
    { id: "f", label: "1×1", w: 1, h: 1},
    // { id: "f", label: "3×3", w: 3, h: 3, color: "#ef4444" },
];

// ─── Textures ─────────────────────────────────────────────────────────────────

const TEXTURES: Record<string, string> = (() => {
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
            return [id, `url("${fn}")`];
        })
    );
})();


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
    onMouseOver?: () => void;
    onMouseLeave?: () => void;
}

function BlockFace({
                       block, rotated, pw, ph, onGrid = false, placed: isPlaced = false,
                       placedLeft, placedTop, onClick, onMouseOver, onMouseLeave
                   }: BlockFaceProps) {
    const classes = [
        "block-face-static",
        onGrid    ? "block-face--on-grid"  : "",
        isPlaced  ? "block-face--placed"   : "",
    ].filter(Boolean).join(" ");

    const style: React.CSSProperties = {
        width: pw,
        height: ph,
        "--block-color": "rgba(59 130 246 / 0.4)",
        backgroundImage: onGrid ? undefined : TEXTURES[block.id + (rotated ? "r" : "") ],
    } as React.CSSProperties;

    if (isPlaced) {
        style.left = placedLeft;
        style.top  = placedTop;
    }

    return (
        <div
            className={classes}
            style={style}
            onClick={onClick}
            // onMouseOver={onMouseOver}
            onMouseMove={onMouseOver}
            onMouseLeave={onMouseLeave}

        >
            {!onGrid && block.w !== block.h && !rotated && (
                <span className="block-face__rotate-hint">↺</span>
            )}
        </div>
    );
}


// ─── Main component ───────────────────────────────────────────────────────────

export default function GridStatic({gridData = {}, active = true, bombing = false, blocks = null, turn = true, onShoot = () => {}}:
    {gridData?: Record<string, Record<string, boolean>>, active?: boolean, bombing?: boolean, blocks?: PlacedBlock[] | null, turn?: boolean, onShoot: (e: MouseEvent, col: number, row: number) => void}) {

    function cellLabel(col: number, row: number): string {
        return `${col + 1}${String.fromCharCode(65 + row)}`;
    }

    // ─── initial state ─────────

    // TODO: расположение кораблей из json'a



    const [placed, setPlaced]     = useState<PlacedBlock[]>(
        blocks || [
        // {blockId: "a", col: 1, row: 1, rot: 1},
        // {blockId: "d", col: 5, row: 5, rot: 0},
        // {blockId: "e", col: 3, row: 5, rot: 0},
    ]);

    // const [rotations, setRotations] = useState<Record<string, number>>({"a": 0});
    const [ghost, setGhost]       = useState<{
        col: number; row: number; w: number; h: number; valid: boolean;
    } | null>(null);

    const gridRef = useRef<HTMLDivElement>(null!);

    const cursorInGrid = useCallback((e: React.DragEvent) => {
        const rect = gridRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return { x: e.clientX - rect.left - GRID_PAD, y: e.clientY - rect.top - GRID_PAD };
    }, []);

    const computeTarget = useCallback((e: React.MouseEvent) => {
        // if (!drag.current) return null;
        // console.log("fired")
        const pos = cursorInGrid(e);
        if (!pos) return null;
        const step = CELL_SIZE + GAP;
        const col = Math.min(Math.floor((pos.x) / step), 5 );
        const row = Math.min(Math.floor((pos.y) / step), 5 );
        const w = 1;
        const h = 1;
        return { col, row, w, h, valid: turn};
    }, [placed, cursorInGrid]);

    const onMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        const t = computeTarget(e);
        if (!t) return;
        setGhost({ col: t.col, row: t.row, w: t.w, h: t.h, valid: t.valid });
        // e.dataTransfer.dropEffect = t.valid ? "move" : "none";
        handleMouseMove(e);
    };

    function onMouseLeave (e: React.MouseEvent) {
        setGhost(null);
    }

    const effectiveWH = useCallback((block: Block, pl: PlacedBlock) => {
        const rot = pl.rot;
        return rot ? { w: block.h, h: block.w } : { w: block.w, h: block.h };
    }, []);


    //test

    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        // Get the bounding rectangle of the container
        const CIRCLE_SIZE = 10;
        const rect = e.currentTarget.getBoundingClientRect();

        // Calculate mouse position relative to the container
        const x = e.clientX - rect.left - CIRCLE_SIZE / 2;
        const y = e.clientY - rect.top - CIRCLE_SIZE / 2;

        setPosition({ x, y });
    };

    // ── Derived: occupied + halo sets ──
    const placedIds      = new Set(placed.map((p) => p.blockId));
    const occupiedCells  = new Set<string>();
    const haloCells      = new Set<string>();

    for (const p of placed) {
        const base = PALETTE.find((x) => x.id === p.blockId)!;
        const { w: bw, h: bh } = effectiveWH(base, p);
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

            const name = cellLabel(c, r);
            const data = gridData[name] ||  {
                'has_ship': Math.random() < 0.1,
                'is_shot': Math.random() < 0.1,
                'attempted': Math.random() < 0.1,
            };

            const is_shot = data.is_shot;
            const attempted = data.attempted;
            const has_ship = data.has_ship;

            cellItems.push(
                <div
                    key={key}
                    className={cls +
                        ((is_shot || attempted) ? " cell--marked" : "") +
                        ((is_shot && has_ship) ? " cell--shot-ship" : "") +
                        ((is_shot && !has_ship) ? " cell--shot-empty" : "") +
                        ((!is_shot && attempted) ? " cell--tried" : "")
                }
                    style={{ gridColumn: c + 1, gridRow: r + 1, backgroundSize: "cover"}}
                />
            );
        }
    }
    // console.log(bombing)

    return (
        <div className="grid-app-static">

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
                            {i + 1}
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
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                    </div>

                    {/* Board */}
                    <div
                        ref={gridRef}
                        className="grid-board"
                        // onMouseOver={onMouseOver}
                        onMouseMove={active? onMouseMove : () => {}}
                        onMouseLeave={active? onMouseLeave: () => {}}
                        // onDragLeave={onGridDragLeave}
                        // onDrop={onGridDrop}
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
                            gridTemplateRows:    `repeat(${ROWS}, ${CELL_SIZE}px)`,
                            gap: GAP,
                            padding: GRID_PAD,
                        }}
                    >   <div
                        style={{
                            position: 'absolute',
                            zIndex: 100,
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            width: `${10}px`,
                            height: `${10}px`,
                            backgroundColor: 'red',
                            borderRadius: '50%',
                            pointerEvents: 'none', // Prevents the circle from interfering with mouse events
                            transition: 'transform 0.05s ease-out', // Adds a subtle, smooth lag effect
                        }}
                    />
                        {cellItems}

                        {/* Drop ghost */}
                        {ghost && (
                            <div
                                className={`drop-ghost-static ${turn ? "drop-ghost-static--valid" : "drop-ghost-static--invalid"} ${turn? (bombing? "drop-ghost-static-bomb": "drop-ghost-static-sight") : "" }`}
                                style={{
                                    left:   ghost.col * (CELL_SIZE + GAP) + GRID_PAD,
                                    top:    ghost.row * (CELL_SIZE + GAP) + GRID_PAD,
                                    width:  ghost.w * CELL_SIZE + (ghost.w - 1) * GAP,
                                    height: ghost.h * CELL_SIZE + (ghost.h - 1) * GAP,
                                }}
                                onClick={(e) => onShoot(e, ghost.col, ghost.row)}
                            />
                        )}

                        {/* Placed blocks */}
                        {placed.map((p) => {
                            const block   = PALETTE.find((b) => b.id === p.blockId)!;
                            const rotated = !!(p.rot);
                            const { w: ew, h: eh } = effectiveWH(block, p);
                            const { width, height } = blockPx(ew, eh);
                            return (
                                <BlockFace
                                    key={p.blockId}
                                    block={block} rotated={rotated}
                                    pw={width} ph={height}
                                    placed
                                    placedLeft={p.col * (CELL_SIZE + GAP) + GRID_PAD}
                                    placedTop={ p.row * (CELL_SIZE + GAP) + GRID_PAD}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Palette */}
            {/*<div className="palette">*/}
            {/*    {PALETTE.map((block) => {*/}
            {/*        const onGrid  = placedIds.has(block.id);*/}
            {/*        const rotated = false;*/}
            {/*        const { w: ew, h: eh } = effectiveWH(block, block.id);*/}
            {/*        const { width, height } = blockPx(ew, eh);*/}
            {/*        return (*/}
            {/*            <BlockFace*/}
            {/*                key={block.id}*/}
            {/*                block={block} rotated={rotated}*/}
            {/*                pw={width} ph={height}*/}
            {/*                onGrid={onGrid}*/}
            {/*            />*/}
            {/*        );*/}
            {/*    })}*/}
            {/*</div>*/}

            {/* Result panel */}
            {/*{result && <ResultPanel results={result} width={resultPanelWidth} />}*/}
        </div>
    );
}