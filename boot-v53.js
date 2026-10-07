(async()=>{
  try{
    if(typeof DecompressionStream==='undefined') throw new Error('Цей браузер не підтримує DecompressionStream. Онови браузер і спробуй ще раз.');
    const parts=await Promise.all(Array.from({length:7},(_,i)=>fetch(`assets/v52-${String(i).padStart(2,'0')}.txt`,{cache:'no-store'}).then(r=>{
      if(!r.ok) throw new Error(`Не вдалося завантажити частину ${i}: HTTP ${r.status}`);
      return r.text();
    })));
    const b64=parts.join('').replace(/\s+/g,'');
    const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const ds=new DecompressionStream('gzip');
    let html=await new Response(new Blob([bin]).stream().pipeThrough(ds)).text();
    const patchTag='<script src="/v53-patch.js?v=537"></'+'script><script src="/theme-v54.js?v=543"></'+'script><script src="/brand-registry-v56.js?v=564"></'+'script><script src="/global-cloud-v57.js?v=573"></'+'script><script src="/scanner-review-v58.js?v=614"></'+'script><script src="/bank-assets-1.js?v=601"></'+'script><script src="/bank-assets-2.js?v=601"></'+'script><script src="/bank-assets-3.js?v=601"></'+'script><script src="/bank-assets-4.js?v=601"></'+'script><script src="/logo-text-v59.js?v=602"></'+'script><script src="/matrix-official-fixes-v61.js?v=613"></'+'script>';
    html=html.replace('</body>',patchTag+'</body>');
    document.open();
    document.write(html);
    document.close();
  }catch(e){
    console.error(e);
    document.body.innerHTML=`<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:48px auto;padding:24px"><h2>Не вдалося завантажити SaveFlow</h2><p style="color:#727970">${String(e&&e.message?e.message:e)}</p></div>`;
  }
})();