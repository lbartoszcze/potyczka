// The phases a run moves through, each with the phases it may move to: a
// faction is selected, a battle is fought, a won battle leads to a card pick
// and the next battle, a lost one (or any sandbox result) ends the run, and a
// new run starts from selection.
export const PHASE = Object.freeze({
  SELECT: 'select',
  BATTLE: 'battle',
  CARDPICK: 'cardpick',
  GAMEOVER: 'gameover',
});

const NEXT_PHASES = Object.freeze({
  [PHASE.SELECT]: Object.freeze([PHASE.BATTLE]),
  [PHASE.BATTLE]: Object.freeze([PHASE.CARDPICK, PHASE.GAMEOVER]),
  [PHASE.CARDPICK]: Object.freeze([PHASE.BATTLE]),
  [PHASE.GAMEOVER]: Object.freeze([PHASE.SELECT]),
});

// The phase a run in `phase` moves to, or the refusal naming both phases and
// the moves that exist: the one place a phase change is decided.
export function nextPhase(phase, next) {
  if (!NEXT_PHASES[phase].includes(next)) {
    throw new Error(
      `a run cannot move from ${phase} to ${next}; from ${phase} it moves to ${NEXT_PHASES[phase].join(' or ')}`,
    );
  }
  return next;
}
