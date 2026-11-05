// Direct room links enter through the persistent world; embedded rooms never redirect.
if(parent===window&&!new URLSearchParams(location.search).has('standalone')){
 const room=location.pathname.split('/').pop();const target=new URL('./',location.href);target.hash='room='+room.replace('.html','');location.replace(target.href);
}
