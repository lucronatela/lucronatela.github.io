/* Aviso ao ADM independente do download: sem cookies, contatos ou aumento de usuários. */
(function () {
  'use strict';
  const endpoint = 'https://mlybfscgescpkfyzrloi.supabase.co/functions/v1/lnt-download-request';
  let running = false;
  let lastAttempt = 0;
  async function notifyRequest() {
    if (running || Date.now() - lastAttempt < 10000 || !window.crypto || !crypto.subtle) return;
    running = true; lastAttempt = Date.now();
    try {
      const response = await fetch(endpoint, {cache:'no-store', credentials:'omit', signal:AbortSignal.timeout(5000)});
      if (!response.ok) return;
      const data = await response.json();
      if (data.difficulty !== 16 || typeof data.id !== 'string' || typeof data.expires !== 'number' || typeof data.signature !== 'string') return;
      const encoder = new TextEncoder();
      const until = Date.now() + 8000;
      let proof = null;
      for (let base=0;base<16777216 && Date.now()<until && !proof;base+=32) {
        const counters = Array.from({length:32},(_,i)=>base+i);
        const hashes = await Promise.all(counters.map(counter=>crypto.subtle.digest('SHA-256',encoder.encode(data.id+':'+data.expires+':'+counter))));
        const winner = hashes.findIndex(hash=>{const bytes=new Uint8Array(hash);return bytes[0]===0 && bytes[1]===0;});
        if(winner>=0) proof = {id:data.id,expires:data.expires,signature:data.signature,counter:counters[winner]};
        if(base%1024===0) await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(!proof) return;
      await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(proof),keepalive:true,signal:AbortSignal.timeout(5000)});
    } catch (_) { /* A falha no aviso jamais impede o download do APK. */ }
    finally {running=false;}
  }
  document.addEventListener('click',function(event){
    if(!event.isTrusted || event.defaultPrevented || (event.button!==undefined && event.button!==0)) return;
    const link = event.target.closest && event.target.closest('a[href]');
    if(!link) return;
    try {
      const url = new URL(link.href, location.href);
      if(url.hostname!=='github.com' || !url.pathname.startsWith('/pellegriny2020/pellegriny-piloto-atualizacoes/releases/download/') || !/\.apk$/i.test(url.pathname)) return;
      void notifyRequest();
    } catch (_) {}
  },true);
})();
