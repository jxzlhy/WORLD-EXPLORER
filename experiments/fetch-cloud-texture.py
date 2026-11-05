#!/usr/bin/env python3
"""一次性:从 Wikimedia Commons 检索 NASA 公有领域云图(许可链:NASA PD → Commons)。
安全:HTTPS + 域名白名单 + fake-ip 放行(同 fetch-media-samples.py)。
产出:public/textures/earth-clouds.jpg + 许可记录输出。
"""
import html
import ipaddress
import json
import re
import socket
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "textures" / "earth-clouds.jpg"

ALLOWED_HOSTS = {"commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org"}
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "WorldExplorer-dev/0.3 (cloud texture pipeline; contact: local)"}
ALLOWED_LICENSE = ("cc0", "public domain", "pd", "cc by")

_ip_cache = {}


def assert_public_host(url):
    u = urllib.parse.urlsplit(url)
    if u.scheme != "https" or u.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"blocked host: {url}")
    if u.hostname not in _ip_cache:
        infos = socket.getaddrinfo(u.hostname, 443, proto=socket.IPPROTO_TCP)
        ips = [ipaddress.ip_address(i[4][0]) for i in infos]
        fake = bool(ips) and all(ip in ipaddress.ip_network("198.18.0.0/15") for ip in ips)
        if not fake and any(
            ip.is_loopback or ip.is_link_local or ip.is_reserved for ip in ips
        ):
            raise ValueError(f"non-public: {u.hostname}")
        _ip_cache[u.hostname] = ips


def safe_get(url, timeout=60):
    assert_public_host(url)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


QUERIES = [
    "Blue Marble clouds NASA map",
    "cloud map equirectangular NASA",
    "whole earth cloud cover NASA",
]

best = None
for q in QUERIES:
    qs = urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {q}",
        "gsrnamespace": 6,
        "gsrlimit": 10,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size",
        "iiurlwidth": 4096,
        "format": "json",
    })
    data = json.loads(safe_get(f"{API}?{qs}"))
    for p in sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda x: x.get("index", 99)):
        infos = p.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        w = info.get("width", 0)
        h = info.get("height", 0)
        if not (w >= 2048 and 1.8 <= w / h <= 2.2):  # 需要等距圆柱投影宽高比 ~2:1
            continue
        meta = info.get("extmetadata") or {}
        lic = clean((meta.get("LicenseShortName") or {}).get("value", ""))
        if not any(a in lic.lower() for a in ALLOWED_LICENSE):
            continue
        desc = clean((meta.get("ImageDescription") or {}).get("value", ""))[:200].lower()
        if "cloud" not in desc and "cloud" not in p.get("title", "").lower():
            continue
        thumb = info.get("thumburl") or info.get("url")
        best = {
            "title": p.get("title"),
            "license": lic,
            "artist": clean((meta.get("Artist") or {}).get("value", ""))[:120],
            "url": thumb,
            "size": f"{w}x{h}",
            "page": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(p['title'].replace(' ', '_'))}",
        }
        break
    if best:
        break

if not best:
    print("NO ACCEPTABLE CLOUD MAP FOUND")
    raise SystemExit(1)

blob = safe_get(best["url"], timeout=120)
if len(blob) < 100_000:
    print("image too small, suspicious:", len(blob))
    raise SystemExit(1)
OUT.write_bytes(blob)
print(json.dumps(best, ensure_ascii=False, indent=2))
print(f"saved {len(blob)//1024}KB -> {OUT.name}")
