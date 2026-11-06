import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { emptyState, type State } from './model.ts';
export interface Repository { transact<T>(tenant: string, fn: (state: State) => T): Promise<T>; read?(tenant: string): Promise<State>; }
const key = (v: string) => createHash('sha256').update(v).digest('hex');
// Local development only. Firestore is required for Cloud Run/multiple instances.
export class FileRepository implements Repository {
  private queue: Promise<unknown> = Promise.resolve();
  private directory: string;
  constructor(directory: string) {
    this.directory = directory;
  }
  async read(tenant: string): Promise<State> {
    const file = resolve(this.directory, key(tenant)+'.json');
    try {return JSON.parse(await readFile(file,'utf8')) as State;}
    catch(e:any) {if (e.code==='ENOENT') return emptyState(); throw e;}
  }
  transact<T>(tenant: string, fn: (state: State) => T): Promise<T> {
    const run = this.queue.then(async () => {
      await mkdir(this.directory, {recursive: true});
      const file = resolve(this.directory, `${key(tenant)}.json`);
      let state: State;
      try { state = JSON.parse(await readFile(file, 'utf8')); }
      catch (e: any) { if (e.code !== 'ENOENT') throw e; state = emptyState(); }
      const result = fn(state);
      await writeFile(`${file}.tmp`, JSON.stringify(state), {mode: 0o600});
      await rename(`${file}.tmp`, file);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
export async function repository(): Promise<Repository> {
  if (process.env.STORAGE_DRIVER === 'firestore') {
    const {Firestore} = await import('@google-cloud/firestore');
    const db = new Firestore();
    return {
      read: async tenant => {
        const snap = await db.collection('alertPilotTenants').doc(key(tenant)).get();
        return (snap.data() as State | undefined) || emptyState();
      },
      transact: (tenant, fn) => db.runTransaction(async tx => {
      const ref = db.collection('alertPilotTenants').doc(key(tenant));
      const snap = await tx.get(ref);
      const state = (snap.data() as State | undefined) || emptyState();
      const result = fn(state);
      // Bounded pilot aggregate. Stop safely rather than hit Firestore's document limit.
      if (Buffer.byteLength(JSON.stringify(state)) > 800_000) throw new Error('Pilot capacity reached; archive before continuing');
      tx.set(ref, state);
      return result;
    })};
  }
  const isProd = process.env.NODE_ENV === 'production' && !process.env.K_SERVICE?.startsWith('ais-dev');
  if (isProd) throw new Error('Production storage is not configured. Set STORAGE_DRIVER=firestore and grant Firestore access to the service account.');
  return new FileRepository(process.env.DATA_DIR || '.data');
}
