"""用 paramiko SSH 到服务器，本地调用 API 做全链路验证。"""
import paramiko
import json

HOST = "47.104.191.199"
USER = "root"
KEY = r"C:\Users\yz02\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY, timeout=15)

def run(cmd):
    _, out, err = ssh.exec_command(cmd, timeout=15)
    return out.read().decode().strip(), err.read().decode().strip()

# 1. 容器状态
print("===容器状态===")
out, _ = run("docker ps --format 'table {{.Names}}\t{{.Status}}'")
print(out)

# 2. 文章总数
print("\n===文章总数===")
out, _ = run("curl -s 'http://localhost/api/posts?pageSize=1'")
try:
    d = json.loads(out)
    print(f"total: {d['pagination']['total']}, 第一篇: {d['data'][0]['title'] if d['data'] else '(无)'}")
except Exception as e:
    print(f"parse err: {e}, raw: {out[:200]}")

# 3. 登录（Python 构造 JSON，无 shell 转义问题）
print("\n===登录测试===")
body = json.dumps({"email": "admin@moke.com", "password": "password123"})
# 用 heredoc 方式传 body 给 curl，避免任何 shell 转义
cmd = f"""python3 -c "
import urllib.request
req = urllib.request.Request('http://localhost/api/auth/login', data=b'''{body}''', headers={{'Content-Type':'application/json'}})
with urllib.request.urlopen(req, timeout=5) as r:
    print(r.read().decode())
" """
out, err = run(cmd)
print(f"out: {out[:200]}")
if err:
    print(f"err: {err[:200]}")

# 4. 健康检查
print("\n===健康检查===")
for path in ("/healthz", "/readyz"):
    out, _ = run(f"curl -s http://localhost{path}")
    print(f"  {path}: {out}")

ssh.close()
print("\n完成。")
