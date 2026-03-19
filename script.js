const form = document.getElementById("converter-form");
const dateInput = document.getElementById("date-input");
const timeInput = document.getElementById("time-input");
const fromZoneSearch = document.getElementById("from-zone-search");
const fromZoneSelect = document.getElementById("from-zone");
const toZoneSearch = document.getElementById("to-zone-search");
const toZoneSelect = document.getElementById("to-zone");
const swapButton = document.getElementById("swap-btn");
const resultPrimary = document.getElementById("result-primary");
const resultSecondary = document.getElementById("result-secondary");
const allZones = getTimeZones();

function getTimeZones() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Dubai",
    "Australia/Sydney"
  ];
}

function formatZoneLabel(zone) {
  return zone.replaceAll("_", " ");
}

function populateZones() {
  const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  renderZoneOptions(fromZoneSelect, allZones);
  renderZoneOptions(toZoneSelect, allZones);

  fromZoneSelect.value = userZone;
  toZoneSelect.value = "UTC";

  if (toZoneSelect.value === fromZoneSelect.value) {
    toZoneSelect.value = allZones.find((z) => z !== userZone) || "UTC";
  }
}

function renderZoneOptions(select, zones) {
  const currentValue = select.value;
  const optionsMarkup = zones.length > 0
    ? zones.map((zone) => `<option value="${zone}">${formatZoneLabel(zone)}</option>`).join("")
    : '<option value="">No matching timezone</option>';

  select.innerHTML = optionsMarkup;
  select.disabled = zones.length === 0;

  if (zones.includes(currentValue)) {
    select.value = currentValue;
  }
}

function filterZones(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return allZones;
  }

  return allZones.filter((zone) => {
    const normalizedZone = zone.toLowerCase();
    const normalizedLabel = formatZoneLabel(zone).toLowerCase();
    return normalizedZone.includes(normalizedQuery) || normalizedLabel.includes(normalizedQuery);
  });
}

function bindZoneSearch(searchInput, select) {
  searchInput.addEventListener("input", () => {
    const matchingZones = filterZones(searchInput.value);
    const previousValue = select.value;

    renderZoneOptions(select, matchingZones);

    if (!matchingZones.includes(previousValue) && matchingZones.length > 0) {
      select.value = matchingZones[0];
    }

    updateResult();
  });
}

function setInitialDateTime() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  dateInput.value = localDate.toISOString().slice(0, 10);
  timeInput.value = localDate.toISOString().slice(11, 16);
}

function zonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = dtf.formatToParts(date);
  const out = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      out[part.type] = part.value;
    }
  }

  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second)
  };
}

// Iterative offset solver to map local clock time in source timezone to UTC.
function convertSourceLocalToUtc(inputDate, inputTime, sourceZone) {
  const [year, month, day] = inputDate.split("-").map(Number);
  const [hour, minute] = inputTime.split(":").map(Number);

  let guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i += 1) {
    const parts = zonedParts(new Date(guessUtc), sourceZone);
    const renderedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = desiredUtc - renderedUtc;

    if (diff === 0) {
      break;
    }

    guessUtc += diff;
  }

  return new Date(guessUtc);
}

function formatOutput(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).format(date);
}

function updateResult(event) {
  if (event) {
    event.preventDefault();
  }

  const date = dateInput.value;
  const time = timeInput.value;
  const fromZone = fromZoneSelect.value;
  const toZone = toZoneSelect.value;

  if (!date || !time || !fromZone || !toZone) {
    resultPrimary.textContent = "Please provide date, time, and both timezones.";
    resultSecondary.textContent = "";
    return;
  }

  try {
    const utcDate = convertSourceLocalToUtc(date, time, fromZone);
    resultPrimary.textContent = formatOutput(utcDate, toZone);
    resultSecondary.textContent = `${formatOutput(utcDate, fromZone)} -> ${formatOutput(utcDate, toZone)}`;
  } catch {
    resultPrimary.textContent = "Could not convert that value. Try another timezone/date.";
    resultSecondary.textContent = "";
  }
}

swapButton.addEventListener("click", () => {
  const from = fromZoneSelect.value;
  fromZoneSelect.value = toZoneSelect.value;
  toZoneSelect.value = from;
  updateResult();
});

form.addEventListener("submit", updateResult);
bindZoneSearch(fromZoneSearch, fromZoneSelect);
bindZoneSearch(toZoneSearch, toZoneSelect);

populateZones();
setInitialDateTime();
updateResult();
