import random
import re
from datetime import datetime


def process_spintax(text: str) -> str:
    """
    {secenek1|secenek2|secenek3} yapisini rastgele secer.
    Ic ice spintax desteklenir.
    Ornek: {Merhaba|Selam|Hey} {arkadasim|dostum} → "Selam dostum"
    """
    if not text:
        return text

    pattern = re.compile(r'\{([^{}]+)\}')

    while pattern.search(text):
        def replace_match(m):
            options = m.group(1).split('|')
            return random.choice(options).strip()
        text = pattern.sub(replace_match, text)

    return text


def process_variables(text: str, group_title: str = "", group_username: str = "") -> str:
    """
    {grup_adi}, {tarih}, {saat} gibi degiskenleri doldur.
    """
    if not text:
        return text

    now = datetime.now()
    replacements = {
        '{grup_adi}': group_title,
        '{grup_username}': f"@{group_username}" if group_username else group_title,
        '{tarih}': now.strftime('%d.%m.%Y'),
        '{saat}': now.strftime('%H:%M'),
        '{gun}': now.strftime('%A'),
    }

    for key, value in replacements.items():
        text = text.replace(key, value)

    return text


def prepare_message(text: str, group_title: str = "", group_username: str = "") -> str:
    """Spintax isle, sonra degiskenleri doldur"""
    if not text:
        return text
    text = process_spintax(text)
    text = process_variables(text, group_title, group_username)
    return text
