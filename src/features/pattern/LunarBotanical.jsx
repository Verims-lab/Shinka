// Curves join the true transition coordinates. No decorative interaction.
export default function LunarBotanical({ nodes }) {
  return <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="lunar-botanical" data-lunar-track aria-hidden="true" focusable="false">
    {nodes.slice(1).map((node, i) => {
      const start = nodes[i].position * 1000, end = node.position * 1000, mid = (start + end) / 2, bend = i % 2 ? 5 : 94;
      return <g key={node.instant}>
        <path d={`M${start} 50C${mid} ${bend} ${mid} ${bend} ${end} 50`} className="lunar-vine"/>
        <g transform={`translate(${mid} ${i % 2 ? 19 : 81}) scale(${i % 2 ? -1 : 1} 1)`} className="lunar-sprig">
          <path d="M-25 0Q4-4 28-29M-6-4Q-9-17-19-23M9-13Q6-30 13-39M17-20Q32-20 40-31"/>
          <path d="M-19-23Q-23-15-10-10Q-11-19-19-23ZM13-39Q3-32 9-24Q17-27 13-39ZM40-31Q28-33 28-23Q38-23 40-31ZM28-29Q18-26 19-19Q28-20 28-29Z" className="lunar-leaf"/>
        </g>
        <path d={`M${mid} ${i % 2 ? 87 : 13}v10m-5-5h10m-5-3-2 3 2 3 2-3Z`} className="lunar-star"/>
      </g>;
    })}
  </svg>;
}
