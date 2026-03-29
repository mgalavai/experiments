import { useEffect, useMemo, useRef, useState } from 'react'
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import './pacman.css'

const TICK_MS = 140
const POWER_TICKS = 48
const PELLET_SCORE = 10
const POWER_SCORE = 50
const GHOST_SCORE = 200
const TEXT_LAYOUT_OPTIONS = { whiteSpace: 'pre-wrap' }
const BOARD_TEXT_PADDING = 24
const HUD_TEXT_PADDING = 18
const DIRECTIONS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
}
const DIRECTION_KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
}
const LEVEL_TEMPLATE = [
  '#################',
  '#.......#.......#',
  '#.###.#.#.#.###.#',
  '#o###.#.#.#.###o#',
  '#...............#',
  '#.###.#####.###.#',
  '#.....#...#.....#',
  '#####.# #.#.#####',
  '#.....# G #.....#',
  '#####.#   #.#####',
  '#.....#...#.....#',
  '#.###.#####.###.#',
  '#o..#...P...#..o#',
  '#...............#',
  '#################',
]

function appendEvent(events, message) {
  return [message, ...events].slice(0, 5)
}

function cloneMaze(maze) {
  return maze.map((row) => [...row])
}

function getOppositeDirection(direction) {
  if (direction === 'up') return 'down'
  if (direction === 'down') return 'up'
  if (direction === 'left') return 'right'
  return 'left'
}

function isWalkable(maze, row, col) {
  return maze[row]?.[col] !== undefined && maze[row][col] !== '#'
}

function moveEntity(entity, direction) {
  if (!direction) return entity
  const delta = DIRECTIONS[direction]

  return {
    ...entity,
    row: entity.row + delta.row,
    col: entity.col + delta.col,
    dir: direction,
  }
}

function chooseGhostDirection(ghost, pacman, maze, poweredTicks) {
  const options = Object.keys(DIRECTIONS).filter((direction) => {
    const nextRow = ghost.row + DIRECTIONS[direction].row
    const nextCol = ghost.col + DIRECTIONS[direction].col
    return isWalkable(maze, nextRow, nextCol)
  })

  if (options.length === 0) return ghost.dir

  const preferred = options.filter((direction) => direction !== getOppositeDirection(ghost.dir))
  const candidates = preferred.length > 0 ? preferred : options

  return candidates.sort((left, right) => {
    const leftRow = ghost.row + DIRECTIONS[left].row
    const leftCol = ghost.col + DIRECTIONS[left].col
    const rightRow = ghost.row + DIRECTIONS[right].row
    const rightCol = ghost.col + DIRECTIONS[right].col
    const leftDistance = Math.abs(leftRow - pacman.row) + Math.abs(leftCol - pacman.col)
    const rightDistance = Math.abs(rightRow - pacman.row) + Math.abs(rightCol - pacman.col)

    return poweredTicks > 0 ? rightDistance - leftDistance : leftDistance - rightDistance
  })[0]
}

function createInitialGame() {
  let pacmanStart = null
  let ghostStart = null
  let pelletsRemaining = 0

  const maze = LEVEL_TEMPLATE.map((line, rowIndex) => {
    return line.split('').map((cell, colIndex) => {
      if (cell === 'P') {
        pacmanStart = { row: rowIndex, col: colIndex, dir: 'left' }
        return ' '
      }

      if (cell === 'G') {
        ghostStart = { row: rowIndex, col: colIndex, dir: 'up' }
        return ' '
      }

      if (cell === '.' || cell === 'o') {
        pelletsRemaining += 1
      }

      return cell
    })
  })

  return {
    maze,
    pacman: pacmanStart,
    ghost: ghostStart,
    ghostHome: ghostStart,
    score: 0,
    totalPellets: pelletsRemaining,
    pelletsRemaining,
    poweredTicks: 0,
    status: 'ready',
    tick: 0,
    events: [
      'SPACE TO BOOT THE MAZE',
      'ARROWS OR WASD TO STEER',
      'MAZE RENDERED WITH PRETEXT ONLY',
    ],
  }
}

function resolveCollision(activePoweredTicks, ghostHome, pacman, ghost, score, events) {
  if (pacman.row !== ghost.row || pacman.col !== ghost.col) {
    return { ghost, score, events, status: null }
  }

  if (activePoweredTicks > 0) {
    return {
      ghost: {
        ...ghostHome,
        dir: 'up',
      },
      score: score + GHOST_SCORE,
      events: appendEvent(events, 'SENTINEL DOWN // +200'),
      status: null,
    }
  }

  return {
    ghost,
    score,
    events: appendEvent(events, 'CONTACT // RUN TERMINATED'),
    status: 'lost',
  }
}

function advanceGame(state, desiredDirection) {
  if (state.status !== 'running') {
    return state
  }

  let nextPacmanDirection = state.pacman.dir

  if (desiredDirection) {
    const desiredRow = state.pacman.row + DIRECTIONS[desiredDirection].row
    const desiredCol = state.pacman.col + DIRECTIONS[desiredDirection].col
    if (isWalkable(state.maze, desiredRow, desiredCol)) {
      nextPacmanDirection = desiredDirection
    }
  }

  const forwardRow = state.pacman.row + DIRECTIONS[nextPacmanDirection].row
  const forwardCol = state.pacman.col + DIRECTIONS[nextPacmanDirection].col
  const pacman = isWalkable(state.maze, forwardRow, forwardCol)
    ? moveEntity(state.pacman, nextPacmanDirection)
    : { ...state.pacman, dir: nextPacmanDirection }

  let maze = state.maze
  let pelletsRemaining = state.pelletsRemaining
  let score = state.score
  let poweredTicks = Math.max(state.poweredTicks - 1, 0)
  let events = state.events

  const consumedCell = maze[pacman.row][pacman.col]
  if (consumedCell === '.' || consumedCell === 'o') {
    maze = cloneMaze(maze)
    maze[pacman.row][pacman.col] = ' '
    pelletsRemaining -= 1
    score += consumedCell === 'o' ? POWER_SCORE : PELLET_SCORE
    events = appendEvent(events, consumedCell === 'o' ? 'POWER CORE ONLINE' : 'PELLET CLEARED')

    if (consumedCell === 'o') {
      poweredTicks = POWER_TICKS
    }
  }

  const firstCollision = resolveCollision(poweredTicks, state.ghostHome, pacman, state.ghost, score, events)
  if (firstCollision.status === 'lost') {
    return {
      ...state,
      maze,
      pacman,
      ghost: firstCollision.ghost,
      score: firstCollision.score,
      poweredTicks,
      pelletsRemaining,
      status: 'lost',
      tick: state.tick + 1,
      events: firstCollision.events,
    }
  }

  const ghostShouldMove = state.tick % 2 === 0 || poweredTicks === 0
  const ghostDirection = ghostShouldMove
    ? chooseGhostDirection(firstCollision.ghost, pacman, maze, poweredTicks)
    : firstCollision.ghost.dir
  const ghost = ghostShouldMove ? moveEntity(firstCollision.ghost, ghostDirection) : firstCollision.ghost

  const secondCollision = resolveCollision(poweredTicks, state.ghostHome, pacman, ghost, firstCollision.score, firstCollision.events)
  if (secondCollision.status === 'lost') {
    return {
      ...state,
      maze,
      pacman,
      ghost: secondCollision.ghost,
      score: secondCollision.score,
      poweredTicks,
      pelletsRemaining,
      status: 'lost',
      tick: state.tick + 1,
      events: secondCollision.events,
    }
  }

  const didWin = pelletsRemaining === 0

  return {
    ...state,
    maze,
    pacman,
    ghost: secondCollision.ghost,
    score: secondCollision.score,
    pelletsRemaining,
    poweredTicks,
    status: didWin ? 'won' : 'running',
    tick: state.tick + 1,
    events: didWin ? appendEvent(secondCollision.events, 'MAZE CLEARED // DEMO COMPLETE') : secondCollision.events,
  }
}

function rawLineCount(text) {
  return text.split('\n').length
}

function fitPretextBlock(text, maxWidth, maxHeight, maxFontSize, minFontSize, lineHeightRatio) {
  const targetLineCount = rawLineCount(text)
  let fallback = null

  for (let size = maxFontSize; size >= minFontSize; size -= 1) {
    const lineHeight = Math.ceil(size * lineHeightRatio)
    const font = `${size}px "Departure Mono"`
    const prepared = prepareWithSegments(text, font, TEXT_LAYOUT_OPTIONS)
    const result = layoutWithLines(prepared, maxWidth, lineHeight)
    const candidate = {
      font,
      lineHeight,
      lines: result.lines,
      lineCount: result.lineCount,
      height: result.height,
    }

    fallback = candidate

    if (result.lineCount === targetLineCount && result.height <= maxHeight) {
      return candidate
    }
  }

  return fallback
}

function padLine(text, width) {
  return text.length >= width ? text.slice(0, width) : text.padEnd(width, ' ')
}

function centerLine(text, width) {
  if (text.length >= width) return text.slice(0, width)
  const left = Math.floor((width - text.length) / 2)
  const right = width - text.length - left
  return `${' '.repeat(left)}${text}${' '.repeat(right)}`
}

function getPacmanGlyph(direction, tick) {
  if (tick % 2 !== 0) return 'O'
  if (direction === 'up') return '^'
  if (direction === 'down') return 'v'
  if (direction === 'left') return '<'
  return '>'
}

function getGhostGlyph(poweredTicks) {
  return poweredTicks > 0 ? 'W' : 'M'
}

function buildMazeRows(game) {
  return game.maze.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      if (game.pacman.row === rowIndex && game.pacman.col === colIndex) {
        return getPacmanGlyph(game.pacman.dir, game.tick)
      }

      if (game.ghost.row === rowIndex && game.ghost.col === colIndex) {
        return getGhostGlyph(game.poweredTicks)
      }

      if (cell === '#') return '#'
      if (cell === '.') return '.'
      if (cell === 'o') return 'o'
      return ' '
    }).join('')
  })
}

function getPromptLine(game) {
  if (game.status === 'ready') return 'press space to boot the level'
  if (game.status === 'won') return 'maze clear // space to rerun'
  if (game.status === 'lost') return 'system down // space to rerun'
  if (game.poweredTicks > 0) return 'power live // hunt the sentinel'
  return 'clear the field // avoid contact'
}

function buildBoardText(game, statusLabel) {
  const contentWidth = 35
  const mazeRows = buildMazeRows(game)
  const progressLine = `score ${String(game.score).padStart(4, '0')}  pellets ${String(game.totalPellets - game.pelletsRemaining).padStart(3, '0')}/${String(game.totalPellets).padStart(3, '0')}`
  const stateLine = `mode ${statusLabel.padEnd(12, ' ')} ${game.poweredTicks > 0 ? `pow ${String(game.poweredTicks).padStart(2, '0')}` : 'pow --'}`
  const border = `+${'-'.repeat(contentWidth + 2)}+`

  return [
    border,
    `| ${padLine('PAC-01 // PRETEXT GLYPH MAZE', contentWidth)} |`,
    `| ${padLine(progressLine, contentWidth)} |`,
    `| ${padLine(stateLine, contentWidth)} |`,
    `| ${' '.repeat(contentWidth)} |`,
    ...mazeRows.map((row) => `| ${centerLine(row, contentWidth)} |`),
    `| ${' '.repeat(contentWidth)} |`,
    `| ${padLine(getPromptLine(game), contentWidth)} |`,
    `| ${padLine('arrows / wasd move    space resets', contentWidth)} |`,
    border,
  ].join('\n')
}

function drawScanlines(context, width, height) {
  context.fillStyle = 'rgba(255, 255, 255, 0.045)'
  for (let y = 0; y < height; y += 4) {
    context.fillRect(0, y, width, 1)
  }
}

function drawBoard(canvas, boardText, fontReady) {
  if (!canvas) return

  const bounds = canvas.getBoundingClientRect()
  const width = Math.max(Math.floor(bounds.width), 360)
  const height = Math.max(Math.floor(bounds.height), 520)
  const dpr = window.devicePixelRatio || 1

  canvas.width = width * dpr
  canvas.height = height * dpr

  const context = canvas.getContext('2d')
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)

  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#020713')
  background.addColorStop(0.52, '#07182f')
  background.addColorStop(1, '#020305')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(115, 231, 255, 0.18)'
  context.strokeRect(0.5, 0.5, width - 1, height - 1)

  const layout = fitPretextBlock(
    boardText,
    width - BOARD_TEXT_PADDING * 2,
    height - BOARD_TEXT_PADDING * 2,
    fontReady ? 26 : 20,
    11,
    1.2,
  )

  if (!layout) return

  const startX = BOARD_TEXT_PADDING
  const startY = BOARD_TEXT_PADDING + layout.lineHeight
  const mazeStartLine = 5
  const mazeEndLine = layout.lines.length - 4

  context.textBaseline = 'alphabetic'
  context.font = layout.font
  context.shadowBlur = 8

  layout.lines.forEach((line, index) => {
    if (index === 1) {
      context.fillStyle = '#fff2a3'
      context.shadowColor = 'rgba(255, 230, 109, 0.26)'
    } else if (index <= 3) {
      context.fillStyle = '#7be7ff'
      context.shadowColor = 'rgba(123, 231, 255, 0.2)'
    } else if (index >= mazeStartLine && index <= mazeEndLine) {
      context.fillStyle = '#9cf6b0'
      context.shadowColor = 'rgba(156, 246, 176, 0.14)'
    } else {
      context.fillStyle = '#d8f8de'
      context.shadowColor = 'rgba(216, 248, 222, 0.12)'
    }

    context.fillText(line.text || ' ', startX, startY + index * layout.lineHeight)
  })

  context.shadowBlur = 0
  drawScanlines(context, width, height)
}

function drawHud(canvas, briefing, fontReady) {
  if (!canvas) return

  const bounds = canvas.getBoundingClientRect()
  const width = Math.max(Math.floor(bounds.width), 320)
  const height = Math.max(Math.floor(bounds.height), 380)
  const dpr = window.devicePixelRatio || 1

  canvas.width = width * dpr
  canvas.height = height * dpr

  const context = canvas.getContext('2d')
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)

  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#050912')
  gradient.addColorStop(1, '#081b1d')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(123, 220, 255, 0.25)'
  context.strokeRect(0.5, 0.5, width - 1, height - 1)

  const layout = fitPretextBlock(
    briefing,
    width - HUD_TEXT_PADDING * 2,
    height - 56,
    fontReady ? 14 : 12,
    10,
    1.35,
  )

  context.fillStyle = '#fef3b2'
  context.font = '14px "Departure Mono", monospace'
  context.fillText('PAC-01 // PRETEXT PANEL', HUD_TEXT_PADDING, 24)

  context.fillStyle = '#6de0ff'
  context.font = '11px "Departure Mono", monospace'
  context.fillText(fontReady ? 'font synced // canvas layout armed' : 'loading font metrics...', HUD_TEXT_PADDING, 42)

  if (!layout) return

  context.fillStyle = '#d4f7db'
  context.font = layout.font

  layout.lines.forEach((line, index) => {
    context.fillText(line.text || ' ', HUD_TEXT_PADDING, 68 + index * layout.lineHeight)
  })

  context.fillStyle = 'rgba(255, 255, 255, 0.06)'
  for (let y = 56; y < height; y += 22) {
    context.fillRect(12, y, width - 24, 1)
  }
}

export default function PacmanPage() {
  const [game, setGame] = useState(() => createInitialGame())
  const [fontReady, setFontReady] = useState(false)
  const boardCanvasRef = useRef(null)
  const hudCanvasRef = useRef(null)
  const desiredDirectionRef = useRef('left')

  const statusLabel = game.status === 'ready'
    ? 'awaiting boot'
    : game.status === 'running'
      ? game.poweredTicks > 0 ? 'power mode' : 'maze live'
      : game.status === 'won'
        ? 'demo complete'
        : 'signal lost'

  const boardText = useMemo(() => buildBoardText(game, statusLabel), [game, statusLabel])

  const briefing = useMemo(() => {
    return [
      `status: ${statusLabel}`,
      `score: ${String(game.score).padStart(4, '0')}`,
      `pellets: ${game.totalPellets - game.pelletsRemaining}/${game.totalPellets}`,
      `ghost: ${game.poweredTicks > 0 ? 'frightened' : 'tracking'}`,
      '',
      'this pass removes the shape renderer from the maze.',
      'the board is now assembled as plain text rows and fit into the canvas by pretext using departure mono metrics.',
      '',
      'controls',
      '  arrows or wasd  move pacman',
      '  space           reset / start',
      '',
      'recent events',
      ...game.events.map((event) => `  - ${event.toLowerCase()}`),
    ].join('\n')
  }, [game.events, game.pelletsRemaining, game.poweredTicks, game.score, game.status, game.totalPellets, statusLabel])

  useEffect(() => {
    let cancelled = false

    async function loadFont() {
      try {
        await document.fonts.load('24px "Departure Mono"')
        await document.fonts.ready
      } finally {
        if (!cancelled) {
          setFontReady(true)
        }
      }
    }

    loadFont()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setGame((previous) => advanceGame(previous, desiredDirectionRef.current))
    }, TICK_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      const direction = DIRECTION_KEYS[event.key]

      if (direction) {
        event.preventDefault()
        desiredDirectionRef.current = direction
        setGame((previous) => {
          if (previous.status === 'ready') {
            return {
              ...previous,
              status: 'running',
              events: appendEvent(previous.events, 'MAZE BOOTED'),
            }
          }

          if (previous.status === 'won' || previous.status === 'lost') {
            const rebooted = createInitialGame()
            return {
              ...rebooted,
              status: 'running',
              pacman: { ...rebooted.pacman, dir: direction },
              events: appendEvent(rebooted.events, 'LEVEL REBOOTED'),
            }
          }

          return previous
        })
      }

      if (event.key === ' ') {
        event.preventDefault()
        desiredDirectionRef.current = 'left'
        setGame((previous) => {
          if (previous.status === 'ready') {
            return {
              ...previous,
              status: 'running',
              events: appendEvent(previous.events, 'MAZE BOOTED'),
            }
          }

          const rebooted = createInitialGame()
          return {
            ...rebooted,
            status: 'running',
            events: appendEvent(rebooted.events, 'LEVEL REBOOTED'),
          }
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    const canvas = boardCanvasRef.current
    if (!canvas) return

    const redraw = () => drawBoard(canvas, boardText, fontReady)
    redraw()

    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)

    return () => {
      observer.disconnect()
    }
  }, [boardText, fontReady])

  useEffect(() => {
    const canvas = hudCanvasRef.current
    if (!canvas) return

    const redraw = () => drawHud(canvas, briefing, fontReady)
    redraw()

    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)

    return () => {
      observer.disconnect()
    }
  }, [briefing, fontReady])

  function handleReset() {
    desiredDirectionRef.current = 'left'
    setGame(createInitialGame())
  }

  return (
    <main className="pacman-page">
      <div className="pacman-page__grid" aria-hidden="true" />
      <section className="pacman-shell">
        <header className="pacman-hero">
          <div>
            <p className="pacman-kicker">Departure Mono x Pretext</p>
            <h1>Pacman rendered as a live text block.</h1>
          </div>
          <p className="pacman-summary">
            The maze is now a glyph-only composition. Every board line is built from the current game state, then measured and wrapped by
            pretext before it is drawn.
          </p>
        </header>

        <div className="pacman-stage">
          <div className="pacman-board-card">
            <canvas ref={boardCanvasRef} className="pacman-board" aria-label="Pacman demo board" />
          </div>

          <aside className="pacman-sidebar">
            <div className="pacman-sidebar__canvas-frame">
              <canvas ref={hudCanvasRef} className="pacman-sidebar__canvas" aria-hidden="true" />
            </div>

            <div className="pacman-sidebar__controls">
              <div className="pacman-chip-row" aria-label="Controls">
                <span>ARROWS</span>
                <span>WASD</span>
                <span>SPACE</span>
              </div>

              <div className="pacman-stats" aria-label="Status">
                <div>
                  <span className="pacman-stats__label">Mode</span>
                  <strong>{statusLabel}</strong>
                </div>
                <div>
                  <span className="pacman-stats__label">Power</span>
                  <strong>{game.poweredTicks > 0 ? `${game.poweredTicks} ticks` : 'offline'}</strong>
                </div>
              </div>

              <button type="button" className="pacman-reset" onClick={handleReset}>
                reset maze
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
