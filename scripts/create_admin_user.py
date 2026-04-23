#!/usr/bin/env python3
"""
Admin kullanıcısı oluşturma scripti.
Kullanım: python scripts/create_admin_user.py
"""

import asyncio
import sys
import os

# Backend path'ini Python path'ine ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from app.config import get_settings

async def create_admin_user():
    """Admin kullanıcısını oluşturur veya günceller"""
    settings = get_settings()
    
    # Database URL
    database_url = settings.database_url
    
    # Engine oluştur
    engine = create_async_engine(database_url, echo=False)
    
    try:
        async with engine.begin() as conn:
            admin_username = settings.admin_username or 'admin'
            password_hash = '$2b$12$4tDhWulynaeTyhwI20o1TuPpZ3ScY2KctD.qPgT2p/Uyi4M25mAOS'
            admin_email = f'{admin_username}@localhost'
            
            # Önce mevcut kullanıcıları kontrol et
            result = await conn.execute(text("SELECT username, email, is_admin, approval_status FROM users"))
            users = result.fetchall()
            
            print("Mevcut kullanıcılar:")
            for user in users:
                print(f"  - {user[0]} ({user[1]}) - Admin: {user[2]}, Durum: {user[3]}")
            
            # Admin kullanıcısını oluştur veya güncelle
            await conn.execute(text(f"""
                INSERT INTO users (username, email, password_hash, is_admin, approval_status, plan_type, tokens)
                VALUES ('{admin_username}', '{admin_email}', '{password_hash}', true, 'approved', 'free', 1000)
                ON CONFLICT (username) DO UPDATE SET
                    email = '{admin_email}',
                    password_hash = '{password_hash}',
                    is_admin = true,
                    approval_status = 'approved',
                    plan_type = 'free',
                    tokens = 1000
            """))
            
            print(f"\n✅ Admin kullanıcısı oluşturuldu/güncellendi!")
            print(f"Kullanıcı Adı: {admin_username}")
            print(f"Şifre: bana1kolaal")
            print(f"E-posta: {admin_email}")
            
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
