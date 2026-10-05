(()=>{
  // V55 visual experiment: one continuous green gradient through the whole site.
  const st=document.createElement('style');
  st.id='saveflow-v54-theme';
  st.textContent=`
    :root{
      --card:rgba(238,248,239,.46);
      --line:rgba(216,236,220,.52);
      --green:#245f40;
      --green-bg:rgba(202,229,208,.44);
      --shadow:0 12px 30px rgba(3,17,9,.14);
    }

    html{background:#06120b!important}
    body{
      min-height:100vh;
      color:#102219;
      background:
        radial-gradient(ellipse 76% 110% at 50% 40%,
          #dcebd8 0%,
          #c4dcc1 28%,
          #9fbd9f 48%,
          #6f9677 63%,
          #45694f 74%,
          #294834 84%,
          #142b1d 92%,
          #06120b 100%)!important;
      background-attachment:fixed!important;
    }

    /* Header also lets the same background show through. */
    .header{
      background:rgba(7,22,13,.54)!important;
      border-bottom-color:rgba(222,241,226,.18)!important;
      box-shadow:0 8px 26px rgba(0,0,0,.10)!important;
      backdrop-filter:blur(7px);
    }
    .brand-name{color:#f2f8f3!important}
    .mark{background:rgba(231,244,232,.88)!important;color:#17301f!important}
    .top-nav button{background:rgba(228,241,230,.10)!important;color:#e0ebe2!important;border-color:rgba(228,242,231,.12)!important}
    .top-nav button:hover{background:rgba(235,246,236,.19)!important;border-color:rgba(235,246,236,.22)!important}
    .top-nav button.active{background:rgba(232,244,233,.88)!important;color:#183120!important;border-color:rgba(232,244,233,.72)!important}

    main>h1,.section-title{color:#f4f8f4!important;text-shadow:0 1px 2px rgba(0,0,0,.13)}
    .section-kicker,.footnotes{color:rgba(235,244,237,.88)!important}

    /* Cards no longer have their own opaque fill: the page gradient continues through them. */
    .matrix-card,
    .partner-card,
    .promo-card,
    .bonus-card,
    .update-log details{
      background:rgba(239,248,240,.48)!important;
      border-color:rgba(225,240,228,.62)!important;
      box-shadow:0 12px 30px rgba(3,18,9,.13), inset 0 1px 0 rgba(255,255,255,.28)!important;
    }

    .filters,
    .content-edit-toolbar,
    .bonus-link-slot,
    .empty-state{
      background:rgba(235,246,237,.34)!important;
      border-color:rgba(220,238,224,.55)!important;
      box-shadow:none!important;
    }

    .filters input,.filter-menu summary,.sort-select,
    .matrix-btn,.bonus-btn,.content-btn{
      background:rgba(246,251,246,.58)!important;
      border-color:rgba(200,221,204,.72)!important;
    }
    .matrix-btn:hover,.bonus-btn:hover,.content-btn:hover{background:rgba(249,253,249,.76)!important}
    .matrix-btn.primary,#personalMatrixDone{background:rgba(20,59,38,.92)!important;color:#fff!important;border-color:rgba(20,59,38,.92)!important}
    .matrix-btn.primary:hover,#personalMatrixDone:hover{background:rgba(31,82,53,.95)!important}

    /* Matrix: transparent layers keep the global gradient visible from cell to cell. */
    .matrix-card,.matrix-scroll,table,thead,tbody,tr{background:transparent!important}
    thead th{background:rgba(226,240,228,.44)!important}
    tbody td{background:rgba(242,249,242,.26)!important}
    tbody td:first-child{background:rgba(232,243,233,.38)!important}
    th,td{border-color:rgba(190,215,195,.62)!important}
    .cash{background:rgba(225,239,227,.42)!important}
    .cash.best{background:rgba(183,220,192,.56)!important;color:#174e31!important}
    .tag{background:rgba(214,231,216,.44)!important;color:#3d5845!important}

    /* Keep card text readable while preserving the transparent surfaces. */
    .partner-card,.promo-card,.bonus-card,.matrix-card{color:#13271b!important}
    .partner-card .muted,.promo-card .muted,.bonus-card .muted{color:#53695a!important}

    /* Personal edit pencil lives at the far left of the matrix toolbar. */
    #personalMatrixToggle{margin-right:auto!important;flex:0 0 auto}
    #personalMatrixToggle::after{left:0!important;right:auto!important}

    /* Old developer/storage explanation is not user-facing. */
    .matrix-storage-note{display:none!important}

    /* Dialogs stay more opaque for readability; the site behind them still keeps the gradient. */
    .matrix-modal-card,.bonus-modal-card,.auth-card,.scanner-card,.content-modal-card,.user-banks-card{
      background:rgba(243,249,243,.94)!important;
      border-color:rgba(195,216,199,.88)!important;
    }

    @media(max-width:760px){
      body{
        background:radial-gradient(ellipse 125% 90% at 50% 36%,#d5e8d2 0%,#a5c4a6 37%,#63896b 61%,#2d5038 80%,#09170f 100%)!important;
        background-attachment:fixed!important;
      }
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
