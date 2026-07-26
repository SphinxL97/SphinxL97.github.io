from pathlib import Path
import base64
import gzip
import hashlib

parts = [
    Path("tools/work031_apply_chunk_01.txt"),
    Path("tools/work031_apply_chunk_02.txt"),
]
payload = "".join(path.read_text(encoding="utf-8").strip() for path in parts)
source = gzip.decompress(base64.b64decode(payload))
expected = "44007fba266567aa574d314f9ebd10b094fd121ee94f69859e306fb74db9fdb9"
actual = hashlib.sha256(source).hexdigest()
if actual != expected:
    raise RuntimeError(f"Work031 implementation checksum mismatch: {actual}")
for path in parts:
    path.unlink()
exec(compile(source.decode("utf-8"), "work031_apply_expanded.py", "exec"))
