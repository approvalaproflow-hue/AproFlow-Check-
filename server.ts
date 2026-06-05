import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { User, RequestForm, AuditLog, Notification, Commission } from "./src/types.ts";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc as originalSetDoc, deleteDoc, onSnapshot } from "firebase/firestore";

function cleanObjectForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore);
  }
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = cleanObjectForFirestore(val);
    }
  }
  return clean;
}

function setDoc(documentRef: any, data: any, options?: any) {
  const cleanedData = cleanObjectForFirestore(data);
  return originalSetDoc(documentRef, cleanedData, options);
}

// Environment & path helpers supporting both ESM (tsx) and CommonJS (esbuild bundle)
let resolvedFilename = "";
let resolvedDirname = "";

try {
  if (typeof __filename !== "undefined") {
    resolvedFilename = __filename;
  } else if (typeof import.meta !== "undefined" && import.meta.url) {
    resolvedFilename = fileURLToPath(import.meta.url);
  }
} catch (err) {
  resolvedFilename = "";
}

try {
  if (typeof __dirname !== "undefined") {
    resolvedDirname = __dirname;
  } else if (resolvedFilename) {
    resolvedDirname = path.dirname(resolvedFilename);
  } else {
    resolvedDirname = process.cwd();
  }
} catch (err) {
  resolvedDirname = process.cwd();
}

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-requested-with, content-type, authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Environment setup & collection naming
const isProduction = process.env.NODE_ENV === "production" || resolvedDirname.includes("dist");
if (isProduction && process.env.NODE_ENV !== "production") {
  process.env.NODE_ENV = "production";
}

function getCollectionName(baseName: string): string {
  const prefix = isProduction ? "prod_" : "dev_";
  return `${prefix}${baseName}`;
}

// Database loaded indicators
let isDbLoadedFromFirestore = false;
let isSyncingToFirestore = false;
let isBootstrapping = false;

// In-Memory Database Cache with Firestore Write-Through
const PERSIST_FILE = isProduction 
  ? path.join(process.cwd(), "local-db-persist-prod.json")
  : (fs.existsSync(path.join(process.cwd(), "local-db-persist-dev.json"))
      ? path.join(process.cwd(), "local-db-persist-dev.json")
      : (fs.existsSync(path.join(process.cwd(), "local-db-persist.json"))
          ? path.join(process.cwd(), "local-db-persist.json")
          : path.join(process.cwd(), "local-db-persist-dev.json")));

let dbInMemory: any = null;
let lastSavedDb: any = null;

let syncErrors: string[] = [];

function recordSyncError(moduleName: string, err: any) {
  const errMsg = `${new Date().toISOString()} [${moduleName}]: ${err.message || String(err)}`;
  console.error(errMsg);
  syncErrors.unshift(errMsg);
  if (syncErrors.length > 50) syncErrors.pop();
}

async function getUsersFromFirestore(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("users")));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    return users;
  } catch (err) {
    recordSyncError("getUsers", err);
    throw err;
  }
}

async function getRequestsFromFirestore(): Promise<RequestForm[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("requests")));
    const requests: RequestForm[] = [];
    querySnapshot.forEach((doc) => {
      requests.push(doc.data() as RequestForm);
    });
    return requests;
  } catch (err) {
    recordSyncError("getRequests", err);
    throw err;
  }
}

async function getAuditLogsFromFirestore(): Promise<AuditLog[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("auditLogs")));
    const auditLogs: AuditLog[] = [];
    querySnapshot.forEach((doc) => {
      auditLogs.push(doc.data() as AuditLog);
    });
    return auditLogs;
  } catch (err) {
    recordSyncError("getAuditLogs", err);
    throw err;
  }
}

async function getNotificationsFromFirestore(): Promise<Notification[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("notifications")));
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push(doc.data() as Notification);
    });
    return notifications;
  } catch (err) {
    recordSyncError("getNotifications", err);
    throw err;
  }
}

async function getNumberingSettingsConfigsFromFirestore(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("numberingSettingsConfigs")));
    const configs: any[] = [];
    querySnapshot.forEach((doc) => {
      configs.push(doc.data());
    });
    return configs;
  } catch (err) {
    recordSyncError("getNumberingSettingsConfigs", err);
    throw err;
  }
}

async function getCommissionsFromFirestore(): Promise<Commission[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("commissions")));
    const commissions: Commission[] = [];
    querySnapshot.forEach((doc) => {
      commissions.push(doc.data() as Commission);
    });
    return commissions;
  } catch (err) {
    recordSyncError("getCommissions", err);
    throw err;
  }
}

async function getCreditCardsFromFirestore(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("creditCards")));
    const creditCards: any[] = [];
    querySnapshot.forEach((doc) => {
      creditCards.push(doc.data());
    });
    return creditCards;
  } catch (err) {
    recordSyncError("getCreditCards", err);
    throw err;
  }
}

async function getSavedPdfsFromFirestore(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, getCollectionName("savedPdfs")));
    const pdfs: any[] = [];
    querySnapshot.forEach((doc) => {
      pdfs.push(doc.data());
    });
    return pdfs;
  } catch (err) {
    recordSyncError("getSavedPdfs", err);
    throw err;
  }
}

async function bootstrapDatabase() {
  if (isBootstrapping) return;
  isBootstrapping = true;
  console.log("Connecting to Firestore to bootstrap database...");
  try {
    const [users, requests, auditLogs, notifications, numberingSettingsConfigs, commissions, creditCards, savedPdfs] = await Promise.all([
      getUsersFromFirestore(),
      getRequestsFromFirestore(),
      getAuditLogsFromFirestore(),
      getNotificationsFromFirestore(),
      getNumberingSettingsConfigsFromFirestore(),
      getCommissionsFromFirestore(),
      getCreditCardsFromFirestore(),
      getSavedPdfsFromFirestore()
    ]);
    
    let mergedUsers = [...users];
    let mergedRequests = [...requests];
    let mergedAuditLogs = [...auditLogs];
    let mergedNotifications = [...notifications];
    let mergedConfigs = [...numberingSettingsConfigs];
    let mergedCommissions = [...commissions];
    let mergedCreditCards = [...creditCards];
    let mergedSavedPdfs = [...savedPdfs];

    lastSavedDb = {
      users: JSON.parse(JSON.stringify(users)),
      requests: JSON.parse(JSON.stringify(requests)),
      auditLogs: JSON.parse(JSON.stringify(auditLogs)),
      notifications: JSON.parse(JSON.stringify(notifications)),
      numberingSettingsConfigs: JSON.parse(JSON.stringify(numberingSettingsConfigs)),
      commissions: JSON.parse(JSON.stringify(commissions)),
      creditCards: JSON.parse(JSON.stringify(creditCards)),
      savedPdfs: JSON.parse(JSON.stringify(savedPdfs))
    };

    // Read local cache to find and safely merge any newly created/modified records offline
    // We ONLY merge from the local cache file if Firestore is completely empty (e.g., brand new DB setup)
    // to avoid stale pre-packaged/committed database JSON overrides on startup, restarts, or new deployments.
    const isFirestoreEmpty = users.length === 0 && requests.length === 0;
    if (fs.existsSync(PERSIST_FILE) && isFirestoreEmpty) {
      try {
        const localDb = JSON.parse(fs.readFileSync(PERSIST_FILE, "utf-8"));
        
        if (Array.isArray(localDb.users)) {
          for (const lu of localDb.users) {
            if (!mergedUsers.find((mu: any) => mu.id === lu.id)) {
              console.log(`Bootstrapping: merging offline user ${lu.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("users"), lu.id), lu);
              mergedUsers.push(lu);
            }
          }
        }
        if (Array.isArray(localDb.requests)) {
          for (const lr of localDb.requests) {
            if (!mergedRequests.find((mr: any) => mr.id === lr.id)) {
              console.log(`Bootstrapping: merging offline request ${lr.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("requests"), lr.id), lr);
              mergedRequests.push(lr);
            }
          }
        }
        if (Array.isArray(localDb.auditLogs)) {
          for (const la of localDb.auditLogs) {
            if (!mergedAuditLogs.find((ma: any) => ma.id === la.id)) {
              console.log(`Bootstrapping: merging offline auditLog ${la.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("auditLogs"), la.id), la);
              mergedAuditLogs.push(la);
            }
          }
        }
        if (Array.isArray(localDb.notifications)) {
          for (const ln of localDb.notifications) {
            if (!mergedNotifications.find((mn: any) => mn.id === ln.id)) {
              console.log(`Bootstrapping: merging offline notification ${ln.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("notifications"), ln.id), ln);
              mergedNotifications.push(ln);
            }
          }
        }
        if (Array.isArray(localDb.numberingSettingsConfigs)) {
          for (const lc of localDb.numberingSettingsConfigs) {
            if (!mergedConfigs.find((mc: any) => mc.id === lc.id)) {
              console.log(`Bootstrapping: merging offline config ${lc.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("numberingSettingsConfigs"), lc.id), lc);
              mergedConfigs.push(lc);
            }
          }
        }
        if (Array.isArray(localDb.commissions)) {
          for (const lc of localDb.commissions) {
            if (!mergedCommissions.find((mc: any) => mc.id === lc.id)) {
              console.log(`Bootstrapping: merging offline commission ${lc.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("commissions"), lc.id), lc);
              mergedCommissions.push(lc);
            }
          }
        }
        if (Array.isArray(localDb.creditCards)) {
          for (const lc of localDb.creditCards) {
            if (!mergedCreditCards.find((mc: any) => mc.id === lc.id)) {
              console.log(`Bootstrapping: merging offline creditCard ${lc.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("creditCards"), lc.id), lc);
              mergedCreditCards.push(lc);
            }
          }
        }
        if (Array.isArray(localDb.savedPdfs)) {
          for (const lp of localDb.savedPdfs) {
            if (!mergedSavedPdfs.find((mp: any) => mp.id === lp.id)) {
              console.log(`Bootstrapping: merging offline savedPdf ${lp.id} into Firestore...`);
              await setDoc(doc(firestoreDb, getCollectionName("savedPdfs"), lp.id), lp);
              mergedSavedPdfs.push(lp);
            }
          }
        }
      } catch (err) {
        recordSyncError("BootstrapMergeLocalCache", err);
      }
    }

    if (mergedUsers.length === 0) {
      console.log("Firestore and cache both empty, seeding initial database...");
      const initialState = getInitialState();
      
      // Seed Firestore with initial state
      for (const u of initialState.users) {
        await setDoc(doc(firestoreDb, getCollectionName("users"), u.id), u);
      }
      for (const r of initialState.requests) {
        await setDoc(doc(firestoreDb, getCollectionName("requests"), r.id), r);
      }
      for (const l of initialState.auditLogs) {
        await setDoc(doc(firestoreDb, getCollectionName("auditLogs"), l.id), l);
      }
      for (const n of initialState.notifications) {
        await setDoc(doc(firestoreDb, getCollectionName("notifications"), n.id), n);
      }
      if (initialState.commissions) {
        for (const c of initialState.commissions) {
          await setDoc(doc(firestoreDb, getCollectionName("commissions"), c.id), c);
        }
      }
      console.log("Database seeded successfully to Firestore!");
      dbInMemory = { ...initialState, commissions: initialState.commissions || [], creditCards: [], savedPdfs: [] };
    } else {
      console.log(`Loaded and synchronized unified Firestore database: ${mergedUsers.length} users, ${mergedRequests.length} requests, ${mergedAuditLogs.length} audit logs, ${mergedNotifications.length} notifications, ${mergedConfigs.length} numbering configs, ${mergedCommissions.length} commissions, ${mergedCreditCards.length} credit cards, ${mergedSavedPdfs.length} saved PDFs.`);
      
      dbInMemory = { 
        users: mergedUsers, 
        requests: mergedRequests, 
        auditLogs: mergedAuditLogs, 
        notifications: mergedNotifications, 
        numberingSettingsConfigs: mergedConfigs, 
        commissions: mergedCommissions,
        creditCards: mergedCreditCards,
        savedPdfs: mergedSavedPdfs
      };
    }
    isDbLoadedFromFirestore = true;
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
    // Background merge any offline cache discrepancies to Firestore
    saveCollectionsToFirestore(dbInMemory)
      .catch((err) => console.error("Error pushing bootstrapped local modifications to Firestore on startup:", err))
      .finally(() => {
        setupRealtimeSync();
      });
  } catch (error) {
    recordSyncError("BootstrapGeneral", error);
    if (fs.existsSync(PERSIST_FILE)) {
      try {
        dbInMemory = JSON.parse(fs.readFileSync(PERSIST_FILE, "utf-8"));
        console.log("Successfully loaded database from local persistent file cache.");
      } catch (err) {
        recordSyncError("BootstrapLocalFallback", err);
        dbInMemory = getInitialState();
      }
    } else {
      dbInMemory = getInitialState();
    }
    if (!dbInMemory.commissions) {
      dbInMemory.commissions = [];
    }
    if (!dbInMemory.savedPdfs) {
      dbInMemory.savedPdfs = [];
    }
    lastSavedDb = JSON.parse(JSON.stringify(dbInMemory));
    isDbLoadedFromFirestore = false;
    
    // Automatically retry bootstrapping in 15 seconds to establish Firestore connection
    console.log("Scheduling background retry for Firestore connection in 15 seconds...");
    setTimeout(() => {
      bootstrapDatabase().catch(err => console.error("Error running retried bootstrap:", err));
    }, 15000);
  } finally {
    isBootstrapping = false;
  }
}

function compareCollections(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  
  const sortKeys = (obj: any): any => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    const sortedObj: any = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = sortKeys(obj[key]);
    });
    return sortedObj;
  };

  const sorted1 = [...arr1].map(sortKeys).sort((a, b) => (String(a.id || "")).localeCompare(String(b.id || "")));
  const sorted2 = [...arr2].map(sortKeys).sort((a, b) => (String(a.id || "")).localeCompare(String(b.id || "")));
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

let activeUnsubscribeFns: (() => void)[] = [];

function setupRealtimeSync() {
  console.log("Setting up real-time sync with Firestore...");

  // Unsubscribe from any previous listeners to avoid duplicates
  activeUnsubscribeFns.forEach((unsub) => {
    try {
      unsub();
    } catch (e) {
      console.error("Error unsubscribing database listener:", e);
    }
  });
  activeUnsubscribeFns = [];

  // Sync users
  const unsubUsers = onSnapshot(collection(firestoreDb, getCollectionName("users")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const users: User[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    if (!compareCollections(dbInMemory.users, users)) {
      console.log(`Real-time sync: users updated. Synced ${users.length} records.`);
      dbInMemory.users = users;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.users = JSON.parse(JSON.stringify(users));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on users sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for users:", err);
  });
  activeUnsubscribeFns.push(unsubUsers);

  // Sync requests
  const unsubRequests = onSnapshot(collection(firestoreDb, getCollectionName("requests")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const requests: RequestForm[] = [];
    snapshot.forEach((doc) => {
      requests.push(doc.data() as RequestForm);
    });
    if (!compareCollections(dbInMemory.requests, requests)) {
      console.log(`Real-time sync: requests updated. Synced ${requests.length} records.`);
      dbInMemory.requests = requests;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.requests = JSON.parse(JSON.stringify(requests));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on requests sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for requests:", err);
  });
  activeUnsubscribeFns.push(unsubRequests);

  // Sync auditLogs
  const unsubAuditLogs = onSnapshot(collection(firestoreDb, getCollectionName("auditLogs")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const auditLogs: AuditLog[] = [];
    snapshot.forEach((doc) => {
      auditLogs.push(doc.data() as AuditLog);
    });
    if (!compareCollections(dbInMemory.auditLogs, auditLogs)) {
      console.log(`Real-time sync: auditLogs updated. Synced ${auditLogs.length} records.`);
      dbInMemory.auditLogs = auditLogs;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.auditLogs = JSON.parse(JSON.stringify(auditLogs));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on auditLogs sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for auditLogs:", err);
  });
  activeUnsubscribeFns.push(unsubAuditLogs);

  // Sync notifications
  const unsubNotifications = onSnapshot(collection(firestoreDb, getCollectionName("notifications")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push(doc.data() as Notification);
    });
    if (!compareCollections(dbInMemory.notifications, notifications)) {
      console.log(`Real-time sync: notifications updated. Synced ${notifications.length} records.`);
      dbInMemory.notifications = notifications;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.notifications = JSON.parse(JSON.stringify(notifications));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on notifications sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for notifications:", err);
  });
  activeUnsubscribeFns.push(unsubNotifications);

  // Sync numberingSettingsConfigs
  const unsubConfigs = onSnapshot(collection(firestoreDb, getCollectionName("numberingSettingsConfigs")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const configs: any[] = [];
    snapshot.forEach((doc) => {
      configs.push(doc.data());
    });
    if (!compareCollections(dbInMemory.numberingSettingsConfigs, configs)) {
      console.log(`Real-time sync: numberingSettingsConfigs updated. Synced ${configs.length} records.`);
      dbInMemory.numberingSettingsConfigs = configs;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.numberingSettingsConfigs = JSON.parse(JSON.stringify(configs));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on numberingSettingsConfigs sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for numberingSettingsConfigs:", err);
  });
  activeUnsubscribeFns.push(unsubConfigs);

  // Sync commissions
  const unsubCommissions = onSnapshot(collection(firestoreDb, getCollectionName("commissions")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const commissions: Commission[] = [];
    snapshot.forEach((doc) => {
      commissions.push(doc.data() as Commission);
    });
    if (!compareCollections(dbInMemory.commissions, commissions)) {
      console.log(`Real-time sync: commissions updated. Synced ${commissions.length} records.`);
      dbInMemory.commissions = commissions;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.commissions = JSON.parse(JSON.stringify(commissions));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on commissions sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for commissions:", err);
  });
  activeUnsubscribeFns.push(unsubCommissions);

  // Sync creditCards
  const unsubCreditCards = onSnapshot(collection(firestoreDb, getCollectionName("creditCards")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const creditCards: any[] = [];
    snapshot.forEach((doc) => {
      creditCards.push(doc.data());
    });
    if (!compareCollections(dbInMemory.creditCards, creditCards)) {
      console.log(`Real-time sync: creditCards updated. Synced ${creditCards.length} records.`);
      dbInMemory.creditCards = creditCards;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.creditCards = JSON.parse(JSON.stringify(creditCards));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on creditCards sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for creditCards:", err);
  });
  activeUnsubscribeFns.push(unsubCreditCards);

  // Sync savedPdfs
  const unsubSavedPdfs = onSnapshot(collection(firestoreDb, getCollectionName("savedPdfs")), (snapshot) => {
    if (!dbInMemory || !isDbLoadedFromFirestore || isSyncingToFirestore) return;
    const savedPdfs: any[] = [];
    snapshot.forEach((doc) => {
      savedPdfs.push(doc.data());
    });
    if (!compareCollections(dbInMemory.savedPdfs, savedPdfs)) {
      console.log(`Real-time sync: savedPdfs updated. Synced ${savedPdfs.length} records.`);
      dbInMemory.savedPdfs = savedPdfs;
      if (!lastSavedDb) lastSavedDb = {};
      lastSavedDb.savedPdfs = JSON.parse(JSON.stringify(savedPdfs));
      try {
        fs.writeFileSync(PERSIST_FILE, JSON.stringify(dbInMemory, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write to local-db-persist on savedPdfs sync:", err);
      }
    }
  }, (err) => {
    console.error("Real-time sync error for savedPdfs:", err);
  });
  activeUnsubscribeFns.push(unsubSavedPdfs);
}

async function saveCollectionsToFirestore(data: any) {
  if (!dbInMemory || !isDbLoadedFromFirestore) return;
  isSyncingToFirestore = true;
  try {
    if (!lastSavedDb) {
      for (const u of data.users) await setDoc(doc(firestoreDb, getCollectionName("users"), u.id), u);
      for (const r of data.requests) await setDoc(doc(firestoreDb, getCollectionName("requests"), r.id), r);
      for (const l of data.auditLogs) await setDoc(doc(firestoreDb, getCollectionName("auditLogs"), l.id), l);
      for (const n of data.notifications) await setDoc(doc(firestoreDb, getCollectionName("notifications"), n.id), n);
      if (data.numberingSettingsConfigs) {
        for (const c of data.numberingSettingsConfigs) await setDoc(doc(firestoreDb, getCollectionName("numberingSettingsConfigs"), c.id), c);
      }
      if (data.commissions) {
        for (const c of data.commissions) await setDoc(doc(firestoreDb, getCollectionName("commissions"), c.id), c);
      }
      if (data.creditCards) {
        for (const c of data.creditCards) await setDoc(doc(firestoreDb, getCollectionName("creditCards"), c.id), c);
      }
      if (data.savedPdfs) {
        for (const p of data.savedPdfs) await setDoc(doc(firestoreDb, getCollectionName("savedPdfs"), p.id), p);
      }
      lastSavedDb = JSON.parse(JSON.stringify(data));
      return;
    }

    // Find added/updated users
    for (const u of data.users) {
      const prev = lastSavedDb.users.find((pu: any) => pu.id === u.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(u)) {
        await setDoc(doc(firestoreDb, getCollectionName("users"), u.id), u);
      }
    }
    // Find added/updated requests
    for (const r of data.requests) {
      const prev = lastSavedDb.requests.find((pr: any) => pr.id === r.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(r)) {
        await setDoc(doc(firestoreDb, getCollectionName("requests"), r.id), r);
      }
    }
    // Find added/updated audit logs
    for (const l of data.auditLogs) {
      const prev = lastSavedDb.auditLogs.find((pl: any) => pl.id === l.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(l)) {
        await setDoc(doc(firestoreDb, getCollectionName("auditLogs"), l.id), l);
      }
    }
    // Find added/updated notifications
    for (const n of data.notifications) {
      const prev = lastSavedDb.notifications.find((pn: any) => pn.id === n.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(n)) {
        await setDoc(doc(firestoreDb, getCollectionName("notifications"), n.id), n);
      }
    }
    // Find added/updated numbering settings configs
    if (data.numberingSettingsConfigs) {
      for (const c of data.numberingSettingsConfigs) {
        const prev = lastSavedDb.numberingSettingsConfigs ? lastSavedDb.numberingSettingsConfigs.find((pc: any) => pc.id === c.id) : null;
        if (!prev || JSON.stringify(prev) !== JSON.stringify(c)) {
          await setDoc(doc(firestoreDb, getCollectionName("numberingSettingsConfigs"), c.id), c);
        }
      }
    }
    // Find added/updated commissions
    if (data.commissions) {
      for (const c of data.commissions) {
        const prev = lastSavedDb.commissions ? lastSavedDb.commissions.find((pc: any) => pc.id === c.id) : null;
        if (!prev || JSON.stringify(prev) !== JSON.stringify(c)) {
          await setDoc(doc(firestoreDb, getCollectionName("commissions"), c.id), c);
        }
      }
    }
    // Find added/updated credit cards
    if (data.creditCards) {
      for (const c of data.creditCards) {
        const prev = lastSavedDb.creditCards ? lastSavedDb.creditCards.find((pc: any) => pc.id === c.id) : null;
        if (!prev || JSON.stringify(prev) !== JSON.stringify(c)) {
          await setDoc(doc(firestoreDb, getCollectionName("creditCards"), c.id), c);
        }
      }
    }
    // Find added/updated saved PDFs
    if (data.savedPdfs) {
      for (const p of data.savedPdfs) {
        const prev = lastSavedDb.savedPdfs ? lastSavedDb.savedPdfs.find((pp: any) => pp.id === p.id) : null;
        if (!prev || JSON.stringify(prev) !== JSON.stringify(p)) {
          await setDoc(doc(firestoreDb, getCollectionName("savedPdfs"), p.id), p);
        }
      }
    }

    lastSavedDb = JSON.parse(JSON.stringify(data));
  } finally {
    isSyncingToFirestore = false;
  }
}

function readDatabase() {
  if (!dbInMemory) {
    dbInMemory = getInitialState();
  }
  if (!dbInMemory.commissions) {
    dbInMemory.commissions = [];
  }
  if (!dbInMemory.creditCards) {
    dbInMemory.creditCards = [];
  }
  if (!isDbLoadedFromFirestore && !isBootstrapping) {
    console.log("Database read requested but Firestore is not loaded. Triggering self-healing bootstrap in background...");
    bootstrapDatabase().catch((err) => {
      console.error("Background read-triggered bootstrap failed:", err);
    });
  }
  return dbInMemory;
}

function writeDatabase(data: any) {
  dbInMemory = data;
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database to local persistent file:", err);
  }
  if (!isDbLoadedFromFirestore) {
    console.warn("Database not yet fully connected to Firestore. Background bootstrap triggered...");
    bootstrapDatabase().then(() => {
      saveCollectionsToFirestore(data).catch((err) => {
        console.error("Post-reconnect asynchronous write to Firestore failed:", err);
      });
    });
  } else {
    saveCollectionsToFirestore(data).catch((err) => {
      console.error("Asynchronous write to Firestore failed:", err);
    });
  }
}

async function persistDirectlyToFirestore(db: any, updates: {
  requests?: any | any[];
  auditLogs?: any | any[];
  notifications?: any | any[];
  numberingSettingsConfigs?: any | any[];
  commissions?: any | any[];
  creditCards?: any | any[];
  savedPdfs?: any | any[];
  users?: any | any[];
}, deletions?: {
  requests?: string | string[];
  auditLogs?: string | string[];
  notifications?: string | string[];
  numberingSettingsConfigs?: string | string[];
  commissions?: string | string[];
  creditCards?: string | string[];
  savedPdfs?: string | string[];
  users?: string | string[];
}) {
  // Save locally synchronously first
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database to local persistent file:", err);
  }

  const savePromises: Promise<void>[] = [];

  const collectionsMap = {
    requests: "requests",
    auditLogs: "auditLogs",
    notifications: "notifications",
    numberingSettingsConfigs: "numberingSettingsConfigs",
    commissions: "commissions",
    creditCards: "creditCards",
    savedPdfs: "savedPdfs",
    users: "users"
  };

  // Process updates/creations
  for (const [key, collName] of Object.entries(collectionsMap)) {
    const val = (updates as any)[key];
    if (val) {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        if (item && item.id) {
          savePromises.push(
            setDoc(doc(firestoreDb, getCollectionName(collName), item.id), item)
          );
        }
      }
    }
  }

  // Process deletions
  if (deletions) {
    for (const [key, collName] of Object.entries(collectionsMap)) {
      const val = (deletions as any)[key];
      if (val) {
        const ids = Array.isArray(val) ? val : [val];
        for (const id of ids) {
          if (id) {
            savePromises.push(
              deleteDoc(doc(firestoreDb, getCollectionName(collName), id))
            );
          }
        }
      }
    }
  }

  if (savePromises.length > 0) {
    await Promise.all(savePromises);
  }

  // Make sure dbInMemory and lastSavedDb states are aligned
  writeDatabase(db);
}

// Initial preseeded users and requests matching specification
function getInitialState() {
  const users: User[] = [
    {
      id: "admin-id",
      email: "adminapproval@gmail.com",
      name: "System Super Admin",
      employeeCode: "adminapproval",
      doj: "2020-01-01",
      department: "Management",
      role: "superadmin",
      status: "active",
      enterpriseCode: "2026",
      enterpriseName: "PROFLOW ENTERPRISE",
      password: "Admin123#"
    },
    {
      id: "admin-2026",
      email: "admin2026@gmail.com",
      name: "MB Executive Admin",
      employeeCode: "admin2026",
      doj: "2026-01-01",
      department: "Management",
      role: "admin",
      status: "active",
      enterpriseCode: "2026",
      enterpriseName: "PROFLOW ENTERPRISE",
      password: "MB2026"
    },
    {
      id: "emp-priya",
      email: "priya@gmail.com",
      name: "Priya Sharma",
      employeeCode: "EMP-010",
      doj: "2022-04-10",
      department: "Inspections",
      role: "employee",
      status: "active",
      enterpriseCode: "2026"
    },
    {
      id: "emp-rahul",
      email: "rahul@gmail.com",
      name: "Rahul Verma",
      employeeCode: "EMP-011",
      doj: "2021-08-15",
      department: "Sales",
      role: "employee",
      status: "active",
      enterpriseCode: "2026"
    },
    {
      id: "emp-amit",
      email: "amit@gmail.com",
      name: "Amit Patel",
      employeeCode: "EMP-012",
      doj: "2023-01-10",
      department: "Operations",
      role: "employee",
      status: "active",
      enterpriseCode: "2026"
    }
  ];

  const requests: RequestForm[] = [
    {
      id: "PR-2026-001",
      userId: "emp-priya",
      employeeName: "Priya Sharma",
      projectName: "Q2 Field Survey Equipment",
      submissionDate: "2026-05-18",
      items: [
        {
          id: "item-1",
          description: "Laser Distance Meter Pro",
          quantity: 2,
          unitPrice: 12500,
          taxPercent: 18,
          total: 29500
        },
        {
          id: "item-2",
          description: "Waterproof Safety Vests & Helmets",
          quantity: 10,
          unitPrice: 1500,
          taxPercent: 5,
          total: 15750
        }
      ],
      totalBudget: 45250,
      category: "Equipment",
      status: "Approved",
      lastUpdated: "2026-05-19T10:30:00Z",
      totals: {
        netTotal: 40000,
        cgst: 2625,
        sgst: 2625,
        adjustments: 0,
        grandTotal: 45250
      },
      attachments: ["survey_specs_v3.pdf"],
      comments: [
        {
          id: "c-101",
          userId: "admin-2026",
          userName: "MB Executive Admin",
          role: "admin",
          text: "Equipment spec verified. Project starts next month, order is approved.",
          timestamp: "2026-05-19T10:30:00Z"
        }
      ],
      approvalDetails: {
        approvedBy: "MB Executive Admin",
        approvalDate: "2026-05-19",
        adminRemarks: "Verified with department head, approved for field operation."
      },
      enterpriseCode: "2026"
    },
    {
      id: "PR-2026-002",
      userId: "emp-rahul",
      employeeName: "Rahul Verma",
      projectName: "Sales Pitch Collateral Printing",
      submissionDate: "2026-05-20",
      items: [
        {
          id: "item-3",
          description: "Corporate Brochures & Rollup Banners",
          quantity: 150,
          unitPrice: 180,
          taxPercent: 12,
          total: 30240
        }
      ],
      totalBudget: 30240,
      category: "Marketing",
      status: "Pending",
      lastUpdated: "2026-05-20T14:15:00Z",
      totals: {
        netTotal: 27000,
        cgst: 1620,
        sgst: 1620,
        adjustments: 0,
        grandTotal: 30240
      },
      attachments: [],
      comments: [],
      approvalDetails: {},
      enterpriseCode: "2026"
    },
    {
      id: "PR-2026-003",
      userId: "emp-amit",
      employeeName: "Amit Patel",
      projectName: "Server Room UPS Replacement",
      submissionDate: "2026-05-21",
      items: [
        {
          id: "item-4",
          description: "3kVA Smart Online UPS System",
          quantity: 1,
          unitPrice: 55000,
          taxPercent: 18,
          total: 64900
        }
      ],
      totalBudget: 64900,
      category: "IT Infrastructure",
      status: "Queried",
      lastUpdated: "2026-05-22T08:00:00Z",
      totals: {
        netTotal: 55000,
        cgst: 4950,
        sgst: 4950,
        adjustments: 0,
        grandTotal: 64900
      },
      attachments: ["ups_quotation.pdf"],
      comments: [
        {
          id: "c-102",
          userId: "admin-2026",
          userName: "MB Executive Admin",
          role: "admin",
          text: "Can we get another competitor quote for the 3kVA unit before proceeding? Price looks a bit premium.",
          timestamp: "2026-05-22T08:00:00Z"
        }
      ],
      approvalDetails: {},
      enterpriseCode: "2026"
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log-initial",
      userId: "system",
      userName: "System Server",
      action: "INIT_SEED",
      timestamp: new Date().toISOString(),
      details: "Database initialized with secure seeds.",
      enterpriseCode: "2026"
    },
    {
      id: "log-seed-appr",
      userId: "admin-2026",
      userName: "MB Executive Admin",
      action: "REQS_APPROVE",
      timestamp: "2026-05-19T10:30:00Z",
      details: "Approved field survey equipment PR-2026-001 worth ₹45,250",
      enterpriseCode: "2026"
    }
  ];

  const notifications: Notification[] = [
    {
      id: "notif-seed-1",
      userId: "emp-priya",
      title: "Purchase Request Approved",
      message: "PR-2026-001 for Q2 Field Survey Equipment was approved by Admin.",
      timestamp: "2026-05-19T10:30:00Z",
      read: false,
      type: "success",
      enterpriseCode: "2026"
    },
    {
      id: "notif-seed-2",
      userId: "emp-amit",
      title: "Clarification Requested",
      message: "Admin posted a query on PR-2026-003: Please fetch another vendor quote.",
      timestamp: "2026-05-22T08:00:00Z",
      read: false,
      type: "warning",
      enterpriseCode: "2026"
    }
  ];

  return { users, requests, auditLogs, notifications, numberingSettingsConfigs: [], commissions: [], creditCards: [], savedPdfs: [] };
}

// Middleware to extract authenticated enterprise user from security headers
function getUserFromHeaders(req: express.Request): User | null {
  const token = req.headers.authorization;
  if (!token) return null;

  const db = readDatabase();
  const userId = token.replace("session-for-", "")
                      .replace("admin-signed-session-google", "admin-id")
                      .replace("admin-signed-session", "admin-id");
  
  if (userId.startsWith("session-for-")) {
    const realId = userId.replace("session-for-", "");
    return db.users.find((u: User) => u.id === realId) || null;
  }
  return db.users.find((u: User) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) || null;
}

function getEnterpriseNameForUser(db: any, user: User): string {
  if (user.role === "admin" || user.role === "superadmin") {
    return user.enterpriseName || `${user.name}'s Enterprise Workspace`;
  }
  const admin = db.users.find((u: User) => 
    (u.role === "admin" || u.role === "superadmin") && 
    u.enterpriseCode === user.enterpriseCode
  );
  return admin?.enterpriseName || `${admin?.name || "Corporate"}'s Enterprise Workspace`;
}

// --- API ROUTES ---

// API 1A: Standard authorization endpoint
app.post("/api/auth/login", (req, res) => {
  const db = readDatabase();
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email/Username and password are required" });
  }

  const inputLower = email.toLowerCase().trim();

  // Check matching User (any active role: superadmin, admin, head, employee)
  let matchedUser = db.users.find((u: User) => 
    (u.email.toLowerCase() === inputLower || u.employeeCode.toLowerCase() === inputLower)
  );

  if (matchedUser) {
    if (matchedUser.status === "inactive") {
      return res.status(403).json({ error: "Your account is currently disabled. Please contact the Admin." });
    }
    
    const correctPassword = matchedUser.password === password;
    if (!correctPassword) {
      return res.status(401).json({ error: "Incorrect password for this account" });
    }

    const userWithBrand = { ...matchedUser, enterpriseName: getEnterpriseNameForUser(db, matchedUser) };
    return res.json({ user: userWithBrand, token: `session-for-${matchedUser.id}` });
  }

  return res.status(404).json({ error: "No registered administrator, head or employee found matching this email/username." });
});

// API 1B: Register Admin with permanent 4-digit code
app.post("/api/auth/register-admin", async (req, res) => {
  const db = readDatabase();
  const { email, name, username, password, enterpriseName } = req.body;

  if (!email || !name || !username || !password || !enterpriseName) {
    return res.status(400).json({ error: "All fields are required to register an Administrator, including an Enterprise / Company Name" });
  }

  const emailLower = email.toLowerCase().trim();
  const usernameLower = username.toLowerCase().trim();

  // Check if name, email or username already taken
  const nameLower = name.trim().toLowerCase();
  const existingName = db.users.find((u: User) => u.name.trim().toLowerCase() === nameLower);
  if (existingName) {
    return res.status(400).json({ error: "Administrator name already exists" });
  }

  const existingUsername = db.users.find((u: User) => u.employeeCode.toLowerCase() === usernameLower);
  if (existingUsername) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const existingEmail = db.users.find((u: User) => u.email.toLowerCase() === emailLower);
  if (existingEmail) {
    return res.status(400).json({ error: "An administrator or employee with this Email already exists" });
  }

  // Generate unique 4-digit code
  let generatedCode = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 100) {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    generatedCode = String(codeNum);
    const codeExists = db.users.some((u: User) => (u.role === "admin" || u.role === "superadmin") && u.enterpriseCode === generatedCode);
    if (!codeExists) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) generatedCode = "8888"; // Fallback

  const newAdmin: User = {
    id: "admin-" + Date.now().toString(),
    email: emailLower,
    name,
    employeeCode: username, // Save username in employeeCode for seamless compatibility
    doj: new Date().toISOString().split("T")[0],
    department: "Management",
    role: "superadmin",
    status: "active",
    enterpriseCode: generatedCode,
    enterpriseName: enterpriseName.trim(),
    password
  };

  db.users.push(newAdmin);

  // Pre-initialize sequential document numbering configuration starting at 0001 for this new enterprise
  const config = getNumberingConfig(db, generatedCode);

  // Audit log
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: newAdmin.id,
    userName: newAdmin.name,
    action: "ADMIN_REGISTER",
    timestamp: new Date().toISOString(),
    details: `Registered new Administrator account. Connected Enterprise Code: ${generatedCode}`,
    enterpriseCode: generatedCode
  };
  db.auditLogs.unshift(auditLog);

  // Alert notification for this admin
  const notif = {
    id: "notif-" + Math.random().toString(36).substring(2, 11),
    userId: newAdmin.id,
    title: "Welcome Administrator",
    message: `Your Enterprise Workspace is active. Share your permanent 4-digit code: ${generatedCode} with employees.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "success" as const,
    enterpriseCode: generatedCode
  };
  db.notifications.unshift(notif);

  try {
    await persistDirectlyToFirestore(db, { users: newAdmin, numberingSettingsConfigs: config, auditLogs: auditLog, notifications: notif });
    res.json({ user: newAdmin, token: `session-for-${newAdmin.id}` });
  } catch (err: any) {
    console.error("Direct Firestore write for admin register failed:", err);
    db.users.pop();
    db.auditLogs.shift();
    db.notifications.shift();
    res.status(500).json({ error: "Failed to save administrator record in database directly. Details: " + err.message });
  }
});// API 2: Auth signup (credentials based, supports BOTH admin onboarding and self registration)
app.get("/api/auth/verify-enterprise", (req, res) => {
  const db = readDatabase();
  const code = (req.query.code || "").toString().trim();
  if (!code || code.length !== 4) {
    return res.status(400).json({ error: "Enterprise code must be exactly 4 digits." });
  }

  const activeAdmin = db.users.find((u: User) => 
    (u.role === "admin" || u.role === "superadmin") && 
    u.status === "active" && 
    u.enterpriseCode === code
  );

  if (!activeAdmin) {
    return res.status(400).json({ error: "Enterprise code is invalid or currently inactive." });
  }

  // Fetch unique existing departments inside this enterprise so they are available in select options
  const enterpriseUsers = db.users.filter((u: User) => u.enterpriseCode === code);
  const departments = Array.from(new Set(
    enterpriseUsers
      .map(u => u.department)
      .filter((d): d is string => typeof d === "string" && d !== "" && d !== "Others" && d !== "Management")
  ));

  res.json({
    valid: true,
    active: true,
    enterpriseName: activeAdmin.enterpriseName || `${activeAdmin.name}'s Enterprise Workspace`,
    departments
  });
});

app.post("/api/auth/signup", async (req, res) => {
  const db = readDatabase();
  const { email, name, employeeCode, doj, department = "", password, enterpriseCode, role } = req.body;

  if (!email || !name || !employeeCode || !doj) {
    return res.status(400).json({ error: "All fields (except department) are required to register a user account" });
  }

  const emailLower = email.toLowerCase().trim();
  if (emailLower === "adminapproval@gmail.com") {
    return res.status(400).json({ error: "Cannot create an account with the Super Admin email" });
  }

  const userObj = getUserFromHeaders(req);
  const isAuthorized = userObj && (
    userObj.role === "superadmin" || 
    userObj.role === "admin" ||
    userObj.email === "adminapproval@gmail.com" || 
    userObj.id === "admin-id"
  );

  let resolvedCode = enterpriseCode ? enterpriseCode.trim() : "";

  if (isAuthorized) {
    resolvedCode = resolvedCode || (userObj ? userObj.enterpriseCode : "2026") || "2026";
  } else {
    // Public register: requires valid and active enterprise code
    if (!resolvedCode || resolvedCode.length !== 4) {
      return res.status(400).json({ error: "A valid 4-digit Enterprise Code is required to register." });
    }

    const activeAdminExists = db.users.some((u: User) => 
      (u.role === "admin" || u.role === "superadmin") && 
      u.status === "active" && 
      u.enterpriseCode === resolvedCode
    );

    if (!activeAdminExists) {
      return res.status(400).json({ error: "The enterprise code is invalid or currently inactive." });
    }
  }

  let resolvedRole: "employee" | "head" | "admin" = "employee";
  if (role === "head") {
    resolvedRole = "head";
  } else if (role === "admin") {
    resolvedRole = "admin";
  }

  // STRICT DUPLICATE PREVENTION
  const usernameLower = employeeCode.toLowerCase().trim();
  const existingUsername = db.users.find((u: User) => u.employeeCode.toLowerCase().trim() === usernameLower);
  if (existingUsername) {
    return res.status(400).json({ error: "An employee with this username already exists." });
  }

  const existingEmail = db.users.find((u: User) => u.email.toLowerCase().trim() === emailLower);
  if (existingEmail) {
    return res.status(400).json({ error: "This email address is already registered." });
  }

  const nameLower = name.trim().toLowerCase();
  const existingNameInEnterprise = db.users.find((u: User) => 
    u.name.trim().toLowerCase() === nameLower && 
    u.enterpriseCode === resolvedCode
  );
  if (existingNameInEnterprise) {
    return res.status(400).json({ error: "An employee with this name already exists in this enterprise." });
  }

  const idPrefix = resolvedRole === "head" ? "head-" : (resolvedRole === "admin" ? "admin-" : "emp-");
  const newUser: User = {
    id: idPrefix + Date.now().toString(),
    email: emailLower,
    name,
    employeeCode: employeeCode,
    doj,
    department,
    role: resolvedRole,
    status: "active",
    password: password || "",
    enterpriseCode: resolvedCode
  };

  db.users.push(newUser);

  // Create Audit Log
  const audit: AuditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: newUser.id,
    userName: newUser.name,
    action: resolvedRole === "head" ? "HEAD_SIGNUP" : (resolvedRole === "admin" ? "ADMIN_SIGNUP" : "USER_SIGNUP"),
    timestamp: new Date().toISOString(),
    details: `Signed up as a new ${resolvedRole === "head" ? "Department Head" : (resolvedRole === "admin" ? "Administrator" : "Employee")}. Code: ${newUser.employeeCode}, Dept: ${newUser.department}`,
    enterpriseCode: resolvedCode
  };
  db.auditLogs.unshift(audit);

  // Notification to admin/superadmin of this enterprise
  const enterpriseAdmin = db.users.find((u: User) => (u.role === "superadmin" || u.role === "admin") && u.enterpriseCode === resolvedCode);
  const adminNotif: Notification = {
    id: "notif-" + Math.random().toString(36).substring(2, 11),
    userId: enterpriseAdmin ? enterpriseAdmin.id : "admin-id",
    title: `New ${resolvedRole === "head" ? "Department Head" : (resolvedRole === "admin" ? "Administrator" : "Employee")} Registered`,
    message: `${name} (${employeeCode}) signed up under ${department} department.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info",
    enterpriseCode: resolvedCode
  };
  db.notifications.unshift(adminNotif);

  try {
    await persistDirectlyToFirestore(db, { users: newUser, auditLogs: audit, notifications: adminNotif });
    res.json({ user: newUser, token: `session-for-${newUser.id}` });
  } catch (err: any) {
    console.error("Direct Firestore write for signup failed:", err);
    db.users.pop();
    db.auditLogs.shift();
    db.notifications.shift();
    res.status(500).json({ error: "Failed to persist new employee registration record. Details: " + err.message });
  }
});

// API 3: Auth Google Sign-In & Onboarding for Employees
app.post("/api/auth/google", async (req, res) => {
  const db = readDatabase();
  const { email, name, password, enterpriseCode } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Google OAuth callback did not supply an email" });
  }

  const emailLower = email.toLowerCase().trim();
  
  // Check if registering admin or existing seed admin
  if (emailLower === "adminapproval@gmail.com") {
    let adminUser = db.users.find((u: User) => u.role === "admin" && u.email.toLowerCase() === "adminapproval@gmail.com");
    if (!adminUser) {
      adminUser = {
        id: "admin-id",
        email: "adminapproval@gmail.com",
        name: "System Super Admin",
        employeeCode: "adminapproval",
        doj: "2020-01-01",
        department: "Management",
        role: "admin",
        status: "active",
        googleUser: true,
        password: password || "Admin123#",
        enterpriseCode: "2026"
      };
      db.users.push(adminUser);
    } else {
      if (password) adminUser.password = password;
    }
    try {
      await persistDirectlyToFirestore(db, { users: adminUser });
      return res.json({ user: adminUser, token: "admin-signed-session-google" });
    } catch (err: any) {
      console.error("Direct Firestore write for admin Google login failed:", err);
      return res.status(500).json({ error: "Failed to persist administrator profile to database directly. Details: " + err.message });
    }
  }

  // Must supply 4-digit enterpriseCode to connect
  if (!enterpriseCode || String(enterpriseCode).trim().length !== 4) {
    return res.status(400).json({ error: "A valid 4-digit permanent Enterprise Code is required to connect to your employer's workspace." });
  }

  const resolvedEnterpriseCode = String(enterpriseCode).trim();

  // Verify if that company admin exists
  const matchedAdmin = db.users.find((u: User) => u.role === "admin" && String(u.enterpriseCode) === resolvedEnterpriseCode);
  if (!matchedAdmin) {
    return res.status(400).json({ 
      error: `Enterprise Code "${resolvedEnterpriseCode}" does not match any registered companies. Please verify the 4-digit code provided by your administrator.` 
    });
  }

  // Find if employee is registered in this enterprise
  let existing = db.users.find((u: User) => u.email.toLowerCase() === emailLower && u.enterpriseCode === resolvedEnterpriseCode);
  
  if (existing) {
    if (existing.status === "inactive") {
      return res.status(403).json({ error: "Your employee account is currently disabled. Please contact your company administrator." });
    }
    existing.googleUser = true;
    if (password) {
      existing.password = password;
    }
    try {
      await persistDirectlyToFirestore(db, { users: existing });
      return res.json({ user: existing, token: `session-for-${existing.id}` });
    } catch (err: any) {
      console.error("Direct Firestore write for existing employee Google login failed:", err);
      return res.status(500).json({ error: "Failed to persist employee profile updates. Details: " + err.message });
    }
  }

  // Auto-generate employee code for direct google register
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const generatedCode = "EMP-G" + randomSuffix;

  const newUser: User = {
    id: "emp-" + Date.now().toString(),
    email: emailLower,
    name: name || email.split("@")[0],
    employeeCode: generatedCode,
    doj: new Date().toISOString().split("T")[0],
    department: "Onboarded",
    role: "employee",
    status: "active",
    googleUser: true,
    password: password || "",
    enterpriseCode: resolvedEnterpriseCode
  };

  db.users.push(newUser);

  // Audit
  const audit: AuditLog = {
    id: "log-g" + Math.random().toString(36).substring(2, 11),
    userId: newUser.id,
    userName: newUser.name,
    action: "USER_SIGNUP_GOOGLE",
    timestamp: new Date().toISOString(),
    details: `Registered via Google Authentication. Assigned system Code: ${newUser.employeeCode}`,
    enterpriseCode: resolvedEnterpriseCode
  };
  db.auditLogs.unshift(audit);

  // Notification to admin of this enterprise
  const adminNotif: Notification = {
    id: "notif-g" + Math.random().toString(36).substring(2, 11),
    userId: matchedAdmin.id,
    title: "New Google Registration",
    message: `${newUser.name} auto-registered under your enterprise using Google. Code ${newUser.employeeCode}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info",
    enterpriseCode: resolvedEnterpriseCode
  };
  db.notifications.unshift(adminNotif);

  try {
    await persistDirectlyToFirestore(db, { users: newUser, auditLogs: audit, notifications: adminNotif });
    res.json({ user: newUser, token: `session-for-${newUser.id}` });
  } catch (err: any) {
    console.error("Direct Firestore write for Google onboarding failed:", err);
    db.users.pop();
    db.auditLogs.shift();
    db.notifications.shift();
    res.status(500).json({ error: "Failed to save Google registration in database directly. Details: " + err.message });
  }
});

// --- GITHUB OAUTH WORKSPACE API INTEGRATION ---

function getGithubRedirectUri(req: any) {
  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  return `${appUrl}/auth/github/callback`;
}

// Endpoint 1: Generate GitHub OAuth authorize URL
app.get("/api/auth/github/url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "GITHUB_CLIENT_ID is not configured in the application server. Ask the system administrator to add it under Secrets." });
  }

  const { state } = req.query; // 'login' or 'register_employee:...' or 'register_admin:...'
  const redirectUri = getGithubRedirectUri(req);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state: String(state || "login")
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

// Endpoint 2: GitHub Callback Handler
app.get(["/auth/github/callback", "/auth/github/callback/"], async (req, res) => {
  const { code, state } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const sendFailure = (errorMsg: string) => {
    res.send(`
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #e2e8f0; }
            h2 { color: #ef4444; margin-top: 0; }
            p { font-size: 14px; line-height: 1.5; color: #64748b; }
            button { background-color: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Failed</h2>
            <p>${errorMsg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: "OAUTH_AUTH_FAILURE", error: ${JSON.stringify(errorMsg)} }, "*");
                setTimeout(() => window.close(), 4000);
              }
            </script>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  };

  if (!code) {
    return sendFailure("Authorization code missing from GitHub redirect.");
  }

  if (!clientId || !clientSecret) {
    return sendFailure("GitHub OAuth client credentials (ID or SECRET) are not configured on the server. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Settings > Secrets.");
  }

  try {
    // 1. Exchange OAuth code for GitHub access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getGithubRedirectUri(req)
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return sendFailure("GitHub token exchange failed: " + errorText);
    }

    const tokenData: any = await tokenResponse.json();
    if (tokenData.error) {
      return sendFailure(`GitHub token exchange error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return sendFailure("No access token returned from GitHub.");
    }

    // 2. Fetch User Profile
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "Aproflow-Auth-Applet",
        "Accept": "application/json"
      }
    });

    if (!profileResponse.ok) {
      return sendFailure("Failed to retrieve user profile from GitHub API.");
    }

    const profileData: any = await profileResponse.json();
    const githubUsername = profileData.login;
    const githubName = profileData.name || profileData.login;
    let githubEmail = profileData.email;

    // 3. Fallback: Fetch emails if email is null/private
    if (!githubEmail) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": "Aproflow-Auth-Applet",
          "Accept": "application/json"
        }
      });

      if (emailResponse.ok) {
        const emailsList: any = await emailResponse.json();
        if (Array.isArray(emailsList) && emailsList.length > 0) {
          const primaryEmailObj = emailsList.find((e: any) => e.primary && e.verified) || emailsList.find((e: any) => e.primary) || emailsList[0];
          githubEmail = primaryEmailObj ? primaryEmailObj.email : null;
        }
      }
    }

    if (!githubEmail) {
      return sendFailure("Your GitHub account doesn't expose a verified email address. Please make sure you have a verified email on GitHub.");
    }

    const emailLower = githubEmail.toLowerCase().trim();
    const db = readDatabase();

    // 4. Handle State Actions (login or onboarding)
    const stateStr = String(state || "login");
    let userToSignIn: User | null = null;

    if (stateStr.startsWith("register_employee:")) {
      const parts = stateStr.split(":");
      const enterpriseCode = parts[1];
      const decodedName = decodeURIComponent(parts[2] || "");
      const decodedDept = decodeURIComponent(parts[3] || "");
      const roleStr = parts[4] || "employee";

      if (!enterpriseCode || enterpriseCode.length !== 4) {
        return sendFailure("A valid 4-digit Enterprise Code is required to onboard via GitHub.");
      }

      // Check if enterprise exists
      const matchedAdmin = db.users.find((u: User) => u.role === "admin" && String(u.enterpriseCode) === enterpriseCode);
      const isSystemAdmin = emailLower === "adminapproval@gmail.com";
      if (!matchedAdmin && !isSystemAdmin) {
        return sendFailure(`Enterprise Code "${enterpriseCode}" does not match any active companies registered in our workspace.`);
      }

      // Check duplicates in that workspace
      let existingEmployee = db.users.find((u: User) => u.email.toLowerCase() === emailLower && u.enterpriseCode === enterpriseCode);
      if (existingEmployee) {
        if (existingEmployee.status === "inactive") {
          return sendFailure("Your employee account has been deactivated. Please contact your company administrator.");
        }
        userToSignIn = existingEmployee;
      } else {
        // Create new employee
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const generatedCode = "EMP-GH" + randomSuffix;

        const newUser: User = {
          id: "emp-" + Date.now().toString(),
          email: emailLower,
          name: decodedName || githubName,
          employeeCode: generatedCode,
          doj: new Date().toISOString().split("T")[0],
          department: decodedDept || "IT",
          role: roleStr as UserRole,
          status: "active",
          password: "",
          enterpriseCode: enterpriseCode
        };

        db.users.push(newUser);

        // Audit
        const audit = {
          id: "log-gh" + Math.random().toString(36).substring(2, 11),
          userId: newUser.id,
          userName: newUser.name,
          action: "USER_SIGNUP_GITHUB",
          timestamp: new Date().toISOString(),
          details: `Registered via GitHub Authentication. Assigned System code: ${newUser.employeeCode}`,
          enterpriseCode: enterpriseCode
        };
        db.auditLogs.unshift(audit);

        // Notify parent admin
        if (matchedAdmin) {
          const adminNotif = {
            id: "notif-gh" + Math.random().toString(36).substring(2, 11),
            userId: matchedAdmin.id,
            title: "New GitHub Registration",
            message: `${newUser.name} auto-registered under your enterprise using GitHub. Username is ${newUser.employeeCode}.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "info" as const,
            enterpriseCode: enterpriseCode
          };
          db.notifications.unshift(adminNotif);
          await persistDirectlyToFirestore(db, { users: newUser, auditLogs: audit, notifications: adminNotif });
        } else {
          await persistDirectlyToFirestore(db, { users: newUser, auditLogs: audit });
        }

        userToSignIn = newUser;
      }

    } else if (stateStr.startsWith("register_admin:")) {
      const parts = stateStr.split(":");
      const decodedEnterpriseName = decodeURIComponent(parts[1] || "");
      const decodedName = decodeURIComponent(parts[2] || "");
      const decodedUsername = decodeURIComponent(parts[3] || "");

      if (!decodedEnterpriseName || !decodedName || !decodedUsername) {
        return sendFailure("Missing required administrator or enterprise registration entries.");
      }

      // Check duplicates globally
      const nameL = decodedName.trim().toLowerCase();
      const existingName = db.users.find((u: User) => u.name.trim().toLowerCase() === nameL);
      if (existingName) {
        return sendFailure("An account with this administrator name already exists.");
      }

      const existingUsername = db.users.find((u: User) => u.employeeCode.toLowerCase() === decodedUsername.toLowerCase().trim());
      if (existingUsername) {
        return sendFailure("The username already exists. Please choose a different administrative username.");
      }

      const existingEmail = db.users.find((u: User) => u.email.toLowerCase() === emailLower);
      if (existingEmail) {
        return sendFailure("The email address is already bound to another administrator or employee profile.");
      }

      // Generate enterprise code
      let generatedCode = "";
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 100) {
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        generatedCode = String(codeNum);
        const codeExists = db.users.some((u: User) => (u.role === "admin" || u.role === "superadmin") && u.enterpriseCode === generatedCode);
        if (!codeExists) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) generatedCode = "8899";

      const newAdmin: User = {
        id: "admin-" + Date.now().toString(),
        email: emailLower,
        name: decodedName,
        employeeCode: decodedUsername,
        doj: new Date().toISOString().split("T")[0],
        department: "Management",
        role: "superadmin",
        status: "active",
        enterpriseCode: generatedCode,
        enterpriseName: decodedEnterpriseName,
        password: ""
      };

      db.users.push(newAdmin);

      // Pre-initialize numbering config
      const numberingConfig = getNumberingConfig(db, generatedCode);

      // Audit
      const auditLog = {
        id: "log-" + Math.random().toString(36).substring(2, 11),
        userId: newAdmin.id,
        userName: newAdmin.name,
        action: "ADMIN_REGISTER_GITHUB",
        timestamp: new Date().toISOString(),
        details: `Registered new Admin account via GitHub. Connected Enterprise Code: ${generatedCode}`,
        enterpriseCode: generatedCode
      };
      db.auditLogs.unshift(auditLog);

      // Welcome Notification
      const notif = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: newAdmin.id,
        title: "Welcome Administrator",
        message: `Your Enterprise Workspace is active. Share your permanent 4-digit code: ${generatedCode} with employees.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "success" as const,
        enterpriseCode: generatedCode
      };
      db.notifications.unshift(notif);

      await persistDirectlyToFirestore(db, { users: newAdmin, numberingSettingsConfigs: numberingConfig, auditLogs: auditLog, notifications: notif });
      userToSignIn = newAdmin;

    } else {
      // STANDARD SECURE LOGIN/SIGN-IN WITH GITHUB
      if (emailLower === "adminapproval@gmail.com") {
        let adminUser = db.users.find((u: User) => u.role === "admin" && u.email.toLowerCase() === "adminapproval@gmail.com");
        if (!adminUser) {
          adminUser = {
            id: "admin-id",
            email: "adminapproval@gmail.com",
            name: "System Super Admin",
            employeeCode: "adminapproval",
            doj: "2020-01-01",
            department: "Management",
            role: "admin",
            status: "active",
            password: "",
            enterpriseCode: "2026"
          };
          db.users.push(adminUser);
          await persistDirectlyToFirestore(db, { users: adminUser });
        }
        userToSignIn = adminUser;
      } else {
        // Find existing employee or admin matching email
        let matchedUser = db.users.find((u: User) => u.email.toLowerCase() === emailLower);
        if (!matchedUser) {
          return sendFailure(`No registered user found matching the email "${emailLower}" of your GitHub profile. Please sign up first using the Registration tab matching your enterprise code.`);
        }
        if (matchedUser.status === "inactive") {
          return sendFailure("Your account is currently disabled. Please contact your company administrator.");
        }
        userToSignIn = matchedUser;
      }
    }

    if (!userToSignIn) {
      return sendFailure("Authentication processing error.");
    }

    const userWithBrand = { 
      ...userToSignIn, 
      enterpriseName: getEnterpriseNameForUser(db, userToSignIn) 
    };
    const sessionTokenText = `session-for-${userToSignIn.id}`;

    // 5. Send Success Script to Opener Popup and close
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #e2e8f0; }
            h2 { color: #10b981; margin-top: 0; }
            p { font-size: 14px; line-height: 1.5; color: #64748b; }
            .spinner { border: 4px solid rgba(0,0,0,0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #0f172a; animation: spin 1s linear infinite; margin: 1.5rem auto 0; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Sign-In Successful!</h2>
            <p>Welcome back, <strong>${userWithBrand.name}</strong> (${userWithBrand.email}). Syncing your workspace...</p>
            <div class="spinner"></div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: "OAUTH_AUTH_SUCCESS",
                  user: ${JSON.stringify(userWithBrand)},
                  token: "${sessionTokenText}"
                }, "*");
              }
              setTimeout(() => {
                window.close();
              }, 1200);
            </script>
          </div>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error("GitHub Login Exception:", error);
    return sendFailure("An internal server error occurred while negotiating with GitHub APIs: " + error.message);
  }
});

// --- SEQUENTIAL DOCUMENT NUMBERING SYSTEM HELPER & APIs ---

// Helper to query/initialize numbering config
function getNumberingConfig(db: any, enterpriseCode: string) {
  if (!db.numberingSettingsConfigs) {
    db.numberingSettingsConfigs = [];
  }
  let config = db.numberingSettingsConfigs.find((c: any) => c.enterpriseCode === enterpriseCode);
  if (!config) {
    config = {
      id: enterpriseCode,
      enterpriseCode: enterpriseCode,
      settings: {
        CV: { enabled: true, prefix: "CV", startingValue: 1, leadingZeros: 4 },
        LC: { enabled: true, prefix: "LC", startingValue: 1, leadingZeros: 4 },
        SC: { enabled: true, prefix: "SC", startingValue: 1, leadingZeros: 4 },
        EV: { enabled: true, prefix: "EV", startingValue: 1, leadingZeros: 4 },
        PV: { enabled: true, prefix: "PV", startingValue: 1, leadingZeros: 4 },
        JV: { enabled: true, prefix: "JV", startingValue: 1, leadingZeros: 4 },
        OTA: { enabled: true, prefix: "OTA", startingValue: 1, leadingZeros: 4 },
        CCE: { enabled: true, prefix: "CCE", startingValue: 1, leadingZeros: 4 }
      },
      counters: {
        CV: 0,
        LC: 0,
        SC: 0,
        EV: 0,
        PV: 0,
        JV: 0,
        OTA: 0,
        CCE: 0
      }
    };
    db.numberingSettingsConfigs.push(config);
  } else {
    if (!config.settings.LC) {
      config.settings.LC = { enabled: true, prefix: "LC", startingValue: 1, leadingZeros: 4 };
    }
    if (config.counters && config.counters.LC === undefined) {
      config.counters.LC = 0;
    }
    if (!config.settings.SC) {
      config.settings.SC = { enabled: true, prefix: "SC", startingValue: 1, leadingZeros: 4 };
    }
    if (config.counters && config.counters.SC === undefined) {
      config.counters.SC = 0;
    }
    if (!config.settings.OTA) {
      config.settings.OTA = { enabled: true, prefix: "OTA", startingValue: 1, leadingZeros: 4 };
    }
    if (config.counters && config.counters.OTA === undefined) {
      config.counters.OTA = 0;
    }
    if (!config.settings.CCE) {
      config.settings.CCE = { enabled: true, prefix: "CCE", startingValue: 1, leadingZeros: 4 };
    }
    if (config.counters && config.counters.CCE === undefined) {
      config.counters.CCE = 0;
    }
  }
  return config;
}

function getCategoryPrefix(category: string): string {
  if (!category) return "GEN";
  
  if (category === "Cash Voucher") return "CV";
  if (category === "Local Conveyance") return "LC";
  if (category === "Sample Collection") return "SC";
  if (category === "Outstation Travel Allowance" || category === "Travel allowance") return "OTA";
  if (category === "Credit Card Expense") return "CCE";
  
  // Clean up special characters from the category
  const clean = category.trim().replace(/[^a-zA-Z\s]/g, "");
  if (!clean) return "GEN";
  
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
  } else {
    const w = words[0];
    if (w.length >= 2) {
      return w.substring(0, 2).toUpperCase();
    }
    return w.toUpperCase() + "X";
  }
}

// deduplicateRequests: intelligently track linked requests and keep only the single final payable expense
function deduplicateRequests(requests: any[]): any[] {
  const result: any[] = [];
  const processed = new Set<string>();

  // Determine priority: we prefer "Cash Voucher" as the final payable expense.
  // We sort so that "Cash Voucher" is processed first.
  const sorted = [...requests].sort((a, b) => {
    const aIsCV = a.category === "Cash Voucher";
    const bIsCV = b.category === "Cash Voucher";
    if (aIsCV && !bIsCV) return -1;
    if (!aIsCV && bIsCV) return 1;
    return 0;
  });

  for (const r of sorted) {
    if (processed.has(r.id)) continue;

    const linkedItemIndex = result.findIndex(exist => 
      (r.linkedDocumentId && exist.id === r.linkedDocumentId) || 
      (exist.linkedDocumentId && exist.linkedDocumentId === r.id)
    );

    if (linkedItemIndex !== -1) {
      processed.add(r.id);
    } else {
      result.push(r);
      processed.add(r.id);
    }
  }
  return result;
}

// Concurrency-safe atomic generator based on category prefixes
function generateNextDocumentNo(db: any, enterpriseCode: string, category: string): { docNumber: string; serialNumber: number; prefix: string } {
  const config = getNumberingConfig(db, enterpriseCode);
  const prefix = getCategoryPrefix(category);
  
  if (!config.counters) {
    config.counters = {};
  }
  
  if (config.counters[prefix] === undefined) {
    config.counters[prefix] = 0;
  }
  
  const currentCounter = config.counters[prefix] || 0;
  
  // Dynamic settings check
  const setting = config.settings?.[prefix] || {};
  const startingValue = setting.startingValue !== undefined ? Number(setting.startingValue) : 1;
  const leadingZeros = setting.leadingZeros !== undefined ? Number(setting.leadingZeros) : 4;
  
  let nextSerial = Math.max(startingValue, currentCounter + 1);
  
  // Guard-rail: Scan existing db requests to guarantee no reuse of number
  const existingSerials = db.requests
    .filter((r: any) => (r.enterpriseCode || "2026") === enterpriseCode && (r.prefix === prefix))
    .map((r: any) => Number(r.serialNumber) || 0);
    
  if (existingSerials.length > 0) {
    const maxExisting = Math.max(...existingSerials);
    nextSerial = Math.max(nextSerial, maxExisting + 1);
  }
  
  // Format leading zeros (use leadingZeros config, fallback to 4)
  const serialStr = String(nextSerial).padStart(leadingZeros, "0");
  const docNumber = `${prefix}-${serialStr}`;
  
  // Update internal numbering tracker
  config.counters[prefix] = nextSerial;
  
  return {
    docNumber,
    serialNumber: nextSerial,
    prefix
  };
}

// API: GET Numbering Configuration settings
app.get("/api/numbering-settings", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const config = getNumberingConfig(db, userCode);
  res.json({ config });
});

// API: POST Numbering Configuration updates (Admins / Superadmins only)
app.post("/api/numbering-settings", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Requires administrator privileges to change prefixes/numbering" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ error: "Missing required prefixes configurations" });
  }

  const config = getNumberingConfig(db, userCode);

  // Apply customizations to each voucher settings config
  ["CV", "LC", "EV", "PV", "JV"].forEach((type) => {
    if (settings[type]) {
      const s = settings[type];
      if (s.prefix !== undefined) config.settings[type].prefix = String(s.prefix).toUpperCase().trim();
      if (s.startingValue !== undefined) config.settings[type].startingValue = Math.max(1, Number(s.startingValue) || 1);
      if (s.enabled !== undefined) config.settings[type].enabled = Boolean(s.enabled);
      if (s.leadingZeros !== undefined) config.settings[type].leadingZeros = Math.max(1, Number(s.leadingZeros) || 4);
    }
  });

  // Log in system Audit Trail
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "NUMBERING_CONF_UPDATE",
    timestamp: new Date().toISOString(),
    details: `Updated document prefixes configuration for Enterprise ${userCode}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { numberingSettingsConfigs: config, auditLogs: auditLog });
    res.json({ success: true, config });
  } catch (err: any) {
    console.error("Direct Firestore write for numbering config update failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to update numbering configuration in database directly. Details: " + err.message });
  }
});

// --- CUSTOM EXPENSE CLASSIFICATION SYSTEM FOR CASH VOUCHERS ---

// GET /api/custom-expense-heads
app.get("/api/custom-expense-heads", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const config = getNumberingConfig(db, userCode);
  if (!config.customExpenseHeads) {
    config.customExpenseHeads = [];
  }
  res.json({ success: true, customExpenseHeads: config.customExpenseHeads || [] });
});

// POST /api/custom-expense-heads
app.post("/api/custom-expense-heads", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Custom Expense Head name is required." });
  }

  const trimmedName = name.trim();
  const userCode = userObj.enterpriseCode || "2026";
  const config = getNumberingConfig(db, userCode);
  
  if (!config.customExpenseHeads) {
    config.customExpenseHeads = [];
  }

  // Check unique validation in the enterprise list
  const exists = config.customExpenseHeads.some((h: any) => h.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "This custom expense head already exists in your enterprise." });
  }

  const newHead = {
    id: "CH-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    name: trimmedName,
    createdAt: new Date().toISOString()
  };

  config.customExpenseHeads.unshift(newHead);

  // Unshift back to corporate audit trails
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "CUSTOM_EXPENSE_HEAD_CREATE",
    timestamp: new Date().toISOString(),
    details: `Added permanent corporate expense head: "${trimmedName}"`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { numberingSettingsConfigs: config, auditLogs: auditLog });
    res.json({ success: true, customExpenseHead: newHead });
  } catch (err: any) {
    console.error("Direct Firestore write for custom expense head failed:", err);
    config.customExpenseHeads.shift();
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to add custom expense head in database directly. Details: " + err.message });
  }
});

// API: GET Export complete database snapshot as a single raw JSON file (Admins Only)
app.get("/api/database/backup-export", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Requires administrator privileges to export database backup" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const isSuper = userObj.role === "superadmin";

  // Filter the database collections based on the admin's enterprise mapping
  const filteredUsers = db.users.filter((u: any) => isSuper || (u.enterpriseCode || "2026") === userCode);
  const filteredRequests = db.requests.filter((r: any) => isSuper || (r.enterpriseCode || "2026") === userCode);
  const filteredAuditLogs = db.auditLogs.filter((l: any) => isSuper || (l.enterpriseCode || "2026") === userCode);
  const filteredNotifications = db.notifications.filter((n: any) => isSuper || (n.enterpriseCode || "2026") === userCode);
  const filteredNumbering = db.numberingSettingsConfigs ? db.numberingSettingsConfigs.filter((c: any) => isSuper || (c.enterpriseCode || "2026") === userCode) : [];
  const filteredCommissions = db.commissions ? db.commissions.filter((c: any) => isSuper || (c.enterpriseCode || "2026") === userCode) : [];

  const exportPayload = {
    version: "1.0",
    enterpriseCode: userCode,
    exportedBy: userObj.name,
    exportTimestamp: new Date().toISOString(),
    dataCount: {
      users: filteredUsers.length,
      requests: filteredRequests.length,
      auditLogs: filteredAuditLogs.length,
      notifications: filteredNotifications.length,
      numberingSettingsConfigs: filteredNumbering.length,
      commissions: filteredCommissions.length
    },
    data: {
      users: filteredUsers,
      requests: filteredRequests,
      auditLogs: filteredAuditLogs,
      notifications: filteredNotifications,
      numberingSettingsConfigs: filteredNumbering,
      commissions: filteredCommissions
    }
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=apruv_enterprise_${userCode}_backup_${Date.now()}.json`);
  return res.json(exportPayload);
});

// API: POST Import and restore database from a JSON backup file (Admins Only)
app.post("/api/database/restore-import", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Requires administrator privileges to restore database backup" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const isSuper = userObj.role === "superadmin";
  const { importData } = req.body;

  if (!importData || !importData.data) {
    return res.status(400).json({ error: "Malformed backup data. Please upload a valid JSON backup file." });
  }

  const backupData = importData.data;

  // Perform retentive merge logic
  let mergedUsers = [...db.users];
  let mergedRequests = [...db.requests];
  let mergedAuditLogs = [...db.auditLogs];
  let mergedNotifications = [...db.notifications];
  
  if (!db.numberingSettingsConfigs) db.numberingSettingsConfigs = [];
  let mergedNumbering = [...db.numberingSettingsConfigs];

  if (!db.commissions) db.commissions = [];
  let mergedCommissions = [...db.commissions];

  let addedCount = 0;
  let updatedCount = 0;

  // Merge Users
  if (Array.isArray(backupData.users)) {
    backupData.users.forEach((bu: any) => {
      if (!isSuper && bu.enterpriseCode !== userCode) return;
      const idx = mergedUsers.findIndex(u => u.id === bu.id);
      if (idx > -1) {
        mergedUsers[idx] = { ...mergedUsers[idx], ...bu };
        updatedCount++;
      } else {
        mergedUsers.push(bu);
        addedCount++;
      }
    });
  }

  // Merge Requests
  if (Array.isArray(backupData.requests)) {
    backupData.requests.forEach((br: any) => {
      if (!isSuper && br.enterpriseCode !== userCode) return;
      const idx = mergedRequests.findIndex(r => r.id === br.id);
      if (idx > -1) {
        mergedRequests[idx] = { ...mergedRequests[idx], ...br };
        updatedCount++;
      } else {
        mergedRequests.push(br);
        addedCount++;
      }
    });
  }

  // Merge Audit Logs
  if (Array.isArray(backupData.auditLogs)) {
    backupData.auditLogs.forEach((bl: any) => {
      if (!isSuper && bl.enterpriseCode !== userCode) return;
      const idx = mergedAuditLogs.findIndex(l => l.id === bl.id);
      if (idx > -1) {
        mergedAuditLogs[idx] = { ...mergedAuditLogs[idx], ...bl };
      } else {
        mergedAuditLogs.push(bl);
        addedCount++;
      }
    });
  }

  // Merge Notifications
  if (Array.isArray(backupData.notifications)) {
    backupData.notifications.forEach((bn: any) => {
      if (!isSuper && bn.enterpriseCode !== userCode) return;
      const idx = mergedNotifications.findIndex(n => n.id === bn.id);
      if (idx > -1) {
        mergedNotifications[idx] = { ...mergedNotifications[idx], ...bn };
      } else {
        mergedNotifications.push(bn);
        addedCount++;
      }
    });
  }

  // Merge Numbering Settings
  if (Array.isArray(backupData.numberingSettingsConfigs)) {
    backupData.numberingSettingsConfigs.forEach((bc: any) => {
      if (!isSuper && bc.enterpriseCode !== userCode) return;
      const idx = mergedNumbering.findIndex(c => c.id === bc.id || c.enterpriseCode === bc.enterpriseCode);
      if (idx > -1) {
        mergedNumbering[idx] = { ...mergedNumbering[idx], ...bc };
      } else {
        mergedNumbering.push(bc);
      }
    });
  }

  // Merge Commissions
  if (Array.isArray(backupData.commissions)) {
    backupData.commissions.forEach((bc: any) => {
      if (!isSuper && bc.enterpriseCode !== userCode) return;
      const idx = mergedCommissions.findIndex(c => c.id === bc.id);
      if (idx > -1) {
        mergedCommissions[idx] = { ...mergedCommissions[idx], ...bc };
        updatedCount++;
      } else {
        mergedCommissions.push(bc);
        addedCount++;
      }
    });
  }

  // Save back to db
  db.users = mergedUsers;
  db.requests = mergedRequests;
  db.auditLogs = mergedAuditLogs;
  db.notifications = mergedNotifications;
  db.numberingSettingsConfigs = mergedNumbering;
  db.commissions = mergedCommissions;

  const backupAuditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "DATABASE_RESTORE_IMPORT",
    timestamp: new Date().toISOString(),
    details: `Imported database backup file and merged records (New: ${addedCount}, Modified: ${updatedCount}). Absolute data retention secured.`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(backupAuditLog);

  try {
    await persistDirectlyToFirestore(db, {
      users: mergedUsers,
      requests: mergedRequests,
      auditLogs: db.auditLogs,
      notifications: mergedNotifications,
      numberingSettingsConfigs: mergedNumbering,
      commissions: mergedCommissions
    });

    res.json({
      success: true,
      message: `Database backup file successfully imported! Added ${addedCount} new elements, updated ${updatedCount} existing elements. Absolute data integrity maintained.`,
      stats: {
        users: db.users.length,
        requests: db.requests.length,
        auditLogs: db.auditLogs.length,
        notifications: db.notifications.length,
        numberingSettingsConfigs: db.numberingSettingsConfigs.length,
        commissions: db.commissions.length
      }
    });
  } catch (err: any) {
    console.error("Direct Firestore write for database restore-import failed:", err);
    res.status(500).json({ error: "Failed to persist restored database in database directly. Details: " + err.message });
  }
});

// API: POST cancel/void document with tracking details
app.post("/api/requests/:id/cancel", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { id } = req.params;
  const { reason } = req.body;

  const request = db.requests.find((r: RequestForm) => r.id === id);
  if (!request) {
    return res.status(404).json({ error: "Target request form not discovered." });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = request.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: Isolation breach" });
  }

  // Creator can cancel, or Admin/Super Admin
  const isCreator = request.userId === userObj.id;
  const isAdm = userObj.role === "admin" || userObj.role === "superadmin";
  if (!isCreator && !isAdm) {
    return res.status(403).json({ error: "Access Denied: You cannot cancel this document record" });
  }

  // Set the permanent locked cancellation state
  request.status = "Cancelled";
  request.cancellationStatus = "Cancelled";
  request.cancelledBy = userObj.name;
  request.cancelledDate = new Date().toISOString().split("T")[0];
  request.cancelledReason = reason || "Cancelled or voided by user";
  request.lastUpdated = new Date().toISOString();

  // Audit trail
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "REQS_CANCEL",
    timestamp: new Date().toISOString(),
    details: `Cancelled document ${request.documentNumber || request.id} (${request.projectName}). Reason: ${reason || "Actioned by user"}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { requests: request, auditLogs: auditLog });
    res.json({ success: true, request });
  } catch (err: any) {
    console.error("Direct Firestore write for cancel request failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to cancel request in database directly. Details: " + err.message });
  }
});

// API 4: Get Requests forms matching permission and Enterprise isolation
app.get("/api/requests", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  let filtered = db.requests.filter((r: RequestForm) => (r.enterpriseCode || "2026") === userCode);

  // Filter by employee or head role scope, unless Admin
  if (userObj.role === "employee") {
    if (userObj.canApproveRequests) {
      filtered = filtered.filter((r: RequestForm) => r.assignedHeadId === userObj.id || r.userId === userObj.id);
    } else {
      filtered = filtered.filter((r: RequestForm) => r.userId === userObj.id);
    }
  } else if (userObj.role === "head") {
    filtered = filtered.filter((r: RequestForm) => r.assignedHeadId === userObj.id || r.userId === userObj.id);
  }

  // Filter query parameters params
  const statusParam = req.query.status;
  if (statusParam) {
    filtered = filtered.filter((r: RequestForm) => r.status.toLowerCase() === String(statusParam).toLowerCase());
  }

  // Inject official enterpriseName dynamically
  const activeAdmin = db.users.find((u: User) => 
    (u.role === "admin" || u.role === "superadmin") && 
    u.status === "active" && 
    u.enterpriseCode === userCode
  );
  const enterpriseNameVal = activeAdmin?.enterpriseName || `${activeAdmin?.name || "Corporate"}'s Enterprise Workspace`;

  const resultsWithBrand = filtered.map((r: RequestForm) => ({
    ...r,
    enterpriseName: r.enterpriseName || enterpriseNameVal
  }));

  res.json(resultsWithBrand);
});

// API 5: Get Specific request form (isolation checked)
app.get("/api/requests/:id", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { id } = req.params;
  const request = db.requests.find((r: RequestForm) => r.id === id);
  if (!request) {
    return res.status(404).json({ error: "Request form not found" });
  }

  // Verify company isolation
  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = request.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You do not have permissions to access requests from other companies." });
  }

  const requestAdmin = db.users.find((u: User) => 
    (u.role === "admin" || u.role === "superadmin") && 
    u.status === "active" && 
    u.enterpriseCode === requestCompanyCode
  );
  const enterpriseNameVal = requestAdmin?.enterpriseName || `${requestAdmin?.name || "Corporate"}'s Enterprise Workspace`;

  const requestWithBrand = {
    ...request,
    enterpriseName: request.enterpriseName || enterpriseNameVal
  };

  // Check scope safety
  if (userObj.role === "employee") {
    if (userObj.canApproveRequests) {
      if (request.userId !== userObj.id && request.assignedHeadId !== userObj.id) {
        return res.status(403).json({ error: "Access Denied to this request form" });
      }
    } else if (request.userId !== userObj.id) {
      return res.status(403).json({ error: "Access Denied to this request form" });
    }
  }
  if (userObj.role === "head" && request.userId !== userObj.id && request.assignedHeadId !== userObj.id) {
    return res.status(403).json({ error: "Access Denied: You are not authorized to view this request" });
  }

  res.json(requestWithBrand);
});

// API 6: POST create request forms (with company isolation setup)
app.post("/api/requests", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { projectName, category, items, isDraft, attachments, travelDetails, cashVoucherDetails, travelExpensesDetails, localConveyanceDetails, creditCardDetails, assignedHeadId, assignedAdminId, assignedSuperAdminId } = req.body;

  if (!projectName || !category || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing required parameters to construct request form" });
  }

  // Compute sums
  let netTotal = 0;
  let taxSum = 0;
  items.forEach((item: any) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const tax = Number(item.taxPercent) || 0;
    const rowNet = qty * price;
    const rowTax = rowNet * (tax / 100);
    item.total = rowNet + rowTax;
    
    netTotal += rowNet;
    taxSum += rowTax;
  });

  const cgst = taxSum / 2;
  const sgst = taxSum / 2;
  const grandTotal = netTotal + taxSum;

  const summary = {
    netTotal,
    cgst,
    sgst,
    adjustments: 0,
    grandTotal
  };

  const randomId = Math.floor(100 + Math.random() * 900);
  const companyYear = new Date().getFullYear();
  const generatedId = `PR-${companyYear}-${randomId}`;

  const status = isDraft ? "Draft" : "Pending";
  const userCode = userObj.enterpriseCode || "2026";

  let assignedHeadName = "";
  let assignedAdminName = "";
  let assignedSuperAdminName = "";
  let stage: "head-approval" | "admin-approval" | "superadmin-approval" = "admin-approval";
  let headApprovalStatus: "Pending" | "Approved" | "Rejected" | "Queried" | undefined;

  if (assignedHeadId) {
    const headUser = db.users.find((u: User) => u.id === assignedHeadId);
    if (headUser) {
      assignedHeadName = headUser.name;
      stage = "head-approval";
      headApprovalStatus = "Pending";
    }
  } else if (assignedAdminId) {
    const adminUser = db.users.find((u: User) => u.id === assignedAdminId);
    if (adminUser) {
      assignedAdminName = adminUser.name;
      stage = "admin-approval";
    }
  } else if (assignedSuperAdminId) {
    const superAdminUser = db.users.find((u: User) => u.id === assignedSuperAdminId);
    if (superAdminUser) {
      assignedSuperAdminName = superAdminUser.name;
      stage = "superadmin-approval";
    }
  }

  // Populate other assign names if specified
  if (assignedAdminId && !assignedAdminName) {
    const adminUser = db.users.find((u: User) => u.id === assignedAdminId);
    if (adminUser) assignedAdminName = adminUser.name;
  }
  if (assignedSuperAdminId && !assignedSuperAdminName) {
    const superAdminUser = db.users.find((u: User) => u.id === assignedSuperAdminId);
    if (superAdminUser) assignedSuperAdminName = superAdminUser.name;
  }

  // Resolve category-based sequence numbering
  let docNumber: string | undefined;
  let serialNo: number | undefined;
  let docPrefix: string | undefined;

  if (!isDraft) {
    const generated = generateNextDocumentNo(db, userCode, category);
    docNumber = generated.docNumber;
    serialNo = generated.serialNumber;
    docPrefix = generated.prefix;
    if (cashVoucherDetails && category === "Cash Voucher") {
      cashVoucherDetails.voucherNo = docNumber;
    }
    if (travelExpensesDetails && category === "Travel Expenses") {
      travelExpensesDetails.voucherNo = docNumber;
    }
    if (localConveyanceDetails && (category === "Local Conveyance" || category === "Sample Collection")) {
      localConveyanceDetails.voucherNo = docNumber;
    }
    if (creditCardDetails && category === "Credit Card Expense") {
      creditCardDetails.voucherNo = docNumber;
    }
  }

  const newForm: RequestForm = {
    id: generatedId,
    userId: userObj.id,
    employeeName: userObj.name,
    projectName,
    submissionDate: new Date().toISOString().split("T")[0],
    items,
    category,
    totalBudget: grandTotal,
    status,
    lastUpdated: new Date().toISOString(),
    totals: summary,
    attachments: attachments || [],
    comments: [],
    approvalDetails: {},
    enterpriseCode: userCode,
    travelDetails: travelDetails || undefined,
    cashVoucherDetails: cashVoucherDetails || undefined,
    travelExpensesDetails: travelExpensesDetails || undefined,
    localConveyanceDetails: localConveyanceDetails || undefined,
    creditCardDetails: creditCardDetails || undefined,
    assignedHeadId,
    assignedHeadName,
    assignedAdminId,
    assignedAdminName,
    assignedSuperAdminId,
    assignedSuperAdminName,
    stage,
    headApprovalStatus,
    documentNumber: docNumber,
    documentType: category === "Credit Card Expense" ? "CCE" : (category === "Travel Expenses" ? "TE" : ((category === "Cash Voucher" || category === "Local Conveyance") ? "CV" : "EV")),
    serialNumber: serialNo,
    prefix: docPrefix
  };

  db.requests.unshift(newForm);

  // Add audit logs
  const action = isDraft ? "REQS_DRAFT" : "REQS_SUBMIT";
  let detailLogText = "";
  if (isDraft) {
    detailLogText = `Created raw draft ${generatedId} under budget ₹${grandTotal.toLocaleString("en-IN")}`;
  } else if (assignedHeadId) {
    detailLogText = `Submitted request ${generatedId} to Department Head ${assignedHeadName} for ${projectName}`;
  } else if (assignedAdminId) {
    detailLogText = `Submitted request ${generatedId} direct to Admin ${assignedAdminName} for ${projectName}`;
  } else {
    detailLogText = `Submitted request ${generatedId} direct to Super Admin ${assignedSuperAdminName || 'Admin'} for ${projectName}`;
  }
  
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action,
    timestamp: new Date().toISOString(),
    details: detailLogText,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  const addedNotifications: any[] = [];

  // Alert proper approving target if not a draft
  if (!isDraft) {
    if (stage === "head-approval" && assignedHeadId) {
      const n = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: assignedHeadId,
        title: "New Request Pending Your Approval",
        message: `${userObj.name} submitted ${generatedId} for your department head review (₹${grandTotal.toLocaleString("en-IN")}).`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "info" as const,
        enterpriseCode: userCode
      };
      db.notifications.unshift(n);
      addedNotifications.push(n);
    } else if (stage === "admin-approval") {
      const targetAdmin = assignedAdminId 
        ? db.users.find((u: User) => u.id === assignedAdminId)
        : db.users.find((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);

      const n = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: targetAdmin ? targetAdmin.id : "admin-id",
        title: "New Request Pending Admin Approval",
        message: `${userObj.name} submitted ${generatedId} for admin review (₹${grandTotal.toLocaleString("en-IN")}).`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "info" as const,
        enterpriseCode: userCode
      };
      db.notifications.unshift(n);
      addedNotifications.push(n);
    } else if (stage === "superadmin-approval") {
      const targetSuper = assignedSuperAdminId
        ? db.users.find((u: User) => u.id === assignedSuperAdminId)
        : db.users.find((u: User) => u.role === "superadmin" && (u.enterpriseCode || "2026") === userCode);

      const n = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: targetSuper ? targetSuper.id : "admin-id",
        title: "New Request Pending Super Admin Approval",
        message: `${userObj.name} submitted ${generatedId} for super admin final decision (₹${grandTotal.toLocaleString("en-IN")}).`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "info" as const,
        enterpriseCode: userCode
      };
      db.notifications.unshift(n);
      addedNotifications.push(n);
    }
  }

  try {
    await persistDirectlyToFirestore(db, { requests: newForm, auditLogs: auditLog, notifications: addedNotifications });
    res.json({ success: true, request: newForm });
  } catch (err: any) {
    console.error("Direct Firestore write for new request failed:", err);
    db.requests.shift();
    db.auditLogs.shift();
    db.notifications.splice(0, addedNotifications.length);
    res.status(500).json({ error: "Failed to submit request form. Details: " + err.message });
  }
});

// API 7: PUT update request form (or handle resubmission)
app.put("/api/requests/:id", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { id } = req.params;
  const { projectName, category, items, isDraft, attachments, travelDetails, cashVoucherDetails, travelExpensesDetails, localConveyanceDetails, creditCardDetails, assignedHeadId, assignedAdminId, assignedSuperAdminId } = req.body;

  const formIndex = db.requests.findIndex((r: RequestForm) => r.id === id);
  if (formIndex === -1) {
    return res.status(404).json({ error: "Target purchase form not found" });
  }

  const existing = db.requests[formIndex];

  // Verify company isolation
  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = existing.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot modify requests belonging to other companies." });
  }

  if (userObj.role === "employee" && existing.userId !== userObj.id) {
    return res.status(403).json({ error: "Access Denied: Cannot modify someone else's request" });
  }

  // Process item updates if provided
  let grandTotal = existing.totalBudget;
  if (items && Array.isArray(items)) {
    let netTotal = 0;
    let taxSum = 0;
    
    items.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const tax = Number(item.taxPercent) || 0;
      const rowNet = qty * price;
      const rowTax = rowNet * (tax / 100);
      item.total = rowNet + rowTax;
      
      netTotal += rowNet;
      taxSum += rowTax;
    });

    const cgst = taxSum / 2;
    const sgst = taxSum / 2;
    grandTotal = netTotal + taxSum;

    existing.items = items;
    existing.totals = {
      netTotal,
      cgst,
      sgst,
      adjustments: 0,
      grandTotal
    };
    existing.totalBudget = grandTotal;
  }

  if (projectName) existing.projectName = projectName;
  if (category) existing.category = category;
  if (attachments) existing.attachments = attachments;
  if (travelDetails !== undefined) existing.travelDetails = travelDetails;
  if (cashVoucherDetails !== undefined) existing.cashVoucherDetails = cashVoucherDetails;
  if (travelExpensesDetails !== undefined) existing.travelExpensesDetails = travelExpensesDetails;
  if (localConveyanceDetails !== undefined) existing.localConveyanceDetails = localConveyanceDetails;
  if (creditCardDetails !== undefined) existing.creditCardDetails = creditCardDetails;

  // Change status
  let targetStatus = existing.status;
  if (existing.status === "Draft") {
    targetStatus = isDraft ? "Draft" : "Pending";
  } else if (existing.status === "Queried" && !isDraft) {
    targetStatus = "Pending"; // Resubmitted
  }
  existing.status = targetStatus;
  existing.lastUpdated = new Date().toISOString();

  // If transitioning from draft to pending (or resubmitted without a number), generate seq number
  if (targetStatus === "Pending" && !existing.documentNumber) {
    const finalCategory = category || existing.category || "General";
    const generated = generateNextDocumentNo(db, userCode, finalCategory);
    existing.documentNumber = generated.docNumber;
    existing.documentType = finalCategory === "Credit Card Expense" ? "CCE" : (finalCategory === "Travel Expenses" ? "TE" : ((finalCategory === "Cash Voucher" || finalCategory === "Local Conveyance") ? "CV" : "EV"));
    existing.serialNumber = generated.serialNumber;
    existing.prefix = generated.prefix;
    if (existing.cashVoucherDetails && finalCategory === "Cash Voucher") {
      existing.cashVoucherDetails.voucherNo = generated.docNumber;
    }
    if (existing.travelExpensesDetails && finalCategory === "Travel Expenses") {
      existing.travelExpensesDetails.voucherNo = generated.docNumber;
    }
    if (existing.localConveyanceDetails && (finalCategory === "Local Conveyance" || finalCategory === "Sample Collection")) {
      existing.localConveyanceDetails.voucherNo = generated.docNumber;
    }
    if (existing.creditCardDetails && finalCategory === "Credit Card Expense") {
      existing.creditCardDetails.voucherNo = generated.docNumber;
    }
  }

  // Update assignedHeadId if supplied
  if (assignedHeadId !== undefined) {
    existing.assignedHeadId = assignedHeadId;
    if (assignedHeadId) {
      const headUser = db.users.find((u: User) => u.id === assignedHeadId);
      existing.assignedHeadName = headUser ? headUser.name : "";
    } else {
      existing.assignedHeadName = "";
    }
  }

  // Update assignedAdminId if supplied
  if (assignedAdminId !== undefined) {
    existing.assignedAdminId = assignedAdminId;
    if (assignedAdminId) {
      const adminUser = db.users.find((u: User) => u.id === assignedAdminId);
      existing.assignedAdminName = adminUser ? adminUser.name : "";
    } else {
      existing.assignedAdminName = "";
    }
  }

  // Update assignedSuperAdminId if supplied
  if (assignedSuperAdminId !== undefined) {
    existing.assignedSuperAdminId = assignedSuperAdminId;
    if (assignedSuperAdminId) {
      const superAdminUser = db.users.find((u: User) => u.id === assignedSuperAdminId);
      existing.assignedSuperAdminName = superAdminUser ? superAdminUser.name : "";
    } else {
      existing.assignedSuperAdminName = "";
    }
  }

  // Handle stage on update/resubmit
  if (!isDraft) {
    if (existing.assignedHeadId) {
      existing.stage = "head-approval";
      existing.headApprovalStatus = "Pending";
    } else if (existing.assignedAdminId) {
      existing.stage = "admin-approval";
      existing.adminApprovalStatus = "Pending";
    } else if (existing.assignedSuperAdminId) {
      existing.stage = "superadmin-approval";
      existing.superAdminApprovalStatus = "Pending";
    } else {
      existing.stage = "admin-approval"; // Fallback
    }
  }

  // Logs & alert notifications
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "REQS_UPDATE",
    timestamp: new Date().toISOString(),
    details: `Updated request ${existing.id} (Status: ${targetStatus}, Grand Total: ₹${grandTotal.toLocaleString("en-IN")})`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  let notif: any = null;
  if (targetStatus === "Pending") {
    if (existing.assignedHeadId) {
      notif = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: existing.assignedHeadId,
        title: "Resubmitted Request for Review",
        message: `${userObj.name} resubmitted request ${existing.id} for your department head review.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "info" as const,
        enterpriseCode: userCode
      };
      db.notifications.unshift(notif);
    } else {
      const enterpriseAdmin = db.users.find((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);
      notif = {
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        userId: enterpriseAdmin ? enterpriseAdmin.id : "admin-id",
        title: "Resubmitted Approval Request",
        message: `${userObj.name} resubmitted request ${existing.id} with updated records.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "info" as const,
        enterpriseCode: userCode
      };
      db.notifications.unshift(notif);
    }
  }

  try {
    await persistDirectlyToFirestore(db, { requests: existing, auditLogs: auditLog, notifications: notif ? [notif] : undefined });
    res.json({ success: true, request: existing });
  } catch (err: any) {
    console.error("Direct Firestore write for update request failed:", err);
    db.auditLogs.shift();
    if (notif) db.notifications.shift();
    res.status(500).json({ error: "Failed to update request form in database directly. Details: " + err.message });
  }
});

// API 8: POST review request status (Approve, Reject, Query)
app.post("/api/requests/:id/review", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "superadmin" && userObj.role !== "admin" && userObj.role !== "head" && !userObj.canApproveRequests)) {
    return res.status(401).json({ error: "Required Super Admin, Admin, Department Head or Authorized Approval Employee access token" });
  }

  const { id } = req.params;
  const { decision, adminRemark, escalateTo, escalateToId, approvedAmount, reductionReason } = req.body; // decision: 'Approve' | 'Reject' | 'Query' | 'Finalize'

  if (!decision || !["Approve", "Reject", "Query", "Finalize"].includes(decision)) {
    return res.status(400).json({ error: "Invalid review decision. Choose 'Approve', 'Reject', 'Query', or 'Finalize'" });
  }

  const request = db.requests.find((r: RequestForm) => r.id === id);
  if (!request) {
    return res.status(404).json({ error: "Target request form not discovered." });
  }

  // Verify that only Corporate Admins and Super Admins can review commission layout/settlement vouchers
  if (request.linkedCommissionId && userObj.role !== "admin" && userObj.role !== "superadmin") {
    return res.status(403).json({ error: "Access Denied: Only Corporate Admins and Super Admins have permission to approve, reject, query, or finalize Marketing Expense layouts." });
  }

  // Verify company isolation
  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = request.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot review requests belonging to other companies." });
  }

  // For department heads or authorized employee approvers, they can ONLY review if they are the assigned head!
  if ((userObj.role === "head" || (userObj.role === "employee" && userObj.canApproveRequests)) && request.assignedHeadId !== userObj.id) {
    return res.status(403).json({ error: "Access Denied: You are not authorized to review this request form." });
  }

  // For administrators, if a specific admin is assigned, only they can review (unless superadmin)
  if (userObj.role === "admin" && request.assignedAdminId && request.assignedAdminId !== userObj.id) {
    const assignedAdminInDb = db.users.find((u: User) => u.id === request.assignedAdminId);
    if (assignedAdminInDb && (assignedAdminInDb.enterpriseCode || "2026") === userCode) {
      return res.status(403).json({ error: "Access Denied: This request is assigned to another Administrator." });
    }
  }

  // For super administrators, any superadmin can review/approve/finalize any request inside their enterprise domain
  // (removed restrictive assignedSuperAdminId restriction to grant general superadmin override authority)

  let targetStatus: RequestStatus | null = null;
  let auditAction = "";
  let notifTitle = "";
  let notifType: "info" | "success" | "warning" = "info";

  // Compute helper variables for partial approval
  request.approvalHistory = request.approvalHistory || [];
  const finalApprovedAmount = approvedAmount !== undefined ? Number(approvedAmount) : (request.approvedAmount !== undefined ? Number(request.approvedAmount) : request.totalBudget);
  const isPartial = finalApprovedAmount < request.totalBudget;

  if (decision === "Approve" || decision === "Finalize") {
    request.approvedAmount = finalApprovedAmount;
    if (isPartial) {
      request.reductionReason = reductionReason || adminRemark || "No specific reduction reason provided";
    }
    
    const userDesignation = userObj.role === "superadmin" ? "Super Admin" : userObj.role === "admin" ? "Administrator" : userObj.role === "head" ? "Department Head" : "Authorized Approver";
    request.approvalHistory.push({
      approverName: userObj.name,
      designation: userDesignation,
      requestedAmount: request.totalBudget,
      approvedAmount: finalApprovedAmount,
      difference: request.totalBudget - finalApprovedAmount,
      reason: reductionReason || adminRemark || "No specific reduction reason provided",
      timestamp: new Date().toISOString()
    });
  }

  if (userObj.role === "head" || (userObj.role === "employee" && userObj.canApproveRequests)) {
    const userDesignation = userObj.role === "employee" ? "Authorized Approver" : "Department Head";
    const userRoleText = userObj.role === "employee" ? "Authorized Approver" : "Dept Head";

    // Stage 1: Department Head / Authorized Approver Review
    if (decision === "Reject") {
      targetStatus = "Rejected"; // reject stops the workflow
      request.headApprovalStatus = "Rejected";
      request.headApprovedBy = `${userObj.name} (${userDesignation} - ${userObj.department || "General"})`;
      request.headRemarks = adminRemark || `Rejected by ${userDesignation}`;
      request.headApprovalDate = new Date().toISOString().split("T")[0];
      
      auditAction = "REQS_HEAD_REJECT";
      notifTitle = `Rejected by ${userRoleText}`;
      notifType = "warning";
    } else if (decision === "Query") {
      targetStatus = "Queried"; // queries back to employee
      request.headApprovalStatus = "Queried";
      request.headRemarks = adminRemark || `Queried by ${userDesignation}`;
      
      auditAction = "REQS_HEAD_QUERY";
      notifTitle = `Information Queried by ${userRoleText}`;
      notifType = "info";
    } else if (decision === "Approve") {
      request.headApprovedBy = `${userObj.name} (${userDesignation} - ${userObj.department || "General"})`;
      request.headRemarks = reductionReason || adminRemark || `Approved by ${userDesignation}`;
      request.headApprovalDate = new Date().toISOString().split("T")[0];
      request.headApprovalStatus = isPartial ? "Partially Approved" : "Approved";

      if (isPartial) {
        // Direct complete for partial approved requests to prevent pending review loop
        targetStatus = "Partially Approved";
        request.stage = "completed";
        auditAction = "REQS_HEAD_APPROVE_DIRECT";
        notifTitle = `Partially Approved & Finalized by ${userRoleText} ⚠️`;
        notifType = "success";
      } else {
        // If head designated an escalation target in the post query:
        if (escalateTo === "admin" && escalateToId) {
          const targetUser = db.users.find((u: User) => u.id === escalateToId);
          if (targetUser) {
            request.assignedAdminId = targetUser.id;
            request.assignedAdminName = targetUser.name;
          }
          targetStatus = "Pending";
          request.stage = "admin-approval";
          auditAction = "REQS_HEAD_APPROVE_ESCALATE";
          notifTitle = `Approved by ${userRoleText} (Forwarded to Admin ${request.assignedAdminName || ''})`;
          notifType = "success";
        } else if (escalateTo === "superadmin" && escalateToId) {
          const targetUser = db.users.find((u: User) => u.id === escalateToId);
          if (targetUser) {
            request.assignedSuperAdminId = targetUser.id;
            request.assignedSuperAdminName = targetUser.name;
          }
          targetStatus = "Pending";
          request.stage = "superadmin-approval";
          auditAction = "REQS_HEAD_APPROVE_ESCALATE";
          notifTitle = `Approved by ${userRoleText} (Directly to Super Admin ${request.assignedSuperAdminName || ''})`;
          notifType = "success";
        } else if (request.assignedAdminId) {
          // Fallback backward compatibility
          targetStatus = "Pending";
          request.stage = "admin-approval";
          auditAction = "REQS_HEAD_APPROVE_ESCALATE";
          notifTitle = `Approved by ${userRoleText} (Forwarded to Admin)`;
          notifType = "success";
        } else if (request.assignedSuperAdminId) {
          targetStatus = "Pending";
          request.stage = "superadmin-approval";
          auditAction = "REQS_HEAD_APPROVE_ESCALATE";
          notifTitle = `Approved by ${userRoleText} (Directly to Super Admin)`;
          notifType = "success";
        } else {
          // Complete if no more approvers in sequence are defined
          targetStatus = "Approved";
          request.stage = "completed";
          auditAction = "REQS_HEAD_APPROVE_DIRECT";
          notifTitle = `Approved & Finalized by ${userRoleText} 🎉`;
          notifType = "success";
        }
      }
    } else if (decision === "Finalize") {
      request.headApprovedBy = `${userObj.name} (${userDesignation} - ${userObj.department || "General"}) [Finalized]`;
      request.headRemarks = reductionReason || adminRemark || `Approved & Finalized without further approval by ${userDesignation}`;
      request.headApprovalDate = new Date().toISOString().split("T")[0];
      request.headApprovalStatus = isPartial ? "Partially Approved" : "Approved";

      request.finalizedBy = `${userObj.name} (${userDesignation})`;
      targetStatus = isPartial ? "Partially Approved" : "Approved";
      request.stage = "completed";
      auditAction = "REQS_HEAD_FINALIZE";
      notifTitle = isPartial ? `Partially Approved & Finalized by ${userRoleText} (No Escalation) ⚠️` : `Approved & Finalized by ${userRoleText} (No Escalation) 🎉`;
      notifType = "success";
    }
  } else if (userObj.role === "admin") {
    // Stage 2: Standard Admin Review
    if (decision === "Reject") {
      targetStatus = "Rejected";
      request.adminApprovalStatus = "Rejected";
      request.adminApprovedBy = `${userObj.name} (Administrator - ${userObj.department || "Administration"})`;
      request.adminRemarks = adminRemark || "Rejected by administrator";
      request.adminApprovalDate = new Date().toISOString().split("T")[0];
      
      auditAction = "REQS_ADMIN_REJECT";
      notifTitle = "Rejected by Admin";
      notifType = "warning";
    } else if (decision === "Query") {
      targetStatus = "Queried";
      request.adminApprovalStatus = "Queried";
      request.adminRemarks = adminRemark || "Queried by administrator";
      
      auditAction = "REQS_ADMIN_QUERY";
      notifTitle = "Information Queried by Admin";
      notifType = "info";
    } else if (decision === "Approve") {
      request.adminApprovedBy = `${userObj.name} (Administrator - ${userObj.department || "Administration"})`;
      request.adminRemarks = reductionReason || adminRemark || "Approved by administrator";
      request.adminApprovalStatus = isPartial ? "Partially Approved" : "Approved";
      request.adminApprovalDate = new Date().toISOString().split("T")[0];

      if (isPartial) {
        // Direct complete for partial approved requests to prevent pending review loop
        targetStatus = "Partially Approved";
        request.stage = "completed";
        auditAction = "REQS_ADMIN_APPROVE_DIRECT";
        notifTitle = "Partially Approved & Finalized by Admin ⚠️";
        notifType = "success";
      } else {
        // If admin escalated to a specific Super Admin or another Admin:
        if (escalateTo === "superadmin" && escalateToId) {
          const targetUser = db.users.find((u: User) => u.id === escalateToId);
          if (targetUser) {
            request.assignedSuperAdminId = targetUser.id;
            request.assignedSuperAdminName = targetUser.name;
          }
          targetStatus = "Pending";
          request.stage = "superadmin-approval";
          auditAction = "REQS_ADMIN_APPROVE_ESCALATE";
          notifTitle = `Approved by Admin (Forwarded to Super Admin ${request.assignedSuperAdminName || ''})`;
          notifType = "success";
        } else if (escalateTo === "admin" && escalateToId) {
          const targetUser = db.users.find((u: User) => u.id === escalateToId);
          if (targetUser) {
            request.assignedAdminId = targetUser.id;
            request.assignedAdminName = targetUser.name;
          }
          targetStatus = "Pending";
          request.stage = "admin-approval";
          auditAction = "REQS_ADMIN_APPROVE_ESCALATE";
          notifTitle = `Approved by Admin (Forwarded to Admin ${request.assignedAdminName || ''})`;
          notifType = "success";
        } else if (request.assignedSuperAdminId) {
          targetStatus = "Pending";
          request.stage = "superadmin-approval";
          auditAction = "REQS_ADMIN_APPROVE_ESCALATE";
          notifTitle = "Approved by Admin (Forwarded to Super Admin)";
          notifType = "success";
        } else {
          // Complete if no final authority specified
          targetStatus = "Approved";
          request.stage = "completed";
          auditAction = "REQS_ADMIN_APPROVE_DIRECT";
          notifTitle = "Approved & Finalized by Admin 🎉";
          notifType = "success";
        }
      }
    } else if (decision === "Finalize") {
      request.adminApprovedBy = `${userObj.name} (Administrator - ${userObj.department || "Administration"}) [Finalized]`;
      request.adminRemarks = reductionReason || adminRemark || "Approved & Finalized without further approval by administrator";
      request.adminApprovalStatus = isPartial ? "Partially Approved" : "Approved";
      request.adminApprovalDate = new Date().toISOString().split("T")[0];

      request.finalizedBy = `${userObj.name} (Administrator)`;
      targetStatus = isPartial ? "Partially Approved" : "Approved";
      request.stage = "completed";
      auditAction = "REQS_ADMIN_FINALIZE";
      notifTitle = isPartial ? "Partially Approved & Finalized by Admin (No Escalation) ⚠️" : "Approved & Finalized by Admin (No Escalation) 🎉";
      notifType = "success";
    }
  } else {
    // Stage 3: Super Admin Review
    if (decision === "Reject") {
      targetStatus = "Rejected";
      request.superAdminApprovalStatus = "Rejected";
      request.superAdminApprovedBy = `${userObj.name} (Super Admin)`;
      request.superAdminRemarks = adminRemark || "Rejected by Super Admin";
      request.superAdminApprovalDate = new Date().toISOString().split("T")[0];
      
      auditAction = "REQS_SUPERADMIN_REJECT";
      notifTitle = "Rejected by Super Admin";
      notifType = "warning";
    } else if (decision === "Query") {
      targetStatus = "Queried";
      request.superAdminApprovalStatus = "Queried";
      request.superAdminRemarks = adminRemark || "Queried by Super Admin";
      
      auditAction = "REQS_SUPERADMIN_QUERY";
      notifTitle = "Information Queried by Super Admin";
      notifType = "info";
    } else if (decision === "Approve") {
      targetStatus = isPartial ? "Partially Approved" : "Approved";
      request.stage = "completed";
      request.superAdminApprovalStatus = isPartial ? "Partially Approved" : "Approved";
      request.superAdminApprovedBy = `${userObj.name} (Super Admin)`;
      request.superAdminRemarks = reductionReason || adminRemark || "Approved & Finalized by Super Admin";
      request.superAdminApprovalDate = new Date().toISOString().split("T")[0];

      // fallback compatibility
      request.approvalDetails = {
        approvedBy: `${userObj.name} (Super Admin)`,
        approvalDate: new Date().toISOString().split("T")[0],
        adminRemarks: reductionReason || adminRemark || "Approved and finalized by Super Admin"
      };

      auditAction = "REQS_SUPERADMIN_APPROVE";
      notifTitle = isPartial ? "Partially Approved & Finalized by Super Admin ⚠️" : "Approved & Finalized by Super Admin 🎉";
      notifType = "success";
    } else if (decision === "Finalize") {
      targetStatus = isPartial ? "Partially Approved" : "Approved";
      request.stage = "completed";
      request.superAdminApprovalStatus = isPartial ? "Partially Approved" : "Approved";
      request.superAdminApprovedBy = `${userObj.name} (Super Admin) [Finalized]`;
      request.superAdminRemarks = reductionReason || adminRemark || "Approved & Finalized by Super Admin";
      request.superAdminApprovalDate = new Date().toISOString().split("T")[0];

      request.finalizedBy = `${userObj.name} (Super Admin)`;
      // fallback compatibility
      request.approvalDetails = {
        approvedBy: `${userObj.name} (Super Admin)`,
        approvalDate: new Date().toISOString().split("T")[0],
        adminRemarks: reductionReason || adminRemark || "Approved and finalized by Super Admin"
      };

      auditAction = "REQS_SUPERADMIN_FINALIZE";
      notifTitle = isPartial ? "Partially Approved & Finalized by Super Admin ⚠️" : "Approved & Finalized by Super Admin 🎉";
      notifType = "success";
    }
  }

  if (targetStatus) {
    request.status = targetStatus;
    request.lastUpdated = new Date().toISOString();
    
    // Add transaction comments if remarks exist
    if (adminRemark) {
      request.comments.push({
        id: "c-" + Date.now(),
        userId: userObj.id,
        userName: userObj.name,
        role: userObj.role,
        text: `[SYSTEM DECISION - ${userObj.role.toUpperCase()} - ${decision.toUpperCase()}]: ${adminRemark} ${escalateTo ? `(Escalated to: ${escalateTo})` : ''}`,
        timestamp: new Date().toISOString()
      });
    }

    const addedNotifications: any[] = [];

    // Logging
    const logObj = {
      id: "log-" + Math.random().toString(36).substring(2, 11),
      userId: userObj.id,
      userName: userObj.name,
      action: auditAction,
      timestamp: new Date().toISOString(),
      details: `${decision} request ${request.id} for employee ${request.employeeName}. Remarks: ${adminRemark || "None"}`,
      enterpriseCode: userCode
    };
    db.auditLogs.unshift(logObj);

    // Notify employee of decision
    const n1 = {
      id: "notif-" + Math.random().toString(36).substring(2, 11),
      userId: request.userId,
      title: notifTitle,
      message: `${userObj.role === "head" ? "Dept Head" : (userObj.role === "admin" ? "Admin" : "Super Admin")} decision: ${decision}. Remark: "${adminRemark || 'No additional remarks'}"`,
      timestamp: new Date().toISOString(),
      read: false,
      type: notifType,
      enterpriseCode: userCode
    };
    db.notifications.unshift(n1);
    addedNotifications.push(n1);

    // Send notifications to next-tier roles if escalated
    if (userObj.role === "head" && decision === "Approve" && request.stage === "admin-approval") {
      const targetAdminId = request.assignedAdminId;
      const enterpriseAdmins = db.users.filter((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);
      const adminsToNotify = targetAdminId 
        ? enterpriseAdmins.filter(u => u.id === targetAdminId) 
        : enterpriseAdmins;

      adminsToNotify.forEach((adm) => {
        const nNext = {
          id: "notif-" + Math.random().toString(36).substring(2, 11),
          userId: adm.id,
          title: "Request Pending Admin Approval",
          message: `${request.employeeName}'s purchase request ${request.id} was APPROVED by Department Head ${userObj.name} and is now pending your Admin approval.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: "info" as const,
          enterpriseCode: userCode
        };
        db.notifications.unshift(nNext);
        addedNotifications.push(nNext);
      });
    }

    if (userObj.role === "admin" && decision === "Approve" && request.stage === "superadmin-approval") {
      const targetSuperAdminId = request.assignedSuperAdminId;
      const enterpriseSuperAdmins = db.users.filter((u: User) => u.role === "superadmin" && (u.enterpriseCode || "2026") === userCode);
      const superAdminsToNotify = targetSuperAdminId 
        ? enterpriseSuperAdmins.filter(u => u.id === targetSuperAdminId) 
        : enterpriseSuperAdmins;

      superAdminsToNotify.forEach((sadm) => {
        const nNext = {
          id: "notif-" + Math.random().toString(36).substring(2, 11),
          userId: sadm.id,
          title: "Request Pending Super Admin Approval",
          message: `${request.employeeName}'s purchase request ${request.id} was APPROVED by Admin ${userObj.name} and is now pending your Super Admin final decision.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: "info" as const,
          enterpriseCode: userCode
        };
        db.notifications.unshift(nNext);
        addedNotifications.push(nNext);
      });
    }

    try {
      await persistDirectlyToFirestore(db, { requests: request, auditLogs: logObj, notifications: addedNotifications });
    } catch (err: any) {
      console.error("Direct Firestore write for review request failed:", err);
      db.auditLogs.shift();
      db.notifications.splice(0, addedNotifications.length);
      return res.status(500).json({ error: "Failed to submit review decision. Details: " + err.message });
    }
  } else {
    writeDatabase(db);
  }

  res.json({ success: true, request });
});

// API 9: POST dispatch active thread comments
app.post("/api/requests/:id/comments", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Comment text body is required" });
  }

  const request = db.requests.find((r: RequestForm) => r.id === id);
  if (!request) {
    return res.status(404).json({ error: "Request not discovered" });
  }

  // Verify company isolation
  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = request.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot comment on requests for other companies." });
  }

  const newComment = {
    id: "c-" + Date.now(),
    userId: userObj.id,
    userName: userObj.name,
    role: userObj.role,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  request.comments.push(newComment);
  request.lastUpdated = new Date().toISOString();

  // Trigger proper cross-role notification
  const companyAdmin = db.users.find((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);
  const targetUserId = userObj.role === "admin" ? request.userId : (companyAdmin ? companyAdmin.id : "admin-id");

  const notifObj = {
    id: "notif-" + Math.random().toString(36).substring(2, 11),
    userId: targetUserId,
    title: `New Comment on ${request.id}`,
    message: `${userObj.name} commented: "${text.trim().substring(0, 40)}${text.trim().length > 40 ? '...' : ''}"`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const,
    enterpriseCode: userCode
  };
  db.notifications.unshift(notifObj);

  try {
    await persistDirectlyToFirestore(db, { requests: request, notifications: notifObj });
    res.json({ success: true, comment: newComment });
  } catch (err: any) {
    console.error("Direct Firestore write for new comment failed:", err);
    request.comments.pop();
    db.notifications.shift();
    res.status(500).json({ error: "Failed to submit comment to the database directly. Details: " + err.message });
  }
});

// API 9.5: Create Linked Cash Voucher automatically from an existing request record
app.post("/api/requests/:id/create-linked-cv", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  const { id } = req.params;
  const original = db.requests.find((r: RequestForm) => r.id === id);
  if (!original) {
    return res.status(404).json({ error: "Original document record not found" });
  }

  // Prevent duplicate voucher generation: warn and block if a Cash Voucher already exists
  if (original.linkedDocumentId) {
    return res.status(400).json({ 
      error: `Duplicate Cash Voucher Shield: A linked Cash Voucher (${original.linkedDocumentNumber || "active"}) already exists for this record.` 
    });
  }
  const alreadyLinked = db.requests.find((r: any) => 
    r.linkedDocumentId === original.id && r.category === "Cash Voucher" && r.cancellationStatus !== "Cancelled"
  );
  if (alreadyLinked) {
    return res.status(400).json({ 
      error: `Duplicate Cash Voucher Shield: An active Cash Voucher (${alreadyLinked.documentNumber || alreadyLinked.id}) is already linked to this document.` 
    });
  }

  // Verify company isolation
  const userCode = userObj.enterpriseCode || "2026";
  const requestCompanyCode = original.enterpriseCode || "2026";
  if (userCode !== requestCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot copy documents belonging to other corporations." });
  }

  const randomId = Math.floor(100 + Math.random() * 900);
  const companyYear = new Date().getFullYear();
  const generatedId = `PR-${companyYear}-${randomId}`;

  // Resolve continuous numbering
  const generated = generateNextDocumentNo(db, userCode, "Cash Voucher");
  const docNumber = generated.docNumber;
  const serialNo = generated.serialNumber;
  const docPrefix = generated.prefix;

  const finalBudgetAmount = original.approvedAmount !== undefined ? original.approvedAmount : original.totalBudget;
  const isApprovedAmountLower = original.approvedAmount !== undefined && original.approvedAmount < original.totalBudget;

  // Duplicate items but update ID (or consolidate to a single line item if approved amount has changed)
  const linkedItems = isApprovedAmountLower
    ? [{
        id: `cv-item-auto-${Date.now()}`,
        description: `Linked Cash Voucher settlement for ${original.documentNumber || original.id} (Adjusted Approved Amount: ₹${finalBudgetAmount.toLocaleString("en-IN")})`,
        quantity: 1,
        unitPrice: finalBudgetAmount,
        taxPercent: 0,
        total: finalBudgetAmount
      }]
    : (original.items && original.items.length > 0
        ? original.items.map((it: any, index: number) => ({
            id: `cv-copied-${Date.now()}-${index}`,
            description: it.description,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            taxPercent: it.taxPercent || 0,
            total: it.total || 0,
          }))
        : [{
            id: `cv-item-auto-${Date.now()}`,
            description: `Linked Cash Voucher settlement for ${original.documentNumber || original.id} (${original.projectName})`,
            quantity: 1,
            unitPrice: finalBudgetAmount,
            taxPercent: 0,
            total: finalBudgetAmount
          }]);

  // Prepare cash voucher details
  const debitAndCategory = original.category || "General expenditure";
  const cvDetails = {
    voucherNo: docNumber,
    debitTo: debitAndCategory,
    fileNo: original.documentNumber || original.id,
    expenseDetails: `Being cash voucher auto-generated for ${original.documentNumber || original.id} - ${original.projectName}.`,
    incurredBy: original.employeeName,
    amountInWords: "",
    billDate: original.submissionDate,
    billParticulars: original.projectName,
    billRate: String(finalBudgetAmount),
    billAmount: finalBudgetAmount,
    billFileName: original.attachments && original.attachments[0] ? original.attachments[0] : "original_receipt.jpg",
    billFileContent: original.cashVoucherDetails?.billFileContent || "MOCK_ATTACHMENT_CONTENT"
  };

  // Convert budget to words for amountInWords
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const helperWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + helperWords(n % 100) : "");
    return "";
  };
  const serverNumberToWords = (num: number): string => {
    const intPart = Math.floor(num);
    if (intPart === 0) return "zero";
    let temp = intPart;
    let words = "";
    if (Math.floor(temp / 100000) > 0) {
      words += helperWords(Math.floor(temp / 100000)) + " lakh ";
      temp %= 100000;
    }
    if (Math.floor(temp / 1000) > 0) {
      words += helperWords(Math.floor(temp / 1000)) + " thousand ";
      temp %= 1000;
    }
    if (temp > 0) {
      words += helperWords(temp);
    }
    return words.trim();
  };

  cvDetails.amountInWords = serverNumberToWords(finalBudgetAmount) ? (serverNumberToWords(finalBudgetAmount) + " Rupees Only") : "Zero Rupees";

  // Replicate routing assignees
  const assignedHeadId = original.assignedHeadId || undefined;
  const assignedHeadName = original.assignedHeadName || undefined;
  const assignedAdminId = original.assignedAdminId || undefined;
  const assignedAdminName = original.assignedAdminName || undefined;
  const assignedSuperAdminId = original.assignedSuperAdminId || undefined;
  const assignedSuperAdminName = original.assignedSuperAdminName || undefined;

  let headApprovalStatus: "Pending" | "Approved" | "Rejected" | "Queried" | undefined;
  let stage: "head-approval" | "admin-approval" | "superadmin-approval" = "admin-approval";

  if (assignedHeadId) {
    stage = "head-approval";
    headApprovalStatus = "Pending";
  } else if (assignedAdminId) {
    stage = "admin-approval";
  } else if (assignedSuperAdminId) {
    stage = "superadmin-approval";
  }

  const linkedForm: RequestForm = {
    id: generatedId,
    userId: original.userId,
    employeeName: original.employeeName,
    projectName: `Cash Voucher: ${original.projectName}`,
    submissionDate: new Date().toISOString().split("T")[0],
    items: linkedItems,
    category: "Cash Voucher",
    totalBudget: finalBudgetAmount,
    status: "Pending",
    lastUpdated: new Date().toISOString(),
    totals: {
      netTotal: finalBudgetAmount,
      cgst: 0,
      sgst: 0,
      adjustments: 0,
      grandTotal: finalBudgetAmount
    },
    attachments: original.attachments || [],
    comments: [],
    approvalDetails: {},
    enterpriseCode: userCode,
    cashVoucherDetails: cvDetails,
    assignedHeadId,
    assignedHeadName,
    assignedAdminId,
    assignedAdminName,
    assignedSuperAdminId,
    assignedSuperAdminName,
    stage,
    headApprovalStatus,
    documentNumber: docNumber,
    documentType: "CV",
    serialNumber: serialNo,
    prefix: docPrefix,
    linkedDocumentId: original.id,
    linkedDocumentNumber: original.documentNumber || `PROV-${original.id.substring(0, 5)}`,
    linkedDocumentType: original.category
  };

  // Link original document back to this cash voucher
  original.linkedDocumentId = generatedId;
  original.linkedDocumentNumber = docNumber;
  original.linkedDocumentType = "Cash Voucher";
  original.lastUpdated = new Date().toISOString();

  db.requests.unshift(linkedForm);

  const auditLogObj = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "CV_AUTOGEN",
    timestamp: new Date().toISOString(),
    details: `Automatically generated linked Cash Voucher ${docNumber} for original record ${original.documentNumber || original.id} (${original.projectName}) with total INR ${finalBudgetAmount.toLocaleString()}.`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLogObj);

  const notificationsToPersist: any[] = [];

  if (stage === "head-approval" && assignedHeadId) {
    const notif = {
      id: "notif-" + Math.random().toString(36).substring(2, 11),
      userId: assignedHeadId,
      title: "New Autogen Cash Voucher Pending Approval",
      message: `${original.employeeName}'s linked Cash Voucher ${docNumber} is pending head approval (₹${finalBudgetAmount.toLocaleString("en-IN")}).`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "info" as const,
      enterpriseCode: userCode
    };
    db.notifications.unshift(notif);
    notificationsToPersist.push(notif);
  } else if (stage === "admin-approval") {
    const targetAdmin = assignedAdminId 
      ? db.users.find((u: User) => u.id === assignedAdminId)
      : db.users.find((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);

    const notif = {
      id: "notif-" + Math.random().toString(36).substring(2, 11),
      userId: targetAdmin ? targetAdmin.id : "admin-id",
      title: "New Autogen Cash Voucher Pending Admin Approval",
      message: `${original.employeeName}'s linked Cash Voucher ${docNumber} is pending admin review (₹${finalBudgetAmount.toLocaleString("en-IN")}).`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "info" as const,
      enterpriseCode: userCode
    };
    db.notifications.unshift(notif);
    notificationsToPersist.push(notif);
  }

  try {
    const numberingConfig = getNumberingConfig(db, userCode);
    await persistDirectlyToFirestore(db, {
      requests: [linkedForm, original],
      auditLogs: auditLogObj,
      notifications: notificationsToPersist,
      numberingSettingsConfigs: numberingConfig
    });
    res.json({ success: true, request: linkedForm, parentRequest: original });
  } catch (err: any) {
    console.error("Direct Firestore write for autogen linked cash voucher failed:", err);
    db.requests.shift();
    // Revert original document linkages
    delete original.linkedDocumentId;
    delete original.linkedDocumentNumber;
    delete original.linkedDocumentType;
    db.auditLogs.shift();
    if (notificationsToPersist.length > 0) db.notifications.shift();
    // rollback counter
    const prefix = getCategoryPrefix("Cash Voucher");
    const numberingConfig = getNumberingConfig(db, userCode);
    if (numberingConfig && numberingConfig.counters && numberingConfig.counters[prefix]) {
      numberingConfig.counters[prefix] = Math.max(0, numberingConfig.counters[prefix] - 1);
    }
    res.status(500).json({ error: "Failed to automatically generate Cash Voucher in database directly. Details: " + err.message });
  }
});

// API 9.6: GET isolated Commission lists and compute dynamic details/history/warnings on the fly
app.get("/api/commissions", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  
  // Filter master commissions for this company
  let companyCommissions = db.commissions.filter((c: any) => (c.enterpriseCode || "2026") === userCode);

  // Normal employees and heads can only see their own master commission entries
  if (userObj.role !== "admin" && userObj.role !== "superadmin") {
    companyCommissions = companyCommissions.filter((c: any) => 
      c.employeeId === userObj.id || 
      c.employeeName.toLowerCase() === userObj.name.toLowerCase()
    );
  }

  // Hydrate each commission with dynamic payouts data
  const hydrated = companyCommissions.map((c: any) => {
    // Find all Cash Vouchers linked to this Commission ID and matching this employee
    const payouts = db.requests.filter((r: any) => 
      r.linkedCommissionId === c.id && 
      r.category === "Cash Voucher" && 
      (r.userId === c.employeeId || r.employeeName?.toLowerCase() === c.employeeName?.toLowerCase()) &&
      (r.enterpriseCode || "2026") === userCode
    );

    // Paid amount counts only Approved/Finalized Cash Vouchers
    const totalPaid = payouts
      .filter((r: any) => r.status === "Approved" && r.cancellationStatus !== "Cancelled")
      .reduce((sum: number, r: any) => sum + r.totalBudget, 0);

    // Pending amount is what is in pipeline
    const totalPending = payouts
      .filter((r: any) => r.status === "Pending" && r.cancellationStatus !== "Cancelled")
      .reduce((sum: number, r: any) => sum + r.totalBudget, 0);

    const pendingBalance = c.totalAmount - totalPaid;

    // Dynamically resolve overall status
    let currentStatus = c.status;
    if (totalPaid >= c.totalAmount) {
      currentStatus = "Paid";
    } else if (totalPaid > 0) {
      currentStatus = "Partially Paid";
    } else {
      currentStatus = "Pending";
    }

    // Dynamic warnings for suspicious splitting patterns
    const warnings: string[] = [];
    
    // Pattern 1: Too many small vouchers (3 or more payout vouchers < 10,000 INR each)
    const smallVouchers = payouts.filter((r: any) => r.totalBudget < 10000 && r.cancellationStatus !== "Cancelled");
    if (smallVouchers.length >= 3) {
      warnings.push(`Suspicious payout splitting: ${smallVouchers.length} separate small vouchers (under ₹10,000) generated.`);
    }

    // Pattern 2: Repetitive payouts (identical amounts)
    const activePayouts = payouts.filter((r: any) => r.cancellationStatus !== "Cancelled");
    const amounts = activePayouts.map((r: any) => r.totalBudget);
    const hasRepetitive = amounts.some((val: number, idx: number) => amounts.indexOf(val) !== idx);
    if (hasRepetitive && amounts.length > 1) {
      warnings.push("Identical repetitive payout amounts detected (potential manual bypass of voucher caps).");
    }

    // Pattern 3: Multiple payouts in short periods (same calendar date)
    const dates = activePayouts.map((r: any) => r.submissionDate);
    const hasSameDay = dates.some((val: string, idx: number) => dates.indexOf(val) !== idx);
    if (hasSameDay) {
      warnings.push("Multiple payouts filed on the identical date (suspicious rapid successive splitting).");
    }

    // Pattern 4: Total payouts (approved + pending) exceeding the master commission value
    const totalAllocated = activePayouts.reduce((sum: number, r: any) => sum + r.totalBudget, 0);
    if (totalAllocated > c.totalAmount) {
      warnings.push(`Allocation Overflow: Combined payouts (₹${totalAllocated.toLocaleString("en-IN")}) exceed authorized Marketing Expense amount of ₹${c.totalAmount.toLocaleString("en-IN")}.`);
    }

    return {
      ...c,
      status: currentStatus,
      totalPaid,
      totalPending,
      pendingBalance,
      payouts: payouts.map((r: any) => ({
        id: r.id,
        documentNumber: r.documentNumber || `PR-${r.id.substring(0, 5)}`,
        amount: r.totalBudget,
        status: r.status,
        cancellationStatus: r.cancellationStatus || "Active",
        submissionDate: r.submissionDate,
        stage: r.stage || "admin-approval",
        approvedBy: r.approvalDetails?.approvedBy || r.adminApprovedBy || "N/A"
      })),
      warnings
    };
  });

  res.json({ success: true, commissions: hydrated });
});

// API 9.7: POST Create Master Commission (Admin / Super Admin only)
app.post("/api/commissions", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  let { employeeId, employeeName, department, totalAmount, purpose, dateMonth, notes } = req.body;

  // Employees and heads can only create a Master Commission Record for themselves
  if (userObj.role !== "admin" && userObj.role !== "superadmin") {
    employeeId = userObj.id;
    employeeName = userObj.name;
    department = userObj.department || "Sales/Marketing";
  }

  if (!employeeName || !totalAmount || !purpose) {
    return res.status(400).json({ error: "Employee Name, Total Amount, and Purpose are required." });
  }

  const userCode = userObj.enterpriseCode || "2026";

  // Generate a sequential Commission ID: COM-0001, COM-0002...
  if (!db.commissions) {
    db.commissions = [];
  }
  const enterpriseComms = db.commissions.filter((c: any) => (c.enterpriseCode || "2026") === userCode);
  let nextIdNum = 1;
  const existingIds = enterpriseComms.map((c: any) => {
    const match = c.id.match(/COM-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  if (existingIds.length > 0) {
    nextIdNum = Math.max(...existingIds) + 1;
  }
  const comId = `COM-${String(nextIdNum).padStart(4, "0")}`;

  const newCommission = {
    id: comId,
    employeeId: employeeId || "emp-custom",
    employeeName: employeeName.trim(),
    department: department ? department.trim() : "Sales/Marketing",
    totalAmount: Number(totalAmount) || 0,
    purpose: purpose.trim(),
    dateMonth: dateMonth || new Date().toISOString().substring(0, 7), // YYYY-MM
    notes: notes ? notes.trim() : "",
    status: "Pending",
    enterpriseCode: userCode,
    createdAt: new Date().toISOString(),
    createdBy: userObj.name
  };

  db.commissions.unshift(newCommission);

  // Log in Audit Trail
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "COMMISSION_CREATE",
    timestamp: new Date().toISOString(),
    details: `Created new Master Commission entry ${comId} for ${newCommission.employeeName} of ₹${newCommission.totalAmount.toLocaleString("en-IN")} (${newCommission.purpose}).`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  // Synchronously write to local database file as intermediate cache
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database to local persistent file:", err);
  }

  // Await direct, permanent saving in the Firestore Cloud database immediately
  try {
    await setDoc(doc(firestoreDb, getCollectionName("commissions"), newCommission.id), newCommission);
    await setDoc(doc(firestoreDb, getCollectionName("auditLogs"), auditLog.id), auditLog);
    
    // Call writeDatabase to align lastSavedDb states and background cache managers
    writeDatabase(db);
  } catch (err: any) {
    console.error(`Direct Firestore commission write failed for ID ${comId}:`, err);
    // Rolback cache states since database write failed
    db.commissions.shift();
    db.auditLogs.shift();
    try {
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("Failed to restore local persistence after Firestore failure:", fsErr);
    }
    return res.status(500).json({ 
      error: `Database Save Failure: Unable to permanently register Master Commission record in the database. Please try again. details: ${err.message || String(err)}`
    });
  }

  res.json({ success: true, commission: newCommission });
});

// API 9.8: POST Generate automatic linked Cash Voucher payout for a Commission
app.post("/api/commissions/:id/payout", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  // Verify Admin/Super Admin only
  if (userObj.role !== "admin" && userObj.role !== "superadmin") {
    return res.status(403).json({ error: "Access Denied: Only Admins and Super Admins have permission to generate payout vouchers." });
  }

  const { id } = req.params;
  const { payoutAmount, remark } = req.body;

  if (!payoutAmount || Number(payoutAmount) <= 0) {
    return res.status(400).json({ error: "Payout amount must be a valid positive number." });
  }

  if (!db.commissions) db.commissions = [];
  const comm = db.commissions.find((c: any) => c.id === id);
  if (!comm) {
    return res.status(404).json({ error: "Master Commission record not found." });
  }

  const userCode = userObj.enterpriseCode || "2026";
  if ((comm.enterpriseCode || "2026") !== userCode) {
    return res.status(403).json({ error: "Access Denied: Record belongs to another corporation." });
  }

  const randomId = Math.floor(100 + Math.random() * 900);
  const companyYear = new Date().getFullYear();
  const generatedId = `PR-${companyYear}-${randomId}`;

  // Resolve continuous numbering system (retaining exact numbering progression)
  const generated = generateNextDocumentNo(db, userCode, "Cash Voucher");
  const docNumber = generated.docNumber;
  const serialNo = generated.serialNumber;
  const docPrefix = generated.prefix;

  // Single unit item representing the payout
  const linkedItems = [{
    id: `cv-item-comm-${Date.now()}`,
    description: `Payout part against Master Commission ID: ${comm.id} (${comm.purpose})`,
    quantity: 1,
    unitPrice: Number(payoutAmount),
    taxPercent: 0,
    total: Number(payoutAmount)
  }];

  // Helper inside loop for words
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const helperWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + helperWords(n % 100) : "");
    return "";
  };
  const serverNumberToWords = (num: number): string => {
    const intPart = Math.floor(num);
    if (intPart === 0) return "zero";
    let temp = intPart;
    let words = "";
    if (Math.floor(temp / 100000) > 0) {
      words += helperWords(Math.floor(temp / 100000)) + " lakh ";
      temp %= 100000;
    }
    if (Math.floor(temp / 1000) > 0) {
      words += helperWords(Math.floor(temp / 1000)) + " thousand ";
      temp %= 1000;
    }
    if (temp > 0) {
      words += helperWords(temp);
    }
    return words.trim();
  };

  const amountInWords = serverNumberToWords(Number(payoutAmount)) ? (serverNumberToWords(Number(payoutAmount)) + " Rupees Only") : "Zero Rupees";

  const cvDetails = {
    voucherNo: docNumber,
    debitTo: `Marketing Expense (${comm.id})`,
    fileNo: comm.id,
    expenseDetails: `Being partial/final settlement payout against Marketing Expense entitlement ID ${comm.id} (${comm.purpose}). Remark: ${remark || 'Filing settlement marketing expense payout.'}`,
    incurredBy: comm.employeeName,
    amountInWords: amountInWords,
    billDate: new Date().toISOString().split("T")[0],
    billParticulars: `Master Marketing Expense Settlement Payout: ${comm.id}`,
    billRate: String(payoutAmount),
    billAmount: Number(payoutAmount),
    billFileName: "marketing_expense_agreement.pdf",
    billFileContent: "COMMISSION_MOCK_ATTACHMENT"
  };

  // Find a target Administrator inside DB to authorize the generated voucher
  const targetAdmin = db.users.find((u: any) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode);
  const targetSuper = db.users.find((u: any) => u.role === "superadmin" && (u.enterpriseCode || "2026") === userCode);

  const assignedAdminId = targetAdmin ? targetAdmin.id : "admin-id";
  const assignedAdminName = targetAdmin ? targetAdmin.name : "System Admin";

  const linkedForm: RequestForm = {
    id: generatedId,
    userId: comm.employeeId && comm.employeeId !== "emp-custom" ? comm.employeeId : userObj.id,
    employeeName: comm.employeeName,
    projectName: `Marketing Expense Payout: ${comm.purpose} (${comm.id})`,
    submissionDate: new Date().toISOString().split("T")[0],
    items: linkedItems,
    category: "Cash Voucher",
    totalBudget: Number(payoutAmount),
    status: "Pending",
    lastUpdated: new Date().toISOString(),
    totals: {
      netTotal: Number(payoutAmount),
      cgst: 0,
      sgst: 0,
      adjustments: 0,
      grandTotal: Number(payoutAmount)
    },
    attachments: [],
    comments: [],
    approvalDetails: {},
    enterpriseCode: userCode,
    cashVoucherDetails: cvDetails,
    assignedAdminId: assignedAdminId,
    assignedAdminName: assignedAdminName,
    stage: "admin-approval",
    documentNumber: docNumber,
    documentType: "CV",
    serialNumber: serialNo,
    prefix: docPrefix,
    linkedCommissionId: comm.id,
    linkedCommissionNumber: comm.id
  };

  db.requests.unshift(linkedForm);

  // Add audit logs
  const payoutAudit = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "COMMISSION_PAYOUT",
    timestamp: new Date().toISOString(),
    details: `Generated Cash Voucher payout ${docNumber} of ₹${Number(payoutAmount).toLocaleString("en-IN")} linked to Master Marketing Expense ${comm.id} (${comm.employeeName}).`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(payoutAudit);

  // Notify Approving Admin
  const payoutNotif = {
    id: "notif-" + Math.random().toString(36).substring(2, 11),
    userId: assignedAdminId,
    title: "Marketing Expense Payout CV Generated",
    message: `A new marketing expense payout voucher ${docNumber} (₹${Number(payoutAmount).toLocaleString("en-IN")}) is pending approval for ${comm.employeeName}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const,
    enterpriseCode: userCode
  };
  db.notifications.unshift(payoutNotif);

  try {
    const config = getNumberingConfig(db, userCode);
    await persistDirectlyToFirestore(db, {
      requests: linkedForm,
      auditLogs: payoutAudit,
      notifications: payoutNotif,
      numberingSettingsConfigs: config
    });
    res.json({ success: true, request: linkedForm });
  } catch (err: any) {
    console.error("Direct Firestore write for commission payout failed:", err);
    db.requests.shift();
    db.auditLogs.shift();
    db.notifications.shift();
    // rollback counter
    const prefix = getCategoryPrefix("Cash Voucher");
    const numberingConfig = getNumberingConfig(db, userCode);
    if (numberingConfig && numberingConfig.counters && numberingConfig.counters[prefix]) {
      numberingConfig.counters[prefix] = Math.max(0, numberingConfig.counters[prefix] - 1);
    }
    res.status(500).json({ error: "Failed to persist marketing payout in database directly. Details: " + err.message });
  }
});

// API 10: GET stats, metrics & logs summary for isolated workspace
app.get("/api/dashboard/metrics", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  // Grab targeted data subset filtered by enterpriseCode
  const userCode = userObj.enterpriseCode || "2026";
  let subset = db.requests.filter((r: RequestForm) => (r.enterpriseCode || "2026") === userCode);
  if (userObj.role === "employee") {
    if (userObj.canApproveRequests) {
      subset = subset.filter((r: RequestForm) => r.assignedHeadId === userObj.id || r.userId === userObj.id);
    } else {
      subset = subset.filter((r: RequestForm) => r.userId === userObj.id);
    }
  } else if (userObj.role === "head") {
    subset = subset.filter((r: RequestForm) => r.assignedHeadId === userObj.id || r.userId === userObj.id);
  }

  // Deduplicate linked documents to prevent double-counting of   // 1. Core Summary Metrics
  const totalRequestsCount = subset.length;
  const approvedTotal = subset.filter((r: RequestForm) => r.status === "Approved" || r.status === "Partially Approved")
                              .reduce((sum: number, r: RequestForm) => sum + (r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget), 0);
  const pendingTotal = subset.filter((r: RequestForm) => r.status === "Pending")
                              .reduce((sum: number, r: RequestForm) => sum + r.totalBudget, 0);
  const queriedTotal = subset.filter((r: RequestForm) => r.status === "Queried")
                              .reduce((sum: number, r: RequestForm) => sum + r.totalBudget, 0);

  const statusSplit = {
    Approved: subset.filter((r: RequestForm) => r.status === "Approved" || r.status === "Partially Approved").length,
    Pending: subset.filter((r: RequestForm) => r.status === "Pending").length,
    Queried: subset.filter((r: RequestForm) => r.status === "Queried").length,
    Rejected: subset.filter((r: RequestForm) => r.status === "Rejected").length,
    Draft: subset.filter((r: RequestForm) => r.status === "Draft").length
  };

  // 2. Spending Trends over timeframe (represented as monthly chart data)
  // Group spending by Month
  const monthsMap: Record<string, { approved: number; pending: number }> = {};
  
  subset.forEach((r: RequestForm) => {
    if (!r.submissionDate) return;
    const dateObj = new Date(r.submissionDate);
    const monthName = dateObj.toLocaleString("default", { month: "short" });
    
    if (!monthsMap[monthName]) {
      monthsMap[monthName] = { approved: 0, pending: 0 };
    }
    
    if (r.status === "Approved" || r.status === "Partially Approved") {
      const amount = r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget;
      monthsMap[monthName].approved += amount;
    } else if (r.status === "Pending") {
      monthsMap[monthName].pending += r.totalBudget;
    }
  });

  const rawMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = rawMonths
    .filter(month => monthsMap[month] !== undefined)
    .map(month => ({
      name: month,
      Approved: monthsMap[month].approved,
      Pending: monthsMap[month].pending
    }));

  // Ensure something is always returned for rendering safety
  if (trendData.length === 0) {
    trendData.push({ name: "May", Approved: approvedTotal, Pending: pendingTotal });
  }

  // 3. Category distribution spending
  const categoryMap: Record<string, number> = {};
  subset.forEach((r: RequestForm) => {
    if (r.status === "Approved" || r.status === "Partially Approved" || r.status === "Pending") {
      const amount = (r.status === "Approved" || r.status === "Partially Approved") && r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget;
      categoryMap[r.category] = (categoryMap[r.category] || 0) + amount;
    }
  });

  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: categoryMap[cat]
  }));

  // 4. Department spending distribution (mostly for admins, empty array if employee)
  const departmentMap: Record<string, number> = {};
  if (userObj.role === "admin") {
    subset.forEach((r: RequestForm) => {
      // Find employee that made request
      const employeeUser = db.users.find((u: User) => u.id === r.userId);
      const deptName = employeeUser ? employeeUser.department : "Uncategorized";
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const amount = r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget;
        departmentMap[deptName] = (departmentMap[deptName] || 0) + amount;
      }
    });
  }

  const departmentData = Object.keys(departmentMap).map(dept => ({
    name: dept,
    value: departmentMap[dept]
  }));

  res.json({
    metrics: {
      totalRequestsCount,
      approvedValue: approvedTotal,
      pendingValue: pendingTotal,
      queriedValue: queriedTotal,
      statusCounts: statusSplit
    },
    trendChart: trendData,
    categoryChart: categoryData,
    departmentChart: departmentData
  });
});

// API 11: GET fetch notifications list matching enterprise workspace
app.get("/api/notifications", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized, valid session required" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const userNotifications = db.notifications.filter(
    (n: Notification) => n.userId === userObj.id && (n.enterpriseCode || "2026") === userCode
  );

  res.json(userNotifications);
});

// API 12: POST trigger alerts modification read flag
app.post("/api/notifications/:id/read", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access unauthorized" });
  }

  const { id } = req.params;
  const match = db.notifications.find((n: Notification) => n.id === id);
  if (match) {
    if (match.userId !== userObj.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    match.read = true;
    try {
      await persistDirectlyToFirestore(db, { notifications: match });
    } catch (err: any) {
      console.error("Direct Firestore write for notification read failed:", err);
      // Fail gracefully but log it - checking off a read status doesn't absolutely block execution
    }
  }

  res.json({ success: true });
});

// API 13: GET list of employees and department heads under Admin group
app.get("/api/employees", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only Administrators and Super Admin may list platform employees" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  // Filter out users so admins ONLY see employees, heads and admins in their own company group
  const companyEmployees = db.users.filter((u: User) => (u.role === "employee" || u.role === "head" || u.role === "admin") && (u.enterpriseCode || "2026") === userCode);
  res.json(companyEmployees);
});

// API 13B: GET active department heads and authorized approval employees for drop-downs
app.get("/api/department-heads", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const heads = db.users.filter((u: User) => 
    (u.role === "head" || (u.role === "employee" && u.canApproveRequests)) && 
    (u.enterpriseCode || "2026") === userCode && 
    u.status === "active"
  );
  res.json(heads);
});

// API 13C: GET active administrators for drop-downs
app.get("/api/administrators", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const admins = db.users.filter((u: User) => u.role === "admin" && (u.enterpriseCode || "2026") === userCode && u.status === "active");
  res.json(admins);
});

// API 13D: GET active super administrators for drop-downs
app.get("/api/super-administrators", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const superadmins = db.users.filter((u: User) => 
    (u.role === "superadmin" || u.email === "adminapproval@gmail.com") && 
    (u.enterpriseCode || "2026") === userCode && 
    u.status === "active"
  );
  res.json(superadmins);
});

// API 14: Toggle user status (active/inactive)
app.post("/api/employees/:id/status", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only Administrators and Super Admin may manage employee states" });
  }

  const { id } = req.params;
  const { status } = req.body; // active / inactive

  if (!status || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Format state required is either 'active' or 'inactive'" });
  }

  const employee = db.users.find((u: User) => u.id === id);
  if (!employee) {
    return res.status(404).json({ error: "Employee account not found" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const employeeCompanyCode = employee.enterpriseCode || "2026";
  if (userCode !== employeeCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot toggle state of employees belonging to other companies." });
  }

  if (employee.id === userObj.id) {
    return res.status(400).json({ error: "Cannot disable your own Super Admin privilege" });
  }

  employee.status = status;

  // Add audit trace
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "USER_STATUS_TOGGLE",
    timestamp: new Date().toISOString(),
    details: `Modified status of ${employee.name} (${employee.employeeCode}) to ${status}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { users: employee, auditLogs: auditLog });
    res.json({ success: true, employee });
  } catch (err: any) {
    console.error("Direct Firestore write for user toggle status failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to update employee status in database directly. Details: " + err.message });
  }
});

// API 14B: Toggle employee approval authority
app.post("/api/employees/:id/toggle-approval-authority", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only Administrators and Super Admin may manage employee approval authority" });
  }

  const { id } = req.params;
  const { canApproveRequests } = req.body;

  if (canApproveRequests === undefined) {
    return res.status(400).json({ error: "Boolean value canApproveRequests is required" });
  }

  const employee = db.users.find((u: User) => u.id === id);
  if (!employee) {
    return res.status(404).json({ error: "Employee account not found" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const employeeCompanyCode = employee.enterpriseCode || "2026";
  if (userCode !== employeeCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot modify state of employees belonging to other companies." });
  }

  employee.canApproveRequests = Boolean(canApproveRequests);

  // Add audit trace
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "USER_APPROVAL_AUTHORITY_TOGGLE",
    timestamp: new Date().toISOString(),
    details: `Modified approval authority of ${employee.name} (${employee.employeeCode}) to ${employee.canApproveRequests ? "Enabled" : "Disabled"}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { users: employee, auditLogs: auditLog });
    res.json({ success: true, employee });
  } catch (err: any) {
    console.error("Direct Firestore write for approval toggling failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to update employee approval status in database directly. Details: " + err.message });
  }
});

// API 14C: Toggle employee credit card expenses view flag
app.post("/api/employees/:id/toggle-cc-viewer", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only Administrators and Super Admin may manage employee Credit Card view authorization" });
  }

  const { id } = req.params;
  const { canViewCreditCardExpenses } = req.body;

  if (canViewCreditCardExpenses === undefined) {
    return res.status(400).json({ error: "Boolean value canViewCreditCardExpenses is required" });
  }

  const employee = db.users.find((u: User) => u.id === id);
  if (!employee) {
    return res.status(404).json({ error: "Employee account not found" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const employeeCompanyCode = employee.enterpriseCode || "2026";
  if (userCode !== employeeCompanyCode) {
    return res.status(403).json({ error: "Access Denied: You cannot modify state of employees belonging to other companies." });
  }

  employee.canViewCreditCardExpenses = Boolean(canViewCreditCardExpenses);

  // Add audit trace
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "USER_CC_VIEWER_TOGGLE",
    timestamp: new Date().toISOString(),
    details: `Modified Credit Card Expenses view authority of ${employee.name} (${employee.employeeCode}) to ${employee.canViewCreditCardExpenses ? "Enabled" : "Disabled"}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { users: employee, auditLogs: auditLog });
    res.json({ success: true, employee });
  } catch (err: any) {
    console.error("Direct Firestore write for CC viewer toggling failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to update employee CC viewer status in database directly. Details: " + err.message });
  }
});

// --- CREDIT CARD MASTER MANAGEMENT APIs ---

// GET /api/credit-cards
app.get("/api/credit-cards", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const cards = db.creditCards ? db.creditCards.filter((c: any) => (c.enterpriseCode || "2026") === userCode) : [];
  res.json({ success: true, creditCards: cards });
});

// POST /api/credit-cards
app.post("/api/credit-cards", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Unauthorized session access" });
  }

  const { cardName, cardholderName, department, status } = req.body;

  if (!cardName || !cardName.trim()) {
    return res.status(400).json({ error: "Card Name is required." });
  }

  if (!cardholderName || !cardholderName.trim()) {
    return res.status(400).json({ error: "Cardholder Name is required." });
  }

  if (!db.creditCards) {
    db.creditCards = [];
  }

  const userCode = userObj.enterpriseCode || "2026";

  const newCard = {
    id: "CC-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    cardName: cardName.trim(),
    cardholderName: cardholderName.trim(),
    last4Digits: "",
    department: department ? department.trim() : "",
    status: status || "Active",
    enterpriseCode: userCode,
    createdAt: new Date().toISOString()
  };

  db.creditCards.unshift(newCard);

  // Audit Log
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "CREDIT_CARD_CREATE",
    timestamp: new Date().toISOString(),
    details: `Registered corporate credit card: ${newCard.cardName} (${newCard.cardholderName})`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { creditCards: newCard, auditLogs: auditLog });
    res.json({ success: true, creditCard: newCard });
  } catch (err: any) {
    console.error("Direct Firestore write for credit card failed:", err);
    db.creditCards.shift();
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to save corporate credit card. Details: " + err.message });
  }
});

// PUT /api/credit-cards/:id
app.put("/api/credit-cards/:id", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only administrators can manage corporate credit cards" });
  }

  const { id } = req.params;
  const { cardName, cardholderName, department, status } = req.body;

  if (!db.creditCards) {
    db.creditCards = [];
  }

  const cardIndex = db.creditCards.findIndex((c: any) => c.id === id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Credit card not found" });
  }

  const existingCard = db.creditCards[cardIndex];
  const userCode = userObj.enterpriseCode || "2026";

  if ((existingCard.enterpriseCode || "2026") !== userCode) {
    return res.status(403).json({ error: "Access Denied: This credit card is in another enterprise domain." });
  }

  if (cardholderName !== undefined && !cardholderName.trim()) {
    return res.status(400).json({ error: "Cardholder Name cannot be empty." });
  }

  if (cardName !== undefined) existingCard.cardName = cardName.trim();
  if (cardholderName !== undefined) existingCard.cardholderName = cardholderName.trim();
  if (department !== undefined) existingCard.department = department.trim();
  if (status !== undefined) existingCard.status = status;

  // Audit Log
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "CREDIT_CARD_UPDATE",
    timestamp: new Date().toISOString(),
    details: `Updated corporate credit card details: ${existingCard.cardName} (${existingCard.cardholderName})`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { creditCards: existingCard, auditLogs: auditLog });
    res.json({ success: true, creditCard: existingCard });
  } catch (err: any) {
    console.error("Direct Firestore write for credit card update failed:", err);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to update corporate credit card. Details: " + err.message });
  }
});

// DELETE /api/credit-cards/:id
app.delete("/api/credit-cards/:id", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || (userObj.role !== "admin" && userObj.role !== "superadmin")) {
    return res.status(401).json({ error: "Only administrators can manage corporate credit cards" });
  }

  const { id } = req.params;
  if (!db.creditCards) db.creditCards = [];

  const cardIndex = db.creditCards.findIndex((c: any) => c.id === id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Credit card not found" });
  }

  const existingCard = db.creditCards[cardIndex];
  const userCode = userObj.enterpriseCode || "2026";

  if ((existingCard.enterpriseCode || "2026") !== userCode) {
    return res.status(403).json({ error: "Access Denied" });
  }

  db.creditCards.splice(cardIndex, 1);

  // Audit Log
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "CREDIT_CARD_DELETE",
    timestamp: new Date().toISOString(),
    details: `Removed corporate credit card: ${existingCard.cardName} (${existingCard.cardholderName})`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { auditLogs: auditLog }, { creditCards: existingCard.id });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Direct Firestore write for credit card delete failed:", err);
    db.creditCards.splice(cardIndex, 0, existingCard);
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to delete corporate credit card. Details: " + err.message });
  }
});

// API 15: GET logs list
app.get("/api/audit-logs", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj || userObj.role !== "admin") {
    return res.status(401).json({ error: "Access to system audit logs is restricted to Administrators" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  const companyLogs = db.auditLogs.filter((log: AuditLog) => (log.enterpriseCode || "2026") === userCode);
  res.json(companyLogs);
});

// GET /api/saved-pdfs
app.get("/api/saved-pdfs", (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access Restricted" });
  }
  const userCode = userObj.enterpriseCode || "2026";
  if (!db.savedPdfs) db.savedPdfs = [];
  const companyPdfs = db.savedPdfs.filter((p: any) => (p.enterpriseCode || "2026") === userCode);
  res.json(companyPdfs);
});

// POST /api/saved-pdfs
app.post("/api/saved-pdfs", async (req, res) => {
  const db = readDatabase();
  const userObj = getUserFromHeaders(req);
  if (!userObj) {
    return res.status(401).json({ error: "Access Restricted" });
  }
  
  const { requestId, fileName, fileContent, category } = req.body;
  if (!requestId || !fileName || !fileContent) {
    return res.status(400).json({ error: "Missing required properties: requestId, fileName, fileContent" });
  }

  const userCode = userObj.enterpriseCode || "2026";
  if (!db.savedPdfs) db.savedPdfs = [];

  const pdfId = "pdf-" + Math.random().toString(36).substring(2, 11);
  const newPdf = {
    id: pdfId,
    requestId,
    fileName,
    fileContent,
    category: category || "Generated PDF",
    enterpriseCode: userCode,
    createdAt: new Date().toISOString(),
    createdBy: userObj.name
  };

  db.savedPdfs.push(newPdf);

  // Auto-log to compliance audits
  const auditLog = {
    id: "log-" + Math.random().toString(36).substring(2, 11),
    userId: userObj.id,
    userName: userObj.name,
    action: "PDF_ARCHIVE_AUTO_SAVE",
    timestamp: new Date().toISOString(),
    details: `Auto-archived generated ${category || "document"} PDF: ${fileName}`,
    enterpriseCode: userCode
  };
  db.auditLogs.unshift(auditLog);

  try {
    await persistDirectlyToFirestore(db, { savedPdfs: newPdf, auditLogs: auditLog });
    res.json({ success: true, savedPdf: newPdf });
  } catch (err: any) {
    console.error("Direct Firestore write for savedPdf failed:", err);
    db.savedPdfs.pop();
    db.auditLogs.shift();
    res.status(500).json({ error: "Failed to save PDF archive to database directly. Details: " + err.message });
  }
});

// GET /api/health-database (Diagnostic endpoint for checking Firestore and synchronization state)
app.get("/api/health-database", (req, res) => {
  const db = readDatabase();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    isDbLoadedFromFirestore,
    isBootstrapping,
    counts: {
      users: db.users ? db.users.length : 0,
      requests: db.requests ? db.requests.length : 0,
      auditLogs: db.auditLogs ? db.auditLogs.length : 0,
      notifications: db.notifications ? db.notifications.length : 0,
      commissions: db.commissions ? db.commissions.length : 0,
      numberingSettingsConfigs: db.numberingSettingsConfigs ? db.numberingSettingsConfigs.length : 0,
      savedPdfs: db.savedPdfs ? db.savedPdfs.length : 0
    },
    syncErrors: syncErrors
  });
});

// Handle Vite Asset Serving & Routing
async function startServer() {
  await bootstrapDatabase();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  }
}

startServer();

export { app };
export default app;
