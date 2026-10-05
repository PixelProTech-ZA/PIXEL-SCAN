"use strict";
/* ============ helpers ============ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>reduce?Promise.resolve():sleep(ms);
const app=$('#app');

/* ============ pixel icons ============ */
function pix(rows){
  const w=rows[0].length,h=rows.length;let r='';
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='#')r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}));
  return `<svg viewBox="0 0 ${w} ${h}" width="${w*3}" height="${h*3}" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${r}</svg>`;
}
const LAPBASE=["..############..",".##############.","################"];
const ICON={
 windows:pix(["..############..","..#..........#..","..#.###.###..#..","..#.###.###..#..","..#..........#..","..#.###.###..#..","..#.###.###..#..","..#..........#..",...LAPBASE]),
 macos:pix(["..############..","..#..........#..","..#...####...#..","..#..######..#..","..#..######..#..","..#...####...#..","..#..........#..","..#..........#..",...LAPBASE]),
 linux:pix(["..############..","..#..........#..","..##.........#..","..#.#........#..","..#..#.......#..","..#.#........#..","..##...####..#..","..#..........#..",...LAPBASE]),
 android:pix(["....########....","....#......#....","....#..##..#....","....#.####.#....","....#.#..#.#....","....#......#....","....#......#....","....#......#....","....#......#....","....#..##..#....","....########...."]),
 apple:pix(["....########....","....#.####.#....","....#......#....","....#......#....","....#......#....","....#......#....","....#......#....","....#......#....","....#......#....","....#..##..#....","....########...."]),
 browser:pix(["################","#.#.#..........#","################","#..............#","#..####........#","#..............#","#..########....#","#..............#","#..######......#","#..............#","################"]),
 network:pix(["...#........#...","...#........#...","...#........#...","..############..","..#..........#..","..#.#.#.#....#..","..############.."]),
 accounts:pix(["..############..","..##........##..","..#.#......#.#..","..#..#....#..#..","..#...####...#..","..#..........#..","..#..........#..","..############.."])
};

/* ============ environment detection ============ */
function detectOS(){
  const ua=navigator.userAgent||'';
  const plat=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';
  if(/android/i.test(ua))return'android';
  if(/iPhone|iPad|iPod/.test(ua)||(/Mac/i.test(plat)&&navigator.maxTouchPoints>1))return'apple';
  if(/Win/i.test(plat)||/Windows/.test(ua))return'windows';
  if(/Mac/i.test(plat))return'macos';
  if(/Linux|X11/i.test(plat+' '+ua)&&!/CrOS/.test(ua))return'linux';
  return'unknown';
}
function detectBrowser(){
  const ua=navigator.userAgent||'';let m;
  if(m=ua.match(/Edg(?:e|A|iOS)?\/(\d+)/))return{key:'edge',name:'Edge',ver:m[1]};
  if(/SamsungBrowser|OPR\/|Vivaldi/.test(ua)){m=ua.match(/(?:SamsungBrowser|OPR|Vivaldi)\/(\d+)/);return{key:'default',name:/OPR/.test(ua)?'Opera':/Samsung/.test(ua)?'Samsung Internet':'Vivaldi',ver:m?m[1]:''};}
  if(m=ua.match(/(?:Firefox|FxiOS)\/(\d+)/))return{key:'firefox',name:'Firefox',ver:m[1]};
  if(m=ua.match(/(?:Chrome|CriOS)\/(\d+)/))return{key:'chrome',name:navigator.brave?'Brave':'Chrome',ver:m[1]};
  if(m=ua.match(/Version\/(\d+)[^)]*.*Safari/))return{key:'safari',name:'Safari',ver:m[1]};
  return{key:'default',name:'Unknown browser',ver:''};
}

/* ============ capability probes (home core) ============ */
const CAPS=[
 ['SEC','Secure context',()=>window.isSecureContext===true],
 ['PRM','Permissions API',()=>!!(navigator.permissions&&navigator.permissions.query)],
 ['UAH','Client hints (userAgentData)',()=>!!navigator.userAgentData],
 ['NET','Network information API',()=>!!navigator.connection],
 ['CRY','Web Crypto',()=>!!(window.crypto&&crypto.subtle)],
 ['PKY','Passkeys / WebAuthn',()=>!!window.PublicKeyCredential],
 ['CLP','Clipboard write',()=>!!(navigator.clipboard&&navigator.clipboard.writeText)],
 ['STO','Storage API',()=>!!(navigator.storage&&navigator.storage.estimate)],
 ['SWK','Service workers',()=>'serviceWorker' in navigator],
 ['CKE','Cookies enabled',()=>navigator.cookieEnabled===true],
 ['GPC','Global Privacy Control signal',()=>'globalPrivacyControl' in navigator],
 ['AUT','Automation flag',()=>'webdriver' in navigator],
 ['ONL','Online status',()=>'onLine' in navigator],
 ['LST','Local storage',()=>{try{return!!window.localStorage}catch(e){return false}}],
 ['GEO','Geolocation API',()=>'geolocation' in navigator],
 ['NTF','Notifications API',()=>'Notification' in window]
];

/* ============ areas ============ */
const AREAS={
 windows:{label:'WINDOWS',sub:'Desktop / Laptop'},
 macos:{label:'macOS',sub:'Mac / MacBook'},
 linux:{label:'LINUX',sub:'Desktop / Laptop'},
 android:{label:'ANDROID',sub:'Phone / Tablet'},
 apple:{label:'APPLE',sub:'iPhone / iPad'},
 browser:{label:'BROWSER',sub:'Chrome / Firefox / Safari / Edge'},
 network:{label:'NETWORK',sub:'Wi-Fi / Router'},
 accounts:{label:'ACCOUNTS',sub:'Email / social / financial / cloud'}
};
const AREA_ORDER=Object.keys(AREAS);

/* ============ state labels ============ */
const ST={
 checked:{l:'CHECKED',r:0},
 info:{l:'CHECKED · INFO',r:0},
 attention:{l:'NEEDS ATTENTION',r:3},
 high:{l:'HIGH PRIORITY',r:4},
 critical:{l:'CRITICAL',r:5},
 unconfirmed:{l:'NOT CONFIRMED',r:2},
 nt:{l:'NOT TESTABLE',r:1}
};

/* ============ checks ============ */
const S={screen:'home',areas:new Set(),det:{},results:{},checks:[],caps:[],booted:false,scanId:0};

function osCheck(area){
  return{id:'os-'+area,area,mode:'direct',t:'Operating system reported by this browser',
   run:async()=>{
     const o=detectOS();
     if(o==='unknown')return{s:'nt',d:'This browser does not report an operating system PIXEL SCAN recognises.'};
     if(o===area)return{s:'info',d:`Browser reports ${AREAS[o].label}, matching your selection. A browser can be set to report something else.`};
     return{s:'info',d:`Browser reports ${AREAS[o].label}, but you selected ${AREAS[area].label}. Guided checks follow your selection.`};
   }};
}
async function permState(name){try{const r=await navigator.permissions.query({name});return r.state;}catch(e){return null;}}

const DIRECT=[
 {id:'br-https',area:'browser',mode:'direct',t:'Connection to this page is encrypted',run:async()=>{
   const p=location.protocol;
   if(p==='https:'&&window.isSecureContext)return{s:'checked',d:'This page was loaded over HTTPS in a secure context.'};
   if(p==='http:'&&window.isSecureContext)return{s:'nt',d:'This page is served over plain HTTP from a local development address. Browsers treat that as secure, but the connection is not encrypted, so it is not judged here.'};
   if(p==='http:')return{s:'high',d:'This page was loaded over plain HTTP, so anything on it can be read or altered on the way.',sev:'Unencrypted pages can be read and changed in transit.',fix:['Open this page using an https:// address.','Avoid entering any information on pages that load over plain HTTP.']};
   return{s:'nt',d:`This page was opened from a "${p}" address, so its connection cannot be judged here.`};
 }},
 {id:'br-id',area:'browser',mode:'direct',t:'Browser and version reported',run:async()=>{
   const b=S.det.br,o=detectOS();
   return{s:'info',d:`Browser reports ${b.name}${b.ver?' '+b.ver:''} on ${o==='unknown'?'an unrecognised system':AREAS[o].label}. Whether that version is the latest cannot be tested from here: see the guided update check.`};
 }},
 {id:'br-auto',area:'browser',mode:'direct',t:'Browser is not under automation control',run:async()=>{
   if(navigator.webdriver===true)return{s:'attention',d:'Your browser reports that it is being controlled by automation software (navigator.webdriver is true).',sev:'This is normal for testing tools, and unexpected in a browser you use personally.',fix:['If you did not start a testing tool, close the browser completely and reopen it normally.','Check that no unknown software or extensions are running or controlling it.']};
   if(navigator.webdriver===false)return{s:'checked',d:'Browser reports it is not under automation control.'};
   return{s:'nt',d:'This browser does not expose an automation flag.'};
 }},
 {id:'br-gpc',area:'browser',mode:'direct',t:'Privacy signal (Global Privacy Control)',run:async()=>{
   if(!('globalPrivacyControl' in navigator))return{s:'info',d:'This browser does not send the Global Privacy Control signal. Informational only: it is not a security fault.'};
   return{s:'info',d:`Global Privacy Control is ${navigator.globalPrivacyControl?'ON: your browser asks sites not to sell or share your data':'OFF'}. Informational only.`};
 }},
 {id:'br-perm',area:'browser',mode:'direct',t:'Sensitive permissions held by this page',run:async()=>{
   if(!(navigator.permissions&&navigator.permissions.query))return{s:'nt',d:'This browser does not expose the Permissions API.'};
   const names=['geolocation','notifications','camera','microphone'];
   const res=await Promise.all(names.map(async n=>({n,st:await permState(n)})));
   const known=res.filter(x=>x.st);
   if(!known.length)return{s:'nt',d:'The browser would not report permission states to this page.'};
   const g=known.filter(x=>x.st==='granted').map(x=>x.n);
   const tail=' This covers this page only. Permissions held by your other sites need the guided review.';
   return g.length?{s:'info',d:`Granted to this page: ${g.join(', ')}.`+tail}:{s:'checked',d:`No location, notification, camera or microphone access is granted to this page (${known.length} of ${names.length} readable).`+tail};
 }},
 {id:'net-conn',area:'network',mode:'direct',t:'Connection state reported by the browser',run:async()=>{
   if(navigator.onLine===false)return{s:'nt',d:'Browser reports it is offline, so there is nothing to read.'};
   const c=navigator.connection;
   let d='Browser reports it is online. ';
   d+=c?`Connection type: ${c.type||'not reported'}; speed class: ${c.effectiveType||'not reported'}. `:'Connection details are not exposed by this browser. ';
   d+='This does not say whether the Wi-Fi network or router is secure: use the guided router checks for that.';
   return{s:'info',d};
 }},
 {id:'acc-pky',area:'accounts',mode:'direct',t:'Passkey and security-key support in this browser',run:async()=>{
   if(!window.PublicKeyCredential)return{s:'info',d:'This browser (or this page context) does not expose passkey support. You may need another browser or device to use passkeys and security keys.'};
   let plat=null;try{plat=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){}
   return{s:'checked',d:`Passkeys and security keys are supported here. Built-in device unlock (such as Windows Hello or Touch ID): ${plat===true?'available':plat===false?'not reported as available':'unknown'}.`};
 }},
 ...['windows','macos','linux','android','apple'].map(osCheck)
];

const GUIDED=[
/* ---- WINDOWS ---- */
{id:'w-av',area:'windows',t:'Antivirus protection is up to date',path:['Start','Windows Security','Virus & threat protection','Protection updates','Check for updates'],
 why:'Protection only catches threats it already knows about. Old definitions miss new ones.',
 look:'A recent "last update" time and the message that security intelligence is up to date. If you use another antivirus, open that app and find its update screen.',
 bad:'Protection is out of date or the update fails, so newer threats may not be caught.',
 fix:['Select Check for updates and let it finish.','If it fails, run Windows Update and restart.','If it keeps failing, note the error code and get it looked at before banking or shopping on this PC.'],
 sev:'high',sevWhy:'Out-of-date protection leaves a gap on a device you use every day.'},
{id:'w-rt',area:'windows',t:'Real-time protection is on',path:['Start','Windows Security','Virus & threat protection','Manage settings','Real-time protection'],
 why:'It watches files as they are opened or downloaded.',
 look:'The toggle is On. If another antivirus is installed, Windows may show that one as in charge: that is fine if it is active.',
 bad:'Real-time protection is off, so nothing is watching files as they arrive.',
 fix:['Turn Real-time protection on.','If it switches itself off, another security product may be in control: open it and confirm it is active.','If you did not turn it off, treat that as a warning sign and run a full scan.'],
 sev:'high',sevWhy:'Protection switched off is a common misconfiguration, and malware sometimes does it on purpose.'},
{id:'w-upd',area:'windows',t:'Windows is fully updated',path:['Start','Settings','Windows Update','Check for updates'],
 why:'Updates close known security holes. Unpatched Windows flaws are a common way devices get infected.',
 look:'"You\'re up to date" with a recent "Last checked" time.',
 bad:'Security updates are pending or failing, so known flaws stay open.',
 fix:['Install pending updates and restart.','If the same update fails repeatedly, note its KB number so it can be troubleshooted.'],
 sev:'high',sevWhy:'Known, unpatched flaws are the easiest thing for an attacker to use.'},
{id:'w-fw',area:'windows',t:'Firewall is on for every network profile',path:['Start','Windows Security','Firewall & network protection'],
 why:'The firewall filters unsolicited incoming connections, which matters most on public Wi-Fi.',
 look:'Domain, Private and Public networks each show the firewall is on, with no red cross.',
 bad:'The firewall is off for at least one profile.',
 fix:['Open the profile marked off and turn Microsoft Defender Firewall on.','If another security suite manages the firewall, confirm that it is active.'],
 sev:'high',sevWhy:'An off firewall removes a basic barrier, especially on shared networks.'},
{id:'w-enc',area:'windows',t:'Drive encryption is on',path:['Start','Settings','Privacy & security','Device encryption'],
 why:'If the laptop is lost or stolen, encryption stops a thief from reading files by removing the disk. On Windows Pro, search Start for "Manage BitLocker" instead.',
 look:'Device encryption (or BitLocker) shows On for the system drive.',
 bad:'The drive is not encrypted, so a thief could read the files.',
 fix:['Turn on Device encryption or BitLocker.','Save the recovery key somewhere safe and away from this PC, such as your Microsoft account.'],
 sev:'attention',sevWhy:'This matters if the device is lost or stolen, so it is flagged for attention, not as urgent.'},
{id:'w-uac',area:'windows',t:'User Account Control is not turned off',path:['Start','Search: Change User Account Control settings','Open it'],
 why:'UAC asks before programs make administrator-level changes.',
 look:'The slider is at the default (second from top) or higher, not at "Never notify".',
 bad:'UAC is set to never notify, so programs can make admin-level changes silently.',
 fix:['Move the slider back to the default level or above.'],
 sev:'attention',sevWhy:'It weakens a safeguard but is not an attack in itself.'},
/* ---- MACOS ---- */
{id:'m-upd',area:'macos',t:'macOS is up to date',path:['Apple menu','System Settings','General','Software Update'],
 why:'Updates close known security holes.',look:'"Your Mac is up to date" with the current macOS version.',
 bad:'Security updates are waiting.',fix:['Install updates and restart.','Use the (i) button next to Automatic updates to turn on automatic security updates.'],
 sev:'high',sevWhy:'Known, unpatched flaws are the easiest thing for an attacker to use.'},
{id:'m-fv',area:'macos',t:'FileVault disk encryption is on',path:['Apple menu','System Settings','Privacy & Security','FileVault'],
 why:'If the Mac is lost or stolen, encryption stops a thief reading its files.',look:'FileVault is On.',
 bad:'The disk is not encrypted.',fix:['Turn on FileVault.','Keep the recovery key somewhere safe, or choose iCloud recovery.'],
 sev:'attention',sevWhy:'This matters if the device is lost or stolen.'},
{id:'m-fw',area:'macos',t:'Firewall is on',path:['Apple menu','System Settings','Network','Firewall'],
 why:'The firewall filters unsolicited incoming connections.',look:'Firewall is On.',
 bad:'The firewall is off.',fix:['Turn the firewall on.'],sev:'attention',sevWhy:'macOS has other protections, so this is a recommended hardening step.'},
{id:'m-gk',area:'macos',t:'Apps can only be installed from trusted sources',path:['Apple menu','System Settings','Privacy & Security','Security','Allow applications from'],
 why:'Gatekeeper checks apps before they run. Weakening it makes fake installers easier to run.',look:'Set to "App Store" or "App Store and identified developers".',
 bad:'Gatekeeper was loosened or disabled.',fix:['Choose App Store and identified developers.','Remove apps you installed from unknown sources.'],
 sev:'high',sevWhy:'It lets unvetted software run, a common route for Mac malware.'},
{id:'m-lock',area:'macos',t:'Mac locks itself and asks for a password',path:['Apple menu','System Settings','Lock Screen'],
 why:'Anyone who opens the lid should not be able to use your accounts.',look:'"Require password after screen saver begins or display is turned off" is set to Immediately or a short delay.',
 bad:'No password is needed after sleep or screen saver.',fix:['Set the password requirement to Immediately.'],
 sev:'attention',sevWhy:'It needs physical access to the Mac to matter.'},
/* ---- LINUX ---- */
{id:'l-upd',area:'linux',t:'Security updates are installed',cmd:['sudo apt update && apt list --upgradable      # Debian, Ubuntu, Mint','sudo dnf check-update                           # Fedora, RHEL family'],
 why:'Distributions ship security fixes as ordinary updates.',look:'The list is empty, or holds only a few non-security packages.',
 bad:'Updates, including security fixes, are pending.',fix:['Install them: sudo apt upgrade  (or: sudo dnf upgrade).','Reboot if the kernel or core libraries were updated.'],
 sev:'high',sevWhy:'Unpatched packages carry known flaws.'},
{id:'l-fw',area:'linux',t:'A firewall is active',cmd:['sudo ufw status                # Ubuntu, Debian, Mint','sudo firewall-cmd --state       # Fedora, RHEL family'],
 why:'A firewall limits what the network can reach on your machine.',look:'"Status: active" (ufw) or "running" (firewalld).',
 bad:'No active firewall was found.',fix:['Enable it: sudo ufw enable  (or: sudo systemctl enable --now firewalld).','If you connect over SSH, allow SSH first so you do not lock yourself out.'],
 sev:'attention',sevWhy:'Many desktops expose nothing by default, so this is hardening rather than an emergency.'},
{id:'l-enc',area:'linux',t:'The main disk is encrypted',cmd:['lsblk -f'],
 why:'Encryption protects your files if the machine is lost or stolen.',look:'A "crypto_LUKS" entry sits under the disk holding your system and home folder.',
 bad:'No encryption was found on the main disk.',fix:['Full-disk encryption is easiest to set up at install time. Back up first, then reinstall with encryption enabled.','Alternatively encrypt your home folder with a tool your distribution supports.'],
 sev:'attention',sevWhy:'This matters if the device is lost or stolen.'},
{id:'l-ports',area:'linux',t:'Only expected services are listening',cmd:['ss -tuln'],
 why:'Every listening service is something the network can try to talk to.',look:'You recognise everything listed. Port 22 appears only if you run SSH on purpose.',
 bad:'Something is listening that you did not expect.',fix:['Identify it: sudo ss -tulpn','Stop and disable what you do not need: sudo systemctl disable --now <service>','If you cannot explain it, treat it as suspicious and investigate before using the machine for anything sensitive.'],
 sev:'attention',sevWhy:'Unexpected is not the same as malicious, so it is flagged for review.'},
/* ---- ANDROID ---- */
{id:'a-upd',area:'android',t:'Android security updates are current',path:['Settings','About phone','Android version','Android security update'],
 why:'Security patches fix flaws that apps and websites can use against the phone.',look:'The patch date is within the last few months and no update is waiting under Settings, System, System update. Menu names vary by maker.',
 bad:'The patch level is old, or the phone no longer receives updates.',fix:['Install any waiting update.','If the maker has stopped updates, avoid banking and sensitive accounts on this phone, or plan a replacement.'],
 sev:'high',sevWhy:'Old patch levels leave known flaws open.'},
{id:'a-pp',area:'android',t:'Google Play Protect is on and clean',path:['Google Play Store','Profile icon','Play Protect','Settings (gear icon)'],
 why:'Play Protect scans apps for known harmful behaviour.',look:'"Scan apps with Play Protect" is on, and a scan finds no harmful apps.',
 bad:'Play Protect is off, or it reported harmful apps.',fix:['Turn scanning on and run Scan.','Uninstall anything it flags.'],
 sev:'high',sevWhy:'A harmful app on a phone can read messages, codes and banking apps.'},
{id:'a-lock',area:'android',t:'The phone has a proper screen lock',path:['Settings','Security & privacy','Device unlock','Screen lock'],
 why:'The lock is the barrier between a finder or thief and your accounts.',look:'A PIN, pattern, password or biometric is set. Not "None" or "Swipe".',
 bad:'No real screen lock is set.',fix:['Set a 6-digit PIN or longer, or a password.','Add fingerprint or face unlock for convenience.'],
 sev:'high',sevWhy:'Anyone holding the phone could open it.'},
{id:'a-unk',area:'android',t:'No app can install other apps',path:['Settings','Apps','Special app access','Install unknown apps'],
 why:'Apps installed outside the Play Store are not checked the same way.',look:'Every app in the list says "Not allowed".',
 bad:'At least one app can install other apps.',fix:['Set each to Not allowed unless you enabled it on purpose.','Uninstall apps you do not recognise.'],
 sev:'high',sevWhy:'It is a common route for banking trojans and fake updates.'},
{id:'a-perm',area:'android',t:'App permissions are sensible',path:['Settings','Privacy','Permission manager','Camera, Microphone, Location'],
 why:'Apps often hold access they no longer need.',look:'Only apps that clearly need each permission have it.',
 bad:'Apps have access they do not need.',fix:['Change to "Don\'t allow" or "Only while using the app".','Remove apps you no longer use.'],
 sev:'attention',sevWhy:'Excess access is a privacy risk, not proof of misuse.'},
/* ---- APPLE ---- */
{id:'i-upd',area:'apple',t:'iOS / iPadOS is up to date',path:['Settings','General','Software Update'],
 why:'Updates close known security holes.',look:'"iOS is up to date" (or iPadOS).',
 bad:'An update is waiting.',fix:['Install it, and turn on Automatic Updates.'],sev:'high',sevWhy:'Known, unpatched flaws are the easiest thing for an attacker to use.'},
{id:'i-pass',area:'apple',t:'A strong passcode is set',path:['Settings','Face ID & Passcode (or Touch ID & Passcode)'],
 why:'The passcode protects the device and the data encrypted on it.',look:'A passcode is on, six digits or longer, or a custom alphanumeric code.',
 bad:'No passcode, or a short one.',fix:['Turn Passcode on.','Choose Passcode Options, then a longer numeric or custom alphanumeric code.'],
 sev:'high',sevWhy:'Without a strong passcode, anyone holding the device can get in.'},
{id:'i-2fa',area:'apple',t:'Two-factor authentication is on for your Apple Account',path:['Settings','Your name (top of screen)','Sign-In & Security','Two-Factor Authentication'],
 why:'Your Apple Account holds backups, photos, passwords and Find My.',look:'Two-Factor Authentication is On.',
 bad:'It is off, so a password alone could unlock the account.',fix:['Turn on Two-Factor Authentication.','Check the trusted phone number is yours.'],
 sev:'high',sevWhy:'One stolen password would open the whole account.'},
{id:'i-prof',area:'apple',t:'No unknown configuration profiles',path:['Settings','General','VPN & Device Management'],
 why:'A malicious profile can reroute traffic or change trust settings.',look:'Either the section is missing, or each profile is one you installed for work or school.',
 bad:'A profile you did not install is present.',fix:['Open the unknown profile and choose Remove Profile.','If you cannot say how it got there, change your Apple Account password afterwards.'],
 sev:'high',sevWhy:'Unrecognised profiles can silently change how the device handles your traffic.'},
{id:'i-perm',area:'apple',t:'App privacy permissions are sensible',path:['Settings','Privacy & Security','Camera, Microphone, Location Services'],
 why:'Apps often keep access they no longer need.',look:'Only apps that clearly need each permission have it.',
 bad:'Apps have access they do not need.',fix:['Switch off access for apps that do not need it, or set Location to While Using.'],
 sev:'attention',sevWhy:'Excess access is a privacy risk, not proof of misuse.'},
/* ---- BROWSER ---- */
{id:'b-upd',area:'browser',t:'Your browser is up to date',
 path:{chrome:['Menu (three dots)','Help','About Google Chrome'],edge:['Menu (three dots)','Help and feedback','About Microsoft Edge'],firefox:['Menu (three lines)','Help','About Firefox'],safari:['Apple menu','System Settings','General','Software Update'],default:['Browser menu','Help or About']},
 why:'Browsers are patched often, because websites are the most common way in.',look:'It says the browser is up to date and shows a version number. Safari updates with macOS and iOS.',
 bad:'The browser is out of date and may have known flaws.',fix:['Let it update, then relaunch.','Keep automatic updates on.'],sev:'high',sevWhy:'Websites are the most common way attackers reach a device.'},
{id:'b-ext',area:'browser',t:'Every extension is one you know and use',
 path:{chrome:['Menu (three dots)','Extensions','Manage Extensions'],edge:['Menu (three dots)','Extensions','Manage extensions'],firefox:['Menu (three lines)','Add-ons and themes','Extensions'],safari:['Safari menu','Settings','Extensions'],default:['Browser menu','Extensions or Add-ons']},
 why:'An extension can read the pages you visit, including what you type.',look:'You recognise and use every extension, each from a publisher you know.',
 bad:'There are extensions you do not recognise.',fix:['Remove any you do not recognise or no longer use.','If one looks malicious, change passwords for important accounts from a clean device.'],
 sev:'high',sevWhy:'A single malicious extension can read passwords and sessions.'},
{id:'b-safe',area:'browser',t:'Phishing and malware protection is on',
 path:{chrome:['Menu (three dots)','Settings','Privacy and security','Security','Safe Browsing'],edge:['Menu (three dots)','Settings','Privacy, search, and services','Security','Microsoft Defender SmartScreen'],firefox:['Menu (three lines)','Settings','Privacy & Security','Security','Block dangerous and deceptive content'],safari:['Safari menu','Settings','Security','Fraudulent website warning'],default:['Browser settings','Privacy or Security','Safe browsing / phishing protection']},
 why:'It warns you before you open known fake or dangerous sites.',look:'Standard or Enhanced protection (Chrome), SmartScreen on (Edge), or the matching option ticked.',
 bad:'The protection is switched off.',fix:['Turn it on (Standard or higher).'],sev:'attention',sevWhy:'It removes a warning layer but is not an attack in itself.'},
{id:'b-site',area:'browser',t:'Site permissions are limited to sites you trust',
 path:{chrome:['Menu (three dots)','Settings','Privacy and security','Site settings','Permissions'],edge:['Menu (three dots)','Settings','Cookies and site permissions'],firefox:['Menu (three lines)','Settings','Privacy & Security','Permissions'],safari:['Safari menu','Settings','Websites'],default:['Browser settings','Site permissions']},
 why:'Notification permission from fake sites is a common scam route.',look:'Camera, microphone, location and notifications are allowed only for sites you trust. No unfamiliar notification senders.',
 bad:'Unfamiliar sites have permissions.',fix:['Remove sites you do not recognise.','Set notifications to ask first, or block.'],sev:'attention',sevWhy:'Excess permissions are a risk, not proof of abuse.'},
{id:'b-pw',area:'browser',t:'Saved passwords are not flagged as weak, reused or breached',
 path:{chrome:['Menu (three dots)','Passwords and autofill','Google Password Manager','Checkup'],edge:['Menu (three dots)','Settings','Profiles','Passwords','Password Monitor'],firefox:['Menu (three lines)','Passwords (about:logins)','Look for alerts'],safari:['Apple menu','System Settings','Passwords','Security Recommendations'],default:['Your password manager','Security report']},
 why:'A reused or breached password lets one leak open other accounts.',look:'No reused, weak or breached passwords flagged for important accounts.',
 bad:'Some saved passwords are flagged.',fix:['Change flagged passwords, starting with email, banking and shopping.','Use a unique password per account.'],sev:'attention',sevWhy:'Flagged passwords are exposure, so fix important ones first.'},
/* ---- NETWORK ---- */
{id:'n-admin',area:'network',t:'The router admin password is not the default',path:['Open a browser','Type the router address from its label (often 192.168.0.1 or 192.168.1.1)','Sign in with the admin login'],
 why:'Default router logins are published online. Whoever controls the router controls the network.',look:'You set your own admin password. It is not "admin", "password" or the default printed on the router.',
 bad:'The router still uses a default admin login.',fix:['In the router settings find Administration (or System), then Password, and set a long unique one.','Keep it somewhere safe at home.'],
 sev:'high',sevWhy:'Default logins are public knowledge, and the router sits in front of every device you own.'},
{id:'n-wifi',area:'network',t:'Wi-Fi uses strong encryption',path:['Router admin page','Wireless (or Wi-Fi)','Security mode'],
 why:'Weak or no encryption lets nearby people capture your traffic or join the network.',look:'WPA3, or WPA2 with AES (WPA2-PSK AES). Not WEP, WPA alone, TKIP only, or Open.',
 bad:'Wi-Fi uses weak or no encryption.',fix:['Switch to WPA3, or WPA2-AES if older devices need it.','Set a Wi-Fi password of 12+ characters that is not the one printed on the router.','Reconnect your devices.'],
 sev:'high',sevWhy:'Weak Wi-Fi encryption can be broken from outside your home.'},
{id:'n-remote',area:'network',t:'Remote management is off',path:['Router admin page','Administration (or Advanced)','Remote management / Remote access'],
 why:'When on, the router login can be reached from the internet.',look:'Remote management is Off.',
 bad:'The router login is reachable from the internet.',fix:['Turn remote management off.','If you need remote access, use a VPN back into your home instead.'],
 sev:'high',sevWhy:'An exposed router login is attacked constantly.'},
{id:'n-fw',area:'network',t:'Router firmware is current',path:['Router admin page','Administration (or System)','Firmware update'],
 why:'Router flaws are patched through firmware. If your ISP manages the router, they may do this for you.',look:'The latest firmware is installed, or auto-update is on.',
 bad:'The firmware is old, or the model no longer gets updates.',fix:['Install the update from the router page. Never use firmware from unofficial sites.','If the model is no longer supported, plan to replace it.'],
 sev:'attention',sevWhy:'It depends on whether the old version has known flaws.'},
{id:'n-dev',area:'network',t:'You recognise every connected device',path:['Router admin page','Connected devices (or DHCP clients, Device list)'],
 why:'An unknown device may be a neighbour, or someone using your network.',look:'Every listed device is yours: phones, laptops, TVs, consoles, printers.',
 bad:'There is a device you do not recognise.',fix:['Change the Wi-Fi password, which disconnects everyone, then reconnect your own devices.','Check the list again afterwards.'],
 sev:'high',sevWhy:'An unknown device on your network can see and reach others.'},
{id:'n-dns',area:'network',t:'DNS servers are the ones you expect',path:['Router admin page','Internet (or WAN)','DNS servers'],
 why:'DNS decides where web addresses lead. Attackers change it to send you to fake banking and email sites.',look:'Automatic (from your ISP), or a public resolver you chose on purpose, such as 1.1.1.1, 8.8.8.8 or 9.9.9.9.',
 bad:'DNS points at addresses you do not recognise.',fix:['Reset DNS to automatic, or to a known public resolver.','Change the router admin and Wi-Fi passwords, and update the firmware.','Check DNS settings on your devices too.'],
 sev:'critical',sevWhy:'A hijacked DNS setting can redirect banking and email sites to fakes with no visible sign.'},
/* ---- ACCOUNTS ---- */
{id:'c-2sv',area:'accounts',t:'Your main email has two-step verification',path:['Sign in to your main email account','Security (or Account, then Security)','2-Step Verification / Two-step / MFA'],
 why:'Email resets every other account. Whoever has it can take over the rest.',look:'It is on, using an authenticator app or passkey. SMS codes are better than nothing but weaker.',
 bad:'Your email has no second step.',fix:['Turn on 2-step verification, preferring an authenticator app or passkey.','Save the backup codes offline.'],
 sev:'high',sevWhy:'One stolen or guessed password would then open your whole digital life.'},
{id:'c-pw',area:'accounts',t:'Important accounts have different passwords',path:['Open your password manager','Security report (Password Checkup, Watchtower, Security dashboard)'],
 why:'When one site leaks a password, attackers try it everywhere.',look:'No reused passwords on email, banking, shopping or cloud accounts. No password manager? Ask yourself honestly: do any of those share a password?',
 bad:'Passwords are reused across important accounts.',fix:['Start with email, banking and cloud storage: give each its own password.','Use a password manager so you do not have to remember them.'],
 sev:'high',sevWhy:'Reuse turns one breach into many.'},
{id:'c-act',area:'accounts',t:'Recent sign-ins on your email are all yours',path:['Your main email account','Security','Recent activity / Your devices / Where you\'re signed in'],
 why:'Unfamiliar sign-ins are one of the clearest signs of a takeover.',look:'Every device and location is yours. Mobile networks can show a nearby city, which is normal.',
 bad:'There are sign-ins you do not recognise.',fix:['Sign out of all other sessions now.','Change the password, then check forwarding and recovery options.','Follow the Emergency Response steps for a hacked account.'],
 sev:'critical',sevWhy:'Unknown sign-ins mean someone else may already be inside the account.'},
{id:'c-fwd',area:'accounts',t:'Your email has no hidden forwarding or filter rules',path:['Your email settings','Forwarding','Filters / Rules'],
 why:'Attackers who get into an email account often add rules that forward or hide mail, so you do not notice. Gmail: Settings, See all settings, Forwarding and POP/IMAP, then Filters. Outlook: Settings, Mail, Forwarding and Rules.',
 look:'No forwarding address you do not recognise, and no rule that hides, archives or deletes incoming mail you did not set up.',
 bad:'There is an unfamiliar forwarding address or rule.',fix:['Delete the unknown forwarding and rules.','Change the password, turn on 2-step verification, and sign out other sessions.'],
 sev:'critical',sevWhy:'Hidden forwarding is a common sign that someone already has access.'},
{id:'c-rec',area:'accounts',t:'Recovery phone and email are current',path:['Your main email account','Security','Recovery phone / Recovery email'],
 why:'Recovery details decide who can reset your password.',look:'The recovery number and address are current and belong to you.',
 bad:'Recovery details are old or not yours.',fix:['Replace them with details only you control.'],sev:'attention',sevWhy:'Wrong recovery details matter when you are locked out or attacked.'},
{id:'c-hibp',area:'accounts',t:'Your email address in known data breaches',path:['Open haveibeenpwned.com','Enter your email address'],
 why:'It shows which public breaches included your address, so you know which passwords to change.',look:'"Good news — no pwnage found", or you have already changed the password at each listed breach.',
 bad:'Your address appears in breaches.',fix:['Change the password on each listed service, and anywhere you reused it.','Turn on two-step verification where offered.'],
 sev:'attention',sevWhy:'Appearing in a breach is exposure, not proof anyone got in.'},
{id:'c-bank',area:'accounts',t:'Banking alerts and limits are set',path:['Your banking app','Settings or Profile','Security and notifications'],
 why:'Instant alerts let you catch fraud within minutes. Menus differ by bank.',look:'Transaction notifications are on and you have set sensible limits.',
 bad:'Alerts or limits are not set.',fix:['Turn on transaction notifications.','Set daily limits that fit how you actually spend.'],sev:'attention',sevWhy:'It reduces how fast fraud is noticed, not whether it can happen.'}
];
GUIDED.forEach(g=>g.mode='guided');
const CHECKS=[...DIRECT,...GUIDED].sort((a,b)=>AREA_ORDER.indexOf(a.area)-AREA_ORDER.indexOf(b.area));
const byId=id=>CHECKS.find(c=>c.id===id);
const counts=a=>({d:CHECKS.filter(c=>c.area===a&&c.mode==='direct').length,g:CHECKS.filter(c=>c.area===a&&c.mode==='guided').length});
function pathFor(c){return Array.isArray(c.path)?c.path:(c.path[S.det.br.key]||c.path.default);}

/* ============ navigation ============ */
function go(screen,opts){
  S.screen=screen;
  $$('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===screen?'page':'false'));
  ({home:renderHome,select:renderSelect,scan:()=>{},report:renderReport,learn:renderLearn,threats:renderThreats,emergency:renderEmergency}[screen])(opts);
  window.scrollTo(0,0);
}
$$('nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
$('#brand').addEventListener('click',()=>go('home'));

/* ============ HOME ============ */
function renderHome(){
  app.innerHTML=`
  <section class="hero">
    <div>
      <p class="label">PixelProTech // personal security diagnostic</p>
      <h1 class="title">PIXEL SCAN<span class="cur" aria-hidden="true"></span></h1>
      <p class="core-msg">SCAN YOUR DIGITAL LIFE. KNOW WHAT NEEDS ATTENTION.</p>
      <p class="sub">Inspect. Understand. Protect.</p>
      <div class="cta"><button class="btn primary" id="run">Run Pixel Scan</button></div>
      <div class="secondary">
        <button class="btn ghost sm" data-go="learn">Learn</button>
        <button class="btn ghost sm" data-go="pick">Check specific area</button>
        <button class="btn ghost sm" data-go="threats">Threat library</button>
        <button class="btn ghost sm" data-go="emergency">Emergency response</button>
      </div>
      <p class="honest">PIXEL SCAN tests what a browser can honestly test, and walks you through the rest. It does not scan for malware, and it never reports a result it did not get.</p>
    </div>
    <div class="term core">
      <div class="bar"><i></i><i></i><i></i><span>pixel-scan-core // browser capability map</span></div>
      <div class="body">
        <p class="corestat" id="coreStat" aria-live="polite">&gt; waiting</p>
        <div class="capgrid" id="capgrid">${CAPS.map((c,i)=>`<button class="cap" data-i="${i}" aria-label="${esc(c[1])}">${c[0]}</button>`).join('')}</div>
        <div class="capinfo" id="capinfo">Select a cell to see what it means.</div>
        <div class="legend">
          <span><b style="background:var(--teal)"></b>available: can be checked directly</span>
          <span><b style="border:1px dashed var(--muted)"></b>not available: guided check</span>
        </div>
      </div>
    </div>
  </section>`;
  $('#run').onclick=()=>go('select',{preset:true});
  $$('[data-go]').forEach(b=>b.onclick=()=>{b.dataset.go==='pick'?go('select',{preset:false}):go(b.dataset.go)});
  const cells=$$('.cap');
  const info=$('#capinfo');
  const show=i=>{const c=S.caps[i];cells.forEach(x=>x.classList.remove('sel'));cells[i].classList.add('sel');
    info.innerHTML=`<b class="teal">${c.code}</b> ${esc(c.name)}: <b>${c.ok?'available':'not available'}</b>. ${c.ok?'PIXEL SCAN may use this for a direct check.':'Anything that depends on it becomes a guided check.'} This probe tests whether the capability exists, not whether you are safe.`;};
  cells.forEach((b,i)=>{b.addEventListener('click',()=>show(i));b.addEventListener('mouseenter',()=>show(i));});
  bootCore(cells);
}
async function bootCore(cells){
  const stat=$('#coreStat');
  const paint=i=>cells[i]&&cells[i].classList.add(S.caps[i].ok?'on':'off');
  const done=()=>{const n=S.caps.filter(c=>c.ok).length;stat&&(stat.textContent=`> ${n} of ${S.caps.length} capabilities available. Everything else is a guided check.`);};
  if(S.booted){S.caps.forEach((_,i)=>paint(i));done();return;}
  for(let i=0;i<S.caps.length;i++){
    if(S.screen!=='home'||!document.body.contains(cells[i]))return;
    stat.textContent=`> probing ${S.caps[i].code}  ${S.caps[i].name.toLowerCase()} ...`;
    await wait(105);paint(i);
  }
  S.booted=true;done();
}

/* ============ SELECT ============ */
function renderSelect(opts){
  const preset=!opts||opts.preset!==false;
  if(preset){S.areas=new Set([S.det.os!=='unknown'?S.det.os:null,'browser','network'].filter(Boolean));}
  else S.areas=new Set();
  const o=S.det.os,b=S.det.br;
  app.innerHTML=`
  <section class="screen">
    <p class="label">Step 1 // scope</p>
    <h2 class="h2">WHAT ARE WE INSPECTING?</h2>
    <p class="lead">Choose one or more areas. PIXEL SCAN does not get access to everything automatically: every check is labelled by how it is performed.</p>
    <div class="terms3">
      <div><b>DIRECT CHECK</b>PIXEL SCAN tests it itself, from this browser, and shows the evidence.</div>
      <div><b>GUIDED CHECK</b>PIXEL SCAN cannot inspect this area from your browser. It shows you exactly where to look.</div>
      <div><b>USER CONFIRMATION</b>You tell us what you found. We record it as your report, not as verified fact.</div>
    </div>
    ${preset?`<p class="fine" style="margin:0 0 14px">Pre-selected from what your browser reports (${o==='unknown'?'system not recognised':AREAS[o].label}, ${esc(b.name)}). Browsers can be configured to report otherwise: change anything.</p>`:''}
    <div class="areas" id="areas">
      ${AREA_ORDER.map(k=>{const c=counts(k);const dt=(k===o)?`THIS DEVICE REPORTS ${AREAS[k].label}`:(k==='browser'?`REPORTS ${esc(b.name.toUpperCase())}${b.ver?' '+b.ver:''}`:'');
        return `<button class="area" data-k="${k}" aria-pressed="${S.areas.has(k)}">
          <span class="ic">${ICON[k]}</span><span class="nm">${AREAS[k].label}</span><span class="sb">${AREAS[k].sub}</span>
          <span class="ct">DIRECT ${c.d} · GUIDED ${c.g}</span>
          ${dt?`<span class="det">${dt}</span>`:''}
          <span class="mk"></span></button>`}).join('')}
    </div>
    <div class="selbar"><button class="btn primary" id="go" disabled>Inspect</button><span class="muted" id="selmsg"></span></div>
  </section>`;
  const sync=()=>{
    $$('.area').forEach(a=>{const on=S.areas.has(a.dataset.k);a.setAttribute('aria-pressed',on);$('.mk',a).textContent=on?'[ x ] SELECTED':'[   ] SELECT';});
    const n=S.areas.size,tot=[...S.areas].reduce((s,k)=>{const c=counts(k);return{d:s.d+c.d,g:s.g+c.g}},{d:0,g:0});
    $('#go').disabled=!n;$('#go').textContent=n?`Inspect ${n} area${n>1?'s':''}`:'Inspect';
    $('#selmsg').textContent=n?`${tot.d} direct checks, ${tot.g} guided checks (about ${Math.max(1,Math.round(tot.g*0.6))} min).`:'Select at least one area.';
  };
  $$('.area').forEach(a=>a.onclick=()=>{S.areas.has(a.dataset.k)?S.areas.delete(a.dataset.k):S.areas.add(a.dataset.k);sync();});
  $('#go').onclick=runScan;sync();
}

/* ============ grid ============ */
function buildGrid(checks,interactive){
  return AREA_ORDER.filter(a=>checks.some(c=>c.area===a)).map(a=>`
    <div class="sector"><div class="sector-label">${AREAS[a].label}</div><div class="cells">
    ${checks.filter(c=>c.area===a).map(c=>{const r=S.results[c.id];const cls=r?r.s:'';const t=`${c.t}: ${r?ST[r.s].l:'pending'}`;
      return interactive?`<button class="cell ${cls}" id="cell-${c.id}" data-jump="${c.id}" title="${esc(t)}" aria-label="${esc(t)}"></button>`
                        :`<span class="cell ${cls}" id="cell-${c.id}" title="${esc(t)}" role="img" aria-label="${esc(t)}"></span>`}).join('')}
    </div></div>`).join('');
}
function gridLegend(){
  return `<div class="glegend">
   <span><i class="cell checked"></i>checked</span><span><i class="cell attention"></i>needs attention</span>
   <span><i class="cell high"></i>high priority</span><span><i class="cell critical"></i>critical</span>
   <span><i class="cell unconfirmed"></i>not confirmed</span><span><i class="cell nt"></i>not testable</span>
   <span><i class="cell await"></i>waiting for you</span></div>`;
}
function setCell(id,cls){const c=$('#cell-'+id);if(!c)return;c.className='cell '+(cls||'');}

/* ============ SCAN ============ */
const STAGES=['IDENTIFY','TEST','GUIDE','INTERPRET','PRIORITIZE','FIX','VERIFY'];
async function runScan(){
  S.results={};
  S.checks=CHECKS.filter(c=>S.areas.has(c.area));
  const id=++S.scanId;S.screen='scan';
  $$('nav button').forEach(b=>b.setAttribute('aria-current','false'));
  app.innerHTML=`
  <section class="screen">
    <p class="label">Step 2 // inspection</p>
    <h2 class="h2">INSPECTION IN PROGRESS</h2>
    <ol class="stages" id="stages">${STAGES.map((s,i)=>`<li data-i="${i}">${String(i+1).padStart(2,'0')} ${s}</li>`).join('')}</ol>
    <div class="scangrid">
      <div>
        <div class="term"><div class="bar"><i></i><i></i><i></i><span>pixel grid // coverage</span></div>
          <div class="body">${buildGrid(S.checks,false)}${gridLegend()}</div></div>
        <div id="card"></div>
      </div>
      <div class="term"><div class="bar"><i></i><i></i><i></i><span>pixel-scan.log</span></div>
        <div class="log" id="log" role="log" aria-live="off" tabindex="0"></div></div>
    </div>
  </section>`;
  window.scrollTo(0,0);
  const alive=()=>S.scanId===id&&S.screen==='scan';
  const logEl=$('#log');
  const log=(tag,msg,cls)=>{if(!alive())return;const d=document.createElement('div');d.innerHTML=`<span class="tg t-${cls||''}">[${tag}]</span> ${esc(msg)}`;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;};
  const stage=n=>{if(!alive())return;$$('#stages li').forEach((li,i)=>{li.className=i<n?'done':i===n?'act':'';});};

  /* 01 IDENTIFY */
  stage(0);
  const o=S.det.os,b=S.det.br;
  log('IDENTIFY',`browser reports: ${b.name}${b.ver?' '+b.ver:''}, system: ${o==='unknown'?'not recognised':AREAS[o].label}`,'t');await wait(250);
  log('IDENTIFY',`areas selected: ${[...S.areas].map(k=>AREAS[k].label).join(', ')}`);await wait(200);
  const dc=S.checks.filter(c=>c.mode==='direct'),gc=S.checks.filter(c=>c.mode==='guided');
  log('IDENTIFY',`${dc.length} direct checks possible, ${gc.length} need a guided check`);await wait(250);
  const missing=CAPS.filter(c=>!S.caps.find(x=>x.code===c[0]).ok).map(c=>c[0]);
  if(missing.length)log('IDENTIFY',`browser lacks: ${missing.join(' ')}`);
  await wait(250);

  /* 02 TEST */
  if(!alive())return;stage(1);
  for(const c of dc){
    if(!alive())return;
    setCell(c.id,'testing');await wait(160);
    let r;try{r=await c.run();}catch(e){r={s:'nt',d:'The check threw an error in this browser: '+(e&&e.message||e)};}
    S.results[c.id]={...r,src:'direct',at:new Date()};
    setCell(c.id,r.s);
    log('TEST',`${c.id} -> ${ST[r.s].l}`,r.s==='checked'||r.s==='info'?'t':r.s==='nt'?'':r.s==='attention'?'g':r.s==='high'?'h':'c');
    await wait(90);
  }
  if(!dc.length)log('TEST','no direct checks exist for the selected areas. All checks are guided.','g');

  /* 03 GUIDE */
  if(!alive())return;stage(2);
  for(let i=0;i<gc.length;i++){
    const c=gc[i];if(!alive())return;
    log('GUIDE',`${AREAS[c.area].label}: ${c.t}`,'v');
    setCell(c.id,'await');
    const ans=await askGuided(c,`${i+1} of ${gc.length}`,$('#card'));
    if(!alive())return;
    log('USER',`reported: ${ans==='good'?'looks good':ans==='attention'?'needs attention':'not sure'}`,ans==='good'?'t':ans==='attention'?'g':'');
    setCell(c.id,S.results[c.id].s);
  }
  if(!alive())return;
  $('#card').innerHTML='';

  /* 04-07 */
  stage(3);const R=Object.values(S.results);
  log('INTERPRET',`${R.length} results: ${R.filter(r=>r.src==='direct').length} measured by PIXEL SCAN, ${R.filter(r=>r.src==='user').length} reported by you`);await wait(350);
  stage(4);const n=k=>R.filter(r=>r.s===k).length;
  log('PRIORITIZE',`critical ${n('critical')}, high ${n('high')}, needs attention ${n('attention')}`,n('critical')?'c':n('high')?'h':'t');await wait(350);
  stage(5);log('FIX',`${R.filter(r=>ST[r.s].r>=3).length} findings have a defined defensive action`);await wait(350);
  stage(6);log('VERIFY','re-check any item from the report after you fix it','t');await wait(500);
  stage(7);if(alive())go('report');
}

/* ============ guided card ============ */
function askGuided(c,pos,host,onDone){
  return new Promise(res=>{
    const finish=ans=>{applyGuided(c,ans);showResult(c,ans,host,()=>{res(ans);onDone&&onDone(ans);});};
    host.innerHTML=guidedHTML(c,pos);
    $$('[data-ans]',host).forEach(b=>b.onclick=()=>finish(b.dataset.ans));
    const h=$('h3',host);h&&h.setAttribute('tabindex','-1');
    host.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});
  });
}
function guidedHTML(c,pos){
  const steps=c.cmd?`<div class="cmds">${c.cmd.map(x=>`<div class="cmd"><span class="pr">$</span> ${esc(x)}</div>`).join('')}</div>`
                    :`<ol class="path">${pathFor(c).map(p=>`<li>${esc(p)}</li>`).join('')}</ol>`;
  return `<div class="term gc"><div class="bar"><i></i><i></i><i></i><span>guided check // ${AREAS[c.area].label.toLowerCase()}${pos?' // '+pos:''}</span></div>
  <div class="body">
    <p class="label">PIXEL SCAN cannot directly inspect this area from your browser.</p>
    <h3>${esc(c.t)}</h3>
    <div class="sec"><p class="label">${c.cmd?'Run in a terminal':'Where to look'}</p>${steps}</div>
    <div class="sec"><p class="label">Why it matters</p><p>${esc(c.why)}</p></div>
    <div class="sec"><p class="label">Good looks like</p><p>${esc(c.look)}</p></div>
    <div class="ask"><p class="label teal">What did you find?</p>
      <div class="row">
        <button class="btn" data-ans="good">Everything looks good</button>
        <button class="btn" data-ans="attention">Something needs attention</button>
        <button class="btn ghost" data-ans="unknown">I don't know</button>
      </div>
      <p class="fine">Your answer is recorded as USER-REPORTED. PIXEL SCAN cannot see your screen, so it will not call this verified.</p>
    </div></div></div>`;
}
function applyGuided(c,ans){
  const at=new Date();
  S.results[c.id]=ans==='good'?{s:'checked',src:'user',d:'You reported this looks good. PIXEL SCAN could not verify it.',at}
    :ans==='attention'?{s:c.sev,src:'user',d:c.bad,sev:c.sevWhy,fix:c.fix,at}
    :{s:'unconfirmed',src:'user',d:'You were not sure what you found, so this stays unconfirmed.',at};
}
function showResult(c,ans,host,next){
  const r=S.results[c.id];
  let body;
  if(ans==='good')body=`<div class="res s-checked"><p><span class="tag s-checked">CHECKED</span><span class="src">USER-REPORTED</span></p><p>Recorded as checked, on your word. Nothing was measured here.</p></div>`;
  else if(ans==='attention')body=`<div class="res s-${r.s}"><p><span class="tag solid s-${r.s}">${ST[r.s].l}</span><span class="src">USER-REPORTED</span></p>
    <p>${esc(c.bad)}</p><p class="muted">Why this priority: ${esc(c.sevWhy)}</p>
    <p class="label" style="margin-top:12px">Fix</p><ol class="fixl">${c.fix.map(f=>`<li>${esc(f)}</li>`).join('')}</ol>
    <p class="fine">After fixing, use Re-check on this item in the report.</p></div>`;
  else body=`<div class="res s-unconfirmed"><p><span class="tag s-unconfirmed">NOT CONFIRMED</span></p>
    <p>No problem. Read the "good looks like" line once more: <span class="teal">${esc(c.look)}</span></p><p class="fine">You can re-check this from the report. It will not count as checked until you confirm it.</p></div>`;
  host.innerHTML=`<div class="term gc"><div class="bar"><i></i><i></i><i></i><span>interpretation // ${esc(c.id)}</span></div><div class="body"><h3 tabindex="-1">${esc(c.t)}</h3>${body}
    <button class="btn primary" id="next">${host.id==='card'?'Next':'Done'}</button></div></div>`;
  const nb=$('#next',host);nb.focus();nb.onclick=next;
}

/* ============ REPORT ============ */
function tally(){
  const t={checked:0,attention:0,high:0,critical:0,unconfirmed:0};
  Object.values(S.results).forEach(r=>{
    if(r.s==='checked'||r.s==='info')t.checked++;else if(r.s==='nt'||r.s==='unconfirmed')t.unconfirmed++;else t[r.s]++;});
  return t;
}
function renderReport(){
  const R=S.results,t=tally();
  const ids=S.checks.map(c=>c.id);
  const items=S.checks.filter(c=>R[c.id]).sort((a,b)=>ST[R[b.id].s].r-ST[R[a.id].s].r);
  const findings=items.filter(c=>ST[R[c.id].s].r>=3);
  const open=items.filter(c=>['unconfirmed','nt'].includes(R[c.id].s));
  const ok=items.filter(c=>['checked','info'].includes(R[c.id].s));
  let vc,vt;
  if(t.critical){vc='critical';vt=`${t.critical} critical finding${t.critical>1?'s':''}. Act on ${t.critical>1?'these':'this'} first, before anything else on the list.`;}
  else if(t.high){vc='high';vt=`${t.high} high-priority finding${t.high>1?'s':''}. Fix ${t.high>1?'these':'this'} first.`;}
  else if(t.attention){vc='attention';vt=`Nothing urgent. ${t.attention} item${t.attention>1?'s need':' needs'} attention.`;}
  else if(t.unconfirmed){vc='unconfirmed';vt=`No problems reported, but ${t.unconfirmed} check${t.unconfirmed>1?'s are':' is'} not confirmed.`;}
  else{vc='checked';vt='Every check completed without findings.';}
  const when=new Date().toLocaleString();
  app.innerHTML=`
  <section class="screen">
    <p class="label">Step 3 // report · ${esc(when)}</p>
    <h2 class="h2">INSPECTION REPORT</h2>
    <div class="verdict s-${vc}" style="--c:var(--${vc==='high'?'high':vc==='critical'?'crit':vc==='attention'?'gold':vc==='unconfirmed'?'muted':'teal'})"><p><b class="s-${vc}" style="color:var(--c)">${vt}</b></p>
      <p class="muted" style="margin-top:6px">There is no overall score. A single percentage would hide which checks were skipped. This report cannot prove a device is free of malware.</p></div>
    <div class="counts">
      <div class="count" style="--c:var(--teal)"><b>${t.checked}</b><span>CHECKED</span></div>
      <div class="count" style="--c:var(--gold)"><b>${t.attention}</b><span>NEEDS ATTENTION</span></div>
      <div class="count" style="--c:var(--high)"><b>${t.high}</b><span>HIGH PRIORITY</span></div>
      <div class="count" style="--c:var(--crit)"><b>${t.critical}</b><span>CRITICAL</span></div>
      <div class="count" style="--c:var(--muted)"><b>${t.unconfirmed}</b><span>NOT CONFIRMED</span></div>
    </div>
    <div class="term"><div class="bar"><i></i><i></i><i></i><span>pixel grid // coverage (select a cell to jump)</span></div><div class="body">${buildGrid(S.checks,true)}${gridLegend()}</div></div>

    ${findings.length?`<h3 class="h2" style="font-size:22px;margin-top:34px">FINDINGS</h3>
      ${findings.map(c=>findingHTML(c)).join('')}`:''}

    ${open.length?`<h3 class="h2" style="font-size:22px;margin-top:34px">NOT CONFIRMED</h3>
      <p class="lead" style="margin-bottom:12px">These were skipped, unsure, or could not be tested here. They are not counted as safe.</p>
      ${open.map(c=>findingHTML(c)).join('')}`:''}

    ${ok.length?`<h3 class="h2" style="font-size:22px;margin-top:34px">CHECKED</h3>
      <ul class="okl">${ok.map(c=>`<li id="f-${c.id}"><span class="tag s-${R[c.id].s}">${ST[R[c.id].s].l}</span><span><b style="color:var(--text)">${esc(c.t)}</b> <span class="src">${R[c.id].src==='direct'?'DIRECT':'USER-REPORTED'}</span><br>${esc(R[c.id].d)}</span></li>`).join('')}</ul>`:''}

    <div class="actions">
      <button class="btn primary" id="copy">Copy report</button>
      <button class="btn" id="again">Scan other areas</button>
      <button class="btn ghost" data-go-em>Emergency response</button>
    </div>
    <div id="copybox"></div>
  </section>`;
  $$('[data-jump]').forEach(b=>b.onclick=()=>{const t=$('#f-'+b.dataset.jump);if(t){t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});t.setAttribute('tabindex','-1');t.focus({preventScroll:true});}});
  $$('[data-recheck]').forEach(b=>b.onclick=()=>recheck(b.dataset.recheck));
  $('#copy').onclick=copyReport;
  $('#again').onclick=()=>go('select',{preset:false});
  $('[data-go-em]').onclick=()=>go('emergency');
}
function findingHTML(c){
  const r=S.results[c.id];const sev=r.s;
  const fix=r.fix?`<p class="label">Fix</p><ol class="fixl">${r.fix.map(f=>`<li>${esc(f)}</li>`).join('')}</ol>`:'';
  const why=r.sev?`<p class="muted">Why this priority: ${esc(r.sev)}</p>`:'';
  const look=(c.mode==='guided'&&sev==='unconfirmed')?`<p><span class="label">Good looks like</span><br>${esc(c.look)}</p>`:'';
  return `<article class="finding s-${sev}" id="f-${c.id}"><header>
    <span class="tag solid s-${sev}">${ST[sev].l}</span><h3>${esc(c.t)}</h3>
    <span class="src">${AREAS[c.area].label} · ${r.src==='direct'?'DIRECT CHECK':'USER-REPORTED'}</span></header>
    <div class="fb"><p>${esc(r.d)}</p>${why}${look}${fix}
    <div style="margin-top:14px"><button class="btn sm" data-recheck="${c.id}">Re-check</button></div>
    <div id="rc-${c.id}"></div></div></article>`;
}
async function recheck(id){
  const c=byId(id);const host=$('#rc-'+id);if(!host)return;
  if(c.mode==='direct'){
    let r;try{r=await c.run();}catch(e){r={s:'nt',d:'The check threw an error: '+(e&&e.message||e)};}
    S.results[id]={...r,src:'direct',at:new Date()};renderReport();
    const t=$('#f-'+id);t&&t.scrollIntoView({block:'center'});return;
  }
  host.className='gc';host.style.marginTop='14px';
  askGuided(c,'re-check',host,()=>{renderReport();const t=$('#f-'+id);t&&t.scrollIntoView({block:'center'});});
}
function reportText(){
  const R=S.results,t=tally();
  const lines=[`PIXEL SCAN REPORT (PixelProTech) — ${new Date().toLocaleString()}`,
   `Areas: ${[...S.areas].map(k=>AREAS[k].label).join(', ')}`,
   `CHECKED ${t.checked} | NEEDS ATTENTION ${t.attention} | HIGH PRIORITY ${t.high} | CRITICAL ${t.critical} | NOT CONFIRMED ${t.unconfirmed}`,
   'Note: guided results are USER-REPORTED and were not verified by PIXEL SCAN. This report cannot prove a device is free of malware.',''];
  S.checks.filter(c=>R[c.id]).sort((a,b)=>ST[R[b.id].s].r-ST[R[a.id].s].r).forEach(c=>{
    const r=R[c.id];lines.push(`[${ST[r.s].l}] ${AREAS[c.area].label}: ${c.t} (${r.src==='direct'?'direct':'user-reported'})`);
    if(ST[r.s].r>=3){lines.push('  '+r.d);(r.fix||[]).forEach((f,i)=>lines.push(`  ${i+1}. ${f}`));}
  });
  return lines.join('\n');
}
async function copyReport(){
  const txt=reportText();const box=$('#copybox');
  try{await navigator.clipboard.writeText(txt);box.innerHTML=`<p class="fine teal">Report copied.</p>`;}
  catch(e){box.innerHTML=`<p class="fine">Your browser blocked copying. Select the text below and copy it yourself.</p><textarea class="copy" readonly aria-label="Report text"></textarea>`;const ta=$('textarea',box);ta.value=txt;ta.focus();ta.select();}
}

/* ============ LEARN ============ */
const LEARN=[
 ['What PIXEL SCAN can and cannot do',`<p>A web page is not allowed to look at your files, installed apps, running programs or other sites. That is a good thing for your privacy, and it is why PIXEL SCAN cannot find malware.</p><p>It can read a handful of safe signals from your browser (the Direct checks), and for everything else it shows you where to look and records what you tell it (the Guided checks). Where it cannot know something, it says so.</p>`],
 ['Updates',`<p>Most attacks use flaws that already have a fix. Updating your system, browser and apps closes them. Turn on automatic updates wherever you can, and replace devices that no longer receive them.</p>`],
 ['Passwords and password managers',`<p>The goal is one unique password per account, so a leak at one site cannot unlock another. Nobody can remember that many, which is what a password manager is for. Protect the manager with one long passphrase and two-step verification.</p>`],
 ['Two-step verification',`<p>A second step stops a stolen password from being enough. Order of strength: passkey or security key, then an authenticator app, then SMS codes. Start with your email, because email resets everything else.</p>`],
 ['Phishing',`<p>Phishing messages create urgency (account locked, parcel held, payment failed) and push you to a fake page. Do not use the link in the message. Open the site or app yourself. Check who the message is really from, and be suspicious of anything that asks for a code, password or payment you did not start.</p>`],
 ['Backups',`<p>Backups are your answer to ransomware, theft and failed drives. Keep three copies of what matters, on two kinds of storage, with one copy somewhere else (or offline). A backup you have never tried to restore is a guess.</p>`],
 ['Public Wi-Fi',`<p>Assume anyone on the same network may be able to see which sites you visit. Websites using HTTPS keep their contents private, but fake hotspots can still lure you to fake pages. Prefer your phone data for banking, keep your system updated, and never accept a prompt to install a certificate or app to "use the Wi-Fi".</p>`]
];
function renderLearn(){
  app.innerHTML=`<section class="screen"><p class="label">Learn</p><h2 class="h2">THE BASICS, IN PLAIN LANGUAGE</h2>
   <p class="lead">Short explanations of the things PIXEL SCAN asks you to check.</p>
   ${LEARN.map((l,i)=>`<details${i===0?' open':''}><summary>${esc(l[0])}</summary><div class="dbody">${l[1]}</div></details>`).join('')}
   <div class="actions"><button class="btn primary" data-go-run>Run Pixel Scan</button></div></section>`;
  $('[data-go-run]').onclick=()=>go('select',{preset:true});
}

/* ============ THREATS ============ */
const THREATS=[
 ['Phishing','A fake message or site that imitates a bank, courier, employer or service to steal logins, codes or payments.','Urgency, a link to an address that is almost right, a request for a one-time code, or a login page you reached from a message.','Do not use the link. Open the real site yourself. If you entered a password, change it and follow Emergency Response.'],
 ['Credential stuffing','Attackers take passwords leaked from one site and try them on others.','Login alerts you did not trigger, or password-reset emails you did not request.','Use a unique password per account, turn on two-step verification, and check your email address against known breaches.'],
 ['Infostealer malware','A program that quietly copies saved passwords, browser sessions and crypto wallets. It often arrives as cracked software or a fake installer.','Accounts accessed from places you have not been, even though your password never changed.','Disconnect the device, change passwords from a clean device, sign out of all sessions, then clean or reinstall the system.'],
 ['Ransomware','Malware that encrypts your files and demands payment.','Files will not open, renamed with odd extensions, or a ransom note on screen.','Disconnect from the network at once. Do not pay in a panic. Restore from a backup that was offline. Get help before reconnecting.'],
 ['Malicious browser extension','An extension that looks useful but reads your browsing, injects ads, or captures what you type.','Unexpected ads, changed search engine or home page, or an extension you do not remember installing.','Remove it, update the browser, and change passwords for important accounts.'],
 ['SIM swap','A criminal convinces your mobile provider to move your number to their SIM, then receives your SMS codes.','Your phone suddenly loses signal while Wi-Fi still works, followed by account or bank alerts.','Use Wi-Fi or another phone to call your provider and your bank straight away. Move accounts off SMS codes to an authenticator app.'],
 ['Fake tech support and remote access scams','A caller or pop-up claims your device is infected, and asks you to install remote-control software or "refund" you.','Pressure, a request to install AnyDesk or similar, or an instruction to log in to your bank so they can "fix" it.','Hang up. Never let someone you did not contact control your device or bank. If you did, follow Emergency Response.'],
 ['Router DNS hijack','Someone changes the DNS setting on your router, so real addresses lead to fake sites.','Banking or email sites behaving oddly, certificate warnings, or DNS settings you did not choose.','Reset DNS to automatic, change the router password, update firmware, and check each device.']
];
function renderThreats(){
  app.innerHTML=`<section class="screen"><p class="label">Threat library</p><h2 class="h2">WHAT YOU ARE DEFENDING AGAINST</h2>
   <p class="lead">Common threats to ordinary people, how they usually show up, and the first thing to do.</p>
   ${THREATS.map(t=>`<details><summary>${esc(t[0])}</summary><div class="dbody"><p>${esc(t[1])}</p><div class="cols2"><div><p class="label">How it shows up</p><p>${esc(t[2])}</p></div><div><p class="label">What to do</p><p>${esc(t[3])}</p></div></div></div></details>`).join('')}
  </section>`;
}

/* ============ EMERGENCY ============ */
const EMERG=[
 ['I clicked a suspicious link',['Close the page. Do not type anything into it.','If a file downloaded, do not open it. If you already opened it, disconnect the device from Wi-Fi and run a full scan with your security software.','If you entered a password or card details, use the matching scenario here as well.','Update your system and browser.','Watch your accounts and bank for unusual activity over the next few days.']],
 ['I entered a password on a fake page',['Change that password now, on the real site, typed or opened from your own bookmark. Use a different, clean device if you can.','Change it anywhere else you used the same password, starting with email and banking.','Turn on two-step verification.','Sign out of all other sessions.','Check your email forwarding rules and recovery details.','If card details were entered, call your bank to block the card.']],
 ['An account of mine was hacked',['Go to the official site or app yourself and try to sign in. If you are locked out, use the official account recovery.','Change the password. Sign out of all sessions and remove devices you do not recognise.','Turn on two-step verification and remove recovery details that are not yours.','Check forwarding rules, filters and connected apps.','Warn your contacts if the account sent messages, as they may be phished next.','Change the password anywhere else you used it. Do your email first.']],
 ['I think my device is infected',['Disconnect it from Wi-Fi and unplug any network cable.','Do not log in to anything on it. From another device, change your email and banking passwords.','Run a full scan with the built-in security tool (on Windows: Windows Security, Virus & threat protection, Scan options, Full scan, or Microsoft Defender Offline scan).','Remove apps and extensions you do not recognise.','If it persists, back up your documents and photos only, not programs, and reinstall the operating system.','For business data, get a technician to look at it before you reconnect.']],
 ['Money was taken, or I was scammed',['Call your bank\'s fraud line now. Use the number on your card or inside the official banking app, not one from a message. Ask them to stop or recall payments and block cards.','Do not send more money, including "fees" to get money back.','Keep evidence: screenshots, messages, account numbers, receipts.','Open a case with the police. Banks usually want the case number.','If you installed remote-access software at someone\'s request, remove it and change your banking credentials from a clean device.']],
 ['My phone suddenly has no signal',['Use Wi-Fi or another phone to call your mobile provider now. Ask whether your SIM was swapped, and have the SIM blocked.','Contact your bank immediately and ask them to lock your profile and cards.','Change your email password from a trusted device and move accounts off SMS codes.','Check your accounts for changes you did not make.','Report it to the police and keep the case number.']]
];
function renderEmergency(){
  app.innerHTML=`<section class="screen"><p class="label">Emergency response</p><h2 class="h2">SOMETHING HAS GONE WRONG</h2>
   <div class="alarm"><b>Money moving right now?</b> Call your bank's fraud line first, using the number on your card or inside the official banking app. Do not use a number from a message.</div>
   <p class="lead">Choose what happened. The steps are in the order to do them.</p>
   <div class="scen" id="scen">${EMERG.map((e,i)=>`<button data-i="${i}" aria-pressed="false">${esc(e[0])}</button>`).join('')}</div>
   <div id="steps" aria-live="polite"></div>
   <p class="fine" style="margin-top:28px">Need hands-on help in Gauteng? PixelProTech Solutions provides on-site technical support: pixelprotechsolutions.co.za</p></section>`;
  $$('#scen button').forEach(b=>b.onclick=()=>{
    $$('#scen button').forEach(x=>x.setAttribute('aria-pressed',x===b));
    const e=EMERG[b.dataset.i];
    $('#steps').innerHTML=`<div class="term"><div class="bar"><i></i><i></i><i></i><span>response // ${esc(e[0].toLowerCase())}</span></div><div class="body"><ol class="steps">${e[1].map(s=>`<li><span>${esc(s)}</span></li>`).join('')}</ol></div></div>`;
  });
}

/* ============ init ============ */
S.det={os:detectOS(),br:detectBrowser()};
S.caps=CAPS.map(c=>{let ok=false;try{ok=!!c[2]();}catch(e){}return{code:c[0],name:c[1],ok};});
const START={learn:'learn',threats:'threats',emergency:'emergency',scan:'select'}[location.hash.slice(1)];
go(START||'home',START==='select'?{preset:true}:undefined);

if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});
}
