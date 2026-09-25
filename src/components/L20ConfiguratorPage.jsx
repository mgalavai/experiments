import { useEffect, useRef, useState } from 'react'
import { Alignment, Fit, Layout, Rive } from '@rive-app/webgl2'
import './l20-configurator.css'

// Built in the configurator project with `rive l20-configurator --publish`:
// its Luau scripts must be signed or the web runtime refuses them.
const SRC = '/l20-configurator/l20-configurator.riv?v=signed'

export default function L20ConfiguratorPage() {
  const canvas = useRef(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    const el = canvas.current
    const rive = new Rive({
      src: SRC,
      canvas: el,
      artboard: 'Configurator',
      stateMachines: 'Configurator SM',
      autoplay: true,
      autoBind: true,
      // Contain keeps the 1920x1080 framing the consoles were placed in.
      // Fit.Layout collapsed those slots in the browser.
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      enableGPUCanvas: true,
      dispatchPointerExit: true,
      onLoad: () => {
        rive.resizeDrawingSurfaceToCanvas()
        el.focus({ preventScroll: true })
        setState('ready')
      },
      onLoadError: (err) => {
        console.error(err)
        setState('error')
      },
    })

    const resize = () => rive.resizeDrawingSurfaceToCanvas()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      rive.cleanup()
    }
  }, [])

  return (
    <main className="l20">
      <canvas ref={canvas} className="l20__canvas" tabIndex={0} aria-label="Volvo L20 Electric configurator" />
      {state !== 'ready' && (
        <div className={`l20__status ${state === 'error' ? 'l20__status--error' : ''}`}>
          {state === 'error' ? 'The configurator could not load.' : 'Loading L20 Electric…'}
        </div>
      )}
    </main>
  )
}
