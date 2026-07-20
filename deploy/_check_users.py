import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.104.191.199', username='root', key_filename=r'C:\Users\yz02\.ssh\id_ed25519', timeout=15)
def q(sql):
    cmd = f'docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL moke-postgres psql -U moke -d moke_blog -t -c "{sql}"'
    _, out, err = ssh.exec_command(cmd, timeout=15)
    return out.read().decode().strip()
print('用户总数:', q('SELECT COUNT(*) FROM users'))
print('---用户列表---')
print(q('SELECT id, name, email, role FROM users ORDER BY id'))
print('---有文章的用户(真实作者)---')
print(q('SELECT u.id, u.name, COUNT(p.id) AS posts FROM users u LEFT JOIN posts p ON p."authorId" = u.id GROUP BY u.id, u.name ORDER BY u.id'))
ssh.close()
