import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA31VG6D94SA8hgOZw8sJR5uU0vCsY2ADs",
  authDomain: "omnidev-a4d45.firebaseapp.com",
  projectId: "omnidev-a4d45",
  storageBucket: "omnidev-a4d45.firebasestorage.app",
  messagingSenderId: "783981327183",
  appId: "1:783981327183:web:11b6a91b2afef8bf91cb3a",
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);