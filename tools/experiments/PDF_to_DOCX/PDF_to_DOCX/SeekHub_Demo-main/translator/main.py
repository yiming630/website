# translator/main.py
import os
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from google import genai
from google.genai import types
from fastapi.middleware.cors import CORSMiddleware
import re


# ---------- CONFIG ----------
MODEL         = "gemini-2.0-flash-001"       # low-cost model
FALLBACK_MODEL = "gemini-1.5-flash"          # fallback if 2.0 not available
MAX_CHARS     = 120_000                      # ~85 k English tokens
MAX_TOKENS    = 3900                         # a bit under Flash limit

SYSTEM = (
    "You are a professional translator.\n"
    "Translate the following English text into accurate, fluent Simplified Chinese.\n"
    "Return **ONLY** the Chinese translation—no other output."
)

# ---------- CLIENT ----------
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
aio    = client.aio                            # async interface

# ---------- API ----------
app = FastAPI()

# CORS for every localhost port and any *.vercel.app (prod & preview)
origins_regex = re.compile(
    r"^https?://localhost(:\d+)?$|^https://[-a-z0-9]+\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex.pattern,
    allow_methods=["*"],           # includes OPTIONS
    allow_headers=["*"],
)

class Req(BaseModel):
    text: str


# ---- NEW:  pre-flight responder ----
@app.options("/translate")
async def options_translate() -> Response:
    return Response(status_code=204)

@app.post("/translate")
async def translate(req: Req):
    # ---- quick size guard ----
    if len(req.text) > MAX_CHARS:
        raise HTTPException(413, "Text too large (character cap hit)")
    
    # Try to count tokens with primary model first
    try:
        token_est = client.models.count_tokens(
            model=MODEL, contents=[req.text]
        ).total_tokens
    except Exception as e:
        # If primary model fails, try fallback
        try:
            token_est = client.models.count_tokens(
                model=FALLBACK_MODEL, contents=[req.text]
            ).total_tokens
        except Exception:
            raise HTTPException(500, f"Unable to count tokens: {str(e)}")
    
    if token_est > MAX_TOKENS:
        raise HTTPException(
            413,
            f"Text too large for single request "
            f"({token_est} tokens > {MAX_TOKENS})"
        )

    # ---- prepare messages ----
    prompt = (
    "You are a professional translator. "
    "Translate the English text that follows into accurate, fluent Simplified Chinese. "
    "Return ONLY the Chinese translation—no commentary.\n\n"
    + req.text
)
    msgs = [types.Content(role="user", parts=[types.Part(text=prompt)])]

    # ---- single-call translation with fallback ----
    try:
        rsp = await aio.models.generate_content(
            model=MODEL,
            contents=msgs,
        )
    except Exception as e:
        # If primary model fails, try fallback
        try:
            rsp = await aio.models.generate_content(
                model=FALLBACK_MODEL,
                contents=msgs,
            )
        except Exception as fallback_error:
            raise HTTPException(
                500, 
                f"Translation failed. Please ensure the Generative Language API is enabled. "
                f"Error: {str(fallback_error)}"
            )
    
    return {"translation": rsp.text.strip()}