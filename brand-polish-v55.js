(()=>{
  const BANKS=[
    {name:'GlobusPlus',domain:'globusplus.ua',initials:'G',patterns:[/globus\s*plus/i,/globusplus/i]},
    {name:'Акордбанк',domain:'accordbank.com.ua',initials:'А',patterns:[/акордбанк/i,/accord\s*bank/i]},
    {name:'RadaBank',domain:'radabank.com.ua',initials:'R',patterns:[/radabank/i,/радабанк/i]},
    {name:'Unex Bank',domain:'unexbank.ua',initials:'UB',patterns:[/unex/i]},
    {name:'БІЗБАНК',domain:'bisbank.com.ua',initials:'Б',patterns:[/бізбанк/i,/bis24/i,/bis\s*bank/i]},
    {name:'Банк Альянс',domain:'bankalliance.ua',initials:'БА',patterns:[/банк\s+альянс/i,/bank\s+alliance/i,/альянс/i]},
    {name:'Кристалбанк',domain:'crystalbank.com.ua',initials:'К',patterns:[/кристалбанк/i,/crystalbank/i]},
    {name:'МТБ БАНК',domain:'mtb.ua',initials:'МБ',patterns:[/мтб\s*банк/i,/mtb\s*bank/i]},
    {name:'Піреус Банк',domain:'piraeusbank.ua',initials:'ПБ',patterns:[/піреус/i,/piraeus/i]},
    {name:'Ощадбанк',domain:'oschadbank.ua',initials:'О',patterns:[/ощадбанк/i,/ощад/i,/oschad/i]},
    {name:'ТАСКОМБАНК',domain:'tascombank.ua',initials:'Т',patterns:[/таскомбанк/i,/tascombank/i]},
    {name:'UKRSIBBANK',domain:'ukrsibbank.com',initials:'U',patterns:[/ukrsibbank/i,/укрсиббанк/i]},
    {name:'Український капітал',domain:'ukrcapital.com.ua',initials:'УК',patterns:[/український\s+капітал/i,/ukrcapital/i]},
    {name:'OTP Bank',domain:'otpbank.com.ua',initials:'OTP',patterns:[/otp\s*bank/i,/otp/i]},
    {name:'А-Банк',domain:'a-bank.com.ua',initials:'А',patterns:[/а-?банк/i,/a-?bank/i]},
    {name:'Банк Південний',domain:'bank.com.ua',initials:'ПД',patterns:[/банк\s+південний/i,/південний/i]},
    {name:'Райффайзен Банк',domain:'raiffeisen.ua',initials:'Р',patterns:[/райффайзен/i,/raiffeisen/i]},
    {name:'KredoBank',domain:'kredobank.com.ua',initials:'K',patterns:[/kredobank/i,/кредобанк/i]},
    {name:'VST bank',domain:'vstbank.ua',initials:'VST',patterns:[/vst\s*bank/i]},
    {name:'ПриватБанк',domain:'privatbank.ua',initials:'П',patterns:[/приватбанк/i,/privatbank/i]},
    {name:'Sense Bank',domain:'sensebank.com.ua',initials:'S',patterns:[/sense\s*bank/i,/sense/i,/cash.?u/i]},
    {name:'monobank',domain:'monobank.ua',initials:'M',patterns:[/monobank/i,/монобанк/i]},
    {name:'Полікомбанк',domain:'policombank.com',initials:'ПЛ',patterns:[/полікомбанк/i,/policombank/i]},
    {name:'ПУМБ',domain:'pumb.ua',initials:'П',patterns:[/пумб/i,/pumb/i]},
    {name:'Банк Кредит Дніпро',domain:'creditdnepr.com.ua',initials:'БКД',patterns:[/кредит\s+дніпро/i,/credit\s*dnepr/i]},
    {name:'O.Bank',domain:'obank.com.ua',initials:'O',patterns:[/o\.\s*bank/i,/о\.\s*банк/i,/obank/i]}
  ];

  const normalize=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  function findByText(text){
    for(const bank of BANKS){
      if(bank.patterns.some(r=>r.test(text))) return bank;
    }
    return null;
  }
  function findByCode(code, text){
    const c=normalize(code).replace(/[^a-zа-яіїєґ0-9.]/gi,'');
    if(/bis24/i.test(text)||c==='б') return BANKS.find(b=>b.name==='БІЗБАНК');
    if(c==='ба') return BANKS.find(b=>b.name==='Банк Альянс');
    if(c==='ub') return BANKS.find(b=>b.name==='Unex Bank');
    if(c==='id'&&/o\.?bank|о\.?банк/i.test(text)) return BANKS.find(b=>b.name==='O.Bank');
    if((c==='à'||c==='а'||c==='a')&&/друг|кешбек|клієнт/i.test(text)) return BANKS.find(b=>b.name==='А-Банк');
    if(c==='r') return BANKS.find(b=>b.name==='RadaBank');
    if(c==='o'||c==='о') return BANKS.find(b=>b.name==='Ощадбанк');
    if(c==='ов'||c==='otp') return BANKS.find(b=>b.name==='OTP Bank');
    return null;
  }
  function resolveBank(card){
    const datasetText=[card.dataset.bank,card.dataset.bankName,card.getAttribute('data-bank'),card.getAttribute('data-bank-name')].filter(Boolean).join(' ');
    const allText=(datasetText+' '+card.textContent).trim();
    let bank=findByText(allText);
    if(bank) return bank;
    const first=card.firstElementChild?.textContent||'';
    return findByCode(first,allText);
  }

  const st=document.createElement('style');
  st.id='saveflow-brand-polish-v55';
  st.textContent=`
    .sf-bank-brand{display:flex;align-items:center;gap:7px;margin:0 0 10px;color:#173321;font-size:9px;font-weight:800;letter-spacing:.01em}
    .sf-bank-brand img,.sf-brand-fallback{width:22px;height:22px;border-radius:7px;flex:0 0 22px;background:rgba(246,251,246,.72);border:1px solid rgba(190,215,195,.7);box-shadow:0 2px 7px rgba(4,25,12,.08)}
    .sf-bank-brand img{object-fit:contain;padding:3px;box-sizing:border-box}
    .sf-brand-fallback{display:grid;place-items:center;font-size:7px;font-weight:900;color:#214a31}
    .sf-bank-name{font-size:9px;font-weight:800;color:#264331;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sf-old-bank-code{display:none!important}
    .sf-matrix-favicon{width:18px;height:18px;object-fit:contain;border-radius:5px;margin:0 auto 4px;display:block;background:rgba(247,251,247,.58);padding:2px;box-sizing:border-box;border:1px solid rgba(190,215,195,.55)}
  `;
  document.head.appendChild(st);

  function makeBrand(bank){
    const row=document.createElement('div');
    row.className='sf-bank-brand';
    const fallback=document.createElement('span');
    fallback.className='sf-brand-fallback';
    fallback.textContent=bank.initials;
    const img=document.createElement('img');
    img.alt='';
    img.loading='lazy';
    img.referrerPolicy='no-referrer';
    img.src=`https://${bank.domain}/favicon.ico`;
    fallback.style.display='none';
    img.addEventListener('error',()=>{img.remove();fallback.style.display='grid';},{once:true});
    const name=document.createElement('span');
    name.className='sf-bank-name';
    name.textContent=bank.name;
    row.append(img,fallback,name);
    return row;
  }

  function polishCard(card){
    if(card.dataset.sfBankPolished==='1') return;
    const bank=resolveBank(card);
    if(!bank) return;
    const title=card.querySelector('h3,h4,.promo-title,.bonus-title,.card-title');
    const oldMeta=title?.previousElementSibling;
    if(oldMeta && normalize(oldMeta.textContent).length<=8) oldMeta.classList.add('sf-old-bank-code');
    const row=makeBrand(bank);
    if(title) title.insertAdjacentElement('beforebegin',row); else card.prepend(row);
    card.dataset.sfBankPolished='1';
  }

  function polishCards(){
    document.querySelectorAll('.promo-card,.bonus-card').forEach(polishCard);
  }

  // Add missing matrix logos only when we can confidently identify the bank from the header text.
  function polishMatrix(){
    document.querySelectorAll('thead th').forEach(th=>{
      if(th.querySelector('.sf-matrix-favicon,img')) return;
      const bank=findByText(th.textContent||'');
      if(!bank) return;
      const img=document.createElement('img');
      img.className='sf-matrix-favicon';
      img.alt='';
      img.loading='lazy';
      img.referrerPolicy='no-referrer';
      img.src=`https://${bank.domain}/favicon.ico`;
      img.addEventListener('error',()=>img.remove(),{once:true});
      th.prepend(img);
    });
  }

  polishCards();
  polishMatrix();
  const mo=new MutationObserver(()=>{polishCards();polishMatrix();});
  mo.observe(document.body,{childList:true,subtree:true});
})();
