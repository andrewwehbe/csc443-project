import { formatDuration, minutesBetween } from '../../lib/time.js';

// The three house rules of Topic 02, re-checked on every keystroke, so the user sees a conflict
// before they submit. problems comes from checkHouseRules; a rule with no problem passes.
//   draft       the booking as typed so far, or null while the room, date or times are not valid yet
//   headingRef  lets BookingForm move the keyboard focus here when a submit is refused by a rule
export default function HouseRulesCheck({ draft, problems, headingRef }) {
  const rules = [
    {
      rule: 'overlap',
      title: 'No overlap',
      passText: 'No other booking of this room overlaps your time.',
    },
    {
      rule: 'max-length',
      title: 'Two hours at most',
      passText: draft ? `${formatDuration(minutesBetween(draft.start, draft.end))}, within the limit.` : '',
    },
    {
      rule: 'one-per-day',
      title: 'One upcoming booking per day',
      passText: 'This is your only upcoming booking that day.',
    },
  ];

  return (
    <section aria-labelledby="rules-heading" className="rounded-xl border border-slate-200 p-4">
      <h2 id="rules-heading" ref={headingRef} tabIndex={-1} className="text-base font-semibold focus:outline-none">
        House rules
      </h2>

      {/* aria-live: a screen reader announces the result when it changes */}
      <div aria-live="polite">
        {draft === null ? (
          <p className="mt-2 text-sm text-slate-600">
            Checked as soon as the room, the date and both times are filled in.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rules.map(({ rule, title, passText }) => {
              const problem = problems.find((p) => p.rule === rule);
              return (
                <li key={rule} className="flex gap-2.5">
                  {problem ? (
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="currentColor">
                      <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM7.2 6.1 10 8.9l2.8-2.8 1.1 1.1-2.8 2.8 2.8 2.8-1.1 1.1-2.8-2.8-2.8 2.8-1.1-1.1 2.8-2.8-2.8-2.8 1.1-1.1Z" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" fill="currentColor">
                      <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.6 5.2 1.1 1.1-5.5 5.5-3-3 1.1-1.1 1.9 1.9 4.4-4.4Z" />
                    </svg>
                  )}
                  <div className="text-sm">
                    <p className={`font-medium ${problem ? 'text-red-800' : 'text-slate-900'}`}>
                      <span className="sr-only">{problem ? 'Broken: ' : 'Passes: '}</span>
                      {title}
                    </p>
                    <p className={problem ? 'text-red-700' : 'text-slate-600'}>{problem ? problem.message : passText}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
