"""用 bcryptjs 生成的正确 hash 重置 wwwxx / www 密码为 password123。"""
import paramiko

NEW_HASH = "$2a$10$F46pjedm24oB6oDs/dWN7.fpis6B94N4zy0IDL9mk1QIMJvtOh0pG"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("47.104.191.199", username="root", key_filename=r"C:\Users\yz02\.ssh\id_ed25519", timeout=15)

# 更新 user id=2, 3
sql = f"UPDATE users SET password = '{NEW_HASH}' WHERE id IN (2, 3);"
cmd = (
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    f"psql -U moke -d moke_blog -c \"{sql}\""
)
_, out, err = ssh.exec_command(cmd, timeout=15)
print(f"UPDATE:\n{out.read().decode().strip()}")
print(err.read().decode().strip())

ssh.close()
print("完成，下一步用 3 个账号登录测试。")
