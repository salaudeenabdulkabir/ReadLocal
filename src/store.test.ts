import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Store } from '../electron/store'

describe('durable store',()=>{
  it('serializes concurrent mutations without losing data',async()=>{
    const dir=await fs.mkdtemp(path.join(os.tmpdir(),'readlocal-store-'))
    try {
      const store=new Store(path.join(dir,'data.json'))
      await Promise.all(Array.from({length:20},(_,i)=>store.collection(`Collection ${i}`)))
      const data=await store.read()
      expect(data.collections).toHaveLength(20)
      expect(new Set(data.collections.map(x=>x.name)).size).toBe(20)
    } finally { await fs.rm(dir,{recursive:true,force:true}) }
  })
})
