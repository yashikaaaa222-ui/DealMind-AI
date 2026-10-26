
import { useState } from "react";
import {
  Brain,
  Building2,
  ClipboardList,
  LoaderCircle,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import "./App.css";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [company, setCompany] = useState("Acme Technologies");
  const [dealValue, setDealValue] = useState("");
  const [dealStage, setDealStage] = useState("Negotiation");
const [objections, setObjections] = useState("");
const [nextAction, setNextAction] = useState("");
const [followUpDate, setFollowUpDate] = useState("");
const [dealMessage, setDealMessage] = useState("");
const [savingDeal, setSavingDeal] = useState(false);
  const [notes, setNotes] = useState("");
  const [briefing, setBriefing] = useState("");
  const [agentQuestion, setAgentQuestion] = useState("");
const [agentAnswer, setAgentAnswer] = useState("");
const [agentLoading, setAgentLoading] = useState(false);
const [dealHealth, setDealHealth] = useState("");
const [healthLoading, setHealthLoading] = useState(false);
const [healthError, setHealthError] = useState("");
// Objection Tracking
const [objectionAnalysis, setObjectionAnalysis] = useState("");
const [objectionLoading, setObjectionLoading] = useState(false);
const [objectionError, setObjectionError] = useState("");

// Next Best Actions
const [nextBestActions, setNextBestActions] = useState("");
const [actionsLoading, setActionsLoading] = useState(false);
const [actionsError, setActionsError] = useState("");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveMeeting(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setBriefing("");

    try {
      const response = await fetch(`${API}/meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save meeting.");
      }

      setStatus(data.message || "Meeting notes saved successfully.");
      setNotes("");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generateBriefing() {
    setLoading(true);
    setStatus("");
    setBriefing("");

    try {
      const response = await fetch(`${API}/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not generate briefing.");
      }

      setBriefing(
        typeof data.briefing === "string"
          ? data.briefing
          : JSON.stringify(data.briefing, null, 2)
      );
      setStatus("Briefing generated.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }
  async function saveDeal() {
  if (
    !company.trim() ||
    dealValue === "" ||
    !objections.trim() ||
    !nextAction.trim() ||
    !followUpDate
  ) {
    setDealMessage("Please fill in all deal details.");
    return;
  }

  setSavingDeal(true);
  setDealMessage("");

  try {
    const response = await fetch(`${API}/deal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company: company.trim(),
        deal_value: Number(dealValue),
        deal_stage: dealStage,
        objections: objections.trim(),
        next_action: nextAction.trim(),
        follow_up_date: followUpDate,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not save deal.");
    }

    setDealMessage("Deal saved successfully!");
    setDealValue("");
    setObjections("");
    setNextAction("");
    setFollowUpDate("");
  } catch (error) {
    setDealMessage(`Error: ${error.message}`);
  } finally {
    setSavingDeal(false);
  }
}
async function generateDealHealth() {
  setHealthLoading(true);
  setHealthError("");
  setDealHealth("");

  try {
    const response = await fetch(`${API}/deal-health`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ company }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not assess deal health.");
    }

    setDealHealth(data.deal_health || "No health assessment returned.");
  } catch (error) {
    setHealthError(error.message);
  } finally {
    setHealthLoading(false);
  }
}
async function askDealMindAgent(question) {
  const questionToAsk = question || agentQuestion;

  if (!company.trim() || !questionToAsk.trim()) {
    return;
  }

  setAgentLoading(true);
  setAgentAnswer("");

  try {
    const response = await fetch(`${API}/agent-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company,
        question: questionToAsk,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Agent request failed.");
    }

    setAgentAnswer(data.answer || "No answer returned.");
  } catch (error) {
    setAgentAnswer(`Error: ${error.message}`);
  } finally {
    setAgentLoading(false);
  }
}
async function analyzeObjections() {
  if (!company.trim()) return;

  setObjectionLoading(true);
  setObjectionError("");
  setObjectionAnalysis("");

  try {
    const response = await fetch(`${API}/objection-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: company.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not analyze objections.");
    }

    setObjectionAnalysis(
      data.objection_analysis || "No objection analysis returned."
    );
  } catch (error) {
    setObjectionError(error.message);
  } finally {
    setObjectionLoading(false);
  }
}
async function generateNextBestActions() {
  if (!company.trim()) return;

  setActionsLoading(true);
  setActionsError("");
  setNextBestActions("");

  try {
    const response = await fetch(`${API}/next-best-actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: company.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not generate next actions.");
    }

    setNextBestActions(
      data.next_best_actions || "No recommendations returned."
    );
  } catch (error) {
    setActionsError(error.message);
  } finally {
    setActionsLoading(false);
  }
}

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Brain size={23} /></div>
          <div>
            <h2>DealMind<span>AI</span></h2>
            <p>Sales Intelligence</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><Target size={18} /> Overview</div>
        <div className="nav-item"><Building2 size={18} /> Accounts</div>
        <div className="nav-item"><MessageSquareText size={18} /> Meeting Notes</div>
        <div className="nav-item"><Brain size={18} /> AI Memory</div>

        <div className="sidebar-bottom">
          <div className="memory-status">
            <span className="status-dot" />
            <div><strong>Memory-powered AI</strong><small>Hindsight integration</small></div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">SALES WORKSPACE</span><h1>Deal Intelligence</h1></div>
          <div className="avatar">DM</div>
        </header>

        <section className="welcome">
          <div>
            <div className="welcome-tag"><Sparkles size={14} /> YOUR AI SALES COPILOT</div>
            <h2>Every conversation counts.</h2>
            <p>Remember customer context, uncover objections, and walk into every meeting prepared.</p>
          </div>
          <div className="welcome-art"><Brain size={70} strokeWidth={1.2} /></div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><Building2 size={20} /></div>
            <span>Active account</span><strong>1</strong><small>Demo workspace</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><ClipboardList size={20} /></div>
            <span>Meeting notes</span><strong>Live</strong><small>Save new interactions</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><TrendingUp size={20} /></div>
            <span>Next step</span><strong>Prepare</strong><small>Turn memory into action</small>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">ACCOUNT CONTEXT</span><h3>Log a meeting</h3></div>
              <MessageSquareText size={21} />
            </div>
            <form onSubmit={saveMeeting}>
              <label htmlFor="company">Company name</label>
              <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />

              <label htmlFor="notes">Meeting notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did the customer say? Budget, goals, objections, competitors, commitments..."
                rows={7}
                required
              />

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <LoaderCircle className="spin" size={18} /> : <MessageSquareText size={18} />}
                Save meeting to memory
              </button>
            </form>
          </div>

          <div className="panel briefing-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">HINDSIGHT MEMORY</span><h3>Next-meeting briefing</h3></div>
              <Brain size={22} />
            </div>
            <p className="panel-description">
              Retrieve relevant customer context and prepare a personalized briefing before your next sales conversation.
            </p>

            <div className="briefing-prompt">
              <Sparkles size={18} />
              <span>Prepare me for my next meeting with <strong>{company || "your customer"}</strong>.</span>
            </div>

            <button className="primary-button briefing-button" onClick={generateBriefing} disabled={loading || !company.trim()}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Brain size={18} />}
              Generate AI briefing
            </button>

            {briefing && (
              <div className="briefing-result">
                <h4><Sparkles size={16} /> Your meeting brief</h4>
                <pre>{briefing}</pre>
              </div>
            )}

            {!briefing && (
              <div className="empty-state">
                <div className="empty-icon"><Brain size={26} /></div>
                <strong>Your customer context, connected.</strong>
                <p>Generate a briefing to surface remembered needs, objections, and recommended next steps.</p>
              </div>
            )}
          </div>
        </section>
                <section className="deal-tracking-section">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">SALES PIPELINE</span>
                <h3>Deal Tracking</h3>
              </div>
              <Target size={22} />
            </div>

            <p className="panel-description">
              Track deal value, customer objections, sales stage, and your next action.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveDeal();
              }}
            >
              <label htmlFor="deal-company">Company name</label>
              <input
                id="deal-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />

              <label htmlFor="deal-value">Deal value</label>
              <input
                id="deal-value"
                type="number"
                min="0"
                step="0.01"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="e.g. 50000"
                required
              />

              <label htmlFor="deal-stage">Deal stage</label>
              <select
                id="deal-stage"
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
              >
                <option value="Initial Contact">Initial Contact</option>
                <option value="Discovery">Discovery</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closing">Closing</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>

              <label htmlFor="deal-objections">Customer objections</label>
              <textarea
                id="deal-objections"
                value={objections}
                onChange={(e) => setObjections(e.target.value)}
                placeholder="e.g. Customer thinks the pricing is too high"
                rows={3}
                required
              />

              <label htmlFor="deal-next-action">Next action</label>
              <textarea
                id="deal-next-action"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Share a revised pricing proposal"
                rows={2}
                required
              />

              <label htmlFor="deal-follow-up">Follow-up date</label>
              <input
                id="deal-follow-up"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={savingDeal}
              >
                {savingDeal ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Target size={18} />
                )}
                Save Deal
              </button>
            </form>

            {dealMessage && (
              <div
                className={
                  dealMessage.startsWith("Error:")
                    ? "status-message error"
                    : "status-message"
                }
                role="status"
              >
                {dealMessage}
              </div>
            )}
          </div>
        <section className="agent-section">
  <div className="panel agent-panel">
    <div className="panel-heading">
      <div>
        <span className="panel-kicker">YOUR AI SALES ASSISTANT</span>
        <h3>DealMind Agent</h3>
      </div>
      <Brain size={24} />
    </div>

    <p className="panel-description">
      Ask questions about customer history, deal risks, meetings,
      and your next steps.
    </p>

    <div className="agent-suggestions">
      <button
        type="button"
        disabled={agentLoading || !company.trim()}
        onClick={() =>
          askDealMindAgent("Prepare me for my next meeting with this customer.")
        }
      >
        Prepare for my next meeting
      </button>

      <button
        type="button"
        disabled={agentLoading || !company.trim()}
        onClick={() => askDealMindAgent("Why is this deal at risk?")}
      >
        Why is this deal at risk?
      </button>

      <button
        type="button"
        disabled={agentLoading || !company.trim()}
        onClick={() =>
          askDealMindAgent("What should I do next to close this deal?")
        }
      >
        What should I do next?
      </button>

      <button
        type="button"
        disabled={agentLoading || !company.trim()}
        onClick={() =>
          askDealMindAgent("Summarize everything we know about this customer.")
        }
      >
        Summarize customer history
      </button>
    </div>

    <form
      className="agent-chat-form"
      onSubmit={(event) => {
        event.preventDefault();
        askDealMindAgent();
      }}
    >
      <textarea
        value={agentQuestion}
        onChange={(event) => setAgentQuestion(event.target.value)}
        placeholder="Ask DealMind anything about this customer..."
        rows={3}
        disabled={agentLoading}
      />

      <button
        type="submit"
        className="primary-button"
        disabled={
          agentLoading || !company.trim() || !agentQuestion.trim()
        }
      >
        {agentLoading ? "Thinking..." : "Ask DealMind"}
      </button>
    </form>

    {agentAnswer && (
      <div className="briefing-result agent-answer">
        <h4>
          <Sparkles size={17} />
          DealMind's Answer
        </h4>
        <pre>{agentAnswer}</pre>
      </div>
    )}
  </div>
</section>  
        </section>
<section className="deal-health-section">
  <div className="panel">
    <div className="panel-heading">
      <div>
        <span className="panel-kicker">AI DEAL ANALYSIS</span>
        <h3>Deal Health Indicator</h3>
      </div>
      <TrendingUp size={22} />
    </div>

    <p className="panel-description">
      Analyze saved customer interactions and identify potential deal risks.
    </p>

    <button
      className="primary-button"
      onClick={generateDealHealth}
      disabled={healthLoading || !company.trim()}
    >
      {healthLoading ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <TrendingUp size={18} />
      )}
      {healthLoading ? "Analyzing Deal..." : "Analyze Deal Health"}
    </button>

    {healthError && (
      <div className="status-message error" role="alert">
        Error: {healthError}
      </div>
    )}

    {dealHealth && (
      <div className="briefing-result">
        <h4>
          <Sparkles size={16} /> Deal Health Assessment
        </h4>
        <pre>{dealHealth}</pre>
      </div>
    )}
  </div>
</section>
        {status && (
          <div className={status.startsWith("Error:") ? "status-message error" : "status-message"}>
            {status}
          </div>
        )}
      {/* OBJECTION TRACKING */}
<section className="deal-health-section">
  <div className="panel">
    <div className="panel-heading">
      <div>
        <span className="panel-kicker">CUSTOMER RISK ANALYSIS</span>
        <h3>Objection Tracking</h3>
      </div>
      <Target size={22} />
    </div>

    <p className="panel-description">
      Identify customer objections, understand deal risks, and get
      practical responses based on remembered sales history.
    </p>

    <div className="briefing-prompt">
      <Brain size={18} />
      <span>
        Analyze objections for <strong>{company || "your customer"}</strong>
      </span>
    </div>

    <button
      className="primary-button"
      onClick={analyzeObjections}
      disabled={objectionLoading || !company.trim()}
    >
      {objectionLoading ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <Target size={18} />
      )}
      {objectionLoading ? "Analyzing Objections..." : "Analyze Objections"}
    </button>

    {objectionError && (
      <div className="status-message error" role="alert">
        Error: {objectionError}
      </div>
    )}

    {objectionAnalysis && (
      <div className="briefing-result">
        <h4>
          <Sparkles size={16} /> Objection Analysis
        </h4>
        <pre>{objectionAnalysis}</pre>
      </div>
    )}
  </div>
</section>

{/* NEXT BEST ACTIONS */}
<section className="deal-health-section">
  <div className="panel">
    <div className="panel-heading">
      <div>
        <span className="panel-kicker">AI SALES RECOMMENDATIONS</span>
        <h3>Next Best Actions</h3>
      </div>
      <TrendingUp size={22} />
    </div>

    <p className="panel-description">
      Get personalized recommendations to move the deal forward,
      plan follow-ups, and prepare customer messages.
    </p>

    <div className="briefing-prompt">
      <Sparkles size={18} />
      <span>
        Find the best next step for <strong>{company || "your customer"}</strong>
      </span>
    </div>

    <button
      className="primary-button"
      onClick={generateNextBestActions}
      disabled={actionsLoading || !company.trim()}
    >
      {actionsLoading ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <TrendingUp size={18} />
      )}
      {actionsLoading ? "Generating Actions..." : "Get Next Best Actions"}
    </button>

    {actionsError && (
      <div className="status-message error" role="alert">
        Error: {actionsError}
      </div>
    )}

    {nextBestActions && (
      <div className="briefing-result">
        <h4>
          <Sparkles size={16} /> Recommended Sales Actions
        </h4>
        <pre>{nextBestActions}</pre>
      </div>
    )}
  </div>
</section>
        <footer>DealMind AI · Persistent sales intelligence powered by Hindsight</footer>
      </main>
    </div>
  );
}