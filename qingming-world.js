const stage=document.querySelector('#stage');
const images=[...document.querySelectorAll('.world-image')];
const buttons=[...document.querySelectorAll('[data-scene-button]')];
const followButton=document.querySelector('#follow-time');
const status=document.querySelector('#status');
const cup=document.querySelector('#teacup-return');
const backdrop=document.querySelector('#backdrop');
const scenes={day:'日光',dusk:'暮光',night:'夜光'};
let current='',following=true,statusTimer;

function sceneForLocalTime(){
  const now=new Date(),hour=now.getHours()+now.getMinutes()/60;
  if(hour>=6.5&&hour<17)return'day';
  if(hour>=17&&hour<19)return'dusk';
  return'night';
}
function updateHotspot(){
  const image=images.find(item=>item.dataset.scene===current)||images[0];
  if(!image?.naturalWidth)return;
  const stageRect=stage.getBoundingClientRect();
  const wide=image.naturalWidth/image.naturalHeight;
  const contain=matchMedia('(orientation: portrait)').matches;
  const scale=contain?Math.min(stageRect.width/image.naturalWidth,stageRect.height/image.naturalHeight):Math.max(stageRect.width/image.naturalWidth,stageRect.height/image.naturalHeight);
  const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  const left=(stageRect.width-width)/2,top=(stageRect.height-height)/2;
  const x=left+width*.185,y=top+height*.92;
  cup.style.left=`${x}px`;cup.style.top=`${y}px`;
  cup.hidden=x<0||y<0||x>stageRect.width||y>stageRect.height;
}
function say(message){
  status.textContent=message;status.classList.add('show');clearTimeout(statusTimer);
  statusTimer=setTimeout(()=>status.classList.remove('show'),3600);
}
function showScene(name,{auto=false,announce=true}={}){
  if(!scenes[name])return;
  current=name;
  images.forEach(image=>image.classList.toggle('active',image.dataset.scene===name));
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneButton===name&&!auto)));
  followButton.setAttribute('aria-pressed',String(auto));
  backdrop.style.backgroundImage=`url("assets/qingming-world-${name}.png")`;
  updateHotspot();
  if(announce)say(auto?`依照目前時段呈現${scenes[name]}光景。`:`已切換為${scenes[name]}光景；手動選擇時會暫停跟隨時段。`);
}
buttons.forEach(button=>button.addEventListener('click',()=>{following=false;showScene(button.dataset.sceneButton);}));
followButton.addEventListener('click',()=>{following=true;showScene(sceneForLocalTime(),{auto:true});});
images.forEach(image=>image.addEventListener('load',updateHotspot));
window.addEventListener('resize',updateHotspot,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&following)showScene(sceneForLocalTime(),{auto:true,announce:false});});
setInterval(()=>{if(following){const next=sceneForLocalTime();if(next!==current)showScene(next,{auto:true,announce:true});}},60000);
cup.addEventListener('click',()=>{
  const cameFromThisSite=document.referrer&&new URL(document.referrer).origin===location.origin;
  if(cameFromThisSite&&history.length>1){history.back();return;}
  location.href='qingming.html';
});
images.forEach(image=>{if(image.complete&&image.naturalWidth)updateHotspot();});
showScene(sceneForLocalTime(),{auto:true,announce:false});
cup.classList.add('hint-on');setTimeout(()=>cup.classList.remove('hint-on'),6500);
