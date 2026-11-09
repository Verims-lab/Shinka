import { patternCopy } from '@/foundation/i18n/patternCopy';
// The geometric track has no long labels. Numbered, wrapping rows associate
// all five actual instants with the track without collision at large text sizes.
export default function LunarTimeline({ lunar, language }) {
  const copy = key => patternCopy(key, language);
  const timeline = lunar.timeline;
  if (!timeline) return <div data-lunar-timeline className="space-y-3">
    {lunar.current && <p data-lunar-current>{copy('currentPhase')}: {copy(lunar.current.phase_code)}</p>}
    <p role="status">{copy('unavailable')}</p>
  </div>;
  const formatter = new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: lunar.timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const label = instant => {
    const parts = formatter.formatToParts(new Date(instant)), part = key => parts.find(p => p.type === key).value;
    return `${part('day')}.${part('month')} ${part('hour')}:${part('minute')}`;
  };
  const x = position => 12 + position * 276;
  return <div data-lunar-timeline className="space-y-4">
    <svg viewBox="0 0 300 84" className="w-full" aria-hidden="true" data-lunar-track>
      <path d="M12 32H288" fill="none" stroke="rgb(var(--shinka-mauve))"/>
      {timeline.nodes.map((node, index) => <g key={node.instant} data-lunar-node data-position={node.position}>
        <g transform={`translate(${x(node.position)} 32)`}>
          <circle r="8" fill={node.phase_code === 'NEW' ? 'rgb(var(--shinka-plum))' : 'rgb(var(--shinka-ivory))'} stroke="rgb(var(--shinka-plum))"/>
          {['WAXING', 'WANING'].includes(node.phase_code) && <path d={node.phase_code === 'WAXING' ? 'M0-8 A8 8 0 0 0 0 8 Q6 0 0-8Z' : 'M0-8 A8 8 0 0 1 0 8 Q-6 0 0-8Z'} fill="rgb(var(--shinka-plum))"/>}
          {index === timeline.active_index && <circle r="11" fill="none" stroke="rgb(var(--shinka-plum))" strokeWidth="1.5"/>}
        </g>
        <text x={x(node.position)} y="13" textAnchor="middle" fill="rgb(var(--shinka-ink))" fontSize="12">{index + 1}</text>
      </g>)}
      <path d={`M${x(timeline.today_position)} 45v20m-4-4 4 4 4-4`} fill="none" stroke="rgb(var(--shinka-plum))" strokeWidth="2" data-today-marker data-position={timeline.today_position}/>
    </svg>
    <p className="text-shinka-caption" data-lunar-current>{copy('today')} · {copy(timeline.nodes[timeline.active_index].phase_code)} · {copy('active')}</p>
    <ol className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3" aria-label={copy('lunar')}>
      {timeline.nodes.map((node, index) => <li key={node.instant} data-lunar-label aria-current={index === timeline.active_index ? 'step' : undefined} className="flex gap-3 items-start text-shinka-body">
        <span aria-hidden="true" className="shrink-0 font-medium">{index + 1}.</span>
        <div className="min-w-0 break-words"><span>{copy(index === 4 ? 'nextNew' : node.phase_code)}</span>{index === timeline.active_index && <span className="block text-shinka-caption">{copy('active')}</span>}<time dateTime={node.instant} className="block text-shinka-caption">{label(node.instant)}</time></div>
      </li>)}
    </ol>
    <p className="text-shinka-caption break-words">{copy('timezone')}: {lunar.timezone}</p>
  </div>;
}
