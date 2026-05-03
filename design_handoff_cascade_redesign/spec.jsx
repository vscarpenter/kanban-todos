// Design System spec page for Cascade — warm editorial direction

const Section = ({ eyebrow, title, blurb, children }) => (
  <section style={{ padding: "56px 64px", borderBottom: "1px solid var(--hairline)" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 48, alignItems: "start" }}>
        <div style={{ position: "sticky", top: 32 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 600, color: "var(--accent-500)",
            letterSpacing: 0.18, textTransform: "uppercase", marginBottom: 10,
          }}>{eyebrow}</div>
          <h2 className="serif" style={{
            fontSize: 36, lineHeight: 1.05, color: "var(--ink-1)",
            fontWeight: 400, letterSpacing: -0.02, margin: 0,
          }}>{title}</h2>
          {blurb && (
            <p style={{
              fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-3)",
              marginTop: 12, marginBottom: 0,
            }}>{blurb}</p>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  </section>
);

const SwatchCard = ({ name, value, varName, ink = "dark" }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <div style={{
      height: 88, borderRadius: 8, background: value,
      border: "1px solid var(--hairline)",
      display: "flex", alignItems: "flex-end", padding: 10,
    }}>
      <span className="mono" style={{
        fontSize: 10.5, color: ink === "light" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.55)",
        fontWeight: 500,
      }}>{value}</span>
    </div>
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-1)", fontWeight: 600 }}>{name}</div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 1 }}>{varName}</div>
    </div>
  </div>
);

const TypeRow = ({ name, sample, font, size, weight, lh, ls, mono }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "180px 1fr 220px", gap: 24,
    padding: "20px 0", borderBottom: "1px solid var(--hairline)", alignItems: "baseline",
  }}>
    <div>
      <div style={{ fontSize: 12.5, color: "var(--ink-1)", fontWeight: 600 }}>{name}</div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 2 }}>
        {size}/{lh} · {weight}
      </div>
    </div>
    <div style={{
      fontFamily: font, fontSize: size, fontWeight: weight,
      lineHeight: typeof lh === "number" ? lh : lh,
      letterSpacing: ls, color: "var(--ink-1)",
    }}>
      {sample}
    </div>
    <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
      {mono}
    </div>
  </div>
);

const ComponentCell = ({ label, children, wide }) => (
  <div style={{
    gridColumn: wide ? "span 2" : "auto",
    background: "var(--paper-card)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 12,
    padding: 24,
    boxShadow: "var(--shadow-xs)",
    display: "flex", flexDirection: "column", gap: 16,
    minHeight: 140,
  }}>
    <div style={{
      fontSize: 10.5, fontWeight: 600, color: "var(--ink-4)",
      letterSpacing: 0.14, textTransform: "uppercase",
    }}>{label}</div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", justifyContent: "center" }}>
      {children}
    </div>
  </div>
);

const Btn = ({ kind = "primary", size = "md", icon, children }) => {
  const sizes = {
    sm: { p: "5px 10px", fs: 12, ic: 13, gap: 5 },
    md: { p: "8px 14px", fs: 12.5, ic: 14, gap: 6 },
    lg: { p: "10px 18px", fs: 13.5, ic: 15, gap: 7 },
  };
  const kinds = {
    primary: {
      bg: "var(--accent-500)", color: "var(--accent-ink)",
      border: "var(--accent-600)", shadow: "var(--shadow-sm)",
    },
    secondary: {
      bg: "var(--paper-card)", color: "var(--ink-2)",
      border: "var(--hairline-strong)", shadow: "var(--shadow-xs)",
    },
    ghost: {
      bg: "transparent", color: "var(--ink-2)",
      border: "transparent", shadow: "none",
    },
    danger: {
      bg: "var(--paper-card)", color: "var(--danger-500)",
      border: "var(--hairline-strong)", shadow: "var(--shadow-xs)",
    },
  };
  const s = sizes[size]; const k = kinds[kind];
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.p, background: k.bg, color: k.color,
      border: `1px solid ${k.border}`, borderRadius: 8,
      fontSize: s.fs, fontWeight: 600, fontFamily: "var(--font-sans)",
      boxShadow: k.shadow, cursor: "pointer", letterSpacing: 0,
    }}>
      {icon && React.createElement(I[icon], { size: s.ic })}
      {children}
    </button>
  );
};

const DesignSystemSpec = () => (
  <div className="cascade-root" style={{ width: "100%", background: "var(--paper-0)" }}>
    {/* Hero */}
    <header style={{
      padding: "72px 64px 56px",
      borderBottom: "1px solid var(--hairline)",
      background: "linear-gradient(180deg, var(--paper-1) 0%, var(--paper-0) 100%)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <I.Logo size={36} />
          <div className="serif" style={{ fontSize: 26, color: "var(--ink-1)", letterSpacing: -0.02 }}>
            Cascade
          </div>
          <span style={{
            marginLeft: 4, padding: "3px 8px",
            background: "var(--paper-card)", border: "1px solid var(--hairline)",
            borderRadius: 999, fontSize: 11, fontWeight: 500, color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
          }}>v5.0 · Design System</span>
        </div>
        <h1 className="serif" style={{
          fontSize: 80, lineHeight: 0.98, fontWeight: 400, letterSpacing: -0.035,
          color: "var(--ink-1)", margin: 0, maxWidth: 980,
        }}>
          Quiet, considered, <em style={{ color: "var(--accent-500)", fontStyle: "italic" }}>warm</em>.<br/>
          A task manager that feels like paper.
        </h1>
        <p style={{
          fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)",
          maxWidth: 680, marginTop: 24, marginBottom: 0,
        }}>
          A refresh of Cascade's visual language. Off-white paper surfaces, a refined plum
          accent, an editorial serif paired with a humanist sans, and a curated icon set
          replacing the mixed emoji. Designed for both light and dark.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
          {[
            ["Source", "Tokens"], ["Fonts", "Instrument Sans / Serif"], ["Icons", "Lucide-style 1.6"],
            ["Radius", "8 / 10 / 12"], ["Accent", "Plum #6B4A87"],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "inline-flex", alignItems: "baseline", gap: 8,
              padding: "8px 12px",
              background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
              borderRadius: 8, fontSize: 12, color: "var(--ink-2)",
              boxShadow: "var(--shadow-xs)",
            }}>
              <span style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: 0.12, fontWeight: 600 }}>{k}</span>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-1)", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </header>

    {/* Type */}
    <Section
      eyebrow="01 — Typography"
      title="A serif for voice. A sans for work."
      blurb="Instrument Serif handles display moments — board names, page titles, hero copy. Instrument Sans does the heavy UI lifting. JetBrains Mono surfaces numbers, dates, IDs and metadata so they sit calmly alongside the prose."
    >
      <TypeRow name="Display"   sample="Client Projects" font="var(--font-serif)" size={56} weight={400} lh={1.05} ls="-0.025em" mono="serif · 56/60 · 400" />
      <TypeRow name="Page Title" sample="Work Tasks"     font="var(--font-serif)" size={36} weight={400} lh={1.1}  ls="-0.02em"  mono="serif · 36/40 · 400" />
      <TypeRow name="Section"   sample="In Progress"     font="var(--font-sans)"  size={20} weight={600} lh={1.3}  ls="-0.005em" mono="sans · 20/26 · 600" />
      <TypeRow name="Card Title" sample="Optimize image loading performance" font="var(--font-sans)" size={14} weight={600} lh={1.35} ls="-0.005em" mono="sans · 14/20 · 600" />
      <TypeRow name="Body"      sample="Implement lazy loading and WebP format support across the marketing pages." font="var(--font-sans)" size={13} weight={400} lh={1.55} ls="0" mono="sans · 13/20 · 400" />
      <TypeRow name="Label"     sample="DESIGN · ARCHITECTURE" font="var(--font-sans)"  size={11} weight={600} lh={1.4} ls="0.14em"  mono="sans · 11/15 · 600 · upper" />
      <TypeRow name="Mono"      sample="Apr 24 · 12:00 PM"     font="var(--font-mono)"  size={12} weight={500} lh={1.4} ls="0"       mono="mono · 12/16 · 500" />
    </Section>

    {/* Color */}
    <Section
      eyebrow="02 — Color"
      title="Paper, ink, and a single plum."
      blurb="Warm off-white surfaces replace the cool-grey panels. The accent shifts from flat purple to a deeper plum — better contrast on light surfaces, more sophisticated next to the serif. Status colors are muted and editorial; they mark, not shout."
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginBottom: 14 }}>Paper & Ink</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <SwatchCard name="Paper 0"  value="#FBF8F3" varName="--paper-0" />
          <SwatchCard name="Paper 1"  value="#F5F1EA" varName="--paper-1" />
          <SwatchCard name="Paper 2"  value="#EDE7DC" varName="--paper-2" />
          <SwatchCard name="Paper 3"  value="#E4DCCC" varName="--paper-3" />
          <SwatchCard name="Card"     value="#FFFEFB" varName="--paper-card" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 16 }}>
          <SwatchCard name="Ink 1"    value="#1C1A17" varName="--ink-1" ink="light" />
          <SwatchCard name="Ink 2"    value="#3A352E" varName="--ink-2" ink="light" />
          <SwatchCard name="Ink 3"    value="#6B6358" varName="--ink-3" ink="light" />
          <SwatchCard name="Ink 4"    value="#948C7E" varName="--ink-4" />
          <SwatchCard name="Ink 5"    value="#BDB4A4" varName="--ink-5" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginTop: 36, marginBottom: 14 }}>Plum (accent)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          <SwatchCard name="50"  value="#F6F0FA" varName="--accent-50" />
          <SwatchCard name="100" value="#EADDF3" varName="--accent-100" />
          <SwatchCard name="200" value="#D6BCE6" varName="--accent-200" />
          <SwatchCard name="300" value="#B690CE" varName="--accent-300" />
          <SwatchCard name="400" value="#8E62AB" varName="--accent-400" ink="light" />
          <SwatchCard name="500" value="#6B4A87" varName="--accent-500" ink="light" />
          <SwatchCard name="700" value="#402B52" varName="--accent-700" ink="light" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginTop: 36, marginBottom: 14 }}>Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <SwatchCard name="OK"     value="#4F7A4B" varName="--ok-500"     ink="light" />
          <SwatchCard name="Warn"   value="#B07820" varName="--warn-500"   ink="light" />
          <SwatchCard name="Danger" value="#A8412A" varName="--danger-500" ink="light" />
          <SwatchCard name="Info"   value="#3F627A" varName="--info-500"   ink="light" />
        </div>
      </div>
    </Section>

    {/* Spacing & radius */}
    <Section
      eyebrow="03 — Spacing & Radius"
      title="A 4px rhythm, a soft corner."
      blurb="Spacing follows a 4px scale — generous but not loose. Radii stay small (8 / 10 / 12) to feel like cut paper rather than candy."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginBottom: 14 }}>Scale</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["s-1", 4], ["s-2", 8], ["s-3", 12], ["s-4", 16],
              ["s-5", 20], ["s-6", 24], ["s-7", 32], ["s-8", 40],
            ].map(([n, v]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                <span className="mono" style={{ width: 60, color: "var(--ink-3)" }}>--{n}</span>
                <span style={{ width: v, height: 12, background: "var(--accent-300)", borderRadius: 2 }} />
                <span className="mono" style={{ color: "var(--ink-2)" }}>{v}px</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginBottom: 14 }}>Radius</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              ["sm", 6], ["md", 8], ["lg", 12], ["xl", 16], ["2xl", 20], ["pill", 999],
            ].map(([n, v]) => (
              <div key={n} style={{
                background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
                borderRadius: v, padding: "20px 12px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                boxShadow: "var(--shadow-xs)",
              }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>--r-{n}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)" }}>{v === 999 ? "pill" : v + "px"}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase", marginTop: 36, marginBottom: 14 }}>Shadows</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["sm", "md", "lg", "xl"].map(s => (
              <div key={s} style={{
                background: "var(--paper-card)", borderRadius: 10,
                padding: "20px 12px", boxShadow: `var(--shadow-${s})`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>shadow-{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>

    {/* Components */}
    <Section
      eyebrow="04 — Components"
      title="Built for the board."
      blurb="Every control is sized to coexist with a card. Buttons sit at 32px, badges at 20px, inputs share an 8px radius. Plum activates only the primary path; everything else stays in ink."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <ComponentCell label="Buttons">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn kind="primary" icon="Plus">New Task</Btn>
            <Btn kind="secondary" icon="Filter">Filters</Btn>
            <Btn kind="ghost">Cancel</Btn>
            <Btn kind="danger" icon="Trash">Delete</Btn>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn kind="primary" size="sm">Small</Btn>
            <Btn kind="primary" size="md">Default</Btn>
            <Btn kind="primary" size="lg">Large</Btn>
          </div>
        </ComponentCell>

        <ComponentCell label="Priority badges">
          <div style={{ display: "flex", gap: 8 }}>
            <PriorityBadge level="low" />
            <PriorityBadge level="med" />
            <PriorityBadge level="high" />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Tag>frontend</Tag><Tag>responsive</Tag><Tag>css</Tag><Tag>api</Tag>
          </div>
        </ComponentCell>

        <ComponentCell label="Search input" wide>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "10px 12px",
            background: "var(--paper-1)", border: "1px solid var(--hairline-strong)",
            borderRadius: 8,
          }}>
            <I.Search size={15} style={{ color: "var(--ink-4)" }} />
            <span style={{ flex: 1, fontSize: 13, color: "var(--ink-4)" }}>Search tasks, tags, boards…</span>
            <span className="mono" style={{
              fontSize: 10.5, color: "var(--ink-4)",
              padding: "1px 6px", border: "1px solid var(--hairline)", borderRadius: 4,
            }}>⌘K</span>
          </div>
        </ComponentCell>

        <ComponentCell label="Progress">
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>
              <span style={{ fontWeight: 500 }}>Progress</span>
              <span className="mono" style={{ fontWeight: 600, color: "var(--ink-2)" }}>40%</span>
            </div>
            <div style={{ height: 4, background: "var(--paper-2)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "40%", background: "linear-gradient(90deg, var(--accent-400), var(--accent-500))", borderRadius: 999 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--danger-500)", fontWeight: 500 }}>
            <I.Alert size={13} /><span className="mono">Apr 21 · Overdue</span>
          </div>
        </ComponentCell>

        <ComponentCell label="Task card" wide>
          <div style={{ width: "100%", maxWidth: 340 }}>
            <TaskCard task={SAMPLE_TASKS.doing[0]} />
          </div>
        </ComponentCell>

      </div>
    </Section>

    {/* Iconography */}
    <Section
      eyebrow="05 — Iconography"
      title="One stroke, one set."
      blurb="The mixed emoji on boards is replaced with a curated 24×24 line set at 1.6 stroke. Boards now use consistent glyphs colored by a per-board accent dot, keeping personality without the visual noise."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12 }}>
        {["Briefcase","Rocket","Megaphone","Home","Sprout","Book","Layers","Inbox",
          "Search","Filter","Plus","Calendar","Tag","Flag","Clock","Alert",
          "Edit","Share","Move","Archive","Trash","Settings","Help","Sparkles"].map(name => (
          <div key={name} style={{
            background: "var(--paper-card)", border: "1px solid var(--hairline)",
            borderRadius: 10, padding: 14, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "var(--ink-2)" }}>
              {React.createElement(I[name], { size: 20 })}
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{name}</span>
          </div>
        ))}
      </div>
    </Section>

    {/* Voice */}
    <Section
      eyebrow="06 — Voice"
      title="Direct, lowercase, never cute."
      blurb="Copy stays short and confident. Buttons are verbs. Empty states acknowledge the absence rather than perform."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          ["Don't", "🚀 Let's get those tasks done!", "danger"],
          ["Do",    "No tasks yet. Drag one here to start.", "ok"],
          ["Don't", "Successfully created your task ✨", "danger"],
          ["Do",    "Task added to To Do.", "ok"],
        ].map(([k, v, kind], i) => (
          <div key={i} style={{
            background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
            borderRadius: 10, padding: 18,
            borderLeft: `3px solid ${kind === "ok" ? "var(--ok-500)" : "var(--danger-500)"}`,
          }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: 0.14, textTransform: "uppercase",
              color: kind === "ok" ? "var(--ok-700)" : "var(--danger-700)",
            }}>{k}</div>
            <div className="serif" style={{ fontSize: 22, color: "var(--ink-1)", marginTop: 6, lineHeight: 1.3 }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </Section>

    <footer style={{
      padding: "32px 64px", textAlign: "center",
      fontSize: 12, color: "var(--ink-4)",
    }}>
      <span className="mono">Cascade · Design System · v5.0 · {new Date().getFullYear()}</span>
    </footer>
  </div>
);

window.DesignSystemSpec = DesignSystemSpec;
