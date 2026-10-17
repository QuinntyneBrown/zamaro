import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Storage } from '@/server/contracts/storage';

/** A disk on the local file system: keys are paths under the root, never outside it. */
export class LocalDisk implements Storage {
  constructor(readonly root: string) {}

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.path(key));
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.path(key));
    } catch {
      return null;
    }
  }

  async put(key: string, contents: Buffer | string): Promise<void> {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }

  async list(prefix = ''): Promise<string[]> {
    const base = prefix === '' ? this.root : this.path(prefix);
    let entries: string[];
    try {
      entries = (await readdir(base, { recursive: true, withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => join(entry.parentPath, entry.name));
    } catch {
      return [];
    }
    return entries.map((path) => relative(this.root, path).split(sep).join('/'));
  }

  /** The absolute path of a key; a key that escapes the root is refused. */
  path(key: string): string {
    const path = resolve(this.root, key);
    if (path !== this.root && !path.startsWith(this.root + sep)) {
      throw new Error(`The key ${key} is outside the disk.`);
    }
    return path;
  }
}
