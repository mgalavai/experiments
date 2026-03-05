# DevShop-Style Game Design

## High Concept
A management sim inspired by lemonade-stand pacing, but set in software delivery. The player grows a tiny software business by acquiring projects, breaking them into stories, staffing work across a kanban flow, and balancing speed, quality, and cost.

## Core Fantasy
- Start as a founder who does everything.
- Build a self-organizing team over time.
- Turn chaotic incoming work into reliable throughput and profit.

## Core Loop
1. Acquire a new client project (upfront cost/risk).
2. Decompose project into implementable story cards.
3. Pull stories through kanban stages (`Inbox -> Backlog -> Dev -> Test -> Done`).
4. Assign workers (or let initiative-driven workers self-pull tasks).
5. Resolve outcomes: pass, bug found in test, or escaped bug found by customer.
6. Earn story payout + project completion bonus.
7. Reinvest in hires, training, capability upgrades, and productivity boosts.
8. Repeat with higher costs/stakes as progression increases.

## Primary Resources
- Cash: used for hiring and upgrades.
- Time/Throughput: determines how quickly value is delivered.
- Quality: controls bug rates and rework.
- Team Capability: role coverage + skill depth.

## Actors and Roles
- Founder/Generalist: can perform all disciplines, lower efficiency/quality.
- Developer: strongest in implementation throughput.
- Tester: strongest in bug detection before release.
- Business Analyst: improves decomposition/flow of incoming work.

## Work Model
- Work items are cards on a kanban board.
- WIP and bottlenecks emerge from uneven role capacity.
- Smaller stories generally move faster with lower defect risk.
- Multi-skilled workers provide resilience when bottlenecks shift.

## Quality and Defect Dynamics
- Defects can be introduced during development.
- Testing can catch or miss defects.
- Escaped defects create delayed penalties and extra work.
- Earlier defect detection is cheaper than late/customer discovery.

## Progression and Economy
- Inflation/escalation raises costs and project stakes over time.
- Skill training increases worker speed and reliability.
- Initiative upgrades allow autonomous task-pulling, reducing micromanagement.
- Consumables/perks (e.g., morale/productivity boosts) create tactical short-term gains.

## Strategic Tensions (Intended Decisions)
- Speed vs quality now vs downstream rework later.
- Specialist efficiency vs generalist flexibility.
- Immediate hiring vs training existing staff.
- Micromanaged control vs autonomous team behavior.
- Local utilization vs global flow/throughput.

## Learning Outcomes (Embedded Systems Thinking)
- Throughput matters more than keeping everyone constantly busy.
- Bottlenecks determine system output.
- Balanced capacity across stages outperforms overinvestment in one stage.
- Reducing task size and defect escape rate compounds long-term gains.
- Self-organizing teams scale better than centralized task assignment.

## Scope Boundaries (What This Model Simplifies)
- No payroll/runway pressure from recurring salaries.
- Simplified hiring uncertainty and human variability.
- Simplified customer/payment behavior.
- Real-world organizational complexity intentionally abstracted.

## MVP Feature Set
- Kanban board with staged card movement.
- Project generation and story decomposition.
- Role-based workers with differentiated stats.
- Defect lifecycle (introduced, found in test, escaped).
- Shop/economy for hires and upgrades.
- Lightweight progression curve with rising stakes.

## Optional Extensions
- Worker fatigue/morale and retention risk.
- Project type specialization and domain mismatch penalties.
- Interrupt work (incidents/support) and context-switching cost.
- Procedural events (deadline pressure, scope changes, outages).
- Analytics layer (lead time, cycle time, escaped defects, throughput).
