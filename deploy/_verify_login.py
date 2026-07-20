"""SSH 到服务器，用 subprocess 本地调 API，无任何 shell 转义。"""
import paramiko
import subprocess

HOST = "47.104.191.199"
USER = "root"
KEY = r"C:\Users\yz02\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY, timeout=15)

# 把一段 Python 测试脚本传到服务器 /tmp，再 docker exec 进 server 容器执行
# 这样所有 HTTP 请求都在服务器本地发起，无需公网，也无 shell 转义
TEST_SCRIPT = r'''
import urllib.request, json

BASE = "http://localhost"  # nginx 80 -> server 3333

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())

def get(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())

print("===文章总数===")
d = get(f"{BASE}/api/posts?pageSize=1")
print(f"total: {d['pagination']['total']}")
if d["data"]:
    print(f"第一篇: {d['data'][0]['title']}")

print("\n===登录 admin@moke.com===")
login = post(
    f"{BASE}/api/auth/login",
    {"email": "admin@moke.com", "password": "password123"},
)
token = login["data"]["token"]
print(f"登录成功: user={login['data']['user']['name']}, role={login['data']['user']['role']}, token 长度={len(token)}")

print("\n===带 token 访问 /api/auth/me===")
req = urllib.request.Request(
    f"{BASE}/api/auth/me",
    headers={"Authorization": f"Bearer {token}"},
)
with urllib.request.urlopen(req, timeout=10) as r:
    me = json.loads(r.read().decode())
print(f"me: name={me['data']['name']}, email={me['data']['email']}")

print("\n===健康检查===")
print("healthz:", get(f"{BASE}/healthz"))
print("readyz:", get(f"{BASE}/readyz"))

print("\n===分类===")
cats = get(f"{BASE}/api/categories")
print(f"分类数: {len(cats['data'])}, 第一个: {cats['data'][0]['name']}")
'''

# 写脚本到服务器 /tmp
sftp = ssh.open_sftp()
with sftp.file("/tmp/_verify_api.py", "w") as f:
    f.write(TEST_SCRIPT)
sftp.close()

# 在 server 容器内执行（alpine 可能没 python，先检查）
print("--- 容器内 python 可用性 ---")
_, out, err = ssh.exec_command("docker exec moke-server which python3 2>&1; docker exec moke-server python3 --version 2>&1")
print(out.read().decode())
print(err.read().decode())

print("--- 在宿主机执行验证脚本 ---")
_, out, err = ssh.exec_command("python3 /tmp/_verify_api.py 2>&1")
print(out.read().decode())
print(err.read().decode())

ssh.close()
