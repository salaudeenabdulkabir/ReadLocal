import { useEffect,useRef,useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ChevronLeft, ChevronRight, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react'

GlobalWorkerOptions.workerSrc=workerUrl

export function PdfReader({url,initialPage,onPosition}:{url:string;initialPage:number;onPosition:(page:number,total:number)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null),documentRef=useRef<PDFDocumentProxy|null>(null),renderTask=useRef<any>(null)
  const[page,setPage]=useState(Math.max(1,initialPage||1)),[pages,setPages]=useState(0),[scale,setScale]=useState(1.25),[loading,setLoading]=useState(true),[error,setError]=useState('')
  useEffect(()=>{let disposed=false;const task=getDocument(url);task.promise.then(pdf=>{if(disposed)return;documentRef.current=pdf;setPages(pdf.numPages);setPage(p=>Math.min(p,pdf.numPages));setLoading(false)}).catch(e=>{if(!disposed){setError(e instanceof Error?e.message:'Unable to open PDF');setLoading(false)}});return()=>{disposed=true;renderTask.current?.cancel();task.destroy()}},[url])
  useEffect(()=>{const pdf=documentRef.current;if(!pdf||!canvas.current||!pages)return;let cancelled=false;pdf.getPage(page).then(p=>{if(cancelled)return;const viewport=p.getViewport({scale});const el=canvas.current!;const ratio=window.devicePixelRatio||1;el.width=Math.floor(viewport.width*ratio);el.height=Math.floor(viewport.height*ratio);el.style.width=`${viewport.width}px`;el.style.height=`${viewport.height}px`;const ctx=el.getContext('2d')!;ctx.setTransform(ratio,0,0,ratio,0,0);renderTask.current=p.render({canvasContext:ctx,viewport});return renderTask.current.promise}).then(()=>{if(!cancelled)onPosition(page,pages)}).catch((e:any)=>{if(e?.name!=='RenderingCancelledException')setError('Could not render this page')});return()=>{cancelled=true;renderTask.current?.cancel()}},[page,pages,scale])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft')setPage(p=>Math.max(1,p-1));if(e.key==='ArrowRight')setPage(p=>Math.min(pages||p,p+1))};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[pages])
  if(error)return <div className="pdf-state"><p>{error}</p></div>
  return <div className="pdf-reader">{loading?<div className="pdf-state"><LoaderCircle className="spin"/> Opening PDF…</div>:<><div className="pdf-page"><canvas ref={canvas}/></div><div className="pdf-controls"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button><span>Page <input aria-label="Page" type="number" min="1" max={pages} value={page} onChange={e=>setPage(Math.max(1,Math.min(pages,+e.target.value||1)))}/> of {pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button><button onClick={()=>setScale(s=>Math.max(.6,s-.15))}><ZoomOut/></button><button onClick={()=>setScale(s=>Math.min(2.5,s+.15))}><ZoomIn/></button></div></>}</div>
}
