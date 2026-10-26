

# What Changed When My Sales Agent Started Using Hindsight

A sales conversation rarely ends when a meeting ends. A customer may
mention a budget constraint, raise a concern about implementation,
compare a product with a competitor, or agree to a follow-up date. The
challenge is not simply recording those details. It is making the
relevant details available when the salesperson needs to make the next
decision.

That is the problem I wanted DealMind AI to address.

DealMind AI is a sales-intelligence application built around a simple
idea: customer context should remain useful beyond the conversation in
which it was collected. Instead of treating every interaction as an
isolated prompt, the application uses Hindsight as a memory layer.
Meeting notes and deal details can be retained, and later requests can
ask the system to reason over the information remembered for a customer.

This article walks through the implementation in the repository, the
role Hindsight plays, and what the current design does---and does
not---solve.

Repository: [DealMind
AI](https://github.com/yashikaaaa222-ui/DealMind-AI)

## The problem: useful context gets scattered

Sales teams work with information that changes over time. One meeting
may establish a customer's goals. A later conversation may introduce an
objection. A deal update may change the expected value, stage, next
action, or follow-up date.

If an assistant only receives the latest message, it has a narrow view
of the account. The salesperson then has to reconstruct the history
manually or repeatedly paste old notes into the conversation.

I wanted DealMind to support a more continuous workflow:

1.  Save a meeting interaction against a company.
2.  Record structured deal information, including stage, value,
    objections, next action, and follow-up date.
3.  Ask for a briefing before the next meeting.
4.  Ask questions about remembered customer history and request
    practical next steps.

## The architecture

The current application has a React frontend and a Python FastAPI
backend. The frontend sends JSON requests to the backend, and the
backend coordinates the local customer directory and the Hindsight
client.

At startup, the backend loads environment variables and reads
`HINDSIGHT_API_KEY`. It configures the Hindsight client with the
Hindsight API base URL:

``` python
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
BANK_ID = "dealmind-acme"

client = None

if HINDSIGHT_API_KEY:
    client = Hindsight(
        base_url="https://api.hindsight.vectorize.io",
        api_key=HINDSIGHT_API_KEY,
    )
```

The `BANK_ID` is the memory namespace used by this application. The
client is initialized only when an API key is available. Before
memory-dependent routes run, a helper checks that the client exists and
returns a clear backend error if the key is missing.

The backend also initializes a small SQLite database for customer
records. That database stores fields such as company, contact person,
email, and industry. It is important to distinguish this from the
Hindsight integration: SQLite is used for customer-directory operations,
while meeting and deal context is sent to Hindsight using the client.

## Retaining a meeting instead of losing its context

The first important memory operation is saving a meeting. The `/meeting`
endpoint accepts a company name and meeting notes. It combines them into
a readable text record and passes that record to Hindsight's `retain()`
method.

``` python
meeting_content = (
    f"Company: {meeting.company}\n"
    f"Sales meeting notes: {meeting.notes}"
)

client.retain(
    bank_id=BANK_ID,
    content=meeting_content,
    context=f"Sales meeting with {meeting.company}",
)
```

This is the point where the application moves beyond a form that merely
displays text. The submitted notes are sent to a persistent memory
service, so later features can ask Hindsight to use relevant remembered
information.

## Deal tracking is another memory input

Meeting notes are often free-form. Deal tracking, on the other hand,
benefits from a more structured set of fields.

DealMind defines a `DealTracking` request model with:

-   Company
-   Deal value
-   Deal stage
-   Customer objections
-   Next action
-   Follow-up date

The `/deal` endpoint formats these fields into a text record and retains
it with a deal-specific context label.

``` python
deal_notes = (
    f"Company: {deal.company}\n"
    f"Deal value: {deal.deal_value}\n"
    f"Deal stage: {deal.deal_stage}\n"
    f"Customer objections: {deal.objections}\n"
    f"Next action: {deal.next_action}\n"
    f"Follow-up date: {deal.follow_up_date}"
)

client.retain(
    bank_id=BANK_ID,
    content=deal_notes,
    context=f"Deal tracking for {deal.company}",
)
```

## From stored information to a meeting briefing

Retaining information is only half of the problem. The application also
needs to retrieve useful context when the salesperson is preparing for a
conversation.

That is where `reflect()` enters the implementation. The `/briefing`
endpoint accepts a company name and asks Hindsight to prepare a sales
meeting briefing using relevant remembered meeting notes and deal
information.

``` python
result = client.reflect(
    bank_id=BANK_ID,
    query=(
        f"Prepare a sales meeting briefing for {request.company}. "
        "Use relevant remembered meeting notes and deal information. "
        "Summarize customer needs, budget, deal value, deal stage, "
        "objections, competitors, commitments, unresolved questions, "
        "follow-up date, and recommended next steps. "
        "Clearly identify information that is unknown. "
        "Do not invent facts."
    ),
)

return {
    "company": request.company,
    "briefing": result.text,
}
```

## The agent can answer more than one fixed question

A fixed briefing is useful, but salespeople may have questions that do
not fit a predefined report. DealMind includes an `/agent-chat` endpoint
for this.

The request contains a company and a question. The backend builds a
prompt that tells the assistant to use remembered customer history,
meeting notes, deal details, objections, follow-up dates, and previous
interactions. It also instructs the assistant to explain risks using
remembered evidence, recommend actionable next steps, and state when
information is missing.

``` python
result = client.reflect(
    bank_id=BANK_ID,
    query=(
        f"You are DealMind Agent, an AI sales intelligence assistant. "
        f"The selected customer is {request.company}. "
        f"The salesperson asks: {request.question}\n\n"
        "Use relevant remembered customer history, meeting notes, "
        "deal details, objections, follow-up dates, and previous "
        "interactions available in memory. "
        "Give a direct, practical answer tailored to this customer. "
        "Explain risks using remembered evidence and recommend "
        "actionable next steps. Summarize relevant customer history "
        "when requested. Never invent facts, commitments, or dates. "
        "Clearly state when information is missing."
    ),
)
```

The endpoint returns the generated text as `answer`. On the React side,
the user can type a question or choose from suggested prompts such as
preparing for the next meeting, understanding why a deal may be at risk,
or summarizing customer history.

## Turning memory into sales-oriented analysis

Three additional endpoints reuse this pattern: `/deal-health` requests a
Healthy/At Risk/Critical assessment with reasons and a recommended
action; `/objection-analysis` examines remembered objections and risks;
and `/next-best-actions` asks for prioritized actions and a suggested
follow-up draft. Their prompts all instruct the model not to invent
missing facts.

## What changed---and what remains limited

The main change is that DealMind can retain meeting and deal
information, then use reflection requests to produce briefings, answer
questions, analyze risks, and recommend next steps using remembered
context.

The current implementation also has limits.

First, the memory bank is configured as a single constant,
`dealmind-acme`, rather than being dynamically selected per tenant or
customer. The prompts include the company name, but the code shown here
does not create a separate bank for every company.

Second, meeting and deal records are retained as formatted text. The
application does not currently show a separate structured memory schema
or a user-facing memory inspection and correction workflow in the
backend code discussed here.

Third, the frontend uses a local API base URL (`http://127.0.0.1:8000`).
That is suitable for local development, but a deployed frontend would
need an environment-specific backend URL and appropriate production CORS
settings. The backend currently allows all origins.

Finally, the repository code demonstrates the integration calls and
request flow; it does not, by itself, establish measured improvements in
sales conversion, response accuracy, or time saved. Those outcomes would
need a controlled evaluation with representative customer histories and
human review.

## What I would improve next

My next engineering priorities would be to isolate memory by workspace
or customer where appropriate, add a way for users to inspect and
correct retained information, and introduce automated tests around the
API routes and missing-key/error cases. I would also move the frontend
API URL and CORS allowlist into deployment configuration.

## Final thought

Building DealMind AI made one distinction especially clear to me: an AI
sales assistant needs more than the ability to generate a fluent answer.
It needs access to the right customer context at the right time, and it
needs to be explicit when that context is incomplete.

Hindsight provides the retain-and-reflect memory layer in this
implementation. DealMind connects that layer to concrete sales
workflows: saving meetings, tracking deals, preparing briefings,
discussing customer history, analyzing objections, and suggesting next
actions.

The current version is a working foundation, not proof of business
impact. But it gives me a clear direction for building assistants that
carry useful context from one interaction to the next---without
pretending to know facts they have never been given.

**Project:** [DealMind AI on
GitHub](https://github.com/yashikaaaa222-ui/DealMind-AI)\
**Hindsight:** [Hindsight
documentation](https://docs.hindsight.vectorize.io/) · [Hindsight on
GitHub](https://github.com/vectorize-io/hindsight)

