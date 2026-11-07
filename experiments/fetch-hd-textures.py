#!/usr/bin/env python3
"""一次性:从 Wikimedia Commons 检索 NASA 高清全球贴图(许可链:NASA PD → Commons)。
安全:HTTPS + 域名白名单 + fake-ip 放行(同 fetch-cloud-texture.py / fetch-media-samples.py)。
产出:public/textures/earth-blue-marble.jpg(目标 ≥5400 宽)+ earth-night.jpg(目标 ≥3600 宽)
     + 许可记录 JSON(stdout),供 docs/07-DATA-AND-ASSETS 登记。
"""
import html
import ipaddress
import json
import re
import socket
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEX = ROOT / "public" / "textures"

ALLOWED_HOSTS = {"commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org"}
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "WorldExplorer-dev/0.3 (hd texture pipeline; contact: local)"}
# 仅收公有领域/CC0,避免署名链复杂化(底图 credit 已标注 NASA)
ALLOWED_LICENSE = ("cc0", "public domain", "pd")

_ip_cache = {}


def assert_public_host(url):
    u = urllib.parse.urlsplit(url)
    if u.scheme != "https" or u.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"blocked host: {url}")
    if u.hostname not in _ip_cache:
        infos = socket.getaddrinfo(u.hostname, 443, proto=socket.IPPROTO_TCP)
        ips = [ipaddress.ip_address(i[4][0]) for i in infos]
        fake = bool(ips) and all(ip in ipaddress.ip_network("198.18.0.0/15") for ip in ips)
        if not fake and any(ip.is_loopback or ip.is_link_local or ip.is_reserved for ip in ips):
            raise ValueError(f"non-public: {u.hostname}")
        _ip_cache[u.hostname] = ips


def safe_get(url, timeout=120):
    assert_public_host(url)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def search_one(queries, min_width, thumb_width, must_words):
    """按查询序列在 Commons 检索;返回第一条满足 分辨率/宽高比/许可/关键词 的记录。"""
    for q in queries:
        qs = urllib.parse.urlencode({
            "action": "query",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {q}",
            "gsrnamespace": 6,
            "gsrlimit": 12,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime|size",
            "iiurlwidth": thumb_width,
            "format": "json",
        })
        data = json.loads(safe_get(f"{API}?{qs}"))
        pages = sorted(
            (data.get("query") or {}).get("pages", {}).values(),
            key=lambda x: x.get("index", 99),
        )
        for p in pages:
            infos = p.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            if info.get("mime") not in ("image/jpeg", "image/png"):
                continue
            w, h = info.get("width", 0), info.get("height", 0)
            if w < min_width or not (1.85 <= w / max(h, 1) <= 2.15):
                continue  # 必须是等距圆柱投影 ~2:1 全球图
            meta = info.get("extmetadata") or {}
            lic = clean((meta.get("LicenseShortName") or {}).get("value", ""))
            if not any(a in lic.lower() for a in ALLOWED_LICENSE):
                continue
            title = p.get("title", "").lower()
            desc = clean((meta.get("ImageDescription") or {}).get("value", ""))[:300].lower()
            if not any(k in title or k in desc for k in must_words):
                continue
            # 原图不超限则用原图,否则用缩放后的 thumburl
            url = info.get("url") if info.get("size", 0) <= 30_000_000 else info.get("thumburl")
            if not url:
                continue
            yield {
                "title": p.get("title"),
                "license": lic,
                "artist": clean((meta.get("Artist") or {}).get("value", ""))[:120],
                "page": "https://commons.wikimedia.org/wiki/"
                + urllib.parse.quote(p["title"].replace(" ", "_")),
                "origSize": f"{w}x{h}",
                "url": url,
            }
    return


def fetch_to(rec, out_name):
    blob = safe_get(rec["url"], timeout=180)
    if len(blob) < 500_000:
        raise ValueError(f"image too small/suspicious: {len(blob)} bytes")
    out = TEX / out_name
    out.write_bytes(blob)
    dims = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(out)],
        capture_output=True, text=True,
    ).stdout
    w = re.search(r"pixelWidth: (\d+)", dims)
    h = re.search(r"pixelHeight: (\d+)", dims)
    rec["file"] = out_name
    rec["savedSize"] = f"{w.group(1) if w else '?'}x{h.group(1) if h else '?'}"
    rec["bytes"] = len(blob)
    return rec


results = {}
for key, queries, min_w, thumb_w, words in [
    ("day",
     ["Blue Marble Next Generation world land ocean ice", "Whole world land and oceans", "Blue Marble topography bathymetry world map"],
     5400, 8100,
     ["blue marble", "land and oceans", "topograph", "world map", "earth"]),
    ("night",
     ["Black Marble earth night lights NASA", "Earth at night city lights map", "night lights equirectangular NASA"],
     3600, 5400,
     ["black marble", "night", "lights"]),
]:
    picked = None
    for rec in search_one(queries, min_w, thumb_w, words):
        try:
            picked = fetch_to(rec, f"earth-{'blue-marble' if key == 'day' else 'night'}.jpg")
            break
        except Exception as e:  # 单条失败继续下一条
            print(f"skip {rec['title']}: {e}", flush=True)
    if not picked:
        print(f"NO ACCEPTABLE {key.upper()} TEXTURE FOUND")
        raise SystemExit(1)
    results[key] = picked
    print(json.dumps(picked, ensure_ascii=False, indent=2), flush=True)

print("ALL OK")
