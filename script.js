// PetCare System - script.js v1.13
// Alterações: - Exibe nome do usuário logado nos cabeçalhos (desktop/mobile).
//             - Versão funcional de 1.12 mantida.

// --- Configuração ---
const storageKeys = {
    users: 'petcare_users',
    pets: 'petcare_pets',
    recipes: 'petcare_recipes',
    availability: 'petcare_availability', // Disponibilidades criadas pelo Admin
    booked_consultations: 'petcare_booked_consultations', // Consultas agendadas
    ids: 'petcare_ids',
    theme: 'theme',
    loggedInUser: 'petcare_logged_in_user_id',
    sidebarState: 'sidebar_state'
};
const LG_BREAKPOINT = 992;
const DEFAULT_PET_PHOTO = 'img/pet_placeholder.png';
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- Helpers Local Storage ---
function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    try {
        if (key === storageKeys.ids) {
            const parsed = data ? JSON.parse(data) : {};
            return {
                user: typeof parsed.user === 'number' ? parsed.user : 0,
                pet: typeof parsed.pet === 'number' ? parsed.pet : 0,
                recipe: typeof parsed.recipe === 'number' ? parsed.recipe : 0,
                availability: typeof parsed.availability === 'number' ? parsed.availability : 0,
                booked_consultation: typeof parsed.booked_consultation === 'number' ? parsed.booked_consultation : 0,
            };
        }
        if ([storageKeys.users, storageKeys.pets, storageKeys.recipes, storageKeys.availability, storageKeys.booked_consultations].includes(key)) {
             return data ? JSON.parse(data) : [];
        }
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Erro ao carregar ${key} do localStorage:`, e);
        if (key === storageKeys.ids) return { user: 0, pet: 0, recipe: 0, availability: 0, booked_consultation: 0 };
        if ([storageKeys.users, storageKeys.pets, storageKeys.recipes, storageKeys.availability, storageKeys.booked_consultations].includes(key)) return [];
        return null;
    }
}
function saveToLocalStorage(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error(`Erro ao salvar ${key} no localStorage:`, e); showMessage('consultations-message', `Erro ao salvar dados. O limite de armazenamento local pode ter sido excedido.`, 'danger', 10000); }
}
function loadIdCounters() { return loadFromLocalStorage(storageKeys.ids); }
function saveIdCounters(counters) { saveToLocalStorage(storageKeys.ids, counters); }
function generateUniqueId(type) {
    const counters = loadIdCounters();
    if (typeof counters[type] === 'undefined') { counters[type] = 0; }
    if (isNaN(counters[type])) { counters[type] = 0; }
    counters[type]++;
    saveIdCounters(counters);
    return counters[type];
}

// --- Inicialização Dados Exemplo ---
function initializeSampleData() {
    let users = loadFromLocalStorage(storageKeys.users);
    let availabilities = loadFromLocalStorage(storageKeys.availability);
    const MAX_SAMPLE_AVAILABILITIES = 25;

    if (users.length === 0) {
        console.log("Init sample data v1.13 (no users found)...");
        const counters = { user: 0, pet: 0, recipe: 0, availability: 0, booked_consultation: 0 };
        saveIdCounters(counters);

        const adminId = generateUniqueId('user'); const clientId1 = generateUniqueId('user'); const clientId2 = generateUniqueId('user'); const vetIds = []; const vetEmails = ['vet@example.com', 'vet2@example.com', 'dr.ana@example.com', 'dr.paulo@example.com'];
        users = [ { id: adminId, name: 'Admin', email: 'admin@example.com', password: 'password', profile: 'administrator' }, { id: clientId1, name: 'Cliente Feliz', email: 'client@example.com', password: 'password', profile: 'client' }, { id: clientId2, name: 'Segundo Cliente', email: 'client2@example.com', password: 'password', profile: 'client' }, ];
        vetEmails.forEach(email => { const vetId = generateUniqueId('user'); vetIds.push(vetId); let vetName = 'Dr(a). Vet'; if(email==='dr.ana@example.com') vetName='Dra. Ana Silva'; if(email==='dr.paulo@example.com') vetName='Dr. Paulo Souza'; if(email==='vet2@example.com') vetName='Dr(a). Vet 2'; users.push({ id: vetId, name: vetName, email: email, password: 'password', profile: 'veterinarian' }); });
        saveToLocalStorage(storageKeys.users, users); saveToLocalStorage(storageKeys.recipes, []); saveToLocalStorage(storageKeys.booked_consultations, []);
        const samplePets = [ { id: generateUniqueId('pet'), ownerId: clientId1, name: 'Bolinha', species: 'Cão', breed: 'SRD (Vira-lata)', birthDate: '2020-05-10', photoUrl: 'img/pet1.jpeg', notes: 'Adora buscar a bolinha.' }, { id: generateUniqueId('pet'), ownerId: clientId1, name: 'Mimi', species: 'Gato', breed: 'Siamês', birthDate: '2021-01-15', photoUrl: 'img/pet2.jpeg', notes: 'Dorminhoca.' }, { id: generateUniqueId('pet'), ownerId: clientId2, name: 'Loro', species: 'Ave', breed: 'Papagaio', birthDate: '2019-11-01', photoUrl: 'img/pet3.jpeg', notes: 'Repete palavras.' }, { id: generateUniqueId('pet'), ownerId: clientId2, name: 'Max', species: 'Cão', breed: 'Golden Retriever', birthDate: '2022-02-20', photoUrl: DEFAULT_PET_PHOTO, notes: 'Brincalhão.' } ];
        saveToLocalStorage(storageKeys.pets, samplePets);

        let availabilityCount = 0; let generatedAvailabilities = []; const year = 2025; const months = [3, 4];
        if (vetIds.length > 0) { months.forEach(monthIndex => { const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); for (let day = 1; day <= daysInMonth && availabilityCount < MAX_SAMPLE_AVAILABILITIES; day++) { const currentDate = new Date(year, monthIndex, day); const dayOfWeek = currentDate.getDay(); if ([2, 3, 4].includes(dayOfWeek) && Math.random() > 0.4) { const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; const vetId = vetIds[availabilityCount % vetIds.length]; const exists = generatedAvailabilities.some(a => a.date === dateStr && a.vetId === vetId); if(!exists){ generatedAvailabilities.push({ id: generateUniqueId('availability'), date: dateStr, vetId: vetId }); availabilityCount++; } if (Math.random() > 0.7 && availabilityCount < MAX_SAMPLE_AVAILABILITIES && vetIds.length > 1) { let secondVetIdIndex = (availabilityCount) % vetIds.length; let secondVetId = vetIds[secondVetIdIndex]; if(secondVetId === vetId){ secondVetIdIndex = (secondVetIdIndex + 1) % vetIds.length; secondVetId = vetIds[secondVetIdIndex]; } const exists2 = generatedAvailabilities.some(a => a.date === dateStr && a.vetId === secondVetId); if (secondVetId !== vetId && !exists2) { generatedAvailabilities.push({ id: generateUniqueId('availability'), date: dateStr, vetId: secondVetId }); availabilityCount++; } } } } }); console.log(`Generated ${availabilityCount} sample availabilities.`); }
        else { console.warn("Could not generate sample availabilities: No vet IDs found."); }
        saveToLocalStorage(storageKeys.availability, generatedAvailabilities);
        console.log("Sample data v1.13 OK.");

    } else {
        loadIdCounters();
        availabilities = loadFromLocalStorage(storageKeys.availability);
        if (availabilities.length === 0 && users.length > 0) {
            console.log("No availabilities found, generating samples (v1.13)...");
             const existingVets = getAllVeterinarians(); const vetIds = existingVets.map(v => v.id); let availabilityCount = 0; let generatedAvailabilities = []; const year = 2025; const months = [3, 4];
             if (vetIds.length > 0) { months.forEach(monthIndex => { const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); for (let day = 1; day <= daysInMonth && availabilityCount < MAX_SAMPLE_AVAILABILITIES; day++) { const currentDate = new Date(year, monthIndex, day); const dayOfWeek = currentDate.getDay(); if ([2, 3, 4].includes(dayOfWeek) && Math.random() > 0.4) { const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; const vetId = vetIds[availabilityCount % vetIds.length]; const exists = generatedAvailabilities.some(a => a.date === dateStr && a.vetId === vetId); if(!exists){ generatedAvailabilities.push({ id: generateUniqueId('availability'), date: dateStr, vetId: vetId }); availabilityCount++; } if (Math.random() > 0.7 && availabilityCount < MAX_SAMPLE_AVAILABILITIES && vetIds.length > 1) { let secondVetIdIndex = (availabilityCount) % vetIds.length; let secondVetId = vetIds[secondVetIdIndex]; if(secondVetId === vetId){ secondVetIdIndex = (secondVetIdIndex + 1) % vetIds.length; secondVetId = vetIds[secondVetIdIndex]; } const exists2 = generatedAvailabilities.some(a => a.date === dateStr && a.vetId === secondVetId); if (secondVetId !== vetId && !exists2) { generatedAvailabilities.push({ id: generateUniqueId('availability'), date: dateStr, vetId: secondVetId }); availabilityCount++; } } } } }); console.log(`Generated ${availabilityCount} sample availabilities.`); }
             else { console.warn("Could not generate sample availabilities: No existing vet IDs found."); }
             saveToLocalStorage(storageKeys.availability, generatedAvailabilities);
        }
        if (localStorage.getItem(storageKeys.booked_consultations) === null) { saveToLocalStorage(storageKeys.booked_consultations, []); } if (localStorage.getItem(storageKeys.recipes) === null) { saveToLocalStorage(storageKeys.recipes, []); }
    }
}

// --- Helpers Dados ---
function getAllUsers() { return loadFromLocalStorage(storageKeys.users); }
function getUserById(userId) { return getAllUsers().find(u => u.id === Number(userId)); }
function getAllVeterinarians() { return getAllUsers().filter(u => u.profile === 'veterinarian'); }
function getAllPets() { return loadFromLocalStorage(storageKeys.pets); }
function getPetById(petId) { return getAllPets().find(p => p.id === Number(petId)); }
function getAllPetsByUser(userId) { const userProfile = getUserProfile(); const allPets = getAllPets(); userId = Number(userId); if (!userProfile) return []; if (userProfile === 'administrator' || userProfile === 'veterinarian') { const users = getAllUsers(); return allPets.map(pet => { const owner = users.find(u => u.id === pet.ownerId); return { ...pet, ownerName: owner ? owner.name : 'Desconhecido' }; }); } else if (userProfile === 'client') { return allPets.filter(pet => pet.ownerId === userId); } else { return []; } }
function getAllAvailabilities() { return loadFromLocalStorage(storageKeys.availability); }
function getAllBookedConsultations() { return loadFromLocalStorage(storageKeys.booked_consultations); }
function getClientBookedConsultations(clientId) { clientId = Number(clientId); return getAllBookedConsultations().filter(consult => consult.clientId === clientId); }
function getBookedConsultationById(consultationId) { return getAllBookedConsultations().find(c => c.id === Number(consultationId)); }

// --- CRUD Disponibilidade (Admin) ---
function addAvailability(dateString, vetId) {
    const availabilities = getAllAvailabilities(); const vetIdNum = Number(vetId); const exists = availabilities.some(avail => avail.date === dateString && avail.vetId === vetIdNum); if (exists) { return { success: false, message: 'Esta disponibilidade já foi cadastrada.' }; } const newAvailability = { id: generateUniqueId('availability'), date: dateString, vetId: vetIdNum }; availabilities.push(newAvailability); saveToLocalStorage(storageKeys.availability, availabilities);
    if (typeof clientFlatpickrInstance !== 'undefined' && clientFlatpickrInstance) { const updatedAvailableDates = [...new Set(getAllAvailabilities().map(a => a.date))]; clientFlatpickrInstance.set('enable', updatedAvailableDates); }
    return { success: true, message: 'Disponibilidade salva com sucesso!', data: newAvailability };
}
function deleteAvailability(availabilityId) {
    let availabilities = getAllAvailabilities(); const idToDelete = Number(availabilityId); const availabilityToDelete = availabilities.find(a => a.id === idToDelete); if (!availabilityToDelete) { showMessage('consultations-message', 'Erro: Não foi possível encontrar a disponibilidade para excluir.', 'danger'); return; } const dateToDelete = availabilityToDelete.date; const initialLength = availabilities.length; availabilities = availabilities.filter(avail => avail.id !== idToDelete);
    if (availabilities.length < initialLength) {
        saveToLocalStorage(storageKeys.availability, availabilities); showMessage('consultations-message', 'Disponibilidade excluída com sucesso.', 'success'); renderAdminAvailabilitiesList('availabilitiesList');
        if (typeof clientFlatpickrInstance !== 'undefined' && clientFlatpickrInstance) { const updatedAvailableDates = [...new Set(getAllAvailabilities().map(a => a.date))]; clientFlatpickrInstance.set('enable', updatedAvailableDates); }
    } else { showMessage('consultations-message', 'Erro: Não foi possível excluir a disponibilidade.', 'danger'); }
}

// --- CRUD Agendamento (Cliente) ---
function bookConsultation(bookingData) {
    const bookedConsultations = getAllBookedConsultations(); let availabilities = getAllAvailabilities(); const vetIdNum = Number(bookingData.vetId); const petIdNum = Number(bookingData.petId); const clientIdNum = Number(bookingData.clientId); const availabilityIndex = availabilities.findIndex(avail => avail.date === bookingData.date && avail.vetId === vetIdNum);
    if (availabilityIndex === -1) { return { success: false, message: 'Erro: O horário selecionado não está mais disponível.' }; }
    const newBooking = { id: generateUniqueId('booked_consultation'), date: bookingData.date, time: 'N/A', petId: petIdNum, clientId: clientIdNum, vetId: vetIdNum, reason: bookingData.reason || 'Não especificado', status: 'Agendada', diagnosis: null };
    bookedConsultations.push(newBooking); saveToLocalStorage(storageKeys.booked_consultations, bookedConsultations); const removedAvailability = availabilities.splice(availabilityIndex, 1)[0]; saveToLocalStorage(storageKeys.availability, availabilities); console.log(`Consulta agendada: ID ${newBooking.id}. Disp. ID ${removedAvailability?.id} removida.`);
    if (typeof clientFlatpickrInstance !== 'undefined' && clientFlatpickrInstance) { const remainingAvailOnDate = availabilities.some(a => a.date === bookingData.date); if (!remainingAvailOnDate) { const currentEnabled = clientFlatpickrInstance.config.enable.map(d => d instanceof Date ? d.toISOString().split('T')[0] : d); const newEnabled = currentEnabled.filter(d => d !== bookingData.date); clientFlatpickrInstance.set('enable', newEnabled); } }
    return { success: true, message: 'Consulta agendada com sucesso!', data: newBooking };
}

// --- CRUD Consulta (Veterinário) ---
function updateConsultationStatus(consultationId, newStatus) {
    let bookings = getAllBookedConsultations(); const bookingIndex = bookings.findIndex(b => b.id === Number(consultationId)); if (bookingIndex === -1) { return { success: false, message: "Consulta não encontrada." }; } if (!['Agendada', 'Compareceu', 'Não Compareceu'].includes(newStatus)) { return { success: false, message: "Status inválido selecionado." }; } bookings[bookingIndex].status = newStatus; saveToLocalStorage(storageKeys.booked_consultations, bookings); console.log(`Status da consulta ${consultationId} atualizado para ${newStatus}`); return { success: true, message: "Status da consulta atualizado." };
}
function updateConsultationDiagnosis(consultationId, diagnosisText) {
    let bookings = getAllBookedConsultations(); const bookingIndex = bookings.findIndex(b => b.id === Number(consultationId)); if (bookingIndex === -1) { return { success: false, message: "Consulta não encontrada." }; } bookings[bookingIndex].diagnosis = diagnosisText; saveToLocalStorage(storageKeys.booked_consultations, bookings); console.log(`Diagnóstico da consulta ${consultationId} atualizado.`); return { success: true, message: "Diagnóstico salvo com sucesso." };
}

// --- Pet CRUD Functions ---
function addPet(petData) { const allPets = getAllPets(); const newPet = { id: generateUniqueId('pet'), ownerId: Number(petData.ownerId), name: petData.name, species: petData.species, breed: petData.breed || 'Não informado', birthDate: petData.birthDate || null, photoUrl: petData.photoUrl || DEFAULT_PET_PHOTO, notes: petData.notes || '' }; allPets.push(newPet); saveToLocalStorage(storageKeys.pets, allPets); console.log("Pet adicionado:", newPet.id, "Owner:", newPet.ownerId); return newPet; }
function updatePet(petData) { let allPets = getAllPets(); const idx = allPets.findIndex(p => p.id === Number(petData.id)); if (idx !== -1) { const oldPhoto = allPets[idx].photoUrl; const newPhoto = petData.photoUrl; const finalPhotoUrl = (newPhoto && newPhoto !== DEFAULT_PET_PHOTO) ? newPhoto : (oldPhoto || DEFAULT_PET_PHOTO); allPets[idx] = { ...allPets[idx], name: petData.name, species: petData.species, breed: petData.breed || 'Não informado', birthDate: petData.birthDate || null, photoUrl: finalPhotoUrl, notes: petData.notes || '' }; saveToLocalStorage(storageKeys.pets, allPets); console.log("Pet atualizado:", petData.id); return allPets[idx]; } console.error("Update Err: Pet not found ID", petData.id); return null; }
function deletePet(petId) { let allPets = getAllPets(); const initialLength = allPets.length; allPets = allPets.filter(p => p.id !== Number(petId)); if (allPets.length < initialLength) { saveToLocalStorage(storageKeys.pets, allPets); console.log("Pet excluído: ID", petId); return true; } console.error("Delete Err: Pet not found ID", petId); return false; }

// --- UI Helpers ---
function showMessage(id, msg, type = 'success', dur = 4000) { const el=document.getElementById(id); if(!el) return; el.className='form-message'; el.textContent=''; if(msg){el.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show'); let i=''; switch(type){case 'success': i='bi-check-circle-fill'; break; case 'danger': i='bi-x-octagon-fill'; break; case 'warning': i='bi-exclamation-triangle-fill'; break; case 'info': i='bi-info-circle-fill'; break;} el.innerHTML=`${i?'<i class="bi '+i+' me-2"></i>':''}${msg}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`; el.role='alert'; if(dur>0){setTimeout(()=>{if(document.getElementById(id)){bootstrap.Alert.getOrCreateInstance(el)?.close();}}, dur);}} }
function clearForm(id) { const f = document.getElementById(id); if (!f) return; f.reset(); f.classList.remove('was-validated'); f.querySelectorAll('.is-valid, .is-invalid').forEach(e => e.classList.remove('is-valid', 'is-invalid')); f.querySelectorAll('input,select,textarea').forEach(e => { e.setCustomValidity(''); if(e.tagName==='SELECT') { e.disabled=true; } }); if (id === 'petForm') { const p=document.getElementById('photoPreview'); if(p)p.src=DEFAULT_PET_PHOTO; const fi=document.getElementById('petPhotoFile'); if(fi)fi.value=''; const fe=document.getElementById('file-error-message'); if(fe)fe.textContent=''; } else if (id === 'registerUserForm') { const ef=document.getElementById('email-exists-feedback'); if(ef)ef.style.display='none'; const ei=document.getElementById('email'); if(ei)ei.classList.remove('is-invalid'); } else if (id === 'bookingForm') { const vs=document.getElementById('bookingVetId'); const ps=document.getElementById('bookingPetId'); const bs=document.getElementById('bookAppointmentButton'); const ds=document.getElementById('displaySelectedBookingDate'); const hs=document.getElementById('selectedBookingDateHidden'); if(vs){vs.innerHTML='<option value="" disabled selected>Selecione a data primeiro</option>'; vs.disabled=true;} if(ps){ ps.disabled = true; } if(bs)bs.disabled=true; if(ds)ds.textContent='Nenhuma'; if(hs)hs.value=''; if(typeof clientFlatpickrInstance !== 'undefined' && clientFlatpickrInstance){ clientFlatpickrInstance.clear(); } } else if (id === 'diagnosisForm') { const cid = document.getElementById('diagnosisConsultationId'); if(cid) cid.value = ''; const info = document.getElementById('diagnosisModalConsultationInfo'); if(info) info.textContent = '...'; } else if (id === 'availabilityForm') { /* Admin form reset */ } const formMessageElement = document.getElementById(`${id}-message`); if(formMessageElement) { showMessage(formMessageElement.id, '', '', 0); } else { const gm = f.querySelector('.form-message'); if (gm && gm.id) { showMessage(gm.id, '', '', 0); } } }
function calculateAge(birthDateString) { if (!birthDateString) return 'Idade desconhecida'; try { const birthDate = new Date(birthDateString + 'T00:00:00'); if (isNaN(birthDate.getTime())) return 'Data inválida'; const today = new Date(); today.setHours(0, 0, 0, 0); let ageYears = today.getFullYear() - birthDate.getFullYear(); let ageMonths = today.getMonth() - birthDate.getMonth(); let ageDays = today.getDate() - birthDate.getDate(); if (ageMonths < 0 || (ageMonths === 0 && ageDays < 0)) { ageYears--; ageMonths += 12; } if (ageYears > 1) return `${ageYears} anos`; if (ageYears === 1) return `1 ano`; if (ageYears === 0) { if (ageMonths > 1) return `${ageMonths} meses`; if (ageMonths === 1) return `1 mês`; if (ageMonths === 0) { let daysSinceBirth = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24)); if (daysSinceBirth >= 7) return `${Math.floor(daysSinceBirth / 7)} sem`; if (daysSinceBirth > 1) return `${daysSinceBirth} dias`; if (daysSinceBirth === 1) return `1 dia`; return `Recém-nascido`; } } return 'Idade inválida'; } catch (e) { console.error("Erro ao calcular idade:", e); return "Erro data"; } }

// --- Autenticação ---
function getLoggedInUserId() { const id = localStorage.getItem(storageKeys.loggedInUser); return id ? Number(id) : null; }
function getUserProfile() { const id = getLoggedInUserId(); if (id) { const u = getUserById(id); return u ? u.profile : null; } return null; }
function handleLogin(e) { e.preventDefault(); const f = e.target, m = f.querySelector('#form-message'); if (m) showMessage(m.id, '', '', 0); f.classList.add('was-validated'); if (!f.checkValidity()) { e.stopPropagation(); return; } const em = f.querySelector('#email').value, pw = f.querySelector('#password').value; const u = getAllUsers().find(usr => usr.email.toLowerCase() === em.toLowerCase() && usr.password === pw); if (u) { localStorage.setItem(storageKeys.loggedInUser, u.id); if (m) showMessage(m.id, `Login OK, ${u.name}! Redirecionando...`, 'success', 1500); setTimeout(() => window.location.href = 'dashboard.html', 1000); } else { if (m) showMessage(m.id, 'Email ou senha inválidos.', 'danger'); if (f.querySelector('#password')) f.querySelector('#password').value = ''; f.classList.remove('was-validated'); } }
function handleLogout(e) { localStorage.removeItem(storageKeys.loggedInUser); localStorage.removeItem(storageKeys.sidebarState); console.log("Logout OK."); window.location.href='index.html'; }

// --- Setup de Página e Layout --- MODIFICADO v1.13
function checkLoginAndSetupPage() {
    const uid = getLoggedInUserId();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pub = ['index.html', 'forgot_password.html'];
    const reg = 'register.html';
    const body = document.body;
    body.className = body.className.replace(/(admin-registering|self-registering|profile-\w+|logged-in|logged-out|body-pd)/g, '').trim();

    const userNameDisplayDesktop = document.getElementById('loggedInUserNameDisplay');
    const userNameDisplayMobile = document.getElementById('loggedInUserNameDisplayMobile');
    // Limpa nomes de usuário anteriores ao checar
    if (userNameDisplayDesktop) userNameDisplayDesktop.textContent = '';
    if (userNameDisplayMobile) userNameDisplayMobile.textContent = '';


    if (uid) {
        const user = getUserById(uid);
        if (!user) { console.error("User ID found in localStorage but user not found! Forcing logout."); localStorage.removeItem(storageKeys.loggedInUser); localStorage.removeItem(storageKeys.sidebarState); window.location.href = 'index.html'; return false; }

        body.classList.add('logged-in');
        body.classList.add(`profile-${user.profile}`);

        // Exibe nome do usuário nos locais apropriados
        const userGreeting = `Olá, ${user.name.split(' ')[0]}!`; // Saudação com primeiro nome
        if (userNameDisplayDesktop) userNameDisplayDesktop.textContent = userGreeting;
        if (userNameDisplayMobile) userNameDisplayMobile.textContent = userGreeting;

        // Preenche nome completo + perfil no dashboard (se existir)
        const profileDisplay = document.getElementById('loggedInUserProfile');
        if (profileDisplay) profileDisplay.textContent = `${user.name} (${user.profile})`;

        if (page === reg) { if (user.profile === 'administrator') { body.classList.add('admin-registering'); if (body.classList.contains('body-with-sidebar')) { setupSidebar(); const pt=document.getElementById('registerPageTitle'); if(pt)pt.textContent='Cadastrar Novo Usuário'; } return true; } else { window.location.href = 'dashboard.html'; return false; } }
        if (pub.includes(page)) { window.location.href = 'dashboard.html'; return false; }
        if (body.classList.contains('body-with-sidebar')) { setupSidebar(); } else { body.classList.remove('body-pd'); body.style.paddingTop = '0'; }
    } else {
        body.classList.add('logged-out');
        if (page === reg) { body.classList.add('self-registering'); body.style.paddingTop = '0'; const pt=document.getElementById('registerPageTitle'); if(pt)pt.textContent='Cadastro de Novo Cliente'; return true; }
        if (!pub.includes(page) && page !== reg) { window.location.href = 'index.html'; return false; }
        body.style.paddingTop = '0';
    }
    return true;
}

// --- Cadastro / Recuperação Senha ---
function handleRegisterUser(e) { e.preventDefault(); const form = e.target; const m = form.querySelector('#form-message'); const p = form.querySelector('#password'); const cp = form.querySelector('#confirmPassword'); const ei = form.querySelector('#email'); const ps = form.querySelector('#profileSelect'); if (m) showMessage(m.id, '', '', 0); if (ei) { ei.classList.remove('is-invalid'); const ef = document.getElementById('email-exists-feedback'); if (ef) ef.style.display = 'none'; } if (cp) cp.setCustomValidity(''); let pm = true; if (p && cp) { if (p.value !== cp.value) { cp.setCustomValidity('As senhas não coincidem.'); pm = false; } else { cp.setCustomValidity(''); } } form.classList.add('was-validated'); if (!form.checkValidity() || !pm) { e.stopPropagation(); if (!pm && cp) { cp.reportValidity(); } return; } const name = form.querySelector('#name').value; const email = ei.value; const password = p.value; let profile = 'client'; if (ps && window.getComputedStyle(ps.closest('.profile-select-wrapper')).display !== 'none') { profile = ps.value; if (!profile) { ps.setCustomValidity('Seleção de perfil obrigatória.'); ps.reportValidity(); form.classList.add('was-validated'); return; } } const users = getAllUsers(); if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { if (m) showMessage(m.id, 'Este email já está cadastrado.', 'danger'); if (ei) { ei.classList.add('is-invalid'); const ef = document.getElementById('email-exists-feedback'); if (ef) ef.style.display = 'block'; ei.focus(); } form.classList.remove('was-validated'); return; } const nu = { id: generateUniqueId('user'), name, email, password: password, profile: profile }; users.push(nu); saveToLocalStorage(storageKeys.users, users); console.log(`User registered: ${nu.name} (${nu.profile})`); const iar = document.body.classList.contains('admin-registering'); if (iar) { if (m) showMessage(m.id, `Usuário ${profile} "${name}" cadastrado com sucesso!`, 'success', 3000); clearForm(form.id); } else { if (m) showMessage(m.id, `Cadastro realizado com sucesso! Você já pode fazer login. Redirecionando...`, 'success', 2500); setTimeout(() => window.location.href = 'index.html', 2000); const sb = form.querySelector('button[type="submit"]'); if (sb) sb.disabled = true; } }
function handleForgotPassword(e) { e.preventDefault(); const f = e.target, m = f.querySelector('#form-message'); if (m) showMessage(m.id, '', '', 0); f.classList.add('was-validated'); if (!f.checkValidity()) { e.stopPropagation(); return; } const em = f.querySelector('#email').value; if (getAllUsers().some(u => u.email.toLowerCase() === em.toLowerCase())) { if (m) showMessage(m.id, `Link "enviado" para ${em}.`, 'success'); if (f.querySelector('#email')) f.querySelector('#email').value = ''; f.classList.remove('was-validated'); } else { if (m) showMessage(m.id, 'Email não cadastrado.', 'danger'); if (f.querySelector('#email')) f.querySelector('#email').classList.add('is-invalid'); } }

// --- Sidebar e Header Mobile ---
function setupSidebar() { const tgs = document.querySelectorAll('.nav_toggle'); const nav = document.getElementById('navbar'); const bod = document.body; if (tgs.length > 0 && nav && bod && bod.classList.contains('body-with-sidebar')) { tgs.forEach(t => { t.removeEventListener('click', toggleSidebar); t.addEventListener('click', toggleSidebar); }); window.removeEventListener('resize', handleSidebarResize); window.addEventListener('resize', handleSidebarResize); initializeSidebarState(); adjustContentPadding(); } else { tgs.forEach(t => t.removeEventListener('click', toggleSidebar)); window.removeEventListener('resize', handleSidebarResize); if (bod) { bod.classList.remove('body-pd'); bod.style.paddingTop = '0'; } } }
function initializeSidebarState() { const n=document.getElementById('navbar'); const b=document.body; const t=document.querySelectorAll('.nav_toggle'); if(!n||!b||t.length===0||!b.classList.contains('body-with-sidebar'))return; const s=localStorage.getItem(storageKeys.sidebarState); const d=window.innerWidth>=LG_BREAKPOINT; let e=false; if(d){e=(s!=='retracted'); n.classList.toggle('show-sidebar',e); b.classList.toggle('body-pd',e);}else{e=false; n.classList.remove('show-sidebar'); b.classList.remove('body-pd');} updateToggleIcons(e); }
function toggleSidebar() { const n=document.getElementById('navbar'); const b=document.body; if(!n||!b||!b.classList.contains('body-with-sidebar'))return; const d=window.innerWidth>=LG_BREAKPOINT; const i=!n.classList.contains('show-sidebar'); n.classList.toggle('show-sidebar',i); if(d){b.classList.toggle('body-pd',i); localStorage.setItem(storageKeys.sidebarState,i?'expanded':'retracted');}else{b.classList.remove('body-pd'); localStorage.removeItem(storageKeys.sidebarState);} updateToggleIcons(i); adjustContentPadding(); }
function updateToggleIcons(isExpanded) { const t=document.querySelectorAll('.nav_toggle'); const a=isExpanded?'bi-x':'bi-list'; const r=isExpanded?'bi-list':'bi-x'; t.forEach(e=>{if(e.classList.contains(r))e.classList.remove(r); if(!e.classList.contains(a))e.classList.add(a);}); }
function handleSidebarResize() { initializeSidebarState(); adjustContentPadding(); }
function adjustContentPadding() { const b=document.body; const h=document.querySelector('.mobile-header'); if(!b||!h||!b.classList.contains('logged-in')||!b.classList.contains('body-with-sidebar')){document.documentElement.style.setProperty('--mobile-header-height','0px'); if(b)b.style.paddingTop='0px'; return;} const m=window.innerWidth<LG_BREAKPOINT; const hh=m?h.offsetHeight:0; document.documentElement.style.setProperty('--mobile-header-height',`${hh}px`); b.style.paddingTop=m?`var(--mobile-header-height)`:'0px'; }

// --- Dark Mode ---
function setupDarkMode() { const s=document.querySelectorAll('#darkModeSwitch, #darkModeSwitchDesktop, #darkModeSwitchMobile'); const i=getInitialTheme(); applyTheme(i); if(s.length>0){s.forEach(e=>{e.removeEventListener('change',handleDarkModeToggle); e.addEventListener('change',handleDarkModeToggle);});} }
function getInitialTheme() { let t=localStorage.getItem(storageKeys.theme); if(!t){t=window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark-mode':'light-mode';} return t; }
function applyTheme(theme) { document.body.classList.toggle('dark-mode', theme === 'dark-mode'); document.body.classList.toggle('light-mode', theme !== 'dark-mode'); const s = document.querySelectorAll('#darkModeSwitch, #darkModeSwitchDesktop, #darkModeSwitchMobile'); const c = (theme === 'dark-mode'); s.forEach(e=>{if(e.checked!==c)e.checked=c;}); }
function handleDarkModeToggle(event) { const c=event.target; const n=c.checked?'dark-mode':'light-mode'; localStorage.setItem(storageKeys.theme,n); applyTheme(n); }

// --- Validação e Listeners Formulários ---
function setupFormValidationAndListeners() {
    document.querySelectorAll('form.needs-validation').forEach(f=>{f.removeEventListener('submit', handleGenericFormValidation); f.addEventListener('submit', handleGenericFormValidation, {capture: true});});
    function handleGenericFormValidation(e){const f=e.target; f.classList.add('was-validated');}
    const lf = document.getElementById('loginForm'); if(lf)lf.addEventListener('submit', handleLogin);
    const rf = document.getElementById('registerUserForm'); if(rf){rf.addEventListener('submit', handleRegisterUser); const p=rf.querySelector('#password'),c=rf.querySelector('#confirmPassword'); if(p&&c){const v=()=>{c.setCustomValidity(c.value!==''&&p.value!==c.value?'As senhas não coincidem.':'');}; c.addEventListener('input',v); p.addEventListener('input',v);} const ei=rf.querySelector('#email'); if(ei){ei.addEventListener('input',()=>{ei.classList.remove('is-invalid'); const ef=document.getElementById('email-exists-feedback'); if(ef)ef.style.display='none';});}}
    const ff = document.getElementById('forgotPasswordForm'); if(ff)ff.addEventListener('submit', handleForgotPassword);
    const lo = document.getElementById('logout-link'); if(lo)lo.addEventListener('click', handleLogout);
    const ptc=document.getElementById('petsCardContainer'); if(ptc){ptc.addEventListener('click', handlePetCardActions); const apb=document.getElementById('addPetButton'); if(apb)apb.addEventListener('click', handleAddPetClick); const pf=document.getElementById('petForm'); if(pf)pf.addEventListener('submit', handlePetFormSubmit); const cdb=document.getElementById('confirmDeleteButton'); if(cdb)cdb.addEventListener('click', handleConfirmDelete); const pme=document.getElementById('petModal'); if(pme)pme.addEventListener('hidden.bs.modal', handlePetModalClose); const pi=document.getElementById('petPhotoFile'); if(pi)pi.addEventListener('change', handlePhotoFileChange); document.addEventListener('click', (e)=>{if(e.target&&e.target.id==='addPetButtonEmpty'){handleAddPetClick();}}); const bdi=document.getElementById('petBirthDate'); if(bdi)bdi.max=new Date().toISOString().split("T")[0];}
    const aal=document.getElementById('availabilitiesList'); if(aal){aal.removeEventListener('click', handleAdminAvailabilityListClick); aal.addEventListener('click', handleAdminAvailabilityListClick);}
    const vetTableBody = document.getElementById('vetBookedConsultationsTable'); if(vetTableBody) { vetTableBody.removeEventListener('change', handleVetConsultationActions); vetTableBody.removeEventListener('click', handleVetConsultationActions); vetTableBody.addEventListener('change', handleVetConsultationActions); vetTableBody.addEventListener('click', handleVetConsultationActions); }
    const diagnosisForm = document.getElementById('diagnosisForm'); if(diagnosisForm) { diagnosisForm.removeEventListener('submit', handleSaveDiagnosis); diagnosisForm.addEventListener('submit', handleSaveDiagnosis); }
}

// --- Renderização Cards de Pets ---
function renderPetsCards() { const cc=document.getElementById('petsCardContainer'); const lp=document.getElementById('petsLoadingPlaceholder'); if(!cc)return; const u=getLoggedInUserId(); if(!u){cc.innerHTML='<div class="col-12"><div class="alert alert-danger"><i class="bi bi-exclamation-circle-fill me-2"></i>Erro: Usuário não identificado. Faça login novamente.</div></div>'; if(lp)lp.style.display='none'; return;} if(lp)lp.style.display='flex'; cc.innerHTML=''; const up=getAllPetsByUser(u); if(lp)lp.style.display='none'; if(!up||up.length===0){const p=getUserProfile(); let m=p==='client'?"Você ainda não cadastrou nenhum pet.":"Nenhum pet cadastrado no sistema."; cc.innerHTML=`<div class="col-12 text-center mt-4"><img src="img/empty_state_pets.svg" alt="Nenhum pet" width="150" class="mb-3 opacity-50"><p class="text-muted fs-5">${m}</p><button type="button" class="btn btn-success mt-2 client-only admin-only" data-bs-toggle="modal" data-bs-target="#petModal" id="addPetButtonEmpty"><i class="bi bi-plus-circle-fill me-1"></i> Adicionar Novo Pet</button></div>`;} else { up.forEach(pet=>{const a=calculateAge(pet.birthDate); const ps=pet.photoUrl||DEFAULT_PET_PHOTO; const c=document.createElement('div'); c.className='col-md-6 col-lg-4 mb-4 d-flex align-items-stretch'; let notesHTML = ''; if(pet.notes) { const shortNotes = pet.notes.substring(0, 80); notesHTML = `<p class="mt-2 mb-0 text-muted fst-italic" style="font-size: 0.8rem;" title="${pet.notes}">Obs: ${shortNotes}${pet.notes.length > 80 ? '...' : ''}</p>`; } let ownerInfo = ''; if(pet.ownerName) { ownerInfo = `<dl class="row gx-2 gy-0 mb-1"><dt class="col-auto fw-normal text-muted">Tutor:</dt><dd class="col">${pet.ownerName}</dd></dl>`; } c.innerHTML=`<div class="card h-100 shadow-sm pet-card w-100" id="pet-card-${pet.id}"><img src="${ps}" class="card-img-top pet-card-img" alt="Foto de ${pet.name}" onerror="this.onerror=null; this.src='${DEFAULT_PET_PHOTO}';"><div class="card-body d-flex flex-column"><h5 class="card-title mb-1">${pet.name}</h5><p class="card-text text-muted small mb-2">${pet.species} - ${pet.breed}</p><div class="small mb-3 flex-grow-1"><dl class="row gx-2 gy-0 mb-1"><dt class="col-auto fw-normal text-muted">Idade:</dt><dd class="col">${a}</dd></dl><dl class="row gx-2 gy-0 mb-0"><dt class="col-auto fw-normal text-muted">Nasc.:</dt><dd class="col">${pet.birthDate?new Date(pet.birthDate+'T00:00:00').toLocaleDateString('pt-BR',{timeZone:'UTC'}):'N/A'}</dd></dl>${ownerInfo}${notesHTML}</div><div class="mt-auto d-flex justify-content-end gap-2 border-top pt-2"><button type="button" class="btn btn-sm btn-outline-primary edit-pet-btn client-only admin-only" data-pet-id="${pet.id}" title="Editar ${pet.name}"><i class="bi bi-pencil-fill"></i> Editar</button><button type="button" class="btn btn-sm btn-outline-danger delete-pet-btn client-only admin-only" data-pet-id="${pet.id}" data-pet-name="${pet.name}" title="Excluir ${pet.name}"><i class="bi bi-trash-fill"></i> Excluir</button></div></div></div>`; cc.appendChild(c);});} } // Botões de editar/excluir agora só visíveis para Client/Admin

// --- Handlers Página Pets ---
function handlePetCardActions(event) { const t=event.target.closest('button'); if(!t)return; const p=t.dataset.petId; if(!p)return; if(t.classList.contains('edit-pet-btn'))handleEditPetClick(p); else if(t.classList.contains('delete-pet-btn'))handleDeletePetClick(p,t.dataset.petName); }
function handleAddPetClick() { clearForm('petForm'); document.getElementById('petId').value=''; document.getElementById('petModalLabel').textContent='Adicionar Novo Pet'; showMessage('modal-form-message','','',0); const s=document.getElementById('savePetButton'); if(s)s.disabled=false; }
function handleEditPetClick(petId) { const p=getPetById(petId); if(!p){showMessage('pets-message','Erro: Pet não encontrado.','danger'); return;} clearForm('petForm'); document.getElementById('petId').value=p.id; document.getElementById('petName').value=p.name; document.getElementById('petSpecies').value=p.species; document.getElementById('petBreed').value=p.breed==='Não informado'?'':p.breed; document.getElementById('petBirthDate').value=p.birthDate||''; document.getElementById('petNotes').value=p.notes||''; document.getElementById('petModalLabel').textContent=`Editar Pet: ${p.name}`; document.getElementById('photoPreview').src=p.photoUrl||DEFAULT_PET_PHOTO; showMessage('modal-form-message','','',0); document.getElementById('file-error-message').textContent=''; const s=document.getElementById('savePetButton'); if(s)s.disabled=false; const m=bootstrap.Modal.getOrCreateInstance(document.getElementById('petModal')); m.show(); }
function handleDeletePetClick(petId, petName) { document.getElementById('petNameToDelete').textContent=petName||'este pet'; document.getElementById('confirmDeleteButton').dataset.petIdToDelete=petId; const m=bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')); m.show(); }
function handleConfirmDelete(event) { const b=event.target; const p=b.dataset.petIdToDelete; const e=document.getElementById('deleteConfirmModal'); const i=bootstrap.Modal.getInstance(e); if(p){b.disabled=true; const s=deletePet(p); if(s){showMessage('pets-message','Pet excluído com sucesso!','success'); renderPetsCards(); updateDashboardData();}else{showMessage('pets-message','Erro ao excluir o pet.','danger');} if(i)i.hide(); b.disabled=false; delete b.dataset.petIdToDelete;}else{console.error("Pet ID to delete not found!"); showMessage('pets-message','Erro inesperado ao excluir.','danger'); if(i)i.hide();} }
function handlePetModalClose(event) { clearForm('petForm'); const s=document.getElementById('savePetButton'); if(s){s.disabled=false; s.innerHTML='Salvar Pet';} const m=document.getElementById('petModalLabel'); if(m)m.textContent='Adicionar Novo Pet'; }
function handlePhotoFileChange(event) { const fi=event.target; const p=document.getElementById('photoPreview'); const fm=document.getElementById('file-error-message'); fm.textContent=''; const f=fi.files[0]; if(f){if(!f.type.startsWith('image/')){fm.textContent='Arquivo inválido. Selecione uma imagem.'; fi.value=''; p.src=DEFAULT_PET_PHOTO; return;} if(f.size>MAX_FILE_SIZE_BYTES){fm.textContent=`Arquivo muito grande (Máx ${MAX_FILE_SIZE_MB}MB).`; fi.value=''; p.src=DEFAULT_PET_PHOTO; return;} const r=new FileReader(); r.onload=(e)=>{p.src=e.target.result;}; r.onerror=()=>{fm.textContent='Erro ao ler imagem.'; p.src=DEFAULT_PET_PHOTO;}; r.readAsDataURL(f);}else{const pid=document.getElementById('petId').value; const cp=pid?getPetById(pid):null; p.src=cp?(cp.photoUrl||DEFAULT_PET_PHOTO):DEFAULT_PET_PHOTO;} }
function handlePetFormSubmit(event) { event.preventDefault(); event.stopPropagation(); const f=event.target; const sb=f.querySelector('#savePetButton'); const fi=f.querySelector('#petPhotoFile'); const fem=document.getElementById('file-error-message'); f.classList.add('was-validated'); if(!f.checkValidity()){return;} const pid=f.querySelector('#petId').value; const cp=pid?getPetById(pid):null; const luid=getLoggedInUserId(); if(!luid){showMessage('modal-form-message','Erro: Usuário não está logado.','danger'); return;} const pd={id:pid?Number(pid):null, ownerId:luid, name:f.querySelector('#petName').value, species:f.querySelector('#petSpecies').value, breed:f.querySelector('#petBreed').value, birthDate:f.querySelector('#petBirthDate').value, notes:f.querySelector('#petNotes').value, photoUrl:cp?cp.photoUrl:DEFAULT_PET_PHOTO}; sb.disabled=true; sb.innerHTML=`<span class="spinner-border spinner-border-sm"></span> Salvando...`; fem.textContent=''; const fl=fi.files[0]; const s=(fpd)=>{let sc=false; let m=''; let sp=null; try{if(fpd.id){sp=updatePet(fpd); sc=!!sp;}else{sp=addPet(fpd); sc=!!sp;} m=sc?(fpd.id?'Pet atualizado!':'Pet adicionado!'):'Erro ao salvar.';}catch(er){console.error("Erro ao salvar pet:",er); sc=false; m='Erro inesperado ao salvar.';} sb.disabled=false; sb.innerHTML='Salvar Pet'; if(sc){const pme=document.getElementById('petModal'); const pmi=bootstrap.Modal.getInstance(pme); if(pmi)pmi.hide(); showMessage('pets-message',m,'success'); renderPetsCards(); updateDashboardData();}else{showMessage('modal-form-message',m,'danger');}}; if(fl&&fl.type.startsWith('image/')&&fl.size<=MAX_FILE_SIZE_BYTES){const r=new FileReader(); r.onload=(e)=>{pd.photoUrl=e.target.result; s(pd);} ;r.onerror=()=>{showMessage('modal-form-message','Erro ao processar imagem.','danger'); sb.disabled=false; sb.innerHTML='Salvar Pet';} ;r.readAsDataURL(fl);}else if(fl){fem.textContent='Arquivo inválido ou muito grande.'; f.querySelector('#petPhotoFile').classList.add('is-invalid'); sb.disabled=false; sb.innerHTML='Salvar Pet';}else{s(pd);} }

// --- Renderização Dados Dashboard ---
function updateDashboardData() { const u=getLoggedInUserId(); if(!u)return; const usr=getUserById(u); if(!usr)return; const p=window.location.pathname.split('/').pop(); if(p==='dashboard.html'||p===''){const prf=usr.profile; const pe=document.getElementById('loggedInUserProfile'); if(pe)pe.textContent=`${usr.name} (${prf})`; const cpc=document.getElementById('totalPetsCount'); const spc=document.getElementById('systemTotalPetsCount'); if(prf==='client'){const up=getAllPetsByUser(u); if(cpc)cpc.textContent=up.length;}else if(prf==='administrator'||prf==='veterinarian'){const ap=getAllPets(); if(spc)spc.textContent=ap.length;} const cn=getAllBookedConsultations(); const rc=loadFromLocalStorage(storageKeys.recipes); const cc=document.getElementById('totalConsultationsCount'); if(cc)cc.textContent=cn.length; const rct=document.getElementById('totalRecipesCount'); if(rct)rct.textContent=rc.length; renderDashboardAgenda(prf, u);} }
function renderDashboardAgenda(prof, uid) { const tb=document.getElementById('dashboardAgendaTableBody'); if(!tb)return; let consultationsToShow = []; if (prof === 'administrator') { consultationsToShow = getAllBookedConsultations(); } else if (prof === 'veterinarian') { consultationsToShow = getAllBookedConsultations().filter(c => c.vetId === Number(uid)); } if(consultationsToShow.length === 0) { tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma consulta agendada ${prof==='veterinarian'?'para você':'no sistema'}.</td></tr>`; } else { tb.innerHTML = ''; consultationsToShow.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 10).forEach(con => { /* Mostra 10 mais próximas */ const pet = getPetById(con.petId); const client = getUserById(con.clientId); const row = tb.insertRow(); row.innerHTML = `<td>${new Date(con.date+'T00:00:00').toLocaleDateString('pt-BR',{timeZone:'UTC'})}</td><td>${con.time}</td><td>${pet?pet.name:'-'}</td><td>${client?client.name:'-'}</td><td>${con.reason}</td>`; }); } }

// --- Lógica Específica Página Consultas ---

// == Funções do Administrador ==
function populateAdminVetDropdown(selectElementId) { const s=document.getElementById(selectElementId); if(!s)return; s.innerHTML='<option value="" disabled selected>Selecione...</option>'; const v=getAllVeterinarians(); v.sort((a,b)=>a.name.localeCompare(b.name)); v.forEach(vet=>{const o=document.createElement('option'); o.value=vet.id; o.textContent=vet.name; s.appendChild(o);}); }
function renderAdminAvailabilitiesList(listElementId) { const l=document.getElementById(listElementId); const ld=document.getElementById('availabilitiesLoading'); if(!l)return; if(ld)ld.style.display='block'; l.innerHTML=''; const av=getAllAvailabilities(); const us=getAllUsers(); if(ld)ld.style.display='none'; if(av.length===0){l.innerHTML='<li class="list-group-item text-center text-muted">Nenhuma disponibilidade cadastrada.</li>'; return;} av.sort((a,b)=>{const dc=b.date.localeCompare(a.date); if(dc!==0)return dc; const va=us.find(u=>u.id===a.vetId)?.name||'Desconhecido'; const vb=us.find(u=>u.id===b.vetId)?.name||'Desconhecido'; return va.localeCompare(vb);}); av.forEach(a=>{const v=us.find(u=>u.id===a.vetId); const vn=v?v.name:`ID ${a.vetId} (Não encontrado)`; let dd='Data inválida'; try{const dO=new Date(a.date+'T00:00:00'); dd=dO.toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});}catch(e){console.error("Erro formatar data:",a.date,e);} const li=document.createElement('li'); li.className='list-group-item d-flex justify-content-between align-items-center'; li.innerHTML=`<span><i class="bi bi-calendar-check text-success me-2"></i><strong>${dd}</strong> - ${vn}</span><button class="btn btn-sm btn-outline-danger delete-availability-btn" data-availability-id="${a.id}" title="Excluir esta disponibilidade"><i class="bi bi-trash"></i></button>`; l.appendChild(li);}); }
function handleAdminAvailabilityFormSubmit(event) { event.preventDefault(); event.stopPropagation(); const f=event.target; const di=f.querySelector('#availabilityDateInput'); const vs=f.querySelector('#availabilityVetId'); const mi='availability-form-message'; f.classList.add('was-validated'); if(!f.checkValidity()){return;} const ds=di.value; const vid=vs.value; const r=addAvailability(ds,vid); if(r.success){showMessage(mi,r.message,'success'); renderAdminAvailabilitiesList('availabilitiesList'); clearForm(f.id); f.classList.remove('was-validated');} else{showMessage(mi,r.message,'danger'); di.classList.remove('is-invalid'); vs.classList.remove('is-invalid');} }
function handleAdminAvailabilityListClick(event) { const db=event.target.closest('.delete-availability-btn'); if(db){const aid=db.dataset.availabilityId; if(aid){if(confirm('Tem certeza que deseja excluir esta disponibilidade?')){deleteAvailability(aid);}}} }
function renderAllBookedAppointments(tableBodyId) { const tb=document.getElementById(tableBodyId); const lr=document.getElementById('loadingAllBookings'); if (!tb) return; tb.innerHTML=''; if (lr) tb.appendChild(lr); const bks=getAllBookedConsultations(); const p=getAllPets(); const u=getAllUsers(); if (lr) lr.style.display='table-row'; if(bks.length===0){if(lr)lr.style.display='none'; tb.innerHTML='<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma consulta agendada no sistema.</td></tr>'; return;} bks.sort((a,b)=>b.date.localeCompare(a.date)); tb.innerHTML=''; bks.forEach(bk=>{const pt=p.find(x=>x.id===bk.petId); const vt=u.find(x=>x.id===bk.vetId); const cl=u.find(x=>x.id===bk.clientId); const pn=pt?pt.name:`ID ${bk.petId}`; const tn=cl?cl.name:`ID ${bk.clientId}`; const vn=vt?vt.name:`ID ${bk.vetId}`; let dd='Data inválida'; try{const dO=new Date(bk.date+'T00:00:00'); dd=dO.toLocaleDateString('pt-BR',{timeZone:'UTC'});}catch(e){} let sbc='bg-secondary'; if(bk.status==='Agendada')sbc='bg-info'; else if(bk.status==='Compareceu')sbc='bg-success'; else if(bk.status==='Não Compareceu')sbc='bg-danger'; const row=tb.insertRow(); row.innerHTML=`<td>${dd}</td><td>${bk.time}</td><td>${pn}</td><td>${tn}</td><td>${vn}</td><td>${bk.reason}</td><td><span class="badge ${sbc}">${bk.status}</span></td>`; }); }

// == Funções do Cliente (usando flatpickr) ==
let clientFlatpickrInstance;
function populateClientPetDropdown(selectElementId, clientId) { const s=document.getElementById(selectElementId); if(!s)return false; s.innerHTML='<option value="" disabled selected>Selecione...</option>'; const p=getAllPetsByUser(clientId); if(p.length===0){s.disabled=true; s.innerHTML='<option value="" disabled selected>Nenhum pet cadastrado</option>'; showMessage('bookingForm-message','Você precisa cadastrar um pet antes de agendar.','warning',0); return false;} p.sort((a,b)=>a.name.localeCompare(b.name)); p.forEach(pet=>{const o=document.createElement('option'); o.value=pet.id; o.textContent=pet.name; s.appendChild(o);}); s.disabled=true; return true; }
function getAvailableVetsForDate(date) { const av=getAllAvailabilities(); const as=av.filter(a=>a.date===date); if(as.length===0){return [];} const v=getAllVeterinarians(); const avi=[...new Set(as.map(sl=>sl.vetId))]; const avl=v.filter(vt=>avi.includes(vt.id)); avl.sort((a,b)=>a.name.localeCompare(b.name)); return avl;}
function renderClientBookedAppointments(listElementId, clientId) { const l=document.getElementById(listElementId); if(!l)return; l.innerHTML=''; const b=getClientBookedConsultations(clientId); const p=getAllPets(); const v=getAllVeterinarians(); if(b.length===0){l.innerHTML='<li class="list-group-item text-center text-muted">Você não possui consultas agendadas.</li>'; return;} b.sort((a,b)=>b.date.localeCompare(a.date)); b.forEach(bk=>{const pt=p.find(x=>x.id===bk.petId); const vt=v.find(x=>x.id===bk.vetId); const pn=pt?pt.name:`Pet ID ${bk.petId}`; const vn=vt?vt.name:`Vet ID ${bk.vetId}`; let dd='Data inválida'; try{const dO=new Date(bk.date+'T00:00:00'); dd=dO.toLocaleDateString('pt-BR',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});}catch(e){} const li=document.createElement('li'); li.className='list-group-item'; let diagnosisHTML = ''; if (bk.diagnosis) { diagnosisHTML = `<div class="small ps-4 mt-1"><strong>Diagnóstico:</strong> ${bk.diagnosis.replace(/\n/g, '<br>')}</div>`; /* Replace newline for HTML */ } else { diagnosisHTML = `<div class="small text-muted ps-4 mt-1 fst-italic">Veterinário ainda não lançou o diagnóstico</div>`; } li.innerHTML=`<div><i class="bi bi-calendar-check-fill text-success me-2"></i><strong>${dd}</strong> (Status: ${bk.status})</div><div class="small text-muted ps-4">Pet: ${pn} | Veterinário(a): ${vn} | Motivo: ${bk.reason}</div>${diagnosisHTML}`; l.appendChild(li);}); }
function initializeFlatpickrCalendar(elementId) { const ce=document.getElementById(elementId); if (!ce||typeof flatpickr!=='function'){ console.error("Elem. calendário ou lib flatpickr não encontrados."); if(ce)ce.innerHTML='<p class="text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>Erro ao carregar calendário.</p>'; return; } ce.innerHTML=''; const av=getAllAvailabilities(); const ad=[...new Set(av.map(a=>a.date))]; const opt={locale:"pt", inline:true, dateFormat:"Y-m-d", minDate:"today", enable:ad, onChange: function(selectedDates, dateStr, instance) { const dde=document.getElementById('displaySelectedBookingDate'); const hid=document.getElementById('selectedBookingDateHidden'); const vs=document.getElementById('bookingVetId'); const ps=document.getElementById('bookingPetId'); const drf=document.getElementById('date-required-feedback'); if(vs){vs.innerHTML='<option value="" disabled selected>Selecione...</option>'; vs.disabled=true; vs.classList.remove('is-invalid');} if(ps){ps.selectedIndex=0; ps.disabled=true; ps.classList.remove('is-invalid');} if(hid)hid.value=''; if(dde)dde.textContent='Nenhuma'; if(drf)drf.style.display='none'; showMessage('bookingForm-message','','',0); if (dateStr) { if(dde){try{const dO=instance.parseDate(dateStr,"Y-m-d");dde.textContent=dO.toLocaleDateString('pt-BR',{dateStyle:'full'});}catch(e){dde.textContent=dateStr;}} if(hid)hid.value=dateStr; const avl=getAvailableVetsForDate(dateStr); if(avl.length>0&&vs){vs.innerHTML='<option value="" disabled selected>Selecione...</option>'; avl.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.name;vs.appendChild(o);}); if(avl.length===1){vs.value=avl[0].id; vs.disabled=true; console.log("Vet auto-selecionado:",avl[0].name);}else{vs.disabled=false;}} else if(vs){vs.innerHTML='<option value="" disabled selected>Nenhum Vet Disponível</option>'; vs.disabled=true;} if(ps&&ps.options.length>1){ps.disabled=false;}} else {if(vs)vs.disabled=true; if(ps)ps.disabled=true;} checkBookingButtonState();}, }; try { clientFlatpickrInstance=flatpickr(ce, opt); console.log("Flatpickr initialized."); } catch (err) { console.error("Erro ao inicializar flatpickr:", err); ce.innerHTML='<p class="text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>Erro ao carregar calendário.</p>'; } }
function checkBookingButtonState() { const h=document.getElementById('selectedBookingDateHidden'); const v=document.getElementById('bookingVetId'); const p=document.getElementById('bookingPetId'); const b=document.getElementById('bookAppointmentButton'); if(!h||!v||!p||!b){if(b)b.disabled=true;return;} const ds=h.value; const vs=v.value; const ps=p.value; const ok=ds&&vs&&ps; b.disabled=!ok; }
function handleBookingFormSubmit(event) { event.preventDefault(); event.stopPropagation(); const f=event.target; const mid='bookingForm-message'; const h=document.getElementById('selectedBookingDateHidden'); const drf=document.getElementById('date-required-feedback'); let d=h&&h.value; if(!d){if(drf)drf.style.display='block'; showMessage(mid,'Por favor, selecione uma data no calendário.','warning'); return;} else {if(drf)drf.style.display='none';} f.classList.add('was-validated'); if (!f.checkValidity()) { return; } const cid=getLoggedInUserId(); if (!cid) { showMessage(mid, 'Erro: Usuário não identificado.', 'danger'); return; } const bd={ date: h.value, petId: f.querySelector('#bookingPetId').value, vetId: f.querySelector('#bookingVetId').value, reason: f.querySelector('#bookingReason').value, clientId: cid }; const r=bookConsultation(bd); if (r.success) { showMessage(mid, r.message, 'success'); renderClientBookedAppointments('clientBookedAppointmentsList', cid); const abt=document.getElementById('bookedConsultationsTable'); if(abt&&window.getComputedStyle(abt.closest('.card')).display!=='none'){renderAllBookedAppointments('bookedConsultationsTable');} const vbt=document.getElementById('vetBookedConsultationsTable'); if(vbt&&window.getComputedStyle(vbt.closest('.vet-only')).display!=='none'){renderVetConsultationsTable('vetBookedConsultationsTable',getLoggedInUserId());} clearForm(f.id); f.classList.remove('was-validated'); } else { showMessage(mid, r.message || 'Erro ao agendar a consulta.', 'danger'); } }

// == Funções do Veterinário ==
function handleVetConsultationActions(event) { const target = event.target; if (target.classList.contains('vet-status-select')) { const consultationId = target.dataset.consultationId; const newStatus = target.value; const result = updateConsultationStatus(consultationId, newStatus); if (result.success) { showMessage('vet-consultations-message', result.message, 'success'); target.classList.remove('bg-info-subtle', 'bg-success-subtle', 'bg-danger-subtle', 'bg-light'); let statusBgClass = 'bg-light'; if (newStatus === 'Agendada') statusBgClass = 'bg-info-subtle'; else if (newStatus === 'Compareceu') statusBgClass = 'bg-success-subtle'; else if (newStatus === 'Não Compareceu') statusBgClass = 'bg-danger-subtle'; target.classList.add(statusBgClass); const cl=document.getElementById('clientBookedAppointmentsList'); if(cl){const ownerId = getBookedConsultationById(consultationId)?.clientId; if(ownerId) renderClientBookedAppointments('clientBookedAppointmentsList', ownerId); } const abt=document.getElementById('bookedConsultationsTable'); if(abt){renderAllBookedAppointments('bookedConsultationsTable');} } else { showMessage('vet-consultations-message', result.message, 'danger'); const booking = getBookedConsultationById(consultationId); if(booking) target.value = booking.status; } } const diagnosisButton = target.closest('.vet-diagnosis-btn'); if (diagnosisButton) { const consultationId = diagnosisButton.dataset.consultationId; handleOpenDiagnosisModal(consultationId); } }
function handleOpenDiagnosisModal(consultationId) { const booking = getBookedConsultationById(consultationId); if (!booking) { showMessage('vet-consultations-message', 'Erro: Consulta não encontrada.', 'danger'); return; } const m=document.getElementById('diagnosisModal'); const t=document.getElementById('diagnosisModalLabel'); const i=document.getElementById('diagnosisModalConsultationInfo'); const d=document.getElementById('diagnosisText'); const h=document.getElementById('diagnosisConsultationId'); if (!m||!t||!i||!d||!h) { console.error("Elementos do modal de diagnóstico não encontrados."); return; } const pet=getPetById(booking.petId); const pn=pet?pet.name:'Desconhecido'; let dt=booking.date; try{const o=new Date(booking.date+'T00:00:00'); dt=o.toLocaleDateString('pt-BR',{timeZone:'UTC'});}catch(e){} t.textContent=`Diagnóstico - Consulta ${dt}`; i.textContent=`Pet: ${pn}`; d.value=booking.diagnosis||''; h.value=consultationId; showMessage('diagnosisModal-message','','',0); const mdl=bootstrap.Modal.getOrCreateInstance(m); mdl.show(); }
function handleSaveDiagnosis(event) { event.preventDefault(); const form=event.target; const cid=form.querySelector('#diagnosisConsultationId').value; const dt=form.querySelector('#diagnosisText').value; if(!cid){showMessage('diagnosisModal-message','Erro: ID da consulta não encontrado.','danger'); return;} const result = updateConsultationDiagnosis(cid, dt.trim()); if(result.success){showMessage('vet-consultations-message', result.message, 'success'); const m=document.getElementById('diagnosisModal'); const mdl=bootstrap.Modal.getInstance(m); if(mdl) mdl.hide(); const vt=document.getElementById('vetBookedConsultationsTable'); if(vt){const b=vt.querySelector(`.vet-diagnosis-btn[data-consultation-id="${cid}"]`); if(b){b.innerHTML=`<i class="bi bi-pencil-square me-1"></i> ${dt.trim()?'Editar':'Adicionar'}`; b.title=dt.trim()?'Editar Diagnóstico':'Adicionar Diagnóstico';}} const cl=document.getElementById('clientBookedAppointmentsList'); if(cl){const ownerId = getBookedConsultationById(cid)?.clientId; if(ownerId) renderClientBookedAppointments('clientBookedAppointmentsList', ownerId);} } else {showMessage('diagnosisModal-message', result.message||'Erro ao salvar diagnóstico.', 'danger');} }


// --- Inicialização Principal ---
document.addEventListener("DOMContentLoaded", (e) => {
    console.log("DOM Ready. Init App v1.13..."); // <<-- VERSÃO ATUALIZADA
    initializeSampleData();
    const proceed = checkLoginAndSetupPage(); // Setup inicial e exibição de nome

    setupDarkMode();
    setupFormValidationAndListeners(); // Listeners gerais + tabela vet + modal

    if (proceed) {
        const uid = getLoggedInUserId();
        const profile = getUserProfile();
        const page = window.location.pathname.split('/').pop() || 'index.html';

        if (uid) {
            if (page === 'dashboard.html' || page === '') { updateDashboardData(); }
            else if (page === 'pets.html') { renderPetsCards(); }
            else if (page === 'consultations.html') {
                if (profile === 'administrator') {
                    console.log("Setting up Consultations page (v1.13) for Admin...");
                    const availabilityFormAdmin = document.getElementById('availabilityForm');
                    populateAdminVetDropdown('availabilityVetId');
                    if (availabilityFormAdmin) { availabilityFormAdmin.removeEventListener('submit', handleAdminAvailabilityFormSubmit); availabilityFormAdmin.addEventListener('submit', handleAdminAvailabilityFormSubmit); }
                    renderAdminAvailabilitiesList('availabilitiesList');
                    const dateInputAdmin = document.getElementById('availabilityDateInput'); if (dateInputAdmin) { dateInputAdmin.min = new Date().toISOString().split("T")[0]; }
                    renderAllBookedAppointments('bookedConsultationsTable');

                } else if (profile === 'veterinarian') {
                     console.log("Setting up Consultations page (v1.13) for Vet...");
                     renderVetConsultationsTable('vetBookedConsultationsTable', uid); // Vet vê suas consultas

                } else if (profile === 'client') {
                    console.log("Setting up Consultations page (v1.13) for Client (flatpickr)...");
                    const bookingForm = document.getElementById('bookingForm');
                    const petSelect = document.getElementById('bookingPetId');
                    const vetSelect = document.getElementById('bookingVetId');
                    const calendarContainer = document.getElementById('clientCalendar');
                    setTimeout(() => {
                         console.log("Attempting client setup (delayed)...");
                        if (!calendarContainer) { return; } const hasPets = populateClientPetDropdown('bookingPetId', uid);
                        if (hasPets) {
                            initializeFlatpickrCalendar('clientCalendar');
                            if (petSelect) { petSelect.removeEventListener('change', checkBookingButtonState); petSelect.addEventListener('change', checkBookingButtonState); }
                            if (vetSelect) { vetSelect.removeEventListener('change', checkBookingButtonState); vetSelect.addEventListener('change', checkBookingButtonState); }
                            if (bookingForm) { bookingForm.removeEventListener('submit', handleBookingFormSubmit); bookingForm.addEventListener('submit', handleBookingFormSubmit); }
                        } else {
                            if(calendarContainer) calendarContainer.innerHTML = '<p class="text-center text-muted mt-3">Cadastre um pet para poder agendar consultas.</p>';
                            if(bookingForm) bookingForm.style.display = 'none';
                        }
                        renderClientBookedAppointments('clientBookedAppointmentsList', uid);
                     }, 0);
                }
            } else if (page === 'register.html') { /* Setup feito */ }
        } else { /* Deslogado */ }
    } else { console.log("Redirected or setup failed."); }
    console.log("App v1.13 Init OK."); // <<-- VERSÃO ATUALIZADA
});