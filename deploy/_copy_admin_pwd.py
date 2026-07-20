"""复制 admin 密码 hash 到 wwwxx / www（保证 3 账号都能登录）。"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("47.104.191.199", username="root", key_filename=r"C:\Users\yz02\.ssh\id_ed25519", timeout=15)

sql = "UPDATE users SET password = (SELECT password FROM (SELECT password FROM users WHERE id = 1) AS src) WHERE id IN (2, 3);"
cmd = (
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    f'psql -U moke -d moke_blog -c "{sql}"'
)
_, out, err = ssh.exec_command(cmd, timeout=15)
print("UPDATE:", out.read().decode().strip())
print(err.read().decode().strip())

# 验证：3 个用户的密码 hash 应该相同
cmd2 = (
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    'psql -U moke -d moke_blog -c "SELECT id, name, email, password FROM users ORDER BY id"'
)
_, out, err = ssh.exec_command(cmd2, timeout=15)
print("\n===验证 3 用户密码 hash===")
print(out.read().decode().strip())

ssh.close()
