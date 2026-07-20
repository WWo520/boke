"""跨平台可靠的 tar 打包：用 os.scandir 读取真实文件名大小写。

Windows 自带的 tar.exe 在打包时会把路径规范化成调用者传入的大小写，
导致实际磁盘是 "FollowButton.jsx" 但 tar 内写的是 "followbutton.jsx"。
用 Python tarfile + os.scandir 直接从 MFT 读真实大小写写入 archive。
"""
import os
import tarfile
import sys

SRC_DIR = r"D:\develop\qoder_project\blog_demo"
OUT_TAR = r"D:\develop\qoder_project\deploy-pkg.tar.gz"

EXCLUDE_NAMES = {
    "node_modules", ".next", "test-results", "ms-playwright", "dist",
    ".git", "deploy-pkg.tar.gz",
}


def should_exclude(name, path):
    if name in EXCLUDE_NAMES:
        return True
    # server/node_modules 单独处理
    if name == "node_modules" and path.endswith("server"):
        return True
    return False


def walk_real_case(root):
    """递归遍历，返回每个文件相对于 root 的真实大小写路径。"""
    for entry in os.scandir(root):
        if entry.name.startswith("."):
            # 保留 .env* 等，但排除 .git / .next
            if entry.name in EXCLUDE_NAMES:
                continue
        if entry.is_dir(follow_symlinks=False):
            if entry.name in EXCLUDE_NAMES:
                continue
            yield from walk_real_case(entry.path)
        elif entry.is_file(follow_symlinks=False):
            if entry.name in EXCLUDE_NAMES:
                continue
            # 返回相对于 SRC_DIR 的路径
            yield os.path.relpath(entry.path, SRC_DIR)


def main():
    if os.path.exists(OUT_TAR):
        os.remove(OUT_TAR)

    print(f"扫描: {SRC_DIR}")
    files = list(walk_real_case(SRC_DIR))
    print(f"共 {len(files)} 个文件")

    # 校验关键文件的大小写是否正确
    critical = [
        "src\\components\\FollowButton\\FollowButton.jsx",
        "src\\css_pages\\Questions.module.css",
        "src\\css_pages\\Rankings.module.css",
        "src\\css_pages\\UserPage.module.css",
    ]
    for c in critical:
        norm = c.replace("\\", "/")
        found = any(f.replace("\\", "/") == norm for f in files)
        print(f"  {'OK' if found else 'MISSING'}: {norm}")

    print(f"写入: {OUT_TAR}")
    with tarfile.open(OUT_TAR, "w:gz") as tar:
        for rel in files:
            full = os.path.join(SRC_DIR, rel)
            # arcname 用正斜杠（tar 标准）
            arcname = "blog_demo/" + rel.replace("\\", "/")
            tar.add(full, arcname=arcname)

    size_mb = os.path.getsize(OUT_TAR) / 1024 / 1024
    print(f"打包完成: {size_mb:.2f} MB")

    # 验证 tar 包内文件名
    print("\n验证 tar 内关键文件名:")
    with tarfile.open(OUT_TAR, "r:gz") as tar:
        for name in tar.getnames():
            if any(k in name for k in ("FollowButton.jsx", "Questions.module", "Rankings.module")):
                print(f"  {name}")


if __name__ == "__main__":
    main()
