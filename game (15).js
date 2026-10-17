var mode=new URLSearchParams(window.location.search||'').get('mode');BrickArena.start(mode==='patterns'?'prism':mode==='endless'?'quest':'select');
