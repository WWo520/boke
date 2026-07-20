"""把服务器 user id=2 (wwwxx) 的密码重置为 password123，方便登录。"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("47.104.191.199", username="root", key_filename=r"C:\Users\yz02\.ssh\id_ed25519", timeout=15)

# 用 bcryptjs 在 Node 里生成 $2a$ 前缀的 hash（与服务端一致）
# 先本地用 Python bcrypt 生成 $2b$ hash，再 sed 替换为 $2a$（两者兼容）
import bcrypt
new_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt(10)).decode()
# $2b$ -> $2a$ (bcryptjs 用的是 $2a$)
new_hash = new_hash.replace("$2b$", "$2a$")
print(f"新 hash: {new_hash}")

# 构造 SQL 命令
sql = f"""UPDATE users SET password = '{new_hash}' WHERE id = 2;"""
cmd = (
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    f"psql -U moke -d moke_blog -c \"{sql}\""
)
_, out, err = ssh.exec_command(cmd, timeout=15)
print(f"UPDATE 输出:\n{out.read().decode().strip()}")
print(err.read().decode().strip())

# 验证
cmd2 = (
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    "psql -U moke -d moke_blog -c \"SELECT id, name, email, LEFT(password, 15) as pwd FROM users ORDER BY id\""
)
_, out, err = ssh.exec_command(cmd2, timeout=15)
print(f"\n===验证===")
print(out.read().decode().strip())

ssh.close()
