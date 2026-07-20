"""修复 Profile.module.css 大小写（最后一次重命名）。"""
import os
import tarfile

BASE = r"D:\develop\qoder_project\blog_demo\src"
SRC_DIR = r"D:\develop\qoder_project\blog_demo"
OUT_TAR = r"D:\develop\qoder_project\deploy-pkg.tar.gz"

# 修复 Profile 大小写
src = os.path.join(BASE, "css_pages", "profile.module.css")
dst = os.path.join(BASE, "css_pages", "Profile.module.css")
if os.path.exists(src) and not (os.path.exists(dst) and os.path.basename(os.path.realpath(dst)) == "Profile.module.css"):
    tmp = src + ".TMP"
    if os.path.exists(tmp): os.remove(tmp)
    os.rename(src, tmp)
    os.rename(tmp, dst)
    print(f"rename: profile.module.css -> Profile.module.css")
else:
    print("already fixed or missing")

# 验证
print("\n=== 最终 css_pages 文件名 ===")
for f in sorted(os.listdir(os.path.join(BASE, "css_pages"))):
    if f.lower().endswith(".module.css"):
        print(f"  {f}")

# 重新打包（保持真实大小写）
EXCLUDE = {"node_modules", ".next", "test-results", "ms-playwright", "dist", ".git", "deploy-pkg.tar.gz"}

def walk_real(root):
    for e in os.scandir(root):
        if e.name in EXCLUDE: continue
        if e.is_dir(follow_symlinks=False):
            yield from walk_real(e.path)
        elif e.is_file(follow_symlinks=False):
            yield os.path.relpath(e.path, SRC_DIR)

if os.path.exists(OUT_TAR): os.remove(OUT_TAR)
files = list(walk_real(SRC_DIR))
with tarfile.open(OUT_TAR, "w:gz") as tar:
    for rel in files:
        full = os.path.join(SRC_DIR, rel)
        arcname = "blog_demo/" + rel.replace("\\", "/")
        tar.add(full, arcname=arcname)
print(f"\ntar: {os.path.getsize(OUT_TAR)/1024/1024:.2f} MB")

# 验证关键文件
with tarfile.open(OUT_TAR, "r:gz") as tar:
    for n in tar.getnames():
        if "Profile.module" in n or "FollowButton.jsx" in n or "Questions.module" in n:
            print(f"  {n}")
