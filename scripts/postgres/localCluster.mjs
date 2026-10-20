import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {execFileSync} from 'node:child_process';
export async function createLocalCluster() {
  const bin=process.env.SHINKA_PG_BIN||'/opt/homebrew/opt/postgresql@17/bin';
  const version=execFileSync(path.join(bin,'postgres'),['--version'],{stdio:'pipe'}).toString().trim().replace('postgres (PostgreSQL) ','');
  if(!version.startsWith('17.'))throw new Error('LOCAL_POSTGRESQL_17_REQUIRED');
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'shinka-postgres-test-'));
  await fs.chmod(directory,0o700);
  const server=net.createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  const data=path.join(directory,'data');
  execFileSync(path.join(bin,'initdb'),['-D',data,'-A','trust','-U','shinka_test_bootstrap','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  await fs.appendFile(path.join(data,'postgresql.conf'),`\nlisten_addresses='127.0.0.1'\nport=${port}\nunix_socket_directories='${directory}'\nlog_statement='none'\nlog_min_error_statement='panic'\n`);
  const start=()=>execFileSync(path.join(bin,'pg_ctl'),['-D',data,'-l',path.join(directory,'server.log'),'-w','start'],{stdio:'pipe'});
  const stop=(mode='fast')=>execFileSync(path.join(bin,'pg_ctl'),['-D',data,'-m',mode,'-w','stop'],{stdio:'pipe'});
  start();
  return {directory,port,bin,data,version,url:`postgresql://shinka_test_bootstrap@127.0.0.1:${port}/postgres`,
    restart:()=>{stop('immediate');start();},stop};
}
