#!/usr/bin/env python3
"""Verify and unpack the bundled offline data, fonts and portraits."""
import hashlib,json,pathlib,zipfile
ROOT=pathlib.Path(__file__).resolve().parent
for name,digest in json.loads((ROOT/'bundles.json').read_text()).items():
    archive=ROOT/name
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=digest:
        raise SystemExit('Bundle checksum mismatch: '+name)
    with zipfile.ZipFile(archive) as z:
        for entry in z.infolist():
            target=(ROOT/entry.filename).resolve()
            if not target.is_relative_to(ROOT/'assets') or entry.is_dir():
                raise SystemExit('Unexpected archive entry: '+entry.filename)
        z.extractall(ROOT)
print('Offline assets ready.')
