// Hi-fi Cascade board — warm editorial direction
// Renders a complete board view; accepts a `theme` prop ("light" | "dark")

const { useState } = React;

const SAMPLE_BOARDS = [
  { id: "work",     name: "Work Tasks",      sub: "Default work board",       icon: "Briefcase", dot: "var(--dot-blue)",  count: 12, active: false },
  { id: "launch",   name: "Product Launch",  sub: "Q2 2026 product launch",   icon: "Rocket",    dot: "var(--dot-rose)",  count: 6,  active: false },
  { id: "mkt",      name: "Marketing",       sub: "Q2 marketing campaign",    icon: "Megaphone", dot: "var(--dot-green)", count: 6,  active: false },
  { id: "client",   name: "Client Projects", sub: "Active client work",       icon: "Briefcase", dot: "var(--dot-clay)",  count: 6,  active: true  },
  { id: "home",     name: "Home Renovation", sub: "Kitchen remodel & living", icon: "Home",      dot: "var(--dot-amber)", count: 6,  active: false },
  { id: "side",     name: "Side Projects",   sub: "Personal experiments",     icon: "Sprout",    dot: "var(--dot-plum)",  count: 8,  active: false },
  { id: "learn",    name: "Learning Goals",  sub: "Personal development",     icon: "Book",      dot: "var(--dot-moss)",  count: 7,  active: false },
];

const SAMPLE_TASKS = {
  todo: [
    {
      id: "t1",
      title: "Optimize image loading performance",
      desc: "Implement lazy loading and WebP format support across the marketing pages.",
      priority: "low",
      tags: ["performance", "images", "optimization"],
      due: "22 hours ago",
      overdue: true,
    },
    {
      id: "t2",
      title: "Document API specifications",
      desc: "Create comprehensive API documentation with request/response examples.",
      priority: "med",
      tags: ["documentation", "api"],
      due: "May 6",
    },
  ],
  doing: [
    {
      id: "t3",
      title: "Create responsive dashboard layout",
      desc: "Design mobile-first dashboard with CSS Grid and container queries.",
      priority: "med",
      tags: ["frontend", "responsive", "css"],
      progress: 40,
      due: "Apr 21",
      overdue: true,
    },
  ],
  done: [
    {
      id: "t4",
      title: "Design new component library structure",
      desc: "Architecture for a scalable React component system shared across products.",
      priority: "high",
      tags: ["design", "architecture", "react"],
      due: null,
    },
    {
      id: "t5",
      title: "Implement authentication flow",
      desc: "Build secure login/logout with JWT tokens and refresh-token rotation.",
      priority: "high",
      tags: ["authentication", "security", "backend"],
      due: "Apr 17",
    },
    {
      id: "t6",
      title: "Write unit tests for API endpoints",
      desc: "Achieve 85% test coverage for backend API surface.",
      priority: "high",
      tags: ["testing", "api", "backend"],
      due: "Apr 28",
    },
  ],
};

// === Atoms =====================================================

const PriorityBadge = ({ level }) => {
  const map = {
    low:  { label: "Low",      bg: "var(--ok-50)",     fg: "var(--ok-700)",     dot: "var(--ok-500)" },
    med:  { label: "Medium",   bg: "var(--warn-50)",   fg: "var(--warn-700)",   dot: "var(--warn-500)" },
    high: { label: "High",     bg: "var(--danger-50)", fg: "var(--danger-700)", dot: "var(--danger-500)" },
  };
  const s = map[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 8px 3px 7px",
      background: s.bg, color: s.fg,
      borderRadius: 999,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.02,
      lineHeight: 1.4,
      border: "1px solid var(--hairline)",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  );
};

const Tag = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 7px",
    background: "var(--paper-1)",
    color: "var(--ink-3)",
    border: "1px solid var(--hairline)",
    borderRadius: 4,
    fontSize: 11, fontWeight: 500,
    fontFamily: "var(--font-mono)",
    letterSpacing: 0,
  }}>{children}</span>
);

const ColumnHeader = ({ dotColor, label, count, accent }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 4px 14px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)", letterSpacing: 0.01 }}>{label}</span>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 20, height: 20, padding: "0 6px",
        background: "var(--paper-1)", color: "var(--ink-3)",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
        fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)",
      }}>{count}</span>
    </div>
    <button style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 24, height: 24, border: "none", background: "transparent",
      color: "var(--ink-4)", borderRadius: 6, cursor: "pointer",
    }}>
      <I.Plus size={14} />
    </button>
  </div>
);

// === Task Card =================================================

const TaskCard = ({ task, lifted = false, dragging = false }) => {
  return (
    <div
      style={{
        position: "relative",
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        borderRadius: 10,
        padding: "14px 14px 12px",
        boxShadow: lifted ? "var(--shadow-lift)" : "var(--shadow-sm)",
        transform: lifted ? "rotate(-1.4deg) translateY(-2px)" : "none",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{
          fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: "var(--ink-1)",
          letterSpacing: -0.005,
        }}>{task.title}</div>
        <button style={{
          width: 22, height: 22, border: "none", background: "transparent",
          color: "var(--ink-4)", borderRadius: 4, cursor: "pointer", flexShrink: 0,
          marginTop: -2, marginRight: -4,
        }}><I.More size={16} /></button>
      </div>
      {task.desc && (
        <div style={{
          marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)",
        }}>{task.desc}</div>
      )}

      {task.progress !== undefined && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "var(--ink-3)", marginBottom: 4,
          }}>
            <span style={{ fontWeight: 500 }}>Progress</span>
            <span className="mono" style={{ color: "var(--ink-2)", fontWeight: 600 }}>{task.progress}%</span>
          </div>
          <div style={{
            height: 4, background: "var(--paper-2)", borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${task.progress}%`,
              background: "linear-gradient(90deg, var(--accent-400), var(--accent-500))",
              borderRadius: 999,
            }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {task.priority && <PriorityBadge level={task.priority} />}
        {task.tags?.map(t => <Tag key={t}>{t}</Tag>)}
      </div>

      {task.due && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--hairline)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11.5, color: task.overdue ? "var(--danger-500)" : "var(--ink-3)",
          fontWeight: task.overdue ? 500 : 400,
        }}>
          {task.overdue ? <I.Alert size={13} /> : <I.Calendar size={13} />}
          <span className="mono" style={{ letterSpacing: 0 }}>
            {task.due}{task.overdue ? " · Overdue" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

// === Sidebar ===================================================

const SidebarBoardItem = ({ board }) => (
  <button style={{
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 12px",
    background: board.active ? "var(--paper-card)" : "transparent",
    border: board.active ? "1px solid var(--hairline-strong)" : "1px solid transparent",
    borderLeft: board.active ? `3px solid var(--accent-500)` : "1px solid transparent",
    borderRadius: 8, cursor: "pointer",
    boxShadow: board.active ? "var(--shadow-xs)" : "none",
    textAlign: "left",
    transition: "background 120ms ease",
  }}>
    <span style={{
      width: 26, height: 26, borderRadius: 6,
      background: "var(--paper-2)", color: board.dot,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      border: "1px solid var(--hairline)",
    }}>
      {React.createElement(I[board.icon], { size: 14, strokeWidth: 1.8 })}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: "var(--ink-1)", letterSpacing: -0.005,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{board.name}</div>
      <div style={{
        fontSize: 11, color: "var(--ink-4)", marginTop: 1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{board.sub}</div>
    </div>
    <span className="mono" style={{
      fontSize: 11, color: "var(--ink-3)", fontWeight: 500,
      padding: "1px 6px",
      background: "var(--paper-1)",
      borderRadius: 999,
      border: "1px solid var(--hairline)",
    }}>{board.count}</span>
  </button>
);

const Sidebar = ({ boards }) => (
  <aside style={{
    width: 280, background: "var(--paper-1)",
    borderRight: "1px solid var(--hairline-strong)",
    display: "flex", flexDirection: "column",
    height: "100%",
  }}>
    {/* Brand */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 18px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <I.Logo size={28} />
        <div className="serif" style={{ fontSize: 22, color: "var(--ink-1)", fontWeight: 400, letterSpacing: -0.02 }}>
          Cascade
        </div>
      </div>
      <button style={{
        width: 26, height: 26, border: "1px solid var(--hairline)",
        background: "var(--paper-card)", color: "var(--ink-3)",
        borderRadius: 6, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}><I.ChevLeft size={14} /></button>
    </div>

    {/* Boards header */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px 10px",
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: "var(--ink-4)",
        letterSpacing: 0.14, textTransform: "uppercase",
      }}>Boards</div>
      <button style={{
        width: 22, height: 22, border: "1px solid var(--hairline)",
        background: "var(--paper-card)", color: "var(--ink-2)",
        borderRadius: 6, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}><I.Plus size={12} /></button>
    </div>

    <div style={{ flex: 1, overflow: "auto", padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
      {boards.map(b => <SidebarBoardItem key={b.id} board={b} />)}
    </div>

    {/* Bottom nav */}
    <div style={{ padding: "12px", borderTop: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 2 }}>
      {[
        ["Download", "Export"],
        ["Upload", "Import"],
        ["Archive", "Archive"],
        ["Settings", "Settings"],
      ].map(([icon, label]) => (
        <button key={label} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", border: "none", background: "transparent",
          color: "var(--ink-2)", borderRadius: 6, cursor: "pointer",
          fontSize: 12.5, fontWeight: 500, textAlign: "left",
        }}>
          {React.createElement(I[icon], { size: 15 })}
          {label}
        </button>
      ))}
      <div style={{
        marginTop: 8, padding: "10px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11.5, color: "var(--ink-3)",
        background: "var(--paper-card)", border: "1px solid var(--hairline)", borderRadius: 8,
      }}>
        <div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Cascade <span className="mono">v5.0</span></div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 1 }}>May 03 · 2026</div>
        </div>
        <div style={{
          display: "inline-flex", padding: 2, background: "var(--paper-1)",
          border: "1px solid var(--hairline)", borderRadius: 999,
        }}>
          <span style={{ padding: "3px 7px", borderRadius: 999, background: "var(--paper-card)", boxShadow: "var(--shadow-xs)", color: "var(--ink-1)" }}>
            <I.Sun size={12} />
          </span>
          <span style={{ padding: "3px 7px", color: "var(--ink-4)" }}>
            <I.Moon size={12} />
          </span>
        </div>
      </div>
    </div>
  </aside>
);

// === Top bar ===================================================

const TopBar = () => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "16px 24px",
    borderBottom: "1px solid var(--hairline)",
    background: "var(--paper-0)",
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      flex: 1, maxWidth: 540,
      padding: "8px 12px",
      background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
      borderRadius: 8,
      boxShadow: "var(--shadow-xs)",
    }}>
      <I.Search size={15} style={{ color: "var(--ink-4)" }} />
      <input
        placeholder="Search tasks, tags, boards…"
        style={{
          border: "none", outline: "none", background: "transparent",
          flex: 1, fontSize: 13, color: "var(--ink-1)",
          fontFamily: "var(--font-sans)",
        }}
      />
      <span className="mono" style={{
        fontSize: 10.5, color: "var(--ink-4)",
        padding: "1px 6px", border: "1px solid var(--hairline)", borderRadius: 4,
        background: "var(--paper-1)",
      }}>⌘K</span>
    </div>
    <div style={{ flex: 1 }} />
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 12px",
      background: "var(--paper-card)", color: "var(--ink-2)",
      border: "1px solid var(--hairline-strong)",
      borderRadius: 8, cursor: "pointer",
      fontSize: 12.5, fontWeight: 500, fontFamily: "var(--font-sans)",
      boxShadow: "var(--shadow-xs)",
    }}>
      <I.Filter size={14} />
      Filters
      <span style={{
        marginLeft: 4, background: "var(--accent-100)", color: "var(--accent-700)",
        fontSize: 10.5, padding: "0 5px", borderRadius: 999, fontWeight: 600,
        fontFamily: "var(--font-mono)",
      }}>2</span>
    </button>
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 14px",
      background: "var(--accent-500)", color: "var(--accent-ink)",
      border: "1px solid var(--accent-600)",
      borderRadius: 8, cursor: "pointer",
      fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)",
      boxShadow: "var(--shadow-sm)",
    }}>
      <I.Plus size={14} />
      New Task
    </button>
  </div>
);

// === Board header ==============================================

const BoardHeader = ({ board }) => (
  <div style={{ padding: "28px 32px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{
        width: 44, height: 44, borderRadius: 10,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
        color: board.dot,
        boxShadow: "var(--shadow-xs)",
      }}>
        {React.createElement(I[board.icon], { size: 22, strokeWidth: 1.6 })}
      </span>
      <div style={{ flex: 1 }}>
        <div className="serif" style={{
          fontSize: 36, lineHeight: 1.05, color: "var(--ink-1)",
          fontWeight: 400, letterSpacing: -0.02,
        }}>
          {board.name}<span style={{ color: "var(--accent-500)" }}>.</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
          {board.sub} · <span className="mono">{board.count}</span> open tasks
        </div>
      </div>
    </div>

    {/* Stats row */}
    <div style={{
      marginTop: 22,
      display: "flex", gap: 0,
      background: "var(--paper-card)", border: "1px solid var(--hairline-strong)",
      borderRadius: 10, padding: 4, boxShadow: "var(--shadow-xs)",
      width: "fit-content",
    }}>
      {[
        { label: "Total", value: 6, color: "var(--ink-2)" },
        { label: "To Do", value: 2, color: "var(--info-500)" },
        { label: "In Progress", value: 1, color: "var(--warn-500)" },
        { label: "Done", value: 3, color: "var(--ok-500)" },
      ].map((s, i) => (
        <div key={s.label} style={{
          padding: "8px 18px",
          borderRight: i < 3 ? "1px solid var(--hairline)" : "none",
          display: "flex", alignItems: "baseline", gap: 7,
        }}>
          <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: s.color, letterSpacing: -0.01 }}>{s.value}</span>
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>{s.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// === Column ====================================================

const Column = ({ dotColor, label, count, children, dropTarget = false }) => (
  <div style={{
    flex: 1, minWidth: 0,
    background: "var(--paper-2)",
    border: dropTarget ? "1.5px dashed var(--accent-400)" : "1px solid var(--hairline)",
    borderRadius: 14,
    padding: "16px 14px",
    display: "flex", flexDirection: "column",
    transition: "border-color 200ms ease, background 200ms ease",
    backgroundColor: dropTarget ? "color-mix(in oklab, var(--accent-50), var(--paper-2) 60%)" : "var(--paper-2)",
  }}>
    <ColumnHeader dotColor={dotColor} label={label} count={count} />
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
      {children}
    </div>
  </div>
);

// === Board ====================================================

const CascadeBoard = ({ theme = "light", showDragPreview = false }) => {
  const board = SAMPLE_BOARDS.find(b => b.active);
  return (
    <div className={`cascade-root ${theme === "dark" ? "dark" : ""}`} style={{
      width: "100%", height: "100%",
      display: "flex", overflow: "hidden",
      background: "var(--paper-0)",
      borderRadius: 12,
    }}>
      <Sidebar boards={SAMPLE_BOARDS} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <BoardHeader board={board} />
        <div style={{
          flex: 1, padding: "0 32px 32px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
          alignItems: "stretch",
        }}>
          <Column dotColor="var(--info-500)" label="To Do" count={SAMPLE_TASKS.todo.length}>
            {SAMPLE_TASKS.todo.map((t, idx) => (
              <TaskCard
                key={t.id}
                task={t}
                dragging={showDragPreview && idx === 0}
              />
            ))}
          </Column>
          <Column
            dotColor="var(--warn-500)"
            label="In Progress"
            count={SAMPLE_TASKS.doing.length + (showDragPreview ? 1 : 0)}
            dropTarget={showDragPreview}
          >
            {showDragPreview && (
              <TaskCard task={SAMPLE_TASKS.todo[0]} lifted />
            )}
            {SAMPLE_TASKS.doing.map(t => <TaskCard key={t.id} task={t} />)}
            {showDragPreview && (
              <div style={{
                border: "1.5px dashed var(--accent-300)",
                background: "color-mix(in oklab, var(--accent-50), transparent 30%)",
                borderRadius: 10,
                padding: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent-600)", fontSize: 12, fontWeight: 500,
                fontFamily: "var(--font-sans)",
                minHeight: 60,
              }}>
                Drop to move task here
              </div>
            )}
          </Column>
          <Column dotColor="var(--ok-500)" label="Done" count={SAMPLE_TASKS.done.length}>
            {SAMPLE_TASKS.done.map(t => <TaskCard key={t.id} task={t} />)}
          </Column>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  CascadeBoard, TaskCard, PriorityBadge, Tag, Sidebar, TopBar, BoardHeader, Column,
  SAMPLE_BOARDS, SAMPLE_TASKS,
});
