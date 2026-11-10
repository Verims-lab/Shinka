import { patternCopy } from '@/foundation/i18n/patternCopy';
import LunarMoon from './LunarMoon';
import LunarBotanical from './LunarBotanical';
import LunarScroll from './LunarScroll';
import './lunarTimeline.css';

// Consume validated server ratios unchanged. Decoration never calculates time.
export default function LunarTimeline({ lunar, language }) {
  const copy = key => patternCopy(key, language), timeline = lunar.timeline;
  if (!timeline) return <div data-lunar-timeline className="space-y-3">
    {lunar.current && <p data-lunar-current>{copy('currentPhase')}: {copy(lunar.current.phase_code)}</p>}
    <p role="status">{copy('unavailable')}</p>
  </div>;
  const formatter = new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', {
    timeZone: lunar.timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const label = instant => {
    const parts = formatter.formatToParts(new Date(instant)), part = key => parts.find(p => p.type === key).value;
    return [`${part('day')}.${part('month')}`, `${part('hour')}:${part('minute')}`];
  };
  const gap = Math.min(...timeline.nodes.slice(1).map((node, i) => node.position - timeline.nodes[i].position));
  return <div data-lunar-timeline className="lunar-timeline">
    <p className="sr-only" data-lunar-current>{copy('today')} · {copy(timeline.nodes[timeline.active_index].phase_code)} · {copy('active')}</p>
    <LunarScroll label={copy('lunar')}>
      <div className="lunar-composition" data-lunar-layout style={/** @type {import('react').CSSProperties} */ ({ '--lunar-min-width': `${4.6 + 4.6 / gap}em`, '--lunar-label-width': `min(7em, ${100 * gap / (1 + gap)}%)` })}>
        <div className="lunar-axis" aria-hidden="true">
          <LunarBotanical nodes={timeline.nodes}/>
          <span className="lunar-today" data-today-marker data-position={timeline.today_position} style={{ left: `${timeline.today_position * 100}%` }}>{copy('today')}</span>
        </div>
        <ol className="lunar-nodes" role="list" aria-label={copy('lunar')}>
          {timeline.nodes.map((node, index) => {
            const [date, time] = label(node.instant), active = index === timeline.active_index;
            return <li key={node.instant} className="lunar-node" data-lunar-node data-position={node.position} style={{ left: `calc(${node.position} * (100% - var(--lunar-label-width)) + var(--lunar-label-width) / 2)` }}>
              <time className="lunar-date-above" dateTime={node.instant} aria-hidden="true"><span>{date}</span>{' '}<span>{time}</span></time>
              <span className="lunar-stem" aria-hidden="true"/>
              <LunarMoon phase={node.phase_code} active={active}/>
              <div className="lunar-label" data-lunar-label aria-current={active ? 'step' : undefined}>
                <span className="lunar-phase">{copy(index === 4 ? 'nextNew' : node.phase_code)}</span>
                {active && <span className="sr-only">{copy('active')}</span>}
                <time className="lunar-date-below" dateTime={node.instant}>{date}{' '}<span>{time}</span></time>
              </div>
            </li>;
          })}
        </ol>
      </div>
    </LunarScroll>
    <p className="lunar-timezone">{copy('timezone')}: {lunar.timezone}</p>
  </div>;
}
