#!/usr/bin/env python3
"""目的地照片覆盖扩容(批量,断点续跑)。

对尚无已核验照片的目的地,从 Wikimedia Commons 检索并下载:
- 许可:仅接受 CC0 / Public Domain / CC BY / CC BY-SA(应用内自动署名)
- 分辨率:宽 ≥1200、横幅;下载用 Commons 缩放服务(iiurlwidth=1600)控制体积
- 产物:public/media/destinations/{id}.{ext} + media-samples.json 登记 + 目的地 JSON 写回 media 字段
- 安全:HTTPS + 域名白名单 + fake-ip 放行(同 fetch-media-samples.py)
- 礼貌:每轮上限 --limit 条(默认 30),请求间 0.6s;中断重跑自动跳过已收录项

用法:python3 -I experiments/expand-media-coverage.py [--limit 30]
注意:网络被代理拦截时(Fake-IP TLS 超时)会直接报 NETWORK BLOCKED 退出,稍后再试。
"""
import argparse
import html
import ipaddress
import json
import re
import socket
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST_DIR = ROOT / "public" / "data" / "destinations"
MEDIA_DIR = ROOT / "public" / "media" / "destinations"
SAMPLES = ROOT / "public" / "data" / "media-samples.json"

ALLOWED_HOSTS = {"commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org"}
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "WorldExplorer-dev/0.3 (media coverage pipeline; contact: local)"}
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
        if not fake and any(ip.is_loopback or ip.is_link_local or ip.is_reserved for ip in ips):
            raise ValueError(f"non-public: {u.hostname}")
        _ip_cache[u.hostname] = ips


def safe_get(url, timeout=90):
    assert_public_host(url)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def search_photo(name, name_en, country_en):
    """按目的地名多组关键词检索;返回第一条合格记录或 None。"""
    for q in (f"{name} {country_en}", name_en or name, name):
        qs = urllib.parse.urlencode({
            "action": "query",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {q}",
            "gsrnamespace": 6,
            "gsrlimit": 8,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime|size",
            "iiurlwidth": 1600,
            "format": "json",
        })
        try:
            data = json.loads(safe_get(f"{API}?{qs}"))
        except Exception as e:
            print(f"  search failed ({type(e).__name__}) -> NETWORK BLOCKED?")
            raise
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
            if w < 1200 or w <= h:
                continue  # 需横幅照片
            meta = info.get("extmetadata") or {}
            lic = clean((meta.get("LicenseShortName") or {}).get("value", ""))
            if not any(a in lic.lower() for a in ALLOWED_LICENSE):
                continue
            url = info.get("thumburl") or info.get("url")
            if not url:
                continue
            return {
                "title": p.get("title"),
                "license": lic,
                "author": clean((meta.get("Artist") or {}).get("value", ""))[:120] or "Unknown",
                "sourceUrl": "https://commons.wikimedia.org/wiki/"
                + urllib.parse.quote(p["title"].replace(" ", "_")),
                "url": url,
            }
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=30)
    args = ap.parse_args()

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    samples = json.loads(SAMPLES.read_text(encoding="utf-8"))
    known = {s["id"] for s in samples}

    dests = []  # (file_path, list_ref)
    for f in sorted(DEST_DIR.glob("*.json")):
        arr = json.loads(f.read_text(encoding="utf-8"))
        dests.append((f, arr))

    # 国家英文名用于增强检索词(缺省退化为目的地名本身)
    country_en = {}
    countries_file = ROOT / "public" / "data" / "countries.json"
    if countries_file.exists():
        for c in json.loads(countries_file.read_text(encoding="utf-8")):
            country_en[c.get("id", "")] = c.get("nameEn", "")

    pending = []
    for f, arr in dests:
        for d in arr:
            if d.get("media", {}).get("status") == "verified" or d["id"] in known:
                continue
            pending.append((f, arr, d))
    print(f"待补照片目的地:{len(pending)}(本轮上限 {args.limit})")

    ok, failed = 0, 0
    for f, arr, d in pending[: args.limit]:
        print(f"[{ok + failed + 1}] {d['id']} {d['name']}", flush=True)
        try:
            rec = search_photo(d["name"], d.get("nameEn"), country_en.get(d.get("countryId", ""), ""))
            if not rec:
                print("  no acceptable photo")
                failed += 1
                continue
            blob = safe_get(rec["url"], timeout=120)
            if len(blob) < 30_000:
                print(f"  too small ({len(blob)}B), skip")
                failed += 1
                continue
            ext = ".png" if rec["url"].lower().endswith(".png") else ".jpg"
            out = MEDIA_DIR / f"{d['id']}{ext}"
            out.write_bytes(blob)
            rel = f"/media/destinations/{out.name}"
            d["media"] = {
                "status": "verified",
                "file": rel,
                "author": rec["author"],
                "license": rec["license"],
                "sourceUrl": rec["sourceUrl"],
            }
            samples.append({
                "id": d["id"],
                "file": rel,
                "author": rec["author"],
                "license": rec["license"],
                "sourceUrl": rec["sourceUrl"],
                "bytes": len(blob),
                "title": rec["title"],
            })
            f.write_text(
                json.dumps(arr, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            SAMPLES.write_text(
                json.dumps(samples, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"  saved {out.name} ({len(blob) // 1024}KB) © {rec['author']} · {rec['license']}")
            ok += 1
        except Exception as e:
            print(f"  FAIL {type(e).__name__}: {str(e)[:90]}")
            print("NETWORK BLOCKED OR ERROR — 中止本轮(已保存条目保留,重跑自动续)")
            break
        time.sleep(0.6)

    print(f"本轮完成:新增 {ok},未匹配/失败 {failed},剩余 {len(pending) - ok - failed}")


if __name__ == "__main__":
    main()
