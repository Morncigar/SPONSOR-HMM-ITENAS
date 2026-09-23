/* ============================================================
   HMM ITENAS PARTNERSHIP COMMAND CENTER
   APP.JS — FINAL V1
   ============================================================ */


/* ============================================================
   1. SUPABASE CONFIG
============================================================ */

const SUPABASE_URL =
  "https://wfbryxckwaiksrximxmv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_H4jRDxZdWg9hkDXbk9Sghg__ZeS5JzN";

console.log("APP.JS LOADED");
console.log("Supabase global:", window.supabase);


/* ============================================================
   2. CREATE SUPABASE CLIENT
============================================================ */

if (!window.supabase) {
  throw new Error(
    "Supabase JS gagal dimuat. Pastikan CDN @supabase/supabase-js@2 ada di index.html."
  );
}

const { createClient } = window.supabase;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


/* ============================================================
   3. GLOBAL STATE
============================================================ */

const state = {
  session: null,
  user: null,
  profile: null,

  campaigns: [],
  selectedCampaignId: null,

  profiles: [],
  organizations: [],
  contacts: [],

  opportunities: [],
  opportunityOverview: [],

  tasks: [],

  targets: [],
  targetProgress: [],

  pipeline: [],

  mediaPartners: [],
  mediaPublications: [],

  activities: [],
  notifications: [],

  partnershipValues: null,

  currentPage: "overview",

  appBootstrapped: false,
  loadingProfile: false
};


/* ============================================================
   4. DOM HELPERS
============================================================ */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  Array.from(
    document.querySelectorAll(selector)
  );


function show(element) {
  if (!element) return;

  element.classList.remove(
    "hidden"
  );
}


function hide(element) {
  if (!element) return;

  element.classList.add(
    "hidden"
  );
}


function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function nullableText(value) {
  const text =
    String(value || "")
      .trim();

  return text || null;
}


function parseNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function nullableNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function nullableDate(value) {
  return value || null;
}


function toISODateTime(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}


function formatMoney(value) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value || 0)
  );
}


function formatNumber(value) {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value || 0)
  );
}


function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}


function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


function initials(name = "") {
  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

  if (!parts.length) {
    return "HM";
  }

  return parts
    .map(
      (word) =>
        word.charAt(0)
    )
    .join("")
    .toUpperCase();
}


function titleize(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function isAdmin() {
  return (
    state.profile?.role ===
    "admin"
  );
}


/* ============================================================
   5. ERROR HANDLING
============================================================ */

function humanizeError(error) {
  console.error(error);

  const message =
    error?.message ||
    "Terjadi kesalahan.";

  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "permission denied"
    )
  ) {
    return (
      "Database menolak akses. Cek grants atau RLS."
    );
  }

  if (
    lower.includes(
      "row-level security"
    )
  ) {
    return (
      "Akses ditolak oleh Row Level Security."
    );
  }

  if (
    lower.includes(
      "duplicate"
    ) ||
    lower.includes(
      "unique constraint"
    )
  ) {
    return (
      "Data serupa sudah ada."
    );
  }

  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {
    return (
      "Email atau password salah."
    );
  }

  if (
    lower.includes(
      "email not confirmed"
    )
  ) {
    return (
      "Email belum diverifikasi. Cek inbox email kamu."
    );
  }

  return message;
}


/* ============================================================
   6. TOAST
============================================================ */

function showToast(
  message,
  type = "success"
) {
  const container =
    $("#toastContainer");

  if (!container) {
    return;
  }

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    `toast toast-${type}`;

  toast.textContent =
    message;

  container.appendChild(
    toast
  );

  requestAnimationFrame(
    () => {
      toast.classList.add(
        "show"
      );
    }
  );

  setTimeout(
    () => {
      toast.classList.remove(
        "show"
      );

      setTimeout(
        () => {
          toast.remove();
        },
        250
      );
    },
    3500
  );
}


/* ============================================================
   7. FORM HELPERS
============================================================ */

function setFormMessage(
  element,
  message = "",
  type = ""
) {
  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.className =
    `form-message ${type}`;
}


function setButtonLoading(
  button,
  loading,
  loadingText = "Loading..."
) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText =
      button.textContent;

    button.disabled = true;

    button.textContent =
      loadingText;

    return;
  }

  button.disabled =
    false;

  if (
    button.dataset.originalText
  ) {
    button.textContent =
      button.dataset.originalText;
  }
}


/* ============================================================
   8. MODALS
============================================================ */

function openModal(id) {
  show(
    document.getElementById(
      id
    )
  );
}


function closeModal(id) {
  hide(
    document.getElementById(
      id
    )
  );
}


function closeAllModals() {
  $$(".modal-overlay")
    .forEach(
      (modal) => {
        hide(modal);
      }
    );
}


/* ============================================================
   9. SCREEN STATE
============================================================ */

function showLoading() {
  show($("#appLoading"));

  hide($("#authScreen"));
  hide($("#appShell"));
}


function showAuth() {
  hide($("#appLoading"));
  hide($("#appShell"));

  show($("#authScreen"));
}


function showApp() {
  hide($("#appLoading"));
  hide($("#authScreen"));

  show($("#appShell"));
}


function showLoginForm() {
  show($("#loginForm"));

  hide($("#registerForm"));
}


function showRegisterForm() {
  hide($("#loginForm"));

  show($("#registerForm"));
}


/* ============================================================
   10. REGISTER
============================================================ */

async function registerUser(
  event
) {
  event.preventDefault();

  const form =
    $("#registerForm");

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const message =
    $("#registerMessage");

  const fullName =
    $("#registerName")
      .value
      .trim();

  const email =
    $("#registerEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    $("#registerPassword")
      .value;

  const confirmPassword =
    $("#registerPasswordConfirm")
      .value;


  setFormMessage(
    message
  );


  if (
    fullName.length < 2
  ) {
    setFormMessage(
      message,
      "Nama belum valid.",
      "error"
    );

    return;
  }


  if (
    password.length < 8
  ) {
    setFormMessage(
      message,
      "Password minimal 8 karakter.",
      "error"
    );

    return;
  }


  if (
    password !==
    confirmPassword
  ) {
    setFormMessage(
      message,
      "Konfirmasi password tidak sama.",
      "error"
    );

    return;
  }


  setButtonLoading(
    button,
    true,
    "Creating account..."
  );


  try {
    const {
      data,
      error
    } =
      await supabase
        .auth
        .signUp({
          email,
          password,

          options: {
            data: {
              full_name:
                fullName
            }
          }
        });


    if (error) {
      throw error;
    }


    form.reset();

    showLoginForm();


    setFormMessage(
      $("#loginMessage"),
      "Account berhasil dibuat. Cek email untuk verifikasi. Setelah email terverifikasi, akun tetap menunggu aktivasi admin.",
      "success"
    );


    if (
      data.session
    ) {
      await supabase
        .auth
        .signOut();
    }

  } catch (error) {
    setFormMessage(
      message,
      humanizeError(error),
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false
    );
  }
}


/* ============================================================
   11. LOGIN
============================================================ */

async function loginUser(
  event
) {
  event.preventDefault();

  const form =
    $("#loginForm");

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const message =
    $("#loginMessage");

  const email =
    $("#loginEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    $("#loginPassword")
      .value;


  setFormMessage(
    message
  );


  setButtonLoading(
    button,
    true,
    "Signing in..."
  );


  try {
    const {
      data,
      error
    } =
      await supabase
        .auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {
      throw error;
    }


    state.session =
      data.session;

    state.user =
      data.user;


    await loadCurrentProfile();

  } catch (error) {
    setFormMessage(
      message,
      humanizeError(error),
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false
    );
  }
}


/* ============================================================
   12. LOGOUT
============================================================ */

async function logoutUser() {
  try {
    await supabase
      .auth
      .signOut();

  } catch (error) {
    console.error(error);
  }

  resetState();

  showAuth();

  showLoginForm();
}


/* ============================================================
   13. CURRENT PROFILE
============================================================ */

async function loadCurrentProfile() {
  if (
    !state.user ||
    state.loadingProfile
  ) {
    return;
  }


  state.loadingProfile =
    true;


  try {
    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          state.user.id
        )
        .single();


    if (error) {
      throw error;
    }


    state.profile =
      data;


    if (
      data.status ===
      "pending"
    ) {
      await supabase
        .auth
        .signOut();

      resetState();

      showAuth();

      showLoginForm();

      setFormMessage(
        $("#loginMessage"),
        "Email sudah terverifikasi, tapi akun masih menunggu aktivasi admin.",
        "error"
      );

      return;
    }


    if (
      data.status ===
      "disabled"
    ) {
      await supabase
        .auth
        .signOut();

      resetState();

      showAuth();

      showLoginForm();

      setFormMessage(
        $("#loginMessage"),
        "Akun sedang dinonaktifkan.",
        "error"
      );

      return;
    }


    if (
      data.status !==
      "active"
    ) {
      await supabase
        .auth
        .signOut();

      resetState();

      showAuth();

      return;
    }


    renderUserIdentity();

    showApp();


    if (
      !state.appBootstrapped
    ) {
      await bootstrapApp();
    }

  } catch (error) {
    console.error(error);

    await supabase
      .auth
      .signOut();

    resetState();

    showAuth();

    showLoginForm();

    setFormMessage(
      $("#loginMessage"),
      "Profile account gagal dimuat.",
      "error"
    );

  } finally {
    state.loadingProfile =
      false;
  }
}


/* ============================================================
   14. USER IDENTITY
============================================================ */

function renderUserIdentity() {
  if (!state.profile) {
    return;
  }


  const fullName =
    state.profile.full_name ||
    "User";


  $("#sidebarUserName")
    .textContent =
    fullName;


  $("#sidebarUserRole")
    .textContent =
    isAdmin()
      ? "Admin"
      : "Sponsor Staff";


  $("#sidebarUserAvatar")
    .textContent =
    initials(fullName);


  $$(".admin-only")
    .forEach(
      (element) => {
        if (isAdmin()) {
          element.classList.remove(
            "hidden"
          );
        } else {
          element.classList.add(
            "hidden"
          );
        }
      }
    );
}


/* ============================================================
   15. RESET STATE
============================================================ */

function resetState() {
  state.session = null;
  state.user = null;
  state.profile = null;

  state.campaigns = [];
  state.selectedCampaignId =
    null;

  state.profiles = [];
  state.organizations = [];
  state.contacts = [];

  state.opportunities = [];
  state.opportunityOverview =
    [];

  state.tasks = [];

  state.targets = [];
  state.targetProgress = [];

  state.pipeline = [];

  state.mediaPartners = [];
  state.mediaPublications =
    [];

  state.activities = [];
  state.notifications = [];

  state.partnershipValues =
    null;

  state.currentPage =
    "overview";

  state.appBootstrapped =
    false;

  state.loadingProfile =
    false;
}


/* ============================================================
   16. BOOTSTRAP
============================================================ */

async function bootstrapApp() {
  try {
    await Promise.all([
      loadCampaigns(),
      loadProfiles(),
      loadOrganizations(),
      loadNotifications()
    ]);


    if (
      !state.selectedCampaignId &&
      state.campaigns.length
    ) {
      state.selectedCampaignId =
        Number(
          state.campaigns[0].id
        );
    }


    renderCampaignSelector();


    await loadCampaignData();


    state.appBootstrapped =
      true;


    renderAll();

    navigateTo(
      "overview"
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   17. REFRESH
============================================================ */

async function refreshEverything() {
  const button =
    $("#refreshDashboardButton");


  setButtonLoading(
    button,
    true,
    "Refreshing..."
  );


  try {
    await Promise.all([
      loadCampaigns(),
      loadProfiles(),
      loadOrganizations(),
      loadNotifications()
    ]);


    await loadCampaignData();


    renderCampaignSelector();

    renderAll();


    showToast(
      "Dashboard updated."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );

  } finally {
    setButtonLoading(
      button,
      false
    );
  }
}


/* ============================================================
   18. CAMPAIGNS
============================================================ */

async function loadCampaigns() {
  const {
    data,
    error
  } =
    await supabase
      .from("campaigns")
      .select("*")
      .eq(
        "is_archived",
        false
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  state.campaigns =
    data || [];


  if (
    state.selectedCampaignId &&
    !state.campaigns.some(
      (campaign) =>
        Number(campaign.id) ===
        Number(
          state.selectedCampaignId
        )
    )
  ) {
    state.selectedCampaignId =
      null;
  }
}


function renderCampaignSelector() {
  const select =
    $("#campaignSelect");

  if (!select) {
    return;
  }


  if (
    !state.campaigns.length
  ) {
    select.innerHTML = `
      <option value="">
        No campaign
      </option>
    `;

    return;
  }


  select.innerHTML =
    state.campaigns
      .map(
        (campaign) => `
          <option value="${campaign.id}">
            ${escapeHTML(
              campaign.name
            )}
          </option>
        `
      )
      .join("");


  if (
    state.selectedCampaignId
  ) {
    select.value =
      String(
        state.selectedCampaignId
      );
  }
}


async function handleCampaignSelection(
  event
) {
  state.selectedCampaignId =
    event.target.value
      ? Number(
          event.target.value
        )
      : null;


  await loadCampaignData();

  renderAll();
}


async function createCampaign(
  event
) {
  event.preventDefault();


  if (!isAdmin()) {
    showToast(
      "Admin only.",
      "error"
    );

    return;
  }


  const name =
    $("#campaignName")
      .value
      .trim();


  if (!name) {
    showToast(
      "Campaign name wajib diisi.",
      "error"
    );

    return;
  }


  const payload = {
    name,

    description:
      nullableText(
        $("#campaignDescription")
          .value
      ),

    start_date:
      nullableDate(
        $("#campaignStartDate")
          .value
      ),

    end_date:
      nullableDate(
        $("#campaignEndDate")
          .value
      ),

    partnership_deadline:
      nullableDate(
        $("#campaignPartnershipDeadline")
          .value
      ),

    created_by:
      state.user.id
  };


  try {
    const {
      data,
      error
    } =
      await supabase
        .from("campaigns")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    $("#campaignForm")
      .reset();


    closeModal(
      "campaignModal"
    );


    state.selectedCampaignId =
      Number(data.id);


    await loadCampaigns();

    renderCampaignSelector();

    await loadCampaignData();

    renderAll();


    showToast(
      "Campaign created."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   19. PROFILES / TEAM
============================================================ */

async function loadProfiles() {
  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        phone,
        avatar_url,
        last_active_at
      `)
      .order(
        "full_name"
      );


  if (error) {
    throw error;
  }


  state.profiles =
    data || [];


  populateProfileSelects();
}


function populateProfileSelects() {
  const active =
    state.profiles.filter(
      (profile) =>
        profile.status ===
        "active"
    );


  const options =
    active
      .map(
        (profile) => `
          <option value="${profile.id}">
            ${escapeHTML(
              profile.full_name
            )}
          </option>
        `
      )
      .join("");


  [
    "#opportunityOwner",
    "#taskAssignedTo"
  ].forEach(
    (selector) => {
      const element =
        $(selector);

      if (!element) {
        return;
      }

      element.innerHTML =
        options;
    }
  );


  if (state.user) {
    if (
      $("#opportunityOwner")
    ) {
      $("#opportunityOwner")
        .value =
        state.user.id;
    }


    if (
      $("#taskAssignedTo")
    ) {
      $("#taskAssignedTo")
        .value =
        state.user.id;
    }
  }
}


/* ============================================================
   20. ORGANIZATIONS
============================================================ */

async function loadOrganizations() {
  const {
    data,
    error
  } =
    await supabase
      .from("organizations")
      .select("*")
      .eq(
        "is_archived",
        false
      )
      .order(
        "name"
      );


  if (error) {
    throw error;
  }


  state.organizations =
    data || [];


  populateOrganizationSelect();
}


function populateOrganizationSelect() {
  const select =
    $("#opportunityOrganization");


  if (!select) {
    return;
  }


  if (
    !state.organizations.length
  ) {
    select.innerHTML = `
      <option value="">
        No organization
      </option>
    `;

    return;
  }


  select.innerHTML =
    state.organizations
      .map(
        (organization) => `
          <option value="${organization.id}">
            ${escapeHTML(
              organization.name
            )}
          </option>
        `
      )
      .join("");
}


async function savePartner(
  event
) {
  event.preventDefault();


  const id =
    $("#partnerId")
      .value;


  const name =
    $("#partnerName")
      .value
      .trim();


  if (!name) {
    showToast(
      "Organization name wajib.",
      "error"
    );

    return;
  }


  const payload = {
    name,

    partner_type:
      $("#partnerType")
        .value,

    industry:
      nullableText(
        $("#partnerIndustry")
          .value
      ),

    instagram:
      nullableText(
        $("#partnerInstagram")
          .value
      ),

    website:
      nullableText(
        $("#partnerWebsite")
          .value
      ),

    notes:
      nullableText(
        $("#partnerNotes")
          .value
      )
  };


  try {
    let result;


    if (id) {
      result =
        await supabase
          .from(
            "organizations"
          )
          .update(payload)
          .eq(
            "id",
            id
          );

    } else {
      payload.created_by =
        state.user.id;


      result =
        await supabase
          .from(
            "organizations"
          )
          .insert(payload);
    }


    if (result.error) {
      throw result.error;
    }


    $("#partnerForm")
      .reset();


    $("#partnerId")
      .value = "";


    closeModal(
      "partnerModal"
    );


    await loadOrganizations();


    renderPartners();


    showToast(
      id
        ? "Partner updated."
        : "Partner added."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   21. CONTACTS
============================================================ */

async function loadContactsForOrganization(
  organizationId
) {
  state.contacts = [];


  const select =
    $("#opportunityContact");


  if (!organizationId) {
    if (select) {
      select.innerHTML = `
        <option value="">
          No contact selected
        </option>
      `;
    }

    return;
  }


  try {
    const {
      data,
      error
    } =
      await supabase
        .from("contacts")
        .select("*")
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "is_primary",
          {
            ascending: false
          }
        )
        .order(
          "name"
        );


    if (error) {
      throw error;
    }


    state.contacts =
      data || [];


    if (!select) {
      return;
    }


    select.innerHTML = `
      <option value="">
        No contact selected
      </option>

      ${
        state.contacts
          .map(
            (contact) => `
              <option value="${contact.id}">
                ${escapeHTML(
                  contact.name
                )}

                ${
                  contact.position
                    ? ` — ${escapeHTML(
                        contact.position
                      )}`
                    : ""
                }
              </option>
            `
          )
          .join("")
      }
    `;

  } catch (error) {
    console.error(error);
  }
}


/* ============================================================
   22. LOAD CAMPAIGN DATA
============================================================ */

async function loadCampaignData() {
  if (
    !state.selectedCampaignId
  ) {
    clearCampaignData();

    renderAll();

    return;
  }


  await Promise.all([
    loadOpportunities(),
    loadOpportunityOverview(),
    loadTargets(),
    loadTargetProgress(),
    loadPipeline(),
    loadMediaPartners(),
    loadPartnershipValues()
  ]);


  await Promise.all([
    loadTasks(),
    loadActivities()
  ]);


  populateCampaignDependentSelects();
}


function clearCampaignData() {
  state.opportunities = [];

  state.opportunityOverview =
    [];

  state.tasks = [];

  state.targets = [];

  state.targetProgress = [];

  state.pipeline = [];

  state.mediaPartners = [];

  state.mediaPublications =
    [];

  state.activities = [];

  state.partnershipValues =
    null;
}


/* ============================================================
   23. OPPORTUNITIES
============================================================ */

async function loadOpportunities() {
  const {
    data,
    error
  } =
    await supabase
      .from("opportunities")
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      )
      .eq(
        "is_archived",
        false
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  state.opportunities =
    data || [];
}


async function loadOpportunityOverview() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "opportunity_overview"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  state.opportunityOverview =
    data || [];
}


async function saveOpportunity(
  event
) {
  event.preventDefault();


  const id =
    $("#opportunityId")
      .value;


  const campaignId =
    Number(
      $("#opportunityCampaign")
        .value
    );


  const organizationId =
    Number(
      $("#opportunityOrganization")
        .value
    );


  if (
    !campaignId ||
    !organizationId
  ) {
    showToast(
      "Campaign dan organization wajib dipilih.",
      "error"
    );

    return;
  }


  const payload = {
    campaign_id:
      campaignId,

    organization_id:
      organizationId,

    assigned_to:
      nullableText(
        $("#opportunityOwner")
          .value
      ),

    primary_contact_id:
      nullableNumber(
        $("#opportunityContact")
          .value
      ),

    status:
      $("#opportunityStatus")
        .value,

    priority:
      $("#opportunityPriority")
        .value,

    potential_cash_value:
      parseNumber(
        $("#potentialCash")
          .value
      ),

    potential_in_kind_value:
      parseNumber(
        $("#potentialInKind")
          .value
      ),

    next_action:
      nullableText(
        $("#opportunityNextAction")
          .value
      ),

    next_action_due_at:
      toISODateTime(
        $("#opportunityDueDate")
          .value
      ),

    notes:
      nullableText(
        $("#opportunityNotes")
          .value
      )
  };


  try {
    let result;


    if (id) {
      result =
        await supabase
          .from(
            "opportunities"
          )
          .update(payload)
          .eq(
            "id",
            id
          );

    } else {
      payload.created_by =
        state.user.id;


      result =
        await supabase
          .from(
            "opportunities"
          )
          .insert(payload);
    }


    if (result.error) {
      throw result.error;
    }


    $("#opportunityForm")
      .reset();


    $("#opportunityId")
      .value = "";


    closeModal(
      "opportunityModal"
    );


    await loadCampaignData();

    renderAll();


    showToast(
      id
        ? "Opportunity updated."
        : "Opportunity created."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


async function editOpportunity(
  id
) {
  const opportunity =
    state.opportunities.find(
      (item) =>
        Number(item.id) ===
        Number(id)
    );


  if (!opportunity) {
    return;
  }


  $("#opportunityId")
    .value =
    opportunity.id;


  $("#opportunityCampaign")
    .value =
    opportunity.campaign_id;


  $("#opportunityOrganization")
    .value =
    opportunity.organization_id;


  await loadContactsForOrganization(
    opportunity.organization_id
  );


  $("#opportunityContact")
    .value =
    opportunity.primary_contact_id ||
    "";


  $("#opportunityOwner")
    .value =
    opportunity.assigned_to ||
    "";


  $("#opportunityStatus")
    .value =
    opportunity.status;


  $("#opportunityPriority")
    .value =
    opportunity.priority;


  $("#potentialCash")
    .value =
    opportunity
      .potential_cash_value ||
    0;


  $("#potentialInKind")
    .value =
    opportunity
      .potential_in_kind_value ||
    0;


  $("#opportunityNextAction")
    .value =
    opportunity.next_action ||
    "";


  $("#opportunityNotes")
    .value =
    opportunity.notes ||
    "";


  if (
    opportunity.next_action_due_at
  ) {
    $("#opportunityDueDate")
      .value =
      localDateTimeInputValue(
        new Date(
          opportunity.next_action_due_at
        )
      );

  } else {
    $("#opportunityDueDate")
      .value = "";
  }


  openModal(
    "opportunityModal"
  );
}


async function updateOpportunityStatus(
  opportunityId,
  status
) {
  try {
    const {
      error
    } =
      await supabase
        .from(
          "opportunities"
        )
        .update({
          status
        })
        .eq(
          "id",
          opportunityId
        );


    if (error) {
      throw error;
    }


    await loadCampaignData();

    renderAll();


    showToast(
      `Status → ${titleize(
        status
      )}`
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   24. NEGOTIATION
============================================================ */

function openNegotiation(
  opportunityId
) {
  $("#negotiationForm")
    .reset();


  $("#negotiationOpportunityId")
    .value =
    opportunityId;


  $("#negotiationCash")
    .value = 0;


  $("#negotiationInKind")
    .value = 0;


  openModal(
    "negotiationModal"
  );
}


async function saveNegotiation(
  event
) {
  event.preventDefault();


  const opportunityId =
    Number(
      $("#negotiationOpportunityId")
        .value
    );


  if (!opportunityId) {
    return;
  }


  try {
    const {
      data:
        revisions,

      error:
        revisionError
    } =
      await supabase
        .from(
          "negotiation_revisions"
        )
        .select(
          "revision_number"
        )
        .eq(
          "opportunity_id",
          opportunityId
        )
        .order(
          "revision_number",
          {
            ascending: false
          }
        )
        .limit(1);


    if (revisionError) {
      throw revisionError;
    }


    const revisionNumber =
      revisions?.length
        ? Number(
            revisions[0]
              .revision_number
          ) + 1
        : 1;


    const cashOffer =
      parseNumber(
        $("#negotiationCash")
          .value
      );


    const inKind =
      parseNumber(
        $("#negotiationInKind")
          .value
      );


    const isFinal =
      $("#negotiationFinal")
        .checked;


    const payload = {
      opportunity_id:
        opportunityId,

      revision_number:
        revisionNumber,

      cash_offer:
        cashOffer,

      estimated_in_kind_value:
        inKind,

      partner_offer:
        nullableText(
          $("#partnerOffer")
            .value
        ),

      hmm_offer:
        nullableText(
          $("#hmmOffer")
            .value
        ),

      negotiation_summary:
        nullableText(
          $("#negotiationSummary")
            .value
        ),

      is_final:
        isFinal,

      created_by:
        state.user.id
    };


    const {
      error
    } =
      await supabase
        .from(
          "negotiation_revisions"
        )
        .insert(payload);


    if (error) {
      throw error;
    }


    const opportunity =
      state.opportunities.find(
        (item) =>
          Number(item.id) ===
          opportunityId
      );


    let newStatus =
      opportunity?.status;


    if (isFinal) {
      newStatus =
        "confirmed";

    } else if (
      [
        "prospect",
        "contacted",
        "proposal_sent",
        "follow_up"
      ].includes(
        opportunity?.status
      )
    ) {
      newStatus =
        "negotiation";
    }


    const {
      error:
        opportunityError
    } =
      await supabase
        .from(
          "opportunities"
        )
        .update({
          status:
            newStatus,

          potential_cash_value:
            cashOffer,

          potential_in_kind_value:
            inKind
        })
        .eq(
          "id",
          opportunityId
        );


    if (
      opportunityError
    ) {
      throw opportunityError;
    }


    $("#negotiationForm")
      .reset();


    closeModal(
      "negotiationModal"
    );


    await loadCampaignData();

    renderAll();


    showToast(
      `Negotiation revision #${revisionNumber} saved.`
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   25. SUPPORT COMMITMENT
============================================================ */

function openCommitment(
  opportunityId
) {
  $("#commitmentForm")
    .reset();


  $("#commitmentOpportunityId")
    .value =
    opportunityId;


  $("#committedCash")
    .value = 0;


  $("#receivedCash")
    .value = 0;


  $("#estimatedValue")
    .value = 0;


  $("#quantityReceived")
    .value = 0;


  populateCampaignDependentSelects();


  openModal(
    "commitmentModal"
  );
}


async function saveCommitment(
  event
) {
  event.preventDefault();


  const committedCash =
    parseNumber(
      $("#committedCash")
        .value
    );


  const receivedCash =
    parseNumber(
      $("#receivedCash")
        .value
    );


  const quantityCommitted =
    nullableNumber(
      $("#quantityCommitted")
        .value
    );


  const quantityReceived =
    parseNumber(
      $("#quantityReceived")
        .value
    );


  if (
    receivedCash >
    committedCash
  ) {
    showToast(
      "Received cash tidak boleh lebih besar dari committed cash.",
      "error"
    );

    return;
  }


  if (
    quantityCommitted !==
      null &&
    quantityReceived >
      quantityCommitted
  ) {
    showToast(
      "Quantity received tidak boleh lebih besar dari committed.",
      "error"
    );

    return;
  }


  const payload = {
    opportunity_id:
      Number(
        $("#commitmentOpportunityId")
          .value
      ),

    campaign_target_id:
      nullableNumber(
        $("#commitmentTarget")
          .value
      ),

    support_type:
      $("#commitmentType")
        .value,

    item_name:
      nullableText(
        $("#commitmentItem")
          .value
      ),

    committed_cash_value:
      committedCash,

    received_cash_value:
      receivedCash,

    estimated_value:
      parseNumber(
        $("#estimatedValue")
          .value
      ),

    quantity_committed:
      quantityCommitted,

    quantity_received:
      quantityReceived,

    unit:
      nullableText(
        $("#commitmentUnit")
          .value
      ),

    valuation_basis:
      nullableText(
        $("#valuationBasis")
          .value
      ),

    status:
      $("#commitmentStatus")
        .value,

    expected_delivery_date:
      nullableDate(
        $("#commitmentDeliveryDate")
          .value
      ),

    notes:
      nullableText(
        $("#commitmentNotes")
          .value
      ),

    created_by:
      state.user.id
  };


  try {
    const {
      error
    } =
      await supabase
        .from(
          "support_commitments"
        )
        .insert(payload);


    if (error) {
      throw error;
    }


    $("#commitmentForm")
      .reset();


    closeModal(
      "commitmentModal"
    );


    await loadCampaignData();

    renderAll();


    showToast(
      "Partner support saved."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   26. TASKS
============================================================ */

async function loadTasks() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "active_task_overview"
      )
      .select("*")
      .eq(
        "assigned_to",
        state.user.id
      )
      .order(
        "due_at",
        {
          ascending: true,
          nullsFirst: false
        }
      );


  if (error) {
    throw error;
  }


  const opportunityIds =
    new Set(
      state.opportunities.map(
        (item) =>
          Number(item.id)
      )
    );


  state.tasks =
    (data || []).filter(
      (task) =>
        !task.opportunity_id ||
        opportunityIds.has(
          Number(
            task.opportunity_id
          )
        )
    );
}


async function createTask(
  event
) {
  event.preventDefault();


  const title =
    $("#taskTitle")
      .value
      .trim();


  if (!title) {
    showToast(
      "Task title wajib.",
      "error"
    );

    return;
  }


  const payload = {
    opportunity_id:
      nullableNumber(
        $("#taskOpportunity")
          .value
      ),

    assigned_to:
      $("#taskAssignedTo")
        .value,

    title,

    description:
      nullableText(
        $("#taskDescription")
          .value
      ),

    priority:
      $("#taskPriority")
        .value,

    status:
      "todo",

    due_at:
      toISODateTime(
        $("#taskDueAt")
          .value
      ),

    created_by:
      state.user.id
  };


  try {
    const {
      error
    } =
      await supabase
        .from("tasks")
        .insert(payload);


    if (error) {
      throw error;
    }


    $("#taskForm")
      .reset();


    closeModal(
      "taskModal"
    );


    await loadTasks();


    renderTasks();

    renderOverview();


    showToast(
      "Task created."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


async function completeTask(
  taskId
) {
  try {
    const {
      error
    } =
      await supabase
        .from("tasks")
        .update({
          status:
            "done",

          completed_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          taskId
        );


    if (error) {
      throw error;
    }


    await loadTasks();


    renderTasks();

    renderOverview();


    showToast(
      "Task completed."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   27. TARGETS
============================================================ */

async function loadTargets() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "campaign_targets"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      )
      .order(
        "sort_order"
      );


  if (error) {
    throw error;
  }


  state.targets =
    data || [];
}


async function loadTargetProgress() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "campaign_target_progress"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      );


  if (error) {
    throw error;
  }


  state.targetProgress =
    data || [];
}


async function saveTarget(
  event
) {
  event.preventDefault();


  if (!isAdmin()) {
    showToast(
      "Admin only.",
      "error"
    );

    return;
  }


  if (
    !state.selectedCampaignId
  ) {
    showToast(
      "Pilih campaign dulu.",
      "error"
    );

    return;
  }


  const targetName =
    $("#targetName")
      .value
      .trim();


  if (!targetName) {
    showToast(
      "Target name wajib.",
      "error"
    );

    return;
  }


  const payload = {
    campaign_id:
      state.selectedCampaignId,

    target_name:
      targetName,

    target_type:
      $("#targetType")
        .value,

    target_value:
      nullableNumber(
        $("#targetValue")
          .value
      ),

    target_quantity:
      nullableNumber(
        $("#targetQuantity")
          .value
      ),

    unit:
      nullableText(
        $("#targetUnit")
          .value
      ),

    description:
      nullableText(
        $("#targetDescription")
          .value
      ),

    created_by:
      state.user.id
  };


  try {
    const {
      error
    } =
      await supabase
        .from(
          "campaign_targets"
        )
        .insert(payload);


    if (error) {
      throw error;
    }


    $("#targetForm")
      .reset();


    closeModal(
      "targetModal"
    );


    await Promise.all([
      loadTargets(),
      loadTargetProgress()
    ]);


    populateCampaignDependentSelects();

    renderTargets();

    renderOverview();


    showToast(
      "Target created."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   28. PIPELINE SUMMARY
============================================================ */

async function loadPipeline() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "pipeline_summary"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      );


  if (error) {
    throw error;
  }


  state.pipeline =
    data || [];
}


/* ============================================================
   29. PARTNERSHIP VALUES
============================================================ */

async function loadPartnershipValues() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "partnership_value_summary"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  state.partnershipValues =
    data || null;
}


/* ============================================================
   30. MEDIA PARTNER
============================================================ */

async function loadMediaPartners() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "media_partner_progress"
      )
      .select("*")
      .eq(
        "campaign_id",
        state.selectedCampaignId
      );


  if (error) {
    throw error;
  }


  state.mediaPartners =
    data || [];
}


async function saveMediaPublication(
  event
) {
  event.preventDefault();


  const opportunityId =
    Number(
      $("#mediaOpportunity")
        .value
    );


  const title =
    $("#mediaTitle")
      .value
      .trim();


  if (
    !opportunityId ||
    !title
  ) {
    showToast(
      "Media partner dan publication wajib.",
      "error"
    );

    return;
  }


  const proofUrl =
    nullableText(
      $("#mediaProofUrl")
        .value
    );


  const payload = {
    opportunity_id:
      opportunityId,

    platform:
      $("#mediaPlatform")
        .value,

    content_type:
      $("#mediaContentType")
        .value,

    title,

    scheduled_at:
      toISODateTime(
        $("#mediaScheduledAt")
          .value
      ),

    proof_url:
      proofUrl,

    status:
      proofUrl
        ? "published"
        : "scheduled",

    published_at:
      proofUrl
        ? new Date()
            .toISOString()
        : null,

    created_by:
      state.user.id
  };


  try {
    const {
      error
    } =
      await supabase
        .from(
          "media_publications"
        )
        .insert(payload);


    if (error) {
      throw error;
    }


    $("#mediaPublicationForm")
      .reset();


    closeModal(
      "mediaPublicationModal"
    );


    await loadMediaPartners();


    renderMediaPartners();


    showToast(
      "Publication saved."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   31. ACTIVITIES
============================================================ */

async function loadActivities() {
  const opportunityIds =
    state.opportunities.map(
      (item) =>
        item.id
    );


  if (
    !opportunityIds.length
  ) {
    state.activities = [];

    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        "activity_logs"
      )
      .select(`
        id,
        opportunity_id,
        user_id,
        activity_type,
        title,
        description,
        metadata,
        created_at
      `)
      .in(
        "opportunity_id",
        opportunityIds
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(20);


  if (error) {
    throw error;
  }


  state.activities =
    data || [];
}


/* ============================================================
   32. NOTIFICATIONS
============================================================ */

async function loadNotifications() {
  const {
    data,
    error
  } =
    await supabase
      .from(
        "notifications"
      )
      .select("*")
      .eq(
        "user_id",
        state.user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


  if (error) {
    throw error;
  }


  state.notifications =
    data || [];


  renderNotifications();
}


async function markAllNotificationsRead() {
  try {
    const {
      error
    } =
      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read:
            true,

          read_at:
            new Date()
              .toISOString()
        })
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "is_read",
          false
        );


    if (error) {
      throw error;
    }


    await loadNotifications();


    showToast(
      "Notifications marked as read."
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


function renderNotifications() {
  const list =
    $("#notificationList");

  const badge =
    $("#notificationBadge");


  if (!list) {
    return;
  }


  const unread =
    state.notifications.filter(
      (notification) =>
        !notification.is_read
    );


  if (
    unread.length &&
    badge
  ) {
    badge.textContent =
      unread.length;

    show(badge);

  } else {
    hide(badge);
  }


  if (
    !state.notifications.length
  ) {
    list.innerHTML = `
      <div class="empty-state">
        No notifications.
      </div>
    `;

    return;
  }


  list.innerHTML =
    state.notifications
      .map(
        (notification) => `
          <article
            class="notification-item ${
              notification.is_read
                ? ""
                : "unread"
            }"
          >
            <span class="notification-type">
              ${escapeHTML(
                titleize(
                  notification.type
                )
              )}
            </span>

            <strong>
              ${escapeHTML(
                notification.title
              )}
            </strong>

            <p>
              ${escapeHTML(
                notification.message ||
                  ""
              )}
            </p>

            <time>
              ${formatDateTime(
                notification.created_at
              )}
            </time>
          </article>
        `
      )
      .join("");
}


/* ============================================================
   33. DEPENDENT SELECTS
============================================================ */

function populateCampaignDependentSelects() {
  const campaignOptions =
    state.campaigns
      .map(
        (campaign) => `
          <option value="${campaign.id}">
            ${escapeHTML(
              campaign.name
            )}
          </option>
        `
      )
      .join("");


  if (
    $("#opportunityCampaign")
  ) {
    $("#opportunityCampaign")
      .innerHTML =
      campaignOptions;


    if (
      state.selectedCampaignId
    ) {
      $("#opportunityCampaign")
        .value =
        String(
          state.selectedCampaignId
        );
    }
  }


  const opportunityOptions =
    state.opportunityOverview
      .map(
        (item) => `
          <option value="${item.opportunity_id}">
            ${escapeHTML(
              item.organization_name
            )}
          </option>
        `
      )
      .join("");


  if (
    $("#taskOpportunity")
  ) {
    $("#taskOpportunity")
      .innerHTML = `
        <option value="">
          General Task
        </option>

        ${opportunityOptions}
      `;
  }


  const mediaOptions =
    state.opportunityOverview
      .filter(
        (item) =>
          item.partner_type ===
          "media_partner"
      )
      .map(
        (item) => `
          <option value="${item.opportunity_id}">
            ${escapeHTML(
              item.organization_name
            )}
          </option>
        `
      )
      .join("");


  if (
    $("#mediaOpportunity")
  ) {
    $("#mediaOpportunity")
      .innerHTML =
      mediaOptions ||
      `
        <option value="">
          No media partner
        </option>
      `;
  }


  if (
    $("#commitmentTarget")
  ) {
    $("#commitmentTarget")
      .innerHTML = `
        <option value="">
          No specific target
        </option>

        ${
          state.targets
            .map(
              (target) => `
                <option value="${target.id}">
                  ${escapeHTML(
                    target.target_name
                  )}
                </option>
              `
            )
            .join("")
        }
      `;
  }
}


/* ============================================================
   34. NAVIGATION
============================================================ */

const pageMeta = {
  overview: {
    title:
      "Overview",

    eyebrow:
      "WORKSPACE"
  },

  tasks: {
    title:
      "My Tasks",

    eyebrow:
      "ACTION CENTER"
  },

  partners: {
    title:
      "Partners",

    eyebrow:
      "PARTNERSHIP CRM"
  },

  pipeline: {
    title:
      "Pipeline",

    eyebrow:
      "ACQUISITION"
  },

  media: {
    title:
      "Media Partners",

    eyebrow:
      "PUBLICATION"
  },

  targets: {
    title:
      "Targets & Needs",

    eyebrow:
      "CAMPAIGN"
  },

  team: {
    title:
      "Team",

    eyebrow:
      "OPERATIONS"
  },

  reports: {
    title:
      "Reports",

    eyebrow:
      "REPORTING"
  },

  campaigns: {
    title:
      "Campaigns",

    eyebrow:
      "ADMIN"
  },

  "admin-users": {
    title:
      "Users",

    eyebrow:
      "ADMIN"
  }
};


function navigateTo(page) {
  if (
    [
      "campaigns",
      "admin-users"
    ].includes(page) &&
    !isAdmin()
  ) {
    page =
      "overview";
  }


  state.currentPage =
    page;


  $$(".page-section")
    .forEach(
      (section) => {
        section.classList.toggle(
          "active",
          section.dataset
            .pageSection ===
            page
        );
      }
    );


  $$(".nav-item")
    .forEach(
      (item) => {
        item.classList.toggle(
          "active",
          item.dataset.page ===
            page
        );
      }
    );


  const meta =
    pageMeta[page] ||
    pageMeta.overview;


  $("#pageTitle")
    .textContent =
    meta.title;


  $("#pageEyebrow")
    .textContent =
    meta.eyebrow;


  document.title =
    `${meta.title} · HMM Partnership`;


  $("#sidebar")
    ?.classList
    .remove("open");


  renderPage(page);
}


function renderPage(page) {
  switch (page) {
    case "overview":
      renderOverview();
      break;

    case "tasks":
      renderTasks();
      break;

    case "partners":
      renderPartners();
      break;

    case "pipeline":
      renderPipeline();
      break;

    case "media":
      renderMediaPartners();
      break;

    case "targets":
      renderTargets();
      break;

    case "team":
      renderTeam();
      break;

    case "campaigns":
      renderCampaigns();
      break;

    case "admin-users":
      renderUsers();
      break;
  }
}


/* ============================================================
   35. RENDER ALL
============================================================ */

function renderAll() {
  renderOverview();

  renderTasks();

  renderPartners();

  renderPipeline();

  renderMediaPartners();

  renderTargets();

  renderTeam();

  renderCampaigns();

  renderUsers();

  renderNotifications();
}


/* ============================================================
   36. OVERVIEW
============================================================ */

function renderOverview() {
  const hour =
    new Date()
      .getHours();


  let greeting;


  if (hour < 11) {
    greeting =
      "Good morning.";

  } else if (
    hour < 15
  ) {
    greeting =
      "Good afternoon.";

  } else if (
    hour < 19
  ) {
    greeting =
      "Good evening.";

  } else {
    greeting =
      "Good night.";
  }


  if (
    $("#overviewGreeting")
  ) {
    $("#overviewGreeting")
      .textContent =
      greeting;
  }


  const values =
    state.partnershipValues;


  $("#metricCashSecured")
    .textContent =
    formatMoney(
      values?.cash_received ||
        0
    );


  $("#metricInKind")
    .textContent =
    formatMoney(
      values
        ?.estimated_in_kind_received_value ||
        0
    );


  const activePartners =
    state.opportunityOverview
      .filter(
        (item) =>
          ![
            "completed",
            "lost",
            "rejected"
          ].includes(
            item.status
          )
      )
      .length;


  $("#metricActivePartners")
    .textContent =
    activePartners;


  const mediaCount =
    state.opportunityOverview
      .filter(
        (item) =>
          item.partner_type ===
            "media_partner" &&
          [
            "confirmed",
            "fulfillment",
            "completed"
          ].includes(
            item.status
          )
      )
      .length;


  $("#metricMediaPartners")
    .textContent =
    mediaCount;


  const todayTasks =
    state.tasks.filter(
      (task) =>
        task.deadline_state ===
        "today"
    );


  $("#metricTodayTasks")
    .textContent =
    todayTasks.length;


  const attention =
    state.opportunityOverview
      .filter(
        (item) =>
          [
            "at_risk",
            "needs_attention"
          ].includes(
            item.health_status
          )
      );


  $("#metricAtRisk")
    .textContent =
    attention.length;


  renderTodayTasks(
    todayTasks
  );


  renderAttention(
    attention
  );


  renderPipelineSnapshot();


  renderTargetProgressOverview();


  renderRecentActivities();


  const badge =
    $("#sidebarTaskBadge");


  if (
    state.tasks.length
  ) {
    badge.textContent =
      state.tasks.length;

    show(badge);

  } else {
    hide(badge);
  }
}


/* ============================================================
   37. TODAY TASKS
============================================================ */

function renderTodayTasks(
  tasks
) {
  const container =
    $("#todayTasksList");


  if (!container) {
    return;
  }


  if (!tasks.length) {
    container.innerHTML = `
      <div class="empty-state">
        No tasks due today.
      </div>
    `;

    return;
  }


  container.innerHTML =
    tasks
      .slice(0, 6)
      .map(
        (task) => `
          <article class="task-row">
            <div>
              <strong>
                ${escapeHTML(
                  task.title
                )}
              </strong>

              <span>
                ${escapeHTML(
                  task.organization_name ||
                    "General"
                )}
              </span>
            </div>

            <div>
              <time>
                ${formatDateTime(
                  task.due_at
                )}
              </time>

              <button
                type="button"
                class="text-button"
                data-complete-task="${task.task_id}"
              >
                Done
              </button>
            </div>
          </article>
        `
      )
      .join("");
}


/* ============================================================
   38. ATTENTION
============================================================ */

function renderAttention(
  items
) {
  const container =
    $("#attentionList");


  if (!container) {
    return;
  }


  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        No partnership issues detected.
      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .slice(0, 6)
      .map(
        (item) => `
          <button
            type="button"
            class="attention-item"
            data-edit-opportunity="${item.opportunity_id}"
          >
            <strong>
              ${escapeHTML(
                item.organization_name
              )}
            </strong>

            <span>
              ${escapeHTML(
                titleize(
                  item.health_status
                )
              )}
            </span>

            <small>
              ${
                item.next_action
                  ? escapeHTML(
                      item.next_action
                    )
                  : "No next action"
              }
            </small>
          </button>
        `
      )
      .join("");
}


/* ============================================================
   39. PIPELINE SNAPSHOT
============================================================ */

function pipelineCount(
  status
) {
  const item =
    state.pipeline.find(
      (entry) =>
        entry.status ===
        status
    );


  return Number(
    item?.total_opportunities ||
    0
  );
}


function renderPipelineSnapshot() {
  $("#pipelineProspectCount")
    .textContent =
    pipelineCount(
      "prospect"
    );


  $("#pipelineContactedCount")
    .textContent =
    pipelineCount(
      "contacted"
    ) +
    pipelineCount(
      "follow_up"
    );


  $("#pipelineProposalCount")
    .textContent =
    pipelineCount(
      "proposal_sent"
    );


  $("#pipelineNegotiationCount")
    .textContent =
    pipelineCount(
      "negotiation"
    );


  $("#pipelineConfirmedCount")
    .textContent =
    pipelineCount(
      "confirmed"
    ) +
    pipelineCount(
      "fulfillment"
    );


  $("#pipelineCompletedCount")
    .textContent =
    pipelineCount(
      "completed"
    );
}


/* ============================================================
   40. TARGET PROGRESS
============================================================ */

function targetProgressValues(
  target
) {
  const targetValue =
    Number(
      target.target_value ||
      0
    );


  const targetQuantity =
    Number(
      target.target_quantity ||
      0
    );


  const currentValue =
    Number(
      target.current_value ||
      0
    );


  const currentQuantity =
    Number(
      target.current_quantity ||
      0
    );


  if (
    targetValue > 0
  ) {
    return {
      percentage:
        Math.min(
          100,
          targetValue
            ? (
                currentValue /
                targetValue
              ) *
              100
            : 0
        ),

      formattedTarget:
        formatMoney(
          targetValue
        ),

      formattedCurrent:
        formatMoney(
          currentValue
        )
    };
  }


  return {
    percentage:
      Math.min(
        100,
        targetQuantity
          ? (
              currentQuantity /
              targetQuantity
            ) *
            100
          : 0
      ),

    formattedTarget:
      `${formatNumber(
        targetQuantity
      )} ${
        target.unit ||
        ""
      }`,

    formattedCurrent:
      `${formatNumber(
        currentQuantity
      )} ${
        target.unit ||
        ""
      }`
  };
}


function targetProgressHTML(
  target
) {
  const values =
    targetProgressValues(
      target
    );


  return `
    <article class="target-progress">
      <div class="target-progress-header">
        <strong>
          ${escapeHTML(
            target.target_name
          )}
        </strong>

        <span>
          ${Math.round(
            values.percentage
          )}%
        </span>
      </div>

      <div class="progress-track">
        <div
          class="progress-fill"
          style="width:${values.percentage}%"
        ></div>
      </div>

      <small>
        ${escapeHTML(
          values.formattedCurrent
        )}
        /
        ${escapeHTML(
          values.formattedTarget
        )}
      </small>
    </article>
  `;
}


function renderTargetProgressOverview() {
  const container =
    $("#targetProgressList");


  if (!container) {
    return;
  }


  if (
    !state.targetProgress.length
  ) {
    container.innerHTML = `
      <div class="empty-state">
        No campaign target available.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.targetProgress
      .slice(0, 5)
      .map(
        targetProgressHTML
      )
      .join("");
}


/* ============================================================
   41. ACTIVITY
============================================================ */

function renderRecentActivities() {
  const container =
    $("#recentActivityList");


  if (!container) {
    return;
  }


  if (
    !state.activities.length
  ) {
    container.innerHTML = `
      <div class="empty-state">
        No recent activity.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.activities
      .slice(0, 10)
      .map(
        (activity) => {
          const profile =
            state.profiles.find(
              (profile) =>
                profile.id ===
                activity.user_id
            );


          return `
            <article class="activity-item">
              <strong>
                ${escapeHTML(
                  activity.title ||
                    titleize(
                      activity.activity_type
                    )
                )}
              </strong>

              <p>
                ${escapeHTML(
                  activity.description ||
                    ""
                )}
              </p>

              <small>
                ${
                  profile
                    ? escapeHTML(
                        profile.full_name
                      )
                    : "System"
                }
                ·
                ${formatDateTime(
                  activity.created_at
                )}
              </small>
            </article>
          `;
        }
      )
      .join("");
}


/* ============================================================
   42. PARTNERS TABLE
============================================================ */

function filteredPartners() {
  const query =
    $("#partnerSearchInput")
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    "";


  const type =
    $("#partnerTypeFilter")
      ?.value ||
    "all";


  const status =
    $("#partnerStatusFilter")
      ?.value ||
    "all";


  return state
    .opportunityOverview
    .filter(
      (item) => {
        const matchQuery =
          !query ||
          String(
            item.organization_name
          )
            .toLowerCase()
            .includes(query);


        const matchType =
          type === "all" ||
          item.partner_type ===
            type;


        const matchStatus =
          status === "all" ||
          item.status ===
            status;


        return (
          matchQuery &&
          matchType &&
          matchStatus
        );
      }
    );
}


function renderPartners() {
  const body =
    $("#partnerTableBody");


  if (!body) {
    return;
  }


  const partners =
    filteredPartners();


  if (
    !partners.length
  ) {
    body.innerHTML = `
      <tr class="empty-row">
        <td colspan="9">
          No partners available.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    partners
      .map(
        (item) => `
          <tr>
            <td>
              <strong>
                ${escapeHTML(
                  item.organization_name
                )}
              </strong>

              ${
                item.industry
                  ? `
                    <small>
                      ${escapeHTML(
                        item.industry
                      )}
                    </small>
                  `
                  : ""
              }
            </td>

            <td>
              ${escapeHTML(
                titleize(
                  item.partner_type
                )
              )}
            </td>

            <td>
              <span
                class="status-badge status-${item.status}"
              >
                ${escapeHTML(
                  titleize(
                    item.status
                  )
                )}
              </span>
            </td>

            <td>
              ${escapeHTML(
                item.assigned_staff ||
                  "-"
              )}
            </td>

            <td>
              ${formatMoney(
                item.total_potential_value
              )}
            </td>

            <td>
              ${escapeHTML(
                item.next_action ||
                  "-"
              )}
            </td>

            <td>
              ${formatDateTime(
                item.next_action_due_at
              )}
            </td>

            <td>
              <span
                class="health-badge health-${item.health_status}"
              >
                ${escapeHTML(
                  titleize(
                    item.health_status
                  )
                )}
              </span>
            </td>

            <td>
              <div class="table-actions">
                <button
                  type="button"
                  data-edit-opportunity="${item.opportunity_id}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  data-negotiate="${item.opportunity_id}"
                >
                  Nego
                </button>

                <button
                  type="button"
                  data-commitment="${item.opportunity_id}"
                >
                  Support
                </button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
}


/* ============================================================
   43. TASKS RENDER
============================================================ */

function renderTasks() {
  const container =
    $("#tasksContainer");


  if (!container) {
    return;
  }


  let tasks =
    [
      ...state.tasks
    ];


  const statusFilter =
    $("#taskStatusFilter")
      ?.value ||
    "active";


  const deadlineFilter =
    $("#taskDeadlineFilter")
      ?.value ||
    "all";


  const priorityFilter =
    $("#taskPriorityFilter")
      ?.value ||
    "all";


  if (
    statusFilter !==
      "all" &&
    statusFilter !==
      "active"
  ) {
    tasks =
      tasks.filter(
        (task) =>
          task.status ===
          statusFilter
      );
  }


  if (
    deadlineFilter !==
    "all"
  ) {
    tasks =
      tasks.filter(
        (task) =>
          task.deadline_state ===
          deadlineFilter
      );
  }


  if (
    priorityFilter !==
    "all"
  ) {
    tasks =
      tasks.filter(
        (task) =>
          task.priority ===
          priorityFilter
      );
  }


  if (!tasks.length) {
    container.innerHTML = `
      <div class="empty-state">
        No tasks found.
      </div>
    `;

    return;
  }


  container.innerHTML =
    tasks
      .map(
        (task) => `
          <article class="task-card">
            <div class="task-card-head">
              <span
                class="priority priority-${task.priority}"
              >
                ${escapeHTML(
                  titleize(
                    task.priority
                  )
                )}
              </span>

              <span
                class="deadline ${task.deadline_state}"
              >
                ${escapeHTML(
                  titleize(
                    task.deadline_state
                  )
                )}
              </span>
            </div>

            <h3>
              ${escapeHTML(
                task.title
              )}
            </h3>

            <p>
              ${escapeHTML(
                task.description ||
                  ""
              )}
            </p>

            <div class="task-card-meta">
              <span>
                ${escapeHTML(
                  task.organization_name ||
                    "General"
                )}
              </span>

              <span>
                ${formatDateTime(
                  task.due_at
                )}
              </span>
            </div>

            <button
              type="button"
              class="btn btn-secondary"
              data-complete-task="${task.task_id}"
            >
              Mark Done
            </button>
          </article>
        `
      )
      .join("");
}


/* ============================================================
   44. PIPELINE
============================================================ */

const visiblePipelineStatuses =
  [
    "prospect",
    "contacted",
    "proposal_sent",
    "follow_up",
    "negotiation",
    "confirmed",
    "fulfillment"
  ];


function renderPipeline() {
  visiblePipelineStatuses
    .forEach(
      (status) => {
        const column =
          document.getElementById(
            `pipeline-${status}`
          );


        const count =
          document.querySelector(
            `[data-pipeline-count="${status}"]`
          );


        const opportunities =
          state
            .opportunityOverview
            .filter(
              (item) =>
                item.status ===
                status
            );


        if (count) {
          count.textContent =
            opportunities.length;
        }


        if (!column) {
          return;
        }


        column.innerHTML =
          opportunities
            .map(
              (item) => `
                <article
                  class="pipeline-card"
                  draggable="true"
                  data-opportunity-id="${item.opportunity_id}"
                >
                  <strong>
                    ${escapeHTML(
                      item.organization_name
                    )}
                  </strong>

                  <span>
                    ${formatMoney(
                      item.total_potential_value
                    )}
                  </span>

                  <small>
                    ${
                      item.next_action
                        ? escapeHTML(
                            item.next_action
                          )
                        : "No next action"
                    }
                  </small>

                  <div class="pipeline-card-footer">
                    <span>
                      ${escapeHTML(
                        item.assigned_staff ||
                          "Unassigned"
                      )}
                    </span>

                    <button
                      type="button"
                      data-edit-opportunity="${item.opportunity_id}"
                    >
                      Open
                    </button>
                  </div>
                </article>
              `
            )
            .join("");
      }
    );


  setupPipelineDragDrop();
}


function setupPipelineDragDrop() {
  $$(".pipeline-card")
    .forEach(
      (card) => {
        card.addEventListener(
          "dragstart",
          (event) => {
            event.dataTransfer
              .setData(
                "text/plain",
                card.dataset
                  .opportunityId
              );
          }
        );
      }
    );


  $$(".pipeline-column")
    .forEach(
      (column) => {
        column.addEventListener(
          "dragover",
          (event) => {
            event.preventDefault();
          }
        );


        column.addEventListener(
          "drop",
          async (event) => {
            event.preventDefault();


            const opportunityId =
              event.dataTransfer
                .getData(
                  "text/plain"
                );


            const status =
              column.dataset.status;


            if (
              opportunityId &&
              status
            ) {
              await updateOpportunityStatus(
                Number(
                  opportunityId
                ),
                status
              );
            }
          }
        );
      }
    );
}


/* ============================================================
   45. TARGETS RENDER
============================================================ */

function renderTargets() {
  const container =
    $("#targetCardsContainer");


  if (!container) {
    return;
  }


  if (
    !state.targetProgress.length
  ) {
    container.innerHTML = `
      <div class="empty-state">
        No targets configured.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.targetProgress
      .map(
        (target) => `
          <article class="target-card">
            <span>
              ${escapeHTML(
                titleize(
                  target.target_type
                )
              )}
            </span>

            ${targetProgressHTML(
              target
            )}
          </article>
        `
      )
      .join("");
}


/* ============================================================
   46. MEDIA RENDER
============================================================ */

function renderMediaPartners() {
  const container =
    $("#mediaPartnerGrid");


  if (!container) {
    return;
  }


  if (
    !state.mediaPartners.length
  ) {
    container.innerHTML = `
      <div class="empty-state">
        No media partner data available.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.mediaPartners
      .map(
        (item) => {
          const total =
            Number(
              item.total_publications ||
              0
            );


          const published =
            Number(
              item.published_publications ||
              0
            );


          const percentage =
            total
              ? Math.round(
                  (
                    published /
                    total
                  ) *
                  100
                )
              : 0;


          return `
            <article class="media-card">
              <div>
                <span class="eyebrow">
                  MEDIA PARTNER
                </span>

                <h3>
                  ${escapeHTML(
                    item.media_partner
                  )}
                </h3>
              </div>

              <div class="media-metrics">
                <div>
                  <strong>
                    ${published}/${total}
                  </strong>

                  <span>
                    Published
                  </span>
                </div>

                <div>
                  <strong>
                    ${formatNumber(
                      item.total_reach
                    )}
                  </strong>

                  <span>
                    Reach
                  </span>
                </div>

                <div>
                  <strong>
                    ${formatNumber(
                      item.total_impressions
                    )}
                  </strong>

                  <span>
                    Impressions
                  </span>
                </div>
              </div>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  style="width:${percentage}%"
                ></div>
              </div>

              <small>
                ${percentage}% publication fulfillment
              </small>
            </article>
          `;
        }
      )
      .join("");
}


/* ============================================================
   47. TEAM
============================================================ */

async function renderTeam() {
  const container =
    $("#teamGrid");


  if (!container) {
    return;
  }


  try {
    const {
      data,
      error
    } =
      await supabase
        .from(
          "staff_workload"
        )
        .select("*")
        .order(
          "active_opportunities",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (!data?.length) {
      container.innerHTML = `
        <div class="empty-state">
          No team data available.
        </div>
      `;

      return;
    }


    container.innerHTML =
      data
        .map(
          (staff) => `
            <article class="team-card">
              <div class="team-person">
                <div class="user-avatar">
                  ${initials(
                    staff.full_name
                  )}
                </div>

                <div>
                  <strong>
                    ${escapeHTML(
                      staff.full_name
                    )}
                  </strong>

                  <span>
                    Sponsor Staff
                  </span>
                </div>
              </div>

              <div class="team-stat-grid">
                <div>
                  <strong>
                    ${staff.active_opportunities}
                  </strong>

                  <span>
                    Opportunities
                  </span>
                </div>

                <div>
                  <strong>
                    ${staff.active_tasks}
                  </strong>

                  <span>
                    Tasks
                  </span>
                </div>

                <div>
                  <strong>
                    ${staff.overdue_tasks}
                  </strong>

                  <span>
                    Overdue
                  </span>
                </div>
              </div>
            </article>
          `
        )
        .join("");

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        Unable to load team.
      </div>
    `;
  }
}


/* ============================================================
   48. CAMPAIGNS ADMIN
============================================================ */

function renderCampaigns() {
  const container =
    $("#campaignList");


  if (!container) {
    return;
  }


  if (
    !state.campaigns.length
  ) {
    container.innerHTML = `
      <div class="empty-state">
        No campaign available.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.campaigns
      .map(
        (campaign) => `
          <article class="campaign-card">
            <div>
              <span class="eyebrow">
                ${
                  campaign.is_active
                    ? "ACTIVE"
                    : "INACTIVE"
                }
              </span>

              <h3>
                ${escapeHTML(
                  campaign.name
                )}
              </h3>

              <p>
                ${escapeHTML(
                  campaign.description ||
                    ""
                )}
              </p>
            </div>

            <div>
              <span>
                ${formatDate(
                  campaign.start_date
                )}
                →
                ${formatDate(
                  campaign.end_date
                )}
              </span>
            </div>
          </article>
        `
      )
      .join("");
}


/* ============================================================
   49. USERS ADMIN
============================================================ */

function renderUsers() {
  const body =
    $("#userTableBody");


  if (!body) {
    return;
  }


  if (
    !state.profiles.length
  ) {
    body.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          No users available.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    state.profiles
      .map(
        (profile) => `
          <tr>
            <td>
              ${escapeHTML(
                profile.full_name
              )}
            </td>

            <td>
              ${escapeHTML(
                profile.email ||
                  "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                titleize(
                  profile.role
                )
              )}
            </td>

            <td>
              ${escapeHTML(
                titleize(
                  profile.status
                )
              )}
            </td>

            <td>
              ${formatDateTime(
                profile.last_active_at
              )}
            </td>

            <td>
              ${
                isAdmin() &&
                profile.id !==
                  state.user.id
                  ? `
                    <button
                      type="button"
                      class="text-button"
                      data-toggle-user="${profile.id}"
                      data-user-status="${profile.status}"
                    >
                      ${
                        profile.status ===
                        "active"
                          ? "Disable"
                          : "Activate"
                      }
                    </button>
                  `
                  : ""
              }
            </td>
          </tr>
        `
      )
      .join("");
}


async function toggleUserStatus(
  userId,
  currentStatus
) {
  if (!isAdmin()) {
    return;
  }


  const nextStatus =
    currentStatus ===
    "active"
      ? "disabled"
      : "active";


  try {
    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({
          status:
            nextStatus
        })
        .eq(
          "id",
          userId
        );


    if (error) {
      throw error;
    }


    await loadProfiles();


    renderUsers();

    renderTeam();


    showToast(
      `User ${nextStatus}.`
    );

  } catch (error) {
    showToast(
      humanizeError(error),
      "error"
    );
  }
}


/* ============================================================
   50. EXPORT CSV
============================================================ */

function escapeCSV(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  const text =
    String(value);


  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replaceAll(
      '"',
      '""'
    )}"`;
  }


  return text;
}


function downloadCSV(
  filename,
  rows
) {
  if (!rows.length) {
    showToast(
      "Tidak ada data untuk diexport.",
      "error"
    );

    return;
  }


  const headers =
    Object.keys(
      rows[0]
    );


  const lines = [
    headers
      .map(
        escapeCSV
      )
      .join(","),

    ...rows.map(
      (row) =>
        headers
          .map(
            (header) =>
              escapeCSV(
                row[header]
              )
          )
          .join(",")
    )
  ];


  const blob =
    new Blob(
      [
        "\uFEFF",
        lines.join("\n")
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );


  anchor.href =
    url;


  anchor.download =
    filename;


  document.body
    .appendChild(
      anchor
    );


  anchor.click();

  anchor.remove();


  URL.revokeObjectURL(
    url
  );
}


function exportOverview() {
  const campaign =
    state.campaigns.find(
      (item) =>
        Number(item.id) ===
        Number(
          state.selectedCampaignId
        )
    );


  const rows =
    state
      .opportunityOverview
      .map(
        (item) => ({
          Campaign:
            campaign?.name ||
            "",

          Organization:
            item.organization_name,

          Partner_Type:
            item.partner_type,

          Status:
            item.status,

          Priority:
            item.priority,

          PIC:
            item.assigned_staff,

          Potential_Cash:
            item.potential_cash_value,

          Potential_InKind:
            item.potential_in_kind_value,

          Total_Potential:
            item.total_potential_value,

          Next_Action:
            item.next_action,

          Due:
            item.next_action_due_at,

          Health:
            item.health_status,

          Last_Contact:
            item.last_contact_at
        })
      );


  downloadCSV(
    `HMM-Partnership-${
      campaign?.name ||
      "Overview"
    }.csv`,
    rows
  );
}


function exportMedia() {
  downloadCSV(
    "HMM-Media-Partners.csv",
    state.mediaPartners
  );
}


function exportActivities() {
  const rows =
    state.activities.map(
      (activity) => ({
        Date:
          activity.created_at,

        Type:
          activity.activity_type,

        Title:
          activity.title,

        Description:
          activity.description,

        User_ID:
          activity.user_id,

        Opportunity_ID:
          activity.opportunity_id
      })
    );


  downloadCSV(
    "HMM-Partnership-Activity.csv",
    rows
  );
}


/* ============================================================
   51. LOCAL DATETIME
============================================================ */

function localDateTimeInputValue(
  date
) {
  const pad =
    (value) =>
      String(value)
        .padStart(
          2,
          "0"
        );


  return (
    date.getFullYear() +
    "-" +
    pad(
      date.getMonth() + 1
    ) +
    "-" +
    pad(
      date.getDate()
    ) +
    "T" +
    pad(
      date.getHours()
    ) +
    ":" +
    pad(
      date.getMinutes()
    )
  );
}


/* ============================================================
   52. COMMAND PALETTE
============================================================ */

function openCommandPalette() {
  openModal(
    "commandPalette"
  );


  setTimeout(
    () => {
      $("#commandSearchInput")
        ?.focus();
    },
    50
  );
}


function closeCommandPalette() {
  closeModal(
    "commandPalette"
  );


  if (
    $("#commandSearchInput")
  ) {
    $("#commandSearchInput")
      .value = "";
  }
}


function filterCommands() {
  const query =
    $("#commandSearchInput")
      .value
      .trim()
      .toLowerCase();


  $$(".command-item")
    .forEach(
      (item) => {
        item.style.display =
          item.textContent
            .toLowerCase()
            .includes(query)
            ? ""
            : "none";
      }
    );
}


/* ============================================================
   53. GLOBAL CLICK HANDLER
============================================================ */

async function handleGlobalClick(
  event
) {
  const nav =
    event.target.closest(
      "[data-page]"
    );


  if (nav) {
    navigateTo(
      nav.dataset.page
    );

    return;
  }


  const completeTaskButton =
    event.target.closest(
      "[data-complete-task]"
    );


  if (
    completeTaskButton
  ) {
    await completeTask(
      completeTaskButton
        .dataset
        .completeTask
    );

    return;
  }


  const editButton =
    event.target.closest(
      "[data-edit-opportunity]"
    );


  if (editButton) {
    await editOpportunity(
      editButton
        .dataset
        .editOpportunity
    );

    return;
  }


  const negotiateButton =
    event.target.closest(
      "[data-negotiate]"
    );


  if (
    negotiateButton
  ) {
    openNegotiation(
      negotiateButton
        .dataset
        .negotiate
    );

    return;
  }


  const commitmentButton =
    event.target.closest(
      "[data-commitment]"
    );


  if (
    commitmentButton
  ) {
    openCommitment(
      commitmentButton
        .dataset
        .commitment
    );

    return;
  }


  const toggleUser =
    event.target.closest(
      "[data-toggle-user]"
    );


  if (toggleUser) {
    await toggleUserStatus(
      toggleUser
        .dataset
        .toggleUser,

      toggleUser
        .dataset
        .userStatus
    );

    return;
  }


  const closeButton =
    event.target.closest(
      "[data-close-modal]"
    );


  if (closeButton) {
    closeModal(
      closeButton
        .dataset
        .closeModal
    );

    return;
  }


  const command =
    event.target.closest(
      "[data-command-page]"
    );


  if (command) {
    closeCommandPalette();


    navigateTo(
      command
        .dataset
        .commandPage
    );
  }
}


/* ============================================================
   54. MODAL BUTTONS
============================================================ */

function bindModalButtons() {
  $("#quickAddButton")
    ?.addEventListener(
      "click",
      () => {
        openModal(
          "quickAddModal"
        );
      }
    );


  $("#addPartnerButton")
    ?.addEventListener(
      "click",
      () => {
        $("#partnerForm")
          .reset();

        $("#partnerId")
          .value = "";

        openModal(
          "partnerModal"
        );
      }
    );


  $("#quickAddPartner")
    ?.addEventListener(
      "click",
      () => {
        closeModal(
          "quickAddModal"
        );

        $("#addPartnerButton")
          ?.click();
      }
    );


  [
    "#pipelineAddOpportunityButton",
    "#quickAddOpportunity"
  ].forEach(
    (selector) => {
      $(selector)
        ?.addEventListener(
          "click",
          async () => {
            closeModal(
              "quickAddModal"
            );


            $("#opportunityForm")
              .reset();


            $("#opportunityId")
              .value = "";


            populateCampaignDependentSelects();


            const orgId =
              $("#opportunityOrganization")
                ?.value;


            if (orgId) {
              await loadContactsForOrganization(
                Number(orgId)
              );
            }


            if (
              state.user
            ) {
              $("#opportunityOwner")
                .value =
                state.user.id;
            }


            openModal(
              "opportunityModal"
            );
          }
        );
    }
  );


  [
    "#addTaskButton",
    "#quickAddTask"
  ].forEach(
    (selector) => {
      $(selector)
        ?.addEventListener(
          "click",
          () => {
            closeModal(
              "quickAddModal"
            );


            $("#taskForm")
              .reset();


            populateCampaignDependentSelects();


            if (
              state.user
            ) {
              $("#taskAssignedTo")
                .value =
                state.user.id;
            }


            openModal(
              "taskModal"
            );
          }
        );
    }
  );


  [
    "#addMediaPublicationButton",
    "#quickAddPublication"
  ].forEach(
    (selector) => {
      $(selector)
        ?.addEventListener(
          "click",
          () => {
            closeModal(
              "quickAddModal"
            );


            $("#mediaPublicationForm")
              .reset();


            populateCampaignDependentSelects();


            openModal(
              "mediaPublicationModal"
            );
          }
        );
    }
  );


  $("#addTargetButton")
    ?.addEventListener(
      "click",
      () => {
        $("#targetForm")
          .reset();


        openModal(
          "targetModal"
        );
      }
    );


  $("#createCampaignButton")
    ?.addEventListener(
      "click",
      () => {
        $("#campaignForm")
          .reset();


        openModal(
          "campaignModal"
        );
      }
    );
}


/* ============================================================
   55. EVENT BINDINGS
============================================================ */

function bindEvents() {
  $("#loginForm")
    ?.addEventListener(
      "submit",
      loginUser
    );


  $("#registerForm")
    ?.addEventListener(
      "submit",
      registerUser
    );


  $("#showRegisterButton")
    ?.addEventListener(
      "click",
      showRegisterForm
    );


  $("#showLoginButton")
    ?.addEventListener(
      "click",
      showLoginForm
    );


  $("#logoutButton")
    ?.addEventListener(
      "click",
      logoutUser
    );


  $("#mobileMenuButton")
    ?.addEventListener(
      "click",
      () => {
        $("#sidebar")
          ?.classList
          .toggle(
            "open"
          );
      }
    );


  $("#campaignSelect")
    ?.addEventListener(
      "change",
      handleCampaignSelection
    );


  $("#partnerForm")
    ?.addEventListener(
      "submit",
      savePartner
    );


  $("#opportunityForm")
    ?.addEventListener(
      "submit",
      saveOpportunity
    );


  $("#taskForm")
    ?.addEventListener(
      "submit",
      createTask
    );


  $("#negotiationForm")
    ?.addEventListener(
      "submit",
      saveNegotiation
    );


  $("#commitmentForm")
    ?.addEventListener(
      "submit",
      saveCommitment
    );


  $("#mediaPublicationForm")
    ?.addEventListener(
      "submit",
      saveMediaPublication
    );


  $("#targetForm")
    ?.addEventListener(
      "submit",
      saveTarget
    );


  $("#campaignForm")
    ?.addEventListener(
      "submit",
      createCampaign
    );


  $("#opportunityOrganization")
    ?.addEventListener(
      "change",
      async (event) => {
        await loadContactsForOrganization(
          Number(
            event.target.value
          )
        );
      }
    );


  $("#refreshDashboardButton")
    ?.addEventListener(
      "click",
      refreshEverything
    );


  $("#notificationButton")
    ?.addEventListener(
      "click",
      () => {
        $("#notificationDrawer")
          ?.classList
          .toggle(
            "hidden"
          );
      }
    );


  $("#closeNotificationButton")
    ?.addEventListener(
      "click",
      () => {
        hide(
          $("#notificationDrawer")
        );
      }
    );


  $("#markAllReadButton")
    ?.addEventListener(
      "click",
      markAllNotificationsRead
    );


  $("#globalSearchButton")
    ?.addEventListener(
      "click",
      openCommandPalette
    );


  $("#commandSearchInput")
    ?.addEventListener(
      "input",
      filterCommands
    );


  $("#exportOverviewButton")
    ?.addEventListener(
      "click",
      exportOverview
    );


  $("#exportCampaignOverviewButton")
    ?.addEventListener(
      "click",
      exportOverview
    );


  $("#exportPartnerDatabaseButton")
    ?.addEventListener(
      "click",
      exportOverview
    );


  $("#exportMediaReportButton")
    ?.addEventListener(
      "click",
      exportMedia
    );


  $("#exportActivityButton")
    ?.addEventListener(
      "click",
      exportActivities
    );


  [
    "#partnerSearchInput",
    "#partnerTypeFilter",
    "#partnerStatusFilter"
  ].forEach(
    (selector) => {
      $(selector)
        ?.addEventListener(
          "input",
          renderPartners
        );


      $(selector)
        ?.addEventListener(
          "change",
          renderPartners
        );
    }
  );


  [
    "#taskStatusFilter",
    "#taskDeadlineFilter",
    "#taskPriorityFilter"
  ].forEach(
    (selector) => {
      $(selector)
        ?.addEventListener(
          "change",
          renderTasks
        );
    }
  );


  $$(".password-toggle")
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const input =
              document.getElementById(
                button.dataset.target
              );


            if (!input) {
              return;
            }


            const showing =
              input.type ===
              "text";


            input.type =
              showing
                ? "password"
                : "text";


            button.textContent =
              showing
                ? "Show"
                : "Hide";
          }
        );
      }
    );


  document.addEventListener(
    "click",
    handleGlobalClick
  );


  document.addEventListener(
    "keydown",
    (event) => {
      const target =
        event.target;


      const typing =
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement ||
        target instanceof
          HTMLSelectElement;


      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key
          .toLowerCase() ===
          "k" &&
        !typing
      ) {
        event.preventDefault();

        openCommandPalette();
      }


      if (
        event.key ===
        "Escape"
      ) {
        closeAllModals();

        hide(
          $("#notificationDrawer")
        );


        $("#sidebar")
          ?.classList
          .remove(
            "open"
          );
      }
    }
  );


  $$(".modal-overlay")
    .forEach(
      (overlay) => {
        overlay.addEventListener(
          "click",
          (event) => {
            if (
              event.target ===
              overlay
            ) {
              hide(overlay);
            }
          }
        );
      }
    );


  bindModalButtons();
}


/* ============================================================
   56. AUTH STATE EVENTS
============================================================ */

function bindAuthState() {
  supabase
    .auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {
        state.session =
          session;

        state.user =
          session?.user ||
          null;


        if (
          event ===
          "SIGNED_OUT"
        ) {
          resetState();

          showAuth();

          showLoginForm();

          return;
        }


        if (
          event ===
            "SIGNED_IN" &&
          session?.user &&
          !state.profile &&
          !state.loadingProfile
        ) {
          await loadCurrentProfile();
        }
      }
    );
}


/* ============================================================
   57. INIT
============================================================ */

async function init() {
  showLoading();


  bindEvents();

  bindAuthState();


  try {
    const {
      data,
      error
    } =
      await supabase
        .auth
        .getSession();


    if (error) {
      throw error;
    }


    state.session =
      data.session;


    state.user =
      data.session?.user ||
      null;


    if (!state.user) {
      showAuth();

      showLoginForm();

      return;
    }


    await loadCurrentProfile();

  } catch (error) {
    console.error(error);


    showAuth();

    showLoginForm();


    setFormMessage(
      $("#loginMessage"),
      "Unable to initialize application.",
      "error"
    );
  }
}


/* ============================================================
   START
============================================================ */

init().catch((error) => {
  console.error("APP INIT ERROR:", error);

  const loading =
    document.getElementById("appLoading");

  const auth =
    document.getElementById("authScreen");

  if (loading) {
    loading.classList.add("hidden");
  }

  if (auth) {
    auth.classList.remove("hidden");
  }

  alert(
    "App gagal start:\n\n" +
    (error?.message || error)
  );
});
