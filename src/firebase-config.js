import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBucpiqIqHoFsxepIxSI91q7c3BqNlAOkU",
  authDomain: "ko-htay-aung-oasis-invoice.firebaseapp.com",
  projectId: "ko-htay-aung-oasis-invoice",
  storageBucket: "ko-htay-aung-oasis-invoice.firebasestorage.app",
  messagingSenderId: "462594757491",
  appId: "1:462594757491:web:cb0af57923ec739de6ab06"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


