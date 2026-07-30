/**
 * Localizador de Lojas - Core JS
 * Gerenciamento de busca, filtros, mapas (Leaflet), geolocalização e navegação Google Maps.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State & Data
  const stores = window.LOJAS_DATA || [];
  let filteredStores = [...stores];
  let userLocation = null;
  let map = null;
  let markersLayer = null;

  // DOM Elements
  const totalCountEl = document.getElementById('total-lojas-count');
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const storesGrid = document.getElementById('stores-grid');
  const emptyState = document.getElementById('empty-state');
  const btnResetSearch = document.getElementById('btn-reset-search');
  
  // Filter DOM Elements
  const filterStatus = document.getElementById('filter-status');
  const filterSupervisor = document.getElementById('filter-supervisor');
  const filterMunicipio = document.getElementById('filter-municipio');
  const filterRegiao = document.getElementById('filter-regiao');
  const filterTipoLoja = document.getElementById('filter-tipo-loja');
  const btnApplyFilters = document.getElementById('btn-apply-filters');
  const filterBadge = document.getElementById('filter-badge');
  const activeFiltersBar = document.getElementById('active-filters-bar');
  const chipsWrapper = document.getElementById('chips-wrapper');
  const btnResetAllFilters = document.getElementById('btn-reset-all-filters');
  
  // GPS & Theme
  const btnGps = document.getElementById('btn-gps');
  const gpsBanner = document.getElementById('gps-status-banner');
  const btnClearGps = document.getElementById('btn-clear-gps');
  const btnTheme = document.getElementById('btn-theme');

  // Modal DOM
  const modal = document.getElementById('store-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const toast = document.getElementById('toast');

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const viewSections = document.querySelectorAll('.view-section');

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // 2. Populate Filter Options Dynamically
  // --------------------------------------------------------------------------
  function populateDropdowns() {
    const supervisors = [...new Set(stores.map(s => s.supervisor).filter(Boolean))].sort();
    const municipios = [...new Set(stores.map(s => s.municipio).filter(Boolean))].sort();
    const regioes = [...new Set(stores.map(s => s.regiao).filter(Boolean))].sort();
    const tipos = [...new Set(stores.map(s => s.tipo_loja).filter(Boolean))].sort();

    supervisors.forEach(sup => {
      filterSupervisor.add(new Option(sup, sup));
    });

    municipios.forEach(m => {
      filterMunicipio.add(new Option(m, m));
    });

    regioes.forEach(r => {
      filterRegiao.add(new Option(r, r));
    });

    tipos.forEach(t => {
      filterTipoLoja.add(new Option(t, t));
    });
  }

  // Helper to extract clean store number (e.g., "loja 126", "#126", "050" -> "126" or "50")
  function extractCleanNumber(str) {
    if (!str) return '';
    let q = str.toLowerCase().trim();
    q = q.replace(/^(loja|lj)\s*#?/gi, '').replace(/^#/, '').trim();
    if (/^\d+$/.test(q)) {
      return String(parseInt(q, 10));
    }
    return '';
  }

  // Helper to check if store matches active select dropdown filters
  function matchesDropdownFilters(store, { statusVal, supervisorVal, municipioVal, regiaoVal, tipoVal }) {
    if (statusVal) {
      if (statusVal === 'SIM' && store.aberta !== 'SIM') return false;
      if (statusVal === 'OUTROS' && store.aberta === 'SIM') return false;
      if (statusVal === 'ADM' && store.aberta !== 'ADM') return false;
    }
    if (supervisorVal && store.supervisor !== supervisorVal) return false;
    if (municipioVal && store.municipio !== municipioVal) return false;
    if (regiaoVal && store.regiao !== regiaoVal) return false;
    if (tipoVal && store.tipo_loja !== tipoVal) return false;

    return true;
  }

  // --------------------------------------------------------------------------
  // 3. Filter & Search Logic
  // --------------------------------------------------------------------------
  function applyFilters() {
    const rawQuery = searchInput.value.toLowerCase().trim();
    const cleanNum = extractCleanNumber(rawQuery);

    const statusVal = filterStatus.value;
    const supervisorVal = filterSupervisor.value;
    const municipioVal = filterMunicipio.value;
    const regiaoVal = filterRegiao.value;
    const tipoVal = filterTipoLoja.value;

    const dropdownFilterObj = { statusVal, supervisorVal, municipioVal, regiaoVal, tipoVal };

    let activeFilterCount = 0;
    if (statusVal) activeFilterCount++;
    if (supervisorVal) activeFilterCount++;
    if (municipioVal) activeFilterCount++;
    if (regiaoVal) activeFilterCount++;
    if (tipoVal) activeFilterCount++;

    if (activeFilterCount > 0) {
      filterBadge.textContent = activeFilterCount;
      filterBadge.classList.remove('hidden');
    } else {
      filterBadge.classList.add('hidden');
    }

    updateFilterChips({ statusVal, supervisorVal, municipioVal, regiaoVal, tipoVal });

    // STRICT NUMBER SEARCH RULE:
    // If user entered a store number (e.g. "126", "loja 126", "#126", "050"),
    // search EXCLUSIVELY by Store Number (`store.num`). Do not match CNPJ or addresses.
    if (cleanNum) {
      const exactStoreMatch = stores.find(s => String(s.num || '').trim() === cleanNum);
      if (exactStoreMatch && matchesDropdownFilters(exactStoreMatch, dropdownFilterObj)) {
        filteredStores = [exactStoreMatch];
      } else {
        filteredStores = []; // No store with this number exists
      }
      renderStoresList();
      if (map) updateMapMarkers();
      return;
    }

    // Standard Text Search Filter (City, Store Name, Supervisor, Bairro, Address, CNPJ)
    filteredStores = stores.filter(store => {
      // 1. Check select filters
      if (!matchesDropdownFilters(store, dropdownFilterObj)) {
        return false;
      }

      // 2. Text Query Search
      if (rawQuery) {
        const numStr = String(store.num || '').trim();
        const textToSearch = [
          `loja ${numStr}`,
          `loja #${numStr}`,
          `#${numStr}`,
          numStr,
          store.loja,
          store.municipio,
          store.bairro,
          store.endereco,
          store.supervisor,
          store.cnpj,
          store.veterinario
        ].join(' ').toLowerCase();

        if (!textToSearch.includes(rawQuery)) {
          return false;
        }
      }

      return true;
    });

    if (userLocation && !rawQuery) {
      sortStoresByDistance();
    }

    renderStoresList();
    if (map) {
      updateMapMarkers();
    }
  }

  function updateFilterChips({ statusVal, supervisorVal, municipioVal, regiaoVal, tipoVal }) {
    chipsWrapper.innerHTML = '';
    const activeFilters = [];

    if (statusVal) activeFilters.push({ key: 'status', label: `Status: ${statusVal}` });
    if (supervisorVal) activeFilters.push({ key: 'supervisor', label: `Supervisor: ${supervisorVal}` });
    if (municipioVal) activeFilters.push({ key: 'municipio', label: `Cidade: ${municipioVal}` });
    if (regiaoVal) activeFilters.push({ key: 'regiao', label: `Região: ${regiaoVal}` });
    if (tipoVal) activeFilters.push({ key: 'tipo', label: `Tipo: ${tipoVal}` });

    if (activeFilters.length > 0) {
      activeFiltersBar.classList.remove('hidden');
      activeFilters.forEach(f => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = `${f.label} <button data-remove="${f.key}">&times;</button>`;
        chipsWrapper.appendChild(chip);
      });
    } else {
      activeFiltersBar.classList.add('hidden');
    }
  }

  // Remove specific filter chip
  chipsWrapper.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const key = e.target.getAttribute('data-remove');
      if (key === 'status') filterStatus.value = '';
      if (key === 'supervisor') filterSupervisor.value = '';
      if (key === 'municipio') filterMunicipio.value = '';
      if (key === 'regiao') filterRegiao.value = '';
      if (key === 'tipo') filterTipoLoja.value = '';
      applyFilters();
    }
  });

  btnResetAllFilters.addEventListener('click', () => {
    filterStatus.value = '';
    filterSupervisor.value = '';
    filterMunicipio.value = '';
    filterRegiao.value = '';
    filterTipoLoja.value = '';
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    applyFilters();
  });

  // --------------------------------------------------------------------------
  // 4. Render Store Cards Grid
  // --------------------------------------------------------------------------
  function renderStoresList() {
    totalCountEl.textContent = filteredStores.length;
    storesGrid.innerHTML = '';

    if (filteredStores.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    } else {
      emptyState.classList.add('hidden');
    }

    // Render cards
    const storeSlice = filteredStores.slice(0, 150);

    storeSlice.forEach(store => {
      const card = document.createElement('div');
      card.className = 'store-card';

      const statusClass = store.aberta === 'SIM' ? 'status-sim' : (store.aberta === 'ADM' ? 'status-adm' : 'status-outros');
      const statusText = store.aberta === 'SIM' ? 'ABERTA' : (store.aberta === 'ADM' ? 'ADM' : 'FECHADA / OUTRO');

      let distanceHTML = '';
      if (store.distanceKm !== undefined) {
        distanceHTML = `<span class="distance-badge"><i data-lucide="navigation"></i> ${store.distanceKm.toFixed(1)} km</span>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-header-row">
            <span class="num-badge">Loja #${store.num || '---'}</span>
            ${distanceHTML}
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <h3 class="store-title">${store.loja}</h3>
          <div class="store-meta">
            <span class="meta-item"><i data-lucide="map-pin"></i> ${store.municipio || 'N/A'} - ${store.uf || 'MG'}</span>
            <span class="meta-item"><i data-lucide="user"></i> Sup: ${store.supervisor || 'N/A'}</span>
          </div>
          <div class="store-address">
            ${store.endereco ? `${store.endereco}, ${store.numero || 'S/N'} - ${store.bairro}` : 'Endereço não informado'}
          </div>
        </div>

        <div class="card-actions">
          <a href="${store.gmaps_link}" target="_blank" rel="noopener noreferrer" class="btn-gmaps" title="Abrir rota no Google Maps">
            <i data-lucide="map-pin"></i> Google Maps
          </a>
          <button class="btn-details" data-num="${store.num}">
            Detalhes
          </button>
        </div>
      `;

      storesGrid.appendChild(card);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // --------------------------------------------------------------------------
  // 5. Leaflet Map Initialization & Markers
  // --------------------------------------------------------------------------
  function initMap() {
    if (map) return;

    // Default center on Minas Gerais (Belo Horizonte)
    map = L.map('map-container').setView([-19.9167, -43.9345], 10);

    // OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markersLayer = L.featureGroup().addTo(map);
    updateMapMarkers();
  }

  function updateMapMarkers() {
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const bounds = [];

    filteredStores.forEach(store => {
      if (store.lat && store.lon) {
        const marker = L.marker([store.lat, store.lon]);
        
        const popupContent = `
          <div style="font-family: var(--font-body); padding: 4px;">
            <div style="font-weight: 700; color: #3b82f6;">Loja #${store.num} - ${store.loja}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">${store.endereco || ''}, ${store.bairro || ''} - ${store.municipio || ''}</div>
            <div style="font-size: 0.8rem; margin-top: 4px;"><strong>Supervisor:</strong> ${store.supervisor || 'N/A'}</div>
            <div style="margin-top: 10px;">
              <a href="${store.gmaps_link}" target="_blank" rel="noopener noreferrer" 
                 style="display: inline-flex; align-items: center; gap: 4px; background: #10b981; color: #fff; text-decoration: none; font-size: 0.8rem; font-weight: bold; padding: 6px 12px; border-radius: 6px;">
                🚗 Rota no Google Maps
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
        bounds.push([store.lat, store.lon]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  // --------------------------------------------------------------------------
  // 6. GPS Proximity (Haversine Distance)
  // --------------------------------------------------------------------------
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function sortStoresByDistance() {
    if (!userLocation) return;
    stores.forEach(store => {
      if (store.lat && store.lon) {
        store.distanceKm = calculateDistance(userLocation.lat, userLocation.lon, store.lat, store.lon);
      } else {
        store.distanceKm = 99999;
      }
    });

    filteredStores.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
  }

  btnGps.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    btnGps.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        btnGps.classList.remove('loading');
        gpsBanner.classList.remove('hidden');

        // Switch to list view and apply distance sorting
        switchTab('list');
        applyFilters();
      },
      (error) => {
        btnGps.classList.remove('loading');
        alert('Não foi possível obter sua localização GPS. Verifique a permissão do navegador.');
      }
    );
  });

  btnClearGps.addEventListener('click', () => {
    userLocation = null;
    gpsBanner.classList.add('hidden');
    stores.forEach(s => delete s.distanceKm);
    applyFilters();
  });

  // --------------------------------------------------------------------------
  // 7. Store Details Modal
  // --------------------------------------------------------------------------
  function openModal(storeNum) {
    const store = stores.find(s => String(s.num) === String(storeNum));
    if (!store) return;

    document.getElementById('modal-store-num').textContent = `Loja #${store.num}`;
    document.getElementById('modal-store-name').textContent = store.loja;
    document.getElementById('modal-store-city').textContent = `${store.municipio || ''} - ${store.uf || 'MG'} (${store.regiao || ''})`;

    const modalStatus = document.getElementById('modal-store-status');
    modalStatus.textContent = store.aberta === 'SIM' ? 'ABERTA' : (store.aberta === 'ADM' ? 'ADM' : 'OUTRO');
    modalStatus.className = `status-badge ${store.aberta === 'SIM' ? 'status-sim' : (store.aberta === 'ADM' ? 'status-adm' : 'status-outros')}`;

    // Links
    document.getElementById('modal-gmaps-btn').href = store.gmaps_link;
    document.getElementById('modal-waze-btn').href = store.waze_link;

    // Address
    const addressText = `${store.endereco || ''}, ${store.numero || 'S/N'} - ${store.bairro || ''}, ${store.municipio || ''} - ${store.uf || 'MG'} (CEP: ${store.cep || 'N/A'})`;
    document.getElementById('modal-address').textContent = addressText;

    // Supervisor & Email
    document.getElementById('modal-supervisor').textContent = store.supervisor || 'Não informado';
    const emailSupBtn = document.getElementById('modal-supervisor-email');
    if (store.email_supervisor) {
      emailSupBtn.href = `mailto:${store.email_supervisor.trim()}`;
      emailSupBtn.classList.remove('hidden');
    } else {
      emailSupBtn.classList.add('hidden');
    }

    // Phone
    const phoneVal = store.telefone_corporativo;
    document.getElementById('modal-phone').textContent = phoneVal || 'Não informado';
    const phoneCallBtn = document.getElementById('modal-phone-call');
    if (phoneVal) {
      phoneCallBtn.href = `tel:${phoneVal}`;
      phoneCallBtn.classList.remove('hidden');
    } else {
      phoneCallBtn.classList.add('hidden');
    }

    // Veterinarian
    document.getElementById('modal-vet').textContent = store.veterinario || 'Não informado';
    const vetPhoneVal = store.contato_vet;
    document.getElementById('modal-vet-phone').textContent = vetPhoneVal ? `Contato: ${vetPhoneVal}` : '';
    const vetCallBtn = document.getElementById('modal-vet-call');
    if (vetPhoneVal) {
      vetCallBtn.href = `tel:${vetPhoneVal}`;
      vetCallBtn.classList.remove('hidden');
    } else {
      vetCallBtn.classList.add('hidden');
    }

    // CNPJ & Auditor
    document.getElementById('modal-cnpj').textContent = store.cnpj || 'Não informado';
    document.getElementById('modal-auditor').textContent = `${store.auditor || 'N/A'} (${store.tipo_operacao || 'N/A'})`;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Grid click delegation for Modal
  storesGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-details');
    if (btn) {
      const num = btn.getAttribute('data-num');
      openModal(num);
    }
  });

  btnCloseModal.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // --------------------------------------------------------------------------
  // 8. Clipboard Copy Toast
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const btnCopy = e.target.closest('.btn-copy');
    if (btnCopy) {
      const targetId = btnCopy.getAttribute('data-copy-target');
      const textToCopy = document.getElementById(targetId)?.textContent;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Copiado para a área de transferência!');
        });
      }
    }
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }

  // --------------------------------------------------------------------------
  // 9. Tab Switching (List / Map / Filters)
  // --------------------------------------------------------------------------
  function switchTab(viewName) {
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    viewSections.forEach(section => {
      if (section.id === `view-${viewName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    if (viewName === 'map') {
      setTimeout(() => {
        initMap();
        if (map) map.invalidateSize();
      }, 100);
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchTab(view);
    });
  });

  btnApplyFilters.addEventListener('click', () => {
    applyFilters();
    switchTab('list');
  });

  btnResetSearch.addEventListener('click', () => {
    btnResetAllFilters.click();
  });

  // Search input events
  searchInput.addEventListener('input', () => {
    if (searchInput.value) {
      btnClearSearch.classList.remove('hidden');
    } else {
      btnClearSearch.classList.add('hidden');
    }
    applyFilters();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    applyFilters();
  });

  // --------------------------------------------------------------------------
  // 10. Theme Switcher (Dark / Light)
  // --------------------------------------------------------------------------
  const savedTheme = localStorage.getItem('app-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  btnTheme.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    const icon = btnTheme.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  populateDropdowns();
  applyFilters();
});
