import { useId } from 'react';

// Static translucent washes/craters: no bitmap, animation, filter or network.
const WASHES = [
  'M24 36Q30 20 46 25T68 35Q75 45 61 49T38 56Q20 53 24 36Z',
  'M28 54Q35 42 47 49T69 53Q72 68 54 72T29 65Z',
  'M40 25Q48 18 57 29L53 42Q43 49 35 37Z',
  'M25 44Q34 33 39 44T36 60Q23 64 25 44Z',
  'M53 38Q65 30 70 42T63 57Q52 53 53 38Z',
  'M43 54Q54 48 57 59T46 70Q37 66 43 54Z',
];
export default function LunarMoon({ phase, active }) {
  const id = useId().replace(/:/g, ''), crescent = ['WAXING', 'WANING'].includes(phase);
  const outline = crescent ? 'M56 23A26 26 0 1 0 56 73C32 66 32 31 56 23Z' : 'M48 22a26 26 0 1 0 0 52a26 26 0 1 0 0-52Z';
  return <svg viewBox="8 0 80 96" className={`lunar-moon ${phase === 'NEW' ? 'lunar-moon-new' : ''}`} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${id}-wash`} cx="32%" cy="28%" r="75%"><stop stopColor="var(--moon-light)"/><stop offset=".55" stopColor="var(--moon-mid)"/><stop offset="1" stopColor="var(--moon-edge)"/></radialGradient>
      <clipPath id={`${id}-clip`}><path d={outline}/></clipPath>
    </defs>
    {active && <g className="lunar-halo" data-lunar-halo>
      <circle cx="48" cy="48" r="30" fill="none" strokeWidth=".7"/>
      {Array.from({ length: 32 }, (_, i) => <path key={i} d={`M48 14v-${i % 4 === 0 ? 9 : i % 2 === 0 ? 6 : 3}`} transform={`rotate(${i * 11.25} 48 48)`} strokeWidth={i % 4 === 0 ? '.9' : '.55'}/>)}
    </g>}
    <g transform={phase === 'WANING' ? 'translate(96 0) scale(-1 1)' : undefined}>
      <path d={outline} fill={`url(#${id}-wash)`} stroke="var(--moon-rim)" strokeWidth="1.3"/>
      <g clipPath={`url(#${id}-clip)`} fill="var(--moon-pigment)">
        {WASHES.map((d, i) => <path key={i} d={d} opacity={i < 2 ? '.14' : '.21'}/>)}
        {[[34,33,5],[55,29,3],[61,57,6],[41,62,4],[30,53,3],[47,42,5],[61,42,3]].map(([cx,cy,r], i) => <circle key={i} cx={cx} cy={cy} r={r} opacity=".13"/>)}
        {Array.from({ length: 28 }, (_, i) => <circle key={`grain-${i}`} cx={26 + (i * 17 % 45)} cy={25 + (i * 23 % 46)} r={1 + (i % 3) * .7} opacity=".12"/>)}
        <path d="M27 37Q29 26 39 25M52 68Q65 66 68 55" fill="none" stroke="var(--moon-rim)" strokeWidth="2" opacity=".35"/>
      </g>
    </g>
  </svg>;
}
