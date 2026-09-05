import { create } from 'zustand'
import type { AppData, Book, Settings } from './types'
type State=AppData&{loaded:boolean;refresh:()=>Promise<void>;patchBook:(id:string,p:Partial<Book>)=>Promise<void>;patchSettings:(p:Partial<Settings>)=>Promise<void>}
const empty:AppData={books:[],bookmarks:[],notes:[],highlights:[],collections:[],sessions:[],settings:{folders:[],theme:'light',dailyGoalMinutes:30,focusShelfLimit:3,focusShelf:[]}}
export const useApp=create<State>((set,get)=>({...empty,loaded:false,refresh:async()=>set({...await window.readlocal.getData(),loaded:true}),patchBook:async(id,p)=>{const b=await window.readlocal.updateBook(id,p);set({books:get().books.map(x=>x.id===id?b:x)})},patchSettings:async p=>{const settings=await window.readlocal.saveSettings(p);set({settings})}}))
