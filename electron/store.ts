import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import type { AppData, Book, Bookmark, Note, Highlight, Session, Settings, Collection } from '../src/types'

const defaults: AppData = { books: [], bookmarks: [], notes: [], highlights: [], collections: [], sessions: [], settings: { folders: [], theme: 'light', dailyGoalMinutes: 30, focusShelfLimit: 3, focusShelf: [] } }

export class Store {
  private mutationQueue: Promise<unknown> = Promise.resolve()
  constructor(private file: string) {}
  async read(): Promise<AppData> {
    try { const saved=JSON.parse(await fs.readFile(this.file, 'utf8')); return { ...defaults, ...saved, settings:{...defaults.settings,...saved.settings} } }
    catch { await this.write(defaults); return structuredClone(defaults) }
  }
  async write(data: AppData) {
    await fs.mkdir(path.dirname(this.file), { recursive: true })
    const temp = `${this.file}.${process.pid}.${crypto.randomUUID()}.tmp`
    await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8')
    await fs.rename(temp, this.file)
  }
  async mutate<T>(fn: (data: AppData) => T): Promise<T> {
    const operation=this.mutationQueue.then(async()=>{const d=await this.read();const out=fn(d);await this.write(d);return out})
    this.mutationQueue=operation.then(()=>undefined,()=>undefined)
    return operation
  }
  async replaceLibrary(folders:string[], books:Book[]) { return this.mutate(d=>{d.books=books;d.settings.folders=folders;return books}) }
  async updateBook(id: string, patch: Partial<Book>) { return this.mutate(d => { const b=d.books.find(x=>x.id===id); if(!b) throw Error('Book not found'); Object.assign(b, patch); return b }) }
  async settings(patch: Partial<Settings>) { return this.mutate(d => Object.assign(d.settings, patch)) }
  async bookmark(input: Omit<Bookmark,'id'|'createdAt'>) { return this.mutate(d => { const v={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()}; d.bookmarks.push(v); return v }) }
  async note(input: Omit<Note,'id'|'createdAt'|'updatedAt'>) { return this.mutate(d => { const now=new Date().toISOString(); const v={...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now}; d.notes.push(v); return v }) }
  async highlight(input: Omit<Highlight,'id'|'createdAt'>) { return this.mutate(d => { const v={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()}; d.highlights.push(v); return v }) }
  async collection(name: string) { return this.mutate(d => { const v:Collection={id:crypto.randomUUID(),name,createdAt:new Date().toISOString()}; d.collections.push(v); return v }) }
  async session(input: Omit<Session,'id'>) { return this.mutate(d => { const v={...input,id:crypto.randomUUID()}; d.sessions.push(v); return v }) }
  async remove(kind: 'bookmarks'|'notes'|'highlights', id:string) { await this.mutate(d => { d[kind]=d[kind].filter((x:any)=>x.id!==id) as any; return null }) }
  async removeCollection(id:string) { await this.mutate(d=>{d.collections=d.collections.filter(x=>x.id!==id);d.books.forEach(b=>b.collectionIds=b.collectionIds.filter(x=>x!==id));return null}) }
}
