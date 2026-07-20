"""扫描导出的 SQL，找出引用的 /uploads/ 图片，检查本地是否存在，生成同步清单。"""
import re
import os
import shutil

SQL = r"d:\develop\qoder_project\blog_demo\deploy\user-data-migration.sql"
LOCAL_UPLOADS = r"d:\develop\qoder_project\blog_demo\server\uploads"
STAGING = r"d:\develop\qoder_project\blog_demo\deploy\uploads-to-sync"

with open(SQL, "r", encoding="utf-8") as f:
    text = f.read()

# 找所有 /uploads/xxx.png / .jpg / .webp / .svg 等
refs = sorted(set(re.findall(r"/uploads/[A-Za-z0-9_\-]+\.\w+", text)))
print(f"SQL 共引用 {len(refs)} 个图片路径")

# 去重 + 检查本地
os.makedirs(STAGING, exist_ok=True)
found, missing = [], []
for ref in refs:
    fn = ref.split("/")[-1]
    local = os.path.join(LOCAL_UPLOADS, fn)
    if os.path.exists(local):
        shutil.copy2(local, os.path.join(STAGING, fn))
        sz = os.path.getsize(local)
        found.append((fn, sz))
        print(f"OK      {fn:40s} {sz:>8} bytes")
    else:
        missing.append(fn)
        print(f"MISSING {fn}")

print(f"\n找到 {len(found)} / 缺失 {len(missing)}")
print(f"已把找到的图片复制到 {STAGING}/，待会 scp 到服务器")
