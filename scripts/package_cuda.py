"""
Package the PyInstaller --onedir CUDA build into two archives.

Takes the PyInstaller --onedir output directory and splits it into:

Windows:
  1. voicebox-server-cuda.tar.gz
  2. cuda-libs-cu128-v1.tar.gz
  3. cuda-libs.json

Linux:
  1. voicebox-server-cuda-linux.tar.gz
  2. cuda-libs-cu128-linux-v1.tar.gz
  3. cuda-libs-linux.json

Usage:

    python scripts/package_cuda.py \
        backend/dist/voicebox-server-cuda/

    python scripts/package_cuda.py \
        backend/dist/voicebox-server-cuda/ \
        --platform linux \
        --cuda-libs-version cu128-linux-v1 \
        --output release-assets/
"""

import argparse
import hashlib
import json
import sys
import tarfile
from pathlib import Path


# NVIDIA CUDA runtime library prefixes.
#
# These can appear in:
#
#   nvidia/cublas/
#   nvidia/cudnn/
#   _internal/torch/lib/
#   top-level PyInstaller output
#
# Windows examples:
#
#   cublas64_12.dll
#   cudart64_12.dll
#
# Linux examples:
#
#   libcublas.so.12
#   libcublasLt.so.12
#   libcudart.so.12
#   libcudnn.so.9
#
NVIDIA_LIB_PREFIXES = (
    "cublas",
    "cublaslt",
    "cudart",
    "cudnn",
    "cufft",
    "cufftw",
    "curand",
    "cusolver",
    "cusolvermg",
    "cusparse",
    "nvjitlink",
    "nvrtc",
    "nccl",
    "caffe2_nvrtc",
)


# These are Python files/stubs that must remain in the server archive.
NVIDIA_KEEP_IN_CORE = {
    "torch/cuda/nccl.py",
    "torch/_inductor/codegen/cuda/cutlass_lib_extensions/"
    "cutlass_mock_imports/cuda/cudart.py",
}


def is_shared_library(filename: str) -> bool:
    """
    Return True for native shared-library files.

    Supports:

      Windows:
        foo.dll

      Linux:
        foo.so
        foo.so.1
        foo.so.12
        foo.so.12.4.0
    """
    name = filename.lower()

    if name.endswith(".dll"):
        return True

    if ".so" in name:
        # .so
        # .so.1
        # .so.12
        # .so.12.4.0
        suffix_position = name.find(".so")

        if suffix_position >= 0:
            remainder = name[suffix_position + 3:]

            return remainder == "" or remainder.startswith(".")

    return False


def normalize_library_name(filename: str) -> str:
    """
    Normalize a native library filename for NVIDIA prefix matching.

    Examples:

        libcudart.so.12  -> cudart
        libcublas.so.12  -> cublas
        libcublasLt.so.12 -> cublaslt
        cudart64_12.dll  -> cudart64_12
    """
    name = filename.lower()

    # Linux libraries conventionally have a "lib" prefix.
    if name.startswith("lib"):
        name = name[3:]

    # Windows: strip .dll
    if name.endswith(".dll"):
        name = name[:-4]

    # Linux: strip everything from ".so" onward.
    if ".so" in name:
        name = name.split(".so", 1)[0]

    return name


def is_nvidia_file(rel_path: str) -> bool:
    """
    Determine whether a file belongs in the separate NVIDIA CUDA archive.

    Only native CUDA/NVIDIA shared libraries are separated.

    Python files, metadata, package files, etc. remain in the server
    archive even when they live under an nvidia/ namespace package.
    """

    rel_lower = rel_path.lower().replace("\\", "/")

    # Explicit exceptions.
    if rel_lower in NVIDIA_KEEP_IN_CORE:
        return False

    filename = rel_lower.rsplit("/", 1)[-1]

    # We only separate native shared libraries.
    if not is_shared_library(filename):
        return False

    normalized = normalize_library_name(filename)

    # Match known NVIDIA CUDA runtime library names.
    for prefix in NVIDIA_LIB_PREFIXES:
        if normalized.startswith(prefix):
            return True

    return False


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""

    h = hashlib.sha256()

    with open(path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)

            if not chunk:
                break

            h.update(chunk)

    return h.hexdigest()


def create_archive(
    archive_path: Path,
    files: list[tuple[str, Path]],
    gzip_level: int,
) -> None:
    """
    Create a gzip-compressed tar archive.

    gzip_level=1 is substantially faster than the default compression
    level and is appropriate for already-compressed/binary libraries.
    """

    print(
        f"Creating archive: {archive_path.name} "
        f"({len(files)} files, gzip level {gzip_level})",
        flush=True,
    )

    with tarfile.open(
        archive_path,
        mode="w:gz",
        compresslevel=gzip_level,
    ) as tar:
        total = len(files)

        for index, (rel_str, full_path) in enumerate(files, start=1):
            tar.add(
                full_path,
                arcname=rel_str,
            )

            # Progress every 100 files and at the end.
            if index == 1 or index % 100 == 0 or index == total:
                print(
                    f"  archived {index}/{total}: {rel_str}",
                    flush=True,
                )


def package(
    onedir_path: Path,
    output_dir: Path,
    cuda_libs_version: str,
    torch_compat: str,
    platform: str,
    gzip_level: int,
) -> None:

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ------------------------------------------------------------------
    # Collect files
    # ------------------------------------------------------------------

    core_files: list[tuple[str, Path]] = []
    nvidia_files: list[tuple[str, Path]] = []

    for item in sorted(onedir_path.rglob("*")):

        if item.is_dir():
            continue

        rel = item.relative_to(onedir_path)

        # Always use forward slashes inside archives.
        rel_str = rel.as_posix()

        if is_nvidia_file(rel_str):
            nvidia_files.append(
                (rel_str, item)
            )
        else:
            core_files.append(
                (rel_str, item)
            )

    core_size = sum(
        file.stat().st_size
        for _, file in core_files
    )

    nvidia_size = sum(
        file.stat().st_size
        for _, file in nvidia_files
    )

    print()
    print("=" * 70)
    print("CUDA PACKAGE")
    print("=" * 70)

    print(f"Platform:       {platform}")
    print(f"Input directory: {onedir_path}")
    print()

    print(
        f"Core files:     {len(core_files)} "
        f"({core_size / (1024 ** 2):.1f} MB)"
    )

    print(
        f"NVIDIA files:   {len(nvidia_files)} "
        f"({nvidia_size / (1024 ** 2):.1f} MB)"
    )

    print()

    # ------------------------------------------------------------------
    # Fail if NVIDIA libraries were not detected.
    # ------------------------------------------------------------------

    if not nvidia_files:

        print(
            "ERROR: No NVIDIA CUDA shared libraries were found.",
            file=sys.stderr,
        )

        print(
            f"Input directory: {onedir_path}",
            file=sys.stderr,
        )

        print(
            "Expected files such as libcudart.so.12, "
            "libcublas.so.12, or cudart64_12.dll.",
            file=sys.stderr,
        )

        sys.exit(1)

    # Print detected NVIDIA libraries.
    print("Detected NVIDIA libraries:")

    for rel_str, full_path in nvidia_files:
        size_mb = full_path.stat().st_size / (1024 ** 2)

        print(
            f"  {size_mb:8.1f} MB  {rel_str}"
        )

    print()

    # ------------------------------------------------------------------
    # Platform-specific asset names
    # ------------------------------------------------------------------

    if platform == "linux":

        server_archive_name = (
            "voicebox-server-cuda-linux.tar.gz"
        )

        server_sha_name = (
            "voicebox-server-cuda-linux.tar.gz.sha256"
        )

        manifest_name = (
            "cuda-libs-linux.json"
        )

    else:

        server_archive_name = (
            "voicebox-server-cuda.tar.gz"
        )

        server_sha_name = (
            "voicebox-server-cuda.tar.gz.sha256"
        )

        manifest_name = (
            "cuda-libs.json"
        )

    cuda_libs_archive_name = (
        f"cuda-libs-{cuda_libs_version}.tar.gz"
    )

    cuda_libs_sha_name = (
        f"cuda-libs-{cuda_libs_version}.tar.gz.sha256"
    )

    # ------------------------------------------------------------------
    # Server archive
    # ------------------------------------------------------------------

    server_archive = (
        output_dir / server_archive_name
    )

    print()
    print(
        f"Creating server archive: "
        f"{server_archive.name}"
    )

    create_archive(
        server_archive,
        core_files,
        gzip_level,
    )

    server_sha = sha256_file(
        server_archive
    )

    server_sha_path = (
        output_dir / server_sha_name
    )

    server_sha_path.write_text(
        f"{server_sha}  {server_archive.name}\n"
    )

    print(
        f"Server archive size: "
        f"{server_archive.stat().st_size / (1024 ** 2):.1f} MB"
    )

    print(
        f"Server SHA-256: "
        f"{server_sha}"
    )

    # ------------------------------------------------------------------
    # NVIDIA CUDA library archive
    # ------------------------------------------------------------------

    cuda_libs_archive = (
        output_dir / cuda_libs_archive_name
    )

    print()
    print(
        f"Creating CUDA libraries archive: "
        f"{cuda_libs_archive.name}"
    )

    create_archive(
        cuda_libs_archive,
        nvidia_files,
        gzip_level,
    )

    cuda_sha = sha256_file(
        cuda_libs_archive
    )

    cuda_sha_path = (
        output_dir / cuda_libs_sha_name
    )

    cuda_sha_path.write_text(
        f"{cuda_sha}  {cuda_libs_archive.name}\n"
    )

    print(
        f"CUDA libs archive size: "
        f"{cuda_libs_archive.stat().st_size / (1024 ** 2):.1f} MB"
    )

    print(
        f"CUDA libs SHA-256: "
        f"{cuda_sha}"
    )

    # ------------------------------------------------------------------
    # Manifest
    # ------------------------------------------------------------------

    manifest = {
        "platform": platform,
        "version": cuda_libs_version,
        "torch_compat": torch_compat,
        "archive": cuda_libs_archive.name,
        "sha256": cuda_sha,
    }

    manifest_path = (
        output_dir / manifest_name
    )

    manifest_path.write_text(
        json.dumps(
            manifest,
            indent=2,
        )
        + "\n"
    )

    print()
    print(
        f"Manifest: {manifest_path.name}"
    )

    print(
        json.dumps(
            manifest,
            indent=2,
        )
    )

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    total_input = (
        core_size + nvidia_size
    )

    total_output = (
        server_archive.stat().st_size
        + cuda_libs_archive.stat().st_size
    )

    print()
    print("=" * 70)
    print("PACKAGE COMPLETE")
    print("=" * 70)

    print(
        f"Total input:   "
        f"{total_input / (1024 ** 3):.2f} GB"
    )

    print(
        f"Total output:  "
        f"{total_output / (1024 ** 3):.2f} GB"
    )

    print(
        f"Server:        "
        f"{server_archive.name}"
    )

    print(
        f"CUDA libs:     "
        f"{cuda_libs_archive.name}"
    )

    print(
        f"Manifest:      "
        f"{manifest_path.name}"
    )

    print("=" * 70)


def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Package PyInstaller --onedir CUDA build "
            "into server + NVIDIA CUDA archives."
        )
    )

    parser.add_argument(
        "input",
        type=Path,
        help=(
            "Path to PyInstaller --onedir output directory "
            "(e.g. backend/dist/voicebox-server-cuda/)"
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Output directory for archives "
            "(default: same as input parent)"
        ),
    )

    parser.add_argument(
        "--platform",
        choices=("windows", "linux"),
        default="windows",
        help=(
            "Target platform. "
            "Default: windows, preserving existing release behavior."
        ),
    )

    parser.add_argument(
        "--cuda-libs-version",
        type=str,
        default="cu128-v1",
        help=(
            "Version string for CUDA libs archive. "
            "Default: cu128-v1"
        ),
    )

    parser.add_argument(
        "--torch-compat",
        type=str,
        default=">=2.7.0,<2.11.0",
        help=(
            "Torch version compatibility range. "
            "Default: >=2.7.0,<2.11.0"
        ),
    )

    parser.add_argument(
        "--gzip-level",
        type=int,
        choices=range(1, 10),
        default=1,
        help=(
            "gzip compression level, 1-9. "
            "Default: 1 for faster CI packaging."
        ),
    )

    args = parser.parse_args()

    if not args.input.is_dir():

        print(
            f"Error: {args.input} is not a directory",
            file=sys.stderr,
        )

        print(
            "Expected a PyInstaller --onedir output directory.",
            file=sys.stderr,
        )

        sys.exit(1)

    output_dir = (
        args.output
        or args.input.parent
    )

    package(
        onedir_path=args.input,
        output_dir=output_dir,
        cuda_libs_version=args.cuda_libs_version,
        torch_compat=args.torch_compat,
        platform=args.platform,
        gzip_level=args.gzip_level,
    )


if __name__ == "__main__":
    main()
