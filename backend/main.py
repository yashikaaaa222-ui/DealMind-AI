
import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from hindsight_client import Hindsight

# Load environment variables
load_dotenv()

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
BANK_ID = "dealmind-acme"
# Customer database
DB_PATH = Path(__file__).with_name("dealmind.db")


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL UNIQUE,
                contact_person TEXT DEFAULT '',
                email TEXT DEFAULT '',
                industry TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


init_db()

# Initialize FastAPI
app = FastAPI(title="DealMind AI")

# Enable frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Hindsight client
client = None

if HINDSIGHT_API_KEY:
    client = Hindsight(
        base_url="https://api.hindsight.vectorize.io",
        api_key=HINDSIGHT_API_KEY,
    )


# ==========================================
# REQUEST MODELS
# ==========================================

class MeetingNote(BaseModel):
    company: str
    notes: str


class BriefingRequest(BaseModel):
    company: str
class AgentChatRequest(BaseModel):
    company: str
    question: str    

    

class DealTracking(BaseModel):
    company: str
    deal_value: float
    deal_stage: str
    objections: str
    next_action: str
    follow_up_date: str


# ==========================================
# HELPER FUNCTION
# ==========================================

def check_hindsight():
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Hindsight API key is missing. Check your backend .env file.",
        )


# ==========================================
# HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "DealMind AI backend is running!",
        "status": "ok",
    }


# ==========================================
# SAVE MEETING NOTES
# ==========================================

@app.post("/meeting")
def save_meeting(meeting: MeetingNote):
    check_hindsight()

    try:
        meeting_content = (
            f"Company: {meeting.company}\n"
            f"Sales meeting notes: {meeting.notes}"
        )

        client.retain(
            bank_id=BANK_ID,
            content=meeting_content,
            context=f"Sales meeting with {meeting.company}",
        )

        return {
            "success": True,
            "message": f"Meeting notes saved for {meeting.company}.",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================
# GENERATE AI SALES BRIEFING
# ==========================================

@app.post("/briefing")
def generate_briefing(request: BriefingRequest):
    check_hindsight()

    try:
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

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================
# SAVE AND TRACK DEAL
# ==========================================

@app.post("/deal")
def track_deal(deal: DealTracking):
    check_hindsight()

    try:
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

        return {
            "success": True,
            "message": f"Deal details saved for {deal.company}.",
            "deal": {
                "company": deal.company,
                "deal_value": deal.deal_value,
                "deal_stage": deal.deal_stage,
                "objections": deal.objections,
                "next_action": deal.next_action,
                "follow_up_date": deal.follow_up_date,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/deal-health")
def deal_health(request: BriefingRequest):
    check_hindsight()

    try:
        result = client.reflect(
            bank_id=BANK_ID,
            query=(
                f"Evaluate the sales deal health for {request.company}. "
                "Use remembered meeting notes and deal tracking details. "
                "Return these sections: Health (Healthy, At Risk, or Critical), "
                "Reason, Main Risk, Recommended Action, and Follow-up date. "
                "Use remembered evidence only and do not invent facts. "
                "If information is insufficient, say so."
            ),
        )

        return {
            "company": request.company,
            "deal_health": result.text,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/agent-chat")
def agent_chat(request: AgentChatRequest):
    check_hindsight()

    try:
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

        return {
            "success": True,
            "company": request.company,
            "answer": result.text,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # ==========================================
# CUSTOMER MANAGEMENT
# ==========================================

class CustomerCreate(BaseModel):
    company: str
    contact_person: str = ""
    email: str = ""
    industry: str = ""


@app.post("/customers")
def add_customer(customer: CustomerCreate):
    company = customer.company.strip()

    if not company:
        raise HTTPException(status_code=400, detail="Company name is required.")

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO customers (company, contact_person, email, industry)
                VALUES (?, ?, ?, ?)
                """,
                (
                    company,
                    customer.contact_person,
                    customer.email,
                    customer.industry,
                ),
            )

        return {"success": True, "message": f"{company} added successfully."}

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="This customer already exists.")


@app.get("/customers")
def get_customers():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM customers ORDER BY created_at DESC"
        ).fetchall()

    return {"customers": [dict(row) for row in rows]}


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            "DELETE FROM customers WHERE id = ?",
            (customer_id,),
        )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Customer not found.")

    return {"success": True, "message": "Customer deleted successfully."}
# ==========================================
# AI OBJECTION TRACKING
# ==========================================

@app.post("/objection-analysis")
def objection_analysis(request: BriefingRequest):
    check_hindsight()

    try:
        result = client.reflect(
            bank_id=BANK_ID,
            query=(
                f"Analyze sales objections and deal risks for company {request.company}. "
                "Use remembered meeting notes, customer concerns, deal tracking, "
                "competitor mentions, budget constraints, and follow-up history. "
                "Return these sections:\n"
                "1. Known Customer Objections\n"
                "2. Main Deal Risks\n"
                "3. Why Each Objection Matters\n"
                "4. Recommended Response for the Salesperson\n"
                "5. Best Next Step\n"
                "6. Missing Information\n"
                "Use only evidence from the remembered information. "
                "Do not invent objections or customer statements. "
                "If no objections are remembered, clearly say that."
            ),
        )

        return {
            "success": True,
            "company": request.company,
            "objection_analysis": result.text,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # ==========================================
# NEXT BEST ACTIONS
# ==========================================

@app.post("/next-best-actions")
def next_best_actions(request: BriefingRequest):
    check_hindsight()

    try:
        result = client.reflect(
            bank_id=BANK_ID,
            query=(
                f"You are an expert AI sales strategist. Analyze the remembered "
                f"sales history and current deal for {request.company}. "
                "Recommend the next best actions to move this deal forward. "
                "Return these sections:\n"
                "1. Current Deal Situation\n"
                "2. Highest-Priority Next Action\n"
                "3. Two Additional Recommended Actions\n"
                "4. Suggested Follow-up Message\n"
                "5. Recommended Follow-up Timing\n"
                "6. Expected Outcome\n"
                "7. Missing Information\n"
                "Use remembered evidence only. Do not invent customer needs, "
                "commitments, dates, or deal details. If information is missing, "
                "clearly state what is unknown. Label suggested message text "
                "as a draft for the salesperson to review."
            ),
        )

        return {
            "success": True,
            "company": request.company,
            "next_best_actions": result.text,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))