from fastapi import APIRouter, HTTPException  

router = APIRouter()

@router.post("/auth/signup")
async def signup():
    # TODO: integrate Clerk or user creation
    return {"message": "signup not implemented"}

@router.post("/auth/login")
async def login():
    # TODO: integrate Clerk or JWT auth
    return {"message": "login not implemented"}
