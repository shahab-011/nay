import React from 'react';
import { useNavigate } from 'react-router-dom';
import { I } from '../components/Icons';

/* ── Sub-components ─────────────────────────────────────── */

function PublicNav({ navigate }) {
  return (
    <div className="navbar">
      <div className="wordmark" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <I.Logo size={28} />
        <span>Nyaya</span><span className="wordmark-dot">.</span>
      </div>
      <div className="nav-pill" style={{ display: 'none' }} id="nav-pill-desktop">
        <div className="nav-pill-item" onClick={() => navigate('/intake')}>Services</div>
        <div className="nav-pill-item" onClick={() => navigate('/marketplace')}>Find a Lawyer</div>
        <div className="nav-pill-item" onClick={() => navigate('/login')}>For Lawyers</div>
        <div className="nav-pill-item" onClick={() => navigate('/intake')}>Contact</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn btn-purple btn-sm" onClick={() => navigate('/intake')}>Get Started</button>
      </div>
    </div>
  );
}

function FeatureMini({ icon, title, sub, filled }) {
  return (
    <div className="card hover-lift" style={{
      padding: 28, textAlign: 'left',
      background: filled ? 'var(--ink)' : 'var(--surface)',
      color: filled ? '#fff' : 'var(--ink)',
      border: filled ? 'none' : '1px solid var(--border)',
    }}>
      <div className="icon-tile" style={{
        background: filled ? 'rgba(255,255,255,0.08)' : 'var(--purple-soft)',
        color: filled ? '#fff' : 'var(--purple)',
        marginBottom: 28,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: filled ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)' }}>{sub}</div>
    </div>
  );
}

function StepCard({ n, icon, title, desc, kind, children }) {
  const dark = kind === 'purple';
  return (
    <div style={{
      background: dark ? 'var(--purple)' : 'var(--surface)',
      color: dark ? '#fff' : 'var(--ink)',
      border: dark ? 'none' : '1px solid var(--border)',
      borderRadius: 22, padding: 32,
      boxShadow: dark ? '0 24px 60px rgba(124,58,237,0.25)' : 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="icon-tile" style={{
        background: dark ? 'rgba(255,255,255,0.14)' : 'var(--purple-soft)',
        color: dark ? '#fff' : 'var(--purple)',
        marginBottom: 24,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 10 }}>{n}. {title}</div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: dark ? 'rgba(255,255,255,0.82)' : 'var(--text-secondary)', marginBottom: 28 }}>{desc}</p>
      <div style={{ marginTop: 'auto' }}>{children}</div>
    </div>
  );
}

function PersonaCard({ icon, title, desc, onClick, tint }) {
  const filled = tint === 'filled';
  return (
    <div className="card hover-lift" style={{ padding: 32, cursor: 'pointer' }} onClick={onClick}>
      <div className="icon-tile" style={{
        background: filled ? 'var(--purple)' : 'var(--purple-soft)',
        color: filled ? '#fff' : 'var(--purple)',
        marginBottom: 32,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 14 }}>{title}</div>
      <p className="t-secondary" style={{ fontSize: 14.5, lineHeight: 1.65, marginBottom: 24 }}>{desc}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
        Learn More <I.ArrowRight size={16} />
      </div>
    </div>
  );
}

/* ── Dashboard mock preview ─────────────────────────────── */
function HeroPreview() {
  return (
    <div className="card-elev" style={{ borderRadius: 24, padding: 18, background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAFC 100%)', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingLeft: 6 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />
        ))}
      </div>
      <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 28, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, minHeight: 340 }}>
        {/* Sidebar */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
          <div className="wordmark" style={{ fontSize: 16, marginBottom: 20 }}>
            <span>Nyaya</span><span className="wordmark-dot" style={{ fontSize: 22 }}>.</span>
          </div>
          {[
            { t: 'Dashboard', active: true },
            { t: 'Documents' },
            { t: 'Ask AI' },
            { t: 'Marketplace' },
            { t: 'Billing' },
          ].map((x, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, marginBottom: 4,
              background: x.active ? 'var(--purple-soft)' : 'transparent',
              color: x.active ? 'var(--purple-deep)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: x.active ? 'var(--purple)' : 'var(--border)' }} />
              {x.t}
            </div>
          ))}
        </div>
        {/* Main */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div className="h-title" style={{ fontSize: 20 }}>Good morning</div>
            <span className="pill"><span className="pill-dot" /> 12 active cases</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { l: 'Documents', v: '14', tone: 'soft' },
              { l: 'Health Score', v: '87%', tone: 'purple' },
              { l: 'Alerts', v: '3', tone: 'soft' },
            ].map((s, i) => (
              <div key={i} style={{
                background: s.tone === 'purple' ? 'var(--purple)' : 'var(--surface)',
                color: s.tone === 'purple' ? '#fff' : 'var(--ink)',
                border: s.tone === 'purple' ? 'none' : '1px solid var(--border)',
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{s.l}</div>
                <div className="h-title" style={{ fontSize: 22 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Recent Documents</div>
            {[
              ['Employment Contract', 'HIGH RISK', 'red'],
              ['NDA Agreement', 'LOW RISK', 'green'],
              ['Vendor Agreement', 'MEDIUM RISK', 'amber'],
            ].map(([name, risk, col], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                alignItems: 'center', padding: '8px 0',
                borderTop: i ? '1px solid var(--border)' : 'none', fontSize: 12,
              }}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span className={`pill pill-${col}`} style={{ fontSize: 9 }}>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStep1() {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--border-active)' }} />)}
        <span className="t-muted t-mono" style={{ marginLeft: 'auto', fontSize: 10 }}>STEP 1</span>
      </div>
      <div className="skeleton" style={{ height: 8, marginBottom: 8, width: '92%' }} />
      <div className="skeleton" style={{ height: 8, marginBottom: 8, width: '74%' }} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)' }}>
        Describe your issue…
      </div>
    </div>
  );
}

function PreviewStep2() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.20)' }}>
      {[['Case Type', 'Employment Dispute'], ['Jurisdiction', 'Auto-detected'], ['Suggested Steps', '3 actions']].map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,0.18)' : 'none', fontSize: 12 }}>
          <span style={{ opacity: 0.78 }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewStep3() {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', color: 'var(--purple)' }}>
        <I.User size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <svg width="100%" height="22" viewBox="0 0 200 22" fill="none">
          <line x1="12" y1="11" x2="188" y2="11" stroke="var(--purple)" strokeWidth="1.6" strokeDasharray="4 4" />
          <circle cx="100" cy="11" r="5" fill="var(--purple)" />
        </svg>
      </div>
      <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <I.Lock size={11} /> ENCRYPTED
      </div>
    </div>
  );
}

/* ── Main Landing component ─────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="blob" style={{ width: 520, height: 520, background: '#C4B5FD', top: -80, left: -120, opacity: 0.35 }} />
        <div className="blob" style={{ width: 460, height: 460, background: '#DDD6FE', top: 260, right: -100, animationDelay: '-7s', opacity: 0.4 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicNav navigate={navigate} />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section style={{ padding: '40px 24px 120px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
          <span className="pill fade-up" style={{ marginBottom: 36, marginTop: 24 }}>
            <span className="pill-dot" /> AI-Powered Legal Intelligence
          </span>

          <h1 className="h-display fade-up-delay-1" style={{ fontSize: 'clamp(52px, 8vw, 120px)', maxWidth: 1050, margin: '0 auto 28px' }}>
            <span style={{ display: 'block', color: 'var(--ink)' }}>Legal help for every</span>
            <span style={{ display: 'block', color: 'var(--purple)' }}>person. Everywhere.</span>
          </h1>

          <p className="t-secondary fade-up-delay-2" style={{ fontSize: 19, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.55 }}>
            Understand any legal document instantly. Find the right lawyer. Manage your case.
            A unified platform that covers every step of your legal journey.
          </p>

          <div className="fade-up-delay-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/intake')}>Get Started Free</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/register')}>Try NyayaAI</button>
          </div>

          <div className="fade-up-delay-4" style={{ marginTop: 96, maxWidth: 1100, margin: '96px auto 0' }}>
            <HeroPreview />
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section style={{ padding: '120px 24px 80px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="h-display" style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 28 }}>
            <span style={{ display: 'block' }}>Everything you need to</span>
            <span className="t-grad">resolve a legal issue.</span>
          </h2>
          <p className="t-secondary" style={{ fontSize: 18, maxWidth: 640, margin: '0 auto 64px' }}>
            Replace fragmented research, guesswork, and costly middlemen with one transparent,
            intelligent platform built for the modern legal landscape.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <FeatureMini icon={<I.Lock size={28} />}     title="Privacy First"    sub="On-device AI processing" />
            <FeatureMini icon={<I.Sparkle size={28} />}  title="Smart Matching"   sub="AI-Powered Lawyer Triage" />
            <FeatureMini icon={<I.Users size={28} />}    title="Verified Lawyers" sub="No paid placements" />
            <FeatureMini icon={<I.Activity size={28} />} title="Always Improving" sub="GDPR Compliant" filled />
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section style={{ padding: '80px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="h-display" style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 24 }}>
            How does it <span className="t-grad">work?</span>
          </h2>
          <p className="t-secondary" style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 64px' }}>
            A simple three-step journey from your legal problem to a confident resolution.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, textAlign: 'left' }}>
            <StepCard n="1" icon={<I.MessageCircle size={22} />} title="Guided Submission" kind="light"
              desc="Answer a few structured questions about your situation. No legal jargon. No guesswork.">
              <PreviewStep1 />
            </StepCard>
            <StepCard n="2" icon={<I.Scale size={22} />} title="Intelligent Analysis" kind="purple"
              desc="Our AI analyzes your document or case, surfaces risks, explains your rights, and maps the path forward.">
              <PreviewStep2 />
            </StepCard>
            <StepCard n="3" icon={<I.Lock size={22} />} title="Secure Connection" kind="light"
              desc="Connect with verified lawyers through an encrypted, confidential digital workflow — on your terms.">
              <PreviewStep3 />
            </StepCard>
          </div>
        </section>

        {/* ── PERSONAS ─────────────────────────────────────────── */}
        <section style={{ padding: '120px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="h-display" style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 24 }}>
            Built for <span className="t-grad">every scale.</span>
          </h2>
          <p className="t-secondary" style={{ fontSize: 18, maxWidth: 580, margin: '0 auto 64px' }}>
            Whether you are navigating your first legal issue or managing a full law firm, Nyaya adapts to your workflow.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20, textAlign: 'left' }}>
            <PersonaCard
              icon={<I.User size={26} />}
              title="Individuals & Freelancers"
              desc="Understand any contract before you sign. Know your rights. Negotiate with confidence."
              onClick={() => navigate('/register')}
              tint="soft"
            />
            <PersonaCard
              icon={<I.Briefcase size={26} />}
              title="Small Businesses"
              desc="Manage vendor contracts, employee agreements, and compliance obligations in one place."
              onClick={() => navigate('/register')}
              tint="filled"
            />
            <PersonaCard
              icon={<I.Building size={26} />}
              title="Law Firms & Lawyers"
              desc="A complete practice management system — cases, time tracking, billing, client portal, and more."
              onClick={() => navigate('/login')}
              tint="soft"
            />
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, var(--purple-soft) 60%, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto' }}>
            <h2 className="h-display" style={{ fontSize: 'clamp(46px, 6.5vw, 108px)', marginBottom: 24 }}>
              Ready to <span className="t-grad">modernize?</span>
            </h2>
            <p className="t-secondary" style={{ fontSize: 18, maxWidth: 500, margin: '0 auto 40px' }}>
              Join thousands of users and legal professionals on the platform built for the future of law.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-purple btn-lg" onClick={() => navigate('/register')}>Start for Free</button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/marketplace')}>Find a Lawyer</button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{ padding: '60px 24px 36px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div className="wordmark" style={{ marginBottom: 16 }}>
                <I.Logo size={22} />
                <span>Nyaya</span><span className="wordmark-dot">.</span>
              </div>
              <p className="t-secondary" style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6, marginBottom: 20 }}>
                AI-powered legal intelligence for everyone. Understand, decide, and act with confidence.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[I.Network, I.Users, I.MessageCircle, I.Mail].map((Ic, i) => (
                  <button key={i} className="icon-tile" style={{ width: 38, height: 38, borderRadius: 10 }}>
                    <Ic size={16} />
                  </button>
                ))}
              </div>
            </div>
            {[
              ['Product', ['AI Analysis', 'Marketplace', 'For Lawyers', 'Pricing']],
              ['Company', ['About', 'Careers', 'Privacy', 'Terms']],
            ].map(([h, items]) => (
              <div key={h}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 18 }}>{h}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map(x => (
                    <div key={x} className="t-secondary" style={{ fontSize: 14, cursor: 'pointer' }}
                      onClick={() => x === 'AI Analysis' ? navigate('/register') : x === 'Marketplace' ? navigate('/marketplace') : null}>
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div className="h-title" style={{ fontSize: 15, marginBottom: 18 }}>Stay Updated</div>
              <p className="t-secondary" style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                Subscribe for the latest in legal tech.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="your@email.com" style={{ flex: 1 }} />
                <button className="btn btn-purple">Join</button>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            © 2026 Nyaya Technologies. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
