import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { Store, ChefHat, CheckCircle2, XCircle, Send, ArrowLeft, ShieldAlert, Package, Beaker, Banknote, Snowflake, Leaf, Truck, StickyNote, PlusCircle, Users, BarChart3, TrendingUp, TrendingDown, Calendar, Clock, MessageSquare, ClipboardList, Edit3, Lock, Warehouse, AlertTriangle, Settings, Trash2, FolderPlus, RotateCcw, KeyRound, Search, ChevronDown, ChevronUp, Receipt, PieChart, Save, Download, FileSpreadsheet, Wallet, Moon } from "lucide-react";

const firebaseConfig = {
  apiKey: "AIzaSyDX0CRqfd5qQx0-mkRsELcHFOjRJ4MMzps",
  authDomain: "raportykebab.firebaseapp.com",
  projectId: "raportykebab",
  storageBucket: "raportykebab.firebasestorage.app",
  messagingSenderId: "551696718074",
  appId: "1:551696718074:web:ae0bfaee9701ad7a125143",
};

let app = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.error("Błąd inicjalizacji Firebase, tryb lokalny:", err);
}

const appId = "kebab-manager";
const LS_REPORTS_KEY = `kebab_reports_${appId}`;
const LS_NYSA_KEY = `kebab_nysa_${appId}`;
const LS_TASKS_KEY = `kebab_tasks_${appId}`;
const LS_CATALOG_KEY = `kebab_catalog_${appId}`;

const LOCATIONS = ["Opole", "Nysa", "Kłodzko", "Kudowa-Zdrój"];
const LOCATION_COLORS = { Opole: "bg-blue-500", Nysa: "bg-emerald-500", Kłodzko: "bg-amber-500", "Kudowa-Zdrój": "bg-purple-500" };
const DEFAULT_LOCATION_PINS = { Opole: "0525", Nysa: "0526", Kłodzko: "0527", "Kudowa-Zdrój": "0528" };

const DEFAULT_EMPLOYEES_BY_LOCATION = {
  Opole: ["Mikołaj", "Michał", "Kacper", "Dawid", "Oliwia", "Zuzanna", "Bartek"],
  Nysa: ["Mikołaj", "Michał", "Mateusz", "Kamil", "Natalia", "Wiktoria", "Szymon"],
  Kłodzko: ["Mikołaj", "Michał", "Patryk", "Jakub", "Karolina", "Martyna", "Tomek"],
  "Kudowa-Zdrój": ["Mikołaj", "Michał", "Łukasz", "Piotr", "Maja", "Aleksandra", "Filip"],
};

const AVAILABLE_UNITS = ["szt.", "kg", "g", "op.", "l", "wiadro", "karton", "pęczek", "rolka"];

const DEFAULT_ITEM_UNITS = {
  "Sałata lodowa": "szt.",
  "Pomidor": "kg",
  "Ogórek": "kg",
  "Cebula": "kg",
  "Cytryna": "kg",
  "Pietruszka": "pęczek",
  "Ziemniaki": "kg",
  "Cukinia": "kg",
  "Marchewka": "kg",
  "Kurczak": "kg",
  "Wołowina": "kg",
  "Frytki": "kg",
  "Frytka": "kg",
  "Bułki": "szt.",
  "Bułka": "szt.",
  "Lawasz": "op.",
  "Lawasz 30": "op.",
  "Lawasz 38": "op.",
  "Falafel": "kg",
  "Ser smażony": "kg",
  "Ser oba": "kg",
  "Jogurt grecki": "wiadro",
  "Majonez 50": "wiadro",
  "Majonez 27": "wiadro",
  "Ketchup 5 kg": "wiadro",
  "Ketchup 1 kg": "szt.",
  "Bbq 1 kg": "szt.",
  "Czosnek obrany": "kg",
  "Mięta": "g",
  "Sok z limonki": "l",
  "Passata pomidorowa": "szt.",
  "Pieprz cayenne": "op.",
  "Pieprz": "op.",
  "Sól": "kg",
  "Masło": "szt.",
  "Papryka słodka wędzona": "op.",
  "Oregano": "op.",
  "Sok z granatu": "l",
  "Sambal": "szt.",
  "Frytura": "l",
  "Ayran": "op.",
  "Czosnkowy": "wiadro",
  "Czosnek z miętą": "wiadro",
  "Sriracha majo": "wiadro",
  "Ostry": "wiadro",
  "Tzatziki/curry mango": "wiadro",
  "Fartuchy": "op.",
  "Rękawiczki": "op.",
  "Folia aluminiowa": "rolka",
  "Torby papierowe": "op.",
  "Serwetki / ZZ": "op.",
  "Płyn do naczyń / Chemia": "szt.",
  "Worki na śmieci": "rolka",
  "Box duży": "op.",
  "Box mały": "op.",
  "Widelec": "op.",
  "Papier": "op.",
  "Koperta": "op.",
  "Zz": "op.",
  "Rolka kasa": "rolka",
};

const getItemUnit = (catalog, itemName) => {
  if (!itemName) return "szt.";
  if (catalog?.itemUnits && catalog.itemUnits[itemName]) return catalog.itemUnits[itemName];
  if (DEFAULT_ITEM_UNITS[itemName]) return DEFAULT_ITEM_UNITS[itemName];
  if (itemName.toLowerCase().includes("mięta")) return "g";
  return "szt.";
};

const DEFAULT_AVG_ORDER_VALUE = 38;

const DEFAULT_DELIVERY_DAYS = {
  vegetables: [1, 2, 3, 4, 5, 6, 0],
  freezer: [1, 2, 3, 4, 5, 6, 0],
  farutex: [1, 3, 5],
  meat1: [0],
  meat2: [0, 3],
  otherItems: [1, 4],
  sauces: [1, 2, 3, 4, 5, 6, 0],
};

const DEFAULT_CATALOG = {
  vegetables: ["Sałata lodowa", "Pomidor", "Ogórek", "Cebula", "Cytryna", "Pietruszka", "Ziemniaki", "Cukinia", "Marchewka"],
  freezer: ["Kurczak", "Wołowina", "Frytki", "Bułki", "Lawasz", "Falafel", "Ser smażony"],
  farutex: ["Lawasz 30", "Lawasz 38", "Bułka", "Jogurt grecki", "Majonez 50", "Majonez 27", "Ketchup 5 kg", "Ketchup 1 kg", "Bbq 1 kg", "Frytki", "Ser smażony", "Czosnek obrany", "Mięta", "Sok z limonki", "Passata pomidorowa", "Pieprz cayenne", "Pieprz", "Sól", "Masło", "Papryka słodka wędzona", "Oregano", "Sok z granatu"],
  meat1: ["Wołowina", "Sambal", "Frytura", "Frytka", "Ayran", "Falafel"],
  meat2: ["Kurczak", "Bułka", "Sok z granatu", "Ser oba"],
  sauces: ["Czosnkowy", "Czosnek z miętą", "Sriracha majo", "Ostry", "Tzatziki/curry mango"],
  otherItems: ["Fartuchy", "Rękawiczki", "Folia aluminiowa", "Torby papierowe", "Serwetki / ZZ", "Płyn do naczyń / Chemia", "Worki na śmieci"],
  nysaFood: ["Kurczak", "Wołowina", "Frytki", "Bułka", "Lawasz", "Falafel", "Frytura"],
  nysaPack: ["Box duży", "Box mały", "Widelec", "Papier", "Koperta", "Zz", "Rolka kasa"],
  customCategories: [],
  locationPins: DEFAULT_LOCATION_PINS,
  deliveryDays: DEFAULT_DELIVERY_DAYS,
  itemLocations: {},
  itemUnits: DEFAULT_ITEM_UNITS,
  employeesByLocation: DEFAULT_EMPLOYEES_BY_LOCATION,
};

const DAYS_OF_WEEK = [
  { id: 1, name: "Poniedziałek", short: "Pon" },
  { id: 2, name: "Wtorek", short: "Wt" },
  { id: 3, name: "Środa", short: "Śr" },
  { id: 4, name: "Czwartek", short: "Czw" },
  { id: 5, name: "Piątek", short: "Pt" },
  { id: 6, name: "Sobota", short: "Sob" },
  { id: 0, name: "Niedziela", short: "Ndz" },
];

const getLocalData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("localDataUpdated"));
  } catch (err) { console.error("Błąd zapisu w localStorage:", err); }
};

const normalizeCatalog = (raw) => {
  if (!raw || typeof raw !== "object") return DEFAULT_CATALOG;
  const res = { ...DEFAULT_CATALOG };
  Object.keys(DEFAULT_CATALOG).forEach((k) => {
    if (k === "locationPins") {
      res[k] = { ...DEFAULT_LOCATION_PINS, ...(raw.locationPins && typeof raw.locationPins === "object" ? raw.locationPins : {}) };
    } else if (k === "deliveryDays") {
      const mergedDays = { ...DEFAULT_DELIVERY_DAYS };
      if (raw.deliveryDays && typeof raw.deliveryDays === "object") {
        Object.entries(raw.deliveryDays).forEach(([dk, dv]) => {
          if (Array.isArray(dv)) mergedDays[dk] = dv.map(Number);
        });
      }
      res[k] = mergedDays;
    } else if (k === "itemLocations") {
      res[k] = raw.itemLocations && typeof raw.itemLocations === "object" ? raw.itemLocations : {};
    } else if (k === "itemUnits") {
      res[k] = { ...DEFAULT_ITEM_UNITS, ...(raw.itemUnits && typeof raw.itemUnits === "object" ? raw.itemUnits : {}) };
    } else if (k === "employeesByLocation") {
      const mergedEmp = { ...DEFAULT_EMPLOYEES_BY_LOCATION };
      if (raw.employeesByLocation && typeof raw.employeesByLocation === "object") {
        LOCATIONS.forEach((loc) => {
          if (Array.isArray(raw.employeesByLocation[loc])) {
            mergedEmp[loc] = raw.employeesByLocation[loc];
          }
        });
      }
      res[k] = mergedEmp;
    } else if (Array.isArray(raw[k])) {
      res[k] = raw[k];
    }
  });
  return res;
};

const isItemAllowedForLocation = (catalog, categoryKey, itemName, location) => {
  if (!location) return true;
  const mapKey = `${categoryKey}__${itemName}`;
  const assigned = catalog?.itemLocations?.[mapKey];
  if (!Array.isArray(assigned)) return true;
  return assigned.includes(location);
};

const formatDateObj = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const getCalendarTodayString = () => formatDateObj(new Date());
const getYesterdayString = () => { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateObj(d); };
const isNightShiftWindow = () => { const h = new Date().getHours(); return h >= 0 && h < 5; };
const getGastroTodayString = () => (isNightShiftWindow() ? getYesterdayString() : getCalendarTodayString());

const parseDateStr = (dateStr) => {
  const parts = String(dateStr || "").split("-");
  return parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date();
};
const getDayOfWeekFromDateStr = (dateStr) => parseDateStr(dateStr).getDay();

const isTaskCompletedByLocation = (task, loc, dateStr) => {
  const completedBy = Array.isArray(task?.completedBy) ? task.completedBy : [];
  return completedBy.includes(task?.type === "recurring" ? `${dateStr}_${loc}` : loc);
};

const isTaskRelevantForLocationAndDate = (task, loc, dateStr) => {
  if (!task || task.active === false) return false;
  if (task.location !== "All" && task.location !== loc) return false;
  if (task.type === "recurring") {
    const dayIdx = getDayOfWeekFromDateStr(dateStr);
    const days = Array.isArray(task.daysOfWeek) ? task.daysOfWeek.map(Number) : [];
    if (!days.includes(dayIdx)) return false;
  }
  return !isTaskCompletedByLocation(task, loc, dateStr);
};

const getWeekBounds = (dateStr) => {
  if (!dateStr || String(dateStr).split("-").length !== 3) return { start: "", end: "" };
  const d = parseDateStr(dateStr);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: formatDateObj(mon), end: formatDateObj(sun) };
};

const parseSafeNumber = (val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const parsed = parseFloat(String(val).replace(",", ".").trim());
  return isNaN(parsed) ? 0 : parsed;
};

const hasAnyPositiveValue = (obj) => {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => parseSafeNumber(v) > 0);
};

const buildInitialSectionState = (prevSec, existingSec, draftSec) => {
  const base = { ...(prevSec && typeof prevSec === "object" ? prevSec : {}) };
  if (existingSec && typeof existingSec === "object" && Object.keys(existingSec).length > 0) {
    Object.entries(existingSec).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") base[k] = String(v);
    });
  }
  if (draftSec && typeof draftSec === "object" && hasAnyPositiveValue(draftSec)) {
    Object.entries(draftSec).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") base[k] = String(v);
    });
  }
  return base;
};

const mergeInventorySectionForSave = (existingSec, currentSec, explicitlyZeroed = {}) => {
  const existingClean = sanitizeRecord(existingSec);
  const currentClean = sanitizeRecord(currentSec);

  if (!hasAnyPositiveValue(currentClean) && hasAnyPositiveValue(existingClean) && Object.keys(explicitlyZeroed).length === 0) {
    return existingClean;
  }

  const merged = { ...existingClean };
  Object.entries(currentClean).forEach(([k, v]) => {
    const num = parseSafeNumber(v);
    if (num > 0) {
      merged[k] = String(v);
    } else if (explicitlyZeroed[k] || !(k in existingClean)) {
      merged[k] = "0";
    }
  });
  return merged;
};

const getEffectiveOrdersCount = (report, fallbackAvgOrderVal = DEFAULT_AVG_ORDER_VALUE) => {
  const manual = parseSafeNumber(report?.ordersCount);
  if (manual > 0) return Math.round(manual);
  const totalRev =
    parseSafeNumber(report?.revenue?.gotowka) +
    parseSafeNumber(report?.revenue?.karta) +
    parseSafeNumber(report?.revenue?.aplikacje);
  if (totalRev > 0 && fallbackAvgOrderVal > 0) {
    return Math.max(1, Math.round(totalRev / fallbackAvgOrderVal));
  }
  return 0;
};

const calculateWorkedHours = (hoursStr) => {
  if (!hoursStr) return 0;
  const clean = String(hoursStr).trim();
  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length === 2) {
      const parseTime = (t) => {
        const token = t.trim().replace(",", ".");
        if (token.includes(":")) {
          const [hStr, mStr] = token.split(":");
          const h = parseFloat(hStr);
          return isNaN(h) ? null : h + (mStr ? parseFloat(mStr) / 60 : 0);
        }
        if (token.includes(".")) {
          const [hStr, fracStr = "0"] = token.split(".");
          const h = parseFloat(hStr);
          if (fracStr.length === 2 && Number(fracStr) < 60) return isNaN(h) ? null : h + Number(fracStr) / 60;
          const direct = parseFloat(token);
          return isNaN(direct) ? null : direct;
        }
        const h = parseFloat(token);
        return isNaN(h) ? null : h;
      };
      const start = parseTime(parts[0]), end = parseTime(parts[1]);
      if (start !== null && end !== null) {
        let diff = end - start;
        if (diff < 0) diff += 24;
        return Math.round(diff * 100) / 100;
      }
    }
  }
  const direct = parseFloat(clean.replace(",", "."));
  return isNaN(direct) ? 0 : direct;
};

const sanitizeRecord = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  const clean = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") clean[k] = String(v);
  });
  return clean;
};

const calculateTotalExpenses = (expensesList) =>
  Array.isArray(expensesList) ? expensesList.reduce((acc, exp) => acc + parseSafeNumber(exp?.amount), 0) : 0;

const ensureAuth = async () => {
  if (auth && !auth.currentUser) await signInAnonymously(auth);
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Section = memo(({ title, icon: Icon, children, bgClass = "bg-white", titleColor = "text-gray-900", badge, collapsible = false, defaultExpanded = true, subtitle = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  return (
    <div className={`p-4 sm:p-6 rounded-[2rem] border shadow-sm transition-colors ${bgClass}`}>
      <div
        onClick={() => collapsible && setIsOpen((o) => !o)}
        className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${collapsible ? "cursor-pointer select-none" : ""} ${isOpen ? "mb-5" : "mb-0"}`}
      >
        <div className="flex flex-col">
          <h3 className={`font-extrabold text-xl flex items-center ${titleColor}`}>
            {Icon && <Icon className="w-6 h-6 mr-2 opacity-80 shrink-0" />} {title}
          </h3>
          {subtitle && <span className="text-xs font-bold text-gray-400 mt-1 ml-1">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {badge}
          {collapsible && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen((o) => !o); }}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs flex items-center transition-colors"
            >
              {isOpen ? <>Zwiń <ChevronUp className="w-4 h-4 ml-1" /></> : <>Rozwiń <ChevronDown className="w-4 h-4 ml-1" /></>}
            </button>
          )}
        </div>
      </div>
      {isOpen && <div>{children}</div>}
    </div>
  );
});

const Counter = memo(({ itemKey, label, unit = "szt.", value, onChange, onItemChange, onExplicitZero }) => {
  const [isEditingInput, setIsEditingInput] = useState(false);
  const [tempInput, setTempInput] = useState("");
  const displayLabel = label || itemKey || "";
  const isGrams = unit === "g" || displayLabel.toLowerCase().includes("mięta");
  const numVal = value === "" || value === undefined || value === null || isNaN(Number(value)) ? 0 : Number(value);

  const emitChange = (nextStr, isZeroReset = false) => {
    if (isZeroReset && onExplicitZero && (itemKey || displayLabel)) {
      onExplicitZero(itemKey || displayLabel);
    }
    if (onItemChange && itemKey) onItemChange(itemKey, nextStr);
    else if (onChange) onChange(nextStr);
  };

  const updateVal = (amount) => {
    const nextVal = Math.max(0, numVal + amount);
    const formatted = parseFloat(nextVal.toFixed(2)).toString();
    emitChange(formatted, nextVal === 0);
  };

  const handleStartManualEdit = () => {
    setTempInput(numVal === 0 ? "" : String(numVal));
    setIsEditingInput(true);
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
      setTempInput(v);
      const normalized = v.replace(",", ".").trim();
      if (normalized !== "" && !normalized.endsWith(".")) {
        const parsed = parseFloat(normalized);
        if (!isNaN(parsed) && parsed >= 0) {
          emitChange(parseFloat(parsed.toFixed(2)).toString(), parsed === 0);
        }
      }
    }
  };

  const commitManualEdit = () => {
    setIsEditingInput(false);
    const trimmed = tempInput.trim().replace(",", ".");
    if (trimmed === "") {
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed) && parsed >= 0) {
      emitChange(parseFloat(parsed.toFixed(2)).toString(), parsed === 0);
    }
  };

  const renderInputBox = (widthClass) =>
    isEditingInput ? (
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        value={tempInput}
        onChange={handleInputChange}
        onBlur={commitManualEdit}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitManualEdit(); } }}
        className={`${widthClass} h-11 text-center font-black text-blue-900 bg-blue-50 border-2 border-blue-400 rounded-lg outline-none text-sm`}
        placeholder={`0 ${unit}`}
      />
    ) : (
      <div
        onClick={handleStartManualEdit}
        title="Kliknij, aby wpisać wartość z klawiatury"
        className={`${widthClass} h-11 px-1.5 flex items-center justify-center gap-1 font-black text-gray-900 bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-300 rounded-lg select-none text-sm cursor-text transition-colors`}
      >
        <span>{value || "0"}</span>
        <span className="text-[10px] font-extrabold text-blue-600 uppercase">{unit}</span>
      </div>
    );

  return (
    <div className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-3 w-full transition-colors hover:border-blue-100">
      <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-gray-800 text-sm leading-tight break-words">
            {displayLabel}
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {unit}
          </span>
        </div>
        {numVal > 0 && (
          <button
            type="button"
            onClick={() => emitChange("0", true)}
            title="Wyzeruj wartość (Reset do 0)"
            className="shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-200/70 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors flex items-center"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> 0
          </button>
        )}
      </div>
      <div className="flex items-center justify-between p-2 gap-1 bg-white">
        {isGrams ? (
          <>
            <button type="button" onClick={() => updateVal(-100)} className="flex-1 min-w-0 h-11 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-black text-sm transition-colors touch-manipulation">-100</button>
            {renderInputBox("w-24")}
            <button type="button" onClick={() => updateVal(100)} className="flex-1 min-w-0 h-11 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-black text-sm transition-colors touch-manipulation">+100</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => updateVal(-1)} className="flex-1 min-w-0 h-11 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-black text-sm transition-colors touch-manipulation">-1</button>
            <button type="button" onClick={() => updateVal(-0.5)} className="flex-1 min-w-0 h-11 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-black text-xs transition-colors touch-manipulation">-.5</button>
            {renderInputBox("w-20 shrink-0")}
            <button type="button" onClick={() => updateVal(0.5)} className="flex-1 min-w-0 h-11 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-black text-xs transition-colors touch-manipulation">+.5</button>
            <button type="button" onClick={() => updateVal(1)} className="flex-1 min-w-0 h-11 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-black text-sm transition-colors touch-manipulation">+1</button>
          </>
        )}
      </div>
    </div>
  );
});

const Modal = memo(({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <p className="text-gray-900 font-bold text-lg mb-6">{message}</p>
        <button type="button" onClick={onClose} className="bg-blue-600 w-full hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">OK</button>
      </div>
    </div>
  );
});

const ConfirmExitModal = memo(({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-gray-900 font-extrabold text-lg mb-2">Masz niezapisane zmiany</h4>
        <p className="text-gray-600 text-sm font-medium mb-6">Masz niezapisane zmiany. Czy na pewno chcesz wyjść? (Twój szkic jest bezpiecznie zachowany w pamięci telefonu).</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition-colors text-sm">Zostań</button>
          <button type="button" onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors text-sm">Wyjdź</button>
        </div>
      </div>
    </div>
  );
});

const PinLoginScreen = memo(({ icon: Icon, iconBgClass, title, subtitle, submitLabel, submitBtnClass, onSubmitPin, onBack }) => (
  <div className="flex flex-col items-center justify-center p-6 min-h-screen max-w-sm mx-auto">
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 w-full">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 ${iconBgClass} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-2 font-medium text-sm">{subtitle}</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmitPin(e.target.elements.pinInput.value); e.target.reset(); }}>
        <input type="password" name="pinInput" inputMode="numeric" autoComplete="off" autoFocus className="w-full text-center text-4xl tracking-[0.5em] font-black border-2 border-gray-200 bg-gray-50 rounded-2xl p-4 mb-6 focus:border-blue-500 focus:bg-white outline-none transition-colors shadow-inner" placeholder="••••" required />
        <div className="flex flex-col gap-3">
          <button type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-colors ${submitBtnClass}`}>{submitLabel}</button>
          <button type="button" onClick={onBack} className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors">Wróć</button>
        </div>
      </form>
    </div>
  </div>
));

const UrgentTasksBanner = memo(({ tasks, location, todayStr, onCompleteTask }) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900 mb-4 shadow-sm">
        <div className="flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>Wszystkie zadania dnia dla punktu <strong>{location}</strong> ({todayStr}) zostały wykonane lub brak zadań.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-red-300 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <span className="text-xs font-black uppercase tracking-wider bg-black/25 px-3 py-1 rounded-full flex items-center">
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Zadania dnia — Punkt: {location}
            </span>
            <span className="text-xs font-black bg-white text-red-700 px-3 py-1 rounded-full shadow-sm">
              Do wykonania dziś: {tasks.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {tasks.map((t) => {
              const isRecurring = t.type === "recurring";
              const scheduledDaysText = isRecurring && Array.isArray(t.daysOfWeek)
                ? DAYS_OF_WEEK.filter((d) => t.daysOfWeek.map(Number).includes(d.id)).map((d) => d.short).join(", ")
                : "";
              return (
                <div key={t.id} className="bg-black/25 p-3.5 rounded-xl border border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded-md">
                        {isRecurring ? `Cykliczne (${scheduledDaysText})` : "Zadanie doraźne"}
                      </span>
                      <span className="inline-flex items-center text-[11px] font-black bg-amber-300 text-gray-950 px-2.5 py-0.5 rounded-md shadow-sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Do wykonania do godziny: {t.deadlineTime || "22:00"}
                      </span>
                      {t.createdBy && (
                        <span className="text-[10px] font-semibold text-white/80">• Zlecił(a): {t.createdBy}</span>
                      )}
                    </div>
                    <p className="font-extrabold text-sm sm:text-base text-white break-words pt-0.5">{t.text}</p>
                  </div>
                  {onCompleteTask && (
                    <button
                      type="button"
                      onClick={() => onCompleteTask(t)}
                      className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center transition-colors shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Wykonane
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("select");
  const [currentLocation, setCurrentLocation] = useState("");
  const [unlockedLocation, setUnlockedLocation] = useState(null);

  const [adminRole, setAdminRole] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [activeGastroDate, setActiveGastroDate] = useState(getGastroTodayString);

  const [allReports, setAllReports] = useState([]);
  const [allNysaWarehouse, setAllNysaWarehouse] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [modalMsg, setModalMsg] = useState("");
  const [adminEditingReport, setAdminEditingReport] = useState(null);

  const calendarTodayStr = getCalendarTodayString();
  const yesterdayStr = getYesterdayString();
  const inNightWindow = isNightShiftWindow();

  const todayReports = useMemo(() => {
    const statuses = {};
    allReports.forEach((r) => {
      if (r?.date === activeGastroDate && r?.location) statuses[r.location] = r;
    });
    return statuses;
  }, [allReports, activeGastroDate]);

  const todayNysaWarehouse = useMemo(
    () => allNysaWarehouse.find((n) => n?.date === activeGastroDate) || null,
    [allNysaWarehouse, activeGastroDate]
  );

  const previousReportForCurrentLoc = useMemo(() => {
    if (!currentLocation) return null;
    const prevList = allReports
      .filter((r) => r?.location === currentLocation && r?.date && r.date < activeGastroDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return prevList[0] || null;
  }, [allReports, currentLocation, activeGastroDate]);

  const previousReportForAdminEdit = useMemo(() => {
    if (!adminEditingReport) return null;
    const prevList = allReports
      .filter((r) => r?.location === adminEditingReport.location && r?.date && r.date < adminEditingReport.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return prevList[0] || null;
  }, [allReports, adminEditingReport]);

  const previousNysaWarehouse = useMemo(() => {
    const prevList = allNysaWarehouse
      .filter((n) => n?.date && n.date < activeGastroDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return prevList[0] || null;
  }, [allNysaWarehouse, activeGastroDate]);

  useEffect(() => {
    if (!auth) {
      setUser({ uid: "local-user", isLocal: true });
      return;
    }
    let isMounted = true;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Błąd autoryzacji Firebase, sesja lokalna:", err);
        if (isMounted) setUser({ uid: "local-user", isLocal: true });
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { if (u && isMounted) setUser(u); });
    return () => { isMounted = false; unsub(); };
  }, []);

  useEffect(() => {
    const loadFromLocalStorage = () => {
      setAllReports(getLocalData(LS_REPORTS_KEY, []));
      setAllNysaWarehouse(getLocalData(LS_NYSA_KEY, []));
      const localTasks = getLocalData(LS_TASKS_KEY, []);
      setTasks([...localTasks].sort((a, b) => (b?.createdAt || "").localeCompare(a?.createdAt || "")));
      setCatalog(normalizeCatalog(getLocalData(LS_CATALOG_KEY, DEFAULT_CATALOG)));
    };

    if (!db) {
      loadFromLocalStorage();
      window.addEventListener("localDataUpdated", loadFromLocalStorage);
      return () => window.removeEventListener("localDataUpdated", loadFromLocalStorage);
    }

    if (!user) return;
    const basePath = ["artifacts", appId, "public", "data"];

    const unsubReports = onSnapshot(
      collection(db, ...basePath, "daily_reports"),
      (snap) => {
        const byKey = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const fullRecord = { id: docSnap.id, ...data };
          const key = `${data?.date}_${data?.location}`;
          if (!byKey[key]) {
            byKey[key] = fullRecord;
          } else {
            const prev = byKey[key];
            const isNewer = (fullRecord.updatedAt || "") >= (prev.updatedAt || "");
            const winner = isNewer ? fullRecord : prev;
            const loser = isNewer ? prev : fullRecord;
            const merged = { ...loser, ...winner };
            ["vegetables", "freezer", "farutex", "meat1", "meat2", "otherItems"].forEach((sec) => {
              if (!hasAnyPositiveValue(winner[sec]) && hasAnyPositiveValue(loser[sec])) {
                merged[sec] = loser[sec];
              }
            });
            if (docSnap.id === key) merged.id = key;
            byKey[key] = merged;
          }
        });
        setAllReports(Object.values(byKey));
      },
      (err) => { console.error("Firestore Reports error:", err); loadFromLocalStorage(); }
    );

    const unsubNysa = onSnapshot(
      collection(db, ...basePath, "nysa_warehouse"),
      (snap) => setAllNysaWarehouse(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => { console.error("Firestore Nysa error:", err); loadFromLocalStorage(); }
    );

    const unsubTasks = onSnapshot(
      collection(db, ...basePath, "tasks"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTasks(data.sort((a, b) => (b?.createdAt || "").localeCompare(a?.createdAt || "")));
      },
      (err) => { console.error("Firestore Tasks error:", err); loadFromLocalStorage(); }
    );

    const catalogDocRef = doc(db, ...basePath, "config", "catalog");
    const unsubCatalog = onSnapshot(
      catalogDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setCatalog(normalizeCatalog(docSnap.data()));
        } else {
          try {
            await setDoc(catalogDocRef, DEFAULT_CATALOG);
            setCatalog(DEFAULT_CATALOG);
          } catch (e) {
            console.error("Błąd inicjalizacji katalogu:", e);
            setCatalog(DEFAULT_CATALOG);
          }
        }
      },
      (err) => {
        console.error("Firestore Catalog error:", err);
        setCatalog(normalizeCatalog(getLocalData(LS_CATALOG_KEY, DEFAULT_CATALOG)));
      }
    );

    return () => { unsubReports(); unsubNysa(); unsubTasks(); unsubCatalog(); };
  }, [user]);

  const handleSaveCatalog = useCallback(async (nextCatalog, successMsg) => {
    const normalized = normalizeCatalog(nextCatalog);
    setCatalog(normalized);
    setLocalData(LS_CATALOG_KEY, normalized);
    if (db) {
      try {
        await ensureAuth();
        await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "catalog"), normalized);
        if (successMsg) setModalMsg(successMsg);
      } catch (err) {
        console.error("Błąd zapisu katalogu w Firebase:", err);
        setModalMsg("Zapisano lokalnie, ale wystąpił problem z zapisem w chmurze Firebase.");
      }
    } else if (successMsg) {
      setModalMsg(successMsg);
    }
  }, []);

  const handleCompleteTaskGlobal = useCallback(async (taskObj, targetLoc, targetDateStr) => {
    if (!taskObj?.id) return;
    const loc = targetLoc || currentLocation;
    const dStr = targetDateStr || activeGastroDate;
    try {
      const completionEntry = taskObj.type === "recurring" ? `${dStr}_${loc}` : loc;
      if (db) {
        await ensureAuth();
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "tasks", taskObj.id), {
          completedBy: arrayUnion(completionEntry),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const currentTasks = getLocalData(LS_TASKS_KEY, []);
        const nextTasks = currentTasks.map((t) => {
          if (t.id !== taskObj.id) return t;
          const prevArr = Array.isArray(t.completedBy) ? t.completedBy : [];
          return prevArr.includes(completionEntry) ? t : { ...t, completedBy: [...prevArr, completionEntry], updatedAt: new Date().toISOString() };
        });
        setLocalData(LS_TASKS_KEY, nextTasks);
      }
      setModalMsg(`Zadanie dnia zostało oznaczone jako wykonane dla punktu ${loc}!`);
    } catch (err) {
      console.error("Błąd odhaczania zadania:", err);
      setModalMsg("Wystąpił błąd podczas zapisywania wykonania zadania.");
    }
  }, [currentLocation, activeGastroDate]);

  const handleNav = (loc) => {
    setCurrentLocation(loc);
    if (unlockedLocation === loc) setView(loc === "Nysa" ? "nysaMenu" : "employee");
    else setView("employeeLogin");
  };

  const handleEmployeeAuth = (pin) => {
    const expectedPin = catalog?.locationPins?.[currentLocation] || DEFAULT_LOCATION_PINS[currentLocation];
    if (String(pin).trim() === String(expectedPin).trim()) {
      setUnlockedLocation(currentLocation);
      setView(currentLocation === "Nysa" ? "nysaMenu" : "employee");
    } else {
      setModalMsg(`Błędny kod PIN dla punktu ${currentLocation}! Dostęp zablokowany.`);
    }
  };

  const handleAdminAuth = (pin) => {
    const roles = {
      6967: { role: "owner", name: "Mikołaj" },
      6968: { role: "owner", name: "Michał" },
      5527: { role: "klodzko_admin", name: "Administrator Kłodzko" },
      1234: { role: "manager", name: "Manager" },
    };
    const match = roles[String(pin).trim()];
    if (match) {
      setAdminRole(match.role);
      setAdminName(match.name);
      setView("admin");
    } else {
      setModalMsg("Wprowadzono niepoprawny kod PIN.");
    }
  };

  const currentEmployeeTasks = useMemo(
    () => tasks.filter((t) => isTaskRelevantForLocationAndDate(t, currentLocation, activeGastroDate)),
    [tasks, currentLocation, activeGastroDate]
  );

  const adminEditTasks = useMemo(
    () => adminEditingReport ? tasks.filter((t) => isTaskRelevantForLocationAndDate(t, adminEditingReport.location, adminEditingReport.date)) : [],
    [tasks, adminEditingReport]
  );

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <Modal message={modalMsg} onClose={() => setModalMsg("")} />

      {view === "select" && (
        <div className="flex flex-col items-center justify-center p-6 min-h-screen max-w-lg mx-auto">
          <div className="mb-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20 transform rotate-3">
              <ChefHat className="w-12 h-12 text-white -rotate-3" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">System Raportów</h1>
            <p className="text-gray-500 font-medium">
              Wybierz swój punkt <strong className="text-gray-800">{activeGastroDate}</strong>
            </p>
          </div>

          {inNightWindow && (
            <div className="w-full mb-6 bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-700 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-300 mb-2">
                <Moon className="w-4 h-4 text-amber-400" /> Tryb Nocny (Po północy) — Wybierz datę zamykanej zmiany:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { date: yesterdayStr, label: "Wczorajsza zmiana" },
                  { date: calendarTodayStr, label: "Dzisiejsza zmiana" },
                ].map((opt) => (
                  <button
                    key={opt.date}
                    type="button"
                    onClick={() => setActiveGastroDate(opt.date)}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs transition-colors border ${activeGastroDate === opt.date ? "bg-amber-400 text-gray-950 border-amber-300 shadow-sm" : "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20"}`}
                  >
                    {opt.label} ({opt.date})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full flex flex-col gap-4">
            {LOCATIONS.map((loc) => {
              const isDone = !!todayReports[loc];
              const locTasksCount = tasks.filter((t) => isTaskRelevantForLocationAndDate(t, loc, activeGastroDate)).length;
              const isUnlockedHere = unlockedLocation === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleNav(loc)}
                  className={`relative p-5 rounded-[2rem] flex items-center justify-between transition-transform active:scale-95 border-2 shadow-sm hover:shadow-md ${isDone ? "bg-white border-green-200 hover:border-green-300" : "bg-white border-gray-100 hover:border-blue-300"}`}
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-2xl font-black text-gray-900">{loc}</span>
                      {locTasksCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center">
                          <ClipboardList className="w-3.5 h-3.5 mr-1" /> Zadania: {locTasksCount}
                        </span>
                      )}
                      {isUnlockedHere && <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Odblokowano</span>}
                    </div>
                    <div className="flex items-center opacity-90">
                      {isDone ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" /><span className="text-sm font-bold text-green-600">Raport wysłany pomyślnie</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-red-400 mr-1.5" /><span className="text-sm font-bold text-red-500">Raport nie zrobiony</span></>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDone ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setView("adminLogin")}
              className="mt-8 flex items-center justify-center py-5 rounded-[2rem] bg-gray-900 text-white font-bold text-sm shadow-xl shadow-gray-900/20 active:scale-95 transition-transform hover:bg-gray-800 border border-gray-700"
            >
              <ShieldAlert className="w-5 h-5 mr-3" /> LOGOWANIE WŁAŚCICIEL
            </button>
          </div>
        </div>
      )}

      {view === "employeeLogin" && (
        <PinLoginScreen
          icon={Lock}
          iconBgClass="bg-blue-600 shadow-blue-600/20"
          title={`Punkt: ${currentLocation}`}
          subtitle={<>Wprowadź unikalny kod PIN przypisany wyłącznie do punktu <strong className="text-gray-800">{currentLocation}</strong></>}
          submitLabel={`Odblokuj punkt ${currentLocation}`}
          submitBtnClass="bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
          onSubmitPin={handleEmployeeAuth}
          onBack={() => setView("select")}
        />
      )}

      {view === "nysaMenu" && (
        <div className="flex flex-col items-center justify-center p-6 min-h-screen max-w-lg mx-auto">
          <div className="mb-6 text-center w-full relative">
            <button type="button" onClick={() => setView("select")} className="absolute left-0 top-0 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Menu Nysa</h1>
            <p className="text-gray-500 mt-2 font-medium">Wybierz formularz docelowy ({activeGastroDate})</p>
          </div>
          <UrgentTasksBanner
            tasks={currentEmployeeTasks}
            location="Nysa"
            todayStr={activeGastroDate}
            onCompleteTask={(t) => handleCompleteTaskGlobal(t, "Nysa", activeGastroDate)}
          />
          <div className="w-full flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setView("employee")}
              className={`p-6 rounded-[2rem] text-left transition-transform active:scale-95 border-2 shadow-sm ${todayReports["Nysa"] ? "bg-green-50/50 border-green-200" : "bg-blue-50/50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">Dzienny Raport Zmiany</h2>
              <div className="flex items-center">
                {todayReports["Nysa"] ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600 mr-2" /><span className="font-bold text-green-700">Edytuj zrobiony raport</span></>
                ) : (
                  <><XCircle className="w-5 h-5 text-blue-500 mr-2" /><span className="font-bold text-blue-600">Rozpocznij raport dzienny</span></>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setView("nysaWarehouse")}
              className={`p-6 rounded-[2rem] text-left transition-transform active:scale-95 border-2 shadow-sm ${todayNysaWarehouse ? "bg-purple-50/50 border-purple-200" : "bg-white border-purple-200"}`}
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">Magazyn Główny Nysa</h2>
              <div className="flex items-center">
                {todayNysaWarehouse ? (
                  <><CheckCircle2 className="w-5 h-5 text-purple-600 mr-2" /><span className="font-bold text-purple-700">Aktualizuj stan magazynu</span></>
                ) : (
                  <><XCircle className="w-5 h-5 text-purple-400 mr-2" /><span className="font-bold text-purple-500">Uzupełnij stan magazynu</span></>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {view === "adminLogin" && (
        <PinLoginScreen
          icon={ShieldAlert}
          iconBgClass="bg-gray-900 shadow-gray-900/20"
          title="Autoryzacja"
          subtitle="Właściciel / Admin Kłodzko / Manager"
          submitLabel="Zaloguj się"
          submitBtnClass="bg-gray-900 hover:bg-gray-800"
          onSubmitPin={handleAdminAuth}
          onBack={() => setView("select")}
        />
      )}

      {view === "employee" && (
        <EmployeeForm
          key={`${currentLocation}_${activeGastroDate}`}
          db={db}
          appId={appId}
          location={currentLocation}
          existingData={todayReports[currentLocation]}
          previousReport={previousReportForCurrentLoc}
          catalog={catalog}
          tasks={currentEmployeeTasks}
          onCompleteTask={(t) => handleCompleteTaskGlobal(t, currentLocation, activeGastroDate)}
          onBack={() => setView(currentLocation === "Nysa" ? "nysaMenu" : "select")}
          todayStr={activeGastroDate}
          onChangeGastroDate={setActiveGastroDate}
          inNightWindow={inNightWindow}
          yesterdayStr={yesterdayStr}
          calendarTodayStr={calendarTodayStr}
          onShowModal={setModalMsg}
        />
      )}

      {view === "adminEditReport" && adminEditingReport && (
        <EmployeeForm
          key={`admin_${adminEditingReport.location}_${adminEditingReport.date}`}
          db={db}
          appId={appId}
          location={adminEditingReport.location}
          existingData={adminEditingReport.existingData}
          previousReport={previousReportForAdminEdit}
          catalog={catalog}
          tasks={adminEditTasks}
          onCompleteTask={(t) => handleCompleteTaskGlobal(t, adminEditingReport.location, adminEditingReport.date)}
          onBack={() => { setAdminEditingReport(null); setView("admin"); }}
          todayStr={adminEditingReport.date}
          onShowModal={setModalMsg}
          isAdminEdit={true}
        />
      )}

      {view === "nysaWarehouse" && (
        <NysaWarehouseForm
          key={`nysa_wh_${activeGastroDate}`}
          db={db}
          appId={appId}
          existingData={todayNysaWarehouse}
          previousWarehouseData={previousNysaWarehouse}
          catalog={catalog}
          onBack={() => setView("nysaMenu")}
          todayStr={activeGastroDate}
          onShowModal={setModalMsg}
        />
      )}

      {view === "admin" && (
        <AdminPanel
          db={db}
          appId={appId}
          role={adminRole}
          name={adminName}
          onLogout={() => { setAdminRole(null); setView("select"); }}
          reports={Object.values(todayReports)}
          allReports={allReports}
          todayNysaWarehouse={todayNysaWarehouse}
          allNysaWarehouse={allNysaWarehouse}
          tasks={tasks}
          catalog={catalog}
          onSaveCatalog={handleSaveCatalog}
          todayStr={activeGastroDate}
          onEditHistoricalReport={(loc, dateStr, existingReportObj) => {
            setAdminEditingReport({ location: loc, date: dateStr, existingData: existingReportObj || null });
            setView("adminEditReport");
          }}
          onShowModal={setModalMsg}
        />
      )}
    </div>
  );
}

function EmployeeForm({
  db,
  appId,
  location,
  existingData,
  previousReport,
  catalog,
  tasks = [],
  onCompleteTask,
  onBack,
  todayStr,
  onChangeGastroDate,
  inNightWindow = false,
  yesterdayStr = "",
  calendarTodayStr = "",
  onShowModal,
  isAdminEdit = false,
}) {
  const isEdit = !!existingData;
  const [loading, setLoading] = useState(false);

  const draftStorageKey = `kebab_draft_${appId}_${location}_${todayStr}`;
  const [savedDraft] = useState(() => (isAdminEdit ? null : getLocalData(draftStorageKey, null)));
  const [hasRestoredDraft] = useState(!!savedDraft);
  const [hasLoadedFromPrevious, setHasLoadedFromPrevious] = useState(() => !existingData && !savedDraft && !!previousReport);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [explicitlyZeroed, setExplicitlyZeroed] = useState({});

  const [activeFormTab, setActiveFormTab] = useState("all");
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  const [reporter, setReporter] = useState(savedDraft?.reporter || existingData?.reporter || "");
  const [ordersCount, setOrdersCount] = useState(() => {
    const val = savedDraft?.ordersCount ?? existingData?.ordersCount;
    return val !== undefined && val !== null && Number(val) > 0 ? String(val) : "";
  });

  const [quickNote, setQuickNote] = useState(() => {
    try { return localStorage.getItem(`note_${location}`) || ""; } catch { return ""; }
  });

  const [revenue, setRevenue] = useState(() => {
    const rev = {};
    ["gotowka", "karta", "aplikacje", "raportFiskalny", "roznica"].forEach((k) => {
      const dVal = savedDraft?.revenue?.[k];
      const eVal = existingData?.revenue?.[k];
      const val = dVal !== undefined && dVal !== "" ? dVal : eVal;
      rev[k] = val !== undefined ? String(val) : "";
    });
    return rev;
  });

  const [expenses, setExpenses] = useState(() =>
    Array.isArray(savedDraft?.expenses) && savedDraft.expenses.length > 0
      ? savedDraft.expenses
      : Array.isArray(existingData?.expenses)
      ? existingData.expenses
      : []
  );

  const [employees, setEmployees] = useState(() => {
    const src = Array.isArray(savedDraft?.employees) && savedDraft.employees.some((e) => e?.name || e?.hours)
      ? savedDraft.employees
      : Array.isArray(existingData?.employees) && existingData.employees.length > 0
      ? existingData.employees
      : [];
    return [0, 1, 2].map((i) => ({ name: src[i]?.name || "", hours: src[i]?.hours || "" }));
  });

  const [vegetables, setVegetables] = useState(() => buildInitialSectionState(previousReport?.vegetables, existingData?.vegetables, savedDraft?.vegetables));
  const [farutex, setFarutex] = useState(() => buildInitialSectionState(previousReport?.farutex, existingData?.farutex, savedDraft?.farutex));
  const [freezer, setFreezer] = useState(() => buildInitialSectionState(previousReport?.freezer, existingData?.freezer, savedDraft?.freezer));
  const [meat1, setMeat1] = useState(() => buildInitialSectionState(previousReport?.meat1, existingData?.meat1, savedDraft?.meat1));
  const [meat2, setMeat2] = useState(() => buildInitialSectionState(previousReport?.meat2, existingData?.meat2, savedDraft?.meat2));
  const [otherItems, setOtherItems] = useState(() => buildInitialSectionState(previousReport?.otherItems, existingData?.otherItems, savedDraft?.otherItems));
  const [customSections, setCustomSections] = useState(() => ({
    ...(previousReport?.customSections || {}),
    ...(existingData?.customSections || {}),
    ...(savedDraft?.customSections || {}),
  }));
  const [sauces, setSauces] = useState(() =>
    Array.isArray(savedDraft?.sauces) && savedDraft.sauces.length > 0
      ? savedDraft.sauces
      : Array.isArray(existingData?.sauces)
      ? existingData.sauces
      : []
  );
  const [saucesNote, setSaucesNote] = useState(savedDraft?.saucesNote || existingData?.saucesNote || "");
  const [notes, setNotes] = useState(savedDraft?.notes || existingData?.notes || "");

  useEffect(() => {
    if (!existingData) return;
    setVegetables((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.vegetables || {}) }));
    setFreezer((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.freezer || {}) }));
    setFarutex((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.farutex || {}) }));
    setMeat1((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.meat1 || {}) }));
    setMeat2((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.meat2 || {}) }));
    setOtherItems((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.otherItems || {}) }));
    if (!isDirty) {
      if (existingData.reporter) setReporter((r) => r || existingData.reporter);
      if (existingData.ordersCount) setOrdersCount((o) => o || String(existingData.ordersCount));
      if (existingData.revenue) {
        setRevenue((prev) => {
          const next = { ...prev };
          ["gotowka", "karta", "aplikacje", "raportFiskalny", "roznica"].forEach((k) => {
            if (!next[k] && existingData.revenue[k] !== undefined) next[k] = String(existingData.revenue[k]);
          });
          return next;
        });
      }
      if (Array.isArray(existingData.employees) && existingData.employees.length > 0) {
        setEmployees((prev) =>
          prev.some((e) => e.name || e.hours)
            ? prev
            : [0, 1, 2].map((i) => ({ name: existingData.employees[i]?.name || "", hours: existingData.employees[i]?.hours || "" }))
        );
      }
    }
  }, [existingData, isDirty]);

  useEffect(() => {
    if (existingData || !previousReport || isDirty) return;
    setVegetables((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.vegetables || {}) }));
    setFreezer((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.freezer || {}) }));
    setFarutex((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.farutex || {}) }));
    setMeat1((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.meat1 || {}) }));
    setMeat2((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.meat2 || {}) }));
    setOtherItems((prev) => (hasAnyPositiveValue(prev) ? prev : { ...(previousReport.otherItems || {}) }));
  }, [previousReport, existingData, isDirty]);

  const locationEmployeesList = useMemo(
    () => catalog?.employeesByLocation?.[location] || DEFAULT_EMPLOYEES_BY_LOCATION[location] || [],
    [catalog, location]
  );

  const estimatedOrdersFromRevenue = useMemo(() => {
    const totalRev =
      parseSafeNumber(revenue.gotowka) +
      parseSafeNumber(revenue.karta) +
      parseSafeNumber(revenue.aplikacje);
    return totalRev > 0 ? Math.max(1, Math.round(totalRev / DEFAULT_AVG_ORDER_VALUE)) : 0;
  }, [revenue]);

  const markItemExplicitlyZeroed = useCallback((itemKey) => {
    setExplicitlyZeroed((prev) => ({ ...prev, [itemKey]: true }));
  }, []);

  const handleResetAllInventoryToZero = () => {
    setIsDirty(true);
    setHasLoadedFromPrevious(false);
    const allZeroFlags = {};
    [
      ...(catalog?.vegetables || []),
      ...(catalog?.freezer || []),
      ...(catalog?.farutex || []),
      ...(catalog?.meat1 || []),
      ...(catalog?.meat2 || []),
      ...(catalog?.otherItems || []),
    ].forEach((k) => { allZeroFlags[k] = true; });
    setExplicitlyZeroed(allZeroFlags);
    setVegetables({});
    setFreezer({});
    setFarutex({});
    setMeat1({});
    setMeat2({});
    setOtherItems({});
    setCustomSections({});
    setSauces([]);
  };

  useEffect(() => {
    if (isAdminEdit || !isDirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            reporter, ordersCount, revenue, expenses, employees, vegetables, farutex, freezer, meat1, meat2, otherItems, customSections, sauces, saucesNote, notes,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (err) { console.error("Błąd autosave szkicu:", err); }
    }, 350);
    return () => clearTimeout(timer);
  }, [isDirty, isAdminEdit, draftStorageKey, reporter, ordersCount, revenue, expenses, employees, vegetables, farutex, freezer, meat1, meat2, otherItems, customSections, sauces, saucesNote, notes]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const clearDraft = () => {
    try { localStorage.removeItem(draftStorageKey); } catch (e) { console.error("Błąd czyszczenia szkicu:", e); }
  };

  const handleVegChange = useCallback((item, v) => { setIsDirty(true); setVegetables((p) => ({ ...p, [item]: v })); }, []);
  const handleFreezerChange = useCallback((item, v) => { setIsDirty(true); setFreezer((p) => ({ ...p, [item]: v })); }, []);
  const handleFarutexChange = useCallback((item, v) => { setIsDirty(true); setFarutex((p) => ({ ...p, [item]: v })); }, []);
  const handleMeat1Change = useCallback((item, v) => { setIsDirty(true); setMeat1((p) => ({ ...p, [item]: v })); }, []);
  const handleMeat2Change = useCallback((item, v) => { setIsDirty(true); setMeat2((p) => ({ ...p, [item]: v })); }, []);
  const handleOtherItemsChange = useCallback((item, v) => { setIsDirty(true); setOtherItems((p) => ({ ...p, [item]: v })); }, []);

  const handleAddExpenseRow = () => { setIsDirty(true); setExpenses((prev) => [...prev, { description: "", amount: "" }]); };
  const handleUpdateExpenseRow = (idx, field, val) => {
    setIsDirty(true);
    setExpenses((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };
  const handleRemoveExpenseRow = (idx) => { setIsDirty(true); setExpenses((prev) => prev.filter((_, i) => i !== idx)); };

  const vegList = useMemo(
    () => (catalog?.vegetables || DEFAULT_CATALOG.vegetables).filter((item) => isItemAllowedForLocation(catalog, "vegetables", item, location)),
    [catalog, location]
  );
  const freezerList = useMemo(
    () => (catalog?.freezer || DEFAULT_CATALOG.freezer).filter((item) => isItemAllowedForLocation(catalog, "freezer", item, location)),
    [catalog, location]
  );
  const farutexList = useMemo(
    () => (catalog?.farutex || DEFAULT_CATALOG.farutex).filter((item) => isItemAllowedForLocation(catalog, "farutex", item, location)),
    [catalog, location]
  );
  const meat1List = useMemo(
    () => (catalog?.meat1 || DEFAULT_CATALOG.meat1).filter((item) => isItemAllowedForLocation(catalog, "meat1", item, location)),
    [catalog, location]
  );
  const meat2List = useMemo(
    () => (catalog?.meat2 || DEFAULT_CATALOG.meat2).filter((item) => isItemAllowedForLocation(catalog, "meat2", item, location)),
    [catalog, location]
  );
  const saucesList = useMemo(
    () => (catalog?.sauces || DEFAULT_CATALOG.sauces).filter((item) => isItemAllowedForLocation(catalog, "sauces", item, location)),
    [catalog, location]
  );
  const otherItemsList = useMemo(
    () => (catalog?.otherItems || DEFAULT_CATALOG.otherItems).filter((item) => isItemAllowedForLocation(catalog, "otherItems", item, location)),
    [catalog, location]
  );
  const customCategories = useMemo(() => Array.isArray(catalog?.customCategories) ? catalog.customCategories : [], [catalog]);

  const filterBySearch = useCallback(
    (list) => {
      const q = itemSearchQuery.trim().toLowerCase();
      return q ? list.filter((item) => item.toLowerCase().includes(q)) : list;
    },
    [itemSearchQuery]
  );

  const countFilledInRecord = (rec, list) =>
    rec && typeof rec === "object" ? list.filter((k) => parseSafeNumber(rec[k]) > 0).length : 0;

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setQuickNote(val);
    try { localStorage.setItem(`note_${location}`, val); } catch (err) { console.error("LocalStorage error:", err); }
  };

  const updateEmployee = (index, field, value) => {
    setIsDirty(true);
    setEmployees((prev) => prev.map((emp, i) => (i === index ? { ...emp, [field]: value } : emp)));
  };

  const handleSauceToggle = (s) => {
    setIsDirty(true);
    setSauces((prev) => {
      const curr = Array.isArray(prev) ? prev : [];
      return curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s];
    });
  };

  const handleCustomCounterChange = (catId, item, val) => {
    setIsDirty(true);
    setCustomSections((prev) => ({
      ...prev,
      [catId]: { ...(prev[catId] && typeof prev[catId] === "object" ? prev[catId] : {}), [item]: val },
    }));
  };

  const handleCustomCheckboxToggle = (catId, item) => {
    setIsDirty(true);
    setCustomSections((prev) => {
      const curr = Array.isArray(prev[catId]) ? prev[catId] : [];
      return { ...prev, [catId]: curr.includes(item) ? curr.filter((x) => x !== item) : [...curr, item] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const cleanReporter = (reporter || "").trim();
    if (!cleanReporter) {
      onShowModal("Wybierz swoje imię w polu 'Osoba wypełniająca raport'.");
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmployees = (employees || []).map((emp) => ({
        name: String(emp?.name || "").trim(),
        hours: String(emp?.hours || "").trim(),
      }));

      const sanitizedExpenses = (expenses || [])
        .map((exp) => ({ description: String(exp?.description || "").trim(), amount: parseSafeNumber(exp?.amount) }))
        .filter((exp) => exp.description !== "" || exp.amount > 0);

      const sanitizedCustomSections = {};
      Object.entries(customSections || {}).forEach(([catId, val]) => {
        if (Array.isArray(val)) sanitizedCustomSections[catId] = val.map(String);
        else if (val && typeof val === "object") {
          sanitizedCustomSections[catId] = mergeInventorySectionForSave(
            existingData?.customSections?.[catId],
            val,
            explicitlyZeroed
          );
        }
      });

      const targetDate = String(todayStr || getGastroTodayString());
      const targetLoc = String(location || "");
      const deterministicId = `${targetDate}_${targetLoc}`;

      const manualOrdersNum = Math.round(parseSafeNumber(ordersCount));
      const finalOrdersCount = manualOrdersNum > 0
        ? manualOrdersNum
        : estimatedOrdersFromRevenue > 0
        ? estimatedOrdersFromRevenue
        : parseSafeNumber(existingData?.ordersCount);

      const data = {
        date: targetDate,
        location: targetLoc,
        reporter: cleanReporter,
        ordersCount: finalOrdersCount,
        employees: sanitizedEmployees,
        revenue: {
          gotowka: parseSafeNumber(revenue.gotowka),
          karta: parseSafeNumber(revenue.karta),
          aplikacje: parseSafeNumber(revenue.aplikacje),
          raportFiskalny: parseSafeNumber(revenue.raportFiskalny),
          roznica: parseSafeNumber(revenue.roznica),
        },
        expenses: sanitizedExpenses,
        vegetables: mergeInventorySectionForSave(existingData?.vegetables, vegetables, explicitlyZeroed),
        farutex: mergeInventorySectionForSave(existingData?.farutex, farutex, explicitlyZeroed),
        freezer: mergeInventorySectionForSave(existingData?.freezer, freezer, explicitlyZeroed),
        meat1: mergeInventorySectionForSave(existingData?.meat1, meat1, explicitlyZeroed),
        meat2: mergeInventorySectionForSave(existingData?.meat2, meat2, explicitlyZeroed),
        otherItems: mergeInventorySectionForSave(existingData?.otherItems, otherItems, explicitlyZeroed),
        customSections: sanitizedCustomSections,
        sauces: Array.isArray(sauces) ? sauces.map(String) : [],
        saucesNote: String(saucesNote || "").trim(),
        notes: String(notes || "").trim(),
        issueStatuses: existingData?.issueStatuses || {},
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        await ensureAuth();
        await setDoc(doc(db, "artifacts", appId, "public", "data", "daily_reports", deterministicId), data);
      } else {
        const currentReports = getLocalData(LS_REPORTS_KEY, []);
        const filtered = currentReports.filter((r) => r.id !== deterministicId && !(r.date === data.date && r.location === data.location));
        setLocalData(LS_REPORTS_KEY, [...filtered, { ...data, id: deterministicId }]);
      }

      clearDraft();
      setIsDirty(false);

      if (!isAdminEdit) {
        try { localStorage.removeItem(`note_${location}`); } catch (err) { console.error("LocalStorage remove error:", err); }
      }

      onShowModal(
        isAdminEdit
          ? `Raport z dnia ${data.date} (${data.location}) został pomyślnie zaktualizowany!`
          : "Raport dla tego punktu został pomyślnie zapisany w bazie danych!"
      );
      onBack();
    } catch (err) {
      console.error("Błąd zapisu raportu:", err);
      onShowModal("Wystąpił błąd podczas zapisywania raportu. Upewnij się, że masz połączenie z internetem oraz poprawną konfigurację Firebase.");
    } finally {
      setLoading(false);
    }
  };

  const currentDay = getDayOfWeekFromDateStr(todayStr);
  const deliveryDaysConfig = catalog?.deliveryDays || DEFAULT_CATALOG.deliveryDays;

  const isDeliveryDayFor = (key, fallbackDays = []) => {
    const rawArr = deliveryDaysConfig?.[key] !== undefined ? deliveryDaysConfig[key] : fallbackDays;
    return Array.isArray(rawArr) ? rawArr.map(Number).includes(currentDay) : false;
  };

  const getDeliverySubtitle = (key, fallbackDays = []) => {
    const rawArr = deliveryDaysConfig?.[key] !== undefined ? deliveryDaysConfig[key] : fallbackDays;
    const list = Array.isArray(rawArr) ? rawArr.map(Number) : [];
    if (list.length === 0) return "Brak przypisanych dni";
    const names = DAYS_OF_WEEK.filter((d) => list.includes(d.id)).map((d) => d.name);
    return `Zadanie na: ${names.join(", ")}`;
  };

  const isVegDay = isDeliveryDayFor("vegetables", DEFAULT_DELIVERY_DAYS.vegetables);
  const isFreezerDay = isDeliveryDayFor("freezer", DEFAULT_DELIVERY_DAYS.freezer);
  const isFarutexDay = isDeliveryDayFor("farutex", DEFAULT_DELIVERY_DAYS.farutex);
  const isMeat1Day = isDeliveryDayFor("meat1", DEFAULT_DELIVERY_DAYS.meat1);
  const isMeat2Day = isDeliveryDayFor("meat2", DEFAULT_DELIVERY_DAYS.meat2);
  const isOtherDay = isDeliveryDayFor("otherItems", DEFAULT_DELIVERY_DAYS.otherItems);
  const isSaucesDay = isDeliveryDayFor("sauces", DEFAULT_DELIVERY_DAYS.sauces);

  const showGeneral = activeFormTab === "all" || activeFormTab === "general";
  const showVegFreezer = activeFormTab === "all" || activeFormTab === "veg_freezer";
  const showDeliveries = activeFormTab === "all" || activeFormTab === "deliveries";
  const showSaucesOther = activeFormTab === "all" || activeFormTab === "sauces_other";
  const showInventorySearchBar = showVegFreezer || showDeliveries || showSaucesOther;

  const totalShiftExpenses = useMemo(() => calculateTotalExpenses(expenses), [expenses]);

  const renderDeliveryBadge = (filled, total, isToday, activeColorClass) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="bg-gray-100 text-gray-700 text-[11px] font-black px-2.5 py-1 rounded-full">
        {filled} / {total}
      </span>
      {isToday ? (
        <span className={`${activeColorClass} text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm text-center`}>
          Do uzupełnienia dziś
        </span>
      ) : (
        <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider text-center">
          Zadanie nieprzypadające na dziś
        </span>
      )}
    </div>
  );

  return (
    <div className="pb-28">
      <ConfirmExitModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => { setShowExitConfirm(false); onBack(); }}
      />

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200 px-4 py-3 shadow-sm max-w-full">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={() => (isDirty ? setShowExitConfirm(true) : onBack())}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full mr-3 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 truncate">
              <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl truncate">
                {isAdminEdit ? `Edycja Archiwum: ${location}` : `Raport: ${location}`}
              </h1>
              <p className="text-xs font-semibold text-gray-500 truncate flex items-center gap-1.5">
                {isAdminEdit ? `Modyfikujesz raport z dnia ${todayStr}` : isEdit ? "Aktualizujesz dzisiejszy raport" : "Wypełniasz nowy raport"}
                {isDirty && !isAdminEdit && (
                  <span className="inline-flex items-center text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Save className="w-3 h-3 mr-1" /> Szkic zapisany
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-black shadow-inner ml-2 ${isAdminEdit ? "bg-purple-100 text-purple-700" : isEdit ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {todayStr}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-3 pt-2 border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "Wszystko" },
            { id: "general", label: "Ogólne & Finanse" },
            { id: "veg_freezer", label: `Warzywa & Mroźnia (${countFilledInRecord(vegetables, vegList) + countFilledInRecord(freezer, freezerList)})` },
            { id: "deliveries", label: `Magazyn & Dostawy (${countFilledInRecord(farutex, farutexList) + countFilledInRecord(meat1, meat1List) + countFilledInRecord(meat2, meat2List)})` },
            { id: "sauces_other", label: `Sosy, Braki & Inne (${sauces.length + countFilledInRecord(otherItems, otherItemsList)})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFormTab(t.id)}
              className={`px-3.5 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap transition-colors ${activeFormTab === t.id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 overflow-x-hidden">
        <UrgentTasksBanner
          tasks={tasks}
          location={location}
          todayStr={todayStr}
          onCompleteTask={onCompleteTask}
        />

        {inNightWindow && !isAdminEdit && onChangeGastroDate && (
          <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs font-bold">
              <Moon className="w-5 h-5 mr-2 text-amber-400 shrink-0" />
              <span>Jest po północy. Zapisujesz raport na dzień: <strong className="text-amber-300 underline">{todayStr}</strong></span>
            </div>
            <div className="flex gap-2 shrink-0">
              {[
                { date: yesterdayStr, label: "Wczoraj" },
                { date: calendarTodayStr, label: "Dziś" },
              ].map((opt) => (
                <button
                  key={opt.date}
                  type="button"
                  onClick={() => onChangeGastroDate(opt.date)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors ${todayStr === opt.date ? "bg-amber-400 text-gray-950" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                >
                  {opt.label} ({opt.date})
                </button>
              ))}
            </div>
          </div>
        )}

        {hasRestoredDraft && !isAdminEdit && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs font-bold text-blue-900">
              <Save className="w-5 h-5 mr-2 text-blue-600 shrink-0" />
              Przywrócono automatycznie zapisany szkic formularza z pamięci Twojego urządzenia.
            </div>
            <button
              type="button"
              onClick={() => { clearDraft(); window.location.reload(); }}
              className="text-xs font-black text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200 shrink-0 self-start sm:self-center"
            >
              Odrzuć szkic
            </button>
          </div>
        )}

        {hasLoadedFromPrevious && previousReport && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs font-bold text-emerald-950">
              <RotateCcw className="w-5 h-5 mr-2.5 text-emerald-600 shrink-0" />
              <span>
                Wczytano ostatnie stany magazynowe z dnia <strong className="underline">{previousReport.date}</strong> — skoryguj tylko zmiany (+/-).
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetAllInventoryToZero}
              className="text-xs font-black text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200 shrink-0 self-start sm:self-center transition-colors"
            >
              Wyzeruj wszystkie stany do 0
            </button>
          </div>
        )}

        {showGeneral && !isAdminEdit && (
          <div className="bg-yellow-50 p-6 rounded-[2rem] border-2 border-yellow-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <StickyNote className="w-40 h-40 text-yellow-600" />
            </div>
            <h3 className="font-extrabold text-yellow-900 mb-1 flex items-center relative z-10">
              <StickyNote className="w-5 h-5 mr-2" /> Brudnopis Zmiany
            </h3>
            <p className="text-sm text-yellow-700/80 mb-4 font-semibold relative z-10">
              Zapisuj tu braki "na gorąco". Tekst zostaje w telefonie.
            </p>
            <textarea
              value={quickNote}
              onChange={handleNoteChange}
              rows="3"
              className="w-full p-4 bg-white/80 border border-yellow-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-gray-800 relative z-10"
              placeholder="Wpisz np. brak widelców, spalona żarówka..."
            />
          </div>
        )}

        {showGeneral && (
          <>
            <Section title="Informacje Ogólne" icon={Users} bgClass="bg-white border-gray-200">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase ml-2 block mb-1">Osoba wypełniająca raport (Punkt: {location})</label>
                  <select
                    required
                    value={reporter}
                    onChange={(e) => { setIsDirty(true); setReporter(e.target.value); }}
                    className="w-full p-4 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 shadow-inner"
                  >
                    <option value="">— Wybierz pracownika z listy ({location}) —</option>
                    {reporter && !locationEmployeesList.includes(reporter) && (
                      <option value={reporter}>{reporter}</option>
                    )}
                    {locationEmployeesList.map((empName) => (
                      <option key={empName} value={empName}>{empName}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-black text-gray-500 uppercase ml-2 block mb-3">Godziny pracy personelu (max 3 osoby z lokalu {location})</label>
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => {
                      const currentEmpName = employees[i]?.name || "";
                      return (
                        <div key={i} className="flex gap-2 flex-wrap sm:flex-nowrap">
                          <select
                            value={currentEmpName}
                            onChange={(e) => updateEmployee(i, "name", e.target.value)}
                            className="flex-[2] min-w-[150px] p-4 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm shadow-inner text-gray-900"
                          >
                            <option value="">{`— Pracownik ${i + 1} (${location}) —`}</option>
                            {currentEmpName && !locationEmployeesList.includes(currentEmpName) && (
                              <option value={currentEmpName}>{currentEmpName}</option>
                            )}
                            {locationEmployeesList.map((empName) => (
                              <option key={empName} value={empName}>{empName}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={employees[i]?.hours || ""}
                            onChange={(e) => updateEmployee(i, "hours", e.target.value)}
                            className="flex-1 min-w-[100px] p-4 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm text-center shadow-inner"
                            placeholder="np. 10-22 lub 10:30-22"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Zestawienie Utargów i Kasy" icon={Banknote} titleColor="text-emerald-800" bgClass="bg-emerald-50/30 border-emerald-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "gotowka", label: "Gotówka" },
                  { key: "karta", label: "Karta Płatnicza" },
                  { key: "aplikacje", label: "Aplikacje (Uber/Glovo itp)" },
                  { key: "raportFiskalny", label: "Raport Fiskalny (Do Płatności)", isFiscal: true },
                  { key: "roznica", label: "Brak / Nadwyżka" },
                ].map(({ key, label, isFiscal }) => (
                  <div key={key} className="sm:col-span-1">
                    <label className={`block text-[11px] font-black mb-1.5 uppercase ml-2 ${isFiscal ? "text-indigo-800" : "text-emerald-700/70"}`}>{label}</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={revenue[key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^-?\d*[.,]?\d*$/.test(val)) {
                            setIsDirty(true);
                            setRevenue((prev) => ({ ...prev, [key]: val }));
                          }
                        }}
                        className={`w-full p-4 pl-4 pr-12 bg-white border rounded-xl outline-none font-black text-xl text-gray-900 shadow-inner transition-colors ${isFiscal ? "border-indigo-300 focus:ring-2 focus:ring-indigo-500" : "border-emerald-200 focus:ring-2 focus:ring-emerald-500"}`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">PLN</span>
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-black mb-1.5 uppercase ml-2 text-blue-800">
                    Liczba zamówień / paragonów (opcjonalnie)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ordersCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) {
                          setIsDirty(true);
                          setOrdersCount(val);
                        }
                      }}
                      className="w-full p-4 pl-4 pr-20 bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 rounded-xl outline-none font-black text-xl text-gray-900 shadow-inner transition-colors"
                      placeholder={estimatedOrdersFromRevenue > 0 ? `auto: ~${estimatedOrdersFromRevenue}` : "0"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs">ZAM.</span>
                  </div>
                  <span className="block text-[10px] font-bold text-gray-500 mt-1 ml-2">
                    Jeśli puste, system wyliczy automatycznie z utargu (~{DEFAULT_AVG_ORDER_VALUE} zł / zam.{estimatedOrdersFromRevenue > 0 ? ` = ${estimatedOrdersFromRevenue} zam.` : ""})
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-emerald-200/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950 flex items-center">
                      <Wallet className="w-4 h-4 mr-1.5 text-emerald-700" /> Wydatki z kasy na zmianie (KW / Zakupy towaru z gotówki)
                    </h4>
                    <p className="text-xs text-emerald-700/80 font-medium">Jeśli brałeś gotówkę z kasy na zakupy (np. sałata, cytryna, serwis), dodaj pozycję poniżej.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExpenseRow}
                    className="self-start sm:self-center shrink-0 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl flex items-center transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" /> Dodaj wydatek z kasy
                  </button>
                </div>

                {expenses.length > 0 && (
                  <div className="space-y-2.5 mt-3">
                    {expenses.map((exp, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm">
                        <input
                          type="text"
                          value={exp.description}
                          onChange={(e) => handleUpdateExpenseRow(idx, "description", e.target.value)}
                          placeholder="Na co wydano? (np. Sałata Biedronka, ręczniki)"
                          className="flex-[2] min-w-[160px] p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
                        />
                        <div className="relative flex-1 min-w-[110px]">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={exp.amount}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "" || /^\d*[.,]?\d*$/.test(v)) handleUpdateExpenseRow(idx, "amount", v);
                            }}
                            placeholder="Kwota"
                            className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">zł</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveExpenseRow(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Usuń wydatek">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-end items-center text-xs font-black text-emerald-900 pt-1 pr-2">
                      Suma wydatków z kasy: {totalShiftExpenses.toFixed(2)} PLN
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {showInventorySearchBar && (
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-600 ml-1 shrink-0" />
            <input
              type="text"
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              placeholder="Filtruj asortyment przypisany do tego punktu..."
              className="w-full bg-transparent font-bold text-sm text-gray-900 outline-none"
            />
            {itemSearchQuery && (
              <button type="button" onClick={() => setItemSearchQuery("")} className="text-xs font-black text-gray-500 hover:text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                Wyczyść
              </button>
            )}
          </div>
        )}

        {showVegFreezer && (
          <>
            <Section
              title="Warzywa i Inne"
              icon={Leaf}
              titleColor={isVegDay ? "text-green-800" : "text-gray-900"}
              bgClass={isVegDay ? "bg-green-50/40 border-green-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isVegDay || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("vegetables", DEFAULT_DELIVERY_DAYS.vegetables)}
              badge={renderDeliveryBadge(countFilledInRecord(vegetables, vegList), vegList.length, isVegDay, "bg-green-600")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {filterBySearch(vegList).map((item) => (
                  <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={vegetables[item]} onItemChange={handleVegChange} onExplicitZero={markItemExplicitlyZeroed} />
                ))}
              </div>
            </Section>

            <Section
              title="Stan Zamrażarek"
              icon={Snowflake}
              titleColor={isFreezerDay ? "text-blue-800" : "text-gray-900"}
              bgClass={isFreezerDay ? "bg-blue-50/40 border-blue-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isFreezerDay || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("freezer", DEFAULT_DELIVERY_DAYS.freezer)}
              badge={renderDeliveryBadge(countFilledInRecord(freezer, freezerList), freezerList.length, isFreezerDay, "bg-blue-600")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {filterBySearch(freezerList).map((item) => (
                  <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={freezer[item]} onItemChange={handleFreezerChange} onExplicitZero={markItemExplicitlyZeroed} />
                ))}
              </div>
            </Section>
          </>
        )}

        {showDeliveries && (
          <>
            <Section
              title=" Farutex"
              icon={Truck}
              titleColor={isFarutexDay ? "text-orange-800" : "text-gray-900"}
              bgClass={isFarutexDay ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isFarutexDay || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("farutex", DEFAULT_DELIVERY_DAYS.farutex)}
              badge={renderDeliveryBadge(countFilledInRecord(farutex, farutexList), farutexList.length, isFarutexDay, "bg-orange-600")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {filterBySearch(farutexList).map((item) => (
                  <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={farutex[item]} onItemChange={handleFarutexChange} onExplicitZero={markItemExplicitlyZeroed} />
                ))}
              </div>
            </Section>

            <Section
              title="Dostawa Mięso 1"
              icon={Package}
              titleColor={isMeat1Day ? "text-red-800" : "text-gray-900"}
              bgClass={isMeat1Day ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isMeat1Day || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("meat1", DEFAULT_DELIVERY_DAYS.meat1)}
              badge={renderDeliveryBadge(countFilledInRecord(meat1, meat1List), meat1List.length, isMeat1Day, "bg-red-600")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {filterBySearch(meat1List).map((item) => (
                  <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={meat1[item]} onItemChange={handleMeat1Change} onExplicitZero={markItemExplicitlyZeroed} />
                ))}
              </div>
            </Section>

            <Section
              title="Dostawa Mięso 2"
              icon={Package}
              titleColor={isMeat2Day ? "text-red-800" : "text-gray-900"}
              bgClass={isMeat2Day ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isMeat2Day || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("meat2", DEFAULT_DELIVERY_DAYS.meat2)}
              badge={renderDeliveryBadge(countFilledInRecord(meat2, meat2List), meat2List.length, isMeat2Day, "bg-red-600")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {filterBySearch(meat2List).map((item) => (
                  <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={meat2[item]} onItemChange={handleMeat2Change} onExplicitZero={markItemExplicitlyZeroed} />
                ))}
              </div>
            </Section>
          </>
        )}

        {showSaucesOther && (
          <>
            {otherItemsList.length > 0 && (
              <Section
                title="Inne: Opakowania / Chemia"
                icon={Package}
                titleColor={isOtherDay ? "text-purple-800" : "text-gray-900"}
                bgClass={isOtherDay ? "bg-purple-50/40 border-purple-200" : "bg-white border-gray-200"}
                collapsible={true}
                defaultExpanded={isOtherDay || !!itemSearchQuery}
                subtitle={getDeliverySubtitle("otherItems", DEFAULT_DELIVERY_DAYS.otherItems)}
                badge={renderDeliveryBadge(countFilledInRecord(otherItems, otherItemsList), otherItemsList.length, isOtherDay, "bg-purple-600")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {filterBySearch(otherItemsList).map((item) => (
                    <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={otherItems[item]} onItemChange={handleOtherItemsChange} onExplicitZero={markItemExplicitlyZeroed} />
                  ))}
                </div>
              </Section>
            )}

            {customCategories.map((cat) => {
              const rawItems = Array.isArray(cat.items) ? cat.items : [];
              const catItems = rawItems.filter((item) => isItemAllowedForLocation(catalog, `custom:${cat.id}`, item, location));
              if (catItems.length === 0) return null;
              const customScheduleKey = `custom_${cat.id}`;
              const isCustomDay = isDeliveryDayFor(customScheduleKey, [1, 2, 3, 4, 5, 6, 0]);
              const customSub = getDeliverySubtitle(customScheduleKey, [1, 2, 3, 4, 5, 6, 0]);

              if (cat.type === "checkbox") {
                const checkedList = Array.isArray(customSections[cat.id]) ? customSections[cat.id] : [];
                return (
                  <Section
                    key={cat.id}
                    title={cat.name}
                    icon={Package}
                    titleColor={isCustomDay ? "text-indigo-800" : "text-gray-900"}
                    bgClass={isCustomDay ? "bg-indigo-50/40 border-indigo-200" : "bg-white border-gray-200"}
                    collapsible={true}
                    defaultExpanded={isCustomDay || !!itemSearchQuery}
                    subtitle={customSub}
                    badge={renderDeliveryBadge(checkedList.length, catItems.length, isCustomDay, "bg-indigo-600")}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filterBySearch(catItems).map((item) => {
                        const checked = checkedList.includes(item);
                        return (
                          <div
                            key={item}
                            role="checkbox"
                            aria-checked={checked}
                            tabIndex={0}
                            onClick={() => handleCustomCheckboxToggle(cat.id, item)}
                            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleCustomCheckboxToggle(cat.id, item); } }}
                            className={`flex items-center p-4 rounded-xl cursor-pointer transition-colors border-2 select-none touch-manipulation ${checked ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-gray-50 border-transparent hover:bg-gray-100"}`}
                          >
                            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mr-3 transition-colors border-2 ${checked ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"}`}>
                              {checked && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                            <span className={`text-sm font-bold truncate ${checked ? "text-indigo-900" : "text-gray-700"}`}>{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                );
              }

              const valObj = customSections[cat.id] && typeof customSections[cat.id] === "object" ? customSections[cat.id] : {};
              return (
                <Section
                  key={cat.id}
                  title={cat.name}
                  icon={Package}
                  titleColor={isCustomDay ? "text-indigo-800" : "text-gray-900"}
                  bgClass={isCustomDay ? "bg-indigo-50/40 border-indigo-200" : "bg-white border-gray-200"}
                  collapsible={true}
                  defaultExpanded={isCustomDay || !!itemSearchQuery}
                  subtitle={customSub}
                  badge={renderDeliveryBadge(countFilledInRecord(valObj, catItems), catItems.length, isCustomDay, "bg-indigo-600")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    {filterBySearch(catItems).map((item) => (
                      <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={valObj[item]} onChange={(v) => handleCustomCounterChange(cat.id, item, v)} onExplicitZero={markItemExplicitlyZeroed} />
                    ))}
                  </div>
                </Section>
              );
            })}

            <Section
              title="Braki: Sosy"
              titleColor={isSaucesDay ? "text-blue-800" : "text-gray-900"}
              bgClass={isSaucesDay ? "bg-blue-50/30 border-blue-200" : "bg-white border-gray-200"}
              collapsible={true}
              defaultExpanded={isSaucesDay || !!itemSearchQuery}
              subtitle={getDeliverySubtitle("sauces", DEFAULT_DELIVERY_DAYS.sauces)}
              badge={renderDeliveryBadge(sauces.length, saucesList.length, isSaucesDay, "bg-blue-600")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filterBySearch(saucesList).map((s) => {
                  const checked = Array.isArray(sauces) && sauces.includes(s);
                  return (
                    <div
                      key={s}
                      role="checkbox"
                      aria-checked={checked}
                      tabIndex={0}
                      onClick={() => handleSauceToggle(s)}
                      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleSauceToggle(s); } }}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-colors border-2 select-none touch-manipulation ${checked ? "bg-blue-50 border-blue-400 shadow-sm" : "bg-gray-50 border-transparent hover:bg-gray-100"}`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mr-3 transition-colors border-2 ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>
                        {checked && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <span className={`text-sm font-bold truncate ${checked ? "text-blue-900" : "text-gray-700"}`}>{s}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-black text-gray-500 uppercase ml-2 block mb-1.5">Uwagi do sosów / dodatkowe informacje</label>
                <input
                  type="text"
                  value={saucesNote}
                  onChange={(e) => { setIsDirty(true); setSaucesNote(e.target.value); }}
                  className="w-full p-4 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-gray-900 shadow-inner text-sm"
                  placeholder="Np. zostało pół wiadra czosnkowego, trzeba dorobić ostry rano..."
                />
              </div>
            </Section>

            <Section title="Uwagi końcowe" icon={Beaker}>
              <textarea
                value={notes}
                onChange={(e) => { setIsDirty(true); setNotes(e.target.value); }}
                rows="4"
                className="w-full p-4 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-gray-900 shadow-inner"
                placeholder="Nietypowe braki (np. środki czystości, opakowania spoza standardowej listy, awarie)..."
              />
            </Section>
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-4xl mx-auto">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 text-white font-black text-xl rounded-2xl shadow-xl flex justify-center items-center active:scale-[0.98] transition-transform disabled:opacity-70 ${isAdminEdit ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30" : isEdit ? "bg-green-600 hover:bg-green-700 shadow-green-600/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}
            >
              {loading ? (
                "Przetwarzanie danych..."
              ) : isAdminEdit ? (
                <><CheckCircle2 className="w-7 h-7 mr-3" /> Zapisz Zmiany w Archiwum ({todayStr})</>
              ) : isEdit ? (
                <><CheckCircle2 className="w-7 h-7 mr-3" /> Zaktualizuj Raport</>
              ) : (
                <><Send className="w-7 h-7 mr-3" /> Wyślij Raport Dzienny</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function NysaWarehouseForm({
  db,
  appId,
  existingData,
  previousWarehouseData,
  catalog,
  onBack,
  todayStr,
  onShowModal,
}) {
  const isEdit = !!existingData;
  const [loading, setLoading] = useState(false);

  const draftKey = `kebab_nysa_draft_${appId}_${todayStr}`;
  const [savedDraft] = useState(() => getLocalData(draftKey, null));
  const [hasLoadedFromPrevious, setHasLoadedFromPrevious] = useState(() => !existingData && !savedDraft && !!previousWarehouseData);
  const [explicitlyZeroed, setExplicitlyZeroed] = useState({});

  const [food, setFood] = useState(() => buildInitialSectionState(previousWarehouseData?.food, existingData?.food, savedDraft?.food));
  const [pack, setPack] = useState(() => buildInitialSectionState(previousWarehouseData?.pack, existingData?.pack, savedDraft?.pack));
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!existingData) return;
    setFood((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.food || {}) }));
    setPack((prev) => (hasAnyPositiveValue(prev) ? prev : { ...prev, ...(existingData.pack || {}) }));
  }, [existingData]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ food, pack })); } catch (e) { console.error(e); }
    }, 350);
    return () => clearTimeout(timer);
  }, [food, pack, isDirty, draftKey]);

  const handleFoodChange = useCallback((item, v) => { setIsDirty(true); setFood((p) => ({ ...p, [item]: v })); }, []);
  const handlePackChange = useCallback((item, v) => { setIsDirty(true); setPack((p) => ({ ...p, [item]: v })); }, []);
  const markZeroed = useCallback((itemKey) => { setExplicitlyZeroed((prev) => ({ ...prev, [itemKey]: true })); }, []);

  const nysaFoodList = (catalog?.nysaFood || DEFAULT_CATALOG.nysaFood).filter((it) => isItemAllowedForLocation(catalog, "nysaFood", it, "Nysa"));
  const nysaPackList = (catalog?.nysaPack || DEFAULT_CATALOG.nysaPack).filter((it) => isItemAllowedForLocation(catalog, "nysaPack", it, "Nysa"));

  const filterList = (list) => {
    const q = searchQuery.trim().toLowerCase();
    return q ? list.filter((x) => x.toLowerCase().includes(q)) : list;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const targetDate = String(todayStr || getGastroTodayString());
      const deterministicId = `${targetDate}_Nysa`;
      const data = {
        date: targetDate,
        food: mergeInventorySectionForSave(existingData?.food, food, explicitlyZeroed),
        pack: mergeInventorySectionForSave(existingData?.pack, pack, explicitlyZeroed),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        await ensureAuth();
        await setDoc(doc(db, "artifacts", appId, "public", "data", "nysa_warehouse", deterministicId), data);
      } else {
        const currentNysa = getLocalData(LS_NYSA_KEY, []);
        const filtered = currentNysa.filter((n) => n.id !== deterministicId && n.date !== data.date);
        setLocalData(LS_NYSA_KEY, [...filtered, { ...data, id: deterministicId }]);
      }

      try { localStorage.removeItem(draftKey); } catch (e) { console.error(e); }
      setIsDirty(false);
      onShowModal("Stan Magazynu Nysa został pomyślnie zaktualizowany.");
      onBack();
    } catch (err) {
      console.error(err);
      onShowModal("Wystąpił błąd zapisu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-28">
      <ConfirmExitModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => { setShowExitConfirm(false); onBack(); }}
      />

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm max-w-full overflow-hidden">
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => (isDirty ? setShowExitConfirm(true) : onBack())}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full mr-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 truncate">
            <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl truncate">Magazyn Główny Nysa</h1>
            <p className="text-xs font-semibold text-gray-500 truncate">
              {isEdit ? `Edycja stanu (${todayStr})` : `Uzupełniasz stan (${todayStr})`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 overflow-x-hidden">
        {hasLoadedFromPrevious && previousWarehouseData && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs font-bold text-purple-950">
              <RotateCcw className="w-5 h-5 mr-2.5 text-purple-600 shrink-0" />
              <span>Wczytano ostatnie stany Magazynu Nysa z dnia <strong className="underline">{previousWarehouseData.date}</strong> — skoryguj tylko zmiany (+/-).</span>
            </div>
            <button
              type="button"
              onClick={() => { setIsDirty(true); setHasLoadedFromPrevious(false); setFood({}); setPack({}); }}
              className="text-xs font-black text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200 shrink-0 self-start sm:self-center"
            >
              Wyzeruj wszystkie stany do 0
            </button>
          </div>
        )}

        <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-purple-600 ml-1 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtruj asortyment magazynu Nysa..."
            className="w-full bg-transparent font-bold text-sm text-gray-900 outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-xs font-black text-gray-500 hover:text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
              Wyczyść
            </button>
          )}
        </div>

        {[
          { title: "Żywność", icon: ChefHat, list: nysaFoodList, state: food, handler: handleFoodChange },
          { title: "Opakowania", icon: Package, list: nysaPackList, state: pack, handler: handlePackChange },
        ].map(({ title, icon: Icon, list, state, handler }) => (
          <div key={title} className="p-4 sm:p-6 rounded-[2rem] border border-purple-200 bg-purple-50/30 shadow-sm">
            <h3 className="font-extrabold text-xl text-purple-900 mb-5 flex items-center">
              <Icon className="w-6 h-6 mr-2 opacity-80" /> {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              {filterList(list).map((item) => (
                <Counter key={item} itemKey={item} label={item} unit={getItemUnit(catalog, item)} value={state[item]} onItemChange={handler} onExplicitZero={markZeroed} />
              ))}
            </div>
          </div>
        ))}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-4xl mx-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 text-white font-black text-xl rounded-2xl shadow-xl shadow-purple-600/30 flex justify-center items-center active:scale-95 transition-transform bg-purple-600 hover:bg-purple-700 disabled:opacity-70"
            >
              {loading ? "Trwa zapis..." : isEdit ? "Zaktualizuj Stan Magazynu" : "Zapisz Stan Magazynu"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
function AdminPanel({
  db,
  appId,
  role,
  name,
  onLogout,
  allReports = [],
  allNysaWarehouse = [],
  tasks = [],
  catalog,
  onSaveCatalog,
  todayStr,
  onEditHistoricalReport,
  onShowModal,
}) {
  const isOwner = role === "owner";
  const isKlodzkoAdmin = role === "klodzko_admin";
  const hasFullAnalytics = isOwner || isKlodzkoAdmin;
  const allowedLocations = useMemo(() => (isKlodzkoAdmin ? ["Kłodzko"] : LOCATIONS), [isKlodzkoAdmin]);

  const [tab, setTab] = useState(hasFullAnalytics ? "reports" : "tasks");
  const [newTask, setNewTask] = useState("");
  const [newTaskLoc, setNewTaskLoc] = useState(isKlodzkoAdmin ? "Kłodzko" : "All");
  const [newTaskType, setNewTaskType] = useState("adhoc");
  const [newTaskDays, setNewTaskDays] = useState([1, 3, 5]);
  const [newTaskDeadline, setNewTaskDeadline] = useState("18:00");

  const [selectedReportDate, setSelectedReportDate] = useState(todayStr);

  const [summaryPeriodMode, setSummaryPeriodMode] = useState("day");
  const defaultWeek = getWeekBounds(todayStr);
  const [summaryStartDate, setSummaryStartDate] = useState(defaultWeek.start);
  const [summaryEndDate, setSummaryEndDate] = useState(defaultWeek.end);

  const [paymentBreakdownLoc, setPaymentBreakdownLoc] = useState(isKlodzkoAdmin ? "Kłodzko" : "All");

  const [statsLocation, setStatsLocation] = useState(isKlodzkoAdmin ? "Kłodzko" : "All");
  const [statsFilterMode, setStatsFilterMode] = useState("week");
  const [statsWeekRefDate, setStatsWeekRefDate] = useState(todayStr);
  const [statsCustomStart, setStatsCustomStart] = useState(() => getWeekBounds(todayStr).start);
  const [statsCustomEnd, setStatsCustomEnd] = useState(() => getWeekBounds(todayStr).end);

  const [hoursLocation, setHoursLocation] = useState(isKlodzkoAdmin ? "Kłodzko" : "All");
  const [hoursStartDate, setHoursStartDate] = useState(() => getWeekBounds(todayStr).start);
  const [hoursEndDate, setHoursEndDate] = useState(() => getWeekBounds(todayStr).end);

  const [inventoryLocFilter, setInventoryLocFilter] = useState(isKlodzkoAdmin ? "Kłodzko" : "All");
  const [avgOrderFallbackVal, setAvgOrderFallbackVal] = useState(String(DEFAULT_AVG_ORDER_VALUE));

  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("vegetables");
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("szt.");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("counter");
  const [pinDrafts, setPinDrafts] = useState(catalog?.locationPins || DEFAULT_LOCATION_PINS);

  const [selectedEmpManageLoc, setSelectedEmpManageLoc] = useState(isKlodzkoAdmin ? "Kłodzko" : "Opole");
  const [newEmployeeName, setNewEmployeeName] = useState("");

  const [deliveryDaysDraft, setDeliveryDaysDraft] = useState(() => ({
    ...DEFAULT_DELIVERY_DAYS,
    ...(catalog?.deliveryDays || {}),
  }));

  useEffect(() => {
    if (catalog?.locationPins) setPinDrafts(catalog.locationPins);
    if (catalog?.deliveryDays) {
      setDeliveryDaysDraft({ ...DEFAULT_DELIVERY_DAYS, ...catalog.deliveryDays });
    }
  }, [catalog]);

  const formatMoney = (val) => parseSafeNumber(val).toFixed(2);

  const roleFilteredAllReports = useMemo(
    () => (isKlodzkoAdmin ? allReports.filter((r) => r?.location === "Kłodzko") : allReports),
    [allReports, isKlodzkoAdmin]
  );

  const reportsForSelectedDate = useMemo(
    () => roleFilteredAllReports.filter((r) => r?.date === selectedReportDate),
    [roleFilteredAllReports, selectedReportDate]
  );

  const reportsForSummaryPeriod = useMemo(() => {
    if (summaryPeriodMode === "day") return roleFilteredAllReports.filter((r) => r?.date === selectedReportDate);
    if (summaryPeriodMode === "week") {
      const wb = getWeekBounds(selectedReportDate);
      return roleFilteredAllReports.filter((r) => r?.date && r.date >= wb.start && r.date <= wb.end);
    }
    if (summaryPeriodMode === "range") {
      return roleFilteredAllReports.filter(
        (r) => r?.date && (!summaryStartDate || r.date >= summaryStartDate) && (!summaryEndDate || r.date <= summaryEndDate)
      );
    }
    return roleFilteredAllReports.filter((r) => r?.date === selectedReportDate);
  }, [roleFilteredAllReports, summaryPeriodMode, selectedReportDate, summaryStartDate, summaryEndDate]);

  const handleDownloadFullBackupJSON = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        exportedBy: name,
        reports: roleFilteredAllReports,
        nysaWarehouse: isKlodzkoAdmin ? [] : allNysaWarehouse,
        catalog: isOwner ? catalog : undefined,
      };
      downloadFile(JSON.stringify(payload, null, 2), `Kopia_Bazy_Raporty_${getCalendarTodayString()}.json`, "application/json;charset=utf-8;");
      onShowModal("Pobrano pełną kopię zapasową bazy danych (plik JSON)!");
    } catch (e) {
      console.error("Błąd eksportu JSON:", e);
      onShowModal("Wystąpił błąd podczas generowania kopii zapasowej.");
    }
  };

  const handleDownloadCSV = () => {
    try {
      const headers = [
        "Data", "Punkt", "Osoba raportujaca", "Liczba zamowien", "Gotowka (PLN)", "Karta (PLN)", "Aplikacje (PLN)",
        "Utarg Laczny (PLN)", "Raport Fiskalny (PLN)", "Brak / Nadwyzka (PLN)", "Wydatki z kasy KW (PLN)",
        "Gotowka w kasetce po KW (PLN)", "Obsada i godziny", "Braki sosow", "Uwagi koncowe",
      ];
      const sorted = [...roleFilteredAllReports].sort((a, b) => ((a?.date || "") < (b?.date || "") ? 1 : -1));
      const rows = sorted.map((r) => {
        const got = parseSafeNumber(r?.revenue?.gotowka);
        const kar = parseSafeNumber(r?.revenue?.karta);
        const apl = parseSafeNumber(r?.revenue?.aplikacje);
        const tot = got + kar + apl;
        const orders = getEffectiveOrdersCount(r, parseSafeNumber(avgOrderFallbackVal) || DEFAULT_AVG_ORDER_VALUE);
        const fisk = parseSafeNumber(r?.revenue?.raportFiskalny);
        const roz = parseSafeNumber(r?.revenue?.roznica);
        const kw = calculateTotalExpenses(r?.expenses);
        const cashNet = got - kw;
        const staffStr = Array.isArray(r?.employees)
          ? r.employees.filter((e) => e?.name || e?.hours).map((e) => `${e?.name || ""} (${e?.hours || ""})`).join(" | ")
          : "";
        const saucesStr = Array.isArray(r?.sauces) ? r.sauces.join(", ") : "";
        const cleanNotes = String(r?.notes || "").replace(/[\r\n;]+/g, " ");
        return [
          r?.date || "", r?.location || "", r?.reporter || "", orders, got.toFixed(2), kar.toFixed(2), apl.toFixed(2),
          tot.toFixed(2), fisk.toFixed(2), roz.toFixed(2), kw.toFixed(2), cashNet.toFixed(2),
          `"${staffStr}"`, `"${saucesStr}"`, `"${cleanNotes}"`,
        ].join(";");
      });
      downloadFile("\uFEFF" + [headers.join(";"), ...rows].join("\n"), `Zestawienie_Utargow_${getCalendarTodayString()}.csv`, "text/csv;charset=utf-8;");
      onShowModal("Pobrano zestawienie utargów i godzin do pliku CSV (Excel)!");
    } catch (e) {
      console.error("Błąd eksportu CSV:", e);
      onShowModal("Wystąpił błąd podczas eksportu do CSV.");
    }
  };

  const handleUpdateIssueStatus = async (reportObj, issueKey, nextStatus) => {
    if (!reportObj?.id) return;
    const updatedStatuses = { ...(reportObj.issueStatuses && typeof reportObj.issueStatuses === "object" ? reportObj.issueStatuses : {}), [issueKey]: nextStatus };
    try {
      if (db) {
        await ensureAuth();
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "daily_reports", reportObj.id), {
          issueStatuses: updatedStatuses,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const currentReports = getLocalData(LS_REPORTS_KEY, []);
        setLocalData(LS_REPORTS_KEY, currentReports.map((r) => (r.id === reportObj.id ? { ...r, issueStatuses: updatedStatuses } : r)));
      }
    } catch (err) {
      console.error("Błąd aktualizacji statusu uwagi/braku:", err);
      onShowModal("Nie udało się zapisać statusu w bazie.");
    }
  };

  const renderIssueStatusSwitcher = (reportObj, issueKey) => {
    const currentStatus = reportObj?.issueStatuses?.[issueKey] || "Do załatwienia";
    const statuses = [
      { label: "Do załatwienia", activeClass: "bg-red-600 text-white border-red-600 shadow-sm", inactiveClass: "bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-700" },
      { label: "Zamówione", activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm", inactiveClass: "bg-white text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-700" },
      { label: "Załatwione", activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm", inactiveClass: "bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700" },
    ];
    return (
      <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-gray-200/60">
        {statuses.map((st) => (
          <button
            key={st.label}
            type="button"
            onClick={() => handleUpdateIssueStatus(reportObj, issueKey, st.label)}
            className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors ${currentStatus === st.label ? st.activeClass : st.inactiveClass}`}
          >
            {st.label}
          </button>
        ))}
      </div>
    );
  };

  const builtInCategoriesMeta = [
    { key: "vegetables", label: "Warzywa i Inne (Licznik +/-)" },
    { key: "freezer", label: "Stan Zamrażarek (Licznik +/-)" },
    { key: "farutex", label: " Farutex (Licznik +/-)" },
    { key: "meat1", label: "Dostawa Mięso 1 (Licznik +/-)" },
    { key: "meat2", label: "Dostawa Mięso 2 (Licznik +/-)" },
    { key: "otherItems", label: "Inne: Opakowania / Chemia (Licznik +/-)" },
    { key: "sauces", label: "Braki: Sosy (Lista Checkbox)" },
    { key: "nysaFood", label: "Magazyn Główny Nysa - Żywność (Licznik +/-)" },
    { key: "nysaPack", label: "Magazyn Główny Nysa - Opakowania (Licznik +/-)" },
  ];

  const customCategoriesList = Array.isArray(catalog?.customCategories) ? catalog.customCategories : [];

  const activeCategoryItems = useMemo(() => {
    if (selectedCatalogCategory.startsWith("custom:")) {
      const catId = selectedCatalogCategory.replace("custom:", "");
      const found = customCategoriesList.find((c) => c.id === catId);
      return Array.isArray(found?.items) ? found.items : [];
    }
    return Array.isArray(catalog?.[selectedCatalogCategory]) ? catalog[selectedCatalogCategory] : [];
  }, [selectedCatalogCategory, customCategoriesList, catalog]);

  const handleAddCatalogItem = async (e) => {
    e.preventDefault();
    const clean = newItemName.trim();
    if (!clean) return;
    const nextUnits = { ...(catalog?.itemUnits || DEFAULT_ITEM_UNITS), [clean]: newItemUnit || "szt." };

    if (selectedCatalogCategory.startsWith("custom:")) {
      const catId = selectedCatalogCategory.replace("custom:", "");
      const nextCustom = customCategoriesList.map((cat) => {
        if (cat.id !== catId) return cat;
        const curr = Array.isArray(cat.items) ? cat.items : [];
        return curr.some((x) => x.toLowerCase() === clean.toLowerCase()) ? cat : { ...cat, items: [...curr, clean] };
      });
      await onSaveCatalog({ ...catalog, customCategories: nextCustom, itemUnits: nextUnits }, `Dodano pozycję "${clean}" (${newItemUnit}) do kategorii!`);
    } else {
      const currentList = Array.isArray(catalog?.[selectedCatalogCategory]) ? catalog[selectedCatalogCategory] : [];
      if (currentList.some((x) => x.toLowerCase() === clean.toLowerCase())) {
        onShowModal("Taka pozycja już istnieje w tej kategorii.");
        return;
      }
      await onSaveCatalog({ ...catalog, [selectedCatalogCategory]: [...currentList, clean], itemUnits: nextUnits }, `Dodano pozycję "${clean}" (${newItemUnit})!`);
    }
    setNewItemName("");
  };

  const handleChangeCatalogItemUnit = async (itemName, nextUnit) => {
    const nextUnits = { ...(catalog?.itemUnits || DEFAULT_ITEM_UNITS), [itemName]: nextUnit };
    await onSaveCatalog({ ...catalog, itemUnits: nextUnits });
  };

  const handleRemoveCatalogItem = async (itemToRemove) => {
    const mapKey = `${selectedCatalogCategory}__${itemToRemove}`;
    const nextItemLocs = { ...(catalog?.itemLocations || {}) };
    delete nextItemLocs[mapKey];

    if (selectedCatalogCategory.startsWith("custom:")) {
      const catId = selectedCatalogCategory.replace("custom:", "");
      const nextCustom = customCategoriesList.map((cat) =>
        cat.id !== catId ? cat : { ...cat, items: (cat.items || []).filter((x) => x !== itemToRemove) }
      );
      await onSaveCatalog({ ...catalog, customCategories: nextCustom, itemLocations: nextItemLocs }, `Usunięto pozycję "${itemToRemove}".`);
    } else {
      const currentList = Array.isArray(catalog?.[selectedCatalogCategory]) ? catalog[selectedCatalogCategory] : [];
      await onSaveCatalog({ ...catalog, [selectedCatalogCategory]: currentList.filter((x) => x !== itemToRemove), itemLocations: nextItemLocs }, `Usunięto pozycję "${itemToRemove}".`);
    }
  };

  const handleToggleItemLocation = async (itemName, loc) => {
    const mapKey = `${selectedCatalogCategory}__${itemName}`;
    const currentLocations = Array.isArray(catalog?.itemLocations?.[mapKey])
      ? catalog.itemLocations[mapKey]
      : [...LOCATIONS];
    const nextLocations = currentLocations.includes(loc)
      ? currentLocations.filter((l) => l !== loc)
      : [...currentLocations, loc];
    const nextItemLocations = {
      ...(catalog?.itemLocations || {}),
      [mapKey]: nextLocations,
    };
    await onSaveCatalog({ ...catalog, itemLocations: nextItemLocations });
  };

  const handleAddEmployeeToLocation = async (e) => {
    e.preventDefault();
    const cleanName = newEmployeeName.trim();
    if (!cleanName) return;
    const currentMap = catalog?.employeesByLocation || DEFAULT_EMPLOYEES_BY_LOCATION;
    const locList = Array.isArray(currentMap[selectedEmpManageLoc])
      ? currentMap[selectedEmpManageLoc]
      : DEFAULT_EMPLOYEES_BY_LOCATION[selectedEmpManageLoc] || [];

    if (locList.some((x) => x.toLowerCase() === cleanName.toLowerCase())) {
      onShowModal(`Pracownik "${cleanName}" jest już na liście punktu ${selectedEmpManageLoc}.`);
      return;
    }

    const nextMap = {
      ...currentMap,
      [selectedEmpManageLoc]: [...locList, cleanName],
    };
    await onSaveCatalog({ ...catalog, employeesByLocation: nextMap }, `Dodano pracownika "${cleanName}" do punktu ${selectedEmpManageLoc}!`);
    setNewEmployeeName("");
  };

  const handleRemoveEmployeeFromLocation = async (loc, empName) => {
    const currentMap = catalog?.employeesByLocation || DEFAULT_EMPLOYEES_BY_LOCATION;
    const locList = Array.isArray(currentMap[loc]) ? currentMap[loc] : DEFAULT_EMPLOYEES_BY_LOCATION[loc] || [];
    const nextMap = {
      ...currentMap,
      [loc]: locList.filter((x) => x !== empName),
    };
    await onSaveCatalog({ ...catalog, employeesByLocation: nextMap }, `Usunięto pracownika "${empName}" z punktu ${loc}.`);
  };

  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;
    const newId = `cat_${Date.now()}`;
    const nextCustom = [...customCategoriesList, { id: newId, name: cleanName, type: newCategoryType, items: [] }];
    const nextDeliveryDays = { ...(catalog?.deliveryDays || DEFAULT_DELIVERY_DAYS), [`custom_${newId}`]: [1, 2, 3, 4, 5, 6, 0] };
    await onSaveCatalog(
      { ...catalog, customCategories: nextCustom, deliveryDays: nextDeliveryDays },
      `Utworzono nową kategorię "${cleanName}"! Teraz możesz dodać do niej pozycje i ustawić jej dni aktywności.`
    );
    setNewCategoryName("");
    setSelectedCatalogCategory(`custom:${newId}`);
  };

  const handleDeleteCustomCategory = async (catId) => {
    const nextCustom = customCategoriesList.filter((c) => c.id !== catId);
    setSelectedCatalogCategory("vegetables");
    await onSaveCatalog({ ...catalog, customCategories: nextCustom }, "Kategoria została usunięta.");
  };

  const handleSavePins = async (e) => {
    e.preventDefault();
    await onSaveCatalog({ ...catalog, locationPins: pinDrafts }, "Unikalne kody PIN dla punktów zostały zapisane!");
  };

  const handleToggleDeliveryDay = (deliveryKey, dayId) => {
    setDeliveryDaysDraft((prev) => {
      const currentDays = Array.isArray(prev[deliveryKey]) ? prev[deliveryKey].map(Number) : [];
      const nextDays = currentDays.includes(dayId) ? currentDays.filter((id) => id !== dayId) : [...currentDays, dayId];
      return { ...prev, [deliveryKey]: nextDays };
    });
  };

  const handleSaveDeliveryDays = async (e) => {
    e.preventDefault();
    await onSaveCatalog({ ...catalog, deliveryDays: deliveryDaysDraft }, "Harmonogram dni uzupełniania kategorii został zapisany!");
  };

  const toggleNewTaskDay = (dayId) => {
    setNewTaskDays((prev) => (prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    if (newTaskType === "recurring" && newTaskDays.length === 0) {
      onShowModal("Wybierz przynajmniej jeden dzień tygodnia dla stałego zadania harmonogramowego!");
      return;
    }

    try {
      const taskObj = {
        text: newTask.trim(),
        location: isKlodzkoAdmin ? "Kłodzko" : newTaskLoc,
        type: newTaskType,
        daysOfWeek: newTaskType === "recurring" ? newTaskDays : [],
        deadlineTime: newTaskDeadline || "18:00",
        completedBy: [],
        active: true,
        createdBy: name,
        createdAt: new Date().toISOString(),
      };

      if (db) {
        await ensureAuth();
        await addDoc(collection(db, "artifacts", appId, "public", "data", "tasks"), taskObj);
      } else {
        const currentTasks = getLocalData(LS_TASKS_KEY, []);
        setLocalData(LS_TASKS_KEY, [{ ...taskObj, id: `local_task_${Date.now()}` }, ...currentTasks]);
      }

      setNewTask("");
      onShowModal(newTaskType === "recurring" ? "Stałe zadanie harmonogramowe zostało zapisane!" : "Zadanie doraźne zostało wysłane na punkt!");
    } catch (err) {
      console.error(err);
      onShowModal("Błąd wysyłania zadania.");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      if (db) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "tasks", id));
      else setLocalData(LS_TASKS_KEY, getLocalData(LS_TASKS_KEY, []).filter((t) => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const dailyNetworkSummary = useMemo(() => {
    let sumGotowka = 0, sumKarta = 0, sumAplikacje = 0, sumFiskalny = 0, sumRoznica = 0, sumExpenses = 0, sumOrders = 0;
    const fallbackVal = parseSafeNumber(avgOrderFallbackVal) || DEFAULT_AVG_ORDER_VALUE;
    const perLocationMap = {};
    allowedLocations.forEach((loc) => {
      perLocationMap[loc] = {
        location: loc, hasReport: false, gotowka: 0, karta: 0, aplikacje: 0, total: 0, orders: 0,
        fiskalny: 0, roznica: 0, expenses: 0, sharePct: 0, pctGotowka: 0, pctKarta: 0, pctAplikacje: 0,
      };
    });

    reportsForSummaryPeriod.forEach((r) => {
      const g = parseSafeNumber(r?.revenue?.gotowka);
      const k = parseSafeNumber(r?.revenue?.karta);
      const a = parseSafeNumber(r?.revenue?.aplikacje);
      const f = parseSafeNumber(r?.revenue?.raportFiskalny);
      const roz = parseSafeNumber(r?.revenue?.roznica);
      const exp = calculateTotalExpenses(r?.expenses);
      const ord = getEffectiveOrdersCount(r, fallbackVal);
      const locTot = g + k + a;

      sumGotowka += g; sumKarta += k; sumAplikacje += a; sumFiskalny += f; sumRoznica += roz; sumExpenses += exp; sumOrders += ord;

      if (r?.location && perLocationMap[r.location]) {
        const cur = perLocationMap[r.location];
        cur.hasReport = true;
        cur.gotowka += g; cur.karta += k; cur.aplikacje += a; cur.total += locTot;
        cur.fiskalny += f; cur.roznica += roz; cur.expenses += exp; cur.orders += ord;
      }
    });

    Object.values(perLocationMap).forEach((item) => {
      const locTot = item.total;
      item.pctGotowka = locTot > 0 ? Math.round((item.gotowka / locTot) * 100) : 0;
      item.pctKarta = locTot > 0 ? Math.round((item.karta / locTot) * 100) : 0;
      item.pctAplikacje = locTot > 0 ? Math.max(0, 100 - item.pctGotowka - item.pctKarta) : 0;
    });

    const totalRevenue = sumGotowka + sumKarta + sumAplikacje;
    const pctGotowka = totalRevenue > 0 ? Math.round((sumGotowka / totalRevenue) * 100) : 0;
    const pctKarta = totalRevenue > 0 ? Math.round((sumKarta / totalRevenue) * 100) : 0;
    const pctAplikacje = totalRevenue > 0 ? Math.max(0, 100 - pctGotowka - pctKarta) : 0;

    const locationShares = allowedLocations.map((loc) => {
      const item = perLocationMap[loc];
      return { ...item, sharePct: totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 1000) / 10 : 0 };
    });

    return {
      sumGotowka, sumKarta, sumAplikacje, sumFiskalny, sumRoznica, sumExpenses, sumOrders,
      netCashInDrawer: sumGotowka - sumExpenses, totalRevenue, pctGotowka, pctKarta, pctAplikacje,
      reportedCount: reportsForSummaryPeriod.length, locationShares, perLocationMap,
    };
  }, [reportsForSummaryPeriod, allowedLocations, avgOrderFallbackVal]);

  const activePaymentBreakdown = useMemo(() => {
    if (paymentBreakdownLoc !== "All" && dailyNetworkSummary.perLocationMap[paymentBreakdownLoc]) {
      const locData = dailyNetworkSummary.perLocationMap[paymentBreakdownLoc];
      return {
        label: `Punkt: ${paymentBreakdownLoc}`,
        gotowka: locData.gotowka, karta: locData.karta, aplikacje: locData.aplikacje, total: locData.total,
        pctGotowka: locData.pctGotowka, pctKarta: locData.pctKarta, pctAplikacje: locData.pctAplikacje,
      };
    }
    return {
      label: isKlodzkoAdmin ? "Punkt: Kłodzko" : "Cała sieć (Wszystkie punkty)",
      gotowka: dailyNetworkSummary.sumGotowka, karta: dailyNetworkSummary.sumKarta, aplikacje: dailyNetworkSummary.sumAplikacje,
      total: dailyNetworkSummary.totalRevenue, pctGotowka: dailyNetworkSummary.pctGotowka, pctKarta: dailyNetworkSummary.pctKarta, pctAplikacje: dailyNetworkSummary.pctAplikacje,
    };
  }, [paymentBreakdownLoc, dailyNetworkSummary, isKlodzkoAdmin]);

  const nysaWarehouseForSelectedDate = useMemo(
    () => allNysaWarehouse.find((n) => n?.date === selectedReportDate) || null,
    [allNysaWarehouse, selectedReportDate]
  );

  const averageUsagePerOrderData = useMemo(() => {
    const fallbackVal = parseSafeNumber(avgOrderFallbackVal) || DEFAULT_AVG_ORDER_VALUE;
    const filteredReports = reportsForSelectedDate.filter((r) =>
      inventoryLocFilter === "All" ? allowedLocations.includes(r?.location) : r?.location === inventoryLocFilter
    );

    let totalOrders = 0;
    const totalsBySection = {
      vegetables: {},
      freezer: {},
      farutex: {},
      meat1: {},
      meat2: {},
      otherItems: {},
    };

    filteredReports.forEach((rep) => {
      totalOrders += getEffectiveOrdersCount(rep, fallbackVal);
      Object.keys(totalsBySection).forEach((secKey) => {
        const secObj = rep?.[secKey];
        if (secObj && typeof secObj === "object") {
          Object.entries(secObj).forEach(([item, val]) => {
            const num = parseSafeNumber(val);
            if (num > 0) {
              totalsBySection[secKey][item] = (totalsBySection[secKey][item] || 0) + num;
            }
          });
        }
      });
    });

    return { totalOrders, totalsBySection, reportsCount: filteredReports.length };
  }, [reportsForSelectedDate, inventoryLocFilter, allowedLocations, avgOrderFallbackVal]);

  const dayStats = useMemo(() => {
    if (!hasFullAnalytics) return null;
    const dayBuckets = { 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 }, 3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 }, 5: { sum: 0, count: 0 }, 6: { sum: 0, count: 0 }, 0: { sum: 0, count: 0 } };
    const weekBounds = getWeekBounds(statsWeekRefDate);
    const activeStart = statsFilterMode === "week" ? weekBounds.start : statsFilterMode === "range" ? statsCustomStart : "";
    const activeEnd = statsFilterMode === "week" ? weekBounds.end : statsFilterMode === "range" ? statsCustomEnd : "";
    const effectiveLoc = isKlodzkoAdmin ? "Kłodzko" : statsLocation;

    const filtered = roleFilteredAllReports.filter((r) => {
      if (!r?.date || !r?.revenue) return false;
      if (effectiveLoc !== "All" && r.location !== effectiveLoc) return false;
      if (statsFilterMode !== "all") {
        if (activeStart && r.date < activeStart) return false;
        if (activeEnd && r.date > activeEnd) return false;
      }
      return true;
    });

    filtered.forEach((r) => {
      const dayIdx = getDayOfWeekFromDateStr(r.date);
      const totalRev = parseSafeNumber(r.revenue?.gotowka) + parseSafeNumber(r.revenue?.karta) + parseSafeNumber(r.revenue?.aplikacje);
      if (totalRev > 0 && dayBuckets[dayIdx] !== undefined) {
        dayBuckets[dayIdx].sum += totalRev;
        dayBuckets[dayIdx].count += 1;
      }
    });

    const statsList = DAYS_OF_WEEK.map((dayObj) => {
      const bucket = dayBuckets[dayObj.id];
      return { ...dayObj, sum: bucket.sum, count: bucket.count, avg: bucket.count > 0 ? bucket.sum / bucket.count : 0 };
    });

    const activeDays = statsList.filter((d) => d.count > 0);
    let bestDay = null, worstDay = null;
    if (activeDays.length > 0) {
      bestDay = activeDays.reduce((prev, curr) => (curr.avg > prev.avg ? curr : prev));
      worstDay = activeDays.reduce((prev, curr) => (curr.avg < prev.avg ? curr : prev));
    }

    return {
      statsList, bestDay, worstDay, maxAvg: bestDay ? bestDay.avg : 0,
      totalReportsCount: filtered.length, totalPeriodRevenue: statsList.reduce((acc, d) => acc + d.sum, 0),
      activeStart, activeEnd,
    };
  }, [hasFullAnalytics, statsWeekRefDate, statsFilterMode, statsCustomStart, statsCustomEnd, isKlodzkoAdmin, statsLocation, roleFilteredAllReports]);

  const shiftStatsWeek = (daysOffset) => {
    const d = parseDateStr(statsWeekRefDate);
    d.setDate(d.getDate() + daysOffset);
    setStatsWeekRefDate(formatDateObj(d));
  };

  const workHoursData = useMemo(() => {
    const effectiveLoc = isKlodzkoAdmin ? "Kłodzko" : hoursLocation;
    const matchingReports = roleFilteredAllReports
      .filter((r) => {
        if (!r?.date) return false;
        if (effectiveLoc !== "All" && r.location !== effectiveLoc) return false;
        if (hoursStartDate && r.date < hoursStartDate) return false;
        if (hoursEndDate && r.date > hoursEndDate) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const entries = [];
    const summaryByPerson = {};

    matchingReports.forEach((r) => {
      if (Array.isArray(r.employees)) {
        r.employees.forEach((emp) => {
          const empName = String(emp?.name || "").trim();
          const empHoursRaw = String(emp?.hours || "").trim();
          if (empName || empHoursRaw) {
            const parsedHrs = calculateWorkedHours(empHoursRaw);
            entries.push({
              id: `${r.id}_${empName}_${empHoursRaw}`, date: r.date, location: r.location,
              name: empName || "(Nie wpisano imienia)", rawHours: empHoursRaw || "-", calculatedHours: parsedHrs, reporter: r.reporter,
            });
            if (empName) {
              const normKey = empName.toLowerCase();
              if (!summaryByPerson[normKey]) summaryByPerson[normKey] = { displayName: empName, totalHours: 0, shiftsCount: 0, locations: new Set() };
              summaryByPerson[normKey].totalHours = Math.round((summaryByPerson[normKey].totalHours + parsedHrs) * 100) / 100;
              summaryByPerson[normKey].shiftsCount += 1;
              summaryByPerson[normKey].locations.add(r.location);
            }
          }
        });
      }
    });

    const summaryList = Object.values(summaryByPerson)
      .map((item) => ({ ...item, locations: Array.from(item.locations) }))
      .sort((a, b) => b.totalHours - a.totalHours);

    return { entries, summaryList };
  }, [isKlodzkoAdmin, hoursLocation, roleFilteredAllReports, hoursStartDate, hoursEndDate]);

  const renderInventoryGroup = (title, itemsList, recordObj, colorClass, ordersCountForReport = 0) => {
    const extraKeys = recordObj ? Object.keys(recordObj).filter((k) => !itemsList.includes(k)) : [];
    const combinedItems = [...itemsList, ...extraKeys];
    if (combinedItems.length === 0) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${colorClass}`}>{title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {combinedItems.map((item) => {
            const rawVal = recordObj?.[item];
            const numVal = parseSafeNumber(rawVal);
            const isLowOrZero = rawVal === undefined || numVal === 0;
            const perOrderVal = ordersCountForReport > 0 && numVal > 0 ? numVal / ordersCountForReport : 0;
            const unit = getItemUnit(catalog, item);
            return (
              <div key={item} className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs ${isLowOrZero ? "bg-red-50/70 border-red-200 text-red-900" : "bg-white border-gray-200 text-gray-800"}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold truncate pr-1">{item} <span className="text-[10px] font-normal opacity-75">[{unit}]</span></span>
                  <span className={`font-black px-2 py-0.5 rounded-md shrink-0 ${isLowOrZero ? "bg-red-200/80 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {rawVal !== undefined ? rawVal : "0"} {unit}
                  </span>
                </div>
                {ordersCountForReport > 0 && numVal > 0 && (
                  <div className="mt-1.5 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] text-indigo-700 font-extrabold">
                    <span>Śr. na 1 zam.:</span>
                    <span>{perOrderVal.toFixed(3)} {unit}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEmployeeManagerWidget = () => {
    const empMap = catalog?.employeesByLocation || DEFAULT_EMPLOYEES_BY_LOCATION;
    const currentLocEmployees = Array.isArray(empMap[selectedEmpManageLoc])
      ? empMap[selectedEmpManageLoc]
      : DEFAULT_EMPLOYEES_BY_LOCATION[selectedEmpManageLoc] || [];

    return (
      <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2.5 text-blue-600" /> Zarządzanie Pracownikami Punktów
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Dodawaj i usuwaj imiona pracowników przypisanych do konkretnych lokali. Lista wyświetla się w polu wyboru raportu dziennego.
            </p>
          </div>
          {!isKlodzkoAdmin && (
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedEmpManageLoc(loc)}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs border transition-colors ${
                    selectedEmpManageLoc === loc
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddEmployeeToLocation} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder={`Wpisz imię nowego pracownika dla punktu ${selectedEmpManageLoc}...`}
            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md flex items-center justify-center transition-colors shrink-0 text-sm"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Dodaj pracownika ({selectedEmpManageLoc})
          </button>
        </form>

        <div className="pt-3 border-t border-gray-100">
          <span className="block text-xs font-black uppercase text-gray-400 mb-3">
            Przypisani pracownicy — {selectedEmpManageLoc} ({currentLocEmployees.length}):
          </span>
          {currentLocEmployees.length === 0 ? (
            <p className="text-sm text-gray-400 font-bold py-4 text-center bg-gray-50 rounded-xl">
              Brak pracowników przypisanych do tego lokalu.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {currentLocEmployees.map((empName) => (
                <div
                  key={empName}
                  className="p-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-2 shadow-sm transition-colors"
                >
                  <span className="font-extrabold text-gray-800 text-sm truncate">{empName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmployeeFromLocation(selectedEmpManageLoc, empName)}
                    className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors shrink-0"
                    title="Usuń pracownika z tego lokalu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const visibleTasks = useMemo(
    () => (isKlodzkoAdmin ? tasks.filter((t) => t?.location === "Kłodzko" || t?.location === "All") : tasks),
    [tasks, isKlodzkoAdmin]
  );
  const adhocVisibleTasks = useMemo(() => visibleTasks.filter((t) => t?.type !== "recurring"), [visibleTasks]);
  const recurringVisibleTasks = useMemo(() => visibleTasks.filter((t) => t?.type === "recurring"), [visibleTasks]);

  const renderTaskCard = (t) => {
    const isRecurring = t.type === "recurring";
    const targetLocs = t.location === "All" ? (isKlodzkoAdmin ? ["Kłodzko"] : LOCATIONS) : [t.location];
    const scheduledDaysObjs = isRecurring && Array.isArray(t.daysOfWeek) ? DAYS_OF_WEEK.filter((d) => t.daysOfWeek.map(Number).includes(d.id)) : [];
    const todayDayIdx = getDayOfWeekFromDateStr(todayStr);
    const isScheduledForToday = !isRecurring || (Array.isArray(t.daysOfWeek) && t.daysOfWeek.map(Number).includes(todayDayIdx));

    return (
      <div key={t.id} className="p-5 rounded-2xl border bg-white border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
              {t.location === "All" ? "Wszystkie punkty (All)" : t.location}
            </span>
            {isRecurring ? (
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full uppercase tracking-wider flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" /> Stałe harmonogramowe
              </span>
            ) : (
              <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">Jednorazowe / Doraźne</span>
            )}
            <span className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" /> Do wykonania do godziny: {t.deadlineTime || "22:00"}
            </span>
            {isRecurring && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${isScheduledForToday ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                {isScheduledForToday ? `Aktywne dziś (${todayStr})` : "Dziś poza harmonogramem"}
              </span>
            )}
          </div>
          <p className="font-bold text-gray-900 text-lg leading-tight">{t.text}</p>
          {isRecurring && scheduledDaysObjs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs font-bold text-gray-400 mr-1">Dni wykonywania:</span>
              {scheduledDaysObjs.map((d) => (
                <span key={d.id} className="text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg">{d.name}</span>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-gray-100">
            <span className="block text-[11px] font-black uppercase text-gray-400 mb-1.5">
              {isRecurring ? `Stan realizacji w dniu dzisiejszym (${todayStr}):` : "Stan realizacji w punktach:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {targetLocs.map((loc) => {
                const done = isTaskCompletedByLocation(t, loc, todayStr);
                return (
                  <span key={loc} className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border transition-colors ${done ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50/70 border-red-200 text-red-700"}`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500 shrink-0" />}
                    {loc}: {done ? "Wykonane" : "Niewykonane"}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold">Zlecone przez: {t.createdBy}</p>
        </div>
        <button type="button" onClick={() => handleDeleteTask(t.id)} className="shrink-0 w-full lg:w-auto px-4 py-3 lg:py-2.5 flex items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">
          <Trash2 className="w-4 h-4 mr-2" /> Usuń
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-900 text-white px-5 py-4 sticky top-0 z-40 flex justify-between items-center shadow-lg w-full">
        <div>
          <h1 className="font-extrabold text-lg tracking-tight">Panel Sterowania {isKlodzkoAdmin ? "— Punkt Kłodzko" : ""}</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Zalogowano: <span className="text-white font-bold">{name}</span> ({isOwner ? "Właściciel" : isKlodzkoAdmin ? "Administrator Punktu Kłodzko" : "Manager"})
          </p>
        </div>
        <button type="button" onClick={onLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold text-sm transition-colors border border-gray-700">
          Wyloguj
        </button>
      </div>

      <div className="flex bg-white border-b border-gray-200 w-full overflow-x-auto">
        {[
          ...(hasFullAnalytics
            ? [
                { id: "reports", label: "Utargi i Finanse", icon: Banknote, activeClass: "border-gray-900 text-gray-900 bg-gray-50/50", minW: "min-w-[155px]" },
                { id: "inventory", label: "Magazyn / Zużycie / Braki", icon: Warehouse, activeClass: "border-purple-600 text-purple-700 bg-purple-50/30", minW: "min-w-[170px]" },
                { id: "stats", label: "Statystyka Dni", icon: BarChart3, activeClass: "border-emerald-600 text-emerald-700 bg-emerald-50/30", minW: "min-w-[155px]" },
              ]
            : []),
          { id: "hours", label: "Godziny Pracy & Kadra", icon: Clock, activeClass: "border-indigo-600 text-indigo-700 bg-indigo-50/30", minW: "min-w-[160px]" },
          { id: "tasks", label: "Zadania Dnia", icon: ClipboardList, activeClass: "border-blue-600 text-blue-600 bg-blue-50/30", minW: "min-w-[150px]" },
          ...(isOwner ? [{ id: "catalog", label: "Asortyment / Kopia Bazy", icon: Settings, activeClass: "border-amber-600 text-amber-700 bg-amber-50/40", minW: "min-w-[190px]" }] : []),
        ].map(({ id, label, icon: Icon, activeClass, minW }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 ${minW} py-4 px-3 font-extrabold text-xs sm:text-sm border-b-2 transition-colors flex items-center justify-center gap-1.5 ${tab === id ? activeClass : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto flex-1 overflow-x-hidden">
        {tab === "reports" && hasFullAnalytics && (
          <div className="space-y-8">
            <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                  <Banknote className="w-7 h-7 mr-3 text-emerald-600" /> Zestawienie Utargów {isKlodzkoAdmin ? "(Punkt Kłodzko)" : "i Historia"}
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-1">Wybierz datę lub okres do podsumowania sieci. Poniżej możesz przeglądać raporty poszczególnych dni.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <input type="date" value={selectedReportDate} onChange={(e) => setSelectedReportDate(e.target.value)} className="bg-transparent font-black text-sm text-gray-900 outline-none" />
                </div>
                {selectedReportDate !== todayStr && (
                  <button type="button" onClick={() => setSelectedReportDate(todayStr)} className="px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
                    Wróć do dziś ({todayStr})
                  </button>
                )}
                <button type="button" onClick={handleDownloadCSV} className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Eksport CSV
                </button>
                <button type="button" onClick={handleDownloadFullBackupJSON} className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-xl text-xs font-black flex items-center transition-colors">
                  <Download className="w-4 h-4 mr-1.5" /> Kopia JSON
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 text-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-gray-800 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-white/10 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center">
                      <PieChart className="w-3.5 h-3.5 mr-1.5" />
                      {isKlodzkoAdmin ? "Podsumowanie Finansowe: Punkt Kłodzko" : "Karta Podsumowania Sieci"}
                    </span>
                    <span className="text-xs font-bold text-gray-400">Liczba zliczonych raportów: {dailyNetworkSummary.reportedCount} • Zamówienia: {dailyNetworkSummary.sumOrders}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-gray-300 mr-1">Okres podsumowania:</span>
                    {[
                      { id: "day", label: "Pojedynczy dzień" },
                      { id: "week", label: "Wybrany tydzień" },
                      { id: "range", label: "Zakres (Od - Do)" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSummaryPeriodMode(m.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors ${summaryPeriodMode === m.id ? "bg-emerald-500 text-gray-950 shadow-sm" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {summaryPeriodMode === "range" && (
                    <div className="flex flex-wrap items-center gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/10">
                      <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-[11px] font-bold text-gray-300 mr-2">Od:</span>
                        <input type="date" value={summaryStartDate} onChange={(e) => setSummaryStartDate(e.target.value)} className="font-black text-xs text-white outline-none bg-transparent" />
                      </div>
                      <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-[11px] font-bold text-gray-300 mr-2">Do:</span>
                        <input type="date" value={summaryEndDate} onChange={(e) => setSummaryEndDate(e.target.value)} className="font-black text-xs text-white outline-none bg-transparent" />
                      </div>
                    </div>
                  )}

                  <h3 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight text-white">
                    {formatMoney(dailyNetworkSummary.totalRevenue)} <span className="text-lg font-bold text-emerald-400">PLN</span>
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    {summaryPeriodMode === "day"
                      ? `Łączny utarg brutto w dniu ${selectedReportDate}`
                      : summaryPeriodMode === "week"
                      ? `Łączny utarg brutto za tydzień (${getWeekBounds(selectedReportDate).start} — ${getWeekBounds(selectedReportDate).end})`
                      : `Łączny utarg brutto w zakresie (${summaryStartDate || "?"} — ${summaryEndDate || "?"})`}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-indigo-300 block mb-1 flex items-center"><Receipt className="w-3 h-3 mr-1" /> Raporty Fiskalne</span>
                    <span className="text-lg font-black text-white">{formatMoney(dailyNetworkSummary.sumFiskalny)} <span className="text-xs text-gray-400">zł</span></span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-amber-300 block mb-1 flex items-center"><Wallet className="w-3 h-3 mr-1" /> Wydatki z kasy (KW)</span>
                    <span className="text-lg font-black text-amber-300">-{formatMoney(dailyNetworkSummary.sumExpenses)} <span className="text-xs text-gray-400">zł</span></span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-emerald-300 block mb-1">Gotówka po KW</span>
                    <span className="text-lg font-black text-emerald-300">{formatMoney(dailyNetworkSummary.netCashInDrawer)} <span className="text-xs text-gray-400">zł</span></span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${dailyNetworkSummary.sumRoznica < 0 ? "bg-red-500/15 border-red-500/30" : "bg-white/5 border-white/10"}`}>
                    <span className="text-[10px] font-black uppercase text-gray-300 block mb-1">Brak / Nadwyżka</span>
                    <span className={`text-lg font-black ${dailyNetworkSummary.sumRoznica < 0 ? "text-red-400" : dailyNetworkSummary.sumRoznica > 0 ? "text-emerald-400" : "text-white"}`}>
                      {dailyNetworkSummary.sumRoznica > 0 ? "+" : ""}{formatMoney(dailyNetworkSummary.sumRoznica)} <span className="text-xs text-gray-400">zł</span>
                    </span>
                  </div>
                </div>
              </div>

              {!isKlodzkoAdmin && (
                <div className="space-y-3 border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span>Udział poszczególnych lokali w łącznym utargu sieci (w wybranym okresie)</span>
                    <span>Kliknij lokal poniżej, aby filtrować metody płatności</span>
                  </div>
                  <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                    {dailyNetworkSummary.totalRevenue > 0 ? (
                      dailyNetworkSummary.locationShares.map((locItem) =>
                        locItem.sharePct > 0 ? (
                          <div
                            key={locItem.location}
                            style={{ width: `${locItem.sharePct}%` }}
                            onClick={() => setPaymentBreakdownLoc(paymentBreakdownLoc === locItem.location ? "All" : locItem.location)}
                            className={`h-full cursor-pointer transition-colors duration-300 ${LOCATION_COLORS[locItem.location] || "bg-emerald-500"} first:rounded-l-full last:rounded-r-full hover:opacity-90`}
                            title={`${locItem.location}: ${formatMoney(locItem.total)} zł (${locItem.sharePct}%)`}
                          />
                        ) : null
                      )
                    ) : (
                      <div className="w-full h-full bg-white/5 rounded-full" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {dailyNetworkSummary.locationShares.map((locItem) => {
                      const isSelectedLoc = paymentBreakdownLoc === locItem.location;
                      const dotColor = LOCATION_COLORS[locItem.location] || "bg-emerald-500";
                      return (
                        <button
                          key={locItem.location}
                          type="button"
                          onClick={() => setPaymentBreakdownLoc(isSelectedLoc ? "All" : locItem.location)}
                          className={`p-3.5 rounded-2xl border text-left transition-colors flex items-center justify-between ${isSelectedLoc ? "bg-white/15 border-emerald-400 shadow-md" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
                            <div className="truncate">
                              <span className="text-xs font-extrabold text-white block truncate">{locItem.location}</span>
                              <span className="text-sm font-black text-emerald-300">{formatMoney(locItem.total)} zł</span>
                            </div>
                          </div>
                          <span className="text-xs font-black bg-white/10 text-white px-2.5 py-1 rounded-lg shrink-0 ml-2">{locItem.sharePct}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-300">Rozbicie form płatności:</span>
                    <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                      {activePaymentBreakdown.label} ({formatMoney(activePaymentBreakdown.total)} zł)
                    </span>
                  </div>
                  {!isKlodzkoAdmin && (
                    <div className="flex flex-wrap gap-1.5">
                      {["All", ...LOCATIONS].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setPaymentBreakdownLoc(loc)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-black transition-colors ${paymentBreakdownLoc === loc ? "bg-emerald-500 text-gray-950" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          {loc === "All" ? "Cała sieć" : loc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                  {activePaymentBreakdown.total > 0 ? (
                    <>
                      <div style={{ width: `${activePaymentBreakdown.pctGotowka}%` }} className="h-full bg-amber-400 rounded-l-full" title={`Gotówka: ${activePaymentBreakdown.pctGotowka}%`} />
                      <div style={{ width: `${activePaymentBreakdown.pctKarta}%` }} className="h-full bg-blue-500" title={`Karta: ${activePaymentBreakdown.pctKarta}%`} />
                      <div style={{ width: `${activePaymentBreakdown.pctAplikacje}%` }} className="h-full bg-purple-500 rounded-r-full" title={`Aplikacje: ${activePaymentBreakdown.pctAplikacje}%`} />
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/5 rounded-full" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { label: "Gotówka", val: activePaymentBreakdown.gotowka, pct: activePaymentBreakdown.pctGotowka, dot: "bg-amber-400", badge: "bg-amber-400/20 text-amber-300" },
                    { label: "Karta Płatnicza", val: activePaymentBreakdown.karta, pct: activePaymentBreakdown.pctKarta, dot: "bg-blue-500", badge: "bg-blue-500/20 text-blue-300" },
                    { label: "Aplikacje (Uber/Glovo)", val: activePaymentBreakdown.aplikacje, pct: activePaymentBreakdown.pctAplikacje, dot: "bg-purple-500", badge: "bg-purple-500/20 text-purple-300" },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${m.dot} shrink-0`} />
                        <div>
                          <span className="text-xs font-bold text-gray-300 block">{m.label}</span>
                          <span className="text-sm font-black text-white">{formatMoney(m.val)} zł</span>
                        </div>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${m.badge}`}>{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                Szczegółowe raporty dzienne punktów z dnia: <span className="text-blue-600 underline">{selectedReportDate}</span>
              </h3>
              <div className={`grid grid-cols-1 ${allowedLocations.length > 1 ? "lg:grid-cols-2" : ""} gap-6`}>
                {allowedLocations.map((loc) => {
                  const report = reportsForSelectedDate.find((r) => r?.location === loc);
                  if (!report) {
                    return (
                      <div key={loc} className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-h-[220px]">
                        <XCircle className="w-10 h-10 text-gray-300 mb-3" />
                        <h3 className="text-xl font-black text-gray-800">{loc}</h3>
                        <p className="text-gray-400 font-bold mt-1 mb-4">Brak raportu na dzień {selectedReportDate}</p>
                        <button
                          type="button"
                          onClick={() => onEditHistoricalReport(loc, selectedReportDate, null)}
                          className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black rounded-xl flex items-center transition-colors shadow-sm"
                        >
                          <PlusCircle className="w-4 h-4 mr-1.5" /> Utwórz raport za ten dzień
                        </button>
                      </div>
                    );
                  }

                  const got = parseSafeNumber(report.revenue?.gotowka);
                  const kar = parseSafeNumber(report.revenue?.karta);
                  const apl = parseSafeNumber(report.revenue?.aplikacje);
                  const total = got + kar + apl;
                  const pGot = total > 0 ? Math.round((got / total) * 100) : 0;
                  const pKar = total > 0 ? Math.round((kar / total) * 100) : 0;
                  const pApl = total > 0 ? Math.max(0, 100 - pGot - pKar) : 0;
                  const locExpenses = Array.isArray(report.expenses) ? report.expenses : [];
                  const locExpensesSum = calculateTotalExpenses(locExpenses);
                  const effOrders = getEffectiveOrdersCount(report, parseSafeNumber(avgOrderFallbackVal) || DEFAULT_AVG_ORDER_VALUE);

                  return (
                    <div key={loc} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <div className="bg-emerald-50 border-b border-emerald-100 p-5 flex justify-between items-center gap-2">
                        <div>
                          <h3 className="text-2xl font-black text-emerald-900">{loc}</h3>
                          <span className="text-xs font-bold text-emerald-700">
                            Zgłosił(a): {report.reporter} • Zamówienia: {effOrders} {parseSafeNumber(report.ordersCount) > 0 ? "(wpisane)" : "(wyliczone z utargu)"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEditHistoricalReport(loc, selectedReportDate, report)}
                          className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-black flex items-center transition-colors shadow-sm"
                        >
                          <Edit3 className="w-4 h-4 mr-1.5 text-emerald-700" /> Edytuj raport
                        </button>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Gotówka ({pGot}%)</span>
                            <span className="text-base font-black text-gray-800">{formatMoney(got)} <span className="text-xs text-gray-500">zł</span></span>
                          </div>
                          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Karta ({pKar}%)</span>
                            <span className="text-base font-black text-gray-800">{formatMoney(kar)} <span className="text-xs text-gray-500">zł</span></span>
                          </div>
                          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Aplikacje ({pApl}%)</span>
                            <span className="text-base font-black text-gray-800">{formatMoney(apl)} <span className="text-xs text-gray-500">zł</span></span>
                          </div>
                          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-center">
                            <span className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Raport Fiskalny</span>
                            <span className="text-base font-black text-indigo-950">{formatMoney(report.revenue?.raportFiskalny)} <span className="text-xs text-indigo-500">zł</span></span>
                          </div>
                          <div className={`p-3.5 rounded-xl border text-center sm:col-span-2 ${parseSafeNumber(report.revenue?.roznica) < 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Brak / Nadwyżka</span>
                            <span className={`text-base font-black ${parseSafeNumber(report.revenue?.roznica) < 0 ? "text-red-600" : "text-gray-800"}`}>
                              {formatMoney(report.revenue?.roznica)} <span className="text-xs text-gray-500">zł</span>
                            </span>
                          </div>
                        </div>

                        {total > 0 && (
                          <div className="mb-4">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                              <div style={{ width: `${pGot}%` }} className="h-full bg-amber-400" />
                              <div style={{ width: `${pKar}%` }} className="h-full bg-blue-500" />
                              <div style={{ width: `${pApl}%` }} className="h-full bg-purple-500" />
                            </div>
                          </div>
                        )}

                        {locExpenses.length > 0 && (
                          <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-black text-amber-900 uppercase flex items-center"><Wallet className="w-3.5 h-3.5 mr-1 text-amber-700" /> Wydatki z kasy (KW):</span>
                              <span className="font-black text-amber-900">-{formatMoney(locExpensesSum)} zł (W kasetce: {formatMoney(got - locExpensesSum)} zł)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {locExpenses.map((ex, i) => (
                                <span key={i} className="bg-white border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-gray-800">
                                  {ex.description || "Wydatek"}: <strong className="text-amber-800">{formatMoney(ex.amount)} zł</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(report.employees) && report.employees.some((e) => e?.name || e?.hours) && (
                          <div className="mb-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                            <span className="font-black text-gray-500 uppercase block mb-1.5">Obsada zmiany:</span>
                            <div className="flex flex-wrap gap-2">
                              {report.employees.filter((e) => e?.name || e?.hours).map((emp, idx) => (
                                <span key={idx} className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-bold text-gray-800">
                                  {emp.name || "Pracownik"}: <span className="text-blue-600">{emp.hours || "-"}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-end border-t border-gray-100 pt-5 mt-auto">
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Utarg całkowity:</span>
                          <span className="text-3xl font-black text-emerald-600">{formatMoney(total)} <span className="text-lg text-emerald-500">zł</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "inventory" && hasFullAnalytics && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                  <Warehouse className="w-7 h-7 mr-3 text-purple-600" /> Magazyn, Średnie Zużycie na Zamówienie i Braki
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-1">
                  Zestawienie średniego zużycia produktów na 1 zamówienie (z jednostkami miary), stanów magazynowych, braków sosów oraz uwag końcowych.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <input type="date" value={selectedReportDate} onChange={(e) => setSelectedReportDate(e.target.value)} className="bg-transparent font-black text-sm text-gray-900 outline-none" />
                </div>
                {!isKlodzkoAdmin && (
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...LOCATIONS].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setInventoryLocFilter(loc)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition-colors ${inventoryLocFilter === loc ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {loc === "All" ? "Wszystkie punkty" : loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-indigo-950 text-white p-6 rounded-[2rem] border border-indigo-800 shadow-lg space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-black uppercase bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full">
                    Planowanie zatowarowania — Analityka na 1 zamówienie
                  </span>
                  <h3 className="text-xl font-black mt-2">
                    Średnie zużycie / udział produktów na 1 zamówienie ({selectedReportDate})
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium mt-0.5">
                    Wyliczane przez podzielenie zaraportowanych ilości przez łączną liczbę zamówień ({averageUsagePerOrderData.totalOrders} zam. w wybranych punktach).
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/15 shrink-0">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-200">Śr. wartość koszyka (gdy brak paragonów):</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={avgOrderFallbackVal}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d*[.,]?\d*$/.test(v)) setAvgOrderFallbackVal(v);
                        }}
                        className="w-20 p-1.5 text-center font-black text-sm text-gray-900 bg-white rounded-lg outline-none"
                      />
                      <span className="text-xs font-bold text-indigo-200">PLN / zam.</span>
                    </div>
                  </div>
                  <div className="pl-3 border-l border-white/15 text-right">
                    <span className="block text-[10px] font-black uppercase text-emerald-300">Liczba zamówień:</span>
                    <span className="text-2xl font-black text-white">{averageUsagePerOrderData.totalOrders}</span>
                  </div>
                </div>
              </div>

              {averageUsagePerOrderData.totalOrders === 0 ? (
                <p className="text-sm text-indigo-200 font-bold py-4 text-center bg-white/5 rounded-2xl">
                  Brak raportów z liczbą zamówień lub utargiem w dniu {selectedReportDate}, aby wyliczyć średnie zużycie na zamówienie.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "vegetables", label: "Warzywa i Inne" },
                    { key: "freezer", label: "Stan Zamrażarek" },
                    { key: "farutex", label: "Farutex" },
                    { key: "meat1", label: "Dostawa Mięso 1" },
                    { key: "meat2", label: "Dostawa Mięso 2" },
                    { key: "otherItems", label: "Opakowania / Chemia" },
                  ].map((sec) => {
                    const secTotals = averageUsagePerOrderData.totalsBySection[sec.key] || {};
                    const entries = Object.entries(secTotals).filter(([, v]) => v > 0);
                    return (
                      <div key={sec.key} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <h4 className="text-xs font-black uppercase text-amber-300 mb-2.5">{sec.label}</h4>
                        {entries.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Brak pozycji powyżej 0</p>
                        ) : (
                          <div className="space-y-1.5">
                            {entries.map(([itemName, sumVal]) => {
                              const perOrder = sumVal / averageUsagePerOrderData.totalOrders;
                              const unit = getItemUnit(catalog, itemName);
                              return (
                                <div key={itemName} className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg">
                                  <span className="font-bold text-gray-200 truncate pr-2">{itemName} (Σ {sumVal} {unit})</span>
                                  <span className="font-black text-emerald-300 shrink-0">
                                    {perOrder.toFixed(3)} {unit} / zam.
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-amber-50/70 p-6 rounded-[2rem] border-2 border-amber-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-black text-amber-950 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-amber-600" /> Braki sosów, notatki i uwagi końcowe ({selectedReportDate})
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-200/70 px-3 py-1 rounded-full">Interaktywne statusy realizacji</span>
              </div>

              <div className={`grid grid-cols-1 ${allowedLocations.length > 1 ? "sm:grid-cols-2 lg:grid-cols-4" : ""} gap-4`}>
                {allowedLocations
                  .filter((loc) => inventoryLocFilter === "All" || loc === inventoryLocFilter)
                  .map((loc) => {
                    const rep = reportsForSelectedDate.find((r) => r?.location === loc);
                    const missingSauces = Array.isArray(rep?.sauces) ? rep.sauces : [];
                    const hasFinalNote = !!rep?.notes?.trim();
                    const hasSauceNote = !!rep?.saucesNote?.trim();

                    return (
                      <div key={loc} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                            <span className="font-black text-gray-900">{loc}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${!rep ? "bg-gray-100 text-gray-400" : missingSauces.length > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {!rep ? "Brak raportu" : missingSauces.length > 0 ? `Braki sosów (${missingSauces.length})` : "Sosy OK"}
                            </span>
                          </div>
                          {!rep ? (
                            <p className="text-xs text-gray-400 italic">Nie wysłano raportu na dzień {selectedReportDate}.</p>
                          ) : (
                            <div className="space-y-3 text-xs">
                              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-500 block">Brakujące sosy:</span>
                                {missingSauces.length > 0 ? (
                                  <>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {missingSauces.map((s) => (
                                        <span key={s} className="bg-red-50 text-red-700 border border-red-200 font-black px-2 py-0.5 rounded-md">{s}</span>
                                      ))}
                                    </div>
                                    {renderIssueStatusSwitcher(rep, "sauces")}
                                  </>
                                ) : (
                                  <span className="text-emerald-600 font-bold">Brak zgłoszonych braków</span>
                                )}
                              </div>
                              {hasSauceNote && (
                                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/70">
                                  <span className="font-black text-[10px] uppercase text-blue-800 block mb-0.5">Notatka do sosów:</span>
                                  <p className="font-bold text-blue-950 whitespace-pre-wrap">{rep.saucesNote}</p>
                                  {renderIssueStatusSwitcher(rep, "saucesNote")}
                                </div>
                              )}
                              {hasFinalNote ? (
                                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                                  <span className="font-black text-[10px] uppercase text-amber-800 block mb-0.5">Uwagi końcowe (Magazyn / Braki):</span>
                                  <p className="font-bold text-gray-900 whitespace-pre-wrap">{rep.notes}</p>
                                  {renderIssueStatusSwitcher(rep, "notes")}
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-400 italic pt-1">Brak dodatkowych uwag końcowych.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-6">
              {allowedLocations
                .filter((loc) => inventoryLocFilter === "All" || loc === inventoryLocFilter)
                .map((loc) => {
                  const rep = reportsForSelectedDate.find((r) => r?.location === loc);
                  const repOrders = rep ? getEffectiveOrdersCount(rep, parseSafeNumber(avgOrderFallbackVal) || DEFAULT_AVG_ORDER_VALUE) : 0;
                  return (
                    <div key={loc} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-900 text-white p-5 flex flex-wrap justify-between items-center gap-3">
                        <div>
                          <h3 className="text-xl font-black flex items-center"><Store className="w-5 h-5 mr-2 text-purple-400" /> Punkt: {loc}</h3>
                          <p className="text-xs text-gray-400 font-semibold mt-0.5">
                            Data stanu: {selectedReportDate} {rep ? `• Raportował(a): ${rep.reporter} • Liczba zamówień: ${repOrders}` : ""}
                          </p>
                        </div>
                        {rep && (
                          <button
                            type="button"
                            onClick={() => onEditHistoricalReport(loc, selectedReportDate, rep)}
                            className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-colors"
                          >
                            <Edit3 className="w-4 h-4 mr-1.5" /> Edytuj stany w raporcie
                          </button>
                        )}
                      </div>
                      {!rep ? (
                        <div className="p-8 text-center"><p className="text-gray-400 font-bold">Brak raportu magazynowego dla punktu {loc} w dniu {selectedReportDate}.</p></div>
                      ) : (
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {renderInventoryGroup(
                              "Warzywa i Inne",
                              (catalog?.vegetables || DEFAULT_CATALOG.vegetables).filter((it) => isItemAllowedForLocation(catalog, "vegetables", it, loc)),
                              rep.vegetables,
                              "text-green-700",
                              repOrders
                            )}
                            {renderInventoryGroup(
                              "Stan Zamrażarek",
                              (catalog?.freezer || DEFAULT_CATALOG.freezer).filter((it) => isItemAllowedForLocation(catalog, "freezer", it, loc)),
                              rep.freezer,
                              "text-blue-700",
                              repOrders
                            )}
                          </div>
                          {renderInventoryGroup(
                            " Farutex",
                            (catalog?.farutex || DEFAULT_CATALOG.farutex).filter((it) => isItemAllowedForLocation(catalog, "farutex", it, loc)),
                            rep.farutex,
                            "text-orange-700",
                            repOrders
                          )}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {renderInventoryGroup(
                              "Dostawa Mięso 1",
                              (catalog?.meat1 || DEFAULT_CATALOG.meat1).filter((it) => isItemAllowedForLocation(catalog, "meat1", it, loc)),
                              rep.meat1,
                              "text-red-700",
                              repOrders
                            )}
                            {renderInventoryGroup(
                              "Dostawa Mięso 2",
                              (catalog?.meat2 || DEFAULT_CATALOG.meat2).filter((it) => isItemAllowedForLocation(catalog, "meat2", it, loc)),
                              rep.meat2,
                              "text-red-700",
                              repOrders
                            )}
                          </div>
                          {renderInventoryGroup(
                            "Inne: Opakowania / Chemia",
                            (catalog?.otherItems || DEFAULT_CATALOG.otherItems).filter((it) => isItemAllowedForLocation(catalog, "otherItems", it, loc)),
                            rep.otherItems,
                            "text-purple-700",
                            repOrders
                          )}
                          {customCategoriesList.map((cat) => {
                            const secData = rep.customSections?.[cat.id];
                            const allowedCatItems = (cat.items || []).filter((it) => isItemAllowedForLocation(catalog, `custom:${cat.id}`, it, loc));
                            if (cat.type === "checkbox") {
                              const checkedArr = Array.isArray(secData) ? secData : [];
                              return (
                                <div key={cat.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                  <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-indigo-700">{cat.name}</h4>
                                  {checkedArr.length > 0 ? (
                                    <>
                                      <div className="flex flex-wrap gap-1.5">
                                        {checkedArr.map((it) => (
                                          <span key={it} className="bg-indigo-100 text-indigo-800 font-black text-xs px-2.5 py-1 rounded-lg">{it}</span>
                                        ))}
                                      </div>
                                      {renderIssueStatusSwitcher(rep, `custom_${cat.id}`)}
                                    </>
                                  ) : (
                                    <p className="text-xs text-gray-400 font-semibold">Brak zaznaczonych pozycji</p>
                                  )}
                                </div>
                              );
                            }
                            return <div key={cat.id}>{renderInventoryGroup(cat.name, allowedCatItems, secData, "text-indigo-700", repOrders)}</div>;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

              {!isKlodzkoAdmin && (inventoryLocFilter === "All" || inventoryLocFilter === "Nysa") && (
                <div className="bg-purple-50/40 rounded-[2rem] border-2 border-purple-200 shadow-sm overflow-hidden">
                  <div className="bg-purple-900 text-white p-5 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black">Magazyn Główny Nysa (Osobny formularz)</h3>
                      <p className="text-xs text-purple-200 font-semibold mt-0.5">Data: {selectedReportDate}</p>
                    </div>
                  </div>
                  {!nysaWarehouseForSelectedDate ? (
                    <div className="p-6 text-center text-gray-400 font-bold">Brak wypełnionego formularza Magazynu Głównego Nysa na dzień {selectedReportDate}.</div>
                  ) : (
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {renderInventoryGroup("Magazyn Nysa - Żywność", catalog?.nysaFood || DEFAULT_CATALOG.nysaFood, nysaWarehouseForSelectedDate.food, "text-purple-800")}
                      {renderInventoryGroup("Magazyn Nysa - Opakowania", catalog?.nysaPack || DEFAULT_CATALOG.nysaPack, nysaWarehouseForSelectedDate.pack, "text-purple-800")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "stats" && hasFullAnalytics && dayStats && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    <BarChart3 className="w-7 h-7 mr-3 text-emerald-600" /> Statystyka Dni Tygodnia {isKlodzkoAdmin ? "(Kłodzko)" : ""}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Przeanalizowane raporty w wybranym okresie: <span className="font-black text-gray-900">{dayStats.totalReportsCount}</span> • Łączny utarg: <span className="font-black text-emerald-600">{formatMoney(dayStats.totalPeriodRevenue)} zł</span>
                  </p>
                </div>
                {!isKlodzkoAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {["All", ...LOCATIONS].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setStatsLocation(loc)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors border ${statsLocation === loc ? (loc === "All" ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-emerald-600 text-white border-emerald-600 shadow-sm") : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {loc === "All" ? "Cała sieć" : loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "week", label: "Wybierz Tydzień z kalendarza", hasIcon: true },
                    { id: "range", label: "Dowolny zakres dat (Od - Do)" },
                    { id: "all", label: "Cała historia" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setStatsFilterMode(m.id)}
                      className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-colors flex items-center ${statsFilterMode === m.id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {m.hasIcon && <Calendar className="w-4 h-4 mr-1.5" />} {m.label}
                    </button>
                  ))}
                </div>

                {statsFilterMode === "week" && (
                  <div className="flex flex-wrap items-center gap-2 bg-blue-50/70 p-2.5 rounded-2xl border border-blue-200">
                    <button type="button" onClick={() => shiftStatsWeek(-7)} className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-black text-xs border border-gray-200 shadow-sm">Poprzedni tydz.</button>
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-bold text-gray-400 mr-2">Wskaż dzień tygodnia:</span>
                      <input type="date" value={statsWeekRefDate} onChange={(e) => setStatsWeekRefDate(e.target.value)} className="font-black text-xs text-blue-900 outline-none bg-transparent" />
                    </div>
                    <button type="button" onClick={() => shiftStatsWeek(7)} className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-black text-xs border border-gray-200 shadow-sm">Następny tydz.</button>
                    <span className="text-xs font-black text-blue-900 px-2">Tydzień: {dayStats.activeStart} — {dayStats.activeEnd}</span>
                  </div>
                )}

                {statsFilterMode === "range" && (
                  <div className="flex flex-wrap items-center gap-2 bg-blue-50/70 p-2.5 rounded-2xl border border-blue-200">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-bold text-gray-400 mr-2">Od:</span>
                      <input type="date" value={statsCustomStart} onChange={(e) => setStatsCustomStart(e.target.value)} className="font-black text-xs text-gray-900 outline-none bg-transparent" />
                    </div>
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-bold text-gray-400 mr-2">Do:</span>
                      <input type="date" value={statsCustomEnd} onChange={(e) => setStatsCustomEnd(e.target.value)} className="font-black text-xs text-gray-900 outline-none bg-transparent" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {dayStats.bestDay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-200/70 px-3 py-1 rounded-full">Najlepszy dzień w wybranym okresie</span>
                    <h3 className="text-3xl font-black text-emerald-950 mt-3">{dayStats.bestDay.name}</h3>
                    <p className="text-lg font-extrabold text-emerald-700 mt-1">śr. {formatMoney(dayStats.bestDay.avg)} zł</p>
                    <p className="text-xs font-semibold text-emerald-600/80 mt-1">Na podstawie {dayStats.bestDay.count} raportów (łącznie {formatMoney(dayStats.bestDay.sum)} zł)</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20"><TrendingUp className="w-7 h-7" /></div>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-orange-800 bg-orange-200/70 px-3 py-1 rounded-full">Najsłabszy dzień w wybranym okresie</span>
                    <h3 className="text-3xl font-black text-orange-950 mt-3">{dayStats.worstDay.name}</h3>
                    <p className="text-lg font-extrabold text-orange-700 mt-1">śr. {formatMoney(dayStats.worstDay.avg)} zł</p>
                    <p className="text-xs font-semibold text-orange-600/80 mt-1">Na podstawie {dayStats.worstDay.count} raportów (łącznie {formatMoney(dayStats.worstDay.sum)} zł)</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20"><TrendingDown className="w-7 h-7" /></div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold">Brak zapisanych raportów z utargiem dla wybranego tygodnia / zakresu dat.</p>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-extrabold text-lg text-gray-900">Utarg według dni tygodnia (Poniedziałek – Niedziela)</h3>
              <div className="space-y-4">
                {dayStats.statsList.map((d) => {
                  const percent = dayStats.maxAvg > 0 ? Math.round((d.avg / dayStats.maxAvg) * 100) : 0;
                  const isBest = dayStats.bestDay?.id === d.id && d.count > 0;
                  const isWorst = dayStats.worstDay?.id === d.id && d.count > 0 && dayStats.bestDay?.id !== dayStats.worstDay?.id;
                  return (
                    <div key={d.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-base">{d.name}</span>
                          <span className="text-xs font-bold text-gray-400">({d.count} {d.count === 1 ? "raport" : d.count >= 2 && d.count <= 4 ? "raporty" : "raportów"})</span>
                          {isBest && <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">Najlepszy</span>}
                          {isWorst && <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">Najsłabszy</span>}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase mr-1.5">Średnio:</span>
                          <span className="text-lg font-black text-gray-900">{formatMoney(d.avg)} <span className="text-xs text-gray-500">zł</span></span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-colors duration-300 ${isBest ? "bg-emerald-500" : isWorst ? "bg-orange-400" : "bg-blue-500"}`} style={{ width: `${percent}%` }} />
                      </div>
                      {d.count > 0 && (
                        <div className="mt-2 text-right"><span className="text-[11px] font-semibold text-gray-400">Suma całkowita z tych dni: {formatMoney(d.sum)} zł</span></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "hours" && (
          <div className="space-y-6">
            {(isOwner || isKlodzkoAdmin) && renderEmployeeManagerWidget()}

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    <Clock className="w-7 h-7 mr-3 text-indigo-600" /> Podsumowanie Godzin Pracy {isKlodzkoAdmin ? "(Punkt Kłodzko)" : ""}
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Ewidencja godzin wpisywanych w raportach dziennych (obsługuje formaty np. 10-22, 10:30-22:00 oraz 10.30-22.00)</p>
                </div>
                {!isKlodzkoAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {["All", ...LOCATIONS].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setHoursLocation(loc)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition-colors ${hoursLocation === loc ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {loc === "All" ? "Wszystkie punkty" : loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 mr-2">Od dnia:</span>
                  <input type="date" value={hoursStartDate} onChange={(e) => setHoursStartDate(e.target.value)} className="font-black text-xs text-gray-900 bg-transparent outline-none" />
                </div>
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 mr-2">Do dnia:</span>
                  <input type="date" value={hoursEndDate} onChange={(e) => setHoursEndDate(e.target.value)} className="font-black text-xs text-gray-900 bg-transparent outline-none" />
                </div>
                <button type="button" onClick={() => { setHoursStartDate(""); setHoursEndDate(""); }} className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors">
                  Pokaż wszystkie daty
                </button>
              </div>
            </div>

            {workHoursData.summaryList.length > 0 && (
              <div className="bg-indigo-50/60 p-6 rounded-[2rem] border-2 border-indigo-100 shadow-sm">
                <h3 className="font-extrabold text-indigo-950 text-lg mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" /> Suma przepracowanych godzin według pracowników (wybrany okres)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workHoursData.summaryList.map((person) => (
                    <div key={person.displayName} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900 text-base">{person.displayName}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">Liczba zmian: {person.shiftsCount} • {person.locations.join(", ")}</p>
                      </div>
                      <div className="text-right"><span className="text-xl font-black text-indigo-600">{person.totalHours} h</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
              <h3 className="font-extrabold text-gray-900 text-lg mb-4">Szczegółowy wykaz zmian ({workHoursData.entries.length})</h3>
              {workHoursData.entries.length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-6">Brak wpisanych godzin pracy dla wybranych filtrów.</p>
              ) : (
                <div className="space-y-3">
                  {workHoursData.entries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 bg-gray-900 text-white font-black text-xs rounded-lg">{entry.date}</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-xs rounded-lg">{entry.location}</span>
                        <span className="font-extrabold text-gray-900 text-base">{entry.name}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                        <span className="text-xs font-bold text-gray-500">Wpis w raporcie: <strong className="text-gray-900">{entry.rawHours}</strong></span>
                        {entry.calculatedHours > 0 && <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-full">{entry.calculatedHours} godz.</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-extrabold text-gray-900 flex items-center text-xl">
                    <PlusCircle className="w-6 h-6 mr-2 text-blue-600" /> Ustaw Zadanie Dnia {isKlodzkoAdmin ? "dla punktu Kłodzko" : "dla punktu / sieci"}
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Wybierz czy zadanie jest jednorazowe (doraźne), czy ma pojawiać się cyklicznie, oraz określ godzinę (deadline) wykonania.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 self-start sm:self-center">
                  <button type="button" onClick={() => setNewTaskType("adhoc")} className={`px-3.5 py-2 rounded-xl font-black text-xs transition-colors ${newTaskType === "adhoc" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                    Jednorazowe / Doraźne
                  </button>
                  <button type="button" onClick={() => setNewTaskType("recurring")} className={`px-3.5 py-2 rounded-xl font-black text-xs transition-colors ${newTaskType === "recurring" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                    Stałe harmonogramowe
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {isKlodzkoAdmin ? (
                    <div className="w-full p-4 bg-gray-100 border border-gray-200 rounded-xl font-black text-gray-700 flex items-center">Punkt docelowy: Kłodzko</div>
                  ) : (
                    <select value={newTaskLoc} onChange={(e) => setNewTaskLoc(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="All">Dla wszystkich punktów (All)</option>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  )}
                  <input
                    type="text"
                    required
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="sm:col-span-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={newTaskType === "recurring" ? "Opisz zadanie cykliczne..." : "Opisz zadanie na dziś..."}
                  />
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                    <Clock className="w-5 h-5 text-red-500 mr-2.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400">Deadline (Do godziny):</label>
                      <input
                        type="time"
                        required
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full bg-transparent font-black text-base text-gray-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {newTaskType === "recurring" && (
                  <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2.5">
                    <label className="block text-xs font-black uppercase text-indigo-900">Wybierz dni tygodnia, w które zadanie ma pojawiać się pracownikom (wielokrotny wybór):</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = newTaskDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleNewTaskDay(d.id)}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs border-2 transition-colors ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"}`}
                          >
                            {d.short} ({d.name})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform ${newTaskType === "recurring" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}>
                  {newTaskType === "recurring" ? "Zapisz stałe zadanie harmonogramowe" : "Wyślij zadanie doraźne na punkt"}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider ml-2 mb-3 mt-6">Zadania doraźne / jednorazowe ({adhocVisibleTasks.length})</h3>
              {adhocVisibleTasks.length === 0 ? <p className="text-gray-400 font-bold ml-2 text-sm">Brak aktywnych zadań doraźnych.</p> : adhocVisibleTasks.map(renderTaskCard)}
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-wider ml-2 mb-3">Stałe zadania harmonogramowe — Cykliczne ({recurringVisibleTasks.length})</h3>
              {recurringVisibleTasks.length === 0 ? <p className="text-gray-400 font-bold ml-2 text-sm">Brak zapisanych stałych zadań harmonogramowych.</p> : recurringVisibleTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {tab === "catalog" && isOwner && (
          <div className="space-y-8">
            <div className="bg-emerald-950 text-white p-6 rounded-[2rem] border border-emerald-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black flex items-center"><Download className="w-6 h-6 mr-2.5 text-emerald-400" /> Kopia Zapasowa i Eksport Danych</h3>
                <p className="text-xs text-gray-300 font-medium mt-1">Pobierz pełne archiwum raportów na swój telefon lub komputer w formacie Excel (CSV) lub pełnego obrazu bazy (JSON).</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button type="button" onClick={handleDownloadCSV} className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-xl flex items-center transition-colors shadow-md">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Pobierz Excel (CSV)
                </button>
                <button type="button" onClick={handleDownloadFullBackupJSON} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs rounded-xl flex items-center transition-colors">
                  <Download className="w-4 h-4 mr-1.5" /> Pełna Kopia (JSON)
                </button>
              </div>
            </div>

            {renderEmployeeManagerWidget()}

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xl font-black text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2.5 text-orange-600" /> Harmonogram Dostaw i Uzupełniania (Dni aktywności dla każdej kategorii)
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Wybierz dni tygodnia, w które poszczególne kategorie mają być podświetlane pracownikom jako "Do uzupełnienia dziś" i automatycznie rozwijane.
              </p>

              <form onSubmit={handleSaveDeliveryDays} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "vegetables", label: "Warzywa i Inne" },
                    { key: "freezer", label: "Stan Zamrażarek" },
                    { key: "farutex", label: "Farutex" },
                    { key: "meat1", label: "Dostawa Mięso 1" },
                    { key: "meat2", label: "Dostawa Mięso 2" },
                    { key: "otherItems", label: "Inne: Opakowania / Chemia" },
                    { key: "sauces", label: "Braki: Sosy" },
                    ...customCategoriesList.map((cat) => ({ key: `custom_${cat.id}`, label: `Kategoria własna: ${cat.name}` })),
                  ].map(({ key, label }) => {
                    const activeDays = Array.isArray(deliveryDaysDraft[key]) ? deliveryDaysDraft[key].map(Number) : [];
                    return (
                      <div key={key} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="block text-xs font-black uppercase text-gray-800">{label}</span>
                          <span className="text-[10px] font-bold text-gray-400">Wybrano dni: {activeDays.length}/7</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((d) => {
                            const isSelected = activeDays.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => handleToggleDeliveryDay(key, d.id)}
                                className={`px-3 py-2 rounded-xl font-black text-xs border-2 transition-colors ${isSelected ? "bg-orange-600 text-white border-orange-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"}`}
                              >
                                {d.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-colors text-sm">
                  Zapisz harmonogram wszystkich kategorii
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    <Settings className="w-7 h-7 mr-3 text-amber-600" /> Zarządzanie Asortymentem, Jednostkami Miary i Lokalami
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Dodawaj pozycje, wybieraj ich jednostkę miary (kg, szt., g, op., l, wiadro) i przypisuj je do konkretnych lokali.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">1. Wybierz kategorię / sekcję formularza:</label>
                  <select
                    value={selectedCatalogCategory}
                    onChange={(e) => setSelectedCatalogCategory(e.target.value)}
                    className="w-full p-4 bg-amber-50/50 border-2 border-amber-200 rounded-2xl font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <optgroup label="Standardowe kategorie formularza">
                      {builtInCategoriesMeta.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </optgroup>
                    {customCategoriesList.length > 0 && (
                      <optgroup label="Dodatkowe kategorie własne">
                        {customCategoriesList.map((c) => (
                          <option key={c.id} value={`custom:${c.id}`}>{c.name} ({c.type === "checkbox" ? "Lista Checkbox" : "Licznik +/-"})</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <form onSubmit={handleAddCatalogItem} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Wpisz nazwę nowej pozycji (np. Fartuch czarny, Ser cheddar)..."
                    className="flex-[2] p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-800 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {AVAILABLE_UNITS.map((u) => (
                      <option key={u} value={u}>Jednostka: {u}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-md flex items-center justify-center transition-colors shrink-0">
                    <PlusCircle className="w-5 h-5 mr-2" /> Dodaj pozycję
                  </button>
                </form>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase text-gray-400">Aktualne pozycje, jednostki i przypisane lokale ({activeCategoryItems.length}):</span>
                    {selectedCatalogCategory.startsWith("custom:") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCategory(selectedCatalogCategory.replace("custom:", ""))}
                        className="text-xs font-black text-red-600 hover:text-red-700 flex items-center bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Usuń całą tę kategorię
                      </button>
                    )}
                  </div>

                  {activeCategoryItems.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">Brak pozycji w tej kategorii. Dodaj pierwszą pozycję powyżej.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeCategoryItems.map((item) => {
                        const mapKey = `${selectedCatalogCategory}__${item}`;
                        const assignedLocs = Array.isArray(catalog?.itemLocations?.[mapKey])
                          ? catalog.itemLocations[mapKey]
                          : LOCATIONS;
                        const currentUnit = getItemUnit(catalog, item);
                        return (
                          <div key={item} className="p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl flex flex-col justify-between gap-3 transition-colors shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-gray-900 text-sm truncate">{item}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <select
                                  value={currentUnit}
                                  onChange={(e) => handleChangeCatalogItemUnit(item, e.target.value)}
                                  className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-800 outline-none"
                                  title="Zmień jednostkę miary"
                                >
                                  {AVAILABLE_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                                <button type="button" onClick={() => handleRemoveCatalogItem(item)} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors shrink-0" title="Usuń pozycję">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-200/70">
                              <span className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Widoczność w punktach:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {LOCATIONS.map((loc) => {
                                  const isAssigned = assignedLocs.includes(loc);
                                  return (
                                    <button
                                      key={loc}
                                      type="button"
                                      onClick={() => handleToggleItemLocation(item, loc)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-colors ${
                                        isAssigned
                                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                          : "bg-white text-gray-400 border-gray-200 hover:border-amber-300"
                                      }`}
                                    >
                                      {loc}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 flex items-center mb-2">
                <FolderPlus className="w-6 h-6 mr-2.5 text-indigo-600" /> Utwórz Nową Kategorię w Formularzu Pracownika
              </h3>
              <p className="text-xs font-semibold text-gray-500 mb-4">Jeśli potrzebujesz zupełnie nowej sekcji (np. "Napoje", "Sprzęt i Odzież", "Chemia gospodarcza"), utwórz ją tutaj.</p>
              <form onSubmit={handleCreateCustomCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nazwa nowej kategorii (np. Odzież )..."
                  className="sm:col-span-1 p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <select value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value)} className="p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="counter">Licznik ilościowy (+/- jak magazyn)</option>
                  <option value="checkbox">Lista zaznaczania (Checkbox jak braki sosów)</option>
                </select>
                <button type="submit" className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center justify-center transition-colors">
                  <PlusCircle className="w-5 h-5 mr-2" /> Dodaj kategorię
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 flex items-center mb-2">
                <KeyRound className="w-6 h-6 mr-2.5 text-blue-600" /> Unikalne Kody PIN dla Punktów (Logowanie Pracowników)
              </h3>
              <p className="text-xs font-semibold text-gray-500 mb-5">Każdy punkt posiada własny kod PIN. Pracownik z jednego punktu nie wejdzie na formularz innego punktu.</p>
              <form onSubmit={handleSavePins} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {LOCATIONS.map((loc) => (
                    <div key={loc} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">PIN punktu: {loc}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pinDrafts[loc] || ""}
                        onChange={(e) => setPinDrafts((prev) => ({ ...prev, [loc]: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl font-black text-xl text-center tracking-widest text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-xl shadow-md transition-colors text-sm">
                  Zapisz kody PIN punktów
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
