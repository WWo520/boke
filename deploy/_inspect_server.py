"""服务器 DB 用户情况 + 文章 status 统计。"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("47.104.191.199", username="root", key_filename=r"C:\Users\yz02\.ssh\id_ed25519", timeout=15)

def run(cmd):
    _, out, err = ssh.exec_command(cmd, timeout=15)
    return out.read().decode().strip(), err.read().decode().strip()

print("===服务器 users 表===")
out, _ = run(
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    "psql -U moke -d moke_blog -c "
    "\"SELECT id, name, email, role, LEFT(password, 15) as pwd FROM users ORDER BY id\""
)
print(out)

print("\n===文章 status 分布===")
out, _ = run(
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    "psql -U moke -d moke_blog -c "
    "\"SELECT status, COUNT(*) FROM posts GROUP BY status ORDER BY status\""
)
print(out)

print("\n===user_follows 明细===")
out, _ = run(
    "docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres "
    "psql -U moke -d moke_blog -c "
    "\"SELECT \\\"userId\\\", \\\"followId\\\" FROM user_follows ORDER BY id\""
)
print(out)

ssh.close()
