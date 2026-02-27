const receiptFields = [
  { label: 'Guest Name', value: 'Elena V. Rostova' },
  { label: 'Check In', value: 'Oct 24, 2024' },
  { label: 'Check Out', value: 'Oct 28, 2024' },
]

const detailItems = [
  {
    title: 'Check-in Info',
    description: 'Front desk open 24/7.\nDial 9 for assistance.',
    icon: (
      <span className="meta-icon" style={{ background: '#1f1f1f', color: '#fff' }}>
        <span style={{ fontStyle: 'italic', fontSize: '1.125rem' }}>i</span>
      </span>
    ),
  },
  {
    title: 'Wifi Access',
    description: 'Network: PostGuest\nPass: CosyStay2024',
    icon: (
      <span className="meta-icon" style={{ background: '#c65d3b', color: '#fff' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    ),
  },
  {
    title: 'Breakfast',
    description: 'Served daily\n07:00 - 11:00',
    icon: (
      <span className="meta-icon" style={{ background: '#ffc233', color: '#1f1f1f' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </span>
    ),
  },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button className="back-link" type="button" aria-label="Back to booking">
          <span className="back-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M4 12h16M4 12l6-6m-6 6l6 6" />
            </svg>
          </span>
          <span className="font-typewriter" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem' }}>
            Back to Booking
          </span>
        </button>

        <div className="brand-block">
          <h1 className="brand-title">
            Post
            <br />
            <em>Post</em>
          </h1>
          <p className="brand-meta font-typewriter">
            Est. 1924
            <br />
            Bad Hofgastein
            <br />
            Austria
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a className="nav-link font-typewriter" href="#">
          <span className="nav-indicator" />
          My Wallet
        </a>
        <a className="nav-link nav-link-muted font-typewriter" href="#">
          Hotel Guide
        </a>
        <a className="nav-link nav-link-muted font-typewriter" href="#">
          Room Service
        </a>
        <a className="nav-link nav-link-muted font-typewriter" href="#">
          Concierge
        </a>
      </nav>
    </aside>
  )
}

function ReceiptCard() {
  return (
    <article className="paper-texture receipt-card">
      <div className="receipt-rail">
        <span className="text-vertical font-typewriter" style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6 }}>
          postposthotel.com s. 1421
        </span>
      </div>
      <div className="receipt-content">
        <div className="receipt-stamp">
          <div className="receipt-stamp-inner">
            <span className="font-typewriter" style={{ fontSize: '0.62rem', textAlign: 'center', lineHeight: 1.15, opacity: 0.7 }}>
              OFFICIAL
              <br />
              RECEIPT
              <br />
              NO. 992
            </span>
          </div>
        </div>

        <div className="receipt-fields">
          {receiptFields.map((field) => (
            <div key={field.label} className="receipt-field">
              <p className="font-typewriter receipt-field-label">{field.label}</p>
              <p className="receipt-field-value">{field.value}</p>
            </div>
          ))}
        </div>

        <div className="receipt-tear">
          <span className="font-typewriter">Tear here for receipt</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ opacity: 0.5 }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
            />
          </svg>
        </div>
      </div>
    </article>
  )
}

function ExploreCard() {
  return (
    <article className="paper-texture explore-card">
      <div className="explore-content">
        <div className="explore-ring">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <path id="circlePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
            <text className="font-typewriter" style={{ fill: '#f4f1ea', fontSize: '0.4rem', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
              <textPath href="#circlePath">Bad Hofgastein • Have a wonderful stay • </textPath>
            </text>
          </svg>
        </div>

        <div className="explore-body">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{ margin: '0 auto 1.5rem', opacity: 0.9 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <h3>Explore the area</h3>
          <p className="font-typewriter">
            Discover the hidden trails
            <br />
            of the Gastein Valley.
          </p>
        </div>

        <div className="explore-side-note">
          <span className="text-vertical font-typewriter" style={{ fontSize: '0.56rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
            tel. +43 (0) 6432 6260 • mail post@postpost.at
          </span>
        </div>
      </div>
    </article>
  )
}

function KeyCard() {
  return (
    <article className="paper-texture key-card">
      <div className="key-notch" />
      <div className="key-content">
        <div className="key-title">
          <span>For cosy</span>
          <em>days</em>
        </div>

        <div className="key-emblem">
          <div style={{ width: '6rem', height: '6rem', margin: '0 auto 0.5rem' }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ color: '#1f1f1f' }}>
              <path d="M40,120 Q60,110 80,115 T120,110 T160,115" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M50,120 L60,150 M140,115 L150,145 M100,112 L110,148" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M140,80 Q130,60 110,65 Q90,50 70,70 L60,90 Q80,100 100,95 L120,90 Z" fill="currentColor" opacity="0.9" />
              <circle cx="110" cy="55" r="10" fill="currentColor" />
              <path d="M120,55 L140,50 L135,70" fill="currentColor" />
              <path d="M30,130 L10,130 M25,125 L15,125" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <p>at</p>
          <p>Post</p>
          <p>
            <em>Post</em>
          </p>
        </div>

        <div className="room-triangle">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={{ position: 'absolute', inset: 0, color: '#1f1f1f' }}>
            <path d="M50 5 L95 90 L5 90 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" strokeLinejoin="round" style={{ filter: 'url(#wavy)' }} />
            <path
              d="M50 8 Q55 18 58 24 Q61 30 65 38 Q69 46 72 52 Q76 60 80 68 Q84 76 88 84 Q92 92 88 92
              Q80 92 72 92 Q64 92 56 92 Q48 92 40 92 Q32 92 24 92 Q16 92 12 92 Q8 92 12 84
              Q16 76 20 68 Q24 60 28 52 Q32 46 36 38 Q40 30 43 24 Q46 18 50 8 Z"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </svg>
          <div className="room-copy">
            <span className="font-sans-modern">Room No</span>
            <span className="font-typewriter">204</span>
          </div>
        </div>

        <div className="unlock-control">
          <button className="unlock-button" type="button" aria-label="Unlock">
            <svg className="unlock-icon-main" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M168,104a40,40,0,1,0-40-40A40,40,0,0,0,168,104Zm0-64a24,24,0,1,1-24,24A24,24,0,0,1,168,40ZM232,168a8,8,0,0,1-8,8H192v24a8,8,0,0,1-16,0V176H144a8,8,0,0,1,0-16h88A8,8,0,0,1,232,168ZM48,168a8,8,0,0,1-8,8H32v24a8,8,0,0,1-16,0V176H8a8,8,0,0,1,0-16h8a40,40,0,0,1,37.36-26.65,7.92,7.92,0,0,1,1.28.11A40,40,0,0,1,96,168v8H72v24a8,8,0,0,1-16,0V176H48Zm8-32a24,24,0,0,0-21.28,32h42.56A24,24,0,0,0,56,136Z" />
            </svg>
            <svg className="unlock-icon-alt" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm45.66-93.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32Z" />
            </svg>
          </button>
          <span className="unlock-label font-typewriter">Unlock</span>
        </div>
      </div>
    </article>
  )
}

function InfoGrid() {
  return (
    <section className="meta-grid">
      {detailItems.map((item) => (
        <article key={item.title} className="meta-item">
          {item.icon}
          <h3>{item.title}</h3>
          <p className="font-typewriter">
            {item.description.split('\n').map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>
        </article>
      ))}
    </section>
  )
}

export default function DigitalKeyPage() {
  return (
    <div className="digital-key-page">
      <svg className="page-filter-svg" aria-hidden="true">
        <filter id="wavy">
          <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="2" />
          <feDisplacementMap in="SourceGraphic" scale="2" />
        </filter>
      </svg>

      <Sidebar />

      <main className="main">
        <div className="orbit-wrap">
          <svg className="spin-slow" width="384" height="384" viewBox="0 0 200 200">
            <path id="outerCurve" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" fill="transparent" />
            <text width="500">
              <textPath href="#outerCurve" className="font-typewriter" style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                bad hofgastein • post post hotel • austria • est 1924 •
              </textPath>
            </text>
          </svg>
        </div>

        <div className="main-inner">
          <header className="mobile-head">
            <h2 className="font-typewriter">Current Selection</h2>
            <p>Key Card &amp; Info</p>
          </header>

          <section className="ticket-stage">
            <ReceiptCard />
            <ExploreCard />
            <KeyCard />
          </section>

          <InfoGrid />
        </div>
      </main>

      <div className="grain-overlay" aria-hidden="true" />
    </div>
  )
}
