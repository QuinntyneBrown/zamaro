import { resolve } from 'node:path';
import { config } from '@config/zamaro';
import type { DiskName, Storage } from '@/server/contracts/storage';
import { LocalDisk } from './local-disk';

const disks = new Map<DiskName, Storage>();

/**
 * The named disks (ADR-0024): `media` is served under /media in development and e2e; the others
 * are never served. Each is a folder under ZAMARO_STORAGE_ROOT until object storage arrives.
 */
export function disk(name: DiskName): Storage {
  let instance = disks.get(name);
  if (instance === undefined) {
    instance = new LocalDisk(resolve(config().storageRoot, name));
    disks.set(name, instance);
  }
  return instance;
}
