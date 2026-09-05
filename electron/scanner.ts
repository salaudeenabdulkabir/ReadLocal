import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import type { Book } from '../src/types'

export const supported = (p:string) => ['.pdf','.epub'].includes(path.extname(p).toLowerCase())
export function titleFromFilename(file:string) {
  const raw=path.basename(file,path.extname(file)).replace(/[_]+/g,' ').replace(/\s+-\s+/g,' — ')
  const parts=raw.split(/\s+—\s+|\s+by\s+/i); return { title: parts[0].trim(), author: parts[1]?.trim() || 'Unknown author' }
}
async function walk(dir:string, out:string[]) { for(const e of await fs.readdir(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) await walk(p,out); else if(e.isFile()&&supported(p)) out.push(p) } }
async function hashFile(file:string) { const handle=await fs.open(file,'r'); try { const stat=await handle.stat(); const size=Math.min(stat.size,1024*1024); const buf=Buffer.alloc(size); await handle.read(buf,0,size,0); return crypto.createHash('sha256').update(buf).update(String(stat.size)).digest('hex') } finally { await handle.close() } }
export async function scan(folders:string[], existing:Book[]):Promise<Book[]> {
  const paths:string[]=[]; for(const folder of folders) { try { await walk(folder,paths) } catch {} }
  const byFingerprint=new Map(existing.map(b=>[b.fingerprint,b])); const now=new Date().toISOString(); const found:Book[]=[]
  for(const p of paths) { const s=await fs.stat(p); const fingerprint=crypto.createHash('sha256').update(`${p.toLowerCase()}|${s.size}|${s.mtimeMs}`).digest('hex'); const old=byFingerprint.get(fingerprint); if(old) found.push(old); else { const m=titleFromFilename(p); const contentHash=await hashFile(p); found.push({id:crypto.randomUUID(),fingerprint,contentHash,...m,path:p,format:path.extname(p).slice(1).toLowerCase() as 'pdf'|'epub',addedAt:now,progress:0,favorite:false,status:'unread',collectionIds:[]}) } }
  const groups=new Map<string,Book[]>(); found.forEach(b=>{if(b.contentHash)groups.set(b.contentHash,[...(groups.get(b.contentHash)||[]),b])}); groups.forEach((items,hash)=>items.forEach(b=>b.duplicateGroup=items.length>1?hash:undefined))
  return found
}
