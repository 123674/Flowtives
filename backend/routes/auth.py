from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import os
from supabase import create_client, Client

router = APIRouter()

def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    return create_client(url, key)


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def sign_up(credentials: AuthCredentials):
    supabase = get_supabase()
    try:
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password,
        })
        if response.user is None:
            raise HTTPException(status_code=400, detail="Sign up failed")
        return {
            "message": "Account created! Check your email to confirm.",
            "user_id": response.user.id,
            "email": response.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signin")
async def sign_in(credentials: AuthCredentials):
    supabase = get_supabase()
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })

        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Block unconfirmed users
        if response.user.email_confirmed_at is None:
            raise HTTPException(
                status_code=403,
                detail="Please verify your email before signing in."
            )

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
            "email": response.user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
        
@router.post("/signout")
async def sign_out(access_token: str):
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))