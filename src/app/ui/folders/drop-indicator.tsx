import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types'
import type { CSSProperties, HTMLAttributes } from 'react'

type Orientation = 'horizontal' | 'vertical'

const edgeToOrientationMap: Record<Edge, Orientation> = {
    top: 'horizontal',
    bottom: 'horizontal',
    left: 'vertical',
    right: 'vertical',
}

const orientationStyles: Record<Orientation, HTMLAttributes<HTMLElement>['className']> = {
    horizontal: 'h-[2px] left-[-] right-0 before:left-[--negative-terminal-size]',
    vertical:
        'w-[--line-thickness] top-[--terminal-radius] bottom-0 before:top-[--negative-terminal-size]',
}

const edgeStyles: Record<Edge, HTMLAttributes<HTMLElement>['className']> = {
    top: 'top-[--line-offset] before:top-[--offset-terminal]',
    right: 'right-[--line-offset] before:right-[--offset-terminal]',
    bottom: 'bottom-[--line-offset] before:bottom-[--offset-terminal]',
    left: 'left-[--line-offset] before:left-[--offset-terminal]',
}

const strokeSize = 2
const terminalSize = 8
const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2

/**
 * This is a tailwind port of `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box`
 */
export function DropIndicator({ edge, gap }: { edge: Edge; gap: string }) {
    const lineOffset = `calc(-0.5 * (${gap} + ${strokeSize}px))`

    const orientation = edgeToOrientationMap[edge]

    return (
        <div
            className={`absolute z-10 bg-red-500 pointer-events-none before:content-[''] before:w-full before:h-[2px] box-border before:absolute before:border-[2px] before:border-solid before:border-orange-700 `}
        />
    )
}
