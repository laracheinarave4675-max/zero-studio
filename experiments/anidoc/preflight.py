#!/usr/bin/env python3
"""Report whether this machine can attempt official AniDoc inference.

This is a diagnostic only: it never downloads weights, installs CUDA, or starts inference.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def command_output(command: list[str]) -> str | None:
    try:
        result = subprocess.run(
            command, check=True, text=True, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, timeout=20
        )
        return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None


def main() -> int:
    root = Path(os.environ.get("ANIDOC_ROOT", "third_party/AniDoc"))
    weights = Path(os.environ.get("ANIDOC_WEIGHTS", str(root / "pretrained_weights")))
    nvidia_smi = shutil.which("nvidia-smi")
    gpu_name = None
    gpu_memory_mib = None

    if nvidia_smi:
        query = command_output([
            nvidia_smi,
            "--query-gpu=name,memory.total",
            "--format=csv,noheader,nounits",
        ])
        if query:
            first_gpu = query.splitlines()[0].split(",")
            if len(first_gpu) >= 2:
                gpu_name = first_gpu[0].strip()
                try:
                    gpu_memory_mib = int(first_gpu[1].strip())
                except ValueError:
                    pass

    torch_cuda = None
    torch_error = None
    try:
        import torch  # type: ignore
        torch_cuda = bool(torch.cuda.is_available())
        if torch_cuda and gpu_name is None:
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory_mib = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
    except Exception as exc:
        torch_error = f"{type(exc).__name__}: {exc}"

    required = {
        "stable_video_diffusion": weights / "stable-video-diffusion-img2vid-xt",
        "anidoc": weights / "anidoc",
        "cotracker": weights / "cotracker2.pth",
    }
    checkpoint_status = {name: path.exists() for name, path in required.items()}
    vram_gib = round(gpu_memory_mib / 1024, 2) if gpu_memory_mib else None
    source_ready = root.is_dir()
    python_compatible = sys.version_info[:2] == (3, 8)
    cuda_ready = torch_cuda is True
    gpu_ready = bool(gpu_name and gpu_memory_mib and gpu_memory_mib >= 14 * 1024)
    checkpoints_ready = all(checkpoint_status.values())

    report = {
        "python": sys.version.split()[0],
        "ani_doc_source_present": source_ready,
        "python_3_8_recommended": python_compatible,
        "nvidia_smi_present": bool(nvidia_smi),
        "torch_cuda_available": torch_cuda,
        "torch_diagnostic_error": torch_error,
        "gpu_name": gpu_name,
        "gpu_vram_gib": vram_gib,
        "upstream_reported_vram_requirement_gib": 14,
        "checkpoints": checkpoint_status,
        "inference_ready": bool(source_ready and python_compatible and cuda_ready and gpu_ready and checkpoints_ready),
    }
    print(json.dumps(report, indent=2))

    print("\n## AniDoc preflight")
    print(f"- Python: {report['python']}")
    print(f"- GPU: {gpu_name or 'not detected'}")
    print(f"- GPU VRAM: {f'{vram_gib} GiB' if vram_gib else 'unavailable'}")
    print(f"- Checkpoints complete: {'yes' if checkpoints_ready else 'no'}")
    if report["inference_ready"]:
        print("- Result: READY FOR A CONTROLLED INFERENCE ATTEMPT (not yet tested)")
    else:
        reasons = []
        if not source_ready:
            reasons.append("AniDoc source checkout is missing")
        if not python_compatible:
            reasons.append("Python is outside the supported preflight range (3.8–3.10; upstream recommends 3.8)")
        if not cuda_ready:
            reasons.append("PyTorch CUDA is not available")
        if not gpu_ready:
            reasons.append("no NVIDIA GPU with at least ~14 GiB VRAM")
        if not checkpoints_ready:
            reasons.append("one or more model checkpoints are missing")
        print("- Result: BLOCKED — " + "; ".join(reasons))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
