"""RedGIFs -> FreeOF uploader (para rodar no Colab)

Passos rápidos:

1) Em uma célula antes, rode:
   !pip install -U redgifs requests

2) Edite, se quiser, as constantes API_BASE e API_SECRET abaixo.

3) Rode esta célula e, quando pedir, cole TODOS os links RedGIFs de usuários
   em UMA ÚNICA LINHA, assim:

   https://www.redgifs.com/users/amygabehttps://www.redgifs.com/users/kana_kawaii...

O script vai:
  - Extrair usernames dessa linha gigante
  - Garantir que exista um model para cada (POST /api/models)
  - Enviar os vídeos para /api/videos, vinculando ao model certo
"""

import re
import requests
import redgifs

API_BASE   = "https://freeof.pages.dev/api"
API_SECRET = "freeof_super_secret_7b3e9d"
MAX_VIDEOS_PER_USER = 120

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Colab RedGIFs Uploader)",
    "Referer": "https://www.redgifs.com/",
}

def extract_usernames(mixed_line: str):
    pattern = r"https://www\.redgifs\.com/users/([A-Za-z0-9_\-\.]+)"
    return list(dict.fromkeys(re.findall(pattern, mixed_line)))

def api_get_models():
    r = requests.get(f"{API_BASE}/models?limit=200&page=1", headers=HEADERS, timeout=30)
    r.raise_for_status()
    js = r.json()
    if isinstance(js, list):
        return js
    return js.get("items", [])

def api_upsert_model(slug: str, display_name: str, avatar_url: str = "", bio: str = ""):
    payload = {
        "slug": slug,
        "display_name": display_name,
        "avatar_url": avatar_url,
        "bio": bio,
    }
    r = requests.post(
        f"{API_BASE}/models",
        headers={**HEADERS, "Content-Type": "application/json", "x-api-key": API_SECRET},
        json=payload,
        timeout=60,
    )
    r.raise_for_status()
    js = r.json()
    if isinstance(js, dict) and "item" in js:
        return js["item"]
    return js

def api_post_video(model, gif):
    urls = getattr(gif, "urls", None)
    poster = getattr(urls, "poster", None) if urls else None
    thumb  = getattr(urls, "thumbnail", None) if urls else None
    src    = None
    if urls:
        src = getattr(urls, "hd", None) or getattr(urls, "sd", None)
    if not src:
        return False

    gid = getattr(gif, "id", "")
    title = (getattr(gif, "title", "") or gid).strip()
    duration = getattr(gif, "duration", None) or 0

    slug = f"{model['slug']}_{gid}"

    payload = {
        "slug": slug,
        "title": title or slug,
        "thumbnail_url": poster or thumb or model.get("avatar_url") or "",
        "video_url": src,
        "channel_name": model.get("display_name"),
        "views": 0,
        "duration_seconds": int(duration) if duration else None,
        "description": "",
        "model_id": model.get("id"),
    }

    r = requests.post(
        f"{API_BASE}/videos",
        headers={**HEADERS, "Content-Type": "application/json", "x-api-key": API_SECRET},
        json=payload,
        timeout=60,
    )
    if r.status_code >= 400:
        print("   ⚠️ Erro ao inserir vídeo:", r.status_code, r.text[:200])
        return False
    return True

def collect_user_data(api, uname: str, max_items=MAX_VIDEOS_PER_USER):
    cr = api.search_user(uname, page=1, count=min(80, max_items))
    creator = getattr(cr, "creator", None)
    gifs = list(getattr(cr, "gifs", []) or [])
    gifs = gifs[:max_items]

    if creator is not None:
        image_url = (
            getattr(creator, "profile_image_url", None)
            or getattr(creator, "thumbnail", None)
            or getattr(creator, "poster", None)
            or ""
        )
    else:
        image_url = ""

    return creator, gifs, image_url

def main():
    api = redgifs.API().login()
    print("✅ Logged in to RedGIFs.")

    try:
        print("Cole TODOS os links de usuário RedGIFs NESSA MESMA LINHA (pode colar tudo colado):")
        mixed_line = input().strip()
    except EOFError:
        mixed_line = ""

    usernames = extract_usernames(mixed_line)
    print("\n🔍 Usernames detectados:", usernames)

    if not usernames:
        print("❌ Nenhum username detectado. Saindo.")
        api.close()
        return

    print("\n📥 Buscando models existentes na API...")
    try:
        existing = api_get_models()
        by_slug = {m.get("slug"): m for m in existing if isinstance(m, dict) and m.get("slug")}
        print(f"  → {len(by_slug)} models já na D1\n")
    except Exception as e:
        print("  ⚠️ Não foi possível carregar models existentes:", e)
        by_slug = {}

    for uname in usernames:
        print("\n==============================")
        print(f"👩 Processando @{uname} …")
        print("==============================")
        try:
            creator, gifs, image_url = collect_user_data(api, uname)
        except Exception as e:
            print(f"  ⚠️ Falha ao buscar dados de {uname}: {e}")
            continue

        if not gifs:
            print("  ⚠️ Nenhum GIF/vídeo encontrado para este usuário.")
            continue

        model = by_slug.get(uname)
        if model:
            print(f"  ↪️ Model @{uname} já existe (id={model.get('id')}). Atualizando avatar se necessário…")
            try:
                model = api_upsert_model(uname, uname, image_url or model.get('avatar_url') or "")
                by_slug[uname] = model
            except Exception as e:
                print("  ⚠️ Falha ao atualizar model:", e)
        else:
            print(f"  ➕ Criando model @{uname} na API…")
            try:
                model = api_upsert_model(uname, uname, image_url or "")
                by_slug[uname] = model
                print(f"  ✅ Model criado: id={model.get('id')}")
            except Exception as e:
                print("  ❌ Falha ao criar model:", e)
                continue

        ok_count = 0
        for gif in gifs:
            try:
                if api_post_video(model, gif):
                    ok_count += 1
            except Exception as e:
                print("   ⚠️ Erro ao enviar vídeo:", e)

        print(f"  ✅ Envio concluído para @{uname}: {ok_count} vídeos inseridos/atualizados.")

    api.close()
    print("\n🎉 Tudo concluído.")

if __name__ == "__main__":
    main()
