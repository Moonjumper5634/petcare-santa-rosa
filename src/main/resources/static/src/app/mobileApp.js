/* PetCARE Android presentation layer. The website remains unchanged unless the
   Android client identifies itself or ?app=android is present. */
function isMobileAppMode(){
  return /PetCARE-Android/i.test(navigator.userAgent) || new URLSearchParams(location.search).get("app") === "android";
}

const MOBILE_NAV = [
  ["dashboard", "Home", "dashboard"],
  ["mypets", "My Pets", "petrecords"],
  ["requestservice", "Services", "servicesrecords"],
  ["adopt", "Adopt", "adoptionapplications"],
  ["profile", "Profile", "usermanagement"],
];

function mobileBottomNavigation(active, unread){
  const groups = {
    dashboard:"dashboard", mypets:"mypets", petdetail:"mypets", petregistration:"mypets",
    requestservice:"requestservice", myrequests:"requestservice", requestdetail:"requestservice",
    adopt:"adopt", adoptdetail:"adopt", adoptapply:"adopt", adoptsubmitted:"adopt",
    profile:"profile", notifications:"profile", faq:"profile"
  };
  const current = groups[active] || "dashboard";
  return `<nav class="mobile-bottom-nav" aria-label="App navigation">${MOBILE_NAV.map(([id,label,icon])=>`
    <button class="mobile-nav-item ${current===id?'active':''}" data-mobile-nav="${id}">
      <span class="mobile-nav-icon">${navIcon(icon)}</span><span>${label}</span>
      ${id==="profile" && unread ? `<b class="mobile-nav-badge">${unread}</b>` : ""}
    </button>`).join("")}</nav>`;
}

function mobileServiceCard(icon, title, description, service){
  return `<button class="mobile-service-card" data-mobile-service="${esc(service)}">
    <span class="mobile-service-icon">${icoSvg(icon,24)}</span>
    <span><b>${esc(title)}</b><small>${esc(description)}</small></span>
    <span class="mobile-card-arrow">›</span>
  </button>`;
}

function screenMobileDashboardOwner(u){
  const pets = ownerPets(u.id);
  const pet = pets[0];
  const requests = S.requests.filter(r=>r.ownerId===u.id);
  const registrations = S.registrations.filter(r=>r.ownerId===u.id);
  const pending = requests.filter(r=>r.status!=="Completed" && r.staffDecision!=="Rejected").length
    + registrations.filter(r=>r.status==="Pending").length;
  const shelter = S.shelterPets.filter(p=>p.status!=="Adopted").slice(0,2);
  const firstName = (u.name||"Resident").trim().split(/\s+/)[0];
  const petPhoto = pet && pet.photo ? `<img src="${pet.photo}" alt="${esc(pet.name)}">` : `<span>${pet?esc(pet.name.slice(0,1)):"+"}</span>`;
  return `<div class="mobile-home">
    <section class="mobile-welcome">
      <div><small>Welcome back</small><h2>${esc(firstName)} 👋</h2><p>Care, records and CVO services in one place.</p></div>
      <button class="mobile-bell" data-nav="notifications" aria-label="Notifications">${icoSvg('bell',21)}${unreadCount(u.id)?`<i>${unreadCount(u.id)}</i>`:""}</button>
    </section>

    ${pet ? `<section class="mobile-feature-pet">
      <div class="mobile-feature-avatar">${petPhoto}</div>
      <div class="mobile-feature-copy"><small>My pet</small><h3>${esc(pet.name)}</h3><p>${esc(pet.breed)} · ${esc(pet.sex)}</p></div>
      <button class="mobile-feature-action" data-nav="petdetail" data-pet="${pet.id}">View ID</button>
    </section>` : `<section class="mobile-empty-pet"><div>${icoSvg('paw',28)}</div><h3>Add your first pet</h3><p>Register a dog to keep its records and request services.</p><button class="btn-red" data-nav="petregistration">Register pet</button></section>`}

    <section class="mobile-status-row">
      <div><b>${pets.length}</b><span>My pets</span></div><div><b>${pending}</b><span>In progress</span></div><div><b>${requests.filter(r=>r.status==="Completed").length}</b><span>Completed</span></div>
    </section>

    <section class="mobile-section">
      <div class="mobile-section-head"><div><small>City Veterinary Office</small><h3>Dog services</h3></div><button data-mobile-nav="requestservice">See requests</button></div>
      <div class="mobile-service-list">
        ${mobileServiceCard('vaccine','Anti-rabies','Vaccination request and record','Anti-Rabies Vaccination')}
        ${mobileServiceCard('chip','Microchipping','Permanent pet identification','Microchipping')}
        ${mobileServiceCard('heart','Kapon','Spay or neuter assessment','Kapon / Spay-Neuter')}
      </div>
    </section>

    <section class="mobile-cvo-story">
      <div class="mobile-story-art">${icoSvg('heart',30)}</div>
      <div><small>From the CVO community</small><h3>Vaccinated, identified and rehomed</h3><p>Follow official activities and adoption updates from Santa Rosa City Veterinary Office.</p><a href="https://www.facebook.com/Santarosacityvet" target="_blank" rel="noopener">Official updates ↗</a></div>
    </section>

    ${shelter.length ? `<section class="mobile-section mobile-adopt-preview"><div class="mobile-section-head"><div><small>Looking for a family</small><h3>Dogs to adopt</h3></div><button data-mobile-nav="adopt">View all</button></div><div class="mobile-adopt-row">${shelter.map(d=>`<button data-nav="adoptdetail" data-shelter="${d.id}"><img src="${d.photo}" alt="${esc(d.name)}"><span><b>${esc(d.name)}</b><small>${esc(d.breed)} · ${esc(d.age)}</small></span></button>`).join("")}</div></section>`:""}
  </div>`;
}

const MOBILE_PUBLIC_SERVICES = {
  "Anti-Rabies Vaccination": {icon:"vaccine", title:"Anti-rabies", subtitle:"Protect your dog and community", requirements:["Registered and verified dog", "Current health information", "Follow the announced CVO schedule"]},
  "Microchipping": {icon:"chip", title:"Microchipping", subtitle:"Permanent pet identification", requirements:["Registered and verified dog", "Owner identification", "CVO assessment and appointment"]},
  "Kapon / Spay-Neuter": {icon:"heart", title:"Kapon", subtitle:"Spay or neuter assessment", requirements:["Registered and verified dog", "Health and age assessment", "CVO eligibility decision"]}
};

function guestAppBar(title, back){
  return `<header class="guest-app-bar">${back?`<button data-guest-back aria-label="Back">‹</button>`:`${sealSvg(34)}`}<div><b>${esc(title)}</b><small>Santa Rosa City Veterinary Office</small></div><button data-auth="login" class="guest-header-login">Sign in</button></header>`;
}

function guestOfflineNotice(){
  if(new URLSearchParams(location.search).get("bundled") !== "1") return "";
  return `<aside class="guest-offline-notice"><span><b>Offline-ready</b><small>Services and saved information remain available.</small></span><button data-open-online>Connect</button></aside>`;
}

function guestBottomNav(active){
  const items = [["home","Home","dashboard"],["services","Services","servicesrecords"],["adopt","Adopt","adoptionapplications"],["account","Account","usermanagement"]];
  return `<nav class="guest-bottom-nav" aria-label="Guest app navigation">${items.map(([id,label,icon])=>`<button class="${active===id?'active':''}" data-guest-nav="${id}">${navIcon(icon)}<span>${label}</span></button>`).join("")}</nav>`;
}

function guestDogCard(d){
  const photo = d.photo ? `<img src="${esc(d.photo)}" alt="${esc(d.name)}">` : `<div class="guest-dog-fallback">${esc((d.name||"D").slice(0,1))}</div>`;
  return `<button class="guest-dog-card" data-guest-pet="${esc(d.id)}"><span class="guest-dog-photo">${photo}</span><span><b>${esc(d.name)}</b><small>${esc(d.breed)} · ${esc(d.age)}</small><em>${esc(d.status)}</em></span></button>`;
}

function guestHome(){
  const dogs = S.shelterPets.slice(0,2);
  return `${guestAppBar("PetCARE",false)}<main class="guest-screen guest-home-screen">${guestOfflineNotice()}
    <section class="guest-welcome"><span class="guest-kicker">Pet care in your city</span><h1>How can we help your dog?</h1><p>Browse City Veterinary Office services and dogs looking for homes.</p><div><button data-guest-nav="services">Explore services</button><button data-guest-nav="adopt">Find a dog</button></div></section>
    <section class="guest-block"><div class="guest-section-title"><div><small>Quick access</small><h2>Dog services</h2></div><button data-guest-nav="services">View all</button></div><div class="guest-quick-grid">
      ${Object.entries(MOBILE_PUBLIC_SERVICES).map(([key,s])=>`<button data-guest-service="${esc(key)}"><i>${icoSvg(s.icon,24)}</i><b>${esc(s.title)}</b><span>View details</span></button>`).join("")}
    </div></section>
    <section class="guest-update-card"><i>${icoSvg('bell',23)}</i><div><small>CVO update</small><b>Check current schedules before visiting</b><p>Service dates and barangay activities are announced by the City Veterinary Office.</p></div><a href="https://www.facebook.com/Santarosacityvet" target="_blank" rel="noopener">›</a></section>
    <section class="guest-block"><div class="guest-section-title"><div><small>Adoption</small><h2>Meet the dogs</h2></div><button data-guest-nav="adopt">See all</button></div>${dogs.length?`<div class="guest-dog-row">${dogs.map(guestDogCard).join("")}</div>`:`<div class="guest-empty">No dogs are listed right now. Check again later.</div>`}</section>
  </main>${guestBottomNav("home")}`;
}

function guestServices(){
  return `${guestAppBar("Services",false)}<main class="guest-screen"><section class="guest-page-intro"><small>CVO dog services</small><h1>Choose a service</h1><p>See the purpose and basic requirements before signing in to submit a request.</p></section><div class="guest-service-stack">${Object.entries(MOBILE_PUBLIC_SERVICES).map(([key,s])=>`<button data-guest-service="${esc(key)}"><i>${icoSvg(s.icon,25)}</i><span><b>${esc(s.title)}</b><small>${esc(s.subtitle)}</small></span><strong>›</strong></button>`).join("")}</div><aside class="guest-info-note">Availability and final requirements are confirmed by authorized CVO personnel.</aside></main>${guestBottomNav("services")}`;
}

function guestServiceDetail(){
  const key = UI.mobileGuestService;
  const s = MOBILE_PUBLIC_SERVICES[key] || MOBILE_PUBLIC_SERVICES[Object.keys(MOBILE_PUBLIC_SERVICES)[0]];
  return `${guestAppBar(s.title,true)}<main class="guest-screen"><section class="guest-detail-hero"><i>${icoSvg(s.icon,35)}</i><small>City Veterinary Office service</small><h1>${esc(s.title)}</h1><p>${esc(s.subtitle)}</p></section><section class="guest-detail-card"><h2>What you need</h2>${s.requirements.map((r,i)=>`<div><b>${i+1}</b><span>${esc(r)}</span></div>`).join("")}</section><section class="guest-action-card"><h2>Ready to request?</h2><p>Sign in so we can identify your registered dog and track the request.</p><button data-auth="login">Sign in to request</button><button class="secondary" data-auth="signup">Create resident account</button></section></main>${guestBottomNav("services")}`;
}

function guestAdopt(){
  const dogs = S.shelterPets;
  return `${guestAppBar("Adopt",false)}<main class="guest-screen"><section class="guest-page-intro"><small>Dogs looking for families</small><h1>Find your companion</h1><p>Open a profile to learn about each dog before starting an application.</p></section>${dogs.length?`<div class="guest-adopt-grid">${dogs.map(guestDogCard).join("")}</div>`:`<div class="guest-empty">No dogs are available at this time.</div>`}</main>${guestBottomNav("adopt")}`;
}

function guestPetDetail(){
  const d = S.shelterPets.find(p=>p.id===UI.mobileGuestPetId);
  if(!d){ UI.mobileGuestScreen="adopt"; return guestAdopt(); }
  const photo = d.photo ? `<img src="${esc(d.photo)}" alt="${esc(d.name)}">` : `<div class="guest-pet-fallback">${esc(d.name.slice(0,1))}</div>`;
  return `${guestAppBar(d.name,true)}<main class="guest-screen"><section class="guest-pet-hero">${photo}<span>${esc(d.status)}</span></section><section class="guest-pet-info"><small>${esc(d.breed)} · ${esc(d.sex)} · ${esc(d.age)}</small><h1>Meet ${esc(d.name)}</h1><p>${esc(d.description||"Contact the City Veterinary Office for more information about this dog.")}</p><h2>Temperament</h2><p>${esc(d.temperament||"To be discussed with CVO staff.")}</p></section><section class="guest-action-card"><h2>Interested in ${esc(d.name)}?</h2><p>Sign in to complete and track an adoption application.</p><button data-auth="login">Sign in to apply</button><button class="secondary" data-auth="signup">Create resident account</button></section></main>${guestBottomNav("adopt")}`;
}

function guestAccount(){
  return `${guestAppBar("Account",false)}<main class="guest-screen"><section class="guest-account-card">${sealSvg(58)}<h1>Your PetCARE account</h1><p>Register pets, request services, apply for adoption, and follow every update.</p><button data-auth="login">Sign in</button><button class="secondary" data-auth="signup">Create resident account</button></section><section class="guest-account-benefits"><div>${icoSvg('paw',22)}<span><b>Pet records</b><small>Keep dog information together</small></span></div><div>${icoSvg('servicesrecords',22)}<span><b>Service tracking</b><small>Follow requests from submission to completion</small></span></div><div>${icoSvg('heart',22)}<span><b>Adoption applications</b><small>Track the CVO review process</small></span></div></section></main>${guestBottomNav("account")}`;
}

function renderMobileGuestApp(){
  const screen = UI.mobileGuestScreen || "home";
  if(screen==="services") return guestServices();
  if(screen==="service") return guestServiceDetail();
  if(screen==="adopt") return guestAdopt();
  if(screen==="pet") return guestPetDetail();
  if(screen==="account") return guestAccount();
  return guestHome();
}

const MobileApp = {
  renderGuest: renderMobileGuestApp,
  enhance(root, user){
    if(!isMobileAppMode()) return;
    document.documentElement.classList.add("petcare-mobile-app");
    root.querySelectorAll("[data-guest-nav]").forEach(el=>el.addEventListener("click", ()=>{ UI.mobileGuestScreen=el.dataset.guestNav; window.scrollTo(0,0); render(); }));
    root.querySelectorAll("[data-guest-service]").forEach(el=>el.addEventListener("click", ()=>{ UI.mobileGuestService=el.dataset.guestService; UI.mobileGuestScreen="service"; window.scrollTo(0,0); render(); }));
    root.querySelectorAll("[data-guest-pet]").forEach(el=>el.addEventListener("click", ()=>{ UI.mobileGuestPetId=el.dataset.guestPet; UI.mobileGuestScreen="pet"; window.scrollTo(0,0); render(); }));
    root.querySelectorAll("[data-guest-back]").forEach(el=>el.addEventListener("click", ()=>{ UI.mobileGuestScreen=UI.mobileGuestScreen==="pet"?"adopt":"services"; window.scrollTo(0,0); render(); }));
    root.querySelectorAll("[data-open-online]").forEach(el=>el.addEventListener("click", ()=>{
      if(window.PetCAREAndroid && typeof window.PetCAREAndroid.openOnlineApp === "function") window.PetCAREAndroid.openOnlineApp();
    }));
    root.querySelectorAll("[data-mobile-nav]").forEach(el=>el.addEventListener("click", ()=>{
      const screen = el.dataset.mobileNav;
      if(screen==="requestservice" && UI.screen===screen) return;
      if(["requestservice"].includes(screen)) resetWizardsForScreen(screen);
      UI.screen = screen; UI.sidebarOpen = false; render();
    }));
    root.querySelectorAll("[data-mobile-service]").forEach(el=>el.addEventListener("click", ()=>{
      const verified = user ? verifiedOwnerPets(user.id) : [];
      UI.wiz.svc = {step:1, data:{petId:verified[0]?.id||"", service:el.dataset.mobileService, remarks:""}};
      UI.screen = "requestservice"; render();
    }));
  }
};
