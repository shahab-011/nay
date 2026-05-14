import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { I } from '../components/Icons';

/* ── Static lawyer data (replace with API call when backend is ready) ── */
const LAWYERS = [
  { id: 1, name: 'Adv. Priya Sharma',   title: 'Senior Employment Lawyer',   bar: 'Bar Council · 2011', specs: ['Employment','Contracts','Arbitration'], rating: 4.9, reviews: 124, yrs: 13, cases: 230, langs: ['EN','HI'], fee: 150, consult: 80,  city: 'Mumbai',    bio: 'Specializes in employment contract disputes, non-compete enforcement, and severance negotiations. Recovered $4M+ in settlements for clients.', init: 'PS', color: '#7C3AED', online: true,  response: '2h',  aiMatch: true, why: 'Handled 47 employment contract cases. Non-compete specialist.' },
  { id: 2, name: 'Adv. Rohan Mehta',    title: 'Property & Real Estate',      bar: 'Bar Council · 2009', specs: ['Property','Real Estate','Disputes'],   rating: 4.8, reviews: 89,  yrs: 15, cases: 180, langs: ['EN','FR'], fee: 200, consult: 100, city: 'Toronto',   bio: 'RERA expert. Handles property disputes, builder-buyer agreements, and title verification.', init: 'RM', color: '#A78BFA', online: true,  response: '4h' },
  { id: 3, name: 'Adv. Anjali Verma',   title: 'Family & Civil Law',          bar: 'Bar Council · 2014', specs: ['Family','Divorce','Civil'],            rating: 4.9, reviews: 156, yrs: 10, cases: 210, langs: ['EN','DE'], fee: 120, consult: 60,  city: 'Berlin',    bio: 'Sensitive handling of divorce, child custody, and family matters. Mediation-first approach.', init: 'AV', color: '#D97706', online: false, response: '1d' },
  { id: 4, name: 'Adv. Kunal Banerjee', title: 'Corporate & M&A',             bar: 'Bar Council · 2007', specs: ['Corporate','M&A','Compliance'],       rating: 4.7, reviews: 72,  yrs: 17, cases: 95,  langs: ['EN','HI'], fee: 350, consult: 150, city: 'London',    bio: 'Big-firm pedigree. M&A, private equity, regulatory advisory.', init: 'KB', color: '#2563EB', online: true,  response: '6h' },
  { id: 5, name: 'Adv. Meera Iyer',     title: 'IP & Technology Law',         bar: 'Bar Council · 2013', specs: ['IP','Tech','Patents'],                 rating: 4.9, reviews: 98,  yrs: 11, cases: 145, langs: ['EN'],      fee: 180, consult: 90,  city: 'Singapore', bio: 'Trademarks, patents, SaaS contracts, GDPR compliance for tech startups.', init: 'MI', color: '#16A36A', online: true,  response: '3h' },
  { id: 6, name: 'Adv. Arjun Khanna',   title: 'Criminal Defense',            bar: 'Bar Council · 2008', specs: ['Criminal','Bail','White-collar'],      rating: 4.6, reviews: 64,  yrs: 16, cases: 320, langs: ['EN','HI'], fee: 250, consult: 120, city: 'Dubai',     bio: 'Bail matters, white-collar crime, and complex criminal defense. 320+ trials.', init: 'AK', color: '#9B8FFF', online: false, response: '1d' },
];

const PRACTICE_AREAS = ['All', 'Employment', 'Property', 'Family', 'Corporate', 'Criminal', 'IP', 'Civil'];

/* ── Shared topbar for Marketplace and Profile ─────────── */
function MarketTopbar({ navigate }) {
  return (
    <div style={{
      height: 64, padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div className="wordmark" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <I.Logo size={26} /><span>Nyaya</span><span className="wordmark-dot">.</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>For Lawyers</button>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn btn-purple btn-sm" onClick={() => navigate('/intake')}>Post Your Problem</button>
      </div>
    </div>
  );
}

/* ── Filter chip ─────────────────────────────────────────── */
function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="pill" style={{
      padding: '6px 14px', cursor: 'pointer',
      background: active ? 'var(--purple-soft)' : 'var(--elevated)',
      color: active ? 'var(--purple-deep)' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
      fontSize: 13,
    }}>{label}</button>
  );
}

/* ── Lawyer card ─────────────────────────────────────────── */
function LawyerCard({ l, onClick }) {
  return (
    <div className="card hover-lift" onClick={onClick} style={{
      overflow: 'hidden', cursor: 'pointer',
      borderColor: l.aiMatch ? 'rgba(124,58,237,0.35)' : 'var(--border)',
      boxShadow: l.aiMatch ? '0 0 24px var(--purple-glow)' : 'var(--shadow-card)',
    }}>
      {l.aiMatch && (
        <div style={{
          padding: '8px 16px',
          background: 'linear-gradient(90deg, var(--purple-soft), rgba(167,139,250,0.08))',
          borderBottom: '1px solid var(--purple-mist)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600,
        }}>
          <I.Sparkle size={12} style={{ color: 'var(--purple)' }} />
          <span style={{ color: 'var(--purple)' }}>AI Recommended for your case</span>
        </div>
      )}
      <div style={{ height: 56, background: `linear-gradient(135deg, ${l.color}22, ${l.color}08)`, position: 'relative' }}>
        <span className="pill pill-green" style={{ position: 'absolute', top: 10, right: 10, fontSize: 10 }}>
          <I.Check size={10} /> Verified
        </span>
      </div>
      <div style={{ padding: 16, paddingTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -28, marginBottom: 12 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: l.color, color: '#fff',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20,
              display: 'grid', placeItems: 'center', border: '3px solid var(--surface)',
            }}>{l.init}</div>
            {l.online && <span className="dot green" style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, border: '2px solid var(--surface)' }} />}
          </div>
          <span className="pill pill-muted" style={{ marginBottom: 8, fontSize: 10 }}>{l.response} response</span>
        </div>

        <div className="h-title" style={{ fontSize: 15, marginBottom: 2 }}>{l.name}</div>
        <div className="t-secondary" style={{ fontSize: 12.5, marginBottom: 2 }}>{l.title}</div>
        <div className="t-muted t-mono" style={{ fontSize: 10.5, marginBottom: 12 }}>{l.bar}</div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {l.specs.map(s => <span key={s} className="pill pill-muted" style={{ fontSize: 10 }}>{s}</span>)}
        </div>

        <div className="t-secondary t-mono" style={{ fontSize: 11, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.Star size={11} style={{ color: 'var(--gold)' }} /> {l.rating} · {l.reviews} reviews · {l.yrs} yrs · {l.cases} cases
        </div>
        <div className="t-muted" style={{ fontSize: 11, marginBottom: 12 }}>
          {l.langs.join(' · ')} · <I.MapPin size={10} style={{ verticalAlign: 'middle' }} /> {l.city}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <span className="t-mono" style={{ fontSize: 16, color: 'var(--purple)', fontWeight: 500 }}>${l.fee}</span>
            <span className="t-muted" style={{ fontSize: 12 }}>/hr</span>
          </div>
          <span className="t-muted" style={{ fontSize: 11 }}>${l.consult} consultation</span>
        </div>

        {l.aiMatch && (
          <div style={{ background: 'var(--purple-soft)', padding: 10, borderRadius: 8, fontSize: 11.5, marginBottom: 12 }}>
            <strong style={{ color: 'var(--purple)' }}>Why recommended:</strong>
            <span className="t-secondary"> {l.why}</span>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', height: 38 }} onClick={e => { e.stopPropagation(); }}>
          Book Consultation
        </button>
      </div>
    </div>
  );
}

/* ── Marketplace discovery page ─────────────────────────── */
export function MarketDiscovery() {
  const navigate = useNavigate();
  const [practice, setPractice] = useState('All');

  const filtered = practice === 'All'
    ? LAWYERS
    : LAWYERS.filter(l => l.specs.some(s => s.toLowerCase().includes(practice.toLowerCase())));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <MarketTopbar navigate={navigate} />

      {/* Hero search */}
      <section style={{ padding: '60px 24px 32px', background: 'var(--surface)', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <h1 className="h-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: 10 }}>
          Find the right lawyer for your case
        </h1>
        <p className="t-secondary" style={{ fontSize: 15, marginBottom: 28 }}>
          2,000+ verified lawyers worldwide
        </p>

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', height: 60,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '0 8px 0 18px', boxShadow: 'var(--shadow-card)',
          }}>
            <I.Sparkle size={18} style={{ color: 'var(--purple)', marginRight: 12 }} />
            <input
              className="input"
              placeholder="Describe your problem or search by specialization, city..."
              style={{ background: 'transparent', border: 0, height: 'auto', fontSize: 15, padding: 0, flex: 1 }}
            />
            <button className="btn btn-primary">Search</button>
          </div>

          <div style={{
            marginTop: 16, padding: 14,
            background: 'var(--purple-soft)',
            border: '1px solid var(--purple-mist)',
            borderRadius: 10, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <I.Sparkle size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13 }}>
              <strong style={{ color: 'var(--purple)' }}>Upload a document first</strong>
              <span className="t-secondary"> and AI will automatically recommend the best-matched specialists for your case.</span>
            </div>
            <button className="btn btn-purple btn-sm" onClick={() => navigate('/register')}>Analyze Document →</button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="t-muted" style={{ fontSize: 12, marginRight: 4 }}>Practice:</span>
          {PRACTICE_AREAS.map(area => (
            <FilterChip key={area} label={area} active={practice === area} onClick={() => setPractice(area)} />
          ))}
        </div>
      </section>

      {/* Sort bar */}
      <section style={{ padding: '14px 24px', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-secondary t-mono" style={{ fontSize: 13 }}>Showing {filtered.length} lawyers</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="t-muted" style={{ fontSize: 13 }}>Sort by:</span>
          <select className="input" style={{ width: 'auto', height: 36, paddingRight: 32 }}>
            <option>Best Match</option>
            <option>Highest Rated</option>
            <option>Most Experienced</option>
            <option>Fastest Response</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '12px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
          {filtered.map(l => (
            <LawyerCard key={l.id} l={l} onClick={() => navigate(`/marketplace/${l.id}`)} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Lawyer profile page ─────────────────────────────────── */
export function LawyerPublicProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const l = LAWYERS.find(x => x.id === parseInt(id, 10)) || LAWYERS[0];
  const [tab, setTab] = useState('about');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <MarketTopbar navigate={navigate} />

      {/* Cover */}
      <div style={{ height: 200, background: `linear-gradient(135deg, ${l.color}33, ${l.color}11)`, position: 'relative' }}>
        <button onClick={() => navigate('/marketplace')} className="btn btn-secondary btn-sm"
          style={{ position: 'absolute', top: 16, left: 16 }}>
          <I.ArrowLeft size={14} /> Back to results
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 32, marginTop: -64 }}>
          {/* Left */}
          <div>
            <div style={{
              width: 120, height: 120, borderRadius: 60,
              background: l.color, color: '#fff',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 40,
              display: 'grid', placeItems: 'center',
              border: '4px solid var(--bg)', marginBottom: 14,
            }}>{l.init}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 className="h-display" style={{ fontSize: 30 }}>{l.name}</h1>
              <span className="pill pill-green"><I.Check size={11} /> Verified</span>
            </div>
            <div className="t-secondary" style={{ fontSize: 15, marginBottom: 4 }}>{l.title}</div>
            <div className="t-muted t-mono" style={{ fontSize: 12, marginBottom: 14 }}>{l.bar}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <span className="pill pill-muted"><I.MapPin size={11} /> {l.city}</span>
              <span className="pill pill-muted">{l.langs.join(' · ')}</span>
              <span style={{ fontSize: 13, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <I.Star size={14} /> <span className="t-mono">{l.rating}</span>
                <span className="t-muted">({l.reviews} reviews)</span>
              </span>
              {l.online && <span className="pill pill-green"><span className="dot green" /> Available now</span>}
            </div>
          </div>

          {/* Right booking card */}
          <div className="card" style={{ padding: 24, borderColor: 'rgba(124,58,237,0.3)', height: 'fit-content', position: 'sticky', top: 80 }}>
            <div style={{ marginBottom: 18 }}>
              <span className="t-mono" style={{ fontSize: 32, color: 'var(--purple)', fontWeight: 500 }}>${l.fee}</span>
              <span className="t-muted" style={{ fontSize: 14 }}>/hour</span>
              <div className="t-muted" style={{ fontSize: 12, marginTop: 4 }}>${l.consult} consultation fee</div>
            </div>
            <button className="btn btn-purple btn-lg" style={{ width: '100%', marginBottom: 8 }} onClick={() => navigate('/register')}>
              Book Consultation
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 18 }} onClick={() => navigate('/register')}>
              <I.MessageCircle size={14} /> Message
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[['Years', l.yrs], ['Cases', l.cases], ['Rating', `${l.rating}/5`], ['Response', l.response]].map(([k, v]) => (
                <div key={k} style={{ padding: 10, background: 'var(--elevated)', borderRadius: 8, textAlign: 'center' }}>
                  <div className="t-mono" style={{ fontSize: 16, fontWeight: 500 }}>{v}</div>
                  <div className="t-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginTop: 28 }}>
          {['about', 'experience', 'reviews', 'availability'].map(t => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}>{t}</div>
          ))}
        </div>

        <div style={{ padding: '24px 0 80px' }}>
          {tab === 'about' && (
            <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>About</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{l.bio}</p>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>Practice Areas</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {l.specs.concat(['Mediation', 'Negotiation', 'Drafting']).map(s => (
                    <span key={s} className="pill pill-muted">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === 'experience' && (
            <div className="card" style={{ padding: 24, maxWidth: 720 }}>
              <div className="h-title" style={{ fontSize: 15, marginBottom: 16 }}>Case Type Breakdown</div>
              {[
                ['Primary Specialty', 85, 'var(--purple)'],
                ['Contract Drafting', 60, 'var(--purple)'],
                ['Arbitration', 45, 'var(--amber)'],
                ['Compliance Advisory', 30, 'var(--info)'],
                ['Litigation', 15, 'var(--error)'],
              ].map(([label, v, color]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span>{label}</span>
                    <span className="t-mono">{v}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${v}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'reviews' && (
            <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="t-mono" style={{ fontSize: 48, color: 'var(--gold)', fontWeight: 500 }}>{l.rating}</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => <I.Star key={i} size={14} style={{ color: 'var(--gold)' }} />)}
                  </div>
                  <div className="t-muted" style={{ fontSize: 11, marginTop: 4 }}>{l.reviews} reviews</div>
                </div>
              </div>
              {[
                { who: 'Alex M.', title: 'Excellent legal guidance', body: 'Thorough, responsive, and completely clear in explaining the options. Highly recommend.', date: '2 weeks ago', tags: ['Responsive', 'Knowledgeable'] },
                { who: 'Sara P.', title: 'Reviewed my contract', body: 'Caught a clause I would have missed. Very professional and great at plain-language explanations.', date: '1 month ago', tags: ['Patient', 'Detailed'] },
              ].map((r, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(i => <I.Star key={i} size={12} style={{ color: 'var(--gold)' }} />)}
                  </div>
                  <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>{r.title}</div>
                  <p className="t-secondary" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>{r.body}</p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {r.tags.map(t => <span key={t} className="pill pill-muted" style={{ fontSize: 10 }}>{t}</span>)}
                  </div>
                  <div className="t-muted" style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.who} · <span style={{ color: 'var(--green)' }}>✓ Verified Client</span></span>
                    <span className="t-mono">{r.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'availability' && (
            <div className="card" style={{ padding: 24, maxWidth: 720 }}>
              <div className="h-title" style={{ fontSize: 15, marginBottom: 16 }}>Available slots — this week</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <div key={d}>
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{d}</div>
                    <div className="t-mono" style={{ textAlign: 'center', fontSize: 13, marginBottom: 8 }}>{15 + i}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {i < 5 && ['10:00', '14:30', '17:00'].map(t => (
                        <button key={t} className="pill" onClick={() => navigate('/register')} style={{
                          padding: '6px 4px', background: 'var(--purple-soft)',
                          color: 'var(--purple)', border: '1px solid var(--purple-mist)',
                          fontSize: 10, justifyContent: 'center', cursor: 'pointer',
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketDiscovery;
