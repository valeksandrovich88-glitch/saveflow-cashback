(()=>{
  // V54 visual experiment: deep green edges, lighter content islands.
  const st=document.createElement('style');
  st.id='saveflow-v54-theme';
  st.textContent=`
    :root{
      --card:#edf5ec;
      --line:#c8d8ca;
      --green:#245f40;
      --green-bg:#cfe5d2;
      --shadow:0 12px 32px rgba(5,20,10,.14);
    }

    html{background:#07140d!important}
    body{
      min-height:100vh;
      background:
        radial-gradient(ellipse at 50% 28%, #789b80 0%, #5f8469 24%, #3f654b 48%, #23412e 70%, #10251a 86%, #07140d 100%)!important;
      background-attachment:fixed!important;
    }

    .header{
      background:rgba(7,20,13,.88)!important;
      border-bottom-color:rgba(220,240,225,.12)!important;
      box-shadow:0 8px 30px rgba(0,0,0,.12);
    }
    .brand-name{color:#f1f7f2!important}
    .mark{background:#dcebdc!important;color:#17301f!important}
    .top-nav button{background:rgba(224,239,225,.12)!important;color:#dce9df!important;border-color:rgba(228,242,231,.08)!important}
    .top-nav button:hover{background:rgba(232,244,234,.2)!important;border-color:rgba(232,244,234,.18)!important}
    .top-nav button.active{background:#dcebdc!important;color:#183120!important;border-color:#dcebdc!important}

    main>h1,.section-title{color:#f3f8f4!important;text-shadow:0 1px 1px rgba(0,0,0,.08)}
    .section-kicker,.footnotes{color:#d2dfd5!important}

    .matrix-card,
    .partner-card,
    .promo-card,
    .bonus-card,
    .update-log details{
      background:linear-gradient(145deg,#f3f8f1 0%,#e5f0e4 100%)!important;
      border-color:rgba(31,73,46,.22)!important;
      box-shadow:0 14px 34px rgba(4,18,9,.16)!important;
    }

    .filters{
      background:rgba(220,235,220,.82)!important;
      border-color:rgba(27,70,42,.2)!important;
      box-shadow:0 10px 26px rgba(5,22,11,.08)!important;
      backdrop-filter:blur(8px);
    }
    .filters input,.filter-menu summary,.sort-select{
      background:#f3f8f1!important;
      border-color:#bfd1c1!important;
    }

    thead th{background:#dce9dc!important}
    tbody td{background:rgba(238,246,237,.82)}
    tbody td:first-child{background:#e8f2e7!important}
    th,td{border-color:#c5d5c7!important}
    .cash{background:#dfeade!important}
    .cash.best{background:#c8e1cd!important;color:#174e31!important}
    .tag{background:#d7e5d7!important;color:#46604d!important}
    .bonus-link-slot,.empty-state{background:#e6efe4!important;border-color:#bfd0c0!important}

    .matrix-btn,.bonus-btn,.content-btn{
      background:#f2f7f0!important;
      border-color:#bfd0c1!important;
    }
    .matrix-btn:hover,.bonus-btn:hover,.content-btn:hover{background:#e2eee1!important}
    .matrix-btn.primary,#personalMatrixDone{background:#183c29!important;color:#fff!important;border-color:#183c29!important}
    .matrix-btn.primary:hover,#personalMatrixDone:hover{background:#24543a!important}

    /* Personal edit pencil lives at the far left of the matrix toolbar. */
    #personalMatrixToggle{margin-right:auto!important;flex:0 0 auto}
    #personalMatrixToggle::after{left:0!important;right:auto!important}

    /* Old developer/storage explanation is not user-facing. */
    .matrix-storage-note{display:none!important}

    /* Keep dialogs readable while staying in the palette. */
    .matrix-modal-card,.bonus-modal-card,.auth-card,.scanner-card,.content-modal-card,.user-banks-card{
      background:#f3f7f1!important;
      border-color:#c3d3c5!important;
    }

    @media(max-width:760px){
      body{background:linear-gradient(180deg,#183322 0%,#42684d 35%,#274832 72%,#09170f 100%)!important}
      #personalMatrixToggle::after{left:0!important;right:auto!important}
    }
  `;
  document.head.appendChild(st);

  // Move the personal pencil out of the right-aligned actions group to the left side of the toolbar.
  const toolbar=document.getElementById('matrixToolbar');
  const actions=toolbar?.querySelector('.matrix-toolbar-actions');
  const pencil=document.getElementById('personalMatrixToggle');
  if(toolbar && actions && pencil && pencil.parentElement===actions){
    toolbar.insertBefore(pencil,actions);
  }

  // Remove the storage/developer note from the cashback editor DOM as well.
  document.querySelectorAll('.matrix-storage-note').forEach(el=>el.remove());
})();
