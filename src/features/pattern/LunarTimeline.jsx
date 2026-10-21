import { patternCopy } from '@/foundation/i18n/patternCopy';
// The geometric track has no long labels. Numbered, wrapping rows associate
// all five actual instants with the track without collision at large text sizes.
export default function LunarTimeline({ timeline, language }) {
  const copy = key => patternCopy(key, language);
  const x = position => 12 + position * 276;
  return <div data-lunar-timeline className="space-y-4">
    <svg viewBox="0 0 300 84" className="w-full" aria-hidden="true" data-lunar-track>
      <path d="M12 32H288" fill="none" stroke="rgb(var(--shinka-mauve))"/>
      {timeline.nodes.map((node, index) => <g key={node.instant}>
        <g transform={`translate(${x(node.position)} 32)`}>
          <circle r="8" fill={node.phase_code === 'NEW' ? 'rgb(var(--shinka-plum))' : 'rgb(var(--shinka-ivory))'} stroke="rgb(var(--shinka-plum))"/>
          {['WAXING', 'WANING'].includes(node.phase_code) && <path d={node.phase_code === 'WAXING' ? 'M0-8 A8 8 0 0 0 0 8 Q6 0 0-8Z' : 'M0-8 A8 8 0 0 1 0 8 Q-6 0 0-8Z'} fill="rgb(var(--shinka-plum))"/>}
          {index === timeline.active_index && <circle r="11" fill="none" stroke="rgb(var(--shinka-plum))" strokeWidth="1.5"/>}
        </g>
        <text x={x(node.position)} y="13" textAnchor="middle" fill="rgb(var(--shinka-ink))" fontSize="12">{index + 1}</text>
      </g>)}
      <path d={`M${x(timeline.today_position)} 45v20m-4-4 4 4 4-4`} fill="none" stroke="rgb(var(--shinka-plum))" strokeWidth="2" data-today-marker/>
    </svg>
    <p className="text-shinka-caption" data-lunar-current>{copy('today')} · {copy(timeline.nodes[timeline.active_index].phase_code)} · {copy('active')}</p>
    <ol className="space-y-3" aria-label={copy('lunar')}>
      {timeline.nodes.map((node, index) => <li key={node.instant} data-lunar-label aria-current={index === timeline.active_index ? 'step' : undefined} className="flex gap-3 items-start text-shinka-body">
        <span aria-hidden="true" className="shrink-0 font-medium">{index + 1}.</span>
        <div className="min-w-0 break-words"><span>{copy(node.phase_code)}</span>{index === timeline.active_index && <span className="block text-shinka-caption">{copy('active')}</span>}<time dateTime={node.instant} className="block text-shinka-caption">{node.label}</time></div>
      </li>)}
    </ol>
    <p className="text-shinka-caption break-words">{copy('timezone')}: {timeline.timezone}</p>
  </div>;
}
