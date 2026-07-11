
/* SCROLL REVEAL */
(function(){
  var items = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ items.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); } });
  }, { threshold:0.12 });
  items.forEach(function(el){ io.observe(el); });
})();

/* MOBILE NAV */
(function(){
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if(!burger) return;
  burger.addEventListener('click', function(){
    var open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    links.style.cssText += open ? '' : 'position:absolute;top:72px;left:0;right:0;flex-direction:column;background:#FBFAF6;padding:24px 32px;gap:20px;border-bottom:1px solid #E4DFD0;';
  });
})();

/* ==========================================================================
   HERO TRACE STRIP — sorting visualizer (reused engine, light theme)
   ========================================================================== */
(function(){
  var codeEl = document.getElementById('traceCode');
  var barsEl = document.getElementById('traceBars');
  var statEl = document.getElementById('traceStat');
  var statusEl = document.getElementById('traceStatus');
  var fileEl = document.getElementById('traceFileName');
  var tabsEl = document.getElementById('traceTabs');
  var replayBtn = document.getElementById('traceReplay');

  var ALGOS = {
    bubble:{ file:'bubble_sort.py', lines:[
        {t:[['kw','for'],['var',' i in range(n):']]},
        {t:[['var','  for j in range(0, n-i-1):']]},
        {t:[['kw','    if'],['var',' arr[j] > arr[j+1]:']]},
        {t:[['fn','      swap'],['var','(arr[j], arr[j+1])']]}
      ], gen:bubbleSteps },
    selection:{ file:'selection_sort.py', lines:[
        {t:[['kw','for'],['var',' i in range(n):']]},
        {t:[['var','  min_idx = i']]},
        {t:[['kw','  for'],['var',' j in range(i+1, n):']]},
        {t:[['kw','    if'],['var',' arr[j] < arr[min_idx]:']]},
        {t:[['var','      min_idx = j']]}
      ], gen:selectionSteps },
    insertion:{ file:'insertion_sort.py', lines:[
        {t:[['kw','for'],['var',' i in range(1, n):']]},
        {t:[['var','  key = arr[i]']]},
        {t:[['var','  j = i - 1']]},
        {t:[['kw','  while'],['var',' j >= 0 and arr[j] > key:']]},
        {t:[['fn','    shift'],['var','(arr, j, key)']]}
      ], gen:insertionSteps },
    quick:{ file:'quick_sort.py', lines:[
        {t:[['kw','def'],['fn',' partition'],['var','(arr, lo, hi):']]},
        {t:[['var','  pivot = arr[hi]']]},
        {t:[['kw','  for'],['var',' j in range(lo, hi):']]},
        {t:[['kw','    if'],['var',' arr[j] <= pivot:']]},
        {t:[['fn','      swap'],['var','(arr[i], arr[j])']]}
      ], gen:quickSteps }
  };

  var baseData = [46,12,78,34,65,8,52,29];
  var current = 'bubble', timer = null;

  function renderCode(algo){
    codeEl.innerHTML = ALGOS[algo].lines.map(function(line, idx){
      var toks = line.t.map(function(tok){ return '<span class="tok-'+tok[0]+'">'+escapeHtml(tok[1])+'</span>'; }).join('');
      return '<div class="ln" data-line="'+idx+'"><span class="no">'+(idx+1)+'</span>'+toks+'</div>';
    }).join('');
  }
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function renderBars(data, compareIdx, sortedFrom){
    var max = Math.max.apply(null, baseData);
    barsEl.innerHTML = data.map(function(val, idx){
      var h = 20 + (val/max)*140; var cls='bar';
      if(compareIdx && (idx===compareIdx[0] || idx===compareIdx[1])) cls+=' compare';
      if(sortedFrom!==undefined && idx>=sortedFrom) cls+=' sorted';
      return '<div class="'+cls+'" style="height:'+h+'px"></div>';
    }).join('');
  }
  function setActiveLine(n){ var lns = codeEl.querySelectorAll('.ln'); lns.forEach(function(ln){ ln.classList.remove('active'); }); if(lns[n]) lns[n].classList.add('active'); }

  function bubbleSteps(arr){ var a=arr.slice(); var steps=[]; var n=a.length;
    for(var i=0;i<n;i++){ for(var j=0;j<n-i-1;j++){
      steps.push({data:a.slice(),line:1,cmp:[j,j+1],sortedFrom:n-i});
      if(a[j]>a[j+1]){ steps.push({data:a.slice(),line:2,cmp:[j,j+1],sortedFrom:n-i}); var t=a[j];a[j]=a[j+1];a[j+1]=t; steps.push({data:a.slice(),line:3,cmp:[j,j+1],sortedFrom:n-i}); }
    } }
    steps.push({data:a.slice(),line:0,cmp:null,sortedFrom:0}); return steps; }
  function selectionSteps(arr){ var a=arr.slice(); var steps=[]; var n=a.length;
    for(var i=0;i<n;i++){ var min=i; steps.push({data:a.slice(),line:1,cmp:[i,min],sortedFrom:i});
      for(var j=i+1;j<n;j++){ steps.push({data:a.slice(),line:3,cmp:[j,min],sortedFrom:i}); if(a[j]<a[min]){ min=j; steps.push({data:a.slice(),line:4,cmp:[j,min],sortedFrom:i}); } }
      var t=a[i];a[i]=a[min];a[min]=t; steps.push({data:a.slice(),line:0,cmp:[i,min],sortedFrom:i+1}); }
    steps.push({data:a.slice(),line:0,cmp:null,sortedFrom:0}); return steps; }
  function insertionSteps(arr){ var a=arr.slice(); var steps=[]; var n=a.length;
    for(var i=1;i<n;i++){ var key=a[i]; var j=i-1; steps.push({data:a.slice(),line:1,cmp:[i,i],sortedFrom:n});
      while(j>=0 && a[j]>key){ steps.push({data:a.slice(),line:3,cmp:[j,j+1],sortedFrom:n}); a[j+1]=a[j]; j--; steps.push({data:a.slice(),line:4,cmp:[j+1,j+2],sortedFrom:n}); }
      a[j+1]=key; }
    steps.push({data:a.slice(),line:0,cmp:null,sortedFrom:0}); return steps; }
  function quickSteps(arr){ var a=arr.slice(); var steps=[]; var n=a.length;
    function swap(i,j){ var t=a[i]; a[i]=a[j]; a[j]=t; }
    function partition(lo,hi){ var pivot=a[hi]; var i=lo;
      for(var j=lo;j<hi;j++){ steps.push({data:a.slice(),line:2,cmp:[j,hi],sortedFrom:n});
        if(a[j]<=pivot){ steps.push({data:a.slice(),line:3,cmp:[i,j],sortedFrom:n}); swap(i,j); steps.push({data:a.slice(),line:4,cmp:[i,j],sortedFrom:n}); i++; } }
      swap(i,hi); steps.push({data:a.slice(),line:4,cmp:[i,hi],sortedFrom:n}); return i; }
    function sort(lo,hi){ if(lo>=hi) return; steps.push({data:a.slice(),line:0,cmp:[lo,hi],sortedFrom:n}); steps.push({data:a.slice(),line:1,cmp:[lo,hi],sortedFrom:n}); var p=partition(lo,hi); sort(lo,p-1); sort(p+1,hi); }
    sort(0,n-1); steps.push({data:a.slice(),line:0,cmp:null,sortedFrom:0}); return steps; }

  var stepQueue=[], stepIdx=0, comparisons=0;
  function loadAlgo(name){
    current=name; fileEl.textContent=ALGOS[name].file; renderCode(name);
    stepQueue=ALGOS[name].gen(baseData); stepIdx=0; comparisons=0;
    renderBars(baseData); statEl.textContent='comparisons: 0'; statusEl.textContent='running'; play();
  }
  function play(){
    clearInterval(timer);
    timer=setInterval(function(){
      if(stepIdx>=stepQueue.length){ statusEl.textContent='sorted ✓'; clearInterval(timer); setTimeout(function(){ loadAlgo(current); }, 2200); return; }
      var step=stepQueue[stepIdx]; renderBars(step.data, step.cmp, step.sortedFrom); setActiveLine(step.line);
      if(step.cmp) comparisons++; statEl.textContent='comparisons: '+comparisons; stepIdx++;
    }, 420);
  }
  tabsEl.addEventListener('click', function(e){ var btn=e.target.closest('button'); if(!btn) return;
    tabsEl.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); }); btn.classList.add('active'); loadAlgo(btn.dataset.algo); });
  replayBtn.addEventListener('click', function(){ loadAlgo(current); });
  loadAlgo('bubble');
})();

/* ==========================================================================
   CATALOG FILTER
   ========================================================================== */
(function(){
  var chips=document.querySelectorAll('.filter-chip'); var cards=document.querySelectorAll('.course-card');
  chips.forEach(function(chip){ chip.addEventListener('click', function(){
    chips.forEach(function(c){ c.classList.remove('active'); }); chip.classList.add('active');
    var f=chip.dataset.filter;
    cards.forEach(function(card){ card.style.display = (f==='all' || card.dataset.cat===f) ? '' : 'none'; });
  }); });
})();

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
(function(){
  var list=document.getElementById('faqList'); var items=list.querySelectorAll('.faq-item');
  function setHeights(){ items.forEach(function(item){ var a=item.querySelector('.faq-a'); a.style.maxHeight = item.classList.contains('open') ? a.scrollHeight+'px' : '0px'; }); }
  items.forEach(function(item){ item.querySelector('.faq-q').addEventListener('click', function(){
    var wasOpen=item.classList.contains('open'); items.forEach(function(i){ i.classList.remove('open'); }); if(!wasOpen) item.classList.add('open'); setHeights();
  }); });
  setHeights(); window.addEventListener('resize', setHeights);
})();
