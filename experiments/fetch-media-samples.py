#!/usr/bin/env python3
"""一次性脚本:从 Wikimedia Commons 拉取首批目的地真实图片样本。
许可核验:仅接受 CC0 / Public domain / CC BY / CC BY-SA(允许商用+署名)。
安全:HTTPS + 域名白名单(commons/upload.wikimedia.org)+ 解析 IP 非私网校验。
产出:public/media/destinations/<id>.jpg + public/data/media-samples.json
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
MEDIA_DIR = ROOT / "public" / "media" / "destinations"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

API_HOST = "commons.wikimedia.org"
ALLOWED_HOSTS = {"commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org"}
API = f"https://{API_HOST}/w/api.php"
UA = {"User-Agent": "WorldExplorer-dev/0.1 (asset pipeline sample; contact: local)"}

# 目的地 id -> Commons 检索词(首批 10 + V1.0 扩容 20)
TARGETS = {
    "cn-great-wall": "Great Wall of China Mutianyu",
    "cn-forbidden-city": "Forbidden City Hall of Supreme Harmony",
    "jp-mount-fuji": "Mount Fuji lake Kawaguchi",
    "us-grand-canyon": "Grand Canyon South Rim vista",
    "fr-eiffel-tower": "Eiffel Tower Paris",
    "it-colosseum": "Colosseum Rome exterior",
    "eg-giza-pyramids": "Great Pyramid of Giza",
    "pe-machu-picchu": "Machu Picchu classic view",
    "au-sydney-opera-house": "Sydney Opera House",
    "is-gullfoss": "Gullfoss waterfall Iceland",
    "cn-terracotta-army": "Terracotta Army pit 1 Xian",
    "cn-mogao-caves": "Mogao Caves Dunhuang",
    "cn-west-lake": "West Lake Hangzhou Su causeway",
    "cn-huangshan": "Huangshan granite peaks pines",
    "jp-kinkaku-ji": "Kinkaku-ji golden pavilion Kyoto",
    "jp-todaiji": "Todai-ji Great Buddha Nara",
    "jp-itsukushima-shrine": "Itsukushima shrine torii Miyajima",
    "jp-fushimi-inari": "Fushimi Inari torii tunnel",
    "us-statue-of-liberty": "Statue of Liberty",
    "us-golden-gate": "Golden Gate Bridge fog",
    "us-niagara-falls": "Niagara Falls Horseshoe",
    "us-monument-valley": "Monument Valley Merrick Butte",
    "fr-mont-saint-michel": "Mont Saint Michel bay",
    "fr-louvre": "Louvre pyramid courtyard",
    "fr-versailles": "Palace of Versailles Hall of Mirrors",
    "it-leaning-tower-pisa": "Leaning Tower of Pisa",
    "it-venice": "Grand Canal Venice Rialto",
    "gb-westminster": "Big Ben Elizabeth Tower",
    "gb-stonehenge": "Stonehenge",
    "eg-abu-simbel": "Abu Simbel temple facade",
    "eg-luxor-temple": "Luxor Temple columns",
    "au-uluru": "Uluru sunset",
    "is-jokulsarlon": "Jokulsarlon glacier lagoon",
}

ALLOWED_LICENSE = ("cc0", "public domain", "cc by", "cc by-sa")

_ip_cache = {}


def assert_public_host(url):
    """SSRF 防护:仅 HTTPS + 域名白名单;解析 IP 不得为环回/私网/链路本地。
    本机代理使用 fake-ip DNS(198.18.0.0/15 基准段)时视为「由本地代理转发」,放行。"""
    u = urllib.parse.urlsplit(url)
    if u.scheme != "https" or u.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"blocked host: {url}")
    if u.hostname not in _ip_cache:
        infos = socket.getaddrinfo(u.hostname, 443, proto=socket.IPPROTO_TCP)
        ips = [ipaddress.ip_address(i[4][0]) for i in infos]
        fake_ip_proxy = bool(ips) and all(ip in ipaddress.ip_network("198.18.0.0/15") for ip in ips)
        if not fake_ip_proxy and (
            not ips
            or any(
                ip.is_loopback or ip.is_link_local or ip.is_reserved
                or (ip.is_private and not fake_ip_proxy)
                for ip in ips
            )
        ):
            raise ValueError(f"host resolves to non-public IP: {u.hostname}")
        _ip_cache[u.hostname] = ips
    return u


def safe_get(url, timeout=30):
    assert_public_host(url)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def api(params):
    qs = urllib.parse.urlencode(params)
    return json.loads(safe_get(f"{API}?{qs}"))


def clean_html(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def fetch_one(dest_id, query):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": 6,
        "gsrlimit": 8,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size",
        "iiurlwidth": 1024,
        "format": "json",
    })
    pages = (data.get("query") or {}).get("pages") or {}
    candidates = sorted(pages.values(), key=lambda p: p.get("index", 99))
    for p in candidates:
        infos = p.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        meta = info.get("extmetadata") or {}
        lic = clean_html((meta.get("LicenseShortName") or {}).get("value", ""))
        if not any(a in lic.lower() for a in ALLOWED_LICENSE):
            continue
        thumb = info.get("thumburl") or info.get("url")
        artist = clean_html((meta.get("Artist") or {}).get("value", ""))[:120]
        try:
            blob = safe_get(thumb, timeout=60)
        except Exception as e:  # noqa: BLE001
            print(f"  download fail {p.get('title')}: {e}")
            continue
        if len(blob) < 30_000:  # 太小,可能是占位图
            continue
        ext = ".png" if info.get("mime") == "image/png" else ".jpg"
        out = MEDIA_DIR / f"{dest_id}{ext}"
        out.write_bytes(blob)
        return {
            "id": dest_id,
            "file": f"/media/destinations/{out.name}",
            "author": artist or "未知作者",
            "license": lic,
            "sourceUrl": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(p['title'].replace(' ', '_'))}",
            "bytes": len(blob),
            "title": p.get("title"),
        }
    return None


def main():
    results = []
    for dest_id, query in TARGETS.items():
        print(f"fetching {dest_id} ...")
        try:
            item = fetch_one(dest_id, query)
        except Exception as e:  # noqa: BLE001
            print(f"  api fail: {e}")
            item = None
        if item:
            results.append(item)
            print(f"  OK {item['license']} | {item['author'][:40]} | {item['bytes']//1024}KB")
        else:
            print("  NO ACCEPTABLE RESULT")
    manifest = ROOT / "public" / "data" / "media-samples.json"
    manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nsaved {len(results)}/{len(TARGETS)} -> {manifest}")


if __name__ == "__main__":
    main()
