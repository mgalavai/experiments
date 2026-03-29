import { useEffect, useMemo, useRef, useState } from 'react'
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import './pacman.css'

const CELL_SIZE = 28
const BOARD_PADDING = 22
const TICK_MS = 140
const POWER_TICKS = 48
const PELLET_SCORE = 10
const POWER_SCORE = 50
const GHOST_SCORE = 200
const DIRECTIONS = {
  up: { row: -1, col: 0, angle: Math.PI * 1.5 },
  down: { row: 1, col: 0, angle: Math.PI * 0.5 },
  left: { row: 0, col: -1, angle: Math.PI },
  right: { row: 0, col: 1, angle: 0 },
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

const BOARD_WIDTH = LEVEL_TEMPLATE[0].length * CELL_SIZE + BOARD_PADDING * 2
const BOARD_HEIGHT = LEVEL_TEMPLATE.length * CELL_SIZE + BOARD_PADDING * 2

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
      'PRETEXT POWERS THE STATUS PANEL',
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

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

function drawMaze(context, game) {
  context.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

  const boardGradient = context.createLinearGradient(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
  boardGradient.addColorStop(0, '#01030c')
  boardGradient.addColorStop(0.5, '#071437')
  boardGradient.addColorStop(1, '#010102')
  context.fillStyle = boardGradient
  context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

  context.save()
  context.translate(BOARD_PADDING, BOARD_PADDING)

  game.maze.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * CELL_SIZE
      const y = rowIndex * CELL_SIZE

      if (cell === '#') {
        drawRoundedRect(context, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 8)
        context.fillStyle = '#102b8a'
        context.fill()
        context.strokeStyle = '#64d8ff'
        context.lineWidth = 1.25
        context.stroke()
        return
      }

      context.fillStyle = 'rgba(6, 19, 48, 0.7)'
      context.fillRect(x, y, CELL_SIZE, CELL_SIZE)

      if (cell === '.' || cell === 'o') {
        context.beginPath()
        context.fillStyle = cell === 'o' ? '#ff8fb8' : '#ffe991'
        context.arc(
          x + CELL_SIZE / 2,
          y + CELL_SIZE / 2,
          cell === 'o' ? 5 + Math.sin(game.tick / 3) * 1.2 : 2.5,
          0,
          Math.PI * 2,
        )
        context.fill()
      }
    })
  })

  const pacmanX = game.pacman.col * CELL_SIZE + CELL_SIZE / 2
  const pacmanY = game.pacman.row * CELL_SIZE + CELL_SIZE / 2
  const mouth = 0.25 + Math.abs(Math.sin(game.tick / 2.4)) * 0.22

  context.beginPath()
  context.moveTo(pacmanX, pacmanY)
  context.fillStyle = '#ffd84d'
  context.arc(
    pacmanX,
    pacmanY,
    CELL_SIZE * 0.42,
    DIRECTIONS[game.pacman.dir].angle + mouth,
    DIRECTIONS[game.pacman.dir].angle + Math.PI * 2 - mouth,
  )
  context.closePath()
  context.fill()

  const ghostX = game.ghost.col * CELL_SIZE + CELL_SIZE / 2
  const ghostY = game.ghost.row * CELL_SIZE + CELL_SIZE / 2
  const ghostSize = CELL_SIZE * 0.38
  context.beginPath()
  context.moveTo(ghostX - ghostSize, ghostY + ghostSize)
  context.lineTo(ghostX - ghostSize, ghostY)
  context.arc(ghostX, ghostY, ghostSize, Math.PI, 0)
  context.lineTo(ghostX + ghostSize, ghostY + ghostSize)
  context.lineTo(ghostX + ghostSize * 0.5, ghostY + ghostSize * 0.72)
  context.lineTo(ghostX, ghostY + ghostSize)
  context.lineTo(ghostX - ghostSize * 0.5, ghostY + ghostSize * 0.72)
  context.closePath()
  context.fillStyle = game.poweredTicks > 0 ? '#6fd7ff' : '#ff5b5b'
  context.fill()

  context.fillStyle = '#f3f7ff'
  context.beginPath()
  context.arc(ghostX - 6, ghostY + 1, 4, 0, Math.PI * 2)
  context.arc(ghostX + 6, ghostY + 1, 4, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#03142b'
  context.beginPath()
  context.arc(ghostX - 6 + (game.poweredTicks > 0 ? -1 : 1), ghostY + 1, 1.5, 0, Math.PI * 2)
  context.arc(ghostX + 6 + (game.poweredTicks > 0 ? -1 : 1), ghostY + 1, 1.5, 0, Math.PI * 2)
  context.fill()

  context.restore()

  context.fillStyle = 'rgba(255, 255, 255, 0.08)'
  for (let y = 0; y < BOARD_HEIGHT; y += 4) {
    context.fillRect(0, y, BOARD_WIDTH, 1)
  }

  context.font = '14px "Departure Mono", monospace'
  context.fillStyle = '#93f5a7'
  context.fillText(`score ${String(game.score).padStart(4, '0')}`, 22, 20)
  context.fillStyle = '#7bdcff'
  context.fillText(`pellets ${game.totalPellets - game.pelletsRemaining}/${game.totalPellets}`, BOARD_WIDTH - 186, 20)

  if (game.status !== 'running') {
    context.fillStyle = 'rgba(1, 3, 12, 0.72)'
    context.fillRect(BOARD_PADDING, BOARD_HEIGHT / 2 - 48, BOARD_WIDTH - BOARD_PADDING * 2, 92)
    context.strokeStyle = '#6cf2ff'
    context.strokeRect(BOARD_PADDING, BOARD_HEIGHT / 2 - 48, BOARD_WIDTH - BOARD_PADDING * 2, 92)
    context.textAlign = 'center'
    context.fillStyle = '#ffe35e'
    context.font = '18px "Departure Mono", monospace'
    const label = game.status === 'ready' ? 'PRESS SPACE TO START' : game.status === 'won' ? 'LEVEL CLEAR' : 'SYSTEM DOWN'
    context.fillText(label, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 4)
    context.fillStyle = '#bdd3ff'
    context.font = '12px "Departure Mono", monospace'
    context.fillText('arrows / wasd to move | space to reset', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 22)
    context.textAlign = 'start'
  }
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

  context.fillStyle = '#fef3b2'
  context.font = '14px "Departure Mono", monospace'
  context.fillText('PAC-01 // PRETEXT PANEL', 18, 24)

  context.fillStyle = '#6de0ff'
  context.font = '11px "Departure Mono", monospace'
  context.fillText(fontReady ? 'font synced // canvas layout armed' : 'loading font metrics...', 18, 42)

  const font = '12px "Departure Mono"'
  const prepared = prepareWithSegments(briefing, font, { whiteSpace: 'pre-wrap' })
  const { lines } = layoutWithLines(prepared, width - 52, 17)

  context.fillStyle = '#d4f7db'
  context.font = font

  lines.slice(0, Math.floor((height - 72) / 17)).forEach((line, index) => {
    context.fillText(line.text || ' ', 18, 72 + index * 17)
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

  const briefing = useMemo(() => {
    return [
      `status: ${statusLabel}`,
      `score: ${String(game.score).padStart(4, '0')}`,
      `pellets: ${game.totalPellets - game.pelletsRemaining}/${game.totalPellets}`,
      `ghost: ${game.poweredTicks > 0 ? 'frightened' : 'tracking'}`,
      '',
      'one maze. one sentinel. no extra systems.',
      'clear every pellet and flip the four power cells when you need breathing room.',
      '',
      'controls',
      '  arrows or wasd  move pacman',
      '  space           reset / start',
      '',
      'note',
      '  this panel is rendered on canvas with departure mono.',
      '  pretext computes the line layout before each draw instead of letting the dom wrap it.',
      '',
      'recent events',
      ...game.events.map((event) => `  - ${event.toLowerCase()}`),
    ].join('\n')
  }, [game.events, game.pelletsRemaining, game.poweredTicks, game.score, game.status, game.totalPellets, statusLabel])

  useEffect(() => {
    let cancelled = false

    async function loadFont() {
      try {
        await document.fonts.load('13px "Departure Mono"')
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

    const dpr = window.devicePixelRatio || 1
    canvas.width = BOARD_WIDTH * dpr
    canvas.height = BOARD_HEIGHT * dpr
    const context = canvas.getContext('2d')
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMaze(context, game)
  }, [game])

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
            <h1>Pacman, stripped down to one sharp little experiment.</h1>
          </div>
          <p className="pacman-summary">
            A single-level arcade board with a terminal briefing panel. The maze is intentionally compact; the point here is the feel and the
            text system, not full game complexity.
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
