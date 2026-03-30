from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import LoginRequest
import ic_api
from playwright_scraper import fetch_grades_via_playwright

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/login")
async def login(creds: LoginRequest):
    """
    Test the IC login to make sure credentials are valid.
    """
    ic_client = await ic_api.authenticate_ic(creds)
    if ic_client:
        return {"status": "success", "message": "Successfully authenticated."}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials or IC portal.")

@app.post("/api/grades")
async def get_all_grades():
    """
    Launch a visible browser to allow the user to authenticate via ClassLink SSO,
    then intercepts the native Infinite Campus data payload perfectly.
    """
    try:
        results = await fetch_grades_via_playwright()
        if results.get("status") != "success":
            raise HTTPException(status_code=401, detail=results.get("message", "Browser closed before data captured."))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
