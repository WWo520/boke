"""把本地 SSH 公钥推送到服务器，实现后续 ssh 免密登录。"""
import os
import paramiko

HOST = "47.104.191.199"
PORT = 22
USER = "root"
PASS = "040322"
PUB_PATH = os.path.expanduser(r"~\.ssh\id_ed25519.pub")

with open(PUB_PATH, "r", encoding="utf-8") as f:
    pub_key = f.read().strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, PORT, USER, PASS, timeout=15)

cmds = [
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh",
    # 追加到 authorized_keys（幂等），去重
    f"grep -qxF {repr(pub_key)} ~/.ssh/authorized_keys 2>/dev/null || echo {repr(pub_key)} >> ~/.ssh/authorized_keys",
    "chmod 600 ~/.ssh/authorized_keys",
    "cat ~/.ssh/authorized_keys | wc -l",
    # 配置 ssh 客户端免交互（首次连接时跳过 host key 询问，强制用密钥）
    "echo 'Host 47.104.191.199' >> ~/.ssh/config",
    "echo '    StrictHostKeyChecking no' >> ~/.ssh/config",
    "echo '    UserKnownHostsFile /dev/null' >> ~/.ssh/config",
    "echo '    BatchMode yes' >> ~/.ssh/config",
    "echo '    IdentityFile ~/.ssh/id_ed25519' >> ~/.ssh/config",
    "chmod 600 ~/.ssh/config",
]
out_all = []
for c in cmds:
    _, out, err = ssh.exec_command(c, timeout=10)
    o = out.read().decode().strip()
    e = err.read().decode().strip()
    out_all.append(f"$ {c}\nstdout: {o}\nstderr: {e}")

ssh.close()
print("\n".join(out_all))
print("PUBKEY_PUSH_OK")
