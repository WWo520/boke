"""验证 SSR 是否成功：容器内请求 localhost:3000，看是否返回了文章数量。"""
import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("47.104.191.199", username="root", key_filename=r"C:\Users\yz02\.ssh\id_ed25519", timeout=15)

print("===环境变量===")
_, out, _ = ssh.exec_command("docker exec moke-web printenv NEXT_PUBLIC_API_URL")
print(out.read().decode().strip())

print("\n===容器内请求 SSR HTML===")
_, out, _ = ssh.exec_command("docker exec moke-web wget -qO- --timeout=15 http://localhost:3000/ 2>&1")
html = out.read().decode("utf-8", errors="replace")
print(f"HTML 长度: {len(html)} bytes")

# 关键指标
stat_nums = re.findall(r'heroStatNum[^>]*>([^<]+)<', html)
print(f"heroStatNum 值: {stat_nums}")

if "暂无文章" in html:
    print("❌ 找到 '暂无文章' —— SSR 仍未拿到文章")
else:
    print("✅ 未找到 '暂无文章'")

# 提取前几篇文章标题
titles = re.findall(r'<h3[^>]*>([^<]+)</h3>', html)
print(f"\n前 5 篇文章标题: {titles[:5]}")

# 找分类卡片
cat_names = re.findall(r'heroCatName[^>]*>([^<]+)<', html)
print(f"分类: {cat_names}")

ssh.close()
