const media = {
  archive: {
    src: '/lifeline/archive.svg',
    alt: 'A hand-drawn archive sketch of an early wheel loader',
  },
  prototype: {
    src: '/lifeline/prototype.svg',
    alt: 'A technical cutaway drawing of a loader prototype',
  },
  field: {
    src: '/press-release_18-october-2019_volvo-ce-see-sales-dip-in-q3_hero.jpg',
    alt: 'A Volvo construction machine working at dusk',
  },
  electric: {
    src: '/lifeline/electric.svg',
    alt: 'An electric loader charging under work lights',
  },
}

const milestones = {
  1954: {
    id: 'first-motion',
    age: '00',
    eyebrow: 'Origin',
    title: 'The articulated idea',
    events: [
      {
        text: 'A tractor, a lifting frame and one stubborn question: what if the machine could bend in the middle?',
        image: media.archive,
      },
      { text: 'Project Ironwood begins as eleven pages of pencil studies.' },
    ],
    badges: ['SE', 'P-01'],
    companies: ['Volvo BM', 'Lundberg'],
    mentors: ['Lars B.', 'Karin N.'],
    photos: [{ ...media.archive, caption: 'Sketchbook 01', rotate: -4, y: -168 }],
  },
  1966: {
    id: 'production',
    eyebrow: 'Production',
    title: 'Built to work, not pose',
    events: [
      { text: 'The first production run leaves Arvika in industrial yellow.' },
      { text: 'Operators ask for a quieter cab. The engineers listen.' },
    ],
    badges: ['LM', '100'],
    companies: ['Arvika Works'],
    met: ['Rune S.'],
  },
  1973: {
    id: 'cab',
    eyebrow: 'Human factors',
    title: 'The cab becomes a room',
    events: [
      {
        text: 'Visibility, heat and reach are measured from the operator seat for the first time.',
        image: media.prototype,
      },
      {
        text: 'Read the original ergonomics brief.',
        href: 'https://www.volvoce.com/global/en/',
        linkLabel: 'Archive note ↗',
      },
    ],
    badges: ['R&D'],
    mentors: ['Ingrid H.'],
  },
  1985: {
    id: 'quick-coupler',
    eyebrow: 'System',
    title: 'One machine, many jobs',
    events: [
      { text: 'A hydraulic quick coupler turns attachments into a working system.' },
      { text: 'Bucket. Fork. Sweeper. Snow blade. No workshop stop between them.' },
    ],
    companies: ['Attachments Lab', 'Operators Guild'],
    photos: [{ ...media.prototype, caption: 'Coupler study', rotate: 3, y: -188 }],
  },
  1995: {
    id: 'telemetry',
    eyebrow: 'Signals',
    title: 'The machine starts talking',
    events: [
      { text: 'Load cycles move from the driver’s notebook into onboard memory.' },
      { text: 'A service warning arrives before the broken hose.' },
    ],
    badges: ['CAN', '24V'],
    companies: ['CareTrack'],
    met: ['Mikael J.', 'Asha R.'],
  },
  2007: {
    id: 'global-platform',
    eyebrow: 'Platform',
    title: 'A common mechanical language',
    events: [
      {
        text: 'Three chassis families begin sharing controls, service logic and operator conventions.',
        image: media.field,
      },
      { text: 'The program passes one million logged test hours.' },
    ],
    badges: ['1M HRS'],
    companies: ['Arvika', 'Eskilstuna', 'Pederneiras'],
    mentors: ['Elena V.'],
    photos: [{ ...media.field, caption: 'Cold-weather validation', rotate: -2, y: -184, wide: true }],
  },
  2014: {
    id: 'efficiency',
    eyebrow: 'Efficiency',
    title: 'Every wasted motion counts',
    events: [
      { text: 'Eco pedal mapping cuts fuel burn without slowing the loading cycle.' },
      { text: 'A new display turns coaching into a live instrument.' },
    ],
    companies: ['Volvo CE', 'SiteSim'],
    met: ['Noor A.', 'David K.'],
  },
  2020: {
    id: 'remote-shift',
    age: 'R1',
    eyebrow: 'Remote',
    title: 'The empty cab shift',
    events: [
      {
        text: 'A loader completes a quarry cycle while its operator sits 1,200 km away.',
        image: media.field,
      },
      { text: 'Latency becomes a safety dimension, measured in metres as well as milliseconds.' },
    ],
    badges: ['5G', 'R1'],
    companies: ['Telia', 'Volvo Autonomous'],
    mentors: ['Sofia T.'],
  },
  2023: {
    id: 'electric',
    eyebrow: 'Electric',
    title: 'Silence has torque',
    events: [
      {
        text: 'The electric prototype works a full indoor shift with no tailpipe and no idle.',
        image: media.electric,
      },
      { text: 'Charging joins fuel, payload and time as a site-planning variable.' },
    ],
    badges: ['BEV', '0g'],
    companies: ['Volvo Energy', 'Northvolt'],
    photos: [{ ...media.electric, caption: 'Night charge, bay 04', rotate: 4, y: -186 }],
  },
  2025: {
    id: 'digital-twin',
    eyebrow: 'Twin',
    title: 'Tested twice',
    events: [
      { text: 'A digital twin rehearses the shift before the real machine turns a wheel.' },
      {
        text: 'Open the live field-test model.',
        href: '/field-test',
        linkLabel: 'Enter 3D test ↗',
      },
    ],
    badges: ['SIM', 'AI'],
    companies: ['Ironwood Lab'],
    met: ['Loaderling'],
  },
  2026: {
    id: 'today',
    age: 'NOW',
    eyebrow: 'Present',
    title: 'The rail is still moving',
    events: [
      { text: 'Seventy-two years of small decisions now live in one machine.' },
      { text: 'Ignite the next shift.', effect: 'fireworks' },
    ],
    badges: ['LIVE'],
    companies: ['Project Ironwood'],
    mentors: ['Past crews'],
    met: ['You'],
  },
}

export const ironwoodLifeline = {
  name: 'Project Ironwood',
  description: 'A fictional machine biography, 1954–2026.',
  birthYear: 1954,
  endYear: 2026,
  legend: {
    mentors: 'Guided by',
    met: 'Built with',
  },
  markers: Array.from({ length: 2026 - 1954 + 1 }, (_, index) => {
    const year = 1954 + index
    const milestone = milestones[year] ?? {}

    return {
      year,
      age: milestone.age ?? year - 1954,
      id: milestone.id ?? `year-${year}`,
      events: [],
      ...milestone,
    }
  }),
}
