import { copyFile, unlink } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root=process.env.ZANA_REPO_ROOT;
if(!root)throw new Error('Set ZANA_REPO_ROOT to a Zana source checkout');
const here=dirname(fileURLToPath(import.meta.url));
const name=`ports-check-${process.pid}.spec.ts`;
const staged=join(root,'e2e',name);
await copyFile(join(here,'ports-live.spec.txt'),staged);
try{
 const child=spawn('pnpm',[process.argv.includes('--existing-build')?'test:e2e:only':'test:e2e','--',`e2e/${name}`,...(process.argv.includes('--ports-only')?[]:['e2e/plugin-authoring-live.spec.ts','e2e/packaged-provider-startup.spec.ts']),'--workers=1'],{cwd:root,stdio:'inherit',env:{...process.env,BB_PORTS_ROOT:resolve(here,'../..')}});
 process.exitCode=await new Promise((r,j)=>{child.once('error',j);child.once('exit',code=>r(code??1))});
}finally{await unlink(staged)}
