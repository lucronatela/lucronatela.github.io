const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const source=fs.readFileSync('assets/download-notifications.js','utf8');
function setup(fail=false){let click;const calls=[];const c={console,URL,TextEncoder,Uint8Array,AbortSignal,setTimeout,Date,location:{href:'https://lucronatela.github.io/'},document:{addEventListener:(type,fn)=>{click=fn}},crypto:{subtle:{digest:async()=>new Uint8Array(32).buffer}}};c.window=c;c.fetch=async(url,options)=>{calls.push({url,options});if(fail)throw Error('offline');return {ok:true,json:async()=>({id:'550e8400-e29b-41d4-a716-446655440000',expires:1800000000,signature:'a'.repeat(64),difficulty:16})}};vm.runInNewContext(source,c);return {calls,click};}
const apk='https://github.com/pellegriny2020/pellegriny-piloto-atualizacoes/releases/download/v1077/Lucro-na-Tela-Pro-v19.apk';
function event(href=apk){return {isTrusted:true,button:0,defaultPrevented:false,target:{closest:()=>({href})},preventDefault(){throw Error('Download foi bloqueado')}};}
const tick=()=>new Promise(resolve=>setTimeout(resolve,30));
test('avisa somente no clique real no APK e não altera o download',async()=>{const c=setup();c.click(event());await tick();assert.equal(c.calls.length,2);assert.equal(c.calls[1].options.method,'POST');assert.ok(JSON.parse(c.calls[1].options.body).signature);});
test('visitas, links de navegação e cliques programáticos não notificam',async()=>{const c=setup();c.click(event('https://lucronatela.github.io/?page=download'));c.click({...event(),isTrusted:false});await tick();assert.equal(c.calls.length,0);});
test('clique duplo é coalescido',async()=>{const c=setup();c.click(event());c.click(event());await tick();assert.equal(c.calls.length,2);});
test('falha da integração não impede o link nem produz rejeição não tratada',async()=>{const c=setup(true);assert.doesNotThrow(()=>c.click(event()));await tick();assert.equal(c.calls.length,1);});
