"""Backend tests for Style DNA /api/ai/edit keyless transform."""
import os
import requests
import pytest

BASE_URL = "https://854cc350-b1b0-4196-bfe0-f4470a09b62f.preview.emergentagent.com"
BANNED = {"Inter", "Roboto", "Arial", "Open Sans", "Space Grotesk"}


def sample_blocks():
    return [
        {"id": "1", "type": "Hero", "title": "Feel good", "subtitle": "salon",
         "styles": {"paddingTop": 100, "paddingBottom": 100, "backgroundColor": "#ffffff",
                    "fontFamily": "Inter", "titleWeight": "bold", "cardShadow": "sm"}},
        {"id": "2", "type": "Features", "title": "What we do", "subtitle": "",
         "styles": {"paddingTop": 80, "paddingBottom": 80, "backgroundColor": "#ffffff",
                    "fontFamily": "Inter", "titleWeight": "bold", "cardShadow": "sm"}},
        {"id": "3", "type": "CTA", "title": "Book now", "subtitle": "",
         "styles": {"paddingTop": 100, "paddingBottom": 100, "backgroundColor": "#ffffff",
                    "fontFamily": "Inter", "titleWeight": "bold", "cardShadow": "sm"}},
    ]


CASES = [
    ("make it bold and playful", "bold-poster", "Syne"),
    ("give it a warm earthy organic feel", "warm-editorial", "Lora"),
    ("make it look technical like a dev tool", "mono-technical", "Space Mono"),
    ("make it dark cinematic gold luxury", "noir-luxe", "Playfair Display"),
    ("make it soft friendly and airy", "soft-airy", "Outfit"),
    ("just make it better", "quiet-luxury", "Cormorant Garamond"),
]


@pytest.mark.parametrize("prompt,expected_id,expected_font", CASES)
def test_dna_classification(prompt, expected_id, expected_font):
    blocks = sample_blocks()
    r = requests.post(f"{BASE_URL}/api/ai/edit", json={"prompt": prompt, "blocks": blocks}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    # response shape
    assert "blocks" in data and "dna" in data and "message" in data
    dna = data["dna"]
    assert set(["id", "name", "fonts", "palette"]).issubset(dna.keys())
    assert dna["id"] == expected_id, f"Prompt '{prompt}' -> {dna['id']} (expected {expected_id})"
    assert dna["fonts"]["display"] == expected_font
    # anti-slop
    assert dna["fonts"]["display"] not in BANNED
    # blocks length preserved
    assert len(data["blocks"]) == len(blocks)
    # each block's styles.fontFamily equals dna.fonts.display
    for b in data["blocks"]:
        assert b["styles"]["fontFamily"] == dna["fonts"]["display"]


def test_missing_prompt_returns_400():
    r = requests.post(f"{BASE_URL}/api/ai/edit", json={"blocks": sample_blocks()}, timeout=10)
    assert r.status_code == 400


def test_missing_blocks_returns_400():
    r = requests.post(f"{BASE_URL}/api/ai/edit", json={"prompt": "make it bold"}, timeout=10)
    assert r.status_code == 400
