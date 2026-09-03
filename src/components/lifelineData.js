const milestones = {
  1990: {
    id: 'born',
    events: [{ text: 'Born somewhere worth mentioning.' }],
  },
  2008: {
    id: 'school',
    events: [{ text: 'Finished school. Started something else.' }],
  },
  2014: {
    id: 'first-job',
    companies: ['Acme'],
    events: [{
      text: 'Joined ',
      href: 'https://example.com',
      linkLabel: 'Acme',
      suffix: ' and shipped the first real thing.',
    }],
  },
  2019: {
    id: 'the-move',
    events: [{ text: 'Moved across the world.' }],
  },
  2023: {
    id: 'the-project',
    events: [{ text: 'Started the project everything since has grown from.' }],
  },
  2026: {
    id: 'today',
    events: [{ text: 'Still going. 🎆', effect: 'fireworks' }],
  },
}

export const personalLifeline = {
  name: 'Your Name',
  description: 'A life, year by year.',
  birthYear: 1990,
  endYear: 2026,
  markers: Array.from({ length: 2026 - 1990 + 1 }, (_, index) => {
    const year = 1990 + index
    const milestone = milestones[year] ?? {}

    return {
      year,
      age: year - 1990,
      id: milestone.id ?? `year-${year}`,
      events: [],
      ...milestone,
    }
  }),
}
