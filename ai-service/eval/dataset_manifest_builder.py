import hashlib
import json
from pathlib import Path
from typing import Any, Dict


def build_manifest(dataset_dir: Path) -> Dict[str, Any]:
    manifest = {
        "dataset_name": "fixgo-multimodal-recommendation-dataset",
        "provenance": {
            "synthetic_ratio": 1.0,
            "origin": "synthetic_opencv_templates",
            "leakage_detected": True,
        },
        "splits": {},
        "sha256_duplicates": [],
    }

    seen_hashes: Dict[str, str] = {}
    for split in ["train", "val", "test"]:
        split_dir = dataset_dir / split
        if not split_dir.exists():
            continue
        items = []
        for file_path in split_dir.rglob("*"):
            if file_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
                continue
            file_bytes = file_path.read_bytes()
            sha256 = hashlib.sha256(file_bytes).hexdigest()
            category = file_path.parent.name
            entry = {
                "file": str(file_path.relative_to(dataset_dir)),
                "category": category,
                "sha256": sha256,
                "origin": "synthetic",
            }
            if sha256 in seen_hashes:
                manifest["sha256_duplicates"].append({
                    "sha256": sha256,
                    "first": seen_hashes[sha256],
                    "duplicate": entry["file"],
                })
            else:
                seen_hashes[sha256] = entry["file"]
            items.append(entry)
        manifest["splits"][split] = {
            "count": len(items),
            "unique_sha256": len(set(i["sha256"] for i in items)),
        }

    manifest["total_files"] = sum(s["count"] for s in manifest["splits"].values())
    manifest["unique_files"] = len(seen_hashes)
    manifest["duplicate_count"] = len(manifest["sha256_duplicates"])
    return manifest


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent / "dataset"
    report = build_manifest(root)
    out_path = Path(__file__).resolve().parent / "dataset_manifest.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(f"Manifest written to {out_path} ({report['total_files']} files, {report['duplicate_count']} duplicates)")
