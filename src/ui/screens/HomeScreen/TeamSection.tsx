import type { MouseEventHandler } from 'react';
import './TeamSection.css';

type TeamSectionProps = {
  onEnquire: MouseEventHandler<HTMLButtonElement>;
};

const engineers = [
  { name: 'Praveen', qualification: 'B.E. Civil Engineering', experience: "6 years' experience", image: '/images/team/praveen.webp' },
  { name: 'Dhilip Kumar', qualification: 'B.E. Civil Engineering', experience: "6 years' experience", image: '/images/team/dhilip-kumar.webp' },
];

export function TeamSection({ onEnquire }: TeamSectionProps) {
  return (
    <section id="team" className="mk-team" aria-labelledby="team-title">
      <div className="mk-team__header">
        <div>
          <span className="mk-team__eyebrow">04 / THE ENGINEERS</span>
          <h2 id="team-title">The people behind<br /><em>every decision.</em></h2>
        </div>
        <div className="mk-team__statement">
          <span className="mk-team__line" aria-hidden="true" />
          <p>Direct engineering review from the first project brief through the decisions made on site.</p>
        </div>
      </div>
      <div className="mk-team__portraits">
        {engineers.map((engineer, index) => (
          <article className="mk-team__profile" key={engineer.name}>
            <div className="mk-team__image-wrap">
              <img className="mk-team__image" src={engineer.image} alt={`${engineer.name}, Civil Engineer at MK Group`} width="720" height="900" loading="lazy" decoding="async" />
              <span className="mk-team__crosshair" aria-hidden="true" />
              <span className="mk-team__number" aria-hidden="true">0{index + 1}</span>
            </div>
            <div className="mk-team__details">
              <div><span>CIVIL ENGINEER</span><h3>{engineer.name}</h3></div>
              <dl>
                <div><dt>Qualification</dt><dd>{engineer.qualification}</dd></div>
                <div><dt>Practice</dt><dd>{engineer.experience}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>
      <div className="mk-team__footer">
        <p><span aria-hidden="true">↳</span> One engineering team. One accountable outcome.</p>
        <button type="button" onClick={onEnquire}>Speak with the engineers <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
}
