(()=>{
  const norm=s=>String(s||'').trim().toLocaleLowerCase('uk-UA');
  let busy=false;

  function fields(){
    const card=document.querySelector('.auth-card')||document;
    const email=card.querySelector('#authEmail,#authEmailInput,input[type="email"],input[name="email"]');
    const password=card.querySelector('#authPassword,#authPasswordInput,input[type="password"],input[name="password"]');
    return {card,email,password};
  }
  function message(text,ok=false){
    const el=document.getElementById('authMessage');
    if(!el)return;
    el.textContent=text||'';
    el.dataset.state=ok?'ok':'';
  }
  function isLoginButton(btn){
    if(!btn)return false;
    const t=norm(btn.textContent);
    return t==='увійти'||t.startsWith('увійти ');
  }
  async function login(btn){
    if(busy)return;
    const {email,password}=fields();
    if(!email||!password)return;
    const emailValue=String(email.value||'').trim();
    const passwordValue=String(password.value||'');
    if(!emailValue||!passwordValue){
      message('Введи email і пароль.');
      return;
    }
    const cloud=window.saveflowCloud;
    const client=cloud?.client;
    if(!client?.auth?.signInWithPassword){
      message('Сервіс входу ще не завантажився. Онови сторінку.');
      return;
    }
    busy=true;
    if(btn)btn.disabled=true;
    message('Входимо…');
    try{
      const {data,error}=await client.auth.signInWithPassword({email:emailValue,password:passwordValue});
      if(error){
        const code=String(error.code||'');
        if(code==='invalid_credentials')message('Невірний email або пароль.');
        else if(code==='email_not_confirmed')message('Email ще не підтверджено.');
        else message(error.message||'Не вдалося увійти.');
        return;
      }
      if(!data?.session?.user){
        message('Не вдалося створити сесію.');
        return;
      }
      let profile=null;
      try{
        const {data:p}=await client.from('profiles').select('id,role,display_name').eq('id',data.session.user.id).maybeSingle();
        profile=p||null;
      }catch(_){}
      if(window.saveflowCloud){
        window.saveflowCloud.session=data.session;
        if(profile)window.saveflowCloud.profile=profile;
      }
      window.saveflowAuthState=Object.assign({},window.saveflowAuthState||{},{
        session:data.session,
        profile:profile||window.saveflowCloud?.profile||null
      });
      window.dispatchEvent(new CustomEvent('saveflow-auth-change',{detail:{session:data.session,profile}}));
      message('');
    }catch(e){
      console.warn('SaveFlow auth hotfix',e);
      message('Не вдалося з’єднатися із сервісом входу.');
    }finally{
      busy=false;
      if(btn)btn.disabled=false;
    }
  }

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button,input[type="submit"]');
    if(!isLoginButton(btn))return;
    const {email,password}=fields();
    if(!email||!password)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    login(btn);
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    const {card,email,password}=fields();
    if(!email||!password||!card.contains(e.target))return;
    const btn=[...card.querySelectorAll('button,input[type="submit"]')].find(isLoginButton);
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    login(btn);
  },true);
})();