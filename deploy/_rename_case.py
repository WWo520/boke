"""Windows 下可靠的文件大小写重命名。

Windows 的 PowerShell Rename-Item 在 NTFS case-insensitive 卷上改大小写常常不生效。
这里用 os.rename 的两步法（先改成临时名，再改成目标名）绕开。
"""
import os
import sys

BASE = r"D:\develop\qoder_project\blog_demo\src"

# (当前在磁盘的实际大小写, 目标大小写)
RENAMES = [
    # FollowButton 组件 jsx 文件
    (os.path.join(BASE, r"components\FollowButton\followbutton.jsx"),
     os.path.join(BASE, r"components\FollowButton\FollowButton.jsx")),
    # css_pages 中活跃代码期望大写
    (os.path.join(BASE, r"css_pages\questions.module.css"),
     os.path.join(BASE, r"css_pages\Questions.module.css")),
    (os.path.join(BASE, r"css_pages\rankings.module.css"),
     os.path.join(BASE, r"css_pages\Rankings.module.css")),
    (os.path.join(BASE, r"css_pages\userpage.module.css"),
     os.path.join(BASE, r"css_pages\UserPage.module.css")),
    (os.path.join(BASE, r"css_pages\columnlist.module.css"),
     os.path.join(BASE, r"css_pages\ColumnList.module.css")),
    (os.path.join(BASE, r"css_pages\columndetail.module.css"),
     os.path.join(BASE, r"css_pages\ColumnDetail.module.css")),
    (os.path.join(BASE, r"css_pages\questionform.module.css"),
     os.path.join(BASE, r"css_pages\QuestionForm.module.css")),
    (os.path.join(BASE, r"css_pages\questiondetail.module.css"),
     os.path.join(BASE, r"css_pages\QuestionDetail.module.css")),
    (os.path.join(BASE, r"css_pages\notfound.module.css"),
     os.path.join(BASE, r"css_pages\NotFound.module.css")),
]


def rename_case_insensitive(src, dst):
    """在 Windows case-insensitive 文件系统上可靠地改大小写。"""
    # 已经匹配目标大小写
    if os.path.exists(dst) and os.path.normcase(dst) == os.path.normcase(src):
        # 检查真实大小写是否已一致
        real = os.path.basename(os.path.realpath(dst))
        if real == os.path.basename(dst):
            return f"skip (already): {real}"
    tmp = src + ".__RENAME_TMP__"
    if os.path.exists(tmp):
        os.remove(tmp)
    if not os.path.exists(src):
        return f"NOT FOUND: {src}"
    os.rename(src, tmp)
    os.rename(tmp, dst)
    # 验证
    real = os.path.basename(os.path.realpath(dst))
    return f"OK: {real}"


for src, dst in RENAMES:
    result = rename_case_insensitive(src, dst)
    print(f"  {result}  <-  {os.path.basename(dst)}")

# 验证最终文件名
print("\n=== 验证 css_pages 目录 ===")
for f in sorted(os.listdir(os.path.join(BASE, "css_pages"))):
    if f.lower().endswith(".module.css"):
        print(f"  {f}")

print("\n=== 验证 FollowButton 目录 ===")
for f in sorted(os.listdir(os.path.join(BASE, "components", "FollowButton"))):
    print(f"  {f}")
